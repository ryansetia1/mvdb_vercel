import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { ImageWithFallback } from '../../figma/ImageWithFallback'
import { ImageSlideshow } from '../../ImageSlideshow'
import { MasterDataItem, calculateAge } from '../../../utils/masterDataApi'
import { Movie } from '../../../utils/movieApi'
import { Photobook } from '../../../utils/photobookApi'
import { User, Calendar, Film, Camera, Images } from 'lucide-react'
import { TakuLinksIframe } from '../../TakuLinksIframe'
import { copyToClipboard } from '../../../utils/clipboard'

interface ProfileSidebarProps {
  profile: MasterDataItem | null
  name: string
  type: 'actor' | 'actress'
  movies: Movie[]
  photobooks: Photobook[]
  profileImages: string[]
  onProfilePictureClick: () => void
  onGroupSelect?: (groupName: string) => void
}

export function ProfileSidebar({
  profile,
  name,
  type,
  movies,
  photobooks,
  profileImages,
  onProfilePictureClick,
  onGroupSelect
}: ProfileSidebarProps) {
  // Calculate age if birthdate is available
  const age = profile?.birthdate ? calculateAge(profile.birthdate) : null
  
  // Determine which images to cycle through
  const imagesToCycle = profileImages.length > 0 ? profileImages : (profile?.profilePicture ? [profile.profilePicture] : [])

  // Copy to clipboard handler
  const handleCopyJapaneseName = async () => {
    if (profile?.jpname) {
      await copyToClipboard(profile.jpname, 'Japanese name')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Profile Picture */}
        <div className="text-center">
          <div className="max-w-[200px] mx-auto mb-3">
            <ImageSlideshow
              images={imagesToCycle}
              alt={name}
              autoPlay={imagesToCycle.length > 1}
              interval={3000}
              showDots={imagesToCycle.length > 1}
              showCounter={true}
              onImageClick={onProfilePictureClick}
              className="w-full"
            />
          </div>
          <h2 className="font-bold text-lg">{name}</h2>
          {profile?.jpname && (
            <p 
              className="text-sm text-muted-foreground font-medium cursor-pointer hover:text-foreground transition-colors"
              onClick={handleCopyJapaneseName}
              title="Click to copy Japanese name to clipboard"
            >
              {profile.jpname}
            </p>
          )}
          {age && (
            <p className="text-sm text-muted-foreground">{age} years old</p>
          )}
          {/* Taku Links */}
          {profile?.takulinks && profile.takulinks.trim() && (
            <TakuLinksIframe 
              takulinks={profile.takulinks} 
              className="mt-2"
              variant="default"
            />
          )}
        </div>

        {/* Basic Info */}
        {profile?.birthdate && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Born: {new Date(profile.birthdate).toLocaleDateString()}</span>
          </div>
        )}
        
        {/* Group memberships */}
        {profile?.selectedGroups && profile.selectedGroups.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Groups</div>
            <div className="flex flex-wrap gap-1">
              {profile.selectedGroups.map((groupName, index) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="text-xs cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
                  onClick={() => onGroupSelect?.(groupName)}
                >
                  {groupName}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="space-y-2 pt-2 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1">
              <Film className="h-4 w-4" />
              Movies
            </span>
            <Badge variant="secondary">{movies.length}</Badge>
          </div>
          {type === 'actress' && (
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1">
                <Camera className="h-4 w-4" />
                Photobooks
              </span>
              <Badge variant="secondary">{photobooks.length}</Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}