import React, { useState, useEffect } from 'react'
import { parseMovieData, matchWithDatabase, convertToMovie, checkDuplicateMovieCode, generateDmcode, analyzeDmcodePatterns, ParsedMovieData, MatchedData } from '../utils/movieDataParser'
import { MasterDataItem } from '../utils/masterDataApi'
import { Movie } from '../utils/movieApi'
import { masterDataApi } from '../utils/masterDataApi'
import { MasterDataForm } from './MasterDataForm'
import { MultipleMatchSelector } from './MultipleMatchSelector'
import { DuplicateMovieWarning } from './DuplicateMovieWarning'
import { useTemplateAutoApply } from './useTemplateAutoApply'

interface MovieDataParserProps {
  accessToken: string
  onSave: (movie: Movie) => void
  onCancel: () => void
}

export function MovieDataParser({ accessToken, onSave, onCancel }: MovieDataParserProps) {
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

  // Template auto-apply hook
  const { applyDefaultTemplate, isLoading: templateLoading } = useTemplateAutoApply({
    accessToken,
    onTemplateApplied: (template, appliedFields) => {
      setAppliedTemplate({
        templateName: template.name,
        appliedFields
      })
      // Auto hide notification after 5 seconds
      setTimeout(() => setAppliedTemplate(null), 5000)
    }
  })

  // Load master data on component mount
  useEffect(() => {
    loadMasterData()
  }, [])

  // Auto-apply template when movie type changes and we have parsed data
  useEffect(() => {
    if (movieType && parsedData && dmcode && !templateLoading) {
      console.log('🎬 Auto-applying template on type change for type:', movieType)
      
      // Set crop cover based on type
      setCropCover(shouldEnableAutoCrop(movieType))
      
      applyTemplateForType(movieType)
    }
  }, [movieType, parsedData, dmcode, templateLoading])

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
        
        // Auto-apply template after parsing and matching is complete
        if (movieType && generatedDmcode) {
          console.log('🎬 Auto-applying template after parse for type:', movieType)
          
          // Set crop cover based on type
          setCropCover(shouldEnableAutoCrop(movieType))
          
          await applyTemplateForType(movieType)
        }
      })
    } catch (error) {
      console.error('Error parsing data:', error)
      setError('Error parsing data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = () => {
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

  const translateTitle = async () => {
    if (!parsedData?.titleJp) return
    
    setTranslatingTitle(true)
    try {
      const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(parsedData.titleJp)}&langpair=ja|en`)
      const data = await response.json()
      
      if (data.responseStatus === 200 && data.responseData?.translatedText) {
        setTitleEn(data.responseData.translatedText)
      } else {
        setError('Failed to translate title')
      }
    } catch (error) {
      console.error('Translation error:', error)
      setError('Failed to translate title')
    } finally {
      setTranslatingTitle(false)
    }
  }

  // Apply template when movie type changes
  const applyTemplateForType = async (type: string) => {
    if (!parsedData || !dmcode) return

    console.log('🎬 Applying template for type:', type)
    
    const result = await applyDefaultTemplate({
      type: type,
      dmcode: dmcode,
      currentCover: cover,
      currentGallery: gallery
    })
    
    if (result) {
      console.log('✅ Template applied:', result)
      if (result.cover) setCover(result.cover)
      if (result.gallery) setGallery(result.gallery)
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
    
    // Set crop cover based on type
    setCropCover(shouldEnableAutoCrop(newType))
    
    // Apply template for the new type
    if (parsedData && dmcode) {
      await applyTemplateForType(newType)
    }
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
                      ✓ Matched: {item.matched.name}
                      {item.matched.jpname && ` (${item.matched.jpname})`}
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
                <input
                  type="text"
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  placeholder="English title (auto-translated or manual)"
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={translateTitle}
                  disabled={translatingTitle || !parsedData.titleJp}
                  className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Translate from Japanese"
                >
                  {translatingTitle ? 'Translating...' : 'Translate'}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <strong>Movie Type:</strong>
                <select
                  value={movieType}
                  onChange={(e) => handleMovieTypeChange(e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              </div>
            </div>
            
            {/* Cover and Gallery Templates */}
            {(cover || gallery) && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Template Applied</h4>
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
                <input
                  type="text"
                  value={dmcode}
                  onChange={(e) => setDmcode(e.target.value)}
                  placeholder="Auto-generated dmcode"
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
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
          existingMovie={showDuplicateWarning.existingMovie}
          newMovieCode={showDuplicateWarning.newMovieCode}
        />
      )}
    </div>
  )
}
