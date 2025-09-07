import React, { useState, useEffect } from 'react'
import { Button } from '../../ui/button'
import { Badge } from '../../ui/badge'
import { Card, CardContent } from '../../ui/card'
import { ArrowRightLeft, ExternalLink } from 'lucide-react'
import { movieLinksApi, MovieLink } from '../../../utils/movieLinksApi'
import { movieApi, Movie } from '../../../utils/movieApi'
import { toast } from 'sonner'

interface LinkedMoviesSectionProps {
  movieId: string
  accessToken: string
  onMovieSelect: (movie: Movie) => void
  renderWrapper?: (content: React.ReactNode) => React.ReactNode
}

export function LinkedMoviesSection({ movieId, accessToken, onMovieSelect, renderWrapper }: LinkedMoviesSectionProps) {
  const [linkedMovies, setLinkedMovies] = useState<{movie: Movie, link: MovieLink}[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const truncate = (text: string, max: number) => {
    if (!text) return ''
    return text.length > max ? `${text.slice(0, max)}…` : text
  }

  useEffect(() => {
    loadLinkedMovies()
  }, [movieId, accessToken])

  const loadLinkedMovies = async () => {
    try {
      setIsLoading(true)
      const linksData = await movieLinksApi.getBidirectionalLinksForMovie(accessToken, movieId)
      
      // Combine both directions and get unique movie IDs
      const allLinks = [...linksData.asMain, ...linksData.asLinked]
      const linkedMovieIds = Array.from(new Set(
        allLinks.map(link => 
          link.primaryMovieId === movieId ? link.linkedMovieId : link.primaryMovieId
        )
      ))

      // Fetch movie details for each linked movie
      const linkedMoviesData = await Promise.all(
        linkedMovieIds.map(async (id) => {
          try {
            const movieData = await movieApi.getMovie(accessToken, id)
            const relevantLink = allLinks.find(link => 
              link.primaryMovieId === id || link.linkedMovieId === id
            )
            return { movie: movieData, link: relevantLink }
          } catch (error) {
            console.error(`Failed to load movie ${id}:`, error)
            return null
          }
        })
      )

      // Filter out null results
      setLinkedMovies(linkedMoviesData.filter(Boolean) as {movie: Movie, link: MovieLink}[])
    } catch (error) {
      console.error('Failed to load linked movies:', error)
      toast.error('Failed to load linked movies')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSwitchToMovie = (movie: Movie) => {
    onMovieSelect(movie)
    toast.success(`Switched to ${movie.titleEn || movie.titleJp || movie.code}`)
  }

  const content = (
    <div className="space-y-3">
      <h3 className="font-medium flex items-center gap-2">
        <ArrowRightLeft className="h-4 w-4" />
        Linked Movies ({linkedMovies.length})
      </h3>
      
      <div className="space-y-2">
        {linkedMovies.map(({ movie, link }) => (
          <Card key={movie.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Movie Type Badge */}
                  <Badge variant="outline" className="text-xs">
                    {movie.type || 'Unknown'}
                  </Badge>
                  
                  {/* Movie Code */}
                  {movie.code && (
                    <span className="font-mono text-xs text-muted-foreground flex-shrink-0">
                      {movie.code.toUpperCase()}
                    </span>
                  )}

                  {/* Movie Title (truncated) */}
                  <div className="flex-1 min-w-0 max-w-[180px] sm:max-w-[240px] md:max-w-[300px]">
                    <div className="font-medium text-sm truncate">
                      {truncate(movie.titleEn || movie.titleJp || movie.code || '', 20)}
                    </div>
                    {movie.titleJp && movie.titleEn && (
                      <div className="text-xs text-muted-foreground truncate">
                        {truncate(movie.titleJp, 20)}
                      </div>
                    )}
                  </div>
                  
                  {/* Link Type Badge */}
                  <Badge variant="secondary" className="text-xs">
                    {link.linkType || 'Related'}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSwitchToMovie(movie)}
                    className="flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  if (isLoading) {
    const loadingContent = (
      <div className="space-y-3">
        <h3 className="font-medium flex items-center gap-2">
          <ArrowRightLeft className="h-4 w-4" />
          Linked Movies
        </h3>
        <div className="animate-pulse">
          <div className="h-16 bg-muted rounded"></div>
        </div>
      </div>
    )
    
    return renderWrapper ? renderWrapper(loadingContent) : loadingContent
  }

  if (linkedMovies.length === 0) {
    return null // Don't show the section if no linked movies
  }

  return renderWrapper ? renderWrapper(content) : content
}
