import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'
import { 
  ArrowLeft, 
  Calendar, 
  Users, 
  ExternalLink, 
  PlayCircle,
  Edit,
  Subtitles
} from 'lucide-react'
import { ImageWithFallback } from '../figma/ImageWithFallback'
import { CroppedImage } from '../CroppedImage'
import { SCMovie, scMovieApi } from '../../utils/scMovieApi'
import { Movie, movieApi } from '../../utils/movieApi'
import { processCoverUrl } from './movieDetail/MovieDetailHelpers'

interface SCMovieDetailContentProps {
  scMovie: SCMovie
  onBack: () => void
  onEdit?: (scMovie: SCMovie) => void
  accessToken: string
  onMovieSelect?: (movie: Movie) => void
  onProfileSelect?: (type: 'actor' | 'actress' | 'director', name: string) => void
}

export function SCMovieDetailContent({ scMovie, onBack, onEdit, accessToken, onMovieSelect, onProfileSelect }: SCMovieDetailContentProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [currentSCMovie, setCurrentSCMovie] = useState<SCMovie>(scMovie)
  const [hcMovieData, setHcMovieData] = useState<Movie | null>(null)
  const [isHoverHCBadge, setIsHoverHCBadge] = useState(false)
  const [isLoadingHCPreview, setIsLoadingHCPreview] = useState(false)

  // Reload SC movie data if needed
  const reloadSCMovie = async () => {
    if (!scMovie.id) return
    
    try {
      setIsLoading(true)
      const updatedSCMovie = await scMovieApi.getSCMovie(scMovie.id)
      setCurrentSCMovie(updatedSCMovie)
    } catch (error) {
      console.error('Failed to reload SC movie:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  const handleStreamingLinkClick = (url: string) => {
    if (url.trim()) {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  const handleHCCodeClick = async (hcCode: string) => {
    if (!hcCode.trim() || !onMovieSelect) return
    
    try {
      // Search for HC movie with the given code
      const movies = await movieApi.getMovies(accessToken)
      const hcMovie = movies.find((movie: Movie) => 
        movie.code?.toLowerCase() === hcCode.toLowerCase()
      )
      
      if (hcMovie) {
        // Navigate to HC movie detail page
        onMovieSelect(hcMovie)
      } else {
        console.log('HC movie not found for code:', hcCode)
        // You could show a toast notification here if needed
      }
    } catch (error) {
      console.error('Error searching for HC movie:', error)
    }
  }

  const handleHCBadgeHover = async (hcCode: string) => {
    if (!hcCode.trim() || hcMovieData) return
    
    try {
      setIsLoadingHCPreview(true)
      // Fetch HC movie data for preview
      const movies = await movieApi.getMovies(accessToken)
      const hcMovie = movies.find((movie: Movie) => 
        movie.code?.toLowerCase() === hcCode.toLowerCase()
      )
      
      if (hcMovie) {
        console.log('HC Movie found:', hcMovie)
        console.log('HC Movie cover URL:', hcMovie.cover)
        console.log('HC Movie dmcode:', hcMovie.dmcode)
        const processedUrl = processCoverUrl(hcMovie)
        console.log('Processed cover URL:', processedUrl)
        setHcMovieData(hcMovie)
      }
    } catch (error) {
      console.error('Error fetching HC movie for preview:', error)
    } finally {
      setIsLoadingHCPreview(false)
    }
  }

  const handleHCBadgeMouseEnter = (hcCode: string) => {
    setIsHoverHCBadge(true)
    handleHCBadgeHover(hcCode)
  }

  const handleHCBadgeMouseLeave = () => {
    setIsHoverHCBadge(false)
  }

  const renderCastSection = () => {
    if (!currentSCMovie.cast) return null

    const castList = currentSCMovie.cast.split(',').map(name => name.trim()).filter(name => name)
    
    if (castList.length === 0) return null

    const handleCastClick = async (castMember: string) => {
      if (onProfileSelect) {
        try {
          // Try to determine if it's an actress or actor by checking the database
          const movies = await movieApi.getMovies(accessToken)
          
          // Check if this name appears as an actress in any movie
          const isActress = movies.some(movie => 
            movie.actress && movie.actress.toLowerCase().includes(castMember.toLowerCase())
          )
          
          // Check if this name appears as an actor in any movie
          const isActor = movies.some(movie => 
            movie.actors && movie.actors.toLowerCase().includes(castMember.toLowerCase())
          )
          
          // Determine the type based on what we found
          let castType: 'actor' | 'actress' | 'director' = 'actress' // default
          
          if (isActor && !isActress) {
            castType = 'actor'
          } else if (isActress && !isActor) {
            castType = 'actress'
          } else if (isActor && isActress) {
            // If found in both, prefer actress (common case)
            castType = 'actress'
          }
          
          onProfileSelect(castType, castMember)
        } catch (error) {
          console.error('Error determining cast type:', error)
          // Fallback to actress if we can't determine
          onProfileSelect('actress', castMember)
        }
      }
    }

    return (
      <div className="space-y-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-5 w-5" />
          Cast
        </h3>
        <div className="flex flex-wrap gap-2">
          {castList.map((castMember, index) => (
            <Badge 
              key={index} 
              variant="secondary" 
              className={`px-3 py-1 ${onProfileSelect ? 'cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors' : ''}`}
              onClick={() => onProfileSelect && handleCastClick(castMember)}
            >
              {castMember}
            </Badge>
          ))}
        </div>
      </div>
    )
  }

  const renderStreamingLinks = (links: string[], title: string) => {
    const validLinks = links.filter(link => link.trim())
    
    if (validLinks.length === 0) return null

    return (
      <div className="space-y-3">
        <h4 className="font-medium text-base">{title}</h4>
        <div className="space-y-2">
          {validLinks.map((link, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => handleStreamingLinkClick(link)}
              className="flex items-center gap-2 justify-start w-full text-left"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="truncate">{link}</span>
            </Button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="lg"
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-3"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Soft Content
        </Button>
        
        {onEdit && (
          <Button
            variant="outline"
            size="lg"
            onClick={() => onEdit(currentSCMovie)}
            className="flex items-center gap-2 px-6 py-3"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cover Image */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-0">
              <div className="aspect-[7/10] relative overflow-hidden rounded-lg">
                {isHoverHCBadge && hcMovieData ? (
                  (() => {
                    const processedCoverUrl = processCoverUrl(hcMovieData)
                    return processedCoverUrl ? (
                      <CroppedImage
                        src={processedCoverUrl}
                        alt={hcMovieData.titleEn || hcMovieData.titleJp || 'HC Movie cover'}
                        className="w-full h-full transition-all duration-300"
                        cropToRight={true}
                        fixedSize={false}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
                        <div className="text-center p-2">
                          <div className="text-xs">No HC Cover Available</div>
                        </div>
                      </div>
                    )
                  })()
                ) : (
                  <ImageWithFallback
                    src={currentSCMovie.cover}
                    alt={currentSCMovie.titleEn}
                    className="w-full h-full object-cover transition-all duration-300"
                  />
                )}
                
                {/* HC Preview overlay indicator */}
                {isHoverHCBadge && (
                  <div className="absolute top-4 right-4">
                    <Badge 
                      variant="secondary"
                      className="bg-blue-600/90 text-white border-none animate-pulse text-xs"
                    >
                      {isLoadingHCPreview ? 'Loading HC...' : 'HC Preview (Right Crop)'}
                    </Badge>
                  </div>
                )}
                
                {/* Badges overlay */}
                <div className="absolute top-4 left-4 space-y-2">
                  <Badge 
                    variant="secondary" 
                    className="bg-black/80 text-white border-none"
                  >
                    {currentSCMovie.scType === 'real_cut' ? 'Real Cut' : 'Regular Censorship'}
                  </Badge>
                  
                  {currentSCMovie.hasEnglishSubs && (
                    <Badge 
                      variant="secondary" 
                      className="bg-green-600/90 text-white border-none flex items-center gap-1"
                    >
                      <Subtitles className="h-3 w-3" />
                      EN SUB
                    </Badge>
                  )}
                </div>

                {/* HC Code badge */}
                {currentSCMovie.hcCode && (
                  <div className="absolute bottom-4 right-4">
                    <Badge 
                      variant="outline" 
                      className="bg-white/95 text-black border-gray-300 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={() => handleHCCodeClick(currentSCMovie.hcCode!)}
                      onMouseEnter={() => handleHCBadgeMouseEnter(currentSCMovie.hcCode!)}
                      onMouseLeave={handleHCBadgeMouseLeave}
                      title="Click to view HC movie • Hover to preview HC cover"
                    >
                      HC: {currentSCMovie.hcCode}
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                {currentSCMovie.titleEn}
              </CardTitle>
              {currentSCMovie.titleJp && (
                <p className="text-lg text-muted-foreground">
                  {currentSCMovie.titleJp}
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">SC Release Date:</span>
                    <span>{formatDate(currentSCMovie.releaseDate)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">HC Release Date:</span>
                    <span>{formatDate(currentSCMovie.hcReleaseDate)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">Type:</span>
                    <Badge variant="secondary">
                      {currentSCMovie.scType === 'real_cut' ? 'Real Cut' : 'Regular Censorship'}
                    </Badge>
                  </div>
                  
                  {currentSCMovie.hcCode && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">HC Code:</span>
                      <Badge 
                        variant="outline" 
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                        onClick={() => handleHCCodeClick(currentSCMovie.hcCode!)}
                        onMouseEnter={() => handleHCBadgeMouseEnter(currentSCMovie.hcCode!)}
                        onMouseLeave={handleHCBadgeMouseLeave}
                        title="Click to view HC movie • Hover to preview HC cover"
                      >
                        {currentSCMovie.hcCode}
                      </Badge>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">English Subs:</span>
                    <Badge variant={currentSCMovie.hasEnglishSubs ? 'default' : 'secondary'}>
                      {currentSCMovie.hasEnglishSubs ? 'Available' : 'Not Available'}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Cast Section */}
              {renderCastSection()}

              <Separator />

              {/* Combined Streaming Links Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <PlayCircle className="h-5 w-5" />
                  <h3 className="text-lg font-medium">Streaming Links</h3>
                </div>

                {/* SC Streaming Links */}
                {currentSCMovie.scStreamingLinks && currentSCMovie.scStreamingLinks.filter(link => link.trim()).length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">Soft Content (SC) Version</h4>
                    <div className="space-y-2">
                      {currentSCMovie.scStreamingLinks.filter(link => link.trim()).map((link, index) => (
                        <a
                          key={index}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors group"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <PlayCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm truncate">{link}</span>
                          </div>
                          <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* HC Streaming Links */}
                {currentSCMovie.hcStreamingLinks && currentSCMovie.hcStreamingLinks.filter(link => link.trim()).length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">Hardcore (HC) Version</h4>
                    <div className="space-y-2">
                      {currentSCMovie.hcStreamingLinks.filter(link => link.trim()).map((link, index) => (
                        <a
                          key={index}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors group"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <PlayCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm truncate">{link}</span>
                          </div>
                          <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* No streaming links message */}
                {(!currentSCMovie.scStreamingLinks || currentSCMovie.scStreamingLinks.filter(link => link.trim()).length === 0) &&
                 (!currentSCMovie.hcStreamingLinks || currentSCMovie.hcStreamingLinks.filter(link => link.trim()).length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <PlayCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No streaming links available</p>
                  </div>
                )}
              </div>

              {/* Metadata */}
              {(currentSCMovie.createdAt || currentSCMovie.updatedAt) && (
                <>
                  <Separator />
                  <div className="text-xs text-muted-foreground space-y-1">
                    {currentSCMovie.createdAt && (
                      <p>Created: {formatDate(currentSCMovie.createdAt)}</p>
                    )}
                    {currentSCMovie.updatedAt && currentSCMovie.updatedAt !== currentSCMovie.createdAt && (
                      <p>Updated: {formatDate(currentSCMovie.updatedAt)}</p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}