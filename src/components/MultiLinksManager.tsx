import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Plus, Trash2, Link, ExternalLink } from 'lucide-react'

interface Link {
  id: string
  url: string
  label?: string
}

interface MultiLinksManagerProps {
  title: string
  links: string | undefined
  onChange: (links: string) => void
  placeholder?: string
  description?: string
}

export function MultiLinksManager({ 
  title, 
  links, 
  onChange, 
  placeholder = "https://example.com",
  description 
}: MultiLinksManagerProps) {
  // Parse links from string format (comma separated URLs)
  const parseLinks = (linksStr: string | undefined): Link[] => {
    if (!linksStr?.trim()) return []
    
    return linksStr.split(',').map((url, index) => ({
      id: `${Date.now()}-${index}`,
      url: url.trim(),
      label: `Link ${index + 1}`
    })).filter(link => link.url)
  }

  // Convert links array back to string format
  const linksToString = (linksArray: Link[]): string => {
    return linksArray.map(link => link.url).join(', ')
  }

  const [linksList, setLinksList] = useState<Link[]>(() => parseLinks(links))

  const addLink = () => {
    const newLink: Link = {
      id: `${Date.now()}-${Math.random()}`,
      url: '',
      label: `Link ${linksList.length + 1}`
    }
    const updatedLinks = [...linksList, newLink]
    setLinksList(updatedLinks)
    // Don't update parent until URL is actually entered
  }

  const updateLink = (id: string, url: string) => {
    const updatedLinks = linksList.map(link =>
      link.id === id ? { ...link, url } : link
    )
    setLinksList(updatedLinks)
    
    // Update parent with valid links only
    const validLinks = updatedLinks.filter(link => link.url.trim())
    onChange(linksToString(validLinks))
  }

  const removeLink = (id: string) => {
    const updatedLinks = linksList.filter(link => link.id !== id)
    setLinksList(updatedLinks)
    onChange(linksToString(updatedLinks))
  }

  const isValidUrl = (url: string): boolean => {
    if (!url.trim()) return false
    try {
      new URL(url)
      return true
    } catch {
      return url.includes('.') && url.length > 3 // Basic domain check
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <Label className="flex items-center gap-2">
            <Link className="h-4 w-4" />
            {title}
          </Label>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <Button
          type="button"
          onClick={addLink}
          size="sm"
          variant="outline"
          className="h-8"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Link
        </Button>
      </div>

      {linksList.length === 0 ? (
        <div className="text-center py-4 text-sm text-muted-foreground border-2 border-dashed rounded-lg">
          Belum ada link. Klik "Add Link" untuk menambahkan.
        </div>
      ) : (
        <div className="space-y-2">
          {linksList.map((link, index) => (
            <Card key={link.id} className="p-3">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Input
                    type="url"
                    value={link.url}
                    onChange={(e) => updateLink(link.id, e.target.value)}
                    placeholder={placeholder}
                    className={`${link.url && !isValidUrl(link.url) ? 'border-red-300' : ''}`}
                  />
                  {link.url && !isValidUrl(link.url) && (
                    <p className="text-xs text-red-600 mt-1">URL tidak valid</p>
                  )}
                </div>

                {link.url && isValidUrl(link.url) && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => window.open(link.url, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                )}

                <Button
                  type="button"
                  onClick={() => removeLink(link.id)}
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {linksList.length > 0 && (
        <div className="text-xs text-muted-foreground">
          Total: {linksList.filter(link => link.url.trim()).length} link(s) valid
        </div>
      )}
    </div>
  )
}