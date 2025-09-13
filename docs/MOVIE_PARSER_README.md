# Movie Parser Documentation

## Overview
Movie Parser adalah sistem komprehensif untuk memproses data film dari berbagai sumber (JavDB, R18.dev, dll.) dan mencocokkannya dengan database MVDB. Sistem ini menangani parsing, matching, conflict resolution, dan data merging dengan UI yang user-friendly.

## Quick Start

### Basic Usage
```typescript
import { parseMovieData, matchMovieData, convertToMovie } from './utils/movieDataParser'

// Parse input data
const parsedData = parseMovieData(input, 'javdb')

// Match with database
const matchedData = matchMovieData(parsedData, masterData)

// Convert to movie format
const movieData = convertToMovie(parsedData, matchedData, ignoredItems)
```

### Component Usage
```typescript
import { MovieDataParser } from './components/MovieDataParser'

<MovieDataParser
  accessToken={accessToken}
  onSave={handleSave}
  onCancel={handleCancel}
  existingMovie={existingMovie}
/>
```

## Documentation Structure

### 📚 [Comprehensive Guide](./MOVIE_PARSER_COMPREHENSIVE_GUIDE.md)
**Untuk**: Developer yang ingin memahami sistem secara menyeluruh
**Berisi**:
- Arsitektur sistem
- Flow diagram
- Data structure
- Parsing process
- Matching logic
- Conflict resolution
- UI components
- Error handling
- Performance optimization
- Testing strategy
- Debugging guide
- Best practices
- Future improvements

### 🔧 [Technical Reference](./MOVIE_PARSER_TECHNICAL_REFERENCE.md)
**Untuk**: Developer yang perlu detail implementasi
**Berisi**:
- File structure
- Core functions
- API integration
- State management
- Error handling
- Performance optimization
- Testing
- Configuration
- Monitoring

### 🐛 [Troubleshooting Guide](./MOVIE_PARSER_TROUBLESHOOTING.md)
**Untuk**: Developer yang mengalami masalah atau bug
**Berisi**:
- Common error messages
- Detailed troubleshooting steps
- Debug tools
- Testing checklist
- Common patterns
- Quick fixes

### 💡 [Examples & Best Practices](./MOVIE_PARSER_EXAMPLES.md)
**Untuk**: Developer yang ingin contoh penggunaan
**Berisi**:
- Usage examples
- Best practices
- Common patterns
- Testing examples
- Code snippets

## Key Features

### ✅ Data Parsing
- **JavDB Format**: Parse data dari JavDB scraping
- **R18 JSON Format**: Parse data dari R18.dev API
- **Manual Input**: Parse data input manual
- **Auto Detection**: Deteksi otomatis format data

### ✅ Data Matching
- **Japanese Name Matching**: Matching nama Jepang dengan algoritma fuzzy
- **English Name Detection**: Deteksi otomatis nama Inggris
- **Romaji Conversion**: Konversi romaji ke hiragana/katakana
- **Alias Matching**: Matching dengan alias

### ✅ Conflict Resolution
- **Missing Data Detection**: Deteksi data yang hilang
- **English Name Conflicts**: Resolusi konflik nama Inggris
- **Merge Mode**: Mode untuk menggabungkan data
- **User Confirmation**: Konfirmasi user untuk konflik

### ✅ UI Components
- **MovieDataParser**: Komponen utama untuk parsing
- **JapaneseNameMatcher**: UI untuk matching nama Jepang
- **EnglishNameSelector**: UI untuk memilih nama Inggris
- **MasterDataForm**: Form untuk master data

## Common Issues & Solutions

### ❌ "Cannot read properties of null (reading 'kanjiName')"
**Cause**: `missingData` bernilai null
**Solution**: Gunakan optional chaining `?.`
```typescript
// Before
if (item.missingData.kanjiName) { ... }

// After
if (item.missingData?.kanjiName) { ... }
```

### ❌ Tombol "Choose English Name" masih muncul
**Cause**: Kondisi button visibility tidak tepat
**Solution**: Update kondisi untuk menggunakan `hasDifferentEnglishNames`
```typescript
// Before
(typeKey === 'directors' && item.matched && item.matched.name && item.matched.jpname && item.matched.name !== item.matched.jpname)

// After
(typeKey === 'directors' && item.hasDifferentEnglishNames)
```

### ❌ "Data yang belum ada di database" masih muncul untuk series
**Cause**: Missing data section ditampilkan untuk series
**Solution**: Tambahkan kondisi `typeKey !== 'series'`
```typescript
// Before
{item.missingData && (

// After
{item.missingData && typeKey !== 'series' && (
```

## Architecture Overview

```
Input Data → Parse → Match → Conflict Resolution → User Confirmation → Save
     ↓         ↓       ↓           ↓                    ↓              ↓
  JavDB/    Parsed   Matched   Conflicts          UI Components   Database
   R18      Data     Data      Detection
```

## Data Flow

1. **Input**: User memasukkan data film
2. **Parse**: Sistem parse data sesuai format
3. **Match**: Sistem match dengan database
4. **Detect Conflicts**: Sistem deteksi konflik dan missing data
5. **User Confirmation**: User konfirmasi atau pilih opsi
6. **Save**: Sistem simpan data ke database

## Performance Tips

### 🚀 Optimization
- Gunakan `useMemo` untuk expensive calculations
- Gunakan `useDebounce` untuk input changes
- Cache master data untuk mengurangi API calls
- Lazy load data ketika diperlukan

### 📊 Monitoring
- Monitor parsing time
- Monitor matching performance
- Monitor error rates
- Monitor user interactions

## Testing Strategy

### 🧪 Unit Tests
- Test parsing functions
- Test matching algorithms
- Test conflict resolution
- Test data conversion

### 🔗 Integration Tests
- Test end-to-end flow
- Test API integration
- Test database integration
- Test error handling

### 🎯 E2E Tests
- Test user interactions
- Test complete workflows
- Test error scenarios
- Test performance

## Contributing

### 📝 Code Standards
- Gunakan TypeScript dengan strict mode
- Follow naming conventions
- Add proper error handling
- Write comprehensive tests
- Update documentation

### 🐛 Bug Reports
- Gunakan [Troubleshooting Guide](./MOVIE_PARSER_TROUBLESHOOTING.md)
- Include error messages
- Include steps to reproduce
- Include system information

### 💡 Feature Requests
- Jelaskan use case
- Jelaskan expected behavior
- Jelaskan impact
- Jelaskan implementation approach

## Support

### 📖 Documentation
- [Comprehensive Guide](./MOVIE_PARSER_COMPREHENSIVE_GUIDE.md)
- [Technical Reference](./MOVIE_PARSER_TECHNICAL_REFERENCE.md)
- [Troubleshooting Guide](./MOVIE_PARSER_TROUBLESHOOTING.md)
- [Examples & Best Practices](./MOVIE_PARSER_EXAMPLES.md)

### 🔍 Debug Tools
- Console logging
- Debug UI components
- Performance monitoring
- Error tracking

### 🆘 Getting Help
1. Check documentation
2. Check troubleshooting guide
3. Check examples
4. Check error logs
5. Ask for help

---

*Dokumentasi ini dibuat untuk membantu developer memahami, menggunakan, dan memelihara sistem Movie Parser. Update dokumentasi ini ketika ada perubahan signifikan pada sistem.*
