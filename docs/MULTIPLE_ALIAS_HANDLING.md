# Multiple Alias Handling Enhancement

## Overview

Sistem telah diperbaiki untuk menangani multiple alias dalam satu aktris dengan format seperti `nama(alias1)(alias2)` atau `nama(alias1, alias2)`. Perbaikan ini diterapkan di kedua sistem: ActorForm Fix Alias dan R18 Parser.

## Masalah yang Diperbaiki

### 1. **Multiple Brackets Handling**
**Input**: `Aka Asuka (Shiose) (Nagi Hikaru)`
**Sebelum**: Hanya mengambil alias pertama
**Sesudah**: Mengambil semua alias: `Shiose, Nagi Hikaru`

### 2. **Multiple Aliases in Single Bracket**
**Input**: `Aka Asuka (Shiose, Nagi Hikaru)`
**Sebelum**: Tidak memproses dengan benar
**Sesudah**: Memproses semua alias: `Shiose, Nagi Hikaru`

### 3. **R18 Parser Multiple Alias**
**Sebelum**: Hanya mengambil alias pertama dari setiap field
**Sesudah**: Mengambil semua alias dari semua field dan menggabungkannya

## Implementasi Detail

### 1. **ActorForm.tsx Enhancement**

**File**: `src/components/ActorForm.tsx`

**Perubahan pada Extract Logic**:
```typescript
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
```

**Fungsi `extractNamesFromBrackets` sudah mendukung multiple brackets**:
```typescript
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
  // ... rest of the function
}
```

### 2. **R18 Parser Enhancement**

**File**: `src/utils/japaneseNameNormalizer.ts`

**Perubahan pada `normalizeR18JapaneseName`**:
```typescript
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
```

**Sebelum**: Hanya mengambil `[0]` dari setiap field
**Sesudah**: Mengambil semua alias dari semua field

### 3. **Cross-Field Matching Enhancement**

**File**: `src/utils/japaneseNameNormalizer.ts`

**Perubahan pada `formatAliasWithFixingLogic`**:
```typescript
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
```

## Contoh Skenario

### **Skenario 1: Multiple Brackets**
**Input**:
- nama = `Aka Asuka (Shiose) (Nagi Hikaru)`
- nama jepang = `有栖花あか (汐世) (凪ひかる)`

**Output**:
- nama = `Aka Asuka`
- nama jepang = `有栖花あか`
- alias = `Shiose - 汐世, Nagi Hikaru - 凪ひかる`

### **Skenario 2: Multiple Aliases in Single Bracket**
**Input**:
- nama = `Aka Asuka (Shiose, Nagi Hikaru)`
- nama jepang = `有栖花あか (汐世, 凪ひかる)`

**Output**:
- nama = `Aka Asuka`
- nama jepang = `有栖花あか`
- alias = `Shiose - 汐世, Nagi Hikaru - 凪ひかる`

### **Skenario 3: R18 Parser Multiple Alias**
**Input R18 Data**:
```json
{
  "name_kanji": "有栖花あか (汐世) (凪ひかる)",
  "name_kana": "あすかあか (しおせ) (なぎひかる)",
  "name_romaji": "Asuka Aka (Shiose) (Nagi Hikaru)"
}
```

**Output**:
- kanjiName = `有栖花あか`
- kanaName = `あすかあか`
- name = `Asuka Aka`
- alias = `汐世, しおせ, Shiose, 凪ひかる, なぎひかる, Nagi Hikaru`

## Keuntungan

1. **Complete Alias Extraction**: Semua alias diekstrak, tidak hanya yang pertama
2. **Flexible Format Support**: Mendukung berbagai format multiple alias
3. **Consistent Behavior**: Perilaku yang sama di ActorForm dan R18 Parser
4. **Duplicate Removal**: Otomatis menghilangkan duplikasi alias
5. **Cross-Field Matching**: Dapat mencocokkan alias dari field yang berbeda

## Testing

### **Test Case 1: Multiple Brackets**
1. Input: `Aka Asuka (Shiose) (Nagi Hikaru)`
2. Expected: Alias `Shiose, Nagi Hikaru` diekstrak

### **Test Case 2: Multiple Aliases in Single Bracket**
1. Input: `Aka Asuka (Shiose, Nagi Hikaru)`
2. Expected: Alias `Shiose, Nagi Hikaru` diekstrak

### **Test Case 3: R18 Parser**
1. Parse R18 data dengan multiple alias
2. Expected: Semua alias dari semua field digabungkan

## Files Modified

- `src/components/ActorForm.tsx`: Enhanced multiple alias extraction
- `src/utils/japaneseNameNormalizer.ts`: Enhanced multiple alias handling in both `formatAliasWithFixingLogic` and `normalizeR18JapaneseName`
- `docs/MULTIPLE_ALIAS_HANDLING.md`: Dokumentasi perubahan ini
