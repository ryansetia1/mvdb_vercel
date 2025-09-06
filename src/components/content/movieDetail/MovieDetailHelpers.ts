import { MasterDataItem, calculateAgeAtDate } from '../../../utils/masterDataApi'
import { Movie } from '../../../utils/movieApi'

export interface AgeGap {
  actress: string
  actor: string
  actressAge: number
  actorAge: number
  gap: number
  actressOlder: boolean
}

export const parseLinks = (linksString?: string): string[] => {
  if (!linksString) return []
  
  // Remove any extra whitespace and normalize
  const cleanedString = linksString.trim()
  if (!cleanedString) return []
  
  // Try different parsing strategies in order of preference
  
  // Strategy 1: Check for LinkManager format (Title#URL, Title2#URL2)
  if (cleanedString.includes('#') && cleanedString.includes(',')) {
    return cleanedString.split(',')
      .map(link => {
        const parts = link.trim().split('#')
        return parts.length >= 2 ? parts[1].trim() : parts[0].trim() // Extract URL part
      })
      .filter(url => url.length > 0)
  }
  
  // Strategy 2: Check for MultiLinksManager format (URL1, URL2, URL3)
  if (cleanedString.includes(',')) {
    return cleanedString.split(',')
      .map(link => link.trim())
      .filter(link => link.length > 0)
  }
  
  // Strategy 3: Check for simple URL with # (single LinkManager format)
  if (cleanedString.includes('#')) {
    const parts = cleanedString.split('#')
    const url = parts.length >= 2 ? parts[1].trim() : parts[0].trim()
    return url ? [url] : []
  }
  
  // Strategy 4: Fallback to newline separation (legacy format)
  if (cleanedString.includes('\n')) {
    return cleanedString.split('\n')
      .map(link => link.trim())
      .filter(link => link.length > 0)
  }
  
  // Strategy 5: Single URL
  return [cleanedString]
}

export const calculateAgeGaps = (
  movie: Movie,
  castData: { [name: string]: MasterDataItem }
): AgeGap[] | null => {
  if (!movie.actress || !movie.actors || !movie.releaseDate) return null
  
  const actresses = movie.actress.split(',').map(name => name.trim())
  const actors = movie.actors.split(',').map(name => name.trim())
  
  const ageGaps: AgeGap[] = []

  actresses.forEach(actressName => {
    const actressInfo = castData[actressName]
    if (!actressInfo?.birthdate) return

    const actressAge = calculateAgeAtDate(actressInfo.birthdate, movie.releaseDate!)
    if (actressAge === null) return

    actors.forEach(actorName => {
      const actorInfo = castData[actorName]
      if (actorInfo?.birthdate) {
        const actorAge = calculateAgeAtDate(actorInfo.birthdate, movie.releaseDate!)
        if (actorAge !== null) {
          ageGaps.push({
            actress: actressName,
            actor: actorName,
            actressAge,
            actorAge,
            gap: Math.abs(actressAge - actorAge),
            actressOlder: actressAge > actorAge
          })
        }
      }
    })
  })

  return ageGaps.length > 0 ? ageGaps : null
}

import { processTemplate } from '../../../utils/templateUtils'

export const processCoverUrl = (movie: Movie): string => {
  if (!movie.cover) return ''
  
  // If cover contains template variables and we have dmcode, process it
  const hasTemplateVars = movie.cover.includes('*') || 
                         movie.cover.includes('{{') ||
                         movie.cover.includes('@studio') ||
                         movie.cover.includes('@firstname') ||
                         movie.cover.includes('@lastname')
  
  if (hasTemplateVars && movie.dmcode) {
    return processTemplate(movie.cover, { 
      dmcode: movie.dmcode,
      studio: movie.studio,
      actress: movie.actress
    })
  }
  
  return movie.cover
}