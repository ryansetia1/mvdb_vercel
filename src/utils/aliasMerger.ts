/**
 * Utility functions for merging alias data
 */

/**
 * Merge new alias with existing alias content
 * @param existingAlias - Current alias content (comma-separated)
 * @param newAlias - New alias to be added
 * @returns Merged alias string
 */
export function mergeAlias(existingAlias: string | undefined | null, newAlias: string | undefined | null): string {
  // Handle null/undefined cases
  if (!existingAlias && !newAlias) return ''
  if (!existingAlias) return newAlias || ''
  if (!newAlias) return existingAlias

  // Parse existing aliases
  const existingAliases = existingAlias
    .split(',')
    .map(alias => alias.trim())
    .filter(alias => alias.length > 0)

  // Parse new aliases
  const newAliases = newAlias
    .split(',')
    .map(alias => alias.trim())
    .filter(alias => alias.length > 0)

  // Combine and remove duplicates (case-insensitive)
  const allAliases = [...existingAliases, ...newAliases]
  const uniqueAliases = allAliases.filter((alias, index, array) => 
    array.findIndex(a => a.toLowerCase() === alias.toLowerCase()) === index
  )

  return uniqueAliases.join(', ')
}

/**
 * Check if alias already exists in the existing alias string
 * @param existingAlias - Current alias content (comma-separated)
 * @param aliasToCheck - Alias to check for existence
 * @returns true if alias already exists
 */
export function aliasExists(existingAlias: string | undefined | null, aliasToCheck: string): boolean {
  if (!existingAlias) return false
  
  const existingAliases = existingAlias
    .split(',')
    .map(alias => alias.trim())
    .filter(alias => alias.length > 0)

  return existingAliases.some(alias => 
    alias.toLowerCase() === aliasToCheck.toLowerCase()
  )
}

/**
 * Remove specific alias from existing alias string
 * @param existingAlias - Current alias content (comma-separated)
 * @param aliasToRemove - Alias to remove
 * @returns Updated alias string without the removed alias
 */
export function removeAlias(existingAlias: string | undefined | null, aliasToRemove: string): string {
  if (!existingAlias) return ''
  
  const existingAliases = existingAlias
    .split(',')
    .map(alias => alias.trim())
    .filter(alias => alias.length > 0)

  const filteredAliases = existingAliases.filter(alias => 
    alias.toLowerCase() !== aliasToRemove.toLowerCase()
  )

  return filteredAliases.join(', ')
}
