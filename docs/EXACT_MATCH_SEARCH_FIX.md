# Exact Match Search Fix

## Masalah yang Diperbaiki
User harus scroll dulu untuk menemukan hasil pencarian exact match dalam cast selector. Hasil pencarian tidak diurutkan berdasarkan relevansi, sehingga exact match tidak tampil di posisi teratas.

## Perbaikan yang Dilakukan

### 1. Search State Management
- **Sebelum**: Menggunakan default Command component search behavior
- **Sesudah**: Menambahkan `searchQuery` state untuk mengontrol pencarian secara manual

```tsx
// Sebelum
<CommandInput placeholder="Cari aktris atau aktor..." />

// Sesudah
<CommandInput 
  placeholder="Cari aktris atau aktor..." 
  value={searchQuery}
  onValueChange={setSearchQuery}
/>
```

### 2. Custom Match Scoring System
Menambahkan sistem scoring untuk mengurutkan hasil berdasarkan relevansi:

```tsx
const getMatchScore = (item: MasterDataItem, query: string): number => {
  if (!query.trim()) return 0
  
  const queryLower = query.toLowerCase()
  const displayName = getDisplayName(item).toLowerCase()
  const aliases = getAllAliases(item)
  
  // Exact match gets highest score
  if (displayName === queryLower) return 100
  
  // Starts with query gets high score
  if (displayName.startsWith(queryLower)) return 90
  
  // Contains query gets medium score
  if (displayName.includes(queryLower)) return 80
  
  // Alias exact match gets medium-high score
  if (aliases.some(alias => alias.toLowerCase() === queryLower)) return 85
  
  // Alias starts with query gets medium score
  if (aliases.some(alias => alias.toLowerCase().startsWith(queryLower))) return 75
  
  // Alias contains query gets low score
  if (aliases.some(alias => alias.toLowerCase().includes(queryLower))) return 60
  
  return 0
}
```

### 3. Smart Sorting Algorithm
Implementasi sorting yang mengutamakan relevansi:

```tsx
const getSortedCastOptions = (items: MasterDataItem[], type: 'actress' | 'actor') => {
  if (!searchQuery.trim()) {
    return items.sort((a, b) => getDisplayName(a).localeCompare(getDisplayName(b)))
  }
  
  return items
    .map(item => ({ ...item, type, matchScore: getMatchScore(item, searchQuery) }))
    .filter(item => item.matchScore > 0)
    .sort((a, b) => {
      // First sort by match score (descending)
      if (a.matchScore !== b.matchScore) {
        return b.matchScore - a.matchScore
      }
      // Then sort alphabetically
      return getDisplayName(a).localeCompare(getDisplayName(b))
    })
}
```

### 4. Search Reset on Close
Menambahkan reset search query ketika popover ditutup:

```tsx
<Popover open={open} onOpenChange={(newOpen) => {
  setOpen(newOpen)
  if (!newOpen) {
    setSearchQuery('') // Reset search when closing
  }
}}>
```

## Scoring System Details

| Match Type | Score | Description |
|------------|-------|-------------|
| Exact Match | 100 | Nama persis sama dengan query |
| Starts With | 90 | Nama dimulai dengan query |
| Contains | 80 | Nama mengandung query |
| Alias Exact | 85 | Alias persis sama dengan query |
| Alias Starts | 75 | Alias dimulai dengan query |
| Alias Contains | 60 | Alias mengandung query |

## Testing Results

✅ **Exact Match Test**: "ayami mikura" → Ayami Mikura (Score: 100)  
✅ **Starts With Test**: "haruna" → Haruna Nakayama (Score: 90)  
✅ **Contains Test**: "mikura" → Ayami Mikura (Score: 80)  
✅ **Alias Exact Test**: "yu arima" → Haruna Nakayama (Score: 85)  

## Hasil Perbaikan
- ✅ **Exact match tampil di atas** tanpa perlu scroll
- ✅ **Relevansi pencarian** berdasarkan scoring system
- ✅ **Alias search** bekerja dengan baik
- ✅ **Performance optimal** dengan filtering yang efisien
- ✅ **User experience** yang lebih baik dengan hasil yang relevan

## File Modified
- `src/components/CombinedCastSelector.tsx`

## Impact
User sekarang bisa langsung menemukan exact match di posisi teratas tanpa perlu scroll, membuat pencarian cast menjadi lebih efisien dan user-friendly.
