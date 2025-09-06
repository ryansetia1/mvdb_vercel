import { toast } from 'sonner@2.0.3'

/**
 * Copy text to clipboard with comprehensive fallback support
 * Handles permissions policy blocks and provides multiple fallback methods
 */
export async function copyToClipboard(text: string, label?: string): Promise<boolean> {
  const displayLabel = label || 'Text'
  
  // Method 1: Modern Clipboard API (if available and allowed)
  try {
    if (window.isSecureContext && navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text)
      toast.success(`${displayLabel} copied to clipboard!`)
      return true
    }
  } catch (error) {
    // Log but don't show error - we have fallbacks
    console.warn('Clipboard API failed, trying fallback:', error)
  }

  // Method 2: Legacy document.execCommand with improved implementation
  try {
    const textArea = document.createElement('textarea')
    textArea.value = text
    
    // Position the textarea out of viewport but still accessible
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    textArea.style.opacity = '0'
    textArea.style.pointerEvents = 'none'
    textArea.style.zIndex = '-1'
    
    // Make it readable and selectable
    textArea.setAttribute('readonly', '')
    textArea.setAttribute('contenteditable', 'true')
    
    document.body.appendChild(textArea)
    
    // Focus and select the text
    textArea.focus()
    textArea.select()
    
    // For mobile compatibility
    textArea.setSelectionRange(0, text.length)
    
    // Execute copy command
    const successful = document.execCommand('copy')
    
    // Clean up
    document.body.removeChild(textArea)
    
    if (successful) {
      toast.success(`${displayLabel} copied to clipboard!`)
      return true
    } else {
      throw new Error('execCommand copy was unsuccessful')
    }
  } catch (execError) {
    console.error('execCommand fallback failed:', execError)
  }

  // Method 3: Show text in a selectable input with instructions
  try {
    // Create a simple modal-like toast with the text for manual copy
    toast.info(
      `Automatic copy failed. Please select and copy manually: ${text}`,
      {
        duration: 10000,
        action: {
          label: 'Close',
          onClick: () => {}
        }
      }
    )
    return true
  } catch (fallbackError) {
    console.error('Final fallback failed:', fallbackError)
  }

  // Method 4: Show text in toast (absolute fallback)
  toast.error(`Copy failed. ${displayLabel}: ${text}`, {
    duration: 10000, // Show longer for manual copy
    action: {
      label: 'Dismiss',
      onClick: () => {}
    }
  })
  
  return false
}

/**
 * Check if clipboard operations are likely to work
 */
export function isClipboardSupported(): boolean {
  return !!(
    (window.isSecureContext && navigator.clipboard && navigator.clipboard.writeText) ||
    document.queryCommandSupported?.('copy')
  )
}

/**
 * Get clipboard support status with details
 */
export function getClipboardStatus(): {
  supported: boolean
  method: 'modern' | 'legacy' | 'none'
  secureContext: boolean
} {
  const secureContext = window.isSecureContext
  
  if (secureContext && navigator.clipboard && navigator.clipboard.writeText) {
    return {
      supported: true,
      method: 'modern',
      secureContext
    }
  }
  
  if (document.queryCommandSupported?.('copy')) {
    return {
      supported: true,
      method: 'legacy',
      secureContext
    }
  }
  
  return {
    supported: false,
    method: 'none',
    secureContext
  }
}