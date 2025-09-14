# R18 Alias Fixing Integration

## Overview

Sistem fixing alias yang sudah diperbaiki di `ActorForm.tsx` sekarang telah diintegrasikan ke dalam parser movie R18 saat user klik save movie. Ini memastikan konsistensi formatting alias di seluruh aplikasi.

## Masalah yang Diperbaiki

Sebelumnya, ketika user melakukan parsing data R18 dan save movie, alias yang dihasilkan tidak menggunakan sistem fixing alias yang sudah diperbaiki. Ini menyebabkan:

1. **Inkonsistensi Format**: Alias di ActorForm dan R18 parser menggunakan logika yang berbeda
2. **Format Tidak Optimal**: Alias dari R18 tidak diformat dengan struktur yang benar
3. **Duplikasi**: Tidak ada penanganan duplikasi alias yang optimal

## Solusi yang Diimplementasikan

### 1. Fungsi `formatAliasWithFixingLogic`

**File**: `src/utils/japaneseNameNormalizer.ts`

Fungsi baru yang mengimplementasikan logika fixing alias yang sama dengan `ActorForm.tsx`:

```typescript
export const formatAliasWithFixingLogic = (
  aliasData: {
    existingAlias?: string
    name?: string
    jpname?: string
    kanjiName?: string
    kanaName?: string
  }
): string => {
  // Implementasi logika fixing alias yang sama dengan ActorForm.tsx
  // - Parse alias yang ada dengan fungsi yang sudah diperbaiki
  // - Extract nama dari kurung dengan regex yang robust
  // - Format alias dengan struktur yang benar
  // - Buat pasangan English - Kanji yang sesuai
  // - Menghindari duplikasi
}
```

### 2. Integrasi ke MovieDataParser

**File**: `src/components/MovieDataParser.tsx`

Update pada fungsi `updateMasterDataWithConflicts` untuk menggunakan sistem fixing alias:

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
  console.log(`Fixed and merged alias for ${category}[${i}]: existing="${item.matched.alias}", new="${newAlias}", merged="${mergedAlias}", fixed="${updateData.alias}"`)
} else {
  // Apply fixing alias logic to the new alias
  const { formatAliasWithFixingLogic } = await import('../utils/japaneseNameNormalizer')
  const fixedAlias = formatAliasWithFixingLogic({
    existingAlias: newAlias,
    name: updateData.name || item.matched.name,
    jpname: updateData.jpname || item.matched.jpname,
    kanjiName: updateData.kanjiName || item.matched.kanjiName,
    kanaName: updateData.kanaName || item.matched.kanaName
  })
  
  updateData.alias = fixedAlias
  console.log(`Fixed alias for ${category}[${i}]: new="${newAlias}", fixed="${updateData.alias}"`)
}
```

## Cara Kerja Setelah Integrasi

### Step 1: Parsing R18 Data
- Data R18 diparse menggunakan `normalizeR18JapaneseName`
- Alias diekstrak dari data R18

### Step 2: Merging Alias
- Alias baru dari R18 digabungkan dengan alias existing menggunakan `mergeAlias`
- Duplikasi dihilangkan secara otomatis

### Step 3: Fixing Alias
- Alias yang sudah digabungkan diformat menggunakan `formatAliasWithFixingLogic`
- Logika yang sama dengan tombol "Fix Alias" di ActorForm diterapkan
- Format yang dihasilkan: `"English - Kanji"` yang konsisten

### Step 4: Database Update
- Alias yang sudah diformat disimpan ke database
- Konsistensi format di seluruh aplikasi terjaga

## Contoh Skenario

### Input Data R18:
```json
{
  "actresses": [
    {
      "name_kanji": "有栖花あか（汐世）",
      "name_kana": "あすかあか（凪ひかる）",
      "name_romaji": "Aka Asuka (Shiose) (Nagi Hikaru)"
    }
  ]
}
```

### Aktris di Database:
```
Name: "Aka Asuka"
Japanese Name: "有栖花あか"
Kanji Name: "有栖花あか"
Alias: "Shiose - 汐世 Aka Asuka 有栖花あか 有栖花あか （あすかあか / Asuka Aka）Nagi Hikaru (凪ひかる)"
```

### Hasil Setelah Save Movie:
```
Name: "Aka Asuka"
Japanese Name: "有栖花あか"
Kanji Name: "有栖花あか"
Alias: "Shiose - 汐世, Nagi Hikaru - 凪ひかる"
```

## Keuntungan

1. **✅ Konsistensi Format**: Alias di ActorForm dan R18 parser menggunakan logika yang sama
2. **✅ Format Optimal**: Alias selalu diformat dengan struktur `"English - Kanji"` yang benar
3. **✅ Menghindari Duplikasi**: Sistem otomatis menghilangkan alias yang duplikat
4. **✅ Smart Pairing**: Otomatis mencocokkan pasangan English-Kanji yang sesuai
5. **✅ Backward Compatibility**: Tetap mendukung format alias yang sudah ada
6. **✅ Comprehensive Logging**: Console log yang detail untuk debugging

## Files Modified

- `src/utils/japaneseNameNormalizer.ts` - Tambah fungsi `formatAliasWithFixingLogic`
- `src/components/MovieDataParser.tsx` - Integrasi sistem fixing alias ke R18 parser
- `docs/R18_ALIAS_FIXING_INTEGRATION.md` - Dokumentasi integrasi ini

## Testing

### Test Cases:
1. **R18 Data dengan Alias Kompleks**: Test dengan data R18 yang memiliki format alias kompleks
2. **Merging dengan Alias Existing**: Test penggabungan alias baru dengan alias yang sudah ada
3. **Format Consistency**: Pastikan format alias konsisten antara ActorForm dan R18 parser
4. **Edge Cases**: Test dengan data kosong, null, atau format yang tidak standar

## Integration Points

### 1. ActorForm.tsx
- Tombol "Fix Alias" menggunakan logika yang sama
- Konsistensi format di seluruh aplikasi

### 2. MovieDataParser.tsx
- R18 parser menggunakan sistem fixing alias saat save movie
- Alias otomatis diformat dengan struktur yang benar

### 3. japaneseNameNormalizer.ts
- Fungsi `formatAliasWithFixingLogic` dapat digunakan di mana saja
- Reusable utility untuk formatting alias

## Future Enhancements

1. **Batch Processing**: Optimasi untuk processing alias dalam jumlah besar
2. **Custom Rules**: Kemungkinan menambahkan aturan custom untuk pairing alias
3. **Performance**: Optimasi performa untuk data dengan alias yang sangat kompleks
4. **Validation**: Tambahan validasi untuk memastikan format alias yang benar
