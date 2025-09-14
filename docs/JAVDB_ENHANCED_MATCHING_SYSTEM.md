# JavDB Enhanced Matching System

## Overview

Sistem matching yang ditingkatkan untuk data JavDB yang mendukung deteksi aktris Jepang dengan lebih baik, termasuk matching dengan alias dan penanganan multiple matches.

## Masalah yang Diperbaiki

### 1. Aktris Jepang Tidak Terdeteksi
```
Data JavDB: "有栖花あか"
Database: Aktris dengan jpname: "有栖花あか"
Result: "Not found in database" ❌
```

### 2. Tidak Ada Support untuk Alias Matching
```
Data JavDB: "有栖花あか"
Database: Aktris dengan alias: "Aka Asuka - 有栖花あか"
Result: "Not found in database" ❌
```

### 3. Tidak Ada Penanganan Multiple Matches
```
Data JavDB: "Tia"
Database: Multiple aktris dengan nama "Tia" dan "Tiara"
Result: Tidak ada pilihan untuk user ❌
```

## Solusi yang Diimplementasikan

### 1. Enhanced Japanese Character Detection

**File**: `src/utils/movieDataParser.ts`

```typescript
// Helper function to check if name contains Japanese characters
const hasJapaneseChars = (name: string): boolean => {
  return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(name)
}
```

**Unicode Ranges:**
- `\u3040-\u309F`: Hiragana
- `\u30A0-\u30FF`: Katakana  
- `\u4E00-\u9FAF`: Kanji

### 2. Comprehensive Alias Matching

```typescript
// Helper function to extract aliases from alias string
const extractAliases = (aliasString: string): string[] => {
  if (!aliasString) return []
  return aliasString.split(',').map(alias => alias.trim()).filter(alias => alias.length > 0)
}

// Alias matching logic
if (item.alias) {
  const aliases = extractAliases(item.alias)
  for (const alias of aliases) {
    if (alias === trimmedName) return true
    
    // For Japanese names, also check if alias contains the name
    if (isJapaneseName && hasJapaneseChars(alias) && alias.includes(trimmedName)) return true
    
    // Case-insensitive alias matching for English names
    if (/^[a-zA-Z\s]+$/.test(alias) && /^[a-zA-Z\s]+$/.test(trimmedName)) {
      if (alias.toLowerCase() === trimmedName.toLowerCase()) return true
    }
  }
}
```

### 3. Multiple Matches Handling

```typescript
// Find all potential matches
const potentialMatches = masterData.filter(item => {
  // ... matching logic ...
})

// Determine the best match
let bestMatch = null
let multipleMatches: MasterDataItem[] = []

if (potentialMatches.length === 1) {
  bestMatch = potentialMatches[0]
} else if (potentialMatches.length > 1) {
  // Multiple matches found - let user choose
  multipleMatches = potentialMatches
  // Set the first match as default, but mark as needing confirmation
  bestMatch = potentialMatches[0]
}

matched.actresses.push({
  name: actressName,
  matched: bestMatch,
  multipleMatches: multipleMatches,
  needsConfirmation: multipleMatches.length > 1, // Need confirmation for multiple matches
  isIgnored: false // Don't auto-ignore, let user choose
})
```

## Cara Kerja Sistem Baru

### Step 1: Character Type Detection
- Deteksi apakah nama mengandung karakter Jepang
- Tentukan strategi matching yang sesuai

### Step 2: Comprehensive Matching
1. **Direct Name Matching**:
   - `jpname` (Japanese Name)
   - `kanjiName` (Kanji Name)
   - `kanaName` (Kana Name)
   - `name` (English Name)

2. **Case-Insensitive English Matching**:
   - Hanya untuk nama yang mengandung karakter Latin
   - Menggunakan `toLowerCase()` untuk perbandingan

3. **Alias Matching**:
   - Extract aliases dari field alias
   - Exact match untuk alias
   - Partial match untuk nama Jepang (menggunakan `includes()`)
   - Case-insensitive match untuk nama English

### Step 3: Multiple Matches Resolution
- Jika ditemukan 1 match: Auto-confirm
- Jika ditemukan multiple matches: Tampilkan pilihan untuk user
- UI akan menampilkan tombol "Japanese Name Match (N)" untuk multiple matches

## Contoh Skenario

### Skenario 1: Exact Japanese Name Match
```
Data JavDB: "有栖花あか"
Database: 
  - jpname: "有栖花あか"
  - kanjiName: "有栖花あか"
  - name: "Aka Asuka"
Result: ✅ Match found (jpname)
```

### Skenario 2: Alias Match
```
Data JavDB: "有栖花あか"
Database:
  - jpname: "Aka Asuka"
  - alias: "Aka Asuka - 有栖花あか, Shiose - 汐世"
Result: ✅ Match found (alias contains "有栖花あか")
```

### Skenario 3: Multiple Matches
```
Data JavDB: "Tia"
Database:
  - Aktris 1: name: "Tia"
  - Aktris 2: name: "Tiara", alias: "Tia"
Result: ✅ Multiple matches found
UI: Shows "Japanese Name Match (2)" button
User: Can choose between Tia and Tiara
```

### Skenario 4: English Name Case-Insensitive
```
Data JavDB: "julia"
Database: name: "JULIA"
Result: ✅ Match found (case-insensitive)
```

## Keuntungan

1. **✅ Accurate Japanese Detection**: Nama Jepang dapat ditemukan dengan tepat
2. **✅ Alias Support**: Mendukung matching dengan alias yang kompleks
3. **✅ Multiple Matches**: User dapat memilih dari multiple matches
4. **✅ Case-Insensitive English**: Nama English tetap case-insensitive
5. **✅ Robust Matching**: Menggunakan multiple strategi matching
6. **✅ User Choice**: User memiliki kontrol penuh atas pilihan matching

## Test Cases

### Test Case 1: Japanese Name Exact Match
**Input**: `"有栖花あか"`
**Database**: `jpname: "有栖花あか"`
**Expected**: ✅ Single match found

### Test Case 2: Japanese Name Alias Match
**Input**: `"有栖花あか"`
**Database**: `alias: "Aka Asuka - 有栖花あか"`
**Expected**: ✅ Match found via alias

### Test Case 3: Multiple Matches
**Input**: `"Tia"`
**Database**: 
- `name: "Tia"`
- `name: "Tiara", alias: "Tia"`
**Expected**: ✅ Multiple matches, user can choose

### Test Case 4: English Case-Insensitive
**Input**: `"julia"`
**Database**: `name: "JULIA"`
**Expected**: ✅ Match found (case-insensitive)

### Test Case 5: Mixed Characters
**Input**: `"有栖花あか"`
**Database**: `name: "Aka Asuka"`
**Expected**: ❌ No match (different character types)

## Files Modified

- `src/utils/movieDataParser.ts` - Enhanced `matchJavdbSimple` function
- `docs/JAVDB_ENHANCED_MATCHING_SYSTEM.md` - Dokumentasi sistem ini

## UI Integration

UI sudah mendukung multiple matches melalui:
- `multipleMatches` array untuk menyimpan semua potential matches
- `needsConfirmation` flag untuk menandai perlu konfirmasi user
- Tombol "Japanese Name Match (N)" untuk multiple matches
- Dialog selector untuk user memilih match yang tepat

## Performance Considerations

1. **Efficient Filtering**: Menggunakan `filter()` untuk mencari semua potential matches
2. **Early Return**: Menghentikan pencarian setelah menemukan match yang tepat
3. **Character Detection**: Regex yang efisien untuk deteksi karakter Jepang
4. **Alias Parsing**: Parsing alias yang optimal dengan `split()` dan `trim()`

## Future Enhancements

1. **Fuzzy Matching**: Implementasi fuzzy matching untuk nama yang hampir sama
2. **Weighted Scoring**: Sistem scoring untuk menentukan match terbaik
3. **Caching**: Cache hasil matching untuk performa yang lebih baik
4. **Unicode Normalization**: Normalisasi Unicode untuk handling karakter Jepang yang kompleks
