import React, { useState, useEffect } from 'react'
import { MasterDataItem } from '../utils/masterDataApi'
import { X, Check, User, Calendar, Film, Building, Tag, BookOpen } from 'lucide-react'

interface JapaneseNameMatcherProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (selectedItem: MasterDataItem, englishName?: string) => void
  matches: MasterDataItem[]
  searchName: string
  type: 'actor' | 'actress' | 'director' | 'studio' | 'series' | 'label'
  parsedEnglishName?: string
  availableEnglishNames?: string[] // English names from R18.dev
  title?: string // For movie titles
}

export function JapaneseNameMatcher({
  isOpen,
  onClose,
  onSelect,
  matches,
  searchName,
  type,
  parsedEnglishName,
  availableEnglishNames,
  title
}: JapaneseNameMatcherProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [selectedEnglishName, setSelectedEnglishName] = useState<string>('')

  useEffect(() => {
    if (matches.length > 0) {
      // Set default selection to first match
      setSelectedIndex(0)
      const firstMatch = matches[0]
      // Prefer parsed English name if available, otherwise use database name
      setSelectedEnglishName(parsedEnglishName || firstMatch.name || firstMatch.titleEn || '')
    }
  }, [matches, parsedEnglishName])

  if (!isOpen) return null

  const handleSelect = () => {
    const selectedMatch = matches[selectedIndex]
    if (selectedMatch) {
      onSelect(selectedMatch, selectedEnglishName)
    }
  }

  const handleClose = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onClose()
  }

  const getTypeIcon = (itemType: string) => {
    switch (itemType) {
      case 'actress':
      case 'actor':
        return <User className="h-4 w-4" />
      case 'director':
        return <Film className="h-4 w-4" />
      case 'studio':
        return <Building className="h-4 w-4" />
      case 'series':
        return <BookOpen className="h-4 w-4" />
      case 'label':
        return <Tag className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  const getTypeLabel = (itemType: string) => {
    switch (itemType) {
      case 'actress':
        return 'Actress'
      case 'actor':
        return 'Actor'
      case 'director':
        return 'Director'
      case 'studio':
        return 'Studio'
      case 'series':
        return 'Series'
      case 'label':
        return 'Label'
      default:
        return 'Item'
    }
  }

  const formatAge = (birthdate: string | undefined) => {
    if (!birthdate) return 'Unknown'
    const birth = new Date(birthdate)
    const today = new Date()
    const age = today.getFullYear() - birth.getFullYear()
    return `${age} tahun`
  }

  const getEnglishNameOptions = (match: MasterDataItem) => {
    const options = []
    
    // Database English name
    const dbEnglishName = match.name || match.titleEn
    
    if (dbEnglishName) {
      options.push({
        name: dbEnglishName,
        source: 'Database',
        description: `From MVDB database`,
        isDefault: true
      })
    }
    
    // Parsed English name (if different from database)
    if (parsedEnglishName && parsedEnglishName !== dbEnglishName) {
      options.push({
        name: parsedEnglishName,
        source: 'Parsed Data',
        description: 'From source data (JAVDB, etc.)',
        isParsed: true
      })
    }
    
    
    // Available English names from R18.dev (if different from database and parsed)
    if (availableEnglishNames && availableEnglishNames.length > 0) {
      availableEnglishNames.forEach(r18Name => {
        if (r18Name !== dbEnglishName && r18Name !== parsedEnglishName) {
          options.push({
            name: r18Name,
            source: 'R18.dev',
            description: 'From R18.dev data',
            isR18: true
          })
        }
      })
    }
    
    return options
  }

  const currentMatch = matches[selectedIndex]
  const englishNameOptions = currentMatch ? getEnglishNameOptions(currentMatch) : []

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose(e)
        }
      }}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            Japanese Name Matching for "{searchName}"
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Found {matches.length} {getTypeLabel(type)} with similar Japanese names. Please select the correct one and choose the best English name:
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left side: Japanese name matches */}
          <div>
            <h4 className="font-medium mb-3 text-gray-700 dark:text-gray-300">
              Select Japanese Name Match:
            </h4>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {matches.map((match, index) => (
                <div
                  key={match.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedIndex === index
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                  onClick={() => {
                    setSelectedIndex(index)
                    const englishName = match.name || match.titleEn || ''
                    setSelectedEnglishName(englishName)
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getTypeIcon(match.type)}
                        <span className="font-medium text-lg">
                          {match.name || match.titleEn || 'No English Name'}
                        </span>
                        {selectedIndex === index && (
                          <Check className="h-5 w-5 text-blue-500" />
                        )}
                      </div>
                      
                      {/* Japanese names */}
                      <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        {match.jpname && (
                          <div>Japanese: {match.jpname}</div>
                        )}
                        {match.kanjiName && (
                          <div>Kanji: {match.kanjiName}</div>
                        )}
                        {match.kanaName && (
                          <div>Kana: {match.kanaName}</div>
                        )}
                        {match.titleJp && (
                          <div>Japanese Title: {match.titleJp}</div>
                        )}
                      </div>

                      {match.alias && (
                        <div className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                          Alias: {match.alias}
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-2">
                        {match.birthdate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatAge(match.birthdate)}
                          </div>
                        )}
                        
                        {match.movieCount !== undefined && (
                          <div className="flex items-center gap-1">
                            <Film className="h-3 w-3" />
                            {match.movieCount} movies
                          </div>
                        )}
                      </div>

                      {match.tags && match.tags.length > 0 && (
                        <div className="mt-2">
                          <div className="flex flex-wrap gap-1">
                            {match.tags.slice(0, 3).map((tag, tagIndex) => (
                              <span
                                key={tagIndex}
                                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded"
                              >
                                {tag}
                              </span>
                            ))}
                            {match.tags.length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded">
                                +{match.tags.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right side: English name selection */}
          <div>
            <h4 className="font-medium mb-3 text-gray-700 dark:text-gray-300">
              Choose English Name:
            </h4>
            {currentMatch && (
              <div className="space-y-3">
                {englishNameOptions.map((option, index) => (
                  <div
                    key={index}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedEnglishName === option.name
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                    onClick={() => setSelectedEnglishName(option.name)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-lg text-green-600 dark:text-green-400">
                            {option.name}
                          </span>
                          {selectedEnglishName === option.name && (
                            <Check className="h-5 w-5 text-green-500" />
                          )}
                        </div>
                        
                        <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                          <div>
                            <span className="font-medium">Source:</span> {option.source}
                          </div>
                          <div>
                            <span className="font-medium">Description:</span> {option.description}
                          </div>
                          {option.isParsed && (
                            <div className="text-green-600 dark:text-green-400">
                              ✓ This translation might be more accurate
                            </div>
                          )}
                          {option.isDefault && (
                            <div className="text-blue-600 dark:text-blue-400">
                              ✓ This is the current database name
                            </div>
                          )}
                          {option.isR18 && (
                            <div className="text-purple-600 dark:text-purple-400">
                              ✓ This is from R18.dev data
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Custom English name input */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Or enter custom English name:
                  </label>
                  <input
                    type="text"
                    value={selectedEnglishName}
                    onChange={(e) => setSelectedEnglishName(e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Enter English name..."
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSelect}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 cursor-pointer"
          >
            <Check className="h-4 w-4" />
            Select This {getTypeLabel(type)}
          </button>
        </div>
      </div>
    </div>
  )
}
