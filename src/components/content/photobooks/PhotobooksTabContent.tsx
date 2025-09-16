import React, { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs'
import { Badge } from '../../ui/badge'
import { Button } from '../../ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'
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
}

export function PhotobooksTabContent({ group, accessToken, onPhotobookSelect }: PhotobooksTabContentProps) {
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
  const [linkingDialogOpen, setLinkingDialogOpen] = useState(false)
  const [linkingTarget, setLinkingTarget] = useState<{
    type: 'group' | 'generation' | 'lineup' | 'member'
    id: string
    name: string
  } | null>(null)
  
  // NEW: State for hierarchy data
  const [generations, setGenerations] = useState<MasterDataItem[]>([])
  const [lineups, setLineups] = useState<MasterDataItem[]>([])
  const [members, setMembers] = useState<MasterDataItem[]>([])
  const [selectedGenerationId, setSelectedGenerationId] = useState<string>('')
  const [selectedLineupId, setSelectedLineupId] = useState<string>('')
  const [selectedMemberId, setSelectedMemberId] = useState<string>('')

  // Load data when component mounts
  useEffect(() => {
    if (accessToken) {
      loadHierarchyData()
      loadPhotobooks()
    }
  }, [accessToken])

  // Load photobooks when selections change
  useEffect(() => {
    if (accessToken && (selectedGenerationId || selectedLineupId || selectedMemberId)) {
      loadPhotobooks()
    }
  }, [selectedGenerationId, selectedLineupId, selectedMemberId])

  const loadHierarchyData = async () => {
    try {
      // Load generations for this group
      const generationsData = await masterDataApi.getGenerationsByGroup(group.id, accessToken)
      setGenerations(generationsData)
      
      // Load lineups for this group
      const allLineups = await masterDataApi.getByType('lineup', accessToken)
      const groupLineups = allLineups.filter(lineup => 
        generationsData.some(gen => gen.id === lineup.generationId)
      )
      setLineups(groupLineups)
      
      // Load members (actresses) for this group
      const allActresses = await masterDataApi.getByType('actress', accessToken)
      const groupMembers = allActresses.filter(actress => 
        actress.selectedGroups?.includes(group.name || '') || actress.groupId === group.id
      )
      setMembers(groupMembers)
      
      console.log('Loaded hierarchy data:', {
        generations: generationsData.length,
        lineups: groupLineups.length,
        members: groupMembers.length
      })
    } catch (error) {
      console.error('Error loading hierarchy data:', error)
      toast.error('Failed to load hierarchy data')
    }
  }

  const loadPhotobooks = async () => {
    setIsLoading(true)
    try {
      // Load group photobooks
      const groupPhotobooks = await photobookApi.getPhotobooksByGroup(group.id, accessToken)
      
      // Load generation photobooks if selected
      let generationPhotobooks: Photobook[] = []
      if (selectedGenerationId) {
        generationPhotobooks = await photobookApi.getPhotobooksByGeneration(selectedGenerationId, accessToken)
      }
      
      // Load lineup photobooks if selected
      let lineupPhotobooks: Photobook[] = []
      if (selectedLineupId) {
        lineupPhotobooks = await photobookApi.getPhotobooksByLineup(selectedLineupId, accessToken)
      }
      
      // Load member photobooks if selected
      let memberPhotobooks: Photobook[] = []
      if (selectedMemberId) {
        memberPhotobooks = await photobookApi.getPhotobooksByMember(selectedMemberId, accessToken)
      }
      
      setPhotobooks({
        group: groupPhotobooks,
        generation: generationPhotobooks,
        lineup: lineupPhotobooks,
        member: memberPhotobooks
      })
    } catch (error) {
      console.error('Error loading photobooks:', error)
      toast.error('Failed to load photobooks')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLinkPhotobook = async (photobookId: string) => {
    if (!linkingTarget) return

    try {
      await photobookApi.linkPhotobook(
        photobookId,
        linkingTarget.type,
        linkingTarget.id,
        accessToken
      )
      
      // Reload photobooks to reflect the new link
      await loadPhotobooks()
      
      toast.success('Photobook linked successfully')
    } catch (error) {
      console.error('Error linking photobook:', error)
      toast.error('Failed to link photobook')
    }
  }

  const handleUnlinkPhotobook = async (photobook: Photobook, targetType: string, targetId: string) => {
    try {
      await photobookApi.unlinkPhotobook(
        photobook.id!,
        targetType as 'group' | 'generation' | 'lineup' | 'member',
        accessToken
      )
      
      // Reload photobooks to reflect the unlink
      await loadPhotobooks()
      
      toast.success('Photobook unlinked successfully')
    } catch (error) {
      console.error('Error unlinking photobook:', error)
      toast.error('Failed to unlink photobook')
    }
  }

  const openLinkingDialog = (targetType: 'group' | 'generation' | 'lineup' | 'member') => {
    let targetId = ''
    let targetName = ''
    
    switch (targetType) {
      case 'group':
        targetId = group.id
        targetName = group.name || 'Group'
        break
      case 'generation':
        if (!selectedGenerationId) {
          toast.error('Please select a generation first')
          return
        }
        const selectedGen = generations.find(g => g.id === selectedGenerationId)
        targetId = selectedGenerationId
        targetName = selectedGen?.name || 'Generation'
        break
      case 'lineup':
        if (!selectedLineupId) {
          toast.error('Please select a lineup first')
          return
        }
        const selectedLineup = lineups.find(l => l.id === selectedLineupId)
        targetId = selectedLineupId
        targetName = selectedLineup?.name || 'Lineup'
        break
      case 'member':
        if (!selectedMemberId) {
          toast.error('Please select a member first')
          return
        }
        const selectedMember = members.find(m => m.id === selectedMemberId)
        targetId = selectedMemberId
        targetName = selectedMember?.name || 'Member'
        break
    }
    
    setLinkingTarget({ type: targetType, id: targetId, name: targetName })
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
            isLoading={isLoading}
            onLinkPhotobooks={() => openLinkingDialog('group', group.id, group.name || 'Group')}
            onPhotobookSelect={onPhotobookSelect}
            onUnlinkPhotobook={handleUnlinkPhotobook}
          />
        </TabsContent>

        <TabsContent value="generation" className="mt-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Select Generation:</label>
              <Select value={selectedGenerationId} onValueChange={setSelectedGenerationId}>
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Choose a generation..." />
                </SelectTrigger>
                <SelectContent>
                  {generations.map((generation) => (
                    <SelectItem key={generation.id} value={generation.id}>
                      {generation.name || 'Unnamed Generation'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedGenerationId && (
              <PhotobookSubTabContent
                photobooks={photobooks.generation}
                targetType="generation"
                targetId={selectedGenerationId}
                targetName={generations.find(g => g.id === selectedGenerationId)?.name || 'Generation'}
                isLoading={isLoading}
                onLinkPhotobooks={() => openLinkingDialog('generation')}
                onPhotobookSelect={onPhotobookSelect}
                onUnlinkPhotobook={handleUnlinkPhotobook}
              />
            )}
            
            {!selectedGenerationId && (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4" />
                <p>Select a generation to view linked photobooks</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="lineup" className="mt-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Select Lineup:</label>
              <Select value={selectedLineupId} onValueChange={setSelectedLineupId}>
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Choose a lineup..." />
                </SelectTrigger>
                <SelectContent>
                  {lineups.map((lineup) => (
                    <SelectItem key={lineup.id} value={lineup.id}>
                      {lineup.name || 'Unnamed Lineup'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedLineupId && (
              <PhotobookSubTabContent
                photobooks={photobooks.lineup}
                targetType="lineup"
                targetId={selectedLineupId}
                targetName={lineups.find(l => l.id === selectedLineupId)?.name || 'Lineup'}
                isLoading={isLoading}
                onLinkPhotobooks={() => openLinkingDialog('lineup')}
                onPhotobookSelect={onPhotobookSelect}
                onUnlinkPhotobook={handleUnlinkPhotobook}
              />
            )}
            
            {!selectedLineupId && (
              <div className="text-center py-12 text-muted-foreground">
                <Users2 className="h-12 w-12 mx-auto mb-4" />
                <p>Select a lineup to view linked photobooks</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="member" className="mt-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Select Member:</label>
              <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Choose a member..." />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name || 'Unnamed Member'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedMemberId && (
              <PhotobookSubTabContent
                photobooks={photobooks.member}
                targetType="member"
                targetId={selectedMemberId}
                targetName={members.find(m => m.id === selectedMemberId)?.name || 'Member'}
                isLoading={isLoading}
                onLinkPhotobooks={() => openLinkingDialog('member')}
                onPhotobookSelect={onPhotobookSelect}
                onUnlinkPhotobook={handleUnlinkPhotobook}
              />
            )}
            
            {!selectedMemberId && (
              <div className="text-center py-12 text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-4" />
                <p>Select a member to view linked photobooks</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Linking Dialog */}
      <PhotobookLinkingDialog
        open={linkingDialogOpen}
        onOpenChange={setLinkingDialogOpen}
        targetType={linkingTarget?.type}
        targetId={linkingTarget?.id}
        targetName={linkingTarget?.name}
        onLink={handleLinkPhotobook}
        accessToken={accessToken}
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
}

function PhotobookSubTabContent({
  photobooks,
  targetType,
  targetId,
  targetName,
  isLoading,
  onLinkPhotobooks,
  onPhotobookSelect,
  onUnlinkPhotobook
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
      />
    </div>
  )
}
