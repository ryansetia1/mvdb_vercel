# Movie Parser Comprehensive Guide

## Overview
Movie Parser adalah sistem yang memproses data film dari berbagai sumber (JavDB, R18.dev, dll.) dan mencocokkannya dengan database MVDB. Sistem ini menangani parsing, matching, dan merging data dengan berbagai konflik yang mungkin terjadi.

## Arsitektur Sistem

### Komponen Utama
1. **MovieDataParser.tsx** - Komponen UI utama untuk parsing dan konfirmasi
2. **movieDataParser.ts** - Logic utama untuk parsing dan matching data
3. **JapaneseNameMatcher.tsx** - Komponen untuk matching nama Jepang
4. **EnglishNameSelector.tsx** - Komponen untuk memilih nama Inggris

### Flow Diagram
```
Input Data (JavDB/R18) → Parse Data → Match with Database → Handle Conflicts → User Confirmation → Save to Database
```

## Data Structure

### ParsedData Interface
```typescript
interface ParsedData {
  title: string
  titleJp?: string
  actresses: string[]
  actors: string[]
  director: string
  studio: string
  series?: string
  label?: string
  releaseDate: string
  duration: number
  coverUrl?: string
  galleryUrls?: string[]
  // R18.dev specific data
  actressInfo?: any[]
  actorInfo?: any[]
  directorInfo?: any
  studioInfo?: any
  seriesInfo?: any
  labelInfo?: any
}
```

### MatchedData Interface
```typescript
interface MatchedData {
  actresses: MatchedItem[]
  actors: MatchedItem[]
  directors: MatchedItem[]
  studios: MatchedItem[]
  series: MatchedItem[]
  labels: MatchedItem[]
}

interface MatchedItem {
  name: string
  parsedName: string
  parsedEnglishName?: string
  matched: MasterDataItem | null
  missingData?: {
    kanjiName?: string
    kanaName?: string
    alias?: string
    birthdate?: string
    tags?: string
    titleJp?: string
    name?: string
  }
  hasDifferentEnglishNames?: boolean
  needsEnglishNameSelection?: boolean
  availableEnglishNames?: string[]
  shouldUpdateData: boolean
  customEnglishName?: string
}
```

## Parsing Process

### 1. Data Input
- **JavDB**: Data dari scraping atau copy-paste
- **R18.dev**: Data dari API atau JSON format
- **Manual**: Input manual dari user

### 2. Data Parsing (`parseMovieData`)
```typescript
// Fungsi utama untuk parsing
export function parseMovieData(input: string, source: 'javdb' | 'r18' | 'manual'): ParsedData
```

**Proses Parsing:**
1. **Deteksi Source**: Menentukan apakah input dari JavDB, R18, atau manual
2. **Extract Fields**: Mengekstrak field-field seperti title, actresses, director, dll.
3. **Clean Data**: Membersihkan dan memformat data
4. **Validate**: Memvalidasi data yang diperlukan

### 3. Data Matching (`matchMovieData`)
```typescript
// Fungsi untuk mencocokkan data dengan database
export function matchMovieData(parsedData: ParsedData, masterData: MasterData): MatchedData
```

**Proses Matching:**
1. **Actress Matching**: Mencocokkan aktris dengan database
2. **Actor Matching**: Mencocokkan aktor dengan database
3. **Director Matching**: Mencocokkan sutradara dengan database
4. **Studio Matching**: Mencocokkan studio dengan database
5. **Series Matching**: Mencocokkan series dengan database
6. **Label Matching**: Mencocokkan label dengan database

## Matching Logic

### Japanese Name Matching
```typescript
// Fungsi untuk matching nama Jepang
function findJapaneseMatch(searchName: string, masterData: MasterDataItem[]): MatchResult
```

**Strategi Matching:**
1. **Exact Match**: Pencocokan persis
2. **Fuzzy Match**: Pencocokan dengan toleransi kesalahan
3. **Romaji Conversion**: Konversi romaji ke hiragana/katakana
4. **Alias Matching**: Pencocokan dengan alias

### English Name Detection
```typescript
// Fungsi untuk mendeteksi nama Inggris
function detectEnglishName(name: string): boolean
```

**Kriteria Nama Inggris:**
- Menggunakan karakter Latin (A-Z, a-z)
- Tidak mengandung karakter Jepang (Hiragana, Katakana, Kanji)
- Panjang minimal 2 karakter

## Conflict Resolution

### 1. Missing Data Detection
```typescript
// Fungsi untuk mendeteksi data yang hilang
function detectMissingData(matchedItem: MasterDataItem | null, parsedName: string, type: string, parsedEnglishName?: string, r18Data?: any): any
```

**Data yang Dicek:**
- **Kanji Name**: Nama dalam kanji yang belum ada
- **Kana Name**: Nama dalam hiragana yang belum ada
- **Alias**: Alias yang belum ada
- **Birthdate**: Tanggal lahir yang belum ada
- **Tags**: Tag yang belum ada
- **English Name**: Nama Inggris yang belum ada

### 2. English Name Conflicts
```typescript
// Deteksi konflik nama Inggris
function detectEnglishNameConflicts(matchedItem: MasterDataItem, parsedEnglishName?: string, r18Data?: any): ConflictInfo
```

**Jenis Konflik:**
- **Different Names**: Nama berbeda antara parsed dan database
- **Missing English Name**: Database tidak memiliki nama Inggris
- **Multiple Sources**: Nama dari berbagai sumber berbeda

### 3. Merge Mode
```typescript
// Mode untuk menggabungkan data
interface MergeMode {
  isActive: boolean
  conflicts: ConflictItem[]
}
```

**Proses Merge:**
1. **Update Master Data**: Update data master dengan data yang hilang
2. **Resolve Conflicts**: Menyelesaikan konflik nama
3. **Create Movie**: Membuat data film baru

## UI Components

### MovieDataParser Component
```typescript
// Komponen utama untuk parsing
export function MovieDataParser({ accessToken, onSave, onCancel, existingMovie }: MovieDataParserProps)
```

**Fitur:**
- **Input Area**: Area untuk input data film
- **Parsed Data Display**: Tampilan data yang sudah di-parse
- **Matched Items**: Tampilan item yang sudah di-match
- **Conflict Resolution**: UI untuk menyelesaikan konflik
- **Save/Cancel**: Tombol untuk menyimpan atau membatalkan

### JapaneseNameMatcher Component
```typescript
// Komponen untuk matching nama Jepang
export function JapaneseNameMatcher({ isOpen, onClose, onSelect, matches, searchName, type, parsedEnglishName, availableEnglishNames, title }: JapaneseNameMatcherProps)
```

**Fitur:**
- **Match Selection**: Pilihan match yang tersedia
- **English Name Selection**: Pilihan nama Inggris
- **Preview**: Preview data yang akan disimpan

### EnglishNameSelector Component
```typescript
// Komponen untuk memilih nama Inggris
export function EnglishNameSelector({ isOpen, onClose, onSelect, matches, searchName, type, parsedEnglishName }: EnglishNameSelectorProps)
```

**Fitur:**
- **Multiple Options**: Beberapa pilihan nama Inggris
- **Source Information**: Informasi sumber nama
- **Selection**: Pilihan nama yang akan digunakan

## Error Handling

### Common Errors
1. **"Cannot read properties of null"**: Terjadi ketika `missingData` bernilai null
2. **"Match not found"**: Ketika tidak ada match yang ditemukan
3. **"Invalid data format"**: Ketika format data tidak valid

### Error Prevention
```typescript
// Menggunakan optional chaining untuk mencegah null reference
if (item.missingData?.kanjiName) {
  updateData.kanjiName = item.missingData.kanjiName
}
```

## Performance Optimization

### Caching Strategy
- **Master Data Cache**: Cache data master untuk mengurangi API calls
- **Match Results Cache**: Cache hasil matching untuk data yang sama
- **Lazy Loading**: Load data secara bertahap

### Memory Management
- **Cleanup**: Membersihkan data yang tidak digunakan
- **Debouncing**: Menunda operasi yang tidak perlu
- **Throttling**: Membatasi frekuensi operasi

## Testing Strategy

### Unit Tests
- **Parsing Functions**: Test fungsi parsing
- **Matching Functions**: Test fungsi matching
- **Conflict Resolution**: Test resolusi konflik

### Integration Tests
- **End-to-End**: Test alur lengkap dari input sampai save
- **API Integration**: Test integrasi dengan API
- **Database Integration**: Test integrasi dengan database

## Debugging Guide

### Debug Information
```typescript
// Debug info untuk English name selection
{(typeKey === 'directors' || typeKey === 'series') && (
  <div className="text-xs text-gray-500 mt-1">
    showButton={showButton ? 'true' : 'false'},
    condition1={item.needsEnglishNameSelection ? 'true' : 'false'},
    condition2={(item.availableEnglishNames && item.availableEnglishNames.length > 0) ? 'true' : 'false'},
    condition3={typeKey === 'directors' ? (item.matched && item.matched.name && item.matched.jpname && item.matched.name !== item.matched.jpname ? 'true' : 'false') : (item.matched && item.matched.name && item.matched.titleJp && item.matched.name !== item.matched.titleJp ? 'true' : 'false')},
    condition4={typeKey === 'directors' ? (item.matched && item.matched.name && item.parsedEnglishName && item.matched.name !== item.parsedEnglishName ? 'true' : 'false') : (item.matched && item.matched.name && item.parsedEnglishName && item.matched.name !== item.parsedEnglishName ? 'true' : 'false')},
    hasCustomName={item.customEnglishName ? 'true' : 'false'}
  </div>
)}
```

### Common Issues
1. **Button Still Showing**: Cek kondisi `hasDifferentEnglishNames`
2. **Missing Data Still Showing**: Cek kondisi `typeKey !== 'series'`
3. **Match Not Working**: Cek fungsi `findJapaneseMatch`

## Best Practices

### Code Organization
- **Separation of Concerns**: Pisahkan logic parsing, matching, dan UI
- **Type Safety**: Gunakan TypeScript interfaces dengan ketat
- **Error Handling**: Handle semua kemungkinan error
- **Performance**: Optimasi untuk data besar

### User Experience
- **Clear Feedback**: Berikan feedback yang jelas ke user
- **Progressive Disclosure**: Tampilkan informasi secara bertahap
- **Error Recovery**: Berikan cara untuk recover dari error
- **Accessibility**: Pastikan UI accessible

## Future Improvements

### Planned Features
1. **Batch Processing**: Proses multiple movies sekaligus
2. **AI Integration**: Gunakan AI untuk matching yang lebih akurat
3. **Real-time Sync**: Sync data secara real-time
4. **Advanced Filtering**: Filter yang lebih advanced

### Technical Debt
1. **Code Refactoring**: Refactor kode yang kompleks
2. **Performance Optimization**: Optimasi performa lebih lanjut
3. **Test Coverage**: Tingkatkan coverage test
4. **Documentation**: Update dokumentasi secara berkala

## Troubleshooting Checklist

### When Parser Fails
1. ✅ Check input format
2. ✅ Check network connection
3. ✅ Check API keys
4. ✅ Check database connection
5. ✅ Check error logs

### When Matching Fails
1. ✅ Check master data availability
2. ✅ Check name format
3. ✅ Check matching algorithm
4. ✅ Check conflict resolution
5. ✅ Check user permissions

### When Save Fails
1. ✅ Check data validation
2. ✅ Check database constraints
3. ✅ Check API response
4. ✅ Check error handling
5. ✅ Check rollback mechanism

---

*Dokumentasi ini dibuat untuk membantu developer memahami dan memelihara sistem Movie Parser. Update dokumentasi ini ketika ada perubahan signifikan pada sistem.*
