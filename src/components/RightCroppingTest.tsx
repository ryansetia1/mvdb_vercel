import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { CroppedImage } from './CroppedImage'
import exampleImage from 'figma:asset/f4288eeb39c0707261cc3daac4a2c51cf7c81a47.png'
import { TestTube, ArrowLeft, ArrowRight, Check, X } from 'lucide-react'

export function RightCroppingTest() {
  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5 text-blue-600" />
          Right Cropping Test - Verification
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Test Description */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm">
            <strong>Test:</strong> Memverifikasi bahwa cropToRight={'{true}'} menampilkan bagian KANAN image 
            (area biru dengan text & info), bukan bagian kiri.
          </p>
        </div>

        {/* Visual Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Side (WRONG) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <X className="h-4 w-4 text-red-600" />
              <h3 className="font-medium text-red-600">LEFT Side (Wrong)</h3>
            </div>
            <div className="bg-gray-100 rounded overflow-hidden aspect-[3/4] relative">
              <img
                src={exampleImage}
                alt="Left side (wrong)"
                className="w-full h-full object-cover"
                style={{
                  objectPosition: '0% center' // LEFT side
                }}
              />
              <Badge className="absolute top-1 left-1 bg-red-600 text-white text-xs">
                0% center
              </Badge>
              <div className="absolute bottom-1 left-1">
                <ArrowLeft className="h-4 w-4 text-red-600" />
              </div>
            </div>
            <p className="text-xs text-red-600">
              Shows left side - mostly visual content, NOT text area
            </p>
          </div>

          {/* Right Side (CORRECT) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <h3 className="font-medium text-green-600">RIGHT Side (Correct)</h3>
            </div>
            <div className="bg-gray-100 rounded overflow-hidden aspect-[3/4] relative">
              <CroppedImage
                src={exampleImage}
                alt="Right side cropped (correct)"
                className="w-full h-full"
                cropToRight={true}
                fixedSize={false}
              />
              <Badge className="absolute top-1 right-1 bg-green-600 text-white text-xs">
                100% center
              </Badge>
              <div className="absolute bottom-1 right-1">
                <ArrowRight className="h-4 w-4 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-green-600">
              Shows RIGHT side - area biru dengan text & info
            </p>
          </div>

          {/* Full Image (Reference) */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-600">Full Image (Reference)</h3>
            <div className="bg-gray-100 rounded overflow-hidden aspect-auto relative">
              <img
                src={exampleImage}
                alt="Full image reference"
                className="w-full h-auto object-contain"
              />
              <Badge className="absolute top-1 left-1 bg-gray-600 text-white text-xs">
                Full Cover
              </Badge>
              {/* Blue highlight overlay for reference */}
              <div 
                className="absolute top-0 right-0 h-full bg-blue-600/30 border-2 border-blue-600 border-dashed"
                style={{ width: '40%' }}
              >
                <Badge className="absolute top-2 right-2 bg-blue-600 text-white text-xs">
                  Target Area
                </Badge>
              </div>
            </div>
            <p className="text-xs text-gray-600">
              Blue highlight shows target crop area (right side)
            </p>
          </div>
        </div>

        {/* Technical Details */}
        <div className="bg-muted rounded-lg p-4">
          <h4 className="font-medium mb-3">Technical Implementation Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-sm">
            <div className="space-y-2">
              <div className="text-red-600">❌ WRONG (Left Side):</div>
              <div>objectPosition: '0% center'</div>
              <div>// Shows left side (visual content)</div>
            </div>
            <div className="space-y-2">
              <div className="text-green-600">✅ CORRECT (Right Side):</div>
              <div>objectPosition: '100% center'</div>
              <div>// Shows right side (text & info)</div>
            </div>
          </div>
        </div>

        {/* Expected Result */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium mb-2 text-green-800 flex items-center gap-2">
            <Check className="h-4 w-4" />
            Expected Result for cropToRight={'{true}'}
          </h4>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Area biru (right side) yang berisi text dan informasi movie harus visible</li>
            <li>• Movie title, code, rating, studio info harus terbaca</li>
            <li>• Bagian kiri (visual content) akan terpotong</li>
            <li>• CSS: objectPosition: '100% center' di CroppedImage component</li>
          </ul>
        </div>

        {/* Test Result */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Test Result:</h4>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-green-600 font-medium">RIGHT side cropping active</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            CroppedImage dengan cropToRight={'{true}'} sekarang menampilkan bagian kanan image 
            yang berisi text & informasi movie, sesuai dengan area biru yang diinginkan.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}