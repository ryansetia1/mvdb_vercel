import React from 'react'
import { useState, useEffect, useCallback } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Movie, movieApi } from '../utils/movieApi'
import { SCMovie, scMovieApi } from '../utils/scMovieApi'
import { Photobook, photobookApi } from '../utils/photobookApi'
import { MasterDataItem, masterDataApi, calculateAge } from '../utils/masterDataApi'
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
import { GroupDetailContent } from './content/GroupDetailContent'
import { TagsContent } from './content/TagsContent'
import { MovieDetailContent } from './content/MovieDetailContent'
import { ProfileContent } from './content/ProfileContent'
import { FilteredMoviesContent } from './content/FilteredMoviesContent'
import { FilteredActressesContent } from './content/FilteredActressesContent'
import { PhotobooksContent } from './content/PhotobooksContent'
import { PhotobookDetailContent } from './content/PhotobookDetailContent'
import { FavoritesContent } from './content/FavoritesContent'
import { Dashboard } from './Dashboard'
import { SimpleFavoritesContent } from './content/SimpleFavoritesContent'
import { AdvancedSearchContent } from './content/AdvancedSearchContent'
import { SoftContent } from './content/SoftContent'
import { SCMovieDetailContent } from './content/SCMovieDetailContent'
import { customNavApi, CustomNavItem } from '../utils/customNavApi'
import { ThemeToggle } from './ThemeToggle'
import { DraggableCustomNavItem } from './DraggableCustomNavItem'

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
  | 'groupDetail'
  | 'favorites'
  | 'custom'
  | 'movieDetail'
  | 'scMovieDetail'
  | 'photobookDetail'
  | 'profile'
  | 'filteredMovies'
  | 'filteredActresses'
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
    
    // Sort by order field, then convert CustomNavItem back to NavItem with recreated icons
    const sortedItems = savedItems.sort((a: CustomNavItem, b: CustomNavItem) => 
      (a.order || 0) - (b.order || 0)
    )
    
    return sortedItems.map((item: CustomNavItem) => ({
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
    case 'group': return <Globe className="h-4 w-4" />
    case 'type': return <TagIcon className="h-4 w-4" />
    case 'tag': return <TagIcon className="h-4 w-4" />
    default: return <TagIcon className="h-4 w-4" />
  }
}

export function UnifiedApp({ accessToken, user, onLogout }: UnifiedAppProps) {
  return (
    <DndProvider backend={HTML5Backend}>
      <UnifiedAppInner accessToken={accessToken} user={user} onLogout={onLogout} />
    </DndProvider>
  )
}

function UnifiedAppInner({ accessToken, user, onLogout }: UnifiedAppProps) {
  // Core data states
  const [movies, setMovies] = useState<Movie[]>([])
  const [photobooks, setPhotobooks] = useState<Photobook[]>([])
  const [actors, setActors] = useState<MasterDataItem[]>([])
  const [actresses, setActresses] = useState<MasterDataItem[]>([])
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
  const [editMode, setEditMode] = useState(false)
  
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
  
  // Movies content filter state - for preserving filters across navigation
  const [moviesFilters, setMoviesFilters] = useState({
    tagFilter: 'all',
    studioFilter: 'all',
    seriesFilter: 'all',
    typeFilter: 'all',
    sortBy: 'releaseDate-desc',
    currentPage: 1,
    itemsPerPage: 24
  })
  
  // Admin mode state
  const [showEditMovie, setShowEditMovie] = useState<Movie | null>(null)
  const [showEditSCMovie, setShowEditSCMovie] = useState<SCMovie | null>(null)
  const [showEditProfile, setShowEditProfile] = useState<{ type: 'actor' | 'actress' | 'director', name: string } | null>(null)
  
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
    groups: string[]
  }>({
    actors: [],
    actresses: [],
    directors: [],
    series: [],
    studios: [],
    types: [],
    tags: [],
    groups: []
  })

  // Reload function for external calls
  const reloadData = async () => {
    await loadData()
  }

  // Separate reload for photobooks
  const reloadPhotobooks = async () => {
    try {
      const photobooksData = await photobookApi.getPhotobooks(accessToken)
      setPhotobooks(photobooksData || [])
    } catch (error) {
      // Failed to reload photobooks - handled silently
    }
  }

  // Load initial data
  const loadData = async () => {
    try {
      setIsLoading(true)
      
      // Load movies and photobooks
      const [moviesData, photobooksData] = await Promise.all([
        movieApi.getMovies(accessToken),
        photobookApi.getPhotobooks(accessToken).catch(() => [])
      ])
      
      setMovies(moviesData || [])
      setPhotobooks(photobooksData || [])
        
        // Load master data
        try {
          const [actorsData, actressesData, directorsData, groupsData] = await Promise.all([
            masterDataApi.getByType('actor', accessToken).catch(() => []),
            masterDataApi.getByType('actress', accessToken).catch(() => []),
            masterDataApi.getByType('director', accessToken).catch(() => []),
            masterDataApi.getByType('group', accessToken).catch(() => [])
          ])
          
          // Add calculated age and movie counts
          const addMovieStats = (people: MasterDataItem[], type: 'actor' | 'actress' | 'director') => {
            return people.map(person => {
              const fieldToCheck = type === 'director' ? 'director' : type === 'actor' ? 'actors' : 'actress'
              const personMovies = moviesData.filter(movie => {
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
          const uniqueActors = [...new Set(actorsData.map(a => a.name).filter(Boolean))]
          const uniqueActresses = [...new Set(actressesData.map(a => a.name).filter(Boolean))]
          const uniqueDirectors = [...new Set(directorsData.map(d => d.name).filter(Boolean))]
          const uniqueSeries = [...new Set(moviesData.map(m => m.series).filter(Boolean))]
          const uniqueStudios = [...new Set(moviesData.map(m => m.studio).filter(Boolean))]
          const uniqueTypes = [...new Set(moviesData.map(m => m.type).filter(Boolean))]
          const uniqueGroups = [...new Set(groupsData.map(g => g.name).filter(Boolean))]
          
          // Extract and flatten tags
          const allTags = moviesData.flatMap(m => 
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
            tags: uniqueTags,
            groups: uniqueGroups
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

  // Navigation handlers
  const handleNavClick = (navItem: NavItem) => {
    setActiveNavItem(navItem.id)
    setMobileMenuOpen(false)
    setEditMode(false) // Clear edit mode when navigating
    
    // Clear navigation history when starting fresh navigation
    setNavigationHistory([])
    
    if (navItem.type === 'admin') {
      setContentState({ mode: 'admin', title: 'Admin Panel' })
    } else if (navItem.type === 'custom' && navItem.filterType && navItem.filterValue) {
      // Special handling for group filters to show GroupDetailContent instead of FilteredActressesContent
      if (navItem.filterType === 'group') {
        // Use handleGroupSelect to show the full group detail view
        handleGroupSelect(navItem.filterValue)
        return
      }
      
      // For other filters, show filtered movies
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
      
      // Handle collaboration filter (now handled internally by ProfileContent)
      
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

  // 2. Ubah handlePhotobookSelect agar menerima Photobook (bukan string)
  const handlePhotobookSelect = (photobook: Photobook) => {
    setNavigationHistory(prev => [...prev, contentState])
    setContentState({
      mode: 'photobookDetail',
      title: photobook.titleEn || photobook.titleJp || 'Photobook Details',
      data: photobook
    })
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
    // Save current state to history before navigating to filtered view
    setNavigationHistory(prev => [...prev, contentState])
    
    // For group filters, show actresses instead of movies
    const contentMode = filterType === 'group' ? 'filteredActresses' : 'filteredMovies'
    setContentState({
      mode: contentMode,
      title: title || `${filterType}: ${filterValue}`,
      data: { filterType, filterValue }
    })
  }

  const handleGroupSelect = async (group: MasterDataItem | string) => {
    let groupData: MasterDataItem
    
    if (typeof group === 'string') {
      // Find group by name
      try {
        const groupsData = await masterDataApi.getByType('group', accessToken)
        const foundGroup = groupsData.find(g => g.name === group)
        if (!foundGroup) {
          console.error('Group not found:', group)
          return
        }
        groupData = foundGroup
      } catch (error) {
        console.error('Failed to find group:', error)
        return
      }
    } else {
      groupData = group
    }
    
    // Save current state to history before navigating to group detail
    setNavigationHistory(prev => [...prev, contentState])
    
    setContentState({
      mode: 'groupDetail',
      title: `${groupData.name} - Group Details`,
      data: groupData
    })
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
      if (previousState.mode === 'filteredMovies' || previousState.mode === 'filteredActresses') {
        // For filtered content, keep the current active nav item
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
          // For group filters, show actresses instead of movies
          const contentMode = currentNav.filterType === 'group' ? 'filteredActresses' : 'filteredMovies'
          setContentState({ 
            mode: contentMode, 
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
      setEditMode(false) // Reset edit mode when closing customizer
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

      // Check if no custom items left, then exit edit mode
      const remainingCustomItems = navItems.filter(item => item.type === 'custom' && item.id !== itemId)
      if (remainingCustomItems.length === 0) {
        setEditMode(false)
      }
    } catch (error) {
      console.error('Failed to remove custom nav item:', error)
      // Show error feedback to user here if needed
    }
  }

  const moveCustomNavItem = useCallback(async (fromIndex: number, toIndex: number) => {
    setNavItems(prev => {
      const newItems = [...prev]
      const customItems = newItems.filter(item => item.type === 'custom')
      const nonCustomItems = newItems.filter(item => item.type !== 'custom')
      
      // Reorder only custom items
      const movedItem = customItems.splice(fromIndex, 1)[0]
      customItems.splice(toIndex, 0, movedItem)
      
      // Combine back with non-custom items
      return [...nonCustomItems, ...customItems]
    })
    
    // Auto-save after drag
    setTimeout(async () => {
      try {
        const customItems = navItems.filter(item => item.type === 'custom')
        const itemOrders = customItems.map((item, index) => ({
          id: item.id,
          order: index
        }))
        
        await customNavApi.reorderCustomNavItems(accessToken, itemOrders)
        console.log('Custom nav items order saved automatically')
      } catch (error) {
        console.error('Failed to auto-save custom nav items order:', error)
      }
    }, 100) // Small delay to ensure state is updated
  }, [navItems, accessToken])

  const saveCustomNavItemsOrder = useCallback(async () => {
    try {
      const customItems = navItems.filter(item => item.type === 'custom')
      const itemOrders = customItems.map((item, index) => ({
        id: item.id,
        order: index
      }))
      
      await customNavApi.reorderCustomNavItems(accessToken, itemOrders)
      console.log('Custom nav items order saved manually')
    } catch (error) {
      console.error('Failed to save custom nav items order:', error)
    }
  }, [navItems, accessToken])

  // Separate default and custom nav items
  const defaultNavItems = navItems.filter(item => item.type !== 'custom')
  const customNavItems = navItems.filter(item => item.type === 'custom')

  // Navigation customizer helpers
  const categories = [
    { value: 'actress', label: 'Actress', icon: <Users className="h-4 w-4" /> },
    { value: 'actor', label: 'Actor', icon: <User className="h-4 w-4" /> },
    { value: 'series', label: 'Series', icon: <PlayCircle className="h-4 w-4" /> },
    { value: 'studio', label: 'Studio', icon: <Building className="h-4 w-4" /> },
    { value: 'group', label: 'Group', icon: <Globe className="h-4 w-4" /> },
    { value: 'type', label: 'Type', icon: <TagIcon className="h-4 w-4" /> },
    { value: 'tag', label: 'Tag', icon: <TagIcon className="h-4 w-4" /> },
  ]

  const getCategoryData = (category: string) => {
    switch (category) {
      case 'actress': return availableFilters.actresses
      case 'actor': return availableFilters.actors
      case 'series': return availableFilters.series
      case 'studio': return availableFilters.studios
      case 'group': return availableFilters.groups
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

  // Handler for movies filter changes
  const handleMoviesFiltersChange = (filters: typeof moviesFilters) => {
    setMoviesFilters(filters)
  }

  // Handler for advanced search navigation
  const handleAdvancedSearch = () => {
    setContentState({ 
      mode: 'advancedSearch', 
      title: 'Advanced Search' 
    })
    setActiveNavItem('') // Clear active nav item for search mode
  }

  // Tambahkan fungsi pembungkus untuk ProfileContent
  const handlePhotobookSelectProfile = (photobookId: string) => {
    const photobook = photobooks.find(p => p.id === photobookId)
    if (photobook) {
      handlePhotobookSelect(photobook)
    }
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
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem
                    onClick={() => handleNavClick({ id: 'admin', label: 'Admin Panel', type: 'admin' })}
                    className="flex items-center gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Admin Panel
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

              {/* Mobile Menu Toggle */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="md:hidden">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left">
                  <SheetHeader>
                    <SheetTitle>Navigation</SheetTitle>
                  </SheetHeader>
                  
                  <div className="mt-6 space-y-2">
                    {/* Default Navigation Items */}
                    {defaultNavItems.map(item => (
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
                    
                    {/* Custom Navigation Items */}
                    {customNavItems.length > 0 && (
                      <>
                        <Separator className="my-4" />
                        <p className="text-sm font-medium text-muted-foreground mb-2">Custom Filters</p>
                        {customNavItems.map(item => (
                          <div key={item.id} className="flex items-center gap-2">
                            <Button
                              variant={activeNavItem === item.id ? 'default' : 'ghost'}
                              className="flex-1 justify-start"
                              onClick={() => handleNavClick(item)}
                            >
                              {item.icon}
                              {item.label}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeNavItem(item.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </>
                    )}
                    
                    <Separator className="my-4" />
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setShowNavCustomizer(true)}
                    >
                      <Plus className="h-4 w-4" />
                      Add Custom Filter
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Second Row: Custom Navigation Items */}
          {customNavItems.length > 0 && (
            <div className="flex items-center justify-center py-2">
              <div className="hidden md:flex items-center gap-1">
                {customNavItems.map((item, index) => (
                  <DraggableCustomNavItem
                    item={item}
                    index={index}
                    activeNavItem={activeNavItem}
                    editMode={editMode}
                    onNavClick={handleNavClick}
                    onRemove={removeNavItem}
                    onMoveItem={moveCustomNavItem}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Third Row: Search Bar + Advanced Search - Centered */}
          <div className="w-full flex flex-col md:flex-row items-center justify-center py-3 px-4">
            {/* Search Bar Container */}
            <div className="flex w-full max-w-4xl mx-auto gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input
                  placeholder="Search movies, actors, actresses..."
                  value={searchQuery}
                  onChange={(e) => {
                    const q = e.target.value
                    setSearchQuery(q)
                    // Reset movies pagination to first page whenever search changes
                    setMoviesFilters(prev => ({ ...prev, currentPage: 1 }))
                  }}
                  className="pl-12 pr-12 h-12 text-left w-full text-base"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-muted rounded-full"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {/* Advanced Search Button */}
              <Button
                variant="outline"
                size="default"
                onClick={handleAdvancedSearch}
                className="flex items-center gap-2 h-12 px-6 flex-shrink-0 w-48"
              >
                <Filter className="h-4 w-4" />
                Advanced Search
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {contentState.mode === 'admin' ? (
          <Dashboard 
            accessToken={accessToken}
            user={user}
            onLogout={onLogout}
            editingMovie={showEditMovie}
            editingSCMovie={showEditSCMovie}
            editingProfile={showEditProfile}
            onClearEditingMovie={() => setShowEditMovie(null)}
            onClearEditingSCMovie={() => setShowEditSCMovie(null)}
            onClearEditingProfile={() => setShowEditProfile(null)}
            onSwitchToFrontend={() => {
              setContentState({ mode: 'movies', title: 'Movies' })
              setActiveNavItem('movies')
              setShowEditMovie(null)
              setShowEditSCMovie(null)
              setShowEditProfile(null)
            }}
            onDataChanged={reloadData}
          />
        ) : (
          <div className="space-y-6">
            {/* Content Header - Hidden for detail views and profile (profile has its own header) */}
            {contentState.mode !== 'movieDetail' && contentState.mode !== 'scMovieDetail' && contentState.mode !== 'photobookDetail' && contentState.mode !== 'groupDetail' && contentState.mode !== 'profile' && (
              <div className="flex items-center justify-between">
                {/* Show back button with title for filtered views, just title for main views */}
                {contentState.mode === 'filteredMovies' ? (
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-4">
                      <Button 
                        variant="outline" 
                        onClick={handleBack}
                        className="flex items-center gap-2"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                      </Button>
                      <h2 className="text-2xl font-bold">{contentState.title}</h2>
                    </div>
                  </div>
                ) : (
                  <h2 className="text-2xl font-bold">{contentState.title}</h2>
                )}
              </div>
            )}

            {/* Dynamic Content */}
            {contentState.mode === 'movies' && (
              <MoviesContent
                movies={movies}
                searchQuery={searchQuery}
                onMovieSelect={handleMovieSelect}
                actresses={actresses}
                actors={actors}
                directors={directors}
                onProfileSelect={handleProfileSelect}
                accessToken={accessToken}
                externalFilters={moviesFilters}
                onFiltersChange={handleMoviesFiltersChange}
              />
            )}

            {contentState.mode === 'soft' && (
              <SoftContent
                searchQuery={searchQuery}
                accessToken={accessToken}
                onSCMovieSelect={handleSCMovieSelect}
              />
            )}

            {contentState.mode === 'actors' && (
              <ActorsContent
                actors={actors}
                searchQuery={searchQuery}
                onProfileSelect={handleProfileSelect}
                accessToken={accessToken}
              />
            )}

            {contentState.mode === 'actresses' && (
              <ActressesContent
                actresses={actresses}
                searchQuery={searchQuery}
                onProfileSelect={handleProfileSelect}
                accessToken={accessToken}
              />
            )}

            {contentState.mode === 'photobooks' && (
              <PhotobooksContent
                accessToken={accessToken}
                onPhotobookSelect={handlePhotobookSelect}
                searchQuery={searchQuery}
              />
            )}

            {contentState.mode === 'scMovieDetail' && (
              <SCMovieDetailContent
                scMovie={contentState.data}
                onBack={handleBack}
                onEdit={handleEditSCMovie}
                onMovieSelect={handleMovieSelect}
                accessToken={accessToken}
              />
            )}

            {contentState.mode === 'favorites' && (
              <SimpleFavoritesContent
                accessToken={accessToken}
                onMovieSelect={handleMovieSelect}
                onPhotobookSelect={handlePhotobookSelect}
                onProfileSelect={handleProfileSelect}
                onFilterSelect={handleFilterSelect}
                searchQuery={searchQuery}
              />
            )}

            {contentState.mode === 'series' && (
              <SeriesContent
                movies={movies}
                searchQuery={searchQuery}
                onFilterSelect={handleFilterSelect}
                accessToken={accessToken}
              />
            )}

            {contentState.mode === 'studios' && (
              <StudiosContent
                movies={movies}
                searchQuery={searchQuery}
                onFilterSelect={handleFilterSelect}
              />
            )}

            {contentState.mode === 'groups' && (
              <GroupsContent
                accessToken={accessToken}
                searchQuery={searchQuery}
                onProfileSelect={handleProfileSelect}
                onGroupSelect={handleGroupSelect}
                selectedGroupFromNavigation={contentState.data?.selectedGroup}
                actresses={actresses}
              />
            )}

            {contentState.mode === 'groupDetail' && contentState.data && (
              <GroupDetailContent
                group={contentState.data}
                accessToken={accessToken}
                searchQuery={searchQuery}
                onBack={handleBack}
                onProfileSelect={handleProfileSelect}
              />
            )}

            {contentState.mode === 'tags' && (
              <TagsContent
                movies={movies}
                searchQuery={searchQuery}
                onFilterSelect={handleFilterSelect}
              />
            )}

            {contentState.mode === 'movieDetail' && contentState.data && (
              <MovieDetailContent
                movie={contentState.data}
                accessToken={accessToken}
                onMovieSelect={handleMovieSelect}
                onProfileSelect={handleProfileSelect}
                onFilterSelect={handleFilterSelect}
                onEditMovie={handleEditMovie}
                showEditButton={true}
                onBack={handleBack}
                onMovieUpdated={(updatedMovie) => {
                  // Update the movie in the movies list
                  setMovies(prev => prev.map(m => m.id === updatedMovie.id ? updatedMovie : m))
                  // Update the current content state to reflect changes
                  setContentState(prev => ({
                    ...prev,
                    data: updatedMovie,
                    title: updatedMovie.titleEn || updatedMovie.titleJp || 'Movie Details'
                  }))
                }}
              />
            )}

            {contentState.mode === 'photobookDetail' && contentState.data && (
              <PhotobookDetailContent
                photobook={contentState.data}
                accessToken={accessToken}
                onBack={handleBack}
                onProfileSelect={handleProfileSelect}
                showEditButton={true}
                onPhotobookUpdated={(updatedPhotobook) => {
                  // Update the photobook in the photobooks list
                  setPhotobooks(prev => prev.map(p => p.id === updatedPhotobook.id ? updatedPhotobook : p))
                  // Update the current content state to reflect changes
                  setContentState(prev => ({
                    ...prev,
                    data: updatedPhotobook,
                    title: updatedPhotobook.titleEn || updatedPhotobook.titleJp || 'Photobook Details'
                  }))
                }}
              />
            )}

            {contentState.mode === 'profile' && contentState.data && (
              <ProfileContent
                type={contentState.data.type}
                name={contentState.data.name}
                accessToken={accessToken}
                onBack={handleBack}
                onMovieSelect={handleMovieSelect}
                onSCMovieSelect={undefined}
                onPhotobookSelect={handlePhotobookSelectProfile}
                onGroupSelect={undefined}
                onEditProfile={handleEditProfile}
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
                actorName={contentState.data.actorName}
                actressName={contentState.data.actressName}
                accessToken={accessToken}
              />
            )}

            {contentState.mode === 'filteredActresses' && contentState.data && (
              <FilteredActressesContent
                filterType={contentState.data.filterType}
                filterValue={contentState.data.filterValue}
                searchQuery={searchQuery}
                onProfileSelect={handleProfileSelect}
                accessToken={accessToken}
              />
            )}

            {contentState.mode === 'advancedSearch' && (
              <AdvancedSearchContent
                accessToken={accessToken}
                onBack={handleBack}
                onMovieClick={handleMovieSelect}
              />
            )}
          </div>
        )}
      </main>

      {/* Navigation Customizer Dialog */}
      <Dialog open={showNavCustomizer} onOpenChange={setShowNavCustomizer}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Custom Filter</DialogTitle>
            <DialogDescription>
              Create a quick access filter for your navigation bar.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Edit Mode Toggle */}
            {customNavItems.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Edit Mode</span>
                    {editMode && (
                      <span className="text-xs text-muted-foreground">
                        Drag items to reorder • Click X to remove
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {editMode && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={saveCustomNavItemsOrder}
                      className="text-xs"
                    >
                      Save Order
                    </Button>
                  )}
                  <Button
                    variant={editMode ? "destructive" : "outline"}
                    size="sm"
                    onClick={() => setEditMode(!editMode)}
                    className="text-xs"
                  >
                    {editMode ? 'Exit Edit' : 'Edit Items'}
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
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
                <PopoverContent className="w-full p-0">
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

            {selectedCategory && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Item</label>
                <Popover open={itemOpen} onOpenChange={setItemOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={itemOpen}
                      className="w-full justify-between"
                    >
                      {selectedItem || "Select item..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search item..." />
                      <CommandEmpty>No item found.</CommandEmpty>
                      <CommandGroup>
                        {getCategoryData(selectedCategory).map((item) => (
                          <CommandItem
                            key={item}
                            value={item}
                            onSelect={() => {
                              setSelectedItem(item)
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
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowNavCustomizer(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddCustomNavItem}
              disabled={!selectedCategory || !selectedItem || customNavLoading}
            >
              {customNavLoading ? 'Adding...' : 'Add Filter'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}