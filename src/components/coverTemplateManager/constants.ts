// Template group yang disederhanakan
export interface CoverTemplateGroup {
  id?: string
  name: string
  templateUrl: string
  galleryTemplate?: string
  applicableTypes: string[]
  applicableStudios?: string[]
  isDefault?: boolean
  createdAt?: string
  updatedAt?: string
}

// Helper untuk validasi template group
export const validateTemplateGroup = (group: CoverTemplateGroup): string[] => {
  const errors: string[] = []
  
  if (!group.name.trim()) {
    errors.push('Template group name is required')
  }
  
  if (!group.templateUrl.trim()) {
    errors.push('Template URL is required')
  }
  
  if (group.applicableTypes.length === 0 && (!group.applicableStudios || group.applicableStudios.length === 0)) {
    errors.push('At least one movie type or studio must be selected')
  }
  
  // Validasi URL template harus mengandung placeholder
  if (!group.templateUrl.includes('*')) {
    errors.push('Template URL must contain "*" placeholder(s)')
  }
  
  // Validasi gallery template jika diisi
  if (group.galleryTemplate && group.galleryTemplate.trim()) {
    if (!group.galleryTemplate.includes('#') && !group.galleryTemplate.includes('*')) {
      errors.push('Gallery template must contain "#" (for image numbers) or "*" (for movie codes) placeholder(s)')
    }
  }
  
  return errors
}

// Helper untuk generate preview URL
export const generatePreviewUrl = (templateUrl: string, sampleCode: string = 'SAMPLE123'): string => {
  return templateUrl.replace(/\*/g, sampleCode)
}

// Helper untuk generate gallery preview URL
export const generateGalleryPreviewUrl = (galleryTemplate: string, sampleCode: string = 'SAMPLE123'): string => {
  let result = galleryTemplate
  
  // Replace * with sample code
  result = result.replace(/\*/g, sampleCode)
  
  // Process hashtag placeholders - replace sequences of # with appropriately padded numbers
  result = result.replace(/(#+)/g, (match) => {
    const hashCount = match.length
    // Use sample image number 1, padded to match hash count
    return '1'.padStart(hashCount, '0')
  })
  
  return result
}