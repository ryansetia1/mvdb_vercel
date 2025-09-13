# Label Matching Enhancement

## Masalah yang Ditemukan
Label dari format R18.dev tidak memiliki sistem matching yang sama seperti director dan series, meskipun label juga memiliki field English dan Jepang yang perlu ditangani dengan enhanced matching logic.

## Root Cause Analysis

### 1. Missing Enhanced Matching Logic
**Masalah**: Label tidak memiliki enhanced matching logic seperti director dan series.

**Sebelumnya**:
- Label hanya menggunakan matching sederhana dengan satu nama
- Tidak ada fallback matching dengan variasi nama dari R18.dev
- Tidak ada debug logging khusus untuk label

### 2. Missing Label Info Storage
**Masalah**: Tidak ada penyimpanan informasi lengkap label dari R18.dev.

## Perbaikan yang Dilakukan

### 1. Added Label Info Storage
```typescript
// Additional label info from R18.dev
labelInfo?: {
  name_en?: string
  name_ja?: string
}
```

### 2. Enhanced Label Parsing
```typescript
// Label info from R18.dev
labelInfo: data.label_name_ja || data.label_name_en ? {
  name_en: data.label_name_en,
  name_ja: data.label_name_ja
} : undefined
```

### 3. Added Comprehensive Debug Logging
- Debug logging khusus untuk label matching
- Score analysis untuk semua candidates
- Detailed candidate information display

### 4. Enhanced Matching Logic
```typescript
// Try matching with all name variations from R18.dev
let matchResult = findMatches(parsedData.label, 'label')

// If no match found and we have R18.dev label info, try other name variations
if (!matchResult.matched && parsedData.labelInfo) {
  console.log('No match found with primary name, trying other variations...')
  
  // Try with English name
  if (parsedData.labelInfo.name_en && parsedData.labelInfo.name_en !== parsedData.label) {
    console.log('Trying with English name:', parsedData.labelInfo.name_en)
    const englishMatch = findMatches(parsedData.labelInfo.name_en, 'label')
    if (englishMatch.matched) {
      matchResult = englishMatch
      console.log('Found match with English name!')
    }
  }
  
  // Try with Japanese name (if different from primary)
  if (!matchResult.matched && parsedData.labelInfo.name_ja && parsedData.labelInfo.name_ja !== parsedData.label) {
    console.log('Trying with Japanese name:', parsedData.labelInfo.name_ja)
    const japaneseMatch = findMatches(parsedData.labelInfo.name_ja, 'label')
    if (japaneseMatch.matched) {
      matchResult = japaneseMatch
      console.log('Found match with Japanese name!')
    }
  }
}
```

### 5. Enhanced UI Display
- Menampilkan semua variasi nama label di Cast Details section
- Menampilkan nama yang digunakan untuk matching
- Debug information yang lebih lengkap

## Expected Behavior

### Untuk Label "S1 NO.1 STYLE":
1. **Parsing**: ✅ Extract "S1 NO.1 STYLE" dari `label_name_en`
2. **Database Search**: ✅ Mencari dengan nama English terlebih dahulu
3. **Fallback Matching**: ✅ Jika tidak ada match, coba dengan nama Jepang
4. **Field Matching**: ✅ Menggunakan field yang tepat (name, jpname, alias)
5. **Result**: ✅ Menampilkan match yang tepat atau "Not found in database"

### Data yang Diekstrak dari R18.dev:
```json
{
  "name_en": "S1 NO.1 STYLE",    // Nama English
  "name_ja": "S1 NO.1 STYLE"     // Nama Jepang
}
```

### Urutan Matching:
1. **Primary**: "S1 NO.1 STYLE" (English) - untuk matching dengan database
2. **Fallback**: "S1 NO.1 STYLE" (Japanese) - jika tidak ada match dengan English

## Database Field Mapping

### Label menggunakan field standar di database:
- `name`: General name field (score +60 exact, +30 contains)
- `jpname`: Japanese name field (score +100 exact, +50 contains)
- `alias`: Alias field (score +80 exact, +40 contains)

### Score Calculation untuk Label:
```typescript
// Exact matches get highest scores
if (candidate.jpname?.toLowerCase() === searchQuery) score += 100
if (candidate.alias?.toLowerCase() === searchQuery) score += 80
if (candidate.name?.toLowerCase() === searchQuery) score += 60

// Contains matches get lower scores
if (candidate.jpname?.toLowerCase().includes(searchQuery)) score += 50
if (candidate.alias?.toLowerCase().includes(searchQuery)) score += 40
if (candidate.name?.toLowerCase().includes(searchQuery)) score += 30
```

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
=== MATCHING LABEL ===
Searching for label: S1 NO.1 STYLE
Parsed English name: undefined
Label info from R18.dev: { name_en: "S1 NO.1 STYLE", name_ja: "S1 NO.1 STYLE" }
```

#### B. Database Matching Log
```
=== FIND MATCHES FOR LABEL ===
Searching for: S1 NO.1 STYLE
Candidates found: X
Candidate names: [...]
Candidate jpnames: [...]
Candidate aliases: [...]
```

#### C. Score Analysis
```
Label candidate: Name | JPName | Alias | Score: X
Label match found: Name | JPName | Alias | Score: X
```

#### D. Fallback Matching
```
No match found with primary name, trying other variations...
Trying with English name: S1 NO.1 STYLE
Trying with Japanese name: S1 NO.1 STYLE
Found match with Japanese name!
```

## Troubleshooting Steps

### 1. Jika Tidak Ada Candidates
- Periksa apakah ada label di database dengan type 'label'
- Periksa apakah masterData sudah ter-load dengan benar

### 2. Jika Ada Candidates Tapi Score Rendah
- Periksa apakah nama di database cocok dengan query
- Periksa field yang digunakan (name, jpname, alias)
- Periksa apakah ada masalah dengan case sensitivity

### 3. Jika Score Tinggi Tapi Tidak Match
- Periksa threshold (saat ini 30)
- Periksa logika multiple matches
- Periksa apakah ada masalah dengan sorting

## Files Modified

### 1. `src/utils/movieDataParser.ts`
- Added label info storage
- Enhanced matching logic dengan fallback
- Added debug logging untuk label matching
- Added score debugging untuk semua candidates

### 2. `src/components/MovieDataParser.tsx`
- Enhanced UI display untuk label information
- Menampilkan semua variasi nama label
- Updated data passing untuk label

### 3. Test Verification
- Created and ran test script untuk verify parsing logic
- Confirmed parsing works correctly

## Comparison dengan Director dan Series

### Similarities:
- ✅ Enhanced matching logic dengan fallback
- ✅ Comprehensive debug logging
- ✅ R18.dev data storage dan display
- ✅ Multiple name variations support

### Differences:
- **Field Mapping**: Label menggunakan field standar (name, jpname, alias) vs Series menggunakan field khusus (titleEn, titleJp)
- **Priority**: Label prioritas English name vs Director prioritas Japanese name
- **Score Calculation**: Label menggunakan scoring standar vs Series memiliki scoring khusus

## Next Steps

1. **Test dengan Data Real**: Gunakan data JSON dari r18.dev untuk test
2. **Check Database**: Pastikan ada label "S1 NO.1 STYLE" atau variasi namanya di database
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
- Pastikan field name, jpname, dan alias terisi dengan benar

### 4. Field Mapping
- Label menggunakan field standar (name, jpname, alias)
- Pastikan matching menggunakan field yang tepat
- Periksa apakah ada perbedaan antara name dan jpname
