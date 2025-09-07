import { useState, useCallback } from 'react'
import { fetchDefaultTemplate } from './coverTemplateManager/api'
import { CoverTemplateGroup } from './coverTemplateManager/constants'
import { processTemplate } from '../utils/templateUtils'

interface UseTemplateAutoApplyProps {
  accessToken: string
  onTemplateApplied?: (template: CoverTemplateGroup, appliedFields: string[]) => void
}

interface TemplateAutoApplyResult {
  cover?: string
  gallery?: string
  appliedTemplate?: CoverTemplateGroup
  appliedFields: string[]
}

export function useTemplateAutoApply({ accessToken, onTemplateApplied }: UseTemplateAutoApplyProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const applyDefaultTemplate = useCallback(async (
    options: {
      studio?: string
      type?: string
      dmcode?: string
      currentCover?: string
      currentGallery?: string
    }
  ): Promise<TemplateAutoApplyResult | null> => {
    try {
      setIsLoading(true)
      setError(null)

      console.log('🚀 Template Auto-Apply Debug:', {
        studio: options.studio,
        type: options.type,
        dmcode: options.dmcode,
        currentCover: options.currentCover,
        currentGallery: options.currentGallery,
        accessToken: accessToken ? 'Present' : 'Missing'
      })

      // Skip if no studio or type provided
      if (!options.studio && !options.type) {
        console.log('❌ No studio or type provided')
        return null
      }

      // Skip if no dmcode (required for template processing)
      if (!options.dmcode) {
        console.log('❌ No dmcode provided, template cannot be processed')
        return null
      }

      // Try to fetch default template for studio first (higher priority)
      let defaultTemplate: CoverTemplateGroup | null = null
      
      if (options.studio) {
        console.log('🏢 Searching for studio template:', options.studio)
        try {
          defaultTemplate = await fetchDefaultTemplate(accessToken, { studio: options.studio })
          if (defaultTemplate) {
            console.log('✅ Found studio template:', defaultTemplate.name)
          } else {
            console.log('❌ No default template found for studio:', options.studio)
          }
        } catch (error) {
          console.error('❌ Error fetching studio template:', error)
        }
      }
      
      // Try type template if no studio template found
      if (!defaultTemplate && options.type) {
        console.log('📝 Searching for type template:', options.type)
        try {
          defaultTemplate = await fetchDefaultTemplate(accessToken, { type: options.type })
          if (defaultTemplate) {
            console.log('✅ Found type template:', defaultTemplate.name)
          } else {
            console.log('❌ No default template found for type:', options.type)
          }
        } catch (error) {
          console.error('❌ Error fetching type template:', error)
        }
      }

      if (!defaultTemplate) {
        console.log('❌ No default templates found for the given criteria')
        return null // No default template found
      }

      console.log('📋 Template details:', {
        name: defaultTemplate.name,
        templateUrl: defaultTemplate.templateUrl,
        galleryTemplate: defaultTemplate.galleryTemplate,
        isDefault: defaultTemplate.isDefault
      })

      const appliedFields: string[] = []
      const result: TemplateAutoApplyResult = {
        appliedTemplate: defaultTemplate,
        appliedFields: []
      }

      // Helper function to check if field is empty or contains only placeholder text
      const isFieldEmpty = (value?: string): boolean => {
        if (!value || value.trim() === '') return true
        
        // Check for common placeholder patterns
        const placeholderPatterns = [
          /^https:\/\/example\.com\/\*\/cover\.jpg.*$/i,
          /^https:\/\/site\.com\/@studio\/\*\/img##\.jpg.*$/i,
          /^https:\/\/.*\/\*\/.*$/i, // Generic pattern with asterisk
          /^https:\/\/.*\/@studio\/\*\/.*$/i, // Pattern with @studio
        ]
        
        return placeholderPatterns.some(pattern => pattern.test(value.trim()))
      }

      // Apply cover template if available and current cover is empty/minimal or contains placeholder
      const shouldApplyCover = defaultTemplate.templateUrl && 
        isFieldEmpty(options.currentCover)
      
      if (shouldApplyCover) {
        result.cover = defaultTemplate.templateUrl
        appliedFields.push('cover')
        console.log('✅ Applied cover template:', defaultTemplate.templateUrl)
      } else {
        console.log('⏭️ Skipping cover template - field not empty or no template URL', {
          currentCover: options.currentCover,
          templateUrl: defaultTemplate.templateUrl
        })
      }

      // Apply gallery template if available and current gallery is empty/minimal or contains placeholder
      const shouldApplyGallery = defaultTemplate.galleryTemplate && 
        isFieldEmpty(options.currentGallery)
      
      if (shouldApplyGallery) {
        result.gallery = defaultTemplate.galleryTemplate
        appliedFields.push('gallery')
        console.log('✅ Applied gallery template:', defaultTemplate.galleryTemplate)
      } else {
        console.log('⏭️ Skipping gallery template - field not empty or no gallery template', {
          currentGallery: options.currentGallery,
          galleryTemplate: defaultTemplate.galleryTemplate
        })
      }

      result.appliedFields = appliedFields

      console.log('📊 Template application result:', {
        appliedFields,
        templateName: defaultTemplate.name,
        coverApplied: !!result.cover,
        galleryApplied: !!result.gallery
      })

      // Notify about template application
      if (appliedFields.length > 0 && onTemplateApplied) {
        onTemplateApplied(defaultTemplate, appliedFields)
      }

      return appliedFields.length > 0 ? result : null

    } catch (err) {
      console.error('💥 Error applying default template:', err)
      setError(err instanceof Error ? err.message : 'Failed to apply template')
      return null
    } finally {
      setIsLoading(false)
    }
  }, [accessToken, onTemplateApplied])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    applyDefaultTemplate,
    isLoading,
    error,
    clearError
  }
}