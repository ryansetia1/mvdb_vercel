import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Checkbox } from '../ui/checkbox'
import { ImageWithFallback } from '../figma/ImageWithFallback'
import { TemplatePreview } from '../TemplatePreview'
import { LinkManager } from '../LinkManager'
import { CroppedImage } from '../CroppedImage'
import { ImageResolutionInfo } from '../ImageResolutionInfo'
import { CoverTemplateSelector } from '../CoverTemplateSelector'
import { processTemplate, getHashtagExplanation, shouldHideGallery } from '../../utils/templateUtils'
import { Movie } from '../../utils/movieApi'
import { Loader2 } from 'lucide-react'

interface MediaLinksTabProps {
  formData: Partial<Movie>
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  onCheckboxChange: (name: string, checked: boolean) => void
  onLinksChange: (field: string, links: string) => void
  isNewMovie?: boolean // Add prop to detect if this is a new movie
  templateLoading?: boolean // Add prop for template loading state
  effectiveTemplateType?: string // Override type for CoverTemplateSelector
}

export function MediaLinksTab({ 
  formData, 
  onInputChange, 
  onCheckboxChange,
  onLinksChange,
  isNewMovie = false,
  templateLoading = false,
  effectiveTemplateType = ''
}: MediaLinksTabProps) {

  const handleCoverTemplateSelect = (template: string) => {
    // For now, just set the template with asterisks as-is
    // User can see the template format and it will be processed when needed
    const fakeEvent = {
      target: {
        name: 'cover',
        value: template
      }
    } as React.ChangeEvent<HTMLInputElement>
    
    onInputChange(fakeEvent)
  }

  // Check gallery status
  const getGalleryStatus = () => {
    if (!formData.gallery) return null
    
    if (shouldHideGallery(formData.gallery)) {
      return {
        type: 'hidden',
        message: 'Gallery akan disembunyikan (template mengandung "now_printing")'
      }
    }
    
    if (formData.gallery.toLowerCase().includes('now_printing')) {
      return {
        type: 'filtered',
        message: 'Beberapa gambar akan dilewati karena mengandung "now_printing", namun gallery tetap ditampilkan'
      }
    }
    
    return {
      type: 'normal',
      message: 'Gallery akan ditampilkan normal dengan validasi canggih'
    }
  }

  // Check if current types include auto-crop types
  const currentTypes = formData.type ? formData.type.split(',').map(t => t.trim()) : []
  const autoCropTypes = ['Cen', 'Leaks', 'Sem', '2versions']
  const hasAutoCropType = currentTypes.some(type => 
    autoCropTypes.some(autoCropType => 
      type.toLowerCase() === autoCropType.toLowerCase()
    )
  )

  // Check if we should show template information
  const shouldShowTemplateInfo = formData.studio || formData.type

  return (
    <div className="space-y-4">
      {/* Template Loading Indicator */}
      {templateLoading && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-blue-700">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm font-medium">Menerapkan Template Default...</span>
          </div>
          <div className="text-sm text-blue-600 mt-1">
            Sistem sedang mengisi field cover dan gallery berdasarkan template default untuk studio/type yang dipilih.
          </div>
        </div>
      )}

      {/* Auto-Crop Status */}
      {hasAutoCropType && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-blue-700">
            <span className="text-sm font-medium">✨ Auto-Crop Aktif</span>
          </div>
          <div className="text-sm text-blue-600 mt-1">
            Cover akan otomatis di-crop karena movie type mengandung:{' '}
            {currentTypes
              .filter(type => 
                autoCropTypes.some(autoCropType => 
                  type.toLowerCase() === autoCropType.toLowerCase()
                )
              )
              .map(type => (
                <span key={type} className="font-mono bg-blue-100 px-1 rounded mx-1">
                  {type}
                </span>
              ))
            }
          </div>
        </div>
      )}

      {/* Template Status Information */}
      {shouldShowTemplateInfo && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-700">
            <span className="text-sm font-medium">🚀 Auto-Template System</span>
          </div>
          <div className="text-sm text-green-600 mt-1 space-y-1">
            {formData.studio && (
              <div>• Studio: <span className="font-mono bg-green-100 px-1 rounded">{formData.studio}</span> - template akan otomatis diterapkan jika tersedia</div>
            )}
            {formData.type && (
              <div>• Type: <span className="font-mono bg-green-100 px-1 rounded">{formData.type}</span> - fallback template jika studio tidak ada</div>
            )}
            <div className="text-xs text-green-500 mt-2">
              💡 Template hanya diterapkan jika field cover/gallery masih kosong dan DM code sudah diisi
            </div>
          </div>
        </div>
      )}

      {/* Legacy Cover Template Selector - only show if no modern templates available */}
      {effectiveTemplateType && !shouldShowTemplateInfo && (
        <CoverTemplateSelector
          movieType={effectiveTemplateType}
          onTemplateSelect={handleCoverTemplateSelect}
          autoSelectDefault={isNewMovie && !formData.cover}
        />
      )}

      {/* Cover Image Section */}
      <div>
        <Label htmlFor="cover">Cover Image URL</Label>
        <Input
          id="cover"
          name="cover"
          value={formData.cover || ''}
          onChange={onInputChange}
          placeholder="https://example.com/*/cover.jpg (gunakan * untuk DM code)"
        />
        <div className="text-xs text-gray-500 mt-1 space-y-1">
          <div><strong>Placeholders available:</strong></div>
          <div>• <code className="bg-gray-100 px-1 rounded">*</code> = DM code</div>
          <div>• <code className="bg-gray-100 px-1 rounded">@studio</code> = Studio name (lowercase)</div>
          <div>• <code className="bg-gray-100 px-1 rounded">@firstname</code> = First name (lowercase)</div>
          <div>• <code className="bg-gray-100 px-1 rounded">@lastname</code> = Last name (lowercase)</div>
          <div className="text-blue-600 mt-2">
            💡 Example: https://pics.com/@studio/*/covers/@firstname-@lastname.jpg
          </div>
          {formData.studio && (
            <div className="text-blue-600 mt-1">
              💡 Studio <span className="font-mono bg-gray-100 px-1 rounded">{formData.studio}</span> akan auto-isi field ini jika memiliki default template.
            </div>
          )}
          {formData.type && !formData.studio && (
            <div className="text-blue-600 mt-1">
              💡 Type <span className="font-mono bg-gray-100 px-1 rounded">{formData.type}</span> akan auto-isi field ini jika memiliki default template.
            </div>
          )}
        </div>
        
        <TemplatePreview 
          template={formData.cover || ''} 
          dmcode={formData.dmcode || ''} 
          label="Cover URL"
          studio={formData.studio}
          actress={formData.actress}
        />
        
        {formData.cover && formData.dmcode && (
          <div className="mt-2 space-y-4">
            {/* Image Resolution Info */}
            <div className="p-3 bg-muted rounded-lg">
              <h4 className="text-sm font-medium mb-2">Image Information</h4>
              <ImageResolutionInfo 
                src={processTemplate(formData.cover, { dmcode: formData.dmcode })}
              />
            </div>

            {/* Crop Option */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="cropCover"
                  checked={formData.cropCover || false}
                  onCheckedChange={(checked) => 
                    onCheckboxChange('cropCover', checked as boolean)
                  }
                />
                <Label htmlFor="cropCover" className="text-sm">
                  Crop cover (ambil bagian kanan saja)
                </Label>
                {hasAutoCropType && (
                  <span className="text-xs text-blue-600 font-medium">
                    (Auto-aktif untuk {currentTypes.filter(type => 
                      autoCropTypes.some(autoCropType => 
                        type.toLowerCase() === autoCropType.toLowerCase()
                      )
                    ).join(', ')})
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                Cover dengan resolusi 800x540 akan dipotong menjadi 400x540 (bagian kanan) 
                untuk tampilan movie list yang lebih sesuai format poster.
              </p>
            </div>
            
            {/* Preview Images */}
            <div className="flex gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Preview Normal (800x540):</p>
                <div className="relative">
                  <ImageWithFallback 
                    src={processTemplate(formData.cover, { dmcode: formData.dmcode })} 
                    alt="Cover preview normal"
                    className="w-32 h-24 object-cover rounded border"
                  />
                  <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1 rounded">
                    800x540
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Preview Cropped (400x540):</p>
                <div className="relative">
                  <CroppedImage
                    src={processTemplate(formData.cover, { dmcode: formData.dmcode })} 
                    alt="Cover preview cropped"
                    className="w-16 h-24 rounded border"
                    cropToRight={true}
                  />
                  <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1 rounded">
                    400x540
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Movie List Preview:</p>
                <div className="relative">
                  <CroppedImage
                    src={processTemplate(formData.cover, { dmcode: formData.dmcode })} 
                    alt="Cover preview movie list"
                    className="w-18 h-24 rounded border"
                    cropToRight={formData.cropCover}
                  />
                  <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1 rounded">
                    {formData.cropCover ? '3:4' : '5:3'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Gallery Section */}
      <div>
        <Label htmlFor="gallery">Gallery Images URL</Label>
        <Textarea
          id="gallery"
          name="gallery"
          value={formData.gallery || ''}
          onChange={onInputChange}
          placeholder="https://site.com/@studio/*/img##.jpg"
          rows={3}
        />
        <div className="text-xs text-gray-500 mt-1">
          <div className="space-y-1">
            <div>
              <strong>Placeholders available:</strong>
            </div>
            <div>• <code className="bg-gray-100 px-1 rounded">*</code> = DM code</div>
            <div>• <code className="bg-gray-100 px-1 rounded">@studio</code> = Studio name (lowercase)</div>
            <div>• <code className="bg-gray-100 px-1 rounded">@firstname</code> = First name (lowercase, ignores text in parentheses)</div>
            <div>• <code className="bg-gray-100 px-1 rounded">@lastname</code> = Last name (lowercase, ignores text in parentheses)</div>
            <div>• <code className="bg-gray-100 px-1 rounded">#</code> = 1-digit numbers (1, 2, 3, ..., 9)</div>
            <div>• <code className="bg-gray-100 px-1 rounded">##</code> = 2-digit numbers (01, 02, 03, ..., 99)</div>
            <div>• <code className="bg-gray-100 px-1 rounded">###</code> = 3-digit numbers (001, 002, 003, ..., 999)</div>
            <div className="text-blue-600 mt-2">
              💡 Example: https://gallery.com/@studio/@firstname-@lastname/*/img##.jpg
            </div>
            <div className="text-blue-600">
              🔍 <strong>Advanced Gallery Validation:</strong> Sistem akan otomatis memfilter gambar yang tidak valid.
            </div>
            <div className="text-green-600">
              ✅ <strong>Comprehensive Detection:</strong>
              <ul className="ml-4 mt-1 space-y-1">
                <li>• URL patterns (now_printing.jpg, /n/now_printing/, dll)</li>
                <li>• Dimensi minimum 150x150 pixel</li>
                <li>• Ukuran file minimum 20KB</li>
                <li>• Filename validation</li>
              </ul>
            </div>
            {formData.studio && (
              <div className="text-blue-600 mt-2">
                💡 Studio <span className="font-mono bg-gray-100 px-1 rounded">{formData.studio}</span> akan auto-isi gallery template jika tersedia.
              </div>
            )}
            {formData.type && !formData.studio && (
              <div className="text-blue-600 mt-2">
                💡 Type <span className="font-mono bg-gray-100 px-1 rounded">{formData.type}</span> akan auto-isi gallery template jika tersedia.
              </div>
            )}
          </div>
        </div>
        
        {formData.gallery && formData.gallery.includes('#') && (
          <div className="mt-2 space-y-2">
            <div className="p-2 bg-blue-50 rounded border text-sm">
              <strong>Pattern detected:</strong> {getHashtagExplanation(formData.gallery)}
            </div>
            
            {/* Gallery Status */}
            {(() => {
              const status = getGalleryStatus()
              if (!status) return null
              
              const bgColor = status.type === 'hidden' ? 'bg-red-50 border-red-200' :
                             status.type === 'filtered' ? 'bg-orange-50 border-orange-200' :
                             'bg-green-50 border-green-200'
              
              const textColor = status.type === 'hidden' ? 'text-red-700' :
                               status.type === 'filtered' ? 'text-orange-700' :
                               'text-green-700'
              
              return (
                <div className={`p-3 rounded border text-sm ${bgColor} ${textColor}`}>
                  <div className="font-medium mb-2">Gallery Validation Status:</div>
                  <div>{status.message}</div>
                  {status.type === 'normal' && (
                    <div className="mt-2 text-xs">
                      <div className="font-medium">Automatic Quality Filters:</div>
                      <ul className="ml-2 space-y-1">
                        <li>🚫 now_printing placeholders</li>
                        <li>📏 Images smaller than 150x150px</li>
                        <li>💾 Files smaller than 20KB</li>
                        <li>🔗 Invalid URL patterns</li>
                      </ul>
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
        )}
        
        <TemplatePreview 
          template={formData.gallery || ''} 
          dmcode={formData.dmcode || ''} 
          label="Gallery URLs"
          isGallery={true}
          studio={formData.studio}
          actress={formData.actress}
        />
      </div>

      {/* DM Link */}
      <div>
        <Label htmlFor="dmlink">DM Link</Label>
        <Input
          id="dmlink"
          name="dmlink"
          value={formData.dmlink || ''}
          onChange={onInputChange}
          placeholder="https://dmm.co.jp/..."
        />
      </div>

      {/* Multiple Links - Updated to use LinkManager for consistency */}
      <div className="space-y-6">
        <LinkManager
          label="Censored"
          links={formData.clinks || ''}
          onLinksChange={(links) => onLinksChange('clinks', links)}
          placeholder="Add censored links like trailers, reviews, etc."
        />

        <LinkManager
          label="Uncensored"
          links={formData.ulinks || ''}
          onLinksChange={(links) => onLinksChange('ulinks', links)}
          placeholder="Add uncensored download sources and mirrors"
        />

        <LinkManager
          label="Other"
          links={formData.slinks || ''}
          onLinksChange={(links) => onLinksChange('slinks', links)}
          placeholder="Add other platforms like Netflix, Amazon Prime, etc."
        />
      </div>
    </div>
  )
}