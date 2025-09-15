# Generation View Dropdown Specification

## Overview
Implementasi dropdown "View" di tab "Members" untuk filtering aktris berdasarkan generation/lineup yang dipilih, dengan default view menggunakan group-specific profile picture dan fallback hierarchy.

## Use Cases

### Case 1: Multiple Generation
- **Gen 1**: X, Y, Z
- **Gen 2**: X, Y  
- **Gen 3**: Z

### Case 2: Multiple Lineup
- **Lineup A** (dari Gen 1): X, Y, Z
- **Lineup B** (dari Gen 2): X, Y
- **Lineup C** (dari Gen 3): Z

### Case 3: Aktris Tanpa Generation/Lineup
- **Aktris W**: tidak ada di generation dan lineup manapun

## Dropdown Options

1. **Default View** - Tampilkan semua aktris dengan group-specific profile picture + fallback hierarchy
2. **Generation: [Name]** - Filter hanya aktris yang ada di generation tersebut, dengan profpic generation
3. **Lineup: [Name] ([Generation])** - Filter hanya aktris yang ada di lineup tersebut, dengan profpic lineup

## Fallback Hierarchy

### Default View (Tanpa Filter):
1. **Group-Specific Profile Picture** - Profile picture yang sudah di-set user untuk group tersebut
2. **Latest Generation Profile Picture** - Jika tidak ada group-specific dan ada generation, gunakan generation terbaru
3. **Latest Lineup Profile Picture** - Jika tidak ada generation dan ada lineup, gunakan lineup terbaru
4. **Main Profile Picture** - Jika tidak ada lineup, gunakan foto profil utama aktris

### Filtered View (Dengan Filter):
1. **Generation/Lineup Profile Picture** - Profile picture spesifik generation/lineup yang dipilih
2. **Main Profile Picture** - Fallback jika tidak ada profile picture spesifik

### Determination Rules:

#### Latest Generation
- Generation dengan `createdAt` terbaru atau `estimatedYears` terbaru
- Jika ada multiple generation dengan tahun yang sama, gunakan yang terakhir dibuat

#### Latest Lineup
- Lineup dengan `lineupOrder` tertinggi
- Jika `lineupOrder` sama, gunakan yang `createdAt` terbaru

## Implementation Functions

### Core Functions:
```typescript
// Get default profile picture with fallback hierarchy
getDefaultProfilePicture(actress: MasterDataItem): string | null

// Get filtered profile picture for specific generation/lineup
getFilteredProfilePicture(actress: MasterDataItem, filterType: string, filterId: string): string | null

// Get latest generation profile picture
getLatestGenerationProfilePicture(actress: MasterDataItem): string | null

// Get latest lineup profile picture
getLatestLineupProfilePicture(actress: MasterDataItem): string | null

// Filter actresses based on generation/lineup
getFilteredActresses(filterType: string, filterId: string): MasterDataItem[]

// Find latest generation where actress exists
findLatestGenerationWhereActressExists(actress: MasterDataItem): MasterDataItem | null

// Find latest lineup where actress exists
findLatestLineupWhereActressExists(actress: MasterDataItem): MasterDataItem | null
```

## Example Scenarios

### Scenario 1: Default View (Tanpa Filter)
- **X** → ada group-specific profpic → gunakan group-specific profpic
- **Y** → tidak ada group-specific → fallback ke generation terbaru (Gen 2) → gunakan profpic Gen 2
- **Z** → tidak ada group-specific → fallback ke generation terbaru (Gen 3) → gunakan profpic Gen 3
- **W** → tidak ada group-specific → tidak ada generation → fallback ke lineup terbaru → tidak ada lineup → gunakan foto profil utama W

### Scenario 2: "Generation: 2022" Selected (Filtered)
- **X** → ada di Gen 2 → tampilkan dengan profpic Gen 2
- **Y** → ada di Gen 2 → tampilkan dengan profpic Gen 2
- **Z** → tidak ada di Gen 2 → tidak ditampilkan (filtered out)
- **W** → tidak ada di Gen 2 → tidak ditampilkan (filtered out)

### Scenario 3: "Generation: 2023" Selected (Filtered)
- **X** → tidak ada di Gen 3 → tidak ditampilkan (filtered out)
- **Y** → tidak ada di Gen 3 → tidak ditampilkan (filtered out)
- **Z** → ada di Gen 3 → tampilkan dengan profpic Gen 3
- **W** → tidak ada di Gen 3 → tidak ditampilkan (filtered out)

### Scenario 4: Group Tanpa Generation & Lineup
- **A** → ada group-specific profpic → tampilkan group-specific profpic
- **B** → tidak ada group-specific → tidak ada generation → tidak ada lineup → tampilkan main profpic
- **C** → tidak ada group-specific → tidak ada generation → tidak ada lineup → tampilkan main profpic

## Data Structure Requirements

### Actress Data:
```typescript
interface MasterDataItem {
  generationData?: { [generationId: string]: { profilePicture?: string, photos?: string[] } }
  lineupData?: { [lineupId: string]: { profilePicture?: string, photos?: string[] } }
  profilePicture?: string // Main profile picture
}
```

### Generation Data:
```typescript
interface MasterDataItem {
  id: string
  name: string
  createdAt: string
  estimatedYears?: string
}
```

### Lineup Data:
```typescript
interface MasterDataItem {
  id: string
  name: string
  generationId: string
  lineupOrder: number
  createdAt: string
}
```

## Testing Cases

1. **Single Generation** - Aktris hanya ada di satu generation
2. **Multiple Generation** - Aktris ada di multiple generation
3. **Single Lineup** - Aktris hanya ada di satu lineup
4. **Multiple Lineup** - Aktris ada di multiple lineup
5. **No Generation/Lineup** - Aktris tidak ada di generation dan lineup manapun
6. **Mixed Cases** - Kombinasi dari semua case di atas

## Notes

- Semua fallback harus graceful dan tidak throw error
- Jika tidak ada profile picture di level manapun, tampilkan placeholder
- Performance: Cache hasil lookup untuk menghindari multiple API calls
- UI: Tampilkan loading state saat switching view mode
