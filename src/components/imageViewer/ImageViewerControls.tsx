import { X, ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { Button } from '../ui/button'
import { VIEWER_CONTROLS } from './constants'

interface ImageViewerControlsProps {
  scale: number
  onZoomIn: () => void
  onZoomOut: () => void
  onFitToViewport: () => void
  onClose: () => void
  onNavigatePrev: () => void
  onNavigateNext: () => void
  onDownload: () => void
  hasMultipleImages: boolean
}

export function ImageViewerControls({
  scale,
  onZoomIn,
  onZoomOut,
  onFitToViewport,
  onClose,
  onNavigatePrev,
  onNavigateNext,
  onDownload,
  hasMultipleImages
}: ImageViewerControlsProps) {
  return (
    <>
      {/* Top Controls */}
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <Button
          variant="secondary"
          size="sm"
          onClick={onZoomOut}
          disabled={scale <= VIEWER_CONTROLS.ZOOM_MIN}
          title="Zoom Out (-)"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={onZoomIn}
          disabled={scale >= VIEWER_CONTROLS.ZOOM_MAX}
          title="Zoom In (+)"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={onFitToViewport}
          title="Fit to Viewport (0)"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={onDownload}
          title="Download Image"
        >
          <Download className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={onClose}
          title="Close (Esc)"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Navigation Controls */}
      {hasMultipleImages && (
        <>
          <Button
            variant="secondary"
            size="sm"
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10"
            onClick={onNavigatePrev}
            title="Previous (←)"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10"
            onClick={onNavigateNext}
            title="Next (→)"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </>
      )}
    </>
  )
}