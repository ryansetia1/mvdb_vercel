import { useState, useEffect, useCallback } from 'react'

interface GalleryCacheItem {
  dmcode: string
  galleryTemplate: string
  validUrls: string[]
  cachedAt: number
  expiresAt: number
}

interface UseGalleryCacheOptions {
  dmcode: string
  galleryTemplate: string
  accessToken?: string
  cacheExpiryHours?: number
}

interface UseGalleryCacheReturn {
  cachedUrls: string[] | null
  isLoading: boolean
  isCached: boolean
  cacheValid: boolean
  saveToCache: (validUrls: string[]) => void
  clearCache: () => void
  refreshCache: () => void
}

const CACHE_KEY_PREFIX = 'gallery_cache_'
const DEFAULT_CACHE_EXPIRY_HOURS = 24

export function useGalleryCache({
  dmcode,
  galleryTemplate,
  accessToken,
  cacheExpiryHours = DEFAULT_CACHE_EXPIRY_HOURS
}: UseGalleryCacheOptions): UseGalleryCacheReturn {
  const [cachedUrls, setCachedUrls] = useState<string[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCached, setIsCached] = useState(false)
  const [cacheValid, setCacheValid] = useState(false)

  // Generate cache key based on dmcode and template
  const cacheKey = `${CACHE_KEY_PREFIX}${dmcode}_${btoa(galleryTemplate)}`

  // Load cache on mount
  useEffect(() => {
    const loadCache = () => {
      if (!dmcode || !galleryTemplate) {
        setIsLoading(false)
        return
      }

      try {
        const cachedData = localStorage.getItem(cacheKey)
        
        if (cachedData) {
          const parsed: GalleryCacheItem = JSON.parse(cachedData)
          const now = Date.now()
          
          // Check if cache is still valid
          if (now < parsed.expiresAt) {
            setCachedUrls(parsed.validUrls)
            setIsCached(true)
            setCacheValid(true)
            console.log(`🎯 Gallery cache hit for ${dmcode}: ${parsed.validUrls.length} images`)
          } else {
            // Cache expired, remove it
            localStorage.removeItem(cacheKey)
            setIsCached(false)
            setCacheValid(false)
            console.log(`⏰ Gallery cache expired for ${dmcode}`)
          }
        } else {
          setIsCached(false)
          setCacheValid(false)
          console.log(`❌ No gallery cache found for ${dmcode}`)
        }
      } catch (error) {
        console.error('Error loading gallery cache:', error)
        setIsCached(false)
        setCacheValid(false)
      } finally {
        setIsLoading(false)
      }
    }

    loadCache()
  }, [dmcode, galleryTemplate, cacheKey])

  // Save to cache
  const saveToCache = useCallback((validUrls: string[]) => {
    if (!dmcode || !galleryTemplate || validUrls.length === 0) return

    try {
      const now = Date.now()
      const expiresAt = now + (cacheExpiryHours * 60 * 60 * 1000) // Convert hours to milliseconds
      
      const cacheItem: GalleryCacheItem = {
        dmcode,
        galleryTemplate,
        validUrls,
        cachedAt: now,
        expiresAt
      }

      localStorage.setItem(cacheKey, JSON.stringify(cacheItem))
      setCachedUrls(validUrls)
      setIsCached(true)
      setCacheValid(true)
      
      console.log(`💾 Gallery cache saved for ${dmcode}: ${validUrls.length} images (expires in ${cacheExpiryHours}h)`)
    } catch (error) {
      console.error('Error saving gallery cache:', error)
    }
  }, [dmcode, galleryTemplate, cacheKey, cacheExpiryHours])

  // Clear cache
  const clearCache = useCallback(() => {
    try {
      localStorage.removeItem(cacheKey)
      setCachedUrls(null)
      setIsCached(false)
      setCacheValid(false)
      console.log(`🗑️ Gallery cache cleared for ${dmcode}`)
    } catch (error) {
      console.error('Error clearing gallery cache:', error)
    }
  }, [cacheKey, dmcode])

  // Refresh cache (clear and reload)
  const refreshCache = useCallback(() => {
    clearCache()
    setIsLoading(true)
    // The useEffect will handle reloading
  }, [clearCache])

  return {
    cachedUrls,
    isLoading,
    isCached,
    cacheValid,
    saveToCache,
    clearCache,
    refreshCache
  }
}

// Utility function to get cache age in minutes
export function getCacheAgeMinutes(cachedAt: number): number {
  return Math.floor((Date.now() - cachedAt) / (1000 * 60))
}

// Utility function to check if cache is expired
export function isCacheExpired(expiresAt: number): boolean {
  return Date.now() >= expiresAt
}

// Utility function to get all cached galleries
export function getAllCachedGalleries(): GalleryCacheItem[] {
  const cached: GalleryCacheItem[] = []
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(CACHE_KEY_PREFIX)) {
        const data = localStorage.getItem(key)
        if (data) {
          const parsed: GalleryCacheItem = JSON.parse(data)
          if (!isCacheExpired(parsed.expiresAt)) {
            cached.push(parsed)
          }
        }
      }
    }
  } catch (error) {
    console.error('Error getting cached galleries:', error)
  }
  
  return cached
}

// Utility function to clear all expired caches
export function clearExpiredCaches(): number {
  let clearedCount = 0
  
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i)
      if (key?.startsWith(CACHE_KEY_PREFIX)) {
        const data = localStorage.getItem(key)
        if (data) {
          const parsed: GalleryCacheItem = JSON.parse(data)
          if (isCacheExpired(parsed.expiresAt)) {
            localStorage.removeItem(key)
            clearedCount++
          }
        }
      }
    }
  } catch (error) {
    console.error('Error clearing expired caches:', error)
  }
  
  console.log(`🧹 Cleared ${clearedCount} expired gallery caches`)
  return clearedCount
}
