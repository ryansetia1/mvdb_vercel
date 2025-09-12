import { useEffect, useRef, useCallback } from 'react'

interface PaginationHandler {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  id: string
}

// Global state untuk keyboard pagination
let activePaginationHandler: PaginationHandler | null = null
let eventListenerAdded = false

export function useGlobalKeyboardPagination(
  currentPage: number,
  totalPages: number,
  onPageChange: (page: number) => void,
  componentId: string,
  enabled: boolean = true
) {
  const handlerRef = useRef<PaginationHandler>({
    currentPage,
    totalPages,
    onPageChange,
    id: componentId
  })

  // Update handler data
  handlerRef.current = {
    currentPage,
    totalPages,
    onPageChange,
    id: componentId
  }

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Check if we have an active pagination handler
    if (!activePaginationHandler || !enabled) return

    // Check if we're in a form field or dialog
    const activeElement = document.activeElement
    const isInputFocused = activeElement && (
      activeElement.tagName === 'INPUT' || 
      activeElement.tagName === 'TEXTAREA' || 
      activeElement.tagName === 'SELECT' ||
      activeElement.getAttribute('contenteditable') === 'true' ||
      activeElement.closest('[role="dialog"]') !== null ||
      activeElement.closest('[data-radix-dialog-content]') !== null
    )

    if (isInputFocused) return

    const { currentPage: page, totalPages: total, onPageChange: changePage } = activePaginationHandler

    // Handle arrow keys
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      if (page > 1) {
        changePage(page - 1)
      }
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      if (page < total) {
        changePage(page + 1)
      }
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled || totalPages <= 1) return

    // Set this as the active pagination handler
    activePaginationHandler = handlerRef.current

    // Add global event listener if not already added
    if (!eventListenerAdded) {
      document.addEventListener('keydown', handleKeyDown, { capture: true })
      eventListenerAdded = true
    }

    // Cleanup: remove this handler when component unmounts
    return () => {
      if (activePaginationHandler?.id === componentId) {
        activePaginationHandler = null
      }
    }
  }, [currentPage, totalPages, componentId, enabled, handleKeyDown])

  // Cleanup global event listener when no handlers are active
  useEffect(() => {
    return () => {
      if (activePaginationHandler === null && eventListenerAdded) {
        document.removeEventListener('keydown', handleKeyDown, { capture: true })
        eventListenerAdded = false
      }
    }
  }, [handleKeyDown])
}
