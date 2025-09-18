import React from 'react'
import { Movie } from '../utils/movieApi'
import { MasterDataItem } from '../utils/masterDataApi'
import { MovieCard } from './MovieCard'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
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
  UserCheck
} from 'lucide-react'

interface CategorizedSearchResultsProps {
  searchQuery: string
  movies: Movie[]
  actresses: MasterDataItem[]
  actors: MasterDataItem[]
  directors: MasterDataItem[]
  onMovieSelect: (movie: Movie) => void
  onProfileSelect?: (type: 'actor' | 'actress' | 'director', name: string) => void
  accessToken: string
}

interface SearchCategory {
  type: 'movies' | 'actresses' | 'actors' | 'directors' | 'studios' | 'series' | 'tags' | 'labels'
  title: string
  icon: React.ReactNode
  items: any[]
  count: number
}

export function CategorizedSearchResults({
  searchQuery,
  movies,
  actresses,
  actors,
  directors,
  onMovieSelect,
  onProfileSelect,
  accessToken
}: CategorizedSearchResultsProps) {
  
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
        items: matchingMovies.slice(0, 6), // Show max 6 movies
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
        items: matchingActresses.slice(0, 6), // Show max 6 actresses
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
        items: matchingActors.slice(0, 6), // Show max 6 actors
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
        items: matchingDirectors.slice(0, 6), // Show max 6 directors
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
        items: matchingStudios.slice(0, 6), // Show max 6 studios
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
        items: matchingSeries.slice(0, 6), // Show max 6 series
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
        items: matchingTags.slice(0, 6), // Show max 6 tags
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
        items: matchingLabels.slice(0, 6), // Show max 6 labels
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
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">
        Found results for "{searchQuery}" across {categories.length} categories
      </div>

      {categories.map((category) => (
        <Card key={category.type}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {category.icon}
                <CardTitle className="text-lg">{category.title}</CardTitle>
                <Badge variant="secondary">{category.count}</Badge>
              </div>
              {category.count > category.items.length && (
                <Button variant="ghost" size="sm" className="text-xs">
                  View All ({category.count})
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
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
              <div className="flex flex-wrap gap-2">
                {category.items.map((item, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => {
                      if (category.type === 'actresses' && onProfileSelect) {
                        onProfileSelect('actress', item.name)
                      } else if (category.type === 'actors' && onProfileSelect) {
                        onProfileSelect('actor', item.name)
                      } else if (category.type === 'directors' && onProfileSelect) {
                        onProfileSelect('director', item.name)
                      }
                      // For studios, series, tags, labels - could implement filter functionality
                    }}
                  >
                    {category.type === 'actresses' || category.type === 'actors' || category.type === 'directors' 
                      ? item.name || item.jpname || item.alias
                      : item
                    }
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
