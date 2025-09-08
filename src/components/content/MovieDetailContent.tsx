import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible'
import { ModernLightbox } from '../ModernLightbox'
import { GalleryWithSave } from '../GalleryWithSave'
import { ImageWithFallback } from '../figma/ImageWithFallback'
import { Movie, movieApi } from '../../utils/movieApi'
import { MasterDataItem, masterDataApi } from '../../utils/masterDataApi'
import { Play, ChevronDown, ChevronRight, ExternalLink, Maximize, Tag, Building, LinkIcon, Edit2 } from 'lucide-react'
import { SimpleFavoriteButton } from '../SimpleFavoriteButton'
import { Button } from '../ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'
import { DateDurationInputs } from '../DateDurationInputs'
import { TagsManager } from '../TagsManager'
import { toast } from 'sonner'

// Refactored components and helpers
import { parseLinks, calculateAgeGaps, processCoverUrl } from './movieDetail/MovieDetailHelpers'
import { createRenderers } from './movieDetail/MovieDetailRenderers'
import { MovieCastSection } from './movieDetail/MovieCastSection'
import { MovieLinksSection } from './movieDetail/MovieLinksSection'
import { MovieActionButtons } from './movieDetail/MovieActionButtons'
import { MovieHeader } from './movieDetail/MovieHeader'
import { MovieEditingForm } from './movieDetail/MovieEditingForm'
import { MovieBasicInfoEdit } from './movieDetail/MovieBasicInfoEdit'
import { MovieCastEdit } from './movieDetail/MovieCastEdit'
import { MovieLinksEdit } from './movieDetail/MovieLinksEdit'
import { LinkedMoviesCard } from './movieDetail/LinkedMoviesCard'

interface MovieDetailContentProps {
  movie: Movie
  accessToken: string
  onMovieSelect: (movie: Movie) => void
  onProfileSelect: (type: 'actor' | 'actress' | 'director', name: string) => void
  onFilterSelect: (filterType: string, filterValue: string, title?: string) => void
  onEditMovie?: (movie: Movie) => void
  showEditButton?: boolean
  onBack?: () => void
  onMovieUpdated?: (updatedMovie: Movie) => void
}

export function MovieDetailContent({ 
  movie, 
  accessToken, 
  onMovieSelect, 
  onProfileSelect, 
  onFilterSelect,
  onEditMovie,
  showEditButton = false,
  onBack,
  onMovieUpdated
}: MovieDetailContentProps) {
  const [showFullCover, setShowFullCover] = useState(false)
  const [castData, setCastData] = useState<{ [name: string]: MasterDataItem }>({})
  const [isLoadingCast, setIsLoadingCast] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editedMovie, setEditedMovie] = useState<Movie>(movie)
  const [isSaving, setIsSaving] = useState(false)
  const [trailerCollapsed, setTrailerCollapsed] = useState(true)
  const [editingSection, setEditingSection] = useState<string | null>(null)

  // Use current movie data for cover URL
  const currentMovie = (isEditing || editingSection) ? editedMovie : movie
  const coverUrl = processCoverUrl(currentMovie)

  // Update edited movie when movie prop changes
  useEffect(() => {
    setEditedMovie(movie)
    // Reset editing states when movie changes
    setIsEditing(false)
    setEditingSection(null)
  }, [movie])

  // Handle save edited movie
  const handleSaveMovie = async () => {
    if (!editedMovie.id) {
      toast.error('Movie ID is missing')
      return
    }

    try {
      setIsSaving(true)
      await movieApi.updateMovie(editedMovie.id, editedMovie, accessToken)
      setIsEditing(false)
      toast.success('Movie updated successfully')
      
      // Notify parent component about the update
      if (onMovieUpdated) {
        onMovieUpdated(editedMovie)
      }
    } catch (error) {
      console.error('Failed to update movie:', error)
      toast.error('Failed to update movie')
    } finally {
      setIsSaving(false)
    }
  }

  // Handle cancel editing
  const handleCancelEdit = () => {
    setEditedMovie(movie) // Reset to original data
    setIsEditing(false)
    setEditingSection(null) // Clear section editing
  }

  // Handle section-specific editing
  const handleEditSection = (sectionName: string) => {
    if (isEditing) {
      // If already in global edit mode, ignore section edit
      return
    }
    setEditingSection(sectionName)
  }

  const handleSaveSection = async () => {
    if (!editedMovie.id) {
      toast.error('Movie ID is missing')
      return
    }

    try {
      setIsSaving(true)
      await movieApi.updateMovie(editedMovie.id, editedMovie, accessToken)
      setEditingSection(null)
      toast.success('Section updated successfully')
      
      // Notify parent component about the update
      if (onMovieUpdated) {
        onMovieUpdated(editedMovie)
      }
    } catch (error) {
      console.error('Failed to update section:', error)
      toast.error('Failed to update section')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelSectionEdit = () => {
    setEditedMovie(movie) // Reset to original data
    setEditingSection(null)
  }

  // Helper to check if a section is being edited
  const isSectionEditing = (sectionName: string) => {
    return isEditing || editingSection === sectionName
  }

  // Handle input changes
  const handleInputChange = (field: keyof Movie, value: string) => {
    setEditedMovie(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Handle links changes
  const handleLinksChange = (field: string, links: string) => {
    setEditedMovie(prev => ({
      ...prev,
      [field]: links
    }))
  }

  // Load actor/actress data for age calculations and profile pictures
  useEffect(() => {
    const loadCastData = async () => {
      try {
        setIsLoadingCast(true)
        const [actresses, actors, directors] = await Promise.all([
          masterDataApi.getByType('actress', accessToken),
          masterDataApi.getByType('actor', accessToken),
          masterDataApi.getByType('director', accessToken)
        ])

        const data: { [name: string]: MasterDataItem } = {}
        
        // Parse and add actress data (handle multiple actresses separated by comma)
        if (movie.actress) {
          movie.actress.split(',').forEach(actressName => {
            const trimmedName = actressName.trim()
            const actress = actresses.find(a => a.name === trimmedName)
            if (actress) data[trimmedName] = actress
          })
        }

        // Add actor data
        if (movie.actors) {
          movie.actors.split(',').forEach(actorName => {
            const trimmedName = actorName.trim()
            const actor = actors.find(a => a.name === trimmedName)
            if (actor) data[trimmedName] = actor
          })
        }

        // Add director data - check in directors, actors, and actresses
        if (movie.director) {
          let director = directors.find(d => d.name === movie.director)
          if (!director) {
            // If not found in directors table, check in actors table
            director = actors.find(a => a.name === movie.director)
          }
          if (!director) {
            // If not found in actors table, check in actresses table
            director = actresses.find(a => a.name === movie.director)
          }
          if (director) data[movie.director] = director
        }

        setCastData(data)
      } catch (error) {
        console.error('Failed to load cast data:', error)
      } finally {
        setIsLoadingCast(false)
      }
    }

    loadCastData()
  }, [movie.actress, movie.actors, movie.director, accessToken])



  // Parse links for different sections
  const cLinks = parseLinks(currentMovie.clinks)
  const uLinks = parseLinks(currentMovie.ulinks)
  const sLinks = parseLinks(currentMovie.slinks)

  // Calculate age gaps
  const ageGaps = calculateAgeGaps(currentMovie, castData)

  // Create renderers with current context
  const renderers = createRenderers({ 
    onProfileSelect, 
    onFilterSelect, 
    castData, 
    movie: currentMovie 
  })

  return (
    <TooltipProvider>
      <div className="space-y-8">
      {/* Section Navigation: Action Buttons */}
      <section>
        <MovieActionButtons
          movie={movie}
          isEditing={isEditing}
          isSaving={isSaving}
          showEditButton={showEditButton}
          onBack={onBack}
          onEdit={() => setIsEditing(true)}
          onSave={handleSaveMovie}
          onCancel={handleCancelEdit}
        />
      </section>

      {/* Section 0: Movie Header - Code and Titles */}
      <section>
        <MovieHeader
          movie={movie}
          editedMovie={editedMovie}
          isEditing={isEditing}
          onInputChange={handleInputChange}
          renderClickableText={renderers.renderClickableText}
        />
      </section>

      {/* Main Content Layout: 2 Columns */}
      <section>
        <div className="grid grid-cols-1 lg:grid-cols-[70%_1fr] gap-8">
          {/* Left Column: Cover + Gallery */}
          <div className="space-y-6">
            {/* Cover Image */}
            <Card>
              <CardContent className="p-0">
                <div 
                  className={`w-full bg-gray-100 rounded-lg overflow-hidden relative group cursor-pointer ${
                    currentMovie.type === 'Un' ? 'aspect-[16/9]' : 'aspect-[3/2]'
                  }`}
                  onClick={() => setShowFullCover(true)}
                >
                  {coverUrl ? (
                    // Fixed 3:2 aspect ratio with object-cover to handle all image types
                    <ImageWithFallback
                      key={coverUrl} // Force re-render when URL changes
                      src={coverUrl}
                      alt={currentMovie.titleEn || currentMovie.titleJp || 'Movie cover'}
                      className="w-full h-full object-cover"
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
                  
                  {/* Cover Favorite Button */}
                  {coverUrl && (
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <SimpleFavoriteButton
                        type="image"
                        itemId={coverUrl}
                        sourceId={currentMovie.id || ''}
                        size="md"
                        variant="ghost"
                        className="bg-white/90 hover:bg-white text-gray-700 hover:text-red-500 shadow-lg"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Video Trailer */}
            {currentMovie.dmcode && currentMovie.type !== 'Un' && (
              <Card>
                  <Collapsible open={!trailerCollapsed} onOpenChange={(open) => setTrailerCollapsed(!open)}>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Play className="h-5 w-5" />
                            Video Trailer
                          </div>
                          {trailerCollapsed ? (
                            <ChevronRight className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </CardTitle>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent>
                        <div className="space-y-4">
                          {/* Video Player */}
                          <div className="aspect-video w-full rounded-lg overflow-hidden bg-gray-100 relative">
                            <iframe
                              src={`https://javtrailers.com/video/${currentMovie.dmcode}`}
                              title={`${currentMovie.titleEn || currentMovie.titleJp || 'Movie'} Trailer`}
                              className="w-[132%] h-[132%] border-0 scale-[1.32] -translate-x-[7.5%] -translate-y-[10%] transform origin-top-left"
                              allowFullScreen
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share"
                              loading="lazy"
                              sandbox="allow-scripts allow-same-origin allow-presentation"
                            />
                          </div>
                          
                          {/* Open in New Tab Button */}
                          <div className="flex justify-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(`https://javtrailers.com/video/${currentMovie.dmcode}`, '_blank', 'noopener,noreferrer')}
                              className="flex items-center gap-2"
                            >
                              <ExternalLink className="h-4 w-4" />
                              Open in New Tab
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
            )}

            {/* Gallery */}
            <Card className="group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>Gallery</CardTitle>
                {!isEditing && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditSection('gallery')}
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        disabled={editingSection !== null && editingSection !== 'gallery'}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Edit Gallery Section</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </CardHeader>
              <CardContent>
                {isSectionEditing('gallery') ? (
                  <div className="space-y-4">
                    <MovieEditingForm
                      editedMovie={editedMovie}
                      onInputChange={handleInputChange}
                      onCheckboxChange={(field, checked) => 
                        setEditedMovie(prev => ({ 
                          ...prev, 
                          [field]: checked 
                        }))
                      }
                      onLinksChange={handleLinksChange}
                      accessToken={accessToken}
                    />
                    {editingSection === 'gallery' && (
                      <div className="flex gap-2 pt-4">
                        <Button 
                          onClick={handleSaveSection}
                          disabled={isSaving}
                          size="sm"
                        >
                          {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={handleCancelSectionEdit}
                          disabled={isSaving}
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  (currentMovie.gallery && currentMovie.gallery.includes('#')) ? (
                    <GalleryWithSave
                      galleryTemplate={currentMovie.gallery}
                      dmcode={currentMovie.dmcode}
                      targetImageCount={100}
                      accessToken={accessToken}
                      movieData={{
                        id: currentMovie.id,
                        titleEn: currentMovie.titleEn,
                        titleJp: currentMovie.titleJp,
                        code: currentMovie.code,
                        actress: currentMovie.actress,
                        actors: currentMovie.actors,
                        releaseDate: currentMovie.releaseDate,
                        studio: currentMovie.studio
                      }}
                    />
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      No gallery available
                    </div>
                  )
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Movie Information */}
          <div className="space-y-6">
            {/* Basic Information */}
            <Card className="group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>Basic Information</CardTitle>
                {!isEditing && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditSection('basic')}
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        disabled={editingSection !== null && editingSection !== 'basic'}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Edit Basic Information</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </CardHeader>
              <CardContent>
                {isSectionEditing('basic') ? (
                  <div className="space-y-4">
                    <MovieBasicInfoEdit
                      editedMovie={editedMovie}
                      onInputChange={handleInputChange}
                      onLinksChange={handleLinksChange}
                      accessToken={accessToken}
                    />
                    {editingSection === 'basic' && (
                      <div className="flex gap-2 pt-4">
                        <Button 
                          onClick={handleSaveSection}
                          disabled={isSaving}
                          size="sm"
                        >
                          {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={handleCancelSectionEdit}
                          disabled={isSaving}
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <DateDurationInputs
                      releaseDate={editedMovie.releaseDate || ''}
                      duration={editedMovie.duration || ''}
                      onReleaseDateChange={(date) => handleInputChange('releaseDate', date)}
                      onDurationChange={(duration) => handleInputChange('duration', duration)}
                      isEditing={false}
                    />

                    <div className="flex items-center gap-3">
                      <Tag className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <span className="text-sm text-muted-foreground block">Type</span>
                        <span className="font-medium">
                          {currentMovie.type ? renderers.renderClickableMetadata(currentMovie.type, 'type') : 'Not set'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Building className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <span className="text-sm text-muted-foreground block">Studio</span>
                        <span className="font-medium">
                          {currentMovie.studio ? renderers.renderClickableMetadata(currentMovie.studio, 'studio') : 'Not set'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-sm text-muted-foreground block">Series</span>
                      <span className="font-medium">
                        {currentMovie.series ? renderers.renderClickableMetadata(currentMovie.series, 'series') : 'Not set'}
                      </span>
                    </div>

                    <div>
                      <span className="text-sm text-muted-foreground block">Label</span>
                      <span className="font-medium">{currentMovie.label || 'Not set'}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <LinkIcon className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <span className="text-sm text-muted-foreground block">Official Page</span>
                        {currentMovie.dmlink ? (
                          <a 
                            href={currentMovie.dmlink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline font-medium"
                          >
                            View Official Page
                          </a>
                        ) : (
                          <span className="font-medium text-muted-foreground">Not set</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cast & Crew */}
            <Card className="group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>Cast & Crew</CardTitle>
                {!isEditing && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditSection('cast')}
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        disabled={editingSection !== null && editingSection !== 'cast'}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Edit Cast & Crew</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </CardHeader>
              <CardContent>
                {isSectionEditing('cast') ? (
                  <div className="space-y-4">
                    <MovieCastEdit
                      editedMovie={editedMovie}
                      onInputChange={handleInputChange}
                      accessToken={accessToken}
                    />
                    {editingSection === 'cast' && (
                      <div className="flex gap-2 pt-4">
                        <Button 
                          onClick={handleSaveSection}
                          disabled={isSaving}
                          size="sm"
                        >
                          {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={handleCancelSectionEdit}
                          disabled={isSaving}
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <MovieCastSection
                    movie={currentMovie}
                    castData={castData}
                    ageGaps={ageGaps}
                    renderClickableNameWithAvatar={renderers.renderClickableNameWithAvatar}
                    renderAgeGaps={renderers.renderAgeGaps}
                    accessToken={accessToken}
                  />
                )}
              </CardContent>
            </Card>

            {/* Linked Movies */}
            {currentMovie.id && (
              <LinkedMoviesCard
                movieId={currentMovie.id}
                accessToken={accessToken}
                onMovieSelect={onMovieSelect}
              />
            )}
            {/* Watch & Download */}
            <Card className="group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>Watch & Download</CardTitle>
                {!isEditing && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditSection('links')}
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        disabled={editingSection !== null && editingSection !== 'links'}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Edit Watch & Download Links</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </CardHeader>
              <CardContent>
                {isSectionEditing('links') ? (
                  <div className="space-y-4">
                    <MovieLinksEdit
                      editedMovie={editedMovie}
                      onLinksChange={handleLinksChange}
                    />
                    {editingSection === 'links' && (
                      <div className="flex gap-2 pt-4">
                        <Button 
                          onClick={handleSaveSection}
                          disabled={isSaving}
                          size="sm"
                        >
                          {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={handleCancelSectionEdit}
                          disabled={isSaving}
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  (sLinks.length > 0 || uLinks.length > 0 || cLinks.length > 0) ? (
                    <MovieLinksSection
                      sLinks={sLinks}
                      uLinks={uLinks}
                      cLinks={cLinks}
                      renderLinkButton={renderers.renderLinkButton}
                      movie={currentMovie}
                    />
                  ) : (
                    <span className="text-muted-foreground">No links available</span>
                  )
                )}
              </CardContent>
            </Card>

            {/* Tags */}
            <Card className="group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>Tags</CardTitle>
                {!isEditing && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditSection('tags')}
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        disabled={editingSection !== null && editingSection !== 'tags'}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Edit Tags</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </CardHeader>
              <CardContent>
                {isSectionEditing('tags') ? (
                  <div className="space-y-4">
                    <TagsManager
                      currentTags={editedMovie.tags || ''}
                      onTagsChange={(newTags) => handleInputChange('tags', newTags)}
                      accessToken={accessToken}
                    />
                    {editingSection === 'tags' && (
                      <div className="flex gap-2 pt-4">
                        <Button 
                          onClick={handleSaveSection}
                          disabled={isSaving}
                          size="sm"
                        >
                          {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={handleCancelSectionEdit}
                          disabled={isSaving}
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {currentMovie.tags ? (
                      currentMovie.tags.split(',').map((tag, index) => renderers.renderClickableTag(tag))
                    ) : (
                      <span className="text-muted-foreground">No tags</span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>



      {/* Modern Lightbox for Cover */}
      <ModernLightbox
        src={coverUrl}
        alt={currentMovie.titleEn || currentMovie.titleJp || 'Movie cover'}
        isOpen={showFullCover}
        onClose={() => setShowFullCover(false)}
      />
      </div>
    </TooltipProvider>
  )
}