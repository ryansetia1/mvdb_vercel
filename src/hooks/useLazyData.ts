import { useState, useEffect, useCallback } from 'react'
import { useCachedData } from './useCachedData'

interface LazyDataOptions {
  pageSize?: number
  preloadPages?: number
  cacheKey: string
  loader: () => Promise<any[]>
}

export function useLazyData<T>(
  accessToken: string,
  options: LazyDataOptions
) {
  const { pageSize = 50, preloadPages = 2, cacheKey, loader } = options
  const { loadData: loadCachedData } = useCachedData()
  
  const [allData, setAllData] = useState<T[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true)
      try {
        const data = await loadCachedData(cacheKey, loader) as T[]
        setAllData(data)
        setHasMore(data.length > pageSize)
      } catch (error) {
        console.error(`Failed to load ${cacheKey}:`, error)
      } finally {
        setIsLoading(false)
      }
    }

    loadInitialData()
  }, [accessToken, cacheKey, loader, loadCachedData, pageSize])

  // Get current page data
  const getCurrentPageData = useCallback(() => {
    const startIndex = currentPage * pageSize
    const endIndex = startIndex + pageSize
    return allData.slice(0, endIndex)
  }, [allData, currentPage, pageSize])

  // Load more data
  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      setCurrentPage(prev => {
        const newPage = prev + 1
        const newEndIndex = (newPage + 1) * pageSize
        setHasMore(newEndIndex < allData.length)
        return newPage
      })
    }
  }, [isLoading, hasMore, allData.length, pageSize])

  // Reset pagination
  const reset = useCallback(() => {
    setCurrentPage(0)
    setHasMore(allData.length > pageSize)
  }, [allData.length, pageSize])

  return {
    data: getCurrentPageData(),
    isLoading,
    hasMore,
    loadMore,
    reset,
    totalCount: allData.length,
    currentPage
  }
}
