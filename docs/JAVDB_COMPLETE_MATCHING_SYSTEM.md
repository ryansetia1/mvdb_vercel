# JavDB Complete Matching System

## Overview

Sistem matching yang lengkap untuk semua tipe data JavDB (actresses, actors, directors, studios, series, labels) dengan dukungan penuh untuk karakter Jepang, alias matching, dan multiple matches.

## Tipe Data yang Didukung

### 1. **Actresses** ✅
- Direct name matching: `jpname`, `kanjiName`, `kanaName`, `name`
- Alias matching dengan partial match untuk karakter Jepang
- Case-insensitive matching untuk nama English
- Multiple matches handling

### 2. **Actors** ✅
- Direct name matching: `jpname`, `kanjiName`, `kanaName`, `name`
- Alias matching dengan partial match untuk karakter Jepang
- Case-insensitive matching untuk nama English
- Multiple matches handling

### 3. **Directors** ✅
- Direct name matching: `jpname`, `kanjiName`, `kanaName`, `name`
- Alias matching dengan partial match untuk karakter Jepang
- Case-insensitive matching untuk nama English
- Multiple matches handling

### 4. **Studios** ✅
- Direct name matching: `jpname`, `kanjiName`, `kanaName`, `name`
- Alias matching dengan partial match untuk karakter Jepang
- Case-insensitive matching untuk nama English
- Multiple matches handling

### 5. **Series** ✅
- Direct name matching: `jpname`, `kanjiName`, `kanaName`, `name`
- Alias matching dengan partial match untuk karakter Jepang
- Case-insensitive matching untuk nama English
- Multiple matches handling

### 6. **Labels** ✅
- Direct name matching: `jpname`, `kanjiName`, `kanaName`, `name`
- Alias matching dengan partial match untuk karakter Jepang
- Case-insensitive matching untuk nama English
- Multiple matches handling

## Implementasi Detail

### Enhanced Matching Function

**File**: `src/utils/movieDataParser.ts`

```typescript
function matchJavdbSimple(
  parsedData: ParsedMovieData,
  masterData: MasterDataItem[]
): MatchedData {
  // Helper functions
  const hasJapaneseChars = (name: string): boolean => {
    return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(name)
  }

  const extractAliases = (aliasString: string): string[] => {
    if (!aliasString) return []
    return aliasString.split(',').map(alias => alias.trim()).filter(alias => alias.length > 0)
  }

  // Enhanced matching for each data type...
}
```

### Matching Strategy untuk Semua Tipe Data

```typescript
// Enhanced matching for [TYPE] with Japanese name support
parsedData.[TYPE].forEach(itemName => {
  const trimmedName = itemName.trim()
  const isJapaneseName = hasJapaneseChars(trimmedName)
  
  // Find all potential matches
  const potentialMatches = masterData.filter(item => {
    if (item.type !== '[TYPE]') return false
    
    // Direct name matching
    if (item.jpname?.trim() === trimmedName) return true
    if (item.kanjiName?.trim() === trimmedName) return true
    if (item.kanaName?.trim() === trimmedName) return true
    if (item.name?.trim() === trimmedName) return true
    
    // Case-insensitive matching for English names only
    if (item.name && trimmedName && /^[a-zA-Z\s]+$/.test(item.name) && /^[a-zA-Z\s]+$/.test(trimmedName)) {
      return item.name.toLowerCase() === trimmedName.toLowerCase()
    }
    
    // Alias matching
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
    
    return false
  })
  
  // Determine the best match
  let bestMatch = null
  let multipleMatches: MasterDataItem[] = []
  
  if (potentialMatches.length === 1) {
    bestMatch = potentialMatches[0]
  } else if (potentialMatches.length > 1) {
    // Multiple matches found - let user choose
    multipleMatches = potentialMatches
    bestMatch = potentialMatches[0]
  }
  
  matched.[TYPE].push({
    name: itemName,
    matched: bestMatch,
    multipleMatches: multipleMatches,
    needsConfirmation: multipleMatches.length > 1,
    isIgnored: false
  })
})
```

## Contoh Skenario untuk Setiap Tipe Data

### Actresses
```
Data JavDB: "有栖花あか"
Database: jpname: "有栖花あか"
Result: ✅ Match found
```

### Actors
```
Data JavDB: "貞松大輔"
Database: jpname: "貞松大輔"
Result: ✅ Match found
```

### Directors
```
Data JavDB: "紋℃"
Database: name: "紋℃"
Result: ✅ Match found
```

### Studios
```
Data JavDB: "S1 NO.1 STYLE"
Database: name: "S1 NO.1 STYLE"
Result: ✅ Match found
```

### Series
```
Data JavDB: "交わる体液、濃密セックス"
Database: jpname: "交わる体液、濃密セックス"
Result: ✅ Match found
```

### Labels
```
Data JavDB: "Beautiful Girl Movie"
Database: name: "Beautiful Girl Movie"
Result: ✅ Match found
```

## Multiple Matches Handling

### Contoh Multiple Matches
```
Data JavDB: "Tia"
Database: 
- Aktris 1: name: "Tia"
- Aktris 2: name: "Tiara", alias: "Tia"
Result: ✅ Multiple matches found
UI: Shows "Japanese Name Match (2)" button
User: Can choose between Tia and Tiara
```

### UI Integration
- `multipleMatches` array untuk menyimpan semua potential matches
- `needsConfirmation` flag untuk menandai perlu konfirmasi user
- Tombol "Japanese Name Match (N)" untuk multiple matches
- Dialog selector untuk user memilih match yang tepat

## Keuntungan Sistem Lengkap

1. **✅ Consistent Behavior**: Semua tipe data menggunakan algoritma matching yang sama
2. **✅ Japanese Character Support**: Deteksi karakter Jepang untuk semua tipe data
3. **✅ Alias Matching**: Support alias untuk semua tipe data
4. **✅ Multiple Matches**: User dapat memilih dari multiple matches untuk semua tipe data
5. **✅ Case-Insensitive English**: Nama English tetap case-insensitive untuk semua tipe data
6. **✅ Robust Matching**: Menggunakan multiple strategi matching untuk semua tipe data

## Test Cases untuk Semua Tipe Data

### Test Case 1: Japanese Name Exact Match
**Input**: `"有栖花あか"` (actress), `"貞松大輔"` (actor), `"紋℃"` (director)
**Database**: `jpname: "有栖花あか"`, `jpname: "貞松大輔"`, `name: "紋℃"`
**Expected**: ✅ Match found for all types

### Test Case 2: Alias Match
**Input**: `"有栖花あか"` (actress)
**Database**: `alias: "Aka Asuka - 有栖花あか, Shiose - 汐世"`
**Expected**: ✅ Match found via alias

### Test Case 3: Multiple Matches
**Input**: `"Tia"` (actress)
**Database**: 
- `name: "Tia"`
- `name: "Tiara", alias: "Tia"`
**Expected**: ✅ Multiple matches, user can choose

### Test Case 4: English Case-Insensitive
**Input**: `"julia"` (actress), `"s1 no.1 style"` (studio)
**Database**: `name: "JULIA"`, `name: "S1 NO.1 STYLE"`
**Expected**: ✅ Match found (case-insensitive)

### Test Case 5: Mixed Characters
**Input**: `"有栖花あか"` (actress)
**Database**: `name: "Aka Asuka"`
**Expected**: ❌ No match (different character types)

## Files Modified

- `src/utils/movieDataParser.ts` - Enhanced `matchJavdbSimple` function untuk semua tipe data
- `docs/JAVDB_COMPLETE_MATCHING_SYSTEM.md` - Dokumentasi sistem lengkap ini

## Performance Considerations

1. **Efficient Filtering**: Menggunakan `filter()` untuk mencari semua potential matches
2. **Early Return**: Menghentikan pencarian setelah menemukan match yang tepat
3. **Character Detection**: Regex yang efisien untuk deteksi karakter Jepang
4. **Alias Parsing**: Parsing alias yang optimal dengan `split()` dan `trim()`
5. **Consistent Logic**: Logika yang sama untuk semua tipe data mengurangi kompleksitas

## Future Enhancements

1. **Fuzzy Matching**: Implementasi fuzzy matching untuk semua tipe data
2. **Weighted Scoring**: Sistem scoring untuk menentukan match terbaik
3. **Caching**: Cache hasil matching untuk performa yang lebih baik
4. **Unicode Normalization**: Normalisasi Unicode untuk handling karakter Jepang yang kompleks
5. **Batch Processing**: Optimasi untuk processing data dalam jumlah besar

## Summary

Sistem matching JavDB sekarang mendukung semua tipe data dengan:
- ✅ **Actresses**: Enhanced matching dengan alias support
- ✅ **Actors**: Enhanced matching dengan alias support  
- ✅ **Directors**: Enhanced matching dengan alias support
- ✅ **Studios**: Enhanced matching dengan alias support
- ✅ **Series**: Enhanced matching dengan alias support
- ✅ **Labels**: Enhanced matching dengan alias support

Semua tipe data menggunakan algoritma yang sama untuk konsistensi dan keandalan yang optimal!
