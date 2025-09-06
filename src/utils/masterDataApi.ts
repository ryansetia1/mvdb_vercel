import { projectId, publicAnonKey } from './supabase/info'

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
  type: 'actor' | 'actress' | 'series' | 'studio' | 'type' | 'tag' | 'director' | 'label' | 'linklabel' | 'group'
  createdAt: string
  // Extended fields for actors and actresses
  jpname?: string
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
  // Group-specific fields (when type = 'group')
  website?: string // For group website/reference page
  description?: string // For actress groups
  gallery?: string[] // Array of gallery photo URLs for groups
  // Links for series, studio, and label
  seriesLinks?: string // For series
  studioLinks?: string // For studio
  labelLinks?: string // For label
}

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-f3064b20`

// Debug logging
console.log('Master Data API Configuration:')
console.log('- Project ID:', projectId)
console.log('- Base URL:', BASE_URL)
console.log('- Public Anon Key:', publicAnonKey.substring(0, 50) + '...')

export const masterDataApi = {
  // Health check endpoint
  async healthCheck(): Promise<{ status: string, timestamp: string }> {
    console.log(`Frontend API: Health check to ${BASE_URL}/health`)
    
    try {
      const response = await fetch(`${BASE_URL}/health`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      })

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
      console.error('Frontend API: Health check exception:', error)
      throw error
    }
  },
  // Get all items by type - now requires access token for authentication
  async getByType(type: string, accessToken?: string): Promise<MasterDataItem[]> {
    console.log(`Frontend API: Fetching ${type} data from ${BASE_URL}/master/${type}`)
    
    try {
      const authToken = accessToken || publicAnonKey
      console.log(`Frontend API: Using ${accessToken ? 'access token' : 'public key'} for ${type} request`)
      
      const response = await fetch(`${BASE_URL}/master/${type}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      })

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
      console.error(`Frontend API: Exception while fetching ${type}:`, error)
      throw error
    }
  },

  // Create new item (for simple types like type, tag)
  async create(type: string, name: string, accessToken: string): Promise<MasterDataItem> {
    console.log(`Frontend API: Creating ${type} with name: "${name}"`)
    
    const response = await fetch(`${BASE_URL}/master/${type}`, {
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

  // Create new extended item (for actors, actresses, directors, series, studio, label with detailed fields)
  async createExtended(type: 'actor' | 'actress' | 'director' | 'series' | 'studio' | 'label', data: Partial<MasterDataItem>, accessToken: string): Promise<MasterDataItem> {
    console.log(`Frontend API: Creating extended ${type} with data:`, data)
    
    const response = await fetch(`${BASE_URL}/master/${type}/extended`, {
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
    const response = await fetch(`${BASE_URL}/master/label/extended`, {
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
    const response = await fetch(`${BASE_URL}/master/series/extended`, {
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
    const response = await fetch(`${BASE_URL}/master/studio/extended`, {
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
  async updateExtended(type: 'actor' | 'actress' | 'director' | 'series' | 'studio' | 'label', id: string, data: Partial<MasterDataItem>, accessToken: string): Promise<MasterDataItem> {
    console.log('API call - updateExtended:', { type, id, data })
    
    const response = await fetch(`${BASE_URL}/master/${type}/${id}/extended`, {
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

  // Update series
  async updateSeries(id: string, titleEn: string, titleJp: string, seriesLinks: string, accessToken: string): Promise<MasterDataItem> {
    const response = await fetch(`${BASE_URL}/master/series/${id}/extended`, {
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
    const response = await fetch(`${BASE_URL}/master/studio/${id}/extended`, {
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
    const response = await fetch(`${BASE_URL}/master/label/${id}/extended`, {
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

  // Delete item
  async delete(type: string, id: string, accessToken: string): Promise<void> {
    const response = await fetch(`${BASE_URL}/master/${type}/${id}`, {
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
    const response = await fetch(`${BASE_URL}/master/group/extended`, {
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
    const response = await fetch(`${BASE_URL}/master/group/${id}/extended`, {
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
    
    const response = await fetch(`${BASE_URL}/master/${type}/${id}/sync`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name })
    })

    console.log(`Frontend API: Response status for update simple ${type} with sync:`, response.status)

    if (!response.ok) {
      const error = await response.json()
      console.error(`Frontend API: Error updating simple ${type} with sync:`, error)
      throw new Error(error.error || 'Failed to update master data with sync')
    }

    const result = await response.json()
    console.log(`Frontend API: Successfully updated simple ${type} with sync:`, result)
    return result
  },

  // Update extended master data with sync functionality
  async updateExtendedWithSync(type: 'actor' | 'actress' | 'director' | 'series' | 'studio' | 'label' | 'group', id: string, data: Partial<MasterDataItem>, accessToken: string): Promise<{ data: MasterDataItem, sync: { moviesUpdated: number, scMoviesUpdated: number } }> {
    console.log(`Frontend API: Updating extended ${type} with sync - ID: ${id}`, data)
    
    const response = await fetch(`${BASE_URL}/master/${type}/${id}/extended/sync`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    console.log(`Frontend API: Response status for update extended ${type} with sync:`, response.status)

    if (!response.ok) {
      const error = await response.json()
      console.error(`Frontend API: Error updating extended ${type} with sync:`, error)
      throw new Error(error.error || 'Failed to update master data with sync')
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

// Helper function to check if a cast member matches search query including aliases
export function castMatchesQuery(castMember: MasterDataItem, query: string): boolean {
  if (!query || !query.trim()) return true
  
  const searchQuery = query.toLowerCase().trim()
  
  // Search in name and jpname
  if (castMember.name?.toLowerCase().includes(searchQuery)) return true
  if (castMember.jpname?.toLowerCase().includes(searchQuery)) return true
  
  // Search in main alias
  if (castMember.alias?.toLowerCase().includes(searchQuery)) return true
  
  // Search in group-specific aliases
  if (castMember.groupData) {
    for (const groupName in castMember.groupData) {
      const groupInfo = castMember.groupData[groupName]
      if (groupInfo.alias?.toLowerCase().includes(searchQuery)) return true
    }
  }
  
  return false
}

// Helper function to get all aliases for a cast member
export function getAllAliases(castMember: MasterDataItem): string[] {
  const aliases = []
  
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
  
  return aliases
}