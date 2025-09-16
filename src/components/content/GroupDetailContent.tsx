import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
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
  Maximize,
  Plus,
  ChevronDown,
  Camera
} from 'lucide-react'
import { MasterDataItem, masterDataApi, calculateAge } from '../../utils/masterDataApi'
import { Movie, movieApi } from '../../utils/movieApi'
import { useCachedData } from '../../hooks/useCachedData'
import { LineupDisplay } from '../LineupDisplay'
import { SimpleFavoriteButton } from '../SimpleFavoriteButton'
import { ModernLightbox } from '../ModernLightbox'
import { SearchableComboBox, useComboBoxOptions } from '../ui/searchable-combobox'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'
import { toast } from 'sonner'

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
  { key: 'movieCount', label: 'Movies (Few)', getValue: (actress: MasterDataItem) => (actress as any).movieCount || 0 },
  { key: 'movieCount-desc', label: 'Movies (Many)', getValue: (actress: MasterDataItem) => (actress as any).movieCount || 0 },
]

const generationSortOptions = [
  { key: 'name', label: 'Name (A-Z)', getValue: (actress: MasterDataItem) => actress.name?.toLowerCase() || '' },
  { key: 'name-desc', label: 'Name (Z-A)', getValue: (actress: MasterDataItem) => actress.name?.toLowerCase() || '' },
  { key: 'age', label: 'Age (Young)', getValue: (actress: MasterDataItem) => actress.birthdate ? calculateAge(actress.birthdate) : 999 },
  { key: 'age-desc', label: 'Age (Old)', getValue: (actress: MasterDataItem) => actress.birthdate ? calculateAge(actress.birthdate) : 0 },
  { key: 'movieCount', label: 'Movies (Few)', getValue: (actress: MasterDataItem) => (actress as any).movieCount || 0 },
  { key: 'movieCount-desc', label: 'Movies (Many)', getValue: (actress: MasterDataItem) => (actress as any).movieCount || 0 },
]

const lineupSortOptions = [
  { key: 'name', label: 'Name (A-Z)', getValue: (actress: MasterDataItem) => actress.name?.toLowerCase() || '' },
  { key: 'name-desc', label: 'Name (Z-A)', getValue: (actress: MasterDataItem) => actress.name?.toLowerCase() || '' },
  { key: 'age', label: 'Age (Young)', getValue: (actress: MasterDataItem) => actress.birthdate ? calculateAge(actress.birthdate) : 999 },
  { key: 'age-desc', label: 'Age (Old)', getValue: (actress: MasterDataItem) => actress.birthdate ? calculateAge(actress.birthdate) : 0 },
  { key: 'movieCount', label: 'Movies (Few)', getValue: (actress: MasterDataItem) => (actress as any).movieCount || 0 },
  { key: 'movieCount-desc', label: 'Movies (Many)', getValue: (actress: MasterDataItem) => (actress as any).movieCount || 0 },
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
  const [generationSortBy, setGenerationSortBy] = useState('name')
  const [lineupSortBy, setLineupSortBy] = useState('name')
  const [isLoading, setIsLoading] = useState(true)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxImages, setLightboxImages] = useState<string[]>([])
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [lightboxTitle, setLightboxTitle] = useState('')
  const [activeTab, setActiveTab] = useState('members')
  const [selectedGenerationId, setSelectedGenerationId] = useState<string | null>(null)
  const [generationActresses, setGenerationActresses] = useState<MasterDataItem[]>([])
  const [lineupRefreshKey, setLineupRefreshKey] = useState(0)
  const [isLoadingGeneration, setIsLoadingGeneration] = useState(false)
  const [lineupData, setLineupData] = useState<{lineups: MasterDataItem[], actresses: MasterDataItem[]} | null>(null)
  const [lineupDataLoaded, setLineupDataLoaded] = useState(false)
  const [expandedGenerations, setExpandedGenerations] = useState<Set<string>>(new Set())
  const [selectedViewMode, setSelectedViewMode] = useState<string>('default')
  const [selectedVersion, setSelectedVersion] = useState<string>('default')
  const [selectedLineupVersion, setSelectedLineupVersion] = useState<string>('default')
  const [showLineups, setShowLineups] = useState(false)
  const [lineups, setLineups] = useState<MasterDataItem[]>([])
  const [filteredActresses, setFilteredActresses] = useState<MasterDataItem[]>([])
  const [cachedActresses, setCachedActresses] = useState<MasterDataItem[]>([])
  const [lastGenerationId, setLastGenerationId] = useState<string | null>(null)
  const [selectedActressId, setSelectedActressId] = useState<string>('')
  const [isAddingMember, setIsAddingMember] = useState(false)
  const [newActressName, setNewActressName] = useState<string>('')
  const [newActressJpName, setNewActressJpName] = useState<string>('')
  const [newActressGroupPhoto, setNewActressGroupPhoto] = useState<string>('')
  const [newActressPreviewUrl, setNewActressPreviewUrl] = useState<string>('')
  const [newActressPreviewError, setNewActressPreviewError] = useState<boolean>(false)
  const [newActressUrlWasTrimmed, setNewActressUrlWasTrimmed] = useState<boolean>(false)
  const [isCreatingActress, setIsCreatingActress] = useState(false)
  const [duplicateWarning, setDuplicateWarning] = useState<string>('')
  const [isAddMemberSectionOpen, setIsAddMemberSectionOpen] = useState(false)
  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false)
  const [selectedActressForEdit, setSelectedActressForEdit] = useState<MasterDataItem | null>(null)
  const [profilePictureUrl, setProfilePictureUrl] = useState<string>('')
  const [isUpdatingProfilePicture, setIsUpdatingProfilePicture] = useState(false)
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [previewError, setPreviewError] = useState<boolean>(false)
  const [urlWasTrimmed, setUrlWasTrimmed] = useState<boolean>(false)

  // Function to auto-trim fandom.com URLs from the end
  const autoTrimFandomUrl = (url: string): string => {
    if (!url || typeof url !== 'string') return url
    
    // Check if it's a fandom.com URL
    if (!url.includes('static.wikia.nocookie.net')) return url
    
    // Find the last occurrence of image extensions
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp']
    let trimmedUrl = url
    
    // Try each extension from the end
    for (const ext of imageExtensions) {
      const lastIndex = url.lastIndexOf(ext)
      if (lastIndex !== -1) {
        // Found the extension, trim everything after it
        trimmedUrl = url.substring(0, lastIndex + ext.length)
        break
      }
    }
    
    return trimmedUrl
  }

  // Debounce preview URL update with auto-trim
  useEffect(() => {
    if (!profilePictureUrl.trim()) {
      setPreviewUrl('')
      setPreviewError(false)
      setUrlWasTrimmed(false)
      return
    }

    const timeoutId = setTimeout(() => {
      const trimmedUrl = autoTrimFandomUrl(profilePictureUrl.trim())
      const wasTrimmed = trimmedUrl !== profilePictureUrl.trim()
      
      setPreviewUrl(trimmedUrl)
      setPreviewError(false)
      setUrlWasTrimmed(wasTrimmed)
      
      // Auto-update the input field if URL was trimmed
      if (wasTrimmed) {
        setProfilePictureUrl(trimmedUrl)
      }
    }, 500) // 500ms debounce

    return () => clearTimeout(timeoutId)
  }, [profilePictureUrl])

  // Debounce preview URL update for new actress group photo
  useEffect(() => {
    if (!newActressGroupPhoto.trim()) {
      setNewActressPreviewUrl('')
      setNewActressPreviewError(false)
      setNewActressUrlWasTrimmed(false)
      return
    }

    const timeoutId = setTimeout(() => {
      const trimmedUrl = autoTrimFandomUrl(newActressGroupPhoto.trim())
      const wasTrimmed = trimmedUrl !== newActressGroupPhoto.trim()
      
      setNewActressPreviewUrl(trimmedUrl)
      setNewActressPreviewError(false)
      setNewActressUrlWasTrimmed(wasTrimmed)
      
      // Auto-update the input field if URL was trimmed
      if (wasTrimmed) {
        setNewActressGroupPhoto(trimmedUrl)
      }
    }, 500) // 500ms debounce

    return () => clearTimeout(timeoutId)
  }, [newActressGroupPhoto])

  // Check for duplicate actress names in real-time
  useEffect(() => {
    if (!newActressName.trim()) {
      setDuplicateWarning('')
      return
    }

    const duplicate = checkForDuplicateActress(newActressName.trim(), newActressJpName.trim())
    if (duplicate) {
      const duplicateInfo = []
      if (duplicate.name) duplicateInfo.push(`Nama: "${duplicate.name}"`)
      if (duplicate.jpname) duplicateInfo.push(`Nama Jepang: "${duplicate.jpname}"`)
      if (duplicate.alias) duplicateInfo.push(`Alias: "${duplicate.alias}"`)
      
      const duplicateDetails = duplicateInfo.join(', ')
      setDuplicateWarning(`⚠️ Aktris dengan nama yang sama sudah ada:\n${duplicateDetails}`)
    } else {
      setDuplicateWarning('')
    }
  }, [newActressName, newActressJpName, cachedActresses])

  useEffect(() => {
    // Clear cache first to ensure fresh data
    localStorage.removeItem('mvdb_cached_data')
    console.log('Cache cleared for fresh data')
    
    // Preload actresses data for better performance
    const preloadActresses = async () => {
      try {
        const allActresses = await masterDataApi.getByType('actress', accessToken)
        setCachedActresses(allActresses)
        console.log('Actresses data preloaded:', allActresses.length)
      } catch (error) {
        console.error('Error preloading actresses:', error)
      }
    }
    
    preloadActresses()
    loadActresses()
  }, [accessToken, group.id]) // Use group.id instead of group.name to prevent unnecessary re-renders

  // Update filtered actresses when view mode changes
  useEffect(() => {
    if (selectedViewMode === 'default') {
      setFilteredActresses(groupMembers)
    } else if (selectedViewMode.startsWith('generation-')) {
      const generationId = selectedViewMode.replace('generation-', '')
      setFilteredActresses(getFilteredActresses('generation', generationId))
    } else if (selectedViewMode.startsWith('lineup-')) {
      const lineupId = selectedViewMode.replace('lineup-', '')
      setFilteredActresses(getFilteredActresses('lineup', lineupId))
    } else {
      setFilteredActresses(groupMembers)
    }
  }, [selectedViewMode, groupMembers, generations, lineups])

  const loadActresses = async () => {
    try {
      setIsLoading(true)
      
      console.log('=== GroupDetailContent: Loading actresses ===')
      console.log('Group name:', group.name)
      console.log('Group object:', group)
      
      // Load both actresses and movies data using cached system
      // Force refresh actresses to ensure we have latest generationData
      const [actressesData, moviesData] = await Promise.all([
        loadCachedData('actresses', () => masterDataApi.getByType('actress', accessToken), true) as Promise<MasterDataItem[]>,
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
        const hasSelectedGroups = actress.selectedGroups && actress.selectedGroups.includes(group.name || '')
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
        generationData: m.generationData,
        matchType: 'selectedGroups'
      })))
      
      // Debug: Check if any actress has generation data
      const actressesWithGenerationData = members.filter(m => m.generationData && Object.keys(m.generationData).length > 0)
      console.log('[DEBUG] Actresses with generation data:', actressesWithGenerationData.length)
      actressesWithGenerationData.forEach(actress => {
        console.log(`[DEBUG] ${actress.name} generation data:`, actress.generationData)
      })
      
      // Debug: Check sample actress data structure
      if (members.length > 0) {
        console.log('[DEBUG] Sample actress data structure:', {
          name: members[0].name,
          id: members[0].id,
          generationData: members[0].generationData,
          lineupData: members[0].lineupData,
          groupData: members[0].groupData,
          selectedGroups: members[0].selectedGroups
        })
      }
      
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
            hasSelectedGroups: actress.selectedGroups?.includes(group.name || ''),
            hasLegacyGroup: actress.groupId === group.id,
            hasGroupName: actress.groupName === group.name
          })
        } else {
          console.log(`Actress ${name} not found in data`)
        }
      })
      
      // Summary debug info
      const actressesWithAnyGroupData = actressesWithMovieCount.filter(actress => {
        return (actress.selectedGroups?.length || 0) > 0 || 
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
      
      // Debug: Check if actresses have generation data
      const actressesWithGenData = actressesWithMovieCount.filter(a => a.generationData && Object.keys(a.generationData).length > 0)
      console.log('[DEBUG] Actresses with generation data:', actressesWithGenData.length)
      if (actressesWithGenData.length > 0) {
        console.log('[DEBUG] Sample actress generation data:', actressesWithGenData[0].name, actressesWithGenData[0].generationData)
      }
      
      // Load generations for this group - ensure actresses data is fully loaded first
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
      console.log('[DEBUG] Generations data:', generationsData.map(g => ({ id: g.id, name: g.name })))
      
      // Load lineups for all generations
      await loadLineups(generationsData)
    } catch (error) {
      console.error('Error loading generations:', error)
    }
  }

  const loadLineups = async (generationsData: MasterDataItem[]) => {
    try {
      const allLineups = await masterDataApi.getByType('lineup', accessToken)
      const groupLineups = allLineups.filter(lineup => 
        generationsData.some(gen => gen.id === lineup.generationId)
      )
      setLineups(groupLineups)
      console.log('Loaded lineups for group:', group.name, groupLineups.length)
    } catch (error) {
      console.error('Error loading lineups:', error)
    }
  }

  const handleGenerationClick = async (generation: MasterDataItem) => {
    try {
      // Early return if this generation is already selected and we have data
      if (selectedGenerationId === generation.id && generationActresses.length > 0) {
        console.log(`[DEBUG] Generation ${generation.id} already selected, skipping reload`)
        return
      }
      
      // Only show loading if we don't have cached data or it's a different generation
      const needsLoading = cachedActresses.length === 0 || lastGenerationId !== generation.id
      
      if (needsLoading) {
        setIsLoadingGeneration(true)
      }
      
      let allActresses = cachedActresses
      
      // Only fetch from API if we don't have cached data
      if (cachedActresses.length === 0) {
        allActresses = await masterDataApi.getByType('actress', accessToken)
        setCachedActresses(allActresses)
      }
      
      // Filter actresses that are assigned to this group (same logic as GenerationActressManagement)
      const actressesInGroup = allActresses.filter(actress => {
        const isInGroup = actress.groupId === group.id || 
                        (actress.selectedGroups && actress.selectedGroups.includes(group.name || '')) ||
                        (actress.groupData && actress.groupData[group.id])
        return isInGroup
      })
      
      // Filter actresses that have this generation in their generationData
      const actressesInGeneration = actressesInGroup.filter(actress => {
        const hasGeneration = actress.generationData && actress.generationData[generation.id]
        console.log(`[DEBUG] Checking ${actress.name} for generation ${generation.id}:`, {
          hasGenerationData: !!actress.generationData,
          generationData: actress.generationData,
          hasThisGeneration: hasGeneration
        })
        return hasGeneration
      })
      
      // Sort actresses by name (alphabetically)
      actressesInGeneration.sort((a, b) => {
        const nameA = a.name || ''
        const nameB = b.name || ''
        return nameA.localeCompare(nameB)
      })
      
      console.log(`[DEBUG] Found ${actressesInGeneration.length} actresses in generation ${generation.id}`)
      
      // Update state atomically to prevent UI flicker
      setGenerationActresses(actressesInGeneration)
      setSelectedGenerationId(generation.id)
      setLastGenerationId(generation.id)
      setShowLineups(false) // Reset to show actresses by default
      // Only refresh lineup data if generation actually changed
      if (selectedGenerationId !== generation.id) {
        setLineupRefreshKey(prev => prev + 1)
      }
    } catch (error) {
      console.error('Error loading generation actresses:', error)
    } finally {
      setIsLoadingGeneration(false)
    }
  }

  // Load lineup data for a specific generation
  const loadLineupData = async (generationId: string) => {
    try {
      // Only load if we don't have data for this generation yet
      if (lineupDataLoaded && lineupData) {
        return
      }

      console.log('Loading lineup data for generation:', generationId)
      
      // Load lineups for this generation
      const allLineups = await masterDataApi.getByType('lineup', accessToken)
      const generationLineups = allLineups.filter(lineup => lineup.generationId === generationId)
      
      // Sort by lineupOrder
      generationLineups.sort((a, b) => (a.lineupOrder || 0) - (b.lineupOrder || 0))
      
      // Load actresses for this generation's group
      const generations = await masterDataApi.getByType('generation', accessToken)
      const generation = generations.find(g => g.id === generationId)
      const allActresses = await masterDataApi.getByType('actress', accessToken)
      const groupActresses = allActresses.filter(actress => 
        actress.selectedGroups && actress.selectedGroups.includes(generation?.groupName || '')
      )
      
      setLineupData({ lineups: generationLineups, actresses: groupActresses })
      setLineupDataLoaded(true)
      
      console.log('Lineup data loaded successfully:', { lineups: generationLineups.length, actresses: groupActresses.length })
      
    } catch (err) {
      console.error('Error loading lineup data:', err)
    }
  }

  // Optimized function to handle lineup view switching without unnecessary loading
  const handleViewLineups = async (generation: MasterDataItem) => {
    // If generation is already selected, just switch to lineup view
    if (selectedGenerationId === generation.id) {
      // Load lineup data if not already loaded
      if (!lineupDataLoaded) {
        await loadLineupData(generation.id)
      }
      setShowLineups(true)
      return
    }
    
    // If generation is not selected, load it first then switch to lineup view
    await handleGenerationClick(generation)
    await loadLineupData(generation.id)
    setShowLineups(true)
  }

  // Toggle description expansion for generation
  const toggleGenerationDescription = (generationId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click
    setExpandedGenerations(prev => {
      const newSet = new Set(prev)
      if (newSet.has(generationId)) {
        newSet.delete(generationId)
      } else {
        newSet.add(generationId)
      }
      return newSet
    })
  }

  const getGroupProfilePicture = (actress: MasterDataItem, groupName: string) => {
    console.log(`\n=== Getting profile picture for ${actress.name} in group ${groupName} ===`)
    
    // Check groupData structure
    if (actress.groupData && typeof actress.groupData === 'object') {
      const groupInfo = actress.groupData[groupName] as any
      console.log('Group info:', groupInfo)
      
      // Check for profilePicture field (saved from ActorForm)
      if (groupInfo?.profilePicture && groupInfo.profilePicture.trim()) {
        console.log('✅ Found groupData profilePicture:', groupInfo.profilePicture)
        return groupInfo.profilePicture.trim()
      }
      
      // Check for photos array (alternative structure)
      if (groupInfo?.photos && Array.isArray(groupInfo.photos) && groupInfo.photos.length > 0) {
        const firstPhoto = groupInfo.photos[0]?.trim()
        if (firstPhoto) {
          console.log('✅ Found groupData photos array:', firstPhoto)
          return firstPhoto
        }
      }
    }
    
    // Legacy structure removed - groupProfilePictures is not part of MasterDataItem type
    
    console.log('❌ No group-specific photo found')
    return null
  }

  const getGroupAlias = (actress: MasterDataItem, groupName: string) => {
    // Check groupData structure
    if (actress.groupData && actress.groupData[groupName]?.alias?.trim()) {
      return actress.groupData[groupName].alias.trim()
    }
    
    return null
  }

  const getGenerationProfilePicture = useCallback((actress: MasterDataItem, generationId: string, selectedVersion?: string) => {
    // Check generationData for profile picture
    if (actress.generationData && typeof actress.generationData === 'object') {
      const generationData = actress.generationData[generationId]
      
      // If version is selected and photoVersions exist, use version photo
      if (selectedVersion && generationData?.photoVersions?.[selectedVersion]?.photos?.length > 0) {
        const versionPhoto = generationData.photoVersions[selectedVersion].photos[0]?.trim()
        if (versionPhoto) {
          return versionPhoto
        }
      }
      
      // Check generationData for profile picture (default)
      if (generationData && generationData.profilePicture) {
        return generationData.profilePicture
      }
      
      // Check photos array in generationData
      if (generationData && generationData.photos && Array.isArray(generationData.photos) && generationData.photos.length > 0) {
        const firstPhoto = generationData.photos[0]?.trim()
        if (firstPhoto) {
          return firstPhoto
        }
      }
    }
    
    // Fallback to group profile picture, then regular profile picture
    return getGroupProfilePicture(actress, group.name || '') || actress.profilePicture
  }, [group.name])

  const getGenerationAlias = useCallback((actress: MasterDataItem, generationId: string) => {
    // Check generationData for alias
    if (actress.generationData && typeof actress.generationData === 'object') {
      const generationData = actress.generationData[generationId]
      if (generationData && generationData.alias) {
        return generationData.alias
      }
    }
    
    // Fallback to group alias, then regular name
    return getGroupAlias(actress, group.name || '') || actress.name
  }, [group.name])

  // Memoize generation actresses data to prevent unnecessary re-renders
  const memoizedGenerationActresses = useMemo(() => {
    const sortOption = generationSortOptions.find(option => option.key === generationSortBy)
    console.log('Generation actresses sorting:', { generationSortBy, sortOption, actressesCount: generationActresses.length })
    
    let sortedActresses = generationActresses
      .map(actress => ({
        ...actress,
        imageUrl: getGenerationProfilePicture(actress, selectedGenerationId || '', selectedVersion === 'default' ? undefined : selectedVersion),
        generationAlias: getGenerationAlias(actress, selectedGenerationId || '')
      }))
    
    if (sortOption) {
      const isDesc = generationSortBy.endsWith('-desc')
      sortedActresses = sortedActresses.sort((a, b) => {
        const aVal = sortOption.getValue(a)
        const bVal = sortOption.getValue(b)
        
        console.log('Generation actresses sorting comparison:', { 
          aName: a.name, aVal, 
          bName: b.name, bVal, 
          isDesc, 
          result: aVal < bVal ? (isDesc ? 1 : -1) : (aVal > bVal ? (isDesc ? -1 : 1) : 0)
        })
        
        if (aVal < bVal) return isDesc ? 1 : -1
        if (aVal > bVal) return isDesc ? -1 : 1
        return 0
      })
      
      console.log('Sorted generation actresses:', sortedActresses.map(a => ({ name: a.name, value: sortOption.getValue(a) })))
    }
    
    return sortedActresses
  }, [generationActresses, selectedGenerationId, selectedVersion, generationSortBy, getGenerationProfilePicture, getGenerationAlias])

  const getLineupProfilePicture = (actress: MasterDataItem, lineupId: string, selectedVersion?: string) => {
    // Check lineupData for profile picture
    if (actress.lineupData && typeof actress.lineupData === 'object') {
      const lineupData = actress.lineupData[lineupId]
      
      // If version is selected and photoVersions exist, use version photo
      if (selectedVersion && lineupData?.photoVersions?.[selectedVersion]?.photos?.length > 0) {
        const versionPhoto = lineupData.photoVersions[selectedVersion].photos[0]?.trim()
        if (versionPhoto) {
          return versionPhoto
        }
      }
      
      // Check lineupData for profile picture (default)
      if (lineupData && lineupData.profilePicture) {
        return lineupData.profilePicture
      }
    }
    
    // Fallback to generation profile picture, then group profile picture, then regular profile picture
    return getGenerationProfilePicture(actress, selectedGenerationId || '', undefined) || getGroupProfilePicture(actress, group.name || '') || actress.profilePicture
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
    return getGenerationAlias(actress, selectedGenerationId || '') || getGroupAlias(actress, group.name || '') || actress.alias
  }

  // Find latest generation where actress exists
  const findLatestGenerationWhereActressExists = (actress: MasterDataItem): MasterDataItem | null => {
    if (!actress.generationData || typeof actress.generationData !== 'object') {
      return null
    }

    const actressGenerationIds = Object.keys(actress.generationData)
    if (actressGenerationIds.length === 0) {
      return null
    }

    // Find generations that exist in our loaded generations
    const existingGenerations = generations.filter(gen => actressGenerationIds.includes(gen.id))
    if (existingGenerations.length === 0) {
      return null
    }

    // Sort by createdAt (newest first) or estimatedYears (newest first)
    existingGenerations.sort((a, b) => {
      // First try to sort by estimatedYears
      if (a.estimatedYears && b.estimatedYears) {
        const aYear = parseInt(a.estimatedYears.split('-')[0])
        const bYear = parseInt(b.estimatedYears.split('-')[0])
        if (aYear !== bYear) {
          return bYear - aYear // Newest first
        }
      }
      
      // Then sort by createdAt
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return existingGenerations[0]
  }

  // Find latest lineup where actress exists
  const findLatestLineupWhereActressExists = (actress: MasterDataItem): MasterDataItem | null => {
    if (!actress.lineupData || typeof actress.lineupData !== 'object') {
      return null
    }

    const actressLineupIds = Object.keys(actress.lineupData)
    if (actressLineupIds.length === 0) {
      return null
    }

    // Find lineups that exist in our loaded lineups
    const existingLineups = lineups.filter(lineup => actressLineupIds.includes(lineup.id))
    if (existingLineups.length === 0) {
      return null
    }

    // Sort by lineupOrder (highest first), then by createdAt (newest first)
    existingLineups.sort((a, b) => {
      if (a.lineupOrder !== b.lineupOrder) {
        return (b.lineupOrder || 0) - (a.lineupOrder || 0) // Highest first
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return existingLineups[0]
  }

  // Get latest generation profile picture
  const getLatestGenerationProfilePicture = (actress: MasterDataItem): string | null => {
    const latestGeneration = findLatestGenerationWhereActressExists(actress)
    if (latestGeneration) {
      return getGenerationProfilePicture(actress, latestGeneration.id, undefined) || null
    }
    return null
  }

  // Get latest lineup profile picture
  const getLatestLineupProfilePicture = (actress: MasterDataItem): string | null => {
    const latestLineup = findLatestLineupWhereActressExists(actress)
    if (latestLineup) {
      return getLineupProfilePicture(actress, latestLineup.id, undefined) || null
    }
    return null
  }

  // Get default profile picture with fallback hierarchy
  const getDefaultProfilePicture = (actress: MasterDataItem): string | null => {
    // Priority 1: Group-specific profile picture (user preference)
    const groupPic = getGroupProfilePicture(actress, group.name || '')
    if (groupPic) return groupPic
    
    // Priority 2: Latest generation profile picture (jika ada generation)
    if (generations.length > 0) {
      const latestGenPic = getLatestGenerationProfilePicture(actress)
      if (latestGenPic) return latestGenPic
    }
    
    // Priority 3: Latest lineup profile picture (jika ada lineup)
    if (lineups.length > 0) {
      const latestLineupPic = getLatestLineupProfilePicture(actress)
      if (latestLineupPic) return latestLineupPic
    }
    
    // Priority 4: Main profile picture (fallback terakhir)
    return actress.profilePicture || null
  }

  // Get filtered profile picture for specific generation/lineup
  const getFilteredProfilePicture = (actress: MasterDataItem, filterType: string, filterId: string): string | null => {
    if (filterType === 'generation') {
      return getGenerationProfilePicture(actress, filterId, undefined) || null
    }
    if (filterType === 'lineup') {
      return getLineupProfilePicture(actress, filterId, undefined) || null
    }
    return getDefaultProfilePicture(actress)
  }

  // Filter actresses based on generation/lineup
  const getFilteredActresses = (filterType: string, filterId: string): MasterDataItem[] => {
    if (filterType === 'default') {
      return groupMembers
    }
    
    return groupMembers.filter(actress => {
      if (filterType === 'generation') {
        return actress.generationData && actress.generationData[filterId]
      }
      if (filterType === 'lineup') {
        return actress.lineupData && actress.lineupData[filterId]
      }
      return true
    })
  }

  // Get dropdown options for view mode
  const getViewModeOptions = () => {
    const options = [
      { value: 'default', label: 'Default View' }
    ]
    
    // Add generation options
    generations.forEach((generation, index) => {
      options.push({
        value: `generation-${generation.id}`,
        label: `Generation: ${generation.name || `Gen ${index + 1}`}`
      })
    })
    
    // Add lineup options
    lineups.forEach((lineup, index) => {
      const generationName = generations.find(gen => gen.id === lineup.generationId)?.name || `Gen ${index + 1}`
      options.push({
        value: `lineup-${lineup.id}`,
        label: `Lineup: ${lineup.name || `Lineup ${index + 1}`} (${generationName})`
      })
    })
    
    return options
  }

  // Get profile picture based on selected view mode
  const getViewModeProfilePicture = (actress: MasterDataItem) => {
    if (selectedViewMode === 'default') {
      return getDefaultProfilePicture(actress)
    }
    
    if (selectedViewMode.startsWith('generation-')) {
      const generationId = selectedViewMode.replace('generation-', '')
      return getFilteredProfilePicture(actress, 'generation', generationId)
    }
    
    if (selectedViewMode.startsWith('lineup-')) {
      const lineupId = selectedViewMode.replace('lineup-', '')
      return getFilteredProfilePicture(actress, 'lineup', lineupId)
    }
    
    return getDefaultProfilePicture(actress)
  }

  // Get alias based on selected view mode
  const getViewModeAlias = (actress: MasterDataItem) => {
    if (selectedViewMode === 'default') {
      return getGroupAlias(actress, group.name || '')
    }
    
    if (selectedViewMode.startsWith('generation-')) {
      const generationId = selectedViewMode.replace('generation-', '')
      return getGenerationAlias(actress, generationId)
    }
    
    if (selectedViewMode.startsWith('lineup-')) {
      const lineupId = selectedViewMode.replace('lineup-', '')
      return getLineupAlias(actress, lineupId)
    }
    
    return getGroupAlias(actress, group.name || '')
  }

  // Function to add actress to group
  const handleAddActressToGroup = async () => {
    if (!selectedActressId || !group.name) return
    
    try {
      setIsAddingMember(true)
      const actress = cachedActresses.find(a => a.id === selectedActressId)
      if (!actress) {
        toast.error('Actress not found')
        return
      }

      // Check if actress is already in this group
      if (actress.selectedGroups && actress.selectedGroups.includes(group.name)) {
        toast.error('Actress is already in this group')
        return
      }

      const updatedGroups = [...(actress.selectedGroups || []), group.name]
      
      // Preserve ALL existing data when updating
      const updateData = {
        name: actress.name, // Required field
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
        selectedGroups: updatedGroups
      }

      console.log('Adding actress to group with preserved data:', updateData)

      await masterDataApi.updateExtended('actress', actress.id, updateData, accessToken)

      toast.success('Actress added to group successfully!')
      setSelectedActressId('')
      
      // Reload data to reflect changes
      await loadActresses()
    } catch (err) {
      console.error('Error adding actress to group:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to add actress to group'
      toast.error(errorMessage)
    } finally {
      setIsAddingMember(false)
    }
  }

  // Function to check for duplicate actress names
  const checkForDuplicateActress = (name: string, jpname?: string): MasterDataItem | null => {
    if (!name.trim()) return null
    
    const searchName = name.trim().toLowerCase()
    const searchJpname = jpname?.trim().toLowerCase()
    
    // Check against all actresses in cache
    const duplicate = cachedActresses.find(actress => {
      const actressName = actress.name?.toLowerCase() || ''
      const actressJpname = actress.jpname?.toLowerCase() || ''
      const actressAlias = actress.alias?.toLowerCase() || ''
      
      // Check exact name match
      if (actressName === searchName) return true
      if (actressJpname === searchName) return true
      if (actressAlias === searchName) return true
      
      // Check exact jpname match (if provided)
      if (searchJpname) {
        if (actressName === searchJpname) return true
        if (actressJpname === searchJpname) return true
        if (actressAlias === searchJpname) return true
      }
      
      return false
    })
    
    return duplicate || null
  }

  // Function to create new actress and add to group
  const handleCreateNewActress = async () => {
    if (!newActressName.trim() || !group.name) return
    
    try {
      setIsCreatingActress(true)
      
      // Check for duplicates before creating
      const duplicate = checkForDuplicateActress(newActressName.trim(), newActressJpName.trim())
      if (duplicate) {
        const duplicateInfo = []
        if (duplicate.name) duplicateInfo.push(`Nama: "${duplicate.name}"`)
        if (duplicate.jpname) duplicateInfo.push(`Nama Jepang: "${duplicate.jpname}"`)
        if (duplicate.alias) duplicateInfo.push(`Alias: "${duplicate.alias}"`)
        
        const duplicateDetails = duplicateInfo.join(', ')
        const errorMessage = `Aktris dengan nama yang sama sudah ada di database!\n\nAktris yang sama:\n${duplicateDetails}\n\nSilakan gunakan nama yang berbeda atau tambahkan aktris yang sudah ada ke group ini.`
        
        toast.error(errorMessage)
        setIsCreatingActress(false)
        return
      }
      
      // Prepare group-specific data if group photo is provided
      const groupData = newActressGroupPhoto.trim() ? {
        [group.name]: {
          profilePicture: newActressGroupPhoto.trim()
        }
      } : undefined
      
      const actressData = {
        name: newActressName.trim(),
        jpname: newActressJpName.trim() || undefined,
        selectedGroups: [group.name],
        groupData: groupData
      }

      console.log('Creating new actress with data:', actressData)

      const newActress = await masterDataApi.createExtended('actress', actressData, accessToken)

      console.log('New actress created successfully:', newActress)

      toast.success('Aktris baru berhasil dibuat dan ditambahkan ke group!')
      
      // Clear form
      setNewActressName('')
      setNewActressJpName('')
      setNewActressGroupPhoto('')
      setNewActressPreviewUrl('')
      setNewActressPreviewError(false)
      setNewActressUrlWasTrimmed(false)
      
      // Reload data to reflect changes
      await loadActresses()
    } catch (err) {
      console.error('Error creating new actress:', err)
      const errorMessage = err instanceof Error ? err.message : 'Gagal membuat aktris baru'
      toast.error(errorMessage)
    } finally {
      setIsCreatingActress(false)
    }
  }

  // Function to open edit profile picture modal
  const handleEditProfilePicture = (actress: MasterDataItem) => {
    setSelectedActressForEdit(actress)
    
    // Get group-specific profile picture
    const groupSpecificPhoto = actress.groupData?.[group.name]?.profilePicture || ''
    setProfilePictureUrl(groupSpecificPhoto)
    setPreviewUrl(groupSpecificPhoto)
    setPreviewError(false)
    setEditProfileModalOpen(true)
  }

  // Function to close edit profile picture modal
  const handleCloseEditModal = () => {
    setEditProfileModalOpen(false)
    setSelectedActressForEdit(null)
    setProfilePictureUrl('')
    setPreviewUrl('')
    setPreviewError(false)
    setUrlWasTrimmed(false)
  }

  // Function to update group-specific profile picture
  const handleUpdateProfilePicture = async () => {
    if (!selectedActressForEdit || !profilePictureUrl.trim() || !group.name) return
    
    try {
      setIsUpdatingProfilePicture(true)
      setUpdatingMemberId(selectedActressForEdit.id)
      
      // Update groupData with new profile picture
      const updatedGroupData = {
        ...selectedActressForEdit.groupData,
        [group.name]: {
          ...selectedActressForEdit.groupData?.[group.name],
          profilePicture: profilePictureUrl.trim()
        }
      }
      
      const updateData = {
        name: selectedActressForEdit.name,
        jpname: selectedActressForEdit.jpname,
        birthdate: selectedActressForEdit.birthdate,
        alias: selectedActressForEdit.alias,
        links: selectedActressForEdit.links,
        takulinks: selectedActressForEdit.takulinks,
        tags: selectedActressForEdit.tags,
        photo: selectedActressForEdit.photo,
        profilePicture: selectedActressForEdit.profilePicture, // Keep original profile picture
        groupId: selectedActressForEdit.groupId,
        groupData: updatedGroupData, // Update group-specific data
        selectedGroups: selectedActressForEdit.selectedGroups
      }

      console.log('Updating group-specific profile picture with data:', updateData)

      await masterDataApi.updateExtended('actress', selectedActressForEdit.id, updateData, accessToken)

      // Update local state immediately without reloading entire page
      setGroupMembers(prevMembers => 
        prevMembers.map(member => 
          member.id === selectedActressForEdit.id 
            ? { ...member, groupData: updatedGroupData }
            : member
        )
      )

      toast.success('Group-specific profile picture updated successfully!')
      handleCloseEditModal()
      
    } catch (err) {
      console.error('Error updating group-specific profile picture:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to update group-specific profile picture'
      toast.error(errorMessage)
    } finally {
      setIsUpdatingProfilePicture(false)
      setUpdatingMemberId(null)
    }
  }

  // Prepare options for searchable combobox - only show actresses not already in group
  const actressOptions = useComboBoxOptions(
    cachedActresses.filter(actress => 
      !groupMembers.some(groupMember => groupMember.id === actress.id)
    ),
    (actress) => actress.id,
    (actress) => `${actress.name}${actress.jpname ? ` (${actress.jpname})` : ''}`,
    (actress) => [
      actress.name || '',
      actress.jpname || '',
      ...(actress.alias ? [actress.alias] : [])
    ].filter(Boolean)
  )

  // Filter and sort group members based on search
  const filteredAndSortedMembers = useMemo(() => {
    let filtered = filteredActresses
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filteredActresses.filter(actress => {
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
  }, [filteredActresses, searchQuery, sortBy, group.name])

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
    return []
  }, [group.gallery])

  // Sort generations by lineupOrder (default order for generations)
  const sortedGenerations = useMemo(() => {
    return [...generations].sort((a, b) => (a.lineupOrder || 0) - (b.lineupOrder || 0))
  }, [generations])

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
                onClick={() => openImageViewer([group.profilePicture!], 0, `${group.name} Profile Picture`)}
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
          {/* Sort Controls */}
          {groupMembers.length > 0 && (
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
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

                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">View:</span>
                    </div>
                    
                    <Select value={selectedViewMode} onValueChange={setSelectedViewMode}>
                      <SelectTrigger className="w-64">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getViewModeOptions().map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="text-sm text-muted-foreground">
                      Showing {filteredAndSortedMembers.length} of {filteredActresses.length} members
                    </div>
                  </div>
                  
                  {/* Add New Member Button - positioned at far right */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsAddMemberSectionOpen(!isAddMemberSectionOpen)}
                    className="h-8 px-3 text-xs flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    {isAddMemberSectionOpen ? 'Hide Add' : 'Add Member'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}


          {/* Collapsible Add Member Section */}
          {isAddMemberSectionOpen && (
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="space-y-6">
                  <h3 className="text-lg font-medium">Tambah Member</h3>
                  
                  {/* Add Existing Actress */}
                  <div className="space-y-4 p-4 border rounded-lg">
                    <h4 className="font-medium">Tambah Aktris yang Sudah Ada</h4>
                    <div className="flex gap-2">
                      <SearchableComboBox
                        options={actressOptions}
                        value={selectedActressId}
                        onValueChange={setSelectedActressId}
                        placeholder="Pilih aktris..."
                        searchPlaceholder="Cari aktris..."
                        emptyMessage="Tidak ada aktris ditemukan."
                        className="min-w-[300px]"
                        triggerClassName="flex-1"
                      />
                      <Button
                        type="button"
                        onClick={handleAddActressToGroup}
                        disabled={!selectedActressId || isAddingMember}
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        {isAddingMember ? 'Menambahkan...' : 'Tambah'}
                      </Button>
                    </div>
                  </div>

                  {/* Create New Actress */}
                  <div className="space-y-4 p-4 border rounded-lg">
                    <h4 className="font-medium">Buat Aktris Baru</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="newActressName">Nama Aktris</Label>
                        <Input
                          id="newActressName"
                          value={newActressName}
                          onChange={(e) => setNewActressName(e.target.value)}
                          placeholder="Masukkan nama aktris..."
                          disabled={isCreatingActress}
                          className={duplicateWarning ? 'border-red-500 focus:border-red-500' : ''}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="newActressJpName">Nama Jepang (Opsional)</Label>
                        <Input
                          id="newActressJpName"
                          value={newActressJpName}
                          onChange={(e) => setNewActressJpName(e.target.value)}
                          placeholder="Masukkan nama Jepang..."
                          disabled={isCreatingActress}
                          className={duplicateWarning ? 'border-red-500 focus:border-red-500' : ''}
                        />
                      </div>
                    </div>
                    
                    {/* Duplicate Warning */}
                    {duplicateWarning && (
                      <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                        <span className="text-red-600 text-lg">⚠️</span>
                        <div className="flex-1">
                          <div className="font-medium mb-1">Nama Aktris Sudah Ada!</div>
                          <div className="whitespace-pre-line text-sm">{duplicateWarning.split('\n')[1]}</div>
                          <div className="text-xs mt-2 text-red-500">
                            💡 Gunakan nama yang berbeda atau tambahkan aktris yang sudah ada ke group ini.
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Group Profile Picture */}
                    <div className="space-y-4">
                      <Label htmlFor="newActressGroupPhoto">Group Profile Picture (Opsional)</Label>
                      <Input
                        id="newActressGroupPhoto"
                        value={newActressGroupPhoto}
                        onChange={(e) => setNewActressGroupPhoto(e.target.value)}
                        placeholder="Masukkan URL foto group-specific..."
                        disabled={isCreatingActress}
                      />
                      
                      {/* Preview */}
                      {newActressPreviewUrl && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Preview:</Label>
                          <div className="flex justify-center">
                            <div className="w-[200px] h-[250px] rounded-lg overflow-hidden bg-muted shadow-lg">
                              <img
                                src={newActressPreviewUrl}
                                alt="Preview"
                                className="w-full h-full object-cover"
                                onError={() => setNewActressPreviewError(true)}
                                onLoad={() => setNewActressPreviewError(false)}
                              />
                            </div>
                          </div>
                          {newActressPreviewError && (
                            <div className="text-center text-red-500 text-sm">
                              ❌ Failed to load preview image
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* URL Trimmed Notification */}
                      {newActressUrlWasTrimmed && (
                        <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                          <span className="text-blue-600">✂️</span>
                          <span>URL automatically trimmed to clean image format</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        onClick={handleCreateNewActress}
                        disabled={!newActressName.trim() || isCreatingActress || !!duplicateWarning}
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        {isCreatingActress ? 'Membuat...' : duplicateWarning ? 'Nama Sudah Ada' : 'Buat Aktris Baru'}
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Ini akan membuat aktris baru dengan data placeholder. Anda dapat mengedit detail lengkap di tab Aktris nanti.
                      <br />
                      <span className="text-xs text-blue-600">💡 Tip: Fandom.com URLs will be automatically cleaned</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {filteredActresses.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No members found</h3>
              <p className="text-muted-foreground mb-4">
                {selectedViewMode === 'default' 
                  ? 'No actresses have been assigned to this group yet.'
                  : 'No actresses found in the selected filter.'
                }
              </p>
              <div className="flex gap-2 justify-center">
                <Button 
                  onClick={() => {
                    console.log('=== MANUAL TEST: Adding actresses to group ===')
                    const testActresses = actresses.slice(0, 3)
                    console.log('Adding test actresses:', testActresses.map(a => a.name))
                    
                    const testMembers = testActresses.map(actress => ({
                      ...actress,
                      selectedGroups: [...(actress.selectedGroups || []), group.name || '']
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
                      !groupMembers.find(m => m.name === name)
                    )
                    
                    // Find actresses that are in the group but shouldn't be
                    const extraActresses = groupMembers.filter(m => 
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
                const imageUrl = getViewModeProfilePicture(actress)
                const viewAlias = getViewModeAlias(actress)
                const isUpdating = updatingMemberId === actress.id
                
                return (
                  <Card 
                    key={actress.id} 
                    className={`group hover:shadow-lg transition-all duration-200 cursor-pointer ${isUpdating ? 'opacity-75' : ''}`}
                    onClick={() => !isUpdating && onProfileSelect('actress' as 'actress' | 'actor', actress.name || '')}
                  >
                    <CardContent className="p-0">
                      {/* Profile Picture */}
                      <div className="aspect-[3/4] overflow-hidden rounded-t-lg bg-muted relative">
                        {/* Loading Overlay */}
                        {isUpdating && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                            <div className="flex flex-col items-center gap-2">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                              <span className="text-white text-xs font-medium">Updating...</span>
                            </div>
                          </div>
                        )}
                        
                        {imageUrl ? (
                          <>
                            <img
                              src={imageUrl}
                              alt={`${actress.name} in ${group.name}`}
                              className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-200 ${isUpdating ? 'blur-sm' : ''}`}
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

                        {/* Action Buttons */}
                        {accessToken && !isUpdating && (
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="bg-black/20 hover:bg-black/40 backdrop-blur-sm h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditProfilePicture(actress)
                              }}
                              title="Edit Profile Picture"
                            >
                              <Camera className="h-4 w-4" />
                            </Button>
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
                        
                        {/* Show view alias if available */}
                        {viewAlias && (
                          <p className="text-xs text-blue-600 truncate" title={`View alias: ${viewAlias}`}>
                            {viewAlias}
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
                        {(actress as any).movieCount !== undefined && (actress as any).movieCount > 0 && (
                          <p className="text-xs text-muted-foreground">
                            🎬 {(actress as any).movieCount} movies
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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {sortedGenerations.map((generation) => (
                  <Card 
                    key={generation.id} 
                    className={`group hover:shadow-lg transition-all duration-200 cursor-pointer ${
                      selectedGenerationId === generation.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => handleGenerationClick(generation)}
                  >
                    <CardContent className="p-0">
                      {/* Profile Picture */}
                      <div className="aspect-[3/2] overflow-hidden rounded-t-lg bg-muted relative">
                        {generation.profilePicture ? (
                          <img
                            src={generation.profilePicture}
                            alt={generation.name || 'Generation'}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-muted text-muted-foreground">
                            <Calendar className="h-12 w-12 mb-2" />
                            <span className="text-xs text-center px-2">No generation photo</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Info */}
                      <div className="p-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-sm truncate" title={generation.name}>
                            {generation.name || 'Unnamed'}
                          </h3>
                          {generation.description && (
                            <button
                              onClick={(e) => toggleGenerationDescription(generation.id, e)}
                              className="ml-2 p-1 hover:bg-gray-100 rounded transition-colors"
                            >
                              <ChevronDown 
                                className={`h-3 w-3 text-gray-500 transition-transform duration-200 ${
                                  expandedGenerations.has(generation.id) ? 'rotate-180' : ''
                                }`} 
                              />
                            </button>
                          )}
                        </div>
                        
                        {/* Show alias if available */}
                        {generation.alias && (
                          <p className="text-xs text-blue-600 truncate" title={`Alias: ${generation.alias}`}>
                            {generation.alias}
                          </p>
                        )}
                        
                        {/* Show Japanese name if available */}
                        {generation.jpname && (
                          <p className="text-xs text-muted-foreground truncate" title={generation.jpname}>
                            {generation.jpname}
                          </p>
                        )}
                        
                        {/* Show age if available */}
                        {generation.birthdate && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{calculateAge(generation.birthdate)} years</span>
                          </div>
                        )}
                        
                        {/* Movie count badge */}
                        {(generation as any).movieCount !== undefined && (generation as any).movieCount > 0 && (
                          <p className="text-xs text-muted-foreground">
                            🎬 {(generation as any).movieCount} movies
                          </p>
                        )}
                        
                        {/* Description - expandable */}
                        {generation.description && expandedGenerations.has(generation.id) && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-700">
                            {generation.description}
                          </div>
                        )}

                        {/* View Lineups Button */}
                        <div className="mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              // Check if this generation is currently selected and lineups are showing
                              if (selectedGenerationId === generation.id && showLineups) {
                                setShowLineups(false) // Hide lineups
                              } else {
                                handleViewLineups(generation) // Show lineups for this generation
                              }
                            }}
                            className="h-6 px-2 text-xs w-full"
                          >
                            {selectedGenerationId === generation.id && showLineups ? 'Hide Lineups' : 'View Lineups'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Unified Sort Controls */}
              {selectedGenerationId && (
                <Card className="mb-6">
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Filter className="h-4 w-4" />
                          <span className="text-sm font-medium">Sort:</span>
                        </div>
                        
                        <Select 
                          value={showLineups ? lineupSortBy : generationSortBy} 
                          onValueChange={showLineups ? setLineupSortBy : setGenerationSortBy}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(showLineups ? lineupSortOptions : generationSortOptions).map(option => (
                              <SelectItem key={option.key} value={option.key}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <div className="text-sm text-muted-foreground">
                          Sort actresses by: {(showLineups ? lineupSortOptions : generationSortOptions).find(opt => opt.key === (showLineups ? lineupSortBy : generationSortBy))?.label || 'Name (A-Z)'}
                        </div>
                      </div>

                      {/* Version Selector and Action Button */}
                      <div className="flex items-center gap-2">
                        {(() => {
                          // Get all available versions based on context
                          const availableVersions = new Set<string>()
                          
                          if (showLineups) {
                            // For lineups context
                            actresses.forEach(actress => {
                              if (actress.lineupData) {
                                Object.values(actress.lineupData).forEach(lineupData => {
                                  if (lineupData?.photoVersions) {
                                    Object.keys(lineupData.photoVersions).forEach(version => availableVersions.add(version))
                                  }
                                })
                              }
                            })
                          } else {
                            // For generation context
                            generationActresses.forEach(actress => {
                              const generationData = actress.generationData?.[selectedGenerationId || '']
                              if (generationData?.photoVersions) {
                                Object.keys(generationData.photoVersions).forEach(version => availableVersions.add(version))
                              }
                            })
                          }
                          
                          const versionOptions = Array.from(availableVersions).sort()
                          
                          if (versionOptions.length > 0) {
                            return (
                              <>
                                <span className="text-sm text-muted-foreground">Version:</span>
                                <Select 
                                  value={showLineups ? selectedLineupVersion : selectedVersion} 
                                  onValueChange={showLineups ? setSelectedLineupVersion : setSelectedVersion}
                                >
                                  <SelectTrigger className="w-40">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="default">Default</SelectItem>
                                    {versionOptions.map(version => (
                                      <SelectItem key={version} value={version}>{version}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </>
                            )
                          }
                          return null
                        })()}
                        
                        {/* View Lineups Button */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            if (showLineups) {
                              setShowLineups(false)
                            } else {
                              // If we have a selected generation, load lineup data and switch to lineup view
                              if (selectedGenerationId) {
                                if (!lineupDataLoaded) {
                                  await loadLineupData(selectedGenerationId)
                                }
                                setShowLineups(true)
                              }
                            }
                          }}
                          className="h-8 px-3 text-xs"
                        >
                          {showLineups ? 'Hide Lineups' : 'View Lineups'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Lineup Display */}
              {selectedGenerationId && (
                <div className={`transition-all duration-300 ${showLineups ? 'opacity-100 mt-6' : 'opacity-0 mt-0 hidden'}`}>
                  <div className="mb-4">
                    <h4 className="text-lg font-medium">
                      Lineups in {generations.find(g => g.id === selectedGenerationId)?.name} Generation
                    </h4>
                  </div>
                  <LineupDisplay
                    generationId={selectedGenerationId}
                    generationName={generations.find(g => g.id === selectedGenerationId)?.name || 'Unnamed Generation'}
                    accessToken={accessToken}
                    onProfileSelect={(type: string, name: string) => onProfileSelect(type as 'actress' | 'actor', name)}
                    getLineupProfilePicture={(actress, lineupId) => getLineupProfilePicture(actress, lineupId, selectedLineupVersion === 'default' ? undefined : selectedLineupVersion) || null}
                    getLineupAlias={(actress, lineupId) => getLineupAlias(actress, lineupId) || null}
                    selectedLineupVersion={selectedLineupVersion}
                    onLineupVersionChange={setSelectedLineupVersion}
                    sortBy={lineupSortBy}
                    onSortChange={setLineupSortBy}
                    lineups={lineupData?.lineups || []}
                    actresses={lineupData?.actresses || []}
                    onDataChange={() => {
                      // Don't trigger refresh loop - data is already fresh
                      console.log('LineupDisplay: Data changed, but not triggering refresh to avoid loop')
                    }}
                  />
                </div>
              )}

              {/* Selected Generation Actresses */}
              {selectedGenerationId && (
                <div className={`transition-all duration-300 ${!showLineups ? 'opacity-100 mt-6' : 'opacity-0 mt-0 hidden'}`}>
                  <div className="mb-4">
                    <div className="flex items-center gap-2">
                      <h4 className="text-lg font-medium">
                        Actresses in {generations.find(g => g.id === selectedGenerationId)?.name} Generation
                        {isLoadingGeneration && cachedActresses.length === 0 && (
                          <span className="ml-2 text-sm text-gray-500">(Loading...)</span>
                        )}
                      </h4>
                      <Badge variant="secondary">
                        {generationActresses.length} actresses
                      </Badge>
                    </div>
                  </div>
                  
                  {generationActresses.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                      <User className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <h5 className="font-medium text-gray-900 mb-1">No actresses assigned</h5>
                      <p className="text-sm text-gray-500">No actresses have been assigned to this generation yet.</p>
                    </div>
                  ) : (
                    <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 transition-opacity duration-300 ${isLoadingGeneration ? 'opacity-50' : 'opacity-100'}`}>
                      {memoizedGenerationActresses.map((actress) => {
                        const imageUrl = actress.imageUrl
                        const generationAlias = actress.generationAlias
                        
                        return (
                          <Card 
                            key={actress.id} 
                            className="group hover:shadow-lg transition-all duration-200 cursor-pointer"
                            onClick={() => onProfileSelect('actress' as 'actress' | 'actor', actress.name || '')}
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
                    onClick={() => openImageViewer(groupGalleryPhotos, index, `${group.name || ''} Gallery`)}
                  >
                    <img
                      src={photoUrl}
                      alt={`${group.name || ''} Gallery Photo ${index + 1}`}
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

      {/* Edit Profile Picture Modal */}
      <Dialog open={editProfileModalOpen} onOpenChange={setEditProfileModalOpen}>
        <DialogContent 
          className="!max-w-none !max-h-[95vh] !w-[80vw] !h-[80vh] flex flex-col"
          style={{ 
            maxWidth: 'none !important',
            width: '80vw !important',
            maxHeight: '95vh !important',
            height: '80vh !important'
          }}
          data-custom-dialog="true"
        >
          <DialogHeader className="flex-shrink-0 p-6 pb-4">
            <DialogTitle className="text-xl font-semibold">Edit Group Profile Picture</DialogTitle>
            <DialogDescription className="text-base">
              Update group-specific profile picture for {selectedActressForEdit?.name} in {group.name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedActressForEdit && (
            <div className="flex-1 overflow-auto p-6 pt-0 space-y-6">
              {/* Preview Group-Specific Profile Picture */}
              <div className="space-y-4">
                <Label className="text-lg font-medium">
                  {previewUrl ? 'Preview Group Profile Picture' : 'Current Group Profile Picture'}
                </Label>
                <div className="flex justify-center">
                  <div className="w-[250px] h-[312px] sm:w-[300px] sm:h-[375px] md:w-[350px] md:h-[437px] rounded-lg overflow-hidden bg-muted shadow-lg">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt={`${selectedActressForEdit.name} in ${group.name}`}
                        className="w-full h-full object-cover"
                        onError={() => setPreviewError(true)}
                        onLoad={() => setPreviewError(false)}
                      />
                    ) : selectedActressForEdit.groupData?.[group.name]?.profilePicture ? (
                      <img
                        src={selectedActressForEdit.groupData[group.name].profilePicture}
                        alt={`${selectedActressForEdit.name} in ${group.name}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                        <User className="h-24 w-24 mb-4" />
                        <span className="text-sm text-center px-4">
                          No group-specific photo for {group.name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                {previewError && previewUrl && (
                  <div className="text-center text-red-500 text-sm">
                    ❌ Failed to load preview image. Please check the URL.
                  </div>
                )}
                {previewUrl && !previewError && (
                  <div className="text-center text-green-600 text-sm">
                    ✅ Preview loaded successfully
                  </div>
                )}
              </div>

              {/* URL Input */}
              <div className="space-y-4">
                <Label htmlFor="profilePictureUrl" className="text-lg font-medium">Group Profile Picture URL</Label>
                <Input
                  id="profilePictureUrl"
                  value={profilePictureUrl}
                  onChange={(e) => setProfilePictureUrl(e.target.value)}
                  placeholder="Enter group-specific image URL..."
                  className="h-12 text-lg"
                />
                {urlWasTrimmed && (
                  <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <span className="text-blue-600">✂️</span>
                    <span>URL automatically trimmed to clean image format</span>
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  This will set a specific profile picture for {selectedActressForEdit.name} when displayed in {group.name} context.
                  <br />
                  <span className="text-xs text-blue-600">💡 Tip: Fandom.com URLs will be automatically cleaned (removes parameters like ?cb=...)</span>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-6 pt-8 border-t border-border/50">
                <Button 
                  variant="outline" 
                  onClick={handleCloseEditModal} 
                  className="!h-16 !px-16 !text-xl !font-semibold !min-w-[160px] !border-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  style={{
                    height: '64px !important',
                    paddingLeft: '64px !important',
                    paddingRight: '64px !important',
                    fontSize: '20px !important',
                    fontWeight: '600 !important',
                    minWidth: '160px !important',
                    borderWidth: '2px !important'
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdateProfilePicture}
                  disabled={!profilePictureUrl.trim() || isUpdatingProfilePicture}
                  className="!h-16 !px-16 !text-xl !font-semibold !min-w-[280px] bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  style={{
                    height: '64px !important',
                    paddingLeft: '64px !important',
                    paddingRight: '64px !important',
                    fontSize: '20px !important',
                    fontWeight: '600 !important',
                    minWidth: '280px !important'
                  }}
                >
                  {isUpdatingProfilePicture ? 'Updating...' : 'Update Group Profile Picture'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  )
}