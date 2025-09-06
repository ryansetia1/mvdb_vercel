import { ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { Button } from './ui/button'

interface LinksDisplayProps {
  title: string
  links: string | undefined
  maxVisible?: number
}

export function LinksDisplay({ title, links, maxVisible = 2 }: LinksDisplayProps) {
  const [showAll, setShowAll] = useState(false)
  
  if (!links?.trim()) return null

  // Parse links from comma-separated string
  const linkArray = links.split(',').map(link => link.trim()).filter(link => link)
  
  if (linkArray.length === 0) return null

  const visibleLinks = showAll ? linkArray : linkArray.slice(0, maxVisible)
  const hasMore = linkArray.length > maxVisible

  const handleLinkClick = (url: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Add protocol if missing
    let finalUrl = url
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      finalUrl = `https://${url}`
    }
    
    window.open(finalUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="text-sm space-y-1">
      <span className="font-medium">{title}:</span>
      <div className="space-y-1">
        {visibleLinks.map((link, index) => (
          <div key={index} className="flex items-center gap-1 text-blue-600 hover:text-blue-800">
            <ExternalLink className="h-3 w-3 flex-shrink-0" />
            <button
              onClick={(e) => handleLinkClick(link, e)}
              className="text-left hover:underline text-xs truncate max-w-40"
              title={link}
            >
              {link.length > 35 ? `${link.substring(0, 35)}...` : link}
            </button>
          </div>
        ))}
        
        {hasMore && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowAll(!showAll)
            }}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            {showAll ? (
              <>
                <ChevronUp className="h-3 w-3" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3" />
                Show {linkArray.length - maxVisible} more
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}