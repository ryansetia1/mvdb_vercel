import { useEffect, useRef } from 'react'
import { isTokenEquivalent } from '../utils/tokenUtils'

/**
 * Custom hook that prevents unnecessary effects when token is refreshed
 * but functionally equivalent (same user/session)
 */
export function useTokenAwareEffect(
  effect: () => void | (() => void),
  dependencies: any[],
  accessToken: string | null
) {
  const previousTokenRef = useRef<string | null>(null)
  const previousDepsRef = useRef<any[]>([])

  useEffect(() => {
    // Check if this is a token refresh scenario
    const isTokenRefresh = dependencies.includes(accessToken) && 
                          isTokenEquivalent(previousTokenRef.current, accessToken)
    
    // Check if other dependencies changed
    const otherDepsChanged = dependencies.some((dep, index) => {
      return dep !== previousDepsRef.current[index] && dep !== accessToken
    })
    
    // Only run effect if:
    // 1. Token actually changed (not just refreshed)
    // 2. Other dependencies changed
    // 3. This is the first run
    if (!isTokenRefresh || otherDepsChanged || previousTokenRef.current === null) {
      console.log('Running token-aware effect:', {
        isTokenRefresh,
        otherDepsChanged,
        isFirstRun: previousTokenRef.current === null,
        tokenChanged: !isTokenEquivalent(previousTokenRef.current, accessToken)
      })
      
      const cleanup = effect()
      
      // Update refs
      previousTokenRef.current = accessToken
      previousDepsRef.current = [...dependencies]
      
      return cleanup
    } else {
      console.log('Skipping token-aware effect due to token refresh:', {
        previousToken: previousTokenRef.current?.substring(0, 20) + '...',
        currentToken: accessToken?.substring(0, 20) + '...'
      })
      
      // Still update refs even if we skip the effect
      previousTokenRef.current = accessToken
      previousDepsRef.current = [...dependencies]
    }
  }, dependencies)
}

/**
 * Simplified version for common use case of loading data with accessToken
 */
export function useTokenAwareDataLoad(
  loadFunction: () => void | Promise<void>,
  accessToken: string | null,
  additionalDeps: any[] = []
) {
  useTokenAwareEffect(
    () => {
      if (accessToken) {
        loadFunction()
      }
    },
    [accessToken, ...additionalDeps],
    accessToken
  )
}
