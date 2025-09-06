import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Trash2, Edit2, Check, X, Loader2 } from 'lucide-react'
import { masterDataApi } from '../utils/masterDataApi'
import { syncTypeColorsOnNameChange } from '../utils/movieTypeColors'
import { toast } from 'sonner@2.0.3'

interface EditableTypeItemProps {
  item: {
    id: string
    name?: string
    type: string
  }
  type: 'type' | 'tag'
  accessToken: string
  onUpdate: (updatedItem: any) => void
  onDelete: (id: string) => void
}

export function EditableTypeItem({ item, type, accessToken, onUpdate, onDelete }: EditableTypeItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(item.name || '')
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleSave = async () => {
    if (!editName.trim()) {
      toast.error('Name cannot be empty')
      return
    }

    if (editName.trim() === item.name) {
      setIsEditing(false)
      return
    }

    setIsUpdating(true)
    try {
      const oldName = item.name || ''
      const newName = editName.trim()
      
      const result = await masterDataApi.updateSimpleWithSync(
        type, 
        item.id, 
        newName, 
        accessToken
      )
      
      onUpdate(result.data)
      setIsEditing(false)
      
      // Sync movie type colors if this is a type update
      if (type === 'type' && oldName !== newName) {
        syncTypeColorsOnNameChange(oldName, newName)
      }
      
      // Show sync results
      const { moviesUpdated, scMoviesUpdated } = result.sync
      const totalUpdated = moviesUpdated + scMoviesUpdated
      
      if (totalUpdated > 0) {
        toast.success(
          `Updated "${oldName}" → "${newName}" and synced ${totalUpdated} records (Movies: ${moviesUpdated}, SC Movies: ${scMoviesUpdated})`
        )
      } else {
        toast.success(`Updated "${oldName}" → "${newName}"`)
      }
      
    } catch (error: any) {
      console.error('Error updating type:', error)
      toast.error(`Failed to update: ${error.message}`)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCancel = () => {
    setEditName(item.name || '')
    setIsEditing(false)
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${item.name}"? This action cannot be undone.`)) {
      return
    }

    setIsDeleting(true)
    try {
      await masterDataApi.delete(type, item.id, accessToken)
      onDelete(item.id)
      toast.success(`Deleted "${item.name}"`)
    } catch (error: any) {
      console.error('Error deleting type:', error)
      toast.error(`Failed to delete: ${error.message}`)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
      {isEditing ? (
        <div className="flex items-center gap-2 flex-1">
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
            placeholder="Enter name..."
            autoFocus
          />
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isUpdating}
              className="h-8 w-8 p-0"
            >
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancel}
              disabled={isUpdating}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-1">
          <Badge variant="outline" className="font-mono">
            {item.name}
          </Badge>
          <div className="flex items-center gap-1 ml-auto">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(true)}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              title="Edit name"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDelete}
              disabled={isDeleting}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600"
              title="Delete"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}