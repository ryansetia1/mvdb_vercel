import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Movie, movieApi } from '../utils/movieApi'
import { SCMovie, scMovieApi } from '../utils/scMovieApi'
import { Photobook, photobookApi } from '../utils/photobookApi'
import { MasterDataItem, masterDataApi, calculateAge } from '../utils/masterDataApi'
import { useCachedData } from '../hooks/useCachedData'
import { 
  Search, 
  Film, 
  Users, 
  User, 
  Building, 
  Tag as TagIcon, 
  PlayCircle,
  BookOpen,
  Menu,
  X,
  Plus,
  Settings,
  Database,
  Globe,
  ArrowLeft,
  Heart,
  Edit,
  Filter,
  LogOut,
  Check,
  ChevronsUpDown
} from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Separator } from './ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from './ui/command'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu'

// Content Components
import { MoviesContent } from './content/MoviesContent'
import { ActorsContent } from './content/ActorsContent'
import { ActressesContent } from './content/ActressesContent'
import { SeriesContent } from './content/SeriesContent'
import { StudiosContent } from './content/StudiosContent'
import { GroupsContent } from './content/GroupsContent'
import { TagsContent } from './content/TagsContent'
import { MovieDetailContent } from './content/MovieDetailContent'
import { ProfileContent } from './content/ProfileContent'
import { FilteredMoviesContent } from './content/FilteredMoviesContent'
import { PhotobooksContent } from './content/PhotobooksContent'
import { PhotobookDetailContent } from './content/PhotobookDetailContent'
import { FavoritesContent } from './content/FavoritesContent'
import { Dashboard } from './Dashboard'
import { SimpleFavoritesContent } from './content/SimpleFavoritesContent'
import { AdvancedSearchContent } from './content/AdvancedSearchContent'
import { SoftContent } from './content/SoftContent'
import { SCMovieDetailContent } from './content/SCMovieDetailContent'
import { customNavApi, CustomNavItem } from '../utils/customNavApi'
import { 
  loadFilterStates, 
  saveFilterStates, 
  getFilterState, 
  updateFilterState,
  FilterStateCollection,
  FilterState 
} from '../utils/filterStateManager'

interface UnifiedAppProps {
  accessToken: string
  user: any
  onLogout: () => void
}

interface NavItem {
  id: string
  label: string
  type: 'movies' | 'soft' | 'photobooks' | 'actors' | 'actresses' | 'series' | 'studios' | 'tags' | 'groups' | 'favorites' | 'custom' | 'admin'
  filterType?: string
  filterValue?: string
  icon?: React.ReactNode
}

type ContentMode = 
  | 'movies' 
  | 'soft'
  | 'photobooks'
  | 'actors' 
  | 'actresses' 
  | 'series' 
  | 'studios' 
  | 'tags' 
  | 'groups'
  | 'favorites'
  | 'custom'
  | 'movieDetail'
  | 'scMovieDetail'
  | 'photobookDetail'
  | 'profile'
  | 'filteredMovies'
  | 'admin'
  | 'advancedSearch'

interface ContentState {
  mode: ContentMode
  data?: any
  title?: string
}

// Helper functions for database operations
const saveCustomNavItemsToDatabase = async (accessToken: string, items: NavItem[]) => {
  try {
    const customItems = items.filter(item => item.type === 'custom')
    // Remove icon property to avoid circular reference issues
    const itemsToSave: CustomNavItem[] = customItems.map(({ icon, type, ...rest }) => ({
      id: rest.id,
      label: rest.label,
      filterType: rest.filterType || '',
      filterValue: rest.filterValue || ''
    }))
    
    await customNavApi.saveCustomNavItems(accessToken, itemsToSave)
    console.log('Custom nav items saved to database successfully:', itemsToSave.length, 'items')
  } catch (error) {
    console.error('Failed to save custom nav items to database:', error)
    throw error
  }
}

const loadCustomNavItemsFromDatabase = async (accessToken: string): Promise<NavItem[]> => {
  try {
    const savedItems = await customNavApi.getCustomNavItems(accessToken)
    
    // Convert CustomNavItem back to NavItem with recreated icons
    return savedItems.map((item: CustomNavItem) => ({
      id: item.id,
      label: item.label,
      type: 'custom' as const,
      filterType: item.filterType,
      filterValue: item.filterValue,
      icon: getCategoryIconFromType(item.filterType || '')
    }))
  } catch (error) {
    console.error('Failed to load custom nav items from database:', error)
    return []
  }
}

const getCategoryIconFromType = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'actress': return <Users className="h-4 w-4" />
    case 'actor': return <User className="h-4 w-4" />
    case 'series': return <PlayCircle className="h-4 w-4" />
    case 'studio': return <Building className="h-4 w-4" />
    case 'type': return <TagIcon className="h-4 w-4" />
    case 'tag': return <TagIcon className="h-4 w-4" />
    default: return <TagIcon className="h-4 w-4" />
  }
}

export function UnifiedApp({ accessToken, user, onLogout }: UnifiedAppProps) {
  // Use cached data hook for persistent storage
  const { cache, loadData: loadCachedData, invalidateCache } = useCachedData()
  
  // Core data states - now using cached data
  const [movies, setMovies] = useState<Movie[]>(cache.movies.data)
  const [photobooks, setPhotobooks] = useState<Photobook[]>(cache.photobooks.data)
  const [actors, setActors] = useState<MasterDataItem[]>(cache.actors.data)
  const [actresses, setActresses] = useState<MasterDataItem[]>(cache.actresses.data)
  const [directors, setDirectors] = useState<MasterDataItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Navigation states
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showNavCustomizer, setShowNavCustomizer] = useState(false)
  
  // Navigation customizer states
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedItem, setSelectedItem] = useState('')
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [itemOpen, setItemOpen] = useState(false)
  const [customNavLoading, setCustomNavLoading] = useState(false)
  
  // Advanced search states
  const [advancedSearchFilters, setAdvancedSearchFilters] = useState({
    actors: '',
    actresses: '',
    director: '',
    studio: '',
    series: '',
    tags: '',
    type: ''
  })
  
  // Content state - what's currently displayed in main area
  const [contentState, setContentState] = useState<ContentState>({
    mode: 'movies',
    title: 'Movies'
  })

  // Navigation history stack for preserving filters and previous states
  const [navigationHistory, setNavigationHistory] = useState<ContentState[]>([])
  
  // Persistent filter states - loaded from localStorage on app start
  const [filterStates, setFilterStates] = useState<FilterStateCollection>(() => loadFilterStates())
  
  // Admin mode state
  const [showEditMovie, setShowEditMovie] = useState<Movie | null>(null)
  const [showEditSCMovie, setShowEditSCMovie] = useState<SCMovie | null>(null)
  const [showEditProfile, setShowEditProfile] = useState<{ type: 'actor' | 'actress' | 'director', name: string } | null>(null)
  const [showParseMovie, setShowParseMovie] = useState<Movie | null>(null)
  
  // Navigation items - start with default items only
  const [navItems, setNavItems] = useState<NavItem[]>([
    { id: 'movies', label: 'Movies', type: 'movies', icon: <Film className="h-4 w-4" /> },
    { id: 'soft', label: 'Soft', type: 'soft', icon: <PlayCircle className="h-4 w-4" /> },
    { id: 'photobooks', label: 'Photobooks', type: 'photobooks', icon: <BookOpen className="h-4 w-4" /> },
    { id: 'favorites', label: 'Favorites', type: 'favorites', icon: <Heart className="h-4 w-4" /> },
    { id: 'actors', label: 'Actors', type: 'actors', icon: <User className="h-4 w-4" /> },
    { id: 'actresses', label: 'Actresses', type: 'actresses', icon: <Users className="h-4 w-4" /> },
    { id: 'series', label: 'Series', type: 'series', icon: <PlayCircle className="h-4 w-4" /> },
    { id: 'studios', label: 'Studios', type: 'studios', icon: <Building className="h-4 w-4" /> },
    { id: 'groups', label: 'Groups', type: 'groups', icon: <Globe className="h-4 w-4" /> },
    { id: 'tags', label: 'Tags', type: 'tags', icon: <TagIcon className="h-4 w-4" /> },
  ])
  
  const [activeNavItem, setActiveNavItem] = useState('movies')
  
  // Derived data for filters
  const [availableFilters, setAvailableFilters] = useState<{
    actors: string[]
    actresses: string[]
    directors: string[]
    series: string[]
    studios: string[]
    types: string[]
    tags: string[]
  }>({
    actors: [],
    actresses: [],
    directors: [],
    series: [],
    studios: [],
    types: [],
    tags: []
  })

  // Reload function for external calls with cache invalidation
  const reloadData = async () => {
    invalidateCache() // Clear all cache
    await loadData()
  }

  // Separate reload for photobooks using cache invalidation
  const reloadPhotobooks = async () => {
    try {
      invalidateCache('photobooks')
      const photobooksData = await loadCachedData('photobooks', () => photobookApi.getPhotobooks(accessToken), true) as Photobook[]
      setPhotobooks(photobooksData || [])
    } catch (error) {
      // Failed to reload photobooks - handled silently
    }
  }

  // Update actors state locally without reloading
  const updateActorLocally = (updatedActor: MasterDataItem) => {
    setActors(prev => prev.map(actor => actor.id === updatedActor.id ? updatedActor : actor))
  }

  // Update actresses state locally without reloading
  const updateActressLocally = (updatedActress: MasterDataItem) => {
    setActresses(prev => prev.map(actress => actress.id === updatedActress.id ? updatedActress : actress))
  }

  // Load initial data using cached system
  const loadData = async () => {
    try {
      setIsLoading(true)
      
      // Load movies using cached system
      const moviesData = await loadCachedData('movies', () => movieApi.getMovies(accessToken)) as Movie[]
      setMovies(moviesData || [])
      
      // Load photobooks using cached system
      const photobooksData = await loadCachedData('photobooks', () => photobookApi.getPhotobooks(accessToken).catch(() => [])) as Photobook[]
      setPhotobooks(photobooksData || [])
        
      // Load master data using cached system
      try {
        const [actorsData, actressesData, directorsData] = await Promise.all([
          loadCachedData('actors', () => masterDataApi.getByType('actor', accessToken).catch(() => [])) as MasterDataItem[],
          loadCachedData('actresses', () => masterDataApi.getByType('actress', accessToken).catch(() => [])) as MasterDataItem[],
          masterDataApi.getByType('director', accessToken).catch(() => [])
        ])
        
        // Add calculated age and movie counts
        const addMovieStats = (people: MasterDataItem[], type: 'actor' | 'actress' | 'director') => {
          return people.map(person => {
            const fieldToCheck = type === 'director' ? 'director' : type === 'actor' ? 'actors' : 'actress'
            const personMovies = moviesData.filter((movie: Movie) => {
              const field = movie[fieldToCheck as keyof Movie]
              if (typeof field === 'string') {
                return field.toLowerCase().includes(person.name?.toLowerCase() || '')
              }
              return false
            })

            return {
              ...person,
              age: person.birthdate ? calculateAge(person.birthdate) : undefined,
              photoUrl: person.profilePicture || (person.photo && person.photo[0]),
              movieCount: personMovies.length,
            }
          })
        }

        const actorsWithStats = addMovieStats(actorsData, 'actor')
        const actressesWithStats = addMovieStats(actressesData, 'actress')
        const directorsWithStats = addMovieStats(directorsData, 'director')
        
        setActors(actorsWithStats)
        setActresses(actressesWithStats)
        setDirectors(directorsWithStats)
          
          // Extract unique filter values
          const uniqueActors = [...new Set(actorsData.map(a => a.name).filter(Boolean))] as string[]
          const uniqueActresses = [...new Set(actressesData.map(a => a.name).filter(Boolean))] as string[]
          const uniqueDirectors = [...new Set(directorsData.map(d => d.name).filter(Boolean))] as string[]
          const uniqueSeries = [...new Set(moviesData.map((m: Movie) => m.series).filter(Boolean))] as string[]
          const uniqueStudios = [...new Set(moviesData.map((m: Movie) => m.studio).filter(Boolean))] as string[]
          const uniqueTypes = [...new Set(moviesData.map((m: Movie) => m.type).filter(Boolean))] as string[]
          
          // Extract and flatten tags
          const allTags = moviesData.flatMap((m: Movie) => 
            m.tags ? m.tags.split(',').map(tag => tag.trim()).filter(Boolean) : []
          )
          const uniqueTags = [...new Set(allTags)]
          
          setAvailableFilters({
            actors: uniqueActors,
            actresses: uniqueActresses,
            directors: uniqueDirectors,
            series: uniqueSeries,
            studios: uniqueStudios,
            types: uniqueTypes,
            tags: uniqueTags
          })
          
        } catch (masterDataError) {
          // Failed to load master data - continue with movies only
        }
        
      } catch (error) {
        // Failed to load data - handled silently
      } finally {
        setIsLoading(false)
      }
    }

  // Sync state with cache when cache changes
  useEffect(() => {
    setMovies(cache.movies.data)
    setPhotobooks(cache.photobooks.data)
    setActors(cache.actors.data)
    setActresses(cache.actresses.data)
  }, [cache])

  useEffect(() => {
    loadData()
  }, [accessToken])

  // Load custom navigation items from database after component mounts
  useEffect(() => {
    const loadCustomNavItems = async () => {
      if (!accessToken) return
      
      try {
        setCustomNavLoading(true)
        const customItems = await loadCustomNavItemsFromDatabase(accessToken)
        
        if (customItems.length > 0) {
          setNavItems(prev => {
            const defaultItems = prev.filter(item => item.type !== 'custom')
            return [...defaultItems, ...customItems]
          })
        }
      } catch (error) {
        console.error('Failed to load custom nav items:', error)
        // Continue without custom items if loading fails
      } finally {
        setCustomNavLoading(false)
      }
    }

    loadCustomNavItems()
  }, [accessToken])

  // Helper functions for persistent filter management
  const getCurrentFilters = (contentType: string): FilterState => {
    return getFilterState(contentType, filterStates)
  }

  const handleFiltersChange = (contentType: string, filters: Partial<FilterState>) => {
    const newFilterStates = updateFilterState(contentType, filters, filterStates)
    setFilterStates(newFilterStates)
  }

  // Navigation handlers
  const handleNavClick = (navItem: NavItem) => {
    setActiveNavItem(navItem.id)
    setMobileMenuOpen(false)
    
    // Clear navigation history when starting fresh navigation
    setNavigationHistory([])
    
    if (navItem.type === 'admin') {
      setContentState({ mode: 'admin', title: 'Admin Panel' })
    } else if (navItem.type === 'custom' && navItem.filterType && navItem.filterValue) {
      setContentState({ 
        mode: 'filteredMovies', 
        title: `${navItem.label}`,
        data: { filterType: navItem.filterType, filterValue: navItem.filterValue }
      })
    } else {
      setContentState({ 
        mode: navItem.type as ContentMode, 
        title: navItem.label 
      })
    }
  }

  // Content navigation handlers
  const handleMovieSelect = (movie: Movie | string) => {
    // Handle collaboration filtering
    if (typeof movie === 'string' && movie.startsWith('collaboration:')) {
      const collaborationData = movie.substring('collaboration:'.length)
      const [actorName, actressName] = collaborationData.split('+')
      
      setContentState({
        mode: 'filteredMovies',
        title: `Collaboration: ${actorName} & ${actressName}`,
        data: { 
          filterType: 'collaboration', 
          filterValue: collaborationData,
          actorName,
          actressName
        }
      })
      return
    }

    // Handle regular movie selection
    if (typeof movie === 'object') {
      // Save current state to history before navigating to movie detail
      setNavigationHistory(prev => [...prev, contentState])
      
      setContentState({
        mode: 'movieDetail',
        title: movie.titleEn || movie.titleJp || 'Movie Details',
        data: movie
      })
    }
  }

  const handlePhotobookSelect = (photobook: Photobook) => {
    console.log('handlePhotobookSelect called with:', {
      photobookId: photobook.id,
      titleEn: photobook.titleEn,
      titleJp: photobook.titleJp
    })
    
    // Save current state to history before navigating to photobook detail
    setNavigationHistory(prev => [...prev, contentState])
    
    setContentState({
      mode: 'photobookDetail',
      title: photobook.titleEn || photobook.titleJp || 'Photobook Details',
      data: photobook
    })
    
    console.log('Navigation state updated to photobookDetail mode')
  }

  const handleSCMovieSelect = async (scMovieInput: SCMovie | string) => {
    // Handle both SCMovie object and string ID
    let scMovie: SCMovie
    
    if (typeof scMovieInput === 'string') {
      // Fetch SC movie by ID
      try {
        scMovie = await scMovieApi.getSCMovie(scMovieInput)
      } catch (error) {
        console.error('Failed to fetch SC movie:', error)
        return
      }
    } else {
      // Already an SCMovie object
      scMovie = scMovieInput
    }
    
    // Save current state to history before navigating to SC movie detail
    setNavigationHistory(prev => [...prev, contentState])
    
    setContentState({
      mode: 'scMovieDetail',
      title: scMovie.titleEn || scMovie.titleJp || 'SC Movie Details',
      data: scMovie
    })
  }

  const handleProfileSelect = (type: 'actor' | 'actress' | 'director', name: string) => {
    // If director, check if they exist as actor or actress first
    if (type === 'director') {
      const actorExists = actors.find(actor => actor.name === name)
      const actressExists = actresses.find(actress => actress.name === name)
      
      if (actorExists) {
        // Director exists as actor, navigate to actor profile
        setContentState({
          mode: 'profile',
          title: `${name}`,
          data: { type: 'actor', name }
        })
        return
      }
      
      if (actressExists) {
        // Director exists as actress, navigate to actress profile
        setContentState({
          mode: 'profile',
          title: `${name}`,
          data: { type: 'actress', name }
        })
        return
      }
    }
    
    // Default behavior for regular cases
    setContentState({
      mode: 'profile',
      title: `${name}`,
      data: { type, name }
    })
  }

  const handleFilterSelect = (filterType: string, filterValue: string, title?: string) => {
    setContentState({
      mode: 'filteredMovies',
      title: title || `${filterType}: ${filterValue}`,
      data: { filterType, filterValue }
    })
  }

  const handleGroupSelect = (groupName: string) => {
    // Navigate to groups page and show selected group
    setContentState({
      mode: 'groups',
      title: 'Groups',
      data: { selectedGroup: groupName }
    })
    setActiveNavItem('groups')
  }

  const handleBack = () => {
    // Check if there's a previous state in navigation history
    if (navigationHistory.length > 0) {
      // Get the most recent state from history
      const previousState = navigationHistory[navigationHistory.length - 1]
      
      // Remove the last state from history
      setNavigationHistory(prev => prev.slice(0, -1))
      
      // Restore the previous state
      setContentState(previousState)
      
      // Update active nav item based on the restored state
      if (previousState.mode === 'filteredMovies') {
        // For filtered movies, keep the current active nav item
        // since the filter could come from any main section
      } else if (previousState.mode === 'custom') {
        // Find the custom nav item that matches this state
        const customNav = customNavItems.find(item => 
          item.filterType === previousState.data?.filterType && 
          item.filterValue === previousState.data?.filterValue
        )
        if (customNav) {
          setActiveNavItem(customNav.id)
        }
      } else {
        // For regular modes, find the corresponding nav item
        const navItem = navItems.find(item => item.type === previousState.mode)
        if (navItem) {
          setActiveNavItem(navItem.id)
        }
      }
    } else {
      // No history available, fall back to default behavior
      const currentNav = navItems.find(item => item.id === activeNavItem)
      if (currentNav) {
        // Clear any filter data when going back to main navigation
        if (currentNav.type === 'custom' && currentNav.filterType && currentNav.filterValue) {
          setContentState({ 
            mode: 'filteredMovies', 
            title: `${currentNav.label}`,
            data: { filterType: currentNav.filterType, filterValue: currentNav.filterValue }
          })
        } else {
          setContentState({ 
            mode: currentNav.type as ContentMode, 
            title: currentNav.label 
          })
        }
      } else {
        setContentState({ mode: 'movies', title: 'Movies' })
        setActiveNavItem('movies')
      }
    }
  }

  const handleEditMovie = (movie: Movie) => {
    setShowEditMovie(movie)
    // Switch to admin mode to show the edit form
    setContentState({ mode: 'admin', title: 'Admin Panel - Edit Movie' })
    setActiveNavItem('admin')
  }

  const handleParseMovie = (movie: Movie) => {
    // Switch to admin mode with parser tab active
    setContentState({ mode: 'admin', title: 'Admin Panel - Parse Movie' })
    setActiveNavItem('admin')
    // Set the movie to be parsed (pre-fill the parser with movie data)
    setShowParseMovie(movie)
  }

  const handleEditSCMovie = (scMovie: SCMovie) => {
    setShowEditSCMovie(scMovie)
    // Switch to admin mode to show the edit form
    setContentState({ mode: 'admin', title: 'Admin Panel - Edit SC Movie' })
    setActiveNavItem('admin')
  }

  const handleEditProfile = (type: 'actor' | 'actress' | 'director', name: string) => {
    setShowEditProfile({ type, name })
    // Switch to admin mode to show the edit form
    const entityLabel = type === 'actress' ? 'Actress' : type === 'actor' ? 'Actor' : 'Director'
    setContentState({ mode: 'admin', title: `Admin Panel - Edit ${entityLabel}` })
    setActiveNavItem('admin')
  }

  // Custom navigation management
  const addCustomNavItem = async (type: string, value: string, label?: string) => {
    const newNavItem: NavItem = {
      id: `custom-${Date.now()}`,
      label: label || value,
      type: 'custom',
      filterType: type,
      filterValue: value,
      icon: getCategoryIcon(type)
    }
    
    try {
      const updatedItems = [...navItems, newNavItem]
      await saveCustomNavItemsToDatabase(accessToken, updatedItems)
      setNavItems(updatedItems)
      setShowNavCustomizer(false)
    } catch (error) {
      console.error('Failed to add custom nav item:', error)
      // Show error feedback to user here if needed
    }
  }

  const removeNavItem = async (itemId: string) => {
    try {
      await customNavApi.deleteCustomNavItem(accessToken, itemId)
      
      setNavItems(prev => prev.filter(item => item.id !== itemId))
      
      if (activeNavItem === itemId) {
        setActiveNavItem('movies')
        setContentState({ mode: 'movies', title: 'Movies' })
      }
    } catch (error) {
      console.error('Failed to remove custom nav item:', error)
      // Show error feedback to user here if needed
    }
  }

  // Separate default and custom nav items
  const defaultNavItems = navItems.filter(item => item.type !== 'custom')
  const customNavItems = navItems.filter(item => item.type === 'custom')

  // Navigation customizer helpers
  const categories = [
    { value: 'actress', label: 'Actress', icon: <Users className="h-4 w-4" /> },
    { value: 'actor', label: 'Actor', icon: <User className="h-4 w-4" /> },
    { value: 'series', label: 'Series', icon: <PlayCircle className="h-4 w-4" /> },
    { value: 'studio', label: 'Studio', icon: <Building className="h-4 w-4" /> },
    { value: 'type', label: 'Type', icon: <TagIcon className="h-4 w-4" /> },
    { value: 'tag', label: 'Tag', icon: <TagIcon className="h-4 w-4" /> },
  ]

  const getCategoryData = (category: string) => {
    switch (category) {
      case 'actress': return availableFilters.actresses
      case 'actor': return availableFilters.actors
      case 'series': return availableFilters.series
      case 'studio': return availableFilters.studios
      case 'type': return availableFilters.types
      case 'tag': return availableFilters.tags
      default: return []
    }
  }

  const getCategoryIcon = (category: string) => {
    const cat = categories.find(c => c.value === category)
    return cat?.icon || <TagIcon className="h-4 w-4" />
  }

  const handleAddCustomNavItem = async () => {
    if (selectedCategory && selectedItem) {
      await addCustomNavItem(selectedCategory, selectedItem, selectedItem)
      setSelectedCategory('')
      setSelectedItem('')
    }
  }

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category)
    setSelectedItem('') // Reset selected item when category changes
    setCategoryOpen(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading Movie Database...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Top Row: Logo + Default Navigation + User Controls */}
          <div className="flex items-center justify-between h-16">
            {/* Logo/Brand */}
            <div 
              className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                const moviesNavItem = navItems.find(item => item.id === 'movies')
                if (moviesNavItem) {
                  handleNavClick(moviesNavItem)
                }
              }}
            >
              <Film className="h-8 w-8 text-primary" />
              <h1 className="text-xl font-bold">MVDB</h1>
            </div>

            {/* Desktop Default Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {defaultNavItems.map(item => (
                <Button
                  key={item.id}
                  variant={activeNavItem === item.id ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleNavClick(item)}
                  className="flex items-center gap-2"
                >
                  {item.icon}
                  {item.label}
                </Button>
              ))}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNavCustomizer(true)}
                className="ml-2"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={() => handleNavClick({ id: 'admin', label: 'Admin', type: 'admin', icon: <Database className="h-4 w-4" /> })}
                    className="flex items-center gap-2"
                  >
                    <Database className="h-4 w-4" />
                    Admin Panel
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setContentState({ mode: 'advancedSearch', title: 'Advanced Search' })}
                    className="flex items-center gap-2"
                  >
                    <Search className="h-4 w-4" />
                    Advanced Search
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={onLogout}
                    className="flex items-center gap-2 text-red-600"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile menu button */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="md:hidden">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80">
                  <SheetHeader>
                    <SheetTitle>Navigation</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-4">
                    {navItems.map(item => (
                      <Button
                        key={item.id}
                        variant={activeNavItem === item.id ? 'default' : 'ghost'}
                        className="w-full justify-start"
                        onClick={() => handleNavClick(item)}
                      >
                        {item.icon}
                        {item.label}
                      </Button>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Second Row: Custom Navigation */}
          {customNavItems.length > 0 && (
            <div className="border-t py-2">
              <div className="flex items-center gap-2 overflow-x-auto">
                <span className="text-sm text-muted-foreground whitespace-nowrap mr-2">Custom:</span>
                {customNavItems.map(item => (
                  <div key={item.id} className="flex items-center gap-1">
                    <Badge
                      variant={activeNavItem === item.id ? 'default' : 'secondary'}
                      className="cursor-pointer whitespace-nowrap"
                      onClick={() => handleNavClick(item)}
                    >
                      {item.icon}
                      {item.label}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeNavItem(item.id)}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Third Row: Search Bar */}
          <div className="py-3 border-t">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search movies, cast, directors, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content with Persistent Filter States */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          {/* Back button when navigation history exists or in detail views */}
          {(navigationHistory.length > 0 || 
            contentState.mode === 'movieDetail' || 
            contentState.mode === 'scMovieDetail' || 
            contentState.mode === 'photobookDetail' || 
            contentState.mode === 'profile') && (
            <div className="mb-6">
              <Button 
                variant="outline" 
                onClick={handleBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </div>
          )}

          {/* Content Title */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold">{contentState.title}</h1>
          </div>

          {/* Dynamic Content Based on Mode */}
          {contentState.mode === 'movies' && (
            <MoviesContent
              movies={movies}
              searchQuery={searchQuery}
              onMovieSelect={handleMovieSelect}
              onProfileSelect={handleProfileSelect}
              accessToken={accessToken}
              actresses={actresses}
              actors={actors}
              directors={directors}
              externalFilters={getCurrentFilters('movies')}
              onFiltersChange={(filters) => handleFiltersChange('movies', filters)}
            />
          )}

          {contentState.mode === 'soft' && (
            <SoftContent
              searchQuery={searchQuery}
              accessToken={accessToken}
              onSCMovieSelect={handleSCMovieSelect}
              externalFilters={getCurrentFilters('soft')}
              onFiltersChange={(filters) => handleFiltersChange('soft', filters)}
            />
          )}

          {contentState.mode === 'photobooks' && (
            <PhotobooksContent
              accessToken={accessToken}
              onPhotobookSelect={handlePhotobookSelect}
              searchQuery={searchQuery}
              externalFilters={getCurrentFilters('photobooks')}
              onFiltersChange={(filters) => handleFiltersChange('photobooks', filters)}
            />
          )}

          {contentState.mode === 'favorites' && (
            <FavoritesContent
              accessToken={accessToken}
              onMovieSelect={handleMovieSelect}
              onPhotobookSelect={handlePhotobookSelect}
              onProfileSelect={handleProfileSelect}
              searchQuery={searchQuery}
              cachedMovies={movies}
              cachedPhotobooks={photobooks}
              cachedCast={[...actors, ...actresses]}
              externalFilters={getCurrentFilters('favorites')}
              onFiltersChange={(filters) => handleFiltersChange('favorites', filters)}
            />
          )}

          {contentState.mode === 'actors' && (
            <ActorsContent
              actors={actors}
              searchQuery={searchQuery}
              onProfileSelect={handleProfileSelect}
              accessToken={accessToken}
              onDataChange={updateActorLocally}
            />
          )}

          {contentState.mode === 'actresses' && (
            <ActressesContent
              actresses={actresses}
              searchQuery={searchQuery}
              onProfileSelect={handleProfileSelect}
              accessToken={accessToken}
              onDataChange={updateActressLocally}
            />
          )}

          {contentState.mode === 'series' && (
            <SeriesContent
              movies={movies}
              searchQuery={searchQuery}
              onMovieSelect={handleMovieSelect}
              onProfileSelect={handleProfileSelect}
              accessToken={accessToken}
            />
          )}

          {contentState.mode === 'studios' && (
            <StudiosContent
              movies={movies}
              searchQuery={searchQuery}
              onMovieSelect={handleMovieSelect}
              accessToken={accessToken}
            />
          )}

          {contentState.mode === 'tags' && (
            <TagsContent
              movies={movies}
              searchQuery={searchQuery}
              onMovieSelect={handleMovieSelect}
              accessToken={accessToken}
            />
          )}

          {contentState.mode === 'groups' && (
            <GroupsContent
              actresses={actresses}
              searchQuery={searchQuery}
              onProfileSelect={handleProfileSelect}
              accessToken={accessToken}
              selectedGroup={contentState.data?.selectedGroup}
              onGroupSelect={handleGroupSelect}
            />
          )}

          {contentState.mode === 'movieDetail' && contentState.data && (
            <MovieDetailContent
              movie={contentState.data}
              onBack={handleBack}
              onEdit={handleEditMovie}
              onParseMovie={handleParseMovie}
              onProfileSelect={handleProfileSelect}
              accessToken={accessToken}
              actresses={actresses}
              actors={actors}
              directors={directors}
            />
          )}

          {contentState.mode === 'scMovieDetail' && contentState.data && (
            <SCMovieDetailContent
              scMovie={contentState.data}
              onBack={handleBack}
              onEdit={handleEditSCMovie}
              onProfileSelect={handleProfileSelect}
              accessToken={accessToken}
              actresses={actresses}
              actors={actors}
              directors={directors}
            />
          )}

          {contentState.mode === 'photobookDetail' && contentState.data && (
            <PhotobookDetailContent
              photobook={contentState.data}
              onBack={handleBack}
              onProfileSelect={handleProfileSelect}
              accessToken={accessToken}
              actresses={actresses}
            />
          )}

          {contentState.mode === 'profile' && contentState.data && (
            <ProfileContent
              type={contentState.data.type}
              name={contentState.data.name}
              movies={movies}
              photobooks={photobooks}
              onMovieSelect={handleMovieSelect}
              onPhotobookSelect={handlePhotobookSelect}
              onProfileSelect={handleProfileSelect}
              onEdit={handleEditProfile}
              accessToken={accessToken}
              actresses={actresses}
              actors={actors}
              directors={directors}
            />
          )}

          {contentState.mode === 'filteredMovies' && contentState.data && (
            <FilteredMoviesContent
              movies={movies}
              filterType={contentState.data.filterType}
              filterValue={contentState.data.filterValue}
              searchQuery={searchQuery}
              onMovieSelect={handleMovieSelect}
              onProfileSelect={handleProfileSelect}
              accessToken={accessToken}
              actresses={actresses}
              actors={actors}
              directors={directors}
              actorName={contentState.data.actorName}
              actressName={contentState.data.actressName}
            />
          )}

          {contentState.mode === 'admin' && (
            <Dashboard
              accessToken={accessToken}
              onReload={reloadData}
              onReloadPhotobooks={reloadPhotobooks}
              editMovie={showEditMovie}
              editSCMovie={showEditSCMovie}
              editProfile={showEditProfile}
              parseMovie={showParseMovie}
              onCloseEdit={() => {
                setShowEditMovie(null)
                setShowEditSCMovie(null)
                setShowEditProfile(null)
                setShowParseMovie(null)
              }}
              actresses={actresses}
              actors={actors}
              directors={directors}
            />
          )}

          {contentState.mode === 'advancedSearch' && (
            <AdvancedSearchContent
              movies={movies}
              filters={advancedSearchFilters}
              onFiltersChange={setAdvancedSearchFilters}
              onMovieSelect={handleMovieSelect}
              onProfileSelect={handleProfileSelect}
              accessToken={accessToken}
              actresses={actresses}
              actors={actors}
              directors={directors}
            />
          )}
        </div>
      </main>

      {/* Navigation Customizer Dialog */}
      <Dialog open={showNavCustomizer} onOpenChange={setShowNavCustomizer}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Customize Navigation</DialogTitle>
            <DialogDescription>
              Add custom navigation items based on your favorite filters.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="category" className="text-right">
                Category
              </label>
              <div className="col-span-3">
                <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={categoryOpen}
                      className="w-full justify-between"
                    >
                      {selectedCategory
                        ? categories.find((cat) => cat.value === selectedCategory)?.label
                        : "Select category..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0">
                    <Command>
                      <CommandInput placeholder="Search category..." />
                      <CommandEmpty>No category found.</CommandEmpty>
                      <CommandGroup>
                        {categories.map((category) => (
                          <CommandItem
                            key={category.value}
                            value={category.value}
                            onSelect={handleCategorySelect}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                selectedCategory === category.value ? "opacity-100" : "opacity-0"
                              }`}
                            />
                            <div className="flex items-center gap-2">
                              {category.icon}
                              {category.label}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="item" className="text-right">
                Item
              </label>
              <div className="col-span-3">
                <Popover open={itemOpen} onOpenChange={setItemOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={itemOpen}
                      className="w-full justify-between"
                      disabled={!selectedCategory}
                    >
                      {selectedItem || "Select item..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0">
                    <Command>
                      <CommandInput placeholder="Search item..." />
                      <CommandEmpty>No item found.</CommandEmpty>
                      <CommandGroup>
                        {getCategoryData(selectedCategory).map((item) => (
                          <CommandItem
                            key={item}
                            value={item}
                            onSelect={(value) => {
                              setSelectedItem(value)
                              setItemOpen(false)
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                selectedItem === item ? "opacity-100" : "opacity-0"
                              }`}
                            />
                            {item}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowNavCustomizer(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddCustomNavItem}
              disabled={!selectedCategory || !selectedItem || customNavLoading}
            >
              {customNavLoading ? 'Adding...' : 'Add Item'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}