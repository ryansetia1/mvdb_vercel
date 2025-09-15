import { useState, useEffect, useMemo } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  ImageOff, 
  Filter, 
  Images, 
  Globe,
  Maximize
} from 'lucide-react'
import { MasterDataItem, masterDataApi, calculateAge } from '../../utils/masterDataApi'
import { Movie, movieApi } from '../../utils/movieApi'
import { useCachedData } from '../../hooks/useCachedData'
import { LineupDisplay } from '../LineupDisplay'
import { SimpleFavoriteButton } from '../SimpleFavoriteButton'
import { ModernLightbox } from '../ModernLightbox'
import { toast } from 'sonner@2.0.3'

interface GroupDetailContentProps {
  group: MasterDataItem
  accessToken: string
  searchQuery?: string
  onBack: () => void
  onProfileSelect: (type: 'actress' | 'actor', name: string) => void
}

const sortOptions = [
  { key: 'name', label: 'Name (A-Z)', getValue: (actress: MasterDataItem) => actress.name?.toLowerCase() || '' },
  { key: 'name-desc', label: 'Name (Z-A)', getValue: (actress: MasterDataItem) => actress.name?.toLowerCase() || '' },
  { key: 'age', label: 'Age (Young)', getValue: (actress: MasterDataItem) => actress.birthdate ? calculateAge(actress.birthdate) : 999 },
  { key: 'age-desc', label: 'Age (Old)', getValue: (actress: MasterDataItem) => actress.birthdate ? calculateAge(actress.birthdate) : 0 },
  { key: 'movieCount', label: 'Movies (Few)', getValue: (actress: MasterDataItem) => actress.movieCount || 0 },
  { key: 'movieCount-desc', label: 'Movies (Many)', getValue: (actress: MasterDataItem) => actress.movieCount || 0 },
]

export function GroupDetailContent({ 
  group, 
  accessToken, 
  searchQuery = '', 
  onBack, 
  onProfileSelect 
}: GroupDetailContentProps) {
  const { loadData: loadCachedData } = useCachedData()
  const [actresses, setActresses] = useState<MasterDataItem[]>([])
  const [groupMembers, setGroupMembers] = useState<MasterDataItem[]>([])
  const [generations, setGenerations] = useState<MasterDataItem[]>([])
  const [movies, setMovies] = useState<Movie[]>([])
  const [sortBy, setSortBy] = useState('name')
  const [isLoading, setIsLoading] = useState(true)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxImages, setLightboxImages] = useState<string[]>([])
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [lightboxTitle, setLightboxTitle] = useState('')
  const [activeTab, setActiveTab] = useState('members')
  const [selectedGenerationId, setSelectedGenerationId] = useState<string | null>(null)
  const [generationActresses, setGenerationActresses] = useState<MasterDataItem[]>([])
  const [lineupRefreshKey, setLineupRefreshKey] = useState(0)

  useEffect(() => {
    // Clear cache first to ensure fresh data
    localStorage.removeItem('mvdb_cached_data')
    console.log('Cache cleared for fresh data')
    loadActresses()
  }, [accessToken, group.id]) // Use group.id instead of group.name to prevent unnecessary re-renders

  const loadActresses = async () => {
    try {
      setIsLoading(true)
      
      console.log('=== GroupDetailContent: Loading actresses ===')
      console.log('Group name:', group.name)
      console.log('Group object:', group)
      
      // Load both actresses and movies data using cached system
      const [actressesData, moviesData] = await Promise.all([
        loadCachedData('actresses', () => masterDataApi.getByType('actress', accessToken)) as Promise<MasterDataItem[]>,
        loadCachedData('movies', () => movieApi.getMovies(accessToken)) as Promise<Movie[]>
      ])
      
      console.log('Actresses data count:', actressesData?.length || 0)
      console.log('Sample actress data (FRESH):', actressesData?.[0])
      console.log('Sample actress selectedGroups:', actressesData?.[0]?.selectedGroups)
      console.log('Sample actress groupId:', actressesData?.[0]?.groupId)
      console.log('Sample actress groupName:', actressesData?.[0]?.groupName)
      
      setMovies(moviesData || [])
      
      // Calculate movie counts for each actress
      const actressesWithMovieCount = (actressesData || []).map(actress => {
        const actressMovies = (moviesData || []).filter(movie => {
          const actressField = movie.actress
          if (typeof actressField === 'string') {
            return actressField.toLowerCase().includes(actress.name?.toLowerCase() || '')
          }
          return false
        })
        
        return {
          ...actress,
          movieCount: actressMovies.length
        }
      })
      
      // Filter actresses that belong to this group
      console.log('Filtering actresses for group:', group.name)
      console.log('Group name type:', typeof group.name, 'Length:', group.name?.length)
      
      // Debug: Check first few actresses for group data (reduced logging)
      console.log('=== DEBUGGING ACTRESS DATA ===')
      console.log('Group being searched:', { id: group.id, name: group.name })
      console.log('Sample actress data:', actressesWithMovieCount.slice(0, 2).map(a => ({
        name: a.name,
        selectedGroups: a.selectedGroups,
        groupId: a.groupId,
        groupName: a.groupName
      })))
      
      // Use comprehensive logic to check group membership
      const members = actressesWithMovieCount.filter(actress => {
        const hasSelectedGroups = actress.selectedGroups && actress.selectedGroups.includes(group.name)
        const hasGroupId = actress.groupId === group.id
        const hasGroupData = actress.groupData && actress.groupData[group.id]
        
        const isInGroup = hasSelectedGroups || hasGroupId || hasGroupData
        
        if (isInGroup) {
          console.log(`✓ ${actress.name} is in group ${group.name}:`, {
            selectedGroups: actress.selectedGroups,
            groupId: actress.groupId,
            groupData: actress.groupData,
            matchType: hasSelectedGroups ? 'selectedGroups' : hasGroupId ? 'groupId' : 'groupData'
          })
        }
        return isInGroup
      })
      
      console.log('Group members found:', members.length)
      console.log('Group members (FRESH DATA):', members.map(m => ({ 
        name: m.name, 
        selectedGroups: m.selectedGroups,
        matchType: 'selectedGroups'
      })))
      
      // Compare with expected members from Edit Group dialog
      const expectedMembers = [
        'Ayami Shunka',
        'Ai Uehara', 
        'Tia',
        'Yua Mikami',
        'Moe Amatsuka',
        'Tsukasa Aoi',
        'Yume Kana'
      ]
      
      console.log('=== COMPARISON WITH EDIT GROUP DIALOG ===')
      console.log('Expected members (from dialog):', expectedMembers)
      console.log('Actual members found:', members.map(m => m.name))
      console.log('Missing members:', expectedMembers.filter(name => !members.find(m => m.name === name)))
      console.log('Extra members:', members.filter(m => !expectedMembers.includes(m.name || '')).map(m => m.name))
      
      // Additional debug: Check if any actress has the group name in any field
      console.log('=== CHECKING FOR GROUP NAME IN OTHER FIELDS ===')
      const alternativeMatches = actressesWithMovieCount.filter(actress => {
        const nameMatch = actress.name?.toLowerCase().includes(group.name?.toLowerCase() || '')
        const jpnameMatch = actress.jpname?.toLowerCase().includes(group.name?.toLowerCase() || '')
        const aliasMatch = actress.alias?.toLowerCase().includes(group.name?.toLowerCase() || '')
        return nameMatch || jpnameMatch || aliasMatch
      })
      console.log('Alternative matches found:', alternativeMatches.length)
      alternativeMatches.slice(0, 3).forEach(actress => {
        console.log('Alternative match:', {
          name: actress.name,
          jpname: actress.jpname,
          alias: actress.alias,
          selectedGroups: actress.selectedGroups
        })
      })
      
      // Debug specific actresses that shouldn't be in the group
      console.log('=== DEBUGGING SPECIFIC ACTRESSES ===')
      const problemActresses = ['Yu Shinoda', 'Yui Kawamura']
      problemActresses.forEach(name => {
        const actress = actressesWithMovieCount.find(a => a.name === name)
        if (actress) {
          console.log(`Problem actress ${name}:`, {
            name: actress.name,
            selectedGroups: actress.selectedGroups,
            groupId: actress.groupId,
            groupName: actress.groupName,
            groupData: actress.groupData,
            hasSelectedGroups: actress.selectedGroups?.includes(group.name),
            hasLegacyGroup: actress.groupId === group.id,
            hasGroupName: actress.groupName === group.name
          })
        } else {
          console.log(`Actress ${name} not found in data`)
        }
      })
      
      // Summary debug info
      const actressesWithAnyGroupData = actressesWithMovieCount.filter(actress => {
        return actress.selectedGroups?.length > 0 || 
               actress.groupId || 
               actress.groupName ||
               actress.groupData
      })
      console.log('Actresses with any group data:', actressesWithAnyGroupData.length)
      
      const ebisuMatches = actressesWithMovieCount.filter(actress => {
        const nameMatch = actress.name?.toLowerCase().includes('ebisu') || actress.name?.toLowerCase().includes('muscats')
        const jpnameMatch = actress.jpname?.toLowerCase().includes('ebisu') || actress.jpname?.toLowerCase().includes('muscats')
        const aliasMatch = actress.alias?.toLowerCase().includes('ebisu') || actress.alias?.toLowerCase().includes('muscats')
        const tagsMatch = actress.tags?.toLowerCase().includes('ebisu') || actress.tags?.toLowerCase().includes('muscats')
        return nameMatch || jpnameMatch || aliasMatch || tagsMatch
      })
      console.log('Ebisu/Muscats matches found:', ebisuMatches.length)
      
      setActresses(actressesWithMovieCount)
      setGroupMembers(members)
      
      // Load generations for this group
      await loadGenerations()
    } catch (error) {
      console.error('Error loading actresses:', error)
      toast.error('Failed to load actresses')
    } finally {
      setIsLoading(false)
    }
  }

  const loadGenerations = async () => {
    try {
      const generationsData = await masterDataApi.getGenerationsByGroup(group.id, accessToken)
      setGenerations(generationsData)
      console.log('Loaded generations for group:', group.name, generationsData.length)
    } catch (error) {
      console.error('Error loading generations:', error)
    }
  }

  const handleGenerationClick = async (generation: MasterDataItem) => {
    try {
      setSelectedGenerationId(generation.id)
      // Refresh lineup data when generation changes
      setLineupRefreshKey(prev => prev + 1)
      
      // Use fresh API call like GenerationActressManagement does
      const allActresses = await masterDataApi.getByType('actress', accessToken)
      
      // Filter actresses that are assigned to this group (same logic as GenerationActressManagement)
      const actressesInGroup = allActresses.filter(actress => {
        const isInGroup = actress.groupId === group.id || 
                        (actress.selectedGroups && actress.selectedGroups.includes(group.name)) ||
                        (actress.groupData && actress.groupData[group.id])
        return isInGroup
      })
      
      // Filter actresses that have this generation in their generationData
      const actressesInGeneration = actressesInGroup.filter(actress => {
        const hasGeneration = actress.generationData && actress.generationData[generation.id]
        return hasGeneration
      })
      
      setGenerationActresses(actressesInGeneration)
    } catch (error) {
      console.error('Error loading generation actresses:', error)
    }
  }

  const getGroupProfilePicture = (actress: MasterDataItem, groupName: string) => {
    // Check groupProfilePictures first
    if (actress.groupProfilePictures && typeof actress.groupProfilePictures === 'object') {
      const groupPic = actress.groupProfilePictures[groupName]
      if (groupPic && groupPic.trim()) {
        return groupPic.trim()
      }
    }
    
    // Check groupData structure
    if (actress.groupData && typeof actress.groupData === 'object') {
      const groupInfo = actress.groupData[groupName]
      if (groupInfo?.profilePicture?.trim()) {
        return groupInfo.profilePicture.trim()
      }
      
      // Check photos array
      if (groupInfo?.photos && Array.isArray(groupInfo.photos) && groupInfo.photos.length > 0) {
        const firstPhoto = groupInfo.photos[0]?.trim()
        if (firstPhoto) return firstPhoto
      }
    }
    
    return null
  }

  const getGroupAlias = (actress: MasterDataItem, groupName: string) => {
    // Check groupAliases first
    if (actress.groupAliases && actress.groupAliases[groupName]) {
      return actress.groupAliases[groupName]
    }
    
    // Check groupData structure
    if (actress.groupData && actress.groupData[groupName]?.alias?.trim()) {
      return actress.groupData[groupName].alias.trim()
    }
    
    return null
  }

  const getGenerationProfilePicture = (actress: MasterDataItem, generationId: string) => {
    // Check generationData for profile picture
    if (actress.generationData && typeof actress.generationData === 'object') {
      const generationData = actress.generationData[generationId]
      if (generationData && generationData.profilePicture) {
        return generationData.profilePicture
      }
    }
    
    // Fallback to group profile picture, then regular profile picture
    return getGroupProfilePicture(actress, group.name || '') || actress.profilePicture
  }

  const getGenerationAlias = (actress: MasterDataItem, generationId: string) => {
    // Check generationData for alias
    if (actress.generationData && typeof actress.generationData === 'object') {
      const generationData = actress.generationData[generationId]
      if (generationData && generationData.alias) {
        return generationData.alias
      }
    }
    
    // Fallback to group alias, then regular name
    return getGroupAlias(actress, group.name || '') || actress.name
  }

  const getLineupProfilePicture = (actress: MasterDataItem, lineupId: string) => {
    // Check lineupData for profile picture
    if (actress.lineupData && typeof actress.lineupData === 'object') {
      const lineupData = actress.lineupData[lineupId]
      if (lineupData && lineupData.profilePicture) {
        return lineupData.profilePicture
      }
    }
    
    // Fallback to generation profile picture, then group profile picture, then regular profile picture
    return getGenerationProfilePicture(actress, generationId) || getGroupProfilePicture(actress, group.name || '') || actress.profilePicture
  }

  const getLineupAlias = (actress: MasterDataItem, lineupId: string) => {
    // Check lineupData for alias
    if (actress.lineupData && typeof actress.lineupData === 'object') {
      const lineupData = actress.lineupData[lineupId]
      if (lineupData && lineupData.alias) {
        return lineupData.alias
      }
    }
    
    // Fallback to generation alias, then group alias, then regular alias
    return getGenerationAlias(actress, generationId) || getGroupAlias(actress, group.name || '') || actress.alias
  }

  // Filter and sort group members based on search
  const filteredAndSortedMembers = useMemo(() => {
    let filtered = groupMembers
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = groupMembers.filter(actress => {
        const name = actress.name?.toLowerCase() || ''
        const jpname = actress.jpname?.toLowerCase() || ''
        const alias = actress.alias?.toLowerCase() || ''
        const groupAlias = getGroupAlias(actress, group.name || '')?.toLowerCase() || ''
        
        return name.includes(query) || 
               jpname.includes(query) || 
               alias.includes(query) ||
               groupAlias.includes(query)
      })
    }
    
    // Apply sorting
    const sortOption = sortOptions.find(option => option.key === sortBy)
    if (!sortOption) return filtered
    
    const isDesc = sortBy.endsWith('-desc')
    return [...filtered].sort((a, b) => {
      const aVal = sortOption.getValue(a)
      const bVal = sortOption.getValue(b)
      
      if (aVal < bVal) return isDesc ? 1 : -1
      if (aVal > bVal) return isDesc ? -1 : 1
      return 0
    })
  }, [groupMembers, searchQuery, sortBy, group.name])

  const openImageViewer = (images: string[], startIndex: number = 0, title: string = '') => {
    setLightboxImages(images)
    setLightboxIndex(startIndex)
    setLightboxTitle(title)
    setLightboxOpen(true)
  }

  const handleLightboxNext = () => {
    setLightboxIndex(prev => (prev + 1) % lightboxImages.length)
  }

  const handleLightboxPrevious = () => {
    setLightboxIndex(prev => (prev - 1 + lightboxImages.length) % lightboxImages.length)
  }

  // Parse gallery photos from group data
  const groupGalleryPhotos = useMemo(() => {
    // Check for the correct gallery field from our implementation
    if (Array.isArray(group.gallery)) {
      return group.gallery.filter(url => url && url.trim()) // Filter out empty URLs
    }
    // Fallback to galleryPhotos for backward compatibility
    if (Array.isArray(group.galleryPhotos)) {
      return group.galleryPhotos.filter(url => url && url.trim())
    }
    return []
  }, [group.gallery, group.galleryPhotos])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading group details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Groups
          </Button>
          <Globe className="h-6 w-6" />
          <h1 className="text-3xl font-bold">{group.name}</h1>
          <Badge variant="secondary" className="ml-2">
            {groupMembers.length} {groupMembers.length === 1 ? 'member' : 'members'}
          </Badge>
        </div>
      </div>

      {/* Group Profile Picture and Info */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Group Profile Picture */}
        <div className="lg:col-span-1">
          <div className="space-y-4">
            {group.profilePicture && (
              <div 
                className="aspect-square w-full rounded-lg overflow-hidden bg-muted relative group cursor-pointer" 
                onClick={() => openImageViewer([group.profilePicture], 0, `${group.name} Profile Picture`)}
              >
                <img
                  src={group.profilePicture}
                  alt={group.name || 'Group'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Maximize className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>
            )}
            

          </div>
        </div>

        {/* Group Info */}
        <div className="lg:col-span-3">
          <div className="space-y-4">
            {(group.jpname || group.description || group.website) && (
              <Card>
                <CardContent className="p-4 space-y-3">
                  {group.jpname && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Japanese Name</p>
                      <p className="text-lg">{group.jpname}</p>
                    </div>
                  )}
                  
                  {group.description && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
                      <p className="text-sm">{group.description}</p>
                    </div>
                  )}
                  
                  {group.website && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Website</p>
                      <a 
                        href={group.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {group.website}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Sort Controls */}
            {groupMembers.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      <span className="text-sm font-medium">Sort:</span>
                    </div>
                    
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {sortOptions.map(option => (
                          <SelectItem key={option.key} value={option.key}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="text-sm text-muted-foreground">
                      Showing {filteredAndSortedMembers.length} of {groupMembers.length} members
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="members" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Members
            {groupMembers.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {groupMembers.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="generations" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Generations
            {generations.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {generations.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="gallery" className="flex items-center gap-2">
            <Images className="h-4 w-4" />
            Gallery
            {groupGalleryPhotos.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {groupGalleryPhotos.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Members Tab */}
        <TabsContent value="members" className="mt-6">
          {groupMembers.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No members yet</h3>
              <p className="text-muted-foreground mb-4">
                No actresses have been assigned to this group yet.
              </p>
              <div className="flex gap-2 justify-center">
                <Button 
                  onClick={() => {
                    console.log('=== MANUAL TEST: Adding actresses to group ===')
                    const testActresses = actresses.slice(0, 3)
                    console.log('Adding test actresses:', testActresses.map(a => a.name))
                    
                    const testMembers = testActresses.map(actress => ({
                      ...actress,
                      selectedGroups: [...(actress.selectedGroups || []), group.name]
                    }))
                    
                    setGroupMembers(testMembers)
                    console.log('Test members set:', testMembers.length)
                  }}
                  variant="outline"
                >
                  Add Test Members (Debug)
                </Button>
                <Button 
                  onClick={() => {
                    console.log('=== CLEAR CACHE AND RELOAD ===')
                    // Clear all cache data
                    localStorage.removeItem('mvdb_cached_data')
                    localStorage.removeItem('mvdb_current_project_id')
                    console.log('All cache cleared, reloading...')
                    window.location.reload()
                  }}
                  variant="outline"
                >
                  Clear All Cache & Reload
                </Button>
                <Button 
                  onClick={() => {
                    console.log('=== REMOVE INCORRECT MEMBERS ===')
                    // Remove Yu Shinoda and Yui Kawamura from the group
                    const incorrectMembers = ['Yu Shinoda', 'Yui Kawamura']
                    const filteredMembers = groupMembers.filter(member => 
                      !incorrectMembers.includes(member.name || '')
                    )
                    console.log('Removed incorrect members:', incorrectMembers)
                    console.log('Remaining members:', filteredMembers.length)
                    setGroupMembers(filteredMembers)
                  }}
                  variant="destructive"
                >
                  Remove Incorrect Members
                </Button>
                <Button 
                  onClick={async () => {
                    console.log('=== FIX DATABASE DATA BASED ON DIALOG ===')
                    
                    // Get expected members from dialog
                    const expectedMembers = [
                      'Ayami Shunka',
                      'Ai Uehara', 
                      'Tia',
                      'Yua Mikami',
                      'Moe Amatsuka',
                      'Tsukasa Aoi',
                      'Yume Kana'
                    ]
                    
                    // Find actresses that should be in the group but aren't
                    const missingActresses = expectedMembers.filter(name => 
                      !members.find(m => m.name === name)
                    )
                    
                    // Find actresses that are in the group but shouldn't be
                    const extraActresses = members.filter(m => 
                      !expectedMembers.includes(m.name || '')
                    )
                    
                    console.log('Missing actresses (need to add):', missingActresses)
                    console.log('Extra actresses (need to remove):', extraActresses.map(a => a.name))
                    
                    // Remove extra actresses from the group
                    for (const actress of extraActresses) {
                      console.log(`Removing ${actress.name} from Ebisu★Muscats...`)
                      
                      const updatedSelectedGroups = actress.selectedGroups?.filter(group => 
                        group !== 'Ebisu★Muscats'
                      ) || []
                      
                      const updateData = {
                        name: actress.name,
                        jpname: actress.jpname,
                        birthdate: actress.birthdate,
                        alias: actress.alias,
                        links: actress.links,
                        takulinks: actress.takulinks,
                        tags: actress.tags,
                        photo: actress.photo,
                        profilePicture: actress.profilePicture,
                        groupId: actress.groupId,
                        groupData: actress.groupData,
                        selectedGroups: updatedSelectedGroups
                      }
                      
                      try {
                        await masterDataApi.updateExtended('actress', actress.id, updateData, accessToken)
                        console.log(`Successfully removed ${actress.name} from Ebisu★Muscats`)
                      } catch (error) {
                        console.error(`Failed to update ${actress.name}:`, error)
                      }
                    }
                    
                    // Add missing actresses to the group
                    for (const actressName of missingActresses) {
                      const actress = actresses.find(a => a.name === actressName)
                      if (actress) {
                        console.log(`Adding ${actressName} to Ebisu★Muscats...`)
                        
                        const updatedSelectedGroups = [...(actress.selectedGroups || []), 'Ebisu★Muscats']
                        
                        const updateData = {
                          name: actress.name,
                          jpname: actress.jpname,
                          birthdate: actress.birthdate,
                          alias: actress.alias,
                          links: actress.links,
                          takulinks: actress.takulinks,
                          tags: actress.tags,
                          photo: actress.photo,
                          profilePicture: actress.profilePicture,
                          groupId: actress.groupId,
                          groupData: actress.groupData,
                          selectedGroups: updatedSelectedGroups
                        }
                        
                        try {
                          await masterDataApi.updateExtended('actress', actress.id, updateData, accessToken)
                          console.log(`Successfully added ${actressName} to Ebisu★Muscats`)
                        } catch (error) {
                          console.error(`Failed to update ${actressName}:`, error)
                        }
                      }
                    }
                    
                    // Reload data
                    setTimeout(() => {
                      window.location.reload()
                    }, 2000)
                  }}
                  variant="destructive"
                >
                  Sync with Dialog Data
                </Button>
              </div>
            </div>
          ) : filteredAndSortedMembers.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No members found</h3>
              <p className="text-muted-foreground">
                No actresses match your search criteria.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredAndSortedMembers.map((actress) => {
                const imageUrl = getGroupProfilePicture(actress, group.name || '')
                const groupAlias = getGroupAlias(actress, group.name || '')
                
                return (
                  <Card 
                    key={actress.id} 
                    className="group hover:shadow-lg transition-all duration-200 cursor-pointer"
                    onClick={() => onProfileSelect('actress', actress.name)}
                  >
                    <CardContent className="p-0">
                      {/* Profile Picture */}
                      <div className="aspect-[3/4] overflow-hidden rounded-t-lg bg-muted relative">
                        {imageUrl ? (
                          <>
                            <img
                              src={imageUrl}
                              alt={`${actress.name} in ${group.name}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                                const fallback = e.currentTarget.nextElementSibling as HTMLElement
                                if (fallback) fallback.style.display = 'flex'
                              }}
                            />
                            {/* Broken image fallback */}
                            <div 
                              className="w-full h-full flex flex-col items-center justify-center bg-muted text-muted-foreground"
                              style={{ display: 'none' }}
                            >
                              <ImageOff className="h-8 w-8 mb-2" />
                              <span className="text-xs text-center px-2">Group image not available</span>
                            </div>
                          </>
                        ) : (
                          /* No group-specific image placeholder */
                          <div className="w-full h-full flex flex-col items-center justify-center bg-muted text-muted-foreground">
                            <User className="h-12 w-12 mb-2" />
                            <span className="text-xs text-center px-2">No group photo</span>
                          </div>
                        )}

                        {/* Favorite Button */}
                        {accessToken && (
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <SimpleFavoriteButton
                              type="cast"
                              itemId={actress.name || ''}
                              size="sm"
                              variant="ghost"
                              className="bg-black/20 hover:bg-black/40 backdrop-blur-sm"
                            />
                          </div>
                        )}
                      </div>
                      
                      {/* Info */}
                      <div className="p-3 space-y-1">
                        <h3 className="font-medium text-sm truncate" title={actress.name}>
                          {actress.name || 'Unnamed'}
                        </h3>
                        
                        {/* Show group alias if available */}
                        {groupAlias && (
                          <p className="text-xs text-blue-600 truncate" title={`Group alias: ${groupAlias}`}>
                            {groupAlias}
                          </p>
                        )}
                        
                        {actress.jpname && (
                          <p className="text-xs text-muted-foreground truncate" title={actress.jpname}>
                            {actress.jpname}
                          </p>
                        )}
                        
                        {actress.birthdate && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{calculateAge(actress.birthdate)} years</span>
                          </div>
                        )}
                        
                        {/* Movie count badge */}
                        {actress.movieCount !== undefined && actress.movieCount > 0 && (
                          <p className="text-xs text-muted-foreground">
                            🎬 {actress.movieCount} movies
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Generations Tab */}
        <TabsContent value="generations" className="mt-6">
          {generations.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No generations yet</h3>
              <p className="text-muted-foreground">
                This group doesn't have any generations defined yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {generations.map((generation) => (
                  <Card 
                    key={generation.id} 
                    className={`hover:shadow-md transition-shadow cursor-pointer ${
                      selectedGenerationId === generation.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => handleGenerationClick(generation)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {generation.profilePicture ? (
                          <img
                            src={generation.profilePicture}
                            alt={generation.name || 'Generation'}
                            className="w-12 h-12 rounded-lg object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                              e.currentTarget.nextElementSibling?.classList.remove('hidden')
                            }}
                          />
                        ) : null}
                        <div className={`w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center ${generation.profilePicture ? 'hidden' : ''}`}>
                          <Calendar className="w-6 h-6 text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-lg truncate">{generation.name}</h4>
                          {(generation.estimatedYears || generation.startDate || generation.endDate) && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {generation.estimatedYears || 
                                 (generation.startDate && generation.endDate
                                   ? `${generation.startDate} - ${generation.endDate}`
                                   : generation.startDate || generation.endDate)}
                              </span>
                            </div>
                          )}
                          {generation.description && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                              {generation.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Selected Generation Actresses */}
              {selectedGenerationId && (
                <div className="mt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <h4 className="text-lg font-medium">
                      Actresses in {generations.find(g => g.id === selectedGenerationId)?.name} Generation
                    </h4>
                    <Badge variant="secondary">
                      {generationActresses.length} actresses
                    </Badge>
                  </div>
                  
                  {generationActresses.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                      <User className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <h5 className="font-medium text-gray-900 mb-1">No actresses assigned</h5>
                      <p className="text-sm text-gray-500">No actresses have been assigned to this generation yet.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {generationActresses.map((actress) => {
                        const imageUrl = getGenerationProfilePicture(actress, selectedGenerationId)
                        const generationAlias = getGenerationAlias(actress, selectedGenerationId)
                        
                        return (
                          <Card 
                            key={actress.id} 
                            className="group hover:shadow-lg transition-all duration-200 cursor-pointer"
                            onClick={() => onProfileSelect('actress', actress.name)}
                          >
                            <CardContent className="p-0">
                              {/* Profile Picture */}
                              <div className="aspect-[3/4] overflow-hidden rounded-t-lg bg-muted relative">
                                {imageUrl ? (
                                  <>
                                    <img
                                      src={imageUrl}
                                      alt={generationAlias || actress.name || 'Actress'}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none'
                                        e.currentTarget.nextElementSibling?.classList.remove('hidden')
                                      }}
                                    />
                                    <div className="hidden w-full h-full flex items-center justify-center bg-muted">
                                      <ImageOff className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                  </>
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-muted">
                                    <ImageOff className="h-8 w-8 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                              
                              {/* Actress Info */}
                              <div className="p-3">
                                <h4 className="font-medium text-sm truncate">
                                  {generationAlias || actress.name}
                                </h4>
                                {generationAlias && generationAlias !== actress.name && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    {actress.name}
                                  </p>
                                )}
                                {actress.birthdate && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {calculateAge(actress.birthdate)} years old
                                  </p>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Lineup Display */}
              {selectedGenerationId && (
                <div className="mt-6">
                  <LineupDisplay
                    generationId={selectedGenerationId}
                    generationName={generations.find(g => g.id === selectedGenerationId)?.name || 'Unnamed Generation'}
                    accessToken={accessToken}
                    onProfileSelect={onProfileSelect}
                    getLineupProfilePicture={getLineupProfilePicture}
                    getLineupAlias={getLineupAlias}
                    refreshKey={lineupRefreshKey}
                    onDataChange={() => {
                      // Don't trigger refresh loop - data is already fresh
                      console.log('LineupDisplay: Data changed, but not triggering refresh to avoid loop')
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Gallery Tab */}
        <TabsContent value="gallery" className="mt-6">
          {groupGalleryPhotos.length === 0 ? (
            <div className="text-center py-12">
              <Images className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No gallery photos yet</h3>
              <p className="text-muted-foreground">
                This group doesn't have any gallery photos yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Click any photo to view in full screen • Use arrow keys or swipe to navigate
                </p>
                <Badge variant="outline">
                  {groupGalleryPhotos.length} {groupGalleryPhotos.length === 1 ? 'photo' : 'photos'}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
                {groupGalleryPhotos.map((photoUrl, index) => (
                  <div
                    key={index}
                    className="aspect-square rounded-lg overflow-hidden bg-muted relative group cursor-pointer hover:shadow-lg transition-all duration-200"
                    onClick={() => openImageViewer(groupGalleryPhotos, index, `${group.name} Gallery`)}
                  >
                    <img
                      src={photoUrl}
                      alt={`${group.name} Gallery Photo ${index + 1}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.currentTarget
                        const parent = target.parentElement
                        if (parent) {
                          parent.innerHTML = `
                            <div class="w-full h-full flex flex-col items-center justify-center bg-muted text-muted-foreground">
                              <svg class="h-8 w-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                              </svg>
                              <span class="text-xs text-center px-2">Image not available</span>
                            </div>
                          `
                        }
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="absolute bottom-2 left-2 right-2">
                        <div className="flex items-center justify-between">
                          <span className="text-white text-xs font-medium">
                            Photo {index + 1}
                          </span>
                          <Maximize className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modern Lightbox */}
      <ModernLightbox
        src={lightboxImages[lightboxIndex] || ''}
        alt={lightboxTitle}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        currentIndex={lightboxIndex}
        totalImages={lightboxImages.length}
        onNext={lightboxImages.length > 1 ? handleLightboxNext : undefined}
        onPrevious={lightboxImages.length > 1 ? handleLightboxPrevious : undefined}
        showNavigation={lightboxImages.length > 1}
        metadata={{
          sourceType: 'photobook',
          sourceTitle: lightboxTitle
        }}
      />

    </div>
  )
}