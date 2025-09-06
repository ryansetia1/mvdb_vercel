import { MovieThumbnail } from './MovieThumbnail'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Movie } from '../utils/movieApi'

// Sample movie data for demonstration
const sampleMovies: Movie[] = [
  {
    id: '1',
    code: 'DEMO-001',
    titleEn: 'Cropped Cover Demo',
    titleJp: 'クロップされたカバーのデモ',
    cover: 'https://pics.dmm.co.jp/digital/video/*/*/demo001pl.jpg',
    dmcode: 'demo001',
    cropCover: true, // This will be cropped
    actress: 'Demo Actress',
    type: 'Demo'
  },
  {
    id: '2', 
    code: 'DEMO-002',
    titleEn: 'Full Aspect Ratio Demo',
    titleJp: 'フルアスペクト比のデモ',
    cover: 'https://pics.dmm.co.jp/digital/video/*/*/demo002pl.jpg',
    dmcode: 'demo002',
    cropCover: false, // This will use full aspect ratio
    actress: 'Demo Actress 2',
    type: 'Demo'
  }
]

export function MovieThumbnailDemo() {
  return (
    <div className="p-6 space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">MovieThumbnail Aspect Ratio Demo</h2>
        <p className="text-muted-foreground">
          Demonstrasi perbedaan antara cropCover=true (3:4 ratio dengan crop) vs cropCover=false (full aspect ratio)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {sampleMovies.map((movie) => (
          <Card key={movie.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-lg">
                {movie.titleEn}
                <Badge variant={movie.cropCover ? 'default' : 'secondary'}>
                  {movie.cropCover ? 'Cropped (3:4)' : 'Full Ratio'}
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                cropCover: {movie.cropCover ? 'true' : 'false'}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-4 bg-muted/30">
                <MovieThumbnail
                  movie={movie}
                  showHoverEffect={false}
                  maxHeight="max-h-[400px]" // Higher max height for demo
                />
              </div>
              <div className="space-y-2 text-sm">
                <p><strong>Behavior:</strong></p>
                <p className="text-muted-foreground">
                  {movie.cropCover 
                    ? '• Fixed 3:4 aspect ratio container\n• Image cropped to right side\n• Consistent card heights in grids' 
                    : '• Natural aspect ratio preserved\n• Image displayed with object-contain\n• Max height constraint prevents layout issues'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-medium mb-2">Implementation Notes:</h3>
        <ul className="text-sm space-y-1 text-muted-foreground">
          <li>• <code>cropCover: true</code> - Uses fixed aspect-[3/4] container with CroppedImage component</li>
          <li>• <code>cropCover: false</code> - Uses natural aspect ratio with maxHeight constraint</li>
          <li>• maxHeight prop prevents extremely tall images from breaking layout</li>
          <li>• object-contain ensures full image visibility without distortion</li>
        </ul>
      </div>
    </div>
  )
}