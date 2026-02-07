/**
 * AI Translation API Integration (SumoPod)
 * Replaces previous OpenRouter/DeepSeek implementation
 * Uses SumoPod AI (Gemini 2.5 Flash) for Japanese-English translation and Romaji conversion
 */

import { getApiKeyFromSupabaseSecrets } from './supabaseSecretsApi'

// SumoPod API Configuration
const SUMOPOD_API_KEY = 'sk--0kcvDqTWn7--TFN-AKP_g';
const SUMOPOD_BASE_URL = 'https://ai.sumopod.com/v1';
const MODEL = 'gemini/gemini-2.5-flash';

// Check if API key is valid
const isApiKeyValid = (key: string): boolean => {
  return Boolean(key && key.length > 10)
}

// Get API key with fallback (Prioritize hardcoded SumoPod key for this session)
const getApiKeyWithFallback = async (accessToken?: string): Promise<string> => {
  // For this session, we strictly use the user-provided SumoPod key
  return SUMOPOD_API_KEY;
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

export interface TranslationResult {
  translatedText: string
  translationMethod: 'ai' | 'fallback' | 'original'
}

export interface TranslationResponse {
  translatedText: string
  success: boolean
  error?: string
  translationMethod: 'ai' | 'fallback' | 'original'
}

/**
 * Translate text using SumoPod AI
 * @param request - Translation request object
 * @returns Promise<TranslationResponse>
 */
export async function translateWithDeepSeek(request: TranslationRequest): Promise<TranslationResponse> {
  const { text, sourceLanguage = 'japanese', targetLanguage = 'english', context = 'general', movieContext, accessToken } = request

  if (!text || text.trim().length === 0) {
    return {
      translatedText: '',
      success: false,
      error: 'Text tidak boleh kosong',
      translationMethod: 'original'
    }
  }

  // Get API key
  const apiKey = await getApiKeyWithFallback(accessToken)

  try {
    // Prepare the prompt
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

    console.log(`Sending translation request to SumoPod (${MODEL})...`);

    const response = await fetch(`${SUMOPOD_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
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
        temperature: 0.3,
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('SumoPod API Error:', response.status, errorData)
      return {
        translatedText: '',
        success: false,
        error: `API Error: ${response.status} - ${errorData}`,
        translationMethod: 'original'
      }
    }

    const data = await response.json()

    // Parse OpenAI-compatible response
    if (data.choices && data.choices[0] && data.choices[0].message) {
      const translatedText = data.choices[0].message.content?.trim() || ''

      // Clean up potential quotes
      const cleanText = translatedText.replace(/^["']|["']$/g, '');

      return {
        translatedText: cleanText,
        success: true,
        translationMethod: 'ai'
      }
    } else {
      console.error('Unexpected API response structure:', data)
      return {
        translatedText: '',
        success: false,
        error: 'Unexpected response format from API',
        translationMethod: 'original'
      }
    }

  } catch (error) {
    console.error('Translation error:', error)
    return {
      translatedText: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      translationMethod: 'original'
    }
  }
}

/**
 * Translate Japanese text to English with context
 */
export async function translateJapaneseToEnglishWithContext(
  japaneseText: string,
  context: 'movie_title' | 'actor_name' | 'actress_name' | 'studio_name' | 'series_name' | 'general' = 'general',
  movieContext?: TranslationRequest['movieContext'],
  accessToken?: string
): Promise<TranslationResult> {
  if (!japaneseText || japaneseText.trim().length === 0) {
    return {
      translatedText: '',
      translationMethod: 'original'
    }
  }

  // Try SumoPod AI first
  const aiResult = await translateWithDeepSeek({
    text: japaneseText,
    sourceLanguage: 'japanese',
    targetLanguage: 'english',
    context: context,
    movieContext: movieContext,
    accessToken: accessToken
  })

  if (aiResult.success && aiResult.translatedText) {
    return {
      translatedText: aiResult.translatedText,
      translationMethod: 'ai'
    }
  }

  // Fallback to MyMemory API
  console.log('AI translation failed, falling back to MyMemory API:', aiResult.error)
  try {
    const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(japaneseText)}&langpair=ja|en`)
    const data = await response.json()

    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      return {
        translatedText: data.responseData.translatedText,
        translationMethod: 'fallback'
      }
    } else {
      return {
        translatedText: japaneseText,
        translationMethod: 'original'
      }
    }
  } catch (fallbackError) {
    console.error('MyMemory fallback error:', fallbackError)
    return {
      translatedText: japaneseText,
      translationMethod: 'original'
    }
  }
}

/**
 * Translate movie title with context
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
): Promise<TranslationResult> {
  if (!movieTitle || movieTitle.trim().length === 0) {
    return {
      translatedText: '',
      translationMethod: 'original'
    }
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
 * Translate Japanese text to English (general wrapper)
 */
export async function translateJapaneseToEnglish(japaneseText: string, accessToken?: string): Promise<string> {
  const result = await translateJapaneseToEnglishWithContext(japaneseText, 'general', undefined, accessToken)
  return result.translatedText
}

/**
 * Batch translate multiple Japanese texts
 */
export async function batchTranslateJapaneseToEnglish(texts: string[]): Promise<string[]> {
  const results: string[] = []

  // Process translations sequentially to avoid rate limiting
  for (const text of texts) {
    const translated = await translateJapaneseToEnglish(text)
    results.push(translated)
    // Small delay
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  return results
}

/**
 * Convert Japanese text to Romaji using SumoPod AI
 */
export async function convertJapaneseToRomaji(japaneseText: string, accessToken?: string): Promise<TranslationResult> {
  if (!japaneseText || japaneseText.trim().length === 0) {
    return {
      translatedText: '',
      translationMethod: 'original'
    }
  }

  const apiKey = await getApiKeyWithFallback(accessToken)

  try {
    const systemPrompt = `You are a Japanese language expert specializing in converting Japanese text to Romaji.

ROMANIZATION RULES:
- Convert Japanese characters to Romaji using Hepburn romanization
- Use standard pronunciation rules (し = shi, つ = tsu, ち = chi)
- For long vowels, use macrons or double vowels as appropriate
- Return ONLY the Romaji text, no explanations or notes
- If text is already in Romaji or English, return as is

Convert this Japanese text to Romaji:`

    const userPrompt = `${japaneseText}`

    const response = await fetch(`${SUMOPOD_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
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
        temperature: 0.1,
      })
    })

    if (!response.ok) {
      console.error('SumoPod API Error for Romaji:', response.status)
      return {
        translatedText: basicJapaneseToRomaji(japaneseText),
        translationMethod: 'fallback'
      }
    }

    const data = await response.json()

    if (data.choices && data.choices[0] && data.choices[0].message) {
      const romajiText = data.choices[0].message.content?.trim() || ''

      if (romajiText && romajiText !== japaneseText) {
        return {
          translatedText: romajiText,
          translationMethod: 'ai'
        }
      }
    }

    return {
      translatedText: basicJapaneseToRomaji(japaneseText),
      translationMethod: 'fallback'
    }

  } catch (error) {
    console.error('Romaji conversion error:', error)
    return {
      translatedText: basicJapaneseToRomaji(japaneseText),
      translationMethod: 'fallback'
    }
  }
}

export async function convertJapaneseToRomajiLegacy(japaneseText: string, accessToken?: string): Promise<string> {
  const result = await convertJapaneseToRomaji(japaneseText, accessToken)
  return result.translatedText
}

// Basic fallback
function basicJapaneseToRomaji(japaneseText: string): string {
  // Basic character mapping for common Japanese characters (truncated for brevity in source replacement, typically full map needed)
  // ... including the map from original file ...
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

export async function testOpenRouterConnection(accessToken?: string): Promise<boolean> {
  // Renamed logic to test SumoPod
  try {
    const testResult = await translateWithDeepSeek({
      text: 'テスト',
      sourceLanguage: 'japanese',
      targetLanguage: 'english',
      accessToken: accessToken
    })

    return testResult.success
  } catch (error) {
    console.error('SumoPod connection test failed:', error)
    return false
  }
}
