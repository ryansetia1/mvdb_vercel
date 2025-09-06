import { useState, useMemo, useRef, useEffect } from 'react'
import { Button } from './button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './command'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from './utils'

interface VirtualizedFilterSelectProps {
  value: string
  onValueChange: (value: string) => void
  options: string[]
  placeholder: string
  allLabel: string
  className?: string
  maxHeight?: string
  // When options exceed this number, virtualization will be enabled
  virtualizationThreshold?: number
}

export function VirtualizedFilterSelect({
  value,
  onValueChange,
  options,
  placeholder,
  allLabel,
  className = "w-40",
  maxHeight = "300px",
  virtualizationThreshold = 100
}: VirtualizedFilterSelectProps) {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const [visibleStartIndex, setVisibleStartIndex] = useState(0)
  const [visibleEndIndex, setVisibleEndIndex] = useState(50)
  const scrollElementRef = useRef<HTMLDivElement>(null)

  const filteredOptions = useMemo(() => {
    if (!searchValue.trim()) return options
    return options.filter(option =>
      option.toLowerCase().includes(searchValue.toLowerCase())
    )
  }, [options, searchValue])

  const displayValue = value === "all" ? allLabel : value
  const shouldVirtualize = filteredOptions.length > virtualizationThreshold

  // Virtual scrolling logic
  const itemHeight = 32 // Approximate height of each item in pixels
  const containerHeight = parseInt(maxHeight) || 300
  const visibleItemCount = Math.ceil(containerHeight / itemHeight)

  const visibleOptions = useMemo(() => {
    if (!shouldVirtualize) return filteredOptions
    return filteredOptions.slice(visibleStartIndex, visibleEndIndex)
  }, [filteredOptions, visibleStartIndex, visibleEndIndex, shouldVirtualize])

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    if (!shouldVirtualize) return
    
    const scrollTop = event.currentTarget.scrollTop
    const newStartIndex = Math.floor(scrollTop / itemHeight)
    const newEndIndex = Math.min(
      newStartIndex + visibleItemCount + 10, // Buffer for smooth scrolling
      filteredOptions.length
    )
    
    setVisibleStartIndex(newStartIndex)
    setVisibleEndIndex(newEndIndex)
  }

  // Reset scroll position when search changes
  useEffect(() => {
    if (scrollElementRef.current) {
      scrollElementRef.current.scrollTop = 0
      setVisibleStartIndex(0)
      setVisibleEndIndex(Math.min(visibleItemCount + 10, filteredOptions.length))
    }
  }, [searchValue, filteredOptions.length, visibleItemCount])

  const renderOption = (option: string, index: number) => (
    <CommandItem
      key={`${option}-${index}`}
      value={option}
      onSelect={() => {
        onValueChange(option)
        setOpen(false)
        setSearchValue("")
      }}
      style={shouldVirtualize ? { height: itemHeight } : undefined}
    >
      <Check
        className={cn(
          "mr-2 h-4 w-4",
          value === option ? "opacity-100" : "opacity-0"
        )}
      />
      <span className="truncate">{option}</span>
    </CommandItem>
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between", className)}
        >
          <span className="truncate">{displayValue || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput
            placeholder={`Search ${placeholder.toLowerCase()}...`}
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList
            ref={scrollElementRef}
            style={{ maxHeight }}
            onScroll={handleScroll}
          >
            <CommandEmpty>No {placeholder.toLowerCase()} found.</CommandEmpty>
            <CommandGroup>
              {/* Always show "All" option first */}
              <CommandItem
                value="all"
                onSelect={() => {
                  onValueChange("all")
                  setOpen(false)
                  setSearchValue("")
                }}
                style={shouldVirtualize ? { height: itemHeight } : undefined}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === "all" ? "opacity-100" : "opacity-0"
                  )}
                />
                {allLabel}
              </CommandItem>

              {/* Virtualized or regular options */}
              {shouldVirtualize ? (
                <>
                  {/* Spacer for items before visible range */}
                  {visibleStartIndex > 0 && (
                    <div style={{ height: visibleStartIndex * itemHeight }} />
                  )}
                  
                  {/* Visible items */}
                  {visibleOptions.map((option, index) => 
                    renderOption(option, visibleStartIndex + index)
                  )}
                  
                  {/* Spacer for items after visible range */}
                  {visibleEndIndex < filteredOptions.length && (
                    <div style={{ 
                      height: (filteredOptions.length - visibleEndIndex) * itemHeight 
                    }} />
                  )}
                </>
              ) : (
                // Non-virtualized rendering for smaller lists
                filteredOptions.map((option, index) => renderOption(option, index))
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}