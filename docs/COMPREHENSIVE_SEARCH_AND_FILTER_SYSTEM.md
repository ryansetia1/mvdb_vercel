# Comprehensive Search and Filter System

## Overview

Sistem pencarian dan filter komprehensif yang memungkinkan user untuk mencari dan memfilter movies berdasarkan berbagai kriteria, dengan hasil yang dikategorikan dan dapat diklik untuk menerapkan filter.

## Features

### 1. Comprehensive Search
- **Cast Names**: Nama aktris, aktor, dan sutradara (termasuk alias Jepang dan Inggris)
- **Tags**: Tag yang terkait dengan movie
- **Labels**: Label kategori movie
- **Series**: Seri atau franchise movie
- **Movie Codes**: Kode movie (termasuk dmcode)
- **Titles**: Judul movie dalam bahasa Inggris dan Jepang
- **Studio**: Studio produksi

### 2. Categorized Search Results
Ketika user mengetik query di search bar, hasil ditampilkan dalam kategori:

- **Movies**: Movies yang cocok dengan query
- **Actresses**: Aktris yang cocok dengan query
- **Actors**: Aktor yang cocok dengan query
- **Directors**: Sutradara yang cocok dengan query
- **Tags**: Tag yang cocok dengan query
- **Series**: Seri yang cocok dengan query
- **Studios**: Studio yang cocok dengan query
- **Labels**: Label yang cocok dengan query

### 3. Clickable Filter Integration
Setiap item dalam kategori dapat diklik untuk:
- **Cast Items**: Navigate ke profile page
- **Filter Items**: Apply filter dan clear search query

## Technical Implementation

### Components

#### 1. MoviesContent.tsx
- **Main component** untuk menampilkan movie content
- **Conditional rendering**: Menampilkan `CategorizedMovieGrid` saat ada search query, atau normal movie grid saat tidak ada
- **Filter management**: Mengelola state filter dan menerapkan filter ke movie list
- **Search query handling**: Clear search query ketika filter diterapkan

#### 2. CategorizedMovieGrid.tsx
- **Display categorized results** berdasarkan search query
- **Clickable items**: Setiap item dapat diklik untuk navigate atau apply filter
- **Visual categories**: Menampilkan icon dan count untuk setiap kategori
- **Filter integration**: Memanggil `onFilterSelect` untuk apply filter

#### 3. UnifiedApp.tsx
- **State management**: Mengelola `moviesFilters` state dengan semua filter properties
- **Filter propagation**: Meneruskan filter changes dari child components
- **Search query management**: Mengelola search query state

### Key Functions

#### Search Filter Logic
```typescript
const searchFilter = (movie: Movie, query: string) => {
  const lowerQuery = query.toLowerCase()
  return (
    // Cast names
    castMatchesQuery(movie.cast, lowerQuery) ||
    // Movie codes
    movieCodeMatchesQuery(movie.movieCode, lowerQuery) ||
    movieCodeMatchesQuery(movie.dmcode, lowerQuery) ||
    // Titles
    nameMatchesQuery(movie.titleEn, lowerQuery) ||
    nameMatchesQuery(movie.titleJp, lowerQuery) ||
    // Tags
    movie.tags?.toLowerCase().includes(lowerQuery) ||
    // Series
    movie.series?.toLowerCase().includes(lowerQuery) ||
    // Studio
    movie.studio?.toLowerCase().includes(lowerQuery) ||
    // Label
    movie.label?.toLowerCase().includes(lowerQuery)
  )
}
```

#### Filter Application
```typescript
const handleFilterChange = (filterType: string, value: string) => {
  const updates: any = { currentPage: 1 }
  
  switch (filterType) {
    case 'tag':
      updates.tagFilter = value
      break
    case 'studio':
      updates.studioFilter = value
      break
    case 'series':
      updates.seriesFilter = value
      break
    case 'label':
      updates.labelFilter = value
      break
  }
  
  updateFilters(updates)
  // Clear search query to show filtered results
  if (onSearchQueryChange) {
    onSearchQueryChange('')
  }
}
```

### State Management

#### MoviesContent State
```typescript
interface MoviesContentProps {
  movies: Movie[]
  searchQuery: string
  onMovieSelect: (movie: Movie) => void
  onProfileSelect?: (type: 'actor' | 'actress' | 'director', name: string) => void
  accessToken: string
  actresses?: MasterDataItem[]
  actors?: MasterDataItem[]
  directors?: MasterDataItem[]
  externalFilters?: {
    tagFilter?: string
    studioFilter?: string 
    seriesFilter?: string
    typeFilter?: string
    labelFilter?: string
    sortBy?: string
    currentPage?: number
    itemsPerPage?: number
  }
  onFiltersChange?: (filters: FilterState) => void
  onSearchQueryChange?: (query: string) => void
  onAddMovie?: () => void
  onParseMovie?: () => void
}
```

#### UnifiedApp State
```typescript
const [moviesFilters, setMoviesFilters] = useState({
  tagFilter: 'all',
  studioFilter: 'all',
  seriesFilter: 'all',
  typeFilter: 'all',
  labelFilter: 'all',
  sortBy: 'releaseDate-desc',
  currentPage: 1,
  itemsPerPage: 24
})
```

## User Experience Flow

### 1. Search Process
1. User mengetik query di search bar
2. System menampilkan `CategorizedMovieGrid` dengan hasil yang dikategorikan
3. User dapat melihat hasil dalam berbagai kategori (Movies, Cast, Tags, dll)

### 2. Filter Application
1. User click pada item dalam kategori (misal: Tag "Pregnant")
2. System apply filter (`tagFilter: 'Pregnant'`)
3. System clear search query (`searchQuery: ''`)
4. UI berubah dari `CategorizedMovieGrid` ke normal movie grid
5. Hanya movies dengan tag "Pregnant" yang ditampilkan
6. Filter indicator muncul dengan option to remove

### 3. Navigation
- **Cast items**: Navigate ke profile page untuk melihat detail cast
- **Filter items**: Apply filter dan kembali ke movie list dengan filter aktif

## Key Features

### 1. Real-time Search
- Search results update secara real-time saat user mengetik
- Categorized results dengan count untuk setiap kategori

### 2. Seamless Filter Integration
- Click pada filter item langsung apply filter
- Search query otomatis di-clear untuk menampilkan hasil filter
- Filter indicator menampilkan active filters

### 3. Comprehensive Coverage
- Mencari di semua field yang relevan (cast, tags, series, studio, dll)
- Support untuk alias Jepang dan Inggris
- Case-insensitive search

### 4. Visual Feedback
- Hover effects pada clickable items
- Clear visual distinction antara categories
- Count indicators untuk setiap kategori

## Troubleshooting

### Common Issues

#### 1. Filter Not Applied
**Problem**: Click pada filter item tidak apply filter
**Solution**: Pastikan `onSearchQueryChange` prop tersedia dan `searchQuery` di-clear

#### 2. Search Results Not Categorized
**Problem**: Search results tidak dikategorikan
**Solution**: Pastikan `CategorizedMovieGrid` digunakan saat `searchQuery.trim()` ada

#### 3. Filter State Not Persisted
**Problem**: Filter hilang saat navigate
**Solution**: Pastikan `externalFilters` dan `onFiltersChange` prop tersedia

## Future Enhancements

### 1. Advanced Search
- Boolean operators (AND, OR, NOT)
- Wildcard search
- Fuzzy matching

### 2. Search History
- Recent searches
- Popular searches
- Search suggestions

### 3. Filter Combinations
- Multiple filter combinations
- Filter presets
- Saved filter sets

### 4. Performance Optimization
- Debounced search
- Virtualized results
- Lazy loading

## Conclusion

Sistem pencarian dan filter komprehensif ini memberikan user experience yang seamless untuk mencari dan memfilter movies berdasarkan berbagai kriteria. Dengan categorized results dan clickable filter integration, user dapat dengan mudah menemukan dan memfilter content yang mereka inginkan.

## Files Modified

### Core Components
- `src/components/content/MoviesContent.tsx`
- `src/components/CategorizedMovieGrid.tsx`
- `src/components/UnifiedApp.tsx`

### Search Components
- `src/components/content/FilteredCustomNavContent.tsx`
- `src/components/content/FilteredMoviesContent.tsx`
- `src/components/FilteredMovieList.tsx`
- `src/components/MovieList.tsx`
- `src/components/FrontendMovieList.tsx`
- `src/components/content/AdvancedSearchContent.tsx`

### Key Features
- ✅ Comprehensive search across all movie fields
- ✅ Categorized search results display
- ✅ Clickable filter integration
- ✅ Search query clearing on filter application
- ✅ State management for all filter types
- ✅ Visual feedback and user experience
