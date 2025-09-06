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
import { Users, Plus, X, CheckCircle, AlertTriangle, Info } from 'lucide-react'

interface BulkMovieActressAssignerProps {
  accessToken: string
  selectedMovies: string[]
  onAssignmentComplete?: () => void
}

export function BulkMovieActressAssigner({ accessToken, selectedMovies, onAssignmentComplete }: BulkMovieActressAssignerProps) {
  const [actresses, setActresses] = useState<MasterDataItem[]>([])
  const [selectedActresses, setSelectedActresses] = useState<string[]>([])
  const [isLoadingActresses, setIsLoadingActresses] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [assignmentMode, setAssignmentMode] = useState<'replace' | 'append'>('append')
  
  // Load actresses
  useEffect(() => {
    loadActresses()
  }, [accessToken])
  
  const loadActresses = async () => {
    try {
      setIsLoadingActresses(true)
      const data = await masterDataApi.getByType('actress', accessToken)
      setActresses(data || [])
    } catch (error) {
      console.error('Error loading actresses:', error)
      toast.error('Failed to load actresses')
    } finally {
      setIsLoadingActresses(false)
    }
  }
  
  const filteredActresses = actresses.filter(actress => 
    !searchQuery || actress.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  const addActress = (actressName: string) => {
    if (!selectedActresses.includes(actressName)) {
      setSelectedActresses(prev => [...prev, actressName])
    }
  }
  
  const removeActress = (actressName: string) => {
    setSelectedActresses(prev => prev.filter(name => name !== actressName))
  }
  
  const handleAssignment = async () => {
    if (selectedMovies.length === 0) {
      toast.error('Please select at least one movie')
      return
    }
    
    if (selectedActresses.length === 0) {
      toast.error('Please select at least one actress')
      return
    }
    
    try {
      setIsAssigning(true)
      
      const request: BulkCastAssignmentRequest = {
        movieIds: selectedMovies,
        castType: 'actress', // Note: cast type is 'actress' (singular) for database field mapping
        castMembers: selectedActresses,
        assignmentMode
      }
      
      console.log('=== BULK ACTRESS ASSIGNMENT START ===')
      console.log('Request:', request)
      console.log('Selected Movies:', selectedMovies.length)
      console.log('Selected Actresses:', selectedActresses)
      console.log('Assignment Mode:', assignmentMode)
      console.log('Access Token Present:', !!accessToken)
      
      const result = await bulkAssignmentApi.assignCast(request, accessToken)
      
      console.log('Assignment Result:', result)
      console.log('=== BULK ACTRESS ASSIGNMENT SUCCESS ===')
      
      toast.success(
        `Successfully assigned ${selectedActresses.length} actress(es) to ${result.updatedCount} movie(s)`,
        { duration: 5000 }
      )
      
      // Show detailed success info
      console.log(`Assigned actresses: ${selectedActresses.join(', ')}`)
      console.log(`Updated ${result.updatedCount} movies in ${assignmentMode} mode`)
      
      // Reset selections
      setSelectedActresses([])
      setSearchQuery('')
      
      // Notify parent component
      if (onAssignmentComplete) {
        await onAssignmentComplete()
      }
      
    } catch (error) {
      console.error('=== BULK ACTRESS ASSIGNMENT ERROR ===')
      console.error('Error details:', error)
      console.error('Error message:', error.message)
      console.error('Request that failed:', { selectedMovies, selectedActresses, assignmentMode })
      
      // Show more specific error message
      let errorMessage = 'Failed to assign actresses'
      if (error.message) {
        errorMessage = `Failed to assign actresses: ${error.message}`
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
          <Users className="h-5 w-5" />
          Bulk Actress Assignment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Assignment Mode */}
        <div>
          <Label className="mb-3 block">Assignment Mode</Label>
          <RadioGroup value={assignmentMode} onValueChange={(value: 'replace' | 'append') => setAssignmentMode(value)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="append" id="append-actresses" />
              <Label htmlFor="append-actresses">Append to existing actresses</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="replace" id="replace-actresses" />
              <Label htmlFor="replace-actresses">Replace existing actresses</Label>
            </div>
          </RadioGroup>
        </div>
        
        {/* Selected Actresses */}
        <div>
          <Label className="mb-2 block">Selected Actresses ({selectedActresses.length})</Label>
          {selectedActresses.length > 0 ? (
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedActresses.map((actressName) => (
                <Badge key={actressName} variant="default" className="flex items-center gap-2">
                  {actressName}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => removeActress(actressName)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mb-3">No actresses selected</p>
          )}
        </div>
        
        {/* Actress Search and Selection */}
        <div>
          <Label htmlFor="actress-search" className="mb-2 block">Search and Add Actresses</Label>
          <Input
            id="actress-search"
            placeholder="Search actresses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-3"
          />
          
          {isLoadingActresses ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2"></div>
              <span className="text-sm">Loading actresses...</span>
            </div>
          ) : (
            <div className="max-h-48 overflow-y-auto border rounded p-2">
              {filteredActresses.length > 0 ? (
                <div className="space-y-1">
                  {filteredActresses.map((actress) => (
                    <Button
                      key={actress.id}
                      variant="ghost"
                      className="w-full justify-start h-auto p-2"
                      onClick={() => addActress(actress.name!)}
                      disabled={selectedActresses.includes(actress.name!)}
                    >
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{actress.name}</span>
                        {selectedActresses.includes(actress.name!) && (
                          <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />
                        )}
                      </div>
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {searchQuery ? `No actresses found matching "${searchQuery}"` : 'No actresses available'}
                </p>
              )}
            </div>
          )}
        </div>
        
        {/* Assignment Button */}
        <Button
          onClick={handleAssignment}
          disabled={isAssigning || selectedMovies.length === 0 || selectedActresses.length === 0}
          className="w-full"
        >
          {isAssigning ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Assigning Actresses...
            </>
          ) : (
            <>
              <Users className="h-4 w-4 mr-2" />
              Assign {selectedActresses.length} Actress(es) to {selectedMovies.length} Movie(s)
            </>
          )}
        </Button>
        
        {/* Info */}
        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-medium mb-1">How it works:</div>
            <ul className="text-xs space-y-1">
              <li>• <strong>Append mode:</strong> Adds selected actresses to existing actresses list</li>
              <li>• <strong>Replace mode:</strong> Replaces all existing actresses with selected actresses</li>
              <li>• Actresses field in database: "actress" (singular for historical reasons)</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}