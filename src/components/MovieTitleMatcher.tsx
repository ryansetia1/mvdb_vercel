import React, { useState, useEffect } from 'react'
import { MasterDataItem } from '../utils/masterDataApi'
import { X, Check, Film, BookOpen } from 'lucide-react'

interface MovieTitleMatcherProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (selectedItem: MasterDataItem, englishTitle?: string) => void
  matches: MasterDataItem[]
  searchName: string
  parsedEnglishTitle?: string
  movieCode?: string
}

export function MovieTitleMatcher({
  isOpen,
  onClose,
  onSelect,
  matches,
  searchName,
  parsedEnglishTitle,
  movieCode
}: MovieTitleMatcherProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [selectedEnglishTitle, setSelectedEnglishTitle] = useState<string>('')

  useEffect(() => {
    if (matches.length > 0) {
      // Set default selection to first match
      setSelectedIndex(0)
      const firstMatch = matches[0]
      setSelectedEnglishTitle(firstMatch.titleEn || firstMatch.name || '')
    }
  }, [matches])

  if (!isOpen) return null

  const handleSelect = () => {
    const selectedMatch = matches[selectedIndex]
    if (selectedMatch) {
      onSelect(selectedMatch, selectedEnglishTitle)
    }
  }

  const handleClose = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onClose()
  }

  const getEnglishTitleOptions = (match: MasterDataItem) => {
    const options = []
    
    // Database English title
    const dbEnglishTitle = match.titleEn || match.name
    if (dbEnglishTitle) {
      options.push({
        title: dbEnglishTitle,
        source: 'Database',
        description: `From MVDB database`,
        isDefault: true
      })
    }
    
    // Parsed English title (if different from database)
    if (parsedEnglishTitle && parsedEnglishTitle !== dbEnglishTitle) {
      options.push({
        title: parsedEnglishTitle,
        source: 'Parsed Data',
        description: 'From source data (JAVDB, etc.)',
        isParsed: true
      })
    }
    
    return options
  }

  const currentMatch = matches[selectedIndex]
  const englishTitleOptions = currentMatch ? getEnglishTitleOptions(currentMatch) : []

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
        className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            Movie Title Matching for "{searchName}"
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Found {matches.length} movie(s) with similar titles. Please select the correct one and choose the best English title:
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left side: Movie title matches */}
          <div>
            <h4 className="font-medium mb-3 text-gray-700 dark:text-gray-300">
              Select Movie Match:
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
                    const englishTitle = match.titleEn || match.name || ''
                    setSelectedEnglishTitle(englishTitle)
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Film className="h-4 w-4" />
                        <span className="font-medium text-lg">
                          {match.titleEn || match.name || 'No English Title'}
                        </span>
                        {selectedIndex === index && (
                          <Check className="h-5 w-5 text-blue-500" />
                        )}
                      </div>
                      
                      {/* Japanese title */}
                      {match.titleJp && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Japanese: {match.titleJp}
                        </div>
                      )}

                      {/* Movie code if available */}
                      {movieCode && (
                        <div className="text-sm text-gray-500 dark:text-gray-500 mb-2">
                          Code: {movieCode}
                        </div>
                      )}

                      {/* Additional info */}
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-2">
                        {match.movieCount !== undefined && (
                          <div className="flex items-center gap-1">
                            <Film className="h-3 w-3" />
                            {match.movieCount} movies
                          </div>
                        )}
                      </div>

                      {/* Tags */}
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

          {/* Right side: English title selection */}
          <div>
            <h4 className="font-medium mb-3 text-gray-700 dark:text-gray-300">
              Choose English Title:
            </h4>
            {currentMatch && (
              <div className="space-y-3">
                {englishTitleOptions.map((option, index) => (
                  <div
                    key={index}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedEnglishTitle === option.title
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                    onClick={() => setSelectedEnglishTitle(option.title)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-lg text-green-600 dark:text-green-400">
                            {option.title}
                          </span>
                          {selectedEnglishTitle === option.title && (
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
                              ✓ This is the current database title
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Custom English title input */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Or enter custom English title:
                  </label>
                  <input
                    type="text"
                    value={selectedEnglishTitle}
                    onChange={(e) => setSelectedEnglishTitle(e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Enter English title..."
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
            Select This Movie
          </button>
        </div>
      </div>
    </div>
  )
}
