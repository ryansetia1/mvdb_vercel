import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { Edit, Trash2, Star, Link, RefreshCw } from 'lucide-react'
import { CoverTemplateGroup } from './constants'

interface TemplateGroupCardProps {
  group: CoverTemplateGroup
  onEdit: (group: CoverTemplateGroup) => void
  onDelete: (groupId: string) => void
  onOverride: (group: CoverTemplateGroup) => void
  isOverriding?: boolean
  progressData?: {
    processed: number
    total: number
    status: string
    currentMovie?: string
  } | null
}

export function TemplateGroupCard({ 
  group, 
  onEdit, 
  onDelete, 
  onOverride, 
  isOverriding = false,
  progressData = null
}: TemplateGroupCardProps) {
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown'
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Card className={`transition-all hover:shadow-md ${group.isDefault ? 'ring-2 ring-primary/20' : ''}`}>
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              {group.name}
              {group.isDefault && (
                <Badge variant="default" className="text-xs">
                  <Star className="h-3 w-3 mr-1" />
                  Default
                </Badge>
              )}
            </CardTitle>
            <div className="space-y-1">
              <CardDescription className="break-all text-xs">
                <span className="font-medium">Cover:</span> {group.templateUrl}
              </CardDescription>
              {group.galleryTemplate && (
                <CardDescription className="break-all text-xs">
                  <span className="font-medium">Gallery:</span> {group.galleryTemplate}
                </CardDescription>
              )}
            </div>
          </div>
          
          <div className="flex gap-1 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(group)}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
            
            {group.id && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(group.id!)}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Applicable Criteria */}
        <div className="space-y-3">
          {/* Types */}
          {group.applicableTypes.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Applicable Types:</h4>
              <div className="flex flex-wrap gap-1">
                {group.applicableTypes.map((type) => (
                  <Badge key={type} variant="secondary" className="text-xs">
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {/* Studios */}
          {(group.applicableStudios || []).length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Applicable Studios:</h4>
              <div className="flex flex-wrap gap-1">
                {(group.applicableStudios || []).map((studio) => (
                  <Badge key={studio} variant="outline" className="text-xs">
                    {studio}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {/* No criteria warning */}
          {group.applicableTypes.length === 0 && (group.applicableStudios || []).length === 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">No Applicable Criteria</h4>
              <Badge variant="destructive" className="text-xs">
                Template will not apply to any movies
              </Badge>
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
          <div>
            <span className="font-medium">Created:</span><br />
            {formatDate(group.createdAt)}
          </div>
          <div>
            <span className="font-medium">Updated:</span><br />
            {formatDate(group.updatedAt)}
          </div>
        </div>

        {/* Progress Display */}
        {progressData && progressData.status !== 'idle' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">
                {progressData.processed}/{progressData.total}
              </span>
            </div>
            <Progress 
              value={progressData.total > 0 ? (progressData.processed / progressData.total) * 100 : 0} 
              className="h-2"
            />
            {progressData.currentMovie && (
              <div className="text-xs text-muted-foreground truncate">
                Processing: {progressData.currentMovie}
              </div>
            )}
          </div>
        )}

        {/* Override Action */}
        <div className="pt-2 border-t">
          <Button
            onClick={() => onOverride(group)}
            disabled={isOverriding}
            variant="outline"
            size="sm"
            className="w-full flex items-center gap-2"
          >
            {isOverriding ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                {progressData?.status === 'starting' ? 'Starting...' : 'Applying Templates...'}
              </>
            ) : (
              <>
                <Link className="h-4 w-4" />
                Apply Templates ({(() => {
                  const typesCount = group.applicableTypes.length
                  const studiosCount = (group.applicableStudios || []).length
                  
                  if (typesCount > 0 && studiosCount > 0) {
                    return `${typesCount} types, ${studiosCount} studios`
                  } else if (typesCount > 0) {
                    return `${typesCount} types`
                  } else if (studiosCount > 0) {
                    return `${studiosCount} studios`
                  } else {
                    return 'no criteria'
                  }
                })()})
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}