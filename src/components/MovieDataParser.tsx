import React, { useState, useEffect, useRef } from 'react'
import { parseMovieData, matchWithDatabase, convertToMovie, checkDuplicateMovieCode, generateDmcode, analyzeDmcodePatterns, mergeMovieData, ParsedMovieData, MatchedData } from '../utils/movieDataParser'
import { MasterDataItem } from '../utils/masterDataApi'
import { Movie } from '../utils/movieApi'
import { masterDataApi } from '../utils/masterDataApi'
import { MasterDataForm } from './MasterDataForm'
import { MultipleMatchSelector } from './MultipleMatchSelector'
import { DuplicateMovieWarning } from './DuplicateMovieWarning'
import { useTemplateAutoApply } from './useTemplateAutoApply'
import { mergeMovieData as mergeMovieApi } from '../utils/movieMergeApi'
import { translateJapaneseToEnglishWithContext, translateMovieTitleWithContext } from '../utils/deepseekTranslationApi'
import { AITranslationLoading, AITranslationSpinner } from './AITranslationLoading'
import { ShimmerInput } from './ShimmerInput'
import { Brain, Clipboard } from 'lucide-react'
import { toast } from 'sonner'

interface MovieDataParserProps {
  accessToken: string
  onSave: (movie: Movie) => void
  onCancel: () => void
  existingMovie?: Movie
}

export function MovieDataParser({ accessToken, onSave, onCancel, existingMovie }: MovieDataParserProps) {
  const [rawData, setRawData] = useState('')
  const [parsedData, setParsedData] = useState<ParsedMovieData | null>(null)
  const [matchedData, setMatchedData] = useState<MatchedData | null>(null)
  const [masterData, setMasterData] = useState<MasterDataItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showMasterDataForm, setShowMasterDataForm] = useState<{
    type: 'actor' | 'actress' | 'director' | 'studio' | 'series'
    index: number
    name: string
  } | null>(null)
  const [showMultipleMatchSelector, setShowMultipleMatchSelector] = useState<{
    type: 'actor' | 'actress' | 'director' | 'studio' | 'series'
    index: number
    searchName: string
    matches: MasterDataItem[]
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
  const [dmcodePatterns, setDmcodePatterns] = useState<Map<string, string>>(new Map())
  const [titleEn, setTitleEn] = useState('')
  const [movieType, setMovieType] = useState<string>('')
  const [availableTypes, setAvailableTypes] = useState<MasterDataItem[]>([])
  const [translatingTitle, setTranslatingTitle] = useState(false)
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
      if (existingMovie.dmcode) {
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
      const [actors, actresses, directors, studios, series, tags, groups, types] = await Promise.all([
        masterDataApi.getByType('actor', accessToken).catch(() => []),
        masterDataApi.getByType('actress', accessToken).catch(() => []),
        masterDataApi.getByType('director', accessToken).catch(() => []),
        masterDataApi.getByType('studio', accessToken).catch(() => []),
        masterDataApi.getByType('series', accessToken).catch(() => []),
        masterDataApi.getByType('tag', accessToken).catch(() => []),
        masterDataApi.getByType('group', accessToken).catch(() => []),
        masterDataApi.getByType('type', accessToken).catch(() => [])
      ])
      
      // Combine all master data
      const allMasterData = [...actors, ...actresses, ...directors, ...studios, ...series, ...tags, ...groups]
      
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
      
      // Set titleEn from parsed data if available
      setTitleEn(parsed.titleEn || '')
      
      // Generate dmcode automatically
      const generatedDmcode = generateDmcode(parsed.code, parsed.studio)
      setDmcode(generatedDmcode)
      console.log('Generated dmcode:', generatedDmcode, 'for code:', parsed.code, 'studio:', parsed.studio)
      
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
      }
      
      // Match with database
      matchWithDatabase(parsed, masterData).then(async (matched) => {
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

  const handleSave = async () => {
    if (!parsedData || !matchedData) return

    // Check if we're in merge mode
    if (mergeMode?.isActive) {
      try {
        setLoading(true)
        
        // Create updated parsed data with dmcode, titleEn, and movieType
        const updatedParsedData = {
          ...parsedData,
          dmcode: dmcode,
          titleEn: titleEn
        }

        const newMovieData = convertToMovie(updatedParsedData, matchedData, ignoredItems)
        // Override movie type with user selection and add cover/gallery
        newMovieData.type = movieType
        newMovieData.cover = cover
        newMovieData.gallery = gallery
        newMovieData.cropCover = cropCover

        // Merge with existing movie data
        const mergedMovie = { ...mergeMode.existingMovie }
        
        // Update fields with new data (only if new data exists)
        if (newMovieData.titleEn) mergedMovie.titleEn = newMovieData.titleEn
        if (newMovieData.releaseDate) mergedMovie.releaseDate = newMovieData.releaseDate
        if (newMovieData.duration) mergedMovie.duration = newMovieData.duration
        
        // Update director using matched data
        if (matchedData.directors && matchedData.directors.length > 0) {
          const matchedDirector = matchedData.directors[0]
          if (matchedDirector.matched && !ignoredItems.has('directors-0')) {
            const directorName = matchedDirector.matched.name || matchedDirector.matched.jpname || matchedDirector.name
            if (directorName && directorName.trim()) {
              mergedMovie.director = directorName
            }
          }
        }
        
        // Update studio using matched data
        if (matchedData.studios && matchedData.studios.length > 0) {
          const matchedStudio = matchedData.studios[0]
          if (matchedStudio.matched && !ignoredItems.has('studios-0')) {
            const studioName = matchedStudio.matched.name || matchedStudio.matched.jpname || matchedStudio.name
            if (studioName && studioName.trim()) {
              mergedMovie.studio = studioName
            }
          }
        }
        
        // Update series using matched data
        if (matchedData.series && matchedData.series.length > 0) {
          const matchedSeries = matchedData.series[0]
          if (matchedSeries.matched && !ignoredItems.has('series-0')) {
            const seriesName = matchedSeries.matched.titleEn || matchedSeries.matched.titleJp || matchedSeries.name
            if (seriesName && seriesName.trim()) {
              mergedMovie.series = seriesName
            }
          }
        }
        
        // Merge actresses and actors using matched data (only add new ones, don't duplicate)
        if (matchedData.actresses && matchedData.actresses.length > 0) {
          const existingActresses = mergedMovie.actress ? mergedMovie.actress.split(',').map(a => a.trim()).filter(a => a) : []
          
          // Get matched actress names (prefer English name, fallback to Japanese)
          const matchedActressNames = matchedData.actresses
            .filter(item => item.matched && !ignoredItems.has(`actresses-${matchedData.actresses.indexOf(item)}`))
            .map(item => item.matched!.name || item.matched!.jpname || item.name)
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
          
          // Get matched actor names (prefer English name, fallback to Japanese)
          const matchedActorNames = matchedData.actors
            .filter(item => item.matched && !ignoredItems.has(`actors-${matchedData.actors.indexOf(item)}`))
            .map(item => item.matched!.name || item.matched!.jpname || item.name)
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
            selectedFields: Object.keys(newMovieData).filter(key => 
              newMovieData[key as keyof typeof newMovieData] && 
              key !== 'id' && 
              key !== 'createdAt' && 
              key !== 'updatedAt'
            )
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
      
      const updatedParsedData = {
        ...parsedData,
        dmcode: dmcode,
        titleEn: titleEn
      }

      const movie = convertToMovie(updatedParsedData, matchedData, ignoredItems)
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
      setTitleEn('')
      setMovieType('')
      setCover('')
      setGallery('')
      setCropCover(false)
      setAppliedTemplate(null)
      setMergeMode(null)
      
      console.log('Form reset completed')
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

    const movie = convertToMovie(updatedParsedData, matchedData, ignoredItems)
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
    if (existingMovie.dmcode) {
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
    // Auto-crop for all types except "Un" (uncensored)
    return type.toLowerCase() !== 'un'
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
    return ignoredItems.has(itemKey)
  }

  const handleConfirmMatch = (type: keyof MatchedData, index: number, confirmed: boolean) => {
    if (!matchedData) return

    const newMatchedData = { ...matchedData }
    const item = newMatchedData[type][index]
    item.needsConfirmation = !confirmed
    
    setMatchedData(newMatchedData)
  }

  const handleAddToDatabase = (type: keyof MatchedData, index: number) => {
    if (!matchedData) return

    const item = matchedData[type][index]
    if (!item || item.matched) return

    // Determine master data type
    let masterDataType: 'actor' | 'actress' | 'director' | 'studio' | 'series'
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
      default:
        return
    }

    // Show master data form
    setShowMasterDataForm({
      type: masterDataType,
      index,
      name: item.name
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
                    <div className="text-sm text-green-600">
                      ✓ Matched: {item.matched!.name}
                      {item.matched!.jpname && ` (${item.matched!.jpname})`}
                      {item.multipleMatches.length > 1 && (
                        <div className="text-xs text-blue-600 mt-1">
                          +{item.multipleMatches.length - 1} other matches found
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
                        <button
                          onClick={() => {
                            let type: 'actor' | 'actress' | 'director' | 'studio' | 'series'
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
                              default:
                                return
                            }
                            setShowMultipleMatchSelector({
                              type,
                              index,
                              searchName: item.name,
                              matches: item.multipleMatches
                            })
                          }}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 font-medium shadow-sm"
                        >
                          View All Matches ({item.multipleMatches.length})
                        </button>
                      )}
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={!item.needsConfirmation}
                          onChange={(e) => handleConfirmMatch(typeKey, index, e.target.checked)}
                          className="mr-2"
                        />
                        Confirm
                      </label>
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
              </div>
              
              {/* Cast & Crew */}
              <div className="space-y-2">
                <h4 className="font-medium text-blue-700 dark:text-blue-300">Cast & Crew</h4>
                {matchedData.actresses && matchedData.actresses.length > 0 && (
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Actresses:</span>
                    <div className="mt-1 space-y-1">
                      {matchedData.actresses
                        .filter(item => item.matched && !ignoredItems.has(`actresses-${matchedData.actresses.indexOf(item)}`))
                        .map((item, index) => {
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
                        .filter(item => item.matched && !ignoredItems.has(`actors-${matchedData.actors.indexOf(item)}`))
                        .map((item, index) => {
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
                      mergeMode?.isActive && mergeMode.existingMovie.dmcode && dmcode === mergeMode.existingMovie.dmcode
                        ? 'border-green-300 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-300'
                    }`}
                  />
                  {mergeMode?.isActive && mergeMode.existingMovie.dmcode && dmcode === mergeMode.existingMovie.dmcode && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-green-600 dark:text-green-400 font-medium">
                      From DB
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    const regenerated = generateDmcode(parsedData.code, parsedData.studio)
                    setDmcode(regenerated)
                  }}
                  className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                  title="Regenerate dmcode"
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
