import { useState, useCallback, useRef } from 'react'
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

export function useCachedData() {
  const [cache, setCache] = useState<CacheState>({
    movies: { data: [], timestamp: 0, loading: false },
    photobooks: { data: [], timestamp: 0, loading: false },
    actors: { data: [], timestamp: 0, loading: false },
    actresses: { data: [], timestamp: 0, loading: false }
  })

  const loadingPromises = useRef<{ [key: string]: Promise<any> }>({})

  const isDataFresh = useCallback((type: keyof CacheState): boolean => {
    const cached = cache[type]
    return cached.data.length > 0 && (Date.now() - cached.timestamp) < CACHE_DURATION
  }, [cache])

  const setData = useCallback(<T>(type: keyof CacheState, data: T[]) => {
    setCache(prev => ({
      ...prev,
      [type]: {
        data,
        timestamp: Date.now(),
        loading: false
      }
    }))
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
      setCache(prev => ({
        ...prev,
        [type]: { data: [], timestamp: 0, loading: false }
      }))
    } else {
      setCache({
        movies: { data: [], timestamp: 0, loading: false },
        photobooks: { data: [], timestamp: 0, loading: false },
        actors: { data: [], timestamp: 0, loading: false },
        actresses: { data: [], timestamp: 0, loading: false }
      })
    }
  }, [])

  return {
    cache,
    loadData,
    invalidateCache,
    isDataFresh,
    setData
  }
}