import React, { useState } from 'react'
import { MasterDataItem } from '../utils/masterDataApi'
import { X, Check, User, Calendar, Film } from 'lucide-react'

interface MultipleMatchSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (selectedItem: MasterDataItem) => void
  matches: MasterDataItem[]
  searchName: string
  type: string
}

export function MultipleMatchSelector({
  isOpen,
  onClose,
  onSelect,
  matches,
  searchName,
  type
}: MultipleMatchSelectorProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  if (!isOpen) return null

  const handleSelect = () => {
    if (matches[selectedIndex]) {
      onSelect(matches[selectedIndex])
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
        return <Film className="h-4 w-4" />
      case 'series':
        return <Film className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  const formatAge = (birthdate: string | undefined) => {
    if (!birthdate) return 'Unknown'
    const birth = new Date(birthdate)
    const today = new Date()
    const age = today.getFullYear() - birth.getFullYear()
    return `${age} tahun`
  }

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
        className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            Multiple Matches Found for "{searchName}"
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Found {matches.length} {type} with similar names. Please select the correct one:
        </p>

        <div className="space-y-3 mb-6">
          {matches.map((match, index) => (
            <div
              key={match.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedIndex === index
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              }`}
              onClick={() => setSelectedIndex(index)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getTypeIcon(match.type)}
                    <span className="font-medium text-lg">{match.name}</span>
                    {selectedIndex === index && (
                      <Check className="h-5 w-5 text-blue-500" />
                    )}
                  </div>
                  
                  {match.jpname && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Japanese: {match.jpname}
                    </div>
                  )}

                  {match.alias && (
                    <div className="text-sm text-gray-500 dark:text-gray-500 mb-2">
                      Alias: {match.alias}
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
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
                        {match.tags.slice(0, 5).map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded"
                          >
                            {tag}
                          </span>
                        ))}
                        {match.tags.length > 5 && (
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded">
                            +{match.tags.length - 5} more
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

        <div className="flex justify-end gap-3" style={{ pointerEvents: 'auto' }}>
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
            Select This {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        </div>
      </div>
    </div>
  )
}
