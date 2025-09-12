# LocalStorage Caching Feature

## Overview
Webapp ini sekarang memiliki sistem caching yang menggunakan localStorage untuk menyimpan data selama sesi browser. Data akan tetap tersimpan saat refresh halaman atau berpindah halaman, sehingga tidak perlu loading ulang setiap kali.

## Fitur yang Dicache

### 1. Data Utama
- **Movies**: Semua data film
- **Photobooks**: Semua data photobook  
- **Actors**: Data aktor
- **Actresses**: Data aktris

### 2. Data yang Sudah Dicache Sebelumnya
- **Filter States**: Status filter untuk setiap halaman
- **Theme**: Tema aplikasi (dark/light mode)
- **Movie Type Colors**: Konfigurasi warna untuk tipe film

## Cara Kerja

### Cache Duration
- Data di-cache selama **5 menit** (300,000 ms)
- Setelah 5 menit, data akan di-reload dari server
- Data tetap tersimpan di localStorage meskipun sudah expired

### Storage Key
- Cache data utama: `mvdb_cached_data`
- Filter states: `mvdb_filter_states`
- Theme: `mvdb_theme`
- Movie type colors: `mvdb_movie_type_colors`

### Automatic Loading
1. Saat aplikasi dimuat, sistem akan:
   - Cek localStorage untuk data yang tersimpan
   - Jika data masih fresh (< 5 menit), gunakan data dari cache
   - Jika data expired, load dari server dan update cache

2. Saat data di-update:
   - Data baru disimpan ke localStorage otomatis
   - State aplikasi di-sync dengan cache

## Manfaat

### 1. Performance
- **Loading lebih cepat** saat refresh atau navigasi
- **Mengurangi API calls** yang tidak perlu
- **Offline capability** untuk data yang sudah di-cache

### 2. User Experience
- **Tidak ada loading screen** saat berpindah halaman
- **Data tetap tersedia** meskipun koneksi lambat
- **Filter states tersimpan** antar halaman

### 3. Bandwidth
- **Menghemat bandwidth** dengan mengurangi request ke server
- **Caching intelligent** hanya reload saat diperlukan

## Cache Management

### Manual Cache Invalidation
```typescript
// Clear semua cache
invalidateCache()

// Clear cache spesifik
invalidateCache('movies')
invalidateCache('photobooks')
invalidateCache('actors')
invalidateCache('actresses')
```

### Force Reload
```typescript
// Force reload dengan mengabaikan cache
loadCachedData('movies', () => movieApi.getMovies(accessToken), true)
```

## Error Handling
- Jika localStorage penuh atau tidak tersedia, aplikasi tetap berfungsi normal
- Cache error tidak akan mengganggu fungsi utama aplikasi
- Fallback ke loading dari server jika cache gagal

## Browser Compatibility
- Mendukung semua browser modern yang memiliki localStorage
- Graceful degradation untuk browser lama
- Tidak mempengaruhi fungsi aplikasi jika localStorage tidak tersedia

## Implementation Details

### Hook: useCachedData
- Mengelola state cache untuk semua data utama
- Otomatis sync dengan localStorage
- Menyediakan fungsi loadData, invalidateCache, dan isDataFresh

### Component Integration
- UnifiedApp menggunakan useCachedData hook
- State components di-sync dengan cache
- Automatic reload saat cache expired

## Testing
Untuk test fitur caching:
1. Load aplikasi dan tunggu data ter-load
2. Refresh halaman - data harus langsung muncul tanpa loading
3. Berpindah halaman - data tetap tersedia
4. Tunggu 5+ menit, refresh lagi - data akan di-reload dari server

## Future Enhancements
- Cache compression untuk data besar
- Background refresh untuk data yang akan expired
- Cache analytics untuk monitoring usage
- Selective cache invalidation berdasarkan perubahan data
