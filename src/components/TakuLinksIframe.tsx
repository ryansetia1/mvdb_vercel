import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { ExternalLink, Search, Loader2, Plus } from 'lucide-react'

interface TakuLinksIframeProps {
  onTakuLinkSelect: (url: string) => void
  jpname?: string
  alias?: string
  name?: string
  className?: string
  autoSearch?: boolean // New prop for auto-search trigger
}

export function TakuLinksIframe({ 
  onTakuLinkSelect,
  jpname = '',
  alias = '',
  name = '',
  className = '',
  autoSearch = false
}: TakuLinksIframeProps) {
  const [selectedJapaneseName, setSelectedJapaneseName] = useState('')
  const [currentUrl, setCurrentUrl] = useState('')
  const [iframeError, setIframeError] = useState(false)
  const [iframeKey, setIframeKey] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [userSelectedName, setUserSelectedName] = useState('') // Track user selection separately

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

  // Set default selected name when component mounts (only if no user selection)
  useEffect(() => {
    if (finalNames.length > 0 && !userSelectedName) {
      const nameToUse = finalNames[0]
      setSelectedJapaneseName(nameToUse)
      setCurrentUrl(generateTakuLinksUrl(nameToUse))
      setIframeError(false)
    }
  }, [finalNames, userSelectedName])

  // Reset user selection when props change (new actress)
  useEffect(() => {
    setUserSelectedName('')
  }, [jpname, alias, name])

  // Auto-search effect - trigger search when autoSearch prop changes (only if no user selection)
  useEffect(() => {
    if (autoSearch && finalNames.length > 0 && !userSelectedName) {
      const nameToUse = finalNames[0]
      setSelectedJapaneseName(nameToUse)
      setCurrentUrl(generateTakuLinksUrl(nameToUse))
      setIframeError(false)
      setIsExpanded(true)
      setIsLoading(true)
      
      // Reset iframe after a short delay to show loading state
      setTimeout(() => {
        setIframeKey(prev => prev + 1)
        setIsLoading(false)
      }, 500)
    }
  }, [autoSearch, finalNames, userSelectedName])

  const handleNameSelect = (name: string) => {
    setUserSelectedName(name) // Mark as user selection
    setSelectedJapaneseName(name)
    setCurrentUrl(generateTakuLinksUrl(name))
    setIframeError(false)
    setIsExpanded(true)
    setIsLoading(true)
    
    // Reset iframe after a short delay to show loading state
    setTimeout(() => {
      setIframeKey(prev => prev + 1)
      setIsLoading(false)
    }, 500)
  }

  const handleAddTakuLink = () => {
    if (currentUrl) {
      onTakuLinkSelect(currentUrl)
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

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Controls */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">Taku Links Search</h4>
            <p className="text-sm text-muted-foreground">Cari dan tambahkan Taku Links berdasarkan nama Jepang aktris</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleOpenInNewTab()
            }}
            className="flex items-center gap-1"
          >
            <ExternalLink className="h-4 w-4" />
            <span className="hidden sm:inline">Buka di Tab Baru</span>
          </Button>
        </div>
        
        {/* Japanese Names Chips */}
        {finalNames.length > 1 ? (
          <div>
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
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    if (!isLoading) {
                      handleNameSelect(name)
                    }
                  }}
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
          <div>
            <div className="text-sm text-muted-foreground mb-2">
              Mencari dengan nama: <span className="font-medium">{finalNames[0]}</span>
            </div>
          </div>
        ) : (
          <div>
            <div className="text-sm text-muted-foreground mb-2">
              Menggunakan nama dari field "Nama" untuk pencarian.
            </div>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleOpenInNewTab}
            className="flex items-center gap-1"
          >
            <ExternalLink className="h-4 w-4" />
            <span className="hidden sm:inline">Buka di Tab Baru</span>
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleAddTakuLink()
            }}
            className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Taku Link</span>
          </Button>
        </div>
      </div>

      {/* Iframe Content */}
      {currentUrl && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Taku Links Results</h4>
              <p className="text-sm text-muted-foreground">Mencari: {selectedJapaneseName}</p>
            </div>
          </div>
          
          <div className="border rounded-lg overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center h-96 bg-gray-50 dark:bg-gray-800">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Memuat pencarian untuk: {selectedJapaneseName}
                  </p>
                </div>
              </div>
            ) : !iframeError ? (
              <iframe
                key={`${currentUrl}-${iframeKey}`}
                src={currentUrl}
                className="w-full h-96"
                title={`Taku Links Search - ${selectedJapaneseName}`}
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation allow-downloads allow-modals"
                loading="lazy"
                referrerPolicy="no-referrer"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                onError={handleIframeError}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-96 bg-gray-50 dark:bg-gray-800">
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
                      type="button"
                      onClick={handleOpenInNewTab}
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Buka di Tab Baru
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIframeError(false)}
                    >
                      Coba Lagi
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded">
            💡 <strong>Tips:</strong> Pilih nama Jepang yang berbeda untuk mencari variasi lain, atau klik "Add Taku Link" untuk menambahkan link yang sedang terbuka ke daftar Taku Links. Semua variasi akan otomatis ditambahkan saat menyimpan aktris.
            {iframeError && (
              <div className="mt-2 text-orange-600 dark:text-orange-400">
                ⚠️ <strong>Catatan:</strong> Error yang muncul di console adalah dari website eksternal dan tidak mempengaruhi fungsi aplikasi.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}