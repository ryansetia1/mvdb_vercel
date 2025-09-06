import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Card, CardContent } from './ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Label } from './ui/label'
import { Separator } from './ui/separator'
import { MasterDataItem, masterDataApi } from '../utils/masterDataApi'
import { Plus, X, Tag } from 'lucide-react'
import { toast } from 'sonner@2.0.3'

interface TagsManagerProps {
  currentTags: string // comma-separated tags
  onTagsChange: (newTags: string) => void
  accessToken: string
}

interface TagItem {
  name: string
  isExisting: boolean
  data?: MasterDataItem
}

export function TagsManager({ currentTags, onTagsChange, accessToken }: TagsManagerProps) {
  const [tagItems, setTagItems] = useState<TagItem[]>([])
  const [availableTags, setAvailableTags] = useState<MasterDataItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  
  // New tag form state
  const [newTagName, setNewTagName] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Search state for existing tags
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredTags, setFilteredTags] = useState<MasterDataItem[]>([])

  // Load available tags on mount
  useEffect(() => {
    const loadTags = async () => {
      try {
        setIsLoading(true)
        console.log('TagsManager: Loading tags...')
        const tags = await masterDataApi.getByType('tag', accessToken)
        console.log('TagsManager: Loaded tags:', tags)
        setAvailableTags(tags || [])
        setFilteredTags(tags || [])
      } catch (error) {
        console.error('TagsManager: Failed to load tags:', error)
        toast.error('Failed to load tags data')
      } finally {
        setIsLoading(false)
      }
    }

    loadTags()
  }, [accessToken])

  // Parse current tags on mount and when currentTags changes
  useEffect(() => {
    if (!currentTags) {
      setTagItems([])
      return
    }

    const names = currentTags.split(',').map(name => name.trim()).filter(Boolean)
    const items: TagItem[] = names.map(name => {
      const existingTag = availableTags.find(t => t.name === name)
      return {
        name,
        isExisting: !!existingTag,
        data: existingTag
      }
    })
    setTagItems(items)
  }, [currentTags, availableTags])

  // Filter tags based on search
  useEffect(() => {
    if (!searchQuery) {
      setFilteredTags(availableTags)
    } else {
      setFilteredTags(
        availableTags.filter(tag =>
          tag.name?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    }
  }, [searchQuery, availableTags])

  // Update parent when tag items change
  const updateParent = (items: TagItem[]) => {
    const tagsString = items.map(item => item.name).join(', ')
    onTagsChange(tagsString)
  }

  // Add existing tag
  const addExistingTag = (tag: MasterDataItem) => {
    if (!tag.name) return
    
    // Check if already added
    if (tagItems.some(item => item.name === tag.name)) {
      toast.error(`"${tag.name}" is already added`)
      return
    }

    const newItems = [...tagItems, {
      name: tag.name,
      isExisting: true,
      data: tag
    }]
    
    setTagItems(newItems)
    updateParent(newItems)
    setSearchQuery('')
  }

  // Remove tag item
  const removeTagItem = (index: number) => {
    const newItems = tagItems.filter((_, i) => i !== index)
    setTagItems(newItems)
    updateParent(newItems)
  }

  // Create new tag
  const createNewTag = async () => {
    if (!newTagName.trim()) {
      toast.error('Tag name is required')
      return
    }

    // Check if name already exists
    if (availableTags.some(t => t.name === newTagName.trim())) {
      toast.error('A tag with this name already exists')
      return
    }

    // Check if already in current tags
    if (tagItems.some(item => item.name === newTagName.trim())) {
      toast.error('This tag is already added')
      return
    }

    try {
      setIsSaving(true)
      
      const createdTag = await masterDataApi.create('tag', newTagName.trim(), accessToken)
      
      // Add to available tags
      setAvailableTags(prev => [...prev, createdTag])
      
      // Add to current tags
      const newItem: TagItem = {
        name: createdTag.name!,
        isExisting: true,
        data: createdTag
      }
      
      const newItems = [...tagItems, newItem]
      setTagItems(newItems)
      updateParent(newItems)

      // Reset form
      setNewTagName('')
      setShowCreateDialog(false)
      
      toast.success('Tag created and added successfully')
    } catch (error) {
      console.error('Failed to create tag:', error)
      toast.error('Failed to create tag')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
        <p className="text-sm text-muted-foreground">Loading tags...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Current Tags */}
      <div>
        <Label className="flex items-center gap-2 mb-3">
          <Tag className="h-4 w-4" />
          Current Tags
        </Label>
        
        {tagItems.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {tagItems.map((item, index) => (
              <Badge
                key={index}
                variant={item.isExisting ? "default" : "secondary"}
                className="flex items-center gap-2 px-3 py-1"
              >
                <span>{item.name}</span>
                {!item.isExisting && (
                  <span className="text-xs opacity-75">(new)</span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => removeTagItem(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No tags added</p>
        )}
      </div>

      <Separator />

      {/* Add Existing Tag */}
      <div>
        <Label className="block mb-2">Add Existing Tag</Label>
        <div className="space-y-2">
          <Input
            placeholder="Search tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          
          {searchQuery && filteredTags.length > 0 && (
            <Card className="max-h-48 overflow-y-auto">
              <CardContent className="p-2">
                <div className="space-y-1">
                  {filteredTags.slice(0, 10).map((tag) => (
                    <Button
                      key={tag.id}
                      variant="ghost"
                      className="w-full justify-start h-auto p-2"
                      onClick={() => addExistingTag(tag)}
                      disabled={tagItems.some(item => item.name === tag.name)}
                    >
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        <div className="text-left">
                          <div className="font-medium">{tag.name}</div>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {searchQuery && filteredTags.length === 0 && (
            <p className="text-sm text-muted-foreground py-2">
              No tags found matching "{searchQuery}"
            </p>
          )}
        </div>
      </div>

      {/* Quick Select Recent Tags */}
      {!searchQuery && availableTags.length > 0 && (
        <div>
          <Label className="text-xs text-muted-foreground block mb-2">Recent Tags</Label>
          <div className="flex flex-wrap gap-1">
            {availableTags.slice(0, 8).map((tag) => (
              <Button
                key={tag.id}
                variant="outline"
                size="sm"
                className="h-6 text-xs px-2"
                onClick={() => addExistingTag(tag)}
                disabled={tagItems.some(item => item.name === tag.name)}
              >
                {tag.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      <Separator />

      {/* Create New Tag */}
      <div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Create New Tag
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Tag</DialogTitle>
              <DialogDescription>
                Add a new tag to the database and add it to this movie
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="tagName">Tag Name *</Label>
                <Input
                  id="tagName"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Tag name"
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateDialog(false)
                    setNewTagName('')
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={createNewTag}
                  disabled={isSaving || !newTagName.trim()}
                  className="flex-1"
                >
                  {isSaving ? 'Creating...' : 'Create & Add'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}