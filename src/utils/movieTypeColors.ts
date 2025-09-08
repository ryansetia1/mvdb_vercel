/**
 * Movie Type Color Configuration
 * Simple and stable system for customizable movie type colors
 * Now supports both database persistence and localStorage fallback
 */

import { movieTypeColorsApi, MovieTypeColorConfig as ApiMovieTypeColorConfig } from './movieTypeColorsApi'

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
 * Get current type color configuration from database (with localStorage fallback)
 */
export async function getTypeColorsFromDatabase(accessToken?: string): Promise<MovieTypeColorConfig> {
  if (!accessToken) {
    console.log('No access token provided, falling back to localStorage')
    return getTypeColorsFromLocalStorage()
  }

  try {
    const colors = await movieTypeColorsApi.getColors(accessToken)
    // If database has colors, sync them to localStorage for offline access
    if (Object.keys(colors).length > 0) {
      saveTypeColorsToLocalStorage(colors)
    }
    return colors
  } catch (error) {
    console.warn('Failed to load type colors from database, falling back to localStorage:', error)
    return getTypeColorsFromLocalStorage()
  }
}

/**
 * Get current type color configuration from localStorage
 */
export function getTypeColorsFromLocalStorage(): MovieTypeColorConfig {
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
 * Get current type color configuration (backward compatibility)
 * Uses localStorage only
 */
export function getTypeColors(): MovieTypeColorConfig {
  return getTypeColorsFromLocalStorage()
}

/**
 * Save type color configuration to database (with localStorage backup)
 */
export async function saveTypeColorsToDatabase(colors: MovieTypeColorConfig, accessToken?: string): Promise<void> {
  // Always save to localStorage first for immediate access
  saveTypeColorsToLocalStorage(colors)
  
  if (!accessToken) {
    console.log('No access token provided, saved to localStorage only')
    return
  }

  try {
    await movieTypeColorsApi.saveColors(colors, accessToken)
    console.log('Type colors saved successfully to database')
  } catch (error) {
    console.warn('Failed to save type colors to database, but saved to localStorage:', error)
    // Don't throw error since localStorage save succeeded
  }
}

/**
 * Save type color configuration to localStorage
 */
export function saveTypeColorsToLocalStorage(colors: MovieTypeColorConfig): void {
  try {
    const serialized = JSON.stringify(colors)
    localStorage.setItem(STORAGE_KEY, serialized)
    console.log('Type colors saved successfully to localStorage:', colors)
    
    // Verify the save immediately
    const verified = localStorage.getItem(STORAGE_KEY)
    if (verified === serialized) {
      console.log('Type colors localStorage save verification successful')
    } else {
      console.error('Type colors localStorage save verification failed')
      throw new Error('Save verification failed')
    }
  } catch (error) {
    console.error('Failed to save type colors to localStorage:', error)
    throw error
  }
}

/**
 * Save type color configuration (backward compatibility)
 * Uses localStorage only
 */
export function saveTypeColors(colors: MovieTypeColorConfig): void {
  saveTypeColorsToLocalStorage(colors)
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
 * Reset to default colors in database (with localStorage backup)
 */
export async function resetTypeColorsToDatabase(accessToken?: string): Promise<void> {
  // Always reset localStorage first for immediate access
  resetTypeColorsToLocalStorage()
  
  if (!accessToken) {
    console.log('No access token provided, reset localStorage only')
    return
  }

  try {
    await movieTypeColorsApi.resetColors(DEFAULT_TYPE_COLORS, accessToken)
    console.log('Type colors reset successfully in database')
  } catch (error) {
    console.warn('Failed to reset type colors in database, but reset localStorage:', error)
    // Don't throw error since localStorage reset succeeded
  }
}

/**
 * Reset to default colors in localStorage
 */
export function resetTypeColorsToLocalStorage(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_TYPE_COLORS))
    console.log('Type colors reset successfully in localStorage')
  } catch (error) {
    console.warn('Failed to reset type colors in localStorage:', error)
  }
}

/**
 * Reset to default colors (backward compatibility)
 * Uses localStorage only
 */
export function resetTypeColors(): void {
  resetTypeColorsToLocalStorage()
}

/**
 * Sync type colors when master data type name changes (database + localStorage)
 */
export async function syncTypeColorsOnNameChangeToDatabase(oldTypeName: string, newTypeName: string, accessToken?: string): Promise<void> {
  try {
    const colors = await getTypeColorsFromDatabase(accessToken)
    const oldKey = oldTypeName.toLowerCase()
    const newKey = newTypeName.toLowerCase()
    
    // If old type has a color setting, move it to new type name
    if (colors[oldKey] && oldKey !== newKey) {
      colors[newKey] = colors[oldKey]
      delete colors[oldKey]
      
      await saveTypeColorsToDatabase(colors, accessToken)
      console.log(`Movie type color synced: "${oldTypeName}" -> "${newTypeName}"`)
    }
  } catch (error) {
    console.warn('Failed to sync type colors on name change:', error)
  }
}

/**
 * Sync type colors when master data type name changes (localStorage only - backward compatibility)
 */
export function syncTypeColorsOnNameChange(oldTypeName: string, newTypeName: string): void {
  try {
    const colors = getTypeColorsFromLocalStorage()
    const oldKey = oldTypeName.toLowerCase()
    const newKey = newTypeName.toLowerCase()
    
    // If old type has a color setting, move it to new type name
    if (colors[oldKey] && oldKey !== newKey) {
      colors[newKey] = colors[oldKey]
      delete colors[oldKey]
      
      saveTypeColorsToLocalStorage(colors)
      console.log(`Movie type color synced: "${oldTypeName}" -> "${newTypeName}"`)
    }
  } catch (error) {
    console.warn('Failed to sync type colors on name change:', error)
  }
}