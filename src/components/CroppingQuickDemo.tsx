import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { CroppedImage } from './CroppedImage'
import exampleImage from 'figma:asset/f4288eeb39c0707261cc3daac4a2c51cf7c81a47.png'
import { Info, Eye, Maximize } from 'lucide-react'

export function CroppingQuickDemo() {
  const [showDemo, setShowDemo] = useState(false)

  if (!showDemo) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setShowDemo(true)}
          size="sm"
          className="flex items-center gap-2 shadow-lg"
        >
          <Eye className="h-4 w-4" />
          View Cropping Demo
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="max-w-4xl w-full max-h-[90vh] overflow-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              Right Side Cover Cropping - Untuk Thumbnails Saja
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDemo(false)}
            >
              Close
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quick Demo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Cover */}
            <div className="space-y-3">
              <h3 className="font-medium">Full Cover Image</h3>
              <div className="bg-gray-100 rounded-lg overflow-hidden aspect-auto">
                <img
                  src={exampleImage}
                  alt="Full cover example"
                  className="w-full h-auto object-contain"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Complete cover - ditampilkan di MoviePage (no cropping)
              </p>
            </div>

            {/* Cropped View */}
            <div className="space-y-3">
              <h3 className="font-medium flex items-center gap-2">
                Default Cropped View 
                <Badge className="bg-blue-600 text-white">Right Side</Badge>
              </h3>
              <div className="bg-gray-100 rounded-lg overflow-hidden aspect-[3/4] relative">
                <CroppedImage
                  src={exampleImage}
                  alt="Right side cropped example"
                  className="w-full h-full"
                  cropToRight={true}
                />
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary" className="text-xs bg-blue-600 text-white">
                    Text & Info Area
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Shows text dan information area untuk thumbnails (blue zone dari attached image)
              </p>
            </div>
          </div>

          {/* Implementation Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-600" />
              Implementation Summary
            </h4>
            <div className="text-sm space-y-2">
              <p>• <strong>Default Behavior:</strong> Right side cropping untuk thumbnails movie cards saja</p>
              <p>• <strong>CSS Implementation:</strong> <code className="bg-white px-1 rounded">object-position: '100% center'</code></p>
              <p>• <strong>Target Area:</strong> Area biru (text & info) dari attached image</p>
              <p>• <strong>Component:</strong> CroppedImage dengan <code className="bg-white px-1 rounded">cropToRight=true</code></p>
            </div>
          </div>

          {/* Current Status */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium mb-2 text-green-800">✅ Implementation Status</h4>
            <div className="text-sm text-green-700 space-y-1">
              <p>• MovieCard: Using right cropping untuk thumbnails</p>
              <p>• MoviePage: Displays full cover (no cropping)</p>
              <p>• CroppedImage: Supports both left and right cropping</p>
              <p>• Add Movie: Default cropToRight=true untuk thumbnails</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}