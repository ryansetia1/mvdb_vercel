import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { SearchableComboBox } from './ui/searchable-combobox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Plus, Trash2, Edit, Calendar, User, Users } from 'lucide-react'
import { MasterDataItem, masterDataApi } from '../utils/masterDataApi'
import { ImageWithFallback } from './figma/ImageWithFallback'
import { GenerationActressManagement } from './GenerationActressManagement'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'

interface GenerationManagementProps {
  groupId?: string
  groupName?: string
  accessToken?: string
}

interface GenerationFormData {
  name: string
  estimatedYears: string
  startDate: string
  endDate: string
  description: string
  profilePicture: string
}

export function GenerationManagement({ groupId, groupName, accessToken }: GenerationManagementProps) {
  const [generations, setGenerations] = useState<MasterDataItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [editingGeneration, setEditingGeneration] = useState<MasterDataItem | null>(null)
  const [selectedGenerationId, setSelectedGenerationId] = useState<string>('')
  const [formData, setFormData] = useState<GenerationFormData>({
    name: '',
    estimatedYears: '',
    startDate: '',
    endDate: '',
    description: '',
    profilePicture: ''
  })

  useEffect(() => {
    if (groupId && accessToken) {
      loadGenerations()
    }
  }, [groupId, accessToken])

  useEffect(() => {
    // Set selected generation to first generation when generations change
    if (generations.length > 0 && !selectedGenerationId) {
      setSelectedGenerationId(generations[0].id)
    }
  }, [generations, selectedGenerationId])

  const loadGenerations = async () => {
    if (!groupId || !accessToken) return
    
    try {
      setIsLoading(true)
      const generationsData = await masterDataApi.getGenerationsByGroup(groupId, accessToken)
      setGenerations(generationsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load generations')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = (e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    setEditingGeneration(null)
    setFormData({
      name: '',
      estimatedYears: '',
      startDate: '',
      endDate: '',
      description: '',
      profilePicture: ''
    })
    setShowDialog(true)
  }

  const handleEdit = (generation: MasterDataItem, e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    setEditingGeneration(generation)
    setFormData({
      name: generation.name || '',
      estimatedYears: generation.estimatedYears || '',
      startDate: generation.startDate || '',
      endDate: generation.endDate || '',
      description: generation.description || '',
      profilePicture: generation.profilePicture || ''
    })
    setShowDialog(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!groupId || !groupName || !accessToken) {
      setError('Missing required data: groupId, groupName, or accessToken')
      return
    }

    try {
      setError(null)
      setSuccess(null)

      if (!formData.name.trim()) {
        setError('Generation name is required')
        return
      }

      console.log('Submitting generation data:', {
        name: formData.name,
        groupId,
        groupName,
        estimatedYears: formData.estimatedYears,
        startDate: formData.startDate,
        endDate: formData.endDate,
        description: formData.description,
        profilePicture: formData.profilePicture
      })
      
      console.log('GenerationManagement - groupId:', groupId, 'groupName:', groupName, 'accessToken:', accessToken ? 'present' : 'missing')

      if (editingGeneration) {
        await masterDataApi.updateGeneration(
          editingGeneration.id,
          formData.name,
          groupId,
          groupName,
          accessToken,
          formData.estimatedYears || undefined,
          formData.startDate || undefined,
          formData.endDate || undefined,
          formData.description || undefined,
          formData.profilePicture || undefined
        )
        setSuccess('Generation updated successfully')
      } else {
        await masterDataApi.createGeneration(
          formData.name,
          groupId,
          groupName,
          accessToken,
          formData.estimatedYears || undefined,
          formData.startDate || undefined,
          formData.endDate || undefined,
          formData.description || undefined,
          formData.profilePicture || undefined
        )
      }

      await loadGenerations()
      setShowDialog(false)
      setSuccess(editingGeneration ? 'Generation updated successfully' : 'Generation created successfully')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save generation')
      // Don't close dialog on error so user can see the error message
    }
  }

  const handleDelete = async (generation: MasterDataItem, e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    if (!accessToken) return
    
    if (!confirm(`Are you sure you want to delete "${generation.name}"?`)) {
      return
    }

    try {
      setError(null)
      await masterDataApi.delete('generation', generation.id, accessToken)
      setSuccess('Generation deleted successfully')
      await loadGenerations()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete generation')
    }
  }

  const handleInputChange = (field: keyof GenerationFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (!groupId || !accessToken) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Users className="h-12 w-12 mx-auto mb-4" />
        <p>Please save the group first to manage generations</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">Generations</TabsTrigger>
          <TabsTrigger value="actresses">Actress Assignments</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <h4 className="font-medium">Generations</h4>
              <Badge variant="outline">{generations.length} generations</Badge>
            </div>
            
            <Button onClick={(e) => handleCreate(e)} disabled={isLoading} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Generation
            </Button>
          </div>

          {/* Success/Error Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-md text-sm">
              {success}
            </div>
          )}

          {/* Generations List */}
          {isLoading && generations.length === 0 ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-gray-500">Loading generations...</p>
            </div>
          ) : generations.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
              <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <h5 className="font-medium text-gray-900 mb-1">No generations yet</h5>
              <p className="text-sm text-gray-500 mb-3">Create generations to organize actresses within this group</p>
              <Button onClick={(e) => handleCreate(e)} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Create First Generation
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {generations.map((generation) => (
                <GenerationItem
                  key={generation.id}
                  generation={generation}
                  onEdit={(gen, e) => handleEdit(gen, e)}
                  onDelete={(gen, e) => handleDelete(gen, e)}
                  isLoading={isLoading}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="actresses" className="space-y-4">
          {generations.length > 0 ? (
            <div className="space-y-4">
              {/* Generation Selector */}
              <div className="space-y-2">
                <Label htmlFor="generation-select">Select Generation</Label>
                <Select value={selectedGenerationId} onValueChange={setSelectedGenerationId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a generation to manage actresses" />
                  </SelectTrigger>
                  <SelectContent>
                    {generations.map((generation) => (
                      <SelectItem key={generation.id} value={generation.id}>
                        <div className="flex items-center gap-2">
                          {generation.profilePicture ? (
                            <ImageWithFallback
                              src={generation.profilePicture}
                              alt={generation.name || 'Generation'}
                              className="w-4 h-4 rounded-full object-cover"
                              fallback={<User className="w-4 h-4 text-gray-400" />}
                            />
                          ) : (
                            <User className="w-4 h-4 text-gray-400" />
                          )}
                          <span>{generation.name}</span>
                          {generation.estimatedYears && (
                            <span className="text-xs text-gray-500">({generation.estimatedYears})</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Generation Actress Management */}
              {selectedGenerationId && (
                <GenerationActressManagement 
                  generationId={selectedGenerationId}
                  generationName={generations.find(g => g.id === selectedGenerationId)?.name || 'Unnamed Generation'}
                  groupId={groupId || ''}
                  accessToken={accessToken || ''}
                />
              )}
            </div>
          ) : (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
              <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <h5 className="font-medium text-gray-900 mb-1">No generations available</h5>
              <p className="text-sm text-gray-500 mb-3">Create a generation first to manage actresses</p>
              <Button onClick={(e) => handleCreate(e)} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Create First Generation
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingGeneration ? 'Edit Generation' : 'Create New Generation'}
            </DialogTitle>
            <DialogDescription>
              {editingGeneration ? 'Update generation information' : 'Add a new generation to organize actresses within this group'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
             <div className="space-y-2">
               <Label htmlFor="name">Generation Name *</Label>
               <Input
                 id="name"
                 value={formData.name}
                 onChange={(e) => handleInputChange('name', e.target.value)}
                 placeholder="e.g., 1st Generation, Original Members"
                 required
               />
             </div>

             <div className="space-y-2">
               <Label htmlFor="estimatedYears">Estimated Years</Label>
               <Input
                 id="estimatedYears"
                 value={formData.estimatedYears}
                 onChange={(e) => handleInputChange('estimatedYears', e.target.value)}
                 placeholder="e.g., 2020-2023, 2018-2020, 2021-present"
               />
               <p className="text-xs text-gray-500">
                 Format: tahun-tahun (2020-2023) atau tahun-present (2021-present)
               </p>
             </div>

             <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profilePicture">Profile Picture URL</Label>
              <Input
                id="profilePicture"
                value={formData.profilePicture}
                onChange={(e) => handleInputChange('profilePicture', e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe this generation..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSubmit} disabled={isLoading}>
                {editingGeneration ? 'Update Generation' : 'Create Generation'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface GenerationItemProps {
  generation: MasterDataItem
  onEdit: (generation: MasterDataItem, e?: React.MouseEvent) => void
  onDelete: (generation: MasterDataItem, e?: React.MouseEvent) => void
  isLoading: boolean
}

function GenerationItem({ generation, onEdit, onDelete, isLoading }: GenerationItemProps) {
  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 hover:bg-gray-100 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {generation.profilePicture ? (
            <ImageWithFallback
              src={generation.profilePicture}
              alt={generation.name || 'Generation'}
              className="w-8 h-8 rounded-full object-cover"
              fallback={<User className="w-8 h-8 text-gray-400" />}
            />
          ) : (
            <User className="w-8 h-8 text-gray-400" />
          )}
          <div>
            <h5 className="font-medium text-gray-900 text-sm">{generation.name}</h5>
            {(generation.estimatedYears || generation.startDate || generation.endDate) && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Calendar className="h-3 w-3" />
                <span>
                  {generation.estimatedYears || 
                   (generation.startDate && generation.endDate
                    ? `${generation.startDate} - ${generation.endDate}`
                    : generation.startDate || generation.endDate)}
                </span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => onEdit(generation, e)}
            disabled={isLoading}
            className="h-7 w-7 p-0"
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => onDelete(generation, e)}
            disabled={isLoading}
            className="h-7 w-7 p-0"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {generation.description && (
        <p className="text-xs text-gray-600 mt-2 line-clamp-1">{generation.description}</p>
      )}
    </div>
  )
}
