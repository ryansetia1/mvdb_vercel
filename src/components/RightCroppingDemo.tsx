import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { CroppedImage } from './CroppedImage'
import exampleImage from 'figma:asset/f4288eeb39c0707261cc3daac4a2c51cf7c81a47.png'
import { Crop, RotateCcw, Info, ArrowRight, FileText } from 'lucide-react'

export function RightCroppingDemo() {
  const [viewMode, setViewMode] = useState<'comparison' | 'implementation'>('comparison')

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600" />
            Right Side Cover Cropping - Untuk Thumbnails Movie Cards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              Right cropping HANYA untuk thumbnails di movie list/grid. MoviePage tetap menampilkan full cover. Area biru (bagian kanan) berisi text dan informasi movie.
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'comparison' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('comparison')}
              >
                Comparison View
              </Button>
              <Button
                variant={viewMode === 'implementation' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('implementation')}
              >
                Implementation
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {viewMode === 'comparison' ? (
        /* Comparison View */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Full Cover */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Full Cover Image
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 rounded-lg overflow-hidden aspect-auto mb-3">
                <img
                  src={exampleImage}
                  alt="Full cover example"
                  className="w-full h-auto object-contain"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                Complete cover yang ditampilkan di MoviePage (no cropping)
              </div>
            </CardContent>
          </Card>

          {/* Cropped View (Right Side) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Crop className="h-4 w-4 text-blue-600" />
                Cropped View (Right Side)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 rounded-lg overflow-hidden aspect-[3/4] mb-3 relative">
                <CroppedImage
                  src={exampleImage}
                  alt="Right side cropped example"
                  className="w-full h-full"
                  cropToRight={true}
                  fixedSize={false}
                />
                {/* Blue overlay to show cropped area */}
                <div className="absolute inset-0 bg-blue-600/20 border-2 border-blue-600 border-dashed"></div>
                <Badge className="absolute top-2 left-2 bg-blue-600 text-white">
                  Right Side Area
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  Shows text & information area untuk thumbnails (blue zone from attached image)
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <ArrowRight className="h-3 w-3 text-blue-600" />
                  <span>CSS: objectPosition: '100% center'</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Implementation View */
        <Card>
          <CardHeader>
            <CardTitle>Live Implementation Example</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* MovieCard Style Implementation */}
            <div>
              <h3 className="font-medium mb-3">MovieCard Thumbnail Implementation</h3>
              <div className="max-w-xs mx-auto">
                <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="p-3 space-y-3">
                    {/* Code */}
                    <div className="text-center">
                      <Badge variant="secondary" className="text-xs font-mono">
                        EXAMPLE-001
                      </Badge>
                    </div>

                    {/* Cover with right cropping */}
                    <div className="bg-gray-100 rounded overflow-hidden aspect-[3/4] relative group">
                      <CroppedImage
                        src={exampleImage}
                        alt="Example movie cover"
                        className="w-full h-full group-hover:scale-105 transition-transform duration-200"
                        cropToRight={true}
                        fixedSize={false}
                      />
                      <div className="absolute top-1 right-1">
                        <Badge variant="secondary" className="text-xs bg-blue-600 text-white">
                          Right Crop
                        </Badge>
                      </div>
                    </div>

                    {/* Title & Info */}
                    <div className="space-y-1">
                      <h3 className="font-medium text-sm leading-tight">
                        Example Movie Title
                      </h3>
                    </div>

                    <div className="text-xs text-gray-600">
                      Example Actress Name
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            <Separator />

            {/* Code Implementation */}
            <div>
              <h3 className="font-medium mb-3">Code Implementation</h3>
              <div className="bg-muted rounded-lg p-4 font-mono text-sm overflow-x-auto">
                <div className="space-y-2">
                  <div className="text-green-600">// Default right cropping for movie thumbnails</div>
                  <div>&lt;CroppedImage</div>
                  <div className="ml-4">src={`{coverUrl}`}</div>
                  <div className="ml-4">alt="Movie cover"</div>
                  <div className="ml-4">className="w-full h-full object-cover"</div>
                  <div className="ml-4 text-blue-600">cropToRight={`{true}`} // Shows text & info area for thumbnails</div>
                  <div>/&gt;</div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Benefits */}
            <div>
              <h3 className="font-medium mb-3">Benefits of Right Side Cropping for Thumbnails</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-blue-600">Text Information Visibility</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Movie title clearly visible</li>
                    <li>• Code and rating information</li>
                    <li>• Studio and series details</li>
                    <li>• Release date and duration</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-green-600">Thumbnail Experience</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Consistent thumbnail layout</li>
                    <li>• Quick movie identification</li>
                    <li>• Better space utilization in grid</li>
                    <li>• Fast scanning of movie details</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Technical Specs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Technical Implementation Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium">CSS Property</h4>
              <code className="block bg-muted px-2 py-1 rounded text-xs">
                object-position: '100% center'
              </code>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Aspect Ratio</h4>
              <code className="block bg-muted px-2 py-1 rounded text-xs">
                aspect-[3/4] or aspect-[16/9]
              </code>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Default Behavior</h4>
              <code className="block bg-muted px-2 py-1 rounded text-xs">
                cropToRight: true (default)
              </code>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <strong>Implementation Note:</strong> Right side cropping adalah default behavior untuk thumbnails di movie cards saja. 
                MoviePage menampilkan full cover tanpa cropping. Cropping memastikan text dan information area (highlighted in blue) 
                selalu visible di thumbnails untuk quick movie identification.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}