import React from 'react'

interface MovieLinksSectionProps {
  sLinks: string[]
  uLinks: string[]
  cLinks: string[]
  renderLinkButton: (url: string, index: number, type: 'stream' | 'download' | 'custom') => React.ReactNode
}

export function MovieLinksSection({ sLinks, uLinks, cLinks, renderLinkButton }: MovieLinksSectionProps) {
  if (sLinks.length === 0 && uLinks.length === 0 && cLinks.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Censored Links */}
      {cLinks.length > 0 && (
        <div>
          <h4 className="text-sm text-muted-foreground mb-2">Censored</h4>
          <div className="flex flex-wrap gap-2">
            {cLinks.map((url, index) => renderLinkButton(url, index, 'custom'))}
          </div>
        </div>
      )}

      {/* Uncensored Links */}
      {uLinks.length > 0 && (
        <div>
          <h4 className="text-sm text-muted-foreground mb-2">Uncensored</h4>
          <div className="flex flex-wrap gap-2">
            {uLinks.map((url, index) => renderLinkButton(url, index, 'download'))}
          </div>
        </div>
      )}

      {/* Other Links */}
      {sLinks.length > 0 && (
        <div>
          <h4 className="text-sm text-muted-foreground mb-2">Other</h4>
          <div className="flex flex-wrap gap-2">
            {sLinks.map((url, index) => renderLinkButton(url, index, 'stream'))}
          </div>
        </div>
      )}
    </div>
  )
}