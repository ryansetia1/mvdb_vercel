# R18 Actor/Actress Matching Enhancement

## Masalah yang Diperbaiki

Sistem matching sebelumnya untuk data R18 hanya menggunakan nama yang diekstrak dari field `actresses` dan `actors` dalam `ParsedMovieData`. Ini menyebabkan masalah dimana aktris seperti Yuka Mayama yang sudah ada di database tidak terdeteksi karena:

1. R18 parser mengekstrak nama dengan prioritas: `name_romaji || name_kanji || name_kana`
2. Sistem matching hanya menggunakan nama yang diekstrak ini untuk mencari di database
3. Jika nama yang diekstrak tidak cocok dengan data di database, aktris tidak akan terdeteksi meskipun ada nama lain yang cocok

## Solusi yang Diimplementasikan

### Enhanced Matching Strategy untuk R18 Data

Sistem sekarang menggunakan strategi matching yang lebih komprehensif untuk data R18:

1. **Primary Search**: Mencoba matching dengan nama yang diekstrak dari `actresses`/`actors` field
2. **Fallback Search**: Jika tidak ada match, sistem akan mencoba semua field yang tersedia dari `actressInfo`/`actorInfo`:
   - `name_romaji`
   - `name_kanji` 
   - `name_kana`
   - `name_en`

### Implementasi Detail

#### Untuk Actresses:
```typescript
// For R18 data, try multiple search strategies
let matchResult = findMatches(actressName, 'actress')

// If no match found and we have R18 data, try searching with other names
if (!matchResult.matched && r18ActressData) {
  // Try with name_romaji
  if (r18ActressData.name_romaji && r18ActressData.name_romaji !== actressName) {
    const romajiMatch = findMatches(r18ActressData.name_romaji, 'actress')
    if (romajiMatch.matched) {
      matchResult = romajiMatch
    }
  }
  
  // Try with name_kanji, name_kana, name_en...
}
```

#### Untuk Actors:
Implementasi yang sama diterapkan untuk actors dengan menggunakan `actorInfo` data.

### Keuntungan

1. **Improved Detection Rate**: Aktris/aktor yang sudah ada di database akan lebih mudah terdeteksi
2. **Better Data Utilization**: Menggunakan semua informasi yang tersedia dari R18.dev
3. **Backward Compatibility**: Tidak mengubah behavior untuk data non-R18
4. **Comprehensive Logging**: Menambahkan logging untuk debugging dan monitoring

### Testing

Untuk test perubahan ini:

1. Parse data R18 yang mengandung aktris seperti Yuka Mayama
2. Pastikan aktris terdeteksi dengan benar meskipun nama yang diekstrak tidak cocok dengan database
3. Verifikasi bahwa data yang sudah ada sebelumnya masih berfungsi normal

### Files Modified

- `src/utils/movieDataParser.ts`: Enhanced matching logic untuk actresses dan actors
- `docs/R18_ACTOR_ACTRESS_MATCHING_ENHANCEMENT.md`: Dokumentasi ini

### Related Issues

- Fixes issue dimana Yuka Mayama tidak terdeteksi meskipun sudah ada di database
- Improves overall R18 data parsing accuracy
- Enhances user experience dengan mengurangi false negatives dalam matching
