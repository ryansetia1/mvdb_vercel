export interface TemplateData {
  dmcode?: string
  studio?: string
  actress?: string
}

/**
 * Parse actress name to extract first and last name, ignoring text in parentheses
 * Example: "Yui Hatano (葉月ゆい)" -> { firstName: "Yui", lastName: "Hatano" }
 */
function parseActressName(actress: string): { firstName: string, lastName: string } {
  if (!actress) return { firstName: '', lastName: '' }
  
  // Remove text in parentheses and any extra whitespace
  const cleanName = actress.replace(/\([^)]*\)/g, '').trim()
  
  // Handle comma-separated actresses - take the first one
  const firstActress = cleanName.split(',')[0].trim()
  
  // Split by space to get name parts
  const nameParts = firstActress.split(/\s+/).filter(part => part.length > 0)
  
  if (nameParts.length === 0) {
    return { firstName: '', lastName: '' }
  } else if (nameParts.length === 1) {
    // Only one name, use it for both first and last
    return { firstName: nameParts[0], lastName: nameParts[0] }
  } else {
    // Multiple parts: first part is firstName, last part is lastName
    return { 
      firstName: nameParts[0], 
      lastName: nameParts[nameParts.length - 1] 
    }
  }
}

/**
 * Replace placeholders in a template string:
 * * = DM code
 * @studio = Studio name (lowercase)
 * @firstname = First name of actress (lowercase, ignores text in parentheses)
 * @lastname = Last name of actress (lowercase, ignores text in parentheses)
 * # = Keep as-is for client-side processing
 */
export function processTemplate(template: string, data: TemplateData): string {
  if (!template) return template

  let result = template

  // Replace asterisks with DM code
  if (data.dmcode) {
    result = result.replace(/\*/g, data.dmcode)
  }

  // Replace @studio with studio name (lowercase)
  if (data.studio) {
    result = result.replace(/@studio/g, data.studio.toLowerCase())
  }

  // Replace @firstname and @lastname with actress names (lowercase)
  if (data.actress) {
    const { firstName, lastName } = parseActressName(data.actress)
    if (firstName) {
      result = result.replace(/@firstname/g, firstName.toLowerCase())
    }
    if (lastName) {
      result = result.replace(/@lastname/g, lastName.toLowerCase())
    }
  }

  // Keep hashtags (#) untouched - they will be processed by EnhancedGallery
  return result
}

/**
 * Count consecutive hashtags to determine digit format
 * # = 1 digit, ## = 2 digits, ### = 3 digits, etc.
 */
function getHashtagPattern(template: string): { pattern: string, digitCount: number } | null {
  const hashMatch = template.match(/(#+)/)
  if (!hashMatch) return null
  
  const pattern = hashMatch[1]
  const digitCount = pattern.length
  
  return { pattern, digitCount }
}

/**
 * Enhanced check if a URL should be skipped (contains now_printing)
 * This function checks for various forms of "now_printing" URLs
 */
function shouldSkipUrl(url: string): boolean {
  const lowerUrl = url.toLowerCase()
  
  // Check for various now_printing patterns
  const nowPrintingPatterns = [
    'now_printing',
    'now-printing', 
    'nowprinting',
    '/n/now_printing/', // DMM specific path
    'now_printing.jpg',
    'now_printing.png',
    'now_printing.jpeg',
    'now_printing.webp'
  ]
  
  return nowPrintingPatterns.some(pattern => lowerUrl.includes(pattern))
}

/**
 * Check if URL resolves to a specific now_printing image
 * DMM uses: https://pics.dmm.com/mono/movie/n/now_printing/now_printing.jpg
 */
function isNowPrintingUrl(url: string): boolean {
  const lowerUrl = url.toLowerCase()
  
  // Check for .svg files first (should be filtered out)
  if (lowerUrl.endsWith('.svg')) {
    return true
  }
  
  // Direct now_printing URL patterns
  if (lowerUrl.includes('pics.dmm.com/mono/movie/n/now_printing/now_printing.jpg')) {
    return true
  }
  
  // Other common now_printing patterns and 404 errors
  const nowPrintingIndicators = [
    '/n/now_printing/',
    'now_printing.jpg',
    'now_printing.png', 
    'now_printing.jpeg',
    'now_printing.webp',
    '/now_printing/',
    '/nowprinting/',
    'no-image',
    'placeholder',
    '404.not.found.svg',
    '404notfound',
    '404-not-found',
    '404_not_found',
    '/404/',
    'notfound',
    'not_found',
    'not-found',
    'e.ugj.net/404',
    '.svg' // Filter all SVG files
  ]
  
  return nowPrintingIndicators.some(indicator => lowerUrl.includes(indicator))
}

/**
 * Advanced image validation to detect now_printing images
 * Checks filename, dimensions, and file size
 */
export interface ImageValidationResult {
  isValid: boolean
  isNowPrinting: boolean
  reason?: string
  dimensions?: { width: number, height: number }
  fileSize?: number
}

/**
 * Validate if an image is a legitimate gallery image (not now_printing)
 * This function performs comprehensive checks including:
 * - Filename detection
 * - Dimension checks (<150px = likely placeholder)
 * - File size checks (<20KB = likely placeholder)
 */
export async function validateGalleryImage(url: string): Promise<ImageValidationResult> {
  return new Promise((resolve) => {
    // Pre-check: URL-based detection
    if (isNowPrintingUrl(url)) {
      resolve({
        isValid: false,
        isNowPrinting: true,
        reason: 'URL contains now_printing pattern'
      })
      return
    }

    const img = new Image()

    img.onload = async () => {
      try {
        const dimensions = { width: img.naturalWidth, height: img.naturalHeight }
        
        // Check 1: Dimensions too small (likely placeholder)
        if (img.naturalWidth < 150 || img.naturalHeight < 150) {
          resolve({
            isValid: false,
            isNowPrinting: true,
            reason: `Dimensions too small: ${dimensions.width}x${dimensions.height}px (min 150px)`,
            dimensions
          })
          return
        }

        // Check 2: Try to estimate file size (approximate method)
        try {
          // Create canvas to estimate file size
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          canvas.width = img.naturalWidth
          canvas.height = img.naturalHeight
          
          if (ctx) {
            ctx.drawImage(img, 0, 0)
            
            // Convert to blob to get approximate file size
            canvas.toBlob((blob) => {
              if (blob) {
                // Check 3: File size too small (likely placeholder)
                if (blob.size < 20 * 1024) { // 20KB
                  resolve({
                    isValid: false,
                    isNowPrinting: true,
                    reason: `File size too small: ${Math.round(blob.size / 1024)}KB (min 20KB)`,
                    dimensions,
                    fileSize: blob.size
                  })
                  return
                }
                
                // All checks passed
                resolve({
                  isValid: true,
                  isNowPrinting: false,
                  dimensions,
                  fileSize: blob.size
                })
              } else {
                // Fallback: if we can't get blob, just check dimensions
                resolve({
                  isValid: true,
                  isNowPrinting: false,
                  reason: 'Dimensions OK, file size check failed',
                  dimensions
                })
              }
            }, 'image/jpeg', 0.8)
          } else {
            // Fallback: canvas context failed, just check dimensions
            resolve({
              isValid: true,
              isNowPrinting: false,
              reason: 'Dimensions OK, canvas check failed',
              dimensions
            })
          }
        } catch (error) {
          // Fallback: any error in size check, just validate by dimensions
          resolve({
            isValid: true,
            isNowPrinting: false,
            reason: 'Dimensions OK, size validation error',
            dimensions
          })
        }
      } catch (error) {
        resolve({
          isValid: false,
          isNowPrinting: true,
          reason: `Image processing error: ${error}`,
          dimensions: { width: img.naturalWidth, height: img.naturalHeight }
        })
      }
    }
    
    img.onerror = () => {
      resolve({
        isValid: false,
        isNowPrinting: false,
        reason: 'Failed to load image'
      })
    }
    
    img.src = url
    
    // Set a timeout to avoid hanging
    setTimeout(() => {
      resolve({
        isValid: false,
        isNowPrinting: false,
        reason: 'Timeout (5s)'
      })
    }, 5000)
  })
}

/**
 * Quick check if filename indicates now_printing
 */
export function hasNowPrintingFilename(url: string): boolean {
  const filename = url.split('/').pop()?.toLowerCase() || ''
  
  const nowPrintingFilenames = [
    'now_printing.jpg',
    'now_printing.jpeg', 
    'now_printing.png',
    'now_printing.webp',
    'nowprinting.jpg',
    'now-printing.jpg',
    'placeholder.jpg',
    'no-image.jpg'
  ]
  
  return nowPrintingFilenames.some(pattern => filename.includes(pattern))
}

/**
 * Generate all possible gallery URLs from a template
 * Supports variable digit counts: # = 1-digit, ## = 2-digit, etc.
 * * will be replaced with dmcode
 * @studio, @firstname, @lastname will be replaced with corresponding data
 * # patterns will be replaced with numbers
 * Extended range to handle gaps caused by "now_printing"
 */
export function generateGalleryUrls(template: string, dmcode?: string, maxImages: number = 50, extraData?: { studio?: string, actress?: string }): string[] {
  if (!template) return []
  
  const hashtagInfo = getHashtagPattern(template)
  if (!hashtagInfo) return []

  // Process all template placeholders except hashtags
  const templateData: TemplateData = {
    dmcode,
    studio: extraData?.studio,
    actress: extraData?.actress
  }
  
  let baseUrl = processTemplate(template, templateData)
  
  const urls: string[] = []
  const { pattern, digitCount } = hashtagInfo
  
  // Generate URLs based on digit count
  // Extended range to handle cases where some images might be "now_printing"
  // Remove artificial limit of 99 for single digit, use maxImages directly
  const maxNumber = Math.min(maxImages, digitCount === 1 ? maxImages : Math.pow(10, digitCount) - 1)
  const startNumber = 1
  
  for (let i = startNumber; i <= maxNumber; i++) {
    let numberStr: string
    
    if (digitCount === 1) {
      // For single #, use plain numbers: 1, 2, 3, etc.
      // Allow numbers beyond 9 for galleries with more than 9 images
      numberStr = i.toString()
    } else {
      // For multiple #, use zero-padded numbers: 01, 02, 03, etc.
      numberStr = i.toString().padStart(digitCount, '0')
    }
    
    const url = baseUrl.replace(pattern, numberStr)
    
    // Don't skip here - let the component handle "now_printing" filtering
    urls.push(url)
  }
  
  return urls
}

/**
 * Filter out URLs that are likely "now_printing" images
 */
export function filterValidGalleryUrls(urls: string[]): string[] {
  return urls.filter(url => !isNowPrintingUrl(url))
}

/**
 * Process gallery URLs with all placeholder replacements
 * *, @studio, @firstname, @lastname will be replaced with corresponding data
 * # will be replaced with 01, 02, 03, etc. for each URL
 */
export function processGalleryTemplate(template: string, data: TemplateData): string[] {
  if (!template) return []
  
  const urls = template.split(',').map(url => url.trim()).filter(url => url.length > 0)
  const processedUrls: string[] = []

  urls.forEach((url, index) => {
    // Process all placeholders first
    let processedUrl = processTemplate(url, data)
    
    // Replace hash with 2-digit number (backward compatibility)
    if (processedUrl.includes('#')) {
      const twoDigitNumber = String(index + 1).padStart(2, '0')
      processedUrl = processedUrl.replace(/#/g, twoDigitNumber)
    }
    
    processedUrls.push(processedUrl)
  })

  return processedUrls
}

/**
 * Get template preview for single URL
 */
export function getTemplatePreview(template: string, data: TemplateData) {
  return {
    original: template,
    processed: processTemplate(template, data),
    hasPlaceholders: template.includes('*') || template.includes('#') || template.includes('@studio') || template.includes('@firstname') || template.includes('@lastname')
  }
}

/**
 * Get gallery template preview showing multiple URLs
 */
export function getGalleryTemplatePreview(template: string, data: TemplateData) {
  const processedUrls = processGalleryTemplate(template, data)
  return {
    original: template,
    processed: processedUrls,
    hasPlaceholders: template.includes('*') || template.includes('#') || template.includes('@studio') || template.includes('@firstname') || template.includes('@lastname'),
    urlCount: processedUrls.length
  }
}

/**
 * Count placeholders in template
 */
export function countPlaceholders(template: string): { 
  asterisks: number, 
  hashes: number, 
  studios: number, 
  firstNames: number, 
  lastNames: number 
} {
  return {
    asterisks: (template.match(/\*/g) || []).length,
    hashes: (template.match(/#/g) || []).length,
    studios: (template.match(/@studio/g) || []).length,
    firstNames: (template.match(/@firstname/g) || []).length,
    lastNames: (template.match(/@lastname/g) || []).length
  }
}

/**
 * Replace template links for gallery processing
 * This function generates multiple gallery URLs from a template
 * *, @studio, @firstname, @lastname will be replaced with corresponding data
 * # will be replaced with sequential 2-digit numbers (01, 02, 03, etc.)
 */
export function replaceTemplateLinks(template: string, dmcode?: string, code?: string, extraData?: { studio?: string, actress?: string }): string {
  if (!template) return ''
  
  // Process all placeholders except hashtags first
  const templateData: TemplateData = {
    dmcode,
    studio: extraData?.studio,
    actress: extraData?.actress
  }
  
  let result = processTemplate(template, templateData)
  
  // For gallery, we need to generate multiple URLs with sequential numbers
  // Split by newlines to handle multiple template lines
  const lines = result.split('\n')
  const processedLines: string[] = []
  
  lines.forEach(line => {
    if (line.trim() && line.includes('#')) {
      // Generate multiple URLs with sequential numbers
      // Default to generating 10 gallery images (01-10) unless specified otherwise
      const galleryCount = 10
      
      for (let i = 1; i <= galleryCount; i++) {
        const twoDigitNumber = String(i).padStart(2, '0')
        const processedLine = line.replace(/#/g, twoDigitNumber)
        processedLines.push(processedLine)
      }
    } else if (line.trim()) {
      // Line without # placeholder, just add as is
      processedLines.push(line)
    }
  })
  
  return processedLines.join('\n')
}

/**
 * Get hashtag explanation for UI
 */
export function getHashtagExplanation(template: string): string {
  const hashtagInfo = getHashtagPattern(template)
  if (!hashtagInfo) return 'No hashtag pattern found'
  
  const { digitCount } = hashtagInfo
  
  if (digitCount === 1) {
    return '# = sequential numbers (1, 2, 3, ..., 10, 11, etc.)'
  } else if (digitCount === 2) {
    return '## = 2-digit numbers (01, 02, 03, ..., 99)'
  } else {
    return `${'#'.repeat(digitCount)} = ${digitCount}-digit numbers (${Array.from({length: 3}, (_, i) => String(i + 1).padStart(digitCount, '0')).join(', ')}, ...)`
  }
}

/**
 * Get explanation of all placeholders in template
 */
export function getPlaceholderExplanation(template: string): string[] {
  const explanations: string[] = []
  
  if (template.includes('*')) {
    explanations.push('* = DM code replacement')
  }
  
  if (template.includes('@studio')) {
    explanations.push('@studio = Studio name (lowercase)')
  }
  
  if (template.includes('@firstname')) {
    explanations.push('@firstname = First name of actress (lowercase, ignores text in parentheses)')
  }
  
  if (template.includes('@lastname')) {
    explanations.push('@lastname = Last name of actress (lowercase, ignores text in parentheses)')
  }
  
  if (template.includes('#')) {
    explanations.push(getHashtagExplanation(template))
  }
  
  return explanations
}

/**
 * Generate example URL based on template and sample data
 */
export function generateTemplateExample(template: string): string {
  const sampleData: TemplateData = {
    dmcode: 'abc123',
    studio: 'Moodyz',
    actress: 'Yui Hatano (葉月ゆい)'
  }
  
  let example = processTemplate(template, sampleData)
  
  // Replace first hashtag pattern with example number
  const hashtagInfo = getHashtagPattern(example)
  if (hashtagInfo) {
    const { pattern, digitCount } = hashtagInfo
    // For single #, show '1' as example but note it can go beyond 9
    const exampleNumber = digitCount === 1 ? '1' : '01'.padStart(digitCount, '0')
    example = example.replace(pattern, exampleNumber)
  }
  
  return example
}

/**
 * Check if gallery template should be completely hidden
 * Only hide if the base template itself contains "now_printing"
 */
export function shouldHideGallery(template: string): boolean {
  if (!template) return true
  
  // Only hide if the template itself (before number substitution) contains "now_printing"
  const baseTemplate = template.replace(/#+/g, '') // Remove hashtag patterns
  return shouldSkipUrl(baseTemplate)
}

/**
 * Generate gallery URLs with smart "now_printing" handling
 * This function generates more URLs to compensate for ones that might be skipped
 * Supports all placeholder types: *, @studio, @firstname, @lastname, #
 */
export function generateSmartGalleryUrls(template: string, dmcode?: string, targetCount: number = 20, extraData?: { studio?: string, actress?: string }): string[] {
  if (!template) return []
  
  // Don't hide entire gallery unless template itself contains "now_printing"
  if (shouldHideGallery(template)) {
    return []
  }
  
  const hashtagInfo = getHashtagPattern(template)
  if (!hashtagInfo) return []

  // Process all placeholders except hashtags
  const templateData: TemplateData = {
    dmcode,
    studio: extraData?.studio,
    actress: extraData?.actress
  }
  
  let baseUrl = processTemplate(template, templateData)
  
  const urls: string[] = []
  const { pattern, digitCount } = hashtagInfo
  
  // Generate more URLs than needed to account for "now_printing" gaps
  // We'll generate up to 5x the target to ensure we get enough valid images
  // Remove artificial limit of 99 for single digit, use calculated limit based on digit count
  const maxPossible = digitCount === 1 ? targetCount * 5 : Math.pow(10, digitCount) - 1
  const extendedLimit = Math.min(targetCount * 5, maxPossible)
  let validUrlCount = 0
  
  for (let i = 1; i <= extendedLimit && validUrlCount < targetCount * 3; i++) {
    let numberStr: string
    
    if (digitCount === 1) {
      // For single #, use plain numbers: 1, 2, 3, etc.  
      // Allow numbers beyond 9 (10, 11, 12, etc.) for large galleries
      numberStr = i.toString()
    } else {
      // For multiple #, use zero-padded numbers: 01, 02, 03, etc.
      numberStr = i.toString().padStart(digitCount, '0')
    }
    
    const url = baseUrl.replace(pattern, numberStr)
    urls.push(url)
    
    // Count valid URLs (non-now_printing by URL pattern)
    if (!isNowPrintingUrl(url)) {
      validUrlCount++
    }
  }
  
  return urls
}

/**
 * Enhanced function to check if URL is a "now_printing" image
 * Export this for use in components
 */
export function isUrlNowPrinting(url: string): boolean {
  return isNowPrintingUrl(url)
}