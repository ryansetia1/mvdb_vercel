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
  label?: string
  rating?: string
  actresses: string[]
  actors: string[]
  rawData: string
  dmcode?: string
}

export interface MatchedData {
  actresses: {
    name: string // Parsed name from source
    parsedEnglishName?: string // English name from parsed data (if available)
    matched: MasterDataItem | null
    multipleMatches: MasterDataItem[]
    needsConfirmation: boolean
    customEnglishName?: string // User-selected English name
    hasDifferentEnglishNames?: boolean // Flag to indicate different English names between parsed and database
    needsEnglishNameSelection?: boolean // Flag to indicate English name selection needed
  }[]
  actors: {
    name: string
    parsedEnglishName?: string
    matched: MasterDataItem | null
    multipleMatches: MasterDataItem[]
    needsConfirmation: boolean
    customEnglishName?: string
    hasDifferentEnglishNames?: boolean
    needsEnglishNameSelection?: boolean
  }[]
  directors: {
    name: string
    parsedEnglishName?: string
    matched: MasterDataItem | null
    multipleMatches: MasterDataItem[]
    needsConfirmation: boolean
    customEnglishName?: string
    hasDifferentEnglishNames?: boolean
    needsEnglishNameSelection?: boolean
  }[]
  studios: {
    name: string
    parsedEnglishName?: string
    matched: MasterDataItem | null
    multipleMatches: MasterDataItem[]
    needsConfirmation: boolean
    customEnglishName?: string
    hasDifferentEnglishNames?: boolean
    needsEnglishNameSelection?: boolean
  }[]
  series: {
    name: string
    parsedEnglishName?: string
    matched: MasterDataItem | null
    multipleMatches: MasterDataItem[]
    needsConfirmation: boolean
    customEnglishName?: string
    hasDifferentEnglishNames?: boolean
    needsEnglishNameSelection?: boolean
  }[]
  labels: {
    name: string
    parsedEnglishName?: string
    matched: MasterDataItem | null
    multipleMatches: MasterDataItem[]
    needsConfirmation: boolean
    customEnglishName?: string
    hasDifferentEnglishNames?: boolean
    needsEnglishNameSelection?: boolean
  }[]
}

/**
 * Detect if a Japanese name is likely female based on common patterns
 */
function detectJapaneseFemaleName(name: string): boolean {
  // Common female name endings in Japanese
  const femaleEndings = [
    '子', '美', '香', '花', '菜', '奈', '愛', '恵', '絵', '里', '理', '由', '優', '友', '希', '衣', '江', '枝', '恵', '絵', '緒', '音', '楓', '風', '凜', '凛', '瑠', 'るみ', 'くるみ', 'りん', 'りほ', 'みく', 'あい', 'ゆき', 'さくら', 'もも', 'ももやま', 'ふじもり'
  ]
  
  // Common male name endings
  const maleEndings = [
    '郎', '太', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '男', '夫', '雄', '勇', '健', '強', '正', '誠', '直', '治', '司', '志', '史', '士', '人', '内村', 'いせどん', 'うちむら'
  ]
  
  // Check for female endings
  const hasFemaleEnding = femaleEndings.some(ending => name.includes(ending))
  
  // Check for male endings
  const hasMaleEnding = maleEndings.some(ending => name.includes(ending))
  
  // If it has male ending, it's likely male
  if (hasMaleEnding) {
    return false
  }
  
  // If it has female ending, it's likely female
  if (hasFemaleEnding) {
    return true
  }
  
  // Additional patterns for female names
  const femalePatterns = [
    /[あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん]{2,4}$/, // Hiragana endings
    /[ア-ン]{2,4}$/, // Katakana endings
  ]
  
  const hasFemalePattern = femalePatterns.some(pattern => pattern.test(name))
  
  // If no clear indicators, default to female for Japanese names (most adult film actresses are female)
  // But exclude obvious male indicators
  const maleIndicators = ['男', '夫', '雄', '郎', '太', '一郎', '二郎', '三郎']
  const hasMaleIndicator = maleIndicators.some(indicator => name.includes(indicator))
  
  if (hasMaleIndicator) {
    return false
  }
  
  // Default to female for ambiguous cases (most performers in adult films are female)
  return true
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
          case 'Label':
            parsed.label = cleanValue
            break
          case 'Rating':
            parsed.rating = cleanValue
            break
          case 'Tags':
            // Skip tags - will be handled manually by user during movie editing
            break
          case 'Actor(s)':
            // Split by spaces and filter out empty strings, then process each name
            const actorNames = cleanValue.split(/\s+/).map(actor => actor.trim()).filter(actor => actor.length > 0)
            
            // Check if the entire Actor(s) field is actually a title (common in javdb when no actors)
            // If it's very long or contains common title words, treat it as title, not actors
            const commonTitleWords = ['合コン', 'SEX', '中出し', '美少女', 'おじいちゃん', '老人', 'ギャル', 'ブル尻', '美乳', '中○し']
            const isLikelyTitle = actorNames.some(name => 
              name.length > 15 || 
              commonTitleWords.some(word => name.includes(word))
            )
            
            if (isLikelyTitle && actorNames.length === 1) {
              // This is likely a title, not actors - skip it
              console.log('Detected title in Actor(s) field, skipping:', cleanValue)
            } else {
              parsed.actors = actorNames
            }
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
          // No gender symbol, need to determine if it's actress or actor
          // Use improved gender detection logic
          const isLikelyFemale = detectJapaneseFemaleName(actor)
          
          if (isLikelyFemale) {
            actresses.push(actor)
          } else {
            actors.push(actor)
          }
        }
      })
      
      parsed.actresses = actresses
      parsed.actors = actors
    }
    
    // If no actresses found yet, try to extract from title
    // Only extract if we have actors data but no actresses (indicating mixed gender field)
    if (parsed.actresses.length === 0 && parsed.titleJp && parsed.actors.length > 0) {
      // Look for actress names in the title (usually at the end)
      const titleParts = parsed.titleJp.split(/\s+/)
      const lastPart = titleParts[titleParts.length - 1]
      
      // More strict criteria for actress extraction:
      // 1. Must contain Japanese characters
      // 2. Must not contain special symbols or punctuation
      // 3. Must not be too long (likely not a name if > 10 characters)
      // 4. Must not contain common title words
      const commonTitleWords = ['合コン', 'SEX', '中出し', '美少女', 'おじいちゃん', '老人', 'ギャル', 'ブル尻', '美乳']
      const isCommonTitleWord = commonTitleWords.some(word => lastPart.includes(word))
      
      if (lastPart && 
          /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(lastPart) && 
          !/[◆●★☆！？。、]/.test(lastPart) &&
          lastPart.length <= 10 &&
          !isCommonTitleWord) {
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
  masterData: MasterDataItem[],
  parsedEnglishNames?: {
    actresses?: string[]
    actors?: string[]
    directors?: string[]
    studios?: string[]
    series?: string[]
    labels?: string[]
  }
): Promise<MatchedData> {
  const matched: MatchedData = {
    actresses: [],
    actors: [],
    directors: [],
    studios: [],
    series: [],
    labels: []
  }

  // Helper function to calculate match score (higher = better match)
  const calculateMatchScore = (candidate: MasterDataItem, query: string): number => {
    const searchQuery = query.toLowerCase().trim()
    let score = 0
    
    // Exact matches get highest scores
    if (candidate.jpname?.toLowerCase() === searchQuery) score += 100
    if (candidate.kanjiName?.toLowerCase() === searchQuery) score += 100
    if (candidate.kanaName?.toLowerCase() === searchQuery) score += 100
    if (candidate.alias?.toLowerCase() === searchQuery) score += 80
    if (candidate.name?.toLowerCase() === searchQuery) score += 60
    
    // Contains matches get lower scores
    if (candidate.jpname?.toLowerCase().includes(searchQuery)) score += 50
    if (candidate.kanjiName?.toLowerCase().includes(searchQuery)) score += 50
    if (candidate.kanaName?.toLowerCase().includes(searchQuery)) score += 50
    if (candidate.alias?.toLowerCase().includes(searchQuery)) score += 40
    if (candidate.name?.toLowerCase().includes(searchQuery)) score += 30
    
    // Group-specific aliases
    if (candidate.groupData) {
      for (const groupName in candidate.groupData) {
        const groupInfo = candidate.groupData[groupName]
        if (groupInfo.alias?.toLowerCase() === searchQuery) score += 70
        if (groupInfo.alias?.toLowerCase().includes(searchQuery)) score += 35
      }
    }
    
    // Series-specific matching
    if (candidate.type === 'series') {
      if (candidate.titleEn?.toLowerCase() === searchQuery) score += 60
      if (candidate.titleJp?.toLowerCase() === searchQuery) score += 100
      if (candidate.titleEn?.toLowerCase().includes(searchQuery)) score += 30
      if (candidate.titleJp?.toLowerCase().includes(searchQuery)) score += 50
    }
    
    return score
  }
  
  // Helper function to check if matches are truly different (not just variations of same person)
  const areMatchesTrulyDifferent = (matches: MasterDataItem[]): boolean => {
    if (matches.length <= 1) return false
    
    // Check if all matches have the same Japanese name (jpname, kanjiName, kanaName)
    const japaneseNames = new Set()
    const englishNames = new Set()
    
    matches.forEach(match => {
      // Collect Japanese names
      if (match.jpname) japaneseNames.add(match.jpname.toLowerCase())
      if (match.kanjiName) japaneseNames.add(match.kanjiName.toLowerCase())
      if (match.kanaName) japaneseNames.add(match.kanaName.toLowerCase())
      
      // For series, also check titleJp
      if (match.titleJp) japaneseNames.add(match.titleJp.toLowerCase())
      
      // Collect English names
      const englishName = match.name || match.titleEn
      if (englishName) englishNames.add(englishName.toLowerCase())
    })
    
    // If all matches share the same Japanese name, they're likely the same person/series
    if (japaneseNames.size === 1) {
      console.log('All matches share same Japanese name, likely same person/series')
      return false
    }
    
    // If all matches share the same English name, no need to choose
    if (englishNames.size === 1) {
      console.log('All matches share same English name, no need to choose')
      return false
    }
    
    // Additional check: if the difference is only in minor variations (like spacing, punctuation)
    const normalizedEnglishNames = Array.from(englishNames).map(name => 
      name.replace(/[\s\-_.,]/g, '').toLowerCase()
    )
    const uniqueNormalizedNames = new Set(normalizedEnglishNames)
    
    if (uniqueNormalizedNames.size === 1) {
      console.log('English names are just minor variations, no need to choose')
      return false
    }
    
    return true
  }
  
  // Helper function to find matches with scoring
  const findMatches = (name: string, type: MasterDataItem['type']): { matched: MasterDataItem | null, multipleMatches: MasterDataItem[] } => {
    const candidates = masterData.filter(item => item.type === type)
    const matches: { candidate: MasterDataItem, score: number }[] = []
    
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
      const score = calculateMatchScore(candidate, name)
      // Only include matches with meaningful scores (avoid very weak matches)
      if (score >= 30) {
        matches.push({ candidate, score })
        if (type === 'studio') {
          console.log('Studio match found:', candidate.name, '|', candidate.jpname, '|', candidate.alias, 'Score:', score)
        }
      }
    }
    
    // Sort by score (highest first)
    matches.sort((a, b) => b.score - a.score)
    
    if (type === 'studio') {
      console.log('Total matches found:', matches.length)
      console.log('Sorted matches:', matches.map(m => ({ name: m.candidate.name, score: m.score })))
    }
    
    const sortedCandidates = matches.map(m => m.candidate)
    
    // Only consider it as multiple matches if the top matches have similar high scores
    // This prevents weak matches from being considered as alternatives
    const topScore = matches[0]?.score || 0
    const highScoreMatches = matches.filter(m => m.score >= topScore * 0.8) // Within 80% of top score
    const highScoreCandidates = highScoreMatches.map(m => m.candidate)
    
    // If multiple high-score matches found, return them as multipleMatches
    if (highScoreCandidates.length > 1) {
      return {
        matched: highScoreCandidates[0], // Highest scored match as default
        multipleMatches: highScoreCandidates
      }
    } else if (sortedCandidates.length >= 1) {
      return {
        matched: sortedCandidates[0],
        multipleMatches: []
      }
    }
    
    return {
      matched: null,
      multipleMatches: []
    }
  }

  // Match actresses
  for (let i = 0; i < parsedData.actresses.length; i++) {
    const actressName = parsedData.actresses[i]
    const parsedEnglishName = parsedEnglishNames?.actresses?.[i]
    
    console.log('=== MATCHING ACTRESS ===')
    console.log('Searching for actress:', actressName)
    console.log('Parsed English name:', parsedEnglishName)
    
    const matchResult = findMatches(actressName, 'actress')
    console.log('Actress match result:', matchResult)
    
    // Check if there are truly different English names in multiple matches (Stage 1)
    const hasDifferentEnglishNames = matchResult.multipleMatches.length > 1 && 
      areMatchesTrulyDifferent(matchResult.multipleMatches)
    
    // Check if English name differs between parsed data and matched database entry (Stage 2)
    let needsEnglishNameSelection = false
    if (matchResult.matched && parsedEnglishName && matchResult.matched.name) {
      const dbEnglishName = matchResult.matched.name.toLowerCase().trim()
      const parsedEngName = parsedEnglishName.toLowerCase().trim()
      
      // Check if names are different (not just minor variations)
      const normalizedDbName = dbEnglishName.replace(/[\s\-_.,]/g, '')
      const normalizedParsedName = parsedEngName.replace(/[\s\-_.,]/g, '')
      
      if (normalizedDbName !== normalizedParsedName) {
        needsEnglishNameSelection = true
        console.log('English names differ:', dbEnglishName, 'vs', parsedEngName)
      }
    }
    
    matched.actresses.push({
      name: actressName,
      parsedEnglishName,
      matched: matchResult.matched,
      multipleMatches: matchResult.multipleMatches,
      needsConfirmation: !matchResult.matched || matchResult.multipleMatches.length > 1,
      hasDifferentEnglishNames,
      needsEnglishNameSelection
    })
  }

  // Match actors
  for (let i = 0; i < parsedData.actors.length; i++) {
    const actorName = parsedData.actors[i]
    const parsedEnglishName = parsedEnglishNames?.actors?.[i]
    
    console.log('=== MATCHING ACTOR ===')
    console.log('Searching for actor:', actorName)
    console.log('Parsed English name:', parsedEnglishName)
    
    const matchResult = findMatches(actorName, 'actor')
    console.log('Actor match result:', matchResult)
    
    // Check if there are truly different English names in multiple matches (Stage 1)
    const hasDifferentEnglishNames = matchResult.multipleMatches.length > 1 && 
      areMatchesTrulyDifferent(matchResult.multipleMatches)
    
    // Check if English name differs between parsed data and matched database entry (Stage 2)
    let needsEnglishNameSelection = false
    if (matchResult.matched && parsedEnglishName && matchResult.matched.name) {
      const dbEnglishName = matchResult.matched.name.toLowerCase().trim()
      const parsedEngName = parsedEnglishName.toLowerCase().trim()
      
      const normalizedDbName = dbEnglishName.replace(/[\s\-_.,]/g, '')
      const normalizedParsedName = parsedEngName.replace(/[\s\-_.,]/g, '')
      
      if (normalizedDbName !== normalizedParsedName) {
        needsEnglishNameSelection = true
        console.log('English names differ:', dbEnglishName, 'vs', parsedEngName)
      }
    }
    
    matched.actors.push({
      name: actorName,
      parsedEnglishName,
      matched: matchResult.matched,
      multipleMatches: matchResult.multipleMatches,
      needsConfirmation: !matchResult.matched || matchResult.multipleMatches.length > 1,
      hasDifferentEnglishNames,
      needsEnglishNameSelection
    })
  }

  // Match directors
  if (parsedData.director) {
    const parsedEnglishName = parsedEnglishNames?.directors?.[0]
    
    console.log('=== MATCHING DIRECTOR ===')
    console.log('Searching for director:', parsedData.director)
    console.log('Parsed English name:', parsedEnglishName)
    
    const matchResult = findMatches(parsedData.director, 'director')
    console.log('Director match result:', matchResult)
    
    // Check if there are truly different English names in multiple matches (Stage 1)
    const hasDifferentEnglishNames = matchResult.multipleMatches.length > 1 && 
      areMatchesTrulyDifferent(matchResult.multipleMatches)
    
    // Check if English name differs between parsed data and matched database entry (Stage 2)
    let needsEnglishNameSelection = false
    if (matchResult.matched && parsedEnglishName && matchResult.matched.name) {
      const dbEnglishName = matchResult.matched.name.toLowerCase().trim()
      const parsedEngName = parsedEnglishName.toLowerCase().trim()
      
      const normalizedDbName = dbEnglishName.replace(/[\s\-_.,]/g, '')
      const normalizedParsedName = parsedEngName.replace(/[\s\-_.,]/g, '')
      
      if (normalizedDbName !== normalizedParsedName) {
        needsEnglishNameSelection = true
        console.log('English names differ:', dbEnglishName, 'vs', parsedEngName)
      }
    }
    
    matched.directors.push({
      name: parsedData.director,
      parsedEnglishName,
      matched: matchResult.matched,
      multipleMatches: matchResult.multipleMatches,
      needsConfirmation: !matchResult.matched || matchResult.multipleMatches.length > 1,
      hasDifferentEnglishNames,
      needsEnglishNameSelection
    })
  }

  // Match studios
  if (parsedData.studio) {
    const parsedEnglishName = parsedEnglishNames?.studios?.[0]
    
    console.log('=== MATCHING STUDIO ===')
    console.log('Searching for studio:', parsedData.studio)
    console.log('Parsed English name:', parsedEnglishName)
    
    const matchResult = findMatches(parsedData.studio, 'studio')
    console.log('Studio match result:', matchResult)
    
    // Check if there are truly different English names in multiple matches (Stage 1)
    const hasDifferentEnglishNames = matchResult.multipleMatches.length > 1 && 
      areMatchesTrulyDifferent(matchResult.multipleMatches)
    
    // Check if English name differs between parsed data and matched database entry (Stage 2)
    let needsEnglishNameSelection = false
    if (matchResult.matched && parsedEnglishName && matchResult.matched.name) {
      const dbEnglishName = matchResult.matched.name.toLowerCase().trim()
      const parsedEngName = parsedEnglishName.toLowerCase().trim()
      
      const normalizedDbName = dbEnglishName.replace(/[\s\-_.,]/g, '')
      const normalizedParsedName = parsedEngName.replace(/[\s\-_.,]/g, '')
      
      if (normalizedDbName !== normalizedParsedName) {
        needsEnglishNameSelection = true
        console.log('English names differ:', dbEnglishName, 'vs', parsedEngName)
      }
    }
    
    matched.studios.push({
      name: parsedData.studio,
      parsedEnglishName,
      matched: matchResult.matched,
      multipleMatches: matchResult.multipleMatches,
      needsConfirmation: !matchResult.matched || matchResult.multipleMatches.length > 1,
      hasDifferentEnglishNames,
      needsEnglishNameSelection
    })
  }

  // Match series
  if (parsedData.series) {
    const parsedEnglishName = parsedEnglishNames?.series?.[0]
    
    console.log('=== MATCHING SERIES ===')
    console.log('Searching for series:', parsedData.series)
    console.log('Parsed English name:', parsedEnglishName)
    
    const matchResult = findMatches(parsedData.series, 'series')
    console.log('Series match result:', matchResult)
    
    // Check if there are truly different English names in multiple matches (Stage 1)
    const hasDifferentEnglishNames = matchResult.multipleMatches.length > 1 && 
      areMatchesTrulyDifferent(matchResult.multipleMatches)
    
    // Check if English name differs between parsed data and matched database entry (Stage 2)
    let needsEnglishNameSelection = false
    if (matchResult.matched && parsedEnglishName && (matchResult.matched.name || matchResult.matched.titleEn)) {
      const dbEnglishName = (matchResult.matched.name || matchResult.matched.titleEn || '').toLowerCase().trim()
      const parsedEngName = parsedEnglishName.toLowerCase().trim()
      
      const normalizedDbName = dbEnglishName.replace(/[\s\-_.,]/g, '')
      const normalizedParsedName = parsedEngName.replace(/[\s\-_.,]/g, '')
      
      if (normalizedDbName !== normalizedParsedName) {
        needsEnglishNameSelection = true
        console.log('English names differ:', dbEnglishName, 'vs', parsedEngName)
      }
    }
    
    matched.series.push({
      name: parsedData.series,
      parsedEnglishName,
      matched: matchResult.matched,
      multipleMatches: matchResult.multipleMatches,
      needsConfirmation: !matchResult.matched || matchResult.multipleMatches.length > 1,
      hasDifferentEnglishNames,
      needsEnglishNameSelection
    })
  }

  // Match labels
  if (parsedData.label) {
    const parsedEnglishName = parsedEnglishNames?.labels?.[0]
    
    console.log('=== MATCHING LABEL ===')
    console.log('Searching for label:', parsedData.label)
    console.log('Parsed English name:', parsedEnglishName)
    
    const matchResult = findMatches(parsedData.label, 'label')
    console.log('Label match result:', matchResult)
    
    // Check if there are truly different English names in multiple matches (Stage 1)
    const hasDifferentEnglishNames = matchResult.multipleMatches.length > 1 && 
      areMatchesTrulyDifferent(matchResult.multipleMatches)
    
    // Check if English name differs between parsed data and matched database entry (Stage 2)
    let needsEnglishNameSelection = false
    if (matchResult.matched && parsedEnglishName && matchResult.matched.name) {
      const dbEnglishName = matchResult.matched.name.toLowerCase().trim()
      const parsedEngName = parsedEnglishName.toLowerCase().trim()
      
      const normalizedDbName = dbEnglishName.replace(/[\s\-_.,]/g, '')
      const normalizedParsedName = parsedEngName.replace(/[\s\-_.,]/g, '')
      
      if (normalizedDbName !== normalizedParsedName) {
        needsEnglishNameSelection = true
        console.log('English names differ:', dbEnglishName, 'vs', parsedEngName)
      }
    }
    
    matched.labels.push({
      name: parsedData.label,
      parsedEnglishName,
      matched: matchResult.matched,
      multipleMatches: matchResult.multipleMatches,
      needsConfirmation: !matchResult.matched || matchResult.multipleMatches.length > 1,
      hasDifferentEnglishNames,
      needsEnglishNameSelection
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
  const filteredActresses = parsedData.actresses.map((name, index) => {
    // Check if this actress is ignored
    if (ignoredItems?.has(`actresses-${index}`)) {
      return null // Mark as ignored
    }
    
    // Use matched data if available, otherwise use original name
    const matchedItem = matchedData.actresses[index]
    if (matchedItem?.matched) {
      // Use custom English name if user selected one, otherwise use matched name from database
      const matchedName = matchedItem.customEnglishName || matchedItem.matched.name || matchedItem.matched.jpname || name
      console.log(`Actress ${name} matched to: ${matchedName}`)
      return matchedName
    }
    console.log(`Actress ${name} not matched, using original name`)
    return name
  }).filter(name => name !== null) // Remove ignored items
  
  // Remove duplicates from actresses list
  const uniqueActresses = [...new Set(filteredActresses)]
  
  const filteredActors = parsedData.actors.map((name, index) => {
    // Check if this actor is ignored
    if (ignoredItems?.has(`actors-${index}`)) {
      return null // Mark as ignored
    }
    
    // Use matched data if available, otherwise use original name
    const matchedItem = matchedData.actors[index]
    if (matchedItem?.matched) {
      // Use custom English name if user selected one, otherwise use matched name from database
      const matchedName = matchedItem.customEnglishName || matchedItem.matched.name || matchedItem.matched.jpname || name
      console.log(`Actor ${name} matched to: ${matchedName}`)
      return matchedName
    }
    console.log(`Actor ${name} not matched, using original name`)
    return name
  }).filter(name => name !== null) // Remove ignored items
  
  // Remove duplicates from actors list
  const uniqueActors = [...new Set(filteredActors)]
  
  // Check if director is ignored and use matched data
  const isDirectorIgnored = ignoredItems?.has('directors-0')
  let director = ''
  if (!isDirectorIgnored) {
    const matchedDirector = matchedData.directors[0]
    if (matchedDirector?.matched) {
      // Use custom English name if user selected one, otherwise use matched name from database
      director = matchedDirector.customEnglishName || matchedDirector.matched.name || matchedDirector.matched.jpname || parsedData.director
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
      // Use custom English name if user selected one, otherwise use matched name from database
      studio = matchedStudio.customEnglishName || matchedStudio.matched.name || matchedStudio.matched.jpname || parsedData.studio
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
      // Use custom English name if user selected one, otherwise use matched name from database
      series = matchedSeries.customEnglishName || matchedSeries.matched.titleEn || matchedSeries.matched.titleJp || parsedData.series
      console.log(`Series ${parsedData.series} matched to: ${series}`)
    } else {
      series = parsedData.series
      console.log(`Series ${parsedData.series} not matched, using original name`)
    }
  }

  // Check if label is ignored and use matched data
  const isLabelIgnored = ignoredItems?.has('labels-0')
  let label = ''
  if (!isLabelIgnored && parsedData.label) {
    const matchedLabel = matchedData.labels[0]
    if (matchedLabel?.matched) {
      // Use custom English name if user selected one, otherwise use matched name from database
      label = matchedLabel.customEnglishName || matchedLabel.matched.name || matchedLabel.matched.jpname || parsedData.label
      console.log(`Label ${parsedData.label} matched to: ${label}`)
    } else {
      label = parsedData.label
      console.log(`Label ${parsedData.label} not matched, using original name`)
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
    label,
    actress: uniqueActresses.join(', '),
    actors: uniqueActors.join(', '),
    dmcode: parsedData.dmcode || '',
    type: 'HC' // Default to HC for parsed movies
  }
  
  console.log('=== FINAL MOVIE DATA ===')
  console.log('Final actresses (deduplicated):', finalMovie.actress)
  console.log('Final actors (deduplicated):', finalMovie.actors)
  console.log('Final director:', finalMovie.director)
  console.log('Final studio:', finalMovie.studio)
  console.log('Final series:', finalMovie.series)
  
  return finalMovie
}

/**
 * Merge parsed data with existing movie data
 */
export function mergeMovieData(
  existingMovie: Movie,
  parsedData: ParsedMovieData,
  selectedFields: Set<string>
): Movie {
  const mergedMovie = { ...existingMovie }

  // Update selected fields with parsed data
  if (selectedFields.has('titleEn') && parsedData.titleEn) {
    mergedMovie.titleEn = parsedData.titleEn
  }

  if (selectedFields.has('releaseDate') && parsedData.releaseDate) {
    mergedMovie.releaseDate = parsedData.releaseDate
  }

  if (selectedFields.has('duration') && parsedData.duration) {
    mergedMovie.duration = parsedData.duration
  }

  if (selectedFields.has('director') && parsedData.director) {
    mergedMovie.director = parsedData.director
  }

  if (selectedFields.has('studio') && parsedData.studio) {
    mergedMovie.studio = parsedData.studio
  }

  if (selectedFields.has('series') && parsedData.series) {
    mergedMovie.series = parsedData.series
  }

  if (selectedFields.has('label') && parsedData.label) {
    mergedMovie.label = parsedData.label
  }

  if (selectedFields.has('actress') && parsedData.actresses.length > 0) {
    // Merge actresses - combine existing and new, remove duplicates
    const existingActresses = existingMovie.actress ? existingMovie.actress.split(',').map(a => a.trim()) : []
    const newActresses = parsedData.actresses
    const combinedActresses = [...new Set([...existingActresses, ...newActresses])]
    mergedMovie.actress = combinedActresses.join(', ')
  }

  if (selectedFields.has('actors') && parsedData.actors.length > 0) {
    // Merge actors - combine existing and new, remove duplicates
    const existingActors = existingMovie.actors ? existingMovie.actors.split(',').map(a => a.trim()) : []
    const newActors = parsedData.actors
    const combinedActors = [...new Set([...existingActors, ...newActors])]
    mergedMovie.actors = combinedActors.join(', ')
  }

  // Update timestamp
  mergedMovie.updatedAt = new Date().toISOString()

  console.log('=== MERGED MOVIE DATA ===')
  console.log('Selected fields:', Array.from(selectedFields))
  console.log('Merged movie:', mergedMovie)

  return mergedMovie
}

/**
 * Helper function to check if a cast member matches search query including aliases
 * This is a simplified version of the one in masterDataApi.ts
 */
function castMatchesQuery(castMember: MasterDataItem, query: string): boolean {
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
