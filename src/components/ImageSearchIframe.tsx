import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Search, Copy, ExternalLink, Image as ImageIcon, Loader2, Clipboard } from 'lucide-react'
import { toast } from 'sonner'

interface ImageSearchIframeProps {
  onImageSelect?: (imageUrl: string) => void
  onAddPhotoField?: () => void
  searchQuery?: string
  className?: string
  name?: string
  jpname?: string
  type?: 'actor' | 'actress' | 'director'
  autoSearch?: boolean // New prop to trigger auto search
}

export function ImageSearchIframe({ 
  onImageSelect, 
  onAddPhotoField,
  searchQuery = '', 
  className = '',
  name = '',
  jpname = '',
  type = 'actor',
  autoSearch = false
}: ImageSearchIframeProps) {
  const [searchTerm, setSearchTerm] = useState(searchQuery || name || '')
  const [selectedImageUrl, setSelectedImageUrl] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Auto-trigger search when autoSearch prop is true
  useEffect(() => {
    if (autoSearch && name && name.trim()) {
      setSearchTerm(name.trim())
      setIsExpanded(true)
      searchImages()
    }
  }, [autoSearch, name])

  // Function to perform auto-search with full name
  const performAutoSearch = async () => {
    if (!name || !name.trim()) {
      toast.error('Nama tidak tersedia untuk pencarian otomatis')
      return
    }

    const fullName = name.trim()
    setSearchTerm(fullName)
    setIsExpanded(true)
    await searchImages()
    toast.success(`Pencarian otomatis dengan nama lengkap: "${fullName}"`)
  }

  const handleSearch = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    if (!searchTerm.trim()) {
      toast.error('Masukkan kata kunci pencarian')
      return
    }
    setIsExpanded(true)
    await searchImages()
  }

  const searchImages = async () => {
    // For now, we'll use iframe approach with better implementation
    // In the future, this can be replaced with actual API calls
    setIsLoading(false)
  }

  const handleImageSelect = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl)
    if (onImageSelect) {
      onImageSelect(imageUrl)
      toast.success('URL gambar berhasil dipilih')
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('URL berhasil disalin ke clipboard')
    } catch (err) {
      toast.error('Gagal menyalin URL')
    }
  }

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text && (text.startsWith('http://') || text.startsWith('https://'))) {
        setSelectedImageUrl(text)
        if (onImageSelect) {
          onImageSelect(text)
          toast.success('URL gambar berhasil dipaste dari clipboard')
        }
      } else {
        toast.error('Clipboard tidak berisi URL gambar yang valid')
      }
    } catch (err) {
      toast.error('Gagal membaca dari clipboard')
    }
  }



  // Generate search URL dynamically based on current search term
  const getSearchUrl = (term: string) => {
    return `https://www.bing.com/images/search?q=${encodeURIComponent(term)}`
  }

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ImageIcon className="h-5 w-5" />
          Pencarian Gambar
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Cari gambar dan salin URL untuk digunakan di field foto profil
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="space-y-2">
          <Label htmlFor="image-search">Kata Kunci Pencarian</Label>
          <div className="flex gap-2">
            <Input
              id="image-search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Masukkan nama aktris/aktor/director..."
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button 
              type="button"
              onClick={handleSearch} 
              disabled={!searchTerm.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              {isLoading ? 'Mencari...' : 'Cari'}
            </Button>
          </div>
        </div>

        {/* Selected Image URL */}
        {selectedImageUrl && (
          <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
            <Label className="text-sm font-medium">URL Gambar Terpilih:</Label>
            <div className="flex gap-2">
              <Input
                value={selectedImageUrl}
                readOnly
                className="text-sm font-mono"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  copyToClipboard(selectedImageUrl)
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Search Results */}
        {isExpanded && searchTerm && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Bing Images</h4>
                  <p className="text-sm text-muted-foreground">Pencarian gambar Microsoft Bing - Pilihan terbaik untuk iframe</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(getSearchUrl(searchTerm), '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Buka di Tab Baru
                </Button>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <iframe
                  src={getSearchUrl(searchTerm)}
                  className="w-full h-[600px] min-h-[500px]"
                  title={`Bing Images - ${searchTerm}`}
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </div>
              
              <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded">
                💡 <strong>Tips:</strong> Klik kanan pada gambar → "Copy image address" atau "Salin alamat gambar" untuk mendapatkan URL gambar. 
                Kemudian paste URL tersebut ke field foto profil di atas.
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {name && (
          <div className="flex flex-wrap gap-2 pt-2">
            {jpname && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  const newTerm = `${name} ${jpname}`.trim()
                  setSearchTerm(newTerm)
                  toast.success(`Search term diubah ke: "${newTerm}"`)
                }}
              >
                Nama + Nama Jepang
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                const newTerm = `${name} ${type === 'actress' ? 'AV actress' : type === 'actor' ? 'AV actor' : 'director'}`.trim()
                setSearchTerm(newTerm)
                toast.success(`Search term diubah ke: "${newTerm}"`)
              }}
            >
              Nama + {type === 'actress' ? 'AV Actress' : type === 'actor' ? 'AV Actor' : 'Director'}
            </Button>
            {jpname && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setSearchTerm(jpname)
                  toast.success(`Search term diubah ke: "${jpname}"`)
                }}
              >
                Nama Jepang
              </Button>
            )}
            {jpname && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  const newTerm = `${jpname} ${type === 'actress' ? 'AV actress' : type === 'actor' ? 'AV actor' : 'director'}`.trim()
                  setSearchTerm(newTerm)
                  toast.success(`Search term diubah ke: "${newTerm}"`)
                }}
              >
                Nama Jepang + {type === 'actress' ? 'AV' : type === 'actor' ? 'AV' : ''}
              </Button>
            )}
          </div>
        )}

      </CardContent>
    </Card>
  )
}
