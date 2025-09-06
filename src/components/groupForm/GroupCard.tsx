import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'
import { Edit, Trash2 } from 'lucide-react'
import { MasterDataItem } from '../../utils/masterDataApi'
import { ImageWithFallback } from '../figma/ImageWithFallback'

interface GroupCardProps {
  group: MasterDataItem
  onEdit: (group: MasterDataItem) => void
  onDelete: (group: MasterDataItem) => void
  isLoading: boolean
}

export function GroupCard({ group, onEdit, onDelete, isLoading }: GroupCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        {/* Group Profile Picture */}
        {group.profilePicture && (
          <div className="aspect-square w-full mb-3 rounded-md overflow-hidden bg-muted">
            <ImageWithFallback
              src={group.profilePicture}
              alt={group.name || 'Group'}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        {/* Group Info */}
        <div className="space-y-2">
          <h3 className="font-medium line-clamp-1">{group.name}</h3>
          
          {group.jpname && (
            <p className="text-sm text-muted-foreground line-clamp-1">
              {group.jpname}
            </p>
          )}
          
          {group.website && (
            <p className="text-xs text-blue-600 hover:underline cursor-pointer line-clamp-1">
              <a href={group.website} target="_blank" rel="noopener noreferrer">
                {group.website}
              </a>
            </p>
          )}
          
          {group.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {group.description}
            </p>
          )}
          
          <div className="text-xs text-muted-foreground">
            Created: {new Date(group.createdAt).toLocaleDateString()}
          </div>
        </div>
        
        {/* Actions */}
        <Separator className="my-3" />
        <div className="flex justify-between items-center">
          <Badge variant="secondary" className="text-xs">
            Group
          </Badge>
          
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(group)}
              disabled={isLoading}
            >
              <Edit className="h-3 w-3" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(group)}
              disabled={isLoading}
              className="text-red-600 hover:text-red-800"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}