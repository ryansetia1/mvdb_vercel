import { useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { CastManager } from '../CastManager'
import { DragDropImageZone } from '../DragDropImageZone'
import { ImageWithFallback } from '../figma/ImageWithFallback'
import { Plus, X, Edit, Save, Users, Shield, ExternalLink, Trash2, Lock } from 'lucide-react'
import { ManualLink, ManualLinksSectionProps, ContentRatingSelectValue } from './types'
import { ratingToSelectValue, selectValueToRating } from './helpers'

export function ManualLinksGridSection({ 
  manualLinks, 
  onManualLinksChange, 
  accessToken, 
  placeholder,
  selectedActresses = [] // New prop for restricting actress selection
}: ManualLinksSectionProps) {
  const [isAddingManual, setIsAddingManual] = useState(false)
  const [newUrl, setNewUrl] = useState('')
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingLink, setEditingLink] = useState<ManualLink | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const handleAddManualLink = () => {
    if (!newUrl.trim()) return

    const newManualLinks = [...manualLinks, { 
      url: newUrl.trim(), 
      actresses: [],
      contentRating: null
    }]
    onManualLinksChange(newManualLinks)

    // Reset form
    setNewUrl('')
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

  const handleQuickRating = (index: number, rating: 'NN' | 'N' | null) => {
    const newManualLinks = [...manualLinks]
    newManualLinks[index] = {
      ...newManualLinks[index],
      contentRating: newManualLinks[index].contentRating === rating ? null : rating
    }
    onManualLinksChange(newManualLinks)
  }

  const handleEditLink = (index: number) => {
    setEditingIndex(index)
    setEditingLink({ ...manualLinks[index] })
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = () => {
    if (editingIndex === null || !editingLink) return

    const newManualLinks = [...manualLinks]
    newManualLinks[editingIndex] = editingLink
    onManualLinksChange(newManualLinks)

    setEditingIndex(null)
    setEditingLink(null)
    setIsEditDialogOpen(false)
  }

  const handleCancelEdit = () => {
    setEditingIndex(null)
    setEditingLink(null)
    setIsEditDialogOpen(false)
  }

  const handleDeleteLink = (index: number) => {
    const newManualLinks = manualLinks.filter((_, i) => i !== index)
    onManualLinksChange(newManualLinks)
  }

  const getContentRatingBadge = (rating?: 'NN' | 'N' | null) => {
    if (!rating) return null
    
    const variants = {
      'NN': { variant: 'secondary' as const, label: 'NN' }, // Gray for NN
      'N': { variant: 'destructive' as const, label: 'N' }  // Red for N
    }
    
    const config = variants[rating]
    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    )
  }

  const getTaggingStatus = (link: ManualLink) => {
    const hasActresses = link.actresses && link.actresses.length > 0
    const hasRating = link.contentRating !== null && link.contentRating !== undefined
    
    if (hasActresses && hasRating) return 'complete'
    if (hasActresses || hasRating) return 'partial'
    return 'none'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'border-green-500 bg-green-50'
      case 'partial': return 'border-yellow-500 bg-yellow-50'
      default: return 'border-gray-300 bg-gray-50'
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Manual Image Links
            {manualLinks.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {manualLinks.length} images
              </Badge>
            )}
            {selectedActresses.length > 0 && (
              <Lock className="h-3 w-3 text-amber-600" title="Actress selection is restricted" />
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddingManual(true)}
              className="flex items-center gap-1"
            >
              <Plus className="h-3 w-3" />
              Add Link
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Restriction Notice */}
        {selectedActresses.length > 0 && (
          <div className="p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
            <div className="flex items-center gap-1 mb-1">
              <Lock className="h-3 w-3" />
              <span className="font-medium">Actress Selection Restricted</span>
            </div>
            <div>Available actresses: {selectedActresses.join(', ')}</div>
          </div>
        )}

        {/* Stats */}
        {manualLinks.length > 0 && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground bg-muted/30 p-2 rounded">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Complete: {manualLinks.filter(link => getTaggingStatus(link) === 'complete').length}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span>Partial: {manualLinks.filter(link => getTaggingStatus(link) === 'partial').length}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span>Untagged: {manualLinks.filter(link => getTaggingStatus(link) === 'none').length}</span>
            </div>
          </div>
        )}

        {/* Full-Width Drag & Drop Zone */}
        <div className="mb-6">
          <div className="relative h-48 border-2 border-dashed border-muted-foreground/30 rounded-xl bg-muted/20 hover:bg-muted/30 transition-colors overflow-hidden">
            <DragDropImageZone onUrlsDropped={handleDragDropUrls} />
          </div>
        </div>

        {/* Image Grid - Updated to show 2 images per row with larger thumbnails */}
        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {/* Existing Images */}
          {manualLinks.map((link, index) => {
            const status = getTaggingStatus(link)
            
            return (
              <div key={index} className="relative group">
                <div className={`relative border-2 rounded-lg overflow-hidden transition-all ${getStatusColor(status)}`}>
                  <ImageWithFallback
                    src={link.url}
                    alt={`Manual image ${index + 1}`}
                    className="w-full h-96 object-contain bg-gray-50"
                  />
                  
                  {/* Image number */}
                  <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                    {index + 1}
                  </div>
                  
                  {/* Status indicator */}
                  <div className="absolute top-1 left-1">
                    {status === 'complete' && (
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    )}
                    {status === 'partial' && (
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    )}
                    {status === 'none' && (
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    )}
                  </div>

                  {/* Current tags display */}
                  <div className="absolute top-1 right-1 flex flex-col gap-1">
                    {link.contentRating && getContentRatingBadge(link.contentRating)}
                    {link.actresses.length > 0 && (
                      <Badge variant="secondary" className="text-xs h-auto py-0 px-1">
                        {link.actresses.length}
                      </Badge>
                    )}
                  </div>

                  {/* Hover overlay with quick actions */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 opacity-0 group-hover:opacity-100 flex items-center justify-center">
                    <div className="flex flex-col gap-1">
                      {/* Quick rating buttons */}
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant={link.contentRating === 'N' ? 'destructive' : 'outline'}
                          onClick={() => handleQuickRating(index, 'N')}
                          className="h-6 w-8 text-xs p-0 bg-white/90 hover:bg-white"
                        >
                          N
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={link.contentRating === 'NN' ? 'secondary' : 'outline'}
                          onClick={() => handleQuickRating(index, 'NN')}
                          className="h-6 w-8 text-xs p-0 bg-white/90 hover:bg-white"
                        >
                          NN
                        </Button>
                      </div>
                      
                      {/* Action buttons */}
                      <div className="flex gap-1">
                        <Dialog open={isEditDialogOpen && editingIndex === index} onOpenChange={(open) => {
                          if (!open) {
                            handleCancelEdit()
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditLink(index)}
                              className="h-6 w-8 text-xs p-0 bg-white/90 hover:bg-white"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="!max-w-[1200px] max-h-[98vh] overflow-hidden">
                            <DialogHeader className="pb-3">
                              <DialogTitle className="text-xl">Edit Image Tags</DialogTitle>
                            </DialogHeader>
                            {editingIndex === index && editingLink && (
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-h-[88vh] overflow-y-auto">
                                {/* Left side - Image preview */}
                                <div className="space-y-4">
                                  <div className="flex justify-center">
                                    <ImageWithFallback
                                      src={link.url}
                                      alt="Editing image"
                                      className="w-full max-w-lg h-96 object-contain rounded border bg-gray-50"
                                    />
                                  </div>
                                  
                                  {/* URL display */}
                                  <div className="space-y-1">
                                    <Label className="text-sm font-medium">Image URL</Label>
                                    <div className="flex items-center gap-2 text-sm">
                                      <a
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline flex items-center gap-1 truncate flex-1"
                                      >
                                        <ExternalLink className="h-4 w-4 flex-shrink-0" />
                                        <span className="truncate">{link.url}</span>
                                      </a>
                                    </div>
                                  </div>
                                </div>

                                {/* Right side - Form fields */}
                                <div className="space-y-6">
                                  {/* Actresses */}
                                  <div className="space-y-2">
                                    <Label className="text-base font-medium flex items-center gap-2">
                                      Actresses in this image
                                      {selectedActresses.length > 0 && (
                                        <Lock className="h-5 w-5 text-amber-600" />
                                      )}
                                    </Label>
                                    {selectedActresses.length > 0 ? (
                                      // Restricted mode: only show selected actresses
                                      <CastManager
                                        type="actress"
                                        currentCast={editingLink.actresses.join(', ')}
                                        onCastChange={(actresses) => 
                                          setEditingLink({
                                            ...editingLink,
                                            actresses: actresses.split(',').map(a => a.trim()).filter(Boolean)
                                          })
                                        }
                                        accessToken={accessToken}
                                        allowMultiple={true}
                                        placeholder="Select from available actresses"
                                        restrictToNames={selectedActresses}
                                      />
                                    ) : (
                                      // Unrestricted mode: show all actresses
                                      <CastManager
                                        type="actress"
                                        currentCast={editingLink.actresses.join(', ')}
                                        onCastChange={(actresses) => 
                                          setEditingLink({
                                            ...editingLink,
                                            actresses: actresses.split(',').map(a => a.trim()).filter(Boolean)
                                          })
                                        }
                                        accessToken={accessToken}
                                        allowMultiple={true}
                                        placeholder="Select actresses in this image"
                                      />
                                    )}
                                  </div>

                                  {/* Content Rating */}
                                  <div className="space-y-2">
                                    <Label className="text-base font-medium flex items-center gap-2">
                                      <Shield className="h-5 w-5" />
                                      Content Rating
                                    </Label>
                                    <Select 
                                      value={ratingToSelectValue(editingLink.contentRating)} 
                                      onValueChange={(value) =>
                                        setEditingLink({
                                          ...editingLink,
                                          contentRating: selectValueToRating(value as ContentRatingSelectValue)
                                        })
                                      }
                                    >
                                      <SelectTrigger className="h-10 text-base">
                                        <SelectValue placeholder="Select content rating (optional)" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="none">No Rating</SelectItem>
                                        <SelectItem value="N">N (Partial)</SelectItem>
                                        <SelectItem value="NN">NN (Full)</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  {/* Action buttons */}
                                  <div className="flex gap-4 justify-end pt-6">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="lg"
                                      onClick={handleCancelEdit}
                                      className="px-8 py-2"
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="default"
                                      size="lg"
                                      onClick={handleSaveEdit}
                                      className="px-8 py-2"
                                    >
                                      Save Changes
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteLink(index)}
                          className="h-6 w-8 text-xs p-0 bg-white/90 hover:bg-white text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tags display below image */}
                <div className="mt-1 space-y-1">
                  {/* Actresses */}
                  {link.actresses.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {link.actresses.slice(0, 2).map((actress, i) => (
                        <Badge key={i} variant="secondary" className="text-xs h-auto py-0 px-1">
                          {actress}
                        </Badge>
                      ))}
                      {link.actresses.length > 2 && (
                        <Badge variant="outline" className="text-xs h-auto py-0 px-1">
                          +{link.actresses.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  {/* Content Rating */}
                  {link.contentRating && (
                    <div className="flex justify-center">
                      {getContentRatingBadge(link.contentRating)}
                    </div>
                  )}

                  {/* Untagged indicator */}
                  {status === 'none' && (
                    <div className="text-center">
                      <Badge variant="outline" className="text-xs opacity-50">
                        Click to tag
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Empty State - shown when no manual links exist */}
        {manualLinks.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <div className="space-y-3">
              <div className="flex justify-center">
                <div className="p-3 bg-muted/50 rounded-full">
                  <Users className="h-8 w-8 opacity-50" />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium mb-1">No Manual Images Yet</h3>
                <p className="text-xs leading-relaxed max-w-sm mx-auto">
                  {placeholder || "Use the drag & drop area in the grid above or click Add Link to start adding individual image links."}
                </p>
                {selectedActresses.length > 0 && (
                  <p className="text-xs text-amber-700 mt-2">
                    When you add images, actress selection will be limited to: {selectedActresses.join(', ')}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Add New Manual Link Dialog */}
        <Dialog open={isAddingManual} onOpenChange={setIsAddingManual}>
          <DialogContent className="!max-w-[1200px] max-h-[98vh] overflow-hidden">
            <DialogHeader className="pb-3">
              <DialogTitle className="text-xl">Add New Image Link</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-h-[88vh] overflow-y-auto">
              {/* Left side - Image preview */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-base font-medium">Image URL</Label>
                  <Input
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="h-10 text-base"
                  />
                </div>
                
                {/* Preview */}
                {newUrl && (
                  <div className="flex justify-center">
                    <ImageWithFallback
                      src={newUrl}
                      alt="Preview"
                      className="w-full max-w-lg h-96 object-contain rounded border bg-gray-50"
                    />
                  </div>
                )}
              </div>
              
              {/* Right side - Action buttons */}
              <div className="flex flex-col justify-center space-y-6">
                <div className="text-center text-muted-foreground">
                  <p className="text-base">Enter an image URL above to see a preview</p>
                  <p className="text-sm mt-2">Supported formats: JPG, PNG, GIF, WebP</p>
                </div>
                
                <div className="flex gap-4 justify-center pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => setIsAddingManual(false)}
                    className="px-8 py-2"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="lg"
                    onClick={handleAddManualLink}
                    disabled={!newUrl.trim()}
                    className="px-8 py-2"
                  >
                    Add Image
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Help Text */}
        <div className="text-xs text-muted-foreground space-y-1 bg-muted/50 p-3 rounded">
          <div><strong>💡 Visual Image Management:</strong></div>
          <div>• <strong>Drag & Drop:</strong> Use the large drop zone above to add multiple images by dragging from other browser windows</div>
          <div>• <strong>Quick Rating:</strong> Hover over images and click N or NN buttons for instant content rating</div>
          <div>• <strong>Full Editing:</strong> Click edit icon to manage actresses and detailed settings</div>
          <div>• <strong>Status Colors:</strong> Green (complete), Yellow (partial), Gray (untagged)</div>
          {selectedActresses.length > 0 && (
            <div>• <strong>Restricted Selection:</strong> Only actresses selected for this photobook are available for tagging</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}