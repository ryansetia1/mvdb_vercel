import { projectId, publicAnonKey } from './supabase/info'
import { getProjectConfig } from './projectConfigManager'

// Get dynamic getBaseUrl() based on current project configuration
const getBaseUrl = () => {
  try {
    const config = getProjectConfig()
    return config.functionUrl
  } catch (error) {
    console.warn('Failed to get project config, using fallback:', error)
    return `https://${projectId}.supabase.co/functions/v1/make-server-e0516fcf`
  }
}

// Link item structure for labeled links
export interface LabeledLink {
  id: string
  label: string
  url: string
}

// Group structure for organizing actresses
export interface ActressGroup {
  id: string
  name: string
  jpname?: string // Japanese name for the group
  profilePicture?: string // Group's profile picture
  website?: string // Official website or reference page
  description?: string
  createdAt: string
}

export interface MasterDataItem {
  id: string
  name?: string // For actor, actress, studio, type, tag
  titleEn?: string // For series only
  titleJp?: string // For series only 
  type: 'actor' | 'actress' | 'series' | 'studio' | 'type' | 'tag' | 'director' | 'label' | 'linklabel' | 'group' | 'generation' | 'lineup'
  createdAt: string
  // Extended fields for actors and actresses
  jpname?: string
  kanjiName?: string // Kanji name for Japanese characters
  kanaName?: string // Kana name for Japanese pronunciation
  birthdate?: string // Changed from age to birthdate
  alias?: string
  links?: LabeledLink[] // Changed to array of labeled links
  takulinks?: string // Only for actress
  tags?: string
  photo?: string[] // Multiple photo links
  profilePicture?: string // Main profile picture for avatar display
  // Group assignment for actresses
  groupId?: string // Reference to actress group (deprecated - use selectedGroups instead)
  groupName?: string // Denormalized group name for easier display (deprecated)
  selectedGroups?: string[] // Array of group names the actress belongs to
  groupData?: { [groupName: string]: { photos: string[], alias?: string } } // Per-group data including photos and aliases
  generationData?: { [generationId: string]: { alias?: string, profilePicture?: string, photos?: string[] } } // Per-generation data including aliases and profile pictures
  lineupData?: { [lineupId: string]: { alias?: string, profilePicture?: string, photos?: string[] } } // Per-lineup data including aliases and profile pictures
  // Group-specific fields (when type = 'group')
  website?: string // For group website/reference page
  description?: string // For actress groups
  gallery?: string[] // Array of gallery photo URLs for groups
  // Generation-specific fields (when type = 'generation')
  estimatedYears?: string // Estimated years range (e.g., "2020-2023", "2021-present")
  startDate?: string // Generation start date
  endDate?: string // Generation end date (optional)
  // Lineup-specific fields (when type = 'lineup')
  generationId?: string // Reference to parent generation
  generationName?: string // Denormalized generation name for easier display
  lineupType?: string // Type of lineup (e.g., 'Main', 'Sub', 'Graduated', 'Trainee')
  lineupOrder?: number // Order within generation for display
  // Links for series, studio, and label
  seriesLinks?: string // For series
  studioLinks?: string // For studio
  labelLinks?: string // For label
}

// Debug logging
console.log('Master Data API Configuration:')
console.log('- Project ID:', projectId)
console.log('- Base URL:', getBaseUrl())
console.log('- Public Anon Key:', publicAnonKey.substring(0, 50) + '...')

export const masterDataApi = {
  // Health check endpoint
  async healthCheck(): Promise<{ status: string, timestamp: string }> {
    console.log(`Frontend API: Health check to ${getBaseUrl()}/health`)
    
    let controller: AbortController | null = null
    let timeoutId: NodeJS.Timeout | null = null
    
    try {
      controller = new AbortController()
      timeoutId = setTimeout(() => {
        console.log('Frontend API: Health check timeout after 15s')
        controller?.abort()
      }, 15000)
      
      const response = await fetch(`${getBaseUrl()}/health`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      })

      // Clear timeout immediately after response
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }

      console.log('Frontend API: Health check response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Frontend API: Health check error:', errorText)
        throw new Error(`Health check failed: ${response.status} ${errorText}`)
      }

      const result = await response.json()
      console.log('Frontend API: Health check result:', result)
      return result
    } catch (error) {
      // Clean up timeout
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      
      console.error('Frontend API: Health check exception:', error)
      throw error
    }
  },
  // Get all items by type - now requires access token for authentication
  async getByType(type: string, accessToken?: string, retryCount = 0): Promise<MasterDataItem[]> {
    console.log(`Frontend API: Fetching ${type} data from ${getBaseUrl()}/master/${type} (attempt ${retryCount + 1})`)
    
    let controller: AbortController | null = null
    let timeoutId: NodeJS.Timeout | null = null
    
    try {
      const authToken = accessToken || publicAnonKey
      console.log(`Frontend API: Using ${accessToken ? 'access token' : 'public key'} for ${type} request`)
      
      controller = new AbortController()
      // Increase timeout to 30 seconds and add exponential backoff for retries
      const timeoutDuration = 30000 + (retryCount * 10000) // 30s, 40s, 50s
      timeoutId = setTimeout(() => {
        console.log(`Frontend API: Request timeout after ${timeoutDuration}ms for ${type}`)
        controller?.abort()
      }, timeoutDuration)
      
      const response = await fetch(`${getBaseUrl()}/master/${type}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      })

      // Clear timeout immediately after response
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      
      console.log(`Frontend API: Response status for ${type}:`, response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Frontend API: Error response for ${type}:`, errorText)
        throw new Error(`Failed to fetch master data: ${response.status} ${errorText}`)
      }

      const result = await response.json()
      console.log(`Frontend API: Successfully fetched ${type} data:`, result)
      return result.data || []
    } catch (error) {
      // Clean up timeout
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      
      console.error(`Frontend API: Exception while fetching ${type} (attempt ${retryCount + 1}):`, error)
      
      // Enhanced retry logic for network errors
      if (retryCount < 2 && (
        error instanceof TypeError && error.message.includes('Failed to fetch') ||
        error.name === 'AbortError' ||
        error.message.includes('ERR_CONNECTION_CLOSED') ||
        error.message.includes('ERR_NETWORK') ||
        error.message.includes('signal is aborted')
      )) {
        const retryDelay = (retryCount + 1) * 2000 // 2s, 4s
        console.log(`Frontend API: Retrying ${type} fetch in ${retryDelay}ms...`)
        await new Promise(resolve => setTimeout(resolve, retryDelay))
        return this.getByType(type, accessToken, retryCount + 1)
      }
      
      throw error
    }
  },

  // Create new item (for simple types like type, tag)
  async create(type: string, name: string, accessToken: string): Promise<MasterDataItem> {
    console.log(`Frontend API: Creating ${type} with name: "${name}"`)
    
    const response = await fetch(`${getBaseUrl()}/master/${type}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name })
    })

    console.log(`Frontend API: Response status for create ${type}:`, response.status)

    if (!response.ok) {
      const error = await response.json()
      console.error(`Frontend API: Error creating ${type}:`, error)
      throw new Error(error.error || error.details || 'Failed to create master data')
    }

    const result = await response.json()
    console.log(`Frontend API: Successfully created ${type}:`, result.data)
    return result.data
  },

  // Create new extended item (for actors, actresses, directors, series, studio, label, group, generation with detailed fields)
  async createExtended(type: 'actor' | 'actress' | 'director' | 'series' | 'studio' | 'label' | 'group' | 'generation' | 'lineup', data: Partial<MasterDataItem>, accessToken: string): Promise<MasterDataItem> {
    console.log(`Frontend API: Creating extended ${type} with data:`, data)
    
    const response = await fetch(`${getBaseUrl()}/master/${type}/extended`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    console.log(`Frontend API: Response status for create extended ${type}:`, response.status)

    if (!response.ok) {
      const error = await response.json()
      console.error(`Frontend API: Error creating extended ${type}:`, error)
      throw new Error(error.error || 'Failed to create master data')
    }

    const result = await response.json()
    console.log(`Frontend API: Successfully created extended ${type}:`, result)
    return result.data
  },

  // Create label with optional links
  async createLabel(name: string, labelLinks: string, accessToken: string): Promise<MasterDataItem> {
    const response = await fetch(`${getBaseUrl()}/master/label/extended`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, labelLinks })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create label')
    }

    const result = await response.json()
    return result.data
  },

  // Create series with dual language titles
  async createSeries(titleEn: string, titleJp: string, seriesLinks: string, accessToken: string): Promise<MasterDataItem> {
    const response = await fetch(`${getBaseUrl()}/master/series/extended`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ titleEn, titleJp, seriesLinks })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create series')
    }

    const result = await response.json()
    return result.data
  },

  // Create studio with links
  async createStudio(name: string, studioLinks: string, accessToken: string): Promise<MasterDataItem> {
    const response = await fetch(`${getBaseUrl()}/master/studio/extended`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, studioLinks })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create studio')
    }

    const result = await response.json()
    return result.data
  },

  // Update extended item
  async updateExtended(type: 'actor' | 'actress' | 'director' | 'series' | 'studio' | 'label' | 'group' | 'generation' | 'lineup', id: string, data: Partial<MasterDataItem>, accessToken: string): Promise<MasterDataItem> {
    console.log('API call - updateExtended:', { type, id, data })
    console.log('JSON payload being sent:', JSON.stringify(data, null, 2))
    
    const response = await fetch(`${getBaseUrl()}/master/${type}/${id}/extended`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    console.log('API response status:', response.status)

    if (!response.ok) {
      const error = await response.json()
      console.error('API error response:', error)
      throw new Error(error.error || 'Failed to update master data')
    }

    const result = await response.json()
    console.log('API success response:', result)
    console.log('API success response data:', result.data)
    console.log('API success response data lineupData:', result.data?.lineupData)
    return result.data
  },

  // Update series
  async updateSeries(id: string, titleEn: string, titleJp: string, seriesLinks: string, accessToken: string): Promise<MasterDataItem> {
    const response = await fetch(`${getBaseUrl()}/master/series/${id}/extended`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ titleEn, titleJp, seriesLinks })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update series')
    }

    const result = await response.json()
    return result.data
  },

  // Update studio
  async updateStudio(id: string, name: string, studioLinks: string, accessToken: string): Promise<MasterDataItem> {
    const response = await fetch(`${getBaseUrl()}/master/studio/${id}/extended`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, studioLinks })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update studio')
    }

    const result = await response.json()
    return result.data
  },

  // Update label
  async updateLabel(id: string, name: string, labelLinks: string, accessToken: string): Promise<MasterDataItem> {
    const response = await fetch(`${getBaseUrl()}/master/label/${id}/extended`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, labelLinks })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update label')
    }

    const result = await response.json()
    return result.data
  },

  // Update simple item (for partial updates)
  async update(id: string, data: Partial<MasterDataItem>, accessToken: string): Promise<MasterDataItem> {
    console.log('API call - update:', { id, data })
    console.log('JSON payload being sent:', JSON.stringify(data, null, 2))
    
    // Determine type from the data or try to infer it
    const type = data.type || 'actress' // Default to actress for lineup operations
    
    const response = await fetch(`${getBaseUrl()}/master/${type}/${id}/extended`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    console.log('API response status:', response.status)

    if (!response.ok) {
      const error = await response.json()
      console.error('API error response:', error)
      throw new Error(error.error || 'Failed to update master data')
    }

    const result = await response.json()
    console.log('API success response:', result)
    return result.data
  },

  // Delete item
  async delete(type: string, id: string, accessToken: string): Promise<void> {
    const response = await fetch(`${getBaseUrl()}/master/${type}/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Failed to delete master data')
    }
  },

  // Group-specific methods
  async createGroup(name: string, jpname: string, profilePicture: string, website: string, description: string, accessToken: string, gallery?: string[]): Promise<MasterDataItem> {
    const response = await fetch(`${getBaseUrl()}/master/group/extended`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, jpname, profilePicture, website, description, gallery })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create group')
    }

    const result = await response.json()
    return result.data
  },

  async updateGroup(id: string, name: string, jpname: string, profilePicture: string, website: string, description: string, accessToken: string, gallery?: string[]): Promise<MasterDataItem> {
    const response = await fetch(`${getBaseUrl()}/master/group/${id}/extended`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, jpname, profilePicture, website, description, gallery })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update group')
    }

    const result = await response.json()
    return result.data
  },

  // Generation-specific methods
  async createGeneration(name: string, groupId: string, groupName: string, accessToken: string, estimatedYears?: string, startDate?: string, endDate?: string, description?: string, profilePicture?: string): Promise<MasterDataItem> {
    const response = await fetch(`${getBaseUrl()}/master/generation/extended`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, groupId, groupName, estimatedYears, startDate, endDate, description, profilePicture })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create generation')
    }

    const result = await response.json()
    return result.data
  },

  async updateGeneration(id: string, name: string, groupId: string, groupName: string, accessToken: string, estimatedYears?: string, startDate?: string, endDate?: string, description?: string, profilePicture?: string): Promise<MasterDataItem> {
    const response = await fetch(`${getBaseUrl()}/master/generation/${id}/extended`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, groupId, groupName, estimatedYears, startDate, endDate, description, profilePicture })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update generation')
    }

    const result = await response.json()
    return result.data
  },

  // Helper method to get generations by group
  async getGenerationsByGroup(groupId: string, accessToken: string): Promise<MasterDataItem[]> {
    const generations = await this.getByType('generation', accessToken)
    return generations.filter(gen => gen.groupId === groupId)
  },

  // Helper method to assign actress to generation
  async assignActressToGeneration(actressId: string, generationId: string, accessToken: string, alias?: string, profilePicture?: string, photos?: string[]): Promise<MasterDataItem> {
    console.log('Frontend API: Assigning actress to generation:', { actressId, generationId, alias, profilePicture, photos })
    
    // Get current actress data
    const actress = await this.getByType('actress', accessToken)
    const currentActress = actress.find(a => a.id === actressId)
    
    if (!currentActress) {
      throw new Error('Actress not found')
    }

    // Update generationData
    const updatedGenerationData = {
      ...currentActress.generationData,
      [generationId]: {
        alias: alias?.trim() || undefined,
        profilePicture: profilePicture?.trim() || undefined,
        photos: photos || undefined
      }
    }

    console.log('Frontend API: Updated generation data:', updatedGenerationData)

    // Update actress with all existing data plus new generationData
    const updateData = {
      ...currentActress,
      generationData: updatedGenerationData,
      updatedAt: new Date().toISOString()
    }

    // Remove fields that shouldn't be sent in update
    delete updateData.id
    delete updateData.createdAt

    console.log('Frontend API: Update data being sent:', updateData)

    return await this.updateExtended('actress', actressId, updateData, accessToken)
  },

  // Helper method to remove actress from generation
  async removeActressFromGeneration(actressId: string, generationId: string, accessToken: string): Promise<MasterDataItem> {
    console.log('Frontend API: Removing actress from generation:', { actressId, generationId })
    
    // Get current actress data
    const actress = await this.getByType('actress', accessToken)
    const currentActress = actress.find(a => a.id === actressId)
    
    if (!currentActress) {
      throw new Error('Actress not found')
    }

    // Remove generation from generationData
    const updatedGenerationData = { ...currentActress.generationData }
    delete updatedGenerationData[generationId]

    console.log('Frontend API: Updated generation data after removal:', updatedGenerationData)

    // Update actress with all existing data plus new generationData
    const updateData = {
      ...currentActress,
      generationData: Object.keys(updatedGenerationData).length > 0 ? updatedGenerationData : undefined,
      updatedAt: new Date().toISOString()
    }

    // Remove fields that shouldn't be sent in update
    delete updateData.id
    delete updateData.createdAt

    console.log('Frontend API: Update data being sent for removal:', updateData)

    return await this.updateExtended('actress', actressId, updateData, accessToken)
  },

  // Helper method to get actresses with their group info populated
  async getActressesWithGroups(accessToken: string): Promise<MasterDataItem[]> {
    const [actresses, groups] = await Promise.all([
      this.getByType('actress', accessToken),
      this.getByType('group', accessToken)
    ])

    // Populate group names for actresses
    const groupMap = groups.reduce((acc, group) => {
      acc[group.id] = group
      return acc
    }, {} as Record<string, MasterDataItem>)

    return actresses.map(actress => ({
      ...actress,
      groupName: actress.groupId && groupMap[actress.groupId] ? groupMap[actress.groupId].name : undefined
    }))
  },

  // Update simple master data (type, tag) with sync functionality
  async updateSimpleWithSync(type: 'type' | 'tag', id: string, name: string, accessToken: string): Promise<{ data: MasterDataItem, sync: { moviesUpdated: number, scMoviesUpdated: number } }> {
    console.log(`Frontend API: Updating simple ${type} with sync - ID: ${id}, name: "${name}"`)
    
    // Use f3064b20 prefix for sync endpoints
    const syncBaseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-e0516fcf`
    const response = await fetch(`${syncBaseUrl}/master/${type}/${id}/sync`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name })
    })

    console.log(`Frontend API: Response status for update simple ${type} with sync:`, response.status)

    if (!response.ok) {
      let errorMessage = `Failed to update master data with sync (${response.status})`
      try {
        const error = await response.json()
        console.error(`Frontend API: Error updating simple ${type} with sync:`, error)
        errorMessage = error.error || errorMessage
      } catch (parseError) {
        console.error(`Frontend API: Error parsing response for simple ${type} with sync:`, parseError)
        const errorText = await response.text()
        console.error(`Frontend API: Response text:`, errorText)
        errorMessage = `HTTP ${response.status}: ${errorText}`
      }
      throw new Error(errorMessage)
    }

    const result = await response.json()
    console.log(`Frontend API: Successfully updated simple ${type} with sync:`, result)
    return result
  },

  // Update extended master data with sync functionality
  async updateExtendedWithSync(type: 'actor' | 'actress' | 'director' | 'series' | 'studio' | 'label' | 'group', id: string, data: Partial<MasterDataItem>, accessToken: string): Promise<{ data: MasterDataItem, sync: { moviesUpdated: number, scMoviesUpdated: number } }> {
    console.log(`Frontend API: Updating extended ${type} with sync - ID: ${id}`, data)
    
    // Use f3064b20 prefix for sync endpoints
    const syncBaseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-e0516fcf`
    const response = await fetch(`${syncBaseUrl}/master/${type}/${id}/extended/sync`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    console.log(`Frontend API: Response status for update extended ${type} with sync:`, response.status)

    if (!response.ok) {
      let errorMessage = `Failed to update master data with sync (${response.status})`
      try {
        const error = await response.json()
        console.error(`Frontend API: Error updating extended ${type} with sync:`, error)
        errorMessage = error.error || errorMessage
      } catch (parseError) {
        console.error(`Frontend API: Error parsing response for extended ${type} with sync:`, parseError)
        const errorText = await response.text()
        console.error(`Frontend API: Response text:`, errorText)
        errorMessage = `HTTP ${response.status}: ${errorText}`
      }
      throw new Error(errorMessage)
    }

    const result = await response.json()
    console.log(`Frontend API: Successfully updated extended ${type} with sync:`, result)
    return result
  }
}

// Age calculation utilities
export function calculateAge(birthdate: string): number | null {
  if (!birthdate) return null
  const birth = new Date(birthdate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  
  return age >= 0 ? age : null
}

export function calculateAgeAtDate(birthdate: string, targetDate: string): number | null {
  if (!birthdate || !targetDate) return null
  const birth = new Date(birthdate)
  const target = new Date(targetDate)
  let age = target.getFullYear() - birth.getFullYear()
  const monthDiff = target.getMonth() - birth.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && target.getDate() < birth.getDate())) {
    age--
  }
  
  return age >= 0 ? age : null
}

// Helper function to check if a cast member matches search query including aliases and reverse name search
export function castMatchesQuery(castMember: MasterDataItem, query: string): boolean {
  if (!query || !query.trim()) return true
  
  const searchQuery = query.toLowerCase().trim()
  
  // Priority 1: Exact match with Japanese name (highest priority)
  if (castMember.jpname?.toLowerCase() === searchQuery) return true
  if (castMember.kanjiName?.toLowerCase() === searchQuery) return true
  if (castMember.kanaName?.toLowerCase() === searchQuery) return true
  
  // Priority 2: Contains match with Japanese name
  if (castMember.jpname?.toLowerCase().includes(searchQuery)) return true
  if (castMember.kanjiName?.toLowerCase().includes(searchQuery)) return true
  if (castMember.kanaName?.toLowerCase().includes(searchQuery)) return true
  
  // Priority 3: Exact match with alias
  if (castMember.alias?.toLowerCase() === searchQuery) return true
  
  // Priority 4: Contains match with alias
  if (castMember.alias?.toLowerCase().includes(searchQuery)) return true
  
  // Priority 5: Exact match with English name
  if (castMember.name?.toLowerCase() === searchQuery) return true
  
  // Priority 6: Contains match with English name (lowest priority)
  if (castMember.name?.toLowerCase().includes(searchQuery)) return true
  
  // Search in group-specific aliases
  if (castMember.groupData) {
    for (const groupName in castMember.groupData) {
      const groupInfo = castMember.groupData[groupName]
      if (groupInfo.alias?.toLowerCase().includes(searchQuery)) return true
    }
  }

  // Search in generation-specific aliases
  if (castMember.generationData) {
    for (const generationId in castMember.generationData) {
      const generationInfo = castMember.generationData[generationId]
      if (generationInfo.alias?.toLowerCase().includes(searchQuery)) return true
    }
  }
  
  // Enhanced search with reverse name matching
  // Check if query matches names in reverse order (e.g., "hatano yui" matches "yui hatano")
  const checkReverseName = (name: string) => {
    const nameLower = name.toLowerCase()
    if (nameLower.includes(searchQuery)) return true
    
    // Split both query and name into words
    const queryWords = searchQuery.split(/\s+/).filter(w => w.length > 0)
    const nameWords = nameLower.split(/\s+/).filter(w => w.length > 0)
    
    if (queryWords.length >= 2 && nameWords.length >= 2) {
      // Try reverse matching: if query is "hatano yui", check if name contains "yui hatano"
      const reversedQuery = queryWords.reverse().join(' ')
      if (nameLower.includes(reversedQuery)) return true
      
      // Also try partial reverse matching with individual words
      const firstQueryWord = queryWords[0]
      const lastQueryWord = queryWords[queryWords.length - 1]
      const firstName = nameWords[0]
      const lastName = nameWords[nameWords.length - 1]
      
      // Check if first word of query matches last word of name AND vice versa
      if (firstName.includes(lastQueryWord) && lastName.includes(firstQueryWord)) {
        return true
      }
    }
    
    return false
  }
  
  // Apply reverse name search to all name fields
  if (castMember.name && checkReverseName(castMember.name)) return true
  if (castMember.jpname && checkReverseName(castMember.jpname)) return true
  if (castMember.alias && checkReverseName(castMember.alias)) return true
  
  // Apply reverse name search to group-specific aliases
  if (castMember.groupData) {
    for (const groupName in castMember.groupData) {
      const groupInfo = castMember.groupData[groupName]
      if (groupInfo.alias && checkReverseName(groupInfo.alias)) return true
    }
  }

  // Apply reverse name search to generation-specific aliases
  if (castMember.generationData) {
    for (const generationId in castMember.generationData) {
      const generationInfo = castMember.generationData[generationId]
      if (generationInfo.alias && checkReverseName(generationInfo.alias)) return true
    }
  }
  
  return false
}

// Helper function to get all aliases for a cast member
export function getAllAliases(castMember: MasterDataItem): string[] {
  const aliases: string[] = []
  
  // Add main alias
  if (castMember.alias?.trim()) {
    aliases.push(castMember.alias.trim())
  }
  
  // Add group-specific aliases
  if (castMember.groupData) {
    for (const groupName in castMember.groupData) {
      const groupInfo = castMember.groupData[groupName]
      if (groupInfo.alias?.trim()) {
        aliases.push(groupInfo.alias.trim())
      }
    }
  }

  // Add generation-specific aliases
  if (castMember.generationData) {
    for (const generationId in castMember.generationData) {
      const generationInfo = castMember.generationData[generationId]
      if (generationInfo.alias?.trim()) {
        aliases.push(generationInfo.alias.trim())
      }
    }
  }
  
  return aliases
}

// Helper function to check if a movie code matches search query with or without dashes
export function movieCodeMatchesQuery(movieCode: string | undefined, query: string): boolean {
  if (!movieCode || !query || !query.trim()) return false
  
  const code = movieCode.toLowerCase()
  const searchQuery = query.toLowerCase().trim()
  
  // Direct match
  if (code.includes(searchQuery)) return true
  
  // Remove dashes from movie code and check if query matches
  const codeWithoutDashes = code.replace(/-/g, '')
  if (codeWithoutDashes.includes(searchQuery)) return true
  
  // Add dashes to query if it doesn't have them and check if it matches the original code
  // This handles cases where user types "wnzs190" and movie code is "wnzs-190"
  if (!searchQuery.includes('-')) {
    // Try different dash positions for common patterns
    const queryWithDash = searchQuery.replace(/^([a-z]+)(\d+)$/i, '$1-$2')
    if (queryWithDash !== searchQuery && code.includes(queryWithDash)) return true
    
    // Try inserting dashes at various positions for more complex codes
    for (let i = 2; i <= searchQuery.length - 2; i++) {
      const dashedQuery = searchQuery.slice(0, i) + '-' + searchQuery.slice(i)
      if (code.includes(dashedQuery)) return true
    }
  }
  
  return false
}