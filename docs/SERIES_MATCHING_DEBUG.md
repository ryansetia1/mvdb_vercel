# Series Matching Debug Guide

## Masalah yang Ditemukan
Series dari format R18.dev tidak terdeteksi di database meskipun ada data nama English dan Jepangnya.

## Root Cause Analysis

### 1. Parsing Issue (FIXED)
**Masalah**: Series parsing sudah benar menggunakan prioritas English name, tetapi tidak ada enhanced matching logic seperti director.

**Data dari R18.dev**:
```json
{
  "series_name_en": "Love - Dirty Man",
  "series_name_ja": "ラブ◆キモメン"
}
```

**Parsing Logic**:
```typescript
// Sudah benar - prioritas English name
series: data.series_name_en || data.series_name_ja || '',
```

### 2. Enhanced Matching Logic (NEW)
**Masalah**: Hanya mencoba matching dengan satu nama saja.
**Solusi**: Mencoba matching dengan semua variasi nama dari R18.dev:
1. Primary: nama English ("Love - Dirty Man")
2. Fallback: nama Jepang ("ラブ◆キモメン")

### 3. Database Field Mapping
**Series menggunakan field khusus di database**:
- `titleEn`: English title
- `titleJp`: Japanese title  
- `name`: General name field
- `jpname`: Japanese name field
- `alias`: Alias field

**Score Calculation untuk Series**:
```typescript
if (candidate.type === 'series') {
  if (candidate.titleEn?.toLowerCase() === searchQuery) score += 60
  if (candidate.titleJp?.toLowerCase() === searchQuery) score += 100
  if (candidate.titleEn?.toLowerCase().includes(searchQuery)) score += 30
  if (candidate.titleJp?.toLowerCase().includes(searchQuery)) score += 50
}
```

## Perbaikan yang Dilakukan

### 1. Added Series Info Storage
```typescript
// Menyimpan semua variasi nama series
seriesInfo: data.series_name_ja || data.series_name_en ? {
  name_en: data.series_name_en,
  name_ja: data.series_name_ja
} : undefined
```

### 2. Enhanced Matching Logic
```typescript
// Try matching with all name variations from R18.dev
let matchResult = findMatches(parsedData.series, 'series')

// If no match found and we have R18.dev series info, try other name variations
if (!matchResult.matched && parsedData.seriesInfo) {
  // Try with English name
  if (parsedData.seriesInfo.name_en && parsedData.seriesInfo.name_en !== parsedData.series) {
    const englishMatch = findMatches(parsedData.seriesInfo.name_en, 'series')
    if (englishMatch.matched) {
      matchResult = englishMatch
    }
  }
  
  // Try with Japanese name
  if (!matchResult.matched && parsedData.seriesInfo.name_ja && parsedData.seriesInfo.name_ja !== parsedData.series) {
    const japaneseMatch = findMatches(parsedData.seriesInfo.name_ja, 'series')
    if (japaneseMatch.matched) {
      matchResult = japaneseMatch
    }
  }
}
```

### 3. Added Comprehensive Debug Logging
- Debug logging khusus untuk series matching
- Score analysis untuk semua candidates
- Detailed candidate information display

### 4. Enhanced UI Display
- Menampilkan semua variasi nama series di Cast Details section
- Menampilkan nama yang digunakan untuk matching
- Debug information yang lebih lengkap

## Cara Debugging

### 1. Buka Browser Console
1. Buka aplikasi di http://localhost:3002/
2. Buka Developer Tools (F12)
3. Buka tab Console

### 2. Test dengan Data R18.dev
1. Copy data JSON dari r18.dev (contoh dari datadumps/r18_json_format.json)
2. Paste ke Movie Data Parser
3. Klik "Parse Data"
4. Lihat console log untuk debugging

### 3. Yang Perlu Diperhatikan di Console Log

#### A. Parsing Log
```
=== MATCHING SERIES ===
Searching for series: Love - Dirty Man
Parsed English name: undefined
Series info from R18.dev: { name_en: "Love - Dirty Man", name_ja: "ラブ◆キモメン" }
```

#### B. Database Matching Log
```
=== FIND MATCHES FOR SERIES ===
Searching for: Love - Dirty Man
Candidates found: X
Candidate names: [...]
Candidate jpnames: [...]
Candidate titleEn: [...]
Candidate titleJp: [...]
Candidate aliases: [...]
```

#### C. Score Analysis
```
Series candidate: Name | JPName | TitleEn | TitleJp | Alias | Score: X
Series match found: Name | JPName | TitleEn | TitleJp | Alias | Score: X
```

#### D. Fallback Matching
```
No match found with primary name, trying other variations...
Trying with English name: Love - Dirty Man
Trying with Japanese name: ラブ◆キモメン
Found match with Japanese name!
```

## Expected Behavior

### Untuk Series "Love - Dirty Man":
1. **Parsing**: ✅ Extract "Love - Dirty Man" dari `series_name_en`
2. **Database Search**: ✅ Mencari di semua series candidates dengan nama English
3. **Fallback Matching**: ✅ Jika tidak ada match dengan English, coba dengan "ラブ◆キモメン" (Japanese)
4. **Result**: ✅ Menampilkan match yang tepat atau "Not found in database"

### Data yang Diekstrak dari R18.dev:
```json
{
  "name_en": "Love - Dirty Man",    // Nama English
  "name_ja": "ラブ◆キモメン"         // Nama Jepang
}
```

### Urutan Matching:
1. **Primary**: "Love - Dirty Man" (English) - untuk matching dengan database
2. **Fallback**: "ラブ◆キモメン" (Japanese) - jika tidak ada match dengan English

## Troubleshooting Steps

### 1. Jika Tidak Ada Candidates
- Periksa apakah ada series di database dengan type 'series'
- Periksa apakah masterData sudah ter-load dengan benar

### 2. Jika Ada Candidates Tapi Score Rendah
- Periksa apakah nama di database cocok dengan query
- Periksa field yang digunakan (titleEn, titleJp, name, jpname, alias)
- Periksa apakah ada masalah dengan case sensitivity

### 3. Jika Score Tinggi Tapi Tidak Match
- Periksa threshold (saat ini 30)
- Periksa logika multiple matches
- Periksa apakah ada masalah dengan sorting

## Files Modified

### 1. `src/utils/movieDataParser.ts`
- Added series info storage
- Enhanced matching logic dengan fallback
- Added debug logging untuk series matching
- Added score debugging untuk semua candidates

### 2. `src/components/MovieDataParser.tsx`
- Enhanced UI display untuk series information
- Menampilkan semua variasi nama series

### 3. Test Verification
- Created and ran test script untuk verify parsing logic
- Confirmed parsing works correctly

## Next Steps

1. **Test dengan Data Real**: Gunakan data JSON dari r18.dev untuk test
2. **Check Database**: Pastikan ada series "Love - Dirty Man" atau variasi namanya di database
3. **Verify Matching**: Pastikan matching logic bekerja dengan benar
4. **Remove Debug Logs**: Setelah masalah teratasi, hapus debug logging yang tidak perlu

## Common Issues

### 1. Case Sensitivity
- Semua matching menggunakan `.toLowerCase()`
- Pastikan tidak ada masalah dengan karakter khusus

### 2. Threshold Too High
- Saat ini threshold adalah 30
- Jika perlu, bisa diturunkan ke 20 atau 10

### 3. Database Data Quality
- Pastikan data di database konsisten
- Periksa apakah ada duplikasi atau inkonsistensi nama
- Pastikan field titleEn dan titleJp terisi dengan benar

### 4. Field Mapping
- Series menggunakan field khusus (titleEn, titleJp)
- Pastikan matching menggunakan field yang tepat
- Periksa apakah ada perbedaan antara name dan titleEn/titleJp
