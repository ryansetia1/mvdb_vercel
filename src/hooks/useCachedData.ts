import { useState, useCallback, useRef, useEffect } from 'react'
import { Movie } from '../utils/movieApi'
import { Photobook } from '../utils/photobookApi'
import { MasterDataItem } from '../utils/masterDataApi'

interface CachedData<T> {
  data: T[]
  timestamp: number
  loading: boolean
}

interface CacheState {
  movies: CachedData<Movie>
  photobooks: CachedData<Photobook>
  actors: CachedData<MasterDataItem>
  actresses: CachedData<MasterDataItem>
}

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
const STORAGE_KEY = 'mvdb_cached_data'

// Helper functions for localStorage
function saveToLocalStorage(cache: CacheState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache))
  } catch (error) {
    console.warn('Failed to save cache to localStorage:', error)
  }
}

function loadFromLocalStorage(): CacheState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Validate the structure
      if (parsed.movies && parsed.photobooks && parsed.actors && parsed.actresses) {
        return parsed
      }
    }
  } catch (error) {
    console.warn('Failed to load cache from localStorage:', error)
  }
  return null
}

export function useCachedData() {
  const [cache, setCache] = useState<CacheState>(() => {
    // Initialize with localStorage data if available
    const storedCache = loadFromLocalStorage()
    if (storedCache) {
      // Check if data is still fresh
      const now = Date.now()
      const freshCache: CacheState = {
        movies: {
          ...storedCache.movies,
          loading: false,
          data: (now - storedCache.movies.timestamp) < CACHE_DURATION ? storedCache.movies.data : []
        },
        photobooks: {
          ...storedCache.photobooks,
          loading: false,
          data: (now - storedCache.photobooks.timestamp) < CACHE_DURATION ? storedCache.photobooks.data : []
        },
        actors: {
          ...storedCache.actors,
          loading: false,
          data: (now - storedCache.actors.timestamp) < CACHE_DURATION ? storedCache.actors.data : []
        },
        actresses: {
          ...storedCache.actresses,
          loading: false,
          data: (now - storedCache.actresses.timestamp) < CACHE_DURATION ? storedCache.actresses.data : []
        }
      }
      return freshCache
    }
    
    // Default empty cache
    return {
      movies: { data: [], timestamp: 0, loading: false },
      photobooks: { data: [], timestamp: 0, loading: false },
      actors: { data: [], timestamp: 0, loading: false },
      actresses: { data: [], timestamp: 0, loading: false }
    }
  })

  const loadingPromises = useRef<{ [key: string]: Promise<any> }>({})

  const isDataFresh = useCallback((type: keyof CacheState): boolean => {
    const cached = cache[type]
    return cached.data.length > 0 && (Date.now() - cached.timestamp) < CACHE_DURATION
  }, [cache])

  const setData = useCallback(<T>(type: keyof CacheState, data: T[]) => {
    setCache(prev => {
      const newCache = {
        ...prev,
        [type]: {
          data,
          timestamp: Date.now(),
          loading: false
        }
      }
      // Save to localStorage whenever data is updated
      saveToLocalStorage(newCache)
      return newCache
    })
  }, [])

  const setLoading = useCallback((type: keyof CacheState, loading: boolean) => {
    setCache(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        loading
      }
    }))
  }, [])

  const loadData = useCallback(async <T>(
    type: keyof CacheState,
    loader: () => Promise<T[]>,
    force = false
  ): Promise<T[]> => {
    // Return cached data if fresh and not forcing reload
    if (!force && isDataFresh(type)) {
      return cache[type].data as T[]
    }

    // Return existing promise if already loading
    const promiseKey = `${type}-load`
    if (loadingPromises.current[promiseKey]) {
      return loadingPromises.current[promiseKey]
    }

    // Start loading
    setLoading(type, true)
    
    const loadPromise = loader()
      .then((data) => {
        setData(type, data)
        return data as T[]
      })
      .catch((error) => {
        console.error(`Failed to load ${type}:`, error)
        setLoading(type, false)
        // Return cached data if available, otherwise empty array
        return cache[type].data as T[]
      })
      .finally(() => {
        delete loadingPromises.current[promiseKey]
      })

    loadingPromises.current[promiseKey] = loadPromise
    return loadPromise
  }, [cache, isDataFresh, setData, setLoading])

  const invalidateCache = useCallback((type?: keyof CacheState) => {
    if (type) {
      setCache(prev => {
        const newCache = {
          ...prev,
          [type]: { data: [], timestamp: 0, loading: false }
        }
        saveToLocalStorage(newCache)
        return newCache
      })
    } else {
      const emptyCache = {
        movies: { data: [], timestamp: 0, loading: false },
        photobooks: { data: [], timestamp: 0, loading: false },
        actors: { data: [], timestamp: 0, loading: false },
        actresses: { data: [], timestamp: 0, loading: false }
      }
      setCache(emptyCache)
      saveToLocalStorage(emptyCache)
    }
  }, [])

  // Add effect to save cache to localStorage whenever it changes
  useEffect(() => {
    saveToLocalStorage(cache)
  }, [cache])

  return {
    cache,
    loadData,
    invalidateCache,
    isDataFresh,
    setData
  }
}