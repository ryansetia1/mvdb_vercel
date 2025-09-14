# JavDB Japanese Name Matching Fix

## Masalah yang Diperbaiki

Ketika user melakukan parsing data JavDB dengan aktris yang memiliki nama Jepang seperti "有栖花あか", sistem tidak dapat menemukan aktris tersebut di database meskipun aktris tersebut sudah ada.

### Contoh Masalah:
```
Data JavDB: "有栖花あか"
Database: Aktris dengan jpname: "有栖花あか"
Result: "Not found in database" ❌
```

## Root Cause

Masalah terjadi di fungsi `matchJavdbSimple` di `src/utils/movieDataParser.ts`. Algoritma matching menggunakan `toLowerCase()` untuk semua nama, termasuk nama Jepang:

```typescript
// MASALAH: toLowerCase() tidak bekerja untuk karakter Jepang
item.jpname?.toLowerCase() === actressName.toLowerCase()
```

### Mengapa `toLowerCase()` Tidak Bekerja untuk Karakter Jepang:

1. **Karakter Jepang tidak memiliki konsep uppercase/lowercase**
2. `toLowerCase()` pada karakter Jepang akan mengembalikan karakter yang sama
3. Namun, jika ada whitespace atau karakter khusus, perbandingan bisa gagal
4. Perbandingan yang tepat untuk karakter Jepang adalah menggunakan `trim()` saja

## Solusi yang Diimplementasikan

### 1. Perbaikan Algoritma Matching untuk JavDB

**File**: `src/utils/movieDataParser.ts`

#### Sebelum (Bermasalah):
```typescript
const match = masterData.find(item => 
  item.type === 'actress' && (
    item.jpname?.toLowerCase() === actressName.toLowerCase() ||
    item.kanjiName?.toLowerCase() === actressName.toLowerCase() ||
    item.kanaName?.toLowerCase() === actressName.toLowerCase() ||
    item.name?.toLowerCase() === actressName.toLowerCase()
  )
)
```

#### Sesudah (Diperbaiki):
```typescript
const match = masterData.find(item => 
  item.type === 'actress' && (
    item.jpname?.trim() === actressName.trim() ||
    item.kanjiName?.trim() === actressName.trim() ||
    item.kanaName?.trim() === actressName.trim() ||
    item.name?.trim() === actressName.trim() ||
    // Case-insensitive matching for English names only
    (item.name && actressName && /^[a-zA-Z\s]+$/.test(item.name) && /^[a-zA-Z\s]+$/.test(actressName) && 
     item.name.toLowerCase() === actressName.toLowerCase())
  )
)
```

### 2. Perbaikan untuk Semua Tipe Data

Perbaikan yang sama diterapkan untuk:
- **Actresses**: Matching nama aktris Jepang
- **Actors**: Matching nama aktor Jepang  
- **Directors**: Matching nama sutradara Jepang
- **Studios**: Matching nama studio Jepang
- **Series**: Matching nama seri Jepang

### 3. Logika Matching yang Lebih Cerdas

#### Untuk Karakter Jepang:
- Menggunakan `trim()` untuk menghilangkan whitespace
- Perbandingan exact match untuk karakter Jepang
- Tidak menggunakan `toLowerCase()` karena tidak relevan

#### Untuk Nama English:
- Tetap menggunakan `toLowerCase()` untuk case-insensitive matching
- Hanya diterapkan jika kedua nama adalah karakter Latin (`/^[a-zA-Z\s]+$/`)
- Mempertahankan fungsionalitas case-insensitive untuk nama English

## Cara Kerja Setelah Perbaikan

### Step 1: Deteksi Tipe Karakter
```typescript
// Cek apakah nama adalah karakter Latin (English)
/^[a-zA-Z\s]+$/.test(item.name) && /^[a-zA-Z\s]+$/.test(actressName)
```

### Step 2: Matching Strategy
- **Karakter Jepang**: Exact match dengan `trim()`
- **Karakter English**: Case-insensitive match dengan `toLowerCase()`

### Step 3: Prioritas Matching
1. `jpname` (Japanese Name)
2. `kanjiName` (Kanji Name)
3. `kanaName` (Kana Name)
4. `name` (English Name)

## Contoh Hasil Setelah Perbaikan

### Input Data JavDB:
```
SSNI-937 交わる体液、濃密セックス 完全ノーカットスペシャル 有栖花あか （ブルーレイディスク）
Actor(s): 有栖花あか♀ 貞松大輔♂ 吉村卓♂ 鮫島♂
```

### Database:
```
Aktris: "有栖花あか"
- jpname: "有栖花あか"
- kanjiName: "有栖花あか"
- name: "Aka Asuka"
```

### Hasil Setelah Perbaikan:
```
✅ Found: 有栖花あか matched to database entry
✅ No "Not found in database" warning
✅ User can proceed with save movie
```

## Keuntungan

1. **✅ Accurate Japanese Matching**: Nama Jepang dapat ditemukan dengan tepat
2. **✅ Preserved English Matching**: Case-insensitive matching untuk nama English tetap berfungsi
3. **✅ Better User Experience**: Mengurangi "Not found in database" yang tidak perlu
4. **✅ Consistent Behavior**: Matching yang konsisten untuk semua tipe data
5. **✅ Robust Whitespace Handling**: Menggunakan `trim()` untuk menghilangkan whitespace yang tidak perlu

## Test Cases

### Test Case 1: Japanese Name Exact Match
**Input**: `"有栖花あか"`
**Database**: `jpname: "有栖花あか"`
**Expected**: ✅ Match found

### Test Case 2: Japanese Name with Whitespace
**Input**: `" 有栖花あか "`
**Database**: `jpname: "有栖花あか"`
**Expected**: ✅ Match found (trimmed)

### Test Case 3: English Name Case Insensitive
**Input**: `"aka asuka"`
**Database**: `name: "Aka Asuka"`
**Expected**: ✅ Match found (case-insensitive)

### Test Case 4: Mixed Characters
**Input**: `"有栖花あか"`
**Database**: `name: "Aka Asuka"`
**Expected**: ❌ No match (different character types)

## Files Modified

- `src/utils/movieDataParser.ts` - Perbaikan fungsi `matchJavdbSimple`
- `docs/JAVDB_JAPANESE_NAME_MATCHING_FIX.md` - Dokumentasi perbaikan ini

## Impact

### Before Fix:
- Aktris Jepang sering tidak ditemukan di database
- User harus manual add aktris yang sudah ada
- Inconsistent matching behavior

### After Fix:
- Aktris Jepang dapat ditemukan dengan tepat
- Reduced manual intervention needed
- Consistent and reliable matching

## Future Enhancements

1. **Fuzzy Matching**: Implementasi fuzzy matching untuk nama yang hampir sama
2. **Alias Support**: Support untuk matching dengan alias
3. **Performance Optimization**: Optimasi untuk database dengan jumlah aktris yang besar
4. **Unicode Normalization**: Normalisasi Unicode untuk handling karakter Jepang yang kompleks
