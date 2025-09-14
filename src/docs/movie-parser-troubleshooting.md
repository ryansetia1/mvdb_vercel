# Movie Parser Troubleshooting Guide

## Overview

Dokumentasi ini menjelaskan troubleshooting untuk masalah-masalah umum dalam movie parser, khususnya terkait dengan English name selection, missing data updates, dan alias fixing.

## Common Issues & Solutions

### 1. Kana Name Tidak Ter-Update (Missing Data Issue)

#### Problem Description
- Kana name tetap kosong meskipun ada missing data yang terdeteksi
- Console log menunjukkan `hasMissingData=true` tapi `updateType=none`
- Missing data tidak ter-update ke database

#### Root Causes
1. **English Name Selection Interference**: `customEnglishName` ter-set ketika tidak seharusnya, mengubah Kasus 3 menjadi Kasus 1
2. **Update Condition Logic**: Kondisi update tidak mempertimbangkan edge case dengan `customEnglishName`
3. **R18 Data Processing**: Circular dependency dalam logika R18 kana name

#### Debug Steps
1. **Check Update Type**:
   ```typescript
   console.log(`ROBUST DEBUG: hasMatched=${hasMatched}, shouldUpdate=${shouldUpdate}, hasMissingData=${hasMissingData}, hasCustomEnglishName=${hasCustomEnglishName}, hasEnglishNameSelection=${hasEnglishNameSelection}, updateType=${updateType}`)
   ```

2. **Check Missing Data Detection**:
   ```typescript
   console.log('Missing data:', item.missingData)
   console.log('Matched kanaName:', item.matched.kanaName)
   ```

3. **Check R18 Data Processing**:
   ```typescript
   console.log(`[MISSING DATA] Debug - normalizedR18Data:`, normalizedR18Data)
   console.log(`[MISSING DATA] Debug - item.matched.kanaName:`, item.matched.kanaName)
   ```

#### Solution
**Robust Update Logic**:
```typescript
// Determine update type
let updateType = 'none'
if (hasMatched && shouldUpdate) {
  updateType = 'full_r18_update'
} else if (hasMatched && hasMissingData && (!hasCustomEnglishName || !hasEnglishNameSelection)) {
  // Allow missing data update if:
  // 1. No custom English name, OR
  // 2. Custom English name exists but no English name selection was needed (Case 3)
  updateType = 'missing_data_only'
}
```

### 2. Alias Fixing Tidak Berfungsi

#### Problem Description
- Alias dalam kurung tidak ter-extract ke field alias
- Field alias tetap kosong meskipun ada nama dalam kurung
- Alias fixing button tidak menghasilkan hasil yang diharapkan

#### Root Cause
**Data Input Issue**: `formatAliasWithFixingLogic` menerima data yang sudah dibersihkan dari kurung, sehingga tidak bisa menemukan alias untuk diekstrak.

#### Debug Steps
1. **Check Input Data**:
   ```typescript
   console.log('Current name (original):', currentName)
   console.log('Current name (cleaned):', nameParsed.mainName)
   ```

2. **Check Alias Extraction**:
   ```typescript
   console.log('Aliases from brackets:', uniqueAliasesFromBrackets)
   console.log(`Fixed alias: "${item.matched.alias}" -> "${fixedAlias}"`)
   ```

#### Solution
**Use Original Data for Alias Fixing**:
```typescript
// Apply fixing alias logic with original names (that still contain brackets)
const fixedAlias = formatAliasWithFixingLogic({
  existingAlias: item.matched.alias,
  name: currentName,        // ✅ Data asli yang masih mengandung kurung
  jpname: currentJpname,    // ✅ Data asli yang masih mengandung kurung
  kanjiName: currentKanjiName, // ✅ Data asli yang masih mengandung kurung
  kanaName: currentKanaName    // ✅ Data asli yang masih mengandung kurung
})
```

### 3. English Name Selection Muncul Ketika Tidak Seharusnya

#### Problem Description
- English name selection muncul untuk Kasus 3 (nama sudah match)
- `customEnglishName` ter-set meskipun `needsEnglishNameSelection=false`
- Kasus 3 berubah menjadi Kasus 1 karena English name selection

#### Root Causes
1. **Normalization Issue**: Perbedaan kecil dalam normalisasi nama (spasi, karakter khusus)
2. **R18 Data Difference**: R18 English name berbeda dengan database name
3. **Logic Error**: Kondisi English name selection tidak akurat

#### Debug Steps
1. **Check English Name Selection Logic**:
   ```typescript
   console.log(`=== DEBUG ENGLISH NAME SELECTION FOR ${normalizedActressName} ===`)
   console.log('Matched item:', matchResult.matched?.name)
   console.log('Parsed English name:', parsedEnglishName)
   console.log('DB name (fully normalized):', normalizedDbName)
   console.log('Parsed name (fully normalized):', normalizedParsedName)
   console.log('Names are different:', normalizedDbName !== normalizedParsedName)
   ```

2. **Check Selection Flags**:
   ```typescript
   console.log('needsEnglishNameSelection:', item.needsEnglishNameSelection)
   console.log('hasDifferentEnglishNames:', item.hasDifferentEnglishNames)
   console.log('customEnglishName:', item.customEnglishName)
   ```

#### Solution
**Robust Update Logic**:
```typescript
const hasEnglishNameSelection = !!(item.needsEnglishNameSelection || item.availableEnglishNames)

// Allow missing data update if:
// 1. No custom English name, OR
// 2. Custom English name exists but no English name selection was needed (Case 3)
else if (hasMatched && hasMissingData && (!hasCustomEnglishName || !hasEnglishNameSelection)) {
  updateType = 'missing_data_only'
}
```

## Case Scenarios

### Case 1: User Pilih Database Name
**Scenario**: User memilih untuk mempertahankan nama English dari database
**Expected Behavior**:
- `shouldUpdateData = false`
- `hasCustomEnglishName = true`
- `hasEnglishNameSelection = true`
- `updateType = 'none'`
- **No update at all** (termasuk missing data)

### Case 2: User Pilih R18 Data
**Scenario**: User memilih untuk menggunakan data R18
**Expected Behavior**:
- `shouldUpdateData = true`
- `hasCustomEnglishName = true`
- `hasEnglishNameSelection = true`
- `updateType = 'full_r18_update'`
- **Full update with R18 data**

### Case 3: Nama Sudah Match, Ada Missing Data
**Scenario**: English dan Japanese name sudah match, tapi ada missing data (kana name)
**Expected Behavior**:
- `shouldUpdateData = false`
- `hasCustomEnglishName = false` (atau `true` tapi `hasEnglishNameSelection = false`)
- `hasEnglishNameSelection = false`
- `updateType = 'missing_data_only'`
- **Update missing data only**

## Debug Checklist

### Before Reporting Issues
1. **Check Console Logs**:
   - [ ] `ROBUST DEBUG` log menunjukkan update type yang benar
   - [ ] Missing data terdeteksi dengan benar
   - [ ] R18 data ter-normalize dengan benar
   - [ ] Alias fixing menggunakan data asli

2. **Check Data State**:
   - [ ] `item.matched` ada dan benar
   - [ ] `item.missingData` berisi field yang diharapkan
   - [ ] `item.customEnglishName` sesuai dengan user action
   - [ ] `item.needsEnglishNameSelection` sesuai dengan kondisi

3. **Check Update Logic**:
   - [ ] `updateType` sesuai dengan expected behavior
   - [ ] Missing data ter-include dalam `updateData`
   - [ ] R18 data ter-proses dengan benar
   - [ ] Alias fixing berjalan dengan data asli

### Common Debug Commands
```typescript
// Check update type
console.log(`ROBUST DEBUG: hasMatched=${hasMatched}, shouldUpdate=${shouldUpdate}, hasMissingData=${hasMissingData}, hasCustomEnglishName=${hasCustomEnglishName}, hasEnglishNameSelection=${hasEnglishNameSelection}, updateType=${updateType}`)

// Check missing data
console.log('Missing data:', item.missingData)
console.log('Final kanaName in master data update:', updateData.kanaName)

// Check alias fixing
console.log('Current name (original):', currentName)
console.log(`Fixed alias: "${item.matched.alias}" -> "${fixedAlias}"`)

// Check English name selection
console.log(`=== DEBUG ENGLISH NAME SELECTION FOR ${normalizedActressName} ===`)
console.log('Names are different:', normalizedDbName !== normalizedParsedName)
```

## File Locations

### Core Files
- **MovieDataParser.tsx**: Main component dengan update logic
- **movieDataParser.ts**: Utility functions untuk matching dan missing data detection
- **japaneseNameNormalizer.ts**: Alias fixing dan R18 data normalization

### Key Functions
- **`updateMasterDataWithConflicts`**: Main update logic
- **`detectMissingData`**: Missing data detection
- **`formatAliasWithFixingLogic`**: Alias fixing logic
- **`normalizeR18JapaneseName`**: R18 data normalization

## Prevention Tips

1. **Always Use Original Data for Alias Fixing**: Jangan gunakan data yang sudah dibersihkan
2. **Check English Name Selection Flags**: Pastikan `needsEnglishNameSelection` dan `hasDifferentEnglishNames` sesuai
3. **Use Robust Update Logic**: Pertimbangkan edge case dengan `customEnglishName`
4. **Debug Step by Step**: Gunakan debug log yang detail untuk setiap tahap
5. **Test All Cases**: Pastikan semua kasus (1, 2, 3) berfungsi dengan benar

## Last Updated
- **Date**: 2025-01-14
- **Version**: 1.0
- **Author**: AI Assistant
- **Status**: ✅ Tested and Working
