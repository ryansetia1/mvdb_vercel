import React from 'react'
import { Badge } from '../../ui/badge'
import { Button } from '../../ui/button'
import { ClickableProfileAvatar } from '../../ClickableProfileAvatar'
import { Play, Download, Link as LinkIcon, Copy } from 'lucide-react'
import { copyToClipboard } from '../../../utils/clipboard'
import { MasterDataItem, calculateAgeAtDate } from '../../../utils/masterDataApi'
import { Movie } from '../../../utils/movieApi'
import { AgeGap } from './MovieDetailHelpers'
import { getTypeColorStyles, getTypeColorClasses } from '../../../utils/movieTypeColors'

interface RenderProps {
  onProfileSelect: (type: 'actor' | 'actress' | 'director', name: string) => void
  onFilterSelect: (filterType: string, filterValue: string, title?: string) => void
  castData: { [name: string]: MasterDataItem }
  movie: Movie
}

export const createRenderers = ({ onProfileSelect, onFilterSelect, castData, movie }: RenderProps) => {
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

  const renderClickableNameWithAvatar = (name: string, type: 'actor' | 'actress' | 'director') => {
    const personData = castData[name]
    const profilePicture = personData?.profilePicture

    return (
      <ClickableProfileAvatar
        name={name}
        profilePicture={profilePicture}
        onProfileClick={() => onProfileSelect(type, name)}
        size="md"
        showName={true}
      />
    )
  }

  const renderClickableMetadata = (text: string, type: 'studio' | 'series' | 'type') => {
    if (type === 'type') {
      const colorStyles = getTypeColorStyles(text)
      const colorClasses = getTypeColorClasses(text)
      
      return (
        <Badge
          style={colorStyles}
          className={`cursor-pointer hover:opacity-80 transition-opacity ${colorClasses}`.trim()}
          onClick={() => onFilterSelect(type, text, `${type}: ${text}`)}
          title={`Filter by ${type}: ${text}`}
        >
          {text.toUpperCase()}
        </Badge>
      )
    }
    
    return (
      <span
        className="cursor-pointer hover:bg-muted px-2 py-1 rounded transition-colors text-blue-600 hover:text-blue-800 hover:underline"
        onClick={() => onFilterSelect(type, text, `${type}: ${text}`)}
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
        onClick={() => onFilterSelect('tag', tag.trim(), `Tag: ${tag.trim()}`)}
        title={`Filter by tag: ${tag.trim()}`}
      >
        {tag.trim()}
      </Badge>
    )
  }

  const renderAgeGaps = (ageGaps: AgeGap[]) => {
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
  }

  return {
    renderLinkButton,
    renderClickableText,
    renderClickableNameWithAvatar,
    renderClickableMetadata,
    renderClickableTag,
    renderAgeGaps
  }
}