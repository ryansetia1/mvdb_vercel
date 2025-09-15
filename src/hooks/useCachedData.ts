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
  directors: CachedData<MasterDataItem>
  studios: CachedData<MasterDataItem>
  series: CachedData<MasterDataItem>
  labels: CachedData<MasterDataItem>
  groups: CachedData<MasterDataItem>
}

const CACHE_DURATION = 30 * 60 * 1000 // 30 minutes - extended untuk mengurangi API calls
const STORAGE_KEY = 'mvdb_cached_data'

// Helper function to detect project change
function getCurrentProjectId(): string {
  // Try to get from environment variable first
  const envProjectId = (import.meta as any).env?.VITE_SUPABASE_PROJECT_ID
  if (envProjectId) return envProjectId
  
  // Fallback to hardcoded project ID
  return "duafhkktqobwwwwtygwn"
}

// Helper function to check if project has changed
function hasProjectChanged(): boolean {
  const currentProjectId = getCurrentProjectId()
  const storedProjectId = localStorage.getItem('mvdb_current_project_id')
  
  if (!storedProjectId) {
    localStorage.setItem('mvdb_current_project_id', currentProjectId)
    return false
  }
  
  if (storedProjectId !== currentProjectId) {
    console.log(`Project changed from ${storedProjectId} to ${currentProjectId}`)
    localStorage.setItem('mvdb_current_project_id', currentProjectId)
    return true
  }
  
  return false
}

// Helper functions for localStorage with compression
function saveToLocalStorage(cache: CacheState): void {
  try {
    // Compress data by removing unnecessary fields to reduce size
    const compressedCache = {
      movies: {
        ...cache.movies,
        data: cache.movies.data.map(movie => ({
          id: movie.id,
          title: movie.title,
          dmcode: movie.dmcode,
          coverUrl: movie.coverUrl,
          releaseDate: movie.releaseDate,
          type: movie.type,
          studio: movie.studio,
          series: movie.series,
          actress: movie.actress,
          actors: movie.actors,
          director: movie.director,
          tags: movie.tags,
          duration: movie.duration
          // Remove large fields like gallery, links, etc. to save space
        }))
      },
      photobooks: {
        ...cache.photobooks,
        data: cache.photobooks.data.map(photobook => ({
          id: photobook.id,
          title: photobook.title,
          actress: photobook.actress,
          coverUrl: photobook.coverUrl,
          releaseDate: photobook.releaseDate
          // Remove gallery data to save space
        }))
      },
      actors: {
        ...cache.actors,
        data: cache.actors.data.map(actor => ({
          id: actor.id,
          name: actor.name,
          jpname: actor.jpname,
          profilePicture: actor.profilePicture,
          birthdate: actor.birthdate,
          type: actor.type,
          selectedGroups: actor.selectedGroups // Keep selectedGroups for group functionality
          // Remove large fields like photos, etc. but keep selectedGroups
        }))
      },
      actresses: {
        ...cache.actresses,
        data: cache.actresses.data.map(actress => ({
          id: actress.id,
          name: actress.name,
          jpname: actress.jpname,
          profilePicture: actress.profilePicture,
          birthdate: actress.birthdate,
          type: actress.type,
          selectedGroups: actress.selectedGroups, // Keep selectedGroups for group functionality
          groupId: actress.groupId, // Keep legacy groupId
          groupName: actress.groupName, // Keep groupName
          groupData: actress.groupData, // Keep groupData for group-specific info
          generationData: actress.generationData, // Keep generationData for generation functionality
          lineupData: actress.lineupData // Keep lineupData for lineup functionality
          // Remove large fields like photos, etc. but keep all group-related fields
        }))
      }
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(compressedCache))
    console.log('Cache saved to localStorage (FRESH DATA)')
    console.log('Actresses count saved:', compressedCache.actresses.data?.length || 0)
    console.log('Sample actress selectedGroups saved:', compressedCache.actresses.data?.[0]?.selectedGroups)
    console.log('Sample actress groupId saved:', compressedCache.actresses.data?.[0]?.groupId)
    console.log('Sample actress groupName saved:', compressedCache.actresses.data?.[0]?.groupName)
  } catch (error) {
    console.warn('Failed to save cache to localStorage:', error)
  }
}

function loadFromLocalStorage(): CacheState | null {
  try {
    // Check if project has changed - if so, clear cache
    if (hasProjectChanged()) {
      console.log('Project changed detected, clearing cache')
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Validate the structure
      if (parsed.movies && parsed.photobooks && parsed.actors && parsed.actresses) {
        console.log('Cache loaded from localStorage')
        console.log('Actresses count:', parsed.actresses.data?.length || 0)
        console.log('Sample actress selectedGroups:', parsed.actresses.data?.[0]?.selectedGroups)
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
        },
        directors: {
          ...(storedCache.directors || { data: [], timestamp: 0 }),
          loading: false,
          data: storedCache.directors && (now - storedCache.directors.timestamp) < CACHE_DURATION ? storedCache.directors.data : []
        },
        studios: {
          ...(storedCache.studios || { data: [], timestamp: 0 }),
          loading: false,
          data: storedCache.studios && (now - storedCache.studios.timestamp) < CACHE_DURATION ? storedCache.studios.data : []
        },
        series: {
          ...(storedCache.series || { data: [], timestamp: 0 }),
          loading: false,
          data: storedCache.series && (now - storedCache.series.timestamp) < CACHE_DURATION ? storedCache.series.data : []
        },
        labels: {
          ...(storedCache.labels || { data: [], timestamp: 0 }),
          loading: false,
          data: storedCache.labels && (now - storedCache.labels.timestamp) < CACHE_DURATION ? storedCache.labels.data : []
        },
        groups: {
          ...(storedCache.groups || { data: [], timestamp: 0 }),
          loading: false,
          data: storedCache.groups && (now - storedCache.groups.timestamp) < CACHE_DURATION ? storedCache.groups.data : []
        }
      }
      return freshCache
    }
    
    // Default empty cache
    return {
      movies: { data: [], timestamp: 0, loading: false },
      photobooks: { data: [], timestamp: 0, loading: false },
      actors: { data: [], timestamp: 0, loading: false },
      actresses: { data: [], timestamp: 0, loading: false },
      directors: { data: [], timestamp: 0, loading: false },
      studios: { data: [], timestamp: 0, loading: false },
      series: { data: [], timestamp: 0, loading: false },
      labels: { data: [], timestamp: 0, loading: false },
      groups: { data: [], timestamp: 0, loading: false }
    }
  })

  const loadingPromises = useRef<{ [key: string]: Promise<any> }>({})

  const isDataFresh = useCallback((type: keyof CacheState): boolean => {
    const cached = cache[type]
    return cached && cached.data.length > 0 && (Date.now() - cached.timestamp) < CACHE_DURATION
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
      return (cache[type]?.data || []) as T[]
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
        return (cache[type]?.data || []) as T[]
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