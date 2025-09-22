import { useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export interface ContentState {
  mode: string
  title?: string
  data?: any
  moviesFilters?: {
    tagFilter: string
    studioFilter: string
    seriesFilter: string
    typeFilter: string
    sortBy: string
    currentPage: number
    itemsPerPage: number
  }
}

interface UseBrowserHistoryProps {
  contentState: ContentState
  setContentState: (state: ContentState) => void
  navigationHistory: ContentState[]
  setNavigationHistory: (history: ContentState[] | ((prev: ContentState[]) => ContentState[])) => void
  setActiveNavItem?: (item: string) => void
  setMoviesFilters?: (filters: any) => void
  moviesFilters?: any
  navItems?: any[]
  customNavItems?: any[]
}

export function useBrowserHistory({
  contentState,
  setContentState,
  navigationHistory,
  setNavigationHistory,
  setActiveNavItem,
  setMoviesFilters,
  moviesFilters,
  navItems = [],
  customNavItems = []
}: UseBrowserHistoryProps) {
  const navigate = useNavigate()
  const location = useLocation()

  // Sync URL dengan contentState
  useEffect(() => {
    const urlPath = getPathFromContentState(contentState)
    if (location.pathname !== urlPath) {
      navigate(urlPath, { replace: true })
    }
  }, [contentState, navigate, location.pathname])

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const stateFromUrl = getContentStateFromPath(location.pathname, location.search)
      if (stateFromUrl) {
        setContentState(stateFromUrl)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [location.pathname, location.search, setContentState])

  // Enhanced handleBack yang mengintegrasikan browser history
  const handleBack = useCallback(() => {
    if (navigationHistory.length > 0) {
      // Use custom navigation history
      const previousState = navigationHistory[navigationHistory.length - 1]
      setNavigationHistory(prev => prev.slice(0, -1))
      setContentState(previousState)
      
      // Update active nav item based on the restored state
      if (previousState.mode === 'filteredMovies' || previousState.mode === 'filteredActresses') {
        // For filtered content, keep the current active nav item
        // since the filter could come from any main section
      } else if (previousState.mode === 'customNavFiltered') {
        // Find the custom nav item that matches this state
        const customNav = customNavItems.find((item: any) => 
          item.filterType === previousState.data?.filterType && 
          item.filterValue === previousState.data?.filterValue
        )
        if (customNav && setActiveNavItem) {
          setActiveNavItem(customNav.id)
        }
      } else if (previousState.mode === 'custom') {
        // Find the custom nav item that matches this state
        const customNav = customNavItems.find((item: any) => 
          item.filterType === previousState.data?.filterType && 
          item.filterValue === previousState.data?.filterValue
        )
        if (customNav && setActiveNavItem) {
          setActiveNavItem(customNav.id)
        }
      } else {
        // For regular modes, find the corresponding nav item
        const navItem = navItems.find((item: any) => item.type === previousState.mode)
        if (navItem && setActiveNavItem) {
          setActiveNavItem(navItem.id)
        }
      }
      
      // Special handling for movies mode - restore pagination position
      if (previousState.mode === 'movies' && setMoviesFilters) {
        // Restore the moviesFilters state if it was saved in navigation history
        if (previousState.moviesFilters) {
          setMoviesFilters(previousState.moviesFilters)
          console.log('Restored movies filters with pagination position:', previousState.moviesFilters.currentPage)
        } else {
          console.log('No movies filters found in history, using current state:', moviesFilters?.currentPage)
        }
      }
    } else {
      // Fallback to browser back
      window.history.back()
    }
  }, [navigationHistory, setNavigationHistory, setContentState, setActiveNavItem, setMoviesFilters, moviesFilters, navItems, customNavItems])

  return {
    handleBack
  }
}

// Helper functions untuk konversi antara URL dan ContentState
function getPathFromContentState(state: ContentState): string {
  switch (state.mode) {
    case 'movies':
      return '/movies'
    case 'actors':
      return '/actors'
    case 'actresses':
      return '/actresses'
    case 'series':
      return '/series'
    case 'studios':
      return '/studios'
    case 'tags':
      return '/tags'
    case 'photobooks':
      return '/photobooks'
    case 'groups':
      return '/groups'
    case 'favorites':
      return '/favorites'
    case 'soft':
      return '/soft'
    case 'admin':
      return '/admin'
    case 'movieDetail':
      // Use code if available, otherwise use ID, otherwise use 'unknown'
      const movieIdentifier = state.data?.code || state.data?.id || 'unknown'
      return `/movie/${movieIdentifier}`
    case 'scMovieDetail':
      // Use code if available, otherwise use ID, otherwise use 'unknown'
      const scMovieIdentifier = state.data?.code || state.data?.id || 'unknown'
      return `/soft-movie/${scMovieIdentifier}`
    case 'profileDetail':
      return `/profile/${state.data?.type || 'unknown'}/${encodeURIComponent(state.data?.name || 'unknown')}`
    case 'profile':
      return `/profile/${state.data?.type || 'unknown'}/${encodeURIComponent(state.data?.name || 'unknown')}`
    case 'photobookDetail':
      const photobookIdentifier = state.data?.id || 'unknown'
      return `/photobook/${photobookIdentifier}`
    case 'groupDetail':
      const groupIdentifier = state.data?.id || 'unknown'
      return `/group/${groupIdentifier}`
    case 'filteredMovies':
      return `/movies?filter=${state.data?.filterType || ''}&value=${encodeURIComponent(state.data?.filterValue || '')}`
    case 'filteredActresses':
      return `/actresses?filter=${state.data?.filterType || ''}&value=${encodeURIComponent(state.data?.filterValue || '')}`
    case 'customNavFiltered':
      return `/custom/${state.data?.navItemId || 'unknown'}`
    default:
      return '/movies'
  }
}

function getContentStateFromPath(pathname: string, search: string): ContentState | null {
  const urlParams = new URLSearchParams(search)
  
  if (pathname.startsWith('/movie/')) {
    const movieIdentifier = pathname.split('/movie/')[1]
    return {
      mode: 'movieDetail',
      title: 'Movie Detail',
      data: { code: movieIdentifier }
    }
  }
  
  if (pathname.startsWith('/soft-movie/')) {
    const scMovieIdentifier = pathname.split('/soft-movie/')[1]
    return {
      mode: 'scMovieDetail',
      title: 'Soft Movie Detail',
      data: { code: scMovieIdentifier }
    }
  }
  
  if (pathname.startsWith('/photobook/')) {
    const photobookIdentifier = pathname.split('/photobook/')[1]
    return {
      mode: 'photobookDetail',
      title: 'Photobook Detail',
      data: { id: photobookIdentifier }
    }
  }
  
  if (pathname.startsWith('/group/')) {
    const groupIdentifier = pathname.split('/group/')[1]
    return {
      mode: 'groupDetail',
      title: 'Group Detail',
      data: { id: groupIdentifier }
    }
  }
  
  if (pathname.startsWith('/profile/')) {
    const parts = pathname.split('/profile/')[1].split('/')
    const type = parts[0]
    const name = decodeURIComponent(parts[1] || '')
    return {
      mode: 'profile',
      title: `${type} Profile`,
      data: { type, name }
    }
  }
  
  if (pathname.startsWith('/custom/')) {
    const navItemId = pathname.split('/custom/')[1]
    return {
      mode: 'customNavFiltered',
      title: 'Custom Navigation',
      data: { navItemId }
    }
  }
  
  if (pathname === '/movies') {
    const filter = urlParams.get('filter')
    const value = urlParams.get('value')
    if (filter && value) {
      return {
        mode: 'filteredMovies',
        title: 'Filtered Movies',
        data: { filterType: filter, filterValue: decodeURIComponent(value) }
      }
    }
    return { mode: 'movies', title: 'Movies' }
  }
  
  if (pathname === '/actresses') {
    const filter = urlParams.get('filter')
    const value = urlParams.get('value')
    if (filter && value) {
      return {
        mode: 'filteredActresses',
        title: 'Filtered Actresses',
        data: { filterType: filter, filterValue: decodeURIComponent(value) }
      }
    }
    return { mode: 'actresses', title: 'Actresses' }
  }
  
  const modeMap: Record<string, string> = {
    '/actors': 'actors',
    '/series': 'series',
    '/studios': 'studios',
    '/tags': 'tags',
    '/photobooks': 'photobooks',
    '/groups': 'groups',
    '/favorites': 'favorites',
    '/soft': 'soft',
    '/admin': 'admin'
  }
  
  const mode = modeMap[pathname]
  if (mode) {
    return { mode, title: mode.charAt(0).toUpperCase() + mode.slice(1) }
  }
  
  return null
}
