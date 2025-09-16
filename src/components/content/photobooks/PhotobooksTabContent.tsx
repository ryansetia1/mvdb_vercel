import React, { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs'
import { Badge } from '../../ui/badge'
import { Users, Calendar, Users2, User, Plus } from 'lucide-react'
import { MasterDataItem, masterDataApi } from '../../../utils/masterDataApi'
import { Photobook, photobookApi } from '../../../utils/photobookApi'
import { PhotobookGrid } from '../../photobooks/PhotobookGrid'
import { PhotobookLinkingDialog } from '../../photobooks/PhotobookLinkingDialog'
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

  // Load photobooks and hierarchy data when component mounts
  useEffect(() => {
    if (accessToken) {
      // Check if we have cached data from parent component
      const hasParentCache = cachedPhotobooks && cachedHierarchy
      
      if (hasParentCache) {
        console.log('Using parent cached data for group:', group.name, 'ID:', group.id)
        // Use cached data immediately
        setGenerations(cachedHierarchy!.generations)
        setLineups(cachedHierarchy!.lineups)
        setMembers(cachedHierarchy!.members)
        setPhotobooks(cachedPhotobooks!)
        setIsLoading(false)
      } else {
        console.log('No cached data, loading fresh data for group:', group.name, 'ID:', group.id)
        // Load hierarchy data first, then photobooks with the loaded data
        loadHierarchyData().then((hierarchyData) => {
          if (hierarchyData) {
            loadPhotobooks(hierarchyData)
          }
        })
      }
    }
  }, [accessToken, group.id, cachedPhotobooks, cachedHierarchy])

  const loadPhotobooks = async (hierarchyData?: { generations: MasterDataItem[], lineups: MasterDataItem[], members: MasterDataItem[] }) => {
    setIsLoading(true)
    try {
      console.log('Loading photobooks for group:', group.name, 'ID:', group.id)
      
      // Use provided hierarchy data or current state
      const currentGenerations = hierarchyData?.generations || generations
      const currentLineups = hierarchyData?.lineups || lineups
      const currentMembers = hierarchyData?.members || members
      
      console.log('Using hierarchy data:', {
        generations: currentGenerations.length,
        lineups: currentLineups.length,
        members: currentMembers.length
      })
      
      // Load group photobooks
      const groupPhotobooks = await photobookApi.getPhotobooksByGroup(group.id, accessToken)
      console.log('Loaded group photobooks:', groupPhotobooks.length)
      
      // Load generation photobooks - use current generations data
      const generationPhotobooks = []
      for (const generation of currentGenerations) {
        const genPhotobooks = await photobookApi.getPhotobooksByGeneration(generation.id, accessToken)
        generationPhotobooks.push(...genPhotobooks)
      }
      console.log('Loaded generation photobooks:', generationPhotobooks.length)
      
      // Load lineup photobooks - use current lineups data
      const lineupPhotobooks = []
      for (const lineup of currentLineups) {
        const lineupPhotobooksData = await photobookApi.getPhotobooksByLineup(lineup.id, accessToken)
        lineupPhotobooks.push(...lineupPhotobooksData)
      }
      console.log('Loaded lineup photobooks:', lineupPhotobooks.length)
      
      // Load member photobooks - use current members data
      const memberPhotobooks = []
      for (const member of currentMembers) {
        const memberPhotobooksData = await photobookApi.getPhotobooksByMember(member.id, accessToken)
        memberPhotobooks.push(...memberPhotobooksData)
      }
      console.log('Loaded member photobooks:', memberPhotobooks.length)
      
      setPhotobooks({
        group: groupPhotobooks,
        generation: generationPhotobooks,
        lineup: lineupPhotobooks,
        member: memberPhotobooks
      })
      
      // Notify parent component about cache update
      if (onCacheUpdate) {
        onCacheUpdate({
          group: groupPhotobooks,
          generation: generationPhotobooks,
          lineup: lineupPhotobooks,
          member: memberPhotobooks
        }, {
          generations: currentGenerations,
          lineups: currentLineups,
          members: currentMembers
        })
      }
      
      console.log('All photobooks loaded:', {
        group: groupPhotobooks.length,
        generation: generationPhotobooks.length,
        lineup: lineupPhotobooks.length,
        member: memberPhotobooks.length
      })
    } catch (error) {
      console.error('Error loading photobooks:', error)
      toast.error('Failed to load photobooks')
    } finally {
      setIsLoading(false)
    }
  }

  const loadHierarchyData = async () => {
    try {
      console.log('Loading hierarchy data for group:', group.name, 'ID:', group.id)
      
      // Load generations for this group
      const generationsData = await masterDataApi.getGenerationsByGroup(group.id, accessToken)
      setGenerations(generationsData)
      console.log('Loaded generations:', generationsData.length, generationsData.map(g => ({ id: g.id, name: g.name })))
      
      // Load lineups for all generations
      const allLineups = await masterDataApi.getByType('lineup', accessToken)
      const groupLineups = allLineups.filter(lineup => 
        generationsData.some(gen => gen.id === lineup.generationId)
      )
      setLineups(groupLineups)
      console.log('Loaded lineups:', groupLineups.length, groupLineups.map(l => ({ id: l.id, name: l.name, generationId: l.generationId })))
      
      // Load members (actresses) for this group
      const allActresses = await masterDataApi.getByType('actress', accessToken)
      const groupMembers = allActresses.filter(actress => 
        actress.selectedGroups && actress.selectedGroups.includes(group.name || '')
      )
      setMembers(groupMembers)
      console.log('Loaded members:', groupMembers.length, groupMembers.map(m => ({ id: m.id, name: m.name, selectedGroups: m.selectedGroups })))
      
      console.log('Hierarchy data loaded successfully:', {
        generations: generationsData.length,
        lineups: groupLineups.length,
        members: groupMembers.length
      })
      
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
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
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
            isLoading={isLoading || isLinking || isUnlinking}
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
            isLoading={isLoading || isLinking || isUnlinking}
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
            isLoading={isLoading || isLinking || isUnlinking}
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
    </div>
  )
}
