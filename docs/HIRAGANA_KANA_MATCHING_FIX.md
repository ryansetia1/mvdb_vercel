# Hiragana/Kana Matching Fix

## Masalah yang Diperbaiki

Sistem Fix Alias sebelumnya hanya mencari Kanji names untuk cross-field matching, tetapi tidak mencari Hiragana/Kana names. Ini menyebabkan kasus seperti berikut tidak dapat dicocokkan dengan benar:

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

1. **Character Type Detection**: "ありかわもえみ" adalah Hiragana (Unicode range \u3040-\u309f), bukan Kanji (Unicode range \u4e00-\u9faf)
2. **Limited Search**: Sistem hanya mencari Kanji names untuk cross-field matching
3. **Missing Kana Support**: Tidak ada dukungan untuk Hiragana/Katakana names dalam cross-field matching

## Solusi yang Diimplementasikan

### 1. **Enhanced Character Type Detection**

**File**: `src/components/ActorForm.tsx` dan `src/utils/japaneseNameNormalizer.ts`

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
      } else if (characterType === 'kanji' || characterType === 'kana') { // ✅ Added 'kana' support
        kanjiNames.push(subPart)
      }
    })
  })
})
```

### 2. **Enhanced Cross-Field Matching**

**Perubahan pada Cross-Field Search**:
```typescript
// Coba cari pasangan dari field lain jika tidak ada kanji names dari kurung
if (englishNames.length > 0 && kanjiNames.length === 0) {
  // Cari kanji/kana names dari field lain yang mungkin cocok
  const availableJapaneseNames: string[] = []
  
  // Cek dari jpname field
  if (cleanedFormData.jpname) {
    const jpnameExtracted = extractNamesFromBrackets(cleanedFormData.jpname)
    if (jpnameExtracted.bracketName) {
      const bracketParts = jpnameExtracted.bracketName.split(',').map(part => part.trim()).filter(part => part.length > 0)
      bracketParts.forEach(part => {
        const characterType = detectCharacterType(part)
        if (characterType === 'kanji' || characterType === 'kana') { // ✅ Added 'kana' support
          availableJapaneseNames.push(part)
        }
      })
    }
  }
  
  // Tambahkan Japanese names yang tersedia
  kanjiNames.push(...availableJapaneseNames)
}
```

### 3. **Character Type Support**

**Fungsi `detectCharacterType` sudah mendukung**:
- `'kanji'`: Karakter Kanji (Unicode \u4e00-\u9faf)
- `'kana'`: Karakter Hiragana (\u3040-\u309f) atau Katakana (\u30a0-\u30ff)
- `'romaji'`: Karakter Latin (A-Z, a-z)
- `'mixed'`: Kombinasi karakter
- `'unknown'`: Tidak dapat dideteksi

## Cara Kerja Setelah Perbaikan

### Step 1: Extract Names from Brackets
- **Nama field**: `Erina Ichihashi (Moemi Arikawa)` → English: `Moemi Arikawa`
- **Nama Jepang field**: `市橋えりな (ありかわもえみ)` → Kana: `ありかわもえみ`

### Step 2: Character Type Detection
- `Moemi Arikawa` → `characterType: 'romaji'` → `englishNames`
- `ありかわもえみ` → `characterType: 'kana'` → `kanjiNames` (karena sekarang mendukung kana)

### Step 3: Cross-Field Matching
- Sistem mendeteksi ada English name (`Moemi Arikawa`) tetapi tidak ada Kanji/Kana name dari kurung
- Sistem mencari Kanji/Kana names dari field lain (`jpname`, `kanjiName`)
- Menemukan `ありかわもえみ` dari nama Jepang field

### Step 4: Create Paired Alias
- Mencocokkan `Moemi Arikawa` dengan `ありかわもえみ`
- Membuat alias: `Moemi Arikawa - ありかわもえみ`

### Step 5: Append to Existing Alias
- Menambahkan alias baru di belakang alias yang sudah ada
- Hasil: `..., Moemi Arikawa - ありかわもえみ`

## Keuntungan

1. **Complete Japanese Support**: Mendukung Kanji, Hiragana, dan Katakana
2. **Better Matching**: Sistem dapat mencocokkan nama dari berbagai jenis karakter Jepang
3. **Consistency**: Logika yang sama diterapkan di ActorForm dan R18 parser
4. **Flexibility**: Menangani berbagai skenario cross-field matching dengan karakter Jepang

## Testing

### **Test Case 1: Hiragana Matching**
1. Input: 
   - nama = `Erina Ichihashi (Moemi Arikawa)`
   - nama jepang = `市橋えりな (ありかわもえみ)`
2. Expected: `Moemi Arikawa - ありかわもえみ`

### **Test Case 2: Katakana Matching**
1. Input:
   - nama = `Test Name (Test Alias)`
   - nama jepang = `テスト名前 (テストエイリアス)`
2. Expected: `Test Alias - テストエイリアス`

### **Test Case 3: Kanji Matching (Existing)**
1. Input:
   - nama = `Test Name (Shiose)`
   - nama jepang = `テスト名前 (汐世)`
2. Expected: `Shiose - 汐世`

## Files Modified

- `src/components/ActorForm.tsx`: Enhanced character type detection and cross-field matching
- `src/utils/japaneseNameNormalizer.ts`: Enhanced character type detection and cross-field matching
- `docs/HIRAGANA_KANA_MATCHING_FIX.md`: Dokumentasi perubahan ini
