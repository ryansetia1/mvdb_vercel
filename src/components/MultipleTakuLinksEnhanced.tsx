import { ExternalLink } from 'lucide-react'
import { Badge } from './ui/badge'

// Utility function to parse multiple URLs from takulinks
export function parseTakuLinks(takulinks: string): string[] {
  if (!takulinks || !takulinks.trim()) return []
  
  // Split by common delimiters and filter out empty strings
  const urls = takulinks
    .split(/[\s,\n;|]+/)
    .map(url => url.trim())
    .filter(url => url.length > 0)
    .filter(url => {
      // Basic URL validation - must start with http/https or www
      return /^(https?:\/\/|www\.)/.test(url) || url.includes('.')
    })
  
  return urls
}

// Extract domain name for display
export function getDomainName(url: string): string {
  try {
    const cleanUrl = url.startsWith('http') ? url : `https://${url}`
    const domain = new URL(cleanUrl).hostname.replace(/^www\./, '')
    return domain
  } catch {
    // Fallback for invalid URLs
    return url
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0]
      .substring(0, 20)
  }
}

interface MultipleTakuLinksProps {
  takulinks: string
  className?: string
  variant?: 'default' | 'compact' | 'badges'
}

export function MultipleTakuLinksEnhanced({ 
  takulinks, 
  className = '', 
  variant = 'default' 
}: MultipleTakuLinksProps) {
  const urls = parseTakuLinks(takulinks)
  
  if (urls.length === 0) return null
  
  // Default variant - vertical list
  if (variant === 'default') {
    return (
      <div className={`space-y-1 ${className}`}>
        <div className="text-xs font-medium text-muted-foreground text-center mb-1">
          Taku Links ({urls.length})
        </div>
        <div className="flex flex-col gap-1">
          {urls.map((url, index) => {
            const displayName = getDomainName(url)
            
            return (
              <a
                key={index}
                href={url.startsWith('http') ? url : `https://${url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline transition-colors justify-center"
                title={url}
              >
                <ExternalLink className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{displayName}</span>
              </a>
            )
          })}
        </div>
      </div>
    )
  }
  
  // Compact variant - horizontal single line with count
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-xs text-muted-foreground">Taku Links:</span>
        <div className="flex items-center gap-1">
          {urls.slice(0, 3).map((url, index) => {
            const displayName = getDomainName(url).substring(0, 15)
            
            return (
              <a
                key={index}
                href={url.startsWith('http') ? url : `https://${url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                title={url}
              >
                <ExternalLink className="h-3 w-3" />
                <span>{displayName}</span>
              </a>
            )
          })}
          {urls.length > 3 && (
            <span className="text-xs text-muted-foreground">
              +{urls.length - 3} more
            </span>
          )}
        </div>
      </div>
    )
  }
  
  // Badges variant - show as clickable badges
  if (variant === 'badges') {
    return (
      <div className={`space-y-1 ${className}`}>
        <div className="text-xs font-medium text-muted-foreground text-center mb-1">
          Taku Links
        </div>
        <div className="flex flex-wrap gap-1 justify-center">
          {urls.map((url, index) => {
            const displayName = getDomainName(url)
            
            return (
              <a
                key={index}
                href={url.startsWith('http') ? url : `https://${url}`}
                target="_blank"
                rel="noopener noreferrer"
                title={url}
              >
                <Badge 
                  variant="outline" 
                  className="text-xs cursor-pointer hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-colors"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  {displayName}
                </Badge>
              </a>
            )
          })}
        </div>
      </div>
    )
  }
  
  return null
}

// Legacy component for backward compatibility
export function MultipleTakuLinks({ takulinks, className }: { takulinks: string; className?: string }) {
  return <MultipleTakuLinksEnhanced takulinks={takulinks} className={className} variant="default" />
}