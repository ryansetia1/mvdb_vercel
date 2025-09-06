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
import { UserCheck, Plus, X, CheckCircle, AlertTriangle, Info } from 'lucide-react'

interface BulkMovieDirectorAssignerProps {
  accessToken: string
  selectedMovies: string[]
  onAssignmentComplete?: () => void
}

export function BulkMovieDirectorAssigner({ accessToken, selectedMovies, onAssignmentComplete }: BulkMovieDirectorAssignerProps) {
  const [directors, setDirectors] = useState<MasterDataItem[]>([])
  const [selectedDirector, setSelectedDirector] = useState<string>('')
  const [isLoadingDirectors, setIsLoadingDirectors] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [assignmentMode, setAssignmentMode] = useState<'replace' | 'append'>('replace') // Default to replace for director
  
  // Load directors
  useEffect(() => {
    loadDirectors()
  }, [accessToken])
  
  const loadDirectors = async () => {
    try {
      setIsLoadingDirectors(true)
      const data = await masterDataApi.getByType('director', accessToken)
      setDirectors(data || [])
    } catch (error) {
      console.error('Error loading directors:', error)
      toast.error('Failed to load directors')
    } finally {
      setIsLoadingDirectors(false)
    }
  }
  
  const filteredDirectors = directors.filter(director => 
    !searchQuery || director.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  const selectDirector = (directorName: string) => {
    setSelectedDirector(directorName)
  }
  
  const clearDirector = () => {
    setSelectedDirector('')
  }
  
  const handleAssignment = async () => {
    if (selectedMovies.length === 0) {
      toast.error('Please select at least one movie')
      return
    }
    
    if (!selectedDirector) {
      toast.error('Please select a director')
      return
    }
    
    try {
      setIsAssigning(true)
      
      const request: BulkCastAssignmentRequest = {
        movieIds: selectedMovies,
        castType: 'director', // Note: cast type is 'director' (singular) for database field mapping
        castMembers: [selectedDirector],
        assignmentMode
      }
      
      console.log('=== BULK DIRECTOR ASSIGNMENT START ===')
      console.log('Request:', request)
      console.log('Selected Movies:', selectedMovies.length)
      console.log('Selected Director:', selectedDirector)
      console.log('Assignment Mode:', assignmentMode)
      console.log('Access Token Present:', !!accessToken)
      
      const result = await bulkAssignmentApi.assignCast(request, accessToken)
      
      console.log('Assignment Result:', result)
      console.log('=== BULK DIRECTOR ASSIGNMENT SUCCESS ===')
      
      toast.success(
        `Successfully assigned director "${selectedDirector}" to ${result.updatedCount} movie(s)`,
        { duration: 5000 }
      )
      
      // Show detailed success info
      console.log(`Assigned director: ${selectedDirector}`)
      console.log(`Updated ${result.updatedCount} movies in ${assignmentMode} mode`)
      
      // Reset selections
      setSelectedDirector('')
      setSearchQuery('')
      
      // Notify parent component
      if (onAssignmentComplete) {
        await onAssignmentComplete()
      }
      
    } catch (error) {
      console.error('=== BULK DIRECTOR ASSIGNMENT ERROR ===')
      console.error('Error details:', error)
      console.error('Error message:', error.message)
      console.error('Request that failed:', { selectedMovies, selectedDirector, assignmentMode })
      
      // Show more specific error message
      let errorMessage = 'Failed to assign director'
      if (error.message) {
        errorMessage = `Failed to assign director: ${error.message}`
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
          <UserCheck className="h-5 w-5" />
          Bulk Director Assignment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Assignment Mode */}
        <div>
          <Label className="mb-3 block">Assignment Mode</Label>
          <RadioGroup value={assignmentMode} onValueChange={(value: 'replace' | 'append') => setAssignmentMode(value)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="replace" id="replace-director" />
              <Label htmlFor="replace-director">Replace existing director (recommended)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="append" id="append-director" />
              <Label htmlFor="append-director">Append to existing director</Label>
            </div>
          </RadioGroup>
        </div>
        
        {/* Selected Director */}
        <div>
          <Label className="mb-2 block">Selected Director</Label>
          {selectedDirector ? (
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="default" className="flex items-center gap-2">
                {selectedDirector}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={clearDirector}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mb-3">No director selected</p>
          )}
        </div>
        
        {/* Director Search and Selection */}
        <div>
          <Label htmlFor="director-search" className="mb-2 block">Search and Select Director</Label>
          <Input
            id="director-search"
            placeholder="Search directors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-3"
          />
          
          {isLoadingDirectors ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2"></div>
              <span className="text-sm">Loading directors...</span>
            </div>
          ) : (
            <div className="max-h-48 overflow-y-auto border rounded p-2">
              {filteredDirectors.length > 0 ? (
                <div className="space-y-1">
                  {filteredDirectors.map((director) => (
                    <Button
                      key={director.id}
                      variant="ghost"
                      className="w-full justify-start h-auto p-2"
                      onClick={() => selectDirector(director.name!)}
                      disabled={selectedDirector === director.name}
                    >
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4" />
                        <span>{director.name}</span>
                        {selectedDirector === director.name && (
                          <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />
                        )}
                      </div>
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {searchQuery ? `No directors found matching "${searchQuery}"` : 'No directors available'}
                </p>
              )}
            </div>
          )}
        </div>
        
        {/* Assignment Button */}
        <Button
          onClick={handleAssignment}
          disabled={isAssigning || selectedMovies.length === 0 || !selectedDirector}
          className="w-full"
        >
          {isAssigning ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Assigning Director...
            </>
          ) : (
            <>
              <UserCheck className="h-4 w-4 mr-2" />
              Assign Director to {selectedMovies.length} Movie(s)
            </>
          )}
        </Button>
        
        {/* Info */}
        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-medium mb-1">How it works:</div>
            <ul className="text-xs space-y-1">
              <li>• <strong>Replace mode:</strong> Replaces existing director with selected director (recommended)</li>
              <li>• <strong>Append mode:</strong> Adds selected director to existing director list</li>
              <li>• Directors field in database: "director" (singular)</li>
              <li>• Usually each movie has only one director, so replace mode is recommended</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}