import { Context } from 'npm:hono'
import * as kv from './kv_store.tsx'

// Master data types
interface MasterDataItem {
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
  links?: any[] // Changed to array of labeled links
  takulinks?: string // Only for actress
  tags?: string
  photo?: string[] // Multiple photo links
  profilePicture?: string // Main profile picture for avatar display
  // Group assignment for actresses
  groupId?: string // Reference to actress group
  groupName?: string // Denormalized group name for easier display
  selectedGroups?: string[] // Array of group names the actress belongs to
  groupData?: { [groupName: string]: { photos: string[], alias?: string } } // Per-group data including photos and aliases
  generationData?: { [generationId: string]: { alias?: string, profilePicture?: string, photos?: string[] } } // Per-generation data including aliases and profile pictures
  lineupData?: { [lineupId: string]: { alias?: string, profilePicture?: string, photos?: string[] } } // Per-lineup data including aliases and profile pictures
  // Group-specific fields (when type = 'group')
  website?: string // For group website/reference page
  description?: string // For actress groups
  category?: string // Category for groups (e.g., 'Idol', 'Band', 'Acting', 'Solo Artist', etc.)
  gallery?: string[] // Gallery URLs for groups
  // Generation-specific fields (when type = 'generation')
  groupId?: string // Reference to parent group
  groupName?: string // Denormalized group name for easier display
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
  updatedAt?: string // Track when the item was last updated
}

// Update group data
export async function updateGroupData(c: Context) {
  try {
    console.log('Server: Updating group data')
    const id = c.req.param('id')
    const body = await c.req.json()
    const { name, jpname, profilePicture, website, description, category, gallery } = body
    console.log('Server: Update group data:', { id, ...body })

    if (!id) {
      return c.json({ error: 'Group ID is required' }, 400)
    }

    if (!name?.trim()) {
      return c.json({ error: 'Group name is required' }, 400)
    }

    // Get existing group
    const existingKey = `master_group_${id}`
    const existingData = await kv.get(existingKey)
    
    if (!existingData) {
      return c.json({ error: 'Group not found' }, 404)
    }

    const existingGroup = JSON.parse(existingData)
    console.log('Server: Existing group data:', existingGroup)

    // Check if name changed and if new name conflicts with another group
    if (name.trim() !== existingGroup.name) {
      console.log(`Server: Group name changing from "${existingGroup.name}" to "${name.trim()}"`)
      
      const allGroups = await kv.getByPrefix(`master_group_`)
      const conflictingGroup = allGroups.find(item => {
        try {
          const parsed = JSON.parse(item.value)
          return parsed.id !== id && parsed.name?.toLowerCase()?.trim() === name.toLowerCase().trim()
        } catch (parseError) {
          console.error('Server: Error parsing group for conflict check:', parseError)
          return false
        }
      })

      if (conflictingGroup) {
        const parsedConflicting = JSON.parse(conflictingGroup.value)
        console.log(`Server: Name conflict found with group ID: ${parsedConflicting.id}`)
        return c.json({ 
          error: 'Group with this name already exists',
          details: `A group named "${name}" already exists with ID: ${parsedConflicting.id}`
        }, 400)
      }
    }

    // Process gallery array
    let processedGallery: string[] | undefined = undefined
    if (Array.isArray(gallery) && gallery.length > 0) {
      processedGallery = gallery
        .filter(url => url && typeof url === 'string' && url.trim())
        .map(url => url.trim())
      processedGallery = processedGallery.length > 0 ? processedGallery : undefined
    } else if (gallery === null || (Array.isArray(gallery) && gallery.length === 0)) {
      processedGallery = undefined
    } else {
      processedGallery = existingGroup.gallery
    }

    // Update the group
    const updatedGroup: MasterDataItem = {
      ...existingGroup,
      name: name.trim(),
      jpname: jpname?.trim() || undefined,
      profilePicture: profilePicture?.trim() || undefined,
      website: website?.trim() || undefined,
      description: description?.trim() || undefined,
      category: category?.trim() || undefined,
      gallery: processedGallery,
      updatedAt: new Date().toISOString()
    }

    console.log(`Server: Saving updated group with ID: ${id}`)
    await kv.set(existingKey, JSON.stringify(updatedGroup))
    
    console.log('Server: Successfully updated group:', updatedGroup)
    return c.json({ data: updatedGroup })
  } catch (error) {
    console.error('Server: Update group data error:', error)
    return c.json({ 
      error: `Failed to update group data: ${error.message}`,
      details: error?.stack
    }, 500)
  }
}