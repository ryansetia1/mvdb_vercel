/**
 * Utility functions untuk normalize Japanese names dan menghindari redundansi
 * antara jpname dan kanjiName fields
 */

/**
 * Check apakah text mengandung karakter Kanji
 */
export const containsKanji = (text: string): boolean => {
  if (!text) return false
  return /[\u4e00-\u9faf]/.test(text)
}

/**
 * Check apakah text mengandung karakter Kana (Hiragana atau Katakana)
 */
export const containsKana = (text: string): boolean => {
  if (!text) return false
  return /[\u3040-\u309f\u30a0-\u30ff]/.test(text)
}

/**
 * Check apakah text mengandung karakter Jepang (Kanji, Hiragana, atau Katakana)
 */
export const containsJapanese = (text: string): boolean => {
  if (!text) return false
  return containsKanji(text) || containsKana(text)
}

/**
 * Normalize Japanese names untuk menghindari redundansi
 * Logic:
 * 1. Jika kanjiName ada dan jpname kosong, copy kanjiName ke jpname
 * 2. Jika jpname ada dan kanjiName kosong, dan jpname mengandung kanji, copy ke kanjiName
 * 3. Jika keduanya ada dan sama, tidak perlu perubahan
 * 4. Jika keduanya berbeda, prioritaskan kanjiName untuk jpname jika kosong
 */
export const normalizeJapaneseNames = (data: {
  jpname?: string
  kanjiName?: string
  [key: string]: any
}): {
  jpname: string
  kanjiName: string
  [key: string]: any
} => {
  const normalized = { ...data }
  
  const jpname = normalized.jpname?.trim() || ''
  const kanjiName = normalized.kanjiName?.trim() || ''
  
  // Case 1: kanjiName ada, jpname kosong
  if (kanjiName && !jpname) {
    normalized.jpname = kanjiName
  }
  // Case 2: jpname ada, kanjiName kosong, dan jpname mengandung kanji
  else if (jpname && !kanjiName && containsKanji(jpname)) {
    normalized.kanjiName = jpname
  }
  // Case 3: keduanya ada tapi berbeda, dan jpname kosong setelah trim
  else if (jpname && kanjiName && jpname !== kanjiName) {
    // Prioritaskan kanjiName jika jpname kosong
    if (!jpname) {
      normalized.jpname = kanjiName
    }
  }
  
  return normalized
}

/**
 * Smart mapping untuk R18 data
 * R18's "name_kanji" sebenarnya adalah Katakana, bukan Kanji asli
 * Kita akan treat sebagai Japanese name yang bisa digunakan untuk kedua field
 */
export const normalizeR18JapaneseName = (r18Data: {
  name_kanji?: string
  name_kana?: string
  name_romaji?: string
  name_en?: string
}): {
  jpname: string
  kanjiName: string
  kanaName: string
  name: string
} => {
  const name_kanji = r18Data.name_kanji?.trim() || ''
  const name_kana = r18Data.name_kana?.trim() || ''
  const name_romaji = r18Data.name_romaji?.trim() || ''
  const name_en = r18Data.name_en?.trim() || ''
  
  // Priority untuk Japanese name: kanji > kana > romaji
  const jpname = name_kanji || name_kana || name_romaji
  
  // Untuk kanjiName, hanya gunakan jika benar-benar mengandung kanji
  const kanjiName = containsKanji(name_kanji) ? name_kanji : ''
  
  // Untuk kanaName, gunakan kana field
  const kanaName = name_kana
  
  // Untuk English name: en > romaji
  const name = name_en || name_romaji
  
  return {
    jpname,
    kanjiName,
    kanaName,
    name
  }
}

/**
 * Validate Japanese name input
 * Memberikan feedback apakah input valid untuk field tertentu
 */
export const validateJapaneseNameInput = (input: string, field: 'jpname' | 'kanjiName' | 'kanaName'): {
  isValid: boolean
  suggestion?: string
  warning?: string
} => {
  if (!input.trim()) {
    return { isValid: true } // Empty input is valid
  }
  
  const trimmed = input.trim()
  
  switch (field) {
    case 'kanjiName':
      if (!containsKanji(trimmed)) {
        return {
          isValid: false,
          warning: 'Kanji Name harus mengandung karakter Kanji (漢字)',
          suggestion: containsKana(trimmed) ? 'Gunakan field Kana Name untuk Hiragana/Katakana' : undefined
        }
      }
      break
      
    case 'kanaName':
      if (!containsKana(trimmed)) {
        return {
          isValid: false,
          warning: 'Kana Name harus mengandung karakter Hiragana (ひらがな) atau Katakana (カタカナ)',
          suggestion: containsKanji(trimmed) ? 'Gunakan field Kanji Name untuk Kanji' : undefined
        }
      }
      break
      
    case 'jpname':
      if (!containsJapanese(trimmed)) {
        return {
          isValid: true, // jpname bisa menerima semua jenis input Jepang
          suggestion: 'Nama Jepang bisa berupa Kanji, Hiragana, Katakana, atau Romaji'
        }
      }
      break
  }
  
  return { isValid: true }
}
