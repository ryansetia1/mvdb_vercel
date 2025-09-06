import { useState, useEffect } from 'react'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from './ui/command'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Check, ChevronDown, Plus, X, UserIcon, Users } from 'lucide-react'
import { MasterDataItem, masterDataApi, castMatchesQuery, getAllAliases } from '../utils/masterDataApi'

interface CombinedCastSelectorProps {
  value: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  accessToken: string
}

export function CombinedCastSelector({ 
  value, 
  onChange, 
  placeholder = "Pilih cast...",
  accessToken 
}: CombinedCastSelectorProps) {
  const [open, setOpen] = useState(false)
  const [actresses, setActresses] = useState<MasterDataItem[]>([])
  const [actors, setActors] = useState<MasterDataItem[]>([])
  const [newItemName, setNewItemName] = useState('')
  const [newItemType, setNewItemType] = useState<'actress' | 'actor'>('actress')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadCastData()
  }, [])

  const loadCastData = async () => {
    setIsLoading(true)
    try {
      const [actressData, actorData] = await Promise.all([
        masterDataApi.getByType('actress'),
        masterDataApi.getByType('actor')
      ])
      setActresses(actressData)
      setActors(actorData)
    } catch (error) {
      console.log('Error loading cast data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelect = (castName: string) => {
    const newValue = value.includes(castName)
      ? value.filter(v => v !== castName)
      : [...value, castName]
    onChange(newValue)
  }

  // Get display name for an option
  const getDisplayName = (option: MasterDataItem): string => {
    if (option.name) return option.name
    if (option.titleEn && option.titleJp) return `${option.titleEn} / ${option.titleJp}`
    if (option.titleEn) return option.titleEn
    if (option.titleJp) return option.titleJp
    return option.id
  }

  // Get value for selection (what gets stored)
  const getOptionValue = (option: MasterDataItem): string => {
    if (option.name) return option.name
    if (option.titleEn) return option.titleEn
    if (option.titleJp) return option.titleJp
    return option.id
  }

  const handleRemove = (castName: string) => {
    onChange(value.filter(v => v !== castName))
  }

  const handleCreateNew = async () => {
    if (!newItemName.trim()) return

    try {
      const newItem = await masterDataApi.create(newItemType, newItemName.trim(), accessToken)
      
      // Update the appropriate list
      if (newItemType === 'actress') {
        setActresses(prev => [...prev, newItem])
      } else {
        setActors(prev => [...prev, newItem])
      }
      
      handleSelect(getOptionValue(newItem))
      setNewItemName('')
    } catch (error) {
      console.log(`Error creating new ${newItemType}:`, error)
    }
  }

  const allCastOptions = [
    ...actresses.map(actress => ({ ...actress, type: 'actress' as const })),
    ...actors.map(actor => ({ ...actor, type: 'actor' as const }))
  ].sort((a, b) => getDisplayName(a).localeCompare(getDisplayName(b)))

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="justify-between w-full"
          >
            {value.length > 0 ? `${value.length} cast dipilih` : placeholder}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Cari aktris atau aktor..." />
            <CommandEmpty>
              <div className="p-4 space-y-3">
                <p>Tidak ditemukan.</p>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button
                      variant={newItemType === 'actress' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setNewItemType('actress')}
                    >
                      <UserIcon className="h-3 w-3 mr-1" />
                      Aktris
                    </Button>
                    <Button
                      variant={newItemType === 'actor' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setNewItemType('actor')}
                    >
                      <Users className="h-3 w-3 mr-1" />
                      Aktor
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder={`Nama ${newItemType} baru`}
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleCreateNew()}
                    />
                    <Button onClick={handleCreateNew} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CommandEmpty>
            
            {/* Actresses Group */}
            <CommandGroup heading="Aktris">
              {actresses.map((actress) => {
                const displayName = getDisplayName(actress)
                const optionValue = getOptionValue(actress)
                const aliases = getAllAliases(actress)
                // Create search keywords including name, jpname, and all aliases
                const searchKeywords = [
                  actress.name,
                  actress.jpname,
                  ...aliases
                ].filter(Boolean).join(' ')
                
                return (
                  <CommandItem
                    key={`actress-${actress.id}`}
                    value={searchKeywords}
                    onSelect={() => handleSelect(optionValue)}
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${
                        value.includes(optionValue) ? "opacity-100" : "opacity-0"
                      }`}
                    />
                    <UserIcon className="mr-2 h-4 w-4 text-pink-500" />
                    <div className="flex flex-col">
                      <span>{displayName}</span>
                      {aliases.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          alias: {aliases.join(', ')}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>

            {/* Actors Group */}
            <CommandGroup heading="Aktor">
              {actors.map((actor) => {
                const displayName = getDisplayName(actor)
                const optionValue = getOptionValue(actor)
                const aliases = getAllAliases(actor)
                // Create search keywords including name, jpname, and all aliases
                const searchKeywords = [
                  actor.name,
                  actor.jpname,
                  ...aliases
                ].filter(Boolean).join(' ')
                
                return (
                  <CommandItem
                    key={`actor-${actor.id}`}
                    value={searchKeywords}
                    onSelect={() => handleSelect(optionValue)}
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${
                        value.includes(optionValue) ? "opacity-100" : "opacity-0"
                      }`}
                    />
                    <Users className="mr-2 h-4 w-4 text-blue-500" />
                    <div className="flex flex-col">
                      <span>{displayName}</span>
                      {aliases.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          alias: {aliases.join(', ')}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map((item) => {
            // Try to determine if this is an actress or actor based on the loaded data
            const isActress = actresses.some(a => getOptionValue(a) === item)
            const isActor = actors.some(a => getOptionValue(a) === item)
            
            return (
              <Badge 
                key={item} 
                variant="secondary" 
                className="gap-1 flex items-center"
              >
                {isActress && <UserIcon className="h-3 w-3 text-pink-500" />}
                {isActor && <Users className="h-3 w-3 text-blue-500" />}
                {item}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-muted-foreground hover:text-foreground"
                  onClick={() => handleRemove(item)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}