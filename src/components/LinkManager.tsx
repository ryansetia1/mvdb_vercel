import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { Plus, X, Edit, Save, ExternalLink, Link as LinkIcon, Clipboard } from 'lucide-react'
import { toast } from 'sonner'

interface LinkItem {
  title: string
  url: string
}

interface LinkManagerProps {
  label: string
  links: string // Format: "Title#URL, Title2#URL2"
  onLinksChange: (links: string) => void
  placeholder?: string
}

export function LinkManager({ label, links, onLinksChange, placeholder }: LinkManagerProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [editUrl, setEditUrl] = useState('')
  
  // Common titles based on link type - simplified to 3 most used
  const getCommonTitles = () => {
    const labelLower = label.toLowerCase()
    if (labelLower.includes('censored')) {
      return ['VK', 'Missav', 'Highporn']
    } else if (labelLower.includes('uncensored')) {
      return ['VK', 'Missav', 'Highporn']
    } else if (labelLower.includes('other')) {
      return ['VK', 'Missav', 'Highporn']
    }
    return ['VK', 'Missav', 'Highporn']
  }

  // Parse links from string format
  const parseLinks = (linksStr: string): LinkItem[] => {
    if (!linksStr) return []
    return linksStr.split(',').map(link => {
      const [title, url] = link.trim().split('#')
      return { title: title?.trim() || '', url: url?.trim() || '' }
    }).filter(link => link.title && link.url)
  }

  // Convert links array back to string format
  const formatLinks = (linkItems: LinkItem[]): string => {
    return linkItems.map(item => `${item.title}#${item.url}`).join(', ')
  }

  const linkItems = parseLinks(links)

  const handleAddLink = () => {
    if (newTitle.trim() && newUrl.trim()) {
      const updatedLinks = [...linkItems, { title: newTitle.trim(), url: newUrl.trim() }]
      onLinksChange(formatLinks(updatedLinks))
      setNewTitle('')
      setNewUrl('')
      setIsAdding(false)
    }
  }

  const handleEditLink = (index: number) => {
    const link = linkItems[index]
    setEditTitle(link.title)
    setEditUrl(link.url)
    setEditingIndex(index)
  }

  const handleSaveEdit = () => {
    if (editTitle.trim() && editUrl.trim() && editingIndex !== null) {
      const updatedLinks = [...linkItems]
      updatedLinks[editingIndex] = { title: editTitle.trim(), url: editUrl.trim() }
      onLinksChange(formatLinks(updatedLinks))
      setEditingIndex(null)
      setEditTitle('')
      setEditUrl('')
    }
  }

  const handleDeleteLink = (index: number) => {
    const updatedLinks = linkItems.filter((_, i) => i !== index)
    onLinksChange(formatLinks(updatedLinks))
  }

  const handleCancelEdit = () => {
    setEditingIndex(null)
    setEditTitle('')
    setEditUrl('')
  }

  const handleCancelAdd = () => {
    setIsAdding(false)
    setNewTitle('')
    setNewUrl('')
  }

  // Function to read clipboard and auto-fill URL
  const handlePresetClick = async (title: string) => {
    try {
      // Set the title first
      setNewTitle(title)
      
      // Try to read from clipboard
      if (navigator.clipboard && navigator.clipboard.readText) {
        const clipboardText = await navigator.clipboard.readText()
        
        // Check if clipboard contains a valid URL
        if (clipboardText && isValidUrl(clipboardText.trim())) {
          setNewUrl(clipboardText.trim())
          toast.success(`Auto-filled URL from clipboard for ${title}`)
        } else {
          toast.info(`Title "${title}" set. Please paste URL manually.`)
        }
      } else {
        // Fallback for older browsers
        toast.info(`Title "${title}" set. Please paste URL manually.`)
      }
    } catch (error) {
      console.warn('Failed to read clipboard:', error)
      // Still set the title even if clipboard fails
      setNewTitle(title)
      toast.info(`Title "${title}" set. Please paste URL manually.`)
    }
  }

  // Helper function to validate URL
  const isValidUrl = (string: string): boolean => {
    try {
      new URL(string)
      return true
    } catch (_) {
      return false
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium">{label}</label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-1"
        >
          <Plus className="h-3 w-3" />
          Add Link
        </Button>
      </div>

      {/* Existing Links */}
      <div className="space-y-2">
        {linkItems.map((link, index) => (
          <Card key={index} className="p-3">
            {editingIndex === index ? (
              // Edit Mode
              <div className="space-y-2">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Link Title"
                  className="text-sm"
                />
                <Input
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  placeholder="URL"
                  className="text-sm"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={handleSaveEdit}
                    className="flex items-center gap-1"
                  >
                    <Save className="h-3 w-3" />
                    Save
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCancelEdit}
                    className="flex items-center gap-1"
                  >
                    <X className="h-3 w-3" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              // Display Mode
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {link.title}
                    </Badge>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1 truncate"
                    >
                      <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{link.url}</span>
                    </a>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditLink(index)}
                    className="flex items-center gap-1 px-2 py-1 h-7"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteLink(index)}
                    className="flex items-center gap-1 px-2 py-1 h-7"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Add New Link */}
      {isAdding && (
        <Card className="p-3 border-dashed">
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <LinkIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Add New Link</span>
            </div>
            
            {/* Quick Preset Buttons - 3 most common titles */}
            <div className="flex gap-2 mb-2">
              {getCommonTitles().map((title) => (
                <Button
                  key={title}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handlePresetClick(title)}
                  className="flex-1 flex items-center gap-1"
                >
                  <Clipboard className="h-3 w-3" />
                  {title}
                </Button>
              ))}
            </div>
            
            {/* Title Input */}
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Link Title (or use buttons above)"
              className="text-sm"
            />
            <Input
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="URL (https://...)"
              className="text-sm"
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={handleAddLink}
                disabled={!newTitle.trim() || !newUrl.trim()}
                className="flex items-center gap-1"
              >
                <Plus className="h-3 w-3" />
                Add
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancelAdd}
                className="flex items-center gap-1"
              >
                <X className="h-3 w-3" />
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {linkItems.length === 0 && !isAdding && (
        <div className="text-center py-6 text-muted-foreground">
          <LinkIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No links added yet</p>
          <p className="text-xs">{placeholder}</p>
        </div>
      )}
    </div>
  )
}