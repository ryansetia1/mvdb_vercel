import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { SearchableComboBox, useComboBoxOptions } from './ui/searchable-combobox'
import { Users, Plus, Trash2, Edit, Calendar, User } from 'lucide-react'
import { MasterDataItem, masterDataApi } from '../utils/masterDataApi'
import { ImageWithFallback } from './figma/ImageWithFallback'

interface GenerationFormProps {
  accessToken: string
}

interface GenerationFormData {
  name: string
  groupId: string
  groupName: string
  estimatedYears: string
  startDate: string
  endDate: string
  description: string
  profilePicture: string
}

export function GenerationForm({ accessToken }: GenerationFormProps) {
  const [generations, setGenerations] = useState<MasterDataItem[]>([])
  const [groups, setGroups] = useState<MasterDataItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [editingGeneration, setEditingGeneration] = useState<MasterDataItem | null>(null)
  const [formData, setFormData] = useState<GenerationFormData>({
    name: '',
    groupId: '',
    groupName: '',
    estimatedYears: '',
    startDate: '',
    endDate: '',
    description: '',
    profilePicture: ''
  })

  useEffect(() => {
    loadData()
  }, [accessToken])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [generationsData, groupsData] = await Promise.all([
        masterDataApi.getByType('generation', accessToken),
        masterDataApi.getByType('group', accessToken)
      ])
      setGenerations(generationsData)
      setGroups(groupsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
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
      groupId: '',
      groupName: '',
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
      groupId: generation.groupId || '',
      groupName: generation.groupName || '',
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
    try {
      setError(null)
      setSuccess(null)

      if (!formData.name.trim()) {
        setError('Generation name is required')
        return
      }

      if (!formData.groupId.trim()) {
        setError('Group is required')
        return
      }

      if (editingGeneration) {
        await masterDataApi.updateGeneration(
          editingGeneration.id,
          formData.name,
          formData.groupId,
          formData.groupName,
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
          formData.groupId,
          formData.groupName,
          accessToken,
          formData.estimatedYears || undefined,
          formData.startDate || undefined,
          formData.endDate || undefined,
          formData.description || undefined,
          formData.profilePicture || undefined
        )
        setSuccess('Generation created successfully')
      }

      setShowDialog(false)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save generation')
    }
  }

  const handleDelete = async (generation: MasterDataItem, e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    if (!confirm(`Are you sure you want to delete "${generation.name}"?`)) {
      return
    }

    try {
      setError(null)
      await masterDataApi.delete('generation', generation.id, accessToken)
      setSuccess('Generation deleted successfully')
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete generation')
    }
  }

  const handleInputChange = (field: keyof GenerationFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleGroupSelect = (groupId: string) => {
    const selectedGroup = groups.find(g => g.id === groupId)
    if (selectedGroup) {
      setFormData(prev => ({
        ...prev,
        groupId: groupId,
        groupName: selectedGroup.name || ''
      }))
    }
  }

  // Group options for combobox
  const groupComboBoxOptions = useComboBoxOptions(
    groups || [],
    (group) => group.id,
    (group) => group.name || 'Unnamed Group'
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Generations</h2>
          <Badge variant="outline">{generations.length} generations</Badge>
        </div>
        
        <Button onClick={(e) => handleCreate(e)} disabled={isLoading}>
          <Plus className="h-4 w-4 mr-2" />
          Add Generation
        </Button>
      </div>

      {/* Success/Error Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
          {success}
        </div>
      )}

      {/* Generations List */}
      {isLoading && generations.length === 0 ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading generations...</p>
        </div>
      ) : generations.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No generations created yet</h3>
          <p className="text-gray-500 mb-4">Create your first generation to organize actresses within groups</p>
          <Button onClick={(e) => handleCreate(e)}>
            <Plus className="h-4 w-4 mr-2" />
            Create First Generation
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {generations.map((generation) => (
            <GenerationCard
              key={generation.id}
              generation={generation}
              onEdit={(gen, e) => handleEdit(gen, e)}
              onDelete={(gen, e) => handleDelete(gen, e)}
              isLoading={isLoading}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingGeneration ? 'Edit Generation' : 'Create New Generation'}
            </DialogTitle>
            <DialogDescription>
              {editingGeneration ? 'Update generation information' : 'Add a new generation to organize actresses within a group'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="space-y-2">
                <Label htmlFor="group">Group *</Label>
                <SearchableComboBox
                  options={groupComboBoxOptions}
                  value={formData.groupId}
                  onValueChange={handleGroupSelect}
                  placeholder="Select a group..."
                  searchPlaceholder="Search groups..."
                  emptyMessage="No group found."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe this generation..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {editingGeneration ? 'Update Generation' : 'Create Generation'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface GenerationCardProps {
  generation: MasterDataItem
  onEdit: (generation: MasterDataItem, e?: React.MouseEvent) => void
  onDelete: (generation: MasterDataItem, e?: React.MouseEvent) => void
  isLoading: boolean
}

function GenerationCard({ generation, onEdit, onDelete, isLoading }: GenerationCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {generation.profilePicture ? (
            <ImageWithFallback
              src={generation.profilePicture}
              alt={generation.name || 'Generation'}
              className="w-12 h-12 rounded-full object-cover"
              fallback={<User className="w-12 h-12 text-gray-400" />}
            />
          ) : (
            <User className="w-12 h-12 text-gray-400" />
          )}
          <div>
            <h3 className="font-medium text-gray-900">{generation.name}</h3>
            <p className="text-sm text-gray-500">{generation.groupName}</p>
          </div>
        </div>
        
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => onEdit(generation, e)}
            disabled={isLoading}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => onDelete(generation, e)}
            disabled={isLoading}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {(generation.estimatedYears || generation.startDate || generation.endDate) && (
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
          <Calendar className="h-4 w-4" />
          <span>
            {generation.estimatedYears || 
             (generation.startDate && generation.endDate
              ? `${generation.startDate} - ${generation.endDate}`
              : generation.startDate || generation.endDate)}
          </span>
        </div>
      )}

      {generation.description && (
        <p className="text-sm text-gray-600 line-clamp-2">{generation.description}</p>
      )}
    </div>
  )
}
