import { useState, useEffect, useCallback, useRef } from 'react'
import { VIEWER_CONTROLS } from './constants'

export interface ImageViewerState {
  scale: number
  position: { x: number; y: number }
  isDragging: boolean
  dragStart: { x: number; y: number }
  imageSize: { width: number; height: number }
  isLoaded: boolean
}

export function useImageViewer(isOpen: boolean, currentIndex: number) {
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })
  const [isLoaded, setIsLoaded] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  const resetView = useCallback(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
    setIsLoaded(false)
  }, [])

  const fitToViewport = useCallback(() => {
    if (!containerRef.current || !imageRef.current || !isLoaded) return

    const container = containerRef.current
    const containerRect = container.getBoundingClientRect()
    const { width: imgWidth, height: imgHeight } = imageSize

    if (imgWidth === 0 || imgHeight === 0) return

    const containerWidth = containerRect.width - VIEWER_CONTROLS.CONTAINER_PADDING
    const containerHeight = containerRect.height - VIEWER_CONTROLS.CONTAINER_PADDING

    const scaleX = containerWidth / imgWidth
    const scaleY = containerHeight / imgHeight
    const fitScale = Math.min(scaleX, scaleY, 1)

    setScale(fitScale)
    setPosition({ x: 0, y: 0 })
  }, [imageSize, isLoaded])

  const zoomIn = useCallback(() => {
    setScale(prev => Math.min(prev * VIEWER_CONTROLS.ZOOM_STEP, VIEWER_CONTROLS.ZOOM_MAX))
  }, [])

  const zoomOut = useCallback(() => {
    setScale(prev => Math.max(prev / VIEWER_CONTROLS.ZOOM_STEP, VIEWER_CONTROLS.ZOOM_MIN))
  }, [])

  // Reset when image changes
  useEffect(() => {
    resetView()
  }, [currentIndex, resetView])

  return {
    scale,
    setScale,
    position,
    setPosition,
    isDragging,
    setIsDragging,
    dragStart,
    setDragStart,
    imageSize,
    setImageSize,
    isLoaded,
    setIsLoaded,
    containerRef,
    imageRef,
    resetView,
    fitToViewport,
    zoomIn,
    zoomOut
  }
}