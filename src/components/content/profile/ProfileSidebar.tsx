import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { ImageWithFallback } from '../../figma/ImageWithFallback'
import { MasterDataItem, calculateAge } from '../../../utils/masterDataApi'
import { Movie } from '../../../utils/movieApi'
import { Photobook } from '../../../utils/photobookApi'
import { User, Calendar, Film, Camera, Images } from 'lucide-react'
import { MultipleTakuLinksEnhanced } from '../../MultipleTakuLinksEnhanced'

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
  
  // Auto cycling state
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  
  // Determine which images to cycle through
  const imagesToCycle = profileImages.length > 0 ? profileImages : (profile?.profilePicture ? [profile.profilePicture] : [])
  const shouldAutoCycle = imagesToCycle.length > 1
  
  // Auto cycle effect
  useEffect(() => {
    if (!shouldAutoCycle || isPaused) return
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        (prevIndex + 1) % imagesToCycle.length
      )
    }, 3000) // Change image every 3 seconds
    
    return () => clearInterval(interval)
  }, [shouldAutoCycle, isPaused, imagesToCycle.length])
  
  // Reset index when images change
  useEffect(() => {
    setCurrentImageIndex(0)
  }, [profileImages, profile?.profilePicture])
  
  // Get current image to display
  const currentImage = imagesToCycle[currentImageIndex] || profile?.profilePicture

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
          <div 
            className={`relative aspect-[3/4] max-w-[200px] mx-auto mb-3 rounded-lg overflow-hidden bg-gray-100 ${currentImage ? 'cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all duration-200 group' : ''}`}
            onClick={onProfilePictureClick}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {currentImage ? (
              <ImageWithFallback
                src={currentImage}
                alt={name}
                className={`w-full h-full object-cover transition-all duration-500 ${currentImage ? 'group-hover:scale-105' : ''}`}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <User className="h-12 w-12" />
              </div>
            )}
            {/* Image count indicator and cycling dots */}
            {shouldAutoCycle && (
              <>
                <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
                  <Images className="h-3 w-3" />
                  {imagesToCycle.length}
                </div>
                {/* Cycling indicator dots */}
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
                  {imagesToCycle.map((_, index) => (
                    <button
                      key={index}
                      className={`w-2 h-2 rounded-full transition-all duration-200 ${
                        index === currentImageIndex 
                          ? 'bg-white' 
                          : 'bg-white/50 hover:bg-white/70'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation()
                        setCurrentImageIndex(index)
                        setIsPaused(true)
                        setTimeout(() => setIsPaused(false), 5000) // Resume after 5 seconds
                      }}
                    />
                  ))}
                </div>
              </>
            )}
            {/* Single image indicator */}
            {!shouldAutoCycle && profileImages.length > 1 && (
              <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
                <Images className="h-3 w-3" />
                {profileImages.length}
              </div>
            )}
            {/* Click indicator overlay */}
            {currentImage && (
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center gap-1">
                  <Images className="h-6 w-6 text-white" />
                  {shouldAutoCycle && (
                    <span className="text-xs text-white bg-black/50 px-2 py-1 rounded">
                      {isPaused ? 'Paused' : 'Auto cycling'}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
          <h2 className="font-bold text-lg">{name}</h2>
          {profile?.jpname && (
            <p className="text-sm text-muted-foreground font-medium">{profile.jpname}</p>
          )}
          {age && (
            <p className="text-sm text-muted-foreground">{age} years old</p>
          )}
          {/* Taku Links */}
          {profile?.takulinks && profile.takulinks.trim() && (
            <MultipleTakuLinksEnhanced 
              takulinks={profile.takulinks} 
              className="mt-2"
              variant="default"
            />
          )}
        </div>

        {/* Basic Info */}
        {profile?.birthDate && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Born: {new Date(profile.birthDate).toLocaleDateString()}</span>
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