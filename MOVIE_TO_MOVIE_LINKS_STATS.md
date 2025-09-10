# Movie-to-Movie Links Stats Feature

## 🎯 Fitur Baru: Stats Movie-to-Movie Links

Menambahkan statistik untuk movie-to-movie links (relationships antar movies) di bagian Stats.

## 📊 Data yang Ditampilkan

### Movie Links Section:
- **Total Movie Links** - Jumlah total movie-to-movie relationships yang ada
- **Subtitle**: Menampilkan jumlah dengan deskripsi "movie-to-movie relationships"

### Format Data:
- **Count**: Jumlah total movie links
- **Icon**: Link icon untuk representasi visual
- **Color**: Indigo untuk membedakan dari section lain

## 🔧 Implementasi Teknis

### 1. Interface Update
```typescript
interface StatsData {
  // ... existing stats
  movieLinks: {
    total: number
  }
}
```

### 2. Data Fetching
```typescript
// Menggunakan movieLinksApi.getMovieLinks()
movieLinksApi.getMovieLinks(accessToken).catch((error) => {
  console.log('Movie links endpoint not available, using fallback:', error.message)
  return []
})
```

### 3. Data Processing
```typescript
const movieLinksStats = {
  total: movieLinks.length
}
```

### 4. UI Component
```typescript
<StatSection title="Movie Links">
  <StatCard 
    title="Total Movie Links" 
    value={stats.movieLinks.total} 
    icon={LinkIcon} 
    color="indigo"
    subtitle={`${stats.movieLinks.total} movie-to-movie relationships`}
  />
</StatSection>
```

## 📈 Manfaat

1. **Relationship Tracking**: Melihat berapa banyak movie-to-movie relationships yang telah dibuat
2. **Data Connectivity**: Memahami tingkat konektivitas antar movies dalam database
3. **Progress Monitoring**: Memantau progress pembuatan movie links
4. **Database Insights**: Memberikan insight tentang struktur relasional data movies

## 🎨 Visual Design

- **Title**: "Total Movie Links"
- **Value**: Jumlah total movie links
- **Icon**: Link icon (LinkIcon dari lucide-react)
- **Color**: Indigo untuk konsistensi visual
- **Subtitle**: Deskripsi "X movie-to-movie relationships"

## 🔗 Data Source

Data diambil dari KV store dengan prefix `movie_link:` yang berisi:
- `id`: Unique identifier untuk link
- `primaryMovieId`: ID movie utama
- `linkedMovieId`: ID movie yang di-link
- `description`: Deskripsi link (opsional)
- `createdAt`: Timestamp pembuatan
- `updatedAt`: Timestamp update

## 📝 Notes

- Stats ini menampilkan total jumlah movie-to-movie relationships
- Data diambil menggunakan `movieLinksApi.getMovieLinks()`
- Fallback ke array kosong jika endpoint tidak tersedia
- Membantu admin untuk melacak kelengkapan data relationships antar movies
- Berguna untuk memahami struktur konektivitas dalam database movies
