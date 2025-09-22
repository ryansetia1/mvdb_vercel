import React from 'react'
import { Movie } from '../utils/movieApi'
import { AlertTriangle, X, Eye, Calendar, Clock, User, Film } from 'lucide-react'

interface DuplicateMovieWarningProps {
  isOpen: boolean
  onClose: () => void
  onContinue: () => void
  onMerge: () => void
  existingMovie: Movie
  newMovieCode: string
  matchType?: 'code' | 'title'
  matchScore?: number
}

export function DuplicateMovieWarning({
  isOpen,
  onClose,
  onContinue,
  onMerge,
  existingMovie,
  newMovieCode,
  matchType = 'code',
  matchScore
}: DuplicateMovieWarningProps) {
  if (!isOpen) return null

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown'
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return dateString
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
          </div>
          
          <div className="flex-1">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {matchType === 'title' ? 'Duplicate Movie Title Detected' : 'Duplicate Movie Code Detected'}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-300 mb-3">
                {matchType === 'title' ? (
                  <>
                    Movie title <span className="font-bold text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">{newMovieCode === 'No Code' ? 'matches existing movie' : newMovieCode}</span> already exists in the database.
                    {matchScore && (
                      <span className="ml-2 text-sm text-blue-600 font-medium">
                        (Match Score: {matchScore}/100)
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    Movie code <span className="font-mono font-bold text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">{newMovieCode}</span> already exists in the database.
                  </>
                )}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Anda dapat memilih untuk melengkapi data yang sudah ada dengan informasi baru, atau menambahkan movie baru.
              </p>
            </div>

            {/* Existing Movie Details */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6 border border-gray-200 dark:border-gray-600">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Eye className="h-4 w-4 text-blue-600" />
                Existing Movie Details
              </h4>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-600 dark:text-gray-400 w-20">Code:</span>
                  <span className="font-mono text-gray-900 dark:text-white">{existingMovie.code}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-600 dark:text-gray-400 w-20">Title:</span>
                  <span className="text-gray-900 dark:text-white">
                    {existingMovie.titleJp}
                    {existingMovie.titleEn && (
                      <span className="text-gray-500 dark:text-gray-400 ml-2">
                        ({existingMovie.titleEn})
                      </span>
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="font-medium text-gray-600 dark:text-gray-400 w-20">Release:</span>
                  <span className="text-gray-900 dark:text-white">{formatDate(existingMovie.releaseDate)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="font-medium text-gray-600 dark:text-gray-400 w-20">Duration:</span>
                  <span className="text-gray-900 dark:text-white">{existingMovie.duration || 'Unknown'}</span>
                </div>

                {existingMovie.actress && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-600 dark:text-gray-400 w-20">Actress:</span>
                    <span className="text-gray-900 dark:text-white">{existingMovie.actress}</span>
                  </div>
                )}

                {existingMovie.studio && (
                  <div className="flex items-center gap-2">
                    <Film className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-600 dark:text-gray-400 w-20">Studio:</span>
                    <span className="text-gray-900 dark:text-white">{existingMovie.studio}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 font-medium transition-colors"
              >
                Batal
              </button>
              <button
                onClick={onMerge}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium transition-colors shadow-sm"
              >
                <Eye className="h-4 w-4" />
                Lengkapi Data
              </button>
              <button
                onClick={onContinue}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 font-medium transition-colors shadow-sm"
              >
                <AlertTriangle className="h-4 w-4" />
                Tambah Baru
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
