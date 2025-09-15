import { Context } from 'npm:hono'
import * as kv from './kv_store.ts'

// Helper function to sync cast name changes across all movie records
async function syncCastNameInMovies(castType: 'actor' | 'actress' | 'director', oldName: string, newName: string): Promise<number> {
  console.log(`Server: Starting sync for ${castType} name change: "${oldName}" -> "${newName}"`)
  
  try {
    // Get all movie records
    const movieData = await kv.getByPrefix('movie:')
    console.log(`Server: Found ${movieData.length} movies to check for sync`)
    
    let updatedCount = 0
    
    for (const movieItem of movieData) {
      try {
        const movie = movieItem.value
        let needsUpdate = false
        let updatedMovie = { ...movie }
        
        // Check and update relevant cast fields based on type
        if (castType === 'director' && movie.director === oldName) {
          updatedMovie.director = newName
          needsUpdate = true
          console.log(`Server: Updating director in movie ${movie.id}: "${oldName}" -> "${newName}"`)
        }
        
        if (castType === 'actress' && movie.actress) {
          // Handle comma-separated actress list
          const actressList = movie.actress.split(',').map(name => name.trim())
          const updatedActressList = actressList.map(name => name === oldName ? newName : name)
          
          if (JSON.stringify(actressList) !== JSON.stringify(updatedActressList)) {
            updatedMovie.actress = updatedActressList.join(', ')
            needsUpdate = true
            console.log(`Server: Updating actress in movie ${movie.id}: "${oldName}" -> "${newName}"`)
          }
        }
        
        if (castType === 'actor' && movie.actors) {
          // Handle comma-separated actors list
          const actorsList = movie.actors.split(',').map(name => name.trim())
          const updatedActorsList = actorsList.map(name => name === oldName ? newName : name)
          
          if (JSON.stringify(actorsList) !== JSON.stringify(updatedActorsList)) {
            updatedMovie.actors = updatedActorsList.join(', ')
            needsUpdate = true
            console.log(`Server: Updating actors in movie ${movie.id}: "${oldName}" -> "${newName}"`)
          }
        }
        
        // Save updated movie if changes were made
        if (needsUpdate) {
          updatedMovie.updatedAt = new Date().toISOString()
          await kv.set(movieItem.key, updatedMovie)
          updatedCount++
          console.log(`Server: Successfully updated movie ${movie.id}`)
        }
        
      } catch (movieUpdateError) {
        console.error(`Server: Error updating movie ${movieItem.value.id}:`, movieUpdateError)
        // Continue with other movies even if one fails
      }
    }
    
    console.log(`Server: Completed sync - updated ${updatedCount} movies`)
    return updatedCount
    
  } catch (error) {
    console.error(`Server: Error during cast name sync:`, error)
    throw error
  }
}

// Helper function to sync cast name changes in SC movies
async function syncCastNameInSCMovies(castType: 'actor' | 'actress' | 'director', oldName: string, newName: string): Promise<number> {
  console.log(`Server: Starting SC movies sync for ${castType} name change: "${oldName}" -> "${newName}"`)
  
  try {
    // Get all SC movie records
    const scMovieData = await kv.getByPrefix('scmovie:')
    console.log(`Server: Found ${scMovieData.length} SC movies to check for sync`)
    
    let updatedCount = 0
    
    for (const scMovieItem of scMovieData) {
      try {
        const scMovie = scMovieItem.value
        let needsUpdate = false
        let updatedSCMovie = { ...scMovie }
        
        // SC movies have a general 'cast' field that can contain any cast member
        if (scMovie.cast) {
          // Handle comma-separated cast list
          const castList = scMovie.cast.split(',').map(name => name.trim())
          const updatedCastList = castList.map(name => name === oldName ? newName : name)
          
          if (JSON.stringify(castList) !== JSON.stringify(updatedCastList)) {
            updatedSCMovie.cast = updatedCastList.join(', ')
            needsUpdate = true
            console.log(`Server: Updating cast in SC movie ${scMovie.id}: "${oldName}" -> "${newName}"`)
          }
        }
        
        // Save updated SC movie if changes were made
        if (needsUpdate) {
          updatedSCMovie.updatedAt = new Date().toISOString()
          await kv.set(scMovieItem.key, updatedSCMovie)
          updatedCount++
          console.log(`Server: Successfully updated SC movie ${scMovie.id}`)
        }
        
      } catch (scMovieUpdateError) {
        console.error(`Server: Error updating SC movie ${scMovieItem.value.id}:`, scMovieUpdateError)
        // Continue with other SC movies even if one fails
      }
    }
    
    console.log(`Server: Completed SC movies sync - updated ${updatedCount} SC movies`)
    return updatedCount
    
  } catch (error) {
    console.error(`Server: Error during SC movies cast name sync:`, error)
    throw error
  }
}

// Link item structure for labeled links
export interface LabeledLink {
  id: string
  label: string
  url: string
}

// Master data types
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
  groupId?: string // Reference to actress group
  groupName?: string // Denormalized group name for easier display
  selectedGroups?: string[] // Array of group names the actress belongs to
  groupData?: { [groupName: string]: { photos: string[], alias?: string } } // Per-group data including photos and aliases
  generationData?: { [generationId: string]: { alias?: string, profilePicture?: string, photos?: string[] } } // Per-generation data including aliases and profile pictures
  lineupData?: { [lineupId: string]: { alias?: string, profilePicture?: string, photos?: string[] } } // Per-lineup data including aliases and profile pictures
  // Group-specific fields (when type = 'group')
  website?: string // For group website/reference page
  description?: string // For actress groups
  gallery?: string[] // Array of gallery photo URLs for groups
  // Generation-specific fields (when type = 'generation')
  groupId?: string // Reference to parent group
  groupName?: string // Denormalized group name for easier display
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

// Get all master data by type
export async function getMasterData(c: Context) {
  try {
    const type = c.req.param('type')
    console.log(`Server: Getting master data for type: "${type}" (length: ${type?.length})`)
    console.log(`Server: Type check - raw type:`, JSON.stringify(type))
    
    // List of valid types
    const validTypes = ['actor', 'actress', 'series', 'studio', 'type', 'tag', 'director', 'label', 'linklabel', 'group', 'generation', 'lineup']
    console.log(`Server: Valid types:`, validTypes)
    console.log(`Server: Type validation - includes check:`, validTypes.includes(type))
    
    if (!type) {
      console.log(`Server: Type parameter is missing or empty`)
      return c.json({ error: 'Type parameter is required' }, 400)
    }
    
    if (!validTypes.includes(type)) {
      console.log(`Server: Invalid type parameter: "${type}" - not in valid types list`)
      return c.json({ error: `Invalid type parameter: ${type}. Valid types are: ${validTypes.join(', ')}` }, 400)
    }

    console.log(`Server: Fetching data with prefix: master_${type}_`)
    const data = await kv.getByPrefix(`master_${type}_`)
    console.log(`Server: Raw data from KV store:`, data)
    
    const items = data.map(item => {
      try {
        const parsed = JSON.parse(item.value)
        console.log(`Server: Parsed item:`, parsed)
        return parsed
      } catch (parseError) {
        console.error(`Server: Error parsing item:`, parseError, 'Raw item:', item)
        return null
      }
    }).filter(item => item !== null)
    
    console.log(`Server: Returning ${items.length} items for type ${type}`)
    return c.json({ data: items })
  } catch (error) {
    console.error('Server: Get master data error:', error)
    return c.json({ error: `Failed to get master data: ${error.message}` }, 500)
  }
}

// Create new master data item (simple version for type, tag)
export async function createMasterData(c: Context) {
  try {
    const type = c.req.param('type')
    console.log(`Server: Creating master data for type: ${type}`)
    
    if (!type || !['type', 'tag', 'director', 'label', 'linklabel'].includes(type)) {
      console.log(`Server: Invalid type for simple creation: ${type}`)
      return c.json({ error: 'Invalid type parameter for simple creation' }, 400)
    }

    const body = await c.req.json()
    const { name } = body
    console.log(`Server: Creating ${type} with name: "${name}"`)

    if (!name?.trim()) {
      return c.json({ error: 'Name is required' }, 400)
    }

    // Check if item already exists (only within same type)
    console.log(`Server: Checking for existing ${type} with name: "${name}"`)
    
    try {
      const existingData = await kv.getByPrefix(`master_${type}_`)
      console.log(`Server: Found ${existingData.length} existing ${type} items`)
      
      const existingItem = existingData.find(item => {
        try {
          const parsed = JSON.parse(item.value)
          const existingName = parsed.name?.toLowerCase()?.trim()
          const newName = name.toLowerCase().trim()
          console.log(`Server: Comparing ${type} - existing: "${existingName}" with new: "${newName}"`)
          
          // Only check exact match within same type
          const isExactMatch = existingName === newName
          if (isExactMatch) {
            console.log(`Server: Exact match found in same type ${type}: "${existingName}" === "${newName}"`)
          }
          return isExactMatch
        } catch (parseError) {
          console.error('Server: Error parsing existing item:', parseError)
          return false
        }
      })

      if (existingItem) {
        const parsedExisting = JSON.parse(existingItem.value)
        console.log(`Server: Duplicate ${type} found: "${name}" (existing ID: ${parsedExisting.id})`)
        return c.json({ 
          error: `${type.charAt(0).toUpperCase() + type.slice(1)} with this name already exists`,
          details: `A ${type} named "${name}" already exists with ID: ${parsedExisting.id}`
        }, 400)
      }
      
      console.log(`Server: No duplicate ${type} found for "${name}" - safe to create`)
    } catch (checkError) {
      console.error('Server: Error checking existing items:', checkError)
      // Continue with creation if check fails - better to risk duplicate than block creation
    }

    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newItem: MasterDataItem = {
      id,
      name: name.trim(),
      type: type as MasterDataItem['type'],
      createdAt: new Date().toISOString()
    }

    console.log(`Server: Creating new ${type} with ID: ${id}, name: "${newItem.name}"`)
    
    try {
      await kv.set(`master_${type}_${id}`, JSON.stringify(newItem))
      console.log(`Server: Successfully created ${type}: "${newItem.name}"`)
      return c.json({ data: newItem })
    } catch (saveError) {
      console.error(`Server: Error saving ${type}:`, saveError)
      return c.json({ error: `Failed to save master data: ${saveError.message}` }, 500)
    }
  } catch (error) {
    console.error('Server: Create master data error:', error)
    return c.json({ 
      error: `Failed to create master data: ${error.message}`,
      details: error?.stack
    }, 500)
  }
}

// Create extended master data item (for actors and actresses)
export async function createExtendedMasterData(c: Context) {
  try {
    const type = c.req.param('type')
    console.log(`Server: Creating extended master data for type: ${type}`)
    console.log(`Server: Type is series: ${type === 'series'}`)
    
    if (type === 'series') {
      console.log('Server: Redirecting to createSeriesData function')
      return await createSeriesData(c)
    }
    
    if (type === 'studio') {
      return await createStudioData(c)
    }
    
    if (type === 'label') {
      return await createLabelData(c)
    }
    
    if (type === 'group') {
      return await createGroupData(c)
    }
    
    if (type === 'generation') {
      return await createGenerationData(c)
    }
    
    if (type === 'lineup') {
      return await createLineupData(c)
    }
    
    if (!type || !['actor', 'actress', 'director'].includes(type)) {
      console.log(`Server: Invalid type for extended creation: ${type}`)
      return c.json({ error: 'Invalid type parameter' }, 400)
    }

    const body = await c.req.json()
    const { name, jpname, kanjiName, kanaName, birthdate, alias, links, takulinks, tags, photo, profilePicture, groupId, selectedGroups, generationData } = body
    console.log(`Server: Creating extended ${type} with data:`, body)

    if (!name?.trim()) {
      console.log('Server: Name validation failed - name is required')
      return c.json({ error: 'Name is required' }, 400)
    }

    // Check if item already exists (only within same type)
    console.log(`Server: Checking for existing ${type} with name: "${name}"`)
    const existingData = await kv.getByPrefix(`master_${type}_`)
    console.log(`Server: Found ${existingData.length} existing ${type} items`)
    
    const existingItem = existingData.find(item => {
      try {
        const parsed = JSON.parse(item.value)
        const existingName = parsed.name?.toLowerCase()?.trim()
        const newName = name.toLowerCase().trim()
        console.log(`Server: Comparing ${type} - existing: "${existingName}" with new: "${newName}"`)
        
        // Only check exact match within same type
        const isExactMatch = existingName === newName
        if (isExactMatch) {
          console.log(`Server: Exact match found in same type ${type}: "${existingName}" === "${newName}"`)
        }
        return isExactMatch
      } catch (parseError) {
        console.error('Server: Error parsing existing item for duplicate check:', parseError)
        return false
      }
    })

    if (existingItem) {
      const parsedExisting = JSON.parse(existingItem.value)
      console.log(`Server: Duplicate ${type} found: "${name}" (existing ID: ${parsedExisting.id})`)
      return c.json({ 
        error: `${type.charAt(0).toUpperCase() + type.slice(1)} with this name already exists`,
        details: `A ${type} named "${name}" already exists with ID: ${parsedExisting.id}`
      }, 400)
    }
    
    console.log(`Server: No duplicate ${type} found for "${name}" - safe to create`)

    // Process links - convert from array or keep existing format for backward compatibility
    let processedLinks: LabeledLink[] | undefined = undefined
    if (Array.isArray(links) && links.length > 0) {
      processedLinks = links
        .filter(link => link && typeof link === 'object' && link.label?.trim() && link.url?.trim())
        .map(link => ({
          id: link.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          label: link.label.trim(),
          url: link.url.trim()
        }))
      processedLinks = processedLinks.length > 0 ? processedLinks : undefined
    } else if (typeof links === 'string' && links.trim()) {
      // Backward compatibility: convert string to labeled link array
      processedLinks = [{
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        label: 'Website',
        url: links.trim()
      }]
    }
    
    console.log(`Server: Processing links for create ${type}: input=${JSON.stringify(links)}, processed=${JSON.stringify(processedLinks)}`)

    // Process photos with proper deduplication and structure
    const allPhotos = []
    
    // Add profilePicture if provided
    if (profilePicture?.trim()) {
      allPhotos.push(profilePicture.trim())
    }
    
    // Add photos from array if provided
    if (Array.isArray(photo)) {
      const filteredPhotos = photo.filter(p => p?.trim())
      allPhotos.push(...filteredPhotos)
    }
    
    // Remove duplicates
    const uniquePhotos = [...new Set(allPhotos)]
    
    // Split into profilePicture and photo array
    const finalProfilePicture = uniquePhotos.length > 0 ? uniquePhotos[0] : undefined
    const finalPhotoArray = uniquePhotos.length > 1 ? uniquePhotos.slice(1) : undefined

    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newItem: MasterDataItem = {
      id,
      name: name.trim(),
      type: type as MasterDataItem['type'],
      createdAt: new Date().toISOString(),
      jpname: jpname?.trim() || undefined,
      kanjiName: kanjiName?.trim() || undefined,
      kanaName: kanaName?.trim() || undefined,
      birthdate: birthdate?.trim() || undefined,
      alias: alias?.trim() || undefined,
      links: processedLinks,
      tags: tags?.trim() || undefined,
      photo: finalPhotoArray,
      profilePicture: finalProfilePicture,
      groupId: groupId?.trim() || undefined,
      selectedGroups: Array.isArray(selectedGroups) && selectedGroups.length > 0 ? selectedGroups : undefined,
      generationData: generationData || undefined
    }

    console.log('Server: New item before saving:', JSON.stringify(newItem, null, 2))

    // Add takulinks for actress only
    if (type === 'actress' && takulinks?.trim()) {
      newItem.takulinks = takulinks.trim()
    }
    
    // For director, we might want to limit certain fields
    if (type === 'director') {
      // Directors don't need group-related fields
      newItem.groupId = undefined
      newItem.selectedGroups = undefined
      // Also don't need actress-specific takulinks
      newItem.takulinks = undefined
    }

    console.log(`Server: Saving extended ${type} with ID: ${id}`)
    await kv.set(`master_${type}_${id}`, JSON.stringify(newItem))
    
    console.log(`Server: Successfully created extended ${type}:`, newItem)
    return c.json({ data: newItem })
  } catch (error) {
    console.error('Server: Create extended master data error:', error)
    return c.json({ 
      error: `Failed to create extended master data: ${error.message}`,
      details: error?.stack
    }, 500)
  }
}

// Create series data with dual language titles
export async function createSeriesData(c: Context) {
  try {
    console.log('Server: Creating series data')
    const body = await c.req.json()
    const { titleEn, titleJp, seriesLinks } = body
    console.log('Server: Series data received:', { titleEn, titleJp, seriesLinks })
    console.log('Server: Series links type:', typeof seriesLinks, 'length:', seriesLinks?.length)

    if (!titleEn?.trim() && !titleJp?.trim()) {
      return c.json({ error: 'At least one title (EN or JP) is required' }, 400)
    }

    // Check if series already exists
    console.log(`Server: Checking for existing series with titleEn: "${titleEn}", titleJp: "${titleJp}"`)
    const existingData = await kv.getByPrefix(`master_series_`)
    console.log(`Server: Found ${existingData.length} existing series items`)
    
    const existingItem = existingData.find(item => {
      try {
        const parsed = JSON.parse(item.value)
        const existingTitleEn = parsed.titleEn?.toLowerCase()?.trim()
        const existingTitleJp = parsed.titleJp?.toLowerCase()?.trim()
        const newTitleEn = titleEn?.toLowerCase()?.trim()
        const newTitleJp = titleJp?.toLowerCase()?.trim()
        
        const enMatch = newTitleEn && existingTitleEn === newTitleEn
        const jpMatch = newTitleJp && existingTitleJp === newTitleJp
        
        if (enMatch || jpMatch) {
          console.log(`Server: Series duplicate found - EN: "${existingTitleEn}" vs "${newTitleEn}", JP: "${existingTitleJp}" vs "${newTitleJp}"`)
        }
        
        return enMatch || jpMatch
      } catch (parseError) {
        console.error('Server: Error parsing existing series for duplicate check:', parseError)
        return false
      }
    })

    if (existingItem) {
      const parsedExisting = JSON.parse(existingItem.value)
      console.log(`Server: Duplicate series found (ID: ${parsedExisting.id})`)
      return c.json({ 
        error: 'Series with this title already exists',
        details: `A series with this title already exists with ID: ${parsedExisting.id}`
      }, 400)
    }
    
    console.log(`Server: No duplicate series found - safe to create`)

    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newItem: MasterDataItem = {
      id,
      type: 'series',
      createdAt: new Date().toISOString(),
      titleEn: titleEn?.trim() || undefined,
      titleJp: titleJp?.trim() || undefined,
      seriesLinks: seriesLinks?.trim() || undefined
    }

    console.log(`Server: Saving series with ID: ${id}`)
    await kv.set(`master_series_${id}`, JSON.stringify(newItem))
    
    console.log('Server: Successfully created series:', newItem)
    return c.json({ data: newItem })
  } catch (error) {
    console.error('Server: Create series data error:', error)
    return c.json({ 
      error: `Failed to create series data: ${error.message}`,
      details: error?.stack  
    }, 500)
  }
}

// Create studio data with links
export async function createStudioData(c: Context) {
  try {
    console.log('Server: Creating studio data')
    const body = await c.req.json()
    const { name, jpname, kanjiName, kanaName, alias, studioLinks } = body
    console.log('Server: Studio data:', body)

    if (!name?.trim()) {
      return c.json({ error: 'Studio name is required' }, 400)
    }

    // Check if studio already exists
    console.log(`Server: Checking for existing studio with name: "${name}"`)
    const existingData = await kv.getByPrefix(`master_studio_`)
    console.log(`Server: Found ${existingData.length} existing studio items`)
    
    const existingItem = existingData.find(item => {
      try {
        const parsed = JSON.parse(item.value)
        const existingName = parsed.name?.toLowerCase()?.trim()
        const newName = name.toLowerCase().trim()
        console.log(`Server: Comparing studio - existing: "${existingName}" with new: "${newName}"`)
        
        const isExactMatch = existingName === newName
        if (isExactMatch) {
          console.log(`Server: Exact match found in studio: "${existingName}" === "${newName}"`)
        }
        return isExactMatch
      } catch (parseError) {
        console.error('Server: Error parsing existing studio for duplicate check:', parseError)
        return false
      }
    })

    if (existingItem) {
      const parsedExisting = JSON.parse(existingItem.value)
      console.log(`Server: Duplicate studio found: "${name}" (ID: ${parsedExisting.id})`)
      return c.json({ 
        error: 'Studio with this name already exists',
        details: `A studio named "${name}" already exists with ID: ${parsedExisting.id}`
      }, 400)
    }
    
    console.log(`Server: No duplicate studio found for "${name}" - safe to create`)

    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newItem: MasterDataItem = {
      id,
      name: name.trim(),
      type: 'studio',
      createdAt: new Date().toISOString(),
      jpname: jpname?.trim() || undefined,
      kanjiName: kanjiName?.trim() || undefined,
      kanaName: kanaName?.trim() || undefined,
      alias: alias?.trim() || undefined,
      studioLinks: studioLinks?.trim() || undefined
    }

    console.log(`Server: Saving studio with ID: ${id}`)
    await kv.set(`master_studio_${id}`, JSON.stringify(newItem))
    
    console.log('Server: Successfully created studio:', newItem)
    return c.json({ data: newItem })
  } catch (error) {
    console.error('Server: Create studio data error:', error)
    return c.json({ 
      error: `Failed to create studio data: ${error.message}`,
      details: error?.stack
    }, 500)
  }
}

// Create label data with optional links
export async function createLabelData(c: Context) {
  try {
    console.log('Server: Creating label data')
    const body = await c.req.json()
    const { name, jpname, kanjiName, kanaName, labelLinks } = body
    console.log('Server: Label data:', body)

    if (!name?.trim()) {
      return c.json({ error: 'Label name is required' }, 400)
    }

    // Check if label already exists
    console.log(`Server: Checking for existing label with name: "${name}"`)
    const existingData = await kv.getByPrefix(`master_label_`)
    console.log(`Server: Found ${existingData.length} existing label items`)
    
    const existingItem = existingData.find(item => {
      try {
        const parsed = JSON.parse(item.value)
        const existingName = parsed.name?.toLowerCase()?.trim()
        const newName = name.toLowerCase().trim()
        console.log(`Server: Comparing label - existing: "${existingName}" with new: "${newName}"`)
        
        const isExactMatch = existingName === newName
        if (isExactMatch) {
          console.log(`Server: Exact match found in label: "${existingName}" === "${newName}"`)
        }
        return isExactMatch
      } catch (parseError) {
        console.error('Server: Error parsing existing label for duplicate check:', parseError)
        return false
      }
    })

    if (existingItem) {
      const parsedExisting = JSON.parse(existingItem.value)
      console.log(`Server: Duplicate label found: "${name}" (ID: ${parsedExisting.id})`)
      return c.json({ 
        error: 'Label with this name already exists',
        details: `A label named "${name}" already exists with ID: ${parsedExisting.id}`
      }, 400)
    }
    
    console.log(`Server: No duplicate label found for "${name}" - safe to create`)

    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newItem: MasterDataItem = {
      id,
      name: name.trim(),
      type: 'label',
      createdAt: new Date().toISOString(),
      jpname: jpname?.trim() || undefined,
      kanjiName: kanjiName?.trim() || undefined,
      kanaName: kanaName?.trim() || undefined,
      labelLinks: labelLinks?.trim() || undefined
    }

    console.log(`Server: Saving label with ID: ${id}`)
    await kv.set(`master_label_${id}`, JSON.stringify(newItem))
    
    console.log('Server: Successfully created label:', newItem)
    return c.json({ data: newItem })
  } catch (error) {
    console.error('Server: Create label data error:', error)
    return c.json({ 
      error: `Failed to create label data: ${error.message}`,
      details: error?.stack
    }, 500)
  }
}

// Create group data 
export async function createGroupData(c: Context) {
  try {
    console.log('Server: Creating group data')
    const body = await c.req.json()
    const { name, jpname, profilePicture, website, description, gallery } = body
    console.log('Server: Group data:', body)

    if (!name?.trim()) {
      return c.json({ error: 'Group name is required' }, 400)
    }

    // Check if group already exists
    console.log(`Server: Checking for existing group with name: "${name}"`)
    const existingData = await kv.getByPrefix(`master_group_`)
    console.log(`Server: Found ${existingData.length} existing group items`)
    
    const existingItem = existingData.find(item => {
      try {
        const parsed = JSON.parse(item.value)
        const existingName = parsed.name?.toLowerCase()?.trim()
        const newName = name.toLowerCase().trim()
        console.log(`Server: Comparing group - existing: "${existingName}" with new: "${newName}"`)
        
        const isExactMatch = existingName === newName
        if (isExactMatch) {
          console.log(`Server: Exact match found in group: "${existingName}" === "${newName}"`)
        }
        return isExactMatch
      } catch (parseError) {
        console.error('Server: Error parsing existing group for duplicate check:', parseError)
        return false
      }
    })

    if (existingItem) {
      const parsedExisting = JSON.parse(existingItem.value)
      console.log(`Server: Duplicate group found: "${name}" (ID: ${parsedExisting.id})`)
      return c.json({ 
        error: 'Group with this name already exists',
        details: `A group named "${name}" already exists with ID: ${parsedExisting.id}`
      }, 400)
    }
    
    console.log(`Server: No duplicate group found for "${name}" - safe to create`)

    // Process gallery array
    let processedGallery: string[] | undefined = undefined
    if (Array.isArray(gallery) && gallery.length > 0) {
      processedGallery = gallery
        .filter(url => url && typeof url === 'string' && url.trim())
        .map(url => url.trim())
      processedGallery = processedGallery.length > 0 ? processedGallery : undefined
    }

    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newItem: MasterDataItem = {
      id,
      name: name.trim(),
      type: 'group',
      createdAt: new Date().toISOString(),
      jpname: jpname?.trim() || undefined,
      profilePicture: profilePicture?.trim() || undefined,
      website: website?.trim() || undefined,
      description: description?.trim() || undefined,
      gallery: processedGallery
    }

    console.log(`Server: Saving group with ID: ${id}`)
    await kv.set(`master_group_${id}`, JSON.stringify(newItem))
    
    console.log('Server: Successfully created group:', newItem)
    return c.json({ data: newItem })
  } catch (error) {
    console.error('Server: Create group data error:', error)
    return c.json({ 
      error: `Failed to create group data: ${error.message}`,
      details: error?.stack
    }, 500)
  }
}

// Update master data item (for simple types like type, tag)
export async function updateMasterData(c: Context) {
  try {
    const type = c.req.param('type')
    const id = c.req.param('id')
    console.log(`Server: Updating ${type} with ID: ${id}`)
    
    if (!type || !['type', 'tag'].includes(type)) {
      console.log(`Server: Invalid type for simple update: ${type}`)
      return c.json({ error: 'Invalid type parameter for update' }, 400)
    }

    const body = await c.req.json()
    const { name } = body
    console.log(`Server: Updating ${type} with data:`, body)

    if (!name?.trim()) {
      return c.json({ error: 'Name is required' }, 400)
    }

    // Get existing item
    console.log(`Server: Fetching existing ${type} with ID: ${id}`)
    const existingData = await kv.get(`master_${type}_${id}`)
    
    if (!existingData) {
      console.log(`Server: ${type} with ID ${id} not found`)
      return c.json({ error: `${type} not found` }, 404)
    }

    const existingItem = JSON.parse(existingData)
    console.log(`Server: Found existing ${type}:`, existingItem)
    
    // Store the old name for sync purposes
    const oldName = existingItem.name

    // Check if another item with this name exists (exclude current item)
    console.log(`Server: Checking for duplicate ${type} name: "${name}"`)
    const allItems = await kv.getByPrefix(`master_${type}_`)
    
    const duplicateItem = allItems.find(item => {
      try {
        const parsed = JSON.parse(item.value)
        const existingName = parsed.name?.toLowerCase()?.trim()
        const newName = name.toLowerCase().trim()
        
        // Don't compare with self
        if (parsed.id === id) return false
        
        const isExactMatch = existingName === newName
        if (isExactMatch) {
          console.log(`Server: Duplicate found - ID: ${parsed.id}, name: "${existingName}"`)
        }
        return isExactMatch
      } catch (parseError) {
        console.error('Server: Error parsing item for duplicate check:', parseError)
        return false
      }
    })

    if (duplicateItem) {
      const parsedDuplicate = JSON.parse(duplicateItem.value)
      console.log(`Server: Duplicate ${type} found: "${name}" (existing ID: ${parsedDuplicate.id})`)
      return c.json({ 
        error: `${type.charAt(0).toUpperCase() + type.slice(1)} with this name already exists`,
        details: `A ${type} named "${name}" already exists with ID: ${parsedDuplicate.id}`
      }, 400)
    }

    // Update the item
    const updatedItem = {
      ...existingItem,
      name: name.trim(),
      updatedAt: new Date().toISOString()
    }

    console.log(`Server: Updating ${type} with data:`, updatedItem)
    await kv.set(`master_${type}_${id}`, JSON.stringify(updatedItem))
    
    console.log(`Server: Successfully updated ${type}:`, updatedItem)
    return c.json({ data: updatedItem })
  } catch (error) {
    console.error('Server: Update master data error:', error)
    return c.json({ 
      error: `Failed to update master data: ${error.message}`,
      details: error?.stack
    }, 500)
  }
}

// Update extended master data item (for actors, actresses, etc)
export async function updateExtendedMasterData(c: Context) {
  try {
    const type = c.req.param('type')
    const id = c.req.param('id')
    console.log(`Server: Updating extended ${type} with ID: ${id}`)
    
    if (type === 'series') {
      return await updateSeriesData(c)
    }
    
    if (type === 'studio') {
      return await updateStudioData(c)
    }
    
    if (type === 'label') {
      return await updateLabelData(c)
    }
    
    if (type === 'group') {
      return await updateGroupData(c)
    }
    
    if (type === 'generation') {
      return await updateGenerationData(c)
    }
    
    if (type === 'lineup') {
      return await updateLineupData(c)
    }
    
    if (!type || !['actor', 'actress', 'director', 'lineup'].includes(type)) {
      console.log(`Server: Invalid type for extended update: ${type}`)
      return c.json({ error: 'Invalid type parameter' }, 400)
    }

    const body = await c.req.json()
    const { name, jpname, kanjiName, kanaName, birthdate, alias, links, takulinks, tags, photo, profilePicture, groupId, selectedGroups, generationData, lineupData } = body
    console.log(`Server: Updating extended ${type} with data:`, body)
    console.log(`Server: lineupData received:`, lineupData)
    console.log(`Server: lineupData type:`, typeof lineupData)
    console.log(`Server: lineupData keys:`, lineupData ? Object.keys(lineupData) : 'undefined')

    if (!name?.trim()) {
      console.log('Server: Name validation failed - name is required')
      return c.json({ error: 'Name is required' }, 400)
    }

    // Get existing item
    console.log(`Server: Fetching existing ${type} with ID: ${id}`)
    const existingData = await kv.get(`master_${type}_${id}`)
    
    if (!existingData) {
      console.log(`Server: ${type} with ID ${id} not found`)
      return c.json({ error: `${type} not found` }, 404)
    }

    const existingItem = JSON.parse(existingData)
    console.log(`Server: Found existing ${type}:`, existingItem)
    
    const oldName = existingItem.name

    // Check if another item with this name exists (exclude current item)
    console.log(`Server: Checking for duplicate ${type} name: "${name}"`)
    const allItems = await kv.getByPrefix(`master_${type}_`)
    
    const duplicateItem = allItems.find(item => {
      try {
        const parsed = JSON.parse(item.value)
        const existingName = parsed.name?.toLowerCase()?.trim()
        const newName = name.toLowerCase().trim()
        
        // Don't compare with self
        if (parsed.id === id) return false
        
        const isExactMatch = existingName === newName
        if (isExactMatch) {
          console.log(`Server: Duplicate found - ID: ${parsed.id}, name: "${existingName}"`)
        }
        return isExactMatch
      } catch (parseError) {
        console.error('Server: Error parsing item for duplicate check:', parseError)
        return false
      }
    })

    if (duplicateItem) {
      const parsedDuplicate = JSON.parse(duplicateItem.value)
      console.log(`Server: Duplicate ${type} found: "${name}" (existing ID: ${parsedDuplicate.id})`)
      return c.json({ 
        error: `${type.charAt(0).toUpperCase() + type.slice(1)} with this name already exists`,
        details: `A ${type} named "${name}" already exists with ID: ${parsedDuplicate.id}`
      }, 400)
    }

    // Process links - convert from array or keep existing format for backward compatibility
    let processedLinks: LabeledLink[] | undefined = undefined
    if (Array.isArray(links) && links.length > 0) {
      processedLinks = links
        .filter(link => link && typeof link === 'object' && link.label?.trim() && link.url?.trim())
        .map(link => ({
          id: link.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          label: link.label.trim(),
          url: link.url.trim()
        }))
      processedLinks = processedLinks.length > 0 ? processedLinks : undefined
    } else if (typeof links === 'string' && links.trim()) {
      // Backward compatibility: convert string to labeled link array
      processedLinks = [{
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        label: 'Website',
        url: links.trim()
      }]
    } else if (links === null || links === '') {
      processedLinks = undefined
    }
    
    console.log(`Server: Processing links for update ${type}: input=${JSON.stringify(links)}, processed=${JSON.stringify(processedLinks)}`)

    // Process photos with proper deduplication and structure
    const allPhotos = []
    
    // Add profilePicture if provided
    if (profilePicture?.trim()) {
      allPhotos.push(profilePicture.trim())
    }
    
    // Add photos from array if provided
    if (Array.isArray(photo)) {
      const filteredPhotos = photo.filter(p => p?.trim())
      allPhotos.push(...filteredPhotos)
    }
    
    // Remove duplicates
    const uniquePhotos = [...new Set(allPhotos)]
    
    // Split into profilePicture and photo array
    const finalProfilePicture = uniquePhotos.length > 0 ? uniquePhotos[0] : (profilePicture === null || profilePicture === '' ? undefined : existingItem.profilePicture)
    const finalPhotoArray = uniquePhotos.length > 1 ? uniquePhotos.slice(1) : (photo === null || (Array.isArray(photo) && photo.length === 0) ? undefined : existingItem.photo)

    // Process lineupData - ensure it's properly handled
    let processedLineupData = existingItem.lineupData || {}
    if (lineupData !== undefined && lineupData !== null) {
      if (typeof lineupData === 'object' && !Array.isArray(lineupData)) {
        // Merge with existing lineupData
        processedLineupData = {
          ...processedLineupData,
          ...lineupData
        }
        console.log(`Server: Processed lineupData:`, processedLineupData)
      } else {
        console.log(`Server: Invalid lineupData format, keeping existing:`, existingItem.lineupData)
      }
    }

    // Update the item
    const updatedItem = {
      ...existingItem,
      name: name.trim(),
      jpname: jpname?.trim() || (jpname === null || jpname === '' ? undefined : existingItem.jpname),
      kanjiName: kanjiName?.trim() || (kanjiName === null || kanjiName === '' ? undefined : existingItem.kanjiName),
      kanaName: kanaName?.trim() || (kanaName === null || kanaName === '' ? undefined : existingItem.kanaName),
      birthdate: birthdate?.trim() || (birthdate === null || birthdate === '' ? undefined : existingItem.birthdate),
      alias: alias?.trim() || (alias === null || alias === '' ? undefined : existingItem.alias),
      links: processedLinks !== undefined ? processedLinks : existingItem.links,
      tags: tags?.trim() || (tags === null || tags === '' ? undefined : existingItem.tags),
      photo: finalPhotoArray,
      profilePicture: finalProfilePicture,
      groupId: groupId?.trim() || (groupId === null || groupId === '' ? undefined : existingItem.groupId),
      selectedGroups: Array.isArray(selectedGroups) && selectedGroups.length > 0 ? selectedGroups : (selectedGroups === null || (Array.isArray(selectedGroups) && selectedGroups.length === 0) ? undefined : existingItem.selectedGroups),
      generationData: generationData !== undefined ? generationData : existingItem.generationData,
      lineupData: processedLineupData,
      updatedAt: new Date().toISOString()
    }

    // Add takulinks for actress only
    if (type === 'actress') {
      updatedItem.takulinks = takulinks?.trim() || (takulinks === null || takulinks === '' ? undefined : existingItem.takulinks)
    }
    
    // For director, we might want to limit certain fields
    if (type === 'director') {
      // Directors don't need group-related fields
      updatedItem.groupId = undefined
      updatedItem.selectedGroups = undefined
      // Also don't need actress-specific takulinks
      updatedItem.takulinks = undefined
    }

    console.log(`Server: Updating extended ${type} with data:`, updatedItem)
    console.log(`Server: lineupData being saved:`, updatedItem.lineupData)
    await kv.set(`master_${type}_${id}`, JSON.stringify(updatedItem))
    
    console.log(`Server: Successfully updated extended ${type}:`, updatedItem)
    console.log(`Server: lineupData in response:`, updatedItem.lineupData)
    return c.json({ data: updatedItem })
  } catch (error) {
    console.error('Server: Update extended master data error:', error)
    return c.json({ 
      error: `Failed to update extended master data: ${error.message}`,
      details: error?.stack
    }, 500)
  }
}

// Update series data
export async function updateSeriesData(c: Context) {
  try {
    const id = c.req.param('id')
    console.log('Server: Updating series data with ID:', id)
    
    const body = await c.req.json()
    const { titleEn, titleJp, seriesLinks } = body
    console.log('Server: Series update data:', body)

    if (!titleEn?.trim() && !titleJp?.trim()) {
      return c.json({ error: 'At least one title (EN or JP) is required' }, 400)
    }

    // Get existing item
    const existingData = await kv.get(`master_series_${id}`)
    if (!existingData) {
      return c.json({ error: 'Series not found' }, 404)
    }

    const existingItem = JSON.parse(existingData)

    // Check if another series with this title exists (exclude current item)
    const allItems = await kv.getByPrefix(`master_series_`)
    const duplicateItem = allItems.find(item => {
      try {
        const parsed = JSON.parse(item.value)
        if (parsed.id === id) return false
        
        const existingTitleEn = parsed.titleEn?.toLowerCase()?.trim()
        const existingTitleJp = parsed.titleJp?.toLowerCase()?.trim()
        const newTitleEn = titleEn?.toLowerCase()?.trim()
        const newTitleJp = titleJp?.toLowerCase()?.trim()
        
        const enMatch = newTitleEn && existingTitleEn === newTitleEn
        const jpMatch = newTitleJp && existingTitleJp === newTitleJp
        
        return enMatch || jpMatch
      } catch (parseError) {
        console.error('Server: Error parsing series for duplicate check:', parseError)
        return false
      }
    })

    if (duplicateItem) {
      const parsedDuplicate = JSON.parse(duplicateItem.value)
      return c.json({ 
        error: 'Series with this title already exists',
        details: `A series with this title already exists with ID: ${parsedDuplicate.id}`
      }, 400)
    }

    const updatedItem = {
      ...existingItem,
      titleEn: titleEn?.trim() || undefined,
      titleJp: titleJp?.trim() || undefined,
      seriesLinks: seriesLinks?.trim() || undefined,
      updatedAt: new Date().toISOString()
    }

    await kv.set(`master_series_${id}`, JSON.stringify(updatedItem))
    
    console.log('Server: Successfully updated series:', updatedItem)
    return c.json({ data: updatedItem })
  } catch (error) {
    console.error('Server: Update series data error:', error)
    return c.json({ 
      error: `Failed to update series data: ${error.message}`,
      details: error?.stack
    }, 500)
  }
}

// Update studio data
export async function updateStudioData(c: Context) {
  try {
    const id = c.req.param('id')
    console.log('Server: Updating studio data with ID:', id)
    
    const body = await c.req.json()
    const { name, jpname, kanjiName, kanaName, alias, studioLinks } = body
    console.log('Server: Studio update data:', body)

    if (!name?.trim()) {
      return c.json({ error: 'Studio name is required' }, 400)
    }

    // Get existing item
    const existingData = await kv.get(`master_studio_${id}`)
    if (!existingData) {
      return c.json({ error: 'Studio not found' }, 404)
    }

    const existingItem = JSON.parse(existingData)

    // Check for duplicates (exclude current item)
    const allItems = await kv.getByPrefix(`master_studio_`)
    const duplicateItem = allItems.find(item => {
      try {
        const parsed = JSON.parse(item.value)
        if (parsed.id === id) return false
        
        const existingName = parsed.name?.toLowerCase()?.trim()
        const newName = name.toLowerCase().trim()
        
        return existingName === newName
      } catch (parseError) {
        console.error('Server: Error parsing studio for duplicate check:', parseError)
        return false
      }
    })

    if (duplicateItem) {
      const parsedDuplicate = JSON.parse(duplicateItem.value)
      return c.json({ 
        error: 'Studio with this name already exists',
        details: `A studio named "${name}" already exists with ID: ${parsedDuplicate.id}`
      }, 400)
    }

    const updatedItem = {
      ...existingItem,
      name: name.trim(),
      jpname: jpname?.trim() || undefined,
      kanjiName: kanjiName?.trim() || undefined,
      kanaName: kanaName?.trim() || undefined,
      alias: alias?.trim() || undefined,
      studioLinks: studioLinks?.trim() || undefined,
      updatedAt: new Date().toISOString()
    }

    await kv.set(`master_studio_${id}`, JSON.stringify(updatedItem))
    
    console.log('Server: Successfully updated studio:', updatedItem)
    return c.json({ data: updatedItem })
  } catch (error) {
    console.error('Server: Update studio data error:', error)
    return c.json({ 
      error: `Failed to update studio data: ${error.message}`,
      details: error?.stack
    }, 500)
  }
}

// Update label data
export async function updateLabelData(c: Context) {
  try {
    const id = c.req.param('id')
    console.log('Server: Updating label data with ID:', id)
    
    const body = await c.req.json()
    const { name, jpname, kanjiName, kanaName, labelLinks } = body
    console.log('Server: Label update data:', body)

    if (!name?.trim()) {
      return c.json({ error: 'Label name is required' }, 400)
    }

    // Get existing item
    const existingData = await kv.get(`master_label_${id}`)
    if (!existingData) {
      return c.json({ error: 'Label not found' }, 404)
    }

    const existingItem = JSON.parse(existingData)

    // Check for duplicates (exclude current item)
    const allItems = await kv.getByPrefix(`master_label_`)
    const duplicateItem = allItems.find(item => {
      try {
        const parsed = JSON.parse(item.value)
        if (parsed.id === id) return false
        
        const existingName = parsed.name?.toLowerCase()?.trim()
        const newName = name.toLowerCase().trim()
        
        return existingName === newName
      } catch (parseError) {
        console.error('Server: Error parsing label for duplicate check:', parseError)
        return false
      }
    })

    if (duplicateItem) {
      const parsedDuplicate = JSON.parse(duplicateItem.value)
      return c.json({ 
        error: 'Label with this name already exists',
        details: `A label named "${name}" already exists with ID: ${parsedDuplicate.id}`
      }, 400)
    }

    const updatedItem = {
      ...existingItem,
      name: name.trim(),
      jpname: jpname?.trim() || undefined,
      kanjiName: kanjiName?.trim() || undefined,
      kanaName: kanaName?.trim() || undefined,
      labelLinks: labelLinks?.trim() || undefined,
      updatedAt: new Date().toISOString()
    }

    await kv.set(`master_label_${id}`, JSON.stringify(updatedItem))
    
    console.log('Server: Successfully updated label:', updatedItem)
    console.log('Server: Returning label data with fields:', {
      id: updatedItem.id,
      name: updatedItem.name,
      jpname: updatedItem.jpname,
      kanjiName: updatedItem.kanjiName,
      kanaName: updatedItem.kanaName,
      labelLinks: updatedItem.labelLinks
    })
    return c.json({ data: updatedItem })
  } catch (error) {
    console.error('Server: Update label data error:', error)
    return c.json({ 
      error: `Failed to update label data: ${error.message}`,
      details: error?.stack
    }, 500)
  }
}

// Update group data
export async function updateGroupData(c: Context) {
  try {
    const id = c.req.param('id')
    console.log('Server: Updating group data with ID:', id)
    
    const body = await c.req.json()
    const { name, jpname, profilePicture, website, description, gallery } = body
    console.log('Server: Group update data:', body)

    if (!name?.trim()) {
      return c.json({ error: 'Group name is required' }, 400)
    }

    // Get existing item
    const existingData = await kv.get(`master_group_${id}`)
    if (!existingData) {
      return c.json({ error: 'Group not found' }, 404)
    }

    const existingItem = JSON.parse(existingData)

    // Check for duplicates (exclude current item)
    const allItems = await kv.getByPrefix(`master_group_`)
    const duplicateItem = allItems.find(item => {
      try {
        const parsed = JSON.parse(item.value)
        if (parsed.id === id) return false
        
        const existingName = parsed.name?.toLowerCase()?.trim()
        const newName = name.toLowerCase().trim()
        
        return existingName === newName
      } catch (parseError) {
        console.error('Server: Error parsing group for duplicate check:', parseError)
        return false
      }
    })

    if (duplicateItem) {
      const parsedDuplicate = JSON.parse(duplicateItem.value)
      return c.json({ 
        error: 'Group with this name already exists',
        details: `A group named "${name}" already exists with ID: ${parsedDuplicate.id}`
      }, 400)
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
      processedGallery = existingItem.gallery
    }

    const updatedItem = {
      ...existingItem,
      name: name.trim(),
      jpname: jpname?.trim() || (jpname === null || jpname === '' ? undefined : existingItem.jpname),
      profilePicture: profilePicture?.trim() || (profilePicture === null || profilePicture === '' ? undefined : existingItem.profilePicture),
      website: website?.trim() || (website === null || website === '' ? undefined : existingItem.website),
      description: description?.trim() || (description === null || description === '' ? undefined : existingItem.description),
      gallery: processedGallery,
      updatedAt: new Date().toISOString()
    }

    await kv.set(`master_group_${id}`, JSON.stringify(updatedItem))
    
    console.log('Server: Successfully updated group:', updatedItem)
    return c.json({ data: updatedItem })
  } catch (error) {
    console.error('Server: Update group data error:', error)
    return c.json({ 
      error: `Failed to update group data: ${error.message}`,
      details: error?.stack
    }, 500)
  }
}

// Create generation data 
export async function createGenerationData(c: Context) {
  try {
    console.log('Server: Creating generation data')
    const body = await c.req.json()
    const { name, groupId, groupName, estimatedYears, startDate, endDate, description, profilePicture } = body
    console.log('Server: Generation data:', body)

    if (!name?.trim()) {
      return c.json({ error: 'Generation name is required' }, 400)
    }

    if (!groupId?.trim()) {
      return c.json({ error: 'Group ID is required' }, 400)
    }

    // Check if generation already exists within the same group
    console.log(`Server: Checking for existing generation with name: "${name}" in group: "${groupId}"`)
    const existingData = await kv.getByPrefix(`master_generation_`)
    console.log(`Server: Found ${existingData.length} existing generation items`)
    
    const existingItem = existingData.find(item => {
      try {
        const parsed = JSON.parse(item.value)
        const existingName = parsed.name?.toLowerCase()?.trim()
        const existingGroupId = parsed.groupId
        const newName = name.toLowerCase().trim()
        console.log(`Server: Comparing generation - existing: "${existingName}" in group "${existingGroupId}" with new: "${newName}" in group "${groupId}"`)
        
        const isExactMatch = existingName === newName && existingGroupId === groupId
        if (isExactMatch) {
          console.log(`Server: Exact match found in generation: "${existingName}" === "${newName}" in same group`)
        }
        return isExactMatch
      } catch (parseError) {
        console.error('Server: Error parsing existing generation for duplicate check:', parseError)
        return false
      }
    })

    if (existingItem) {
      const parsedExisting = JSON.parse(existingItem.value)
      console.log(`Server: Duplicate generation found: "${name}" in group "${groupId}" (ID: ${parsedExisting.id})`)
      return c.json({ 
        error: 'Generation with this name already exists in this group',
        details: `A generation named "${name}" already exists in this group with ID: ${parsedExisting.id}`
      }, 400)
    }
    
    console.log(`Server: No duplicate generation found for "${name}" in group "${groupId}" - safe to create`)

    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newItem: MasterDataItem = {
      id,
      name: name.trim(),
      type: 'generation',
      createdAt: new Date().toISOString(),
      groupId: groupId.trim(),
      groupName: groupName?.trim() || undefined,
      estimatedYears: estimatedYears?.trim() || undefined,
      startDate: startDate?.trim() || undefined,
      endDate: endDate?.trim() || undefined,
      description: description?.trim() || undefined,
      profilePicture: profilePicture?.trim() || undefined
    }

    console.log(`Server: Saving generation with ID: ${id}`)
    await kv.set(`master_generation_${id}`, JSON.stringify(newItem))
    
    console.log('Server: Successfully created generation:', newItem)
    return c.json({ data: newItem })
  } catch (error) {
    console.error('Server: Create generation data error:', error)
    return c.json({ 
      error: `Failed to create generation data: ${error.message}`,
      details: error?.stack
    }, 500)
  }
}

// Create lineup data
export async function createLineupData(c: Context) {
  try {
    console.log('Server: Creating lineup data')
    const body = await c.req.json()
    const { name, generationId, generationName, lineupType, lineupOrder, description } = body
    console.log('Server: Lineup data:', body)

    if (!name?.trim()) {
      return c.json({ error: 'Lineup name is required' }, 400)
    }

    if (!generationId?.trim()) {
      return c.json({ error: 'Generation ID is required' }, 400)
    }

    // Check if lineup already exists within the same generation
    console.log(`Server: Checking for existing lineup with name: "${name}" in generation: "${generationId}"`)
    const existingData = await kv.getByPrefix(`master_lineup_`)
    console.log(`Server: Found ${existingData.length} existing lineup items`)
    
    const existingItem = existingData.find(item => {
      const lineup = item.value
      return lineup.name?.toLowerCase() === name.toLowerCase() && 
             lineup.generationId === generationId
    })

    if (existingItem) {
      console.log(`Server: Lineup "${name}" already exists in generation "${generationId}"`)
      return c.json({ error: `Lineup "${name}" already exists in this generation` }, 400)
    }

    const id = crypto.randomUUID()
    const newItem: MasterDataItem = {
      id,
      name: name.trim(),
      type: 'lineup',
      createdAt: new Date().toISOString(),
      generationId: generationId.trim(),
      generationName: generationName?.trim() || undefined,
      lineupType: lineupType?.trim() || 'Main',
      lineupOrder: lineupOrder || 1,
      description: description?.trim() || undefined
    }

    console.log(`Server: Saving lineup with ID: ${id}`)
    await kv.set(`master_lineup_${id}`, JSON.stringify(newItem))
    
    console.log('Server: Successfully created lineup:', newItem)
    return c.json({ data: newItem })
  } catch (error) {
    console.error('Server: Create lineup data error:', error)
    return c.json({ 
      error: `Failed to create lineup data: ${error.message}`,
      details: error?.stack
    }, 500)
  }
}

// Update generation data
export async function updateGenerationData(c: Context) {
  try {
    const id = c.req.param('id')
    console.log('Server: Updating generation data with ID:', id)
    
    const body = await c.req.json()
    const { name, groupId, groupName, estimatedYears, startDate, endDate, description, profilePicture } = body
    console.log('Server: Generation update data:', body)
    console.log('Server: Extracted parameters:', { name, groupId, groupName, estimatedYears, startDate, endDate, description, profilePicture })

    if (!name?.trim()) {
      return c.json({ error: 'Generation name is required' }, 400)
    }

    if (!groupId?.trim()) {
      return c.json({ error: 'Group ID is required' }, 400)
    }

    // Get existing item
    const existingData = await kv.get(`master_generation_${id}`)
    if (!existingData) {
      return c.json({ error: 'Generation not found' }, 404)
    }

    const existingItem = JSON.parse(existingData)

    // Check for duplicates (exclude current item)
    const allItems = await kv.getByPrefix(`master_generation_`)
    const duplicateItem = allItems.find(item => {
      try {
        const parsed = JSON.parse(item.value)
        if (parsed.id === id) return false
        
        const existingName = parsed.name?.toLowerCase()?.trim()
        const existingGroupId = parsed.groupId
        const newName = name.toLowerCase().trim()
        
        return existingName === newName && existingGroupId === groupId
      } catch (parseError) {
        console.error('Server: Error parsing generation for duplicate check:', parseError)
        return false
      }
    })

    if (duplicateItem) {
      const parsedDuplicate = JSON.parse(duplicateItem.value)
      return c.json({ 
        error: 'Generation with this name already exists in this group',
        details: `A generation named "${name}" already exists in this group with ID: ${parsedDuplicate.id}`
      }, 400)
    }

    const updatedItem = {
      ...existingItem,
      name: name.trim(),
      groupId: groupId.trim(),
      groupName: groupName?.trim() || undefined,
      estimatedYears: estimatedYears?.trim() || undefined,
      startDate: startDate?.trim() || undefined,
      endDate: endDate?.trim() || undefined,
      description: description?.trim() || undefined,
      profilePicture: profilePicture?.trim() || undefined,
      updatedAt: new Date().toISOString()
    }

    await kv.set(`master_generation_${id}`, JSON.stringify(updatedItem))
    
    console.log('Server: Successfully updated generation:', updatedItem)
    return c.json({ data: updatedItem })
  } catch (error) {
    console.error('Server: Update generation data error:', error)
    return c.json({ 
      error: `Failed to update generation data: ${error.message}`,
      details: error?.stack
    }, 500)
  }
}

// Update lineup data
export async function updateLineupData(c: Context) {
  try {
    const id = c.req.param('id')
    console.log('Server: Updating lineup data with ID:', id)
    
    const body = await c.req.json()
    const { name, generationId, generationName, lineupType, lineupOrder, description } = body
    console.log('Server: Lineup update data:', body)

    if (!name?.trim()) {
      return c.json({ error: 'Lineup name is required' }, 400)
    }

    if (!generationId?.trim()) {
      return c.json({ error: 'Generation ID is required' }, 400)
    }

    // Get existing item
    const existingData = await kv.get(`master_lineup_${id}`)
    if (!existingData) {
      console.log(`Server: Lineup with ID ${id} not found`)
      return c.json({ error: 'Lineup not found' }, 404)
    }

    const existingItem = JSON.parse(existingData)
    console.log('Server: Found lineup to update:', existingItem)

    // Check if lineup name already exists within the same generation (excluding current lineup)
    const allLineups = await kv.getByPrefix(`master_lineup_`)
    const duplicateLineup = allLineups.find(item => {
      const lineup = item.value
      return lineup.name?.toLowerCase() === name.toLowerCase() && 
             lineup.generationId === generationId &&
             lineup.id !== id
    })

    if (duplicateLineup) {
      console.log(`Server: Lineup "${name}" already exists in generation "${generationId}"`)
      return c.json({ error: `Lineup "${name}" already exists in this generation` }, 400)
    }

    // Update the item
    const updatedItem: MasterDataItem = {
      ...existingItem,
      name: name.trim(),
      generationId: generationId.trim(),
      generationName: generationName?.trim() || undefined,
      lineupType: lineupType?.trim() || 'Main',
      lineupOrder: lineupOrder || 1,
      description: description?.trim() || undefined,
      updatedAt: new Date().toISOString()
    }

    console.log(`Server: Saving updated lineup with ID: ${id}`)
    await kv.set(`master_lineup_${id}`, JSON.stringify(updatedItem))
    
    console.log('Server: Successfully updated lineup:', updatedItem)
    return c.json({ data: updatedItem })
  } catch (error) {
    console.error('Server: Update lineup data error:', error)
    return c.json({ 
      error: `Failed to update lineup data: ${error.message}`,
      details: error?.stack
    }, 500)
  }
}

// Delete master data item
export async function deleteMasterData(c: Context) {
  try {
    const type = c.req.param('type')
    const id = c.req.param('id')
    console.log(`Server: Deleting ${type} with ID: ${id}`)
    
    // Get existing item first to verify it exists
    const existingData = await kv.get(`master_${type}_${id}`)
    
    if (!existingData) {
      console.log(`Server: ${type} with ID ${id} not found`)
      return c.json({ error: `${type} not found` }, 404)
    }

    const existingItem = JSON.parse(existingData)
    console.log(`Server: Found ${type} to delete:`, existingItem)

    // Delete the item
    await kv.del(`master_${type}_${id}`)
    
    console.log(`Server: Successfully deleted ${type}:`, existingItem)
    return c.json({ message: `${type} deleted successfully`, data: existingItem })
  } catch (error) {
    console.error('Server: Delete master data error:', error)
    return c.json({ 
      error: `Failed to delete master data: ${error.message}`,
      details: error?.stack
    }, 500)
  }
}

// Update simple master data with sync functionality
export async function updateSimpleWithSync(c: Context) {
  try {
    const type = c.req.param('type')
    const id = c.req.param('id')
    console.log(`Server: Updating simple ${type} with sync - ID: ${id}`)
    
    if (!type || !['type', 'tag'].includes(type)) {
      console.log(`Server: Invalid type for simple update with sync: ${type}`)
      return c.json({ error: 'Invalid type parameter for update with sync' }, 400)
    }

    const body = await c.req.json()
    const { name } = body
    console.log(`Server: Updating simple ${type} with sync - data:`, body)

    if (!name?.trim()) {
      return c.json({ error: 'Name is required' }, 400)
    }

    // Get existing item
    console.log(`Server: Fetching existing ${type} with ID: ${id}`)
    const existingData = await kv.get(`master_${type}_${id}`)
    
    if (!existingData) {
      console.log(`Server: ${type} with ID ${id} not found`)
      return c.json({ error: `${type} not found` }, 404)
    }

    const existingItem = JSON.parse(existingData)
    console.log(`Server: Found existing ${type}:`, existingItem)
    
    // Store the old name for sync purposes
    const oldName = existingItem.name
    const newName = name.trim()

    // Skip sync if name hasn't changed
    if (oldName === newName) {
      console.log(`Server: Name unchanged, skipping sync`)
      const updatedItem = {
        ...existingItem,
        updatedAt: new Date().toISOString()
      }
      await kv.set(`master_${type}_${id}`, JSON.stringify(updatedItem))
      return c.json({ 
        data: updatedItem, 
        sync: { moviesUpdated: 0, scMoviesUpdated: 0 }
      })
    }

    // Check if another item with this name exists (exclude current item)
    console.log(`Server: Checking for duplicate ${type} name: "${newName}"`)
    const allItems = await kv.getByPrefix(`master_${type}_`)
    
    const duplicateItem = allItems.find(item => {
      try {
        const parsed = JSON.parse(item.value)
        const existingName = parsed.name?.toLowerCase()?.trim()
        const checkName = newName.toLowerCase().trim()
        
        // Don't compare with self
        if (parsed.id === id) return false
        
        const isExactMatch = existingName === checkName
        if (isExactMatch) {
          console.log(`Server: Duplicate found - ID: ${parsed.id}, name: "${existingName}"`)
        }
        return isExactMatch
      } catch (parseError) {
        console.error('Server: Error parsing item for duplicate check:', parseError)
        return false
      }
    })

    if (duplicateItem) {
      const parsedDuplicate = JSON.parse(duplicateItem.value)
      console.log(`Server: Duplicate ${type} found: "${newName}" (existing ID: ${parsedDuplicate.id})`)
      return c.json({ 
        error: `${type.charAt(0).toUpperCase() + type.slice(1)} with this name already exists`,
        details: `A ${type} named "${newName}" already exists with ID: ${parsedDuplicate.id}`
      }, 400)
    }

    // Update the item first
    const updatedItem = {
      ...existingItem,
      name: newName,
      updatedAt: new Date().toISOString()
    }

    console.log(`Server: Updating ${type} with data:`, updatedItem)
    await kv.set(`master_${type}_${id}`, JSON.stringify(updatedItem))
    
    // Now perform sync operations for movies and SC movies
    console.log(`Server: Starting sync operations for ${type} name change: "${oldName}" -> "${newName}"`)
    
    let moviesUpdated = 0
    let scMoviesUpdated = 0
    
    try {
      // Update regular movies
      console.log(`Server: Syncing regular movies for ${type} change`)
      const movieData = await kv.getByPrefix('movie:')
      console.log(`Server: Found ${movieData.length} movies to check for sync`)
      
      for (const movieItem of movieData) {
        try {
          const movie = movieItem.value
          let needsUpdate = false
          let updatedMovie = { ...movie }
          
          // Check if this movie uses the old type/tag name
          if (type === 'type' && movie.type === oldName) {
            updatedMovie.type = newName
            needsUpdate = true
            console.log(`Server: Updating type in movie ${movie.id}: "${oldName}" -> "${newName}"`)
          }
          
          if (type === 'tag' && movie.tags) {
            // Handle comma-separated tags list
            const tagsList = movie.tags.split(',').map(tag => tag.trim())
            const updatedTagsList = tagsList.map(tag => tag === oldName ? newName : tag)
            
            if (JSON.stringify(tagsList) !== JSON.stringify(updatedTagsList)) {
              updatedMovie.tags = updatedTagsList.join(', ')
              needsUpdate = true
              console.log(`Server: Updating tags in movie ${movie.id}: "${oldName}" -> "${newName}"`)
            }
          }
          
          // Save updated movie if changes were made
          if (needsUpdate) {
            updatedMovie.updatedAt = new Date().toISOString()
            await kv.set(movieItem.key, updatedMovie)
            moviesUpdated++
            console.log(`Server: Successfully updated movie ${movie.id}`)
          }
          
        } catch (movieUpdateError) {
          console.error(`Server: Error updating movie ${movieItem.value.id}:`, movieUpdateError)
          // Continue with other movies even if one fails
        }
      }
      
      // Update SC movies
      console.log(`Server: Syncing SC movies for ${type} change`)
      const scMovieData = await kv.getByPrefix('scmovie:')
      console.log(`Server: Found ${scMovieData.length} SC movies to check for sync`)
      
      for (const scMovieItem of scMovieData) {
        try {
          const scMovie = scMovieItem.value
          let needsUpdate = false
          let updatedSCMovie = { ...scMovie }
          
          // SC movies use different field names
          if (type === 'type' && scMovie.type === oldName) {
            updatedSCMovie.type = newName
            needsUpdate = true
            console.log(`Server: Updating type in SC movie ${scMovie.id}: "${oldName}" -> "${newName}"`)
          }
          
          if (type === 'tag' && scMovie.tags) {
            // Handle comma-separated tags list
            const tagsList = scMovie.tags.split(',').map(tag => tag.trim())
            const updatedTagsList = tagsList.map(tag => tag === oldName ? newName : tag)
            
            if (JSON.stringify(tagsList) !== JSON.stringify(updatedTagsList)) {
              updatedSCMovie.tags = updatedTagsList.join(', ')
              needsUpdate = true
              console.log(`Server: Updating tags in SC movie ${scMovie.id}: "${oldName}" -> "${newName}"`)
            }
          }
          
          // Save updated SC movie if changes were made
          if (needsUpdate) {
            updatedSCMovie.updatedAt = new Date().toISOString()
            await kv.set(scMovieItem.key, updatedSCMovie)
            scMoviesUpdated++
            console.log(`Server: Successfully updated SC movie ${scMovie.id}`)
          }
          
        } catch (scMovieUpdateError) {
          console.error(`Server: Error updating SC movie ${scMovieItem.value.id}:`, scMovieUpdateError)
          // Continue with other SC movies even if one fails
        }
      }
      
      console.log(`Server: Completed sync - updated ${moviesUpdated} regular movies and ${scMoviesUpdated} SC movies`)
      
    } catch (syncError) {
      console.error(`Server: Error during sync operations:`, syncError)
      // Don't fail the whole operation if sync fails
    }
    
    console.log(`Server: Successfully updated simple ${type} with sync:`, updatedItem)
    return c.json({ 
      data: updatedItem, 
      sync: { 
        moviesUpdated, 
        scMoviesUpdated 
      }
    })
  } catch (error) {
    console.error('Server: Update simple master data with sync error:', error)
    return c.json({ 
      error: `Failed to update master data with sync: ${error.message}`,
      details: error?.stack
    }, 500)
  }
}

// Update extended master data with sync functionality  
export async function updateExtendedWithSync(c: Context) {
  try {
    const type = c.req.param('type')
    const id = c.req.param('id')
    console.log(`Server: Updating extended ${type} with sync - ID: ${id}`)
    
    const validTypesWithSync = ['actor', 'actress', 'director', 'series', 'studio', 'label', 'group', 'generation', 'lineup']
    
    if (!type || !validTypesWithSync.includes(type)) {
      console.log(`Server: Invalid type for extended update with sync: ${type}`)
      return c.json({ error: 'Invalid type parameter for update with sync' }, 400)
    }

    const body = await c.req.json()
    console.log(`Server: Updating extended ${type} with sync - data:`, body)

    // Get existing item to get the old name
    const existingData = await kv.get(`master_${type}_${id}`)
    if (!existingData) {
      console.log(`Server: ${type} with ID ${id} not found`)
      return c.json({ error: `${type} not found` }, 404)
    }

    const existingItem = JSON.parse(existingData)
    const oldName = existingItem.name || existingItem.titleEn // For series, use titleEn as the name

    // First update the master data item itself
    let updatedResult
    if (type === 'series') {
      updatedResult = await updateSeriesData(c)
    } else if (type === 'studio') {
      updatedResult = await updateStudioData(c)
    } else if (type === 'label') {
      console.log('Server: Calling updateLabelData for label type')
      updatedResult = await updateLabelData(c)
    } else if (type === 'group') {
      updatedResult = await updateGroupData(c)
    } else if (type === 'generation') {
      updatedResult = await updateGenerationData(c)
    } else {
      updatedResult = await updateExtendedMasterData(c)
    }

    // If the update failed, return the error
    if (!updatedResult.ok) {
      return updatedResult
    }

    const updatedData = await updatedResult.json()
    console.log('Server: Received updated data from updateLabelData:', updatedData)
    const newName = updatedData.data.name || updatedData.data.titleEn

    // Skip sync if name hasn't changed or if this type doesn't affect movies
    if (oldName === newName || !['actor', 'actress', 'director'].includes(type)) {
      console.log(`Server: Name unchanged or type doesn't affect movies, skipping sync`)
      console.log('Server: Returning label data from updateExtendedMasterDataWithSync:', updatedData.data)
      return c.json({ 
        data: updatedData.data, 
        sync: { moviesUpdated: 0, scMoviesUpdated: 0 }
      })
    }

    // Now perform sync operations for movies and SC movies
    console.log(`Server: Starting sync operations for ${type} name change: "${oldName}" -> "${newName}"`)
    
    let moviesUpdated = 0
    let scMoviesUpdated = 0
    
    try {
      // Update regular movies
      if (['actor', 'actress', 'director'].includes(type)) {
        moviesUpdated = await syncCastNameInMovies(type as 'actor' | 'actress' | 'director', oldName, newName)
        scMoviesUpdated = await syncCastNameInSCMovies(type as 'actor' | 'actress' | 'director', oldName, newName)
      }
      
      console.log(`Server: Completed sync - updated ${moviesUpdated} regular movies and ${scMoviesUpdated} SC movies`)
      
    } catch (syncError) {
      console.error(`Server: Error during sync operations:`, syncError)
      // Don't fail the whole operation if sync fails
    }
    
    console.log(`Server: Successfully updated extended ${type} with sync:`, updatedData.data)
    return c.json({ 
      data: updatedData.data, 
      sync: { 
        moviesUpdated, 
        scMoviesUpdated 
      }
    })
  } catch (error) {
    console.error('Server: Update extended master data with sync error:', error)
    return c.json({ 
      error: `Failed to update extended master data with sync: ${error.message}`,
      details: error?.stack
    }, 500)
  }
}