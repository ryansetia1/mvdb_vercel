# Parsed Gallery Feature Implementation

## Overview
Implementasi fitur untuk menampilkan gallery yang diekstrak dari R18 JSON parsing dengan sistem prioritas yang efisien.

## Prioritas Gallery
Sistem menggunakan prioritas berikut untuk menentukan sumber gallery:

1. **Cached Gallery** (Prioritas Tertinggi)
   - Gallery yang sudah di-cache di browser
   - Load instant, tidak ada network request
   - Indikator: 🟢 "Cached"

2. **Saved from User** (Prioritas Kedua)
   - Gallery yang disimpan manual oleh user via tombol "Save X Images"
   - Menunjukkan pilihan user yang sudah di-curate
   - Indikator: 🔵 "Saved by User"

3. **Saved from Parse** (Prioritas Ketiga)
   - Gallery yang diekstrak dari R18 JSON parsing
   - Data resmi dari source R18.dev
   - Indikator: 🟡 "From R18 Data"

4. **Load Fresh** (Prioritas Terendah)
   - Generate gallery baru dari template
   - Proses validation dan filtering gambar error
   - Indikator: 🔴 "Generated"

## Komponen yang Dimodifikasi

### 1. `parsedGalleryApi.ts` (Baru)
- API untuk mengakses gallery yang diekstrak dari R18 JSON
- Mengambil data dari field `galleryImages` di movie data
- Menyediakan informasi parsing time dan source

### 2. `SaveableGallery.tsx`
- Implementasi prioritas: cached → user saved → parsed → fresh
- Deteksi cached gallery via `useGalleryCache` hook
- UI indicators untuk setiap sumber gallery
- Support untuk parsed gallery dari R18 JSON

### 3. `GalleryWithSave.tsx`
- Implementasi prioritas yang sama dengan `SaveableGallery`
- Support untuk parsed gallery dari R18 JSON
- UI indicators dan lightbox support untuk semua sumber

### 4. `movieDataParser.ts` (Sudah Ada)
- Parser sudah mengekstrak `galleryImages` dari R18 JSON
- Data tersimpan di field `galleryImages` dalam movie data
- Tidak ada perubahan pada parser yang ada

## Struktur Data

### ParsedGalleryData Interface
```typescript
interface ParsedGalleryData {
  movieId: string
  urls: string[]
  source: 'r18_json'
  parsedAt: number
  totalImages: number
}
```

### Movie Interface (Sudah Ada)
```typescript
interface Movie {
  // ... existing fields
  galleryImages?: string[]  // Gallery dari R18 JSON parsing
  coverImage?: string       // Cover image dari R18 JSON
  sampleUrl?: string       // Sample video dari R18 JSON
}
```

## Cara Kerja

### 1. Parsing R18 JSON
- User paste R18 JSON data ke MovieDataParser
- Parser mengekstrak `gallery[].image_full` ke `galleryImages`
- Data tersimpan ke database movie

### 2. Gallery Loading
- Component memeriksa prioritas secara berurutan
- Cached → User Saved → Parsed → Fresh
- Setiap level memiliki indikator UI yang berbeda

### 3. User Experience
- User dapat melihat sumber gallery dengan jelas
- User dapat save manual untuk override parsed gallery
- User dapat refresh untuk kembali ke prioritas yang lebih rendah

## Testing

### Test Case 1: R18 JSON dengan Gallery
1. Parse R18 JSON yang memiliki field `gallery`
2. Verifikasi `galleryImages` tersimpan di movie data
3. Buka movie detail page
4. Verifikasi gallery ditampilkan dengan indikator "From R18 Data"

### Test Case 2: Prioritas User Saved
1. Parse R18 JSON dengan gallery
2. User save gallery manual via tombol "Save X Images"
3. Refresh page
4. Verifikasi gallery ditampilkan dengan indikator "Saved by User"

### Test Case 3: Prioritas Cached
1. Generate gallery fresh (akan di-cache)
2. Refresh page
3. Verifikasi gallery ditampilkan dengan indikator "Cached"

## Keuntungan

1. **Efisiensi**: Prioritas yang optimal untuk performa dan user experience
2. **Transparansi**: User tahu sumber gallery yang ditampilkan
3. **Fleksibilitas**: User dapat override dengan pilihan manual
4. **Konsistensi**: Sistem yang sama di semua gallery components
5. **Backward Compatibility**: Tidak mengubah fungsionalitas yang ada

## Catatan Penting

- Fitur ini hanya bekerja dengan R18 JSON data yang memiliki field `gallery`
- JavDB data tidak memiliki gallery parsing (sesuai requirement)
- Parser tidak diubah untuk menghindari risiko pada fungsionalitas lain
- Semua perubahan bersifat additive, tidak mengubah behavior yang ada
