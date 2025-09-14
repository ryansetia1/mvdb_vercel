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
 * Check apakah text mengandung karakter Hiragana (Unicode range: \u3040-\u309F)
 */
export const containsHiragana = (text: string): boolean => {
  if (!text) return false
  return /[\u3040-\u309F]/.test(text)
}

/**
 * Check apakah text mengandung karakter Katakana (Unicode range: \u30A0-\u30FF)
 */
export const containsKatakana = (text: string): boolean => {
  if (!text) return false
  return /[\u30A0-\u30FF]/.test(text)
}

/**
 * Check apakah text mengandung alfabet latin (A-Z, a-z)
 */
export const containsLatinAlphabet = (text: string): boolean => {
  if (!text) return false
  return /^[A-Za-z\s]+$/.test(text)
}

/**
 * Deteksi jenis karakter dalam text dan return field yang sesuai
 * Sesuai dengan aturan parsing yang robust
 */
export const detectCharacterType = (text: string): 'kanji' | 'kana' | 'romaji' | 'mixed' | 'unknown' => {
  if (!text.trim()) return 'unknown'
  
  const hasKanji = containsKanji(text)
  const hasHiragana = containsHiragana(text)
  const hasKatakana = containsKatakana(text)
  const hasLatin = containsLatinAlphabet(text)
  
  // Hitung jumlah jenis karakter
  const typeCount = [hasKanji, hasHiragana, hasKatakana, hasLatin].filter(Boolean).length
  
  if (typeCount === 0) return 'unknown'
  if (typeCount === 1) {
    if (hasKanji) return 'kanji'
    if (hasHiragana || hasKatakana) return 'kana'
    if (hasLatin) return 'romaji'
  }
  
  // Multiple types - determine primary type
  if (hasKanji) return 'kanji' // Kanji has highest priority
  if (hasHiragana || hasKatakana) return 'kana'
  if (hasLatin) return 'romaji'
  
  return 'mixed'
}

/**
 * Parse nama dengan alias dalam kurung
 * Contoh: "めぐり（ふじうらめぐ）" → { mainName: "めぐり", aliases: ["ふじうらめぐ"] }
 * Contoh: "nama (alias1)(alias2)" → { mainName: "nama", aliases: ["alias1", "alias2"] }
 */
export const parseNameWithAliases = (name: string): {
  mainName: string
  aliases: string[]
} => {
  if (!name.trim()) return { mainName: '', aliases: [] }
  
  // Regex untuk menangkap semua alias dalam kurung
  // Menangani multiple kurung seperti "nama (alias1)(alias2)"
  const aliasRegex = /\(([^)]+)\)/g
  const aliases: string[] = []
  let match
  
  // Extract semua alias
  while ((match = aliasRegex.exec(name)) !== null) {
    aliases.push(match[1].trim())
  }
  
  // Remove semua alias dari nama utama
  const mainName = name.replace(/\([^)]+\)/g, '').trim()
  
  return {
    mainName,
    aliases
  }
}

/**
 * Combine multiple aliases menjadi string yang dipisahkan koma
 */
export const combineAliases = (aliases: string[]): string => {
  return aliases.filter(alias => alias.trim()).join(', ')
}

/**
 * Format aliases dengan struktur yang benar berdasarkan urutan
 * Contoh input:
 * - kana: ["kana alias 1", "kana alias 2"]
 * - kanji: ["kanji alias 1", "kanji alias 2"] 
 * - romaji: ["nama alias 1", "nama alias 2"]
 * 
 * Output: "nama alias 1 - kanji alias 1 (kana alias 1), nama alias 2 - kanji alias 2 (kana alias 2)"
 */
export const formatAliasesWithStructure = (parsedData: {
  kanji: { mainName: string, aliases: string[] }
  kana: { mainName: string, aliases: string[] }
  romaji: { mainName: string, aliases: string[] }
  en: { mainName: string, aliases: string[] }
}): string => {
  const { kanji, kana, romaji, en } = parsedData
  
  // Collect semua alias dengan urutan yang benar
  const allAliases: Array<{
    index: number
    romaji: string
    kanji: string
    kana: string
  }> = []
  
  // Tentukan jumlah maksimal alias dari semua field
  const maxAliases = Math.max(
    romaji.aliases.length,
    kanji.aliases.length,
    kana.aliases.length,
    en.aliases.length
  )
  
  // Group aliases berdasarkan index
  for (let i = 0; i < maxAliases; i++) {
    const aliasGroup = {
      index: i,
      romaji: romaji.aliases[i] || '',
      kanji: kanji.aliases[i] || '',
      kana: kana.aliases[i] || ''
    }
    
    // Hanya tambahkan jika ada minimal satu alias
    if (aliasGroup.romaji || aliasGroup.kanji || aliasGroup.kana) {
      allAliases.push(aliasGroup)
    }
  }
  
  // Format setiap group alias
  const formattedAliases = allAliases.map(group => {
    const parts: string[] = []
    
    // Prioritas: romaji > kanji > kana
    if (group.romaji) {
      parts.push(group.romaji)
    } else if (group.kanji) {
      parts.push(group.kanji)
    } else if (group.kana) {
      parts.push(group.kana)
    }
    
    // Tambahkan kanji jika ada dan berbeda dari yang sudah ada
    if (group.kanji && group.kanji !== parts[0]) {
      parts.push(`- ${group.kanji}`)
    }
    
    // Tambahkan kana jika ada dan berbeda dari yang sudah ada
    if (group.kana && group.kana !== parts[0] && group.kana !== group.kanji) {
      parts.push(`(${group.kana})`)
    }
    
    return parts.join(' ')
  })
  
  return formattedAliases.join(', ')
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
 * Robust mapping untuk R18 data dengan aturan parsing yang lebih akurat
 * 
 * Aturan parsing:
 * 1. Gunakan data JSON langsung jika tersedia
 * 2. Jika ada key name_kanji → masukkan ke field kanji
 * 3. Jika ada key name_kana → masukkan ke field kana  
 * 4. Jika ada key name_romaji → masukkan ke field english name
 * 5. Fallback dengan deteksi karakter jika field kosong
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
  alias: string
} => {
  const name_kanji = r18Data.name_kanji?.trim() || ''
  const name_kana = r18Data.name_kana?.trim() || ''
  const name_romaji = r18Data.name_romaji?.trim() || ''
  const name_en = r18Data.name_en?.trim() || ''
  
  // Step 1: Parse nama dengan alias dalam kurung
  const parsedKanji = parseNameWithAliases(name_kanji)
  const parsedKana = parseNameWithAliases(name_kana)
  const parsedRomaji = parseNameWithAliases(name_romaji)
  const parsedEn = parseNameWithAliases(name_en)
  
  // Format aliases dengan struktur yang benar berdasarkan urutan
  const aliasString = formatAliasesWithStructure({
    kanji: parsedKanji,
    kana: parsedKana,
    romaji: parsedRomaji,
    en: parsedEn
  })
  
  // Step 2: Gunakan data JSON langsung jika tersedia (tanpa alias)
  let kanjiName = ''
  let kanaName = ''
  let name = ''
  
  // Mapping dari JSON keys (gunakan nama utama tanpa alias)
  if (parsedKanji.mainName) {
    kanjiName = parsedKanji.mainName
  }
  if (parsedKana.mainName) {
    kanaName = parsedKana.mainName
  }
  if (parsedRomaji.mainName) {
    name = parsedRomaji.mainName
  }
  if (parsedEn.mainName) {
    name = parsedEn.mainName // Prioritaskan name_en jika ada
  }
  
  // Step 3: Fallback dengan deteksi karakter jika field kosong
  const allMainNames = [parsedKanji.mainName, parsedKana.mainName, parsedRomaji.mainName, parsedEn.mainName].filter(n => n.trim())
  
  for (const nameValue of allMainNames) {
    if (!nameValue.trim()) continue
    
    const characterType = detectCharacterType(nameValue)
    
    // Mapping berdasarkan deteksi karakter
    switch (characterType) {
      case 'kanji':
        if (!kanjiName) kanjiName = nameValue
        break
      case 'kana':
        if (!kanaName) kanaName = nameValue
        break
      case 'romaji':
        if (!name) name = nameValue
        break
      case 'mixed':
        // Untuk kombinasi karakter, prioritaskan berdasarkan kandungan utama
        if (containsKanji(nameValue) && !kanjiName) {
          kanjiName = nameValue // Contoh: "八掛うみ" → kanji + hiragana → tetap ke kanji
        } else if (containsKana(nameValue) && !kanaName) {
          kanaName = nameValue
        } else if (containsLatinAlphabet(nameValue) && !name) {
          name = nameValue
        }
        break
    }
  }
  
  // Step 4: Tentukan jpname (Japanese name) dengan prioritas
  // Prioritas: kanji > kana > romaji
  const jpname = kanjiName || kanaName || parsedRomaji.mainName || parsedEn.mainName || ''
  
  // Debug logging untuk development
  if (process.env.NODE_ENV === 'development') {
    console.log('R18 Name Parsing Debug:', {
      input: r18Data,
      parsed: {
        kanji: parsedKanji,
        kana: parsedKana,
        romaji: parsedRomaji,
        en: parsedEn
      },
      aliasFormatting: {
        rawAliases: {
          kanji: parsedKanji.aliases,
          kana: parsedKana.aliases,
          romaji: parsedRomaji.aliases,
          en: parsedEn.aliases
        },
        formattedAlias: aliasString
      },
      detected: {
        kanjiName,
        kanaName,
        name,
        jpname,
        alias: aliasString
      },
      characterTypes: allMainNames.map(n => ({ name: n, type: detectCharacterType(n) }))
    })
  }

  return {
    jpname,
    kanjiName,
    kanaName,
    name,
    alias: aliasString
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
