# Japanese Name Matching System

## Overview
Sistem Japanese name matching yang telah diperluas untuk mendukung semua jenis data (aktor, directors, movie title, series, label, studio) dengan kemampuan untuk memilih nama English yang lebih baik ketika ada perbedaan antara data yang di-parse dan database.

## Komponen Baru

### 1. JapaneseNameMatcher.tsx
Komponen universal untuk matching nama Japanese dan pemilihan nama English untuk semua jenis data:
- **Aktor/Actress**: Matching berdasarkan jpname, kanjiName, kanaName, alias
- **Directors**: Matching berdasarkan nama Japanese dan English
- **Studios**: Matching berdasarkan nama studio
- **Series**: Matching berdasarkan titleJp dan titleEn
- **Labels**: Matching berdasarkan nama label

**Fitur:**
- Tampilan side-by-side untuk memilih match Japanese dan English name
- Opsi untuk menggunakan nama dari database atau data yang di-parse
- Input custom untuk nama English
- Visual indicators untuk source data (Database vs Parsed Data)

### 2. MovieTitleMatcher.tsx
Komponen khusus untuk matching movie title:
- Matching berdasarkan titleJp dan titleEn
- Pemilihan English title yang lebih baik
- Support untuk movie code
- Interface yang dioptimalkan untuk movie titles

## Perubahan pada Sistem Existing

### 1. movieDataParser.ts
- **ParsedMovieData**: Ditambahkan field `label`
- **MatchedData**: Ditambahkan array `labels` dengan struktur yang sama seperti field lainnya
- **matchWithDatabase**: Ditambahkan logika matching untuk labels
- **convertToMovie**: Ditambahkan konversi label ke final movie
- **mergeMovieData**: Ditambahkan merge untuk label
- **parseMovieData**: Ditambahkan parsing untuk field "Label"

### 2. MovieDataParser.tsx
- **State Management**: Ditambahkan state untuk JapaneseNameMatcher dan MovieTitleMatcher
- **Handlers**: Ditambahkan handler untuk Japanese name matching
- **UI Updates**: 
  - Button "Japanese Name Match" menggantikan "View All Matches"
  - Support untuk label di semua bagian UI
  - Integration dengan komponen baru

## Cara Penggunaan

### 1. Parsing Data Movie
Ketika user paste data movie, sistem akan:
1. Parse semua field termasuk label
2. Match dengan database menggunakan Japanese name matching
3. Tampilkan hasil matching dengan opsi untuk memilih nama English yang lebih baik

### 2. Japanese Name Matching
Ketika ada multiple matches atau perbedaan English name:
1. Klik "Japanese Name Match" untuk membuka dialog
2. Pilih match Japanese yang benar di sisi kiri
3. Pilih nama English yang lebih baik di sisi kanan
4. Klik "Select" untuk mengkonfirmasi

### 3. English Name Selection
Sistem akan menampilkan:
- **Database Name**: Nama yang sudah ada di database
- **Parsed Name**: Nama dari data yang di-parse (JAVDB, dll)
- **Custom Input**: Opsi untuk memasukkan nama custom

## Struktur Data

### MatchedData Interface
```typescript
interface MatchedData {
  actresses: MatchedItem[]
  actors: MatchedItem[]
  directors: MatchedItem[]
  studios: MatchedItem[]
  series: MatchedItem[]
  labels: MatchedItem[] // Baru
}

interface MatchedItem {
  name: string
  parsedEnglishName?: string
  matched: MasterDataItem | null
  multipleMatches: MasterDataItem[]
  needsConfirmation: boolean
  customEnglishName?: string
  hasDifferentEnglishNames?: boolean
  needsEnglishNameSelection?: boolean
}
```

### ParsedMovieData Interface
```typescript
interface ParsedMovieData {
  // ... existing fields
  label?: string // Baru
}
```

## Keunggulan Sistem

1. **Universal**: Satu komponen untuk semua jenis data
2. **Flexible**: User bisa memilih nama English yang lebih baik
3. **Intuitive**: Interface yang mudah dipahami dengan visual indicators
4. **Comprehensive**: Mendukung semua field yang relevan
5. **Consistent**: Menggunakan pola yang sama untuk semua jenis data

## Future Enhancements

1. **AI Translation**: Integrasi dengan AI untuk suggest English names
2. **Bulk Matching**: Matching untuk multiple items sekaligus
3. **History**: Track perubahan nama untuk audit
4. **Validation**: Validasi nama untuk konsistensi
5. **Export**: Export matching results untuk review
