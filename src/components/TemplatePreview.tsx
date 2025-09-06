import { Badge } from './ui/badge'
import { getTemplatePreview, countPlaceholders, getGalleryTemplatePreview, getPlaceholderExplanation } from '../utils/templateUtils'

interface TemplatePreviewProps {
  template: string
  dmcode: string
  label: string
  isGallery?: boolean
  studio?: string
  actress?: string
}

export function TemplatePreview({ template, dmcode, label, isGallery = false, studio, actress }: TemplatePreviewProps) {
  if (!template || (!template.includes('*') && !template.includes('#') && !template.includes('@studio') && !template.includes('@firstname') && !template.includes('@lastname'))) {
    return null
  }

  const placeholders = countPlaceholders(template)
  const templateData = { dmcode, studio, actress }
  const preview = isGallery 
    ? getGalleryTemplatePreview(template, templateData)
    : getTemplatePreview(template, templateData)
  
  const explanations = getPlaceholderExplanation(template)
  const hasRequiredData = dmcode && (!template.includes('@studio') || studio) && (!template.includes('@firstname') || actress) && (!template.includes('@lastname') || actress)

  return (
    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-medium text-blue-800">{label} Preview:</span>
        <div className="flex gap-1 flex-wrap">
          {placeholders.asterisks > 0 && (
            <Badge variant="secondary" className="text-xs">
              {placeholders.asterisks} *
            </Badge>
          )}
          {placeholders.studios > 0 && (
            <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800">
              {placeholders.studios} @studio
            </Badge>
          )}
          {placeholders.firstNames > 0 && (
            <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
              {placeholders.firstNames} @firstname
            </Badge>
          )}
          {placeholders.lastNames > 0 && (
            <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
              {placeholders.lastNames} @lastname
            </Badge>
          )}
          {placeholders.hashes > 0 && (
            <Badge variant="outline" className="text-xs">
              {placeholders.hashes} #
            </Badge>
          )}
        </div>
      </div>
      
      {/* Placeholder explanations */}
      <div className="text-xs text-blue-600 mb-3 space-y-1">
        {explanations.map((explanation, index) => (
          <div key={index}>• {explanation}</div>
        ))}
      </div>
      
      {hasRequiredData ? (
        <div className="text-sm">
          <div className="text-gray-600 mb-1">Will become:</div>
          {isGallery ? (
            <div className="space-y-1">
              {(preview as any).processed.map((url: string, index: number) => (
                <div key={index} className="font-mono text-green-700 break-all text-xs">
                  {index + 1}. {url}
                </div>
              ))}
            </div>
          ) : (
            <div className="font-mono text-green-700 break-all">
              {(preview as any).processed}
            </div>
          )}
        </div>
      ) : (
        <div className="text-sm text-amber-700">
          <div className="font-medium mb-1">Required data missing:</div>
          <div className="space-y-1">
            {!dmcode && <div>• DM Code</div>}
            {template.includes('@studio') && !studio && <div>• Studio</div>}
            {(template.includes('@firstname') || template.includes('@lastname')) && !actress && <div>• Actress</div>}
          </div>
        </div>
      )}
    </div>
  )
}