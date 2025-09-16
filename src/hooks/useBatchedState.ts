import { useState, useCallback, useRef, useEffect } from 'react'

/**
 * Custom hook untuk batch state updates dan mengurangi re-renders
 * Berguna untuk operasi yang memerlukan multiple state updates
 */
export function useBatchedState<T>(initialState: T) {
  const [state, setState] = useState<T>(initialState)
  const batchRef = useRef<T | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const batchUpdate = useCallback((updater: (prev: T) => T) => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Update batch
    batchRef.current = updater(batchRef.current || state)

    // Set timeout to apply batch
    timeoutRef.current = setTimeout(() => {
      if (batchRef.current !== null) {
        setState(batchRef.current)
        batchRef.current = null
      }
    }, 0) // Use setTimeout to batch updates in next tick
  }, [state])

  const immediateUpdate = useCallback((updater: (prev: T) => T) => {
    // Clear any pending batch
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    batchRef.current = null

    // Apply immediately
    setState(updater)
  }, [])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return [state, batchUpdate, immediateUpdate] as const
}

/**
 * Hook untuk batch multiple state updates dalam satu operasi
 */
export function useBatchedUpdates() {
  const updatesRef = useRef<(() => void)[]>([])
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const batchUpdate = useCallback((updateFn: () => void) => {
    updatesRef.current.push(updateFn)

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set timeout to apply all batched updates
    timeoutRef.current = setTimeout(() => {
      // Apply all updates
      updatesRef.current.forEach(update => update())
      updatesRef.current = []
    }, 0)
  }, [])

  const flushUpdates = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    
    // Apply all pending updates immediately
    updatesRef.current.forEach(update => update())
    updatesRef.current = []
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return { batchUpdate, flushUpdates }
}
