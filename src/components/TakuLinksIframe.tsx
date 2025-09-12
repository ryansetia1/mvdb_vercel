import React, { useState } from 'react'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { ExternalLink, X } from 'lucide-react'

interface TakuLinksIframeProps {
  takulinks: string
  className?: string
  variant?: 'default' | 'compact' | 'badges'
}

export function TakuLinksIframe({ 
  takulinks, 
  className = '', 
  variant = 'default' 
}: TakuLinksIframeProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedUrl, setSelectedUrl] = useState('')

  // Parse takulinks string into array of URLs
  const parseTakuLinks = (links: string): string[] => {
    if (!links || !links.trim()) return []
    
    return links
      .split('\n')
      .map(link => link.trim())
      .filter(link => link.length > 0)
      .map(link => {
        // Add https:// if no protocol specified
        if (!link.startsWith('http://') && !link.startsWith('https://')) {
          return `https://${link}`
        }
        return link
      })
  }

  // Get domain name from URL for display
  const getDomainName = (url: string): string => {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname.replace('www.', '')
    } catch {
      return url
    }
  }

  const urls = parseTakuLinks(takulinks)
  
  if (urls.length === 0) return null

  const handleLinkClick = (url: string) => {
    setSelectedUrl(url)
    setIsOpen(true)
  }

  const handleOpenInNewTab = () => {
    if (selectedUrl) {
      window.open(selectedUrl, '_blank', 'noopener,noreferrer')
    }
  }

  // Default variant - vertical list
  if (variant === 'default') {
    return (
      <>
        <div className={`space-y-1 ${className}`}>
          <div className="text-xs font-medium text-muted-foreground text-center mb-1">
            Taku Links ({urls.length})
          </div>
          <div className="flex flex-col gap-1">
            {urls.map((url, index) => {
              const displayName = getDomainName(url)
              
              return (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleLinkClick(url)}
                  className="inline-flex items-center gap-1 text-xs hover:bg-blue-50 hover:border-blue-300 transition-colors justify-center"
                  title={`Klik untuk membuka ${url} di iframe`}
                >
                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{displayName}</span>
                </Button>
              )
            })}
          </div>
        </div>

        {/* Custom Large Modal */}
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div 
              className="bg-white dark:bg-gray-900 rounded-lg shadow-xl border w-[98vw] h-[95vh] flex flex-col"
              style={{
                maxWidth: '98vw',
                maxHeight: '95vh',
                width: '98vw',
                height: '95vh'
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-5 w-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {getDomainName(selectedUrl)}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenInNewTab}
                    title="Buka di tab baru"
                    className="flex items-center gap-1"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span className="hidden sm:inline">Buka di Tab Baru</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    title="Tutup"
                    className="flex items-center gap-1"
                  >
                    <X className="h-4 w-4" />
                    <span className="hidden sm:inline">Tutup</span>
                  </Button>
                </div>
              </div>
              
              {/* Content */}
              <div className="flex-1 overflow-hidden">
                <iframe
                  src={selectedUrl}
                  className="w-full h-full border-0"
                  title={`Taku Link - ${getDomainName(selectedUrl)}`}
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation allow-downloads"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </div>
              
              {/* Footer */}
              <div className="p-3 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                💡 <strong>Tips:</strong> Klik tombol "Buka di Tab Baru" untuk membuka di tab baru, atau gunakan tombol "Tutup" untuk menutup dialog ini.
              </div>
            </div>
          </div>
        )}
      </>
    )
  }
  
  // Compact variant - horizontal single line with count
  if (variant === 'compact') {
    return (
      <>
        <div className={`flex items-center gap-1 ${className}`}>
          <span className="text-xs text-muted-foreground">Taku Links:</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleLinkClick(urls[0])}
            className="text-xs px-2 py-1 h-auto"
            title={`Klik untuk membuka ${urls[0]} di iframe`}
          >
            {getDomainName(urls[0])}
            {urls.length > 1 && ` (+${urls.length - 1})`}
          </Button>
        </div>

        {/* Custom Large Modal */}
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div 
              className="bg-white dark:bg-gray-900 rounded-lg shadow-xl border w-[98vw] h-[95vh] flex flex-col"
              style={{
                maxWidth: '98vw',
                maxHeight: '95vh',
                width: '98vw',
                height: '95vh'
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-5 w-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {getDomainName(selectedUrl)}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenInNewTab}
                    title="Buka di tab baru"
                    className="flex items-center gap-1"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span className="hidden sm:inline">Buka di Tab Baru</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    title="Tutup"
                    className="flex items-center gap-1"
                  >
                    <X className="h-4 w-4" />
                    <span className="hidden sm:inline">Tutup</span>
                  </Button>
                </div>
              </div>
              
              {/* Content */}
              <div className="flex-1 overflow-hidden">
                <iframe
                  src={selectedUrl}
                  className="w-full h-full border-0"
                  title={`Taku Link - ${getDomainName(selectedUrl)}`}
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation allow-downloads"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </div>
              
              {/* Footer */}
              <div className="p-3 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                💡 <strong>Tips:</strong> Klik tombol "Buka di Tab Baru" untuk membuka di tab baru, atau gunakan tombol "Tutup" untuk menutup dialog ini.
              </div>
            </div>
          </div>
        )}
      </>
    )
  }
  
  // Badges variant - small badges
  if (variant === 'badges') {
    return (
      <>
        <div className={`flex flex-wrap gap-1 ${className}`}>
          {urls.map((url, index) => {
            const displayName = getDomainName(url)
            
            return (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleLinkClick(url)}
                className="text-xs px-2 py-1 h-auto hover:bg-blue-50 hover:border-blue-300 transition-colors"
                title={`Klik untuk membuka ${url} di iframe`}
              >
                {displayName}
              </Button>
            )
          })}
        </div>

        {/* Custom Large Modal */}
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div 
              className="bg-white dark:bg-gray-900 rounded-lg shadow-xl border w-[98vw] h-[95vh] flex flex-col"
              style={{
                maxWidth: '98vw',
                maxHeight: '95vh',
                width: '98vw',
                height: '95vh'
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-5 w-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {getDomainName(selectedUrl)}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenInNewTab}
                    title="Buka di tab baru"
                    className="flex items-center gap-1"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span className="hidden sm:inline">Buka di Tab Baru</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    title="Tutup"
                    className="flex items-center gap-1"
                  >
                    <X className="h-4 w-4" />
                    <span className="hidden sm:inline">Tutup</span>
                  </Button>
                </div>
              </div>
              
              {/* Content */}
              <div className="flex-1 overflow-hidden">
                <iframe
                  src={selectedUrl}
                  className="w-full h-full border-0"
                  title={`Taku Link - ${getDomainName(selectedUrl)}`}
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation allow-downloads"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </div>
              
              {/* Footer */}
              <div className="p-3 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                💡 <strong>Tips:</strong> Klik tombol "Buka di Tab Baru" untuk membuka di tab baru, atau gunakan tombol "Tutup" untuk menutup dialog ini.
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  return null
}