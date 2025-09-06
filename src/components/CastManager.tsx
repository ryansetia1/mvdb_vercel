import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Separator } from './ui/separator'
import { MasterDataItem, masterDataApi } from '../utils/masterDataApi'
import { Plus, X, User, Users, UserCheck, Lock } from 'lucide-react'
import { toast } from 'sonner@2.0.3'

interface CastManagerProps {
  type: 'actor' | 'actress' | 'director'
  currentCast: string // comma-separated names
  onCastChange: (newCast: string) => void
  accessToken: string
  allowMultiple?: boolean // New prop to control multiple selection
  placeholder?: string // Custom placeholder text
  restrictToNames?: string[] // New: restrict selection to only these names
}

interface CastMember {
  name: string
  isExisting: boolean
  data?: MasterDataItem
}

export function CastManager({ 
  type, 
  currentCast, 
  onCastChange, 
  accessToken, 
  allowMultiple = true, 
  placeholder,
  restrictToNames 
}: CastManagerProps) {
  const [castMembers, setCastMembers] = useState<CastMember[]>([])
  const [availablePeople, setAvailablePeople] = useState<MasterDataItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  
  // New person form state
  const [newPersonName, setNewPersonName] = useState('')
  const [newPersonBirthdate, setNewPersonBirthdate] = useState('')
  const [newPersonBio, setNewPersonBio] = useState('')
  const [newPersonProfilePicture, setNewPersonProfilePicture] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Search state for existing people
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredPeople, setFilteredPeople] = useState<MasterDataItem[]>([])

  const typeLabels = {
    actor: 'Actor',
    actress: 'Actress', 
    director: 'Director'
  }

  const typeIcons = {
    actor: User,
    actress: Users,
    director: UserCheck
  }

  const Icon = typeIcons[type]

  // Load available people on mount
  useEffect(() => {
    const loadPeople = async () => {
      try {
        setIsLoading(true)
        const people = await masterDataApi.getByType(type, accessToken)
        let filteredPeople = people || []
        
        // If restrictToNames is provided, filter to only those people
        if (restrictToNames && restrictToNames.length > 0) {
          filteredPeople = filteredPeople.filter(person => 
            restrictToNames.includes(person.name!)
          )
        }
        
        setAvailablePeople(filteredPeople)
        setFilteredPeople(filteredPeople)
      } catch (error) {
        console.error(`Failed to load ${type}s:`, error)
      } finally {
        setIsLoading(false)
      }
    }

    loadPeople()
  }, [type, accessToken, restrictToNames])

  // Parse current cast on mount and when currentCast changes
  useEffect(() => {
    if (!currentCast) {
      setCastMembers([])
      return
    }

    const names = currentCast.split(',').map(name => name.trim()).filter(Boolean)
    const members: CastMember[] = names.map(name => {
      const existingPerson = availablePeople.find(p => p.name === name)
      return {
        name,
        isExisting: !!existingPerson,
        data: existingPerson
      }
    })
    setCastMembers(members)
  }, [currentCast, availablePeople])

  // Filter people based on search
  useEffect(() => {
    if (!searchQuery) {
      setFilteredPeople(availablePeople)
    } else {
      setFilteredPeople(
        availablePeople.filter(person =>
          person.name?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    }
  }, [searchQuery, availablePeople])

  // Update parent when cast members change
  const updateParent = (members: CastMember[]) => {
    const castString = members.map(member => member.name).join(', ')
    onCastChange(castString)
  }

  // Add existing person
  const addExistingPerson = (person: MasterDataItem) => {
    if (!person.name) return
    
    // Check if already added
    if (castMembers.some(member => member.name === person.name)) {
      toast.error(`${person.name} is already added`)
      return
    }

    // For director or single selection, replace existing instead of adding
    let newMembers: CastMember[]
    if (type === 'director' || !allowMultiple) {
      newMembers = [{
        name: person.name,
        isExisting: true,
        data: person
      }]
    } else {
      newMembers = [...castMembers, {
        name: person.name,
        isExisting: true,
        data: person
      }]
    }
    
    setCastMembers(newMembers)
    updateParent(newMembers)
    setSearchQuery('')
  }

  // Remove cast member
  const removeCastMember = (index: number) => {
    const newMembers = castMembers.filter((_, i) => i !== index)
    setCastMembers(newMembers)
    updateParent(newMembers)
  }

  // Create new person
  const createNewPerson = async () => {
    if (!newPersonName.trim()) {
      toast.error('Name is required')
      return
    }

    // Check if name already exists (only within current type)
    const existingPerson = availablePeople.find(p => p.name?.toLowerCase()?.trim() === newPersonName.toLowerCase().trim())
    if (existingPerson) {
      toast.error(`A ${typeLabels[type].toLowerCase()} with this name already exists: "${existingPerson.name}"`)
      return
    }

    // If restrictToNames is active, check if the new name is allowed
    if (restrictToNames && restrictToNames.length > 0 && !restrictToNames.includes(newPersonName.trim())) {
      toast.error('This name is not allowed in the current restricted selection')
      return
    }

    try {
      setIsSaving(true)
      
      const newPersonData: Partial<MasterDataItem> = {
        name: newPersonName.trim(),
        type,
        birthdate: newPersonBirthdate || undefined,
        // Note: 'bio' might not exist in MasterDataItem, check if it should be a different field
        profilePicture: newPersonProfilePicture || undefined
      }

      const createdPerson = await masterDataApi.createExtended(type, newPersonData, accessToken)
      
      // Add to available people
      setAvailablePeople(prev => [...prev, createdPerson])
      
      // Add to cast
      const newMember: CastMember = {
        name: createdPerson.name!,
        isExisting: true,
        data: createdPerson
      }
      
      // For director or single selection, replace existing instead of adding
      let newMembers: CastMember[]
      if (type === 'director' || !allowMultiple) {
        newMembers = [newMember]
      } else {
        newMembers = [...castMembers, newMember]
      }
      
      setCastMembers(newMembers)
      updateParent(newMembers)

      // Reset form
      setNewPersonName('')
      setNewPersonBirthdate('')
      setNewPersonBio('')
      setNewPersonProfilePicture('')
      setShowAddDialog(false)
      
      toast.success(`${typeLabels[type]} created and added successfully`)
    } catch (error) {
      console.error('Failed to create person:', error)
      
      // Parse error message for better user feedback
      let errorMessage = `Failed to create ${typeLabels[type].toLowerCase()}`
      if (error.message) {
        if (error.message.includes('already exists')) {
          errorMessage = `A ${typeLabels[type].toLowerCase()} with the name "${newPersonName.trim()}" already exists`
        } else if (error.message.includes('Item already exists')) {
          errorMessage = `This ${typeLabels[type].toLowerCase()} name is already taken`
        } else {
          errorMessage = error.message
        }
      }
      
      toast.error(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
        <p className="text-sm text-muted-foreground">Loading {typeLabels[type].toLowerCase()}s...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Restriction Notice */}
      {restrictToNames && restrictToNames.length > 0 && (
        <div className="p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
          <div className="flex items-center gap-1 mb-1">
            <Lock className="h-3 w-3" />
            <span className="font-medium">Selection Restricted</span>
          </div>
          <div>Only pre-selected {typeLabels[type].toLowerCase()}s are available: {restrictToNames.join(', ')}</div>
        </div>
      )}

      {/* Current Cast Members */}
      <div>
        <Label className="flex items-center gap-2 mb-3">
          <Icon className="h-4 w-4" />
          {placeholder || `Current ${typeLabels[type]}${(type !== 'director' && allowMultiple) ? 's' : ''}`}
          {!allowMultiple && (
            <span className="text-xs text-muted-foreground">(single selection)</span>
          )}
          {restrictToNames && (
            <Lock className="h-3 w-3 text-amber-600" />
          )}
        </Label>
        
        {castMembers.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {castMembers.map((member, index) => (
              <Badge
                key={index}
                variant={member.isExisting ? "default" : "secondary"}
                className="flex items-center gap-2 px-3 py-1"
              >
                <span>{member.name}</span>
                {!member.isExisting && (
                  <span className="text-xs opacity-75">(new)</span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => removeCastMember(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No {typeLabels[type].toLowerCase()}{type !== 'director' && allowMultiple ? 's' : ''} added
          </p>
        )}
      </div>

      <Separator />

      {/* Add Existing Person */}
      <div>
        <Label className="block mb-2">
          Add Existing {typeLabels[type]}
          {(type === 'director' || !allowMultiple) && castMembers.length > 0 && (
            <span className="text-xs text-muted-foreground ml-2">(will replace current)</span>
          )}
        </Label>
        <div className="space-y-2">
          <Input
            placeholder={`Search ${typeLabels[type].toLowerCase()}s...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          
          {/* Show available people by default or when searching */}
          {filteredPeople.length > 0 && (
            <Card className="max-h-48 overflow-y-auto">
              <CardContent className="p-2">
                <div className="space-y-1">
                  {(searchQuery ? filteredPeople : filteredPeople.slice(0, 15)).map((person) => (
                    <Button
                      key={person.id}
                      variant="ghost"
                      className="w-full justify-start h-auto p-2"
                      onClick={() => addExistingPerson(person)}
                      disabled={castMembers.some(member => member.name === person.name)}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <div className="text-left">
                          <div className="font-medium">{person.name}</div>
                          {person.birthdate && (
                            <div className="text-xs text-muted-foreground">
                              Born: {new Date(person.birthdate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </Button>
                  ))}
                  {!searchQuery && filteredPeople.length > 15 && (
                    <div className="text-xs text-center text-muted-foreground py-2 border-t">
                      Showing first 15 {typeLabels[type].toLowerCase()}s. Use search to find more.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          
          {searchQuery && filteredPeople.length === 0 && (
            <p className="text-sm text-muted-foreground py-2">
              No {typeLabels[type].toLowerCase()}s found matching "{searchQuery}"
              {restrictToNames && ' in the restricted selection'}
            </p>
          )}
          
          {!searchQuery && availablePeople.length === 0 && (
            <p className="text-sm text-muted-foreground py-2">
              {restrictToNames ? 
                `No ${typeLabels[type].toLowerCase()}s available in the restricted selection.` :
                `No ${typeLabels[type].toLowerCase()}s available. Create a new one below.`
              }
            </p>
          )}
        </div>
      </div>

      <Separator />

      {/* Add New Person - Only show if not restricted or restriction allows it */}
      {(!restrictToNames || restrictToNames.length === 0) && (
        <div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Create New {typeLabels[type]}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New {typeLabels[type]}</DialogTitle>
                <DialogDescription>
                  Add a new {typeLabels[type].toLowerCase()} to the database and cast
                  {(type === 'director' || !allowMultiple) && castMembers.length > 0 && (
                    <span className="block text-amber-600 mt-1">Note: This will replace the current {typeLabels[type].toLowerCase()}</span>
                  )}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={newPersonName}
                    onChange={(e) => setNewPersonName(e.target.value)}
                    placeholder={`${typeLabels[type]} name`}
                  />
                </div>
                
                <div>
                  <Label htmlFor="birthdate">Birth Date</Label>
                  <Input
                    id="birthdate"
                    type="date"
                    value={newPersonBirthdate}
                    onChange={(e) => setNewPersonBirthdate(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="profilePicture">Profile Picture URL</Label>
                  <Input
                    id="profilePicture"
                    value={newPersonProfilePicture}
                    onChange={(e) => setNewPersonProfilePicture(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddDialog(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={createNewPerson}
                    disabled={isSaving || !newPersonName.trim()}
                    className="flex-1"
                  >
                    {isSaving ? 'Creating...' : 'Create & Add'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
      
      {/* Alternative message when restricted */}
      {restrictToNames && restrictToNames.length > 0 && (
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Creating new {typeLabels[type].toLowerCase()}s is disabled when selection is restricted.
          </p>
        </div>
      )}
    </div>
  )
}