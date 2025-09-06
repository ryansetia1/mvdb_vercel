/**
 * Movie Type Color Configuration
 * Simple and stable system for customizable movie type colors
 */

export interface MovieTypeColorConfig {
  [type: string]: string
}

// Default color configuration using hex values
export const DEFAULT_TYPE_COLORS: MovieTypeColorConfig = {
  'cen': '#f97316', // orange-500
  'un': '#3b82f6',  // blue-500
  'leaks': '#22c55e', // green-500
  '2vers': '#000000', // black - corrected to match master data
  'sem': '#6b7280'  // gray-500
}

const STORAGE_KEY = 'movieTypeColors'

/**
 * Get current type color configuration
 */
export function getTypeColors(): MovieTypeColorConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // If user has custom settings, use them exactly as saved
      // Don't merge with defaults to allow removal of default types
      return parsed
    }
  } catch (error) {
    console.warn('Failed to load type colors from localStorage:', error)
  }
  // Only return defaults if no custom settings exist
  return DEFAULT_TYPE_COLORS
}

/**
 * Save type color configuration
 */
export function saveTypeColors(colors: MovieTypeColorConfig): void {
  try {
    const serialized = JSON.stringify(colors)
    localStorage.setItem(STORAGE_KEY, serialized)
    console.log('Type colors saved successfully:', colors)
    
    // Verify the save immediately
    const verified = localStorage.getItem(STORAGE_KEY)
    if (verified === serialized) {
      console.log('Type colors save verification successful')
    } else {
      console.error('Type colors save verification failed')
      throw new Error('Save verification failed')
    }
  } catch (error) {
    console.error('Failed to save type colors to localStorage:', error)
    throw error
  }
}

/**
 * Check if a color value is hex format
 */
function isHexColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color)
}

/**
 * Get appropriate text color (white or black) based on background luminance
 */
function getContrastTextColor(hexColor: string): string {
  // Remove # if present
  const hex = hexColor.replace('#', '')
  
  // Convert to RGB
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  
  // Return white for dark colors, black for light colors
  return luminance > 0.5 ? '#000000' : '#ffffff'
}

/**
 * Get color styling for a specific movie type
 */
export function getTypeColorClasses(type: string | undefined): string {
  if (!type) return ''
  
  const colors = getTypeColors()
  const normalizedType = type.toLowerCase()
  const colorValue = colors[normalizedType] || '#6b7280' // default gray-500
  
  // If it's a hex color, return empty string (we'll use inline styles)
  if (isHexColor(colorValue)) {
    return ''
  }
  
  // Fallback to Tailwind classes for backward compatibility
  return colorValue
}

/**
 * Get inline styles for a specific movie type
 */
export function getTypeColorStyles(type: string | undefined): React.CSSProperties {
  if (!type) return {}
  
  const colors = getTypeColors()
  const normalizedType = type.toLowerCase()
  const colorValue = colors[normalizedType] || '#6b7280' // default gray-500
  
  // If it's a hex color, return inline styles
  if (isHexColor(colorValue)) {
    return {
      backgroundColor: colorValue,
      color: getContrastTextColor(colorValue)
    }
  }
  
  // Return empty styles for Tailwind classes
  return {}
}

/**
 * Initialize colors with defaults if not already set
 */
export function initializeTypeColors(): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      // First time setup - save defaults to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_TYPE_COLORS))
    }
  } catch (error) {
    console.warn('Failed to initialize type colors:', error)
  }
}

/**
 * Check if colors have been customized
 */
export function hasCustomTypeColors(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return !!stored
  } catch (error) {
    return false
  }
}

/**
 * Reset to default colors
 */
export function resetTypeColors(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_TYPE_COLORS))
  } catch (error) {
    console.warn('Failed to reset type colors:', error)
  }
}

/**
 * Sync type colors when master data type name changes
 */
export function syncTypeColorsOnNameChange(oldTypeName: string, newTypeName: string): void {
  try {
    const colors = getTypeColors()
    const oldKey = oldTypeName.toLowerCase()
    const newKey = newTypeName.toLowerCase()
    
    // If old type has a color setting, move it to new type name
    if (colors[oldKey] && oldKey !== newKey) {
      colors[newKey] = colors[oldKey]
      delete colors[oldKey]
      
      saveTypeColors(colors)
      console.log(`Movie type color synced: "${oldTypeName}" -> "${newTypeName}"`)
    }
  } catch (error) {
    console.warn('Failed to sync type colors on name change:', error)
  }
}