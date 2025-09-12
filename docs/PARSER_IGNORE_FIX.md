# Parser Ignore Functionality Fix

## Masalah yang Diperbaiki
Issue pada parser movie baru dimana data yang di-ignore (actors/actresses) tetap tertambah ke database meskipun user sudah meng-ignore data tersebut.

## Root Cause
Masalah utama ada di file `src/utils/movieMergeApi.ts` dimana fungsi merge tidak mempertimbangkan `ignoredItems` untuk actresses dan actors. Kode hanya menggunakan `request.parsedData.actresses` dan `request.parsedData.actors` tanpa memfilter data yang di-ignore.

## Perbaikan yang Dilakukan

### 1. MovieDataParser.tsx
- **File**: `src/components/MovieDataParser.tsx`
- **Masalah**: Penggunaan `indexOf` dalam filter yang bisa menyebabkan masalah dengan duplikasi nama
- **Fix**: Menggunakan `map((item, index) => ({ item, index }))` untuk mempertahankan index asli
- **Lokasi**: Baris 416-419 dan 440-443

### 2. movieMergeApi.ts (FIX UTAMA)
- **File**: `src/utils/movieMergeApi.ts`
- **Masalah**: Tidak menggunakan `ignoredItems` untuk actresses dan actors
- **Fix**: Menambahkan filtering berdasarkan `ignoredItems` dan menggunakan matched data
- **Lokasi**: Baris 112-144 (actresses) dan 146-178 (actors)

## Detail Perbaikan

### Sebelum (BROKEN):
```typescript
// Hanya menggunakan parsed data tanpa mempertimbangkan ignored items
const newActresses = request.parsedData.actresses.filter(a => a && a.trim())
```

### Sesudah (FIXED):
```typescript
// Filter out ignored actresses and use matched data when available
const filteredActresses = request.parsedData.actresses.map((name, index) => {
  // Check if this actress is ignored
  if (request.ignoredItems?.includes(`actresses-${index}`)) {
    return null // Mark as ignored
  }
  
  // Use matched data if available, otherwise use original name
  const matchedItem = request.matchedData?.actresses?.[index]
  if (matchedItem?.matched) {
    // Use the matched name from database (prefer English name, fallback to Japanese)
    return matchedItem.matched.name || matchedItem.matched.jpname || name
  }
  return name
}).filter(name => name !== null && name.trim()) // Remove ignored items and empty strings
```

## Testing
Fitur telah ditest dengan berbagai skenario:
- ✅ Data yang di-ignore tidak tertambah ke database
- ✅ Data yang tidak di-ignore tetap tertambah dengan benar
- ✅ Matched data digunakan dengan prioritas English name
- ✅ Duplikasi nama ditangani dengan benar

## Files Modified
1. `src/components/MovieDataParser.tsx` - Fix indexOf issue
2. `src/utils/movieMergeApi.ts` - Fix ignore functionality (MAIN FIX)

## Impact
- Data yang di-ignore oleh user sekarang benar-benar tidak akan ditambahkan ke database
- Parser movie baru sekarang menghormati pilihan ignore user
- Merge mode juga menggunakan ignore functionality dengan benar
