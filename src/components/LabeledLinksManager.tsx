import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Plus, Trash2, ExternalLink, Check, ChevronsUpDown } from 'lucide-react'
import { LabeledLink, MasterDataItem, masterDataApi } from '../utils/masterDataApi'
import { cn } from './ui/utils'

interface LabeledLinksManagerProps {
  links: LabeledLink[]
  onChange: (links: LabeledLink[]) => void
  className?: string
  accessToken?: string
}

export function LabeledLinksManager({ links, onChange, className = '', accessToken }: LabeledLinksManagerProps) {
  const [newLink, setNewLink] = useState({ label: '', url: '' })
  const [presetOpen, setPresetOpen] = useState(false)
  const [linkLabels, setLinkLabels] = useState<MasterDataItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchValue, setSearchValue] = useState('')

  useEffect(() => {
    loadLinkLabels()
  }, [])

  const loadLinkLabels = async () => {
    try {
      setIsLoading(true)
      const labels = await masterDataApi.getByType('linklabel')
      setLinkLabels(labels)
    } catch (error) {
      console.log('Error loading link labels:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const addLink = async () => {
    if (!newLink.label.trim() || !newLink.url.trim()) return

    // Save new label to database if it doesn't exist and we have accessToken
    if (newLink.label.trim() && accessToken) {
      const existingLabel = linkLabels.find(label => 
        label.name?.toLowerCase() === newLink.label.toLowerCase()
      )
      
      if (!existingLabel) {
        try {
          await masterDataApi.create('linklabel', newLink.label.trim(), accessToken)
          await loadLinkLabels() // Refresh the list
        } catch (error) {
          console.log('Error saving link label:', error)
          // Continue anyway - don't block link creation
        }
      }
    }

    const link: LabeledLink = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      label: newLink.label.trim(),
      url: newLink.url.trim()
    }

    onChange([...links, link])
    setNewLink({ label: '', url: '' })
    setSearchValue('')
    setPresetOpen(false)
  }

  const removeLink = (id: string) => {
    onChange(links.filter(link => link.id !== id))
  }

  const updateLink = (id: string, field: 'label' | 'url', value: string) => {
    onChange(links.map(link => 
      link.id === id ? { ...link, [field]: value } : link
    ))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addLink()
    }
  }

  const handlePresetSelect = (value: string) => {
    setNewLink(prev => ({ ...prev, label: value }))
    setSearchValue(value)
    setPresetOpen(false)
  }

  const handleSearchChange = (value: string) => {
    setSearchValue(value)
    setNewLink(prev => ({ ...prev, label: value }))
  }

  return (
    <div className={className}>
      <Label className="text-sm font-medium mb-2 block">Links</Label>
      
      {/* Add new link form */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Add New Link</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Label</Label>
              
              <Popover open={presetOpen} onOpenChange={setPresetOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={presetOpen}
                    className="w-full justify-between"
                    disabled={isLoading}
                  >
                    {newLink.label || (isLoading ? "Loading labels..." : "Select existing or type new label...")}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command shouldFilter={false}>
                    <CommandInput 
                      placeholder="Search existing or type new label..." 
                      value={searchValue}
                      onValueChange={handleSearchChange}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {searchValue && (
                          <div className="p-4 text-center space-y-2">
                            <p className="text-sm text-muted-foreground">
                              Label &quot;{searchValue}&quot; will be created when you add the link.
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Close this and click Add Link to save.
                            </p>
                          </div>
                        )}
                      </CommandEmpty>
                      <CommandGroup>
                        {/* Show filtered labels */}
                        {linkLabels
                          .filter(label => 
                            !searchValue || 
                            label.name?.toLowerCase().includes(searchValue.toLowerCase())
                          )
                          .map((label) => (
                            <CommandItem
                              key={label.id}
                              value={label.name || ''}
                              onSelect={() => handlePresetSelect(label.name || '')}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  newLink.label === label.name ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {label.name}
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">URL</Label>
              <Input
                placeholder="https://example.com"
                value={newLink.url}
                onChange={(e) => setNewLink(prev => ({ ...prev, url: e.target.value }))}
                onKeyPress={handleKeyPress}
              />
            </div>
          </div>
          
          <Button 
            onClick={addLink} 
            size="sm" 
            className="w-full"
            disabled={!newLink.label.trim() || !newLink.url.trim()}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Link
          </Button>
        </CardContent>
      </Card>

      {/* Existing links */}
      {links.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Current Links ({links.length})</Label>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {links.map((link) => (
              <Card key={link.id} className="p-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Label</Label>
                    <Input
                      value={link.label}
                      onChange={(e) => updateLink(link.id, 'label', e.target.value)}
                      placeholder="Link label"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">URL</Label>
                    <div className="flex gap-2">
                      <Input
                        value={link.url}
                        onChange={(e) => updateLink(link.id, 'url', e.target.value)}
                        placeholder="https://example.com"
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(link.url, '_blank')}
                        disabled={!link.url}
                        className="px-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeLink(link.id)}
                        className="px-2 text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Preview:</span>
                    <span className="text-sm font-medium">{link.label}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {links.length === 0 && (
        <div className="text-center py-6 text-muted-foreground text-sm">
          No links added yet. Use the form above to add links.
        </div>
      )}
    </div>
  )
}