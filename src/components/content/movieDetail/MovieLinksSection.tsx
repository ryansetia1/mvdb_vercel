import React from 'react'
import { Movie } from '../../../utils/movieApi'
import { LinkItem } from './MovieDetailHelpers'

interface MovieLinksSectionProps {
  sLinks: string[]
  uLinks: string[]
  cLinks: string[]
  sLinksWithTitles: LinkItem[]
  uLinksWithTitles: LinkItem[]
  cLinksWithTitles: LinkItem[]
  renderLinkButton: (url: string, title: string, index: number, type: 'stream' | 'download' | 'custom') => React.ReactNode
  movie: Movie // Add movie prop to access type information
}

export function MovieLinksSection({ sLinks, uLinks, cLinks, sLinksWithTitles, uLinksWithTitles, cLinksWithTitles, renderLinkButton, movie }: MovieLinksSectionProps) {
  
  // Parse movie types
  const currentTypes = movie.type ? movie.type.split(',').map(t => t.trim()) : []
  
  // Determine which link sections to show based on type
  const getLinkSectionsToShow = () => {
    if (!movie.type) {
      // If no type selected, show all sections
      return { showCensored: true, showUncensored: true, showOthers: true }
    }

    const types = currentTypes.map(t => t.toLowerCase())
    
    // Check for specific types
    const hasCen = types.includes('cen')
    const hasSem = types.includes('sem') 
    const hasUn = types.includes('un')
    const hasLeaks = types.includes('leaks')

    let showCensored = false
    let showUncensored = false
    let showOthers = false

    if (hasCen || hasSem) {
      // Cen, Sem = censored, others
      showCensored = true
      showOthers = true
    } else if (hasUn) {
      // Un = Uncensored, others  
      showUncensored = true
      showOthers = true
    } else if (hasLeaks) {
      // Leaks = censored, uncensored, others
      showCensored = true
      showUncensored = true
      showOthers = true
    } else {
      // For other types, show all sections
      showCensored = true
      showUncensored = true
      showOthers = true
    }

    return { showCensored, showUncensored, showOthers }
  }

  const { showCensored, showUncensored, showOthers } = getLinkSectionsToShow()

  // Check if any links should be shown
  const hasVisibleLinks = (showCensored && cLinks.length > 0) || 
                         (showUncensored && uLinks.length > 0) || 
                         (showOthers && sLinks.length > 0)

  if (!hasVisibleLinks) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Censored Links */}
      {showCensored && cLinksWithTitles.length > 0 && (
        <div>
          <h4 className="text-sm text-muted-foreground mb-2">Censored</h4>
          <div className="flex flex-wrap gap-2">
            {cLinksWithTitles.map((link, index) => renderLinkButton(link.url, link.title, index, 'custom'))}
          </div>
        </div>
      )}

      {/* Uncensored Links */}
      {showUncensored && uLinksWithTitles.length > 0 && (
        <div>
          <h4 className="text-sm text-muted-foreground mb-2">Uncensored</h4>
          <div className="flex flex-wrap gap-2">
            {uLinksWithTitles.map((link, index) => renderLinkButton(link.url, link.title, index, 'download'))}
          </div>
        </div>
      )}

      {/* Other Links */}
      {showOthers && sLinksWithTitles.length > 0 && (
        <div>
          <h4 className="text-sm text-muted-foreground mb-2">Other</h4>
          <div className="flex flex-wrap gap-2">
            {sLinksWithTitles.map((link, index) => renderLinkButton(link.url, link.title, index, 'stream'))}
          </div>
        </div>
      )}
    </div>
  )
}