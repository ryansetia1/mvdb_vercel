import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { logger } from 'npm:hono/logger'
import { createClient } from 'npm:@supabase/supabase-js@2'
import * as kv from './kv_store.tsx'
import { getMasterData, createMasterData, deleteMasterData, createExtendedMasterData, updateExtendedMasterData } from './masterDataApi.tsx'
import { updateExtendedMasterDataWithSync, updateSimpleMasterDataWithSync } from './updateMasterDataWithSync.tsx'
import { updateGroupData } from './updateGroupData.tsx'
import { photobookApi } from './photobookApi.tsx'

// Helper function to process hashtag placeholders in gallery templates
const processHashtagPlaceholders = (template: string, imageNumber: number = 1): string => {
  // Find all sequences of hashtags
  return template.replace(/(#+)/g, (match) => {
    const hashCount = match.length
    // Convert image number to string with appropriate zero padding
    const paddedNumber = imageNumber.toString().padStart(hashCount, '0')
    return paddedNumber
  })
}

const app = new Hono()

app.use('*', cors({
  origin: '*',
  allowHeaders: ['*'],
  allowMethods: ['*'],
}))

app.use('*', logger())

// Test endpoint to verify server is running
app.get('/make-server-e0516fcf/health', async (c) => {
  return c.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    routes: {
      photobooks: 'available',
      movies: 'available',
      master: 'available',
      favorites: 'available'
    }
  })
})

// Health endpoint with f3064b20 prefix for consistency with other new endpoints
app.get('/make-server-f3064b20/health', async (c) => {
  return c.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    routes: {
      photobooks: 'available',
      movies: 'available',
      master: 'available',
      favorites: 'available',
      scMovies: 'available'
    }
  })
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

// Sign up endpoint
app.post('/make-server-e0516fcf/signup', async (c) => {
  try {
    const { email, password, name } = await c.req.json()
    
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    })

    if (error) {
      console.log('Signup error:', error)
      return c.json({ error: `Signup error: ${error.message}` }, 400)
    }

    return c.json({ success: true, user: data.user })
  } catch (error) {
    console.log('Signup exception:', error)
    return c.json({ error: `Signup exception: ${error}` }, 500)
  }
})

// ==================================================================================
// MOVIES CRUD ROUTES (e0516fcf prefix)
// ==================================================================================

// Get all movies
app.get('/make-server-e0516fcf/movies', async (c) => {
  try {
    const movies = await kv.getByPrefix('movie:')
    return c.json({ movies: movies.map(m => m.value) })
  } catch (error) {
    console.log('Get movies error:', error)
    return c.json({ error: `Get movies error: ${error}` }, 500)
  }
})

// Get single movie
app.get('/make-server-e0516fcf/movies/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const movie = await kv.get(`movie:${id}`)
    
    if (!movie) {
      return c.json({ error: 'Movie not found' }, 404)
    }
    
    return c.json({ movie })
  } catch (error) {
    console.log('Get movie error:', error)
    return c.json({ error: `Get movie error: ${error}` }, 500)
  }
})

// Create movie
app.post('/make-server-e0516fcf/movies', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized - admin access required' }, 401)
    }

    const movieData = await c.req.json()
    const movieId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const movie = {
      id: movieId,
      ...movieData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    await kv.set(`movie:${movieId}`, movie)
    
    return c.json({ movie })
  } catch (error) {
    console.log('Create movie error:', error)
    return c.json({ error: `Create movie error: ${error}` }, 500)
  }
})

// Update movie
app.put('/make-server-e0516fcf/movies/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized - admin access required' }, 401)
    }

    const id = c.req.param('id')
    const existingMovie = await kv.get(`movie:${id}`)
    
    if (!existingMovie) {
      return c.json({ error: 'Movie not found' }, 404)
    }
    
    const updateData = await c.req.json()
    const updatedMovie = {
      ...existingMovie,
      ...updateData,
      id, // Ensure ID is preserved
      updatedAt: new Date().toISOString()
    }
    
    await kv.set(`movie:${id}`, updatedMovie)
    
    return c.json({ movie: updatedMovie })
  } catch (error) {
    console.log('Update movie error:', error)
    return c.json({ error: `Update movie error: ${error}` }, 500)
  }
})

// Merge movie data - update existing movie with selected fields from parsed data
app.put('/make-server-e0516fcf/movies/:id/merge', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized - admin access required' }, 401)
    }

    const id = c.req.param('id')
    const existingMovie = await kv.get(`movie:${id}`)
    
    if (!existingMovie) {
      return c.json({ error: 'Movie not found' }, 404)
    }
    
    const { parsedData, matchedData, ignoredItems, selectedFields } = await c.req.json()
    
    if (!parsedData || !selectedFields) {
      return c.json({ error: 'Missing parsedData or selectedFields' }, 400)
    }
    
    console.log('=== MERGE MOVIE DATA ===')
    console.log('Movie ID:', id)
    console.log('Selected fields:', selectedFields)
    console.log('Parsed data:', parsedData)
    
    // Create updated movie with merged data
    const updatedMovie = { ...existingMovie }
    
    // Update selected fields with parsed data
    if (selectedFields.includes('titleEn') && parsedData.titleEn) {
      updatedMovie.titleEn = parsedData.titleEn
    }

    if (selectedFields.includes('releaseDate') && parsedData.releaseDate) {
      updatedMovie.releaseDate = parsedData.releaseDate
    }

    if (selectedFields.includes('duration') && parsedData.duration) {
      updatedMovie.duration = parsedData.duration
    }

    if (selectedFields.includes('director') && matchedData?.directors && matchedData.directors.length > 0) {
      const matchedDirector = matchedData.directors[0]
      if (matchedDirector.matched && !ignoredItems?.includes('directors-0')) {
        const directorName = matchedDirector.matched.name || matchedDirector.matched.jpname || matchedDirector.original
        if (directorName && directorName.trim()) {
          updatedMovie.director = directorName
        }
      }
    }

    if (selectedFields.includes('studio') && matchedData?.studios && matchedData.studios.length > 0) {
      const matchedStudio = matchedData.studios[0]
      if (matchedStudio.matched && !ignoredItems?.includes('studios-0')) {
        const studioName = matchedStudio.matched.name || matchedStudio.matched.jpname || matchedStudio.original
        if (studioName && studioName.trim()) {
          updatedMovie.studio = studioName
        }
      }
    }

    if (selectedFields.includes('series') && matchedData?.series && matchedData.series.length > 0) {
      const matchedSeries = matchedData.series[0]
      if (matchedSeries.matched && !ignoredItems?.includes('series-0')) {
        const seriesName = matchedSeries.matched.titleEn || matchedSeries.matched.titleJp || matchedSeries.original
        if (seriesName && seriesName.trim()) {
          updatedMovie.series = seriesName
        }
      }
    }

    if (selectedFields.includes('actress') && matchedData?.actresses && matchedData.actresses.length > 0) {
      // Merge actresses using matched data - only add new ones, don't duplicate
      const existingActresses = existingMovie.actress ? existingMovie.actress.split(',').map(a => a.trim()).filter(a => a) : []
      
      // Get matched actress names (prefer English name, fallback to Japanese)
      const matchedActressNames = matchedData.actresses
        .filter(item => item.matched && !ignoredItems?.includes(`actresses-${matchedData.actresses.indexOf(item)}`))
        .map(item => item.matched.name || item.matched.jpname || item.original)
        .filter(name => name && name.trim())
      
      // Only add actresses that don't already exist
      const uniqueNewActresses = matchedActressNames.filter(actress => 
        !existingActresses.some(existing => 
          existing.toLowerCase() === actress.toLowerCase() ||
          existing.includes(actress) ||
          actress.includes(existing)
        )
      )
      
      if (uniqueNewActresses.length > 0) {
        updatedMovie.actress = [...existingActresses, ...uniqueNewActresses].join(', ')
      }
    }

    if (selectedFields.includes('actors') && matchedData?.actors && matchedData.actors.length > 0) {
      // Merge actors using matched data - only add new ones, don't duplicate
      const existingActors = existingMovie.actors ? existingMovie.actors.split(',').map(a => a.trim()).filter(a => a) : []
      
      // Get matched actor names (prefer English name, fallback to Japanese)
      const matchedActorNames = matchedData.actors
        .filter(item => item.matched && !ignoredItems?.includes(`actors-${matchedData.actors.indexOf(item)}`))
        .map(item => item.matched.name || item.matched.jpname || item.original)
        .filter(name => name && name.trim())
      
      // Only add actors that don't already exist
      const uniqueNewActors = matchedActorNames.filter(actor => 
        !existingActors.some(existing => 
          existing.toLowerCase() === actor.toLowerCase() ||
          existing.includes(actor) ||
          actor.includes(existing)
        )
      )
      
      if (uniqueNewActors.length > 0) {
        updatedMovie.actors = [...existingActors, ...uniqueNewActors].join(', ')
      }
    }

    // Update timestamp
    updatedMovie.updatedAt = new Date().toISOString()
    
    console.log('Updated movie:', updatedMovie)
    
    await kv.set(`movie:${id}`, updatedMovie)
    
    return c.json({ 
      success: true,
      movie: updatedMovie,
      message: `Successfully merged ${selectedFields.length} fields`
    })
  } catch (error) {
    console.log('Merge movie error:', error)
    return c.json({ error: `Merge movie error: ${error}` }, 500)
  }
})

// Delete movie
app.delete('/make-server-e0516fcf/movies/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized - admin access required' }, 401)
    }

    const id = c.req.param('id')
    const existingMovie = await kv.get(`movie:${id}`)
    
    if (!existingMovie) {
      return c.json({ error: 'Movie not found' }, 404)
    }
    
    await kv.del(`movie:${id}`)
    
    return c.json({ success: true, message: 'Movie deleted successfully' })
  } catch (error) {
    console.log('Delete movie error:', error)
    return c.json({ error: `Delete movie error: ${error}` }, 500)
  }
})

// Helper function for enhanced movie code matching
const movieCodeMatches = (movieCode, query) => {
  if (!movieCode || !query) return false
  
  const code = movieCode.toLowerCase()
  const searchQuery = query.toLowerCase()
  
  // Direct match
  if (code.includes(searchQuery)) return true
  
  // Remove dashes from movie code and check if query matches
  const codeWithoutDashes = code.replace(/-/g, '')
  if (codeWithoutDashes.includes(searchQuery)) return true
  
  // Add dashes to query if it doesn't have them and check if it matches the original code
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

// Helper function for enhanced cast name matching
const castNameMatches = (castName, query) => {
  if (!castName || !query) return false
  
  const nameLower = castName.toLowerCase()
  const queryLower = query.toLowerCase()
  
  // Direct match
  if (nameLower.includes(queryLower)) return true
  
  // Reverse name search
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 0)
  const nameWords = nameLower.split(/\s+/).filter(w => w.length > 0)
  
  if (queryWords.length >= 2 && nameWords.length >= 2) {
    // Try reverse matching: if query is "hatano yui", check if name contains "yui hatano"
    const reversedQuery = [...queryWords].reverse().join(' ')
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

// Search movies
app.get('/make-server-e0516fcf/movies/search/:query', async (c) => {
  try {
    const query = c.req.param('query').toLowerCase()
    const movies = await kv.getByPrefix('movie:')
    
    const filteredMovies = movies
      .map(m => m.value)
      .filter(movie => {
        // Enhanced movie code matching
        if (movieCodeMatches(movie.code, query) || movieCodeMatches(movie.dmcode, query)) {
          return true
        }
        
        // Enhanced cast name matching
        if (castNameMatches(movie.actress, query) || 
            castNameMatches(movie.actors, query) || 
            castNameMatches(movie.director, query)) {
          return true
        }
        
        // Regular text search for other fields
        const searchableFields = [
          movie.titleEn,
          movie.titleJp,
          movie.studio,
          movie.series,
          movie.label,
          movie.tags,
          movie.type
        ]
        
        return searchableFields.some(field => 
          field && field.toLowerCase().includes(query)
        )
      })
    
    return c.json({ movies: filteredMovies })
  } catch (error) {
    console.log('Search movies error:', error)
    return c.json({ error: `Search movies error: ${error}` }, 500)
  }
})

// ==================================================================================
// BULK ASSIGNMENT ROUTES
// ==================================================================================

// Bulk assign metadata to multiple movies
app.post('/make-server-e0516fcf/bulk/assign-metadata', async (c) => {
  try {
    console.log('=== Bulk Assign Metadata Request START ===')
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    console.log('Access token received:', accessToken ? `Token present (${accessToken.substring(0, 20)}...)` : 'No token')
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    console.log('Auth result:', { userId: user?.id, authError: authError?.message })
    
    if (!user?.id || authError) {
      console.log('Authentication failed in bulk assign metadata:', authError)
      return c.json({ error: 'Unauthorized - admin access required' }, 401)
    }

    const requestBody = await c.req.json()
    console.log('Raw request body:', JSON.stringify(requestBody, null, 2))
    
    const { movieIds, metadataType, metadataValue } = requestBody
    console.log('Parsed request:', { 
      movieIds: movieIds, 
      movieIdsLength: movieIds?.length,
      metadataType, 
      metadataValue 
    })
    
    if (!movieIds || !Array.isArray(movieIds) || movieIds.length === 0) {
      console.log('Invalid movieIds:', movieIds)
      return c.json({ error: 'movieIds must be a non-empty array' }, 400)
    }
    
    if (!metadataType || !metadataValue) {
      console.log('Missing metadataType or metadataValue:', { metadataType, metadataValue })
      return c.json({ error: 'metadataType and metadataValue are required' }, 400)
    }

    let updatedCount = 0
    const updatedMovies = []
    const errors = []
    const detailedResults = []

    console.log(`Starting to process ${movieIds.length} movies...`)
    
    for (const movieId of movieIds) {
      try {
        console.log(`Processing movie ID: ${movieId}`)
        const existingMovie = await kv.get(`movie:${movieId}`)
        
        if (!existingMovie) {
          console.log(`Movie not found: ${movieId}`)
          errors.push(`Movie not found: ${movieId}`)
          detailedResults.push({
            movieId,
            status: 'error',
            error: 'Movie not found'
          })
          continue
        }

        console.log(`Found movie: ${existingMovie.titleEn || existingMovie.titleJp || 'Untitled'}`)
        console.log(`Current tags: ${existingMovie.tags || 'None'}`)
        
        let updatedMovie = { ...existingMovie }

        // Handle different metadata types
        if (metadataType === 'tag') {
          // For tags, append to existing tags if they exist
          const existingTags = existingMovie.tags ? existingMovie.tags.split(',').map(t => t.trim()) : []
          console.log(`Existing tags array:`, existingTags)
          
          if (!existingTags.includes(metadataValue)) {
            const newTags = [...existingTags, metadataValue].filter(Boolean)
            updatedMovie.tags = newTags.join(', ')
            console.log(`New tags: ${updatedMovie.tags}`)
          } else {
            console.log(`Tag "${metadataValue}" already exists, skipping`)
            detailedResults.push({
              movieId,
              status: 'skipped',
              reason: 'Tag already exists'
            })
            continue
          }
        } else {
          // For other metadata types (studio, series, type, label), replace the value
          const oldValue = existingMovie[metadataType]
          updatedMovie[metadataType] = metadataValue
          console.log(`Updated ${metadataType}: "${oldValue}" -> "${metadataValue}"`)
        }

        updatedMovie.updatedAt = new Date().toISOString()
        
        console.log(`Saving updated movie to KV store with key: movie:${movieId}`)
        await kv.set(`movie:${movieId}`, updatedMovie)
        
        // Verify the save by reading it back immediately
        const verifyMovie = await kv.get(`movie:${movieId}`)
        console.log(`Verification - saved tags: ${verifyMovie?.tags || 'None'}`)
        
        updatedCount++
        updatedMovies.push(movieId)
        
        detailedResults.push({
          movieId,
          status: 'success',
          oldTags: existingMovie.tags,
          newTags: updatedMovie.tags
        })
        
        console.log(`Successfully updated movie ${movieId} with ${metadataType}: ${metadataValue}`)
        
      } catch (updateError) {
        console.error(`Error updating movie ${movieId}:`, updateError)
        errors.push(`Error updating movie ${movieId}: ${updateError.message}`)
        detailedResults.push({
          movieId,
          status: 'error',
          error: updateError.message
        })
      }
    }
    
    console.log(`Bulk metadata assignment completed. Updated ${updatedCount} movies`)
    console.log('Detailed results:', JSON.stringify(detailedResults, null, 2))
    
    const response = {
      success: true,
      updatedCount,
      updatedMovies,
      metadataType,
      metadataValue,
      errors: errors.length > 0 ? errors : undefined,
      detailedResults // Add detailed results for debugging
    }
    
    console.log('=== Bulk Assign Metadata Request END ===')
    return c.json(response)
    
  } catch (error) {
    console.error('Bulk assign metadata error:', error)
    return c.json({ 
      error: `Bulk assign metadata error: ${error.message}`,
      details: error.stack 
    }, 500)
  }
})

// Bulk assign cast to multiple movies
app.post('/make-server-e0516fcf/bulk/assign-cast', async (c) => {
  try {
    console.log('=== Bulk Assign Cast Request ===')
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      console.log('Authentication failed in bulk assign cast')
      return c.json({ error: 'Unauthorized - admin access required' }, 401)
    }

    const { movieIds, castType, castMembers, assignmentMode = 'replace' } = await c.req.json()
    console.log('Bulk cast assignment request:', { movieIds, castType, castMembers, assignmentMode })
    
    if (!movieIds || !Array.isArray(movieIds) || movieIds.length === 0) {
      return c.json({ error: 'movieIds must be a non-empty array' }, 400)
    }
    
    if (!castType || !castMembers || !Array.isArray(castMembers)) {
      return c.json({ error: 'castType and castMembers are required' }, 400)
    }

    let updatedCount = 0
    const updatedMovies = []
    const errors = []

    for (const movieId of movieIds) {
      try {
        const existingMovie = await kv.get(`movie:${movieId}`)
        
        if (!existingMovie) {
          console.log(`Movie not found: ${movieId}`)
          errors.push(`Movie not found: ${movieId}`)
          continue
        }

        let updatedMovie = { ...existingMovie }
        const castValue = castMembers.join(', ')

        if (assignmentMode === 'append' && existingMovie[castType]) {
          // Append to existing cast
          const existingCast = existingMovie[castType].split(',').map(c => c.trim())
          const newCast = [...new Set([...existingCast, ...castMembers])]
          updatedMovie[castType] = newCast.join(', ')
        } else {
          // Replace existing cast
          updatedMovie[castType] = castValue
        }

        updatedMovie.updatedAt = new Date().toISOString()
        
        await kv.set(`movie:${movieId}`, updatedMovie)
        updatedCount++
        updatedMovies.push(movieId)
        
        console.log(`Successfully updated movie ${movieId} with ${castType}: ${castValue}`)
        
      } catch (updateError) {
        console.error(`Error updating movie ${movieId}:`, updateError)
        errors.push(`Error updating movie ${movieId}: ${updateError.message}`)
      }
    }
    
    console.log(`Bulk cast assignment completed. Updated ${updatedCount} movies`)
    
    return c.json({
      success: true,
      updatedCount,
      updatedMovies,
      castType,
      castMembers,
      assignmentMode,
      errors: errors.length > 0 ? errors : undefined
    })
    
  } catch (error) {
    console.error('Bulk assign cast error:', error)
    return c.json({ 
      error: `Bulk assign cast error: ${error.message}`,
      details: error.stack 
    }, 500)
  }
})

// Bulk assign template to multiple movies
app.post('/make-server-e0516fcf/bulk/assign-template', async (c) => {
  try {
    console.log('=== Bulk Assign Template Request ===')
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      console.log('Authentication failed in bulk assign template')
      return c.json({ error: 'Unauthorized - admin access required' }, 401)
    }

    const { movieIds, templateGroupId, templateUrl, galleryTemplate, applicableStudios } = await c.req.json()
    console.log('Bulk template assignment request:', { movieIds, templateGroupId, templateUrl })
    
    if (!movieIds || !Array.isArray(movieIds) || movieIds.length === 0) {
      return c.json({ error: 'movieIds must be a non-empty array' }, 400)
    }
    
    if (!templateGroupId || !templateUrl) {
      return c.json({ error: 'templateGroupId and templateUrl are required' }, 400)
    }

    let updatedCount = 0
    const updatedMovies = []
    const errors = []

    for (const movieId of movieIds) {
      try {
        const existingMovie = await kv.get(`movie:${movieId}`)
        
        if (!existingMovie) {
          console.log(`Movie not found: ${movieId}`)
          errors.push(`Movie not found: ${movieId}`)
          continue
        }

        let updatedMovie = { ...existingMovie }

        // Apply template with code replacement
        let newCover = templateUrl
        let newGallery = galleryTemplate

        // Apply template with dmcode/code replacement if available - prioritize dmcode
        if (existingMovie.dmcode && templateUrl.includes('*')) {
          newCover = templateUrl.replace(/\*/g, existingMovie.dmcode)
        } else if (existingMovie.code && templateUrl.includes('*')) {
          newCover = templateUrl.replace(/\*/g, existingMovie.code)
        }

        if (newGallery) {
          if (existingMovie.dmcode && newGallery.includes('*')) {
            newGallery = newGallery.replace(/\*/g, existingMovie.dmcode)
          } else if (existingMovie.code && newGallery.includes('*')) {
            newGallery = newGallery.replace(/\*/g, existingMovie.code)
          }
        }

        updatedMovie.cover = newCover
        if (newGallery) {
          updatedMovie.gallery = newGallery
        }
        updatedMovie.templateGroupId = templateGroupId
        updatedMovie.updatedAt = new Date().toISOString()
        
        await kv.set(`movie:${movieId}`, updatedMovie)
        updatedCount++
        updatedMovies.push(movieId)
        
        console.log(`Successfully updated movie ${movieId} with template: ${templateUrl}`)
        
      } catch (updateError) {
        console.error(`Error updating movie ${movieId}:`, updateError)
        errors.push(`Error updating movie ${movieId}: ${updateError.message}`)
      }
    }
    
    console.log(`Bulk template assignment completed. Updated ${updatedCount} movies`)
    
    return c.json({
      success: true,
      updatedCount,
      updatedMovies,
      templateGroupId,
      errors: errors.length > 0 ? errors : undefined
    })
    
  } catch (error) {
    console.error('Bulk assign template error:', error)
    return c.json({ 
      error: `Bulk assign template error: ${error.message}`,
      details: error.stack 
    }, 500)
  }
})

// ==================================================================================
// MOVIES CRUD ROUTES (f3064b20 prefix)
// ==================================================================================

// Get all movies
app.get('/make-server-f3064b20/movies', async (c) => {
  try {
    const movies = await kv.getByPrefix('movie:')
    return c.json({ movies: movies.map(m => m.value) })
  } catch (error) {
    console.log('Get movies error:', error)
    return c.json({ error: `Get movies error: ${error}` }, 500)
  }
})

// Get single movie
app.get('/make-server-f3064b20/movies/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const movie = await kv.get(`movie:${id}`)
    
    if (!movie) {
      return c.json({ error: 'Movie not found' }, 404)
    }
    
    return c.json({ movie })
  } catch (error) {
    console.log('Get movie error:', error)
    return c.json({ error: `Get movie error: ${error}` }, 500)
  }
})

// Create movie
app.post('/make-server-f3064b20/movies', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized - admin access required' }, 401)
    }

    const movieData = await c.req.json()
    const movieId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const movie = {
      id: movieId,
      ...movieData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    await kv.set(`movie:${movieId}`, movie)
    
    return c.json({ movie })
  } catch (error) {
    console.log('Create movie error:', error)
    return c.json({ error: `Create movie error: ${error}` }, 500)
  }
})

// Update movie
app.put('/make-server-f3064b20/movies/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized - admin access required' }, 401)
    }

    const id = c.req.param('id')
    const existingMovie = await kv.get(`movie:${id}`)
    
    if (!existingMovie) {
      return c.json({ error: 'Movie not found' }, 404)
    }
    
    const updateData = await c.req.json()
    const updatedMovie = {
      ...existingMovie,
      ...updateData,
      id, // Ensure ID is preserved
      updatedAt: new Date().toISOString()
    }
    
    await kv.set(`movie:${id}`, updatedMovie)
    
    return c.json({ movie: updatedMovie })
  } catch (error) {
    console.log('Update movie error:', error)
    return c.json({ error: `Update movie error: ${error}` }, 500)
  }
})

// Delete movie
app.delete('/make-server-f3064b20/movies/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized - admin access required' }, 401)
    }

    const id = c.req.param('id')
    const existingMovie = await kv.get(`movie:${id}`)
    
    if (!existingMovie) {
      return c.json({ error: 'Movie not found' }, 404)
    }
    
    await kv.del(`movie:${id}`)
    
    return c.json({ success: true, message: 'Movie deleted successfully' })
  } catch (error) {
    console.log('Delete movie error:', error)
    return c.json({ error: `Delete movie error: ${error}` }, 500)
  }
})

// Search movies
app.get('/make-server-f3064b20/movies/search/:query', async (c) => {
  try {
    const query = c.req.param('query').toLowerCase()
    const movies = await kv.getByPrefix('movie:')
    
    const filteredMovies = movies
      .map(m => m.value)
      .filter(movie => {
        // Enhanced movie code matching
        if (movieCodeMatches(movie.code, query) || movieCodeMatches(movie.dmcode, query)) {
          return true
        }
        
        // Enhanced cast name matching
        if (castNameMatches(movie.actress, query) || 
            castNameMatches(movie.actors, query) || 
            castNameMatches(movie.director, query)) {
          return true
        }
        
        // Regular text search for other fields
        const searchableFields = [
          movie.titleEn,
          movie.titleJp,
          movie.studio,
          movie.series,
          movie.label,
          movie.tags,
          movie.type
        ]
        
        return searchableFields.some(field => 
          field && field.toLowerCase().includes(query)
        )
      })
    
    return c.json({ movies: filteredMovies })
  } catch (error) {
    console.log('Search movies error:', error)
    return c.json({ error: `Search movies error: ${error}` }, 500)
  }
})

// ==================================================================================
// CUSTOM NAV ITEMS ROUTES  
// ==================================================================================

// Get custom nav items for authenticated user
app.get('/make-server-f3064b20/custom-nav-items', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const userCustomNavItems = await kv.get(`custom_nav_items:${user.id}`)
    
    return c.json({ 
      items: userCustomNavItems || []
    })
  } catch (error) {
    console.log('Get custom nav items error:', error)
    return c.json({ error: `Get custom nav items error: ${error}` }, 500)
  }
})

// Save custom nav items for authenticated user
app.post('/make-server-f3064b20/custom-nav-items', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const { items } = await c.req.json()
    
    if (!Array.isArray(items)) {
      return c.json({ error: 'Items must be an array' }, 400)
    }

    // Add user ID and timestamp to each item
    const itemsWithMetadata = items.map(item => ({
      ...item,
      userId: user.id,
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }))

    await kv.set(`custom_nav_items:${user.id}`, itemsWithMetadata)
    
    return c.json({ 
      success: true,
      message: 'Custom nav items saved successfully'
    })
  } catch (error) {
    console.log('Save custom nav items error:', error)
    return c.json({ error: `Save custom nav items error: ${error}` }, 500)
  }
})

// Delete specific custom nav item for authenticated user
app.delete('/make-server-f3064b20/custom-nav-items/:itemId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const itemId = c.req.param('itemId')
    const userCustomNavItems = await kv.get(`custom_nav_items:${user.id}`) || []
    
    const updatedItems = userCustomNavItems.filter(item => item.id !== itemId)
    
    await kv.set(`custom_nav_items:${user.id}`, updatedItems)
    
    return c.json({ 
      success: true,
      message: 'Custom nav item deleted successfully'
    })
  } catch (error) {
    console.log('Delete custom nav item error:', error)
    return c.json({ error: `Delete custom nav item error: ${error}` }, 500)
  }
})

// Reorder custom nav items for authenticated user
// ==================================================================================
// GROUP SPECIFIC UPDATE ROUTE - CRITICAL MISSING ROUTE
// ==================================================================================

// Update group data with gallery support - THIS ROUTE WAS MISSING!
app.put('/make-server-f3064b20/master/group/:id/extended', updateGroupData)

app.post('/make-server-f3064b20/custom-nav-items/reorder', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const { itemOrders } = await c.req.json()
    
    if (!Array.isArray(itemOrders)) {
      return c.json({ error: 'itemOrders must be an array' }, 400)
    }

    const userCustomNavItems = await kv.get(`custom_nav_items:${user.id}`) || []
    
    // Update the order for each item
    const updatedItems = userCustomNavItems.map(item => {
      const orderInfo = itemOrders.find(orderItem => orderItem.id === item.id)
      if (orderInfo) {
        return {
          ...item,
          order: orderInfo.order,
          updatedAt: new Date().toISOString()
        }
      }
      return item
    })

    // Sort items by order
    updatedItems.sort((a, b) => (a.order || 0) - (b.order || 0))
    
    await kv.set(`custom_nav_items:${user.id}`, updatedItems)
    
    return c.json({ 
      success: true,
      message: 'Custom nav items reordered successfully'
    })
  } catch (error) {
    console.log('Reorder custom nav items error:', error)
    return c.json({ error: `Reorder custom nav items error: ${error}` }, 500)
  }
})

// ==================================================================================
// SAVED GALLERY ROUTES
// ==================================================================================

// Get saved gallery for a movie
app.get('/make-server-f3064b20/saved-gallery/:movieId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const movieId = c.req.param('movieId')
    const savedGallery = await kv.get(`saved_gallery:${movieId}`)
    
    if (!savedGallery) {
      return c.json({ error: 'No saved gallery found' }, 404)
    }
    
    return c.json(savedGallery)
  } catch (error) {
    console.log('Get saved gallery error:', error)
    return c.json({ error: `Get saved gallery error: ${error}` }, 500)
  }
})

// Save gallery URLs for a movie
app.put('/make-server-f3064b20/saved-gallery/:movieId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const movieId = c.req.param('movieId')
    const saveData = await c.req.json()
    
    // Validate save data structure
    if (!saveData.urls || !Array.isArray(saveData.urls)) {
      return c.json({ error: 'Invalid save data: urls array is required' }, 400)
    }
    
    await kv.set(`saved_gallery:${movieId}`, saveData)
    
    console.log(`Saved gallery for movie ${movieId}: ${saveData.urls.length} URLs`)
    return c.json({ success: true, message: 'Gallery saved successfully' })
  } catch (error) {
    console.log('Save gallery error:', error)
    return c.json({ error: `Save gallery error: ${error}` }, 500)
  }
})

// Delete saved gallery for a movie
app.delete('/make-server-f3064b20/saved-gallery/:movieId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const movieId = c.req.param('movieId')
    await kv.del(`saved_gallery:${movieId}`)
    
    console.log(`Saved gallery deleted for movie ${movieId}`)
    return c.json({ success: true, message: 'Saved gallery deleted successfully' })
  } catch (error) {
    console.log('Delete saved gallery error:', error)
    return c.json({ error: `Delete saved gallery error: ${error}` }, 500)
  }
})

// ==================================================================================
// MOVIE LINKS ROUTES
// ==================================================================================

// Get all movie links
app.get('/make-server-f3064b20/movie-links', async (c) => {
  try {
    const accessToken = c.req.header('X-Access-Token')
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const movieLinks = await kv.getByPrefix('movie_link:')
    return c.json(movieLinks.map(link => link.value))
  } catch (error) {
    console.log('Get movie links error:', error)
    return c.json({ error: `Get movie links error: ${error}` }, 500)
  }
})

// Get movie links for a specific movie (bidirectional)
app.get('/make-server-f3064b20/movie-links/bidirectional/:movieId', async (c) => {
  try {
    const accessToken = c.req.header('X-Access-Token')
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const movieId = c.req.param('movieId')
    const allLinks = await kv.getByPrefix('movie_link:')
    
    const asMain = allLinks
      .map(link => link.value)
      .filter(link => link.primaryMovieId === movieId)
    
    const asLinked = allLinks
      .map(link => link.value)
      .filter(link => link.linkedMovieId === movieId)

    return c.json({ asMain, asLinked })
  } catch (error) {
    console.log('Get bidirectional movie links error:', error)
    return c.json({ error: `Get bidirectional movie links error: ${error}` }, 500)
  }
})

// Get movie links for a specific movie (only as primary)
app.get('/make-server-f3064b20/movie-links/movie/:movieId', async (c) => {
  try {
    const accessToken = c.req.header('X-Access-Token')
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const movieId = c.req.param('movieId')
    const allLinks = await kv.getByPrefix('movie_link:')
    
    const movieLinks = allLinks
      .map(link => link.value)
      .filter(link => link.primaryMovieId === movieId || link.linkedMovieId === movieId)

    return c.json(movieLinks)
  } catch (error) {
    console.log('Get movie links for movie error:', error)
    return c.json({ error: `Get movie links for movie error: ${error}` }, 500)
  }
})

// Create movie link
app.post('/make-server-f3064b20/movie-links', async (c) => {
  try {
    const accessToken = c.req.header('X-Access-Token')
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized - admin access required' }, 401)
    }

    const { primaryMovieId, linkedMovieId, description } = await c.req.json()
    
    if (!primaryMovieId || !linkedMovieId) {
      return c.json({ error: 'primaryMovieId and linkedMovieId are required' }, 400)
    }

    if (primaryMovieId === linkedMovieId) {
      return c.json({ error: 'Cannot link a movie to itself' }, 400)
    }

    // Check if movies exist
    const primaryMovie = await kv.get(`movie:${primaryMovieId}`)
    const linkedMovie = await kv.get(`movie:${linkedMovieId}`)
    
    if (!primaryMovie || !linkedMovie) {
      return c.json({ error: 'One or both movies not found' }, 404)
    }

    // Check if link already exists
    const allLinks = await kv.getByPrefix('movie_link:')
    const existingLink = allLinks
      .map(link => link.value)
      .find(link => 
        (link.primaryMovieId === primaryMovieId && link.linkedMovieId === linkedMovieId) ||
        (link.primaryMovieId === linkedMovieId && link.linkedMovieId === primaryMovieId)
      )

    if (existingLink) {
      return c.json({ error: 'Link between these movies already exists' }, 409)
    }

    const linkId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const movieLink = {
      id: linkId,
      primaryMovieId,
      linkedMovieId,
      description: description || 'Linked movies',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    await kv.set(`movie_link:${linkId}`, movieLink)
    
    return c.json(movieLink)
  } catch (error) {
    console.log('Create movie link error:', error)
    return c.json({ error: `Create movie link error: ${error}` }, 500)
  }
})

// Delete movie link
app.delete('/make-server-f3064b20/movie-links/:id', async (c) => {
  try {
    const accessToken = c.req.header('X-Access-Token')
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized - admin access required' }, 401)
    }

    const linkId = c.req.param('id')
    const existingLink = await kv.get(`movie_link:${linkId}`)
    
    if (!existingLink) {
      return c.json({ error: 'Movie link not found' }, 404)
    }
    
    await kv.del(`movie_link:${linkId}`)
    
    return c.json({ success: true, message: 'Movie link deleted successfully' })
  } catch (error) {
    console.log('Delete movie link error:', error)
    return c.json({ error: `Delete movie link error: ${error}` }, 500)
  }
})

// ==================================================================================
// SC MOVIES ROUTES
// ==================================================================================

// Get all SC movies
app.get('/make-server-f3064b20/sc-movies', async (c) => {
  try {
    const scMovies = await kv.getByPrefix('scmovie:')
    return c.json({ scMovies: scMovies.map(m => m.value) })
  } catch (error) {
    console.log('Get SC movies error:', error)
    return c.json({ error: `Get SC movies error: ${error}` }, 500)
  }
})

// Get single SC movie
app.get('/make-server-f3064b20/sc-movies/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const scMovie = await kv.get(`scmovie:${id}`)
    
    if (!scMovie) {
      return c.json({ error: 'SC Movie not found' }, 404)
    }
    
    return c.json({ scMovie })
  } catch (error) {
    console.log('Get SC movie error:', error)
    return c.json({ error: `Get SC movie error: ${error}` }, 500)
  }
})

// Create SC movie (protected route)
app.post('/make-server-f3064b20/sc-movies', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized - admin access required' }, 401)
    }

    const scMovieData = await c.req.json()
    const scMovieId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const scMovie = {
      id: scMovieId,
      ...scMovieData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    await kv.set(`scmovie:${scMovieId}`, scMovie)
    
    return c.json({ success: true, scMovie })
  } catch (error) {
    console.log('Create SC movie error:', error)
    return c.json({ error: `Create SC movie error: ${error}` }, 500)
  }
})

// Update SC movie (protected route)
app.put('/make-server-f3064b20/sc-movies/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized - admin access required' }, 401)
    }

    const id = c.req.param('id')
    const existingSCMovie = await kv.get(`scmovie:${id}`)
    
    if (!existingSCMovie) {
      return c.json({ error: 'SC Movie not found' }, 404)
    }
    
    const updateData = await c.req.json()
    const updatedSCMovie = {
      ...existingSCMovie,
      ...updateData,
      id,
      updatedAt: new Date().toISOString()
    }
    
    await kv.set(`scmovie:${id}`, updatedSCMovie)
    
    return c.json({ success: true, scMovie: updatedSCMovie })
  } catch (error) {
    console.log('Update SC movie error:', error)
    return c.json({ error: `Update SC movie error: ${error}` }, 500)
  }
})

// Delete SC movie (protected route)
app.delete('/make-server-f3064b20/sc-movies/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized - admin access required' }, 401)
    }

    const id = c.req.param('id')
    const existingSCMovie = await kv.get(`scmovie:${id}`)
    
    if (!existingSCMovie) {
      return c.json({ error: 'SC Movie not found' }, 404)
    }
    
    await kv.del(`scmovie:${id}`)
    
    return c.json({ success: true, message: 'SC Movie deleted successfully' })
  } catch (error) {
    console.log('Delete SC movie error:', error)
    return c.json({ error: `Delete SC movie error: ${error}` }, 500)
  }
})

// Search SC movies
app.get('/make-server-f3064b20/sc-movies/search/:query', async (c) => {
  try {
    const query = c.req.param('query').toLowerCase()
    const scMovies = await kv.getByPrefix('scmovie:')
    
    const filteredSCMovies = scMovies
      .map(m => m.value)
      .filter(scMovie => 
        scMovie.titleEn?.toLowerCase().includes(query) ||
        scMovie.titleJp?.toLowerCase().includes(query) ||
        movieCodeMatches(scMovie.hcCode, query) ||
        castNameMatches(scMovie.cast, query)
      )
    
    return c.json({ scMovies: filteredSCMovies })
  } catch (error) {
    console.log('Search SC movies error:', error)
    return c.json({ error: `Search SC movies error: ${error}` }, 500)
  }
})

// ==================================================================================
// MASTER DATA ROUTES WITH SYNC
// ==================================================================================

// Update simple master data (type, tag) with sync
app.put('/make-server-f3064b20/master/:type/:id/sync', updateSimpleMasterDataWithSync)

// Update extended master data (actor, actress, director, series, studio, label, group) with sync
app.put('/make-server-f3064b20/master/:type/:id/extended/sync', updateExtendedMasterDataWithSync)

// Get single movie
app.get('/make-server-e0516fcf/movies/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const movie = await kv.get(`movie:${id}`)
    
    if (!movie) {
      return c.json({ error: 'Movie not found' }, 404)
    }
    
    return c.json({ movie })
  } catch (error) {
    console.log('Get movie error:', error)
    return c.json({ error: `Get movie error: ${error}` }, 500)
  }
})

// Create movie (protected route)
app.post('/make-server-e0516fcf/movies', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized - admin access required' }, 401)
    }

    const movieData = await c.req.json()
    const movieId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const movie = {
      id: movieId,
      ...movieData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    await kv.set(`movie:${movieId}`, movie)
    
    return c.json({ success: true, movie })
  } catch (error) {
    console.log('Create movie error:', error)
    return c.json({ error: `Create movie error: ${error}` }, 500)
  }
})

// Update movie (protected route)
app.put('/make-server-e0516fcf/movies/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized - admin access required' }, 401)
    }

    const id = c.req.param('id')
    const existingMovie = await kv.get(`movie:${id}`)
    
    if (!existingMovie) {
      return c.json({ error: 'Movie not found' }, 404)
    }
    
    const updateData = await c.req.json()
    const updatedMovie = {
      ...existingMovie,
      ...updateData,
      id,
      updatedAt: new Date().toISOString()
    }
    
    await kv.set(`movie:${id}`, updatedMovie)
    
    return c.json({ success: true, movie: updatedMovie })
  } catch (error) {
    console.log('Update movie error:', error)
    return c.json({ error: `Update movie error: ${error}` }, 500)
  }
})

// Delete movie (protected route)
app.delete('/make-server-e0516fcf/movies/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized - admin access required' }, 401)
    }

    const id = c.req.param('id')
    const existingMovie = await kv.get(`movie:${id}`)
    
    if (!existingMovie) {
      return c.json({ error: 'Movie not found' }, 404)
    }
    
    await kv.del(`movie:${id}`)
    
    return c.json({ success: true, message: 'Movie deleted successfully' })
  } catch (error) {
    console.log('Delete movie error:', error)
    return c.json({ error: `Delete movie error: ${error}` }, 500)
  }
})

// Search movies
app.get('/make-server-e0516fcf/movies/search/:query', async (c) => {
  try {
    const query = c.req.param('query').toLowerCase()
    const movies = await kv.getByPrefix('movie:')
    
    const filteredMovies = movies
      .map(m => m.value)
      .filter(movie => {
        // Enhanced movie code matching
        if (movieCodeMatches(movie.code, query) || movieCodeMatches(movie.dmcode, query)) {
          return true
        }
        
        // Enhanced cast name matching
        if (castNameMatches(movie.actress, query) || 
            castNameMatches(movie.actors, query) || 
            castNameMatches(movie.director, query)) {
          return true
        }
        
        // Regular text search for other fields
        const searchableFields = [
          movie.titleEn,
          movie.titleJp,
          movie.studio,
          movie.series,
          movie.label,
          movie.tags,
          movie.type
        ]
        
        return searchableFields.some(field => 
          field && field.toLowerCase().includes(query)
        )
      })
    
    return c.json({ movies: filteredMovies })
  } catch (error) {
    console.log('Search movies error:', error)
    return c.json({ error: `Search movies error: ${error}` }, 500)
  }
})

// Count movies by type for template override (GET endpoint)
app.get('/make-server-e0516fcf/movies/count-by-type', async (c) => {
  try {
    const type = c.req.query('type')
    
    const results = await kv.getByPrefix('movie:')
    const movies = results.map(item => item.value)
    const matchingMovies = movies.filter(movie => movie.type === type)
    
    return c.json({ count: matchingMovies.length })
  } catch (error) {
    console.log('Count movies by type error:', error)
    return c.json({ error: `Count movies by type error: ${error}` }, 500)
  }
})

// Override cover field for all movies of specific type (protected route)
app.post('/make-server-e0516fcf/movies/override-covers', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized - admin access required' }, 401)
    }

    const { type, templateUrl } = await c.req.json()
    
    if (!type || !templateUrl) {
      return c.json({ error: 'Type and templateUrl are required' }, 400)
    }
    
    const results = await kv.getByPrefix('movie:')
    const movies = results.map(item => ({ key: item.key, value: item.value }))
    const matchingMovies = movies.filter(item => item.value.type === type)
    
    let updated = 0
    for (const movieItem of matchingMovies) {
      try {
        const movie = movieItem.value
        
        // Apply template with dmcode/code replacement if available - prioritize dmcode
        let newCover = templateUrl
        if (movie.dmcode && templateUrl.includes('*')) {
          newCover = templateUrl.replace(/\*/g, movie.dmcode)
        } else if (movie.code && templateUrl.includes('*')) {
          newCover = templateUrl.replace(/\*/g, movie.code)
        }
        
        // Update movie cover
        const updatedMovie = { ...movie, cover: newCover, updatedAt: new Date().toISOString() }
        await kv.set(movieItem.key, updatedMovie)
        updated++
        
      } catch (updateError) {
        console.error(`Server: Error updating movie ${movieItem.value.id}:`, updateError)
      }
    }
    
    return c.json({ updated })
  } catch (error) {
    console.log('Override covers error:', error)
    return c.json({ error: `Override covers error: ${error}` }, 500)
  }
})

// Master data routes
// GET routes (public access for reading data)
app.get('/make-server-e0516fcf/master/:type', async (c) => {
  try {
    const type = c.req.param('type')
    return await getMasterData(c)
  } catch (error) {
    console.error('Server Main Route: Error in master data route:', error)
    return c.json({ error: `Master data route error: ${error.message}` }, 500)
  }
})

// POST routes (protected - require authentication)
app.post('/make-server-e0516fcf/master/:type', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized - admin access required' }, 401)
    }

    return await createMasterData(c)
  } catch (error) {
    console.error('Create master data route error:', error)
    return c.json({ 
      error: `Create master data error: ${error.message}`,
      details: error?.stack
    }, 500)
  }
})

// DELETE routes (protected - require authentication)
app.delete('/make-server-e0516fcf/master/:type/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized - admin access required' }, 401)
    }

    return await deleteMasterData(c)
  } catch (error) {
    console.log('Delete master data error:', error)
    return c.json({ error: `Delete master data error: ${error}` }, 500)
  }
})

// Extended master data routes (for actors, actresses and directors with detailed fields)
app.post('/make-server-e0516fcf/master/:type/extended', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized - admin access required' }, 401)
    }

    return await createExtendedMasterData(c)
  } catch (error) {
    console.error('Create extended master data route error:', error)
    return c.json({ 
      error: `Create extended master data error: ${error.message}`,
      details: error?.stack
    }, 500)
  }
})

app.put('/make-server-e0516fcf/master/:type/:id/extended', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized - admin access required' }, 401)
    }

    return await updateExtendedMasterDataWithSync(c)
  } catch (error) {
    console.error('Update extended master data route error:', error)
    return c.json({ 
      error: `Update extended master data error: ${error.message}`,
      details: error?.stack
    }, 500)
  }
})

// Duplicate extended master data routes with f3064b20 prefix for consistency
app.post('/make-server-f3064b20/master/:type/extended', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized - admin access required' }, 401)
    }

    return await createExtendedMasterData(c)
  } catch (error) {
    console.error('Create extended master data route error (f3064b20):', error)
    return c.json({ 
      error: `Create extended master data error: ${error.message}`,
      details: error?.stack
    }, 500)
  }
})

app.put('/make-server-f3064b20/master/:type/:id/extended', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized - admin access required' }, 401)
    }

    return await updateExtendedMasterDataWithSync(c)
  } catch (error) {
    console.error('Update extended master data route error (f3064b20):', error)
    return c.json({ 
      error: `Update extended master data error: ${error.message}`,
      details: error?.stack
    }, 500)
  }
})

// Master data routes with f3064b20 prefix
app.get('/make-server-f3064b20/master/:type', async (c) => {
  try {
    return await getMasterData(c)
  } catch (error) {
    console.error('Server Main Route: Error in master data route (f3064b20):', error)
    return c.json({ error: `Master data route error: ${error.message}` }, 500)
  }
})

app.post('/make-server-f3064b20/master/:type', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized - admin access required' }, 401)
    }

    return await createMasterData(c)
  } catch (error) {
    console.error('Create master data route error (f3064b20):', error)
    return c.json({ 
      error: `Create master data error: ${error.message}`,
      details: error?.stack
    }, 500)
  }
})

app.delete('/make-server-f3064b20/master/:type/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized - admin access required' }, 401)
    }

    return await deleteMasterData(c)
  } catch (error) {
    console.log('Delete master data error (f3064b20):', error)
    return c.json({ error: `Delete master data error: ${error}` }, 500)
  }
})

// Template Groups routes (new simplified structure)
// Get all template groups
app.get('/make-server-e0516fcf/template-groups', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized - admin access required' }, 401)
    }

    const results = await kv.getByPrefix('template_group:')
    const groups = results.map(item => item.value)
    
    return c.json({ groups })
  } catch (error) {
    console.log('Get template groups error:', error)
    return c.json({ error: `Get template groups error: ${error}` }, 500)
  }
})

// Create template group
app.post('/make-server-e0516fcf/template-groups', async (c) => {
  try {
    console.log('=== Create Template Group Request ===')
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    console.log('Access token present:', !!accessToken)
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    console.log('User authenticated:', !!user?.id, 'Auth error:', authError?.message)
    
    if (!user?.id || authError) {
      console.log('Authentication failed in create template group')
      return c.json({ error: 'Unauthorized - admin access required' }, 401)
    }

    const groupData = await c.req.json()
    console.log('Group data received:', JSON.stringify(groupData, null, 2))
    
    if (!groupData.name || !groupData.templateUrl || !groupData.applicableTypes) {
      console.log('Validation failed - missing required fields')
      return c.json({ error: 'Name, templateUrl, and applicableTypes are required' }, 400)
    }

    // Generate ID
    const groupId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const templateGroup = {
      id: groupId,
      ...groupData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    console.log('Saving template group with ID:', groupId)
    await kv.set(`template_group:${groupId}`, templateGroup)
    console.log('Template group saved successfully')
    
    return c.json({ group: templateGroup })
  } catch (error) {
    console.error('Create template group error:', error)
    console.error('Error stack:', error.stack)
    return c.json({ 
      error: `Create template group error: ${error.message}`,
      details: error.stack 
    }, 500)
  }
})

// Update template group
app.put('/make-server-e0516fcf/template-groups/:id', async (c) => {
  try {
    console.log('=== Update Template Group Request ===')
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    console.log('Access token present:', !!accessToken)
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    console.log('User authenticated:', !!user?.id, 'Auth error:', authError?.message)
    
    if (!user?.id || authError) {
      console.log('Authentication failed in update template group')
      return c.json({ error: 'Unauthorized - admin access required' }, 401)
    }

    const id = c.req.param('id')
    console.log('Updating template group ID:', id)
    
    const existing = await kv.get(`template_group:${id}`)
    console.log('Existing template group found:', !!existing)
    
    if (!existing) {
      console.log('Template group not found for ID:', id)
      return c.json({ error: 'Template group not found' }, 404)
    }

    const updateData = await c.req.json()
    console.log('Update data received:', JSON.stringify(updateData, null, 2))
    
    const updatedGroup = {
      ...existing,
      ...updateData,
      id,
      updatedAt: new Date().toISOString()
    }
    
    console.log('Saving updated template group')
    await kv.set(`template_group:${id}`, updatedGroup)
    console.log('Template group updated successfully')
    
    return c.json({ group: updatedGroup })
  } catch (error) {
    console.error('Update template group error:', error)
    console.error('Error stack:', error.stack)
    return c.json({ 
      error: `Update template group error: ${error.message}`,
      details: error.stack 
    }, 500)
  }
})

// Delete template group
app.delete('/make-server-e0516fcf/template-groups/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized - admin access required' }, 401)
    }

    const id = c.req.param('id')
    const existing = await kv.get(`template_group:${id}`)
    
    if (!existing) {
      return c.json({ error: 'Template group not found' }, 404)
    }
    
    await kv.del(`template_group:${id}`)
    
    return c.json({ success: true })
  } catch (error) {
    console.log('Delete template group error:', error)
    return c.json({ error: `Delete template group error: ${error}` }, 500)
  }
})

// Get default template for studio or type
app.get('/make-server-e0516fcf/template-groups/default', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized - admin access required' }, 401)
    }

    const studio = c.req.query('studio')
    const type = c.req.query('type')
    
    console.log('=== Fetch Default Template Debug ===')
    console.log('Studio query:', studio)
    console.log('Type query:', type)
    
    if (!studio && !type) {
      return c.json({ error: 'Either studio or type parameter is required' }, 400)
    }

    // Get all template groups
    const results = await kv.getByPrefix('template_group:')
    const groups = results.map(item => item.value)
    
    console.log('Total template groups found:', groups.length)
    
    // Find default template
    let defaultTemplate = null
    
    // Priority 1: Studio template with isDefault=true
    if (studio) {
      console.log('Searching for studio template:', studio)
      defaultTemplate = groups.find(group => 
        group.isDefault && 
        group.applicableStudios && 
        group.applicableStudios.some(s => s.toLowerCase() === studio.toLowerCase())
      )
      if (defaultTemplate) {
        console.log('✅ Found studio default template:', defaultTemplate.name)
      } else {
        console.log('❌ No studio default template found for:', studio)
      }
    }
    
    // Priority 2: Type template with isDefault=true (if no studio template found)
    if (!defaultTemplate && type) {
      console.log('Searching for type template:', type)
      defaultTemplate = groups.find(group => 
        group.isDefault && 
        group.applicableTypes && 
        group.applicableTypes.some(t => t.toLowerCase() === type.toLowerCase())
      )
      if (defaultTemplate) {
        console.log('✅ Found type default template:', defaultTemplate.name)
      } else {
        console.log('❌ No type default template found for:', type)
      }
    }
    
    if (!defaultTemplate) {
      console.log('❌ No default template found for criteria')
      return c.json({ template: null })
    }
    
    console.log('📋 Returning default template:', {
      name: defaultTemplate.name,
      templateUrl: defaultTemplate.templateUrl,
      galleryTemplate: defaultTemplate.galleryTemplate,
      isDefault: defaultTemplate.isDefault
    })
    
    return c.json({ template: defaultTemplate })
  } catch (error) {
    console.error('Get default template error:', error)
    return c.json({ error: `Get default template error: ${error.message}` }, 500)
  }
})

// Apply template group to movies with progress tracking
app.post('/make-server-e0516fcf/template-groups/:id/apply', async (c) => {
  let progressKey: string | undefined
  
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized - admin access required' }, 401)
    }

    const id = c.req.param('id')
    const requestData = await c.req.json()
    const { templateUrl, galleryTemplate, applicableTypes, applicableStudios } = requestData
    progressKey = requestData.progressKey
    
    if (!templateUrl) {
      return c.json({ error: 'templateUrl is required' }, 400)
    }
    
    if ((!applicableTypes || !Array.isArray(applicableTypes) || applicableTypes.length === 0) &&
        (!applicableStudios || !Array.isArray(applicableStudios) || applicableStudios.length === 0)) {
      return c.json({ error: 'At least one applicable type or studio is required' }, 400)
    }

    console.log('=== Server Apply Template Debug ===')
    console.log('Template Group ID:', id)
    console.log('Template URL received:', templateUrl)
    console.log('Gallery Template received:', galleryTemplate)
    console.log('Applicable Types received:', applicableTypes || [])
    console.log('Applicable Studios received:', applicableStudios || [])
    console.log('Progress Key:', progressKey)
    
    const finalApplicableTypes = applicableTypes || []
    const finalApplicableStudios = applicableStudios || []
    
    console.log(`Server: Applying template for types: ${finalApplicableTypes.join(', ')}`)
    console.log(`Server: Applying template for studios: ${finalApplicableStudios.join(', ')}`)
    
    const results = await kv.getByPrefix('movie:')
    const movies = results.map(item => ({ key: item.key, value: item.value }))
    const matchingMovies = movies.filter(item => {
      const typeMatch = finalApplicableTypes.length > 0 ? finalApplicableTypes.includes(item.value.type) : false
      const studioMatch = finalApplicableStudios.length > 0 ? finalApplicableStudios.includes(item.value.studio) : false
      
      // Movie matches if it matches type OR studio (not both required)
      return typeMatch || studioMatch
    })
    
    console.log(`Server: Found ${matchingMovies.length} movies to update`)
    
    // Initialize progress tracking
    if (progressKey) {
      await kv.set(progressKey, {
        total: matchingMovies.length,
        processed: 0,
        status: 'processing',
        startTime: new Date().toISOString()
      })
    }
    
    let updatedCount = 0
    const affectedMovies = []
    
    for (let i = 0; i < matchingMovies.length; i++) {
      const movieItem = matchingMovies[i]
      try {
        const movie = movieItem.value
        
        // Apply template with dmcode/code replacement if available - prioritize dmcode
        let newCover = templateUrl
        if (movie.dmcode && templateUrl.includes('*')) {
          newCover = templateUrl.replace(/\*/g, movie.dmcode)
        } else if (movie.code && templateUrl.includes('*')) {
          newCover = templateUrl.replace(/\*/g, movie.code)
        }
        
        // Apply gallery template if provided
        let newGallery = movie.gallery // Keep existing gallery if no template
        if (galleryTemplate) {
          newGallery = galleryTemplate
          
          // Replace * with dmcode/code
          if (movie.dmcode && galleryTemplate.includes('*')) {
            newGallery = newGallery.replace(/\*/g, movie.dmcode)
          } else if (movie.code && galleryTemplate.includes('*')) {
            newGallery = newGallery.replace(/\*/g, movie.code)
          }
          
          // Keep hashtags (#) as-is for client-side processing
          // EnhancedGallery will handle hashtag to number conversion during display
        }
        
        // Update movie with new cover and gallery
        const updatedMovie = { 
          ...movie, 
          cover: newCover,
          ...(galleryTemplate && { gallery: newGallery }),
          updatedAt: new Date().toISOString() 
        }
        await kv.set(movieItem.key, updatedMovie)
        updatedCount++
        affectedMovies.push(movie.id || movie.code || 'Unknown')
        
        console.log(`Server: Updated movie ${movie.id} cover to: ${newCover}`)
        if (galleryTemplate) {
          console.log(`Server: Updated movie ${movie.id} gallery to: ${newGallery}`)
        }

        // Update progress
        if (progressKey && (i + 1) % 3 === 0) { // Update every 3 items for more frequent updates
          await kv.set(progressKey, {
            total: matchingMovies.length,
            processed: i + 1,
            status: 'processing',
            startTime: new Date().toISOString(),
            currentMovie: movie.titleEn || movie.titleJp || movie.code
          })
        }
      } catch (updateError) {
        console.error(`Server: Error updating movie ${movieItem.value.id}:`, updateError)
      }
    }
    
    // Mark progress as completed
    if (progressKey) {
      await kv.set(progressKey, {
        total: matchingMovies.length,
        processed: matchingMovies.length,
        status: 'completed',
        startTime: new Date().toISOString(),
        completedAt: new Date().toISOString()
      })
    }
    
    console.log(`Server: Successfully updated ${updatedCount} movies`)
    return c.json({ updatedCount, affectedMovies })
  } catch (error) {
    console.log('Apply template group error:', error)
    
    // Mark progress as failed
    if (progressKey) {
      try {
        await kv.set(progressKey, {
          status: 'failed',
          error: error.message,
          timestamp: new Date().toISOString()
        })
      } catch (kvError) {
        console.log('Could not update progress for failed operation:', kvError)
      }
    }
    
    return c.json({ error: `Apply template group error: ${error}` }, 500)
  }
})

// Get movie types from existing movies
app.get('/make-server-e0516fcf/movie-types', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized - admin access required' }, 401)
    }

    const results = await kv.getByPrefix('movie:')
    const movies = results.map(item => item.value)
    const types = [...new Set(movies.map(movie => movie.type).filter(Boolean))]
    
    return c.json({ types })
  } catch (error) {
    console.log('Get movie types error:', error)
    return c.json({ error: `Get movie types error: ${error}` }, 500)
  }
})

// Get movie studios from existing movies
app.get('/make-server-e0516fcf/movie-studios', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized - admin access required' }, 401)
    }

    const results = await kv.getByPrefix('movie:')
    const movies = results.map(item => item.value)
    const studios = [...new Set(movies.map(movie => movie.studio).filter(Boolean))]
    
    return c.json({ studios })
  } catch (error) {
    console.log('Get movie studios error:', error)
    return c.json({ error: `Get movie studios error: ${error}` }, 500)
  }
})

// BULK ASSIGNMENT ROUTES
// ==================================================================================

// Bulk assign metadata
app.post('/make-server-e0516fcf/bulk/assign-metadata', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized - admin access required' }, 401)
    }

    const { movieIds, metadataType, metadataValue } = await c.req.json()
    
    if (!movieIds || !Array.isArray(movieIds) || movieIds.length === 0) {
      return c.json({ error: 'movieIds array is required' }, 400)
    }
    
    if (!metadataType || !metadataValue) {
      return c.json({ error: 'metadataType and metadataValue are required' }, 400)
    }

    let updatedCount = 0
    const updatedMovies = []

    for (const movieId of movieIds) {
      try {
        const existingMovie = await kv.get(`movie:${movieId}`)
        if (existingMovie) {
          const updatedMovie = {
            ...existingMovie,
            [metadataType]: metadataValue,
            updatedAt: new Date().toISOString()
          }
          await kv.set(`movie:${movieId}`, updatedMovie)
          updatedCount++
          updatedMovies.push(movieId)
        }
      } catch (error) {
        console.error(`Error updating movie ${movieId}:`, error)
      }
    }

    return c.json({
      success: true,
      updatedCount,
      updatedMovies,
      metadataType,
      metadataValue
    })
  } catch (error) {
    console.log('Bulk assign metadata error:', error)
    return c.json({ error: `Bulk assign metadata error: ${error}` }, 500)
  }
})

// Bulk assign cast
app.post('/make-server-e0516fcf/bulk/assign-cast', async (c) => {
  try {
    console.log('=== BULK ASSIGN CAST START ===')
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    
    if (!accessToken) {
      console.log('Bulk assign cast: No authorization token provided')
      return c.json({ error: 'Authorization token is required' }, 401)
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      console.log('Bulk assign cast: Authentication failed', { error: authError, userId: user?.id })
      return c.json({ error: 'Unauthorized - admin access required' }, 401)
    }

    const requestBody = await c.req.json()
    const { movieIds, castType, castMembers, assignmentMode = 'append' } = requestBody
    console.log('Bulk assign cast request:', { movieIds, castType, castMembers, assignmentMode })
    
    // Validate movieIds
    if (!movieIds || !Array.isArray(movieIds) || movieIds.length === 0) {
      console.log('Bulk assign cast: Invalid movieIds', { movieIds })
      return c.json({ error: 'movieIds must be a non-empty array' }, 400)
    }
    
    // Validate castType and castMembers
    if (!castType || !castMembers || !Array.isArray(castMembers) || castMembers.length === 0) {
      console.log('Bulk assign cast: Invalid cast data', { castType, castMembers })
      return c.json({ error: 'castType and castMembers array are required' }, 400)
    }

    // Validate castType
    const validCastTypes = ['actress', 'actors', 'director']
    if (!validCastTypes.includes(castType)) {
      console.log('Bulk assign cast: Invalid cast type', { castType, validTypes: validCastTypes })
      return c.json({ error: `castType must be one of: ${validCastTypes.join(', ')}` }, 400)
    }

    // Map cast types to correct field names (keep them the same since they match database fields)
    const fieldMapping = {
      'actress': 'actress',   // Single actress field
      'actors': 'actors',     // Plural actors field
      'director': 'director'  // Single director field
    }
    
    const targetField = fieldMapping[castType]
    console.log(`Mapping cast type "${castType}" to field "${targetField}"`)

    let updatedCount = 0
    const updatedMovies = []
    const errorMovies = []

    for (const movieId of movieIds) {
      try {
        console.log(`Processing movie ${movieId} for cast assignment`)
        const existingMovie = await kv.get(`movie:${movieId}`)
        
        if (!existingMovie) {
          console.log(`Movie ${movieId} not found in database`)
          errorMovies.push({ movieId, error: 'Movie not found' })
          continue
        }

        console.log(`Found existing movie:`, { 
          id: existingMovie.id, 
          title: existingMovie.titleEn || existingMovie.titleJp,
          currentCast: existingMovie[targetField] 
        })
        
        let newCastValue
        
        if (assignmentMode === 'replace') {
          // Replace mode: replace existing cast entirely
          newCastValue = castMembers.filter(member => member && member.trim()).join(', ')
          console.log(`Replace mode: Setting ${targetField} to:`, newCastValue)
        } else {
          // Append mode: append to existing cast, avoiding duplicates
          const existingCast = existingMovie[targetField] ? 
            existingMovie[targetField].split(',').map(c => c.trim()).filter(c => c) : []
          
          const newCast = [...existingCast]
          
          for (const member of castMembers) {
            const cleanMember = member?.trim()
            if (cleanMember && !newCast.includes(cleanMember)) {
              newCast.push(cleanMember)
            }
          }
          
          newCastValue = newCast.join(', ')
          console.log(`Append mode: ${targetField} from [${existingCast.join(', ')}] to [${newCastValue}]`)
        }
        
        const updatedMovie = {
          ...existingMovie,
          [targetField]: newCastValue,
          updatedAt: new Date().toISOString()
        }
        
        await kv.set(`movie:${movieId}`, updatedMovie)
        console.log(`Successfully updated movie ${movieId} with new ${targetField}: ${newCastValue}`)
        updatedCount++
        updatedMovies.push(movieId)
        
      } catch (error) {
        console.error(`Error updating movie ${movieId}:`, error)
        errorMovies.push({ movieId, error: error.message })
      }
    }

    console.log(`=== BULK ASSIGN CAST COMPLETE: Updated ${updatedCount} movies ===`)
    
    if (errorMovies.length > 0) {
      console.log('Some movies had errors:', errorMovies)
    }

    return c.json({
      success: true,
      updatedCount,
      updatedMovies,
      castType,
      castMembers,
      assignmentMode,
      targetField,
      ...(errorMovies.length > 0 && { errors: errorMovies })
    })
  } catch (error) {
    console.error('Bulk assign cast error:', error)
    return c.json({ 
      error: `Bulk assign cast error: ${error.message}`,
      stack: error.stack 
    }, 500)
  }
})

// Bulk assign template
app.post('/make-server-e0516fcf/bulk/assign-template', async (c) => {
  try {
    console.log('=== BULK ASSIGN TEMPLATE START ===')
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      console.log('Bulk assign template: Authentication failed')
      return c.json({ error: 'Unauthorized - admin access required' }, 401)
    }

    const { movieIds, templateGroupId, templateUrl, galleryTemplate, applicableStudios } = await c.req.json()
    console.log('Bulk assign template request:', { movieIds, templateGroupId, templateUrl, galleryTemplate, applicableStudios })
    
    if (!movieIds || !Array.isArray(movieIds) || movieIds.length === 0) {
      console.log('Bulk assign template: Invalid movieIds')
      return c.json({ error: 'movieIds array is required' }, 400)
    }
    
    if (!templateUrl) {
      console.log('Bulk assign template: Invalid template data')
      return c.json({ error: 'templateUrl is required' }, 400)
    }

    let updatedCount = 0
    const updatedMovies = []

    for (const movieId of movieIds) {
      try {
        console.log(`Processing movie ${movieId} for template assignment`)
        const existingMovie = await kv.get(`movie:${movieId}`)
        if (existingMovie) {
          console.log(`Found existing movie:`, { id: existingMovie.id, currentCover: existingMovie.cover })
          
          // Apply template with dmcode/code replacement if available - prioritize dmcode
          let newCover = templateUrl
          if (existingMovie.dmcode && templateUrl.includes('*')) {
            newCover = templateUrl.replace(/\*/g, existingMovie.dmcode)
          } else if (existingMovie.code && templateUrl.includes('*')) {
            newCover = templateUrl.replace(/\*/g, existingMovie.code)
          }
          
          // Apply gallery template if provided
          let newGallery = existingMovie.gallery // Keep existing gallery if no template
          if (galleryTemplate) {
            newGallery = galleryTemplate
            
            // Replace * with dmcode/code
            if (existingMovie.dmcode && galleryTemplate.includes('*')) {
              newGallery = newGallery.replace(/\*/g, existingMovie.dmcode)
            } else if (existingMovie.code && galleryTemplate.includes('*')) {
              newGallery = newGallery.replace(/\*/g, existingMovie.code)
            }
          }
          
          const updatedMovie = {
            ...existingMovie,
            cover: newCover,
            ...(galleryTemplate && { gallery: newGallery }),
            updatedAt: new Date().toISOString()
          }
          
          await kv.set(`movie:${movieId}`, updatedMovie)
          console.log(`Successfully updated movie ${movieId} with new cover: ${newCover}`)
          if (galleryTemplate) {
            console.log(`Successfully updated movie ${movieId} with new gallery: ${newGallery}`)
          }
          updatedCount++
          updatedMovies.push(movieId)
        } else {
          console.log(`Movie ${movieId} not found`)
        }
      } catch (error) {
        console.error(`Error updating movie ${movieId}:`, error)
      }
    }

    console.log(`=== BULK ASSIGN TEMPLATE COMPLETE: Updated ${updatedCount} movies ===`)

    return c.json({
      success: true,
      updatedCount,
      updatedMovies,
      templateGroupId
    })
  } catch (error) {
    console.error('Bulk assign template error:', error)
    return c.json({ error: `Bulk assign template error: ${error}` }, 500)
  }
})

// FAVORITES ROUTES
// ==================================================================================

// GET /favorites - List user's favorites
app.get('/make-server-e0516fcf/favorites', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      console.error('Unauthorized access to favorites:', authError?.message)
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const allFavorites = await kv.getByPrefix('favorite_')
    const userFavorites = allFavorites
      .map(item => item.value)
      .filter(fav => fav.userId === user.id)
    
    console.log(`Server: Found ${userFavorites.length} favorites for user ${user.id}`)
    return c.json(userFavorites)
  } catch (error) {
    console.error('Server: Get favorites error:', error)
    return c.json({ error: 'Failed to fetch favorites' }, 500)
  }
})

// POST /favorites - Add new favorite
app.post('/make-server-e0516fcf/favorites', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const favoriteData = await c.req.json()
    
    if (!favoriteData.type || !favoriteData.itemId) {
      return c.json({ error: 'Type and itemId are required' }, 400)
    }
    
    // Check for existing favorite
    try {
      const existingFavorites = await kv.getByPrefix('favorite_')
      const duplicate = existingFavorites.find(item => {
        const fav = item.value
        return fav.type === favoriteData.type && 
               fav.itemId === favoriteData.itemId &&
               fav.userId === user.id &&
               // Match sourceId exactly - both should be undefined or both should match
               ((favoriteData.sourceId && fav.sourceId === favoriteData.sourceId) || 
                (!favoriteData.sourceId && !fav.sourceId))
      })
      
      if (duplicate) {
        return c.json({ error: 'Item is already in favorites' }, 409)
      }
    } catch (checkError) {
      console.error('Duplicate check error:', checkError)
      // Continue with creation if duplicate check fails
    }
    
    // Generate ID and set metadata
    const id = `fav_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
    const favorite = {
      ...favoriteData,
      id,
      userId: user.id,
      createdAt: new Date().toISOString()
    }
    
    await kv.set(`favorite_${id}`, favorite)
    
    return c.json(favorite)
  } catch (error) {
    console.error('Server: Create favorite error:', error)
    return c.json({ error: 'Failed to create favorite' }, 500)
  }
})

// DELETE /favorites/:id - Remove favorite
app.delete('/make-server-e0516fcf/favorites/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const id = c.req.param('id')
    
    const existing = await kv.get(`favorite_${id}`)
    
    if (!existing) {
      return c.json({ error: 'Favorite not found' }, 404)
    }
    
    // Check if user owns this favorite
    if (existing.userId && existing.userId !== user.id) {
      return c.json({ error: 'Unauthorized - can only delete own favorites' }, 403)
    }
    
    await kv.del(`favorite_${id}`)
    
    return c.json({ success: true })
  } catch (error) {
    console.error('Server: Remove favorite error:', error)
    return c.json({ error: 'Failed to remove favorite' }, 500)
  }
})

// Get user's favorites by type
app.get('/make-server-e0516fcf/favorites/:type', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const type = c.req.param('type')
    
    const allFavorites = await kv.getByPrefix('favorite_')
    const userFavorites = allFavorites
      .map(item => item.value)
      .filter(fav => fav.userId === user.id && fav.type === type)
    
    return c.json(userFavorites)
  } catch (error) {
    console.error('Server: Get favorites by type error:', error)
    return c.json({ error: 'Failed to fetch favorites' }, 500)
  }
})

// PHOTOBOOK ROUTES - Complete implementation with proper error handling and authentication
// ==================================================================================

// Helper to generate photobook ID
function generatePhotobookId(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `pb_${timestamp}_${random}`
}

// Helper to search in text fields
function matchesQuery(photobook: any, query: string): boolean {
  const searchFields = [
    photobook.titleEn,
    photobook.titleJp,
    photobook.actress,
  ].filter(Boolean)
  
  // Also search in image tag actresses
  if (photobook.imageTags) {
    const allActresses = photobook.imageTags.flatMap((tag: any) => tag.actresses)
    searchFields.push(...allActresses)
  }
  
  const searchText = searchFields.join(' ').toLowerCase()
  return searchText.includes(query.toLowerCase())
}

// Helper to check if photobook contains actress
function containsActress(photobook: any, actressName: string): boolean {
  // Check main actress field
  if (photobook.actress === actressName) {
    return true
  }
  
  // Check image tags
  if (photobook.imageTags) {
    return photobook.imageTags.some((tag: any) => tag.actresses.includes(actressName))
  }
  
  return false
}

// GET /photobooks - List all photobooks (PUBLIC ACCESS)
app.get('/make-server-e0516fcf/photobooks', async (c) => {
  try {
    console.log('Server: GET /photobooks - Fetching all photobooks')
    const photobooks = await kv.getByPrefix('photobook_')
    console.log(`Server: Found ${photobooks.length} photobooks`)
    return c.json(photobooks.map(item => item.value))
  } catch (error) {
    console.error('Server: Get photobooks error:', error)
    return c.json({ error: 'Failed to fetch photobooks' }, 500)
  }
})

// GET /photobooks/search - Search photobooks (PUBLIC ACCESS)
app.get('/make-server-e0516fcf/photobooks/search', async (c) => {
  try {
    const query = c.req.query('q')
    console.log('Server: GET /photobooks/search - Query:', query)
    
    if (!query) {
      return c.json([])
    }

    const photobooks = await kv.getByPrefix('photobook_')
    const filtered = photobooks
      .map(item => item.value)
      .filter(photobook => matchesQuery(photobook, query))
    
    console.log(`Server: Search found ${filtered.length} matching photobooks`)
    return c.json(filtered)
  } catch (error) {
    console.error('Server: Search photobooks error:', error)
    return c.json({ error: 'Failed to search photobooks' }, 500)
  }
})

// GET /photobooks/by-actress/:name - Get photobooks containing specific actress (PUBLIC ACCESS)
app.get('/make-server-e0516fcf/photobooks/by-actress/:name', async (c) => {
  try {
    const actressName = decodeURIComponent(c.req.param('name'))
    console.log('Server: GET /photobooks/by-actress - Actress:', actressName)
    
    if (!actressName) {
      return c.json([])
    }

    const photobooks = await kv.getByPrefix('photobook_')
    const filtered = photobooks
      .map(item => item.value)
      .filter(photobook => containsActress(photobook, actressName))
    
    console.log(`Server: Found ${filtered.length} photobooks for actress ${actressName}`)
    return c.json(filtered)
  } catch (error) {
    console.error('Server: Get photobooks by actress error:', error)
    return c.json({ error: 'Failed to fetch photobooks by actress' }, 500)
  }
})

// GET /photobooks/:id - Get single photobook (PUBLIC ACCESS)
app.get('/make-server-e0516fcf/photobooks/:id', async (c) => {
  try {
    const id = c.req.param('id')
    console.log('Server: GET /photobooks/:id - ID:', id)
    
    const photobook = await kv.get(`photobook_${id}`)
    console.log('Server: Photobook found:', !!photobook)
    
    if (!photobook) {
      console.log('Server: Photobook not found for ID:', id)
      return c.json({ error: 'Photobook not found' }, 404)
    }
    
    return c.json(photobook)
  } catch (error) {
    console.error('Server: Get photobook error:', error)
    return c.json({ error: 'Failed to fetch photobook' }, 500)
  }
})

// POST /photobooks - Create new photobook (PROTECTED ROUTE)
app.post('/make-server-e0516fcf/photobooks', async (c) => {
  try {
    console.log('Server: POST /photobooks - Creating new photobook')
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      console.log('Server: Unauthorized access to create photobook')
      return c.json({ error: 'Unauthorized - admin access required' }, 401)
    }
    
    const photobookData = await c.req.json()
    console.log('Server: Photobook data received:', Object.keys(photobookData))
    
    // Validate required fields
    if (!photobookData.titleEn?.trim()) {
      return c.json({ error: 'English title is required' }, 400)
    }
    
    // Generate ID and set metadata
    const id = generatePhotobookId()
    const photobook = {
      ...photobookData,
      id,
      titleEn: photobookData.titleEn.trim(),
      titleJp: photobookData.titleJp?.trim() || '',
      link: photobookData.link?.trim() || '',
      cover: photobookData.cover?.trim() || '',
      releaseDate: photobookData.releaseDate || '',
      actress: photobookData.actress?.trim() || '',
      imageLinks: photobookData.imageLinks?.trim() || '',
      imageTags: photobookData.imageTags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    console.log('Server: Saving photobook with ID:', id)
    await kv.set(`photobook_${id}`, photobook)
    console.log('Server: Photobook created successfully')
    
    return c.json(photobook)
  } catch (error) {
    console.error('Server: Create photobook error:', error)
    return c.json({ error: 'Failed to create photobook' }, 500)
  }
})

// PUT /photobooks/:id - Update photobook (PROTECTED ROUTE)
app.put('/make-server-e0516fcf/photobooks/:id', async (c) => {
  try {
    const id = c.req.param('id')
    console.log('Server: PUT /photobooks/:id - ID:', id)
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      console.log('Server: Unauthorized access to update photobook')
      return c.json({ error: 'Unauthorized - admin access required' }, 401)
    }
    
    const updates = await c.req.json()
    console.log('Server: Update data received:', Object.keys(updates))
    
    // Get existing photobook
    const existing = await kv.get(`photobook_${id}`)
    if (!existing) {
      console.log('Server: Photobook not found for update, ID:', id)
      return c.json({ error: 'Photobook not found' }, 404)
    }
    
    // Validate required fields
    if (updates.titleEn !== undefined && !updates.titleEn?.trim()) {
      return c.json({ error: 'English title is required' }, 400)
    }
    
    // Merge updates
    const photobook = {
      ...existing,
      ...updates,
      id, // Ensure ID doesn't change
      titleEn: updates.titleEn?.trim() || existing.titleEn,
      titleJp: updates.titleJp?.trim() ?? existing.titleJp,
      link: updates.link?.trim() ?? existing.link,
      cover: updates.cover?.trim() ?? existing.cover,
      releaseDate: updates.releaseDate ?? existing.releaseDate,
      actress: updates.actress?.trim() ?? existing.actress,
      imageLinks: updates.imageLinks?.trim() ?? existing.imageLinks,
      imageTags: updates.imageTags ?? existing.imageTags,
      updatedAt: new Date().toISOString()
    }
    
    console.log('Server: Saving updated photobook')
    await kv.set(`photobook_${id}`, photobook)
    console.log('Server: Photobook updated successfully')
    
    return c.json(photobook)
  } catch (error) {
    console.error('Server: Update photobook error:', error)
    return c.json({ error: 'Failed to update photobook' }, 500)
  }
})

// DELETE /photobooks/:id - Delete photobook (PROTECTED ROUTE)
app.delete('/make-server-e0516fcf/photobooks/:id', async (c) => {
  try {
    const id = c.req.param('id')
    console.log('Server: DELETE /photobooks/:id - ID:', id)
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      console.log('Server: Unauthorized access to delete photobook')
      return c.json({ error: 'Unauthorized - admin access required' }, 401)
    }
    
    // Check if photobook exists
    const existing = await kv.get(`photobook_${id}`)
    if (!existing) {
      console.log('Server: Photobook not found for deletion, ID:', id)
      return c.json({ error: 'Photobook not found' }, 404)
    }
    
    await kv.del(`photobook_${id}`)
    console.log('Server: Photobook deleted successfully')
    
    return c.json({ message: 'Photobook deleted successfully' })
  } catch (error) {
    console.error('Server: Delete photobook error:', error)
    return c.json({ error: 'Failed to delete photobook' }, 500)
  }
})

// BULK ASSIGNMENT ROUTES
// ==================================================================================

// Bulk assign metadata to multiple movies
app.post('/make-server-e0516fcf/bulk/assign-metadata', async (c) => {
  try {
    console.log('=== Bulk Assign Metadata Request ===')
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      console.log('Authentication failed in bulk assign metadata')
      return c.json({ error: 'Unauthorized - admin access required' }, 401)
    }

    const { movieIds, metadataType, metadataValue } = await c.req.json()
    console.log('Bulk metadata assignment:', { movieIds: movieIds?.length, metadataType, metadataValue })
    
    if (!movieIds || !Array.isArray(movieIds) || movieIds.length === 0) {
      return c.json({ error: 'movieIds array is required' }, 400)
    }
    
    if (!metadataType || !metadataValue) {
      return c.json({ error: 'metadataType and metadataValue are required' }, 400)
    }

    let updatedCount = 0
    const updatedMovies = []
    
    for (const movieId of movieIds) {
      try {
        const existingMovie = await kv.get(`movie:${movieId}`)
        
        if (existingMovie) {
          const updatedMovie = {
            ...existingMovie,
            [metadataType]: metadataType === 'tags' && existingMovie[metadataType] 
              ? `${existingMovie[metadataType]}, ${metadataValue}` 
              : metadataValue,
            updatedAt: new Date().toISOString()
          }
          
          await kv.set(`movie:${movieId}`, updatedMovie)
          updatedCount++
          updatedMovies.push(movieId)
          
          console.log(`Updated movie ${movieId} ${metadataType} to: ${updatedMovie[metadataType]}`)
        }
      } catch (updateError) {
        console.error(`Error updating movie ${movieId}:`, updateError)
      }
    }
    
    console.log(`Successfully updated ${updatedCount} movies`)
    return c.json({ 
      success: true, 
      updatedCount, 
      updatedMovies,
      metadataType,
      metadataValue
    })
  } catch (error) {
    console.error('Bulk assign metadata error:', error)
    return c.json({ error: `Bulk assign metadata error: ${error}` }, 500)
  }
})

// Bulk assign cast to multiple movies
app.post('/make-server-e0516fcf/bulk/assign-cast', async (c) => {
  try {
    console.log('=== Bulk Assign Cast Request ===')
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      console.log('Authentication failed in bulk assign cast')
      return c.json({ error: 'Unauthorized - admin access required' }, 401)
    }

    const { movieIds, castType, castMembers, assignmentMode = 'append' } = await c.req.json()
    console.log('Bulk cast assignment:', { movieIds, castType, castMembers, assignmentMode })
    
    if (!movieIds || !Array.isArray(movieIds) || movieIds.length === 0) {
      return c.json({ error: 'movieIds array is required' }, 400)
    }
    
    if (!castType || !castMembers || !Array.isArray(castMembers) || castMembers.length === 0) {
      return c.json({ error: 'castType and castMembers array are required' }, 400)
    }

    let updatedCount = 0
    const updatedMovies = []
    
    for (const movieId of movieIds) {
      try {
        const existingMovie = await kv.get(`movie:${movieId}`)
        
        if (existingMovie) {
          let newCastValue = castMembers.join(', ')
          
          if (assignmentMode === 'append' && existingMovie[castType]) {
            const existingCast = existingMovie[castType].split(',').map((c: string) => c.trim())
            const uniqueCast = [...new Set([...existingCast, ...castMembers])]
            newCastValue = uniqueCast.join(', ')
          }
          
          const updatedMovie = {
            ...existingMovie,
            [castType]: newCastValue,
            updatedAt: new Date().toISOString()
          }
          
          await kv.set(`movie:${movieId}`, updatedMovie)
          updatedCount++
          updatedMovies.push(movieId)
          
          console.log(`Updated movie ${movieId} ${castType} to: ${newCastValue}`)
        }
      } catch (updateError) {
        console.error(`Error updating movie ${movieId}:`, updateError)
      }
    }
    
    console.log(`Successfully updated ${updatedCount} movies`)
    return c.json({ 
      success: true, 
      updatedCount, 
      updatedMovies,
      castType,
      castMembers,
      assignmentMode
    })
  } catch (error) {
    console.error('Bulk assign cast error:', error)
    return c.json({ error: `Bulk assign cast error: ${error}` }, 500)
  }
})

// Bulk assign template to multiple movies
app.post('/make-server-e0516fcf/bulk/assign-template', async (c) => {
  try {
    console.log('=== Bulk Assign Template Request ===')
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      console.log('Authentication failed in bulk assign template')
      return c.json({ error: 'Unauthorized - admin access required' }, 401)
    }

    const { movieIds, templateGroupId, templateUrl, galleryTemplate, applicableStudios } = await c.req.json()
    console.log('Bulk template assignment:', { movieIds, templateGroupId, templateUrl, galleryTemplate, applicableStudios })
    
    if (!movieIds || !Array.isArray(movieIds) || movieIds.length === 0) {
      return c.json({ error: 'movieIds array is required' }, 400)
    }
    
    if (!templateUrl) {
      return c.json({ error: 'templateUrl is required' }, 400)
    }

    let updatedCount = 0
    const updatedMovies = []
    
    for (const movieId of movieIds) {
      try {
        const existingMovie = await kv.get(`movie:${movieId}`)
        
        if (existingMovie) {
          // Apply template with dmcode/code replacement if available - prioritize dmcode
          let newCover = templateUrl
          if (existingMovie.dmcode && templateUrl.includes('*')) {
            newCover = templateUrl.replace(/\*/g, existingMovie.dmcode)
          } else if (existingMovie.code && templateUrl.includes('*')) {
            newCover = templateUrl.replace(/\*/g, existingMovie.code)
          }
          
          // Apply gallery template if provided
          let updatedFields = { cover: newCover }
          
          if (galleryTemplate) {
            let newGallery = galleryTemplate
            
            // Replace * with dmcode/code
            if (existingMovie.dmcode && galleryTemplate.includes('*')) {
              newGallery = newGallery.replace(/\*/g, existingMovie.dmcode)
            } else if (existingMovie.code && galleryTemplate.includes('*')) {
              newGallery = newGallery.replace(/\*/g, existingMovie.code)
            }
            
            updatedFields.gallery = newGallery
          }
          
          const updatedMovie = {
            ...existingMovie,
            ...updatedFields,
            updatedAt: new Date().toISOString()
          }
          
          await kv.set(`movie:${movieId}`, updatedMovie)
          updatedCount++
          updatedMovies.push(movieId)
          
          console.log(`Updated movie ${movieId} cover to: ${newCover}`)
          if (galleryTemplate) {
            console.log(`Updated movie ${movieId} gallery to: ${updatedFields.gallery}`)
          }
        }
      } catch (updateError) {
        console.error(`Error updating movie ${movieId}:`, updateError)
      }
    }
    
    console.log(`Successfully updated ${updatedCount} movies`)
    return c.json({ 
      success: true, 
      updatedCount, 
      updatedMovies,
      templateGroupId
    })
  } catch (error) {
    console.error('Bulk assign template error:', error)
    return c.json({ error: `Bulk assign template error: ${error}` }, 500)
  }
})

// TEST ROUTE for connectivity debugging
app.get('/make-server-e0516fcf/test-connection', async (c) => {
  try {
    console.log('Server: Test connection endpoint called')
    console.log('Server: Environment check:', {
      SUPABASE_URL: !!Deno.env.get('SUPABASE_URL'),
      SUPABASE_SERVICE_ROLE_KEY: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    })
    
    return c.json({
      success: true,
      message: 'Server is running and accessible',
      timestamp: new Date().toISOString(),
      environment: {
        SUPABASE_URL: !!Deno.env.get('SUPABASE_URL'),
        SUPABASE_SERVICE_ROLE_KEY: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
      },
      routes: [
        '/health',
        '/favorites',
        '/movies',
        '/photobooks',
        '/master',
        '/template-groups'
      ]
    })
  } catch (error) {
    console.error('Server: Test connection error:', error)
    return c.json({ error: 'Test connection failed', details: error.message }, 500)
  }
})

// POST /photobooks/check - Check if item is favorited
app.post('/make-server-e0516fcf/favorites/check', async (c) => {
  try {
    const { type, itemId, sourceId } = await c.req.json()
    console.log('Checking favorite status for:', { type, itemId, sourceId })
    
    if (!type || !itemId) {
      return c.json({ error: 'Type and itemId are required' }, 400)
    }
    
    const favorites = await kv.getByPrefix('favorite_')
    const existingFavorite = favorites.find(item => {
      const fav = item.value
      return fav.type === type && 
             fav.itemId === itemId &&
             (sourceId ? fav.sourceId === sourceId : !fav.sourceId)
    })
    
    return c.json({ 
      isFavorite: !!existingFavorite,
      favoriteId: existingFavorite?.value?.id || null
    })
  } catch (error) {
    console.error('Check favorite error:', error)
    return c.json({ error: 'Failed to check favorite status' }, 500)
  }
})

// Start the server
// ==================================================================================
// MASTER DATA ROUTES (f3064b20 prefix)
// ==================================================================================

// Get all master data by type
app.get('/make-server-f3064b20/master/:type', getMasterData)

// Create new master data item (simple types)
app.post('/make-server-f3064b20/master/:type', createMasterData)

// Create extended master data item (complex types)
app.post('/make-server-f3064b20/master/:type/extended', createExtendedMasterData)

// Update extended master data item


// Update extended master data item with sync
app.put('/make-server-f3064b20/master/:type/:id/extended/sync', updateExtendedMasterDataWithSync)

// Update simple master data item with sync
app.put('/make-server-f3064b20/master/:type/:id/sync', updateSimpleMasterDataWithSync)

// Delete master data item
app.delete('/make-server-f3064b20/master/:type/:id', deleteMasterData)

// ==================================================================================
// MOVIE TYPE COLORS ROUTES (with f3064b20 prefix for consistency)
// ==================================================================================

// Get movie type colors
app.get('/make-server-f3064b20/movie-type-colors', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized - admin access required' }, 401)
    }

    // Try both global and user-specific keys
    const globalKey = 'movie_type_colors'
    const userKey = `movie_type_colors:${user.id}`
    
    console.log('GET request - user ID:', user.id)
    console.log('GET request - trying global key:', globalKey)
    console.log('GET request - trying user key:', userKey)
    
    let colorsData = await kv.get(globalKey)
    console.log('Retrieved colors data from KV store (global):', colorsData)
    
    if (!colorsData) {
      colorsData = await kv.get(userKey)
      console.log('Retrieved colors data from KV store (user-specific):', colorsData)
    }
    
    // Additional debugging - list all keys with prefix
    const allKeys = await kv.getByPrefix('movie_type_colors')
    console.log('All movie_type_colors keys in KV store (GET):', allKeys.map(k => k.key))
    
    let colors = {}
    
    if (colorsData) {
      try {
        // colorsData is already the parsed value from KV store
        colors = typeof colorsData === 'string' ? JSON.parse(colorsData) : colorsData
        console.log('Successfully parsed colors:', colors)
      } catch (parseError) {
        console.log('JSON parse error for stored colors:', parseError)
        console.log('Raw stored data:', colorsData)
        // Return empty object if stored data is corrupted
        colors = {}
      }
    } else {
      console.log('No colors data found in KV store (both global and user-specific)')
    }
    
    return c.json({ colors })
  } catch (error) {
    console.log('Get movie type colors error:', error)
    return c.json({ error: `Get movie type colors error: ${error}` }, 500)
  }
})

// Save movie type colors
app.post('/make-server-f3064b20/movie-type-colors', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized - admin access required' }, 401)
    }

    // Parse request body with better error handling
    let requestBody
    try {
      const bodyText = await c.req.text()
      console.log('Raw request body:', bodyText)
      requestBody = JSON.parse(bodyText)
    } catch (parseError) {
      console.log('JSON parse error:', parseError)
      return c.json({ error: 'Invalid JSON in request body' }, 400)
    }

    const { colors } = requestBody
    
    if (!colors || typeof colors !== 'object') {
      return c.json({ error: 'Invalid colors data' }, 400)
    }

    const colorsJson = JSON.stringify(colors)
    console.log('Saving colors to KV store:', colorsJson)
    
    // Save to both global and user-specific keys
    const globalKey = 'movie_type_colors'
    const userKey = `movie_type_colors:${user.id}`
    
    console.log('Saving to global key:', globalKey)
    console.log('Saving to user key:', userKey)
    
    await kv.set(globalKey, colorsJson)
    await kv.set(userKey, colorsJson)
    
    // Add a small delay to ensure KV store consistency
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Verify the save by immediately reading it back
    const savedDataGlobal = await kv.get(globalKey)
    const savedDataUser = await kv.get(userKey)
    console.log('Verification - saved data (global):', savedDataGlobal)
    console.log('Verification - saved data (user-specific):', savedDataUser)
    
    // Additional verification - try to get all keys with prefix
    const allKeys = await kv.getByPrefix('movie_type_colors')
    console.log('All movie_type_colors keys in KV store:', allKeys.map(k => k.key))
    
    return c.json({ success: true, colors })
  } catch (error) {
    console.log('Save movie type colors error:', error)
    return c.json({ error: `Save movie type colors error: ${error}` }, 500)
  }
})

// Reset movie type colors to defaults
app.put('/make-server-f3064b20/movie-type-colors', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized - admin access required' }, 401)
    }

    // Parse request body with better error handling
    let requestBody
    try {
      const bodyText = await c.req.text()
      console.log('Raw reset request body:', bodyText)
      requestBody = JSON.parse(bodyText)
    } catch (parseError) {
      console.log('JSON parse error in reset:', parseError)
      return c.json({ error: 'Invalid JSON in request body' }, 400)
    }

    const { colors } = requestBody
    
    if (!colors || typeof colors !== 'object') {
      return c.json({ error: 'Invalid colors data' }, 400)
    }

    const colorsJson = JSON.stringify(colors)
    console.log('Saving colors to KV store:', colorsJson)
    
    // Save to both global and user-specific keys
    const globalKey = 'movie_type_colors'
    const userKey = `movie_type_colors:${user.id}`
    
    console.log('Saving to global key:', globalKey)
    console.log('Saving to user key:', userKey)
    
    await kv.set(globalKey, colorsJson)
    await kv.set(userKey, colorsJson)
    
    // Add a small delay to ensure KV store consistency
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Verify the save by immediately reading it back
    const savedDataGlobal = await kv.get(globalKey)
    const savedDataUser = await kv.get(userKey)
    console.log('Verification - saved data (global):', savedDataGlobal)
    console.log('Verification - saved data (user-specific):', savedDataUser)
    
    // Additional verification - try to get all keys with prefix
    const allKeys = await kv.getByPrefix('movie_type_colors')
    console.log('All movie_type_colors keys in KV store:', allKeys.map(k => k.key))
    
    return c.json({ success: true, colors })
  } catch (error) {
    console.log('Reset movie type colors error:', error)
    return c.json({ error: `Reset movie type colors error: ${error}` }, 500)
  }
})

// ==================================================================================
// MOVIE TYPE COLORS ROUTES (legacy e0516fcf prefix - keeping for backward compatibility)
// ==================================================================================

// Get movie type colors
app.get('/make-server-e0516fcf/movie-type-colors', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized - admin access required' }, 401)
    }

    // Try both global and user-specific keys
    const globalKey = 'movie_type_colors'
    const userKey = `movie_type_colors:${user.id}`
    
    console.log('GET request - user ID:', user.id)
    console.log('GET request - trying global key:', globalKey)
    console.log('GET request - trying user key:', userKey)
    
    let colorsData = await kv.get(globalKey)
    console.log('Retrieved colors data from KV store (global):', colorsData)
    
    if (!colorsData) {
      colorsData = await kv.get(userKey)
      console.log('Retrieved colors data from KV store (user-specific):', colorsData)
    }
    
    // Additional debugging - list all keys with prefix
    const allKeys = await kv.getByPrefix('movie_type_colors')
    console.log('All movie_type_colors keys in KV store (GET):', allKeys.map(k => k.key))
    
    let colors = {}
    
    if (colorsData) {
      try {
        // colorsData is already the parsed value from KV store
        colors = typeof colorsData === 'string' ? JSON.parse(colorsData) : colorsData
        console.log('Successfully parsed colors:', colors)
      } catch (parseError) {
        console.log('JSON parse error for stored colors:', parseError)
        console.log('Raw stored data:', colorsData)
        // Return empty object if stored data is corrupted
        colors = {}
      }
    } else {
      console.log('No colors data found in KV store (both global and user-specific)')
    }
    
    return c.json({ colors })
  } catch (error) {
    console.log('Get movie type colors error:', error)
    return c.json({ error: `Get movie type colors error: ${error}` }, 500)
  }
})

// Save movie type colors
app.post('/make-server-e0516fcf/movie-type-colors', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized - admin access required' }, 401)
    }

    // Parse request body with better error handling
    let requestBody
    try {
      const bodyText = await c.req.text()
      console.log('Raw request body:', bodyText)
      requestBody = JSON.parse(bodyText)
    } catch (parseError) {
      console.log('JSON parse error:', parseError)
      return c.json({ error: 'Invalid JSON in request body' }, 400)
    }

    const { colors } = requestBody
    
    if (!colors || typeof colors !== 'object') {
      return c.json({ error: 'Invalid colors data' }, 400)
    }

    const colorsJson = JSON.stringify(colors)
    console.log('Saving colors to KV store:', colorsJson)
    
    // Save to both global and user-specific keys
    const globalKey = 'movie_type_colors'
    const userKey = `movie_type_colors:${user.id}`
    
    console.log('Saving to global key:', globalKey)
    console.log('Saving to user key:', userKey)
    
    await kv.set(globalKey, colorsJson)
    await kv.set(userKey, colorsJson)
    
    // Add a small delay to ensure KV store consistency
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Verify the save by immediately reading it back
    const savedDataGlobal = await kv.get(globalKey)
    const savedDataUser = await kv.get(userKey)
    console.log('Verification - saved data (global):', savedDataGlobal)
    console.log('Verification - saved data (user-specific):', savedDataUser)
    
    // Additional verification - try to get all keys with prefix
    const allKeys = await kv.getByPrefix('movie_type_colors')
    console.log('All movie_type_colors keys in KV store:', allKeys.map(k => k.key))
    
    return c.json({ success: true, colors })
  } catch (error) {
    console.log('Save movie type colors error:', error)
    return c.json({ error: `Save movie type colors error: ${error}` }, 500)
  }
})

// Reset movie type colors to defaults
app.put('/make-server-e0516fcf/movie-type-colors', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized - admin access required' }, 401)
    }

    // Parse request body with better error handling
    let requestBody
    try {
      const bodyText = await c.req.text()
      console.log('Raw reset request body:', bodyText)
      requestBody = JSON.parse(bodyText)
    } catch (parseError) {
      console.log('JSON parse error in reset:', parseError)
      return c.json({ error: 'Invalid JSON in request body' }, 400)
    }

    const { colors } = requestBody
    
    if (!colors || typeof colors !== 'object') {
      return c.json({ error: 'Invalid colors data' }, 400)
    }

    const colorsJson = JSON.stringify(colors)
    console.log('Saving colors to KV store:', colorsJson)
    
    // Save to both global and user-specific keys
    const globalKey = 'movie_type_colors'
    const userKey = `movie_type_colors:${user.id}`
    
    console.log('Saving to global key:', globalKey)
    console.log('Saving to user key:', userKey)
    
    await kv.set(globalKey, colorsJson)
    await kv.set(userKey, colorsJson)
    
    // Add a small delay to ensure KV store consistency
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Verify the save by immediately reading it back
    const savedDataGlobal = await kv.get(globalKey)
    const savedDataUser = await kv.get(userKey)
    console.log('Verification - saved data (global):', savedDataGlobal)
    console.log('Verification - saved data (user-specific):', savedDataUser)
    
    // Additional verification - try to get all keys with prefix
    const allKeys = await kv.getByPrefix('movie_type_colors')
    console.log('All movie_type_colors keys in KV store:', allKeys.map(k => k.key))
    
    return c.json({ success: true, colors })
  } catch (error) {
    console.log('Reset movie type colors error:', error)
    return c.json({ error: `Reset movie type colors error: ${error}` }, 500)
  }
})

// Debug endpoint to list all KV store keys
app.get('/make-server-f3064b20/debug/kv-keys', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized - admin access required' }, 401)
    }

    const allKeys = await kv.getByPrefix('movie_type_colors')
    const keysWithData = []
    
    for (const keyData of allKeys) {
      keysWithData.push({
        key: keyData.key,
        value: keyData.value,
        hasData: !!keyData.value
      })
    }
    
    return c.json({ 
      keys: keysWithData,
      totalKeys: allKeys.length
    })
  } catch (error) {
    console.log('Debug KV keys error:', error)
    return c.json({ error: `Debug KV keys error: ${error}` }, 500)
  }
})

// Get template counts for stats
app.get('/make-server-e0516fcf/template-counts', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized - admin access required' }, 401)
    }

    // Get group templates - cover templates are now part of group templates
    const groupTemplatesResults = await kv.getByPrefix('template_group:')
    const groupTemplates = groupTemplatesResults.map(item => item.value)
    
    return c.json({ 
      groupTemplates: groupTemplates.length
    })
  } catch (error) {
    console.log('Get template counts error:', error)
    return c.json({ error: `Get template counts error: ${error}` }, 500)
  }
})

console.log('Server starting with all routes...')
Deno.serve(app.fetch)