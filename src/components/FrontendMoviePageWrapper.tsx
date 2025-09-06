import { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { CroppedImage } from './CroppedImage'
import { ModernLightbox } from './ModernLightbox'
import { ClickableProfileAvatar } from './ClickableProfileAvatar'
import { EnhancedGallery } from './EnhancedGallery'
import { Movie } from '../utils/movieApi'
import { processTemplate } from '../utils/templateUtils'
import { ArrowLeft, Calendar, Clock, User, Building, Tag, Play, Download, Link as LinkIcon, Copy, Maximize } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { copyToClipboard } from '../utils/clipboard'

interface FrontendMoviePageWrapperProps {
  movie: Movie
  onBack: () => void
  onProfileClick?: (type: 'actor' | 'actress' | 'director', name: string) => void
}

export function FrontendMoviePageWrapper({ movie, onBack, onProfileClick }: FrontendMoviePageWrapperProps) {
  const [showFullCover, setShowFullCover] = useState(false)

  const coverUrl = movie.cover && movie.dmcode 
    ? processTemplate(movie.cover, { dmcode: movie.dmcode })
    : movie.cover || ''

  // Parse links for different sections
  const parseLinks = (linksString?: string) => {
    if (!linksString) return []
    return linksString.split('\n').map(link => link.trim()).filter(link => link.length > 0)
  }

  const cLinks = parseLinks(movie.clinks)
  const uLinks = parseLinks(movie.ulinks)
  const sLinks = parseLinks(movie.slinks)

  // Copy to clipboard handler
  const handleCopyToClipboard = async (text: string, label: string) => {
    await copyToClipboard(text, label)
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

  const renderClickableName = (name: string, type: 'actor' | 'actress' | 'director') => {
    return (
      <span
        className="cursor-pointer hover:bg-muted px-2 py-1 rounded transition-colors text-blue-600 hover:text-blue-800 hover:underline"
        onClick={() => onProfileClick?.(type, name)}
        title={`View ${name}'s profile`}
      >
        {name}
      </span>
    )
  }

  const renderClickableTag = (tag: string) => {
    return (
      <Badge
        key={tag}
        variant="outline"
        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
        title={`Filter by tag: ${tag.trim()}`}
      >
        {tag.trim()}
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Back Button */}
      <header className="border-b bg-card sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="flex items-center gap-2 hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Movies
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Main Title */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">
            {movie.titleEn ? renderClickableText(movie.titleEn, 'title') : movie.titleJp ? renderClickableText(movie.titleJp, 'title') : 'Untitled Movie'}
          </h1>
          {movie.titleJp && movie.titleEn && movie.titleJp !== movie.titleEn && (
            <p className="text-xl text-muted-foreground">
              {renderClickableText(movie.titleJp, 'title')}
            </p>
          )}
          {movie.code && (
            <div className="inline-block">
              <Badge 
                variant="secondary" 
                className="text-lg px-4 py-1 font-mono cursor-pointer hover:bg-secondary/80 transition-colors" 
                onClick={() => handleCopyToClipboard(movie.code!, 'Code')} 
                title="Click to copy code"
              >
                {movie.code.toUpperCase()}
                <Copy className="h-3 w-3 ml-2 opacity-50" />
              </Badge>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Cover */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <div className="bg-gray-100 rounded-lg overflow-hidden relative group cursor-pointer" onClick={() => setShowFullCover(true)}>
                  {coverUrl ? (
                    <img
                      src={coverUrl}
                      alt={movie.titleEn || movie.titleJp || 'Movie cover'}
                      className="w-full object-contain"
                      style={{ maxWidth: '600px', height: 'auto' }}
                    />
                  ) : (
                    <div className="w-full h-96 flex items-center justify-center bg-gray-200 text-gray-500">
                      No Cover Available
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Maximize className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Movie Information */}
          <div className="lg:col-span-3 space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Movie Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {movie.releaseDate && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Release Date: {new Date(movie.releaseDate).toLocaleDateString()}</span>
                  </div>
                )}
                
                {movie.duration && (
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Duration: {movie.duration}</span>
                  </div>
                )}

                {movie.type && (
                  <div className="flex items-center gap-3">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <span>Type: {movie.type}</span>
                  </div>
                )}

                {movie.dmlink && (
                  <div className="flex items-center gap-3">
                    <LinkIcon className="h-4 w-4 text-muted-foreground" />
                    <a 
                      href={movie.dmlink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Official Page
                    </a>
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
                {/* Actresses */}
                {movie.actress && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-3">
                      {movie.actress.includes(',') ? 'Actresses' : 'Actress'}
                    </h4>
                    <div className="space-y-3">
                      {movie.actress.split(',').map((actress, index) => {
                        const actressName = actress.trim()
                        return (
                          <div key={index}>
                            {renderClickableName(actressName, 'actress')}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Actors */}
                {movie.actors && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-3">
                      {movie.actors.includes(',') ? 'Actors' : 'Actor'}
                    </h4>
                    <div className="space-y-3">
                      {movie.actors.split(',').map((actor, index) => {
                        const actorName = actor.trim()
                        return (
                          <div key={index}>
                            {renderClickableName(actorName, 'actor')}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {movie.director && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-3">Director</h4>
                    {renderClickableName(movie.director, 'director')}
                  </div>
                )}

                {movie.studio && (
                  <div className="flex items-center gap-3">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span>Studio: {movie.studio}</span>
                  </div>
                )}

                {movie.series && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">Series</h4>
                    <p>{movie.series}</p>
                  </div>
                )}

                {movie.label && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">Label</h4>
                    <p>{movie.label}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Watch Links */}
            {(sLinks.length > 0 || uLinks.length > 0 || cLinks.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle>Watch & Download</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Streaming Links */}
                  {sLinks.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">Streaming</h4>
                      <div className="flex flex-wrap gap-2">
                        {sLinks.map((url, index) => renderLinkButton(url, index, 'stream'))}
                      </div>
                    </div>
                  )}

                  {/* Download Links */}
                  {uLinks.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">Downloads</h4>
                      <div className="flex flex-wrap gap-2">
                        {uLinks.map((url, index) => renderLinkButton(url, index, 'download'))}
                      </div>
                    </div>
                  )}

                  {/* Custom Links */}
                  {cLinks.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">Other Links</h4>
                      <div className="flex flex-wrap gap-2">
                        {cLinks.map((url, index) => renderLinkButton(url, index, 'custom'))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Tags */}
            {movie.tags && (
              <Card>
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {movie.tags.split(',').map((tag, index) => renderClickableTag(tag))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Gallery Section */}
        {movie.gallery && movie.gallery.includes('#') && (
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Gallery</CardTitle>
              </CardHeader>
              <CardContent>
                <EnhancedGallery
                  galleryTemplate={movie.gallery}
                  dmcode={movie.dmcode}
                  targetImageCount={30}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modern Lightbox for Cover */}
        <ModernLightbox
          src={coverUrl}
          alt={movie.titleEn || movie.titleJp || 'Movie cover'}
          isOpen={showFullCover}
          onClose={() => setShowFullCover(false)}
        />
      </div>
    </div>
  )
}