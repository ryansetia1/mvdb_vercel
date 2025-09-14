import React, { useState } from 'react'
import { MasterDataItem } from '../utils/masterDataApi'
import { X, Check, User, Calendar, Film } from 'lucide-react'

interface EnglishNameSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (selectedItem: MasterDataItem) => void
  matches: MasterDataItem[]
  searchName: string
  type: string
  parsedEnglishName?: string
}

export function EnglishNameSelector({
  isOpen,
  onClose,
  onSelect,
  matches,
  searchName,
  type,
  parsedEnglishName
}: EnglishNameSelectorProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  if (!isOpen) return null

  const handleSelect = () => {
    const selectedOption = englishNameOptions[selectedIndex]
    if (selectedOption) {
      console.log('=== EnglishNameSelector handleSelect ===')
      console.log('Selected option:', selectedOption)
      console.log('Selected index:', selectedIndex)
      console.log('Available options:', englishNameOptions)
      
      if (selectedOption.isParsed) {
        // Create a temporary match object with the parsed English name
        const tempMatch = {
          ...matches[0],
          name: selectedOption.name,
          titleEn: selectedOption.name
        }
        console.log('Using parsed name, temp match:', tempMatch)
        onSelect(tempMatch)
      } else {
        // Ensure the selected name is used, even for database matches
        const matchWithSelectedName = {
          ...selectedOption.match!,
          name: selectedOption.name,
          titleEn: selectedOption.name
        }
        console.log('Using database name, match with selected name:', matchWithSelectedName)
        onSelect(matchWithSelectedName)
      }
      
      console.log('=== End EnglishNameSelector handleSelect ===')
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

  // Create options for English name selection
  const englishNameOptions = []
  
  // Option 1: Database English name (prioritize this as first option)
  if (matches.length > 0) {
    const dbMatch = matches[0]
    const dbEnglishName = dbMatch.name || dbMatch.titleEn
    if (dbEnglishName) {
      englishNameOptions.push({
        name: dbEnglishName,
        source: 'Database',
        description: 'From MVDB database',
        isParsed: false,
        match: dbMatch
      })
    }
  }
  
  // Option 2: Parsed English name (if different from database)
  if (parsedEnglishName) {
    const dbEnglishName = matches.length > 0 ? (matches[0].name || matches[0].titleEn) : ''
    if (parsedEnglishName !== dbEnglishName) {
      englishNameOptions.push({
        name: parsedEnglishName,
        source: 'Parsed Data',
        description: 'From JAVDB or source data',
        isParsed: true
      })
    }
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
            Choose English Name for "{searchName}"
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          The English name differs between parsed data and database. Please select which one to use:
        </p>

        <div className="space-y-3 mb-6">
          {englishNameOptions.map((option, index) => (
            <div
              key={index}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedIndex === index
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              onClick={() => setSelectedIndex(index)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="flex-shrink-0 mt-1">
                    {getTypeIcon(type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-medium text-lg text-blue-600 dark:text-blue-400">
                        {option.name}
                      </h4>
                      {selectedIndex === index && (
                        <Check className="h-4 w-4 text-blue-500" />
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
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSelect}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Check className="h-4 w-4" />
            <span>Use This English Name</span>
          </button>
        </div>
      </div>
    </div>
  )
}
