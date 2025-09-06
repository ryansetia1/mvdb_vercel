import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Label } from './ui/label'
import { TemplatePreview } from './TemplatePreview'
import { ImageWithFallback } from './figma/ImageWithFallback'
import { CastManager } from './CastManager'
import { IndividualImageTagger } from './IndividualImageTagger'
import { ManualLinksGridSection } from './imageLinksManager/ManualLinksGridSection'
import { BulkActressAssigner } from './BulkActressAssigner'
import { getHashtagExplanation } from '../utils/templateUtils'
import { Hash, Images, Users, Settings, Shield, UserPlus } from 'lucide-react'
import { ImageLinksManagerProps, ManualLink } from './imageLinksManager/types'
import { 
  parseImageLinks,
  getTemplateActressesFromTags,
  generatePreviewUrls,
  calculateTotalImages,
  buildImageLinksString,
  generateManualImageTags
} from './imageLinksManager/helpers'

export function ImageLinksManager({ 
  label, 
  imageLinks, 
  onImageLinksChange, 
  imageTags,
  onImageTagsChange,
  placeholder,
  dmcode = '',
  accessToken,
  selectedActresses = [] // New prop for restricting actress selection
}: ImageLinksManagerProps) {
  // Template state
  const [templateUrl, setTemplateUrl] = useState('')
  const [templateActresses, setTemplateActresses] = useState('')
  
  // Manual links state
  const [manualLinks, setManualLinks] = useState<ManualLink[]>([])

  // Advanced tagging state
  const [showAdvancedTagging, setShowAdvancedTagging] = useState(false)
  const [showIndividualTagging, setShowIndividualTagging] = useState(false)
  const [showBulkAssigner, setShowBulkAssigner] = useState(false)

  // Parse existing imageLinks on mount
  useEffect(() => {
    const { templateUrl: foundTemplate, manualLinks: foundManualLinks } = parseImageLinks(imageLinks, imageTags)
    
    setTemplateUrl(foundTemplate)
    setManualLinks(foundManualLinks)
    
    // Set template actresses from imageTags
    setTemplateActresses(getTemplateActressesFromTags(foundTemplate, imageTags))
  }, [imageLinks, imageTags])

  // Update parent when template or manual links change
  const updateParent = (newTemplate: string, newManualLinks: ManualLink[], newTemplateActresses: string) => {
    onImageLinksChange(buildImageLinksString(newTemplate, newManualLinks))

    // Update image tags - manual links only (template tags are managed by IndividualImageTagger)
    const templateTagsCount = newTemplate.trim() && newTemplate.includes('#') ? 50 : 0
    const templateTags = imageTags.filter(tag => 
      newTemplate.trim() && tag.imageIndex !== undefined && tag.imageIndex < 50
    )
    
    const manualImageTags = generateManualImageTags(newManualLinks, templateTagsCount)
    
    onImageTagsChange([...templateTags, ...manualImageTags])
  }

  // Template handlers
  const handleTemplateChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newTemplate = e.target.value
    setTemplateUrl(newTemplate)
    
    // If template is cleared, remove template tags
    if (!newTemplate.trim() || !newTemplate.includes('#')) {
      const nonTemplateTags = imageTags.filter(tag => 
        tag.imageIndex === undefined || tag.imageIndex >= 50
      )
      onImageTagsChange(nonTemplateTags)
    }
    
    updateParent(newTemplate, manualLinks, templateActresses)
  }

  const handleTemplateActressesChange = (actresses: string) => {
    setTemplateActresses(actresses)
    
    // Update existing template tags with new actresses
    if (templateUrl && templateUrl.includes('#')) {
      const actressList = actresses.split(',').map(a => a.trim()).filter(Boolean)
      const updatedTags = imageTags.map(tag => {
        if (tag.imageIndex !== undefined && tag.imageIndex < 50) {
          return { ...tag, actresses: actressList }
        }
        return tag
      })
      onImageTagsChange(updatedTags)
    }
    
    updateParent(templateUrl, manualLinks, actresses)
  }

  const handleManualLinksChange = (newManualLinks: ManualLink[]) => {
    setManualLinks(newManualLinks)
    updateParent(templateUrl, newManualLinks, templateActresses)
  }

  const previewUrls = generatePreviewUrls(templateUrl, dmcode, manualLinks)
  const totalEstimatedImages = calculateTotalImages(templateUrl, manualLinks)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Images className="h-5 w-5 text-muted-foreground" />
          <Label className="text-base font-medium">{label}</Label>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={showBulkAssigner ? "default" : "outline"}
            size="sm"
            onClick={() => setShowBulkAssigner(!showBulkAssigner)}
            className="flex items-center gap-1"
          >
            <UserPlus className="h-3 w-3" />
            {showBulkAssigner ? 'Hide' : 'Bulk'} Assigner
          </Button>
          <Button
            type="button"
            variant={showAdvancedTagging ? "default" : "outline"}
            size="sm"
            onClick={() => setShowAdvancedTagging(!showAdvancedTagging)}
            className="flex items-center gap-1"
          >
            <Settings className="h-3 w-3" />
            {showAdvancedTagging ? 'Simple View' : 'Advanced Tagging'}
            {imageTags.length > 0 && (
              <Badge 
                variant={showAdvancedTagging ? "secondary" : "outline"} 
                className="text-xs ml-1 h-auto py-0 px-1"
              >
                {imageTags.length}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Actress Selection Restriction Notice */}
      {selectedActresses.length > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center gap-2 text-amber-800 mb-2">
            <Users className="h-4 w-4" />
            <span className="font-medium">Actress Selection Restricted</span>
          </div>
          <div className="text-sm text-amber-700">
            Image tagging is limited to actresses selected for this photobook. Available actresses:
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {selectedActresses.map((actress, index) => (
              <Badge key={index} variant="outline" className="text-xs bg-amber-100 text-amber-800 border-amber-300">
                {actress}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Bulk Actress Assigner */}
      {showBulkAssigner && (
        <BulkActressAssigner
          selectedActresses={selectedActresses}
          imageTags={imageTags}
          onImageTagsChange={onImageTagsChange}
          templateUrl={templateUrl}
          dmcode={dmcode}
          manualLinks={manualLinks}
        />
      )}

      {/* Template URL Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Hash className="h-4 w-4" />
            Template URL (Pattern-based)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Textarea
              placeholder="https://site.com/*/img##.jpg (use * for code, # for numbering)"
              value={templateUrl}
              onChange={handleTemplateChange}
              rows={2}
              className="font-mono text-sm"
            />
            <div className="text-xs text-muted-foreground mt-2 space-y-1">
              <div><strong>Patterns:</strong></div>
              <div>• <code className="bg-muted px-1 rounded">*</code> = Replaced with code</div>
              <div>• <code className="bg-muted px-1 rounded">#</code> = 1-digit (1,2,3...)</div>
              <div>• <code className="bg-muted px-1 rounded">##</code> = 2-digit (01,02,03...)</div>
              <div>• <code className="bg-muted px-1 rounded">###</code> = 3-digit (001,002,003...)</div>
            </div>
          </div>

          {/* Template Configuration */}
          {templateUrl && templateUrl.includes('#') && (
            <div className="space-y-4">
              {/* Template Actresses */}
              <div className="space-y-2">
                <Label className="text-sm">Actresses in Template Images</Label>
                {selectedActresses.length > 0 ? (
                  // Restricted mode: only show selected actresses
                  <CastManager
                    type="actress"
                    currentCast={templateActresses}
                    onCastChange={handleTemplateActressesChange}
                    accessToken={accessToken}
                    allowMultiple={true}
                    placeholder="Select from photobook actresses"
                    restrictToNames={selectedActresses}
                  />
                ) : (
                  // Unrestricted mode: show all actresses
                  <CastManager
                    type="actress"
                    currentCast={templateActresses}
                    onCastChange={handleTemplateActressesChange}
                    accessToken={accessToken}
                    allowMultiple={true}
                    placeholder="Select actresses for all template images"
                  />
                )}
              </div>

              <div className="p-2 bg-blue-50 rounded border text-sm text-blue-700">
                <strong>Individual Tagging Available:</strong> Set actresses for all images, then use Individual Content Rating below for specific rating per image
              </div>

              {/* Individual Content Rating Toggle */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded border">
                <div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span className="text-sm font-medium">Individual Content Rating</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Tag each image individually as N or NN</p>
                </div>
                <Button
                  type="button"
                  variant={showIndividualTagging ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowIndividualTagging(!showIndividualTagging)}
                  className="flex items-center gap-1"
                >
                  <Settings className="h-3 w-3" />
                  {showIndividualTagging ? 'Hide' : 'Show'} Tagger
                </Button>
              </div>
            </div>
          )}

          {templateUrl && templateUrl.includes('#') && (
            <div className="space-y-2">
              <div className="p-2 bg-blue-50 rounded border text-sm">
                <strong>Pattern detected:</strong> {getHashtagExplanation(templateUrl)}
              </div>
              
              <TemplatePreview 
                template={templateUrl} 
                dmcode={dmcode} 
                label="Image URLs"
                isGallery={true}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Individual Image Tagger */}
      {showIndividualTagging && templateUrl && templateUrl.includes('#') && templateActresses && (
        <IndividualImageTagger
          templateUrl={templateUrl}
          dmcode={dmcode}
          actresses={templateActresses.split(',').map(a => a.trim()).filter(Boolean)}
          imageTags={imageTags}
          onImageTagsChange={onImageTagsChange}
        />
      )}

      {/* Manual Links Section */}
      <ManualLinksGridSection
        manualLinks={manualLinks}
        onManualLinksChange={handleManualLinksChange}
        accessToken={accessToken}
        placeholder={placeholder}
        selectedActresses={selectedActresses}
      />

      {/* Combined Preview */}
      {previewUrls.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Images className="h-4 w-4" />
              Preview ({totalEstimatedImages} total images estimated)
              <Badge variant="outline" className="ml-auto">
                {templateUrl && templateUrl.includes('#') ? 'Template + Manual' : 'Manual Only'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {previewUrls.slice(0, 8).map((imageUrl, index) => (
                <div key={index} className="relative">
                  <ImageWithFallback
                    src={imageUrl}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-20 object-cover rounded border"
                  />
                  <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1 rounded">
                    {index + 1}
                  </div>
                  {/* Indicate source */}
                  <div className="absolute top-1 right-1">
                    {index < 4 && templateUrl && templateUrl.includes('#') ? (
                      <Badge variant="secondary" className="text-xs h-auto py-0 px-1">
                        T
                      </Badge>
                    ) : (
                      <Badge variant="default" className="text-xs h-auto py-0 px-1">
                        M
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
              {totalEstimatedImages > 8 && (
                <div className="w-full h-20 border-2 border-dashed rounded flex items-center justify-center text-xs text-muted-foreground">
                  +{totalEstimatedImages - 8} more
                </div>
              )}
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Badge variant="secondary" className="text-xs h-auto py-0 px-1">T</Badge>
                <span>Template Pattern</span>
              </div>
              <div className="flex items-center gap-1">
                <Badge variant="default" className="text-xs h-auto py-0 px-1">M</Badge>
                <span>Manual Links</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Advanced Tagging Panel */}
      {showAdvancedTagging && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4" />
              Advanced Image Tagging Overview
              {imageTags.length > 0 && (
                <Badge variant="outline" className="ml-auto">
                  {imageTags.length} tags
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {imageTags.length > 0 ? (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {imageTags.slice(0, 20).map((tag, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded text-xs">
                    <div className="flex-1 truncate">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{index + 1}</Badge>
                        <span className="truncate">{tag.url}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 ml-2">
                      {/* Actresses */}
                      {tag.actresses.map((actress, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {actress}
                        </Badge>
                      ))}
                      {/* Content Rating */}
                      {tag.contentRating && (
                        <Badge 
                          variant={tag.contentRating === 'NN' ? 'secondary' : 'destructive'} 
                          className="text-xs"
                        >
                          {tag.contentRating}
                        </Badge>
                      )}
                      {tag.actresses.length === 0 && !tag.contentRating && (
                        <Badge variant="outline" className="text-xs opacity-50">
                          No tags
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
                {imageTags.length > 20 && (
                  <div className="text-center text-xs text-muted-foreground py-2">
                    ... and {imageTags.length - 20} more images
                  </div>
                )}
              </div>
            ) : (
              // Empty state when no imageTags exist
              <div className="text-center py-8 text-muted-foreground">
                <div className="space-y-3">
                  <div className="flex justify-center">
                    <div className="p-3 bg-muted/50 rounded-full">
                      <Users className="h-8 w-8 opacity-50" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium mb-1">No Image Tags Yet</h3>
                    <p className="text-xs leading-relaxed max-w-sm mx-auto">
                      Image tags will appear here once you add a template pattern or manual links. 
                      These tags show individual actress assignments and content ratings per image.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 text-xs">
                    <div className="flex items-center justify-center gap-2">
                      <Hash className="h-3 w-3" />
                      <span>Enter a template pattern above</span>
                    </div>
                    <div className="text-muted-foreground/70">or</div>
                    <div className="flex items-center justify-center gap-2">
                      <Users className="h-3 w-3" />
                      <span>Add manual links below</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Help Text */}
      <div className="text-xs text-muted-foreground space-y-1 bg-muted/50 p-3 rounded">
        <div><strong>💡 Enhanced Image Tagging System:</strong></div>
        <div>• <strong>Bulk Assigner:</strong> Select one actress and assign her to multiple images at once</div>
        <div>• <strong>Template Pattern:</strong> Set actresses for all images, then use Individual Content Rating for per-image tagging</div>
        <div>• <strong>Drag & Drop:</strong> Drag images from Google Images, file explorer, or other web pages directly into the manual links area</div>
        <div>• <strong>Individual Rating:</strong> Click "Show Tagger" to set N/NN rating for each template image individually</div>
        <div>• <strong>Manual Links:</strong> Each manually added image can have individual actress tags and content rating</div>
        <div>• <strong>Profile Integration:</strong> Tagged actresses will see filtered galleries in their profiles based on content rating</div>
        {selectedActresses.length > 0 && (
          <div>• <strong>Restricted Selection:</strong> Only actresses selected for this photobook are available for tagging</div>
        )}
      </div>
    </div>
  )
}