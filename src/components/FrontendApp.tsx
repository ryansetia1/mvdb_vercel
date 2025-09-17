import { useState, useEffect, useRef } from 'react'
import { useTokenAwareDataLoad } from '../hooks/useTokenAwareEffect'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { MovieCard } from './MovieCard'
import { MoviePage } from './MoviePage'
import { ProfileContent } from './ProfileContent'
import { Movie, movieApi } from '../utils/movieApi'
import { MasterDataItem, masterDataApi, calculateAge } from '../utils/masterDataApi'
import { 
  Search, 
  Film, 
  Users, 
  User, 
  Building, 
  Tag as TagIcon, 
  PlayCircle,
  Menu,
  X,
  Plus,
  Settings,
  ArrowLeft
} from 'lucide-react'

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Separator } from './ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'

interface FrontendAppProps {
  accessToken: string
  user: any
  onLogout: () => void
  onSwitchToAdmin: (movieToEdit?: any) => void
}

interface NavItem {
  id: string
  label: string
  type: 'movies' | 'actors' | 'actresses' | 'directors' | 'series' | 'studios' | 'tags' | 'custom'
  filterType?: string
  filterValue?: string
  icon?: React.ReactNode
}

type ViewMode = 'main' | 'movieDetail' | 'profile'

interface ProfileView {
  type: 'actor' | 'actress' | 'director'
  name: string
}

export function FrontendApp({ accessToken, user, onLogout, onSwitchToAdmin }: FrontendAppProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('main')
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)
  const [profileView, setProfileView] = useState<ProfileView | null>(null)
  
  const [movies, setMovies] = useState<Movie[]>([])
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Master data states
  const [actors, setActors] = useState<MasterDataItem[]>([])
  const [actresses, setActresses] = useState<MasterDataItem[]>([])
  const [directors, setDirectors] = useState<MasterDataItem[]>([])
  const [groups, setGroups] = useState<MasterDataItem[]>([])
  const [series, setSeries] = useState<string[]>([])
  const [studios, setStudios] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])
  
  const [navItems, setNavItems] = useState<NavItem[]>([
    { id: 'movies', label: 'Movies', type: 'movies', icon: <Film className="h-4 w-4" /> },
    { id: 'actors', label: 'Actors', type: 'actors', icon: <User className="h-4 w-4" /> },
    { id: 'actresses', label: 'Actresses', type: 'actresses', icon: <Users className="h-4 w-4" /> },
    { id: 'series', label: 'Series', type: 'series', icon: <PlayCircle className="h-4 w-4" /> },
    { id: 'studios', label: 'Studios', type: 'studios', icon: <Building className="h-4 w-4" /> },
    { id: 'tags', label: 'Tags', type: 'tags', icon: <TagIcon className="h-4 w-4" /> },
  ])
  
  const [activeNavItem, setActiveNavItem] = useState('movies')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // Search input ref for auto-focus
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [showNavCustomizer, setShowNavCustomizer] = useState(false)
  
  // Custom navigation states
  const [availableFilters, setAvailableFilters] = useState<{
    actors: string[]
    actresses: string[]
    directors: string[]
    groups: string[]
    series: string[]
    studios: string[]
    types: string[]
    tags: string[]
  }>({
    actors: [],
    actresses: [],
    directors: [],
    groups: [],
    series: [],
    studios: [],
    types: [],
    tags: []
  })

  // Separate default and custom nav items
  const defaultNavItems = navItems.filter(item => item.type !== 'custom')
  const customNavItems = navItems.filter(item => item.type === 'custom')

  // Load initial data
  const loadData = async () => {
      try {
        setIsLoading(true)
        console.log('Loading movies with access token:', accessToken?.substring(0, 10) + '...')
        
        // Load movies first
        const moviesData = await movieApi.getMovies(accessToken)
        console.log('Loaded movies:', moviesData?.length || 0)
        
        setMovies(moviesData || [])
        setFilteredMovies(moviesData || [])
        
        // Try to load master data
        try {
          const [actorsData, actressesData, directorsData, groupsData] = await Promise.all([
            masterDataApi.getByType('actor', accessToken).catch(err => {
              console.warn('Failed to load actors:', err)
              return []
            }),
            masterDataApi.getByType('actress', accessToken).catch(err => {
              console.warn('Failed to load actresses:', err)
              return []
            }),
            masterDataApi.getByType('director', accessToken).catch(err => {
              console.warn('Failed to load directors:', err)
              return []
            }),
            masterDataApi.getByType('group', accessToken).catch(err => {
              console.warn('Failed to load groups:', err)
              return []
            })
          ])
          
          // Create group lookup map
          const groupMap = groupsData.reduce((acc, group) => {
            acc[group.id] = group
            return acc
          }, {} as Record<string, MasterDataItem>)

          // Add calculated age and movie counts to master data items
          const addMovieStats = (people: MasterDataItem[], type: 'actor' | 'actress' | 'director') => {
            return people.map(person => {
              const fieldToCheck = type === 'director' ? 'director' : type === 'actor' ? 'actors' : 'actress'
              const personMovies = moviesData.filter(movie => {
                const field = movie[fieldToCheck]
                if (typeof field === 'string') {
                  return field.toLowerCase().includes(person.name?.toLowerCase() || '')
                }
                return false
              })

              // For actresses, determine which photo to use based on group assignment
              let photoUrl = person.profilePicture || (person.photo && person.photo[0])
              let groupName = undefined
              
              if (type === 'actress' && person.groupId && groupMap[person.groupId]) {
                const group = groupMap[person.groupId]
                groupName = group.name
                // When showing actresses in group context, you could use group profile picture
                // For now, we'll keep individual photos but store group info for later use
              }

              return {
                ...person,
                age: person.birthdate ? calculateAge(person.birthdate) : undefined,
                photoUrl,
                groupName,
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
          setGroups(groupsData)
          
          // Extract unique filter values
          const uniqueActors = [...new Set(actorsData.map(a => a.name).filter(Boolean))]
          const uniqueActresses = [...new Set(actressesData.map(a => a.name).filter(Boolean))]
          const uniqueDirectors = [...new Set(directorsData.map(d => d.name).filter(Boolean))]
          const uniqueGroups = [...new Set(groupsData.map(g => g.name).filter(Boolean))]
          const uniqueSeries = [...new Set(moviesData.map(m => m.series).filter(Boolean))]
          const uniqueStudios = [...new Set(moviesData.map(m => m.studio).filter(Boolean))]
          const uniqueTypes = [...new Set(moviesData.map(m => m.type).filter(Boolean))]
          
          // Extract and flatten tags
          const allTags = moviesData.flatMap(m => 
            m.tags ? m.tags.split(',').map(tag => tag.trim()).filter(Boolean) : []
          )
          const uniqueTags = [...new Set(allTags)]
          
          setSeries(uniqueSeries)
          setStudios(uniqueStudios)
          setTags(uniqueTags)
          
          setAvailableFilters({
            actors: uniqueActors,
            actresses: uniqueActresses,
            directors: uniqueDirectors,
            groups: uniqueGroups,
            series: uniqueSeries,
            studios: uniqueStudios,
            types: uniqueTypes,
            tags: uniqueTags
          })
        } catch (masterDataError) {
          console.warn('Failed to load master data, continuing with movies only:', masterDataError)
        }
        
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setIsLoading(false)
      }
  }

  // Use token-aware data loading to prevent unnecessary reloads on token refresh
  useTokenAwareDataLoad(loadData, accessToken)

  // Filter content based on search and active navigation
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMovies(movies)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = movies.filter(movie =>
        movie.titleEn?.toLowerCase().includes(query) ||
        movie.titleJp?.toLowerCase().includes(query) ||
        movie.code?.toLowerCase().includes(query) ||
        movie.actress?.toLowerCase().includes(query) ||
        movie.actors?.toLowerCase().includes(query) ||
        movie.director?.toLowerCase().includes(query) ||
        movie.studio?.toLowerCase().includes(query) ||
        movie.series?.toLowerCase().includes(query) ||
        movie.tags?.toLowerCase().includes(query)
      )
      setFilteredMovies(filtered)
    }
  }, [searchQuery, movies])

  // Auto-focus search bar when navigation changes
  useEffect(() => {
    const focusSearchBar = (retryCount = 0) => {
      if (searchInputRef.current) {
        console.log('Auto-focusing search bar...')
        
        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
          if (searchInputRef.current) {
            // Scroll to search bar first to ensure it's visible
            searchInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
            
            // Focus with a small delay to ensure scroll completes
            setTimeout(() => {
              if (searchInputRef.current) {
                // Try multiple focus methods
                searchInputRef.current.focus()
                searchInputRef.current.click()
                
                // Also select all text for better UX
                searchInputRef.current.select()
                
                // Force focus with preventDefault
                searchInputRef.current.focus({ preventScroll: false })
                
                // Dispatch focus event manually
                const focusEvent = new Event('focus', { bubbles: true })
                searchInputRef.current.dispatchEvent(focusEvent)
              }
            }, 150)
          }
        })
      } else if (retryCount < 5) {
        console.log(`Search input ref not available, retrying... (${retryCount + 1}/5)`)
        // Retry with exponential backoff
        setTimeout(() => focusSearchBar(retryCount + 1), 200 * (retryCount + 1))
      } else {
        console.log('Search input ref not available after 5 retries')
      }
    }
    
    // Use a longer timeout to ensure DOM is updated
    const timeoutId = setTimeout(() => focusSearchBar(), 500)
    
    return () => clearTimeout(timeoutId)
  }, [activeNavItem])

  // Auto-focus search bar on initial app load
  useEffect(() => {
    const focusOnLoad = (retryCount = 0) => {
      if (searchInputRef.current) {
        console.log('Auto-focusing search bar on app load...')
        
        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
          if (searchInputRef.current) {
            // Focus with a small delay to ensure everything is loaded
            setTimeout(() => {
              if (searchInputRef.current) {
                // Try multiple focus methods
                searchInputRef.current.focus()
                searchInputRef.current.click()
                
                // Also select all text for better UX
                searchInputRef.current.select()
                
                // Force focus with preventDefault
                searchInputRef.current.focus({ preventScroll: false })
                
                // Dispatch focus event manually
                const focusEvent = new Event('focus', { bubbles: true })
                searchInputRef.current.dispatchEvent(focusEvent)
              }
            }, 500) // Longer delay for initial load
          }
        })
      } else if (retryCount < 10) {
        console.log(`Search input ref not available on load, retrying... (${retryCount + 1}/10)`)
        // Retry with exponential backoff
        setTimeout(() => focusOnLoad(retryCount + 1), 500 * (retryCount + 1))
      } else {
        console.log('Search input ref not available on load after 10 retries')
      }
    }
    
    // Focus on initial load with longer timeout
    const timeoutId = setTimeout(() => focusOnLoad(), 2000)
    
    return () => clearTimeout(timeoutId)
  }, []) // Empty dependency array means this runs only once on mount

  // Navigation handlers
  const handleNavClick = (navItem: NavItem) => {
    setActiveNavItem(navItem.id)
    setMobileMenuOpen(false)
    setViewMode('main')
    setSelectedMovie(null)
    setProfileView(null)
  }

  const handleMovieSelect = (movie: Movie) => {
    setSelectedMovie(movie)
    setViewMode('movieDetail')
  }

  const handleProfileSelect = (type: 'actor' | 'actress' | 'director', name: string) => {
    setProfileView({ type, name })
    setViewMode('profile')
    // Update active nav item to show we're viewing a profile
    setActiveNavItem('profile')
  }

  const handleBack = () => {
    if (viewMode === 'profile') {
      // Return to the appropriate category when coming back from profile
      if (profileView?.type === 'actor') {
        setActiveNavItem('actors')
      } else if (profileView?.type === 'actress') {
        setActiveNavItem('actresses')
      } else if (profileView?.type === 'director') {
        setActiveNavItem('directors')
      } else {
        setActiveNavItem('movies') // fallback
      }
    }
    setViewMode('main')
    setSelectedMovie(null)
    setProfileView(null)
  }

  const addCustomNavItem = (type: string, value: string, label?: string) => {
    const newNavItem: NavItem = {
      id: `custom-${Date.now()}`,
      label: label || value,
      type: 'custom',
      filterType: type,
      filterValue: value,
      icon: <TagIcon className="h-4 w-4" />
    }
    
    setNavItems(prev => [...prev, newNavItem])
    setShowNavCustomizer(false)
  }

  const removeNavItem = (itemId: string) => {
    setNavItems(prev => prev.filter(item => item.id !== itemId))
    if (activeNavItem === itemId) {
      setActiveNavItem('movies')
    }
  }

  const handleActressClick = (actress: string, e: React.MouseEvent) => {
    e.stopPropagation()
    handleProfileSelect('actress', actress)
  }

  const handleCategoryItemClick = (type: string, value: string) => {
    if (type === 'series') {
      const seriesMovies = movies.filter(movie => movie.series === value)
      setFilteredMovies(seriesMovies)
      setActiveNavItem('movies')
    } else if (type === 'studio') {
      const studioMovies = movies.filter(movie => movie.studio === value)
      setFilteredMovies(studioMovies)
      setActiveNavItem('movies')
    } else if (type === 'tag') {
      const tagMovies = movies.filter(movie => {
        const movieTags = movie.tags ? movie.tags.split(',').map(tag => tag.trim()) : []
        return movieTags.includes(value)
      })
      setFilteredMovies(tagMovies)
      setActiveNavItem('movies')
    }
  }

  // Get current content to display in main area
  const getCurrentContent = () => {
    const query = searchQuery.toLowerCase()

    // Handle custom navigation items
    if (activeNavItem.startsWith('custom-')) {
      const customItem = navItems.find(item => item.id === activeNavItem)
      if (customItem && customItem.filterType && customItem.filterValue) {
        const customMovies = movies.filter(movie => {
          switch (customItem.filterType) {
            case 'actress':
              return movie.actress?.toLowerCase().includes(customItem.filterValue!.toLowerCase())
            case 'actor':
              return movie.actors?.toLowerCase().includes(customItem.filterValue!.toLowerCase())
            case 'director':
              return movie.director?.toLowerCase().includes(customItem.filterValue!.toLowerCase())
            case 'series':
              return movie.series === customItem.filterValue
            case 'studio':
              return movie.studio === customItem.filterValue
            case 'tag':
              const movieTags = movie.tags ? movie.tags.split(',').map(tag => tag.trim()) : []
              return movieTags.some(tag => tag.toLowerCase().includes(customItem.filterValue!.toLowerCase()))
            case 'type':
              return movie.type === customItem.filterValue
            case 'group':
              // Filter movies by actresses in the selected group
              if (!movie.actress) return false
              const movieActresses = movie.actress.split(',').map(name => name.trim().toLowerCase())
              return actresses.some(actress => 
                actress.groupName === customItem.filterValue &&
                movieActresses.some(movieActress => 
                  movieActress.includes(actress.name?.toLowerCase() || '')\n                )\n              )
            default:
              return false
          }
        })
        return { type: 'movies', data: customMovies }
      }
    }

    switch (activeNavItem) {
      case 'movies':
        return { type: 'movies', data: filteredMovies }
      case 'actors':
        const filteredActors = query ? actors.filter(actor => 
          actor.name?.toLowerCase().includes(query)
        ) : actors
        return { type: 'actors', data: filteredActors }
      case 'actresses':
        const filteredActresses = query ? actresses.filter(actress => 
          actress.name?.toLowerCase().includes(query)
        ) : actresses
        return { type: 'actresses', data: filteredActresses }
      case 'directors':
        const filteredDirectors = query ? directors.filter(director => 
          director.name?.toLowerCase().includes(query)
        ) : directors
        return { type: 'directors', data: filteredDirectors }
      case 'series':
        const filteredSeries = query ? series.filter(s => 
          s.toLowerCase().includes(query)
        ) : series
        return { type: 'series', data: filteredSeries }
      case 'studios':
        const filteredStudios = query ? studios.filter(studio => 
          studio.toLowerCase().includes(query)
        ) : studios
        return { type: 'studios', data: filteredStudios }
      case 'tags':
        const filteredTags = query ? tags.filter(tag => 
          tag.toLowerCase().includes(query)
        ) : tags
        return { type: 'tags', data: filteredTags }
      default:
        return { type: 'movies', data: filteredMovies }
    }
  }

  const renderNavigationCustomizer = () => (
    <Dialog open={showNavCustomizer} onOpenChange={setShowNavCustomizer}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customize Navigation</DialogTitle>
          <DialogDescription>
            Add custom navigation items for quick access to specific filters
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Current Navigation Items */}
          <div>
            <h4 className="font-medium mb-3">Current Navigation Items</h4>
            <div className="space-y-2">
              {navItems.map(item => (
                <div key={item.id} className="flex items-center justify-between p-2 border rounded-lg">
                  <div className="flex items-center gap-2">
                    {item.icon}
                    <span>{item.label}</span>
                    {item.type === 'custom' && (
                      <Badge variant="outline" className="text-xs">Custom</Badge>
                    )}
                  </div>
                  {item.type === 'custom' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeNavItem(item.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Add Custom Items */}
          <div className="space-y-4">
            <h4 className="font-medium">Add Custom Navigation Items</h4>
            
            {/* Actors */}
            {availableFilters.actors.length > 0 && (
              <div>
                <h5 className="text-sm font-medium mb-2">Actors</h5>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {availableFilters.actors.slice(0, 20).map(actor => (
                    <Button
                      key={actor}
                      variant="outline"
                      size="sm"
                      className="justify-start text-xs"
                      onClick={() => addCustomNavItem('actor', actor)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {actor}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Actresses */}
            {availableFilters.actresses.length > 0 && (
              <div>
                <h5 className="text-sm font-medium mb-2">Actresses</h5>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {availableFilters.actresses.slice(0, 20).map(actress => (
                    <Button
                      key={actress}
                      variant="outline"
                      size="sm"
                      className="justify-start text-xs"
                      onClick={() => addCustomNavItem('actress', actress)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {actress}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Groups */}
            {availableFilters.groups.length > 0 && (
              <div>
                <h5 className="text-sm font-medium mb-2">Actress Groups</h5>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {availableFilters.groups.slice(0, 20).map(group => (
                    <Button
                      key={group}
                      variant="outline"
                      size="sm"
                      className="justify-start text-xs"
                      onClick={() => addCustomNavItem('group', group)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {group}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Studios */}
            {availableFilters.studios.length > 0 && (
              <div>
                <h5 className="text-sm font-medium mb-2">Studios</h5>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {availableFilters.studios.slice(0, 20).map(studio => (
                    <Button
                      key={studio}
                      variant="outline"
                      size="sm"
                      className="justify-start text-xs"
                      onClick={() => addCustomNavItem('studio', studio)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {studio}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Series */}
            {availableFilters.series.length > 0 && (
              <div>
                <h5 className="text-sm font-medium mb-2">Series</h5>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {availableFilters.series.slice(0, 20).map(series => (
                    <Button
                      key={series}
                      variant="outline"
                      size="sm"
                      className="justify-start text-xs"
                      onClick={() => addCustomNavItem('series', series)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {series}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {availableFilters.tags.length > 0 && (
              <div>
                <h5 className="text-sm font-medium mb-2">Tags</h5>
                <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                  {availableFilters.tags.slice(0, 30).map(tag => (
                    <Button
                      key={tag}
                      variant="outline"
                      size="sm"
                      className="justify-start text-xs"
                      onClick={() => addCustomNavItem('tag', tag)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {tag}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )

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

  // Movie detail view
  if (viewMode === 'movieDetail' && selectedMovie) {
    return (
      <MoviePage
        movie={selectedMovie}
        accessToken={accessToken}
        onBack={handleBack}
        showEditButton={true}
        isAdminMode={false}
        onEdit={(movie) => {
          onSwitchToAdmin(movie)
        }}
      />
    )
  }

  const currentContent = getCurrentContent()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Top Row: Logo + Default Navigation + User Controls */}
          <div className="flex items-center justify-between h-16">
            {/* Logo/Brand */}
            <div className="flex items-center gap-4">
              <Film className="h-8 w-8 text-primary" />
              <h1 className="text-xl font-bold">Movie Database</h1>
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
                <Settings className="h-4 w-4" />
              </Button>
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={onSwitchToAdmin}
                className="hidden sm:flex"
              >
                Admin Panel
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onLogout}
              >
                Logout
              </Button>

              {/* Mobile menu button */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="md:hidden">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Navigation</SheetTitle>
                  </SheetHeader>
                  <div className="grid gap-2 py-6">
                    {navItems.map(item => (
                      <Button
                        key={item.id}
                        variant={activeNavItem === item.id ? 'default' : 'ghost'}
                        onClick={() => handleNavClick(item)}
                        className="justify-start"
                      >
                        {item.icon}
                        {item.label}
                      </Button>
                    ))}
                    
                    <Separator className="my-4" />
                    
                    <Button
                      variant="outline"
                      onClick={onSwitchToAdmin}
                    >
                      Admin Panel
                    </Button>
                    
                    <Button
                      variant="ghost"
                      onClick={() => setShowNavCustomizer(true)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Customize Navigation
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Second Row: Custom Navigation Items (left-aligned) */}
          {customNavItems.length > 0 && (
            <div className="border-t border-border/50 py-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground mr-2">Custom:</span>
                {customNavItems.map(item => (
                  <div key={item.id} className="flex items-center">
                    <Button
                      variant={activeNavItem === item.id ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => handleNavClick(item)}
                      className="flex items-center gap-2 pr-2"
                    >
                      {item.icon}
                      {item.label}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeNavItem(item.id)}
                      className="h-8 w-8 p-0 -ml-2 opacity-60 hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Third Row: Search Bar */}
          <div className="border-t border-border/50 py-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Search movies, actors, directors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {viewMode === 'profile' && profileView ? (
          <div className="space-y-4">
            {/* Back Button */}
            <Button
              onClick={handleBack}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            {/* Profile Content */}
            <ProfileContent
              type={profileView.type}
              name={profileView.name}
              accessToken={accessToken}
              onMovieSelect={handleMovieSelect}
            />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                {navItems.find(item => item.id === activeNavItem)?.label || 'Content'}
              </h2>
              <Badge variant="outline">
                {currentContent.data.length} {currentContent.type}
              </Badge>
            </div>

            {currentContent.data.length > 0 ? (
              <>
                {/* Movies Grid */}
                {currentContent.type === 'movies' && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {(currentContent.data as Movie[]).map((movie) => (
                      <MovieCard
                        key={movie.id}
                        movie={movie}
                        onMovieClick={handleMovieSelect}
                        onActressClick={handleActressClick}
                      />
                    ))}
                  </div>
                )}

                {/* Actors/Actresses/Directors Grid */}
                {(currentContent.type === 'actors' || currentContent.type === 'actresses' || currentContent.type === 'directors') && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {(currentContent.data as MasterDataItem[]).map((person) => {
                      // Convert plural content type to singular for ProfileContent
                      const personType = currentContent.type === 'actors' ? 'actor' : 
                                        currentContent.type === 'actresses' ? 'actress' : 'director'
                      
                      return (
                        <Card key={person.id} className="cursor-pointer hover:shadow-md transition-shadow" 
                              onClick={() => handleProfileSelect(personType, person.name || '')}>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={person.photoUrl} alt={person.name} />
                                <AvatarFallback>
                                  {person.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium truncate">{person.name}</h3>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  {person.age && <span>{person.age} years</span>}
                                  {person.movieCount !== undefined && (
                                    <>
                                      {person.age && <span>•</span>}
                                      <span>{person.movieCount} movies</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}

                {/* Series/Studios/Tags Grid */}
                {(currentContent.type === 'series' || currentContent.type === 'studios' || currentContent.type === 'tags') && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {(currentContent.data as string[]).map((item) => {
                      const movieCount = movies.filter(movie => {
                        if (currentContent.type === 'series') return movie.series === item
                        if (currentContent.type === 'studios') return movie.studio === item
                        if (currentContent.type === 'tags') {
                          const movieTags = movie.tags ? movie.tags.split(',').map(tag => tag.trim()) : []
                          return movieTags.includes(item)
                        }
                        return false
                      }).length

                      return (
                        <Card key={item} className="cursor-pointer hover:shadow-md transition-shadow"
                              onClick={() => handleCategoryItemClick(currentContent.type === 'studios' ? 'studio' : 
                                                                    currentContent.type === 'series' ? 'series' : 'tag', item)}>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                                {currentContent.type === 'series' && <PlayCircle className="h-6 w-6" />}
                                {currentContent.type === 'studios' && <Building className="h-6 w-6" />}
                                {currentContent.type === 'tags' && <TagIcon className="h-6 w-6" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium truncate">{item}</h3>
                                <p className="text-sm text-muted-foreground">{movieCount} movies</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <Film className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery ? `No ${currentContent.type} found matching your search.` : `No ${currentContent.type} available.`}
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Navigation Customizer Dialog */}
      {renderNavigationCustomizer()}
    </div>
  )
}