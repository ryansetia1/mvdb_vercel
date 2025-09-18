import React, { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs'
import { Badge } from '../../ui/badge'
import { Users, Calendar, Users2, User, Plus } from 'lucide-react'
import { MasterDataItem, masterDataApi } from '../../../utils/masterDataApi'
import { Photobook, photobookApi } from '../../../utils/photobookApi'
import { PhotobookGrid } from '../../photobooks/PhotobookGrid'
import { PhotobookLinkingDialog } from '../../photobooks/PhotobookLinkingDialog'
import { useCachedData } from '../../../hooks/useCachedData'
import { useBatchedUpdates } from '../../../hooks/useBatchedState'
import { toast } from 'sonner'

interface PhotobooksTabContentProps {
  group: MasterDataItem
  accessToken: string
  onPhotobookSelect: (photobook: Photobook) => void
  // Cache props untuk persistence across main tabs
  cachedPhotobooks?: {
    group: Photobook[]
    generation: Photobook[]
    lineup: Photobook[]
    member: Photobook[]
  }
  cachedHierarchy?: {
    generations: MasterDataItem[]
    lineups: MasterDataItem[]
    members: MasterDataItem[]
  }
  onCacheUpdate?: (photobooks: any, hierarchy: any) => void
}

export function PhotobooksTabContent({ 
  group, 
  accessToken, 
  onPhotobookSelect, 
  cachedPhotobooks, 
  cachedHierarchy, 
  onCacheUpdate 
}: PhotobooksTabContentProps) {
  const { loadData: loadCachedData } = useCachedData()
  const { batchUpdate } = useBatchedUpdates()
  const [activeSubTab, setActiveSubTab] = useState('group')
  const [photobooks, setPhotobooks] = useState<{
    group: Photobook[]
    generation: Photobook[]
    lineup: Photobook[]
    member: Photobook[]
  }>({
    group: [],
    generation: [],
    lineup: [],
    member: []
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isLinking, setIsLinking] = useState(false)
  const [isUnlinking, setIsUnlinking] = useState(false)
  const [linkingDialogOpen, setLinkingDialogOpen] = useState(false)
  const [linkingTarget, setLinkingTarget] = useState<{
    type: 'group' | 'generation' | 'lineup' | 'member'
    id: string
    name: string
  } | null>(null)

  // New state for hierarchy data
  const [generations, setGenerations] = useState<MasterDataItem[]>([])
  const [lineups, setLineups] = useState<MasterDataItem[]>([])
  const [members, setMembers] = useState<MasterDataItem[]>([])
  
  // Loading states for each sub tab
  const [loadingStates, setLoadingStates] = useState({
    generation: false,
    lineup: false,
    member: false
  })

  // Check if we have any data loaded to prevent unnecessary reloading
  const hasAnyData = useMemo(() => {
    return (photobooks.group?.length || 0) > 0 || 
           (photobooks.generation?.length || 0) > 0 || 
           (photobooks.lineup?.length || 0) > 0 || 
           (photobooks.member?.length || 0) > 0 ||
           generations.length > 0 || 
           lineups.length > 0 || 
           members.length > 0
  }, [photobooks, generations, lineups, members])

  // Load photobooks and hierarchy data when component mounts
  useEffect(() => {
    if (accessToken) {
      // Check if we have cached data from parent component
      const hasParentCache = cachedPhotobooks && cachedHierarchy
      
      if (hasParentCache) {
        // Use cached data immediately with batched updates
        batchUpdate(() => {
          setGenerations(cachedHierarchy!.generations)
          setLineups(cachedHierarchy!.lineups)
          setMembers(cachedHierarchy!.members)
          setPhotobooks(cachedPhotobooks!)
          setIsLoading(false)
        })
        
        // Reset all loading states since data is already available
        setLoadingStates({
          generation: false,
          lineup: false,
          member: false
        })
        
        console.log('Using cached photobooks data:', {
          group: cachedPhotobooks.group.length,
          generation: cachedPhotobooks.generation.length,
          lineup: cachedPhotobooks.lineup.length,
          member: cachedPhotobooks.member.length
        })
      } else {
        // No cached data available, show loading states
        setLoadingStates({
          generation: true,
          lineup: true,
          member: true
        })
        
        // Start loading photobooks and sub-tabs in parallel
        loadPhotobooks().then(() => {
          setIsLoading(false) // Show UI only after data is loaded
        }).catch(() => {
          setIsLoading(false) // Show UI even on error
        })
      }
    }
  }, [accessToken, group.id, cachedPhotobooks, cachedHierarchy])

  // Separate effect to handle cached data updates without triggering reload
  useEffect(() => {
    if (cachedPhotobooks && cachedHierarchy && !isLoading && !hasAnyData) {
      console.log('Updating with cached data from parent')
      batchUpdate(() => {
        setGenerations(cachedHierarchy!.generations)
        setLineups(cachedHierarchy!.lineups)
        setMembers(cachedHierarchy!.members)
        setPhotobooks(cachedPhotobooks!)
      })
    }
  }, [cachedPhotobooks, cachedHierarchy, isLoading, hasAnyData])

  // Effect to update parent cache when data changes
  useEffect(() => {
    if (onCacheUpdate && hasAnyData) {
      const currentHierarchy = {
        generations,
        lineups,
        members
      }
      
      // Only update cache if data has actually changed
      const hasHierarchyChanged = 
        JSON.stringify(currentHierarchy) !== JSON.stringify(cachedHierarchy) ||
        JSON.stringify(photobooks) !== JSON.stringify(cachedPhotobooks)
      
      if (hasHierarchyChanged) {
        console.log('Updating parent cache with current data')
        onCacheUpdate(photobooks, currentHierarchy)
      }
    }
  }, [photobooks, generations, lineups, members, onCacheUpdate, cachedPhotobooks, cachedHierarchy, hasAnyData])

  // Effect to prevent unnecessary reloading when component re-mounts
  useEffect(() => {
    if (hasAnyData && !isLoading) {
      console.log('Component re-mounted with existing data, preventing reload')
      // Ensure all loading states are false
      setLoadingStates({
        generation: false,
        lineup: false,
        member: false
      })
    }
  }, [hasAnyData, isLoading])

  const loadPhotobooks = async (hierarchyData?: { generations: MasterDataItem[], lineups: MasterDataItem[], members: MasterDataItem[] }) => {
    try {
      // Load group photobooks first (most important) to show immediately with timeout
      const groupPhotobooksPromise = photobookApi.getPhotobooksByGroup(group.id, accessToken)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 5000)
      )
      
      const groupPhotobooks = await Promise.race([groupPhotobooksPromise, timeoutPromise])
      
      // Update state immediately with group photobooks for instant display
      setPhotobooks(prev => ({
        ...prev,
        group: groupPhotobooks
      }))
      
      // Start loading sub-tabs immediately and wait for completion
      if (!hierarchyData) {
        // Load hierarchy data and start sub-tabs loading in parallel
        const hierarchyResult = await loadHierarchyData()
        if (hierarchyResult) {
          await startBackgroundLoading(hierarchyResult)
        }
      } else {
        // Start background loading for all tabs with provided hierarchy data
        await startBackgroundLoading(hierarchyData)
      }
      
    } catch (error) {
      console.error('Error loading photobooks:', error)
      toast.error('Failed to load photobooks')
      
      // Reset loading states on error
      setLoadingStates({
        generation: false,
        lineup: false,
        member: false
      })
    }
  }

  // Background loading function for all sub tabs
  const startBackgroundLoading = async (hierarchyData: { generations: MasterDataItem[], lineups: MasterDataItem[], members: MasterDataItem[] }) => {
    // Load all tabs that don't have data yet
    const loadPromises: Promise<void>[] = []
    
    if ((photobooks.generation?.length || 0) === 0) {
      loadPromises.push(loadSubTabPhotobooks('generation', hierarchyData))
    }
    
    if ((photobooks.lineup?.length || 0) === 0) {
      loadPromises.push(loadSubTabPhotobooks('lineup', hierarchyData))
    }
    
    if ((photobooks.member?.length || 0) === 0) {
      loadPromises.push(loadSubTabPhotobooks('member', hierarchyData))
    }
    
    if (loadPromises.length > 0) {
      console.log(`Starting background loading for ${loadPromises.length} tabs`)
      
      // Execute background loading in parallel and wait for completion
      try {
        await Promise.allSettled(loadPromises)
        console.log(`Background loading completed for all ${loadPromises.length} tabs`)
      } catch (error) {
        console.error('Error in background loading:', error)
      }
    } else {
      console.log('All tabs already have data, skipping background loading')
    }
  }
  
  // Load photobooks for specific sub tab
  const loadSubTabPhotobooks = async (tabType: 'generation' | 'lineup' | 'member', hierarchyData?: { generations: MasterDataItem[], lineups: MasterDataItem[], members: MasterDataItem[] }) => {
    // Check if data already exists
    const currentData = photobooks[tabType]
    if (currentData && currentData.length > 0) {
      console.log(`${tabType} data already exists, skipping load`)
      // Reset loading state since data already exists
      setLoadingStates(prev => ({ ...prev, [tabType]: false }))
      return
    }
    
    // Allow loading even if other data exists - user might be switching tabs
    // Don't set loading state here since it's already set to true
    
    try {
      // Use provided hierarchy data or load if not available
      let currentGenerations = generations
      let currentLineups = lineups
      let currentMembers = members
      
      if (hierarchyData) {
        currentGenerations = hierarchyData.generations || []
        currentLineups = hierarchyData.lineups || []
        currentMembers = hierarchyData.members || []
      } else if (currentGenerations.length === 0 || currentLineups.length === 0 || currentMembers.length === 0) {
        const hierarchyResult = await loadHierarchyData()
        if (hierarchyResult) {
          currentGenerations = hierarchyResult.generations || []
          currentLineups = hierarchyResult.lineups || []
          currentMembers = hierarchyResult.members || []
        }
      }
      
      // Load photobooks for specific tab type
      let photobooks: Photobook[] = []
      
      if (tabType === 'generation') {
        photobooks = await Promise.all(currentGenerations.map(generation => 
          photobookApi.getPhotobooksByGeneration(generation.id, accessToken)
        )).then(results => results.flat())
      } else if (tabType === 'lineup') {
        photobooks = await Promise.all(currentLineups.map(lineup => 
          photobookApi.getPhotobooksByLineup(lineup.id, accessToken)
        )).then(results => results.flat())
      } else if (tabType === 'member') {
        photobooks = await Promise.all(currentMembers.map(member => 
          photobookApi.getPhotobooksByMember(member.id, accessToken)
        )).then(results => results.flat())
      }
      
      // Update photobooks for this tab
      setPhotobooks(prev => ({
        ...prev,
        [tabType]: photobooks
      }))
      
      console.log(`Successfully loaded ${photobooks.length} ${tabType} photobooks`)
      
      // If no photobooks found, still update loading state to false
      if (photobooks.length === 0) {
        console.log(`No ${tabType} photobooks found, updating loading state`)
      }
      
      // Add a small delay to ensure state updates are processed
      await new Promise(resolve => setTimeout(resolve, 100))
      
    } catch (error) {
      console.error(`Error loading ${tabType} photobooks:`, error)
      toast.error(`Failed to load ${tabType} photobooks`)
    } finally {
      setLoadingStates(prev => ({ ...prev, [tabType]: false }))
    }
  }

  const loadHierarchyData = async () => {
    try {
      // Load all hierarchy data in parallel with caching
      const [generationsData, allLineups, allActresses] = await Promise.all([
        masterDataApi.getGenerationsByGroup(group.id, accessToken),
        loadCachedData('lineups', () => masterDataApi.getByType('lineup', accessToken)),
        loadCachedData('actresses', () => masterDataApi.getByType('actress', accessToken))
      ])
      
      // Filter lineups and members based on generations
      const groupLineups = (allLineups || []).filter(lineup => 
        generationsData.some(gen => gen.id === lineup.generationId)
      )
      
      const groupMembers = (allActresses || []).filter(actress => 
        actress.selectedGroups && actress.selectedGroups.includes(group.name || '')
      )
      
      // Batch hierarchy data updates
      batchUpdate(() => {
        setGenerations(generationsData)
        setLineups(groupLineups)
        setMembers(groupMembers)
      })
      
      console.log(`Hierarchy data loaded: ${generationsData.length} generations, ${groupLineups.length} lineups, ${groupMembers.length} members`)
      
      // Return hierarchy data for immediate use
      return {
        generations: generationsData,
        lineups: groupLineups,
        members: groupMembers
      }
    } catch (error) {
      console.error('Error loading hierarchy data:', error)
      toast.error('Failed to load hierarchy data')
      return null
    }
  }

  const handleLinkPhotobook = useCallback(async (photobookId: string, targetType: string, targetId: string) => {
    setIsLinking(true)
    try {
      console.log('PhotobooksTabContent: Linking photobook:', {
        photobookId,
        targetType,
        targetId,
        groupId: group.id,
        groupName: group.name
      })

      await photobookApi.linkPhotobook(
        photobookId,
        targetType as 'group' | 'generation' | 'lineup' | 'member',
        targetId,
        accessToken
      )
      
      // Reload hierarchy data first, then photobooks to reflect the new link
      const hierarchyData = await loadHierarchyData()
      if (hierarchyData) {
        await loadPhotobooks(hierarchyData)
      }
      
      toast.success('Photobook linked successfully')
    } catch (error) {
      console.error('Error linking photobook:', error)
      toast.error('Failed to link photobook')
    } finally {
      setIsLinking(false)
    }
  }, [group.id, group.name, accessToken])

  const handleUnlinkPhotobook = useCallback(async (photobook: Photobook, targetType: string, targetId: string) => {
    setIsUnlinking(true)
    try {
      await photobookApi.unlinkPhotobook(
        photobook.id!,
        targetType as 'group' | 'generation' | 'lineup' | 'member',
        accessToken
      )
      
      // Reload hierarchy data first, then photobooks to reflect the unlink
      const hierarchyData = await loadHierarchyData()
      if (hierarchyData) {
        await loadPhotobooks(hierarchyData)
      }
      
      toast.success('Photobook unlinked successfully')
    } catch (error) {
      console.error('Error unlinking photobook:', error)
      toast.error('Failed to unlink photobook')
    } finally {
      setIsUnlinking(false)
    }
  }, [accessToken])

  const openLinkingDialog = useCallback((targetType: 'group' | 'generation' | 'lineup' | 'member') => {
    setLinkingTarget({ 
      type: targetType, 
      id: targetType === 'group' ? group.id : '', 
      name: targetType === 'group' ? group.name : targetType 
    })
    setLinkingDialogOpen(true)
  }, [group.id, group.name])

  // Memoize tab change handler to prevent unnecessary re-renders
  const handleTabChange = useCallback((value: string) => {
    setActiveSubTab(value)
    // Data is now loaded in background, so no need to load on tab change
    // Just switch to the tab - data should already be available
    console.log(`Switching to ${value} tab - data should already be available`)
  }, [])

  // Memoize photobook counts to prevent unnecessary badge re-renders
  const photobookCounts = useMemo(() => ({
    group: photobooks.group?.length || 0,
    generation: photobooks.generation?.length || 0,
    lineup: photobooks.lineup?.length || 0,
    member: photobooks.member?.length || 0
  }), [photobooks])

  // Memoize dynamic tab labels based on loading states
  const tabLabels = useMemo(() => ({
    group: isLoading ? 'Loading Group...' : 'Group',
    generation: loadingStates.generation ? 'Loading Generation...' : 'Generation',
    lineup: loadingStates.lineup ? 'Loading Lineup...' : 'Lineup',
    member: loadingStates.member ? 'Loading Member...' : 'Member'
  }), [isLoading, loadingStates])

  // Memoize tab descriptions for better UX
  const tabDescriptions = useMemo(() => ({
    group: isLoading ? 'Fetching group photobooks...' : `${photobookCounts.group} photobooks linked to group`,
    generation: loadingStates.generation ? 'Fetching generation photobooks...' : `${photobookCounts.generation} photobooks linked to generations`,
    lineup: loadingStates.lineup ? 'Fetching lineup photobooks...' : `${photobookCounts.lineup} photobooks linked to lineups`,
    member: loadingStates.member ? 'Fetching member photobooks...' : `${photobookCounts.member} photobooks linked to members`
  }), [isLoading, loadingStates, photobookCounts])


  return (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <Tabs value={activeSubTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="group" className="flex flex-col items-center gap-1 py-2" title={tabDescriptions.group}>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="truncate text-sm font-medium">{tabLabels.group}</span>
              {!isLoading && photobookCounts.group > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {photobookCounts.group}
                </Badge>
              )}
            </div>
          </TabsTrigger>
          <TabsTrigger value="generation" className="flex flex-col items-center gap-1 py-2" title={tabDescriptions.generation}>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="truncate text-sm font-medium">{tabLabels.generation}</span>
              {loadingStates.generation ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
              ) : photobookCounts.generation > 0 ? (
                <Badge variant="secondary" className="text-xs">
                  {photobookCounts.generation}
                </Badge>
              ) : null}
            </div>
          </TabsTrigger>
          <TabsTrigger value="lineup" className="flex flex-col items-center gap-1 py-2" title={tabDescriptions.lineup}>
            <div className="flex items-center gap-2">
              <Users2 className="h-4 w-4" />
              <span className="truncate text-sm font-medium">{tabLabels.lineup}</span>
              {loadingStates.lineup ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
              ) : photobookCounts.lineup > 0 ? (
                <Badge variant="secondary" className="text-xs">
                  {photobookCounts.lineup}
                </Badge>
              ) : null}
            </div>
          </TabsTrigger>
          <TabsTrigger value="member" className="flex flex-col items-center gap-1 py-2" title={tabDescriptions.member}>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="truncate text-sm font-medium">{tabLabels.member}</span>
              {loadingStates.member ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
              ) : photobookCounts.member > 0 ? (
                <Badge variant="secondary" className="text-xs">
                  {photobookCounts.member}
                </Badge>
              ) : null}
            </div>
          </TabsTrigger>
        </TabsList>

        {/* Sub-tab Contents */}
        <TabsContent value="group" className="mt-6">
          <PhotobookSubTabContent
            photobooks={photobooks.group || []}
            targetType="group"
            targetId={group.id}
            targetName={group.name || 'Group'}
            isLoading={isLoading || isLinking || isUnlinking}
            onLinkPhotobooks={() => openLinkingDialog('group')}
            onPhotobookSelect={onPhotobookSelect}
            onUnlinkPhotobook={handleUnlinkPhotobook}
            group={group}
            generations={generations}
            lineups={lineups}
            members={members}
          />
        </TabsContent>

        <TabsContent value="generation" className="mt-6">
          <PhotobookSubTabContent
            photobooks={photobooks.generation || []}
            targetType="generation"
            targetId=""
            targetName="Generation"
            isLoading={loadingStates.generation || isLinking || isUnlinking}
            onLinkPhotobooks={() => openLinkingDialog('generation')}
            onPhotobookSelect={onPhotobookSelect}
            onUnlinkPhotobook={handleUnlinkPhotobook}
            group={group}
            generations={generations}
            lineups={lineups}
            members={members}
          />
        </TabsContent>

        <TabsContent value="lineup" className="mt-6">
          <PhotobookSubTabContent
            photobooks={photobooks.lineup || []}
            targetType="lineup"
            targetId=""
            targetName="Lineup"
            isLoading={loadingStates.lineup || isLinking || isUnlinking}
            onLinkPhotobooks={() => openLinkingDialog('lineup')}
            onPhotobookSelect={onPhotobookSelect}
            onUnlinkPhotobook={handleUnlinkPhotobook}
            group={group}
            generations={generations}
            lineups={lineups}
            members={members}
          />
        </TabsContent>

        <TabsContent value="member" className="mt-6">
          <PhotobookSubTabContent
            photobooks={photobooks.member || []}
            targetType="member"
            targetId=""
            targetName="Member"
            isLoading={loadingStates.member || isLinking || isUnlinking}
            onLinkPhotobooks={() => openLinkingDialog('member')}
            onPhotobookSelect={onPhotobookSelect}
            onUnlinkPhotobook={handleUnlinkPhotobook}
            group={group}
            generations={generations}
            lineups={lineups}
            members={members}
          />
        </TabsContent>
      </Tabs>

      {/* Loading Overlay for Linking/Unlinking Operations */}
      {(isLinking || isUnlinking) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3 shadow-lg">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-700 font-medium">
              {isLinking ? 'Linking photobook...' : 'Unlinking photobook...'}
            </span>
          </div>
        </div>
      )}

      {/* Linking Dialog */}
      <PhotobookLinkingDialog
        open={linkingDialogOpen}
        onOpenChange={setLinkingDialogOpen}
        targetType={linkingTarget?.type}
        targetId={linkingTarget?.id}
        targetName={linkingTarget?.name}
        onLink={handleLinkPhotobook}
        accessToken={accessToken}
        generations={generations}
        lineups={lineups}
        members={members}
      />
    </div>
  )
}

// Sub-tab content component
interface PhotobookSubTabContentProps {
  photobooks: Photobook[]
  targetType: 'group' | 'generation' | 'lineup' | 'member'
  targetId: string
  targetName: string
  isLoading: boolean
  onLinkPhotobooks: () => void
  onPhotobookSelect: (photobook: Photobook) => void
  onUnlinkPhotobook: (photobook: Photobook, targetType: string, targetId: string) => void
  group: MasterDataItem
  generations: MasterDataItem[]
  lineups: MasterDataItem[]
  members: MasterDataItem[]
}

const PhotobookSubTabContent = memo(function PhotobookSubTabContent({
  photobooks,
  targetType,
  targetId,
  targetName,
  isLoading,
  onLinkPhotobooks,
  onPhotobookSelect,
  onUnlinkPhotobook,
  group,
  generations,
  lineups,
  members
}: PhotobookSubTabContentProps) {
  const handleUnlink = useCallback((photobook: Photobook) => {
    onUnlinkPhotobook(photobook, targetType, targetId)
  }, [onUnlinkPhotobook, targetType, targetId])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">
            {targetName} Photobooks
          </h2>
          <p className="text-gray-500 text-sm">
            {photobooks?.length || 0} photobook{(photobooks?.length || 0) !== 1 ? 's' : ''} linked
          </p>
        </div>
        
        {(photobooks?.length || 0) > 0 && (
          <button
            onClick={onLinkPhotobooks}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Link More
          </button>
        )}
      </div>

      {/* Photobook Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 gap-y-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 rounded-lg aspect-[3/4] mb-2"></div>
              <div className="h-4 bg-gray-200 rounded mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : (
        <PhotobookGrid
          photobooks={photobooks}
          onPhotobookClick={onPhotobookSelect}
          onUnlinkPhotobook={handleUnlink}
          showUnlinkButtons={true}
          isLoading={isLoading}
          emptyStateMessage={`No photobooks linked to ${targetName.toLowerCase()}`}
          onLinkPhotobooks={onLinkPhotobooks}
          generations={generations}
          lineups={lineups}
          members={members}
        />
      )}
    </div>
  )
})
