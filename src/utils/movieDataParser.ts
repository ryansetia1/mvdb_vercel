import { Movie } from './movieApi'
import { MasterDataItem } from './masterDataApi'
import { normalizeR18JapaneseName } from './japaneseNameNormalizer'
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
  // Additional data from R18.dev format
  galleryImages?: string[]
  coverImage?: string
  sampleUrl?: string
  // Additional director info from R18.dev
  directorInfo?: {
    name_romaji?: string
    name_kanji?: string
    name_kana?: string
    name_en?: string
  }
  // Additional series info from R18.dev
  seriesInfo?: {
    name_en?: string
    name_ja?: string
  }
  // Additional label info from R18.dev
  labelInfo?: {
    name_en?: string
    name_ja?: string
  }
  // Additional studio info from R18.dev
  studioInfo?: {
    name_en?: string
    name_ja?: string
  }
  // Additional actress info from R18.dev
  actressInfo?: Array<{
    name_romaji?: string
    name_kanji?: string
    name_kana?: string
    name_en?: string
  }>
  // Additional actor info from R18.dev
  actorInfo?: Array<{
    name_romaji?: string
    name_kanji?: string
    name_kana?: string
    name_en?: string
  }>
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
    availableEnglishNames?: string[] // Available English names from different sources
    missingData?: {
      kanjiName?: string // Kanji name from parsed data that's not in database
      kanaName?: string // Kana name from parsed data that's not in database
      alias?: string // Alias from parsed data that's not in database
      birthdate?: string // Birthdate from parsed data that's not in database
      tags?: string // Tags from parsed data that's not in database
    }
    shouldUpdateData?: boolean // User choice to update conflicting data in database
    isIgnored?: boolean // Flag to indicate if item is ignored (for JavDB simple parser)
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
    availableEnglishNames?: string[]
    missingData?: {
      kanjiName?: string
      kanaName?: string
      alias?: string
      birthdate?: string
      tags?: string
    }
    shouldUpdateData?: boolean
    isIgnored?: boolean // Flag to indicate if item is ignored (for JavDB simple parser)
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
    availableEnglishNames?: string[]
    missingData?: {
      kanjiName?: string
      kanaName?: string
      alias?: string
    }
    shouldUpdateData?: boolean
    isIgnored?: boolean // Flag to indicate if item is ignored (for JavDB simple parser)
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
    availableEnglishNames?: string[]
    missingData?: {
      kanjiName?: string
      kanaName?: string
      alias?: string
    }
    shouldUpdateData?: boolean
    isIgnored?: boolean // Flag to indicate if item is ignored (for JavDB simple parser)
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
    availableEnglishNames?: string[]
    missingData?: {
      titleJp?: string // Japanese title from parsed data that's not in database
      alias?: string
    }
    shouldUpdateData?: boolean
    isIgnored?: boolean // Flag to indicate if item is ignored (for JavDB simple parser)
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
    availableEnglishNames?: string[]
    missingData?: {
      kanjiName?: string
      kanaName?: string
      alias?: string
    }
    shouldUpdateData?: boolean
    isIgnored?: boolean // Flag to indicate if item is ignored (for JavDB simple parser)
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
 * Interface for R18.dev JSON format
 */
interface R18JsonData {
  actors: Array<{
    id: number
    image_url: string
    name_kana: string
    name_kanji: string
    name_romaji: string
    name_en?: string
  }>
  actresses: Array<{
    id: number
    image_url: string
    name_kana: string
    name_kanji: string
    name_romaji: string
    name_en?: string
  }>
  authors: any[]
  categories: Array<{
    id: number
    name_en: string
    name_en_is_machine_translation: boolean
    name_ja: string
  }>
  comment_en: string
  content_id: string
  directors: Array<{
    id: number
    name_kana: string
    name_kanji: string
    name_romaji: string
    name_en?: string
  }>
  dvd_id: string
  gallery: Array<{
    image_full: string
    image_thumb: string
  }>
  histrions: any[]
  jacket_full_url: string
  jacket_thumb_url: string
  label_id: number
  label_name_en: string
  label_name_ja: string
  maker_id: number
  maker_name_en: string
  maker_name_ja: string
  release_date: string
  runtime_mins: number
  sample_url: string
  series_id: number
  series_name_en: string
  series_name_en_is_machine_translation: boolean
  series_name_ja: string
  service_code: string
  site_id: number
  title_en: string
  title_en_is_machine_translation: boolean
  title_en_uncensored: string
  title_ja: string
}

/**
 * Check if the raw data is R18.dev JSON format
 */
function isR18JsonFormat(rawData: string): boolean {
  try {
    const parsed = JSON.parse(rawData.trim())
    return (
      parsed &&
      typeof parsed === 'object' &&
      'dvd_id' in parsed &&
      'title_ja' in parsed &&
      'actresses' in parsed &&
      'release_date' in parsed &&
      'runtime_mins' in parsed
    )
  } catch {
    return false
  }
}

/**
 * Check if the raw data is JavDB format (text-based)
 */
function isJavdbFormat(rawData: string): boolean {
  const lines = rawData.split('\n').map(line => line.trim()).filter(line => line.length > 0)
  
  if (lines.length === 0) return false
  
  // Check for typical JavDB patterns
  const firstLine = lines[0]
  
  // Pattern: CODE + Japanese title (e.g., "SNIS-217 ラブ◆キモメン ティア")
  const codeMatch = firstLine.match(/^([A-Z0-9-]+)/)
  if (!codeMatch) return false
  
  // Check for Japanese characters in title
  const titlePart = firstLine.replace(codeMatch[1], '').trim()
  const hasJapaneseChars = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(titlePart)
  
  // Check for typical JavDB structure indicators
  const hasTypicalStructure = lines.some(line => 
    line.includes('Release Date:') || 
    line.includes('Duration:') || 
    line.includes('Director:') ||
    line.includes('Studio:') ||
    line.includes('Series:') ||
    line.includes('Actresses:') ||
    line.includes('Actors:')
  )
  
  return hasJapaneseChars && (hasTypicalStructure || lines.length > 1)
}

/**
 * Detect data source format
 */
export function detectDataSource(rawData: string): 'javdb' | 'r18' | 'unknown' {
  if (!rawData || !rawData.trim()) return 'unknown'
  
  if (isR18JsonFormat(rawData)) {
    return 'r18'
  }
  
  if (isJavdbFormat(rawData)) {
    return 'javdb'
  }
  
  return 'unknown'
}

/**
 * Simple JavDB parser based on commit 5d5a725 logic
 * This parser focuses on basic text parsing without complex R18 JSON handling
 */
function parseJavdbSimpleData(rawData: string): ParsedMovieData | null {
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
      const [key, ...valueParts] = line.split(':')
      const value = valueParts.join(':').trim()
      
      if (value) {
        switch (key.trim().toLowerCase()) {
          case 'release date':
          case 'released date':
            parsed.releaseDate = value
            break
          case 'duration':
            parsed.duration = value
            break
          case 'director':
            parsed.director = value
            break
          case 'studio':
          case 'maker':
            parsed.studio = value
            break
          case 'series':
            parsed.series = value
            break
          case 'rating':
            parsed.rating = value
            break
          case 'actresses':
            // Handle comma-separated actresses
            parsed.actresses = value.split(',').map(name => name.trim()).filter(name => name.length > 0)
            break
          case 'actors':
          case 'actor(s)':
            // Handle space-separated actors with gender markers
            const actorNames = value.split(/\s+/).filter(name => name.length > 0)
            const actresses: string[] = []
            const actors: string[] = []
            
            actorNames.forEach(name => {
              // Remove gender markers and determine gender
              const cleanName = name.replace(/[♀♂]/g, '').trim()
              if (cleanName.length > 0) {
                if (name.includes('♀')) {
                  actresses.push(cleanName)
                } else if (name.includes('♂')) {
                  actors.push(cleanName)
                } else {
                  // If no gender marker, try to detect based on name patterns
                  if (detectJapaneseFemaleName(cleanName)) {
                    actresses.push(cleanName)
                  } else {
                    actors.push(cleanName)
                  }
                }
              }
            })
            
            parsed.actresses = actresses
            parsed.actors = actors
            break
          case 'tags':
            // Tags are ignored by the parser as per memory
            break
        }
      }
    } else {
      // Handle multi-line values (e.g., "Actresses:\nName1\nName2")
      const nextLine = i + 1 < lines.length ? lines[i + 1] : ''
      
      if (line.toLowerCase().includes('actresses') && nextLine && !nextLine.includes(':')) {
        // Collect actress names until we hit another key or end
        const actressNames: string[] = []
        let j = i + 1
        while (j < lines.length && !lines[j].includes(':') && lines[j].trim()) {
          actressNames.push(lines[j].trim())
          j++
        }
        parsed.actresses = actressNames
        i = j - 1 // Skip processed lines
      } else if (line.toLowerCase().includes('actors') && nextLine && !nextLine.includes(':')) {
        // Collect actor names until we hit another key or end
        const actorNames: string[] = []
        let j = i + 1
        while (j < lines.length && !lines[j].includes(':') && lines[j].trim()) {
          actorNames.push(lines[j].trim())
          j++
        }
        parsed.actors = actorNames
        i = j - 1 // Skip processed lines
      }
    }
  }

  return parsed
}

/**
 * Parse R18.dev JSON format
 */
function parseR18JsonData(rawData: string): ParsedMovieData | null {
  try {
    const data: R18JsonData = JSON.parse(rawData.trim())
    
    const parsed: ParsedMovieData = {
      code: data.dvd_id || '',
      titleJp: data.title_ja || '',
      titleEn: data.title_en || data.title_en_uncensored || '',
      releaseDate: data.release_date || '',
      duration: data.runtime_mins ? `${data.runtime_mins} minutes` : '',
      director: data.directors.length > 0 ? (data.directors[0].name_kanji || data.directors[0].name_kana || data.directors[0].name_romaji) : '',
      studio: data.maker_name_en || data.maker_name_ja || '',
      series: data.series_name_en || data.series_name_ja || '',
      label: data.label_name_en || data.label_name_ja || '',
      actresses: data.actresses.map(actress => actress.name_romaji || actress.name_kanji || actress.name_kana),
      actors: data.actors.map(actor => actor.name_romaji || actor.name_kanji || actor.name_kana),
      dmcode: data.content_id || '', // Use content_id as DM code for R18 data
      rawData,
      // Additional R18.dev data
      galleryImages: data.gallery.map(img => img.image_full),
      coverImage: data.jacket_full_url,
      sampleUrl: data.sample_url,
      // Director info from R18.dev (normalized)
      directorInfo: data.directors.length > 0 ? (() => {
        const director = data.directors[0]
        const normalized = normalizeR18JapaneseName(director)
        return {
          name_romaji: director.name_romaji,
          name_kanji: normalized.kanjiName,
          name_kana: normalized.kanaName,
          name_en: director.name_en,
          jpname: normalized.jpname, // Add normalized Japanese name
          alias: normalized.alias // Add extracted aliases
        }
      })() : undefined,
      // Series info from R18.dev
      seriesInfo: data.series_name_ja || data.series_name_en ? {
        name_en: data.series_name_en,
        name_ja: data.series_name_ja
      } : undefined,
      // Label info from R18.dev
      labelInfo: data.label_name_ja || data.label_name_en ? {
        name_en: data.label_name_en,
        name_ja: data.label_name_ja
      } : undefined,
      // Studio info from R18.dev
      studioInfo: data.maker_name_ja || data.maker_name_en ? {
        name_en: data.maker_name_en,
        name_ja: data.maker_name_ja
      } : undefined,
      // Actress info from R18.dev (normalized)
      actressInfo: data.actresses.map(actress => {
        const normalized = normalizeR18JapaneseName(actress)
        return {
          name_romaji: actress.name_romaji,
          name_kanji: normalized.kanjiName,
          name_kana: normalized.kanaName,
          name_en: actress.name_en,
          jpname: normalized.jpname, // Add normalized Japanese name
          alias: normalized.alias // Add extracted aliases
        }
      }),
      // Actor info from R18.dev (normalized)
      actorInfo: data.actors.map(actor => {
        const normalized = normalizeR18JapaneseName(actor)
        return {
          name_romaji: actor.name_romaji,
          name_kanji: normalized.kanjiName,
          name_kana: normalized.kanaName,
          name_en: actor.name_en,
          jpname: normalized.jpname, // Add normalized Japanese name
          alias: normalized.alias // Add extracted aliases
        }
      })
    }

    // Validate required fields
    if (!parsed.code || !parsed.titleJp || !parsed.releaseDate) {
      return null
    }

    return parsed
  } catch (error) {
    console.error('Error parsing R18 JSON data:', error)
    return null
  }
}

/**
 * Parse pasted movie data from various formats
 * Uses different parsers based on detected data source
 */
export function parseMovieData(rawData: string): ParsedMovieData | null {
  try {
    // Detect data source first
    const dataSource = detectDataSource(rawData)
    
    // Use appropriate parser based on data source
    if (dataSource === 'r18') {
      return parseR18JsonData(rawData)
    } else if (dataSource === 'javdb') {
      return parseJavdbSimpleData(rawData)
    }
    
    // Fallback to original complex parser for unknown formats
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
 * Simple matching function for JavDB data (no complex missing data detection)
 */
function matchJavdbSimple(
  parsedData: ParsedMovieData,
  masterData: MasterDataItem[]
): MatchedData {
  const matched: MatchedData = {
    actresses: [],
    actors: [],
    directors: [],
    studios: [],
    series: [],
    labels: []
  }

  // Simple matching for actresses - show Add/Ignore buttons for unmatched items
  parsedData.actresses.forEach(actressName => {
    const match = masterData.find(item => 
      item.type === 'actress' && (
        item.jpname?.toLowerCase() === actressName.toLowerCase() ||
        item.kanjiName?.toLowerCase() === actressName.toLowerCase() ||
        item.kanaName?.toLowerCase() === actressName.toLowerCase() ||
        item.name?.toLowerCase() === actressName.toLowerCase()
      )
    )
    
    matched.actresses.push({
      name: actressName,
      matched: match || null,
      multipleMatches: [],
      needsConfirmation: false, // Auto-confirm for simple matching
      isIgnored: false // Don't auto-ignore, let user choose
    })
  })

  // Simple matching for actors - show Add/Ignore buttons for unmatched items
  parsedData.actors.forEach(actorName => {
    const match = masterData.find(item => 
      item.type === 'actor' && (
        item.jpname?.toLowerCase() === actorName.toLowerCase() ||
        item.kanjiName?.toLowerCase() === actorName.toLowerCase() ||
        item.kanaName?.toLowerCase() === actorName.toLowerCase() ||
        item.name?.toLowerCase() === actorName.toLowerCase()
      )
    )
    
    matched.actors.push({
      name: actorName,
      matched: match || null,
      multipleMatches: [],
      needsConfirmation: false, // Auto-confirm for simple matching
      isIgnored: false // Don't auto-ignore, let user choose
    })
  })

  // Simple matching for directors - show Add/Ignore buttons for unmatched items
  if (parsedData.director) {
    const match = masterData.find(item => 
      item.type === 'director' && (
        item.jpname?.toLowerCase() === parsedData.director.toLowerCase() ||
        item.kanjiName?.toLowerCase() === parsedData.director.toLowerCase() ||
        item.kanaName?.toLowerCase() === parsedData.director.toLowerCase() ||
        item.name?.toLowerCase() === parsedData.director.toLowerCase()
      )
    )
    
    matched.directors.push({
      name: parsedData.director,
      matched: match || null,
      multipleMatches: [],
      needsConfirmation: false, // Auto-confirm for simple matching
      isIgnored: false // Don't auto-ignore, let user choose
    })
  }

  // Simple matching for studios - show Add/Ignore buttons for unmatched items
  if (parsedData.studio) {
    const match = masterData.find(item => 
      item.type === 'studio' && (
        item.jpname?.toLowerCase() === parsedData.studio.toLowerCase() ||
        item.kanjiName?.toLowerCase() === parsedData.studio.toLowerCase() ||
        item.kanaName?.toLowerCase() === parsedData.studio.toLowerCase() ||
        item.name?.toLowerCase() === parsedData.studio.toLowerCase()
      )
    )
    
    matched.studios.push({
      name: parsedData.studio,
      matched: match || null,
      multipleMatches: [],
      needsConfirmation: false, // Auto-confirm for simple matching
      isIgnored: false // Don't auto-ignore, let user choose
    })
  }

  // Simple matching for series - show Add/Ignore buttons for unmatched items
  if (parsedData.series) {
    const match = masterData.find(item => 
      item.type === 'series' && (
        item.jpname?.toLowerCase() === parsedData.series.toLowerCase() ||
        item.kanjiName?.toLowerCase() === parsedData.series.toLowerCase() ||
        item.kanaName?.toLowerCase() === parsedData.series.toLowerCase() ||
        item.name?.toLowerCase() === parsedData.series.toLowerCase()
      )
    )
    
    matched.series.push({
      name: parsedData.series,
      matched: match || null,
      multipleMatches: [],
      needsConfirmation: false, // Auto-confirm for simple matching
      isIgnored: false // Don't auto-ignore, let user choose
    })
  }

  return matched
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
  },
  dataSource?: 'javdb' | 'r18' | 'unknown'
): Promise<MatchedData> {
  // Use simple matching for JavDB data
  if (dataSource === 'javdb') {
    return matchJavdbSimple(parsedData, masterData)
  }
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
    
    // Label-specific matching - handle case where Japanese name equals English name
    if (candidate.type === 'label') {
      // For labels, if jpname and name are the same, give higher score for exact match
      if (candidate.jpname === candidate.name && candidate.name?.toLowerCase() === searchQuery) {
        score += 120 // Higher score for exact match when both names are same
      }
      // Also check if the query matches either jpname or name when they're different
      if (candidate.jpname !== candidate.name) {
        if (candidate.jpname?.toLowerCase() === searchQuery) score += 100
        if (candidate.name?.toLowerCase() === searchQuery) score += 100
      }
      // Additional check: if both names are the same and query matches, give extra points
      if (candidate.jpname === candidate.name && candidate.name?.toLowerCase().includes(searchQuery)) {
        score += 60 // Additional points for partial match when names are same
      }
    }
    
    return score
  }
  
  // Helper function to detect missing data in database
  const detectMissingData = (matchedItem: MasterDataItem | null, parsedName: string, type: string, parsedEnglishName?: string, r18Data?: any): any => {
    if (!matchedItem) return null
    
    const missingData: any = {}
    
    // For Japanese names, check if kanji/kana names are missing
    if (parsedName && /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(parsedName)) {
      // Check if parsed name contains kanji characters or Katakana
      // Note: We treat Katakana as kanjiName in our database for consistency with R18.dev naming
      if ((/[\u4E00-\u9FAF]/.test(parsedName) || /[\u30A0-\u30FF]/.test(parsedName)) && !matchedItem.kanjiName) {
        missingData.kanjiName = parsedName
      }
      
      // Check if parsed name contains kana characters
      // Only set kanaName if it's Hiragana (ひらがな), not Katakana (カタカナ)
      if (/[\u3040-\u309F]/.test(parsedName) && !matchedItem.kanaName) {
        missingData.kanaName = parsedName
      }
    }
    
    // Check if English name is missing and we have parsed English name
    if (parsedEnglishName && !matchedItem.name) {
      missingData.name = parsedEnglishName
    }
    
    // For actresses/actors/directors, check additional fields and R18.dev data
    if (type === 'actress' || type === 'actor' || type === 'director') {
      // Check if alias is missing (could be extracted from parsed data)
      if (parsedName && !matchedItem.alias && parsedName !== matchedItem.jpname) {
        missingData.alias = parsedName
      }
      
      // Check R18.dev data for missing kanji/kana names
      if (r18Data) {
        // Use normalizeR18JapaneseName untuk handle redundancy dan mapping yang benar
        const normalizedR18Data = normalizeR18JapaneseName(r18Data)
        
        // Check for missing Japanese name (prioritize normalized data)
        if (normalizedR18Data.jpname && !matchedItem.jpname) {
          missingData.jpname = normalizedR18Data.jpname
        }
        
        // Check for missing kanji name (only if it contains actual kanji)
        if (normalizedR18Data.kanjiName && !matchedItem.kanjiName) {
          missingData.kanjiName = normalizedR18Data.kanjiName
        }
        
        // Check for missing kana name
        if (normalizedR18Data.kanaName && !matchedItem.kanaName) {
          missingData.kanaName = normalizedR18Data.kanaName
        }
        
        // Check for missing English name
        if (normalizedR18Data.name && !matchedItem.name) {
          missingData.name = normalizedR18Data.name
        }
        
        // Check for missing alias (prioritize R18 aliases)
        if (normalizedR18Data.alias && !matchedItem.alias) {
          missingData.alias = normalizedR18Data.alias
        }
      }
    }
    
    // For series, check if Japanese title is missing
    if (type === 'series' && parsedName && !matchedItem.titleJp) {
      missingData.titleJp = parsedName
    }
    
    // For series, check if we need to update English title from R18.dev data
    if (type === 'series' && r18Data?.name_en && matchedItem.titleEn !== r18Data.name_en) {
      missingData.titleEn = r18Data.name_en
    }
    
    // For labels, check if Japanese name is missing (but only if it's different from English name)
    if (type === 'label' && parsedName && !matchedItem.jpname && parsedName !== matchedItem.name) {
      missingData.jpname = parsedName
    }
    
    return Object.keys(missingData).length > 0 ? missingData : null
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
      (name as string).replace(/[\s\-_.,]/g, '').toLowerCase()
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
    
    // Debug logging for director matching
    if (type === 'director') {
      console.log('=== FIND MATCHES FOR DIRECTOR ===')
      console.log('Searching for:', name)
      console.log('Candidates found:', candidates.length)
      console.log('Candidate names:', candidates.map(c => c.name).filter(Boolean))
      console.log('Candidate jpnames:', candidates.map(c => c.jpname).filter(Boolean))
      console.log('Candidate kanjiNames:', candidates.map(c => c.kanjiName).filter(Boolean))
      console.log('Candidate kanaNames:', candidates.map(c => c.kanaName).filter(Boolean))
      console.log('Candidate aliases:', candidates.map(c => c.alias).filter(Boolean))
    }
    
    // Debug logging for series matching
    if (type === 'series') {
      console.log('=== FIND MATCHES FOR SERIES ===')
      console.log('Searching for:', name)
      console.log('Candidates found:', candidates.length)
      console.log('Candidate names:', candidates.map(c => c.name).filter(Boolean))
      console.log('Candidate jpnames:', candidates.map(c => c.jpname).filter(Boolean))
      console.log('Candidate titleEn:', candidates.map(c => c.titleEn).filter(Boolean))
      console.log('Candidate titleJp:', candidates.map(c => c.titleJp).filter(Boolean))
      console.log('Candidate aliases:', candidates.map(c => c.alias).filter(Boolean))
    }
    
    // Debug logging for label matching
    if (type === 'label') {
      console.log('=== FIND MATCHES FOR LABEL ===')
      console.log('Searching for:', name)
      console.log('Candidates found:', candidates.length)
      console.log('Candidate names:', candidates.map(c => c.name).filter(Boolean))
      console.log('Candidate jpnames:', candidates.map(c => c.jpname).filter(Boolean))
      console.log('Candidate aliases:', candidates.map(c => c.alias).filter(Boolean))
    }
    
    // Debug logging for actress matching
    if (type === 'actress') {
      console.log('=== FIND MATCHES FOR ACTRESS ===')
      console.log('Searching for:', name)
      console.log('Candidates found:', candidates.length)
      console.log('Candidate names:', candidates.map(c => c.name).filter(Boolean))
      console.log('Candidate jpnames:', candidates.map(c => c.jpname).filter(Boolean))
      console.log('Candidate kanjiNames:', candidates.map(c => c.kanjiName).filter(Boolean))
      console.log('Candidate kanaNames:', candidates.map(c => c.kanaName).filter(Boolean))
      console.log('Candidate aliases:', candidates.map(c => c.alias).filter(Boolean))
    }
    
    for (const candidate of candidates) {
      const score = calculateMatchScore(candidate, name)
      
      // Debug logging for director - show all scores
      if (type === 'director') {
        console.log('Director candidate:', candidate.name, '|', candidate.jpname, '|', candidate.kanjiName, '|', candidate.kanaName, '|', candidate.alias, 'Score:', score)
      }
      
      // Debug logging for series - show all scores
      if (type === 'series') {
        console.log('Series candidate:', candidate.name, '|', candidate.jpname, '|', candidate.titleEn, '|', candidate.titleJp, '|', candidate.alias, 'Score:', score)
      }
      
      // Debug logging for label - show all scores
      if (type === 'label') {
        console.log('Label candidate:', candidate.name, '|', candidate.jpname, '|', candidate.alias, 'Score:', score)
        console.log('  - Query:', name)
        console.log('  - Candidate name:', candidate.name)
        console.log('  - Candidate jpname:', candidate.jpname)
        console.log('  - Names are same:', candidate.jpname === candidate.name)
      }
      
      // Debug logging for actress - show all scores
      if (type === 'actress') {
        console.log('Actress candidate:', candidate.name, '|', candidate.jpname, '|', candidate.kanjiName, '|', candidate.kanaName, '|', candidate.alias, 'Score:', score)
      }
      
      // Only include matches with meaningful scores (avoid very weak matches)
      // For labels, use lower threshold if Japanese name equals English name
      const minScore = type === 'label' && candidate.jpname === candidate.name ? 20 : 30
      
      if (score >= minScore) {
        matches.push({ candidate, score })
        if (type === 'studio') {
          console.log('Studio match found:', candidate.name, '|', candidate.jpname, '|', candidate.alias, 'Score:', score)
        }
        if (type === 'director') {
          console.log('Director match found:', candidate.name, '|', candidate.jpname, '|', candidate.kanjiName, '|', candidate.kanaName, '|', candidate.alias, 'Score:', score)
        }
        if (type === 'series') {
          console.log('Series match found:', candidate.name, '|', candidate.jpname, '|', candidate.titleEn, '|', candidate.titleJp, '|', candidate.alias, 'Score:', score)
        }
        if (type === 'label') {
          console.log('Label match found:', candidate.name, '|', candidate.jpname, '|', candidate.alias, 'Score:', score)
        }
        if (type === 'actress') {
          console.log('Actress match found:', candidate.name, '|', candidate.jpname, '|', candidate.kanjiName, '|', candidate.kanaName, '|', candidate.alias, 'Score:', score)
        }
      }
    }
    
    // Sort by score (highest first)
    matches.sort((a, b) => b.score - a.score)
    
    if (type === 'studio') {
      console.log('Total matches found:', matches.length)
      console.log('Sorted matches:', matches.map(m => ({ name: m.candidate.name, score: m.score })))
    }
    if (type === 'director') {
      console.log('Total director matches found:', matches.length)
      console.log('Sorted director matches:', matches.map(m => ({ name: m.candidate.name, jpname: m.candidate.jpname, score: m.score })))
    }
    if (type === 'series') {
      console.log('Total series matches found:', matches.length)
      console.log('Sorted series matches:', matches.map(m => ({ name: m.candidate.name, jpname: m.candidate.jpname, titleEn: m.candidate.titleEn, titleJp: m.candidate.titleJp, score: m.score })))
    }
    if (type === 'label') {
      console.log('Total label matches found:', matches.length)
      console.log('Sorted label matches:', matches.map(m => ({ name: m.candidate.name, jpname: m.candidate.jpname, score: m.score })))
    }
    if (type === 'actress') {
      console.log('Total actress matches found:', matches.length)
      console.log('Sorted actress matches:', matches.map(m => ({ name: m.candidate.name, jpname: m.candidate.jpname, kanjiName: m.candidate.kanjiName, kanaName: m.candidate.kanaName, alias: m.candidate.alias, score: m.score })))
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
    const r18ActressData = parsedData.actressInfo?.[i]
    
    console.log('=== MATCHING ACTRESS ===')
    console.log('Searching for actress:', actressName)
    console.log('Parsed English name:', parsedEnglishName)
    console.log('R18 actress data:', r18ActressData)
    
    // Try matching with all available name variations from R18 data
    let matchResult = findMatches(actressName, 'actress')
    
    // If no match found and we have R18 data, try other name variations
    if (!matchResult.matched && r18ActressData) {
      console.log('No match found with primary name, trying R18 names...')
      
      // Use normalized data for better matching
      const normalizedR18Data = normalizeR18JapaneseName(r18ActressData)
      
      const nameVariations = [
        normalizedR18Data.jpname,      // Normalized Japanese name
        normalizedR18Data.kanjiName,    // Normalized kanji name
        normalizedR18Data.kanaName,     // Normalized kana name
        normalizedR18Data.name,        // Normalized English name
        r18ActressData.name_romaji,    // Original romaji
        r18ActressData.name_en         // Original English
      ].filter(Boolean) // Remove null/undefined values
      
      console.log('Trying name variations:', nameVariations)
      console.log('Normalized R18 data:', normalizedR18Data)
      
      for (const variation of nameVariations) {
        if (variation && variation !== actressName) {
          console.log('Trying variation:', variation)
          const variationResult = findMatches(variation, 'actress')
          if (variationResult.matched) {
            console.log('Found match with variation:', variation)
            matchResult = variationResult
            break
          }
        }
      }
    }
    
    console.log('Final actress match result:', matchResult)
    
    // Check if there are truly different English names in multiple matches (Stage 1)
    const hasDifferentEnglishNames = matchResult.multipleMatches.length > 1 && 
      areMatchesTrulyDifferent(matchResult.multipleMatches)
    
    // Check if English name differs between parsed data and matched database entry (Stage 2)
    let needsEnglishNameSelection = false
    let availableEnglishNames: string[] = []
    
    // Check parsed English name
    if (matchResult.matched && parsedEnglishName && matchResult.matched.name) {
      const dbEnglishName = matchResult.matched.name.toLowerCase().trim()
      const parsedEngName = parsedEnglishName.toLowerCase().trim()
      
      // Check if names are different (not just minor variations)
      const normalizedDbName = dbEnglishName.replace(/[\s\-_.,]/g, '')
      const normalizedParsedName = parsedEngName.replace(/[\s\-_.,]/g, '')
      
      if (normalizedDbName !== normalizedParsedName) {
        needsEnglishNameSelection = true
        availableEnglishNames.push(parsedEnglishName)
        console.log('English names differ:', dbEnglishName, 'vs', parsedEngName)
      }
    }
    
    // Check R18.dev data for additional English names
    if (matchResult.matched && r18ActressData) {
      // Only use name_en for English name comparison, not name_romaji
      const r18EnglishName = r18ActressData.name_en
      
      if (r18EnglishName) {
        const dbEnglishName = matchResult.matched.name?.toLowerCase().trim() || ''
        const r18EngName = r18EnglishName.toLowerCase().trim()
        
        const normalizedDbName = dbEnglishName.replace(/[\s\-_.,]/g, '')
        const normalizedR18Name = r18EngName.replace(/[\s\-_.,]/g, '')
        
        if (normalizedDbName !== normalizedR18Name && !availableEnglishNames.includes(r18EnglishName)) {
          needsEnglishNameSelection = true
          availableEnglishNames.push(r18EnglishName)
          console.log('R18 English name differs:', dbEnglishName, 'vs', r18EngName, '(source: name_en)')
        }
      }
    }
    
    // Detect missing data in database
    const missingData = detectMissingData(matchResult.matched, actressName, 'actress', parsedEnglishName, r18ActressData)
    
    matched.actresses.push({
      name: actressName,
      parsedEnglishName,
      matched: matchResult.matched,
      multipleMatches: matchResult.multipleMatches,
      needsConfirmation: !matchResult.matched || matchResult.multipleMatches.length > 1 || needsEnglishNameSelection,
      hasDifferentEnglishNames,
      needsEnglishNameSelection,
      availableEnglishNames: availableEnglishNames.length > 0 ? availableEnglishNames : undefined,
      missingData,
      shouldUpdateData: missingData !== null || needsEnglishNameSelection // Auto-set for missing data or conflicts
    })
  }

  // Match actors
  for (let i = 0; i < parsedData.actors.length; i++) {
    const actorName = parsedData.actors[i]
    const parsedEnglishName = parsedEnglishNames?.actors?.[i]
    const r18ActorData = parsedData.actorInfo?.[i]
    
    console.log('=== MATCHING ACTOR ===')
    console.log('Searching for actor:', actorName)
    console.log('Parsed English name:', parsedEnglishName)
    console.log('R18 actor data:', r18ActorData)
    
    // For R18 data, try multiple search strategies
    let matchResult = findMatches(actorName, 'actor')
    
    // If no match found and we have R18 data, try searching with other names
    if (!matchResult.matched && r18ActorData) {
      console.log('No match found with primary name, trying R18 names...')
      
      // Use normalized data for better matching
      const normalizedR18Data = normalizeR18JapaneseName(r18ActorData)
      
      const nameVariations = [
        normalizedR18Data.jpname,      // Normalized Japanese name
        normalizedR18Data.kanjiName,    // Normalized kanji name
        normalizedR18Data.kanaName,     // Normalized kana name
        normalizedR18Data.name,        // Normalized English name
        r18ActorData.name_romaji,      // Original romaji
        r18ActorData.name_en           // Original English
      ].filter(Boolean) // Remove null/undefined values
      
      console.log('Trying name variations:', nameVariations)
      console.log('Normalized R18 data:', normalizedR18Data)
      
      for (const variation of nameVariations) {
        if (variation && variation !== actorName) {
          console.log('Trying variation:', variation)
          const variationResult = findMatches(variation, 'actor')
          if (variationResult.matched) {
            console.log('Found match with variation:', variation)
            matchResult = variationResult
            break
          }
        }
      }
    }
    
    console.log('Final actor match result:', matchResult)
    
    // Check if there are truly different English names in multiple matches (Stage 1)
    const hasDifferentEnglishNames = matchResult.multipleMatches.length > 1 && 
      areMatchesTrulyDifferent(matchResult.multipleMatches)
    
    // Check if English name differs between parsed data and matched database entry (Stage 2)
    let needsEnglishNameSelection = false
    let availableEnglishNames: string[] = []
    
    // Check parsed English name
    if (matchResult.matched && parsedEnglishName && matchResult.matched.name) {
      const dbEnglishName = matchResult.matched.name.toLowerCase().trim()
      const parsedEngName = parsedEnglishName.toLowerCase().trim()
      
      const normalizedDbName = dbEnglishName.replace(/[\s\-_.,]/g, '')
      const normalizedParsedName = parsedEngName.replace(/[\s\-_.,]/g, '')
      
      if (normalizedDbName !== normalizedParsedName) {
        needsEnglishNameSelection = true
        availableEnglishNames.push(parsedEnglishName)
        console.log('English names differ:', dbEnglishName, 'vs', parsedEngName)
      }
    }
    
    // Check R18.dev data for additional English names
    if (matchResult.matched && r18ActorData) {
      // Only use name_en for English name comparison, not name_romaji
      const r18EnglishName = r18ActorData.name_en
      
      if (r18EnglishName) {
        const dbEnglishName = matchResult.matched.name?.toLowerCase().trim() || ''
        const r18EngName = r18EnglishName.toLowerCase().trim()
        
        const normalizedDbName = dbEnglishName.replace(/[\s\-_.,]/g, '')
        const normalizedR18Name = r18EngName.replace(/[\s\-_.,]/g, '')
        
        if (normalizedDbName !== normalizedR18Name && !availableEnglishNames.includes(r18EnglishName)) {
          needsEnglishNameSelection = true
          availableEnglishNames.push(r18EnglishName)
          console.log('R18 English name differs:', dbEnglishName, 'vs', r18EngName, '(source: name_en)')
        }
      }
    }
    
    // Detect missing data in database
    const missingData = detectMissingData(matchResult.matched, actorName, 'actor', parsedEnglishName, r18ActorData)
    
    matched.actors.push({
      name: actorName,
      parsedEnglishName,
      matched: matchResult.matched,
      multipleMatches: matchResult.multipleMatches,
      needsConfirmation: !matchResult.matched || matchResult.multipleMatches.length > 1 || needsEnglishNameSelection,
      hasDifferentEnglishNames,
      needsEnglishNameSelection,
      availableEnglishNames: availableEnglishNames.length > 0 ? availableEnglishNames : undefined,
      missingData,
      shouldUpdateData: missingData !== null || needsEnglishNameSelection // Auto-set for missing data or conflicts
    })
  }

  // Match directors
  if (parsedData.director) {
    const parsedEnglishName = parsedEnglishNames?.directors?.[0]
    
    console.log('=== MATCHING DIRECTOR ===')
    console.log('Searching for director:', parsedData.director)
    console.log('Parsed English name:', parsedEnglishName)
    console.log('Director info from R18.dev:', parsedData.directorInfo)
    
    // Try matching with all name variations from R18.dev
    let matchResult = findMatches(parsedData.director, 'director')
    
    // If no match found and we have R18.dev director info, try other name variations
    if (!matchResult.matched && parsedData.directorInfo) {
      console.log('No match found with primary name, trying other variations...')
      
      // Use normalized data for better matching
      const normalizedR18Data = normalizeR18JapaneseName(parsedData.directorInfo)
      
      const nameVariations = [
        normalizedR18Data.jpname,      // Normalized Japanese name
        normalizedR18Data.kanjiName,    // Normalized kanji name
        normalizedR18Data.kanaName,     // Normalized kana name
        normalizedR18Data.name,        // Normalized English name
        parsedData.directorInfo.name_romaji,  // Original romaji
        parsedData.directorInfo.name_en       // Original English
      ].filter(Boolean) // Remove null/undefined values
      
      console.log('Trying name variations:', nameVariations)
      console.log('Normalized R18 data:', normalizedR18Data)
      
      for (const variation of nameVariations) {
        if (variation && variation !== parsedData.director) {
          console.log('Trying variation:', variation)
          const variationResult = findMatches(variation, 'director')
          if (variationResult.matched) {
            console.log('Found match with variation:', variation)
            matchResult = variationResult
            break
          }
        }
      }
    }
    
    console.log('Director match result:', matchResult)
    
    // Check if there are truly different English names in multiple matches (Stage 1)
    const hasDifferentEnglishNames = matchResult.multipleMatches.length > 1 && 
      areMatchesTrulyDifferent(matchResult.multipleMatches)
    
    // Check if English name differs between parsed data and matched database entry (Stage 2)
    let needsEnglishNameSelection = false
    let availableEnglishNames: string[] = []
    
    // Check parsed English name (if available)
    if (matchResult.matched && parsedEnglishName && matchResult.matched.name) {
      const dbEnglishName = matchResult.matched.name.toLowerCase().trim()
      const parsedEngName = parsedEnglishName.toLowerCase().trim()
      
      const normalizedDbName = dbEnglishName.replace(/[\s\-_.,]/g, '')
      const normalizedParsedName = parsedEngName.replace(/[\s\-_.,]/g, '')
      
      if (normalizedDbName !== normalizedParsedName) {
        needsEnglishNameSelection = true
        availableEnglishNames.push(parsedEnglishName)
        console.log('English names differ:', dbEnglishName, 'vs', parsedEngName)
      }
    }
    
    // Check R18.dev data for additional English names (this is the main check for directors)
    if (matchResult.matched && parsedData.directorInfo) {
      // Only use name_en for English name comparison, not name_romaji
      const r18EnglishName = parsedData.directorInfo.name_en
      
      if (r18EnglishName) {
        const dbEnglishName = matchResult.matched.name?.toLowerCase().trim() || ''
        const r18EngName = r18EnglishName.toLowerCase().trim()
        
        const normalizedDbName = dbEnglishName.replace(/[\s\-_.,]/g, '')
        const normalizedR18Name = r18EngName.replace(/[\s\-_.,]/g, '')
        
        console.log('=== DIRECTOR ENGLISH NAME COMPARISON ===')
        console.log('Database English Name:', dbEnglishName)
        console.log('R18 English Name:', r18EngName)
        console.log('Source: name_en')
        console.log('Normalized DB Name:', normalizedDbName)
        console.log('Normalized R18 Name:', normalizedR18Name)
        console.log('Names are different:', normalizedDbName !== normalizedR18Name)
        
        if (normalizedDbName !== normalizedR18Name && !availableEnglishNames.includes(r18EnglishName)) {
          needsEnglishNameSelection = true
          availableEnglishNames.push(r18EnglishName)
          console.log('✅ R18 English name differs - NEEDS SELECTION')
        } else {
          console.log('✅ R18 English name matches - NO SELECTION NEEDED')
        }
      }
    }
    
    // Detect missing data in database
    const missingData = detectMissingData(matchResult.matched, parsedData.director, 'director', parsedEnglishName, parsedData.directorInfo)
    
    matched.directors.push({
      name: parsedData.director,
      parsedEnglishName,
      matched: matchResult.matched,
      multipleMatches: matchResult.multipleMatches,
      needsConfirmation: !matchResult.matched || matchResult.multipleMatches.length > 1 || needsEnglishNameSelection,
      hasDifferentEnglishNames,
      needsEnglishNameSelection,
      availableEnglishNames: availableEnglishNames.length > 0 ? availableEnglishNames : undefined,
      missingData,
      shouldUpdateData: missingData !== null || needsEnglishNameSelection // Auto-set for missing data or conflicts
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
    let availableEnglishNames: string[] = []
    
    // Check parsed English name (if available)
    if (matchResult.matched && parsedEnglishName && matchResult.matched.name) {
      const dbEnglishName = matchResult.matched.name.toLowerCase().trim()
      const parsedEngName = parsedEnglishName.toLowerCase().trim()
      
      const normalizedDbName = dbEnglishName.replace(/[\s\-_.,]/g, '')
      const normalizedParsedName = parsedEngName.replace(/[\s\-_.,]/g, '')
      
      if (normalizedDbName !== normalizedParsedName) {
        needsEnglishNameSelection = true
        availableEnglishNames.push(parsedEnglishName)
        console.log('English names differ:', dbEnglishName, 'vs', parsedEngName)
      }
    }
    
    // Check R18.dev data for additional English names (this is the main check for studios)
    if (matchResult.matched && parsedData.studioInfo) {
      // Only use name_en for English name comparison, not name_ja
      const r18EnglishName = parsedData.studioInfo.name_en
      
      if (r18EnglishName) {
        const dbEnglishName = matchResult.matched.name?.toLowerCase().trim() || ''
        const r18EngName = r18EnglishName.toLowerCase().trim()
        
        const normalizedDbName = dbEnglishName.replace(/[\s\-_.,]/g, '')
        const normalizedR18Name = r18EngName.replace(/[\s\-_.,]/g, '')
        
        console.log('=== STUDIO ENGLISH NAME COMPARISON ===')
        console.log('Database English Name:', dbEnglishName)
        console.log('R18 English Name:', r18EngName)
        console.log('Source: name_en')
        console.log('Normalized DB Name:', normalizedDbName)
        console.log('Normalized R18 Name:', normalizedR18Name)
        console.log('Names are different:', normalizedDbName !== normalizedR18Name)
        
        if (normalizedDbName !== normalizedR18Name && !availableEnglishNames.includes(r18EnglishName)) {
          needsEnglishNameSelection = true
          availableEnglishNames.push(r18EnglishName)
          console.log('✅ R18 English name differs - NEEDS SELECTION')
        } else {
          console.log('✅ R18 English name matches - NO SELECTION NEEDED')
        }
      }
    }
    
    // Detect missing data in database
    const missingData = detectMissingData(matchResult.matched, parsedData.studio, 'studio', parsedEnglishName, parsedData.studioInfo)
    
    matched.studios.push({
      name: parsedData.studio,
      parsedEnglishName,
      matched: matchResult.matched,
      multipleMatches: matchResult.multipleMatches,
      needsConfirmation: !matchResult.matched || matchResult.multipleMatches.length > 1 || needsEnglishNameSelection,
      hasDifferentEnglishNames,
      needsEnglishNameSelection,
      availableEnglishNames: availableEnglishNames.length > 0 ? availableEnglishNames : undefined,
      missingData,
      shouldUpdateData: missingData !== null || needsEnglishNameSelection // Auto-set for missing data or conflicts
    })
  }

  // Match series
  if (parsedData.series) {
    const parsedEnglishName = parsedEnglishNames?.series?.[0]
    
    console.log('=== MATCHING SERIES ===')
    console.log('Searching for series:', parsedData.series)
    console.log('Parsed English name:', parsedEnglishName)
    console.log('Series info from R18.dev:', parsedData.seriesInfo)
    
    // Try matching with all name variations from R18.dev
    let matchResult = findMatches(parsedData.series, 'series')
    
    // If no match found and we have R18.dev series info, try other name variations
    if (!matchResult.matched && parsedData.seriesInfo) {
      console.log('No match found with primary name, trying other variations...')
      
      // Try with English name
      if (parsedData.seriesInfo.name_en && parsedData.seriesInfo.name_en !== parsedData.series) {
        console.log('Trying with English name:', parsedData.seriesInfo.name_en)
        const englishMatch = findMatches(parsedData.seriesInfo.name_en, 'series')
        if (englishMatch.matched) {
          matchResult = englishMatch
          console.log('Found match with English name!')
        }
      }
      
      // Try with Japanese name (if different from primary)
      if (!matchResult.matched && parsedData.seriesInfo.name_ja && parsedData.seriesInfo.name_ja !== parsedData.series) {
        console.log('Trying with Japanese name:', parsedData.seriesInfo.name_ja)
        const japaneseMatch = findMatches(parsedData.seriesInfo.name_ja, 'series')
        if (japaneseMatch.matched) {
          matchResult = japaneseMatch
          console.log('Found match with Japanese name!')
        }
      }
    }
    
    console.log('Series match result:', matchResult)
    
    // Check if there are truly different English names in multiple matches (Stage 1)
    const hasDifferentEnglishNames = matchResult.multipleMatches.length > 1 && 
      areMatchesTrulyDifferent(matchResult.multipleMatches)
    
    // Check if English name differs between parsed data and matched database entry (Stage 2)
    let needsEnglishNameSelection = false
    let availableEnglishNames: string[] = []
    
    // Check parsed English name
    if (matchResult.matched && parsedEnglishName && (matchResult.matched.name || matchResult.matched.titleEn)) {
      const dbEnglishName = (matchResult.matched.name || matchResult.matched.titleEn || '').toLowerCase().trim()
      const parsedEngName = parsedEnglishName.toLowerCase().trim()
      
      const normalizedDbName = dbEnglishName.replace(/[\s\-_.,]/g, '')
      const normalizedParsedName = parsedEngName.replace(/[\s\-_.,]/g, '')
      
      if (normalizedDbName !== normalizedParsedName) {
        needsEnglishNameSelection = true
        availableEnglishNames.push(parsedEnglishName)
        console.log('English names differ:', dbEnglishName, 'vs', parsedEngName)
      }
    }
    
    // Check R18.dev data for additional English names (this is the main check for series)
    if (matchResult.matched && parsedData.seriesInfo) {
      // Only use name_en for English name comparison, not name_ja
      const r18EnglishName = parsedData.seriesInfo.name_en
      
      if (r18EnglishName) {
        const dbEnglishName = (matchResult.matched.name || matchResult.matched.titleEn || '').toLowerCase().trim()
        const r18EngName = r18EnglishName.toLowerCase().trim()
        
        const normalizedDbName = dbEnglishName.replace(/[\s\-_.,]/g, '')
        const normalizedR18Name = r18EngName.replace(/[\s\-_.,]/g, '')
        
        console.log('=== SERIES ENGLISH NAME COMPARISON ===')
        console.log('Database English Name:', dbEnglishName)
        console.log('R18 English Name:', r18EngName)
        console.log('Source: name_en')
        console.log('Normalized DB Name:', normalizedDbName)
        console.log('Normalized R18 Name:', normalizedR18Name)
        console.log('Names are different:', normalizedDbName !== normalizedR18Name)
        
        if (normalizedDbName !== normalizedR18Name && !availableEnglishNames.includes(r18EnglishName)) {
          needsEnglishNameSelection = true
          availableEnglishNames.push(r18EnglishName)
          console.log('✅ R18 English name differs - NEEDS SELECTION')
        } else {
          console.log('✅ R18 English name matches - NO SELECTION NEEDED')
        }
      }
    }
    
    // Detect missing data in database
    const missingData = detectMissingData(matchResult.matched, parsedData.series, 'series', parsedEnglishName, parsedData.seriesInfo)
    
    matched.series.push({
      name: parsedData.series,
      parsedEnglishName,
      matched: matchResult.matched,
      multipleMatches: matchResult.multipleMatches,
      needsConfirmation: false, // Auto-confirm series - no manual confirmation needed
      hasDifferentEnglishNames,
      needsEnglishNameSelection,
      availableEnglishNames: availableEnglishNames.length > 0 ? availableEnglishNames : undefined,
      missingData,
      shouldUpdateData: true // Auto-update series data - always update when there are differences
    })
  }

  // Match labels
  if (parsedData.label) {
    const parsedEnglishName = parsedEnglishNames?.labels?.[0]
    
    console.log('=== MATCHING LABEL ===')
    console.log('Searching for label:', parsedData.label)
    console.log('Parsed English name:', parsedEnglishName)
    console.log('Label info from R18.dev:', parsedData.labelInfo)
    
    // Try matching with all name variations from R18.dev
    let matchResult = findMatches(parsedData.label, 'label')
    
    // If no match found and we have R18.dev label info, try other name variations
    if (!matchResult.matched && parsedData.labelInfo) {
      console.log('No match found with primary name, trying other variations...')
      
      // Try with English name
      if (parsedData.labelInfo.name_en && parsedData.labelInfo.name_en !== parsedData.label) {
        console.log('Trying with English name:', parsedData.labelInfo.name_en)
        const englishMatch = findMatches(parsedData.labelInfo.name_en, 'label')
        if (englishMatch.matched) {
          matchResult = englishMatch
          console.log('Found match with English name!')
        }
      }
      
      // Try with Japanese name (if different from primary)
      if (!matchResult.matched && parsedData.labelInfo.name_ja && parsedData.labelInfo.name_ja !== parsedData.label) {
        console.log('Trying with Japanese name:', parsedData.labelInfo.name_ja)
        const japaneseMatch = findMatches(parsedData.labelInfo.name_ja, 'label')
        if (japaneseMatch.matched) {
          matchResult = japaneseMatch
          console.log('Found match with Japanese name!')
        }
      }
    }
    
    console.log('Label match result:', matchResult)
    
    // Check if there are truly different English names in multiple matches (Stage 1)
    const hasDifferentEnglishNames = matchResult.multipleMatches.length > 1 && 
      areMatchesTrulyDifferent(matchResult.multipleMatches)
    
    // Check if English name differs between parsed data and matched database entry (Stage 2)
    let needsEnglishNameSelection = false
    let availableEnglishNames: string[] = []
    
    // Check parsed English name
    if (matchResult.matched && parsedEnglishName && matchResult.matched.name) {
      const dbEnglishName = matchResult.matched.name.toLowerCase().trim()
      const parsedEngName = parsedEnglishName.toLowerCase().trim()
      
      const normalizedDbName = dbEnglishName.replace(/[\s\-_.,]/g, '')
      const normalizedParsedName = parsedEngName.replace(/[\s\-_.,]/g, '')
      
      if (normalizedDbName !== normalizedParsedName) {
        needsEnglishNameSelection = true
        availableEnglishNames.push(parsedEnglishName)
        console.log('English names differ:', dbEnglishName, 'vs', parsedEngName)
      }
    }
    
    // Check R18.dev data for additional English names (this is the main check for labels)
    if (matchResult.matched && parsedData.labelInfo) {
      // Only use name_en for English name comparison, not name_ja
      const r18EnglishName = parsedData.labelInfo.name_en
      
      if (r18EnglishName) {
        const dbEnglishName = matchResult.matched.name?.toLowerCase().trim() || ''
        const r18EngName = r18EnglishName.toLowerCase().trim()
        
        const normalizedDbName = dbEnglishName.replace(/[\s\-_.,]/g, '')
        const normalizedR18Name = r18EngName.replace(/[\s\-_.,]/g, '')
        
        console.log('=== LABEL ENGLISH NAME COMPARISON ===')
        console.log('Database English Name:', dbEnglishName)
        console.log('R18 English Name:', r18EngName)
        console.log('Source: name_en')
        console.log('Normalized DB Name:', normalizedDbName)
        console.log('Normalized R18 Name:', normalizedR18Name)
        console.log('Names are different:', normalizedDbName !== normalizedR18Name)
        
        if (normalizedDbName !== normalizedR18Name && !availableEnglishNames.includes(r18EnglishName)) {
          needsEnglishNameSelection = true
          availableEnglishNames.push(r18EnglishName)
          console.log('✅ R18 English name differs - NEEDS SELECTION')
        } else {
          console.log('✅ R18 English name matches - NO SELECTION NEEDED')
        }
      }
    }
    
    // Detect missing data in database
    const missingData = detectMissingData(matchResult.matched, parsedData.label, 'label', parsedEnglishName, parsedData.labelInfo)
    
    matched.labels.push({
      name: parsedData.label,
      parsedEnglishName,
      matched: matchResult.matched,
      multipleMatches: matchResult.multipleMatches,
      needsConfirmation: !matchResult.matched || matchResult.multipleMatches.length > 1 || needsEnglishNameSelection,
      hasDifferentEnglishNames,
      needsEnglishNameSelection,
      availableEnglishNames: availableEnglishNames.length > 0 ? availableEnglishNames : undefined,
      missingData,
      shouldUpdateData: missingData !== null || needsEnglishNameSelection // Auto-set for missing data or conflicts
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
export function convertToMovie(parsedData: ParsedMovieData, matchedData: MatchedData, ignoredItems?: Set<string>, dataSource?: 'javdb' | 'r18' | 'unknown'): Movie {
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
    
    // For JavDB: auto-ignore unmatched items (no action from user)
    if (dataSource === 'javdb') {
      console.log(`Actress ${name} not matched and no action from user, auto-ignoring for JavDB`)
      return null // Auto-ignore for JavDB
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
    
    // For JavDB: auto-ignore unmatched items (no action from user)
    if (dataSource === 'javdb') {
      console.log(`Actor ${name} not matched and no action from user, auto-ignoring for JavDB`)
      return null // Auto-ignore for JavDB
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
      // For JavDB: auto-ignore unmatched items (no action from user)
      if (dataSource === 'javdb') {
        console.log(`Director ${parsedData.director} not matched and no action from user, auto-ignoring for JavDB`)
        director = '' // Auto-ignore for JavDB
      } else {
        director = parsedData.director
        console.log(`Director ${parsedData.director} not matched, using original name`)
      }
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
      // For JavDB: auto-ignore unmatched items (no action from user)
      if (dataSource === 'javdb') {
        console.log(`Studio ${parsedData.studio} not matched and no action from user, auto-ignoring for JavDB`)
        studio = '' // Auto-ignore for JavDB
      } else {
        studio = parsedData.studio
        console.log(`Studio ${parsedData.studio} not matched, using original name`)
      }
    }
  }
  
  // Check if series is ignored and use matched data
  const isSeriesIgnored = ignoredItems?.has('series-0')
  let series = ''
  if (!isSeriesIgnored) {
    const matchedSeries = matchedData.series[0]
    if (matchedSeries?.matched) {
      // Use custom English name if user selected one, otherwise use matched name from database
      series = matchedSeries.customEnglishName || matchedSeries.matched.name || matchedSeries.matched.titleEn || matchedSeries.matched.titleJp || parsedData.series
      console.log(`Series ${parsedData.series} matched to: ${series}`)
      if (matchedSeries.customEnglishName) {
        console.log(`Using custom English name selected by user: ${matchedSeries.customEnglishName}`)
      }
    } else {
      // For JavDB: auto-ignore unmatched items (no action from user)
      if (dataSource === 'javdb') {
        console.log(`Series ${parsedData.series} not matched and no action from user, auto-ignoring for JavDB`)
        series = '' // Auto-ignore for JavDB
      } else {
        // If no match found but we have R18.dev series info, use the English name from R18
        if (parsedData.seriesInfo?.name_en) {
          series = parsedData.seriesInfo.name_en
          console.log(`Series ${parsedData.series} not matched, using R18 English name: ${series}`)
        } else {
          series = parsedData.series
          console.log(`Series ${parsedData.series} not matched, using original name`)
        }
      }
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
    type: 'HC', // Default to HC for parsed movies
    cropCover: false, // Default to false, will be overridden by MovieDataParser
    // Additional R18.dev data
    galleryImages: parsedData.galleryImages,
    coverImage: parsedData.coverImage,
    sampleUrl: parsedData.sampleUrl
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
