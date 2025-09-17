import { useTypeColors } from '../contexts/TypeColorsContext'

/**
 * Calculate contrast text color based on background color
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
 * Hook untuk mendapatkan type color classes dan styles dari context
 * Menggantikan fungsi getTypeColorClasses dan getTypeColorStyles yang lama
 */
export function useTypeColorStyles(type: string | undefined) {
  const { colors } = useTypeColors()
  
  if (!type) {
    return { classes: '', styles: {} }
  }
  
  const color = colors[type.toLowerCase()]
  
  if (!color) {
    return { classes: '', styles: {} }
  }
  
  // Return Tailwind classes dan inline styles
  return {
    classes: '', // Tidak menggunakan Tailwind classes untuk custom colors
    styles: {
      backgroundColor: color,
      color: getContrastTextColor(color), // Use proper contrast calculation
    }
  }
}

/**
 * Hook untuk mendapatkan type color classes saja (backward compatibility)
 */
export function useTypeColorClasses(type: string | undefined) {
  const { classes } = useTypeColorStyles(type)
  return classes
}
