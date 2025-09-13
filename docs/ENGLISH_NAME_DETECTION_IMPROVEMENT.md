# English Name Detection Improvement

## Perubahan yang Dibuat

### Masalah Sebelumnya
Sistem deteksi perbedaan English name hanya menggunakan `name_en` dari data R18.dev, sehingga ketika field `name_en` tidak tersedia (seperti pada aktris "Tia" dalam contoh JSON), sistem tidak dapat mendeteksi perbedaan English name dengan database.

### Solusi yang Diimplementasikan
Menggunakan `name_romaji` sebagai fallback English name untuk aktris, aktor, dan director ketika `name_en` tidak tersedia.

### Perubahan Kode

#### 1. Interface R18JsonData
```typescript
directors: Array<{
  id: number
  name_kana: string
  name_kanji: string
  name_romaji: string
  name_en?: string  // Ditambahkan field optional
}>
```

#### 2. Interface ParsedMovieData
```typescript
directorInfo?: {
  name_romaji?: string
  name_kanji?: string
  name_kana?: string
  name_en?: string  // Ditambahkan field optional
}
```

#### 3. Logika Deteksi English Name untuk Actresses
```typescript
// Sebelum: hanya menggunakan name_en
if (matchResult.matched && r18ActressData?.name_en) {
  const r18EnglishName = r18ActressData.name_en.toLowerCase().trim()
  // ...
}

// Sesudah: menggunakan name_en atau name_romaji sebagai fallback
if (matchResult.matched && r18ActressData) {
  const r18EnglishName = r18ActressData.name_en || r18ActressData.name_romaji
  if (r18EnglishName) {
    const r18EngName = r18EnglishName.toLowerCase().trim()
    // ...
  }
}
```

#### 4. Logika Deteksi English Name untuk Actors
Perubahan yang sama seperti actresses.

#### 5. Logika Deteksi English Name untuk Directors
Perubahan yang sama seperti actresses dan actors.

#### 6. Parsing R18.dev Data untuk Directors
```typescript
directorInfo: data.directors.length > 0 ? {
  name_romaji: data.directors[0].name_romaji,
  name_kanji: data.directors[0].name_kanji,
  name_kana: data.directors[0].name_kana,
  name_en: data.directors[0].name_en  // Ditambahkan
} : undefined,
```

#### 7. Detect Missing Data
```typescript
// Sebelum: hanya menggunakan name_en
if (r18Data.name_en && !matchedItem.name) {
  missingData.name = r18Data.name_en
}

// Sesudah: menggunakan name_en atau name_romaji sebagai fallback
const englishName = r18Data.name_en || r18Data.name_romaji
if (englishName && !matchedItem.name) {
  missingData.name = englishName
}
```

### Hasil Test

#### Test Case 1: Actress "Tia" (tanpa name_en)
- **R18 Data**: `name_romaji: "Tia"`
- **Database**: `"Tia"`
- **Hasil**: ✅ NAMES MATCH - No selection needed

#### Test Case 2: Actress "Tia" dengan database berbeda
- **R18 Data**: `name_romaji: "Tia"`
- **Database**: `"Tia Chan"`
- **Hasil**: ✅ NEEDS ENGLISH NAME SELECTION
- **Available options**: `["Tia Chan", "Tia"]`

#### Test Case 3: Director dengan name_en
- **R18 Data**: `name_en: "Pochomquin"`
- **Database**: `"Potemkin"`
- **Hasil**: ✅ NEEDS ENGLISH NAME SELECTION
- **Available options**: `["Potemkin", "Pochomquin"]`

#### Test Case 4: Director tanpa name_en (MASALAH YANG DIPERBAIKI)
- **R18 Data**: `name_romaji: "pochomquin"`
- **Database**: `"Potemkin"`
- **Hasil**: ✅ NEEDS ENGLISH NAME SELECTION
- **Available options**: `["Potemkin", "pochomquin"]`

### Masalah yang Diperbaiki

**Masalah**: Sistem tidak mendeteksi perbedaan English name untuk director karena `parsedEnglishNames.directors[0]` selalu `undefined`, sehingga logika deteksi tidak berjalan.

**Solusi**: Menambahkan logging yang lebih detail dan memastikan logika deteksi R18.dev data berjalan dengan benar untuk director, bahkan ketika `parsedEnglishName` tidak tersedia.

### Keuntungan Perubahan

1. **Cakupan Lebih Luas**: Sistem sekarang dapat mendeteksi perbedaan English name bahkan ketika `name_en` tidak tersedia
2. **Konsistensi**: Menggunakan fallback yang konsisten untuk semua kategori:
   - **Actress/Actor/Director**: `name_en` → `name_romaji`
   - **Studio/Series/Label**: `name_en` → `name_ja`
   - **Movie Title**: `title_en` (sudah ada)
3. **Logging yang Lebih Baik**: Menambahkan informasi source dalam log untuk debugging
4. **Backward Compatibility**: Tidak merusak fungsionalitas yang sudah ada
5. **Dukungan Lengkap**: Semua kategori sekarang mendukung deteksi perbedaan English name

### Contoh JSON yang Sekarang Didukung

```json
{
  "actresses": [
    {
      "name_romaji": "Tia",
      "name_kanji": "ティア",
      "name_kana": "てぃあ"
      // Tidak ada name_en, tapi sistem akan menggunakan name_romaji
    }
  ],
  "directors": [
    {
      "name_romaji": "pochomquin",
      "name_kanji": "ポチョムキン",
      "name_kana": "ぽちょむきん"
      // Tidak ada name_en, tapi sistem akan menggunakan name_romaji
    }
  ]
}
```

Sistem sekarang akan mendeteksi perbedaan English name dengan database menggunakan fallback yang sesuai untuk setiap kategori ketika `name_en` tidak tersedia.

## Dukungan Lengkap Semua Kategori

### ✅ Kategori yang Sudah Didukung

1. **Actress** - Menggunakan `name_en` → `name_romaji` sebagai fallback
2. **Actor** - Menggunakan `name_en` → `name_romaji` sebagai fallback  
3. **Director** - Menggunakan `name_en` → `name_romaji` sebagai fallback
4. **Studio** - Menggunakan `name_en` → `name_ja` sebagai fallback
5. **Series** - Menggunakan `name_en` → `name_ja` sebagai fallback
6. **Label** - Menggunakan `name_en` → `name_ja` sebagai fallback
7. **Movie Title** - Menggunakan `title_en` (sudah ada sebelumnya)

### ✅ Hasil Test Komprehensif

Test menunjukkan bahwa sistem sekarang dapat mendeteksi perbedaan English name untuk semua kategori:

- **Actress**: "Tia" (R18) vs "Tia Chan" (DB) → ✅ NEEDS SELECTION
- **Actor**: "John" (R18) vs "John Smith" (DB) → ✅ NEEDS SELECTION  
- **Director**: "pochomquin" (R18) vs "Potemkin" (DB) → ✅ NEEDS SELECTION
- **Studio**: "S1 NO.1 STYLE" (R18) vs "S1 No.1 Style" (DB) → ✅ NO SELECTION (sama setelah normalisasi)
- **Series**: "Love - Dirty Man" (R18) vs "Love Dirty Man" (DB) → ✅ NO SELECTION (sama setelah normalisasi)
- **Label**: "S1 NO.1 STYLE" (R18) vs "S1 No.1 Style" (DB) → ✅ NO SELECTION (sama setelah normalisasi)
- **Movie Title**: "Gross Guys on Hot Babes!" (R18) vs "Gross Guys on Hot Babes!" (DB) → ✅ NO SELECTION (sama)

### ✅ Fitur yang Tersedia

- **Deteksi Otomatis**: Sistem otomatis mendeteksi perbedaan English name
- **Pilihan Multiple**: User dapat memilih antara English name dari database atau R18.dev data
- **Logging Detail**: Informasi source (name_en, name_romaji, name_ja) ditampilkan dalam log
- **Normalisasi**: Perbedaan minor seperti kapitalisasi, dash, dan spasi diabaikan
- **Fallback Konsisten**: Setiap kategori menggunakan fallback yang sesuai dengan konteksnya
