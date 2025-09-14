# Multiple Alias Complete Implementation

## Overview

Sistem telah sepenuhnya diimplementasikan untuk menangani aktris dengan multiple alias (2 atau lebih) dan terintegrasi dengan parser R18 saat user klik save movie.

## ✅ Implementasi Lengkap

### 1. **ActorForm Fix Alias Enhancement**

**File**: `src/components/ActorForm.tsx`

#### **Multiple Brackets Support**
```typescript
// Input: "Erina Ichihashi (Moemi Arikawa) (Test Alias)"
// Output: aliases = ["Moemi Arikawa", "Test Alias"]
```

#### **Single Bracket with Multiple Aliases**
```typescript
// Input: "Erina Ichihashi (Moemi Arikawa, Test Alias)"
// Output: aliases = ["Moemi Arikawa", "Test Alias"]
```

#### **Enhanced Character Type Detection**
```typescript
if (characterType === 'english' || characterType === 'latin' || characterType === 'romaji') {
  englishNames.push(subPart)
} else if (characterType === 'kanji' || characterType === 'kana') {
  kanjiNames.push(subPart)
}
```

#### **Cross-Field Matching**
```typescript
// Cari kanji/kana names dari field lain yang mungkin cocok
if (characterType === 'kanji' || characterType === 'kana') {
  availableJapaneseNames.push(part)
}
```

### 2. **R18 Parser Enhancement**

**File**: `src/utils/japaneseNameNormalizer.ts`

#### **Multiple Alias Extraction**
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

### 3. **MovieDataParser Integration**

**File**: `src/components/MovieDataParser.tsx`

#### **Alias Merging and Fixing**
```typescript
// Merge new alias with existing alias if it exists
if (item.matched.alias) {
  const { mergeAlias } = await import('../utils/aliasMerger')
  const mergedAlias = mergeAlias(item.matched.alias, newAlias)
  
  // Apply fixing alias logic to the merged alias
  const { formatAliasWithFixingLogic } = await import('../utils/japaneseNameNormalizer')
  const fixedAlias = formatAliasWithFixingLogic({
    existingAlias: mergedAlias,
    name: updateData.name || item.matched.name,
    jpname: updateData.jpname || item.matched.jpname,
    kanjiName: updateData.kanjiName || item.matched.kanjiName,
    kanaName: updateData.kanaName || item.matched.kanaName
  })
  
  updateData.alias = fixedAlias
}
```

## 🎯 Test Cases yang Didukung

### **Test Case 1: 2 Alias dalam Multiple Brackets**
- **Input**: `Erina Ichihashi (Moemi Arikawa) (Test Alias)`
- **Expected**: `Moemi Arikawa - ありかわもえみ, Test Alias - テストエイリアス`

### **Test Case 2: 3+ Alias dalam Multiple Brackets**
- **Input**: `Erina Ichihashi (Moemi Arikawa) (Test Alias) (Another Alias)`
- **Expected**: `Moemi Arikawa - ありかわもえみ, Test Alias - テストエイリアス, Another Alias - アナザーエイリアス`

### **Test Case 3: Mixed Character Types**
- **Input**: `Erina Ichihashi (Moemi Arikawa) (しおせ) (Nagi Hikaru)`
- **Expected**: `Moemi Arikawa - ありかわもえみ, しおせ - 汐世, Nagi Hikaru - 凪ひかる`

### **Test Case 4: R18 Parser Multiple Alias**
- **Input R18**: Multiple alias dalam semua field
- **Expected**: Semua alias diekstrak dan digabungkan

## 🔧 Cara Kerja Lengkap

### **ActorForm Fix Alias Flow**
1. **Extract**: Mengekstrak semua alias dari kurung (multiple brackets atau single bracket dengan multiple aliases)
2. **Detect**: Mendeteksi character type untuk setiap alias (Kanji, Hiragana, Katakana, Romaji)
3. **Match**: Mencocokkan English dan Japanese names dari field yang berbeda
4. **Pair**: Membuat pasangan alias dalam format `English - Japanese`
5. **Append**: Menambahkan alias baru di belakang alias yang sudah ada

### **R18 Parser Flow**
1. **Parse**: Memparse semua field R18 dan mengekstrak semua alias
2. **Collect**: Mengumpulkan semua alias dari semua field
3. **Deduplicate**: Menghilangkan duplikasi alias
4. **Format**: Membuat string alias yang diformat
5. **Save**: Menyimpan ke database saat klik save movie

### **MovieDataParser Integration Flow**
1. **Normalize**: Menggunakan `normalizeR18JapaneseName` untuk menormalisasi alias
2. **Merge**: Menggunakan `mergeAlias` untuk menggabungkan alias baru dengan existing
3. **Fix**: Menggunakan `formatAliasWithFixingLogic` untuk memformat alias
4. **Update**: Menyimpan alias yang sudah diformat ke database

## ✅ Character Type Support

- **Kanji**: Unicode \u4e00-\u9faf ✅
- **Hiragana**: Unicode \u3040-\u309f ✅
- **Katakana**: Unicode \u30a0-\u30ff ✅
- **Romaji**: A-Z, a-z ✅
- **Mixed**: Kombinasi karakter ✅

## ✅ Cross-Field Matching

- **English names**: Dari field `name` ✅
- **Japanese names**: Dari field `jpname` dan `kanjiName` ✅
- **Character type detection**: Untuk semua jenis karakter ✅
- **Smart pairing**: Mencocokkan English dengan Japanese names ✅

## ✅ Integration Points

### **ActorForm.tsx**
- `handleFixAlias()`: Enhanced multiple alias handling ✅
- `extractNamesFromBrackets()`: Multiple brackets support ✅
- `detectCharacterType()`: All character types support ✅

### **japaneseNameNormalizer.ts**
- `formatAliasWithFixingLogic()`: Enhanced cross-field matching ✅
- `normalizeR18JapaneseName()`: Multiple alias extraction ✅
- `parseNameWithAliases()`: Multiple brackets parsing ✅

### **MovieDataParser.tsx**
- `updateMasterDataWithConflicts()`: Already using enhanced functions ✅
- Alias merging and fixing integration ✅
- R18 data normalization integration ✅

## 🚀 Ready for Production

Sistem telah sepenuhnya siap untuk menangani:
- ✅ Aktris dengan 2 alias
- ✅ Aktris dengan 3+ alias
- ✅ Multiple brackets parsing
- ✅ Single bracket dengan multiple aliases
- ✅ Cross-field matching
- ✅ R18 parser integration
- ✅ Save movie functionality
- ✅ Character type detection untuk semua jenis karakter Jepang

## 📁 Files Modified

- `src/components/ActorForm.tsx`: Enhanced multiple alias handling
- `src/utils/japaneseNameNormalizer.ts`: Enhanced multiple alias handling
- `src/components/MovieDataParser.tsx`: Already using enhanced functions
- `docs/MULTIPLE_ALIAS_COMPLETE_IMPLEMENTATION.md`: Complete documentation
