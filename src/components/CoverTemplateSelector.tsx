import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { ImageIcon, Link2, Star } from 'lucide-react'
import { projectId, publicAnonKey } from '../utils/supabase/info'

interface NamedTemplate {
  name: string
  url: string
  isDefault: boolean
}

interface CoverTemplateSelectorProps {
  movieType: string
  onTemplateSelect: (template: string) => void
  autoSelectDefault?: boolean // New prop to auto-select default template
}

export function CoverTemplateSelector({ movieType, onTemplateSelect, autoSelectDefault = false }: CoverTemplateSelectorProps) {
  const [templates, setTemplates] = useState<NamedTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (movieType) {
      loadTemplatesForType(movieType)
    } else {
      setTemplates([])
      setSelectedTemplate('')
    }
  }, [movieType])

  // Auto-select default template when templates are loaded
  useEffect(() => {
    if (autoSelectDefault && templates.length > 0) {
      const defaultTemplate = templates.find(t => t.isDefault)
      if (defaultTemplate) {
        setSelectedTemplate(defaultTemplate.url)
        // Automatically apply the default template
        onTemplateSelect(defaultTemplate.url)
      }
    }
  }, [templates, autoSelectDefault, onTemplateSelect])

  const loadTemplatesForType = async (type: string) => {
    setIsLoading(true)
    setSelectedTemplate('') // Clear selection when loading new templates
    
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-e0516fcf/kv-store/get/cover_template_${type}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        }
      })

      console.log('CoverTemplateSelector: Response status:', response.status)

      if (response.ok) {
        // Check if response has content
        const responseText = await response.text()
        console.log('CoverTemplateSelector: Raw response:', responseText)
        
        if (!responseText || responseText.trim() === '') {
          console.log('CoverTemplateSelector: Empty response, no templates found')
          setTemplates([])
          return
        }

        try {
          const data = JSON.parse(responseText)
          console.log('CoverTemplateSelector: Parsed data:', data)
          
          if (data && Array.isArray(data)) {
            // Validate template structure - handle both old format and new format
            const namedTemplates = data.map((item, index) => {
              if (typeof item === 'string') {
                // Legacy format - convert string to named template
                return {
                  name: `Template ${index + 1}`,
                  url: item,
                  isDefault: index === 0 // First template is default for legacy
                }
              } else if (item && typeof item === 'object' && item.name && item.url) {
                // New named template format
                return item as NamedTemplate
              } else {
                return null
              }
            }).filter(Boolean) as NamedTemplate[]
            
            setTemplates(namedTemplates)
          } else if (data === null) {
            // Key doesn't exist
            console.log('CoverTemplateSelector: No templates found for type:', type)
            setTemplates([])
          } else {
            console.log('CoverTemplateSelector: Unexpected data format:', data)
            setTemplates([])
          }
        } catch (parseError) {
          console.error('CoverTemplateSelector: JSON parse error:', parseError)
          setTemplates([])
        }
      } else {
        const errorText = await response.text()
        console.error('CoverTemplateSelector: Server error:', response.status, errorText)
        setTemplates([])
      }
    } catch (error) {
      console.error('CoverTemplateSelector: Network error loading templates for type:', error)
      setTemplates([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleApplyTemplate = () => {
    if (selectedTemplate) {
      onTemplateSelect(selectedTemplate)
    }
  }

  const getPreviewText = (url: string) => {
    // Show a preview with placeholder text
    return url.replace(/\*/g, '...')
  }

  const getSelectedTemplateName = () => {
    const template = templates.find(t => t.url === selectedTemplate)
    return template?.name || 'Unknown Template'
  }

  if (!movieType) {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium text-muted-foreground">Cover Template</Label>
        <div className="flex items-center gap-2 p-3 border border-dashed rounded bg-muted/50">
          <ImageIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Select movie type first to show available cover templates
          </span>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">Cover Template for "{movieType}"</Label>
        <div className="flex items-center gap-2 p-3 border rounded">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          <span className="text-sm text-muted-foreground">Loading templates...</span>
        </div>
      </div>
    )
  }

  if (templates.length === 0) {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">Cover Template for "{movieType}"</Label>
        <div className="flex items-center gap-2 p-3 border border-dashed rounded bg-muted/50">
          <ImageIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            No named templates found for type "{movieType}"
          </span>
        </div>
      </div>
    )
  }

  const defaultTemplate = templates.find(t => t.isDefault)

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium">Cover Template for "{movieType}"</Label>
        {defaultTemplate && (
          <Badge variant="outline" className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-current text-yellow-500" />
            Default Available
          </Badge>
        )}
      </div>
      
      <div className="space-y-2">
        <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
          <SelectTrigger>
            <SelectValue placeholder="Select a named cover template" />
          </SelectTrigger>
          <SelectContent>
            {templates.map((template, index) => (
              <SelectItem key={index} value={template.url}>
                <div className="flex items-center gap-2 w-full">
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center gap-2">
                      {template.isDefault && (
                        <Star className="h-3 w-3 fill-current text-yellow-500" />
                      )}
                      <span className="font-medium">{template.name}</span>
                      {template.isDefault && (
                        <Badge variant="default" className="text-xs">Default</Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {getPreviewText(template.url)}
                    </span>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedTemplate && (
          <div className="space-y-2">
            <div className="p-2 bg-muted rounded text-xs">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">Selected:</span>
                <span className="font-medium">{getSelectedTemplateName()}</span>
                {templates.find(t => t.url === selectedTemplate)?.isDefault && (
                  <Badge variant="default" className="text-xs">Default</Badge>
                )}
              </div>
              <code>{selectedTemplate}</code>
            </div>
            
            <Button 
              type="button"
              onClick={handleApplyTemplate}
              size="sm"
              className="w-full flex items-center gap-2"
            >
              <Link2 className="h-4 w-4" />
              Apply Template to Cover Field
            </Button>
          </div>
        )}
      </div>
      
      <div className="text-xs text-muted-foreground space-y-1">
        <p>💡 Named templates memudahkan memilih format cover yang sesuai</p>
        <p>⭐ Template default akan otomatis terpilih saat membuat movie baru</p>
        <p>🔄 Asterisk (*) bisa diganti manual dengan code/dmcode yang sesuai</p>
        <p>📝 Contoh: http://site.com/*/cover.jpg → http://site.com/abcd-123/cover.jpg</p>
      </div>
    </div>
  )
}