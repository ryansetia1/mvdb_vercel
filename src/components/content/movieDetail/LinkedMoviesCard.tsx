import React from 'react'
import { Card, CardContent } from '../../ui/card'
import { LinkedMoviesSection } from './LinkedMoviesSection'
import { Movie } from '../../../utils/movieApi'

interface LinkedMoviesCardProps {
  movieId: string
  accessToken: string
  onMovieSelect: (movie: Movie) => void
}

export function LinkedMoviesCard({ movieId, accessToken, onMovieSelect }: LinkedMoviesCardProps) {
  return (
    <LinkedMoviesSection
      movieId={movieId}
      accessToken={accessToken}
      onMovieSelect={onMovieSelect}
      renderWrapper={(content) => (
        <Card>
          <CardContent className="p-6">
            {content}
          </CardContent>
        </Card>
      )}
    />
  )
}
