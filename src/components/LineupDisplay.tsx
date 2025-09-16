import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { MasterDataItem, calculateAge } from '../utils/masterDataApi'
import { masterDataApi } from '../utils/masterDataApi'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Users, ChevronDown, ChevronRight, Filter, Calendar } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { ImageWithFallback } from './figma/ImageWithFallback'

const lineupSortOptions = [
  { key: 'name', label: 'Name (A-Z)', getValue: (actress: MasterDataItem) => actress.name?.toLowerCase() || '' },
  { key: 'name-desc', label: 'Name (Z-A)', getValue: (actress: MasterDataItem) => actress.name?.toLowerCase() || '' },
  { key: 'age', label: 'Age (Young)', getValue: (actress: MasterDataItem) => actress.birthdate ? calculateAge(actress.birthdate) : 999 },
  { key: 'age-desc', label: 'Age (Old)', getValue: (actress: MasterDataItem) => actress.birthdate ? calculateAge(actress.birthdate) : 0 },
  { key: 'movieCount', label: 'Movies (Few)', getValue: (actress: MasterDataItem) => (actress as any).movieCount || 0 },
  { key: 'movieCount-desc', label: 'Movies (Many)', getValue: (actress: MasterDataItem) => (actress as any).movieCount || 0 },
]

interface LineupDisplayProps {
  generationId: string
  generationName: string
  accessToken: string
  onProfileSelect?: (type: string, name: string) => void
  getLineupProfilePicture?: (actress: MasterDataItem, lineupId: string) => string | null
  getLineupAlias?: (actress: MasterDataItem, lineupId: string) => string | null
  onDataChange?: () => void // Callback when data changes
  selectedLineupVersion?: string // Add lineup version selector
  onLineupVersionChange?: (version: string) => void // Callback for version change
  sortBy?: string // Add sort option
  onSortChange?: (sort: string) => void // Callback for sort change
  lineups?: MasterDataItem[] // Pre-loaded lineups data
  actresses?: MasterDataItem[] // Pre-loaded actresses data
}

export function LineupDisplay({ 
  generationId, 
  generationName, 
  accessToken,
  onProfileSelect,
  getLineupProfilePicture,
  getLineupAlias,
  onDataChange,
  selectedLineupVersion = 'default',
  onLineupVersionChange,
  sortBy = 'name',
  onSortChange,
  lineups: propLineups = [],
  actresses: propActresses = []
}: LineupDisplayProps) {
  const [lineups, setLineups] = useState<MasterDataItem[]>(propLineups)
  const [actresses, setActresses] = useState<MasterDataItem[]>(propActresses)
  const [activeLineupId, setActiveLineupId] = useState<string | null>(null)

  // Update state when props change
  useEffect(() => {
    setLineups(propLineups)
    setActresses(propActresses)
    
    // Set first lineup as active if none selected and we have lineups
    if (propLineups.length > 0 && !activeLineupId) {
      setActiveLineupId(propLineups[0].id)
    }
  }, [propLineups, propActresses, activeLineupId])

  // No need for loadLineups function anymore - data comes from parent

  const getLineupActresses = useCallback((lineupId: string) => {
    const lineupActresses = actresses.filter(actress => 
      actress.lineupData && actress.lineupData[lineupId]
    )
    
    // Sort actresses based on selected sort option
    const sortOption = lineupSortOptions.find(option => option.key === sortBy)
    
    if (sortOption) {
      const isDesc = sortBy.endsWith('-desc')
      const sortedActresses = [...lineupActresses].sort((a, b) => {
        const aVal = sortOption.getValue(a)
        const bVal = sortOption.getValue(b)
        
        if (aVal < bVal) return isDesc ? 1 : -1
        if (aVal > bVal) return isDesc ? -1 : 1
        return 0
      })
      
      return sortedActresses
    }
    
    return lineupActresses
  }, [actresses, sortBy])

  // Sort lineups by lineupOrder (default order for lineups)
  const sortedLineups = useMemo(() => {
    return [...lineups].sort((a, b) => (a.lineupOrder || 0) - (b.lineupOrder || 0))
  }, [lineups])

  // Memoize lineup actresses for each lineup to avoid recalculating
  const lineupActressesMap = useMemo(() => {
    const map = new Map<string, MasterDataItem[]>()
    sortedLineups.forEach(lineup => {
      map.set(lineup.id, getLineupActresses(lineup.id))
    })
    return map
  }, [sortedLineups, getLineupActresses])


  const getProfilePicture = useCallback((actress: MasterDataItem, lineupId: string) => {
    if (getLineupProfilePicture) {
      return getLineupProfilePicture(actress, lineupId)
    }
    
    // Fallback logic
    if (actress.lineupData && actress.lineupData[lineupId]?.profilePicture) {
      return actress.lineupData[lineupId].profilePicture
    }
    return actress.profilePicture
  }, [getLineupProfilePicture])

  const getAlias = useCallback((actress: MasterDataItem, lineupId: string) => {
    if (getLineupAlias) {
      return getLineupAlias(actress, lineupId)
    }
    
    // Fallback logic
    if (actress.lineupData && actress.lineupData[lineupId]?.alias) {
      return actress.lineupData[lineupId].alias
    }
    return actress.alias || actress.name
  }, [getLineupAlias])

  // No loading spinner needed - data comes from parent

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
          {sortedLineups.map((lineup) => {
            const lineupActresses = lineupActressesMap.get(lineup.id) || []
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
        
        {sortedLineups.map((lineup) => {
          const lineupActresses = lineupActressesMap.get(lineup.id) || []
          
          return (
            <TabsContent key={lineup.id} value={lineup.id} className="mt-4">
              <div className="space-y-4">
                {lineup.description && (
                  <p className="text-sm text-gray-600">{lineup.description}</p>
                )}
                
                
                {lineupActresses.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {lineupActresses.map((actress) => {
                      const profilePicture = getProfilePicture(actress, lineup.id)
                      const alias = getAlias(actress, lineup.id)
                      
                      return (
                        <Card 
                          key={actress.id}
                          className="group hover:shadow-lg transition-all duration-200 cursor-pointer"
                          onClick={() => onProfileSelect?.('actress', actress.name || '')}
                        >
                          <CardContent className="p-0">
                            {/* Profile Picture */}
                            <div className="aspect-[3/4] overflow-hidden rounded-t-lg bg-muted relative">
                              {profilePicture ? (
                                <img
                                  src={profilePicture}
                                  alt={alias || actress.name || 'Actress'}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-muted text-muted-foreground">
                                  <Users className="h-12 w-12 mb-2" />
                                  <span className="text-xs text-center px-2">No photo</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Info */}
                            <div className="p-3 space-y-1">
                              <h3 className="font-medium text-sm truncate" title={actress.name}>
                                {actress.name || 'Unnamed'}
                              </h3>
                              
                              {/* Show alias if available */}
                              {alias && alias !== actress.name && (
                                <p className="text-xs text-blue-600 truncate" title={`Alias: ${alias}`}>
                                  {alias}
                                </p>
                              )}
                              
                              {/* Show Japanese name if available */}
                              {actress.jpname && (
                                <p className="text-xs text-muted-foreground truncate" title={actress.jpname}>
                                  {actress.jpname}
                                </p>
                              )}
                              
                              {/* Show age if available */}
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
