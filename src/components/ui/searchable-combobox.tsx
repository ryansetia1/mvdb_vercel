import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "./utils"
import { Button } from "./button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./command"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"

export interface ComboBoxOption {
  value: string
  label: string
  searchTerms?: string[] // Additional search terms for better matching
}

interface SearchableComboBoxProps {
  options?: ComboBoxOption[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  className?: string
  disabled?: boolean
  triggerClassName?: string
}

// Custom filtering function that prioritizes exact matches and sorts by relevance
function filterAndSortOptions(options: ComboBoxOption[], searchValue: string): ComboBoxOption[] {
  if (!searchValue.trim()) {
    return options
  }

  const searchLower = searchValue.toLowerCase().trim()
  
  return options
    .map(option => {
      const labelLower = option.label.toLowerCase()
      const searchTermsLower = (option.searchTerms || []).map(term => term.toLowerCase())
      
      // Calculate relevance score
      let score = 0
      
      // Exact match gets highest score
      if (labelLower === searchLower) {
        score = 1000
      }
      // Starts with search term gets high score
      else if (labelLower.startsWith(searchLower)) {
        score = 500
      }
      // Contains search term gets medium score
      else if (labelLower.includes(searchLower)) {
        score = 100
      }
      // Search terms match gets lower score
      else if (searchTermsLower.some(term => term.includes(searchLower))) {
        score = 50
      }
      
      return { option, score }
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ option }) => option)
}

export function SearchableComboBox({
  options = [],
  value,
  onValueChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search options...",
  emptyMessage = "No option found.",
  className,
  disabled = false,
  triggerClassName
}: SearchableComboBoxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")

  const selectedOption = options?.find((option) => option.value === value)
  
  // Filter and sort options based on search value
  const filteredOptions = React.useMemo(() => {
    return filterAndSortOptions(options, searchValue)
  }, [options, searchValue])

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      setSearchValue("")
    }
  }

  const handleSelect = (selectedValue: string) => {
    const newValue = selectedValue === value ? "" : selectedValue
    onValueChange?.(newValue)
    setOpen(false)
    setSearchValue("")
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            !selectedOption && "text-muted-foreground",
            triggerClassName
          )}
          disabled={disabled}
        >
          {selectedOption ? selectedOption.label : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("w-full p-0", className)} align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder={searchPlaceholder} 
            className="h-9"
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={handleSelect}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// Hook for easier option mapping
export function useComboBoxOptions<T>(
  items: T[],
  getValue: (item: T) => string,
  getLabel: (item: T) => string,
  getSearchTerms?: (item: T) => string[]
): ComboBoxOption[] {
  return React.useMemo(() => 
    (items || []).map(item => ({
      value: getValue(item),
      label: getLabel(item),
      searchTerms: getSearchTerms?.(item)
    })),
    [items, getValue, getLabel, getSearchTerms]
  )
}