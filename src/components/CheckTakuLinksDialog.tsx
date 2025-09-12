import React, { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { ExternalLink, X, Plus, Search, Loader2 } from 'lucide-react'

interface CheckTakuLinksDialogProps {
  isOpen: boolean
  onClose: () => void
  jpname: string
  alias: string
  name?: string // Add name field as fallback
  selectedName?: string // Add selectedName prop
  onAddTakuLink: (url: string) => void
}

export function CheckTakuLinksDialog({ 
  isOpen, 
  onClose, 
  jpname, 
  alias, 
  name = '',
  selectedName = '',
  onAddTakuLink
}: CheckTakuLinksDialogProps) {
  const [selectedJapaneseName, setSelectedJapaneseName] = useState('')
  const [currentUrl, setCurrentUrl] = useState('')
  const [iframeError, setIframeError] = useState(false)
  const [iframeKey, setIframeKey] = useState(0) // Key untuk force reset iframe
  const [isLoading, setIsLoading] = useState(false) // Loading state untuk iframe reset

  // Extract Japanese names from jpname and alias
  const extractJapaneseNames = (text: string): string[] => {
    if (!text || !text.trim()) return []
    
    const names: string[] = []
    
    // First, extract complete names from parentheses (most reliable)
    const parenthesesMatches = text.match(/[（(]([^）)]+)[）)]/g)
    if (parenthesesMatches) {
      parenthesesMatches.forEach(match => {
        const name = match.replace(/[（()）]/g, '').trim()
        // Only add if it contains Japanese characters and is not just tags/descriptions
        if (name && /[ひらがなカタカナ一-龯]/.test(name) && !isTagOrDescription(name)) {
          names.push(name)
        }
      })
    }
    
    // Then extract main names (before parentheses)
    const mainText = text.replace(/[（(][^）)]*[）)]/g, '').trim()
    if (mainText) {
      // Split by common separators but be more careful
      const mainNames = mainText
        .split(/[,，、\s]+/)
        .map(name => name.trim())
        .filter(name => name.length > 0)
        .filter(name => {
          // Accept names that contain Japanese characters OR are valid romanized names
          const hasJapaneseChars = /[ひらがなカタカナ一-龯]/.test(name)
          const isRomanizedName = /^[A-Za-z\s]+$/.test(name) && name.length >= 2 && !isTagOrDescription(name)
          return (hasJapaneseChars || isRomanizedName) && !isTagOrDescription(name)
        })
      
      names.push(...mainNames)
    }
    
    // Remove duplicates and filter out very short names
    return [...new Set(names)].filter(name => name.length >= 2)
  }

  // Helper function to identify tags/descriptions vs actual names
  const isTagOrDescription = (text: string): boolean => {
    const tagPatterns = [
      /^[A-Z]{2,}$/, // All caps with 2+ chars (like MIRACLE, FC2)
      /^[a-z]{1,2}$/, // Single or double lowercase letters
      /^[0-9]+$/, // Numbers only
      /TV$/, // Ends with TV
      /動画$/, // Ends with 動画
      /ワイフ$/, // Ends with ワイフ
      /熱$/, // Ends with 熱
      /むすめ$/, // Ends with むすめ
      /^[あ-ん]{1,3}$/, // Short hiragana (1-3 chars, might be tags)
      /^[ア-ン]{1,3}$/, // Short katakana (1-3 chars, might be tags)
      /エッチ/, // Contains エッチ (erotic)
      /4610/, // Contains numbers like 4610
      /^[0-9]+[あ-ん]+$/, // Numbers followed by hiragana
      /^[あ-ん]+[0-9]+$/, // Hiragana followed by numbers
    ]
    
    return tagPatterns.some(pattern => pattern.test(text))
  }

  const japaneseNames = [
    ...extractJapaneseNames(jpname),
    ...extractJapaneseNames(alias)
  ].filter((name, index, array) => array.indexOf(name) === index) // Remove duplicates

  // Fallback to regular name if no Japanese names found
  const finalNames = japaneseNames.length > 0 ? japaneseNames : (name ? [name] : [])


  // Generate Taku Links URL
  const generateTakuLinksUrl = (name: string): string => {
    return `https://vlywlrlakyhvco.com/?q=${encodeURIComponent(name)}`
  }

  // Set default selected name when dialog opens
  useEffect(() => {
    if (isOpen && finalNames.length > 0) {
      // Jika ada selectedName dari event, gunakan itu, jika tidak gunakan default
      const nameToUse = selectedName || finalNames[0]
      setSelectedJapaneseName(nameToUse)
      setCurrentUrl(generateTakuLinksUrl(nameToUse))
      setIframeError(false) // Reset error state when dialog opens
      
    }
  }, [isOpen, finalNames, selectedName])

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedJapaneseName('')
      setCurrentUrl('')
      setIframeError(false)
      setIsLoading(false)
      setIframeKey(0)
      
    }
  }, [isOpen])

  const handleNameSelect = useCallback((name: string, event?: React.MouseEvent) => {
    console.log('Selecting name:', name)
    
    // Prevent event propagation to avoid closing parent dialogs
    if (event) {
      event.stopPropagation()
      event.preventDefault()
    }
    
    // Update the selected name and URL without closing dialog
    setSelectedJapaneseName(name)
    setCurrentUrl(generateTakuLinksUrl(name))
    setIframeError(false)
    setIsLoading(true)
    
    // Reset iframe after a short delay to show loading state
    setTimeout(() => {
      setIframeKey(prev => prev + 1)
      setIsLoading(false)
    }, 500)
  }, [])

  const handleAddTakuLink = () => {
    if (currentUrl) {
      onAddTakuLink(currentUrl)
      onClose()
    }
  }


  const handleOpenInNewTab = () => {
    if (currentUrl) {
      window.open(currentUrl, '_blank', 'noopener,noreferrer')
    }
  }

  const handleIframeError = () => {
    setIframeError(true)
  }

  if (!isOpen) return null

  return createPortal(
    <div 
      className="fixed inset-0 flex items-center justify-center bg-black/50"
      style={{ zIndex: 999999 }}
    >
      <div 
        className="bg-white dark:bg-gray-900 rounded-lg shadow-xl border w-[90vw] h-[85vh] flex flex-col overflow-hidden"
        style={{
          maxWidth: '90vw',
          maxHeight: '85vh',
          width: '90vw',
          height: '85vh',
          zIndex: 999999
        }}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Check Taku Links
              </h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="flex items-center gap-1"
            >
              <X className="h-4 w-4" />
              <span className="hidden sm:inline">Tutup</span>
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground mt-2">
            Dialog untuk mencari dan menambahkan Taku Links berdasarkan nama Jepang aktris. 
            Pilih dari chips nama Jepang yang tersedia atau tambahkan link yang sedang terbuka.
          </p>
          
          {/* Japanese Names Chips */}
          {finalNames.length > 1 ? (
            <div className="mt-3">
              <div className="text-sm text-muted-foreground mb-2">
                Pilih nama untuk dicari:
              </div>
              <div className="flex flex-wrap gap-2">
                {finalNames.map((name) => (
                  <Badge
                    key={name}
                    variant={selectedJapaneseName === name ? "default" : "outline"}
                    className={`cursor-pointer transition-colors ${
                      isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-100 dark:hover:bg-blue-900'
                    }`}
                    onClick={(e) => !isLoading && handleNameSelect(name, e)}
                  >
                    {selectedJapaneseName === name && isLoading ? (
                      <div className="flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        {name}
                      </div>
                    ) : (
                      name
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          ) : finalNames.length === 1 ? (
            <div className="mt-3">
              <div className="text-sm text-muted-foreground mb-2">
                Mencari dengan nama: <span className="font-medium">{finalNames[0]}</span>
              </div>
            </div>
          ) : (
            <div className="mt-3">
              <div className="text-sm text-muted-foreground mb-2">
                Menggunakan nama dari field "Nama" untuk pencarian.
              </div>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenInNewTab}
              className="flex items-center gap-1"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="hidden sm:inline">Buka di Tab Baru</span>
            </Button>
            <Button
              size="sm"
              onClick={handleAddTakuLink}
              className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Taku Link</span>
            </Button>
          </div>
        </div>
        
        {/* Iframe Content */}
        <div className="flex-1 overflow-hidden relative">
          {isLoading ? (
            <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-800">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Memuat pencarian untuk: {selectedJapaneseName}
                </p>
              </div>
            </div>
          ) : currentUrl && !iframeError ? (
            <iframe
              key={`${currentUrl}-${iframeKey}`} // Force complete reset when URL or key changes
              src={currentUrl}
              className="w-full h-full border-0"
              title={`Taku Links Search - ${selectedJapaneseName}`}
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation allow-downloads allow-modals"
              loading="lazy"
              referrerPolicy="no-referrer"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              onError={handleIframeError}
            />
          ) : iframeError ? (
            <div className="flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-gray-800">
              <div className="text-center p-8">
                <div className="text-6xl mb-4">⚠️</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Website Tidak Dapat Dimuat
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Website mengalami masalah loading atau memblokir iframe. 
                  Silakan buka di tab baru untuk mengakses konten.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button
                    onClick={handleOpenInNewTab}
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Buka di Tab Baru
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIframeError(false)}
                  >
                    Coba Lagi
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
        
        {/* Footer */}
        <div className="p-3 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          💡 <strong>Tips:</strong> Pilih nama Jepang yang berbeda untuk mencari variasi lain, atau klik "Add Taku Link" untuk menambahkan link yang sedang terbuka ke daftar Taku Links. Semua variasi akan otomatis ditambahkan saat menyimpan aktris.
          {iframeError && (
            <div className="mt-2 text-orange-600 dark:text-orange-400">
              ⚠️ <strong>Catatan:</strong> Error yang muncul di console adalah dari website eksternal dan tidak mempengaruhi fungsi aplikasi.
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
