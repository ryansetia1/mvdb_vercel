import React from 'react'
import { Badge } from '../../ui/badge'
import { SimpleFavoriteButton } from '../../SimpleFavoriteButton'
import { MasterDataItem, calculateAgeAtDate } from '../../../utils/masterDataApi'
import { Movie } from '../../../utils/movieApi'
import { AgeGap } from './MovieDetailHelpers'

interface MovieCastSectionProps {
  movie: Movie
  castData: { [name: string]: MasterDataItem }
  ageGaps: AgeGap[] | null
  renderClickableNameWithAvatar: (name: string, type: 'actor' | 'actress' | 'director') => React.ReactNode
  renderAgeGaps: (ageGaps: AgeGap[]) => React.ReactNode
  accessToken: string
}

export function MovieCastSection({ 
  movie, 
  castData, 
  ageGaps, 
  renderClickableNameWithAvatar, 
  renderAgeGaps,
  accessToken
}: MovieCastSectionProps) {
  return (
    <div className="space-y-6">
      {/* Multiple Actresses - Each Clickable */}
      {movie.actress && (
        <div>
          <h4 className="text-sm text-muted-foreground mb-3">
            {movie.actress.includes(',') ? 'Actresses' : 'Actress'}
          </h4>
          <div className="space-y-3">
            {movie.actress.split(',').map((actress, index) => {
              const actressName = actress.trim()
              const actressInfo = castData[actressName]
              return (
                <div key={index} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {renderClickableNameWithAvatar(actressName, 'actress')}
                    {movie.releaseDate && actressInfo?.birthdate && (
                      <Badge variant="outline" className="text-xs">
                        {calculateAgeAtDate(actressInfo.birthdate, movie.releaseDate)} years old
                      </Badge>
                    )}
                  </div>
                  
                  {/* Actress Favorite Button */}
                  <SimpleFavoriteButton
                    type="cast"
                    itemId={actressName}
                    size="sm"
                    variant="ghost"
                  />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Multiple Actors - Each Clickable */}
      {movie.actors && (
        <div>
          <h4 className="text-sm text-muted-foreground mb-3">
            {movie.actors.includes(',') ? 'Actors' : 'Actor'}
          </h4>
          <div className="space-y-3">
            {movie.actors.split(',').map((actor, index) => {
              const actorName = actor.trim()
              const actorInfo = castData[actorName]
              return (
                <div key={index} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {renderClickableNameWithAvatar(actorName, 'actor')}
                    {movie.releaseDate && actorInfo?.birthdate && (
                      <Badge variant="outline" className="text-xs">
                        {calculateAgeAtDate(actorInfo.birthdate, movie.releaseDate)} years old
                      </Badge>
                    )}
                  </div>
                  
                  {/* Actor Favorite Button */}
                  <SimpleFavoriteButton
                    type="cast"
                    itemId={actorName}
                    size="sm"
                    variant="ghost"
                  />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {movie.director && (
        <div>
          <h4 className="text-sm text-muted-foreground mb-3">Director</h4>
          <div className="flex items-center justify-between gap-3">
            {renderClickableNameWithAvatar(movie.director, 'director')}
            
            {/* Director Favorite Button */}
            <SimpleFavoriteButton
              type="cast"
              itemId={movie.director}
              size="sm"
              variant="ghost"
            />
          </div>
        </div>
      )}

      {/* Age Gap Information */}
      {ageGaps && ageGaps.length > 0 && renderAgeGaps(ageGaps)}
    </div>
  )
}