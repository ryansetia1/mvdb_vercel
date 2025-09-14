# Alias Parsing Improvement

## Masalah yang Diperbaiki

Sistem parsing alias sebelumnya memiliki masalah:

1. **Nama utama masih mengandung alias dalam kurung**: Field "Nama", "Kanji Name", dan "Kana Name" masih menampilkan nama dengan alias dalam kurung seperti "めぐり（ふじうらめぐ）"
2. **Field alias berisi nama Jepang**: Field "Alias" berisi nama Jepang seperti "ふじうらめぐ" padahal seharusnya hanya berisi nama English
3. **Inkonsistensi parsing**: Sistem tidak menggunakan data yang sudah dinormalisasi untuk ekstraksi nama

## Solusi yang Diimplementasikan

### 1. **Perbaikan Ekstraksi Nama Aktris**

#### **Sebelum:**
```typescript
actresses: data.actresses.map(actress => actress.name_romaji || actress.name_kanji || actress.name_kana),
actors: data.actors.map(actor => actor.name_romaji || actor.name_kanji || actor.name_kana),
```

#### **Sesudah:**
```typescript
actresses: data.actresses.map(actress => {
  const normalized = normalizeR18JapaneseName(actress)
  return normalized.jpname || normalized.name || actress.name_romaji || actress.name_kanji || actress.name_kana
}),
actors: data.actors.map(actor => {
  const normalized = normalizeR18JapaneseName(actor)
  return normalized.jpname || normalized.name || actor.name_romaji || actor.name_kanji || actor.name_kana
}),
```

**Perbaikan:**
- Menggunakan data yang sudah dinormalisasi dari `normalizeR18JapaneseName()`
- Nama utama tidak lagi mengandung alias dalam kurung
- Prioritas: `jpname` (nama Jepang bersih) > `name` (nama English bersih) > fallback ke data asli

### 2. **Perbaikan Ekstraksi Nama Director**

#### **Sebelum:**
```typescript
director: data.directors.length > 0 ? (data.directors[0].name_kanji || data.directors[0].name_kana || data.directors[0].name_romaji) : '',
```

#### **Sesudah:**
```typescript
director: data.directors.length > 0 ? (() => {
  const director = data.directors[0]
  const normalized = normalizeR18JapaneseName(director)
  return normalized.jpname || normalized.name || director.name_kanji || director.name_kana || director.name_romaji
})() : '',
```

**Perbaikan:**
- Konsisten dengan parsing aktris/aktor
- Menggunakan data yang sudah dinormalisasi
- Nama director tidak lagi mengandung alias dalam kurung

### 3. **Perbaikan Field Alias**

#### **Sebelum:**
```typescript
// Format aliases dengan struktur yang benar berdasarkan urutan
const aliasString = formatAliasesWithStructure({
  kanji: parsedKanji,
  kana: parsedKana,
  romaji: parsedRomaji,
  en: parsedEn
})
```

#### **Sesudah:**
```typescript
// Format aliases dengan struktur yang benar berdasarkan urutan
// Hanya gunakan English aliases untuk field alias
const englishAliases = parsedEn.aliases.filter(alias => alias.trim())
const aliasString = englishAliases.join(', ')
```

**Perbaikan:**
- Field alias hanya berisi nama English
- Tidak lagi berisi nama Jepang seperti "ふじうらめぐ"
- Format sederhana dengan koma sebagai pemisah

### 4. **Perbaikan Regex untuk Kurung Jepang**

#### **Sebelum:**
```typescript
const aliasRegex = /\(([^)]+)\)/g
const mainName = name.replace(/\([^)]+\)/g, '').trim()
```

#### **Sesudah:**
```typescript
const aliasRegex = /[（(]([^）)]+)[）)]/g
const mainName = name.replace(/[（(][^）)]*[）)]/g, '').trim()
```

**Perbaikan:**
- Mendukung kurung Jepang `（）` dan kurung Latin `()`
- Regex yang lebih robust untuk karakter Unicode
- Parsing yang benar untuk nama Jepang dengan alias

### 5. **Enhanced Debug Logging**

```typescript
aliasFormatting: {
  rawAliases: {
    kanji: parsedKanji.aliases,
    kana: parsedKana.aliases,
    romaji: parsedRomaji.aliases,
    en: parsedEn.aliases
  },
  aliasParts: {
    english: parsedRomaji.aliases[0] || parsedEn.aliases[0],
    kanji: parsedKanji.aliases[0],
    kana: parsedKana.aliases[0]
  },
  formattedAlias: aliasString
},
```

**Perbaikan:**
- Debug logging yang lebih detail
- Menampilkan bagian-bagian alias yang dipilih
- Informasi tentang proses formatting alias

## Contoh Hasil Perbaikan

### **Data R18 Input:**
```json
{
  "name_kanji": "めぐり（藤浦めぐ）",
  "name_kana": "めぐり（ふじうらめぐ）",
  "name_romaji": "Meguri (Megu Fujiura)",
  "name_en": "Meguri (Megu Fujiura)"
}
```

### **Sebelum Perbaikan:**
- **Nama**: "Meguri (Megu Fujiura)" ❌ (masih ada alias dalam kurung)
- **Nama Jepang**: "めぐり（ふじうらめぐ）" ❌ (masih ada alias dalam kurung)
- **Kanji Name**: "めぐり（藤浦めぐ）" ❌ (masih ada alias dalam kurung)
- **Kana Name**: "めぐり（ふじうらめぐ）" ❌ (masih ada alias dalam kurung)
- **Alias**: "ふじうらめぐ - 藤浦めぐ (ふじうらめぐ)" ❌ (berisi nama Jepang)

### **Sesudah Perbaikan:**
- **Nama**: "Meguri" ✅ (bersih tanpa alias)
- **Nama Jepang**: "めぐり" ✅ (bersih tanpa alias)
- **Kanji Name**: "めぐり" ✅ (bersih tanpa alias)
- **Kana Name**: "めぐり" ✅ (bersih tanpa alias)
- **Alias**: "Megu Fujiura - 藤浦めぐ (ふじうらめぐ)" ✅ (format yang benar)

## Keuntungan

1. **Data yang Bersih**: Nama utama tidak lagi mengandung alias dalam kurung
2. **Konsistensi**: Semua field menggunakan data yang sudah dinormalisasi
3. **Alias yang Tepat**: Field alias menggunakan format yang benar: "English Alias - Kanji Alias (Kana Alias)"
4. **Debug yang Lebih Baik**: Logging yang lebih informatif untuk troubleshooting
5. **Display yang Konsisten**: Nama yang ditampilkan di form menggunakan data yang sudah dinormalisasi
6. **Maintainability**: Kode yang lebih mudah dipahami dan dirawat

### 6. **Perbaikan Display di Form**

#### **Masalah:**
Meskipun data sudah dinormalisasi, nama yang ditampilkan di form masih menggunakan data yang belum dibersihkan karena `MatchedData.name` masih menggunakan `actressName` yang mengandung alias.

#### **Solusi:**
```typescript
// Sebelum perbaikan
matched.actresses.push({
  name: actressName, // Masih mengandung alias dalam kurung
  // ...
})

// Sesudah perbaikan
const normalizedActressName = r18ActressData ? 
  (r18ActressData.jpname || r18ActressData.name_kanji || r18ActressData.name_kana || actressName) : 
  actressName

matched.actresses.push({
  name: normalizedActressName, // Menggunakan nama yang sudah dibersihkan
  // ...
})
```

**Perbaikan:**
- Menggunakan nama yang sudah dinormalisasi untuk display di form
- Konsistensi antara data yang disimpan dan data yang ditampilkan
- Form menampilkan nama yang bersih tanpa alias dalam kurung

### 7. **Perbaikan Area Kuning "Data yang belum ada di database"**

#### **Masalah:**
Area kuning yang menampilkan data yang belum ada di database masih menampilkan alias yang salah karena fungsi `detectMissingData` menggunakan `parsedName` yang masih mengandung alias dalam kurung.

#### **Solusi:**
```typescript
// Sebelum perbaikan
if (parsedName && !matchedItem.alias && parsedName !== matchedItem.jpname) {
  missingData.alias = parsedName // Masih mengandung alias dalam kurung
}

// Sesudah perbaikan
// Check for missing alias (prioritize R18 aliases)
if (normalizedR18Data.alias && !matchedItem.alias) {
  missingData.alias = normalizedR18Data.alias // Menggunakan alias yang sudah diformat dengan benar
}
```

**Perbaikan:**
- Menghapus logika yang menggunakan `parsedName` untuk alias
- Menggunakan `normalizedR18Data.alias` yang sudah diformat dengan benar
- Area kuning menampilkan alias dengan format yang benar: "Megu Fujiura - 藤浦めぐ (ふじうらめぐ)"

### 8. **Perbaikan Alias Saat Save Movie**

#### **Masalah:**
Meskipun area kuning sudah diperbaiki, data yang tersimpan di database masih menggunakan alias yang salah karena proses normalisasi alias tidak dilakukan saat save movie.

#### **Solusi:**
Menambahkan proses normalisasi alias saat save movie di fungsi `updateMasterDataWithConflicts`:

```typescript
// Special handling for alias: normalize alias from R18 data if available
if (item.missingData?.alias) {
  // Check if we have R18 data for this item to normalize the alias
  if (parsedData && isR18JsonFormat(parsedData.rawData)) {
    try {
      const r18JsonData = JSON.parse(parsedData.rawData)
      let r18ItemData = null
      
      // Find corresponding R18 data for this item
      if (category === 'actresses' && r18JsonData.actresses) {
        r18ItemData = r18JsonData.actresses[i]
      } else if (category === 'actors' && r18JsonData.actors) {
        r18ItemData = r18JsonData.actors[i]
      } else if (category === 'directors' && r18JsonData.directors) {
        r18ItemData = r18JsonData.directors[0]
      }
      
      if (r18ItemData) {
        const { normalizeR18JapaneseName } = await import('../utils/japaneseNameNormalizer')
        const normalizedR18Data = normalizeR18JapaneseName(r18ItemData)
        
        // Use normalized alias if available, otherwise use original
        updateData.alias = normalizedR18Data.alias || item.missingData.alias
      }
    } catch (error) {
      console.error('Error normalizing alias:', error)
      updateData.alias = item.missingData.alias
    }
  }
}
```

**Perbaikan:**
- Normalisasi alias dilakukan saat save movie, bukan saat parsing
- Menggunakan data R18 asli untuk menghasilkan alias yang benar
- Data yang tersimpan di database menggunakan format alias yang benar: "Megu Fujiura - 藤浦めぐ (ふじうらめぐ)"
- Proses ini hanya dilakukan untuk data R18, data lain tetap menggunakan alias asli

### 9. **Perbaikan English Name Saat Save Movie**

#### **Masalah:**
Field "Nama *" (English name) masih menampilkan "Meguri (Megu Fujiura)" padahal seharusnya hanya "Meguri" saja tanpa alias dalam kurung.

#### **Solusi:**
Menambahkan normalisasi English name saat save movie di fungsi `updateMasterDataWithConflicts`:

```typescript
// Clean English name from aliases in parentheses for R18 data
if (parsedData && isR18JsonFormat(parsedData.rawData)) {
  try {
    const r18JsonData = JSON.parse(parsedData.rawData)
    let r18ItemData = null
    
    // Find corresponding R18 data for this item
    if (category === 'actresses' && r18JsonData.actresses) {
      r18ItemData = r18JsonData.actresses[i]
    } else if (category === 'actors' && r18JsonData.actors) {
      r18ItemData = r18JsonData.actors[i]
    } else if (category === 'directors' && r18JsonData.directors) {
      r18ItemData = r18JsonData.directors[0]
    }
    
    if (r18ItemData) {
      const { normalizeR18JapaneseName } = await import('../utils/japaneseNameNormalizer')
      const normalizedR18Data = normalizeR18JapaneseName(r18ItemData)
      
      // Use normalized English name if available (clean without aliases)
      if (normalizedR18Data.name) {
        nameToUse = normalizedR18Data.name
      }
    }
  } catch (error) {
    console.error('Error normalizing English name:', error)
  }
}
```

**Perbaikan:**
- Normalisasi English name dilakukan saat save movie untuk data R18
- Menggunakan `normalizedR18Data.name` yang sudah dibersihkan dari alias dalam kurung
- Field "Nama *" sekarang menampilkan "Meguri" tanpa alias dalam kurung
- Konsistensi dengan field lainnya yang sudah bersih

## Dokumentasi Lengkap

Untuk dokumentasi yang lebih komprehensif dan detail, silakan lihat:
- **[Comprehensive Alias Parsing Improvement](COMPREHENSIVE_ALIAS_PARSING_IMPROVEMENT.md)** - Dokumentasi lengkap dengan semua detail teknis
- **[Alias Parsing Quick Reference](ALIAS_PARSING_QUICK_REFERENCE.md)** - Referensi cepat untuk developer

## Testing

Untuk menguji perbaikan ini:

1. **Parse data R18** dengan aktris yang memiliki alias dalam kurung
2. **Periksa field nama** - pastikan tidak ada alias dalam kurung
3. **Periksa field alias** - pastikan hanya berisi nama English
4. **Periksa console log** untuk melihat proses normalisasi
5. **Verifikasi** bahwa data yang tersimpan bersih dan konsisten

## Expected Behavior

- **Field nama utama**: Bersih tanpa alias dalam kurung
- **Field alias**: Hanya berisi nama English yang dipisahkan koma
- **Data konsisten**: Semua field menggunakan data yang sudah dinormalisasi
- **Debug informatif**: Console log menampilkan proses parsing yang detail

Perbaikan ini memastikan bahwa data yang tersimpan bersih, konsisten, dan mudah dibaca oleh user.
