import { useState } from 'react'
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react'
import { Badge } from './badge'
import { Button } from './button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './collapsible'
import { cn } from './utils'

interface FilterItem {
  key: string
  label: string
  value: string
  displayValue?: string
  onRemove: () => void
}

interface FilterIndicatorProps {
  filters: FilterItem[]
  onClearAll?: () => void
  className?: string
  totalResults?: number
  showResultCount?: boolean
}

export function FilterIndicator({ 
  filters, 
  onClearAll, 
  className,
  totalResults,
  showResultCount = true
}: FilterIndicatorProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const activeFilters = filters.filter(filter => 
    filter.value !== 'all' && 
    filter.value !== '' && 
    filter.value !== undefined
  )
  
  if (activeFilters.length === 0) {
    return null
  }

  const displayFilters = isExpanded ? activeFilters : activeFilters.slice(0, 3)
  const hasMoreFilters = activeFilters.length > 3

  return (
    <div className={cn("space-y-3", className)}>
      {/* Filter Summary Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-sm">
            <Filter className="h-4 w-4 text-primary" />
            <span className="font-medium">
              {activeFilters.length} filter{activeFilters.length !== 1 ? 's' : ''} active
            </span>
            {showResultCount && totalResults !== undefined && (
              <span className="text-muted-foreground">
                ({totalResults} result{totalResults !== 1 ? 's' : ''})
              </span>
            )}
          </div>
        </div>
        
        {onClearAll && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearAll}
            className="h-7 px-3 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {/* Active Filters */}
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <div className="space-y-2">
          {/* Always visible filters (first 3) */}
          <div className="flex flex-wrap gap-2">
            {displayFilters.map((filter) => (
              <Badge
                key={filter.key}
                variant="secondary"
                className="gap-2 py-1 px-3 text-xs hover:bg-secondary/80 transition-colors"
              >
                <span className="font-medium text-muted-foreground">
                  {filter.label}:
                </span>
                <span>{filter.displayValue || filter.value}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={filter.onRemove}
                  className="h-3 w-3 p-0 hover:bg-destructive hover:text-destructive-foreground rounded-full"
                >
                  <X className="h-2 w-2" />
                </Button>
              </Badge>
            ))}
          </div>

          {/* Expandable section for additional filters */}
          {hasMoreFilters && (
            <>
              <CollapsibleContent>
                <div className="flex flex-wrap gap-2">
                  {activeFilters.slice(3).map((filter) => (
                    <Badge
                      key={filter.key}
                      variant="secondary"
                      className="gap-2 py-1 px-3 text-xs hover:bg-secondary/80 transition-colors"
                    >
                      <span className="font-medium text-muted-foreground">
                        {filter.label}:
                      </span>
                      <span>{filter.displayValue || filter.value}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={filter.onRemove}
                        className="h-3 w-3 p-0 hover:bg-destructive hover:text-destructive-foreground rounded-full"
                      >
                        <X className="h-2 w-2" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </CollapsibleContent>

              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-3 w-3 mr-1" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3 mr-1" />
                      Show {activeFilters.length - 3} More
                    </>
                  )}
                </Button>
              </CollapsibleTrigger>
            </>
          )}
        </div>
      </Collapsible>
    </div>
  )
}