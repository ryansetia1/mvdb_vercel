import { useTypeColors } from '../contexts/TypeColorsContext'

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
      color: '#ffffff', // White text untuk kontras
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
