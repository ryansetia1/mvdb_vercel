import React, { useState, useEffect } from 'react'
import { MasterDataItem } from '../utils/masterDataApi'
import { masterDataApi } from '../utils/masterDataApi'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
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
  const [expandedLineups, setExpandedLineups] = useState<Set<string>>(new Set())

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

  const toggleLineupExpansion = (lineupId: string) => {
    const newExpanded = new Set(expandedLineups)
    if (newExpanded.has(lineupId)) {
      newExpanded.delete(lineupId)
    } else {
      newExpanded.add(lineupId)
    }
    setExpandedLineups(newExpanded)
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
      
      <div className="space-y-3">
        {lineups.map((lineup) => {
          const lineupActresses = getLineupActresses(lineup.id)
          const isExpanded = expandedLineups.has(lineup.id)
          
          return (
            <Card key={lineup.id} className="overflow-hidden">
              <CardHeader 
                className="pb-3 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleLineupExpansion(lineup.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    )}
                    <CardTitle className="text-base">{lineup.name}</CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {lineup.lineupType || 'Main'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Users className="h-4 w-4" />
                    <span>{lineupActresses.length} members</span>
                  </div>
                </div>
                {lineup.description && (
                  <p className="text-sm text-gray-600 mt-2">{lineup.description}</p>
                )}
              </CardHeader>
              
              {isExpanded && (
                <CardContent className="pt-0">
                  {lineupActresses.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {lineupActresses.map((actress) => (
                        <div 
                          key={actress.id}
                          className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                          onClick={() => onProfileSelect?.('actress', actress.name || '')}
                        >
                          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                            {getProfilePicture(actress, lineup.id) ? (
                              <ImageWithFallback
                                src={getProfilePicture(actress, lineup.id)!}
                                alt={actress.name || 'Actress'}
                                className="w-full h-full object-cover"
                                fallback={
                                  <span className="text-gray-600 text-sm font-medium">
                                    {actress.name?.charAt(0)}
                                  </span>
                                }
                              />
                            ) : (
                              <span className="text-gray-600 text-sm font-medium">
                                {actress.name?.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {getAlias(actress, lineup.id)}
                            </p>
                            {getAlias(actress, lineup.id) !== actress.name && (
                              <p className="text-xs text-gray-500 truncate">
                                {actress.name}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      Belum ada member di lineup ini
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
