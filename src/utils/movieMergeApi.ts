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
        const directorName = matchedDirector.matched.name || matchedDirector.matched.jpname || matchedDirector.original
        if (directorName && directorName.trim()) {
          mergedMovie.director = directorName
        }
      }
    }

    if (request.selectedFields.includes('studio') && request.matchedData?.studios && request.matchedData.studios.length > 0) {
      const matchedStudio = request.matchedData.studios[0]
      if (matchedStudio.matched && !request.ignoredItems?.includes('studios-0')) {
        const studioName = matchedStudio.matched.name || matchedStudio.matched.jpname || matchedStudio.original
        if (studioName && studioName.trim()) {
          mergedMovie.studio = studioName
        }
      }
    }

    if (request.selectedFields.includes('series') && request.matchedData?.series && request.matchedData.series.length > 0) {
      const matchedSeries = request.matchedData.series[0]
      if (matchedSeries.matched && !request.ignoredItems?.includes('series-0')) {
        const seriesName = matchedSeries.matched.titleEn || matchedSeries.matched.titleJp || matchedSeries.original
        if (seriesName && seriesName.trim()) {
          mergedMovie.series = seriesName
        }
      }
    }

    if (request.selectedFields.includes('actress') && request.parsedData.actresses && request.parsedData.actresses.length > 0) {
      // Merge actresses - only add new ones, don't duplicate
      const existingActresses = existingMovie.actress ? existingMovie.actress.split(',').map(a => a.trim()).filter(a => a) : []
      const newActresses = request.parsedData.actresses.filter(a => a && a.trim())
      
      // Only add actresses that don't already exist
      const uniqueNewActresses = newActresses.filter(actress => 
        !existingActresses.some(existing => 
          existing.toLowerCase() === actress.toLowerCase() ||
          existing.includes(actress) ||
          actress.includes(existing)
        )
      )
      
      if (uniqueNewActresses.length > 0) {
        mergedMovie.actress = [...existingActresses, ...uniqueNewActresses].join(', ')
      }
    }

    if (request.selectedFields.includes('actors') && request.parsedData.actors && request.parsedData.actors.length > 0) {
      // Merge actors - only add new ones, don't duplicate
      const existingActors = existingMovie.actors ? existingMovie.actors.split(',').map(a => a.trim()).filter(a => a) : []
      const newActors = request.parsedData.actors.filter(a => a && a.trim())
      
      // Only add actors that don't already exist
      const uniqueNewActors = newActors.filter(actor => 
        !existingActors.some(existing => 
          existing.toLowerCase() === actor.toLowerCase() ||
          existing.includes(actor) ||
          actor.includes(existing)
        )
      )
      
      if (uniqueNewActors.length > 0) {
        mergedMovie.actors = [...existingActors, ...uniqueNewActors].join(', ')
      }
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
