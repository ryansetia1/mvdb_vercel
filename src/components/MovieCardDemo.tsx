import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { MovieCard } from './MovieCard'
import { Movie } from '../utils/movieApi'

// Sample movies with different actress scenarios
const sampleMovies: Movie[] = [
  {
    id: '1',
    code: 'DEMO-001',
    titleEn: 'Single Actress Movie',
    titleJp: 'シングル女優の映画',
    cover: 'https://pics.dmm.co.jp/digital/video/*/*/demo001pl.jpg',
    dmcode: 'demo001',
    cropCover: true,
    actress: 'Yui Hatano',
    type: 'Demo'
  },
  {
    id: '2', 
    code: 'DEMO-002',
    titleEn: 'Three Actresses Movie',
    titleJp: '三人の女優の映画',
    cover: 'https://pics.dmm.co.jp/digital/video/*/*/demo002pl.jpg',
    dmcode: 'demo002',
    cropCover: false,
    actress: 'Yui Hatano, Miya Rai, Akari Asagiri',
    type: 'Demo'
  },
  {
    id: '3',
    code: 'DEMO-003',
    titleEn: 'Many Actresses Movie',
    titleJp: '多くの女優の映画',
    cover: 'https://pics.dmm.co.jp/digital/video/*/*/demo003pl.jpg',
    dmcode: 'demo003',
    cropCover: true,
    actress: 'Yui Hatano, Miya Rai, Akari Asagiri, Julia Kyoka, Hibiki Otsuki, Ai Uehara',
    type: 'Demo'
  },
  {
    id: '4',
    code: 'LONGCODE-004',
    titleEn: 'No Actress Movie with Very Long Code',
    titleJp: '女優なしの映画',
    cover: 'https://pics.dmm.co.jp/digital/video/*/*/demo004pl.jpg',
    dmcode: 'demo004',
    cropCover: false,
    actress: undefined,
    type: 'Demo'
  }
]

export function MovieCardDemo() {
  const [selectedActress, setSelectedActress] = useState<string | null>(null)
  const [clickLog, setClickLog] = useState<string[]>([])

  const handleActressClick = (actressName: string, event: React.MouseEvent) => {
    setSelectedActress(actressName)
    const timestamp = new Date().toLocaleTimeString()
    setClickLog(prev => [...prev, `${timestamp}: Clicked on "${actressName}"`])
    console.log('Actress clicked:', actressName)
  }

  const handleMovieClick = (movie: Movie) => {
    const timestamp = new Date().toLocaleTimeString()
    setClickLog(prev => [...prev, `${timestamp}: Clicked on movie "${movie.titleEn}"`])
    console.log('Movie clicked:', movie.titleEn)
  }

  return (
    <div className="p-6 space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Enhanced MovieCard Demo</h2>
        <p className="text-muted-foreground">
          Demonstrasi fitur clickable actress names, larger movie codes, dan "& more" untuk actress yang lebih dari 3
        </p>
      </div>

      {/* Demo Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {sampleMovies.map((movie) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            onClick={() => handleMovieClick(movie)}
            onActressClick={handleActressClick}
          />
        ))}
      </div>

      {/* Features Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Selected Actress Display */}
        <Card>
          <CardHeader>
            <CardTitle>Selected Actress</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedActress ? (
              <div className="space-y-2">
                <Badge variant="default" className="text-base px-3 py-1">
                  {selectedActress}
                </Badge>
                <p className="text-sm text-muted-foreground">
                  Clicking this would navigate to the actress profile page
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground">
                Click on any actress name to see selection
              </p>
            )}
          </CardContent>
        </Card>

        {/* Click Log */}
        <Card>
          <CardHeader>
            <CardTitle>Click Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {clickLog.length === 0 ? (
                <p className="text-muted-foreground text-sm">No clicks yet</p>
              ) : (
                clickLog.slice(-5).map((log, index) => (
                  <p key={index} className="text-xs font-mono bg-muted p-2 rounded">
                    {log}
                  </p>
                ))
              )}
            </div>
            {clickLog.length > 5 && (
              <p className="text-xs text-muted-foreground mt-2">
                Showing last 5 clicks of {clickLog.length} total
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Features Explanation */}
      <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-medium mb-4">Enhanced Features:</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <h4 className="font-medium mb-2">📝 Larger Movie Code</h4>
            <p className="text-muted-foreground">
              Movie code badge now uses <code>text-sm</code> dan padding lebih besar untuk visibility yang lebih baik
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">👩‍🎭 Clickable Actress Names</h4>
            <p className="text-muted-foreground">
              Setiap nama aktris individual dapat diklik untuk menuju ke profile page mereka masing-masing
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">➕ Smart Truncation</h4>
            <p className="text-muted-foreground">
              Jika lebih dari 3 aktris, hanya 3 pertama yang ditampilkan dengan "& X more" untuk sisanya
            </p>
          </div>
        </div>
        
        <div className="mt-4 space-y-2">
          <h4 className="font-medium">Implementation Details:</h4>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• Nama aktris diparsing menggunakan delimiter: koma (,), titik koma (;), atau slash (/)</li>
            <li>• Hover effects dan cursor pointer untuk visual feedback</li>
            <li>• Event.stopPropagation() untuk mencegah card click saat klik nama aktris</li>
            <li>• Tooltip menampilkan semua nama aktris yang tersembunyi di "& more"</li>
          </ul>
        </div>
      </div>
    </div>
  )
}