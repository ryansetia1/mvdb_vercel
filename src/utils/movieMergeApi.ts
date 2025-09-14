import { Movie } from './movieApi'
import { ParsedMovieData } from './movieDataParser'
import { projectId } from './supabase/info'

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-e0516fcf`

export interface MergeMovieRequest {
  parsedData: ParsedMovieData
  matchedData?: any
  ignoredItems?: string[]
  selectedFields: string[]
}

export interface MergeMovieResponse {
  success: boolean
  movie: Movie
  message: string
}

export async function mergeMovieData(
  movieId: string,
  accessToken: string,
  request: MergeMovieRequest
): Promise<MergeMovieResponse> {
  try {
    console.log('=== MERGE MOVIE API ===')
    console.log('Movie ID:', movieId)
    console.log('Selected fields:', request.selectedFields)
    console.log('Parsed data:', request.parsedData)

    // First try the new merge endpoint
    try {
      const response = await fetch(`${BASE_URL}/movies/${movieId}/merge`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(request)
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Merge result:', result)
        return result
      }
    } catch (mergeError) {
      console.log('Merge endpoint not available, falling back to update endpoint')
    }

    // Fallback: Use the regular update endpoint
    // First get the existing movie
    const getResponse = await fetch(`${BASE_URL}/movies/${movieId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    if (!getResponse.ok) {
      throw new Error(`Failed to get existing movie: ${getResponse.status}`)
    }

    const existingMovie = await getResponse.json()
    
    // Merge the data locally
    const mergedMovie = { ...existingMovie }
    
    // Update selected fields with parsed data
    if (request.selectedFields.includes('titleEn') && request.parsedData.titleEn) {
      mergedMovie.titleEn = request.parsedData.titleEn
    }

    if (request.selectedFields.includes('releaseDate') && request.parsedData.releaseDate) {
      mergedMovie.releaseDate = request.parsedData.releaseDate
    }

    if (request.selectedFields.includes('duration') && request.parsedData.duration) {
      mergedMovie.duration = request.parsedData.duration
    }

    if (request.selectedFields.includes('director') && request.matchedData?.directors && request.matchedData.directors.length > 0) {
      const matchedDirector = request.matchedData.directors[0]
      if (matchedDirector.matched && !request.ignoredItems?.includes('directors-0')) {
        // Use customEnglishName if user selected one, otherwise use matched name from database
        const directorName = matchedDirector.customEnglishName || matchedDirector.matched.name || matchedDirector.matched.jpname || matchedDirector.name
        if (directorName && directorName.trim()) {
          mergedMovie.director = directorName
        }
      }
    }

    if (request.selectedFields.includes('studio') && request.matchedData?.studios && request.matchedData.studios.length > 0) {
      const matchedStudio = request.matchedData.studios[0]
      if (matchedStudio.matched && !request.ignoredItems?.includes('studios-0')) {
        // Use customEnglishName if user selected one, otherwise use matched name from database
        const studioName = matchedStudio.customEnglishName || matchedStudio.matched.name || matchedStudio.matched.jpname || matchedStudio.name
        if (studioName && studioName.trim()) {
          mergedMovie.studio = studioName
        }
      }
    }

    if (request.selectedFields.includes('series') && request.matchedData?.series && request.matchedData.series.length > 0) {
      const matchedSeries = request.matchedData.series[0]
      if (matchedSeries.matched && !request.ignoredItems?.includes('series-0')) {
        // Use customEnglishName if user selected one, otherwise use matched name from database
        const seriesName = matchedSeries.customEnglishName || matchedSeries.matched.name || matchedSeries.matched.titleEn || matchedSeries.matched.titleJp || matchedSeries.name
        if (seriesName && seriesName.trim()) {
          mergedMovie.series = seriesName
        }
      }
    }

    if (request.selectedFields.includes('actress') && request.parsedData.actresses && request.parsedData.actresses.length > 0) {
      // Merge actresses - only add new ones, don't duplicate
      const existingActresses = existingMovie.actress ? existingMovie.actress.split(',').map(a => a.trim()).filter(a => a) : []
      
      // Filter out ignored actresses and use matched data when available
      const filteredActresses = request.parsedData.actresses.map((name, index) => {
        // Check if this actress is ignored
        if (request.ignoredItems?.includes(`actresses-${index}`)) {
          return null // Mark as ignored
        }
        
        // Use matched data if available, otherwise use original name
        const matchedItem = request.matchedData?.actresses?.[index]
        if (matchedItem?.matched) {
          // Use customEnglishName if user selected one, otherwise use matched name from database
          const finalName = matchedItem.customEnglishName || matchedItem.matched.name || matchedItem.matched.jpname || name
          console.log(`MovieMergeApi actress ${index}: customEnglishName=${matchedItem.customEnglishName}, matched.name=${matchedItem.matched.name}, final=${finalName}`)
          return finalName
        }
        return name
      }).filter(name => name !== null && name.trim()) // Remove ignored items and empty strings
      
      // Only add actresses that don't already exist
      const uniqueNewActresses = filteredActresses.filter(actress => 
        !existingActresses.some(existing => 
          existing.toLowerCase() === actress.toLowerCase() ||
          existing.includes(actress) ||
          actress.includes(existing)
        )
      )
      
      // Always use the names selected by user, even if they already exist
      // This respects user's choice to keep database names or use parsed names
      if (filteredActresses.length > 0) {
        mergedMovie.actress = filteredActresses.join(', ')
        console.log('MovieMergeApi using user-selected actress names:', filteredActresses)
      } else if (uniqueNewActresses.length > 0) {
        mergedMovie.actress = [...existingActresses, ...uniqueNewActresses].join(', ')
        console.log('MovieMergeApi adding new actresses:', uniqueNewActresses)
      }
    }

    if (request.selectedFields.includes('actors') && request.parsedData.actors && request.parsedData.actors.length > 0) {
      // Merge actors - only add new ones, don't duplicate
      const existingActors = existingMovie.actors ? existingMovie.actors.split(',').map(a => a.trim()).filter(a => a) : []
      
      // Filter out ignored actors and use matched data when available
      const filteredActors = request.parsedData.actors.map((name, index) => {
        // Check if this actor is ignored
        if (request.ignoredItems?.includes(`actors-${index}`)) {
          return null // Mark as ignored
        }
        
        // Use matched data if available, otherwise use original name
        const matchedItem = request.matchedData?.actors?.[index]
        if (matchedItem?.matched) {
          // Use customEnglishName if user selected one, otherwise use matched name from database
          const finalName = matchedItem.customEnglishName || matchedItem.matched.name || matchedItem.matched.jpname || name
          console.log(`MovieMergeApi actor ${index}: customEnglishName=${matchedItem.customEnglishName}, matched.name=${matchedItem.matched.name}, final=${finalName}`)
          return finalName
        }
        return name
      }).filter(name => name !== null && name.trim()) // Remove ignored items and empty strings
      
      // Only add actors that don't already exist
      const uniqueNewActors = filteredActors.filter(actor => 
        !existingActors.some(existing => 
          existing.toLowerCase() === actor.toLowerCase() ||
          existing.includes(actor) ||
          actor.includes(existing)
        )
      )
      
      // Always use the names selected by user, even if they already exist
      // This respects user's choice to keep database names or use parsed names
      if (filteredActors.length > 0) {
        mergedMovie.actors = filteredActors.join(', ')
        console.log('MovieMergeApi using user-selected actor names:', filteredActors)
      } else if (uniqueNewActors.length > 0) {
        mergedMovie.actors = [...existingActors, ...uniqueNewActors].join(', ')
        console.log('MovieMergeApi adding new actors:', uniqueNewActors)
      }
    }

    // Handle cropCover - preserve existing value if not in selected fields
    if (request.selectedFields.includes('cropCover')) {
      // Only update cropCover if it's explicitly selected
      mergedMovie.cropCover = request.parsedData.cropCover !== undefined ? request.parsedData.cropCover : existingMovie.cropCover
    } else {
      // Preserve existing cropCover value if not selected for update
      mergedMovie.cropCover = existingMovie.cropCover
    }

    // Update timestamp
    mergedMovie.updatedAt = new Date().toISOString()

    // Now update the movie using the regular update endpoint
    const updateResponse = await fetch(`${BASE_URL}/movies/${movieId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(mergedMovie)
    })

    if (!updateResponse.ok) {
      let errorMessage = `HTTP error! status: ${updateResponse.status}`
      try {
        const errorData = await updateResponse.json()
        errorMessage = errorData.error || errorMessage
      } catch (parseError) {
        try {
          const errorText = await updateResponse.text()
          errorMessage = errorText || errorMessage
        } catch (textError) {
          console.error('Failed to parse error response:', textError)
        }
      }
      throw new Error(errorMessage)
    }

    const result = await updateResponse.json()
    console.log('Update result:', result)
    
    return {
      success: true,
      movie: result.movie || result,
      message: `Successfully merged ${request.selectedFields.length} fields`
    }
  } catch (error) {
    console.error('Error merging movie data:', error)
    throw error
  }
}
