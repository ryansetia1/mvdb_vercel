import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Movie, movieApi } from '../utils/movieApi'
import { BasicInfoTab } from './tabs/BasicInfoTab'
import { MediaLinksTab } from './tabs/MediaLinksTab'
import { PeopleCastTab } from './tabs/PeopleCastTab'
import { MetadataTab } from './tabs/MetadataTab'
import { useTemplateAutoApply } from './useTemplateAutoApply'
import { Alert, AlertDescription } from './ui/alert'
import { CheckCircle } from 'lucide-react'

interface MovieFormProps {
  movie?: Movie
  onSave: (movie: Movie) => void
  onCancel: () => void
  accessToken: string
}

export function MovieForm({ movie, onSave, onCancel, accessToken }: MovieFormProps) {
  const [formData, setFormData] = useState<Partial<Movie>>({
    titleEn: '',
    titleJp: '',
    cover: '',
    gallery: '',
    code: '',
    dmcode: '',
    releaseDate: '',
    duration: '',
    director: '',
    dmlink: '',
    type: '',
    actress: '',
    actors: '',
    series: '',
    studio: '',
    label: '',
    tags: '',
    clinks: '',
    ulinks: '',
    slinks: '',
    cropCover: false  // Start with false - only set to true when auto-crop types are selected
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('basic')
  const [appliedTemplate, setAppliedTemplate] = useState<{
    templateName: string
    appliedFields: string[]
  } | null>(null)

  const { applyDefaultTemplate, isLoading: templateLoading } = useTemplateAutoApply({
    accessToken,
    onTemplateApplied: (template, appliedFields) => {
      setAppliedTemplate({
        templateName: template.name,
        appliedFields
      })
      // Auto hide notification after 5 seconds
      setTimeout(() => setAppliedTemplate(null), 5000)
    }
  })

  useEffect(() => {
    if (movie) {
      setFormData(movie)
    }
  }, [movie])

  // Helper function to try applying template for both studio and type
  const tryApplyTemplates = async (currentData: Partial<Movie>) => {
    if (!currentData.dmcode) {
      console.log('No dmcode available, skipping template auto-apply')
      return
    }

    // Try studio template first (higher priority)
    if (currentData.studio) {
      console.log('Trying to apply template for studio:', currentData.studio)
      const result = await applyDefaultTemplate({
        studio: currentData.studio,
        dmcode: currentData.dmcode,
        currentCover: currentData.cover,
        currentGallery: currentData.gallery
      })
      
      if (result) {
        console.log('Applied studio template:', result)
        setFormData(prev => ({
          ...prev,
          ...(result.cover && { cover: result.cover }),
          ...(result.gallery && { gallery: result.gallery })
        }))
        return // Studio template found and applied, don't try type template
      }
    }

    // Try type template if no studio template was applied
    if (currentData.type) {
      console.log('Trying to apply template for type:', currentData.type)
      const result = await applyDefaultTemplate({
        type: currentData.type,
        dmcode: currentData.dmcode,
        currentCover: currentData.cover,
        currentGallery: currentData.gallery
      })
      
      if (result) {
        console.log('Applied type template:', result)
        setFormData(prev => ({
          ...prev,
          ...(result.cover && { cover: result.cover }),
          ...(result.gallery && { gallery: result.gallery })
        }))
      }
    }
  }

  // Helper function to check if types should enable auto-crop
  const shouldEnableAutoCrop = (types: string[]): boolean => {
    const autoCropTypes = ['Cen', 'Leaks', 'Sem', '2versions']
    return types.some(type => 
      autoCropTypes.some(autoCropType => 
        type.trim().toLowerCase() === autoCropType.toLowerCase()
      )
    )
  }

  // Handler functions
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => {
      const newData = { ...prev, [name]: value }
      
      // Try to apply templates when dmcode or studio changes
      if (name === 'dmcode' || name === 'studio') {
        setTimeout(() => {
          tryApplyTemplates(newData)
        }, 100) // Small delay to ensure state is updated
      }
      
      return newData
    })
  }

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }))
  }

  const handleDateChange = (field: string, date: string) => {
    setFormData(prev => ({ ...prev, [field]: date }))
  }

  // Auto-crop logic for specific movie types
  const handleMultiSelectChange = async (field: string, values: string[]) => {
    const newValue = values.join(', ')
    
    // Update the field first
    setFormData(prev => {
      const newData = { ...prev, [field]: newValue }
      
      // Handle auto-crop for types - FIXED LOGIC
      if (field === 'type') {
        const shouldAutoCrop = shouldEnableAutoCrop(values)
        console.log('Auto-crop check:', {
          types: values, 
          shouldAutoCrop,
          previousCropCover: prev.cropCover
        })
        
        // Always set based on current types, don't preserve previous state
        newData.cropCover = shouldAutoCrop
      }
      
      // Try to apply templates after updating the data
      setTimeout(() => {
        tryApplyTemplates(newData)
      }, 100) // Small delay to ensure state is updated
      
      return newData
    })
  }

  const handleLinksChange = (field: string, links: string) => {
    setFormData(prev => ({ ...prev, [field]: links }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.titleEn?.trim()) {
      setError('Judul English (EN) wajib diisi')
      setActiveTab('basic') // Switch to basic tab to show error
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Save original template data (don't process templates)
      const processedData = {
        ...formData
      }

      let savedMovie: Movie
      if (movie?.id) {
        savedMovie = await movieApi.updateMovie(movie.id, processedData, accessToken)
      } else {
        savedMovie = await movieApi.createMovie(processedData as Movie, accessToken)
      }
      onSave(savedMovie)
    } catch (error: any) {
      console.log('Movie form save error:', error)
      setError(`Gagal menyimpan: ${error.message || error}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Get display title for form header
  const getDisplayTitle = () => {
    if (formData.titleEn) return formData.titleEn
    if (formData.titleJp) return formData.titleJp
    return 'Movie Baru'
  }

  // Form completion status
  const getFormCompletionStatus = () => {
    const requiredFields = ['titleEn']
    const basicFields = ['titleEn', 'titleJp', 'code', 'dmcode', 'releaseDate', 'duration', 'type', 'director']
    const mediaFields = ['cover', 'gallery', 'dmlink']
    const peopleFields = ['actress', 'actors', 'series', 'studio', 'label']
    const metadataFields = ['tags']

    const isFieldFilled = (field: string) => formData[field as keyof Movie]?.toString().trim() || false

    const requiredComplete = requiredFields.every(isFieldFilled)
    const basicComplete = basicFields.filter(isFieldFilled).length
    const mediaComplete = mediaFields.filter(isFieldFilled).length
    const peopleComplete = peopleFields.filter(isFieldFilled).length
    const metadataComplete = metadataFields.filter(isFieldFilled).length

    return {
      requiredComplete,
      basic: { completed: basicComplete, total: basicFields.length },
      media: { completed: mediaComplete, total: mediaFields.length },
      people: { completed: peopleComplete, total: peopleFields.length },
      metadata: { completed: metadataComplete, total: metadataFields.length }
    }
  }

  const completionStatus = getFormCompletionStatus()

  // Determine effective template context for CoverTemplateSelector
  const getEffectiveTemplateType = () => {
    // Don't show cover template selector if we have studio/type with default template
    // This prevents confusion about old template system
    return ''
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>
            {movie?.id ? `Edit: ${getDisplayTitle()}` : 'Tambah Movie Baru'}
          </span>
          {/* Form completion indicator */}
          <div className="text-sm text-muted-foreground">
            {completionStatus.requiredComplete ? (
              <span className="text-green-600">✓ Form Valid</span>
            ) : (
              <span className="text-red-600">⚠ Field wajib belum diisi</span>
            )}
          </div>
        </CardTitle>

        {/* Template Applied Notification */}
        {appliedTemplate && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Template "{appliedTemplate.templateName}" diterapkan!</strong>
              <div className="text-sm mt-1">
                Fields yang diisi otomatis: {appliedTemplate.appliedFields.join(', ')}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded border border-red-200">
            {error}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="basic" className="relative">
                Informasi Dasar
                <span className="ml-1 text-xs text-muted-foreground">
                  ({completionStatus.basic.completed}/{completionStatus.basic.total})
                </span>
                {!completionStatus.requiredComplete && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </TabsTrigger>
              <TabsTrigger value="media">
                Media & Links
                <span className="ml-1 text-xs text-muted-foreground">
                  ({completionStatus.media.completed}/{completionStatus.media.total})
                </span>
              </TabsTrigger>
              <TabsTrigger value="people">
                Cast & Crew
                <span className="ml-1 text-xs text-muted-foreground">
                  ({completionStatus.people.completed}/{completionStatus.people.total})
                </span>
              </TabsTrigger>
              <TabsTrigger value="metadata">
                Metadata
                <span className="ml-1 text-xs text-muted-foreground">
                  ({completionStatus.metadata.completed}/{completionStatus.metadata.total})
                </span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <BasicInfoTab
                formData={formData}
                onInputChange={handleInputChange}
                onDateChange={handleDateChange}
                onMultiSelectChange={handleMultiSelectChange}
                accessToken={accessToken}
              />
            </TabsContent>

            <TabsContent value="media" className="space-y-4">
              <MediaLinksTab
                formData={formData}
                onInputChange={handleInputChange}
                onCheckboxChange={handleCheckboxChange}
                onLinksChange={handleLinksChange}
                isNewMovie={!movie?.id} // New movie if no ID exists
                templateLoading={templateLoading}
                effectiveTemplateType={getEffectiveTemplateType()}
              />
            </TabsContent>

            <TabsContent value="people" className="space-y-4">
              <PeopleCastTab
                formData={formData}
                onMultiSelectChange={handleMultiSelectChange}
                accessToken={accessToken}
              />
            </TabsContent>

            <TabsContent value="metadata" className="space-y-4">
              <MetadataTab
                formData={formData}
                onMultiSelectChange={handleMultiSelectChange}
                accessToken={accessToken}
              />
            </TabsContent>
          </Tabs>

          {/* Form Actions */}
          <div className="flex justify-between items-center pt-6 border-t">
            <div className="text-sm text-muted-foreground">
              <div>Progress: {Object.values(completionStatus).slice(1).reduce((acc, curr) => acc + curr.completed, 0)} / {Object.values(completionStatus).slice(1).reduce((acc, curr) => acc + curr.total, 0)} fields</div>
              {!completionStatus.requiredComplete && (
                <div className="text-red-600">⚠ Field "Judul English" wajib diisi sebelum menyimpan</div>
              )}
            </div>

            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                disabled={isLoading}
              >
                Batal
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || !completionStatus.requiredComplete}
              >
                {isLoading ? 'Menyimpan...' : movie?.id ? 'Update' : 'Simpan'}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}