import { useEffect, useRef } from 'react'

interface UseKeyboardPaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  enabled?: boolean
  preventDefault?: boolean
}

export function useKeyboardPagination({
  currentPage,
  totalPages,
  onPageChange,
  enabled = true,
  preventDefault = true
}: UseKeyboardPaginationProps) {
  const isActiveRef = useRef(false)

  useEffect(() => {
    if (!enabled || totalPages <= 1) {
      isActiveRef.current = false
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle if this is the active pagination component
      if (!isActiveRef.current) return

      // Check if we're in a form field
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

      // Handle arrow keys
      if (event.key === 'ArrowLeft') {
        if (preventDefault) event.preventDefault()
        if (currentPage > 1) {
          onPageChange(currentPage - 1)
        }
      } else if (event.key === 'ArrowRight') {
        if (preventDefault) event.preventDefault()
        if (currentPage < totalPages) {
          onPageChange(currentPage + 1)
        }
      }
    }

    // Add event listener
    document.addEventListener('keydown', handleKeyDown, { capture: true })

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown, { capture: true })
    }
  }, [currentPage, totalPages, onPageChange, enabled, preventDefault])

  // Function to activate this pagination instance
  const activate = () => {
    isActiveRef.current = true
  }

  // Function to deactivate this pagination instance
  const deactivate = () => {
    isActiveRef.current = false
  }

  return {
    activate,
    deactivate,
    isActive: isActiveRef.current
  }
}
