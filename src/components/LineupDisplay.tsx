import React, { useState, useEffect } from 'react'
import { MasterDataItem } from '../utils/masterDataApi'
import { masterDataApi } from '../utils/masterDataApi'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Users, ChevronDown, ChevronRight } from 'lucide-react'
import { ImageWithFallback } from './figma/ImageWithFallback'

interface LineupDisplayProps {
  generationId: string
  generationName: string
  accessToken: string
  onProfileSelect?: (type: string, name: string) => void
  getLineupProfilePicture?: (actress: MasterDataItem, lineupId: string) => string | null
  getLineupAlias?: (actress: MasterDataItem, lineupId: string) => string | null
  refreshKey?: number // Add refresh trigger
  onDataChange?: () => void // Callback when data changes
}

export function LineupDisplay({ 
  generationId, 
  generationName, 
  accessToken,
  onProfileSelect,
  getLineupProfilePicture,
  getLineupAlias,
  refreshKey,
  onDataChange
}: LineupDisplayProps) {
  const [lineups, setLineups] = useState<MasterDataItem[]>([])
  const [actresses, setActresses] = useState<MasterDataItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeLineupId, setActiveLineupId] = useState<string | null>(null)

  useEffect(() => {
    loadLineups()
  }, [generationId, refreshKey])

  const loadLineups = async () => {
    try {
      setLoading(true)

      // Load lineups for this generation
      const allLineups = await masterDataApi.getByType('lineup', accessToken)
      const generationLineups = allLineups.filter(lineup => lineup.generationId === generationId)
      
      // Sort by lineupOrder
      generationLineups.sort((a, b) => (a.lineupOrder || 0) - (b.lineupOrder || 0))
      setLineups(generationLineups)
      
      // Set first lineup as active if none selected
      if (generationLineups.length > 0 && !activeLineupId) {
        setActiveLineupId(generationLineups[0].id)
      }

      // Load actresses for this generation's group
      const generations = await masterDataApi.getByType('generation', accessToken)
      const generation = generations.find(g => g.id === generationId)
      const allActresses = await masterDataApi.getByType('actress', accessToken)
      const groupActresses = allActresses.filter(actress => 
        actress.selectedGroups && actress.selectedGroups.includes(generation?.groupName || '')
      )
      console.log('LineupDisplay: Loaded actresses:', groupActresses.length)
      console.log('LineupDisplay: Sample actress lineupData:', groupActresses[0]?.lineupData)
      console.log('LineupDisplay: All actresses with lineupData:', groupActresses.map(a => ({ 
        name: a.name, 
        lineupData: a.lineupData,
        hasLineupData: !!a.lineupData 
      })))
      setActresses(groupActresses)

      // Notify parent that data has changed
      if (onDataChange) {
        onDataChange()
      }

    } catch (err) {
      console.error('Error loading lineups:', err)
    } finally {
      setLoading(false)
    }
  }

  const getLineupActresses = (lineupId: string) => {
    const lineupActresses = actresses.filter(actress => 
      actress.lineupData && actress.lineupData[lineupId]
    )
    console.log(`LineupDisplay: getLineupActresses for ${lineupId}:`, lineupActresses.length, 'actresses')
    console.log(`LineupDisplay: All actresses lineupData:`, actresses.map(a => ({ name: a.name, lineupData: a.lineupData })))
    return lineupActresses
  }


  const getProfilePicture = (actress: MasterDataItem, lineupId: string) => {
    if (getLineupProfilePicture) {
      return getLineupProfilePicture(actress, lineupId)
    }
    
    // Fallback logic
    if (actress.lineupData && actress.lineupData[lineupId]?.profilePicture) {
      return actress.lineupData[lineupId].profilePicture
    }
    return actress.profilePicture
  }

  const getAlias = (actress: MasterDataItem, lineupId: string) => {
    if (getLineupAlias) {
      return getLineupAlias(actress, lineupId)
    }
    
    // Fallback logic
    if (actress.lineupData && actress.lineupData[lineupId]?.alias) {
      return actress.lineupData[lineupId].alias
    }
    return actress.alias || actress.name
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (lineups.length === 0) {
    return null // Don't show anything if no lineups
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <Users className="h-5 w-5" />
        Lineups
      </h3>
      
      <Tabs value={activeLineupId || ''} onValueChange={setActiveLineupId} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {lineups.map((lineup) => {
            const lineupActresses = getLineupActresses(lineup.id)
            return (
              <TabsTrigger 
                key={lineup.id} 
                value={lineup.id}
                className="flex flex-col items-center gap-1 p-3 h-auto"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{lineup.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {lineup.lineupType || 'Main'}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  <span>{lineupActresses.length} members</span>
                </div>
              </TabsTrigger>
            )
          })}
        </TabsList>
        
        {lineups.map((lineup) => {
          const lineupActresses = getLineupActresses(lineup.id)
          
          return (
            <TabsContent key={lineup.id} value={lineup.id} className="mt-4">
              <div className="space-y-4">
                {lineup.description && (
                  <p className="text-sm text-gray-600">{lineup.description}</p>
                )}
                
                {lineupActresses.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {lineupActresses.map((actress) => {
                      const profilePicture = getProfilePicture(actress, lineup.id)
                      const alias = getAlias(actress, lineup.id)
                      
                      return (
                        <Card 
                          key={actress.id}
                          className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => onProfileSelect?.('actress', actress.name || '')}
                        >
                          <CardContent className="p-0">
                            <div className="aspect-square relative overflow-hidden">
                              {profilePicture ? (
                                <ImageWithFallback
                                  src={profilePicture}
                                  alt={alias || actress.name || 'Actress'}
                                  className="w-full h-full object-cover"
                                  fallback={
                                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                      <Users className="w-8 h-8 text-gray-400" />
                                    </div>
                                  }
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                  <Users className="w-8 h-8 text-gray-400" />
                                </div>
                              )}
                            </div>
                            
                            <div className="p-3">
                              <h4 className="font-medium text-sm truncate">
                                {alias || actress.name}
                              </h4>
                              {alias && alias !== actress.name && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {actress.name}
                                </p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No members in this lineup</p>
                    <p className="text-sm">Add actresses to this lineup to see them here</p>
                  </div>
                )}
              </div>
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}
