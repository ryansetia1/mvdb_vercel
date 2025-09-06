import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Movie } from '../utils/movieApi'
import { SCMovie } from '../utils/scMovieApi'
import { MovieForm } from './MovieForm'
import { SCMovieForm } from './SCMovieForm'

interface UnifiedMovieFormProps {
  movie?: Movie
  scMovie?: SCMovie
  onSave: (data: Movie | SCMovie, type: 'hc' | 'sc') => void
  onCancel: () => void
  accessToken: string
  defaultTab?: 'hc' | 'sc'
}

export function UnifiedMovieForm({ 
  movie, 
  scMovie, 
  onSave, 
  onCancel, 
  accessToken, 
  defaultTab = 'hc' 
}: UnifiedMovieFormProps) {
  const [activeTab, setActiveTab] = useState(defaultTab)

  const handleHCMovieSave = (savedMovie: Movie) => {
    onSave(savedMovie, 'hc')
  }

  const handleSCMovieSave = (savedSCMovie: SCMovie) => {
    onSave(savedSCMovie, 'sc')
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tambah Movie Baru</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'hc' | 'sc')} className="w-full">
            <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto">
              <TabsTrigger value="hc" className="flex items-center gap-2">
                HC Movies
                <span className="text-xs text-muted-foreground">(Hardcore)</span>
              </TabsTrigger>
              <TabsTrigger value="sc" className="flex items-center gap-2">
                SC Movies
                <span className="text-xs text-muted-foreground">(Soft Content)</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="hc" className="mt-6">
              <MovieForm
                movie={movie}
                onSave={handleHCMovieSave}
                onCancel={onCancel}
                accessToken={accessToken}
              />
            </TabsContent>

            <TabsContent value="sc" className="mt-6">
              <SCMovieForm
                scMovie={scMovie}
                onSave={handleSCMovieSave}
                onCancel={onCancel}
                accessToken={accessToken}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}