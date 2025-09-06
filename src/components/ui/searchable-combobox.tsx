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
  options: ComboBoxOption[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  className?: string
  disabled?: boolean
  triggerClassName?: string
}

export function SearchableComboBox({
  options,
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

  const selectedOption = options.find((option) => option.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
        <Command>
          <CommandInput 
            placeholder={searchPlaceholder} 
            className="h-9"
          />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(currentValue) => {
                    const selectedValue = currentValue === value ? "" : currentValue
                    onValueChange?.(selectedValue)
                    setOpen(false)
                  }}
                  // Add search terms for better matching
                  keywords={[option.label, ...(option.searchTerms || [])]}
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
    items.map(item => ({
      value: getValue(item),
      label: getLabel(item),
      searchTerms: getSearchTerms?.(item)
    })),
    [items, getValue, getLabel, getSearchTerms]
  )
}