import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { CroppedImage } from './CroppedImage'
import exampleImage from 'figma:asset/f4288eeb39c0707261cc3daac4a2c51cf7c81a47.png'
import { Info, Grid, Monitor, Crop, CheckCircle } from 'lucide-react'

export function ThumbnailCroppingSummary() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Right Side Cover Cropping Implementation Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <strong>Clarification:</strong> Right side cropping hanya digunakan untuk thumbnails di movie cards/grid.
                MoviePage tetap menampilkan full cover tanpa cropping untuk viewing experience yang optimal.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Thumbnails - WITH Cropping */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-600">
              <Grid className="h-5 w-5" />
              Movie Thumbnails (WITH Cropping)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Example Thumbnail */}
            <div className="max-w-48 mx-auto">
              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-3 space-y-3">
                  <div className="text-center">
                    <Badge variant="secondary" className="text-xs font-mono">
                      EXAMPLE-001
                    </Badge>
                  </div>
                  <div className="bg-gray-100 rounded overflow-hidden aspect-[3/4] relative">
                    <CroppedImage
                      src={exampleImage}
                      alt="Example movie thumbnail"
                      className="w-full h-full"
                      cropToRight={true}
                    />
                    <Badge className="absolute top-1 right-1 text-xs bg-blue-600 text-white">
                      Right Crop
                    </Badge>
                  </div>
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

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Crop area biru (text & info) visible</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Quick movie identification</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Consistent grid layout</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Space efficient thumbnails</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Movie Page - NO Cropping */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <Monitor className="h-5 w-5" />
              Movie Page (NO Cropping)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Example Full Cover */}
            <div className="bg-gray-100 rounded-lg overflow-hidden aspect-[16/9] relative">
              <img
                src={exampleImage}
                alt="Full movie cover"
                className="w-full h-full object-contain"
              />
              <Badge className="absolute top-2 left-2 bg-green-600 text-white">
                Full Cover
              </Badge>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Complete visual experience</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Full image appreciation</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Original aspect ratio preserved</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Detailed viewing mode</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Technical Implementation */}
      <Card>
        <CardHeader>
          <CardTitle>Technical Implementation Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* MovieCard Implementation */}
          <div>
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <Grid className="h-4 w-4 text-blue-600" />
              MovieCard.tsx (Thumbnails)
            </h3>
            <div className="bg-muted rounded-lg p-4 font-mono text-sm overflow-x-auto">
              <div className="space-y-1">
                <div className="text-green-600">// RIGHT CROPPING untuk thumbnails</div>
                <div>{`{movie.cropCover ? (`}</div>
                <div className="ml-4">&lt;CroppedImage</div>
                <div className="ml-8">src={`{coverUrl}`}</div>
                <div className="ml-8">alt="Movie cover"</div>
                <div className="ml-8">className="w-full h-full object-cover"</div>
                <div className="ml-8 text-blue-600">cropToRight={`{true}`} // Show area biru</div>
                <div className="ml-4">/&gt;</div>
                <div>{`) : (`}</div>
                <div className="ml-4">&lt;img // Full image untuk uncropped thumbnails</div>
                <div className="ml-4">/&gt;</div>
                <div>{`)}`}</div>
              </div>
            </div>
          </div>

          {/* MoviePage Implementation */}
          <div>
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <Monitor className="h-4 w-4 text-green-600" />
              MoviePage.tsx (Full View)
            </h3>
            <div className="bg-muted rounded-lg p-4 font-mono text-sm overflow-x-auto">
              <div className="space-y-1">
                <div className="text-green-600">// NO CROPPING untuk MoviePage</div>
                <div>&lt;img</div>
                <div className="ml-4">src={`{coverUrl}`}</div>
                <div className="ml-4">alt="Movie cover"</div>
                <div className="ml-4">className="w-full h-full object-contain"</div>
                <div className="ml-4 text-green-600">// Always show full cover</div>
                <div>/&gt;</div>
              </div>
            </div>
          </div>

          {/* Default Settings */}
          <div>
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <Crop className="h-4 w-4 text-orange-600" />
              Default Movie Settings
            </h3>
            <div className="bg-muted rounded-lg p-4 font-mono text-sm overflow-x-auto">
              <div className="space-y-1">
                <div className="text-green-600">// MovieForm.tsx default values</div>
                <div>const [formData, setFormData] = useState({`{`}</div>
                <div className="ml-4">// ... other fields ...</div>
                <div className="ml-4 text-blue-600">cropCover: true  // Default ke right cropping</div>
                <div>{`})`}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Benefits Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Benefits Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-blue-600">Thumbnail Benefits (Right Crop)</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Text information always visible</li>
                <li>• Movie title, code, rating readable</li>
                <li>• Consistent grid appearance</li>
                <li>• Fast movie scanning</li>
                <li>• Space efficient layout</li>
                <li>• Better mobile experience</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium text-green-600">MoviePage Benefits (Full Cover)</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Complete visual experience</li>
                <li>• Artistic appreciation</li>
                <li>• Full image details visible</li>
                <li>• Original composition preserved</li>
                <li>• Professional presentation</li>
                <li>• Enhanced viewing pleasure</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Implementation Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-green-800">✅ Implementation Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium">Completed Features</h4>
              <div className="space-y-1 text-green-700">
                <div>• CroppedImage component dengan right cropping</div>
                <div>• MovieCard menggunakan cropping untuk thumbnails</div>
                <div>• MoviePage menampilkan full cover</div>
                <div>• Default cropCover = true untuk new movies</div>
                <div>• CSS object-position: '100% center' implementation</div>
                <div>• Responsive design untuk semua screen sizes</div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Key Specifications</h4>
              <div className="space-y-1 text-muted-foreground">
                <div>• Target Area: Area biru dari attached image</div>
                <div>• Thumbnail Aspect: aspect-[3/4]</div>
                <div>• Full Cover Aspect: aspect-[16/9]</div>
                <div>• Default Behavior: Right side cropping</div>
                <div>• User Control: Toggle option available</div>
                <div>• Performance: Optimized image loading</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}