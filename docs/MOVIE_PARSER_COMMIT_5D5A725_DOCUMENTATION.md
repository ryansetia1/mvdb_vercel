# Movie Parser Documentation - Commit 5d5a725e773c4beb34e82c3e5c09b4139726f432

**Commit Date**: September 13, 2025, 15:46:38 +0700  
**Author**: ryansetiawan <ryansetiawan.works@gmail.com>  
**Commit Message**: "Add keyboard navigation for pagination in FilteredCustomNavContent and FilteredMoviesContent components using global hook. Refactor pagination logic for clarity and maintainability."

## Overview

Pada commit ini, movie parser sudah memiliki struktur dasar yang solid dengan fitur-fitur parsing yang komprehensif. Meskipun commit ini fokus pada keyboard navigation untuk pagination, movie parser pada saat itu sudah memiliki kemampuan parsing yang lengkap.

## Movie Parser Architecture pada Commit 5d5a725

### 1. Core Components

#### MovieDataParser.tsx
- **Main Component**: Komponen utama untuk parsing data movie
- **State Management**: Menggunakan useState untuk mengelola berbagai state parsing
- **Props Interface**: 
  ```typescript
  interface MovieDataParserProps {
    accessToken: string
    onSave: (movie: Movie) => void
    onCancel: () => void
    existingMovie?: Movie
  }
  ```

#### movieDataParser.ts
- **Core Parsing Logic**: Berisi semua fungsi parsing dan matching
- **Data Structures**: Mendefinisikan interface untuk ParsedMovieData dan MatchedData

### 2. Data Structures

#### ParsedMovieData Interface
```typescript
export interface ParsedMovieData {
  code: string
  titleJp: string
  titleEn?: string
  releaseDate: string
  duration: string
  director: string
  studio: string
  series: string
  rating?: string
  actresses: string[]
  actors: string[]
  rawData: string
  dmcode?: string
}
```

#### MatchedData Interface
```typescript
export interface MatchedData {
  actresses: Array<{
    name: string
    matched: MasterDataItem | null
    multipleMatches: MasterDataItem[]
    needsConfirmation: boolean
  }>
  actors: Array<{...}>
  directors: Array<{...}>
  studios: Array<{...}>
  series: Array<{...}>
}
```

### 3. Key Features pada Commit Ini

#### A. Japanese Name Detection
- **Gender Detection**: Fungsi `detectJapaneseFemaleName()` untuk mendeteksi gender berdasarkan pola nama Jepang
- **Pattern Matching**: Menggunakan ending patterns untuk menentukan gender
- **Fallback Logic**: Default ke female untuk nama Jepang (karena sebagian besar aktris film dewasa adalah perempuan)

#### B. Parsing Capabilities
- **Multi-format Support**: Mendukung berbagai format input data
- **Structured Data Extraction**: Mengekstrak informasi seperti kode, judul, tanggal rilis, durasi, dll.
- **Actor/Actress Parsing**: Memisahkan aktor dan aktris berdasarkan gender detection

#### C. Database Matching
- **Master Data Integration**: Terintegrasi dengan master data API
- **Multiple Match Handling**: Menangani kasus dimana ada multiple matches
- **Confirmation System**: Sistem konfirmasi untuk match yang ambigu

### 4. State Management

#### Core States
```typescript
const [rawData, setRawData] = useState('')
const [parsedData, setParsedData] = useState<ParsedMovieData | null>(null)
const [matchedData, setMatchedData] = useState<MatchedData | null>(null)
const [masterData, setMasterData] = useState<MasterDataItem[]>([])
const [loading, setLoading] = useState(false)
const [error, setError] = useState('')
```

#### UI States
- `showMasterDataForm`: Untuk form tambah master data
- `showMultipleMatchSelector`: Untuk selector multiple matches
- `showDuplicateWarning`: Untuk warning duplikasi movie
- `mergeMode`: Untuk mode merge data

### 5. Integration Points

#### A. Master Data API
- Terintegrasi dengan `masterDataApi` untuk fetching dan matching data
- Support untuk actors, actresses, directors, studios, series

#### B. Movie API
- Terintegrasi dengan `movieApi` untuk operasi CRUD movie
- Support untuk duplicate checking dan movie creation

#### C. Translation API
- Terintegrasi dengan `deepseekTranslationApi` untuk AI translation
- Support untuk Japanese to English translation

### 6. UI Components

#### A. Core Components
- `MasterDataForm`: Form untuk menambah master data baru
- `MultipleMatchSelector`: Selector untuk multiple matches
- `DuplicateMovieWarning`: Warning untuk movie duplikat
- `AITranslationLoading`: Loading indicator untuk AI translation

#### B. Utility Components
- `ShimmerInput`: Input dengan shimmer effect
- `Brain`, `Clipboard`: Icons dari lucide-react

### 7. Workflow pada Commit Ini

1. **Input**: User paste data movie ke textarea
2. **Parsing**: Data di-parse menggunakan `parseMovieData()`
3. **Matching**: Data yang sudah di-parse di-match dengan master data
4. **Confirmation**: User konfirmasi matches yang ambigu
5. **Creation**: Movie baru dibuat dan disimpan

### 8. Notable Features

#### A. Gender Detection Logic
- Menggunakan pattern matching untuk nama Jepang
- Support untuk hiragana, katakana, dan kanji
- Fallback logic yang intelligent

#### B. Multiple Match Handling
- Sistem yang robust untuk handle multiple matches
- UI yang user-friendly untuk konfirmasi
- Integration dengan master data

#### C. Error Handling
- Comprehensive error handling
- User-friendly error messages
- Graceful degradation

### 9. Limitations pada Commit Ini

1. **No Data Source Detection**: Belum ada deteksi otomatis sumber data (JavDB vs R18)
2. **No Visual Indicators**: Belum ada indikator visual untuk format data
3. **Limited Format Support**: Mungkin belum support semua format data

### 10. Dependencies

- React dengan hooks (useState, useEffect, useRef)
- Lucide React untuk icons
- Sonner untuk toast notifications
- Custom hooks untuk template auto-apply

## Kesimpulan

Pada commit 5d5a725, movie parser sudah memiliki foundation yang solid dengan:
- Parsing logic yang comprehensive
- Database matching yang robust
- UI components yang well-structured
- Integration yang baik dengan berbagai APIs

Namun, belum memiliki fitur deteksi sumber data otomatis yang baru saja ditambahkan dalam implementasi terbaru. Commit ini menunjukkan evolusi yang baik dalam arsitektur dan functionality movie parser.
