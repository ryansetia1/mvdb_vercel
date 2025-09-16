import React, { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs'
import { Badge } from '../../ui/badge'
import { Users, Calendar, Users2, User, Plus } from 'lucide-react'
import { MasterDataItem, masterDataApi } from '../../../utils/masterDataApi'
import { Photobook, photobookApi } from '../../../utils/photobookApi'
import { PhotobookGrid } from '../../photobooks/PhotobookGrid'
import { PhotobookLinkingDialog } from '../../photobooks/PhotobookLinkingDialog'
import { useCachedData } from '../../../hooks/useCachedData'
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

  // Load photobooks and hierarchy data when component mounts
  useEffect(() => {
    if (accessToken) {
      // Check if we have cached data from parent component
      const hasParentCache = cachedPhotobooks && cachedHierarchy
      
      if (hasParentCache) {
        // Use cached data immediately without logging to reduce console spam
        setGenerations(cachedHierarchy!.generations)
        setLineups(cachedHierarchy!.lineups)
        setMembers(cachedHierarchy!.members)
        setPhotobooks(cachedPhotobooks!)
        setIsLoading(false)
      } else {
        // Start loading immediately without waiting for hierarchy data
        setIsLoading(false) // Show UI immediately
        loadPhotobooks() // Load photobooks in background
      }
    }
  }, [accessToken, group.id, cachedPhotobooks, cachedHierarchy])

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
      
      // Load hierarchy data if not provided (but don't wait for it)
      if (!hierarchyData) {
        loadHierarchyData() // Load in background, don't await
      }
      
    } catch (error) {
      console.error('Error loading photobooks:', error)
      toast.error('Failed to load photobooks')
    }
  }
  
  // Load photobooks for specific sub tab when user clicks on it
  const loadSubTabPhotobooks = async (tabType: 'generation' | 'lineup' | 'member') => {
    if (loadingStates[tabType]) return // Already loading
    
    setLoadingStates(prev => ({ ...prev, [tabType]: true }))
    
    try {
      // Load hierarchy data if not already loaded
      let currentGenerations = generations
      let currentLineups = lineups
      let currentMembers = members
      
      if (currentGenerations.length === 0 || currentLineups.length === 0 || currentMembers.length === 0) {
        const hierarchyResult = await loadHierarchyData()
        if (hierarchyResult) {
          currentGenerations = hierarchyResult.generations
          currentLineups = hierarchyResult.lineups
          currentMembers = hierarchyResult.members
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
      const groupLineups = allLineups.filter(lineup => 
        generationsData.some(gen => gen.id === lineup.generationId)
      )
      
      const groupMembers = allActresses.filter(actress => 
        actress.selectedGroups && actress.selectedGroups.includes(group.name || '')
      )
      
      setGenerations(generationsData)
      setLineups(groupLineups)
      setMembers(groupMembers)
      
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

  const handleLinkPhotobook = async (photobookId: string, targetType: string, targetId: string) => {
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
  }

  const handleUnlinkPhotobook = async (photobook: Photobook, targetType: string, targetId: string) => {
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
  }

  const openLinkingDialog = (targetType: 'group' | 'generation' | 'lineup' | 'member') => {
    setLinkingTarget({ 
      type: targetType, 
      id: targetType === 'group' ? group.id : '', 
      name: targetType === 'group' ? group.name : targetType 
    })
    setLinkingDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <Tabs value={activeSubTab} onValueChange={(value) => {
        setActiveSubTab(value)
        // Load photobooks for the selected tab if not already loaded
        if (value !== 'group' && photobooks[value as keyof typeof photobooks].length === 0) {
          loadSubTabPhotobooks(value as 'generation' | 'lineup' | 'member')
        }
      }}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="group" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Group
            {photobooks.group.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {photobooks.group.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="generation" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Generation
            {photobooks.generation.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {photobooks.generation.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="lineup" className="flex items-center gap-2">
            <Users2 className="h-4 w-4" />
            Lineup
            {photobooks.lineup.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {photobooks.lineup.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="member" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Member
            {photobooks.member.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {photobooks.member.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Sub-tab Contents */}
        <TabsContent value="group" className="mt-6">
          <PhotobookSubTabContent
            photobooks={photobooks.group}
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
            photobooks={photobooks.generation}
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
            photobooks={photobooks.lineup}
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
            photobooks={photobooks.member}
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

function PhotobookSubTabContent({
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
  const handleUnlink = (photobook: Photobook) => {
    onUnlinkPhotobook(photobook, targetType, targetId)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">
            {targetName} Photobooks
          </h2>
          <p className="text-gray-500 text-sm">
            {photobooks.length} photobook{photobooks.length !== 1 ? 's' : ''} linked
          </p>
        </div>
        
        {photobooks.length > 0 && (
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
      {isLoading && photobooks.length === 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
}
