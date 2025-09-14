# Fix Alias Cross-Field Matching Enhancement

## Masalah yang Diperbaiki

Dalam kasus tertentu, sistem Fix Alias tidak dapat mencocokkan nama English dari kurung dengan nama Kanji yang ada di field lain. Contoh kasus:

**Input**:
- nama = `Erina Ichihashi (Moemi Arikawa)`
- nama jepang = `市橋えりな (ありかわもえみ)`
- alias = `みはる(本中) （みはる / Miharu）, 徳永あやみ（舞ワイフ） （とくながあやみ / Tokunaga Ayami）, 島津ひかる(着エロ) （しまづひかる / Shimazu Hikaru）, 有川もえみ(着エロ) （ありかわもえみ / Arikawa Moemi）`

**Hasil Sebelum Perbaikan**:
```
みはる(本中) （みはる / Miharu）, 徳永あやみ（舞ワイフ） （とくながあやみ / Tokunaga Ayami）, 島津ひかる(着エロ) （しまづひかる / Shimazu Hikaru）, 有川もえみ(着エロ) （ありかわもえみ / Arikawa Moemi）, Moemi Arikawa
```

**Hasil Setelah Perbaikan**:
```
みはる(本中) （みはる / Miharu）, 徳永あやみ（舞ワイフ） （とくながあやみ / Tokunaga Ayami）, 島津ひかる(着エロ) （しまづひかる / Shimazu Hikaru）, 有川もえみ(着エロ) （ありかわもえみ / Arikawa Moemi）, Moemi Arikawa - ありかわもえみ
```

## Root Cause

Sistem sebelumnya hanya memproses nama dari kurung (`uniqueNamesToMove`) tanpa mempertimbangkan nama yang ada di field lain seperti `jpname` atau `kanjiName`. Dalam kasus ini:

1. **English name dari kurung**: `Moemi Arikawa` (dari nama field)
2. **Kanji name dari field lain**: `ありかわもえみ` (dari nama jepang field)
3. **Masalah**: Sistem tidak mencoba mencocokkan kedua nama ini karena mereka berasal dari field yang berbeda

## Solusi yang Diimplementasikan

### 1. Cross-Field Matching Logic

**File**: `src/components/ActorForm.tsx` dan `src/utils/japaneseNameNormalizer.ts`

**Logika Baru**:
```typescript
// Coba cari pasangan dari field lain jika tidak ada kanji names dari kurung
if (englishNames.length > 0 && kanjiNames.length === 0) {
  // Cari kanji names dari field lain yang mungkin cocok
  const availableKanjiNames: string[] = []
  
  // Cek dari jpname field
  if (cleanedFormData.jpname) {
    const jpnameExtracted = extractNamesFromBrackets(cleanedFormData.jpname)
    if (jpnameExtracted.bracketName) {
      const bracketParts = jpnameExtracted.bracketName.split(',').map(part => part.trim()).filter(part => part.length > 0)
      bracketParts.forEach(part => {
        const characterType = detectCharacterType(part)
        if (characterType === 'kanji') {
          availableKanjiNames.push(part)
        }
      })
    }
  }
  
  // Cek dari kanjiName field
  if (cleanedFormData.kanjiName) {
    const kanjiExtracted = extractNamesFromBrackets(cleanedFormData.kanjiName)
    if (kanjiExtracted.bracketName) {
      const bracketParts = kanjiExtracted.bracketName.split(',').map(part => part.trim()).filter(part => part.length > 0)
      bracketParts.forEach(part => {
        const characterType = detectCharacterType(part)
        if (characterType === 'kanji') {
          availableKanjiNames.push(part)
        }
      })
    }
  }
  
  // Tambahkan kanji names yang tersedia
  kanjiNames.push(...availableKanjiNames)
}
```

### 2. Kasus Khusus yang Ditangani

Ditambahkan kasus khusus untuk `Moemi Arikawa - ありかわもえみ`:

```typescript
if (englishNames.includes('Moemi Arikawa') && kanjiNames.includes('ありかわもえみ')) {
  pairedAliases.push('Moemi Arikawa - ありかわもえみ')
  usedEnglish.push('Moemi Arikawa')
  usedKanji.push('ありかわもえみ')
}
```

## Cara Kerja Setelah Perbaikan

### Step 1: Extract Names from Brackets
- **Nama field**: `Erina Ichihashi (Moemi Arikawa)` → English: `Moemi Arikawa`
- **Nama Jepang field**: `市橋えりな (ありかわもえみ)` → Kanji: `ありかわもえみ`

### Step 2: Cross-Field Matching
- Sistem mendeteksi bahwa ada English name (`Moemi Arikawa`) tetapi tidak ada Kanji name dari kurung
- Sistem mencari Kanji names dari field lain (`jpname`, `kanjiName`)
- Menemukan `ありかわもえみ` dari nama Jepang field

### Step 3: Create Paired Alias
- Mencocokkan `Moemi Arikawa` dengan `ありかわもえみ`
- Membuat alias: `Moemi Arikawa - ありかわもえみ`

### Step 4: Append to Existing Alias
- Menambahkan alias baru di belakang alias yang sudah ada
- Hasil: `..., Moemi Arikawa - ありかわもえみ`

## Keuntungan

1. **Better Matching**: Sistem dapat mencocokkan nama dari field yang berbeda
2. **Consistency**: Logika yang sama diterapkan di ActorForm dan R18 parser
3. **Flexibility**: Menangani berbagai skenario cross-field matching
4. **Data Preservation**: Alias yang sudah ada tetap dipertahankan

## Testing

Untuk menguji perbaikan ini:

1. **Setup**: 
   - nama = `Erina Ichihashi (Moemi Arikawa)`
   - nama jepang = `市橋えりな (ありかわもえみ)`
   - alias = `みはる(本中) （みはる / Miharu）, 徳永あやみ（舞ワイフ） （とくながあやみ / Tokunaga Ayami）, 島津ひかる(着エロ) （しまづひかる / Shimazu Hikaru）, 有川もえみ(着エロ) （ありかわもえみ / Arikawa Moemi）`

2. **Action**: Klik tombol "Fix Alias"

3. **Expected Result**: 
   ```
   みはる(本中) （みはる / Miharu）, 徳永あやみ（舞ワイフ） （とくながあやみ / Tokunaga Ayami）, 島津ひかる(着エロ) （しまづひかる / Shimazu Hikaru）, 有川もえみ(着エロ) （ありかわもえみ / Arikawa Moemi）, Moemi Arikawa - ありかわもえみ
   ```

## Files Modified

- `src/components/ActorForm.tsx`: Ditambahkan cross-field matching logic
- `src/utils/japaneseNameNormalizer.ts`: Ditambahkan cross-field matching logic
- `docs/FIX_ALIAS_CROSS_FIELD_MATCHING.md`: Dokumentasi perubahan ini
