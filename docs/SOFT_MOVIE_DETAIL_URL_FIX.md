# Soft Movie Detail Page URL Fix

## 🎯 **Masalah yang Diperbaiki**
Soft movie detail page masih menampilkan URL `/movies` karena mode `scMovieDetail` belum ditangani dalam hook `useBrowserHistory`.

## 🔍 **Root Cause Analysis**

### **1. Missing Mode Mapping**
Hook `useBrowserHistory` tidak memiliki mapping untuk mode `scMovieDetail`:
- Mode `scMovieDetail` digunakan untuk soft movie detail page
- Tidak ada URL mapping untuk `/soft-movie/{identifier}`

### **2. Incomplete URL Parsing**
Fungsi `getContentStateFromPath` tidak dapat memparse URL untuk soft movie detail page.

## ✅ **Perbaikan yang Dilakukan**

### **1. Added Soft Movie Detail Mode Mapping**
```typescript
case 'scMovieDetail':
  // Use code if available, otherwise use ID, otherwise use 'unknown'
  const scMovieIdentifier = state.data?.code || state.data?.id || 'unknown'
  return `/soft-movie/${scMovieIdentifier}`
```

### **2. Enhanced URL Parsing for Soft Movies**
```typescript
if (pathname.startsWith('/soft-movie/')) {
  const scMovieIdentifier = pathname.split('/soft-movie/')[1]
  return {
    mode: 'scMovieDetail',
    title: 'Soft Movie Detail',
    data: { code: scMovieIdentifier }
  }
}
```

## 🚀 **Hasil**

### ✅ **Sebelum Perbaikan:**
- Soft Movie Detail: `http://localhost:3000/movies` ❌

### ✅ **Sesudah Perbaikan:**
- Soft Movie Detail: `http://localhost:3000/soft-movie/ABC-123` ✅

## 📋 **URL Mapping untuk Soft Movies**

| Page | URL Pattern | Example |
|------|-------------|---------|
| Soft Movies List | `/soft` | `/soft` |
| Soft Movie Detail | `/soft-movie/{code}` | `/soft-movie/ABC-123` |

## 🔧 **Files Modified**

1. **`src/hooks/useBrowserHistory.ts`**
   - Added `scMovieDetail` mode mapping in `getPathFromContentState`
   - Enhanced URL parsing in `getContentStateFromPath`

## 🎯 **Cara Menguji**

1. **Soft Movies List**: 
   - Navigasi ke Soft Movies → URL akan menampilkan `/soft`

2. **Soft Movie Detail**: 
   - Klik pada soft movie → URL akan menampilkan `/soft-movie/{code}`
   - Contoh: `/soft-movie/ABC-123`

3. **Browser Back**: 
   - Tombol back browser akan bekerja untuk soft movie detail page

## 📝 **Catatan**

- Soft movie detail menggunakan mode `scMovieDetail` (SC = Soft Content)
- URL pattern menggunakan `/soft-movie/` untuk membedakan dari regular movies (`/movie/`)
- Fallback strategy sama dengan regular movies: code → ID → 'unknown'

Sekarang soft movie detail page memiliki URL yang benar dan tombol back browser bekerja sempurna! 🎉
