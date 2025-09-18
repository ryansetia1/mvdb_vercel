import React, { useState, useEffect, useRef } from 'react'
import { Movie } from '../utils/movieApi'
import { MasterDataItem } from '../utils/masterDataApi'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { 
  Film, 
  Users, 
  Building2, 
  Tag, 
  Bookmark, 
  Calendar,
  ChevronRight,
  User,
  UserCheck,
  Search
} from 'lucide-react'

interface SearchDropdownProps {
  searchQuery: string
  movies: Movie[]
  actresses: MasterDataItem[]
  actors: MasterDataItem[]
  directors: MasterDataItem[]
  onMovieSelect: (movie: Movie) => void
  onProfileSelect?: (type: 'actor' | 'actress' | 'director', name: string) => void
  onFilterSelect?: (filterType: string, filterValue: string, title?: string) => void
  accessToken: string
  isOpen: boolean
  onClose: () => void
}

interface SearchCategory {
  type: 'movies' | 'actresses' | 'actors' | 'directors' | 'studios' | 'series' | 'tags' | 'labels'
  title: string
  icon: React.ReactNode
  items: any[]
  count: number
}

export function SearchDropdown({
  searchQuery,
  movies,
  actresses,
  actors,
  directors,
  onMovieSelect,
  onProfileSelect,
  onFilterSelect,
  accessToken,
  isOpen,
  onClose
}: SearchDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  // Helper function to check if a cast member matches search query
  const castMatchesQuery = (castMember: MasterDataItem, query: string): boolean => {
    if (!query || !query.trim()) return true
    
    const searchQuery = query.toLowerCase().trim()
    
    // Check all name fields
    const nameFields = [
      castMember.name,
      castMember.jpname,
      castMember.kanjiName,
      castMember.kanaName,
      castMember.alias
    ].filter(Boolean)
    
    return nameFields.some(field => 
      field?.toLowerCase().includes(searchQuery)
    )
  }

  // Helper function to check if movie code matches query
  const movieCodeMatchesQuery = (movieCode: string | undefined, query: string): boolean => {
    if (!movieCode || !query || !query.trim()) return false
    
    const code = movieCode.toLowerCase()
    const searchQuery = query.toLowerCase().trim()
    
    // Direct match
    if (code.includes(searchQuery)) return true
    
    // Remove dashes and check
    const codeWithoutDashes = code.replace(/-/g, '')
    if (codeWithoutDashes.includes(searchQuery)) return true
    
    return false
  }

  // Helper function to check if movie contains cast that matches query
  const movieContainsCastWithQuery = (movie: Movie, query: string): boolean => {
    if (!query || !query.trim()) return true
    
    // Check actress
    if (movie.actress) {
      const actressNames = movie.actress.split(',').map(name => name.trim())
      for (const actressName of actressNames) {
        const actress = actresses.find(a => a.name === actressName)
        if (actress && castMatchesQuery(actress, query)) {
          return true
        }
        if (actressName.toLowerCase().includes(query.toLowerCase())) {
          return true
        }
      }
    }
    
    // Check actors
    if (movie.actors) {
      const actorNames = movie.actors.split(',').map(name => name.trim())
      for (const actorName of actorNames) {
        const actor = actors.find(a => a.name === actorName)
        if (actor && castMatchesQuery(actor, query)) {
          return true
        }
        if (actorName.toLowerCase().includes(query.toLowerCase())) {
          return true
        }
      }
    }
    
    // Check director
    if (movie.director) {
      const director = directors.find(d => d.name === movie.director)
      if (director && castMatchesQuery(director, query)) {
        return true
      }
      if (movie.director.toLowerCase().includes(query.toLowerCase())) {
        return true
      }
    }
    
    return false
  }

  // Get categorized search results
  const getCategorizedResults = (): SearchCategory[] => {
    const query = searchQuery.toLowerCase().trim()
    const categories: SearchCategory[] = []

    // Movies category
    const matchingMovies = movies.filter(movie =>
      movie.titleEn?.toLowerCase().includes(query) ||
      movie.titleJp?.toLowerCase().includes(query) ||
      movieCodeMatchesQuery(movie.code, query) ||
      movieCodeMatchesQuery(movie.dmcode, query) ||
      movie.studio?.toLowerCase().includes(query) ||
      movie.series?.toLowerCase().includes(query) ||
      movie.tags?.toLowerCase().includes(query) ||
      movie.label?.toLowerCase().includes(query) ||
      movieContainsCastWithQuery(movie, query)
    )

    if (matchingMovies.length > 0) {
      categories.push({
        type: 'movies',
        title: 'Movies',
        icon: <Film className="h-4 w-4" />,
        items: matchingMovies.slice(0, 3), // Show max 3 movies in dropdown
        count: matchingMovies.length
      })
    }

    // Actresses category
    const matchingActresses = actresses.filter(actress => castMatchesQuery(actress, query))
    if (matchingActresses.length > 0) {
      categories.push({
        type: 'actresses',
        title: 'Actresses',
        icon: <User className="h-4 w-4" />,
        items: matchingActresses.slice(0, 3), // Show max 3 actresses in dropdown
        count: matchingActresses.length
      })
    }

    // Actors category
    const matchingActors = actors.filter(actor => castMatchesQuery(actor, query))
    if (matchingActors.length > 0) {
      categories.push({
        type: 'actors',
        title: 'Actors',
        icon: <UserCheck className="h-4 w-4" />,
        items: matchingActors.slice(0, 3), // Show max 3 actors in dropdown
        count: matchingActors.length
      })
    }

    // Directors category
    const matchingDirectors = directors.filter(director => castMatchesQuery(director, query))
    if (matchingDirectors.length > 0) {
      categories.push({
        type: 'directors',
        title: 'Directors',
        icon: <Users className="h-4 w-4" />,
        items: matchingDirectors.slice(0, 3), // Show max 3 directors in dropdown
        count: matchingDirectors.length
      })
    }

    // Studios category
    const uniqueStudios = [...new Set(movies.map(m => m.studio).filter(Boolean))]
    const matchingStudios = uniqueStudios.filter(studio => 
      studio?.toLowerCase().includes(query)
    )
    if (matchingStudios.length > 0) {
      categories.push({
        type: 'studios',
        title: 'Studios',
        icon: <Building2 className="h-4 w-4" />,
        items: matchingStudios.slice(0, 3), // Show max 3 studios in dropdown
        count: matchingStudios.length
      })
    }

    // Series category
    const uniqueSeries = [...new Set(movies.map(m => m.series).filter(Boolean))]
    const matchingSeries = uniqueSeries.filter(series => 
      series?.toLowerCase().includes(query)
    )
    if (matchingSeries.length > 0) {
      categories.push({
        type: 'series',
        title: 'Series',
        icon: <Calendar className="h-4 w-4" />,
        items: matchingSeries.slice(0, 3), // Show max 3 series in dropdown
        count: matchingSeries.length
      })
    }

    // Tags category
    const allTags = movies.flatMap(m => m.tags?.split(',').map(tag => tag.trim()).filter(Boolean) || [])
    const uniqueTags = [...new Set(allTags)]
    const matchingTags = uniqueTags.filter(tag => 
      tag.toLowerCase().includes(query)
    )
    if (matchingTags.length > 0) {
      categories.push({
        type: 'tags',
        title: 'Tags',
        icon: <Tag className="h-4 w-4" />,
        items: matchingTags.slice(0, 3), // Show max 3 tags in dropdown
        count: matchingTags.length
      })
    }

    // Labels category
    const uniqueLabels = [...new Set(movies.map(m => m.label).filter(Boolean))]
    const matchingLabels = uniqueLabels.filter(label => 
      label?.toLowerCase().includes(query)
    )
    if (matchingLabels.length > 0) {
      categories.push({
        type: 'labels',
        title: 'Labels',
        icon: <Bookmark className="h-4 w-4" />,
        items: matchingLabels.slice(0, 3), // Show max 3 labels in dropdown
        count: matchingLabels.length
      })
    }

    return categories
  }

  const categories = getCategorizedResults()

  if (!isOpen || !searchQuery.trim()) {
    return null
  }

  if (categories.length === 0) {
    return (
      <div 
        ref={dropdownRef}
        className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
      >
        <div className="p-4 text-center text-muted-foreground">
          <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No results found for "{searchQuery}"</p>
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={dropdownRef}
      className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
    >
      <div className="p-4 space-y-4">
        <div className="text-sm text-muted-foreground mb-3">
          Results for "{searchQuery}" across {categories.length} categories
        </div>

        {categories.map((category) => (
          <div key={category.type} className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              {category.icon}
              <span>{category.title}</span>
              <Badge variant="secondary" className="text-xs">{category.count}</Badge>
            </div>
            
            <div className="space-y-1">
              {category.type === 'movies' ? (
                category.items.map((movie: Movie) => (
                  <div
                    key={movie.id}
                    className="flex items-center gap-3 p-2 hover:bg-muted rounded cursor-pointer"
                    onClick={() => {
                      onMovieSelect(movie)
                      onClose()
                    }}
                  >
                    <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                      <Film className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {movie.titleEn || movie.titleJp}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {movie.code} • {movie.studio}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                category.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-2 hover:bg-muted rounded cursor-pointer"
                    onClick={() => {
                      if (category.type === 'actresses' && onProfileSelect) {
                        onProfileSelect('actress', item.name)
                      } else if (category.type === 'actors' && onProfileSelect) {
                        onProfileSelect('actor', item.name)
                      } else if (category.type === 'directors' && onProfileSelect) {
                        onProfileSelect('director', item.name)
                      } else if (category.type === 'studios' && onFilterSelect) {
                        onFilterSelect('studio', item, `Studio: ${item}`)
                      } else if (category.type === 'series' && onFilterSelect) {
                        onFilterSelect('series', item, `Series: ${item}`)
                      } else if (category.type === 'tags' && onFilterSelect) {
                        onFilterSelect('tag', item, `Tag: ${item}`)
                      } else if (category.type === 'labels' && onFilterSelect) {
                        onFilterSelect('label', item, `Label: ${item}`)
                      }
                      onClose()
                    }}
                  >
                    <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                      {category.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {category.type === 'actresses' || category.type === 'actors' || category.type === 'directors' 
                          ? item.name || item.jpname || item.alias
                          : item
                        }
                      </div>
                      {category.type === 'actresses' || category.type === 'actors' || category.type === 'directors' ? (
                        <div className="text-xs text-muted-foreground truncate">
                          {item.jpname && item.jpname !== item.name ? item.jpname : item.alias}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
              
              {category.count > category.items.length && (
                <div className="text-xs text-muted-foreground text-center pt-1">
                  +{category.count - category.items.length} more
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
