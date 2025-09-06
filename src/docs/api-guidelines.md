# API Guidelines dan Konvensi Penamaan

## Movie Database API Documentation

Dokumentasi ini berisi guidelines untuk penggunaan API yang konsisten dalam aplikasi Movie Database.

## 1. Movie API (`/utils/movieApi.ts`)

### Method yang HARUS digunakan:
- ✅ `movieApi.updateMovie(id, data, accessToken)` - untuk update movie
- ✅ `movieApi.createMovie(data, accessToken)` - untuk create movie baru
- ✅ `movieApi.deleteMovie(id, accessToken)` - untuk delete movie
- ✅ `movieApi.getMovies(accessToken)` - untuk fetch movies dengan auth
- ✅ `movieApi.getAllMovies()` - untuk public access tanpa auth
- ✅ `movieApi.getMovie(id)` - untuk fetch single movie
- ✅ `movieApi.searchMovies(query, accessToken?)` - untuk search movies

### Method yang DEPRECATED:
- ❌ `movieApi.update()` - **JANGAN DIGUNAKAN** (deprecated, gunakan `updateMovie`)

## 2. SC Movie API (`/utils/scMovieApi.ts`)

### Method yang tersedia:
- ✅ `scMovieApi.updateSCMovie(id, data, accessToken)` - untuk update SC movie
- ✅ `scMovieApi.createSCMovie(data, accessToken)` - untuk create SC movie baru
- ✅ `scMovieApi.deleteSCMovie(id, accessToken)` - untuk delete SC movie
- ✅ `scMovieApi.getSCMovies(accessToken)` - untuk fetch SC movies dengan auth
- ✅ `scMovieApi.getAllSCMovies()` - untuk public access tanpa auth
- ✅ `scMovieApi.getSCMovie(id)` - untuk fetch single SC movie
- ✅ `scMovieApi.searchSCMovies(query, accessToken?)` - untuk search SC movies

## 3. Master Data API (`/utils/masterDataApi.ts`)

### Method yang tersedia:
- ✅ `masterDataApi.getByType(type, accessToken)` - fetch data berdasarkan tipe
- ✅ `masterDataApi.create(type, name, accessToken)` - create data baru
- ✅ `masterDataApi.update(id, data, accessToken)` - update data
- ✅ `masterDataApi.delete(id, accessToken)` - delete data
- ✅ `masterDataApi.createStudio(name, links, accessToken)` - create studio khusus
- ✅ `masterDataApi.createSeries(titleEn, titleJp, links, accessToken)` - create series khusus
- ✅ `masterDataApi.createLabel(name, links, accessToken)` - create label khusus

## 4. Bulk Assignment API (`/utils/bulkAssignmentApi.ts`)

### Method yang tersedia:
- ✅ `bulkAssignmentApi.assignMetadata(request, accessToken)` - bulk assign metadata
- ✅ `bulkAssignmentApi.assignCast(request, accessToken)` - bulk assign cast
- ✅ `bulkAssignmentApi.assignTemplate(request, accessToken)` - bulk assign template

## 5. Best Practices

### Error Handling
```typescript
try {
  const result = await movieApi.updateMovie(id, data, accessToken)
  // Handle success
} catch (error) {
  console.error('Movie update error:', error)
  toast.error(`Failed to update movie: ${error.message || error}`)
}
```

### TypeScript Types
Selalu gunakan interface types yang tersedia:
- `Movie` untuk HC movies
- `SCMovie` untuk SC movies
- `MasterDataItem` untuk master data
- `BulkAssignmentRequest` untuk bulk operations

### Authentication
- Semua method yang memodifikasi data memerlukan `accessToken`
- Method read-only (`getAllMovies`, `getAllSCMovies`) dapat dipanggil tanpa token
- Selalu handle authentication errors dengan proper fallback

### Naming Conventions
- Gunakan `camelCase` untuk method names
- Gunakan `PascalCase` untuk interface types
- Method prefix: `get`, `create`, `update`, `delete`, `search`
- Jangan gunakan singkatan yang ambigu

## 6. Migration Guide

### Jika masih menggunakan method deprecated:

**Before (deprecated):**
```typescript
await movieApi.update(id, data, accessToken)
```

**After (recommended):**
```typescript
await movieApi.updateMovie(id, data, accessToken)
```

## 7. Future Considerations

- Method deprecated akan dihapus pada versi future
- Selalu gunakan method dengan nama yang explicit dan clear
- Pertimbangkan TypeScript strict mode untuk mendeteksi masalah lebih awal
- Gunakan ESLint rules untuk enforce consistency

## 8. Contact & Support

Jika ada pertanyaan tentang API usage atau ditemukan inconsistency:
1. Check documentation ini terlebih dahulu
2. Review kode existing yang sudah menggunakan pattern yang benar
3. Konsultasi dengan tim development

---

**Last Updated:** December 2024  
**Version:** 1.0.0