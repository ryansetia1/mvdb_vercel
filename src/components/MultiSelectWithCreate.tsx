import { useState, useEffect } from 'react'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from './ui/command'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Check, ChevronDown, Plus, X } from 'lucide-react'
import { MasterDataItem, masterDataApi } from '../utils/masterDataApi'

interface MultiSelectWithCreateProps {
  type: string
  value: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  accessToken: string
}

export function MultiSelectWithCreate({ 
  type, 
  value, 
  onChange, 
  placeholder = "Pilih...",
  accessToken 
}: MultiSelectWithCreateProps) {
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<MasterDataItem[]>([])
  const [newItemName, setNewItemName] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadOptions()
  }, [type])

  const loadOptions = async () => {
    setIsLoading(true)
    try {
      const items = await masterDataApi.getByType(type, accessToken)
      setOptions(items)
    } catch (error) {
      console.log(`Error loading ${type} options:`, error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelect = (optionName: string) => {
    const newValue = value.includes(optionName)
      ? value.filter(v => v !== optionName)
      : [...value, optionName]
    onChange(newValue)
  }

  // Get display name for an option (handles series with titleEn/titleJp)
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

  const handleRemove = (optionName: string) => {
    onChange(value.filter(v => v !== optionName))
  }

  const handleCreateNew = async () => {
    if (!newItemName.trim()) return

    try {
      let newItem: MasterDataItem
      // Some master data types require extended creation payloads
      if (type === 'series') {
        newItem = await masterDataApi.createExtended('series', { titleEn: newItemName.trim() }, accessToken)
      } else if (type === 'studio') {
        newItem = await masterDataApi.createExtended('studio', { name: newItemName.trim() }, accessToken)
      } else if (type === 'label') {
        newItem = await masterDataApi.createExtended('label', { name: newItemName.trim() }, accessToken)
      } else if (type === 'actor' || type === 'actress' || type === 'director') {
        newItem = await masterDataApi.createExtended(type as any, { name: newItemName.trim() }, accessToken)
      } else {
        // Simple types (type, tag)
        newItem = await masterDataApi.create(type, newItemName.trim(), accessToken)
      }
      setOptions(prev => [...prev, newItem])
      handleSelect(getOptionValue(newItem))
      setNewItemName('')
    } catch (error) {
      console.log(`Error creating new ${type}:`, error)
    }
  }

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
            {value.length > 0 ? `${value.length} dipilih` : placeholder}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder={`Cari ${type}...`} />
            <CommandEmpty>
              <div className="p-4 space-y-2">
                <p>Tidak ditemukan.</p>
                <div className="flex gap-2">
                  <Input
                    placeholder={`Nama ${type} baru`}
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCreateNew()}
                  />
                  <Button onClick={handleCreateNew} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const displayName = getDisplayName(option)
                const optionValue = getOptionValue(option)
                return (
                  <CommandItem
                    key={option.id}
                    onSelect={() => handleSelect(optionValue)}
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${
                        value.includes(optionValue) ? "opacity-100" : "opacity-0"
                      }`}
                    />
                    {displayName}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map((item) => (
            <Badge key={item} variant="secondary" className="gap-1">
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
          ))}
        </div>
      )}
    </div>
  )
}