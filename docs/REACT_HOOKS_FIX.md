# React Hooks Rules Violation Fix

## Masalah yang Ditemukan
Error React Hooks yang terjadi karena pelanggaran Rules of Hooks:

```
Warning: React has detected a change in the order of Hooks called by MovieList. 
This will lead to bugs and errors if not fixed.
```

## Root Cause
Hook `useGlobalKeyboardPagination` dipanggil di dalam conditional blocks atau IIFE (Immediately Invoked Function Expression), yang melanggar Rules of Hooks:

### ❌ Sebelum (Salah):
```typescript
{(() => {
  const totalPages = Math.ceil(filteredMovies.length / itemsPerPage)
  
  // ❌ Hook dipanggil di dalam conditional block
  useGlobalKeyboardPagination(
    currentPage,
    totalPages,
    (page: number) => setCurrentPage(page),
    'movie-list',
    !showForm
  )
  
  if (totalPages <= 1) return null
  
  return (
    // JSX content
  )
})()}
```

## Solusi yang Diterapkan

### ✅ Setelah (Benar):
```typescript
export function MovieList({ accessToken, editingMovie, onClearEditing }: MovieListProps) {
  // State declarations
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)

  // ✅ Hook dipanggil di level atas komponen
  const totalPages = Math.ceil(filteredMovies.length / itemsPerPage)
  
  useGlobalKeyboardPagination(
    currentPage,
    totalPages,
    (page: number) => setCurrentPage(page),
    'movie-list',
    !showForm
  )

  // useEffect hooks
  useEffect(() => {
    loadMovies()
  }, [])

  // Render logic
  return (
    <div>
      {/* Pagination */}
      {(() => {
        if (totalPages <= 1) return null
        
        return (
          // JSX content
        )
      })()}
    </div>
  )
}
```

## Komponen yang Diperbaiki

### 1. MovieList.tsx
- **Masalah**: Hook dipanggil di dalam IIFE di bagian pagination
- **Solusi**: Dipindahkan ke level atas komponen setelah state declarations

### 2. ActorManager.tsx  
- **Masalah**: Hook dipanggil di dalam IIFE di bagian render
- **Solusi**: Dipindahkan ke level atas komponen setelah state declarations

## Rules of Hooks yang Harus Diikuti

1. **Always call hooks at the top level** - Jangan memanggil hooks di dalam loops, conditions, atau nested functions
2. **Only call hooks from React functions** - Hanya dari React function components atau custom hooks
3. **Call hooks in the same order every time** - Urutan pemanggilan hooks harus konsisten

## Best Practices

### ✅ Do:
```typescript
function MyComponent() {
  // State declarations
  const [state1, setState1] = useState()
  const [state2, setState2] = useState()
  
  // Custom hooks
  useCustomHook()
  
  // useEffect hooks
  useEffect(() => {
    // effect logic
  }, [])
  
  // Conditional logic
  if (condition) {
    return <div>Conditional content</div>
  }
  
  // Render logic
  return <div>Main content</div>
}
```

### ❌ Don't:
```typescript
function MyComponent() {
  const [state1, setState1] = useState()
  
  // ❌ Hook di dalam conditional
  if (condition) {
    useCustomHook() // WRONG!
  }
  
  // ❌ Hook di dalam loop
  for (let i = 0; i < items.length; i++) {
    useCustomHook() // WRONG!
  }
  
  // ❌ Hook di dalam nested function
  const handleClick = () => {
    useCustomHook() // WRONG!
  }
}
```

## Testing
- ✅ Build berhasil tanpa error
- ✅ Tidak ada warning React Hooks
- ✅ Keyboard pagination tetap berfungsi normal
- ✅ Semua komponen yang menggunakan `useGlobalKeyboardPagination` telah diperbaiki

## Impact
- **Performance**: Tidak ada perubahan performa
- **Functionality**: Keyboard pagination tetap berfungsi seperti sebelumnya
- **Stability**: Menghilangkan error dan warning React
- **Maintainability**: Kode lebih mudah dipahami dan di-maintain

---

**Created**: 2024-12-19  
**Purpose**: Fix React Hooks Rules violation  
**Status**: ✅ Completed  
**Files Modified**: 
- `src/components/MovieList.tsx`
- `src/components/ActorManager.tsx`
