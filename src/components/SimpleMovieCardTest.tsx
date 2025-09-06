import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { SimpleMovieCard } from './SimpleMovieCard'
import { Movie } from '../utils/movieApi'

export function SimpleMovieCardTest() {
  const [clickedMovie, setClickedMovie] = useState<string | null>(null)

  // Test movie data
  const testMovies: Movie[] = [
    {
      id: 'test-1',
      code: 'TEST-001',
      titleEn: 'Test Movie with Cover',
      titleJp: 'テスト映画1',
      actress: 'Test Actress 1, Test Actress 2',
      releaseDate: '2024-01-15',
      cover: 'https://via.placeholder.com/300x400/4f46e5/ffffff?text=Test+Cover',
      type: 'Regular'
    },
    {
      id: 'test-2',
      code: 'TEST-002',
      titleEn: 'Test Movie Without Cover',
      titleJp: 'テスト映画2',
      actress: 'Test Actress 3',
      releaseDate: '2023-12-20',
      cover: '',
      type: 'Special'
    },
    {
      id: 'test-3',
      code: 'TEST-003',
      titleEn: 'Long Title Test Movie That Should Be Truncated When It Gets Too Long',
      titleJp: 'とても長いタイトルのテスト映画',
      actress: 'Test Actress 1, Test Actress 2, Test Actress 3, Test Actress 4',
      releaseDate: '2024-02-10',
      cover: 'https://via.placeholder.com/300x400/dc2626/ffffff?text=Another+Test',
      type: 'Premium'
    }
  ]

  const handleMovieClick = (movie: Movie) => {
    setClickedMovie(movie.titleEn || movie.titleJp || 'Unknown')
    console.log('Movie clicked:', movie)
    
    // Show alert for demonstration
    alert(`SimpleMovieCard clicked!\n\nTitle: ${movie.titleEn || movie.titleJp}\nCode: ${movie.code}\n\nClick navigation is working!`)
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Simple Movie Card Test</CardTitle>
        <p className="text-sm text-muted-foreground">
          Test the SimpleMovieCard component click functionality. Click any card below to test navigation.
        </p>
        {clickedMovie && (
          <div className="text-sm text-green-600 bg-green-50 p-2 rounded border">
            Last clicked: {clickedMovie}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {testMovies.map((movie) => (
            <SimpleMovieCard
              key={movie.id}
              movie={movie}
              onClick={() => handleMovieClick(movie)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}