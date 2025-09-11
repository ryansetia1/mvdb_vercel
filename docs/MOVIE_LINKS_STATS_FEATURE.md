# Movie Links Stats Feature

## 🎯 Fitur Baru: Stats Watch & Download Links

Menambahkan statistik untuk movies yang memiliki watch & download links di bagian Stats.

## 📊 Data yang Ditampilkan

### Movies dengan Links:
1. **Dengan Watch Links** (`slinks`) - Movies yang memiliki streaming/watch links
2. **Dengan Download Links** (`ulinks`) - Movies yang memiliki uncensored/download links  
3. **Dengan Censored Links** (`clinks`) - Movies yang memiliki censored links

### Format Data:
- **Count**: Jumlah movies yang memiliki links
- **Percentage**: Persentase dari total movies
- **Color Coding**: Setiap jenis link memiliki warna yang berbeda

## 🔧 Implementasi Teknis

### 1. Interface Update
```typescript
interface StatsData {
  movies: {
    total: number
    byType: { [key: string]: number }
    withCover: number
    withGallery: number
    withWatchLinks: number      // NEW
    withDownloadLinks: number   // NEW
    withCensoredLinks: number   // NEW
  }
  // ... other stats
}
```

### 2. Data Processing
```typescript
const movieStats = {
  // ... existing stats
  withWatchLinks: movies.filter(movie => movie.slinks && movie.slinks.trim()).length,
  withDownloadLinks: movies.filter(movie => movie.ulinks && movie.ulinks.trim()).length,
  withCensoredLinks: movies.filter(movie => movie.clinks && movie.clinks.trim()).length
}
```

### 3. UI Components
- **Watch Links**: Icon `PlayCircle`, Color `cyan`
- **Download Links**: Icon `Download`, Color `emerald`  
- **Censored Links**: Icon `Settings`, Color `amber`

## 📈 Manfaat

1. **Insight**: Melihat berapa banyak movies yang sudah memiliki links
2. **Progress Tracking**: Memantau progress penambahan links ke movies
3. **Data Quality**: Mengidentifikasi movies yang belum memiliki links
4. **Coverage Analysis**: Menganalisis coverage links per kategori

## 🎨 Visual Design

Setiap stat card menampilkan:
- **Title**: Jenis links (Watch/Download/Censored)
- **Value**: Jumlah movies dengan links tersebut
- **Subtitle**: Persentase dari total movies
- **Icon**: Icon yang sesuai dengan jenis links
- **Color**: Warna yang membedakan setiap jenis

## 📝 Notes

- Data diambil dari field `slinks`, `ulinks`, dan `clinks` di setiap movie
- Hanya movies dengan links yang tidak kosong yang dihitung
- Persentase dihitung dari total movies yang ada
- Stats ini membantu admin untuk melacak kelengkapan data links
