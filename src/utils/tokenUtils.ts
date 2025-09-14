/**
 * Utility functions for token management and comparison
 */

/**
 * Compare two tokens to determine if they are functionally equivalent
 * This helps prevent unnecessary data reloads when token is refreshed
 */
export function isTokenEquivalent(token1: string | null, token2: string | null): boolean {
  // Both null/undefined
  if (!token1 && !token2) return true
  
  // One is null/undefined, other is not
  if (!token1 || !token2) return false
  
  // Same token
  if (token1 === token2) return true
  
  // For JWT tokens, we can compare the payload (middle part) to see if it's the same user/session
  // This helps when token is refreshed but represents the same session
  try {
    const payload1 = getJWTPayload(token1)
    const payload2 = getJWTPayload(token2)
    
    // Compare user ID and session ID if available
    if (payload1?.sub && payload2?.sub && payload1.sub === payload2.sub) {
      // Same user, likely just a refresh
      return true
    }
  } catch (error) {
    // If JWT parsing fails, fall back to exact comparison
    console.warn('JWT comparison failed, using exact match:', error)
  }
  
  return false
}

/**
 * Extract payload from JWT token
 */
function getJWTPayload(token: string): any {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format')
    }
    
    const payload = parts[1]
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decoded)
  } catch (error) {
    console.warn('Failed to decode JWT payload:', error)
    return null
  }
}

/**
 * Hook to track token changes and prevent unnecessary effects
 */
export function useTokenComparison(currentToken: string | null, newToken: string | null) {
  return {
    hasChanged: !isTokenEquivalent(currentToken, newToken),
    isEquivalent: isTokenEquivalent(currentToken, newToken)
  }
}
