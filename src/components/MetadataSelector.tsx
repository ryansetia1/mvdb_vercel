import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent } from './ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Separator } from './ui/separator'
import { Badge } from './ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command'
import { MasterDataItem, masterDataApi } from '../utils/masterDataApi'
import { Plus, X, Building, Tag, Play, Bookmark, ChevronDown, Check } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { cn } from './ui/utils'

interface MetadataSelectorProps {
  type: 'studio' | 'series' | 'type' | 'label'
  currentValue: string
  onValueChange: (newValue: string) => void
  accessToken: string
}

export function MetadataSelector({ type, currentValue, onValueChange, accessToken }: MetadataSelectorProps) {
  const [availableItems, setAvailableItems] = useState<MasterDataItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [open, setOpen] = useState(false)
  
  // Create new item form state
  const [newItemName, setNewItemName] = useState('')
  const [newItemDescription, setNewItemDescription] = useState('')
  const [newItemTitleJp, setNewItemTitleJp] = useState('') // For series Japanese title
  const [isSaving, setIsSaving] = useState(false)

  const typeLabels = {
    studio: 'Studio',
    series: 'Series', 
    type: 'Type',
    label: 'Label'
  }

  const typeIcons = {
    studio: Building,
    series: Play,
    type: Tag,
    label: Bookmark
  }

  const Icon = typeIcons[type]

  // Load available items on mount
  useEffect(() => {
    const loadItems = async () => {
      try {
        setIsLoading(true)
        console.log(`MetadataSelector: Loading ${type} items...`)
        const items = await masterDataApi.getByType(type, accessToken)
        console.log(`MetadataSelector: Loaded ${items?.length || 0} ${type} items:`, items)
        setAvailableItems(items || [])
      } catch (error) {
        console.error(`MetadataSelector: Failed to load ${type}s:`, error)
        toast.error(`Failed to load ${type} data`)
      } finally {
        setIsLoading(false)
      }
    }

    loadItems()
  }, [type, accessToken])

  // Create new item
  const createNewItem = async () => {
    if (!newItemName.trim()) {
      toast.error('Name is required')
      return
    }

    // Check if name already exists - use correct field based on type
    const existingName = type === 'series' 
      ? availableItems.some(item => item.titleEn === newItemName.trim())
      : availableItems.some(item => item.name === newItemName.trim())
      
    if (existingName) {
      toast.error(`A ${typeLabels[type].toLowerCase()} with this name already exists`)
      return
    }

    try {
      setIsSaving(true)
      
      let createdItem: MasterDataItem

      // Handle different types with their specific API calls
      switch (type) {
        case 'series':
          createdItem = await masterDataApi.createSeries(
            newItemName.trim(),
            newItemTitleJp.trim() || '', // Use the Japanese title input
            '', // seriesLinks - optional for now  
            accessToken
          )
          break
          
        case 'studio':
          createdItem = await masterDataApi.createStudio(
            newItemName.trim(),
            '', // studioLinks - optional for now
            accessToken
          )
          break
          
        case 'label':
          createdItem = await masterDataApi.createLabel(
            newItemName.trim(),
            '', // labelLinks - optional for now
            accessToken
          )
          break
          
        case 'type':
        default:
          // Simple create for type and other simple entities
          createdItem = await masterDataApi.create(type, newItemName.trim(), accessToken)
          break
      }
      
      // Add to available items
      setAvailableItems(prev => [...prev, createdItem])
      
      // Set as current value - use the correct field based on type
      const displayName = type === 'series' ? createdItem.titleEn : createdItem.name
      onValueChange(displayName || '')

      // Reset form
      setNewItemName('')
      setNewItemDescription('')
      setNewItemTitleJp('')
      setShowCreateDialog(false)
      
      toast.success(`${typeLabels[type]} created and set successfully`)
    } catch (error) {
      console.error('Failed to create item:', error)
      toast.error(`Failed to create ${typeLabels[type].toLowerCase()}`)
    } finally {
      setIsSaving(false)
    }
  }

  // Clear current value
  const clearValue = () => {
    onValueChange('')
  }

  // Handle selection from dropdown
  const handleSelect = (selectedValue: string) => {
    onValueChange(selectedValue)
    setOpen(false)
  }

  // Get display name for an item
  const getDisplayName = (item: MasterDataItem): string => {
    return type === 'series' ? item.titleEn || '' : item.name || ''
  }

  // Get description for an item
  const getDisplayDescription = (item: MasterDataItem): string => {
    return type === 'series' && item.titleJp ? item.titleJp : item.description || ''
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        <span className="text-sm text-muted-foreground">Loading {typeLabels[type].toLowerCase()}s...</span>
      </div>
    )
  }

  // Show debug info for series if no items loaded
  if (type === 'series' && availableItems.length === 0) {
    return (
      <div className="space-y-3 p-4 border border-yellow-200 bg-yellow-50 rounded-md">
        <p className="text-sm text-yellow-800">
          Debug: No series data loaded. Check console for errors.
        </p>
        <p className="text-xs text-yellow-600">
          Available items: {availableItems.length}
        </p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => {
            console.log('Manual test - Loading series data...')
            masterDataApi.getByType('series', accessToken)
              .then(data => {
                console.log('Manual test - Series data received:', data)
                toast.success(`Loaded ${data?.length || 0} series items`)
                setAvailableItems(data || [])
              })
              .catch(error => {
                console.error('Manual test - Error loading series:', error)
                toast.error(`Failed to load series: ${error.message}`)
              })
          }}
        >
          Test Load Series
        </Button>
        
        {/* Modern Dropdown Selector (even in debug mode) */}
        <div className="space-y-2">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
                disabled
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate text-muted-foreground">
                    No {typeLabels[type].toLowerCase()}s available
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
          </Popover>
        </div>

        <Separator />
        
        {/* Still show create option */}
        <div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Create New {typeLabels[type]}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New {typeLabels[type]}</DialogTitle>
                <DialogDescription>
                  Add a new {typeLabels[type].toLowerCase()} to the database and set it for this movie
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">
                    {type === 'series' ? 'English Title *' : 'Name *'}
                  </Label>
                  <Input
                    id="name"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder={type === 'series' ? 'Series English title' : `${typeLabels[type]} name`}
                  />
                </div>
                
                {type === 'series' && (
                  <div>
                    <Label htmlFor="titleJp">Japanese Title</Label>
                    <Input
                      id="titleJp"
                      value={newItemTitleJp}
                      onChange={(e) => setNewItemTitleJp(e.target.value)}
                      placeholder="Series Japanese title (optional)"
                    />
                  </div>
                )}
                
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCreateDialog(false)
                      setNewItemName('')
                      setNewItemDescription('')
                      setNewItemTitleJp('')
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={createNewItem}
                    disabled={isSaving || !newItemName.trim()}
                    className="flex-1"
                  >
                    {isSaving ? 'Creating...' : 'Create & Set'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Current Value Display */}
      {currentValue && (
        <div className="flex items-center gap-2">
          <Badge variant="default" className="flex items-center gap-2">
            <Icon className="h-3 w-3" />
            <span>{currentValue}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 hover:bg-transparent"
              onClick={clearValue}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        </div>
      )}

      {/* Modern Dropdown Selector */}
      <div className="space-y-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">
                  {currentValue || `Select ${typeLabels[type].toLowerCase()}...`}
                </span>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {currentValue && (
                  <X 
                    className="h-4 w-4 opacity-50 hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      clearValue()
                    }}
                  />
                )}
                <ChevronDown className="h-4 w-4 opacity-50" />
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
            <Command>
              <CommandInput
                placeholder={`Search ${typeLabels[type].toLowerCase()}s...`}
                className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              />
              <CommandList className="max-h-[300px]">
                <CommandEmpty>
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2 p-4">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span className="text-sm text-muted-foreground">Loading...</span>
                    </div>
                  ) : (
                    <div className="p-4 text-center">
                      <p className="text-sm text-muted-foreground">
                        No {typeLabels[type].toLowerCase()}s found
                      </p>
                    </div>
                  )}
                </CommandEmpty>
                <CommandGroup>
                  {/* Clear option */}
                  {currentValue && (
                    <CommandItem
                      value="clear-selection"
                      onSelect={() => handleSelect('')}
                      className="flex items-center"
                    >
                      <X className="mr-2 h-4 w-4 opacity-50" />
                      Clear selection
                    </CommandItem>
                  )}
                  
                  {/* Available items */}
                  {availableItems.map((item) => {
                    const displayName = getDisplayName(item)
                    const displayDescription = getDisplayDescription(item)
                    const isSelected = currentValue === displayName
                    
                    return (
                      <CommandItem
                        key={item.id}
                        value={`${displayName} ${displayDescription}`.trim()}
                        onSelect={() => handleSelect(displayName)}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center min-w-0">
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4 flex-shrink-0",
                              isSelected ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <Icon className="mr-2 h-4 w-4 flex-shrink-0" />
                          <div className="text-left min-w-0">
                            <div className="font-medium truncate">{displayName}</div>
                            {displayDescription && (
                              <div className="text-xs text-muted-foreground truncate">
                                {displayDescription}
                              </div>
                            )}
                          </div>
                        </div>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Quick Select (Top 4 most recent) */}
      {!currentValue && availableItems.length > 0 && (
        <div>
          <Label className="text-xs text-muted-foreground">Quick Select</Label>
          <div className="flex flex-wrap gap-1 mt-1">
            {availableItems.slice(0, 4).map((item) => {
              const displayName = getDisplayName(item)
              return (
                <Button
                  key={item.id}
                  variant="outline"
                  size="sm"
                  className="h-6 text-xs px-2"
                  onClick={() => onValueChange(displayName)}
                >
                  {displayName}
                </Button>
              )
            })}
          </div>
        </div>
      )}

      <Separator />

      {/* Create New Item */}
      <div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Create New {typeLabels[type]}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New {typeLabels[type]}</DialogTitle>
              <DialogDescription>
                Add a new {typeLabels[type].toLowerCase()} to the database and set it for this movie
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">
                  {type === 'series' ? 'English Title *' : 'Name *'}
                </Label>
                <Input
                  id="name"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder={type === 'series' ? 'Series English title' : `${typeLabels[type]} name`}
                />
              </div>
              
              {type === 'series' && (
                <div>
                  <Label htmlFor="titleJp">Japanese Title</Label>
                  <Input
                    id="titleJp"
                    value={newItemTitleJp}
                    onChange={(e) => setNewItemTitleJp(e.target.value)}
                    placeholder="Series Japanese title (optional)"
                  />
                </div>
              )}
              
              {type !== 'series' && (
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newItemDescription}
                    onChange={(e) => setNewItemDescription(e.target.value)}
                    placeholder="Brief description..."
                    rows={2}
                  />
                </div>
              )}
              
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateDialog(false)
                    setNewItemName('')
                    setNewItemDescription('')
                    setNewItemTitleJp('')
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={createNewItem}
                  disabled={isSaving || !newItemName.trim()}
                  className="flex-1"
                >
                  {isSaving ? 'Creating...' : 'Create & Set'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}