# Keyboard Pagination Fix Documentation

## Problem Description
Navigasi pagination keyboard memiliki behavior yang aneh - melompat dari halaman 1 ke 3 ke 5 ke 7, dan seterusnya. Ini disebabkan oleh multiple event listener yang berjalan bersamaan di berbagai komponen.

## Root Cause Analysis

### Multiple Event Listeners
Beberapa komponen memiliki keyboard navigation yang berjalan bersamaan:
- `MoviesContent.tsx`
- `SoftContent.tsx` 
- `PhotobooksContent.tsx`
- `GroupsContent.tsx`
- `PaginationEnhanced.tsx`

### Conflict Issues
```typescript
// Setiap komponen memiliki useEffect yang sama:
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft' && currentPage > 1) {
      e.preventDefault()
      onPageChange(currentPage - 1)
    } else if (e.key === 'ArrowRight' && currentPage < totalPages) {
      e.preventDefault()
      onPageChange(currentPage + 1)
    }
  }
  
  window.addEventListener('keydown', handleKeyPress)
  return () => window.removeEventListener('keydown', handleKeyPress)
}, [currentPage, totalPages, onPageChange])
```

### Problems:
1. **Multiple listeners** berjalan bersamaan
2. **Event bubbling** menyebabkan multiple triggers
3. **Race conditions** antara event handlers
4. **Inconsistent state** antara komponen

## Solution: Global Keyboard Pagination Hook

### Created `useGlobalKeyboardPagination.ts`
```typescript
interface PaginationHandler {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  id: string
}

// Global state untuk keyboard pagination
let activePaginationHandler: PaginationHandler | null = null
let eventListenerAdded = false

export function useGlobalKeyboardPagination(
  currentPage: number,
  totalPages: number,
  onPageChange: (page: number) => void,
  componentId: string,
  enabled: boolean = true
) {
  // Implementation details...
}
```

### Key Features:
1. **Single global event listener** - hanya satu listener yang aktif
2. **Component identification** - setiap komponen memiliki ID unik
3. **Active handler management** - hanya handler aktif yang merespons
4. **Automatic cleanup** - cleanup otomatis saat komponen unmount

## Implementation Changes

### 1. MoviesContent.tsx
**Before:**
```typescript
useEffect(() => {
  const handleKeyDown = (event: KeyboardEvent) => {
    // Multiple event handlers...
  }
  document.addEventListener('keydown', handleKeyDown)
  return () => document.removeEventListener('keydown', handleKeyDown)
}, [currentPage, totalPages])
```

**After:**
```typescript
useGlobalKeyboardPagination(
  currentPage,
  totalPages,
  (page: number) => {
    updateFilters({ currentPage: page })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  },
  'movies-content',
  true
)
```

### 2. SoftContent.tsx
**Before:**
```typescript
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    // Multiple event handlers...
  }
  window.addEventListener('keydown', handleKeyPress)
  return () => window.removeEventListener('keydown', handleKeyPress)
}, [currentPage, filteredMovies.length, itemsPerPage])
```

**After:**
```typescript
useGlobalKeyboardPagination(
  currentPage,
  totalPages,
  (page: number) => setCurrentPage(page),
  'soft-content',
  true
)
```

### 3. PhotobooksContent.tsx
**Before:**
```typescript
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    // Multiple event handlers...
  }
  window.addEventListener('keydown', handleKeyPress)
  return () => window.removeEventListener('keydown', handleKeyPress)
}, [currentPage, totalPages])
```

**After:**
```typescript
useGlobalKeyboardPagination(
  currentPage,
  totalPages,
  (page: number) => setCurrentPage(page),
  'photobooks-content',
  true
)
```

### 4. GroupsContent.tsx
**Before:**
```typescript
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    // Multiple event handlers...
  }
  window.addEventListener('keydown', handleKeyPress)
  return () => window.removeEventListener('keydown', handleKeyPress)
}, [currentPage, filteredGroups.length, itemsPerPage])
```

**After:**
```typescript
useGlobalKeyboardPagination(
  currentPage,
  groupsTotalPages,
  (page: number) => setCurrentPage(page),
  'groups-content',
  true
)
```

### 5. PaginationEnhanced.tsx
**Before:**
```typescript
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    // Multiple event handlers...
  }
  window.addEventListener('keydown', handleKeyPress)
  return () => window.removeEventListener('keydown', handleKeyPress)
}, [currentPage, totalPages, onPageChange])
```

**After:**
```typescript
// Note: Keyboard navigation is now handled by useGlobalKeyboardPagination hook in parent components
```

## Benefits of the Solution

### 1. Single Source of Truth
- Hanya satu event listener yang aktif
- Tidak ada konflik antara komponen
- Behavior yang konsisten

### 2. Better Performance
- Mengurangi jumlah event listeners
- Mengurangi memory usage
- Mengurangi event processing overhead

### 3. Easier Maintenance
- Centralized keyboard navigation logic
- Consistent behavior across components
- Easier to debug and modify

### 4. Component Isolation
- Setiap komponen memiliki ID unik
- Tidak ada interference antar komponen
- Clean separation of concerns

## Usage Guidelines

### For New Components
```typescript
import { useGlobalKeyboardPagination } from '../../hooks/useGlobalKeyboardPagination'

// In your component:
useGlobalKeyboardPagination(
  currentPage,
  totalPages,
  (page: number) => setCurrentPage(page),
  'unique-component-id',
  true // enabled
)
```

### Component ID Convention
- Use descriptive, unique IDs
- Format: `component-name` (kebab-case)
- Examples: `movies-content`, `soft-content`, `photobooks-content`

### When to Enable/Disable
```typescript
// Enable when component is active and has pagination
useGlobalKeyboardPagination(currentPage, totalPages, onPageChange, 'component-id', true)

// Disable when component is inactive or no pagination
useGlobalKeyboardPagination(currentPage, totalPages, onPageChange, 'component-id', false)
```

## Testing

### Manual Testing
1. Navigate to different content sections (Movies, Soft, Photobooks, Groups)
2. Use arrow keys (← →) to navigate pagination
3. Verify smooth navigation without jumping
4. Test with different page sizes and total pages

### Edge Cases Tested
- Single page content (no pagination)
- Empty content
- Rapid key presses
- Multiple components mounted simultaneously
- Component unmounting during navigation

## Future Improvements

### 1. Enhanced Keyboard Shortcuts
```typescript
// Add more keyboard shortcuts
if (event.key === 'Home') {
  onPageChange(1)
} else if (event.key === 'End') {
  onPageChange(totalPages)
} else if (event.key === 'PageUp') {
  onPageChange(Math.max(1, currentPage - 10))
} else if (event.key === 'PageDown') {
  onPageChange(Math.min(totalPages, currentPage + 10))
}
```

### 2. Visual Feedback
```typescript
// Add visual feedback for keyboard navigation
const [isNavigating, setIsNavigating] = useState(false)

const handlePageChange = (page: number) => {
  setIsNavigating(true)
  onPageChange(page)
  setTimeout(() => setIsNavigating(false), 300)
}
```

### 3. Accessibility Improvements
```typescript
// Add ARIA labels and screen reader support
<div 
  role="region" 
  aria-label="Pagination navigation"
  aria-live="polite"
>
  {/* Pagination content */}
</div>
```

## Additional Components Fixed

### 6. SeriesContent.tsx
**Before:**
```typescript
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    // Multiple event handlers...
  }
  window.addEventListener('keydown', handleKeyPress)
  return () => window.removeEventListener('keydown', handleKeyPress)
}, [currentPage, filteredSeries.length, itemsPerPage])
```

**After:**
```typescript
useGlobalKeyboardPagination(
  currentPage,
  totalPages,
  (page: number) => setCurrentPage(page),
  'series-content',
  true
)
```

### 7. FavoritesContent.tsx
**Before:**
```typescript
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    // Multiple event handlers...
  }
  window.addEventListener('keydown', handleKeyPress)
  return () => window.removeEventListener('keydown', handleKeyPress)
}, [currentPage, activeTab, favorites, movies, scMovies, actresses, itemsPerPage])
```

**After:**
```typescript
useGlobalKeyboardPagination(
  currentPage,
  totalPages,
  (page: number) => setCurrentPage(page),
  'favorites-content',
  true
)
```

### 8. ActorManager.tsx
**Before:**
```typescript
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    // Multiple event handlers...
  }
  window.addEventListener('keydown', handleKeyPress)
  return () => window.removeEventListener('keydown', handleKeyPress)
}, [currentPage, filteredActors.length, itemsPerPage, showForm])
```

**After:**
```typescript
useGlobalKeyboardPagination(
  currentPage,
  totalPages,
  (page: number) => setCurrentPage(page),
  'actor-manager',
  !showForm // Disable when form is open
)
```

### 9. MovieList.tsx
**Before:**
```typescript
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    // Multiple event handlers...
  }
  window.addEventListener('keydown', handleKeyPress)
  return () => window.removeEventListener('keydown', handleKeyPress)
}, [currentPage, filteredMovies.length, itemsPerPage])
```

**After:**
```typescript
useGlobalKeyboardPagination(
  currentPage,
  totalPages,
  (page: number) => setCurrentPage(page),
  'movie-list',
  !showForm // Disable when form is open
)
```

### 10. SCMovieList.tsx
**Before:**
```typescript
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    // Multiple event handlers...
  }
  window.addEventListener('keydown', handleKeyPress)
  return () => window.removeEventListener('keydown', handleKeyPress)
}, [currentPage, filteredMovies.length, itemsPerPage])
```

**After:**
```typescript
useGlobalKeyboardPagination(
  currentPage,
  totalPages,
  (page: number) => setCurrentPage(page),
  'sc-movie-list',
  !showForm // Disable when form is open
)
```

### 11. StudiosContent.tsx
**Before:**
```typescript
// No keyboard navigation implemented
```

**After:**
```typescript
useGlobalKeyboardPagination(
  currentPage,
  totalPages,
  (page: number) => setCurrentPage(page),
  'studios-content',
  true
)
```

### 12. ActorsContent.tsx
**Before:**
```typescript
// No keyboard navigation implemented
```

**After:**
```typescript
useGlobalKeyboardPagination(
  currentPage,
  totalPages,
  (page: number) => setCurrentPage(page),
  'actors-content',
  !showEditDialog // Disable when edit dialog is open
)
```

### 13. ActressesContent.tsx
**Before:**
```typescript
// No keyboard navigation implemented
```

**After:**
```typescript
useGlobalKeyboardPagination(
  currentPage,
  totalPages,
  (page: number) => setCurrentPage(page),
  'actresses-content',
  !showEditDialog // Disable when edit dialog is open
)
```

### 14. FilteredActressesContent.tsx
**Before:**
```typescript
// No keyboard navigation implemented
```

**After:**
```typescript
useGlobalKeyboardPagination(
  currentPage,
  totalPages,
  (page: number) => setCurrentPage(page),
  'filtered-actresses-content',
  true
)
```

## Complete Component List

All components with pagination now use the global keyboard navigation hook:

1. **MoviesContent.tsx** - `'movies-content'`
2. **SoftContent.tsx** - `'soft-content'`
3. **PhotobooksContent.tsx** - `'photobooks-content'`
4. **GroupsContent.tsx** - `'groups-content'`
5. **SeriesContent.tsx** - `'series-content'`
6. **FavoritesContent.tsx** - `'favorites-content'`
7. **ActorManager.tsx** - `'actor-manager'`
8. **MovieList.tsx** - `'movie-list'`
9. **SCMovieList.tsx** - `'sc-movie-list'`
10. **StudiosContent.tsx** - `'studios-content'`
11. **ActorsContent.tsx** - `'actors-content'`
12. **ActressesContent.tsx** - `'actresses-content'`
13. **FilteredActressesContent.tsx** - `'filtered-actresses-content'`
14. **PaginationEnhanced.tsx** - Removed keyboard navigation (handled by parent components)

## Conclusion

The global keyboard pagination hook successfully resolves the jumping pagination issue by:
1. **Eliminating multiple event listeners** that were causing conflicts
2. **Providing a single, centralized** keyboard navigation system
3. **Ensuring consistent behavior** across all components
4. **Improving performance** by reducing event listener overhead
5. **Supporting conditional enabling/disabling** for forms and dialogs

The solution is maintainable, scalable, and provides a solid foundation for future keyboard navigation enhancements.

---

**Created**: 2024-12-19  
**Last Updated**: 2024-12-19  
**Related Files**: 
- `src/hooks/useGlobalKeyboardPagination.ts`
- `src/components/content/MoviesContent.tsx`
- `src/components/content/SoftContent.tsx`
- `src/components/content/PhotobooksContent.tsx`
- `src/components/content/GroupsContent.tsx`
- `src/components/content/SeriesContent.tsx`
- `src/components/content/FavoritesContent.tsx`
- `src/components/ActorManager.tsx`
- `src/components/MovieList.tsx`
- `src/components/SCMovieList.tsx`
- `src/components/content/StudiosContent.tsx`
- `src/components/content/ActorsContent.tsx`
- `src/components/content/ActressesContent.tsx`
- `src/components/content/FilteredActressesContent.tsx`
- `src/components/ui/pagination-enhanced.tsx`
