// Filter state manager for persistent filter storage
export interface FilterState {
  tagFilter: string
  studioFilter: string
  seriesFilter: string
  typeFilter: string
  sortBy: string
  currentPage: number
  itemsPerPage: number
}

export interface FilterStateCollection {
  movies: FilterState
  soft: FilterState
  photobooks: FilterState
  favorites: FilterState
  [key: string]: FilterState // for custom navigation items
}

const DEFAULT_FILTER_STATE: FilterState = {
  tagFilter: 'all',
  studioFilter: 'all',
  seriesFilter: 'all',
  typeFilter: 'all',
  sortBy: 'releaseDate-desc',
  currentPage: 1,
  itemsPerPage: 24
}

const STORAGE_KEY = 'mvdb_filter_states'

// Save filter states to localStorage
export function saveFilterStates(states: FilterStateCollection): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(states))
  } catch (error) {
    console.warn('Failed to save filter states to localStorage:', error)
  }
}

// Load filter states from localStorage
export function loadFilterStates(): FilterStateCollection {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Ensure we have default states for all content types
      return {
        movies: { ...DEFAULT_FILTER_STATE, ...parsed.movies },
        soft: { ...DEFAULT_FILTER_STATE, ...parsed.soft },
        photobooks: { ...DEFAULT_FILTER_STATE, ...parsed.photobooks },
        favorites: { ...DEFAULT_FILTER_STATE, ...parsed.favorites },
        ...parsed
      }
    }
  } catch (error) {
    console.warn('Failed to load filter states from localStorage:', error)
  }
  
  // Return default states if nothing stored or error occurred
  return {
    movies: { ...DEFAULT_FILTER_STATE },
    soft: { ...DEFAULT_FILTER_STATE },
    photobooks: { ...DEFAULT_FILTER_STATE },
    favorites: { ...DEFAULT_FILTER_STATE }
  }
}

// Get filter state for specific content type
export function getFilterState(contentType: string, allStates: FilterStateCollection): FilterState {
  return allStates[contentType] || { ...DEFAULT_FILTER_STATE }
}

// Update filter state for specific content type
export function updateFilterState(
  contentType: string, 
  updates: Partial<FilterState>, 
  allStates: FilterStateCollection
): FilterStateCollection {
  const newStates = {
    ...allStates,
    [contentType]: {
      ...getFilterState(contentType, allStates),
      ...updates
    }
  }
  
  saveFilterStates(newStates)
  return newStates
}

// Clear all filter states
export function clearFilterStates(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.warn('Failed to clear filter states from localStorage:', error)
  }
}

// Reset filter state for specific content type to defaults
export function resetFilterState(contentType: string, allStates: FilterStateCollection): FilterStateCollection {
  return updateFilterState(contentType, { ...DEFAULT_FILTER_STATE }, allStates)
}