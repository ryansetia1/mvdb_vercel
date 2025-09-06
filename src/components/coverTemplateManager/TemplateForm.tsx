import React, { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Link, Star, Eye, RefreshCw } from 'lucide-react'
import { Checkbox } from '../ui/checkbox'
import { Badge } from '../ui/badge'
import { Alert, AlertDescription } from '../ui/alert'
import { CoverTemplateGroup, validateTemplateGroup, generatePreviewUrl, generateGalleryPreviewUrl } from './constants'
import { fetchMovieTypes, fetchMovieStudios } from './api'

interface TemplateFormProps {
  editingGroup?: CoverTemplateGroup | null
  onSave: (group: CoverTemplateGroup) => Promise<void>
  onCancel: () => void
  isSaving: boolean
  accessToken: string
}

export function TemplateForm({ editingGroup, onSave, onCancel, isSaving, accessToken }: TemplateFormProps) {
  const [templateGroup, setTemplateGroup] = useState<CoverTemplateGroup>({
    name: '',
    templateUrl: '',
    applicableTypes: [],
    applicableStudios: [],
    isDefault: false
  })
  
  const [errors, setErrors] = useState<string[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [availableTypes, setAvailableTypes] = useState<string[]>([])
  const [isLoadingTypes, setIsLoadingTypes] = useState(true)
  const [typesError, setTypesError] = useState<string | null>(null)
  
  const [availableStudios, setAvailableStudios] = useState<string[]>([])
  const [isLoadingStudios, setIsLoadingStudios] = useState(true)
  const [studiosError, setStudiosError] = useState<string | null>(null)

  // Load movie types dan studios dari database
  useEffect(() => {
    loadMovieTypes()
    loadMovieStudios()
  }, [accessToken])

  // Initialize form dengan data yang sedang diedit
  useEffect(() => {
    if (editingGroup) {
      setTemplateGroup({
        ...editingGroup
      })
    } else {
      setTemplateGroup({
        name: '',
        templateUrl: '',
        applicableTypes: [],
        applicableStudios: [],
        isDefault: false
      })
    }
  }, [editingGroup])

  const loadMovieTypes = async () => {
    try {
      setIsLoadingTypes(true)
      setTypesError(null)
      const types = await fetchMovieTypes(accessToken)
      setAvailableTypes(types.sort()) // Sort alphabetically
    } catch (error) {
      console.error('Error loading movie types:', error)
      setTypesError('Failed to load movie types from database')
      setAvailableTypes([]) // Fallback to empty array
    } finally {
      setIsLoadingTypes(false)
    }
  }

  const loadMovieStudios = async () => {
    try {
      setIsLoadingStudios(true)
      setStudiosError(null)
      const studios = await fetchMovieStudios(accessToken)
      setAvailableStudios(studios.sort()) // Sort alphabetically
    } catch (error) {
      console.error('Error loading movie studios:', error)
      setStudiosError('Failed to load movie studios from database')
      setAvailableStudios([]) // Fallback to empty array
    } finally {
      setIsLoadingStudios(false)
    }
  }

  // Handle perubahan input
  const handleInputChange = (field: keyof CoverTemplateGroup, value: any) => {
    setTemplateGroup(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear errors ketika user mulai mengetik
    if (errors.length > 0) {
      setErrors([])
    }
  }

  // Handle toggle movie type
  const handleTypeToggle = (type: string, checked: boolean) => {
    setTemplateGroup(prev => ({
      ...prev,
      applicableTypes: checked 
        ? [...prev.applicableTypes, type]
        : prev.applicableTypes.filter(t => t !== type)
    }))
  }

  // Handle toggle movie studio
  const handleStudioToggle = (studio: string, checked: boolean) => {
    setTemplateGroup(prev => ({
      ...prev,
      applicableStudios: checked 
        ? [...(prev.applicableStudios || []), studio]
        : (prev.applicableStudios || []).filter(s => s !== studio)
    }))
  }

  // Handle save dengan validasi
  const handleSave = async () => {
    const validationErrors = validateTemplateGroup(templateGroup)
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }
    
    try {
      await onSave(templateGroup)
    } catch (error) {
      console.error('Error saving template group:', error)
      setErrors(['Failed to save template group. Please try again.'])
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {editingGroup ? 'Edit Template Group' : 'Add Template Group'}
        </CardTitle>
        <CardDescription>
          Buat template group dengan satu URL yang berlaku untuk multiple movie types
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Error Messages */}
        {errors.length > 0 && (
          <Alert variant="destructive">
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Template Group Name */}
        <div className="space-y-2">
          <Label htmlFor="group-name">Template Group Name</Label>
          <Input
            id="group-name"
            value={templateGroup.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="e.g., Censored, High Quality, Standard"
          />
        </div>

        {/* Template URL (Cover) */}
        <div className="space-y-2">
          <Label htmlFor="template-url">Cover Template URL</Label>
          <Input
            id="template-url"
            value={templateGroup.templateUrl}
            onChange={(e) => handleInputChange('templateUrl', e.target.value)}
            placeholder="http://example.com/*/*.jpg (gunakan * sebagai placeholder)"
          />
          <p className="text-sm text-muted-foreground">
            URL harus mengandung karakter "*" yang akan diganti dengan kode movie
          </p>
        </div>

        {/* Gallery Template URL */}
        <div className="space-y-2">
          <Label htmlFor="gallery-template">Gallery Template URL (Optional)</Label>
          <Input
            id="gallery-template"
            value={templateGroup.galleryTemplate || ''}
            onChange={(e) => handleInputChange('galleryTemplate', e.target.value)}
            placeholder="http://example.com/*/gallery-##.jpg (gunakan * untuk kode movie, # untuk nomor gambar)"
          />
          <p className="text-sm text-muted-foreground">
            Placeholder: "*" untuk kode movie, "#" untuk nomor gambar. Contoh: # = 1, ## = 01, ### = 001
          </p>
        </div>

        {/* Preview URLs */}
        {(templateGroup.templateUrl?.includes('*') || templateGroup.galleryTemplate?.includes('*') || templateGroup.galleryTemplate?.includes('#')) && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label>Preview URLs</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
            {showPreview && (
              <div className="space-y-3">
                {/* Cover Preview */}
                {templateGroup.templateUrl?.includes('*') && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Cover Preview:</Label>
                    <div className="p-3 bg-muted rounded-md">
                      <code className="text-sm break-all">
                        {generatePreviewUrl(templateGroup.templateUrl)}
                      </code>
                    </div>
                  </div>
                )}
                
                {/* Gallery Preview */}
                {templateGroup.galleryTemplate && (templateGroup.galleryTemplate.includes('*') || templateGroup.galleryTemplate.includes('#')) && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Gallery Preview:</Label>
                    <div className="p-3 bg-muted rounded-md space-y-1">
                      <code className="text-sm break-all block">
                        {generateGalleryPreviewUrl(templateGroup.galleryTemplate)}
                      </code>
                      {templateGroup.galleryTemplate.includes('#') && (
                        <div className="text-xs text-muted-foreground">
                          Hashtag akan menjadi angka: # = 1, ## = 01, ### = 001, dst.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Applicable Movie Types */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Applicable Movie Types</Label>
            {isLoadingTypes && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Loading types...
              </div>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground">
            Pilih types yang akan menggunakan template ini (berdasarkan data real di database)
          </p>

          {/* Types Error */}
          {typesError && (
            <Alert variant="destructive">
              <AlertDescription className="flex items-center justify-between">
                <span>{typesError}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadMovieTypes}
                  disabled={isLoadingTypes}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Types Grid */}
          {!isLoadingTypes && !typesError && (
            <>
              {availableTypes.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    No movie types found in database. Add some movies first to see available types.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {availableTypes.map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={`type-${type}`}
                        checked={templateGroup.applicableTypes.includes(type)}
                        onCheckedChange={(checked) => handleTypeToggle(type, !!checked)}
                      />
                      <Label htmlFor={`type-${type}`} className="text-sm">
                        {type}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          
          {/* Selected Types Display */}
          {templateGroup.applicableTypes.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm">Selected Types:</Label>
              <div className="flex flex-wrap gap-1">
                {templateGroup.applicableTypes.map((type) => (
                  <Badge key={type} variant="secondary" className="text-xs">
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Applicable Movie Studios */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Applicable Movie Studios</Label>
            {isLoadingStudios && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Loading studios...
              </div>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground">
            Pilih studios yang akan menggunakan template ini (berdasarkan data real di database)
          </p>

          {/* Studios Error */}
          {studiosError && (
            <Alert variant="destructive">
              <AlertDescription className="flex items-center justify-between">
                <span>{studiosError}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadMovieStudios}
                  disabled={isLoadingStudios}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Studios Grid */}
          {!isLoadingStudios && !studiosError && (
            <>
              {availableStudios.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    No movie studios found in database. Add some movies first to see available studios.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                  {availableStudios.map((studio) => (
                    <div key={studio} className="flex items-center space-x-2">
                      <Checkbox
                        id={`studio-${studio}`}
                        checked={(templateGroup.applicableStudios || []).includes(studio)}
                        onCheckedChange={(checked) => handleStudioToggle(studio, !!checked)}
                      />
                      <Label htmlFor={`studio-${studio}`} className="text-sm truncate">
                        {studio}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          
          {/* Selected Studios Display */}
          {(templateGroup.applicableStudios || []).length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm">Selected Studios:</Label>
              <div className="flex flex-wrap gap-1">
                {(templateGroup.applicableStudios || []).map((studio) => (
                  <Badge key={studio} variant="outline" className="text-xs">
                    {studio}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Default Template Option */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="is-default"
            checked={templateGroup.isDefault}
            onCheckedChange={(checked) => handleInputChange('isDefault', checked)}
          />
          <Label htmlFor="is-default" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Set as Default Template Group
          </Label>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button 
            onClick={handleSave} 
            disabled={isSaving || isLoadingTypes || isLoadingStudios}
            className="flex items-center gap-2"
          >
            <Link className="h-4 w-4" />
            {isSaving ? 'Saving...' : editingGroup ? 'Update Group' : 'Save Group'}
          </Button>
          
          <Button 
            variant="outline"
            onClick={onCancel}
            disabled={isSaving}
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}