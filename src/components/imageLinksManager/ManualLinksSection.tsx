import { useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { CastManager } from '../CastManager'
import { DragDropImageZone } from '../DragDropImageZone'
import { Plus, X, Edit, Save, ExternalLink, Link as LinkIcon, Users, Shield } from 'lucide-react'
import { ManualLink, ManualLinksSectionProps, ContentRatingSelectValue } from './types'
import { ratingToSelectValue, selectValueToRating } from './helpers'

export function ManualLinksSection({ 
  manualLinks, 
  onManualLinksChange, 
  accessToken, 
  placeholder 
}: ManualLinksSectionProps) {
  const [isAddingManual, setIsAddingManual] = useState(false)
  const [newUrl, setNewUrl] = useState('')
  const [newActresses, setNewActresses] = useState('')
  const [newContentRating, setNewContentRating] = useState<ContentRatingSelectValue>('none')
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editUrl, setEditUrl] = useState('')
  const [editActresses, setEditActresses] = useState('')
  const [editContentRating, setEditContentRating] = useState<ContentRatingSelectValue>('none')

  const handleAddManualLink = () => {
    if (!newUrl.trim()) return

    const actressList = newActresses.split(',').map(a => a.trim()).filter(Boolean)
    const contentRating = selectValueToRating(newContentRating)
    const newManualLinks = [...manualLinks, { 
      url: newUrl.trim(), 
      actresses: actressList,
      contentRating: contentRating
    }]
    onManualLinksChange(newManualLinks)

    // Reset form
    setNewUrl('')
    setNewActresses('')
    setNewContentRating('none')
    setIsAddingManual(false)
  }

  const handleDragDropUrls = (urls: string[]) => {
    const newManualLinks = [...manualLinks]
    
    urls.forEach(url => {
      // Avoid duplicates
      if (!newManualLinks.some(link => link.url === url)) {
        newManualLinks.push({
          url,
          actresses: [],
          contentRating: null
        })
      }
    })
    
    onManualLinksChange(newManualLinks)
  }

  const handleEditManualLink = (index: number) => {
    const link = manualLinks[index]
    setEditingIndex(index)
    setEditUrl(link.url)
    setEditActresses(link.actresses.join(', '))
    setEditContentRating(ratingToSelectValue(link.contentRating))
  }

  const handleSaveEdit = () => {
    if (editingIndex === null || !editUrl.trim()) return

    const actressList = editActresses.split(',').map(a => a.trim()).filter(Boolean)
    const contentRating = selectValueToRating(editContentRating)
    const newManualLinks = [...manualLinks]
    newManualLinks[editingIndex] = { 
      url: editUrl.trim(), 
      actresses: actressList,
      contentRating: contentRating
    }
    onManualLinksChange(newManualLinks)

    setEditingIndex(null)
    setEditUrl('')
    setEditActresses('')
    setEditContentRating('none')
  }

  const handleDeleteManualLink = (index: number) => {
    const newManualLinks = manualLinks.filter((_, i) => i !== index)
    onManualLinksChange(newManualLinks)
  }

  const handleCancelEdit = () => {
    setEditingIndex(null)
    setEditUrl('')
    setEditActresses('')
    setEditContentRating('none')
  }

  const handleCancelAdd = () => {
    setIsAddingManual(false)
    setNewUrl('')
    setNewActresses('')
    setNewContentRating('none')
  }

  const getContentRatingBadge = (rating?: 'NN' | 'N' | null) => {
    if (!rating) return null
    
    const variants = {
      'NN': { variant: 'destructive' as const, label: 'NN' },
      'N': { variant: 'secondary' as const, label: 'N' }
    }
    
    const config = variants[rating]
    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <LinkIcon className="h-4 w-4" />
          Manual Image Links
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsAddingManual(true)}
            className="ml-auto flex items-center gap-1"
          >
            <Plus className="h-3 w-3" />
            Add Link
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drag & Drop Zone */}
        <div className="relative h-48 border-2 border-dashed border-muted-foreground/30 rounded-xl bg-muted/20 hover:bg-muted/30 transition-colors overflow-hidden">
          <DragDropImageZone onUrlsDropped={handleDragDropUrls} />
        </div>

        {/* Existing Manual Links */}
        <div className="space-y-2">
          {manualLinks.map((link, index) => (
            <Card key={index} className="p-3">
              {editingIndex === index ? (
                // Edit Mode
                <div className="space-y-2">
                  <Input
                    value={editUrl}
                    onChange={(e) => setEditUrl(e.target.value)}
                    placeholder="Image URL"
                    className="text-sm"
                  />
                  <div>
                    <Label className="text-xs">Actresses in this image</Label>
                    <CastManager
                      type="actress"
                      currentCast={editActresses}
                      onCastChange={setEditActresses}
                      accessToken={accessToken}
                      allowMultiple={true}
                      placeholder="Select actresses in this image"
                    />
                  </div>
                  <div>
                    <Label className="text-xs flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      Content Rating
                    </Label>
                    <Select value={editContentRating} onValueChange={setEditContentRating}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select content rating (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Rating</SelectItem>
                        <SelectItem value="N">N (Partial)</SelectItem>
                        <SelectItem value="NN">NN (Full)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
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
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditManualLink(index)}
                        className="flex items-center gap-1 px-2 py-1 h-7"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteManualLink(index)}
                        className="flex items-center gap-1 px-2 py-1 h-7"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  {/* Tags Row */}
                  <div className="flex items-center gap-3">
                    {/* Actresses */}
                    {link.actresses.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <div className="flex flex-wrap gap-1">
                          {link.actresses.map((actress, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {actress}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Content Rating */}
                    {link.contentRating && (
                      <div className="flex items-center gap-2">
                        <Shield className="h-3 w-3 text-muted-foreground" />
                        {getContentRatingBadge(link.contentRating)}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Add New Manual Link */}
        {isAddingManual && (
          <Card className="p-3 border-dashed">
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <LinkIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Add New Image Link</span>
              </div>
              <Input
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="Image URL (https://...)"
                className="text-sm"
              />
              <div>
                <Label className="text-xs">Actresses in this image</Label>
                <CastManager
                  type="actress"
                  currentCast={newActresses}
                  onCastChange={setNewActresses}
                  accessToken={accessToken}
                  allowMultiple={true}
                  placeholder="Select actresses in this image"
                />
              </div>
              <div>
                <Label className="text-xs flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Content Rating
                </Label>
                <Select value={newContentRating} onValueChange={setNewContentRating}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select content rating (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Rating</SelectItem>
                    <SelectItem value="N">N (Partial)</SelectItem>
                    <SelectItem value="NN">NN (Full)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={handleAddManualLink}
                  disabled={!newUrl.trim()}
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

        {/* Empty State for Manual Links */}
        {manualLinks.length === 0 && !isAddingManual && (
          <div className="text-center py-4 text-muted-foreground border-2 border-dashed rounded-lg">
            <LinkIcon className="h-6 w-6 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No manual links added</p>
            <p className="text-xs">{placeholder}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}