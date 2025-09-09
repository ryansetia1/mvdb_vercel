import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { copyToClipboard } from '../utils/clipboard'
import { ModernLightbox } from './ModernLightbox'
import { ClickableProfileAvatar } from './ClickableProfileAvatar'
import { ImageWithFallback } from './figma/ImageWithFallback'
import { EnhancedGallery } from './EnhancedGallery'
import { ProfilePage } from './ProfilePage'
import { FilteredMovieList } from './FilteredMovieList'
import { Movie } from '../utils/movieApi'
import { processTemplate } from '../utils/templateUtils'
import { MasterDataItem, masterDataApi, calculateAgeAtDate } from '../utils/masterDataApi'
import { Calendar, Clock, User, Building, Tag, Play, Download, Link as LinkIcon, Edit, Copy, Maximize, ArrowLeft, Film } from 'lucide-react'

interface MoviePageProps {
  movie: Movie
  accessToken: string
  onEdit?: (movie: Movie) => void
  onBack?: () => void
  showEditButton?: boolean
  isAdminMode?: boolean
}

type ViewMode = 'movie' | 'profile' | 'filter'

interface ProfileView {
  type: 'actor' | 'actress' | 'director'
  name: string
}

interface FilterView {
  type: 'studio' | 'series' | 'type' | 'tag' | 'actress' | 'actor' | 'director'
  value: string
}

export function MoviePage({ 
  movie, 
  accessToken, 
  onEdit, 
  onBack, 
  showEditButton = true,
  isAdminMode = false
}: MoviePageProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('movie')
  const [profileView, setProfileView] = useState<ProfileView | null>(null)
  const [filterView, setFilterView] = useState<FilterView | null>(null)
  const [selectedMovie, setSelectedMovie] = useState<Movie>(movie)
  const [showFullCover, setShowFullCover] = useState(false)
  const [castData, setCastData] = useState<{ [name: string]: MasterDataItem }>({})
  const [isLoadingCast, setIsLoadingCast] = useState(true)

  const coverUrl = selectedMovie.cover && selectedMovie.dmcode 
    ? processTemplate(selectedMovie.cover, { dmcode: selectedMovie.dmcode })
    : selectedMovie.cover || ''

  // Load actor/actress data for age calculations and profile pictures
  useEffect(() => {
    const loadCastData = async () => {
      try {
        setIsLoadingCast(true)
        const [actresses, actors, directors] = await Promise.all([
          masterDataApi.getByType('actress'),
          masterDataApi.getByType('actor'),
          masterDataApi.getByType('director')
        ])

        const data: { [name: string]: MasterDataItem } = {}
        
        // Parse and add actress data (handle multiple actresses separated by comma)
        if (selectedMovie.actress) {
          selectedMovie.actress.split(',').forEach(actressName => {
            const trimmedName = actressName.trim()
            const actress = actresses.find(a => 
              a.name === trimmedName || 
              a.jpname === trimmedName || 
              a.alias === trimmedName
            )
            if (actress) data[trimmedName] = actress
          })
        }

        // Add actor data
        if (selectedMovie.actors) {
          selectedMovie.actors.split(',').forEach(actorName => {
            const trimmedName = actorName.trim()
            const actor = actors.find(a => 
              a.name === trimmedName || 
              a.jpname === trimmedName || 
              a.alias === trimmedName
            )
            if (actor) data[trimmedName] = actor
          })
        }

        // Add director data
        if (selectedMovie.director) {
          const director = directors.find(d => 
            d.name === selectedMovie.director || 
            d.jpname === selectedMovie.director || 
            d.alias === selectedMovie.director
          )
          if (director) data[selectedMovie.director] = director
        }

        setCastData(data)
      } catch (error) {
        console.error('Failed to load cast data:', error)
      } finally {
        setIsLoadingCast(false)
      }
    }

    loadCastData()
  }, [selectedMovie.actress, selectedMovie.actors, selectedMovie.director])

  // Parse links for different sections
  const parseLinks = (linksString?: string) => {
    if (!linksString) return []
    return linksString.split('\n').map(link => link.trim()).filter(link => link.length > 0)
  }

  const cLinks = parseLinks(selectedMovie.clinks)
  const uLinks = parseLinks(selectedMovie.ulinks)
  const sLinks = parseLinks(selectedMovie.slinks)

  // Copy to clipboard handler
  const handleCopyToClipboard = async (text: string, label: string) => {
    await copyToClipboard(text, label)
  }

  // Calculate age gaps with better handling for multiple actresses
  const calculateAgeGaps = () => {
    if (!selectedMovie.actress || !selectedMovie.actors || !selectedMovie.releaseDate) return null
    
    const actresses = selectedMovie.actress.split(',').map(name => name.trim())
    const actors = selectedMovie.actors.split(',').map(name => name.trim())
    
    const ageGaps: Array<{
      actress: string
      actor: string
      actressAge: number
      actorAge: number
      gap: number
      actressOlder: boolean
    }> = []

    actresses.forEach(actressName => {
      const actressInfo = castData[actressName]
      if (!actressInfo?.birthdate) return

      const actressAge = calculateAgeAtDate(actressInfo.birthdate, selectedMovie.releaseDate!)
      if (actressAge === null) return

      actors.forEach(actorName => {
        const actorInfo = castData[actorName]
        if (actorInfo?.birthdate) {
          const actorAge = calculateAgeAtDate(actorInfo.birthdate, selectedMovie.releaseDate!)
          if (actorAge !== null) {
            ageGaps.push({
              actress: actressName,
              actor: actorName,
              actressAge,
              actorAge,
              gap: Math.abs(actressAge - actorAge),
              actressOlder: actressAge > actorAge
            })
          }
        }
      })
    })

    return ageGaps.length > 0 ? ageGaps : null
  }

  // Navigation functions
  const openProfile = (type: 'actor' | 'actress' | 'director', name: string) => {
    setProfileView({ type, name })
    setViewMode('profile')
  }

  const openFilter = (type: 'studio' | 'series' | 'type' | 'tag' | 'actress' | 'actor' | 'director', value: string) => {
    setFilterView({ type, value })
    setViewMode('filter')
  }

  const goBackToMovie = () => {
    setViewMode('movie')
    setProfileView(null)
    setFilterView(null)
  }

  const handleMovieSelect = (newMovie: Movie) => {
    setSelectedMovie(newMovie)
    setViewMode('movie')
    setProfileView(null)
    setFilterView(null)
  }

  // Render different view modes
  if (viewMode === 'profile' && profileView) {
    return (
      <ProfilePage
        type={profileView.type}
        name={profileView.name}
        accessToken={accessToken}
        onBack={goBackToMovie}
        onMovieSelect={handleMovieSelect}
      />
    )
  }

  if (viewMode === 'filter' && filterView) {
    return (
      <FilteredMovieList
        accessToken={accessToken}
        filterType={filterView.type}
        filterValue={filterView.value}
        onBack={goBackToMovie}
        onMovieSelect={handleMovieSelect}
      />
    )
  }

  const renderLinkButton = (url: string, index: number, type: 'stream' | 'download' | 'custom') => {
    const getIcon = () => {
      switch (type) {
        case 'stream':
          return <Play className="h-4 w-4" />
        case 'download':
          return <Download className="h-4 w-4" />
        default:
          return <LinkIcon className="h-4 w-4" />
      }
    }

    const getLabel = () => {
      switch (type) {
        case 'stream':
          return `Watch ${index + 1}`
        case 'download':
          return `Download ${index + 1}`
        default:
          return `Link ${index + 1}`
      }
    }

    const getVariant = () => {
      switch (type) {
        case 'stream':
          return 'default' as const
        case 'download':
          return 'secondary' as const
        default:
          return 'outline' as const
      }
    }

    return (
      <Button
        key={index}
        variant={getVariant()}
        size="sm"
        className="flex items-center gap-2"
        asChild
      >
        <a href={url} target="_blank" rel="noopener noreferrer">
          {getIcon()}
          {getLabel()}
        </a>
      </Button>
    )
  }

  const renderClickableText = (text: string, type: 'title' | 'code') => {
    return (
      <span
        className="cursor-pointer hover:bg-muted px-2 py-1 rounded transition-colors inline-flex items-center gap-2"
        onClick={() => handleCopyToClipboard(text, type === 'title' ? 'Title' : 'Code')}
        title={`Click to copy ${type}`}
      >
        {text}
        <Copy className="h-3 w-3 opacity-50" />
      </span>
    )
  }

  const renderClickableNameWithAvatar = (name: string, type: 'actor' | 'actress' | 'director') => {
    const personData = castData[name]
    const profilePicture = personData?.profilePicture

    return (
      <div className="flex items-center gap-2">
        <ClickableProfileAvatar
          src={profilePicture}
          name={name}
          size="md"
          onClick={() => openProfile(type, name)}
        />
        <span
          className="cursor-pointer hover:bg-muted px-2 py-1 rounded transition-colors text-blue-600 hover:text-blue-800 hover:underline"
          onClick={() => openProfile(type, name)}
          title={`View ${name}'s profile`}
        >
          {name}
        </span>
      </div>
    )
  }

  const renderClickableMetadata = (text: string, type: 'studio' | 'series' | 'type') => {
    return (
      <span
        className="cursor-pointer hover:bg-muted px-2 py-1 rounded transition-colors text-blue-600 hover:text-blue-800 hover:underline"
        onClick={() => openFilter(type, text)}
        title={`Filter by ${type}: ${text}`}
      >
        {text}
      </span>
    )
  }

  const renderClickableTag = (tag: string) => {
    return (
      <Badge
        key={tag}
        variant="outline"
        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
        onClick={() => openFilter('tag', tag.trim())}
        title={`Filter by tag: ${tag.trim()}`}
      >
        {tag.trim()}
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Always present for consistency */}
      <header className="border-b bg-card sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side - Logo/Brand + Back Button */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Film className="h-6 w-6 text-primary" />
                <span className="font-semibold">Movie Database</span>
              </div>
              
              {onBack && (
                <>
                  <div className="h-6 w-px bg-border"></div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onBack}
                    className="flex items-center gap-2 hover:bg-muted"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Movies
                  </Button>
                </>
              )}
            </div>
            
            {/* Right side - Edit Button */}
            {showEditButton && onEdit && (
              <Button
                onClick={() => onEdit(selectedMovie)}
                size="sm"
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Movie
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Section 1: Cover Full Width (No Cropping) */}
        <section className="mb-8">
          <Card>
            <CardContent className="p-0">
              <div 
                className="w-full bg-gray-100 rounded-lg overflow-hidden relative group cursor-pointer aspect-[16/9] max-h-[500px]"
                onClick={() => setShowFullCover(true)}
              >
                {coverUrl ? (
                  <ImageWithFallback
                    key={coverUrl} // Force re-render when URL changes
                    src={coverUrl}
                    alt={selectedMovie.titleEn || selectedMovie.titleJp || 'Movie cover'}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
                    No Cover Available
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Maximize className="h-12 w-12 text-white" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Section 2: Movie Information - Organized Layout */}
        <section className="mb-8">
          {/* Movie Title & Code */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">
              {selectedMovie.titleEn ? renderClickableText(selectedMovie.titleEn, 'title') : selectedMovie.titleJp ? renderClickableText(selectedMovie.titleJp, 'title') : 'Untitled Movie'}
            </h1>
            {selectedMovie.titleJp && selectedMovie.titleEn && selectedMovie.titleJp !== selectedMovie.titleEn && (
              <p className="text-2xl text-muted-foreground mb-4">
                {renderClickableText(selectedMovie.titleJp, 'title')}
              </p>
            )}
            {selectedMovie.code && (
              <div className="inline-block">
                <Badge 
                  variant="secondary" 
                  className="text-xl px-6 py-2 font-mono cursor-pointer hover:bg-secondary/80 transition-colors" 
                  onClick={() => handleCopyToClipboard(selectedMovie.code!, 'Code')} 
                  title="Click to copy code"
                >
                  {selectedMovie.code.toUpperCase()}
                  <Copy className="h-4 w-4 ml-2 opacity-50" />
                </Badge>
              </div>
            )}
          </div>

          {/* Movie Info Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedMovie.releaseDate && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <span className="text-sm text-muted-foreground block">Release Date</span>
                      <span className="font-medium">{new Date(selectedMovie.releaseDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                )}
                
                {selectedMovie.duration && (
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <span className="text-sm text-muted-foreground block">Duration</span>
                      <span className="font-medium">{selectedMovie.duration}</span>
                    </div>
                  </div>
                )}

                {selectedMovie.type && (
                  <div className="flex items-center gap-3">
                    <Tag className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <span className="text-sm text-muted-foreground block">Type</span>
                      <span className="font-medium">{renderClickableMetadata(selectedMovie.type, 'type')}</span>
                    </div>
                  </div>
                )}

                {selectedMovie.studio && (
                  <div className="flex items-center gap-3">
                    <Building className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <span className="text-sm text-muted-foreground block">Studio</span>
                      <span className="font-medium">{renderClickableMetadata(selectedMovie.studio, 'studio')}</span>
                    </div>
                  </div>
                )}

                {selectedMovie.series && (
                  <div>
                    <span className="text-sm text-muted-foreground block">Series</span>
                    <span className="font-medium">{renderClickableMetadata(selectedMovie.series, 'series')}</span>
                  </div>
                )}

                {selectedMovie.label && (
                  <div>
                    <span className="text-sm text-muted-foreground block">Label</span>
                    <span className="font-medium">{selectedMovie.label}</span>
                  </div>
                )}

                {selectedMovie.dmlink && (
                  <div className="flex items-center gap-3">
                    <LinkIcon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <span className="text-sm text-muted-foreground block">Official Page</span>
                      <a 
                        href={selectedMovie.dmlink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline font-medium"
                      >
                        View Official Page
                      </a>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cast & Crew */}
            <Card>
              <CardHeader>
                <CardTitle>Cast & Crew</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Multiple Actresses - Each Clickable */}
                {selectedMovie.actress && (
                  <div>
                    <h4 className="text-sm text-muted-foreground mb-3">
                      {selectedMovie.actress.includes(',') ? 'Actresses' : 'Actress'}
                    </h4>
                    <div className="space-y-3">
                      {selectedMovie.actress.split(',').map((actress, index) => {
                        const actressName = actress.trim()
                        const actressInfo = castData[actressName]
                        return (
                          <div key={index} className="flex items-center gap-3">
                            {renderClickableNameWithAvatar(actressName, 'actress')}
                            {selectedMovie.releaseDate && actressInfo?.birthdate && (
                              <Badge variant="outline" className="text-xs">
                                {calculateAgeAtDate(actressInfo.birthdate, selectedMovie.releaseDate)} years old
                              </Badge>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Multiple Actors - Each Clickable */}
                {selectedMovie.actors && (
                  <div>
                    <h4 className="text-sm text-muted-foreground mb-3">
                      {selectedMovie.actors.includes(',') ? 'Actors' : 'Actor'}
                    </h4>
                    <div className="space-y-3">
                      {selectedMovie.actors.split(',').map((actor, index) => {
                        const actorName = actor.trim()
                        const actorInfo = castData[actorName]
                        return (
                          <div key={index} className="flex items-center gap-3">
                            {renderClickableNameWithAvatar(actorName, 'actor')}
                            {selectedMovie.releaseDate && actorInfo?.birthdate && (
                              <Badge variant="outline" className="text-xs">
                                {calculateAgeAtDate(actorInfo.birthdate, selectedMovie.releaseDate)} years old
                              </Badge>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {selectedMovie.director && (
                  <div>
                    <h4 className="text-sm text-muted-foreground mb-3">Director</h4>
                    {renderClickableNameWithAvatar(selectedMovie.director, 'director')}
                  </div>
                )}

                {/* Age Gap Information */}
                {(() => {
                  const ageGaps = calculateAgeGaps()
                  if (!ageGaps || ageGaps.length === 0) return null

                  return (
                    <div>
                      <h4 className="text-sm text-muted-foreground mb-3">Age Gaps</h4>
                      <div className="space-y-2">
                        {ageGaps.map((gap, index) => (
                          <div key={index} className="bg-muted/50 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{gap.actress}</span>
                                <span className="text-xs text-muted-foreground">({gap.actressAge})</span>
                                <span className="text-muted-foreground">×</span>
                                <span className="text-sm font-medium">{gap.actor}</span>
                                <span className="text-xs text-muted-foreground">({gap.actorAge})</span>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium">{gap.gap} years gap</div>
                                <div className="text-xs text-muted-foreground">
                                  {gap.actressOlder ? 'actress older' : 'actor older'}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}
              </CardContent>
            </Card>
          </div>

          {/* Additional Information Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Watch Links */}
            {(sLinks.length > 0 || uLinks.length > 0 || cLinks.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle>Watch & Download</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Censored Links */}
                  {cLinks.length > 0 && (
                    <div>
                      <h4 className="text-sm text-muted-foreground mb-2">Censored</h4>
                      <div className="flex flex-wrap gap-2">
                        {cLinks.map((url, index) => renderLinkButton(url, index, 'custom'))}
                      </div>
                    </div>
                  )}

                  {/* Uncensored Links */}
                  {uLinks.length > 0 && (
                    <div>
                      <h4 className="text-sm text-muted-foreground mb-2">Uncensored</h4>
                      <div className="flex flex-wrap gap-2">
                        {uLinks.map((url, index) => renderLinkButton(url, index, 'download'))}
                      </div>
                    </div>
                  )}

                  {/* Other Links */}
                  {sLinks.length > 0 && (
                    <div>
                      <h4 className="text-sm text-muted-foreground mb-2">Other</h4>
                      <div className="flex flex-wrap gap-2">
                        {sLinks.map((url, index) => renderLinkButton(url, index, 'stream'))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Tags */}
            {selectedMovie.tags && (
              <Card>
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {selectedMovie.tags.split(',').map((tag, index) => renderClickableTag(tag))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        {/* Section 3: Gallery Full Width */}
        {selectedMovie.gallery && selectedMovie.gallery.includes('#') && (
          <section>
            <Card>
              <CardHeader>
                <CardTitle>Gallery</CardTitle>
              </CardHeader>
              <CardContent>
                <EnhancedGallery
                  galleryTemplate={selectedMovie.gallery}
                  dmcode={selectedMovie.dmcode}
                  targetImageCount={30}
                />
              </CardContent>
            </Card>
          </section>
        )}
      </div>

      {/* Modern Lightbox for Cover */}
      <ModernLightbox
        src={coverUrl}
        alt={selectedMovie.titleEn || selectedMovie.titleJp || 'Movie cover'}
        isOpen={showFullCover}
        onClose={() => setShowFullCover(false)}
      />
    </div>
  )
}