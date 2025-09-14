# R18 Parser Fix Alias Simplification

## Overview

Perubahan yang sama dengan Fix Alias Simplification di `ActorForm.tsx` juga telah diterapkan pada parser khusus R18 di `japaneseNameNormalizer.ts`. Ini memastikan konsistensi logika fixing alias di seluruh aplikasi.

## Masalah yang Diperbaiki

Sebelumnya, fungsi `formatAliasWithFixingLogic` di `japaneseNameNormalizer.ts` menggunakan logika kompleks yang sama dengan `ActorForm.tsx` sebelum diperbaiki, yang menyebabkan:

1. **Data Loss**: Alias yang sudah ada akan hilang dan digantikan dengan alias baru
2. **Complex Logic**: Logika parsing dan reformatting yang terlalu kompleks
3. **Inconsistency**: Perbedaan perilaku antara ActorForm dan R18 parser

## Solusi yang Diimplementasikan

### Perubahan pada `formatAliasWithFixingLogic`

**File**: `src/utils/japaneseNameNormalizer.ts`

**Sebelum**: Logika kompleks dengan parsing, deduplication, dan reformatting
```typescript
// Parse alias dari field alias yang ada
let aliasesToFormat: string[] = []
// ... logika kompleks untuk parsing dan reformatting
const uniqueAliases = [...new Set(aliasesToFormat.map(alias => alias.trim()).filter(alias => alias.length > 0))]
// ... proses formatting yang panjang
return cleanFormattedAliases.join(', ')
```

**Sesudah**: Logika sederhana append-only
```typescript
// Logika sederhana: jika alias sudah ada, tambahkan alias baru di belakang
let newAliasToAdd = ''

// Format nama dari kurung menjadi alias baru
if (uniqueNamesToMove.length > 0) {
  // ... proses untuk membuat alias baru dari nama dalam kurung
  newAliasToAdd = pairedAliases.join(', ')
}

// Tambahkan alias baru di belakang alias yang sudah ada
const existingAliasTrimmed = existingAlias.trim()
return existingAliasTrimmed 
  ? `${existingAliasTrimmed}, ${newAliasToAdd}`
  : newAliasToAdd
```

### Kasus Khusus yang Ditangani

1. **Eren Shiraki - 白木エレン**: Ditambahkan sebagai prioritas khusus
2. **Shiose - 汐世**: Tetap dipertahankan
3. **Nagi Hikaru - 凪ひかる**: Tetap dipertahankan

## Integrasi dengan R18 Parser

### Cara Kerja Setelah Perbaikan

1. **Parsing R18 Data**: Data R18 diparse menggunakan `normalizeR18JapaneseName`
2. **Alias Merging**: Alias baru dari R18 digabungkan dengan alias existing menggunakan `mergeAlias`
3. **Fix Alias Logic**: Alias yang sudah digabungkan diformat menggunakan `formatAliasWithFixingLogic` dengan logika yang sudah diperbaiki
4. **Database Update**: Alias yang sudah diformat disimpan ke database

### Contoh Skenario

**Sebelum Perbaikan**:
```
Aktris di DB: "Meguri" (alias: "Fujimegu - フジメグ, Meguri - めぐり")
R18 Data: "Megurin - めぐりん, Sekai no Fujimegu - 世界のフジメグ"
Result: Alias lama hilang, hanya tersisa alias baru yang diformat ulang
```

**Sesudah Perbaikan**:
```
Aktris di DB: "Meguri" (alias: "Fujimegu - フジメグ, Meguri - めぐり")
R18 Data: "Megurin - めぐりん, Sekai no Fujimegu - 世界のフジメグ"
Result: "Fujimegu - フジメグ, Meguri - めぐり, Megurin - めぐりん, Sekai no Fujimegu - 世界のフジメグ"
```

## Keuntungan

1. **Data Preservation**: Alias yang sudah ada tidak hilang
2. **Consistency**: Logika yang sama dengan ActorForm.tsx
3. **Simplicity**: Logika yang lebih sederhana dan mudah dipahami
4. **Predictability**: User tahu bahwa data mereka tidak akan hilang
5. **Performance**: Tidak ada proses parsing yang kompleks

## Testing

Untuk menguji perubahan ini:
1. Parse data R18 dengan aktris yang sudah memiliki alias di database
2. Pastikan alias lama tetap ada dan alias baru ditambahkan di belakang
3. Verifikasi bahwa format alias konsisten dengan hasil dari tombol "Fix Alias" di ActorForm

## Files Modified

- `src/utils/japaneseNameNormalizer.ts`: Fungsi `formatAliasWithFixingLogic` diperbaiki
- `docs/R18_PARSER_FIX_ALIAS_SIMPLIFICATION.md`: Dokumentasi perubahan ini
