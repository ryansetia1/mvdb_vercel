import React from 'react'
import { X, Check, Database, Globe } from 'lucide-react'

interface DatabaseVsR18ComparisonProps {
  isOpen: boolean
  onClose: () => void
  onSelectDatabase: () => void
  onSelectR18: () => void
  onCancel: () => void
  databaseName: string
  r18Name: string
  type: 'actress' | 'actor' | 'director' | 'studio' | 'series' | 'label'
  searchName: string
}

export function DatabaseVsR18Comparison({
  isOpen,
  onClose,
  onSelectDatabase,
  onSelectR18,
  onCancel,
  databaseName,
  r18Name,
  type,
  searchName
}: DatabaseVsR18ComparisonProps) {
  if (!isOpen) return null

  const getTypeIcon = (itemType: string) => {
    switch (itemType) {
      case 'actress':
      case 'actor':
        return <Check className="h-4 w-4" />
      case 'director':
        return <Check className="h-4 w-4" />
      case 'studio':
        return <Check className="h-4 w-4" />
      case 'series':
        return <Check className="h-4 w-4" />
      case 'label':
        return <Check className="h-4 w-4" />
      default:
        return <Check className="h-4 w-4" />
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

  const handleClose = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onClose()
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
        className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {getTypeLabel(type)} Name Comparison for "{searchName}"
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          The {getTypeLabel(type).toLowerCase()} name differs between database and R18 data. Please choose which one to use:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Database Option */}
          <div className="border border-blue-200 dark:border-blue-700 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
            <div className="flex items-center gap-2 mb-3">
              <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="font-medium text-blue-800 dark:text-blue-200">Database Name</span>
            </div>
            <div className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
              {databaseName}
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-300 mb-4">
              This is the current name in your MVDB database
            </div>
            <button
              onClick={onSelectDatabase}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <Check className="h-4 w-4" />
              Use Database Name
            </button>
          </div>

          {/* R18 Option */}
          <div className="border border-green-200 dark:border-green-700 rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span className="font-medium text-green-800 dark:text-green-200">R18 Data</span>
            </div>
            <div className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
              {r18Name}
            </div>
            <div className="text-sm text-green-700 dark:text-green-300 mb-4">
              This is the name from R18.dev source data
            </div>
            <button
              onClick={onSelectR18}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
            >
              <Check className="h-4 w-4" />
              Use R18 Name
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
