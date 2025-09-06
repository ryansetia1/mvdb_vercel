import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { User } from 'lucide-react'

interface ClickableProfileAvatarProps {
  name: string
  profilePicture?: string | null
  onProfileClick?: (actressName: string) => void
  size?: 'sm' | 'md' | 'lg'
  showName?: boolean
  showIcon?: boolean
  className?: string
}

export function ClickableProfileAvatar({
  name,
  profilePicture,
  onProfileClick,
  size = 'sm',
  showName = true,
  showIcon = false,
  className = ''
}: ClickableProfileAvatarProps) {
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (onProfileClick) {
      onProfileClick(name)
    }
  }

  const avatarSizes = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10'
  }

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  if (!onProfileClick) {
    // Non-clickable version
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Avatar className={avatarSizes[size]}>
          <AvatarImage src={profilePicture || undefined} alt={name} />
          <AvatarFallback className={`${textSizes[size]} font-medium`}>
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>
        {showName && (
          <span className={textSizes[size]}>
            {name}
          </span>
        )}
        {showIcon && (
          <User className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
    )
  }

  // Clickable version with separate clickable elements
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Clickable Avatar */}
      <button
        onClick={(e) => handleClick(e)}
        className="rounded-full hover:ring-2 hover:ring-primary/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
        title={`View ${name}'s profile`}
      >
        <Avatar className={`${avatarSizes[size]} hover:scale-105 transition-transform duration-200 cursor-pointer`}>
          <AvatarImage src={profilePicture || undefined} alt={name} />
          <AvatarFallback className={`${textSizes[size]} font-medium`}>
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>
      </button>

      {showName && (
        <button
          onClick={(e) => handleClick(e)}
          className={`${textSizes[size]} hover:underline hover:text-primary transition-colors duration-200 cursor-pointer text-left focus:outline-none focus:underline`}
          title={`View ${name}'s profile`}
        >
          {name}
        </button>
      )}

      {showIcon && (
        <User className="h-4 w-4 text-muted-foreground" />
      )}
    </div>
  )
}