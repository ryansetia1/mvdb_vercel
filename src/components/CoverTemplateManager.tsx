import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Plus, RefreshCw, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Alert, AlertDescription } from './ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { toast } from 'sonner@2.0.3'
import { TemplateForm } from './coverTemplateManager/TemplateForm'
import { TemplateGroupCard } from './coverTemplateManager/TemplateGroupCard'
import { CoverTemplateGroup } from './coverTemplateManager/constants'
import { 
  fetchTemplateGroups, 
  saveTemplateGroup, 
  deleteTemplateGroup, 
  applyTemplateGroup
} from './coverTemplateManager/api'

interface CoverTemplateManagerProps {
  accessToken: string
}

export function CoverTemplateManager({ accessToken }: CoverTemplateManagerProps) {
  const [templateGroups, setTemplateGroups] = useState<CoverTemplateGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingGroup, setEditingGroup] = useState<CoverTemplateGroup | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [overridingGroupId, setOverridingGroupId] = useState<string | null>(null)
  const [progressData, setProgressData] = useState<{
    groupId: string | null
    processed: number
    total: number
    status: string
    currentMovie?: string
  }>({
    groupId: null,
    processed: 0,
    total: 0,
    status: 'idle'
  })
  const [successDialogData, setSuccessDialogData] = useState<{
    isOpen: boolean
    groupName: string
    updatedCount: number
    affectedMovies: string[]
    types: string[]
  }>({
    isOpen: false,
    groupName: '',
    updatedCount: 0,
    affectedMovies: [],
    types: []
  })

  // Load template groups on mount
  useEffect(() => {
    loadTemplateGroups()
  }, [accessToken])

  const loadTemplateGroups = async () => {
    try {
      setIsLoading(true)
      setError(null)
      console.log('Loading template groups...')
      const groups = await fetchTemplateGroups(accessToken)
      console.log('Template groups loaded:', groups.length)
      setTemplateGroups(groups)
    } catch (error) {
      console.error('Error loading template groups:', error)
      
      // More specific error handling
      let errorMessage = 'Failed to load template groups'
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
          errorMessage = 'Network error - cannot reach server. Please check if the server is running.'
        } else if (error.message.includes('Unauthorized')) {
          errorMessage = 'Authentication failed - please refresh and log in again'
        } else if (error.message.includes('404')) {
          errorMessage = 'API endpoint not found - server may not be properly deployed'
        } else {
          errorMessage = `Error: ${error.message}`
        }
      }
      
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddNew = () => {
    setEditingGroup(null)
    setShowForm(true)
  }

  const handleEdit = (group: CoverTemplateGroup) => {
    setEditingGroup(group)
    setShowForm(true)
  }

  const handleSave = async (group: CoverTemplateGroup) => {
    try {
      setIsSaving(true)
      
      // Jika ada group lain yang default dan ini juga default, unset yang lain
      if (group.isDefault) {
        setTemplateGroups(prev => prev.map(g => ({ ...g, isDefault: false })))
      }
      
      const savedGroup = await saveTemplateGroup(accessToken, group)
      
      // Always reload template groups from server to ensure data consistency
      console.log('Reloading template groups after save to ensure data consistency...')
      await loadTemplateGroups()
      
      if (editingGroup) {
        toast.success('Template group updated successfully')
      } else {
        toast.success('Template group created successfully')
      }
      
      setShowForm(false)
      setEditingGroup(null)
    } catch (error) {
      console.error('Error saving template group:', error)
      toast.error('Failed to save template group')
      throw error // Re-throw untuk handling di form
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this template group?')) {
      return
    }

    try {
      await deleteTemplateGroup(accessToken, groupId)
      setTemplateGroups(prev => prev.filter(g => g.id !== groupId))
      toast.success('Template group deleted successfully')
    } catch (error) {
      console.error('Error deleting template group:', error)
      toast.error('Failed to delete template group')
    }
  }

  const handleOverride = async (group: CoverTemplateGroup) => {
    if (!group.id) {
      toast.error('Template group ID is missing')
      return
    }
    
    // Find the most current version of this group from state to ensure we have the latest data
    const currentGroup = templateGroups.find(g => g.id === group.id)
    if (!currentGroup) {
      toast.error('Template group not found in current state')
      return
    }
    
    console.log('=== Template Apply Debug ===')
    console.log('Original group data:', group)
    console.log('Current group data from state:', currentGroup)
    
    const typeList = currentGroup.applicableTypes.join(', ')
    
    // Create confirmation message based on what templates are available
    let confirmMessage = `This will update`
    const updates = []
    if (currentGroup.templateUrl) updates.push('cover images')
    if (currentGroup.galleryTemplate) updates.push('gallery templates')
    
    if (updates.length > 0) {
      confirmMessage += ` ${updates.join(' and ')}`
    } else {
      confirmMessage += ' templates'
    }
    
    confirmMessage += ` for all movies with types: ${typeList}. Continue?`
    
    if (!confirm(confirmMessage)) {
      return
    }

    try {
      setOverridingGroupId(currentGroup.id)
      setProgressData({
        groupId: currentGroup.id,
        processed: 0,
        total: 0,
        status: 'starting'
      })
      console.log('Starting template apply for group:', currentGroup)
      
      const result = await applyTemplateGroup(accessToken, currentGroup, (progress) => {
        setProgressData({
          groupId: currentGroup.id,
          processed: progress.processed,
          total: progress.total,
          status: progress.status,
          currentMovie: progress.currentMovie
        })
      })
      
      if (result.updatedCount === 0) {
        toast.warning(`No movies found with the selected types: ${typeList}`)
      } else {
        // Show success dialog instead of just toast
        setSuccessDialogData({
          isOpen: true,
          groupName: currentGroup.name,
          updatedCount: result.updatedCount,
          affectedMovies: result.affectedMovies,
          types: currentGroup.applicableTypes
        })
        
        // Create success message based on what was applied
        const appliedItems = []
        if (currentGroup.templateUrl) appliedItems.push('cover images')
        if (currentGroup.galleryTemplate) appliedItems.push('gallery templates')
        
        const successMessage = appliedItems.length > 0 
          ? `${appliedItems.join(' and ')} applied successfully! Updated ${result.updatedCount} movies.`
          : `Template applied successfully! Updated ${result.updatedCount} movies.`
        
        // Also show toast for quick feedback
        toast.success(successMessage)
      }
    } catch (error) {
      console.error('Error applying template group:', error)
      
      // More specific error messages
      let errorMessage = 'Failed to apply template group'
      if (error instanceof Error) {
        if (error.message.includes('Network error')) {
          errorMessage = 'Network error - please check your connection and try again'
        } else if (error.message.includes('Unauthorized')) {
          errorMessage = 'Authentication error - please refresh and try again'
        } else if (error.message.includes('not found')) {
          errorMessage = 'Template group not found'
        } else {
          errorMessage = error.message
        }
      }
      
      toast.error(errorMessage)
    } finally {
      setOverridingGroupId(null)
      setProgressData({
        groupId: null,
        processed: 0,
        total: 0,
        status: 'idle'
      })
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingGroup(null)
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Loading template groups...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Template Manager</CardTitle>
              <CardDescription>
                Kelola template groups untuk mengupdate cover dan gallery movie secara batch
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddNew} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Template Group
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={loadTemplateGroups}
              disabled={isLoading}
              className="ml-2"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {showForm && (
        <TemplateForm
          editingGroup={editingGroup}
          onSave={handleSave}
          onCancel={handleCancel}
          isSaving={isSaving}
          accessToken={accessToken}
        />
      )}

      {templateGroups.length === 0 && !showForm ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              No template groups found. Create your first template group to get started.
            </p>
            <Button onClick={handleAddNew} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Create Template Group
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templateGroups.map((group) => (
            <TemplateGroupCard
              key={group.id}
              group={group}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onOverride={handleOverride}
              isOverriding={overridingGroupId === group.id}
              progressData={progressData.groupId === group.id ? progressData : null}
            />
          ))}
        </div>
      )}

      {/* Success Dialog */}
      <Dialog open={successDialogData.isOpen} onOpenChange={(isOpen) => setSuccessDialogData(prev => ({ ...prev, isOpen }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Templates Applied Successfully!
            </DialogTitle>
            <DialogDescription className="text-left">
              Template "<strong>{successDialogData.groupName}</strong>" has been applied to your movies.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-md">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Movies Updated:</span>
                  <div className="text-lg font-bold text-green-600">{successDialogData.updatedCount}</div>
                </div>
                <div>
                  <span className="font-medium">Movie Types:</span>
                  <div className="text-sm text-muted-foreground">
                    {successDialogData.types.join(', ')}
                  </div>
                </div>
              </div>
            </div>
            
            {successDialogData.affectedMovies.length > 0 && (
              <div>
                <span className="font-medium text-sm">Updated Movies:</span>
                <div className="mt-1 p-2 bg-muted rounded text-xs font-mono max-h-24 overflow-y-auto">
                  {successDialogData.affectedMovies.slice(0, 10).map((movieId, index) => (
                    <div key={index}>{movieId}</div>
                  ))}
                  {successDialogData.affectedMovies.length > 10 && (
                    <div className="text-muted-foreground">
                      ...and {successDialogData.affectedMovies.length - 10} more movies
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button onClick={() => setSuccessDialogData(prev => ({ ...prev, isOpen: false }))}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}