import { useState } from 'react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command'
import { Check, ChevronDown, X } from 'lucide-react'
import { cn } from './ui/utils'

interface SearchableSelectProps {
  placeholder: string
  options: Array<{ value: string; label: string; count?: number }>
  value: string
  onValueChange: (value: string) => void
  searchThreshold?: number // Show search when options exceed this number
  className?: string
  icon?: React.ReactNode
}

export function SearchableSelect({
  placeholder,
  options,
  value,
  onValueChange,
  searchThreshold = 10,
  className,
  icon
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)

  const selectedOption = options.find(option => option.value === value)
  const showSearch = options.length > searchThreshold

  const handleSelect = (selectedValue: string) => {
    onValueChange(selectedValue)
    setOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onValueChange('all')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-[250px] justify-between",
            className
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            {icon && <span className="flex-shrink-0">{icon}</span>}
            <span className="truncate">
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {value !== 'all' && (
              <X 
                className="h-4 w-4 opacity-50 hover:opacity-100 transition-opacity"
                onClick={handleClear}
              />
            )}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0" align="start">
        <Command>
          {showSearch && (
            <CommandInput
              placeholder="Search..."
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          )}
          <CommandList className="max-h-[300px]">
            <CommandEmpty>
              No options found.
            </CommandEmpty>
            <CommandGroup>
              {/* All option */}
              <CommandItem
                value="all"
                onSelect={() => handleSelect('all')}
                className="flex items-center justify-between"
              >
                <div className="flex items-center">
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === 'all' ? "opacity-100" : "opacity-0"
                    )}
                  />
                  All {placeholder.toLowerCase()}
                </div>
                <Badge variant="secondary" className="ml-2">
                  {options.length}
                </Badge>
              </CommandItem>
              
              {/* Individual options */}
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={`${option.value} ${option.label}`}
                  onSelect={() => handleSelect(option.value)}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center min-w-0">
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 flex-shrink-0",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="truncate">{option.label}</span>
                  </div>
                  {option.count !== undefined && (
                    <Badge variant="secondary" className="ml-2 flex-shrink-0">
                      {option.count}
                    </Badge>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}