import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { RadioGroup, RadioGroupItem } from './ui/radio-group'
import { toast } from 'sonner@2.0.3'
import { masterDataApi, MasterDataItem } from '../utils/masterDataApi'
import { bulkAssignmentApi, BulkCastAssignmentRequest } from '../utils/bulkAssignmentApi'
import { User, Plus, X, CheckCircle, AlertTriangle, Info } from 'lucide-react'

interface BulkMovieActorAssignerProps {
  accessToken: string
  selectedMovies: string[]
  onAssignmentComplete?: () => void
}

export function BulkMovieActorAssigner({ accessToken, selectedMovies, onAssignmentComplete }: BulkMovieActorAssignerProps) {
  const [actors, setActors] = useState<MasterDataItem[]>([])
  const [selectedActors, setSelectedActors] = useState<string[]>([])
  const [isLoadingActors, setIsLoadingActors] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [assignmentMode, setAssignmentMode] = useState<'replace' | 'append'>('append')
  
  // Load actors
  useEffect(() => {
    loadActors()
  }, [accessToken])
  
  const loadActors = async () => {
    try {
      setIsLoadingActors(true)
      const data = await masterDataApi.getByType('actor', accessToken)
      setActors(data || [])
    } catch (error) {
      console.error('Error loading actors:', error)
      toast.error('Failed to load actors')
    } finally {
      setIsLoadingActors(false)
    }
  }
  
  const filteredActors = actors.filter(actor => 
    !searchQuery || actor.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  const addActor = (actorName: string) => {
    if (!selectedActors.includes(actorName)) {
      setSelectedActors(prev => [...prev, actorName])
    }
  }
  
  const removeActor = (actorName: string) => {
    setSelectedActors(prev => prev.filter(name => name !== actorName))
  }
  
  const handleAssignment = async () => {
    if (selectedMovies.length === 0) {
      toast.error('Please select at least one movie')
      return
    }
    
    if (selectedActors.length === 0) {
      toast.error('Please select at least one actor')
      return
    }
    
    try {
      setIsAssigning(true)
      
      const request: BulkCastAssignmentRequest = {
        movieIds: selectedMovies,
        castType: 'actors', // Note: cast type is 'actors' (plural) for database field mapping
        castMembers: selectedActors,
        assignmentMode
      }
      
      console.log('=== BULK ACTOR ASSIGNMENT START ===')
      console.log('Request:', request)
      console.log('Selected Movies:', selectedMovies.length)
      console.log('Selected Actors:', selectedActors)
      console.log('Assignment Mode:', assignmentMode)
      console.log('Access Token Present:', !!accessToken)
      
      const result = await bulkAssignmentApi.assignCast(request, accessToken)
      
      console.log('Assignment Result:', result)
      console.log('=== BULK ACTOR ASSIGNMENT SUCCESS ===')
      
      toast.success(
        `Successfully assigned ${selectedActors.length} actor(s) to ${result.updatedCount} movie(s)`,
        { duration: 5000 }
      )
      
      // Show detailed success info
      console.log(`Assigned actors: ${selectedActors.join(', ')}`)
      console.log(`Updated ${result.updatedCount} movies in ${assignmentMode} mode`)
      
      // Reset selections
      setSelectedActors([])
      setSearchQuery('')
      
      // Notify parent component
      if (onAssignmentComplete) {
        await onAssignmentComplete()
      }
      
    } catch (error) {
      console.error('=== BULK ACTOR ASSIGNMENT ERROR ===')
      console.error('Error details:', error)
      console.error('Error message:', error.message)
      console.error('Request that failed:', { selectedMovies, selectedActors, assignmentMode })
      
      // Show more specific error message
      let errorMessage = 'Failed to assign actors'
      if (error.message) {
        errorMessage = `Failed to assign actors: ${error.message}`
      }
      
      toast.error(errorMessage, { duration: 7000 })
    } finally {
      setIsAssigning(false)
    }
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Bulk Actor Assignment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Assignment Mode */}
        <div>
          <Label className="mb-3 block">Assignment Mode</Label>
          <RadioGroup value={assignmentMode} onValueChange={(value: 'replace' | 'append') => setAssignmentMode(value)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="append" id="append-actors" />
              <Label htmlFor="append-actors">Append to existing actors</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="replace" id="replace-actors" />
              <Label htmlFor="replace-actors">Replace existing actors</Label>
            </div>
          </RadioGroup>
        </div>
        
        {/* Selected Actors */}
        <div>
          <Label className="mb-2 block">Selected Actors ({selectedActors.length})</Label>
          {selectedActors.length > 0 ? (
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedActors.map((actorName) => (
                <Badge key={actorName} variant="default" className="flex items-center gap-2">
                  {actorName}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => removeActor(actorName)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mb-3">No actors selected</p>
          )}
        </div>
        
        {/* Actor Search and Selection */}
        <div>
          <Label htmlFor="actor-search" className="mb-2 block">Search and Add Actors</Label>
          <Input
            id="actor-search"
            placeholder="Search actors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-3"
          />
          
          {isLoadingActors ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2"></div>
              <span className="text-sm">Loading actors...</span>
            </div>
          ) : (
            <div className="max-h-48 overflow-y-auto border rounded p-2">
              {filteredActors.length > 0 ? (
                <div className="space-y-1">
                  {filteredActors.map((actor) => (
                    <Button
                      key={actor.id}
                      variant="ghost"
                      className="w-full justify-start h-auto p-2"
                      onClick={() => addActor(actor.name!)}
                      disabled={selectedActors.includes(actor.name!)}
                    >
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{actor.name}</span>
                        {selectedActors.includes(actor.name!) && (
                          <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />
                        )}
                      </div>
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {searchQuery ? `No actors found matching "${searchQuery}"` : 'No actors available'}
                </p>
              )}
            </div>
          )}
        </div>
        
        {/* Assignment Button */}
        <Button
          onClick={handleAssignment}
          disabled={isAssigning || selectedMovies.length === 0 || selectedActors.length === 0}
          className="w-full"
        >
          {isAssigning ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Assigning Actors...
            </>
          ) : (
            <>
              <User className="h-4 w-4 mr-2" />
              Assign {selectedActors.length} Actor(s) to {selectedMovies.length} Movie(s)
            </>
          )}
        </Button>
        
        {/* Info */}
        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-medium mb-1">How it works:</div>
            <ul className="text-xs space-y-1">
              <li>• <strong>Append mode:</strong> Adds selected actors to existing actors list</li>
              <li>• <strong>Replace mode:</strong> Replaces all existing actors with selected actors</li>
              <li>• Actors field in database: "actors" (plural)</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}