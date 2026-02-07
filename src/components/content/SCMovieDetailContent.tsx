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
  Subtitles,
  Link
} from 'lucide-react'
import { ImageWithFallback } from '../figma/ImageWithFallback'
import { CroppedImage } from '../CroppedImage'
import { SCMovie, HCMovieReference, scMovieApi } from '../../utils/scMovieApi'
import { Movie, movieApi } from '../../utils/movieApi'
import { processCoverUrl } from './movieDetail/MovieDetailHelpers'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { SearchableSelect } from '../SearchableSelect'
import { toast } from 'sonner'

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
  const [activeHCCode, setActiveHCCode] = useState<string | null>(null)

  // Quick Link dialog state
  const [showQuickLinkDialog, setShowQuickLinkDialog] = useState(false)
  const [availableHCCodes, setAvailableHCCodes] = useState<string[]>([])
  const [selectedHCCode, setSelectedHCCode] = useState<string>('')
  const [isLinking, setIsLinking] = useState(false)
  const [hcMovies, setHcMovies] = useState<Movie[]>([])

  // Load HC movies for quick link
  useEffect(() => {
    const loadHCMovies = async () => {
      try {
        const movies = await movieApi.getMovies(accessToken)
        setHcMovies(movies)
        const codes = movies
          .map((movie: Movie) => movie.code)
          .filter(Boolean)
          .sort()
        setAvailableHCCodes(codes)
      } catch (error) {
        console.error('Failed to load HC codes:', error)
      }
    }
    loadHCMovies()
  }, [accessToken])

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
    setActiveHCCode(hcCode)
    handleHCBadgeHover(hcCode)
  }

  const handleHCBadgeMouseLeave = () => {
    setIsHoverHCBadge(false)
    setActiveHCCode(null)
  }

  // Handle Quick Link - link HC movie to this SC movie
  const handleQuickLink = async () => {
    if (!selectedHCCode.trim() || !currentSCMovie.id) return

    setIsLinking(true)
    try {
      // Find the selected HC movie
      const hcMovie = hcMovies.find(
        (movie: Movie) => movie.code?.toLowerCase() === selectedHCCode.toLowerCase()
      )

      if (!hcMovie) {
        toast.error(`HC movie dengan code ${selectedHCCode} tidak ditemukan`)
        return
      }

      // Extract cast data from HC movie
      const castData: string[] = []
      if (hcMovie.actress) {
        const actresses = hcMovie.actress.split(',').map(name => name.trim()).filter(name => name)
        castData.push(...actresses)
      }
      if (hcMovie.actors) {
        const actors = hcMovie.actors.split(',').map(name => name.trim()).filter(name => name)
        castData.push(...actors)
      }

      // Merge with existing cast, removing duplicates
      const existingCast = currentSCMovie.cast
        ? currentSCMovie.cast.split(',').map(name => name.trim()).filter(name => name)
        : []
      const combinedCast = [...existingCast, ...castData]
      const uniqueCast = [...new Set(combinedCast)]

      // Create new HC movie reference
      const newHCMovie: HCMovieReference = {
        hcCode: selectedHCCode,
        hcReleaseDate: hcMovie.releaseDate
      }

      // Update the SC movie with linked HC data
      const updateData: Partial<SCMovie> = {
        hcCode: selectedHCCode,
        hcReleaseDate: hcMovie.releaseDate,
        hcMovies: [...(currentSCMovie.hcMovies || []), newHCMovie],
        cast: uniqueCast.length > 0 ? uniqueCast.join(', ') : currentSCMovie.cast
      }

      const updatedSCMovie = await scMovieApi.updateSCMovie(currentSCMovie.id, updateData, accessToken)
      setCurrentSCMovie(updatedSCMovie)

      // Show success message with details
      const messages = []
      if (updateData.cast && updateData.cast !== currentSCMovie.cast) {
        messages.push(`Cast: ${updateData.cast}`)
      }
      if (updateData.hcReleaseDate) {
        messages.push(`HC Release Date: ${new Date(updateData.hcReleaseDate).toLocaleDateString('id-ID')}`)
      }

      toast.success(`Berhasil menghubungkan dengan HC movie ${selectedHCCode}${messages.length > 0 ? '. ' + messages.join(', ') : ''}`)

      // Close dialog and reset state
      setShowQuickLinkDialog(false)
      setSelectedHCCode('')
    } catch (error) {
      console.error('Failed to quick link HC movie:', error)
      toast.error('Gagal menghubungkan HC movie')
    } finally {
      setIsLinking(false)
    }
  }

  // Check if SC movie has no linked HC movies
  const hasNoHCMovieLinked = !currentSCMovie.hcCode && (!currentSCMovie.hcMovies || currentSCMovie.hcMovies.length === 0)

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
          const isActress = movies.some((movie: Movie) =>
            movie.actress && movie.actress.toLowerCase().includes(castMember.toLowerCase())
          )

          // Check if this name appears as an actor in any movie
          const isActor = movies.some((movie: Movie) =>
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

        <div className="flex items-center gap-2">
          {/* Quick Link Button - only show when no HC movie is linked */}
          {hasNoHCMovieLinked && onEdit && (
            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowQuickLinkDialog(true)}
              className="flex items-center gap-2 px-6 py-3"
            >
              <Link className="h-4 w-4" />
              Quick Link
            </Button>
          )}

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

                {/* HC Code badges */}
                {currentSCMovie.hcMovies && currentSCMovie.hcMovies.length > 0 ? (
                  <div className="absolute bottom-4 right-4 flex flex-col gap-2 items-end">
                    {currentSCMovie.hcMovies.map((hcMovie) => (
                      <Badge
                        key={hcMovie.hcCode}
                        variant="outline"
                        className="bg-white/95 text-black border-gray-300 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                        onClick={() => handleHCCodeClick(hcMovie.hcCode)}
                        onMouseEnter={() => handleHCBadgeMouseEnter(hcMovie.hcCode)}
                        onMouseLeave={handleHCBadgeMouseLeave}
                        title="Click to view HC movie • Hover to preview HC cover"
                      >
                        HC: {hcMovie.hcCode}
                      </Badge>
                    ))}
                  </div>
                ) : currentSCMovie.hcCode ? (
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
                ) : null}
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

                  {currentSCMovie.hcMovies && currentSCMovie.hcMovies.length > 0 ? (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">HC Codes:</span>
                      <div className="flex flex-wrap gap-1">
                        {currentSCMovie.hcMovies.map((hcMovie) => (
                          <Badge
                            key={hcMovie.hcCode}
                            variant="outline"
                            className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                            onClick={() => handleHCCodeClick(hcMovie.hcCode)}
                            onMouseEnter={() => handleHCBadgeMouseEnter(hcMovie.hcCode)}
                            onMouseLeave={handleHCBadgeMouseLeave}
                            title="Click to view HC movie • Hover to preview HC cover"
                          >
                            {hcMovie.hcCode}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : currentSCMovie.hcCode ? (
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
                  ) : null}

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

      {/* Quick Link Dialog */}
      <Dialog open={showQuickLinkDialog} onOpenChange={setShowQuickLinkDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Quick Link HC Movie</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Pilih HC movie untuk dihubungkan dengan SC movie ini. Data seperti HC release date, cast, dan HC code akan otomatis diisi.
            </p>

            <div className="space-y-2">
              <label className="text-sm font-medium">HC Movie Code</label>
              <SearchableSelect
                value={selectedHCCode}
                onValueChange={setSelectedHCCode}
                options={availableHCCodes.map(code => ({ value: code, label: code }))}
                placeholder="Pilih HC Code..."
                className="w-full"
              />
            </div>

            {selectedHCCode && (() => {
              const previewMovie = hcMovies.find(m => m.code?.toLowerCase() === selectedHCCode.toLowerCase())
              if (previewMovie) {
                return (
                  <div className="p-3 bg-muted rounded-lg space-y-2">
                    <p className="text-sm font-medium">Preview:</p>
                    <div className="text-sm space-y-1">
                      <p><span className="text-muted-foreground">Title:</span> {previewMovie.titleEn || previewMovie.titleJp || '-'}</p>
                      <p><span className="text-muted-foreground">Release Date:</span> {previewMovie.releaseDate ? new Date(previewMovie.releaseDate).toLocaleDateString('id-ID') : '-'}</p>
                      <p><span className="text-muted-foreground">Actress:</span> {previewMovie.actress || '-'}</p>
                      {previewMovie.actors && <p><span className="text-muted-foreground">Actors:</span> {previewMovie.actors}</p>}
                    </div>
                  </div>
                )
              }
              return null
            })()}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowQuickLinkDialog(false)
                setSelectedHCCode('')
              }}
              disabled={isLinking}
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleQuickLink}
              disabled={!selectedHCCode.trim() || isLinking}
            >
              {isLinking ? 'Menghubungkan...' : 'Link'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}