/**
 * DeepSeek R1 Translation API Integration
 * Menggunakan OpenRouter untuk mengakses model DeepSeek R1 free
 * Support untuk environment variables dan Supabase secrets
 */

import { getApiKeyFromSupabaseSecrets } from './supabaseSecretsApi'

// OpenRouter API Configuration
const OPENROUTER_API_KEY = (import.meta as any).env?.VITE_OPENROUTER_API_KEY
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'

// Check if API key is valid
const isApiKeyValid = (key: string): boolean => {
  return Boolean(key && key.length > 20)
}

// Get API key with fallback to Supabase secrets
const getApiKeyWithFallback = async (accessToken?: string): Promise<string | null> => {
  console.log('Getting API key with fallback...')
  
  // First try environment variable
  console.log('Environment variable OPENROUTER_API_KEY:', OPENROUTER_API_KEY ? 'exists' : 'not found')
  if (isApiKeyValid(OPENROUTER_API_KEY)) {
    console.log('Using environment variable API key')
    return OPENROUTER_API_KEY
  }
  
  // Fallback to Supabase secrets if accessToken is provided
  if (accessToken) {
    console.log('Trying Supabase secrets with accessToken:', accessToken ? 'present' : 'missing')
    try {
      const secretApiKey = await getApiKeyFromSupabaseSecrets(accessToken, 'mvdb3')
      console.log('Supabase secrets response:', secretApiKey ? 'found' : 'not found')
      if (secretApiKey && isApiKeyValid(secretApiKey)) {
        console.log('Using Supabase secrets API key')
        return secretApiKey
      } else {
        console.log('Supabase secrets API key invalid or empty')
      }
    } catch (error) {
      console.warn('Failed to get API key from Supabase secrets:', error)
    }
  } else {
    console.log('No accessToken provided for Supabase secrets')
  }
  
  console.log('No valid API key found')
  return null
}


// Get context description for better translation
const getContextDescription = (context: string): string => {
  switch (context) {
    case 'movie_title':
      return 'movie title'
    case 'actor_name':
      return 'actor name'
    case 'actress_name':
      return 'actress name'
    case 'studio_name':
      return 'studio name'
    case 'series_name':
      return 'series name'
    case 'general':
    default:
      return 'general text'
  }
}

// Build movie context information for better translation
const buildMovieContextInfo = (movieContext?: TranslationRequest['movieContext']): string => {
  if (!movieContext) return ''
  
  const contextParts: string[] = []
  
  if (movieContext.actresses && movieContext.actresses.length > 0) {
    contextParts.push(`Actresses: ${movieContext.actresses.join(', ')}`)
  }
  
  if (movieContext.actors && movieContext.actors.length > 0) {
    contextParts.push(`Actors: ${movieContext.actors.join(', ')}`)
  }
  
  if (movieContext.directors && movieContext.directors.length > 0) {
    contextParts.push(`Directors: ${movieContext.directors.join(', ')}`)
  }
  
  if (movieContext.studio) {
    contextParts.push(`Studio: ${movieContext.studio}`)
  }
  
  if (movieContext.series) {
    contextParts.push(`Series: ${movieContext.series}`)
  }
  
  if (movieContext.dmcode) {
    contextParts.push(`Code: ${movieContext.dmcode}`)
  }
  
  return contextParts.length > 0 
    ? `\n\nContext: ${contextParts.join(', ')}\n\nNote: Do not translate person names, only translate descriptive words.`
    : ''
}

export interface TranslationRequest {
  text: string
  sourceLanguage?: string
  targetLanguage?: string
  context?: 'movie_title' | 'actor_name' | 'actress_name' | 'studio_name' | 'series_name' | 'general'
  movieContext?: {
    actors?: string[]
    actresses?: string[]
    directors?: string[]
    studio?: string
    series?: string
    dmcode?: string
  }
  accessToken?: string
}

export interface TranslationResponse {
  translatedText: string
  success: boolean
  error?: string
}

/**
 * Translate text menggunakan DeepSeek R1 model melalui OpenRouter
 * @param request - Translation request object
 * @returns Promise<TranslationResponse>
 */
export async function translateWithDeepSeek(request: TranslationRequest): Promise<TranslationResponse> {
  const { text, sourceLanguage = 'japanese', targetLanguage = 'english', context = 'general', movieContext, accessToken } = request

  if (!text || text.trim().length === 0) {
    return {
      translatedText: '',
      success: false,
      error: 'Text tidak boleh kosong'
    }
  }

  // Get API key with fallback to Supabase secrets
  const apiKey = await getApiKeyWithFallback(accessToken)
  
  if (!apiKey) {
    return {
      translatedText: '',
      success: false,
      error: 'API key tidak dikonfigurasi'
    }
  }

  try {
    // Prepare the prompt for DeepSeek R1
    const systemPrompt = `You are a professional Japanese-to-English translator specializing in entertainment industry content.

TRANSLATION RULES:
- Translate Japanese text to natural English
- For movie titles: Keep the meaning but make it sound natural in English
- For names: Use standard romanization (Hepburn) or common English names
- For series/studio names: Translate to English equivalents when appropriate
- Return ONLY the translated text, no explanations or notes
- Do not add commentary, analysis, or rationale

CONTEXT: ${getContextDescription(context)}${buildMovieContextInfo(movieContext)}

Translate this Japanese text to English:`

    const userPrompt = `${text}`

    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'MVDB Translation Service'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-r1:free',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        max_tokens: 500,
        temperature: 0.3,
        top_p: 0.9,
        stream: false
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('OpenRouter API Error:', response.status, errorData)
      return {
        translatedText: '',
        success: false,
        error: `API Error: ${response.status} - ${errorData}`
      }
    }

    const data = await response.json()
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      const translatedText = data.choices[0].message.content?.trim() || ''
      
      return {
        translatedText,
        success: true
      }
    } else {
      console.error('Unexpected API response structure:', data)
      return {
        translatedText: '',
        success: false,
        error: 'Unexpected response format from API'
      }
    }

  } catch (error) {
    console.error('Translation error:', error)
    return {
      translatedText: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * Translate Japanese text to English dengan konteks spesifik dan movie data
 * @param japaneseText - Text dalam bahasa Jepang
 * @param context - Konteks konten (movie_title, actor_name, actress_name, dll)
 * @param movieContext - Konteks movie data (actors, actresses, directors, dll)
 * @returns Promise<string> - Translated text dalam bahasa Inggris
 */
export async function translateJapaneseToEnglishWithContext(
  japaneseText: string, 
  context: 'movie_title' | 'actor_name' | 'actress_name' | 'studio_name' | 'series_name' | 'general' = 'general',
  movieContext?: TranslationRequest['movieContext'],
  accessToken?: string
): Promise<string> {
  if (!japaneseText || japaneseText.trim().length === 0) {
    return ''
  }

  // Try DeepSeek R1 first with context
  const deepseekResult = await translateWithDeepSeek({
    text: japaneseText,
    sourceLanguage: 'japanese',
    targetLanguage: 'english',
    context: context,
    movieContext: movieContext,
    accessToken: accessToken
  })

  if (deepseekResult.success && deepseekResult.translatedText) {
    console.log(`DeepSeek R1 translation successful for ${context}:`, deepseekResult.translatedText)
    return deepseekResult.translatedText
  }

  // Fallback to MyMemory API
  console.log('DeepSeek R1 failed, falling back to MyMemory API:', deepseekResult.error)
  try {
    const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(japaneseText)}&langpair=ja|en`)
    const data = await response.json()
    
    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      console.log('MyMemory fallback translation successful')
      return data.responseData.translatedText
    } else {
      console.warn('MyMemory fallback also failed, returning original text')
      return japaneseText
    }
  } catch (fallbackError) {
    console.error('MyMemory fallback error:', fallbackError)
    return japaneseText
  }
}

/**
 * Translate movie title dengan konteks movie data untuk menghindari terjemahan literal nama orang
 * @param movieTitle - Movie title dalam bahasa Jepang
 * @param movieData - Data movie yang berisi actors, actresses, directors, dll
 * @returns Promise<string> - Translated movie title dalam bahasa Inggris
 */
export async function translateMovieTitleWithContext(
  movieTitle: string,
  movieData: {
    actors?: string
    actress?: string
    director?: string
    studio?: string
    series?: string
    dmcode?: string
  },
  accessToken?: string
): Promise<string> {
  if (!movieTitle || movieTitle.trim().length === 0) {
    return ''
  }

  // Parse comma-separated values
  const actors = movieData.actors ? movieData.actors.split(',').map(a => a.trim()).filter(a => a) : []
  const actresses = movieData.actress ? movieData.actress.split(',').map(a => a.trim()).filter(a => a) : []
  const directors = movieData.director ? [movieData.director.trim()].filter(d => d) : []

  const movieContext: TranslationRequest['movieContext'] = {
    actors: actors.length > 0 ? actors : undefined,
    actresses: actresses.length > 0 ? actresses : undefined,
    directors: directors.length > 0 ? directors : undefined,
    studio: movieData.studio,
    series: movieData.series,
    dmcode: movieData.dmcode
  }

  return translateJapaneseToEnglishWithContext(movieTitle, 'movie_title', movieContext, accessToken)
}

/**
 * Translate Japanese text to English dengan fallback ke MyMemory API
 * @param japaneseText - Text dalam bahasa Jepang
 * @param accessToken - Supabase access token untuk mengakses secrets
 * @returns Promise<string> - Translated text dalam bahasa Inggris
 */
export async function translateJapaneseToEnglish(japaneseText: string, accessToken?: string): Promise<string> {
  // Use the context-aware function with general context
  return translateJapaneseToEnglishWithContext(japaneseText, 'general', undefined, accessToken)
}

/**
 * Batch translate multiple Japanese texts
 * @param texts - Array of Japanese texts
 * @returns Promise<string[]> - Array of translated texts
 */
export async function batchTranslateJapaneseToEnglish(texts: string[]): Promise<string[]> {
  const results: string[] = []
  
  // Process translations sequentially to avoid rate limiting
  for (const text of texts) {
    const translated = await translateJapaneseToEnglish(text)
    results.push(translated)
    
    // Small delay between requests to be respectful to the API
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  return results
}

/**
 * Convert Japanese text to Romaji menggunakan DeepSeek R1
 * @param japaneseText - Text dalam bahasa Jepang
 * @returns Promise<string> - Romaji text
 */
export async function convertJapaneseToRomaji(japaneseText: string, accessToken?: string): Promise<string> {
  if (!japaneseText || japaneseText.trim().length === 0) {
    return ''
  }

  // Get API key with fallback to Supabase secrets
  const apiKey = await getApiKeyWithFallback(accessToken)
  
  if (!apiKey) {
    console.warn('API key tidak dikonfigurasi, menggunakan fallback Romaji conversion')
    return basicJapaneseToRomaji(japaneseText)
  }

  try {
    // Prepare the prompt for DeepSeek R1 untuk konversi romaji
    const systemPrompt = `You are a Japanese language expert specializing in converting Japanese text to Romaji.

ROMANIZATION RULES:
- Convert Japanese characters to Romaji using Hepburn romanization
- Use standard pronunciation rules (し = shi, つ = tsu, ち = chi)
- For long vowels, use macrons or double vowels as appropriate
- Return ONLY the Romaji text, no explanations or notes
- If text is already in Romaji or English, return as is

Convert this Japanese text to Romaji:`

    const userPrompt = `${japaneseText}`

    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'MVDB Romaji Conversion Service'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-r1:free',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        max_tokens: 300,
        temperature: 0.1,
        top_p: 0.9,
        stream: false
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('OpenRouter API Error for Romaji:', response.status, errorData)
      // Fallback to basic conversion
      return basicJapaneseToRomaji(japaneseText)
    }

    const data = await response.json()
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      const romajiText = data.choices[0].message.content?.trim() || ''
      
      if (romajiText && romajiText !== japaneseText) {
        return romajiText
      } else {
        return basicJapaneseToRomaji(japaneseText)
      }
    } else {
      console.error('Unexpected API response structure for Romaji:', data)
      return basicJapaneseToRomaji(japaneseText)
    }

  } catch (error) {
    console.error('Romaji conversion error:', error)
    return basicJapaneseToRomaji(japaneseText)
  }
}

/**
 * Basic Japanese to Romaji conversion (fallback)
 * @param japaneseText - Japanese text
 * @returns string - Basic romaji conversion
 */
function basicJapaneseToRomaji(japaneseText: string): string {
  // Basic character mapping for common Japanese characters
  const romajiMap: { [key: string]: string } = {
    'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
    'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
    'さ': 'sa', 'し': 'shi', 'す': 'su', 'せ': 'se', 'そ': 'so',
    'た': 'ta', 'ち': 'chi', 'つ': 'tsu', 'て': 'te', 'と': 'to',
    'な': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
    'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he', 'ほ': 'ho',
    'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
    'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
    'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
    'わ': 'wa', 'を': 'wo', 'ん': 'n',
    // Katakana
    'ア': 'a', 'イ': 'i', 'ウ': 'u', 'エ': 'e', 'オ': 'o',
    'カ': 'ka', 'キ': 'ki', 'ク': 'ku', 'ケ': 'ke', 'コ': 'ko',
    'サ': 'sa', 'シ': 'shi', 'ス': 'su', 'セ': 'se', 'ソ': 'so',
    'タ': 'ta', 'チ': 'chi', 'ツ': 'tsu', 'テ': 'te', 'ト': 'to',
    'ナ': 'na', 'ニ': 'ni', 'ヌ': 'nu', 'ネ': 'ne', 'ノ': 'no',
    'ハ': 'ha', 'ヒ': 'hi', 'フ': 'fu', 'ヘ': 'he', 'ホ': 'ho',
    'マ': 'ma', 'ミ': 'mi', 'ム': 'mu', 'メ': 'me', 'モ': 'mo',
    'ヤ': 'ya', 'ユ': 'yu', 'ヨ': 'yo',
    'ラ': 'ra', 'リ': 'ri', 'ル': 'ru', 'レ': 're', 'ロ': 'ro',
    'ワ': 'wa', 'ヲ': 'wo', 'ン': 'n'
  }

  let result = japaneseText
  for (const [japanese, romaji] of Object.entries(romajiMap)) {
    result = result.replace(new RegExp(japanese, 'g'), romaji)
  }
  
  return result
}

/**
 * Test connection to OpenRouter API
 * @param accessToken - Supabase access token for secrets
 * @returns Promise<boolean> - True if connection successful
 */
export async function testOpenRouterConnection(accessToken?: string): Promise<boolean> {
  try {
    const testResult = await translateWithDeepSeek({
      text: 'テスト',
      sourceLanguage: 'japanese',
      targetLanguage: 'english',
      accessToken: accessToken
    })
    
    return testResult.success
  } catch (error) {
    console.error('OpenRouter connection test failed:', error)
    return false
  }
}
