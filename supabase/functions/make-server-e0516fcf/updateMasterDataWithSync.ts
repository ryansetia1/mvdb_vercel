import { Context } from 'npm:hono'
import * as kv from './kv_store.ts'
import { updateGroupData } from './updateGroupData.ts'

// Master data item interface for type safety
interface MasterDataItem {
  id: string
  name?: string
  titleEn?: string
  titleJp?: string
  type: string
  createdAt: string
  seriesLinks?: string
  studioLinks?: string
  labelLinks?: string
  jpname?: string
  kanjiName?: string // Kanji name for Japanese characters
  kanaName?: string // Kana name for Japanese pronunciation
  alias?: string
  profilePicture?: string
  website?: string
  description?: string
  updatedAt?: string
}

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

// Helper function to sync type name changes across all movie records
async function syncTypeNameInMovies(oldName: string, newName: string): Promise<number> {
  console.log(`Server: Starting sync for type name change: "${oldName}" -> "${newName}"`)
  
  try {
    // Get all movie records
    const movieData = await kv.getByPrefix('movie:')
    console.log(`Server: Found ${movieData.length} movies to check for type sync`)
    
    let updatedCount = 0
    
    for (const movieItem of movieData) {
      try {
        const movie = movieItem.value
        let needsUpdate = false
        let updatedMovie = { ...movie }
        
        // Check and update type field
        if (movie.type === oldName) {
          updatedMovie.type = newName
          needsUpdate = true
          console.log(`Server: Updating type in movie ${movie.id}: "${oldName}" -> "${newName}"`)
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
    
    console.log(`Server: Completed type sync - updated ${updatedCount} movies`)
    return updatedCount
    
  } catch (error) {
    console.error(`Server: Error during type name sync:`, error)
    throw error
  }
}

// Helper function to sync type name changes in SC movies
async function syncTypeNameInSCMovies(oldName: string, newName: string): Promise<number> {
  console.log(`Server: Starting SC movies sync for type name change: "${oldName}" -> "${newName}"`)
  
  try {
    // Get all SC movie records
    const scMovieData = await kv.getByPrefix('scmovie:')
    console.log(`Server: Found ${scMovieData.length} SC movies to check for type sync`)
    
    let updatedCount = 0
    
    for (const scMovieItem of scMovieData) {
      try {
        const scMovie = scMovieItem.value
        let needsUpdate = false
        let updatedSCMovie = { ...scMovie }
        
        // Check and update type field in SC movies
        if (scMovie.type === oldName) {
          updatedSCMovie.type = newName
          needsUpdate = true
          console.log(`Server: Updating type in SC movie ${scMovie.id}: "${oldName}" -> "${newName}"`)
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
    
    console.log(`Server: Completed SC movies type sync - updated ${updatedCount} SC movies`)
    return updatedCount
    
  } catch (error) {
    console.error(`Server: Error during SC movies type name sync:`, error)
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

// Update simple master data item (type, tag) with sync functionality
export async function updateSimpleMasterDataWithSync(c: Context) {
  try {
    const type = c.req.param('type')
    const id = c.req.param('id')
    console.log(`Server: Updating simple master data with sync for type: ${type}, id: ${id}`)
    
    if (!type || !['type', 'tag'].includes(type)) {
      return c.json({ error: 'Invalid type parameter. Only "type" and "tag" are supported for simple updates.' }, 400)
    }

    if (!id) {
      return c.json({ error: 'ID is required' }, 400)
    }

    const body = await c.req.json()
    const { name } = body
    console.log(`Server: Updating ${type} ${id} with name: "${name}"`)

    if (!name?.trim()) {
      return c.json({ error: 'Name is required' }, 400)
    }

    // Get existing item
    const existingData = await kv.get(`master_${type}_${id}`)
    if (!existingData) {
      console.log(`Server: Item not found - master_${type}_${id}`)
      return c.json({ error: 'Item not found' }, 404)
    }

    const existingItem = JSON.parse(existingData)
    console.log(`Server: Found existing item:`, existingItem)

    // Store old name for sync purposes
    const oldName = existingItem.name
    const newName = name.trim()
    const nameChanged = oldName !== newName

    console.log(`Server: Name change check - old: "${oldName}", new: "${newName}", changed: ${nameChanged}`)

    // Enhanced duplicate check with detailed logging
    const allData = await kv.getByPrefix(`master_${type}_`)
    console.log(`Server: Checking for duplicates among ${allData.length} items`)
    
    const duplicateItem = allData.find(item => {
      try {
        const parsed = JSON.parse(item.value)
        const isDifferentId = parsed.id !== id
        const isSameName = parsed.name?.toLowerCase()?.trim() === name.toLowerCase()?.trim()
        
        console.log(`Server: Duplicate check - ID: ${parsed.id}, Name: "${parsed.name}", Different ID: ${isDifferentId}, Same Name: ${isSameName}`)
        
        return isDifferentId && isSameName
      } catch (parseError) {
        console.error('Server: Error parsing item for duplicate check:', parseError)
        return false
      }
    })

    if (duplicateItem) {
      const duplicateParsed = JSON.parse(duplicateItem.value)
      console.log(`Server: Found duplicate item:`, duplicateParsed)
      return c.json({ 
        error: 'Item with this name already exists',
        details: `Another ${type} with name "${name}" already exists with ID: ${duplicateParsed.id}`
      }, 400)
    }

    console.log(`Server: No duplicates found, proceeding with update`)

    const updatedItem = {
      ...existingItem,
      name: newName,
      updatedAt: new Date().toISOString()
    }

    console.log(`Server: Saving updated ${type} item:`, updatedItem)
    await kv.set(`master_${type}_${id}`, JSON.stringify(updatedItem))

    // Sync type name changes in movie records if name changed and type is 'type'
    let syncResults = { moviesUpdated: 0, scMoviesUpdated: 0 }
    
    if (nameChanged && type === 'type') {
      console.log(`Server: Type name changed from "${oldName}" to "${newName}", syncing with movie records`)
      try {
        const moviesSynced = await syncTypeNameInMovies(oldName, newName)
        const scMoviesSynced = await syncTypeNameInSCMovies(oldName, newName)
        
        syncResults = { 
          moviesUpdated: moviesSynced, 
          scMoviesUpdated: scMoviesSynced 
        }
        
        console.log(`Server: Type sync completed - Movies: ${moviesSynced}, SC Movies: ${scMoviesSynced}`)
      } catch (syncError) {
        console.error(`Server: Error during type sync:`, syncError)
        // Don't fail the update even if sync fails, but log the error
      }
    }

    console.log(`Server: Successfully updated simple ${type}:`, updatedItem)
    return c.json({ 
      data: updatedItem,
      sync: syncResults
    })
    
  } catch (error) {
    console.error('Server: Update simple master data error:', error)
    return c.json({ 
      error: `Failed to update simple master data: ${error.message}`,
      details: error?.stack
    }, 500)
  }
}

// Update extended master data item with sync functionality
export async function updateExtendedMasterDataWithSync(c: Context) {
  try {
    const type = c.req.param('type')
    const id = c.req.param('id')
    console.log(`Server: Updating extended master data with sync for type: ${type}, id: ${id}`)
    
    // Handle series separately
    if (type === 'series') {
      return await updateSeriesData(c)
    }
    
    // Handle studio separately
    if (type === 'studio') {
      return await updateStudioData(c)
    }
    
    // Handle label separately
    if (type === 'label') {
      return await updateLabelData(c)
    }
    
    // Handle group separately
    if (type === 'group') {
      return await updateGroupData(c)
    }
    
    if (!type || !['actor', 'actress', 'director'].includes(type)) {
      return c.json({ error: 'Invalid type parameter' }, 400)
    }

    if (!id) {
      return c.json({ error: 'ID is required' }, 400)
    }

    const body = await c.req.json()
    const { name, jpname, kanjiName, kanaName, birthdate, alias, links, takulinks, tags, photo, profilePicture, groupId, selectedGroups, groupData } = body
    console.log(`Server: Updating ${type} ${id} with data:`, body)

    if (!name?.trim()) {
      return c.json({ error: 'Name is required' }, 400)
    }

    // Get existing item
    const existingData = await kv.get(`master_${type}_${id}`)
    if (!existingData) {
      console.log(`Server: Item not found - master_${type}_${id}`)
      return c.json({ error: 'Item not found' }, 404)
    }

    const existingItem = JSON.parse(existingData)
    console.log(`Server: Found existing item:`, existingItem)

    // Store old name for sync purposes
    const oldName = existingItem.name
    const newName = name.trim()
    const nameChanged = oldName !== newName

    console.log(`Server: Name change check - old: "${oldName}", new: "${newName}", changed: ${nameChanged}`)

    // Enhanced duplicate check with detailed logging
    const allData = await kv.getByPrefix(`master_${type}_`)
    console.log(`Server: Checking for duplicates among ${allData.length} items`)
    
    const duplicateItem = allData.find(item => {
      try {
        const parsed = JSON.parse(item.value)
        const isDifferentId = parsed.id !== id
        const isSameName = parsed.name?.toLowerCase()?.trim() === name.toLowerCase()?.trim()
        
        console.log(`Server: Duplicate check - ID: ${parsed.id}, Name: "${parsed.name}", Different ID: ${isDifferentId}, Same Name: ${isSameName}`)
        
        return isDifferentId && isSameName
      } catch (parseError) {
        console.error('Server: Error parsing item for duplicate check:', parseError)
        return false
      }
    })

    if (duplicateItem) {
      const duplicateParsed = JSON.parse(duplicateItem.value)
      console.log(`Server: Found duplicate item:`, duplicateParsed)
      return c.json({ 
        error: 'Item with this name already exists',
        details: `Another ${type} with name "${name}" already exists with ID: ${duplicateParsed.id}`
      }, 400)
    }

    console.log(`Server: No duplicates found, proceeding with update`)

    // Process links - convert from array or keep existing format for backward compatibility
    let processedLinks: any[] | undefined = undefined
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
    const finalProfilePicture = uniquePhotos.length > 0 ? uniquePhotos[0] : undefined
    const finalPhotoArray = uniquePhotos.length > 1 ? uniquePhotos.slice(1) : undefined

    const updatedItem = {
      ...existingItem,
      name: newName,
      jpname: jpname?.trim() || undefined,
      kanjiName: kanjiName?.trim() || undefined,
      kanaName: kanaName?.trim() || undefined,
      birthdate: birthdate?.trim() || undefined,
      alias: alias?.trim() || (alias === null || alias === '' ? undefined : existingItem.alias),
      links: processedLinks,
      tags: tags?.trim() || undefined,
      photo: finalPhotoArray,
      profilePicture: finalProfilePicture,
      groupId: groupId?.trim() || undefined,
      selectedGroups: Array.isArray(selectedGroups) && selectedGroups.length > 0 ? selectedGroups : undefined,
      groupData: groupData || undefined,
      updatedAt: new Date().toISOString()
    }

    // Add takulinks for actress only
    if (type === 'actress' && takulinks?.trim()) {
      updatedItem.takulinks = takulinks.trim()
    }
    
    // For director, we might want to limit certain fields
    if (type === 'director') {
      // Directors don't need group-related fields
      updatedItem.groupId = undefined
      updatedItem.selectedGroups = undefined
      updatedItem.groupData = undefined
      // Also don't need actress-specific takulinks
      updatedItem.takulinks = undefined
    }

    console.log(`Server: Saving updated ${type} item:`, updatedItem)
    await kv.set(`master_${type}_${id}`, JSON.stringify(updatedItem))

    // Sync cast name changes in movie records if name changed
    let syncResults = { moviesUpdated: 0, scMoviesUpdated: 0 }
    
    if (nameChanged) {
      console.log(`Server: Name changed from "${oldName}" to "${newName}", syncing with movie records`)
      try {
        const moviesSynced = await syncCastNameInMovies(type as 'actor' | 'actress' | 'director', oldName, newName)
        const scMoviesSynced = await syncCastNameInSCMovies(type as 'actor' | 'actress' | 'director', oldName, newName)
        
        syncResults = { 
          moviesUpdated: moviesSynced, 
          scMoviesUpdated: scMoviesSynced 
        }
        
        console.log(`Server: Sync completed - Movies: ${moviesSynced}, SC Movies: ${scMoviesSynced}`)
      } catch (syncError) {
        console.error(`Server: Error during sync:`, syncError)
        // Don't fail the update even if sync fails, but log the error
      }
    }

    console.log(`Server: Successfully updated extended ${type}:`, updatedItem)
    return c.json({ 
      data: updatedItem,
      sync: syncResults
    })
    
  } catch (error) {
    console.error('Server: Update extended master data error:', error)
    return c.json({ 
      error: `Failed to update extended master data: ${error.message}`,
      details: error?.stack
    }, 500)
  }
}

// Update series data with dual language titles
async function updateSeriesData(c: Context) {
  try {
    const id = c.req.param('id')
    console.log('Server: Updating series data for ID:', id)
    
    const body = await c.req.json()
    const { titleEn, titleJp, seriesLinks } = body
    console.log('Server: Update series data received:', { titleEn, titleJp, seriesLinks })

    if (!titleEn?.trim() && !titleJp?.trim()) {
      return c.json({ error: 'At least one title (EN or JP) is required' }, 400)
    }

    // Get existing item
    const existingData = await kv.get(`master_series_${id}`)
    if (!existingData) {
      console.log(`Server: Series not found - master_series_${id}`)
      return c.json({ error: 'Series not found' }, 404)
    }

    const existingItem = JSON.parse(existingData)
    console.log(`Server: Found existing series:`, existingItem)

    // Check for duplicates (excluding current item)
    const allData = await kv.getByPrefix(`master_series_`)
    const duplicateItem = allData.find(item => {
      try {
        const parsed = JSON.parse(item.value)
        const isDifferentId = parsed.id !== id
        const enMatch = titleEn?.trim() && parsed.titleEn?.toLowerCase()?.trim() === titleEn.toLowerCase().trim()
        const jpMatch = titleJp?.trim() && parsed.titleJp?.toLowerCase()?.trim() === titleJp.toLowerCase().trim()
        
        return isDifferentId && (enMatch || jpMatch)
      } catch (parseError) {
        return false
      }
    })

    if (duplicateItem) {
      const duplicateParsed = JSON.parse(duplicateItem.value)
      return c.json({ 
        error: 'Series with this title already exists',
        details: `Another series with this title already exists with ID: ${duplicateParsed.id}`
      }, 400)
    }

    const updatedItem: MasterDataItem = {
      ...existingItem,
      titleEn: titleEn?.trim() || undefined,
      titleJp: titleJp?.trim() || undefined,
      seriesLinks: seriesLinks?.trim() || undefined,
      updatedAt: new Date().toISOString()
    }

    console.log(`Server: Saving updated series with ID: ${id}`)
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

// Update studio data with links
async function updateStudioData(c: Context) {
  try {
    const id = c.req.param('id')
    console.log('Server: Updating studio data for ID:', id)
    
    const body = await c.req.json()
    const { name, jpname, alias, studioLinks } = body
    console.log('Server: Update studio data received:', { name, jpname, alias, studioLinks })

    if (!name?.trim()) {
      return c.json({ error: 'Studio name is required' }, 400)
    }

    // Get existing item
    const existingData = await kv.get(`master_studio_${id}`)
    if (!existingData) {
      console.log(`Server: Studio not found - master_studio_${id}`)
      return c.json({ error: 'Studio not found' }, 404)
    }

    const existingItem = JSON.parse(existingData)
    console.log(`Server: Found existing studio:`, existingItem)

    // Check for duplicates (excluding current item)
    const allData = await kv.getByPrefix(`master_studio_`)
    const duplicateItem = allData.find(item => {
      try {
        const parsed = JSON.parse(item.value)
        const isDifferentId = parsed.id !== id
        const isSameName = parsed.name?.toLowerCase()?.trim() === name.toLowerCase()?.trim()
        
        return isDifferentId && isSameName
      } catch (parseError) {
        return false
      }
    })

    if (duplicateItem) {
      const duplicateParsed = JSON.parse(duplicateItem.value)
      return c.json({ 
        error: 'Studio with this name already exists',
        details: `Another studio with name "${name}" already exists with ID: ${duplicateParsed.id}`
      }, 400)
    }

    const updatedItem: MasterDataItem = {
      ...existingItem,
      name: name.trim(),
      jpname: jpname?.trim() || undefined,
      alias: alias?.trim() || undefined,
      studioLinks: studioLinks?.trim() || undefined,
      updatedAt: new Date().toISOString()
    }

    console.log(`Server: Saving updated studio with ID: ${id}`)
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

// Update label data with links
async function updateLabelData(c: Context) {
  try {
    const id = c.req.param('id')
    console.log('Server: Updating label data for ID:', id)
    
    const body = await c.req.json()
    const { name, jpname, kanjiName, kanaName, labelLinks } = body
    console.log('Server: Update label data received:', { name, jpname, kanjiName, kanaName, labelLinks })

    if (!name?.trim()) {
      return c.json({ error: 'Label name is required' }, 400)
    }

    // Get existing item
    const existingData = await kv.get(`master_label_${id}`)
    if (!existingData) {
      console.log(`Server: Label not found - master_label_${id}`)
      return c.json({ error: 'Label not found' }, 404)
    }

    const existingItem = JSON.parse(existingData)
    console.log(`Server: Found existing label:`, existingItem)

    // Check for duplicates (excluding current item)
    const allData = await kv.getByPrefix(`master_label_`)
    const duplicateItem = allData.find(item => {
      try {
        const parsed = JSON.parse(item.value)
        const isDifferentId = parsed.id !== id
        const isSameName = parsed.name?.toLowerCase()?.trim() === name.toLowerCase()?.trim()
        
        return isDifferentId && isSameName
      } catch (parseError) {
        return false
      }
    })

    if (duplicateItem) {
      const duplicateParsed = JSON.parse(duplicateItem.value)
      return c.json({ 
        error: 'Label with this name already exists',
        details: `Another label with name "${name}" already exists with ID: ${duplicateParsed.id}`
      }, 400)
    }

    const updatedItem: MasterDataItem = {
      ...existingItem,
      name: name.trim(),
      jpname: jpname?.trim() || undefined,
      kanjiName: kanjiName?.trim() || undefined,
      kanaName: kanaName?.trim() || undefined,
      labelLinks: labelLinks?.trim() || undefined,
      updatedAt: new Date().toISOString()
    }

    console.log(`Server: Saving updated label with ID: ${id}`)
    await kv.set(`master_label_${id}`, JSON.stringify(updatedItem))
    
    console.log('Server: Successfully updated label:', updatedItem)
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
async function updateGroupData(c: Context) {
  try {
    const id = c.req.param('id')
    console.log('Server: Updating group data for ID:', id)
    
    const body = await c.req.json()
    const { name, jpname, profilePicture, website, description, gallery } = body
    console.log('Server: Update group data received:', { name, jpname, profilePicture, website, description })

    if (!name?.trim()) {
      return c.json({ error: 'Group name is required' }, 400)
    }

    // Get existing item
    const existingData = await kv.get(`master_group_${id}`)
    if (!existingData) {
      console.log(`Server: Group not found - master_group_${id}`)
      return c.json({ error: 'Group not found' }, 404)
    }

    const existingItem = JSON.parse(existingData)
    console.log(`Server: Found existing group:`, existingItem)

    // Check for duplicates (excluding current item)
    const allData = await kv.getByPrefix(`master_group_`)
    const duplicateItem = allData.find(item => {
      try {
        const parsed = JSON.parse(item.value)
        const isDifferentId = parsed.id !== id
        const isSameName = parsed.name?.toLowerCase()?.trim() === name.toLowerCase()?.trim()
        
        return isDifferentId && isSameName
      } catch (parseError) {
        return false
      }
    })

    if (duplicateItem) {
      const duplicateParsed = JSON.parse(duplicateItem.value)
      return c.json({ 
        error: 'Group with this name already exists',
        details: `Another group with name "${name}" already exists with ID: ${duplicateParsed.id}`
      }, 400)
    }

    const updatedItem: MasterDataItem = {
      ...existingItem,
      name: name.trim(),
      jpname: jpname?.trim() || undefined,
      profilePicture: profilePicture?.trim() || undefined,
      website: website?.trim() || undefined,
      description: description?.trim() || undefined,
      updatedAt: new Date().toISOString()
    }

    console.log(`Server: Saving updated group with ID: ${id}`)
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