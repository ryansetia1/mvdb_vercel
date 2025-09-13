# Director Matching Debug Guide

## Masalah yang Ditemukan
Director "pochomquin" dari format R18.dev tidak terdeteksi di database meskipun ada data nama Jepangnya.

## Root Cause Analysis

### 1. Parsing Issue (FIXED)
**Masalah**: Di `parseR18JsonData()`, director menggunakan `name_romaji` yang sebenarnya adalah nama English, bukan nama Jepang.
```typescript
// SEBELUM (SALAH) - menggunakan name_romaji yang adalah nama English
director: data.directors.length > 0 ? data.directors[0].name_romaji : '',

// SESUDAH (BENAR) - prioritas nama Jepang (kanji/kana) baru romaji
director: data.directors.length > 0 ? (data.directors[0].name_kanji || data.directors[0].name_kana || data.directors[0].name_romaji) : '',
```

**Solusi**: Menggunakan prioritas nama Jepang (kanji/kana) terlebih dahulu, baru fallback ke romaji.

### 2. Enhanced Matching Logic (NEW)
**Masalah**: Hanya mencoba matching dengan satu nama saja.
**Solusi**: Mencoba matching dengan semua variasi nama dari R18.dev:
1. Primary: nama Jepang (kanji/kana)
2. Fallback 1: nama romaji (English)
3. Fallback 2: nama kana

### 3. Debug Logging Added
Menambahkan debug logging khusus untuk director matching:

```typescript
// Debug logging untuk director matching
if (type === 'director') {
  console.log('=== FIND MATCHES FOR DIRECTOR ===')
  console.log('Searching for:', name)
  console.log('Candidates found:', candidates.length)
  console.log('Candidate names:', candidates.map(c => c.name).filter(Boolean))
  console.log('Candidate jpnames:', candidates.map(c => c.jpname).filter(Boolean))
  console.log('Candidate kanjiNames:', candidates.map(c => c.kanjiName).filter(Boolean))
  console.log('Candidate kanaNames:', candidates.map(c => c.kanaName).filter(Boolean))
  console.log('Candidate aliases:', candidates.map(c => c.alias).filter(Boolean))
}
```

### 3. Score Debugging
Menambahkan logging untuk melihat score semua candidates, termasuk yang tidak memenuhi threshold:

```typescript
// Debug logging for director - show all scores
if (type === 'director') {
  console.log('Director candidate:', candidate.name, '|', candidate.jpname, '|', candidate.kanjiName, '|', candidate.kanaName, '|', candidate.alias, 'Score:', score)
}
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
=== MATCHING DIRECTOR ===
Searching for director: pochomquin
Parsed English name: undefined
```

#### B. Database Matching Log
```
=== FIND MATCHES FOR DIRECTOR ===
Searching for: pochomquin
Candidates found: X
Candidate names: [...]
Candidate jpnames: [...]
Candidate kanjiNames: [...]
Candidate kanaNames: [...]
Candidate aliases: [...]
```

#### C. Score Analysis
```
Director candidate: Name | JPName | KanjiName | KanaName | Alias | Score: X
Director match found: Name | JPName | KanjiName | KanaName | Alias | Score: X
```

## Troubleshooting Steps

### 1. Jika Tidak Ada Candidates
- Periksa apakah ada director di database dengan type 'director'
- Periksa apakah masterData sudah ter-load dengan benar

### 2. Jika Ada Candidates Tapi Score Rendah
- Periksa apakah nama di database cocok dengan query
- Periksa apakah ada masalah dengan case sensitivity
- Periksa apakah ada karakter khusus yang mengganggu matching

### 3. Jika Score Tinggi Tapi Tidak Match
- Periksa threshold (saat ini 30)
- Periksa logika multiple matches
- Periksa apakah ada masalah dengan sorting

## Expected Behavior

### Untuk Director "pochomquin":
1. **Parsing**: Harus berhasil extract "ポチョムキン" dari name_kanji (bukan "pochomquin")
2. **Database Search**: Harus mencari di semua director candidates dengan nama Jepang
3. **Fallback Matching**: Jika tidak ada match dengan nama Jepang, coba dengan "pochomquin" (romaji)
4. **Result**: Harus menampilkan match atau "Not found in database"

### Data yang Diekstrak dari R18.dev:
```json
{
  "name_romaji": "pochomquin",    // Nama English
  "name_kanji": "ポチョムキン",    // Nama Jepang (kanji)
  "name_kana": "ぽちょむきん"      // Nama Jepang (kana)
}
```

### Urutan Matching:
1. **Primary**: "ポチョムキン" (kanji) - untuk matching dengan database
2. **Fallback 1**: "pochomquin" (romaji) - jika tidak ada match dengan kanji
3. **Fallback 2**: "ぽちょむきん" (kana) - jika tidak ada match dengan romaji

## Files Modified

### 1. `src/utils/movieDataParser.ts`
- Fixed director parsing logic
- Added debug logging for director matching
- Added score debugging for all candidates

### 2. Test Verification
- Created and ran test script to verify parsing logic
- Confirmed parsing works correctly

## Next Steps

1. **Test dengan Data Real**: Gunakan data JSON dari r18.dev untuk test
2. **Check Database**: Pastikan ada director "pochomquin" atau variasi namanya di database
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
