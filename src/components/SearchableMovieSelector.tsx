import React, { useState } from 'react'
import { Check, ChevronsUpDown, Search, X } from 'lucide-react'
import { Button } from './ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Badge } from './ui/badge'
import { cn } from './ui/utils'
import { movieCodeMatchesQuery } from '../utils/masterDataApi'

export interface Movie {
  id: string
  code?: string
  titleEn?: string
  titleJp?: string
  type?: string
}

interface SearchableMovieSelectorProps {
  movies: Movie[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  excludeId?: string
  isLoading?: boolean
}

export function SearchableMovieSelector({
  movies,
  value,
  onValueChange,
  placeholder = "Select movie...",
  excludeId,
  isLoading = false
}: SearchableMovieSelectorProps) {
  const [open, setOpen] = useState(false)

  const filteredMovies = movies.filter(movie => movie.id !== excludeId)
  const selectedMovie = movies.find(movie => movie.id === value)

  // Sort movies for better UX - put movies with codes first, then by title
  const sortedMovies = [...filteredMovies].sort((a, b) => {
    // Movies with codes come first
    if (a.code && !b.code) return -1
    if (!a.code && b.code) return 1
    
    // Then sort by code or title
    const aDisplay = a.code || a.titleEn || a.titleJp || ''
    const bDisplay = b.code || b.titleEn || b.titleJp || ''
    return aDisplay.localeCompare(bDisplay)
  })

  const displayMovie = (movie: Movie, isInButton = false) => (
    <div className="flex items-center gap-2 min-w-0">
      <Badge variant="secondary" className="text-xs flex-shrink-0">
        {movie.type || 'N/A'}
      </Badge>
      <span className="font-mono text-xs text-muted-foreground flex-shrink-0">
        {movie.code || 'No Code'}
      </span>
      <span className={`truncate min-w-0 ${isInButton ? 'max-w-[150px] sm:max-w-[200px]' : 'max-w-[250px]'}`}>
        {movie.titleEn || movie.titleJp || 'Untitled'}
      </span>
    </div>
  )

  return (
    <div className="relative">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between min-w-0"
            disabled={isLoading}
          >
            <div className="flex-1 min-w-0">
              {isLoading ? (
                <span className="text-muted-foreground">Loading movies...</span>
              ) : selectedMovie ? (
                displayMovie(selectedMovie, true)
              ) : (
                <span className="text-muted-foreground truncate">{placeholder}</span>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Search movies..." 
            className="h-9"
          />
          <div className="px-2 py-1 text-xs text-muted-foreground border-b">
            {isLoading ? 'Loading...' : `${sortedMovies.length} movies available`}
          </div>
          <CommandList>
            <CommandEmpty>
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Search className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No movies found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Try searching by code, title, or type
                </p>
              </div>
            </CommandEmpty>
            <CommandGroup>
              {sortedMovies.map((movie) => {
                // Create search-friendly value that includes code without dashes
                const codeWithoutDashes = movie.code ? movie.code.replace(/-/g, '') : ''
                const searchValue = `${movie.code || ''} ${codeWithoutDashes} ${movie.titleEn || ''} ${movie.titleJp || ''} ${movie.type || ''}`
                
                return (
                <CommandItem
                  key={movie.id}
                  value={searchValue}
                  onSelect={() => {
                    onValueChange(movie.id)
                    setOpen(false)
                  }}
                  className="flex items-center gap-2 min-w-0"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 flex-shrink-0",
                      value === movie.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    {displayMovie(movie)}
                  </div>
                </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
    
    {selectedMovie && (
      <Button
        variant="ghost"
        size="sm"
        className="absolute right-8 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
        onClick={() => onValueChange('')}
      >
        <X className="h-3 w-3" />
      </Button>
    )}
  </div>
  )
}