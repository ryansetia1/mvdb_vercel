import React from 'react'
import { Movie } from '../utils/movieApi'
import { MasterDataItem } from '../utils/masterDataApi'
import { MovieCard } from './MovieCard'
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
  User,
  UserCheck
} from 'lucide-react'

interface CategorizedMovieGridProps {
  searchQuery: string
  movies: Movie[]
  actresses: MasterDataItem[]
  actors: MasterDataItem[]
  directors: MasterDataItem[]
  onMovieSelect: (movie: Movie) => void
  onProfileSelect?: (type: 'actor' | 'actress' | 'director', name: string) => void
  onFilterSelect?: (filterType: string, filterValue: string, title?: string) => void
  accessToken: string
}

interface SearchCategory {
  type: 'movies' | 'actresses' | 'actors' | 'directors' | 'studios' | 'series' | 'tags' | 'labels'
  title: string
  icon: React.ReactNode
  items: any[]
  count: number
}

export function CategorizedMovieGrid({
  searchQuery,
  movies,
  actresses,
  actors,
  directors,
  onMovieSelect,
  onProfileSelect,
  onFilterSelect,
  accessToken
}: CategorizedMovieGridProps) {
  
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
        items: matchingMovies,
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
        items: matchingActresses,
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
        items: matchingActors,
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
        items: matchingDirectors,
        count: matchingDirectors.length
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
        items: matchingTags,
        count: matchingTags.length
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
        items: matchingSeries,
        count: matchingSeries.length
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
        items: matchingStudios,
        count: matchingStudios.length
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
        items: matchingLabels,
        count: matchingLabels.length
      })
    }

    return categories
  }

  const categories = getCategorizedResults()

  if (categories.length === 0) {
    return (
      <div className="text-center py-12">
        <Film className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-lg font-medium mb-2">No results found</h3>
        <p className="text-muted-foreground">
          No movies, cast, studios, or other items found for "{searchQuery}"
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {categories.map((category) => (
        <div key={category.type} className="space-y-4">
          {/* Category Header */}
          <div className="flex items-center gap-2">
            {category.icon}
            <h2 className="text-xl font-semibold">{category.title}</h2>
            <Badge variant="secondary">{category.count}</Badge>
          </div>

          {/* Category Content */}
          {category.type === 'movies' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
              {category.items.map((movie: Movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  onClick={() => onMovieSelect(movie)}
                  onActressClick={onProfileSelect ? (actressName, e) => {
                    e.stopPropagation()
                    onProfileSelect('actress', actressName)
                  } : undefined}
                  accessToken={accessToken}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
              {category.items.map((item, index) => (
                <button
                  key={index}
                  className="w-full cursor-pointer hover:bg-muted transition-colors border border-border rounded-lg p-4 text-left"
                  onClick={() => {
                    console.log('Button clicked:', category.type, item)
                    if (category.type === 'actresses' && onProfileSelect) {
                      console.log('Calling onProfileSelect for actress:', item.name)
                      onProfileSelect('actress', item.name)
                    } else if (category.type === 'actors' && onProfileSelect) {
                      console.log('Calling onProfileSelect for actor:', item.name)
                      onProfileSelect('actor', item.name)
                    } else if (category.type === 'directors' && onProfileSelect) {
                      console.log('Calling onProfileSelect for director:', item.name)
                      onProfileSelect('director', item.name)
                    } else if (category.type === 'tags' && onFilterSelect) {
                      console.log('Calling onFilterSelect for tag:', item)
                      onFilterSelect('tag', item, `Tag: ${item}`)
                    } else if (category.type === 'studios' && onFilterSelect) {
                      console.log('Calling onFilterSelect for studio:', item)
                      onFilterSelect('studio', item, `Studio: ${item}`)
                    } else if (category.type === 'series' && onFilterSelect) {
                      console.log('Calling onFilterSelect for series:', item)
                      onFilterSelect('series', item, `Series: ${item}`)
                    } else if (category.type === 'labels' && onFilterSelect) {
                      console.log('Calling onFilterSelect for label:', item)
                      onFilterSelect('label', item, `Label: ${item}`)
                    } else {
                      console.log('No handler found for:', category.type, 'onFilterSelect:', !!onFilterSelect, 'onProfileSelect:', !!onProfileSelect)
                    }
                  }}
                >
                  <div className="flex flex-col items-center text-center space-y-2">
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                      {category.icon}
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-medium text-sm leading-tight">
                        {category.type === 'actresses' || category.type === 'actors' || category.type === 'directors' 
                          ? item.name || item.jpname || item.alias
                          : item
                        }
                      </h3>
                      {(category.type === 'actresses' || category.type === 'actors' || category.type === 'directors') && (
                        <p className="text-xs text-muted-foreground">
                          {item.jpname && item.jpname !== item.name ? item.jpname : item.alias}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
