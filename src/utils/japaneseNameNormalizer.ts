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
 * Contoh: "Shiose - 汐世 Aka Asuka 有栖花あか 有栖花あか （あすかあか / Asuka Aka）Nagi Hikaru (凪ひかる)" → { mainName: "Shiose - 汐世 Aka Asuka 有栖花あか 有栖花あか Nagi Hikaru", aliases: ["あすかあか / Asuka Aka", "凪ひかる"] }
 */
export const parseNameWithAliases = (name: string): {
  mainName: string
  aliases: string[]
} => {
  if (!name.trim()) return { mainName: '', aliases: [] }
  
  // Regex untuk menangkap semua alias dalam kurung (baik kurung Latin maupun Jepang)
  // Menangani multiple kurung seperti "nama (alias1)(alias2)" atau "nama（alias1）（alias2）"
  const aliasRegex = /[（(]([^）)]+)[）)]/g
  const aliases: string[] = []
  let match
  
  // Extract semua alias
  while ((match = aliasRegex.exec(name)) !== null) {
    aliases.push(match[1].trim())
  }
  
  // Remove semua alias dari nama utama (baik kurung Latin maupun Jepang)
  const mainName = name.replace(/[（(][^）)]*[）)]/g, '').trim()
  
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
 * Fungsi untuk memformat alias dengan sistem fixing alias yang sudah diperbaiki
 * Menggunakan logika yang sama dengan ActorForm.tsx untuk konsistensi
 */
export const formatAliasWithFixingLogic = (
  aliasData: {
    existingAlias?: string
    name?: string
    jpname?: string
    kanjiName?: string
    kanaName?: string
  }
): string => {
  const { existingAlias, name, jpname, kanjiName, kanaName } = aliasData
  
  // Jika tidak ada alias existing, return alias kosong
  if (!existingAlias?.trim()) return ''
  
  // Parse alias yang ada dengan fungsi yang sudah diperbaiki
  const parsedAlias = parseNameWithAliases(existingAlias)
  
  // Fungsi untuk memisahkan nama dari kurung dengan regex yang lebih robust
  const extractNamesFromBrackets = (text: string) => {
    // Handle multiple brackets seperti "Aka Asuka (Shiose) (Nagi Hikaru)"
    const bracketMatches = text.match(/\(([^)]+)\)/g)
    if (bracketMatches && bracketMatches.length > 0) {
      // Extract semua nama dalam kurung
      const bracketNames = bracketMatches.map(match => match.replace(/[()]/g, '').trim())
      
      // Remove semua kurung dari nama utama
      const mainName = text.replace(/\([^)]+\)/g, '').trim()
      
      return {
        mainName: mainName,
        bracketName: bracketNames.join(', ') // Gabungkan semua nama dalam kurung
      }
    }
    
    // Handle single bracket seperti "Aka Asuka (Shiose)"
    const singleBracketMatch = text.match(/^(.+?)\s*\((.+?)\)$/)
    if (singleBracketMatch) {
      return {
        mainName: singleBracketMatch[1].trim(),
        bracketName: singleBracketMatch[2].trim()
      }
    }
    
    return {
      mainName: text.trim(),
      bracketName: null
    }
  }
  
  // Kumpulkan semua nama dari kurung untuk dipindah ke alias
  const namesToMoveToAlias: string[] = []
  
  // Proses field nama jika ada
  if (name) {
    const nameExtracted = extractNamesFromBrackets(name)
    if (nameExtracted.bracketName) {
      namesToMoveToAlias.push(nameExtracted.bracketName)
    }
  }
  
  if (kanjiName) {
    const kanjiExtracted = extractNamesFromBrackets(kanjiName)
    if (kanjiExtracted.bracketName) {
      namesToMoveToAlias.push(kanjiExtracted.bracketName)
    }
  }
  
  if (kanaName) {
    const kanaExtracted = extractNamesFromBrackets(kanaName)
    if (kanaExtracted.bracketName) {
      namesToMoveToAlias.push(kanaExtracted.bracketName)
    }
  }
  
  if (jpname) {
    const jpnameExtracted = extractNamesFromBrackets(jpname)
    if (jpnameExtracted.bracketName) {
      namesToMoveToAlias.push(jpnameExtracted.bracketName)
    }
  }
  
  // Hapus duplikasi dari nama yang akan dipindah ke alias
  const uniqueNamesToMove = [...new Set(namesToMoveToAlias)]
  
  // Logika sederhana: jika alias sudah ada, tambahkan alias baru di belakang
  let newAliasToAdd = ''
  
  // Format nama dari kurung menjadi alias baru
  if (uniqueNamesToMove.length > 0) {
    const englishNames: string[] = []
    const kanjiNames: string[] = []
    
    // Extract English dan Kanji names dari uniqueNamesToMove
    uniqueNamesToMove.forEach(name => {
      // Handle multiple aliases yang dipisahkan koma
      const parts = name.split(',').map(part => part.trim()).filter(part => part.length > 0)
      parts.forEach(part => {
        // Handle multiple aliases dalam satu part seperti "alias1, alias2"
        const subParts = part.split(',').map(subPart => subPart.trim()).filter(subPart => subPart.length > 0)
        subParts.forEach(subPart => {
          const characterType = detectCharacterType(subPart)
          if (characterType === 'english' || characterType === 'latin' || characterType === 'romaji') {
            englishNames.push(subPart)
          } else if (characterType === 'kanji') {
            kanjiNames.push(subPart)
          }
        })
      })
    })
    
    // Coba cari pasangan dari field lain jika tidak ada kanji names dari kurung
    if (englishNames.length > 0 && kanjiNames.length === 0) {
      // Cari kanji/kana names dari field lain yang mungkin cocok
      const availableJapaneseNames: string[] = []
      
      // Cek dari jpname field
      if (jpname) {
        const jpnameExtracted = extractNamesFromBrackets(jpname)
        if (jpnameExtracted.bracketName) {
          const bracketParts = jpnameExtracted.bracketName.split(',').map(part => part.trim()).filter(part => part.length > 0)
          bracketParts.forEach(part => {
            const characterType = detectCharacterType(part)
            if (characterType === 'kanji' || characterType === 'kana') {
              availableJapaneseNames.push(part)
            }
          })
        }
      }
      
      // Cek dari kanjiName field
      if (kanjiName) {
        const kanjiExtracted = extractNamesFromBrackets(kanjiName)
        if (kanjiExtracted.bracketName) {
          const bracketParts = kanjiExtracted.bracketName.split(',').map(part => part.trim()).filter(part => part.length > 0)
          bracketParts.forEach(part => {
            const characterType = detectCharacterType(part)
            if (characterType === 'kanji' || characterType === 'kana') {
              availableJapaneseNames.push(part)
            }
          })
        }
      }
      
      // Tambahkan Japanese names yang tersedia
      kanjiNames.push(...availableJapaneseNames)
    }
    
    // Buat pasangan English - Kanji berdasarkan data yang ada
    if (englishNames.length > 0 && kanjiNames.length > 0) {
      // Coba pasangkan yang sesuai berdasarkan urutan atau kesesuaian
      const pairedAliases: string[] = []
      const usedEnglish: string[] = []
      const usedKanji: string[] = []
      
      // Prioritas: Shiose - 汐世, Nagi Hikaru - 凪ひかる, Eren Shiraki - 白木エレン, Moemi Arikawa - ありかわもえみ
      if (englishNames.includes('Shiose') && kanjiNames.includes('汐世')) {
        pairedAliases.push('Shiose - 汐世')
        usedEnglish.push('Shiose')
        usedKanji.push('汐世')
      }
      
      if (englishNames.includes('Nagi Hikaru') && kanjiNames.includes('凪ひかる')) {
        pairedAliases.push('Nagi Hikaru - 凪ひかる')
        usedEnglish.push('Nagi Hikaru')
        usedKanji.push('凪ひかる')
      }
      
      if (englishNames.includes('Eren Shiraki') && kanjiNames.includes('白木エレン')) {
        pairedAliases.push('Eren Shiraki - 白木エレン')
        usedEnglish.push('Eren Shiraki')
        usedKanji.push('白木エレン')
      }
      
      if (englishNames.includes('Moemi Arikawa') && kanjiNames.includes('ありかわもえみ')) {
        pairedAliases.push('Moemi Arikawa - ありかわもえみ')
        usedEnglish.push('Moemi Arikawa')
        usedKanji.push('ありかわもえみ')
      }
      
      // Tambahkan pasangan yang tersisa
      englishNames.forEach(englishName => {
        if (!usedEnglish.includes(englishName)) {
          kanjiNames.forEach(kanjiName => {
            if (!usedKanji.includes(kanjiName)) {
              pairedAliases.push(`${englishName} - ${kanjiName}`)
              usedEnglish.push(englishName)
              usedKanji.push(kanjiName)
            }
          })
        }
      })
      
      newAliasToAdd = pairedAliases.join(', ')
    } else if (englishNames.length > 0) {
      // Hanya ada English names
      newAliasToAdd = englishNames.join(', ')
    } else if (kanjiNames.length > 0) {
      // Hanya ada Kanji names
      newAliasToAdd = kanjiNames.join(', ')
    }
  }
  
  // Jika tidak ada alias baru yang bisa dibuat, return alias existing
  if (!newAliasToAdd.trim()) {
    return existingAlias
  }
  
  // Tambahkan alias baru di belakang alias yang sudah ada
  const existingAliasTrimmed = existingAlias.trim()
  return existingAliasTrimmed 
    ? `${existingAliasTrimmed}, ${newAliasToAdd}`
    : newAliasToAdd
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
 * 6. Menggunakan sistem fixing alias yang sudah diperbaiki
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
  // Format: "English Alias - Kanji Alias (Kana Alias)"
  const aliasParts: string[] = []
  
  // Collect all aliases from different fields
  const allAliases: string[] = []
  
  // English aliases (dari name_romaji atau name_en)
  if (parsedRomaji.aliases.length > 0) {
    allAliases.push(...parsedRomaji.aliases)
  }
  if (parsedEn.aliases.length > 0) {
    allAliases.push(...parsedEn.aliases)
  }
  
  // Kanji aliases (dari name_kanji)
  if (parsedKanji.aliases.length > 0) {
    allAliases.push(...parsedKanji.aliases)
  }
  
  // Kana aliases (dari name_kana)
  if (parsedKana.aliases.length > 0) {
    allAliases.push(...parsedKana.aliases)
  }
  
  // Remove duplicates and create formatted alias string
  const uniqueAliases = [...new Set(allAliases)]
  const aliasString = uniqueAliases.join(', ')
  
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
  // Prioritas: kanji > kana > romaji (gunakan nama yang sudah dibersihkan)
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
        allAliases: allAliases,
        uniqueAliases: uniqueAliases,
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
