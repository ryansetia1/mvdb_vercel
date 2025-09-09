import { Movie } from './movieApi'
import { MasterDataItem } from './masterDataApi'
import { movieApi } from './movieApi'

export interface ParsedMovieData {
  code: string
  titleJp: string
  titleEn?: string
  releaseDate: string
  duration: string
  director: string
  studio: string
  series: string
  rating?: string
  actresses: string[]
  actors: string[]
  rawData: string
  dmcode?: string
}

export interface MatchedData {
  actresses: {
    name: string
    matched: MasterDataItem | null
    multipleMatches: MasterDataItem[]
    needsConfirmation: boolean
  }[]
  actors: {
    name: string
    matched: MasterDataItem | null
    multipleMatches: MasterDataItem[]
    needsConfirmation: boolean
  }[]
  directors: {
    name: string
    matched: MasterDataItem | null
    multipleMatches: MasterDataItem[]
    needsConfirmation: boolean
  }[]
  studios: {
    name: string
    matched: MasterDataItem | null
    multipleMatches: MasterDataItem[]
    needsConfirmation: boolean
  }[]
  series: {
    name: string
    matched: MasterDataItem | null
    multipleMatches: MasterDataItem[]
    needsConfirmation: boolean
  }[]
}

/**
 * Parse pasted movie data from various formats
 */
export function parseMovieData(rawData: string): ParsedMovieData | null {
  try {
    const lines = rawData.split('\n').map(line => line.trim()).filter(line => line.length > 0)
    
    if (lines.length === 0) return null

    // Initialize parsed data
    const parsed: ParsedMovieData = {
      code: '',
      titleJp: '',
      releaseDate: '',
      duration: '',
      director: '',
      studio: '',
      series: '',
      actresses: [],
      actors: [],
      rawData
    }

    // Parse each line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      
      // Extract code and title from first line (e.g., "SNIS-217 ラブ◆キモメン ティア")
      if (i === 0) {
        const codeMatch = line.match(/^([A-Z0-9-]+)/)
        if (codeMatch) {
          parsed.code = codeMatch[1]
          parsed.titleJp = line.replace(codeMatch[1], '').trim()
        } else {
          parsed.titleJp = line
        }
        continue
      }

      // Handle empty lines
      if (!line.trim()) continue

      // Skip "Watch Full Movie" line
      if (line === 'Watch Full Movie') continue

      // Parse structured data - handle both "Key: Value" and "Key:\nValue" formats
      if (line.includes(':')) {
        const [key, value] = line.split(':', 2)
        const cleanKey = key.trim()
        let cleanValue = value.trim()
        
        // If value is empty, check next line
        if (!cleanValue && i + 1 < lines.length) {
          cleanValue = lines[i + 1].trim()
          i++ // Skip the next line since we used it
        }

        switch (cleanKey) {
          case 'ID':
            if (!parsed.code) parsed.code = cleanValue
            break
          case 'Released Date':
            parsed.releaseDate = cleanValue
            break
          case 'Duration':
            parsed.duration = cleanValue
            break
          case 'Director':
            parsed.director = cleanValue
            break
          case 'Maker':
          case 'Studio':
            parsed.studio = cleanValue
            console.log('=== PARSED STUDIO ===')
            console.log('Raw studio value:', cleanValue)
            console.log('Parsed studio:', parsed.studio)
            break
          case 'Publisher':
            if (!parsed.studio) parsed.studio = cleanValue
            break
          case 'Series':
            parsed.series = cleanValue
            break
          case 'Rating':
            parsed.rating = cleanValue
            break
          case 'Tags':
            // Skip tags - will be handled manually by user during movie editing
            break
          case 'Actor(s)':
            // Split by spaces and filter out empty strings, then process each name
            parsed.actors = cleanValue.split(/\s+/).map(actor => actor.trim()).filter(actor => actor.length > 0)
            break
        }
      }
    }

    // Extract actresses from Actor(s) field and title
    if (parsed.actors.length > 0) {
      // Separate actresses and actors based on gender symbols
      const actresses: string[] = []
      const actors: string[] = []
      
      parsed.actors.forEach(actor => {
        // Check for female symbol first
        if (actor.includes('♀')) {
          // This is an actress (has female symbol)
          actresses.push(actor.replace(/♀/g, '').trim())
        } else if (actor.includes('♂')) {
          // This is an actor (has male symbol)
          actors.push(actor.replace(/♂/g, '').trim())
        } else {
          // No gender symbol, check if it's in the title (likely actress)
          if (parsed.titleJp && parsed.titleJp.includes(actor)) {
            actresses.push(actor)
          } else {
            // Default to actor if not in title
            actors.push(actor)
          }
        }
      })
      
      parsed.actresses = actresses
      parsed.actors = actors
    }
    
    // If no actresses found yet, try to extract from title
    if (parsed.actresses.length === 0 && parsed.titleJp) {
      // Look for actress names in the title (usually at the end)
      const titleParts = parsed.titleJp.split(/\s+/)
      const lastPart = titleParts[titleParts.length - 1]
      
      // If the last part looks like a name (contains Japanese characters and no special symbols)
      if (lastPart && /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(lastPart) && !/[◆●★☆]/.test(lastPart)) {
        parsed.actresses = [lastPart]
      }
    }

    // Validate required fields
    if (!parsed.code || !parsed.titleJp || !parsed.releaseDate) {
      return null
    }

    return parsed
  } catch (error) {
    console.error('Error parsing movie data:', error)
    return null
  }
}

/**
 * Match parsed data with existing database entries
 */
export async function matchWithDatabase(
  parsedData: ParsedMovieData,
  masterData: MasterDataItem[]
): Promise<MatchedData> {
  const matched: MatchedData = {
    actresses: [],
    actors: [],
    directors: [],
    studios: [],
    series: []
  }

  // Helper function to find matches
  const findMatches = (name: string, type: MasterDataItem['type']): { matched: MasterDataItem | null, multipleMatches: MasterDataItem[] } => {
    const candidates = masterData.filter(item => item.type === type)
    const matches: MasterDataItem[] = []
    
    // Debug logging for studio matching
    if (type === 'studio') {
      console.log('=== FIND MATCHES FOR STUDIO ===')
      console.log('Searching for:', name)
      console.log('Candidates found:', candidates.length)
      console.log('Candidate names:', candidates.map(c => c.name).filter(Boolean))
      console.log('Candidate jpnames:', candidates.map(c => c.jpname).filter(Boolean))
      console.log('Candidate aliases:', candidates.map(c => c.alias).filter(Boolean))
    }
    
    for (const candidate of candidates) {
      const matchesQuery = castMatchesQuery(candidate, name)
      if (matchesQuery) {
        matches.push(candidate)
        if (type === 'studio') {
          console.log('Studio match found:', candidate.name, '|', candidate.jpname, '|', candidate.alias)
        }
      }
    }
    
    if (type === 'studio') {
      console.log('Total matches found:', matches.length)
    }
    
    // If multiple matches found, return the first one as matched and all as multipleMatches
    if (matches.length > 1) {
      return {
        matched: matches[0], // First match as default
        multipleMatches: matches
      }
    } else if (matches.length === 1) {
      return {
        matched: matches[0],
        multipleMatches: []
      }
    }
    
    return {
      matched: null,
      multipleMatches: []
    }
  }

  // Match actresses
  for (const actressName of parsedData.actresses) {
    console.log('=== MATCHING ACTRESS ===')
    console.log('Searching for actress:', actressName)
    
    const matchResult = findMatches(actressName, 'actress')
    console.log('Actress match result:', matchResult)
    
    matched.actresses.push({
      name: actressName,
      matched: matchResult.matched,
      multipleMatches: matchResult.multipleMatches,
      needsConfirmation: !matchResult.matched || matchResult.multipleMatches.length > 1
    })
  }

  // Match actors
  for (const actorName of parsedData.actors) {
    console.log('=== MATCHING ACTOR ===')
    console.log('Searching for actor:', actorName)
    
    const matchResult = findMatches(actorName, 'actor')
    console.log('Actor match result:', matchResult)
    
    matched.actors.push({
      name: actorName,
      matched: matchResult.matched,
      multipleMatches: matchResult.multipleMatches,
      needsConfirmation: !matchResult.matched || matchResult.multipleMatches.length > 1
    })
  }

  // Match directors
  if (parsedData.director) {
    console.log('=== MATCHING DIRECTOR ===')
    console.log('Searching for director:', parsedData.director)
    
    const matchResult = findMatches(parsedData.director, 'director')
    console.log('Director match result:', matchResult)
    
    matched.directors.push({
      name: parsedData.director,
      matched: matchResult.matched,
      multipleMatches: matchResult.multipleMatches,
      needsConfirmation: !matchResult.matched || matchResult.multipleMatches.length > 1
    })
  }

  // Match studios
  if (parsedData.studio) {
    console.log('=== MATCHING STUDIO ===')
    console.log('Searching for studio:', parsedData.studio)
    
    const matchResult = findMatches(parsedData.studio, 'studio')
    console.log('Studio match result:', matchResult)
    
    matched.studios.push({
      name: parsedData.studio,
      matched: matchResult.matched,
      multipleMatches: matchResult.multipleMatches,
      needsConfirmation: !matchResult.matched || matchResult.multipleMatches.length > 1
    })
  }

  // Match series
  if (parsedData.series) {
    console.log('=== MATCHING SERIES ===')
    console.log('Searching for series:', parsedData.series)
    
    const matchResult = findMatches(parsedData.series, 'series')
    console.log('Series match result:', matchResult)
    
    matched.series.push({
      name: parsedData.series,
      matched: matchResult.matched,
      multipleMatches: matchResult.multipleMatches,
      needsConfirmation: !matchResult.matched || matchResult.multipleMatches.length > 1
    })
  }

  return matched
}

/**
 * Check if movie code already exists in database
 */
export async function checkDuplicateMovieCode(code: string): Promise<{ isDuplicate: boolean; existingMovie?: Movie }> {
  try {
    console.log('=== checkDuplicateMovieCode ===')
    console.log('Searching for code:', code)
    
    const allMovies = await movieApi.getAllMovies()
    console.log('Total movies:', allMovies.length)
    
    // Show first few movie codes for debugging
    const movieCodes = allMovies.slice(0, 10).map(m => m.code).filter(Boolean)
    console.log('Sample movie codes:', movieCodes)
    
    const existingMovie = allMovies.find((movie: Movie) => {
      const match = movie.code?.toLowerCase() === code.toLowerCase()
      if (match) {
        console.log('FOUND MATCH:', movie)
      }
      return match
    })
    
    console.log('Existing movie found:', existingMovie)
    
    return {
      isDuplicate: !!existingMovie,
      existingMovie
    }
  } catch (error) {
    console.error('Error checking duplicate movie code:', error)
    return { isDuplicate: false }
  }
}

/**
 * Generate dmcode based on studio and movie code patterns
 */
export function generateDmcode(movieCode: string, studio: string): string {
  if (!movieCode || !studio) return ''
  
  const code = movieCode.toLowerCase().replace(/-/g, '')
  const studioName = studio.toLowerCase()
  
  // Extract the prefix from movie code (e.g., "wnzs" from "wnzs-190")
  const codeMatch = code.match(/^([a-z]+)(\d+)$/)
  if (!codeMatch) return ''
  
  const [, prefix, number] = codeMatch
  
  // Pattern 1: Studio starts with "wan" + prefix starts with "wn" → "3" + prefix + "00" + number
  if (studioName.startsWith('wan') && prefix.startsWith('wn')) {
    return `3${prefix}00${number}`
  }
  
  // Pattern 2: Studio starts with "wan" + prefix starts with "wa" → prefix + "00" + number  
  if (studioName.startsWith('wan') && prefix.startsWith('wa')) {
    return `${prefix}00${number}`
  }
  
  // Pattern 3: Default pattern for other studios
  // Try to find common patterns from existing data
  if (studioName.includes('wanz') || studioName.includes('wans')) {
    if (prefix.startsWith('wn')) {
      return `3${prefix}00${number}`
    } else if (prefix.startsWith('wa')) {
      return `${prefix}00${number}`
    }
  }
  
  // Fallback: simple pattern
  return `${prefix}00${number}`
}

/**
 * Load existing movies to analyze dmcode patterns
 */
export async function analyzeDmcodePatterns(): Promise<Map<string, string>> {
  try {
    const movies = await movieApi.getAllMovies()
    const patterns = new Map<string, string>()
    
    movies.forEach((movie: Movie) => {
      if (movie.code && movie.studio && movie.dmcode) {
        const key = `${movie.studio.toLowerCase()}-${movie.code.toLowerCase()}`
        patterns.set(key, movie.dmcode)
      }
    })
    
    return patterns
  } catch (error) {
    console.error('Error analyzing dmcode patterns:', error)
    return new Map()
  }
}

/**
 * Convert parsed data to Movie interface
 */
export function convertToMovie(parsedData: ParsedMovieData, matchedData: MatchedData, ignoredItems?: Set<string>): Movie {
  console.log('=== convertToMovie ===')
  console.log('Parsed actresses:', parsedData.actresses)
  console.log('Matched actresses:', matchedData.actresses)
  console.log('Ignored items:', ignoredItems)
  
  // Filter out ignored items and use matched data when available
  const filteredActresses = parsedData.actresses.filter((_, index) => {
    if (!ignoredItems) return true
    const itemKey = `actresses-${index}`
    return !ignoredItems.has(itemKey)
  }).map((name, index) => {
    // Use matched data if available, otherwise use original name
    const matchedItem = matchedData.actresses[index]
    if (matchedItem?.matched) {
      // Use the matched name from database (prefer English name, fallback to Japanese)
      const matchedName = matchedItem.matched.name || matchedItem.matched.jpname || name
      console.log(`Actress ${name} matched to: ${matchedName}`)
      return matchedName
    }
    console.log(`Actress ${name} not matched, using original name`)
    return name
  })
  
  const filteredActors = parsedData.actors.filter((_, index) => {
    if (!ignoredItems) return true
    const itemKey = `actors-${index}`
    return !ignoredItems.has(itemKey)
  }).map((name, index) => {
    // Use matched data if available, otherwise use original name
    const matchedItem = matchedData.actors[index]
    if (matchedItem?.matched) {
      // Use the matched name from database (prefer English name, fallback to Japanese)
      const matchedName = matchedItem.matched.name || matchedItem.matched.jpname || name
      console.log(`Actor ${name} matched to: ${matchedName}`)
      return matchedName
    }
    console.log(`Actor ${name} not matched, using original name`)
    return name
  })
  
  // Check if director is ignored and use matched data
  const isDirectorIgnored = ignoredItems?.has('directors-0')
  let director = ''
  if (!isDirectorIgnored) {
    const matchedDirector = matchedData.directors[0]
    if (matchedDirector?.matched) {
      // Use the matched director name from database
      director = matchedDirector.matched.name || matchedDirector.matched.jpname || parsedData.director
      console.log(`Director ${parsedData.director} matched to: ${director}`)
    } else {
      director = parsedData.director
      console.log(`Director ${parsedData.director} not matched, using original name`)
    }
  }
  
  // Check if studio is ignored and use matched data
  const isStudioIgnored = ignoredItems?.has('studios-0')
  let studio = ''
  if (!isStudioIgnored) {
    const matchedStudio = matchedData.studios[0]
    if (matchedStudio?.matched) {
      // Use the matched studio name from database
      studio = matchedStudio.matched.name || matchedStudio.matched.jpname || parsedData.studio
      console.log(`Studio ${parsedData.studio} matched to: ${studio}`)
    } else {
      studio = parsedData.studio
      console.log(`Studio ${parsedData.studio} not matched, using original name`)
    }
  }
  
  // Check if series is ignored and use matched data
  const isSeriesIgnored = ignoredItems?.has('series-0')
  let series = ''
  if (!isSeriesIgnored) {
    const matchedSeries = matchedData.series[0]
    if (matchedSeries?.matched) {
      // Use the matched series name from database
      series = matchedSeries.matched.titleEn || matchedSeries.matched.titleJp || parsedData.series
      console.log(`Series ${parsedData.series} matched to: ${series}`)
    } else {
      series = parsedData.series
      console.log(`Series ${parsedData.series} not matched, using original name`)
    }
  }

  const finalMovie = {
    code: parsedData.code,
    titleJp: parsedData.titleJp,
    titleEn: parsedData.titleEn,
    releaseDate: parsedData.releaseDate,
    duration: parsedData.duration,
    director,
    studio,
    series,
    actress: filteredActresses.join(', '),
    actors: filteredActors.join(', '),
    dmcode: parsedData.dmcode || '',
    type: 'HC' // Default to HC for parsed movies
  }
  
  console.log('=== FINAL MOVIE DATA ===')
  console.log('Final actresses:', finalMovie.actress)
  console.log('Final actors:', finalMovie.actors)
  console.log('Final director:', finalMovie.director)
  console.log('Final studio:', finalMovie.studio)
  console.log('Final series:', finalMovie.series)
  
  return finalMovie
}

/**
 * Helper function to check if a cast member matches search query including aliases
 * This is a simplified version of the one in masterDataApi.ts
 */
function castMatchesQuery(castMember: MasterDataItem, query: string): boolean {
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
  
  // Enhanced matching for series (uses titleEn and titleJp)
  if (castMember.type === 'series') {
    if (castMember.titleEn?.toLowerCase().includes(searchQuery)) return true
    if (castMember.titleJp?.toLowerCase().includes(searchQuery)) return true
  }
  
  // Enhanced matching for studio names with parentheses (e.g., "マドンナ(Madonna)")
  if (castMember.type === 'studio') {
    console.log('=== STUDIO MATCHING DEBUG ===')
    console.log('Query:', query)
    console.log('Studio name:', castMember.name)
    console.log('Studio jpname:', castMember.jpname)
    console.log('Studio alias:', castMember.alias)
    
    // Direct matching first
    if (castMember.name?.toLowerCase() === searchQuery) {
      console.log('✅ Direct name match')
      return true
    }
    if (castMember.jpname?.toLowerCase() === searchQuery) {
      console.log('✅ Direct jpname match')
      return true
    }
    if (castMember.alias?.toLowerCase() === searchQuery) {
      console.log('✅ Direct alias match')
      return true
    }
    
    // Contains matching
    if (castMember.name?.toLowerCase().includes(searchQuery)) {
      console.log('✅ Contains name match')
      return true
    }
    if (castMember.jpname?.toLowerCase().includes(searchQuery)) {
      console.log('✅ Contains jpname match')
      return true
    }
    if (castMember.alias?.toLowerCase().includes(searchQuery)) {
      console.log('✅ Contains alias match')
      return true
    }
    
    // Extract text inside parentheses for better matching
    const parenthesesMatch = query.match(/\(([^)]+)\)/)
    if (parenthesesMatch) {
      const textInParentheses = parenthesesMatch[1].toLowerCase().trim()
      console.log('Text in parentheses:', textInParentheses)
      if (castMember.name?.toLowerCase().includes(textInParentheses)) {
        console.log('✅ Parentheses name match')
        return true
      }
      if (castMember.jpname?.toLowerCase().includes(textInParentheses)) {
        console.log('✅ Parentheses jpname match')
        return true
      }
      if (castMember.alias?.toLowerCase().includes(textInParentheses)) {
        console.log('✅ Parentheses alias match')
        return true
      }
    }
    
    // Extract text before parentheses for better matching
    const beforeParenthesesMatch = query.match(/^([^(]+)/)
    if (beforeParenthesesMatch) {
      const textBeforeParentheses = beforeParenthesesMatch[1].toLowerCase().trim()
      console.log('Text before parentheses:', textBeforeParentheses)
      if (castMember.name?.toLowerCase().includes(textBeforeParentheses)) {
        console.log('✅ Before parentheses name match')
        return true
      }
      if (castMember.jpname?.toLowerCase().includes(textBeforeParentheses)) {
        console.log('✅ Before parentheses jpname match')
        return true
      }
      if (castMember.alias?.toLowerCase().includes(textBeforeParentheses)) {
        console.log('✅ Before parentheses alias match')
        return true
      }
    }
    
    console.log('❌ No studio match found')
  }
  
  return false
}
