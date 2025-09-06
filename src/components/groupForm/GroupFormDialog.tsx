import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Label } from '../ui/label'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { SearchableComboBox, useComboBoxOptions } from '../ui/searchable-combobox'
import { Users, Plus, Trash2, Edit } from 'lucide-react'
import { MasterDataItem } from '../../utils/masterDataApi'
import { ImageWithFallback } from '../figma/ImageWithFallback'
import { GROUP_FORM_CONSTANTS } from './constants'
import { GalleryUrlManager } from './GalleryUrlManager'

interface GroupFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingGroup: MasterDataItem | null
  formData: {
    name: string
    jpname: string
    profilePicture: string
    website: string
    description: string
    gallery: string[]
  }
  onInputChange: (field: string, value: string | string[]) => void
  onSubmit: (e: React.FormEvent) => void
  isLoading: boolean
  // New props for actress management
  availableActresses?: MasterDataItem[]
  groupActresses?: MasterDataItem[]
  actressOperationLoading?: boolean
  onAddActressToGroup?: (actressId: string) => Promise<void>
  onRemoveActressFromGroup?: (actressId: string) => Promise<void>
  onCreateNewActress?: (name: string) => Promise<void>
  accessToken?: string
}

export function GroupFormDialog({
  open,
  onOpenChange,
  editingGroup,
  formData,
  onInputChange,
  onSubmit,
  isLoading,
  availableActresses = [],
  groupActresses = [],
  actressOperationLoading = false,
  onAddActressToGroup,
  onRemoveActressFromGroup,
  onCreateNewActress,
  accessToken
}: GroupFormDialogProps) {
  const [selectedActressId, setSelectedActressId] = useState<string>('')
  const [newActressName, setNewActressName] = useState<string>('')

  // Prepare options for searchable combobox
  const actressOptions = useComboBoxOptions(
    availableActresses.filter(actress => 
      !groupActresses.some(groupActress => groupActress.id === actress.id)
    ),
    (actress) => actress.id,
    (actress) => `${actress.name}${actress.jpname ? ` (${actress.jpname})` : ''}`,
    (actress) => [
      actress.name || '',
      actress.jpname || '',
      ...(actress.alias ? [actress.alias] : [])
    ].filter(Boolean)
  )

  const handleAddExistingActress = async () => {
    if (selectedActressId && onAddActressToGroup) {
      await onAddActressToGroup(selectedActressId)
      setSelectedActressId('')
    }
  }

  const handleCreateNewActress = async () => {
    if (newActressName.trim() && onCreateNewActress) {
      await onCreateNewActress(newActressName.trim())
      setNewActressName('')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {editingGroup ? 'Edit Group' : 'Create New Group'}
          </DialogTitle>
          <DialogDescription>
            {editingGroup 
              ? 'Update the group information and manage actresses below.'
              : 'Create a new actress group to organize your database.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="w-full">
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="info">Group Info</TabsTrigger>
              <TabsTrigger value="gallery">Gallery</TabsTrigger>
              <TabsTrigger value="actresses">Manage Actresses</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4 mt-6">
              {/* Group Name */}
              <div>
                <Label htmlFor="group-name">{GROUP_FORM_CONSTANTS.LABELS.GROUP_NAME}</Label>
                <Input
                  id="group-name"
                  value={formData.name}
                  onChange={(e) => onInputChange('name', e.target.value)}
                  placeholder={GROUP_FORM_CONSTANTS.PLACEHOLDERS.GROUP_NAME}
                  required
                />
              </div>

              {/* Group Japanese Name */}
              <div>
                <Label htmlFor="group-jpname">{GROUP_FORM_CONSTANTS.LABELS.JP_NAME}</Label>
                <Input
                  id="group-jpname"
                  value={formData.jpname}
                  onChange={(e) => onInputChange('jpname', e.target.value)}
                  placeholder={GROUP_FORM_CONSTANTS.PLACEHOLDERS.JP_NAME}
                />
              </div>

              {/* Profile Picture URL */}
              <div>
                <Label htmlFor="group-picture">{GROUP_FORM_CONSTANTS.LABELS.PROFILE_PICTURE}</Label>
                <Input
                  id="group-picture"
                  type="url"
                  value={formData.profilePicture}
                  onChange={(e) => onInputChange('profilePicture', e.target.value)}
                  placeholder={GROUP_FORM_CONSTANTS.PLACEHOLDERS.PROFILE_PICTURE}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {GROUP_FORM_CONSTANTS.HELPER_TEXT.PROFILE_PICTURE}
                </p>
              </div>

              {/* Website URL */}
              <div>
                <Label htmlFor="group-website">{GROUP_FORM_CONSTANTS.LABELS.WEBSITE}</Label>
                <Input
                  id="group-website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => onInputChange('website', e.target.value)}
                  placeholder={GROUP_FORM_CONSTANTS.PLACEHOLDERS.WEBSITE}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {GROUP_FORM_CONSTANTS.HELPER_TEXT.WEBSITE}
                </p>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="group-description">{GROUP_FORM_CONSTANTS.LABELS.DESCRIPTION}</Label>
                <Textarea
                  id="group-description"
                  value={formData.description}
                  onChange={(e) => onInputChange('description', e.target.value)}
                  placeholder={GROUP_FORM_CONSTANTS.PLACEHOLDERS.DESCRIPTION}
                  rows={3}
                />
              </div>

              {/* Preview */}
              {formData.profilePicture && (
                <div>
                  <Label>{GROUP_FORM_CONSTANTS.LABELS.PREVIEW}</Label>
                  <div className="mt-2 w-24 h-24 rounded-md overflow-hidden bg-muted border">
                    <ImageWithFallback
                      src={formData.profilePicture}
                      alt="Group preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 justify-end pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : null}
                  {editingGroup ? 'Update Group' : 'Create Group'}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="gallery" className="space-y-4 mt-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-4">Group Gallery</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Manage photo gallery for this group. These photos will be displayed in the group's detail page.
                  </p>
                </div>
                
                <GalleryUrlManager
                  galleryUrls={formData.gallery || []}
                  onChange={(urls) => {
                    console.log('=== GALLERY ONCHANGE CALLBACK ===')
                    console.log('New URLs received:', urls)
                    console.log('Current formData.gallery:', formData.gallery)
                    console.log('About to call onInputChange with gallery field and URLs:', urls)
                    onInputChange('gallery', urls)
                    console.log('=== END GALLERY ONCHANGE CALLBACK ===')
                  }}
                />

                {/* Actions for Gallery Tab */}
                <div className="flex gap-2 justify-end pt-4 border-t">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => onOpenChange(false)}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    onClick={() => {
                      console.log('Gallery tab submit - Form data:', formData)
                      console.log('Gallery data specifically:', formData.gallery)
                    }}
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : null}
                    {editingGroup ? 'Update Group' : 'Create Group'}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="actresses" className="space-y-4 mt-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Manage Actresses in Group</h3>
                  
                  {/* Add Existing Actress */}
                  <div className="space-y-4 p-4 border rounded-lg">
                    <h4 className="font-medium">Add Existing Actress</h4>
                    <div className="flex gap-2">
                      <SearchableComboBox
                        options={actressOptions}
                        value={selectedActressId}
                        onValueChange={setSelectedActressId}
                        placeholder="Select an actress..."
                        searchPlaceholder="Search actresses..."
                        emptyMessage="No actress found."
                        className="min-w-[300px]"
                        triggerClassName="flex-1"
                      />
                      <Button
                        type="button"
                        onClick={handleAddExistingActress}
                        disabled={!selectedActressId || actressOperationLoading}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>

                  {/* Create New Actress */}
                  <div className="space-y-4 p-4 border rounded-lg">
                    <h4 className="font-medium">Create New Actress</h4>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter actress name..."
                        value={newActressName}
                        onChange={(e) => setNewActressName(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        onClick={handleCreateNewActress}
                        disabled={!newActressName.trim() || actressOperationLoading}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Create
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This will create a new actress with placeholder data. You can edit the full details in the Actresses tab later.
                    </p>
                  </div>

                  {/* Current Actresses in Group */}
                  <div className="space-y-4 p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Actresses in Group</h4>
                      <Badge variant="outline">{groupActresses.length} actresses</Badge>
                    </div>
                    
                    {groupActresses.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">No actresses in this group yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {groupActresses.map((actress) => (
                          <div key={actress.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-3">
                              {actress.profilePicture && (
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-muted border">
                                  <ImageWithFallback
                                    src={actress.profilePicture}
                                    alt={actress.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              <div>
                                <p className="font-medium">{actress.name}</p>
                                {actress.jpname && (
                                  <p className="text-sm text-muted-foreground">{actress.jpname}</p>
                                )}
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => onRemoveActressFromGroup?.(actress.id)}
                              disabled={actressOperationLoading}
                              className="text-red-600 hover:text-red-800"
                            >
                              {actressOperationLoading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions for Actress Management */}
                <div className="flex gap-2 justify-end pt-4 border-t">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => onOpenChange(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </form>
      </DialogContent>
    </Dialog>
  )
}