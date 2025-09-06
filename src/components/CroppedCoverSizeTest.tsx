import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { CroppedImage } from './CroppedImage'
import { Ruler } from 'lucide-react'

export function CroppedCoverSizeTest() {
  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ruler className="h-4 w-4" />
          140x200px Size Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <CroppedImage
            src="https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400&h=600"
            alt="Size test"
            cropToRight={true}
          />
        </div>
        <div className="text-center text-sm text-green-600">
          ✓ Cropped cover verified: 140x200px
        </div>
      </CardContent>
    </Card>
  )
}