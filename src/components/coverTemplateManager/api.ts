import { CoverTemplateGroup } from './constants'
import { projectId, publicAnonKey } from '../../utils/supabase/info'

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-e0516fcf`

// Helper untuk mendapatkan auth headers
const getAuthHeaders = (accessToken: string) => ({
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'application/json'
})

// Fetch semua template groups
export const fetchTemplateGroups = async (accessToken: string): Promise<CoverTemplateGroup[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/template-groups`, {
      headers: getAuthHeaders(accessToken)
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch template groups: ${response.statusText}`)
    }
    
    const data = await response.json()
    return data.groups || []
  } catch (error) {
    console.error('Error fetching template groups:', error)
    throw error
  }
}

// Fetch default template untuk studio atau type tertentu
export const fetchDefaultTemplate = async (
  accessToken: string,
  options: {
    studio?: string
    type?: string
  }
): Promise<CoverTemplateGroup | null> => {
  try {
    // First try the dedicated endpoint
    const params = new URLSearchParams()
    if (options.studio) params.append('studio', options.studio)
    if (options.type) params.append('type', options.type)
    
    try {
      const response = await fetch(`${API_BASE_URL}/template-groups/default?${params.toString()}`, {
        headers: getAuthHeaders(accessToken)
      })
      
      if (response.ok) {
        const data = await response.json()
        return data.template || null
      }
      
      // If 404, fall back to client-side search
      if (response.status === 404) {
        console.log('Default template endpoint not found, falling back to client-side search')
      } else {
        throw new Error(`Failed to fetch default template: ${response.statusText}`)
      }
    } catch (endpointError) {
      console.log('Default template endpoint failed, falling back to client-side search:', endpointError)
    }
    
    // Fallback: Get all templates and search client-side
    console.log('🔍 Fetching all template groups for client-side search...')
    const allGroups = await fetchTemplateGroups(accessToken)
    console.log('📋 Total template groups found:', allGroups.length)
    
    // Find default template
    let defaultTemplate = null
    
    // Priority 1: Studio template with isDefault=true
    if (options.studio) {
      console.log('🏢 Searching for studio template:', options.studio)
      defaultTemplate = allGroups.find(group => 
        group.isDefault && 
        group.applicableStudios && 
        group.applicableStudios.some(s => s.toLowerCase() === options.studio!.toLowerCase())
      )
      if (defaultTemplate) {
        console.log('✅ Found studio default template:', defaultTemplate.name)
      } else {
        console.log('❌ No studio default template found for:', options.studio)
      }
    }
    
    // Priority 2: Type template with isDefault=true (if no studio template found)
    if (!defaultTemplate && options.type) {
      console.log('📝 Searching for type template:', options.type)
      defaultTemplate = allGroups.find(group => 
        group.isDefault && 
        group.applicableTypes && 
        group.applicableTypes.some(t => t.toLowerCase() === options.type!.toLowerCase())
      )
      if (defaultTemplate) {
        console.log('✅ Found type default template:', defaultTemplate.name)
      } else {
        console.log('❌ No type default template found for:', options.type)
      }
    }
    
    if (!defaultTemplate) {
      console.log('❌ No default template found for criteria')
      return null
    }
    
    console.log('📋 Returning default template:', {
      name: defaultTemplate.name,
      templateUrl: defaultTemplate.templateUrl,
      galleryTemplate: defaultTemplate.galleryTemplate,
      isDefault: defaultTemplate.isDefault
    })
    
    return defaultTemplate
  } catch (error) {
    console.error('Error fetching default template:', error)
    throw error
  }
}

// Save template group (create atau update)
export const saveTemplateGroup = async (
  accessToken: string, 
  group: CoverTemplateGroup
): Promise<CoverTemplateGroup> => {
  try {
    const url = group.id 
      ? `${API_BASE_URL}/template-groups/${group.id}`
      : `${API_BASE_URL}/template-groups`
    
    const method = group.id ? 'PUT' : 'POST'
    
    const response = await fetch(url, {
      method,
      headers: getAuthHeaders(accessToken),
      body: JSON.stringify(group)
    })
    
    if (!response.ok) {
      let errorMessage = `Failed to save template group: ${response.status} ${response.statusText}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.error || errorMessage
        console.error('Save template group error response:', errorData)
      } catch (jsonError) {
        console.error('Error parsing error response:', jsonError)
        // Fall back to text response
        try {
          const errorText = await response.text()
          errorMessage = errorText || errorMessage
          console.error('Save template group error text:', errorText)
        } catch (textError) {
          console.error('Error reading error response as text:', textError)
        }
      }
      throw new Error(errorMessage)
    }
    
    const data = await response.json()
    return data.group
  } catch (error) {
    console.error('Error saving template group:', error)
    throw error
  }
}

// Delete template group
export const deleteTemplateGroup = async (
  accessToken: string, 
  groupId: string
): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/template-groups/${groupId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(accessToken)
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `Failed to delete template group: ${response.statusText}`)
    }
  } catch (error) {
    console.error('Error deleting template group:', error)
    throw error
  }
}

// Apply template group ke movies dengan progress tracking
export const applyTemplateGroup = async (
  accessToken: string, 
  group: CoverTemplateGroup,
  onProgress?: (progress: { processed: number; total: number; status: string; currentMovie?: string }) => void
): Promise<{ updatedCount: number; affectedMovies: string[] }> => {
  try {
    // Validate group has required fields
    if (!group.id) {
      throw new Error('Template group ID is required')
    }
    
    if (!group.templateUrl) {
      throw new Error('Template URL is required')
    }
    
    if ((!group.applicableTypes || group.applicableTypes.length === 0) && 
        (!group.applicableStudios || group.applicableStudios.length === 0)) {
      throw new Error('At least one applicable type or studio is required')
    }

    const progressKey = `apply_progress_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    console.log('=== API Apply Template Debug ===')
    console.log('Template Group data being sent:', {
      id: group.id,
      name: group.name,
      templateUrl: group.templateUrl,
      applicableTypes: group.applicableTypes,
      isDefault: group.isDefault,
      progressKey,
      url: `${API_BASE_URL}/template-groups/${group.id}/apply`
    })
    
    console.log('Request payload:', {
      templateUrl: group.templateUrl,
      galleryTemplate: group.galleryTemplate,
      applicableTypes: group.applicableTypes,
      applicableStudios: group.applicableStudios,
      progressKey
    })
    
    // Start progress polling if callback provided
    let progressInterval: number | null = null
    if (onProgress) {
      progressInterval = window.setInterval(async () => {
        try {
          const progressResponse = await fetch(`${API_BASE_URL}/progress/${progressKey}`, {
            headers: getAuthHeaders(accessToken)
          })
          
          if (progressResponse.ok) {
            const { progress } = await progressResponse.json()
            if (progress && progress.status === 'processing') {
              onProgress(progress)
            } else if (progress && (progress.status === 'completed' || progress.status === 'failed')) {
              if (progressInterval) {
                clearInterval(progressInterval)
                progressInterval = null
              }
              if (progress.status === 'completed') {
                onProgress(progress)
              }
            }
          }
        } catch (error) {
          console.error('Progress polling error:', error)
        }
      }, 500) // Poll every 500ms
    }

    try {
      const response = await fetch(`${API_BASE_URL}/template-groups/${group.id}/apply`, {
        method: 'POST',
        headers: getAuthHeaders(accessToken),
        body: JSON.stringify({
          templateUrl: group.templateUrl,
          galleryTemplate: group.galleryTemplate,
          applicableTypes: group.applicableTypes,
          applicableStudios: group.applicableStudios,
          progressKey
        })
      })
      
      console.log('Apply template response status:', response.status)
      
      // Clear progress polling
      if (progressInterval) {
        clearInterval(progressInterval)
      }
      
      if (!response.ok) {
        let errorMessage = `Failed to apply template group: ${response.status} ${response.statusText}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (jsonError) {
          console.error('Error parsing error response:', jsonError)
        }
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      console.log('Apply template response data:', data)
      
      // Final progress update
      if (onProgress) {
        onProgress({ 
          processed: data.updatedCount, 
          total: data.updatedCount, 
          status: 'completed' 
        })
      }
      
      return {
        updatedCount: data.updatedCount || 0,
        affectedMovies: data.affectedMovies || []
      }
    } catch (error) {
      // Clear progress polling on error
      if (progressInterval) {
        clearInterval(progressInterval)
      }
      throw error
    }
  } catch (error) {
    console.error('Error applying template group:', error)
    // Re-throw with more context
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(`Network error when applying template group. Please check your connection and try again. Original error: ${error.message}`)
    }
    throw error
  }
}

// Fetch movie types dari database
export const fetchMovieTypes = async (accessToken: string): Promise<string[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/movie-types`, {
      headers: getAuthHeaders(accessToken)
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch movie types: ${response.statusText}`)
    }
    
    const data = await response.json()
    return data.types || []
  } catch (error) {
    console.error('Error fetching movie types:', error)
    throw error
  }
}

// Fetch movie studios dari database
export const fetchMovieStudios = async (accessToken: string): Promise<string[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/movie-studios`, {
      headers: getAuthHeaders(accessToken)
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch movie studios: ${response.statusText}`)
    }
    
    const data = await response.json()
    return data.studios || []
  } catch (error) {
    console.error('Error fetching movie studios:', error)
    throw error
  }
}
