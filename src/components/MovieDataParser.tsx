import React, { useState, useEffect, useRef } from 'react'
import { parseMovieData, matchWithDatabase, convertToMovie, checkDuplicateMovieCode, generateDmcode, analyzeDmcodePatterns, mergeMovieData, detectDataSource, ParsedMovieData, MatchedData } from '../utils/movieDataParser'
import { MasterDataItem } from '../utils/masterDataApi'
import { Movie } from '../utils/movieApi'
import { masterDataApi } from '../utils/masterDataApi'
import { MasterDataForm } from './MasterDataForm'
import { MultipleMatchSelector } from './MultipleMatchSelector'
import { EnglishNameSelector } from './EnglishNameSelector'
import { JapaneseNameMatcher } from './JapaneseNameMatcher'
import { MovieTitleMatcher } from './MovieTitleMatcher'
import { DuplicateMovieWarning } from './DuplicateMovieWarning'
import { useTemplateAutoApply } from './useTemplateAutoApply'
import { mergeMovieData as mergeMovieApi } from '../utils/movieMergeApi'
import { translateJapaneseToEnglishWithContext, translateMovieTitleWithContext } from '../utils/deepseekTranslationApi'
import { AITranslationLoading, AITranslationSpinner } from './AITranslationLoading'
import { ShimmerInput } from './ShimmerInput'
import { Brain, Clipboard } from 'lucide-react'
import { toast } from 'sonner'
import { useCachedData } from '../hooks/useCachedData'

interface MovieDataParserProps {
  accessToken: string
  onSave: (movie: Movie) => void
  onCancel: () => void
  existingMovie?: Movie
}

// Helper function to check if data is R18.dev JSON format
function isR18JsonFormat(rawData: string): boolean {
  try {
    const parsed = JSON.parse(rawData.trim())
    return (
      parsed &&
      typeof parsed === 'object' &&
      'dvd_id' in parsed &&
      'title_ja' in parsed &&
      'actresses' in parsed &&
      'release_date' in parsed &&
      'runtime_mins' in parsed
    )
  } catch {
    return false
  }
}

export function MovieDataParser({ accessToken, onSave, onCancel, existingMovie }: MovieDataParserProps) {
  const { invalidateCache } = useCachedData()
  const [rawData, setRawData] = useState('')
  const [detectedSource, setDetectedSource] = useState<'javdb' | 'r18' | 'unknown'>('unknown')
  const [parsedData, setParsedData] = useState<ParsedMovieData | null>(null)
  const [matchedData, setMatchedData] = useState<MatchedData | null>(null)
  const [masterData, setMasterData] = useState<MasterDataItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showMasterDataForm, setShowMasterDataForm] = useState<{
    type: 'actor' | 'actress' | 'director' | 'studio' | 'series' | 'label'
    index: number
    name: string
    r18Data?: {
      name_romaji?: string
      name_kanji?: string
      name_kana?: string
      name_en?: string
      name_ja?: string
      label_name_en?: string
      label_name_ja?: string
    }
  } | null>(null)
  const [showMultipleMatchSelector, setShowMultipleMatchSelector] = useState<{
    type: 'actor' | 'actress' | 'director' | 'studio' | 'series'
    index: number
    searchName: string
    matches: MasterDataItem[]
  } | null>(null)
  const [showEnglishNameSelector, setShowEnglishNameSelector] = useState<{
    type: 'actor' | 'actress' | 'director' | 'studio' | 'series'
    index: number
    searchName: string
    matches: MasterDataItem[]
  } | null>(null)
  const [showJapaneseNameMatcher, setShowJapaneseNameMatcher] = useState<{
    type: 'actor' | 'actress' | 'director' | 'studio' | 'series' | 'label'
    index: number
    searchName: string
    matches: MasterDataItem[]
    parsedEnglishName?: string
    availableEnglishNames?: string[]
  } | null>(null)
  const [showMovieTitleMatcher, setShowMovieTitleMatcher] = useState<{
    searchName: string
    matches: MasterDataItem[]
    parsedEnglishTitle?: string
    movieCode?: string
  } | null>(null)
  const [showDuplicateWarning, setShowDuplicateWarning] = useState<{
    existingMovie: Movie
    newMovieCode: string
  } | null>(null)
  const [mergeMode, setMergeMode] = useState<{
    existingMovie: Movie
    isActive: boolean
  } | null>(null)
  const [ignoredItems, setIgnoredItems] = useState<Set<string>>(new Set())
  const [dmcode, setDmcode] = useState('')
  const [dmcodeFromR18, setDmcodeFromR18] = useState(false)
  const [dmcodePatterns, setDmcodePatterns] = useState<Map<string, string>>(new Map())
  const [titleEn, setTitleEn] = useState('')
  const [movieType, setMovieType] = useState<string>('')
  const [availableTypes, setAvailableTypes] = useState<MasterDataItem[]>([])
  const [translatingTitle, setTranslatingTitle] = useState(false)
  const [titleOptions, setTitleOptions] = useState<string[]>([])
  const [needsTitleSelection, setNeedsTitleSelection] = useState(false)
  const [cover, setCover] = useState('')
  const [gallery, setGallery] = useState('')
  const [cropCover, setCropCover] = useState(false)
  const [appliedTemplate, setAppliedTemplate] = useState<{
    templateName: string
    appliedFields: string[]
  } | null>(null)
  const [isApplyingTemplate, setIsApplyingTemplate] = useState(false)
  const [lastAppliedTemplate, setLastAppliedTemplate] = useState<string | null>(null)
  const templateNotificationTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [pasteStatus, setPasteStatus] = useState<'idle' | 'pasting' | 'success' | 'error'>('idle')
  const [parsedEnglishNames, setParsedEnglishNames] = useState<{
    actresses?: string[]
    actors?: string[]
    directors?: string[]
    studios?: string[]
    series?: string[]
    labels?: string[]
  }>({})

  // Template auto-apply hook
  const { applyDefaultTemplate, isLoading: templateLoading } = useTemplateAutoApply({
    accessToken,
    onTemplateApplied: (template, appliedFields) => {
      // Clear any existing timeout
      if (templateNotificationTimeoutRef.current) {
        clearTimeout(templateNotificationTimeoutRef.current)
      }
      
      setAppliedTemplate({
        templateName: template.name,
        appliedFields
      })
      
      // Auto hide notification after 5 seconds
      templateNotificationTimeoutRef.current = setTimeout(() => setAppliedTemplate(null), 5000)
    }
  })

  // Load master data on component mount
  useEffect(() => {
    loadMasterData()
  }, [])

  // Detect data source when rawData changes
  useEffect(() => {
    if (rawData.trim()) {
      const source = detectDataSource(rawData)
      setDetectedSource(source)
    } else {
      setDetectedSource('unknown')
    }
  }, [rawData])

  // Pre-fill form with existing movie data when provided
  useEffect(() => {
    if (existingMovie) {
      console.log('Pre-filling parser with existing movie data:', existingMovie)
      console.log('Movie titleEn:', existingMovie.titleEn)
      console.log('Movie titleJp:', existingMovie.titleJp)
      console.log('Movie dmcode:', existingMovie.dmcode)
      console.log('Movie type:', existingMovie.type)
      console.log('Movie studio:', existingMovie.studio)
      console.log('Movie director:', existingMovie.director)
      
      // Pre-fill basic fields
      // Note: Only set DM code from existing movie if it's not from R18
      if (existingMovie.dmcode && !dmcodeFromR18) {
        setDmcode(existingMovie.dmcode)
      }
      if (existingMovie.titleEn) {
        setTitleEn(existingMovie.titleEn)
      }
      if (existingMovie.type) {
        setMovieType(existingMovie.type)
      }
      if (existingMovie.cover) {
        setCover(existingMovie.cover)
      }
      if (existingMovie.gallery) {
        setGallery(existingMovie.gallery)
      }
      if (existingMovie.cropCover !== undefined) {
        setCropCover(existingMovie.cropCover)
      }
      
      // Pre-fill raw data with movie information for parsing
      // Only include fields that are relevant and have meaningful data
      const relevantFields: string[] = []
      
      if (existingMovie.titleEn || existingMovie.titleJp) {
        relevantFields.push(`Title: ${existingMovie.titleEn || existingMovie.titleJp}`)
      }
      if (existingMovie.titleJp && existingMovie.titleJp !== existingMovie.titleEn) {
        relevantFields.push(`Japanese Title: ${existingMovie.titleJp}`)
      }
      if (existingMovie.dmcode) {
        relevantFields.push(`Code: ${existingMovie.dmcode}`)
      }
      if (existingMovie.releaseDate) {
        relevantFields.push(`Release Date: ${existingMovie.releaseDate}`)
      }
      if (existingMovie.duration) {
        relevantFields.push(`Duration: ${existingMovie.duration}`)
      }
      if (existingMovie.director) {
        relevantFields.push(`Director: ${existingMovie.director}`)
      }
      if (existingMovie.studio) {
        relevantFields.push(`Studio: ${existingMovie.studio}`)
      }
      if (existingMovie.series) {
        relevantFields.push(`Series: ${existingMovie.series}`)
      }
      if (existingMovie.type && existingMovie.type !== 'click') {
        relevantFields.push(`Type: ${existingMovie.type}`)
      }
      if (existingMovie.actress) {
        relevantFields.push(`Actress: ${existingMovie.actress}`)
      }
      if (existingMovie.actors) {
        relevantFields.push(`Actors: ${existingMovie.actors}`)
      }
      if (existingMovie.tags) {
        relevantFields.push(`Tags: ${existingMovie.tags}`)
      }
      if (existingMovie.cover) {
        relevantFields.push(`Cover: ${existingMovie.cover}`)
      }
      if (existingMovie.gallery) {
        relevantFields.push(`Gallery: ${existingMovie.gallery}`)
      }
      
      const rawDataString = relevantFields.join('\n')
      
      console.log('Generated raw data string:', rawDataString)
      console.log('Raw data string length:', rawDataString.length)
      
      setRawData(rawDataString)
    }
  }, [existingMovie])

  // Cleanup timeouts on component unmount
  useEffect(() => {
    return () => {
      if (templateNotificationTimeoutRef.current) {
        clearTimeout(templateNotificationTimeoutRef.current)
      }
    }
  }, [])

  // Auto-apply template when movie type changes and we have parsed data
  useEffect(() => {
    if (movieType && parsedData && dmcode && !templateLoading && !isApplyingTemplate) {
      // Set crop cover based on type
      setCropCover(shouldEnableAutoCrop(movieType))
      
      // Use a longer delay to prevent rapid successive calls and allow state to stabilize
      const timeoutId = setTimeout(() => {
        applyTemplateForType(movieType)
      }, 500) // Increased delay to prevent rapid calls
      
      return () => clearTimeout(timeoutId)
    }
  }, [movieType, dmcode, templateLoading, isApplyingTemplate]) // Removed parsedData from dependencies to prevent infinite loop

  const loadMasterData = async () => {
    try {
      setLoading(true)
      
      // Load all master data types
      const [actors, actresses, directors, studios, series, labels, tags, groups, types] = await Promise.all([
        masterDataApi.getByType('actor', accessToken).catch(() => []),
        masterDataApi.getByType('actress', accessToken).catch(() => []),
        masterDataApi.getByType('director', accessToken).catch(() => []),
        masterDataApi.getByType('studio', accessToken).catch(() => []),
        masterDataApi.getByType('series', accessToken).catch(() => []),
        masterDataApi.getByType('label', accessToken).catch(() => []),
        masterDataApi.getByType('tag', accessToken).catch(() => []),
        masterDataApi.getByType('group', accessToken).catch(() => []),
        masterDataApi.getByType('type', accessToken).catch(() => [])
      ])
      
      // Combine all master data
      const allMasterData = [...actors, ...actresses, ...directors, ...studios, ...series, ...labels, ...tags, ...groups]
      
      // Set available types and default movie type
      setAvailableTypes(types)
      if (types.length > 0 && !movieType) {
        // Set default to first type, or 'HC' if available
        const hcType = types.find(t => t.name?.toLowerCase() === 'hc')
        const defaultType = hcType?.name || types[0].name || 'HC'
        setMovieType(defaultType)
      }
      
      // Debug logging for studios and types
      console.log('=== LOADED MASTER DATA ===')
      console.log('Studios loaded:', studios.length)
      console.log('Studio names:', studios.map(s => s.name).filter(Boolean))
      console.log('Studio jpnames:', studios.map(s => s.jpname).filter(Boolean))
      console.log('Studio aliases:', studios.map(s => s.alias).filter(Boolean))
      console.log('Types loaded:', types.length)
      console.log('Type names:', types.map(t => t.name).filter(Boolean))
      
      setMasterData(allMasterData)
      
      // Load dmcode patterns
      const patterns = await analyzeDmcodePatterns()
      setDmcodePatterns(patterns)
      console.log('Dmcode patterns loaded:', patterns.size)
    } catch (err) {
      console.error('Error loading master data:', err)
      setError('Failed to load master data')
    } finally {
      setLoading(false)
    }
  }

  const handlePasteFromClipboard = async () => {
    setPasteStatus('pasting')
    
    try {
      if (!navigator.clipboard || !navigator.clipboard.readText) {
        throw new Error('Clipboard API tidak tersedia')
      }
      
      const clipboardData = await navigator.clipboard.readText()
      
      if (clipboardData && clipboardData.trim()) {
        setRawData(clipboardData)
        setPasteStatus('success')
        toast.success('Data berhasil ditempel dari clipboard!')
        
        // Reset status setelah 2 detik
        setTimeout(() => {
          setPasteStatus('idle')
        }, 2000)
      } else {
        throw new Error('Clipboard kosong')
      }
    } catch (error) {
      console.error('Error reading clipboard:', error)
      setPasteStatus('error')
      toast.error('Gagal membaca dari clipboard. Pastikan browser mendukung Clipboard API.')
      
      // Reset status setelah 2 detik
      setTimeout(() => {
        setPasteStatus('idle')
      }, 2000)
    }
  }

  const handleParse = async () => {
    if (!rawData.trim()) {
      setError('Please paste movie data first')
      return
    }

    setLoading(true)
    setError('')

    try {
      const parsed = parseMovieData(rawData)
      
      if (!parsed) {
        setError('Failed to parse movie data. Please check the format.')
        return
      }

      setParsedData(parsed)
      
      // Set titleEn from parsed data initially
      setTitleEn(parsed.titleEn || '')
      
      // Set dmcode from parsed data (R18 uses content_id, others use generated)
      if (parsed.dmcode) {
        // Use DM code from R18 data (content_id)
        setDmcode(parsed.dmcode)
        setDmcodeFromR18(true)
        console.log('Using R18 dmcode:', parsed.dmcode, 'from content_id')
      } else {
        // Generate dmcode automatically for non-R18 data
        const generatedDmcode = generateDmcode(parsed.code, parsed.studio)
        setDmcode(generatedDmcode)
        setDmcodeFromR18(false)
        console.log('Generated dmcode:', generatedDmcode, 'for code:', parsed.code, 'studio:', parsed.studio)
      }
      
      // Check for duplicate movie code
      console.log('=== CHECKING DUPLICATE ON PARSE ===')
      console.log('Code to check:', parsed.code)
      
      const duplicateCheck = await checkDuplicateMovieCode(parsed.code)
      console.log('Duplicate check result:', duplicateCheck)
      
      if (duplicateCheck.isDuplicate && duplicateCheck.existingMovie) {
        console.log('DUPLICATE FOUND! Showing warning...')
        // Show duplicate warning
        setShowDuplicateWarning({
          existingMovie: duplicateCheck.existingMovie,
          newMovieCode: parsed.code
        })
        
        // Auto-activate merge mode for testing title comparison
        console.log('🔧 AUTO-ACTIVATING MERGE MODE FOR TESTING')
        setMergeMode({
          existingMovie: duplicateCheck.existingMovie,
          isActive: true
        })
      }
      
      // Extract English names from parsed data (if available)
      const extractedEnglishNames = {
        actresses: parsed.actresses.map((name, index) => {
          // Use R18.dev English name if available, fallback to romaji
          return parsed.actressInfo?.[index]?.name_en || parsed.actressInfo?.[index]?.name_romaji || undefined
        }),
        actors: parsed.actors.map((name, index) => {
          // Use R18.dev English name if available, fallback to romaji
          return parsed.actorInfo?.[index]?.name_en || parsed.actorInfo?.[index]?.name_romaji || undefined
        }),
        directors: parsed.director ? [parsed.directorInfo?.name_en || parsed.directorInfo?.name_romaji || undefined] : [],
        studios: parsed.studio ? [parsed.studioInfo?.name_en || undefined] : [],
        series: parsed.series ? [parsed.seriesInfo?.name_en || undefined] : [],
        labels: parsed.label ? [parsed.labelInfo?.name_en || undefined] : []
      }
      
      setParsedEnglishNames(extractedEnglishNames)
      
      // Match with database
      matchWithDatabase(parsed, masterData, extractedEnglishNames, detectedSource).then(async (matched) => {
        setMatchedData(matched)
        
        // Template auto-apply is now handled by useEffect only to prevent duplicate calls
        // No need to call applyTemplateForType here as it will be triggered by useEffect
      })
    } catch (error) {
      console.error('Error parsing data:', error)
      setError('Error parsing data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Separate useEffect for title comparison when mergeMode changes
  useEffect(() => {
    if (!parsedData || !mergeMode?.isActive) {
      setNeedsTitleSelection(false)
      setTitleOptions([])
      return
    }

    // Check for title differences
    console.log('=== TITLE DETECTION DEBUG ===')
    console.log('mergeMode?.isActive:', mergeMode?.isActive)
    console.log('mergeMode.existingMovie.titleEn:', mergeMode?.existingMovie?.titleEn)
    console.log('parsed.titleEn:', parsedData.titleEn)
    
    if (mergeMode.existingMovie.titleEn && parsedData.titleEn) {
      console.log('✅ All conditions met for title comparison')
      const dbTitle = mergeMode.existingMovie.titleEn.toLowerCase().trim()
      const r18Title = parsedData.titleEn.toLowerCase().trim()
      
      const normalizedDbTitle = dbTitle.replace(/[\s\-_.,!?]/g, '')
      const normalizedR18Title = r18Title.replace(/[\s\-_.,!?]/g, '')
      
      console.log('=== MOVIE TITLE COMPARISON ===')
      console.log('Database Title:', dbTitle)
      console.log('R18 Title:', r18Title)
      console.log('Normalized DB Title:', normalizedDbTitle)
      console.log('Normalized R18 Title:', normalizedR18Title)
      console.log('Titles are different:', normalizedDbTitle !== normalizedR18Title)
      
      if (normalizedDbTitle !== normalizedR18Title) {
        setNeedsTitleSelection(true)
        setTitleOptions([mergeMode.existingMovie.titleEn, parsedData.titleEn])
        console.log('✅ Movie titles differ - NEEDS SELECTION')
        console.log('Title Options set:', [mergeMode.existingMovie.titleEn, parsedData.titleEn])
      } else {
        setNeedsTitleSelection(false)
        setTitleOptions([])
        console.log('✅ Movie titles match - NO SELECTION NEEDED')
      }
    } else {
      setNeedsTitleSelection(false)
      setTitleOptions([])
      console.log('❌ Title comparison skipped - missing data')
      console.log('mergeMode?.isActive:', !!mergeMode?.isActive)
      console.log('mergeMode.existingMovie.titleEn:', !!mergeMode?.existingMovie?.titleEn)
      console.log('parsed.titleEn:', !!parsedData?.titleEn)
    }
    
    // Set titleEn from existing movie if available
    if (mergeMode.existingMovie.titleEn) {
      setTitleEn(mergeMode.existingMovie.titleEn)
    }
  }, [mergeMode, parsedData])

  const handleSave = async () => {
    if (!parsedData || !matchedData) return

    // Check if we're in merge mode
    if (mergeMode?.isActive) {
      try {
        setLoading(true)
        
        // Update master data with conflicts first
        await updateMasterDataWithConflicts()
        
        // Create updated parsed data with dmcode, titleEn, and movieType
        const updatedParsedData = {
          ...parsedData,
          dmcode: dmcode,
          titleEn: titleEn
        }

        const newMovieData = convertToMovie(updatedParsedData, matchedData, ignoredItems, detectedSource)
        // Override movie type with user selection and add cover/gallery
        newMovieData.type = movieType
        newMovieData.cover = cover
        newMovieData.gallery = gallery
        newMovieData.cropCover = cropCover

        // Merge with existing movie data
        const mergedMovie = { ...mergeMode.existingMovie }
        
        // Update fields with new data (only if new data exists and is not empty)
        if (newMovieData.titleEn && newMovieData.titleEn.trim()) {
          mergedMovie.titleEn = newMovieData.titleEn
        }
        if (newMovieData.releaseDate && newMovieData.releaseDate.trim()) {
          mergedMovie.releaseDate = newMovieData.releaseDate
        }
        if (newMovieData.duration && newMovieData.duration.trim()) {
          mergedMovie.duration = newMovieData.duration
        }
        
        // Update director using converted movie data (which already handles customEnglishName correctly)
        if (newMovieData.director && newMovieData.director.trim()) {
          mergedMovie.director = newMovieData.director
        }
        
        // Update studio using converted movie data (which already handles customEnglishName correctly)
        if (newMovieData.studio && newMovieData.studio.trim()) {
          mergedMovie.studio = newMovieData.studio
        }
        
        // Update series using converted movie data (which already handles customEnglishName correctly)
        if (newMovieData.series && newMovieData.series.trim()) {
          mergedMovie.series = newMovieData.series
        }
        
        // Update label using converted movie data (which already handles customEnglishName correctly)
        if (newMovieData.label && newMovieData.label.trim()) {
          mergedMovie.label = newMovieData.label
        }
        
        // Merge actresses and actors using matched data (only add new ones, don't duplicate)
        if (matchedData.actresses && matchedData.actresses.length > 0) {
          const existingActresses = mergedMovie.actress ? mergedMovie.actress.split(',').map(a => a.trim()).filter(a => a) : []
          
          // Get matched actress names (prefer customEnglishName, then English name, fallback to Japanese)
          const matchedActressNames = matchedData.actresses
            .map((item, index) => ({ item, index }))
            .filter(({ item, index }) => item.matched && !ignoredItems.has(`actresses-${index}`))
            .map(({ item }) => item.customEnglishName || item.matched!.name || item.matched!.jpname || item.name)
            .filter(name => name && name.trim())
          
          // Only add actresses that don't already exist
          const uniqueNewActresses = matchedActressNames.filter(actress => 
            !existingActresses.some(existing => 
              existing.toLowerCase() === actress.toLowerCase() ||
              existing.includes(actress) ||
              actress.includes(existing)
            )
          )
          
          if (uniqueNewActresses.length > 0) {
            mergedMovie.actress = [...existingActresses, ...uniqueNewActresses].join(', ')
          }
        }
        
        if (matchedData.actors && matchedData.actors.length > 0) {
          const existingActors = mergedMovie.actors ? mergedMovie.actors.split(',').map(a => a.trim()).filter(a => a) : []
          
          // Get matched actor names (prefer customEnglishName, then English name, fallback to Japanese)
          const matchedActorNames = matchedData.actors
            .map((item, index) => ({ item, index }))
            .filter(({ item, index }) => item.matched && !ignoredItems.has(`actors-${index}`))
            .map(({ item }) => item.customEnglishName || item.matched!.name || item.matched!.jpname || item.name)
            .filter(name => name && name.trim())
          
          // Only add actors that don't already exist
          const uniqueNewActors = matchedActorNames.filter(actor => 
            !existingActors.some(existing => 
              existing.toLowerCase() === actor.toLowerCase() ||
              existing.includes(actor) ||
              actor.includes(existing)
            )
          )
          
          if (uniqueNewActors.length > 0) {
            mergedMovie.actors = [...existingActors, ...uniqueNewActors].join(', ')
          }
        }

        // Update additional fields only if they have values
        if (dmcode && dmcode.trim()) {
          mergedMovie.dmcode = dmcode
        }
        if (movieType && movieType.trim()) {
          mergedMovie.type = movieType
        }
        if (cover && cover.trim()) {
          mergedMovie.cover = cover
        }
        if (gallery && gallery.trim()) {
          mergedMovie.gallery = gallery
        }
        // cropCover is a boolean, so we can always update it
        mergedMovie.cropCover = cropCover

        // Update timestamp
        mergedMovie.updatedAt = new Date().toISOString()

        // Call the merge API with matched data
        const response = await mergeMovieApi(
          mergeMode.existingMovie.id!,
          accessToken,
          {
            parsedData: updatedParsedData,
            matchedData: matchedData,
            ignoredItems: Array.from(ignoredItems),
            selectedFields: Object.keys(mergedMovie).filter(key => {
              const value = mergedMovie[key as keyof typeof mergedMovie]
              // Only include fields that have meaningful values
              if (key === 'id' || key === 'createdAt' || key === 'updatedAt') return false
              if (typeof value === 'string') return value && value.trim().length > 0
              if (typeof value === 'boolean') return true // Always include boolean values
              if (Array.isArray(value)) return value.length > 0
              return value != null && value !== ''
            })
          }
        )

        if (response.success) {
          console.log('=== MERGE MODE SUCCESS ===')
          console.log('Merge response:', response)
          console.log('Merged movie:', response.movie)
          
          // Reset form and close merge mode
          setRawData('')
          setParsedData(null)
          setMatchedData(null)
          setError('')
          setIgnoredItems(new Set())
          setDmcode('')
          setDmcodeFromR18(false)
          setTitleEn('')
          setMovieType('')
          setCover('')
          setGallery('')
          setCropCover(false)
          setAppliedTemplate(null)
          setMergeMode(null)
          
          // Show success message
          toast.success(`Data berhasil dilengkapi! ${response.message}`)
          
          // Navigate to movie detail page after successful merge
          if (response.movie && onSave) {
            console.log('Calling onSave with merged movie for navigation')
            onSave(response.movie)
          }
        } else {
          throw new Error('Failed to merge data')
        }
      } catch (error) {
        console.error('Error merging data:', error)
        setError('Gagal melengkapi data. Silakan coba lagi.')
      } finally {
        setLoading(false)
      }
    } else {
      // Normal save flow
      console.log('=== NORMAL SAVE FLOW ===')
      console.log('Parsed data:', parsedData)
      console.log('Matched data:', matchedData)
      console.log('Ignored items:', ignoredItems)
      
      try {
        setLoading(true)
        
        // Update master data with conflicts first
        await updateMasterDataWithConflicts()
        
        const updatedParsedData = {
          ...parsedData,
          dmcode: dmcode,
          titleEn: titleEn
        }

        const movie = convertToMovie(updatedParsedData, matchedData, ignoredItems, detectedSource)
        // Override movie type with user selection and add cover/gallery
        movie.type = movieType
        movie.cover = cover
        movie.gallery = gallery
        movie.cropCover = cropCover
        
        console.log('Final movie data:', movie)
        console.log('Calling onSave with movie:', movie)
        
        // Call onSave to save the movie
        onSave(movie)
        
        console.log('onSave called successfully')
        
        // Reset form after successful save
        setRawData('')
        setParsedData(null)
        setMatchedData(null)
        setError('')
        setIgnoredItems(new Set())
        setDmcode('')
        setDmcodeFromR18(false)
        setTitleEn('')
        setMovieType('')
        setCover('')
        setGallery('')
        setCropCover(false)
        setAppliedTemplate(null)
        setMergeMode(null)
        
        console.log('Form reset completed')
      } catch (error) {
        console.error('Error saving movie:', error)
        setError('Gagal menyimpan movie. Silakan coba lagi.')
      } finally {
        setLoading(false)
      }
    }
  }

  const handleContinueWithDuplicate = () => {
    if (!parsedData || !matchedData) return

    // Create updated parsed data with dmcode, titleEn, and movieType
    const updatedParsedData = {
      ...parsedData,
      dmcode: dmcode,
      titleEn: titleEn
    }

    const movie = convertToMovie(updatedParsedData, matchedData, ignoredItems, detectedSource)
    // Override movie type with user selection and add cover/gallery
    movie.type = movieType
    movie.cover = cover
    movie.gallery = gallery
    movie.cropCover = cropCover
    onSave(movie)
    setShowDuplicateWarning(null)
  }

  const handleCancelDuplicate = () => {
    // Reset all data to allow user to paste new data
    setRawData('')
    setParsedData(null)
    setMatchedData(null)
    setShowDuplicateWarning(null)
    setError('')
    setIgnoredItems(new Set())
    setTitleEn('')
    setDmcode('')
    setDmcodeFromR18(false)
    setCover('')
    setGallery('')
    setCropCover(false)
  }

  const handleMergeData = () => {
    if (!parsedData || !showDuplicateWarning) return

    // Pre-fill fields with existing data from database
    const existingMovie = showDuplicateWarning.existingMovie
    
    // Pre-fill English title if it exists
    if (existingMovie.titleEn) {
      setTitleEn(existingMovie.titleEn)
    }
    
    // Pre-fill other fields that might be useful
    // Note: DM code should use the one from R18 data if available, not from database
    if (!dmcodeFromR18 && existingMovie.dmcode) {
      setDmcode(existingMovie.dmcode)
    }
    
    if (existingMovie.type) {
      setMovieType(existingMovie.type)
    }
    
    if (existingMovie.cover) {
      setCover(existingMovie.cover)
    }
    
    if (existingMovie.gallery) {
      setGallery(existingMovie.gallery)
    }

    // Set merge mode and close duplicate warning
    setMergeMode({
      existingMovie: existingMovie,
      isActive: true
    })
    setShowDuplicateWarning(null)
  }

  const handleCancelMerge = () => {
    setMergeMode(null)
  }

  const translateTitle = async () => {
    if (!parsedData?.titleJp) return
    
    setTranslatingTitle(true)
    try {
      // Menggunakan DeepSeek R1 untuk translate dengan konteks movie title dan data movie
      const movieData = {
        actors: parsedData.actors?.join(', ') || '',
        actress: parsedData.actresses?.join(', ') || '',
        director: parsedData.director || '',
        studio: parsedData.studio || '',
        series: parsedData.series || '',
        dmcode: dmcode || ''
      }
      
      const translatedText = await translateMovieTitleWithContext(parsedData.titleJp, movieData, accessToken)
      
      if (translatedText && translatedText !== parsedData.titleJp) {
        setTitleEn(translatedText)
        toast.success('Title berhasil diterjemahkan menggunakan DeepSeek R1 dengan konteks movie data')
      } else {
        setError('Failed to translate title')
        toast.error('Gagal menerjemahkan title')
      }
    } catch (error) {
      console.error('Translation error:', error)
      setError('Failed to translate title')
      toast.error('Terjadi error saat menerjemahkan title')
    } finally {
      setTranslatingTitle(false)
    }
  }

  // Apply template when movie type changes
  const applyTemplateForType = async (type: string) => {
    if (!parsedData || !dmcode || isApplyingTemplate) return

    const templateKey = `${type}-${dmcode}`
    if (lastAppliedTemplate === templateKey) {
      return // Skip silently to reduce console spam
    }

    setIsApplyingTemplate(true)
    
    try {
      const result = await applyDefaultTemplate({
        type: type,
        dmcode: dmcode,
        currentCover: cover,
        currentGallery: gallery
      })
      
      if (result) {
        if (result.cover) setCover(result.cover)
        if (result.gallery) setGallery(result.gallery)
        setLastAppliedTemplate(templateKey)
      }
    } catch (error) {
      console.error('Template application failed:', error)
    } finally {
      setIsApplyingTemplate(false)
    }
  }

  // Check if types should enable auto-crop
  const shouldEnableAutoCrop = (type: string): boolean => {
    // Auto-crop for specific types: Cen, Leaks, Sem, 2versions
    const autoCropTypes = ['cen', 'leaks', 'sem', '2versions']
    return autoCropTypes.includes(type.toLowerCase())
  }

  // Handle movie type change
  const handleMovieTypeChange = async (newType: string) => {
    setMovieType(newType)
    
    // Crop cover will be set by useEffect to prevent duplicate calls
    // No need to call setCropCover here as it will be handled by useEffect
  }

  const handleIgnoreItem = (typeKey: keyof MatchedData, index: number) => {
    const itemKey = `${typeKey}-${index}`
    setIgnoredItems(prev => new Set([...prev, itemKey]))
  }

  const handleUnignoreItem = (typeKey: keyof MatchedData, index: number) => {
    const itemKey = `${typeKey}-${index}`
    setIgnoredItems(prev => {
      const newSet = new Set(prev)
      newSet.delete(itemKey)
      return newSet
    })
  }

  const isItemIgnored = (typeKey: keyof MatchedData, index: number): boolean => {
    const itemKey = `${typeKey}-${index}`
    
    // For JavDB simple parser, only use manual ignore state (user choice)
    // Don't auto-ignore based on matched data
    return ignoredItems.has(itemKey)
  }

  const handleConfirmMatch = (type: keyof MatchedData, index: number, confirmed: boolean) => {
    if (!matchedData) return

    const newMatchedData = { ...matchedData }
    const item = newMatchedData[type][index]
    item.needsConfirmation = !confirmed
    
    setMatchedData(newMatchedData)
  }

  const handleShouldUpdateData = (type: keyof MatchedData, index: number, shouldUpdate: boolean) => {
    if (!matchedData) return

    const newMatchedData = { ...matchedData }
    const item = newMatchedData[type][index]
    item.shouldUpdateData = shouldUpdate
    
    setMatchedData(newMatchedData)
  }

  const updateMasterDataWithConflicts = async () => {
    if (!matchedData) return

    const updatePromises: Promise<any>[] = []

    // Process all categories
    const categories: (keyof MatchedData)[] = ['actresses', 'actors', 'directors', 'studios', 'series', 'labels']
    
    for (const category of categories) {
      const items = matchedData[category]
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.matched && (item.missingData || item.shouldUpdateData)) {
          // Determine the type for API call first
          let masterDataType: 'actor' | 'actress' | 'director' | 'studio' | 'series' | 'label'
          switch (category) {
            case 'actresses':
              masterDataType = 'actress'
              break
            case 'actors':
              masterDataType = 'actor'
              break
            case 'directors':
              masterDataType = 'director'
              break
            case 'studios':
              masterDataType = 'studio'
              break
            case 'series':
              masterDataType = 'series'
              break
            case 'labels':
              masterDataType = 'label'
              break
            default:
              continue
          }

          // Update the master data item with missing data
          // Start with existing data to preserve all fields
          const updateData: any = { ...item.matched }
          
          // Always include the name field (required by API)
          // Use customEnglishName if user selected one, otherwise use matched name
          const nameToUse = item.customEnglishName || item.matched.name || item.matched.jpname || item.parsedName
          updateData.name = nameToUse
          
          // For series, include titleEn and titleJp
          if (masterDataType === 'series') {
            updateData.titleEn = item.customEnglishName || item.matched.titleEn || item.matched.name
            updateData.titleJp = item.matched.titleJp || item.matched.jpname
            // Preserve existing series links if they exist
            if (item.matched.seriesLinks) updateData.seriesLinks = item.matched.seriesLinks
          }
          
          // For studio, preserve existing studio links
          if (masterDataType === 'studio') {
            if (item.matched.studioLinks) updateData.studioLinks = item.matched.studioLinks
          }
          
          // For label, preserve existing label links
          if (masterDataType === 'label') {
            if (item.matched.labelLinks) updateData.labelLinks = item.matched.labelLinks
          }
          
          // Add missing data fields (only if they exist in missingData)
          if (item.missingData?.kanjiName) updateData.kanjiName = item.missingData.kanjiName
          if (item.missingData?.kanaName) updateData.kanaName = item.missingData.kanaName
          if (item.missingData?.alias) updateData.alias = item.missingData.alias
          if (item.missingData?.birthdate) updateData.birthdate = item.missingData.birthdate
          if (item.missingData?.tags) updateData.tags = item.missingData.tags
          if (item.missingData?.titleJp) updateData.titleJp = item.missingData.titleJp
          if (item.missingData?.name) updateData.name = item.missingData.name
          
          // Ensure critical fields are preserved for actresses/actors/directors
          if (masterDataType === 'actress' || masterDataType === 'actor' || masterDataType === 'director') {
            // Preserve Japanese name if it exists
            if (item.matched.jpname) updateData.jpname = item.matched.jpname
            // Preserve existing kanji/kana names if they exist and no new ones are being added
            if (!item.missingData?.kanjiName && item.matched.kanjiName) updateData.kanjiName = item.matched.kanjiName
            if (!item.missingData?.kanaName && item.matched.kanaName) updateData.kanaName = item.matched.kanaName
            // Preserve existing alias if no new one is being added
            if (!item.missingData?.alias && item.matched.alias) updateData.alias = item.matched.alias
            // Preserve existing birthdate if no new one is being added
            if (!item.missingData?.birthdate && item.matched.birthdate) updateData.birthdate = item.matched.birthdate
            // Preserve existing tags if no new ones are being added
            if (!item.missingData?.tags && item.matched.tags) updateData.tags = item.matched.tags
          }

          // Add update promise
          updatePromises.push(
            masterDataApi.updateExtendedWithSync(
              masterDataType,
              item.matched.id,
              updateData,
              accessToken
            ).catch(error => {
              console.error(`Failed to update ${masterDataType} ${item.matched!.id}:`, error)
              // Don't throw error to prevent stopping the entire process
            })
          )
        }
      }
    }

    // Execute all updates
    if (updatePromises.length > 0) {
      console.log(`Updating ${updatePromises.length} master data items with missing data...`)
      await Promise.all(updatePromises)
      console.log('Master data updates completed')
      
      // Clear cache to ensure fresh data is loaded
      console.log('Clearing cache after master data updates...')
      invalidateCache()
    }
  }

  const handleAddToDatabase = (type: keyof MatchedData, index: number) => {
    if (!matchedData) return

    const item = matchedData[type][index]
    if (!item || item.matched) return

    // Determine master data type
    let masterDataType: 'actor' | 'actress' | 'director' | 'studio' | 'series' | 'label'
    switch (type) {
      case 'actresses':
        masterDataType = 'actress'
        break
      case 'actors':
        masterDataType = 'actor'
        break
      case 'directors':
        masterDataType = 'director'
        break
      case 'studios':
        masterDataType = 'studio'
        break
      case 'series':
        masterDataType = 'series'
        break
      case 'labels':
        masterDataType = 'label'
        break
      default:
        return
    }

    // Prepare R18.dev data for the form
    let r18Data: any = undefined
    if (parsedData && isR18JsonFormat(parsedData.rawData)) {
      try {
        const r18JsonData = JSON.parse(parsedData.rawData)
        
        if (masterDataType === 'director' && parsedData.directorInfo) {
          r18Data = {
            name_romaji: parsedData.directorInfo.name_romaji,
            name_kanji: parsedData.directorInfo.name_kanji,
            name_kana: parsedData.directorInfo.name_kana
          }
        } else if (masterDataType === 'series' && parsedData.seriesInfo) {
          r18Data = {
            name_en: parsedData.seriesInfo.name_en,
            name_ja: parsedData.seriesInfo.name_ja
          }
        } else if (masterDataType === 'label' && parsedData.labelInfo) {
          r18Data = {
            label_name_en: parsedData.labelInfo.name_en,
            label_name_ja: parsedData.labelInfo.name_ja
          }
        }
      } catch (error) {
        console.error('Error parsing R18.dev data:', error)
      }
    }

    // Show master data form
    setShowMasterDataForm({
      type: masterDataType,
      index,
      name: item.name,
      r18Data
    })
  }

  const handleMasterDataSave = async (newItem: MasterDataItem) => {
    if (!showMasterDataForm || !matchedData) return

    const { type, index } = showMasterDataForm
    
    // Determine the matched data type
    let matchedDataType: keyof MatchedData
    switch (type) {
      case 'actress':
        matchedDataType = 'actresses'
        break
      case 'actor':
        matchedDataType = 'actors'
        break
      case 'director':
        matchedDataType = 'directors'
        break
      case 'studio':
        matchedDataType = 'studios'
        break
      case 'series':
        matchedDataType = 'series'
        break
      case 'label':
        matchedDataType = 'labels'
        break
      default:
        return
    }

    // Update the matched data
    const newMatchedData = { ...matchedData }
    const item = newMatchedData[matchedDataType][index]
    newMatchedData[matchedDataType][index] = {
      ...item,
      matched: newItem,
      needsConfirmation: false
    }
    
    setMatchedData(newMatchedData)
    
    // Reload master data to include the new item
    await loadMasterData()
    
    // Close form
    setShowMasterDataForm(null)
  }

  const handleMultipleMatchSelect = (selectedItem: MasterDataItem) => {
    if (!showMultipleMatchSelector || !matchedData) return

    const { type, index } = showMultipleMatchSelector

    // Determine the correct type key for matchedData
    let matchedDataType: keyof MatchedData
    switch (type) {
      case 'actress':
        matchedDataType = 'actresses'
        break
      case 'actor':
        matchedDataType = 'actors'
        break
      case 'director':
        matchedDataType = 'directors'
        break
      case 'studio':
        matchedDataType = 'studios'
        break
      case 'series':
        matchedDataType = 'series'
        break
      default:
        return
    }

    // Update the matched data
    const newMatchedData = { ...matchedData }
    const matchedItem = newMatchedData[matchedDataType][index]
    newMatchedData[matchedDataType][index] = {
      ...matchedItem,
      matched: selectedItem,
      needsConfirmation: false
    }
    
    setMatchedData(newMatchedData)
    
    // Close selector
    setShowMultipleMatchSelector(null)
  }

  const handleEnglishNameSelect = (selectedItem: MasterDataItem) => {
    if (!showEnglishNameSelector || !matchedData) return

    const { type, index } = showEnglishNameSelector

    // Determine the correct type key for matchedData
    let matchedDataType: keyof MatchedData
    switch (type) {
      case 'actress':
        matchedDataType = 'actresses'
        break
      case 'actor':
        matchedDataType = 'actors'
        break
      case 'director':
        matchedDataType = 'directors'
        break
      case 'studio':
        matchedDataType = 'studios'
        break
      case 'series':
        matchedDataType = 'series'
        break
      default:
        return
    }

    // Update the matched data with custom English name
    const newMatchedData = { ...matchedData }
    const matchedItem = newMatchedData[matchedDataType][index]
    newMatchedData[matchedDataType][index] = {
      ...matchedItem,
      customEnglishName: selectedItem.name || selectedItem.titleEn,
      needsConfirmation: false,
      needsEnglishNameSelection: false // Mark as resolved
    }
    
    setMatchedData(newMatchedData)
    
    // Close selector
    setShowEnglishNameSelector(null)
  }

  const handleJapaneseNameMatchSelect = (selectedItem: MasterDataItem, englishName?: string) => {
    if (!showJapaneseNameMatcher || !matchedData) return

    const { type, index } = showJapaneseNameMatcher

    // Determine the correct type key for matchedData
    let matchedDataType: keyof MatchedData
    switch (type) {
      case 'actress':
        matchedDataType = 'actresses'
        break
      case 'actor':
        matchedDataType = 'actors'
        break
      case 'director':
        matchedDataType = 'directors'
        break
      case 'studio':
        matchedDataType = 'studios'
        break
      case 'series':
        matchedDataType = 'series'
        break
      case 'label':
        matchedDataType = 'labels'
        break
      default:
        return
    }

    // Update the matched data
    const newMatchedData = { ...matchedData }
    const matchedItem = newMatchedData[matchedDataType][index]
    newMatchedData[matchedDataType][index] = {
      ...matchedItem,
      matched: selectedItem,
      customEnglishName: englishName,
      needsConfirmation: false,
      needsEnglishNameSelection: false
    }
    
    setMatchedData(newMatchedData)
    
    // Close selector
    setShowJapaneseNameMatcher(null)
  }

  const handleMovieTitleMatchSelect = (selectedItem: MasterDataItem, englishTitle?: string) => {
    if (!showMovieTitleMatcher || !parsedData) return

    // Update the parsed data with the selected English title
    setTitleEn(englishTitle || selectedItem.titleEn || selectedItem.name || '')
    
    // Close selector
    setShowMovieTitleMatcher(null)
  }

  const renderMatchedItems = (items: MatchedData[keyof MatchedData], type: string, typeKey: keyof MatchedData) => {
    if (items.length === 0) return null

    return (
      <div className="mb-4">
        <h4 className="text-lg font-semibold mb-2 capitalize">{type}</h4>
        <div className="space-y-2">
          {items.map((item, index) => {
            const isIgnored = isItemIgnored(typeKey, index)
            return (
              <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${isIgnored ? 'bg-gray-200 opacity-60' : 'bg-gray-50'}`}>
                <div className="flex-1">
                  <span className="font-medium">{item.name}</span>
                  {isIgnored ? (
                    <div className="text-sm text-gray-500">
                      ⏸ Ignored (will not be saved)
                    </div>
                  ) : item.matched ? (
                    <div className="text-sm">
                      {item.needsConfirmation ? (
                        <div className="text-orange-600">
                          ⚠ Japanese name matched, but English name differs
                          <div className="text-xs text-gray-600 mt-1">
                            Database: {item.matched!.name}
                            {(typeKey === 'series' ? item.matched!.titleJp : item.matched!.jpname) && ` (${typeKey === 'series' ? item.matched!.titleJp : item.matched!.jpname})`}
                          </div>
                          {item.needsEnglishNameSelection && (
                            <div className="text-xs text-purple-600 mt-1">
                              Please choose the correct English name
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-green-600">
                          ✓ Matched: {item.customEnglishName || item.matched!.name}
                          {(typeKey === 'series' ? item.matched!.titleJp : item.matched!.jpname) && ` (${typeKey === 'series' ? item.matched!.titleJp : item.matched!.jpname})`}
                          {item.customEnglishName && item.customEnglishName !== item.matched!.name && (
                            <div className="text-xs text-purple-600 mt-1">
                              ✓ Custom English name selected
                            </div>
                          )}
                          {item.multipleMatches.length > 1 && (
                            <div className="text-xs text-blue-600 mt-1">
                              +{item.multipleMatches.length - 1} other matches found
                            </div>
                          )}
                          {/* Show auto-confirm message for series */}
                          {typeKey === 'series' && (
                            <div className="text-xs text-blue-600 mt-1">
                              🔄 Series otomatis dikonfirmasi dan akan diupdate
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-orange-600">
                      ⚠ Not found in database
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {isIgnored ? (
                    <button
                      onClick={() => handleUnignoreItem(typeKey, index)}
                      className="px-3 py-1 bg-orange-500 text-white text-sm rounded hover:bg-orange-600 font-medium shadow-sm"
                    >
                      Unignore
                    </button>
                  ) : !item.matched ? (
                    <>
                      <button
                        onClick={() => handleAddToDatabase(typeKey, index)}
                        disabled={loading}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
                      >
                        {loading ? 'Adding...' : 'Add to Database'}
                      </button>
                      <button
                        onClick={() => handleIgnoreItem(typeKey, index)}
                        className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 font-medium shadow-sm"
                      >
                        Ignore
                      </button>
                    </>
                  ) : (
                    <>
                      {item.multipleMatches.length > 1 && (
                        <>
                          <button
                            onClick={() => {
                              let type: 'actor' | 'actress' | 'director' | 'studio' | 'series' | 'label'
                              switch (typeKey) {
                                case 'actresses':
                                  type = 'actress'
                                  break
                                case 'actors':
                                  type = 'actor'
                                  break
                                case 'directors':
                                  type = 'director'
                                  break
                                case 'studios':
                                  type = 'studio'
                                  break
                                case 'series':
                                  type = 'series'
                                  break
                                case 'labels':
                                  type = 'label'
                                  break
                                default:
                                  return
                              }
                              setShowJapaneseNameMatcher({
                                type,
                                index,
                                searchName: item.name,
                                matches: item.multipleMatches,
                                parsedEnglishName: item.parsedEnglishName,
                                availableEnglishNames: item.availableEnglishNames
                              })
                            }}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 font-medium shadow-sm"
                          >
                            Japanese Name Match ({item.multipleMatches.length})
                          </button>
                          {(
                            // General conditions for all categories
                            item.needsEnglishNameSelection || 
                            (item.availableEnglishNames && item.availableEnglishNames.length > 0) ||
                            // Directors: show button if there's a difference between Japanese and English names
                            (typeKey === 'directors' && item.matched && item.matched.name && item.matched.jpname && item.matched.name !== item.matched.jpname) ||
                            (typeKey === 'directors' && item.matched && item.matched.name && item.parsedEnglishName && item.matched.name !== item.parsedEnglishName) ||
                            // Series: don't check needsConfirmation since it's auto-confirmed
                            (typeKey === 'series' && item.matched && item.matched.name && item.matched.titleJp && item.matched.name !== item.matched.titleJp) ||
                            (typeKey === 'series' && item.matched && item.matched.name && item.parsedEnglishName && item.matched.name !== item.parsedEnglishName) ||
                            // Other categories: check needsConfirmation
                            (typeKey !== 'series' && typeKey !== 'directors' && item.needsConfirmation)
                          ) && !item.customEnglishName && (
                            <button
                              onClick={() => {
                                console.log('=== CHOOSE ENGLISH NAME CLICKED ===')
                                console.log('Item:', item)
                                console.log('Available English Names:', item.availableEnglishNames)
                                console.log('Parsed English Name:', item.parsedEnglishName)
                                
                                let type: 'actor' | 'actress' | 'director' | 'studio' | 'series' | 'label'
                                switch (typeKey) {
                                  case 'actresses':
                                    type = 'actress'
                                    break
                                  case 'actors':
                                    type = 'actor'
                                    break
                                  case 'directors':
                                    type = 'director'
                                    break
                                  case 'studios':
                                    type = 'studio'
                                    break
                                  case 'series':
                                    type = 'series'
                                    break
                                  case 'labels':
                                    type = 'label'
                                    break
                                  default:
                                    return
                                }
                                setShowJapaneseNameMatcher({
                                  type,
                                  index,
                                  searchName: item.name,
                                  matches: [item.matched!], // Only show the selected match
                                  parsedEnglishName: item.parsedEnglishName,
                                  availableEnglishNames: item.availableEnglishNames
                                })
                              }}
                              className="px-3 py-1 bg-purple-500 text-white text-sm rounded hover:bg-purple-600 font-medium shadow-sm"
                            >
                              Choose English Name
                            </button>
                          )}
                          {/* Debug info for English name selection */}
                          {(typeKey === 'directors' || typeKey === 'series') && (
                            <div className="text-xs text-gray-500 mt-1">
                              Debug: needsEnglishNameSelection={item.needsEnglishNameSelection ? 'true' : 'false'}, 
                              availableEnglishNames={item.availableEnglishNames?.length || 0},
                              parsedEnglishName={item.parsedEnglishName || 'none'},
                              matchedName={item.matched?.name || 'none'},
                              matchedJpname={item.matched?.jpname || 'none'},
                              matchedTitleJp={item.matched?.titleJp || 'none'},
                              customEnglishName={item.customEnglishName || 'none'},
                              namesDifferent={typeKey === 'directors' ? (item.matched?.name !== item.matched?.jpname ? 'true' : 'false') : (item.matched?.name !== item.matched?.titleJp ? 'true' : 'false')},
                              showButton={(item.needsEnglishNameSelection || (item.availableEnglishNames && item.availableEnglishNames.length > 0) || (typeKey === 'directors' && item.matched && item.matched.name && item.matched.jpname && item.matched.name !== item.matched.jpname) || (typeKey === 'directors' && item.matched && item.matched.name && item.parsedEnglishName && item.matched.name !== item.parsedEnglishName) || (typeKey === 'series' && item.matched && item.matched.name && item.matched.titleJp && item.matched.name !== item.matched.titleJp) || (typeKey === 'series' && item.matched && item.matched.name && item.parsedEnglishName && item.matched.name !== item.parsedEnglishName)) && !item.customEnglishName ? 'true' : 'false'},
                              condition1={item.needsEnglishNameSelection ? 'true' : 'false'},
                              condition2={(item.availableEnglishNames && item.availableEnglishNames.length > 0) ? 'true' : 'false'},
                              condition3={typeKey === 'directors' ? (item.matched && item.matched.name && item.matched.jpname && item.matched.name !== item.matched.jpname ? 'true' : 'false') : (item.matched && item.matched.name && item.matched.titleJp && item.matched.name !== item.matched.titleJp ? 'true' : 'false')},
                              condition4={typeKey === 'directors' ? (item.matched && item.matched.name && item.parsedEnglishName && item.matched.name !== item.parsedEnglishName ? 'true' : 'false') : (item.matched && item.matched.name && item.parsedEnglishName && item.matched.name !== item.parsedEnglishName ? 'true' : 'false')},
                              hasCustomName={item.customEnglishName ? 'true' : 'false'}
                            </div>
                          )}
                        </>
                      )}
                      {/* Move Choose English Name button outside multipleMatches condition */}
                      {(
                        // General conditions for all categories
                        item.needsEnglishNameSelection || 
                        (item.availableEnglishNames && item.availableEnglishNames.length > 0) ||
                        // Directors: show button only if there's a conflict that needs resolution
                        (typeKey === 'directors' && item.hasDifferentEnglishNames) ||
                        // Series: don't show button since it's auto-confirmed and auto-updated
                        // Other categories: check needsConfirmation
                        (typeKey !== 'series' && typeKey !== 'directors' && item.needsConfirmation)
                      ) && !item.customEnglishName && (
                        <button
                          onClick={() => {
                            
                            let type: 'actor' | 'actress' | 'director' | 'studio' | 'series' | 'label'
                            switch (typeKey) {
                              case 'actresses':
                                type = 'actress'
                                break
                              case 'actors':
                                type = 'actor'
                                break
                              case 'directors':
                                type = 'director'
                                break
                              case 'studios':
                                type = 'studio'
                                break
                              case 'series':
                                type = 'series'
                                break
                              case 'labels':
                                type = 'label'
                                break
                              default:
                                return
                            }
                            setShowJapaneseNameMatcher({
                              type,
                              index,
                              searchName: item.name,
                              matches: item.matched ? [item.matched] : [], // Show current match or empty
                              parsedEnglishName: item.parsedEnglishName,
                              availableEnglishNames: item.availableEnglishNames
                            })
                          }}
                          className="px-3 py-1 bg-purple-500 text-white text-sm rounded hover:bg-purple-600 font-medium shadow-sm"
                        >
                          Choose English Name
                        </button>
                      )}
                      {/* Hide confirm checkbox for series - auto-confirmed */}
                      {typeKey !== 'series' && (
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={!item.needsConfirmation}
                            onChange={(e) => handleConfirmMatch(typeKey, index, e.target.checked)}
                            className="mr-2"
                          />
                          Confirm
                        </label>
                      )}
                      
                      {/* Missing Data Section - Hide for series since they're auto-updated */}
                      {item.missingData && typeKey !== 'series' && (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="text-sm font-medium text-yellow-800 mb-2">
                            📝 Data yang belum ada di database:
                          </div>
                          <div className="space-y-1 text-sm text-yellow-700">
                            {item.missingData?.kanjiName && (
                              <div>• Kanji Name: {item.missingData.kanjiName}</div>
                            )}
                            {item.missingData?.kanaName && (
                              <div>• Kana Name: {item.missingData.kanaName}</div>
                            )}
                            {item.missingData?.alias && (
                              <div>• Alias: {item.missingData.alias}</div>
                            )}
                            {item.missingData?.birthdate && (
                              <div>• Birthdate: {item.missingData.birthdate}</div>
                            )}
                            {item.missingData?.tags && (
                              <div>• Tags: {item.missingData.tags}</div>
                            )}
                            {item.missingData?.titleJp && (
                              <div>• Japanese Title: {item.missingData.titleJp}</div>
                            )}
                            {item.missingData?.name && (
                              <div>• English Name: {item.missingData.name}</div>
                            )}
                          </div>
                          {/* Hide update checkbox for series - auto-updated */}
                          {typeKey !== 'series' && (
                            <label className="flex items-center mt-2">
                              <input
                                type="checkbox"
                                checked={item.shouldUpdateData || false}
                                onChange={(e) => handleShouldUpdateData(typeKey, index, e.target.checked)}
                                className="mr-2"
                              />
                              <span className="text-sm text-yellow-800">
                                Update data yang berbeda di database
                              </span>
                            </label>
                          )}
                          {/* Show auto-update message for series */}
                          {typeKey === 'series' && (
                            <div className="mt-2 text-sm text-green-800 font-medium">
                              ✅ Series akan otomatis diupdate dengan data terbaru
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Movie Data Parser</h2>
        <p className="text-gray-600">
          Paste movie data below and the system will parse it and match with existing database entries.
        </p>
        
        {/* Merge Mode Indicator */}
        {mergeMode?.isActive && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="font-medium text-blue-800 dark:text-blue-200">
                Mode Melengkapi Data
              </span>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Anda sedang melengkapi data untuk movie: <span className="font-mono font-bold">{mergeMode.existingMovie.code}</span>
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              Pilih aktris/aktor yang sesuai, lalu klik "Save Movie" untuk melengkapi data.
            </p>
            <button
              onClick={handleCancelMerge}
              className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 underline"
            >
              Batalkan mode melengkapi data
            </button>
          </div>
        )}
      </div>

      {/* Input Section */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Paste Movie Data
        </label>
        
        {/* Data Source Indicator */}
        {rawData.trim() && detectedSource !== 'unknown' && (
          <div className="mb-2">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
              detectedSource === 'javdb' 
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                : detectedSource === 'r18'
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
            }`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${
                detectedSource === 'javdb' 
                  ? 'bg-blue-500' 
                  : detectedSource === 'r18'
                  ? 'bg-green-500'
                  : 'bg-gray-500'
              }`}></div>
              {detectedSource === 'javdb' 
                ? '📋 JavDB Format (Simple Parser)' 
                : detectedSource === 'r18'
                ? '🔗 R18.dev Format (Complex Parser)'
                : '❓ Unknown Format (Fallback Parser)'
              }
            </div>
            <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
              {detectedSource === 'javdb' 
                ? 'Menggunakan parser sederhana berdasarkan commit 5d5a725'
                : detectedSource === 'r18'
                ? 'Menggunakan parser kompleks untuk JSON R18.dev'
                : 'Menggunakan parser fallback untuk format tidak dikenal'
              }
            </div>
          </div>
        )}
        
        <textarea
          value={rawData}
          onChange={(e) => setRawData(e.target.value)}
          placeholder="Paste movie data here (e.g., SNIS-217 ラブ◆キモメン ティア...)"
          className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <div className="mt-2 flex space-x-2">
          <button
            onClick={handleParse}
            disabled={loading || !rawData.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Parse Data'}
          </button>
          <button
            onClick={handlePasteFromClipboard}
            disabled={pasteStatus === 'pasting'}
            className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
              pasteStatus === 'success' 
                ? 'bg-green-600 text-white' 
                : pasteStatus === 'error'
                ? 'bg-red-600 text-white'
                : pasteStatus === 'pasting'
                ? 'bg-yellow-600 text-white opacity-75'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Clipboard size={16} />
            {pasteStatus === 'pasting' 
              ? 'Pasting...' 
              : pasteStatus === 'success'
              ? '✅ Pasted!'
              : pasteStatus === 'error'
              ? '❌ Failed'
              : '📋 Paste from Clipboard'
            }
          </button>
          <button
            onClick={() => {
              setRawData('')
              setParsedData(null)
              setMatchedData(null)
              setError('')
            }}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Clear
          </button>
        </div>
        {error && (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
        
        {/* Template Applied Notification */}
        {appliedTemplate && (
          <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
            <div className="flex items-center justify-between">
              <div>
                <strong>Template Applied:</strong> {appliedTemplate.templateName}
                <div className="text-sm mt-1">
                  Applied fields: {appliedTemplate.appliedFields.join(', ')}
                </div>
              </div>
              <button
                onClick={() => setAppliedTemplate(null)}
                className="text-green-600 hover:text-green-800"
              >
                ×
              </button>
            </div>
          </div>
        )}
        
        {/* New Data Preview for Merge Mode */}
        {mergeMode?.isActive && parsedData && matchedData && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <h3 className="font-semibold text-blue-800 dark:text-blue-200">
                Data Baru yang Akan Ditambahkan
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {/* Basic Info */}
              <div className="space-y-2">
                <h4 className="font-medium text-blue-700 dark:text-blue-300">Informasi Dasar</h4>
                {parsedData.titleEn && !mergeMode.existingMovie.titleEn && (
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 dark:text-green-400">+</span>
                    <span className="text-gray-600 dark:text-gray-400">Title (EN):</span>
                    <span className="font-medium">{parsedData.titleEn}</span>
                  </div>
                )}
                {parsedData.releaseDate && !mergeMode.existingMovie.releaseDate && (
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 dark:text-green-400">+</span>
                    <span className="text-gray-600 dark:text-gray-400">Release Date:</span>
                    <span className="font-medium">{parsedData.releaseDate}</span>
                  </div>
                )}
                {parsedData.duration && !mergeMode.existingMovie.duration && (
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 dark:text-green-400">+</span>
                    <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                    <span className="font-medium">{parsedData.duration}</span>
                  </div>
                )}
                {parsedData.director && !mergeMode.existingMovie.director && (
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 dark:text-green-400">+</span>
                    <span className="text-gray-600 dark:text-gray-400">Director:</span>
                    <span className="font-medium">{parsedData.director}</span>
                  </div>
                )}
                {parsedData.studio && !mergeMode.existingMovie.studio && (
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 dark:text-green-400">+</span>
                    <span className="text-gray-600 dark:text-gray-400">Studio:</span>
                    <span className="font-medium">{parsedData.studio}</span>
                  </div>
                )}
                {parsedData.series && !mergeMode.existingMovie.series && (
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 dark:text-green-400">+</span>
                    <span className="text-gray-600 dark:text-gray-400">Series:</span>
                    <span className="font-medium">{parsedData.series}</span>
                  </div>
                )}
                {parsedData.label && !mergeMode.existingMovie.label && (
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 dark:text-green-400">+</span>
                    <span className="text-gray-600 dark:text-gray-400">Label:</span>
                    <span className="font-medium">{parsedData.label}</span>
                  </div>
                )}
              </div>
              
              {/* Cast & Crew */}
              <div className="space-y-2">
                <h4 className="font-medium text-blue-700 dark:text-blue-300">Cast & Crew</h4>
                {matchedData.actresses && matchedData.actresses.length > 0 && (
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Actresses:</span>
                    <div className="mt-1 space-y-1">
                      {matchedData.actresses
                        .map((item, index) => ({ item, index }))
                        .filter(({ item, index }) => item.matched && !ignoredItems.has(`actresses-${index}`))
                        .map(({ item, index }) => {
                          const matchedName = item.matched!.name || item.matched!.jpname || item.name
                          const existingActresses = mergeMode.existingMovie.actress ? mergeMode.existingMovie.actress.split(',').map(a => a.trim()) : []
                          const isNew = !existingActresses.some(existing => 
                            existing.toLowerCase() === matchedName.toLowerCase() ||
                            existing.includes(matchedName) ||
                            matchedName.includes(existing)
                          )
                          
                          if (isNew) {
                            return (
                              <div key={index} className="flex items-center gap-2">
                                <span className="text-green-600 dark:text-green-400">+</span>
                                <span className="font-medium">{matchedName}</span>
                              </div>
                            )
                          }
                          return null
                        })}
                    </div>
                  </div>
                )}
                
                {matchedData.actors && matchedData.actors.length > 0 && (
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Actors:</span>
                    <div className="mt-1 space-y-1">
                      {matchedData.actors
                        .map((item, index) => ({ item, index }))
                        .filter(({ item, index }) => item.matched && !ignoredItems.has(`actors-${index}`))
                        .map(({ item, index }) => {
                          const matchedName = item.matched!.name || item.matched!.jpname || item.name
                          const existingActors = mergeMode.existingMovie.actors ? mergeMode.existingMovie.actors.split(',').map(a => a.trim()) : []
                          const isNew = !existingActors.some(existing => 
                            existing.toLowerCase() === matchedName.toLowerCase() ||
                            existing.includes(matchedName) ||
                            matchedName.includes(existing)
                          )
                          
                          if (isNew) {
                            return (
                              <div key={index} className="flex items-center gap-2">
                                <span className="text-green-600 dark:text-green-400">+</span>
                                <span className="font-medium">{matchedName}</span>
                              </div>
                            )
                          }
                          return null
                        })}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-3 text-xs text-blue-600 dark:text-blue-400">
              💡 Data yang sudah ada di database tidak akan ditampilkan di sini. Hanya data baru yang akan ditambahkan.
            </div>
          </div>
        )}
      </div>

      {/* Parsed Data Display */}
      {parsedData && (
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-4">Parsed Movie Data</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <strong>Code:</strong> {parsedData.code}
              </div>
              <div>
                <strong>Title (JP):</strong> {parsedData.titleJp}
              </div>
              <div>
                <strong>Release Date:</strong> {parsedData.releaseDate}
              </div>
              {parsedData.label && (
                <div>
                  <strong>Label:</strong> {parsedData.label}
                </div>
              )}
            </div>
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-2">
                <strong>Title (EN):</strong>
                <div className="flex-1 relative">
                  <ShimmerInput
                    type="text"
                    value={titleEn}
                    onChange={(e) => setTitleEn(e.target.value)}
                    placeholder="English title (auto-translated or manual)"
                    isShimmering={translatingTitle}
                    className={`text-sm ${
                      mergeMode?.isActive && mergeMode.existingMovie.titleEn && titleEn === mergeMode.existingMovie.titleEn
                        ? 'border-green-300 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-300'
                    }`}
                  />
                  {mergeMode?.isActive && mergeMode.existingMovie.titleEn && titleEn === mergeMode.existingMovie.titleEn && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-green-600 dark:text-green-400 font-medium">
                      From DB
                    </div>
                  )}
                </div>
                <button
                  onClick={translateTitle}
                  disabled={translatingTitle || !parsedData.titleJp}
                  className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  title="Translate from Japanese using DeepSeek R1"
                >
                  {translatingTitle ? (
                    <>
                      <AITranslationSpinner size="sm" />
                      <span>AI Translating...</span>
                    </>
                  ) : (
                    <>
                      <Brain className="h-3 w-3" />
                      <span>Translate</span>
                    </>
                  )}
                </button>
                {needsTitleSelection && titleOptions.length > 0 && (
                  <button
                    onClick={() => {
                      console.log('=== CHOOSE MOVIE TITLE CLICKED ===')
                      console.log('Title Options:', titleOptions)
                      console.log('Current Title:', titleEn)
                      
                      setShowMovieTitleMatcher({
                        searchName: parsedData.titleJp || '',
                        matches: [{
                          id: 'temp',
                          name: titleOptions[0],
                          titleEn: titleOptions[0],
                          titleJp: parsedData.titleJp || '',
                          type: 'movie'
                        }],
                        parsedEnglishTitle: titleOptions[1] || parsedData.titleEn || '',
                        movieCode: parsedData.code || ''
                      })
                    }}
                    className="px-3 py-1 bg-purple-500 text-white text-sm rounded hover:bg-purple-600 font-medium shadow-sm"
                  >
                    Choose Title
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <strong>Movie Type:</strong>
                <div className="relative">
                  <select
                    value={movieType}
                    onChange={(e) => handleMovieTypeChange(e.target.value)}
                    className={`px-2 py-1 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      mergeMode?.isActive && movieType && movieType !== mergeMode.existingMovie.type
                        ? 'border-orange-300 bg-orange-50 dark:bg-orange-900/20'
                        : 'border-gray-300'
                    }`}
                    disabled={availableTypes.length === 0}
                  >
                  {availableTypes.length === 0 ? (
                    <option value="">Loading types...</option>
                  ) : (
                    availableTypes.map((type) => (
                      <option key={type.id} value={type.name}>
                        {type.name}
                      </option>
                    ))
                  )}
                </select>
                {mergeMode?.isActive && movieType && movieType !== mergeMode.existingMovie.type && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-orange-600 dark:text-orange-400 font-medium">
                    New
                  </div>
                )}
                </div>
              </div>
            </div>
            
            {/* Cover and Gallery Templates */}
            {(cover || gallery) && (
              <div className={`mt-4 p-3 border rounded-lg ${
                mergeMode?.isActive && (
                  (cover && cover !== mergeMode.existingMovie.cover) ||
                  (gallery && gallery !== mergeMode.existingMovie.gallery)
                )
                  ? 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800'
                  : 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">Template Applied</h4>
                  {mergeMode?.isActive && (
                    (cover && cover !== mergeMode.existingMovie.cover) ||
                    (gallery && gallery !== mergeMode.existingMovie.gallery)
                  ) && (
                    <span className="text-xs text-orange-600 dark:text-orange-400 font-medium bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded">
                      New Data
                    </span>
                  )}
                </div>
                {cover && (
                  <div className="mb-2">
                    <strong className="text-sm text-blue-800">Cover:</strong>
                    <div className="text-xs text-blue-700 font-mono bg-blue-100 p-1 rounded mt-1 break-all">
                      {cover}
                    </div>
                  </div>
                )}
                {gallery && (
                  <div className="mb-2">
                    <strong className="text-sm text-blue-800">Gallery:</strong>
                    <div className="text-xs text-blue-700 font-mono bg-blue-100 p-1 rounded mt-1 break-all">
                      {gallery}
                    </div>
                  </div>
                )}
                {cropCover && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-sm text-orange-700 font-medium">
                      Cover will be cropped to right side
                    </span>
                  </div>
                )}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <strong>Duration:</strong> {parsedData.duration}
              </div>
              <div>
                <strong>Director:</strong> {parsedData.director}
              </div>
              <div>
                <strong>Studio:</strong> {parsedData.studio}
              </div>
              <div>
                <strong>Series:</strong> {parsedData.series}
              </div>
              <div>
                <strong>Rating:</strong> {parsedData.rating || 'N/A'}
              </div>
            </div>
            
            {/* Additional R18.dev Data */}
            {(parsedData.galleryImages || parsedData.coverImage || parsedData.sampleUrl) && (
              <div className="mt-4 p-3 border rounded-lg bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800">
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="font-medium text-purple-900 dark:text-purple-100">R18.dev Data</h4>
                  <span className="text-xs text-purple-600 dark:text-purple-400 font-medium bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded">
                    Additional Info
                  </span>
                </div>
                
                {parsedData.coverImage && (
                  <div className="mb-3">
                    <strong className="text-sm text-purple-800">Cover Image:</strong>
                    <div className="text-xs text-purple-700 font-mono bg-purple-100 p-1 rounded mt-1 break-all">
                      {parsedData.coverImage}
                    </div>
                  </div>
                )}
                
                {parsedData.galleryImages && parsedData.galleryImages.length > 0 && (
                  <div className="mb-3">
                    <strong className="text-sm text-purple-800">Gallery Images ({parsedData.galleryImages.length}):</strong>
                    <div className="text-xs text-purple-700 font-mono bg-purple-100 p-1 rounded mt-1 max-h-32 overflow-y-auto">
                      {parsedData.galleryImages.map((url, index) => (
                        <div key={index} className="break-all">
                          {url}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {parsedData.sampleUrl && (
                  <div className="mb-3">
                    <strong className="text-sm text-purple-800">Sample Video:</strong>
                    <div className="text-xs text-purple-700 font-mono bg-purple-100 p-1 rounded mt-1 break-all">
                      {parsedData.sampleUrl}
                    </div>
                  </div>
                )}
                
              </div>
            )}
            <div className="mt-4">
              <div className="flex items-center gap-2">
                <strong>DM Code:</strong>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={dmcode}
                    onChange={(e) => setDmcode(e.target.value)}
                    placeholder="Auto-generated dmcode"
                    className={`w-full px-2 py-1 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      dmcodeFromR18
                        ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20'
                        : mergeMode?.isActive && mergeMode.existingMovie.dmcode && dmcode === mergeMode.existingMovie.dmcode
                        ? 'border-green-300 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-300'
                    }`}
                  />
                  {dmcodeFromR18 && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-blue-600 dark:text-blue-400 font-medium">
                      From R18
                    </div>
                  )}
                  {!dmcodeFromR18 && mergeMode?.isActive && mergeMode.existingMovie.dmcode && dmcode === mergeMode.existingMovie.dmcode && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-green-600 dark:text-green-400 font-medium">
                      From DB
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    if (dmcodeFromR18) {
                      // Don't regenerate if DM code is from R18
                      toast.info('DM code dari R18 tidak bisa di-regenerate')
                      return
                    }
                    const regenerated = generateDmcode(parsedData.code, parsedData.studio)
                    setDmcode(regenerated)
                    setDmcodeFromR18(false)
                  }}
                  className={`px-2 py-1 text-white text-xs rounded ${
                    dmcodeFromR18 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-blue-500 hover:bg-blue-600'
                  }`}
                  title={dmcodeFromR18 ? "DM code dari R18 tidak bisa di-regenerate" : "Regenerate dmcode"}
                  disabled={dmcodeFromR18}
                >
                  Regenerate
                </button>
              </div>
            </div>
            <div className="mt-2">
              <strong>Actresses:</strong> {parsedData.actresses.join(', ')}
            </div>
            <div className="mt-2">
              <strong>Actors:</strong> {parsedData.actors.join(', ')}
            </div>
            
            {/* R18.dev Cast Information */}
            {parsedData.rawData && isR18JsonFormat(parsedData.rawData) && (
              <div className="mt-4 p-3 border rounded-lg bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800">
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="font-medium text-indigo-900 dark:text-indigo-100">Cast Details</h4>
                  <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium bg-indigo-100 dark:bg-indigo-900/30 px-2 py-1 rounded">
                    R18.dev Format
                  </span>
                </div>
                
                {(() => {
                  try {
                    const r18Data = JSON.parse(parsedData.rawData)
                    return (
                      <div className="space-y-3">
                        {r18Data.actresses && r18Data.actresses.length > 0 && (
                          <div>
                            <strong className="text-sm text-indigo-800">Actresses:</strong>
                            <div className="mt-1 space-y-1">
                              {r18Data.actresses.map((actress: any, index: number) => (
                                <div key={index} className="text-xs text-indigo-700 bg-indigo-100 p-2 rounded">
                                  <div><strong>Romaji:</strong> {actress.name_romaji}</div>
                                  <div><strong>Kanji:</strong> {actress.name_kanji}</div>
                                  <div><strong>Kana:</strong> {actress.name_kana}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {r18Data.actors && r18Data.actors.length > 0 && (
                          <div>
                            <strong className="text-sm text-indigo-800">Actors:</strong>
                            <div className="mt-1 space-y-1">
                              {r18Data.actors.map((actor: any, index: number) => (
                                <div key={index} className="text-xs text-indigo-700 bg-indigo-100 p-2 rounded">
                                  <div><strong>Romaji:</strong> {actor.name_romaji}</div>
                                  <div><strong>Kanji:</strong> {actor.name_kanji}</div>
                                  <div><strong>Kana:</strong> {actor.name_kana}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {r18Data.directors && r18Data.directors.length > 0 && (
                          <div>
                            <strong className="text-sm text-indigo-800">Directors:</strong>
                            <div className="mt-1 space-y-1">
                              {r18Data.directors.map((director: any, index: number) => (
                                <div key={index} className="text-xs text-indigo-700 bg-indigo-100 p-2 rounded">
                                  <div><strong>Romaji:</strong> {director.name_romaji}</div>
                                  <div><strong>Kanji:</strong> {director.name_kanji}</div>
                                  <div><strong>Kana:</strong> {director.name_kana}</div>
                                  <div className="mt-1 text-xs text-indigo-600">
                                    <strong>Used for matching:</strong> {parsedData.director}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Series Information */}
                        {(r18Data.series_name_en || r18Data.series_name_ja) && (
                          <div>
                            <strong className="text-sm text-indigo-800">Series:</strong>
                            <div className="mt-1 text-xs text-indigo-700 bg-indigo-100 p-2 rounded">
                              <div><strong>English:</strong> {r18Data.series_name_en}</div>
                              <div><strong>Japanese:</strong> {r18Data.series_name_ja}</div>
                              <div className="mt-1 text-xs text-indigo-600">
                                <strong>Used for matching:</strong> {parsedData.series}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Label Information */}
                        {(r18Data.label_name_en || r18Data.label_name_ja) && (
                          <div>
                            <strong className="text-sm text-indigo-800">Label:</strong>
                            <div className="mt-1 text-xs text-indigo-700 bg-indigo-100 p-2 rounded">
                              <div><strong>English:</strong> {r18Data.label_name_en}</div>
                              <div><strong>Japanese:</strong> {r18Data.label_name_ja}</div>
                              <div className="mt-1 text-xs text-indigo-600">
                                <strong>Used for matching:</strong> {parsedData.label}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  } catch (error) {
                    return null
                  }
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Database Matching Results */}
      {matchedData && (
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-4">Database Matching Results</h3>
          <div className="space-y-6">
            {renderMatchedItems(matchedData.actresses, 'Actresses', 'actresses')}
            {renderMatchedItems(matchedData.actors, 'Actors', 'actors')}
            {renderMatchedItems(matchedData.directors, 'Directors', 'directors')}
            {renderMatchedItems(matchedData.studios, 'Studios', 'studios')}
            {renderMatchedItems(matchedData.series, 'Series', 'series')}
            {renderMatchedItems(matchedData.labels, 'Labels', 'labels')}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {parsedData && matchedData && (
        <div className="flex justify-end space-x-4">
          <button
            onClick={onCancel}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Save Movie
          </button>
        </div>
      )}

      {/* Master Data Form */}
      {showMasterDataForm && (
        <MasterDataForm
          type={showMasterDataForm.type}
          initialName={showMasterDataForm.name}
          accessToken={accessToken}
          onSave={handleMasterDataSave}
          onCancel={() => setShowMasterDataForm(null)}
          r18Data={showMasterDataForm.r18Data}
        />
      )}

      {/* Multiple Match Selector */}
      {showMultipleMatchSelector && (
        <MultipleMatchSelector
          isOpen={true}
          onClose={() => setShowMultipleMatchSelector(null)}
          onSelect={handleMultipleMatchSelect}
          matches={showMultipleMatchSelector.matches}
          searchName={showMultipleMatchSelector.searchName}
          type={showMultipleMatchSelector.type}
        />
      )}

      {/* English Name Selector */}
      {showEnglishNameSelector && matchedData && (
        <EnglishNameSelector
          isOpen={true}
          onClose={() => setShowEnglishNameSelector(null)}
          onSelect={handleEnglishNameSelect}
          matches={showEnglishNameSelector.matches}
          searchName={showEnglishNameSelector.searchName}
          type={showEnglishNameSelector.type}
          parsedEnglishName={matchedData[showEnglishNameSelector.type === 'actress' ? 'actresses' : 
            showEnglishNameSelector.type === 'actor' ? 'actors' :
            showEnglishNameSelector.type === 'director' ? 'directors' :
            showEnglishNameSelector.type === 'studio' ? 'studios' : 'series'][showEnglishNameSelector.index]?.parsedEnglishName}
        />
      )}

      {/* Japanese Name Matcher */}
      {showJapaneseNameMatcher && (
        <JapaneseNameMatcher
          isOpen={true}
          onClose={() => setShowJapaneseNameMatcher(null)}
          onSelect={handleJapaneseNameMatchSelect}
          matches={showJapaneseNameMatcher.matches}
          searchName={showJapaneseNameMatcher.searchName}
          type={showJapaneseNameMatcher.type}
          parsedEnglishName={showJapaneseNameMatcher.parsedEnglishName}
          availableEnglishNames={showJapaneseNameMatcher.availableEnglishNames}
        />
      )}

      {/* Movie Title Matcher */}
      {showMovieTitleMatcher && (
        <MovieTitleMatcher
          isOpen={true}
          onClose={() => setShowMovieTitleMatcher(null)}
          onSelect={handleMovieTitleMatchSelect}
          matches={showMovieTitleMatcher.matches}
          searchName={showMovieTitleMatcher.searchName}
          parsedEnglishTitle={showMovieTitleMatcher.parsedEnglishTitle}
          movieCode={showMovieTitleMatcher.movieCode}
        />
      )}

      {/* Duplicate Movie Warning */}
      {showDuplicateWarning && (
        <DuplicateMovieWarning
          isOpen={true}
          onClose={handleCancelDuplicate}
          onContinue={handleContinueWithDuplicate}
          onMerge={handleMergeData}
          existingMovie={showDuplicateWarning.existingMovie}
          newMovieCode={showDuplicateWarning.newMovieCode}
        />
      )}

    </div>
  )
}
