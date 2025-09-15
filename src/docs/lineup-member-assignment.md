# Lineup Member Assignment Feature

## Overview
Fitur ini memungkinkan Anda untuk langsung menambahkan members (actresses) ke lineup saat membuat lineup baru, termasuk mengatur alias dan profile picture khusus untuk lineup tersebut.

## Cara Menggunakan

### 1. Membuat Lineup dengan Members

#### Langkah-langkah:
1. **Buka Generation Management**
   - Pilih group yang ingin dikelola
   - Buka tab "Lineup Management"
   - Pilih generation yang ingin dikelola

2. **Klik "Tambah Lineup"**
   - Form akan muncul dengan section untuk member selection

3. **Isi Data Lineup**
   - **Nama Lineup**: Nama lineup (required)
   - **Tipe Lineup**: Pilih dari dropdown (Main, Sub, Graduated, Trainee, Special)
   - **Urutan Tampil**: Urutan tampil lineup (default: 1)
   - **Deskripsi**: Deskripsi lineup (opsional)

4. **Pilih Members**
   - Scroll ke section "Pilih Members (Opsional)"
   - Centang checkbox untuk actress yang ingin ditambahkan ke lineup
   - Setiap actress akan menampilkan foto profil dan nama

5. **Atur Pengaturan Members**
   - Setelah memilih members, section "Pengaturan Members" akan muncul
   - Untuk setiap member yang dipilih:
     - **Alias untuk lineup ini**: Alias khusus untuk lineup ini
     - **Profile picture URL**: URL foto profil khusus untuk lineup ini

6. **Simpan**
   - Klik "Simpan" untuk membuat lineup dan assign members
   - System akan otomatis mengupdate data actress dengan lineup data

### 2. Struktur Data

#### Lineup Data
```typescript
interface MasterDataItem {
  id: string
  name: string
  type: 'lineup'
  generationId: string
  generationName: string
  lineupType: string
  lineupOrder: number
  description?: string
  createdAt: string
}
```

#### Actress Lineup Data
```typescript
interface MasterDataItem {
  // ... existing fields
  lineupData?: {
    [lineupId: string]: {
      alias?: string
      profilePicture?: string
      photos?: string[]
    }
  }
}
```

### 3. UI Components

#### Form Structure
```
┌─ Lineup Management ─────────────────────────┐
│                                             │
│  ┌─ Basic Info ──────────────────────────┐   │
│  │ • Nama Lineup (required)              │   │
│  │ • Tipe Lineup (dropdown)              │   │
│  │ • Urutan Tampil (number)              │   │
│  │ • Deskripsi (textarea)                │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─ Member Selection ────────────────────┐   │
│  │ ☐ Actress 1 [Photo] Name             │   │
│  │ ☐ Actress 2 [Photo] Name             │   │
│  │ ☐ Actress 3 [Photo] Name             │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─ Member Settings ────────────────────┐   │
│  │ [Photo] Actress 1                    │   │
│  │   Alias: [input] Profile: [input]     │   │
│  │                                       │   │
│  │ [Photo] Actress 2                    │   │
│  │   Alias: [input] Profile: [input]     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  [Simpan] [Batal]                          │
└─────────────────────────────────────────────┘
```

### 4. Technical Implementation

#### Frontend (LineupManagement.tsx)
```typescript
interface LineupFormData {
  name: string
  lineupType: string
  lineupOrder: number
  description?: string
  selectedActresses: string[]
  actressAliases: { [actressId: string]: string }
  actressProfilePictures: { [actressId: string]: string }
}

const handleSubmit = async () => {
  // 1. Create lineup
  const createdLineup = await masterDataApi.createExtended('lineup', lineupData, accessToken)
  
  // 2. Update selected actresses with lineup data
  if (formData.selectedActresses.length > 0 && createdLineup) {
    for (const actressId of formData.selectedActresses) {
      const updateData: Partial<MasterDataItem> = {
        lineupData: {
          ...actress.lineupData,
          [createdLineup.id]: {
            alias: formData.actressAliases[actressId] || undefined,
            profilePicture: formData.actressProfilePictures[actressId] || undefined
          }
        }
      }
      await masterDataApi.update(actressId, updateData, accessToken)
    }
  }
}
```

#### Server-side (masterDataApi.ts)
```typescript
export async function createLineupData(c: Context) {
  const { name, generationId, generationName, lineupType, lineupOrder, description } = body
  
  const newItem: MasterDataItem = {
    id: crypto.randomUUID(),
    name: name.trim(),
    type: 'lineup',
    createdAt: new Date().toISOString(),
    generationId: generationId.trim(),
    generationName: generationName?.trim() || undefined,
    lineupType: lineupType?.trim() || 'Main',
    lineupOrder: lineupOrder || 1,
    description: description?.trim() || undefined
  }
  
  await kv.set(`master_lineup_${id}`, JSON.stringify(newItem))
  return c.json({ data: newItem })
}
```

### 5. Data Flow

#### Creation Flow
```
1. User fills form with lineup data + selected actresses
2. Frontend calls createExtended('lineup', lineupData, token)
3. Server creates lineup and returns lineup object
4. Frontend loops through selected actresses
5. For each actress, frontend calls update(actressId, lineupData, token)
6. Server updates actress with lineup-specific data
7. UI refreshes to show new lineup and updated actresses
```

#### Data Storage
```
Lineup Storage:
master_lineup_{lineupId} = {
  id: "lineup-uuid",
  name: "1st Generation Main",
  type: "lineup",
  generationId: "generation-uuid",
  lineupType: "Main",
  lineupOrder: 1,
  description: "Main lineup for 1st generation"
}

Actress Storage:
master_actress_{actressId} = {
  id: "actress-uuid",
  name: "Actress Name",
  type: "actress",
  lineupData: {
    "lineup-uuid": {
      alias: "Lineup Alias",
      profilePicture: "lineup-specific-photo.jpg"
    }
  }
}
```

### 6. Features

#### Member Selection
- **Checkbox Interface**: Easy selection with visual feedback
- **Photo Preview**: Shows actress profile pictures
- **Name Display**: Shows actress name and current alias
- **Scrollable List**: Handles large number of actresses

#### Member Settings
- **Per-Lineup Alias**: Each actress can have different alias per lineup
- **Per-Lineup Profile Picture**: Each actress can have different profile picture per lineup
- **Real-time Updates**: Changes are reflected immediately in UI

#### Validation
- **Required Fields**: Lineup name is required
- **Duplicate Prevention**: Prevents duplicate lineup names in same generation
- **Data Integrity**: Ensures lineup data is properly linked to actresses

### 7. Error Handling

#### Common Errors
```typescript
// Lineup creation failed
if (!createdLineup) {
  throw new Error('Failed to create lineup')
}

// Actress update failed
try {
  await masterDataApi.update(actressId, updateData, accessToken)
} catch (error) {
  console.error(`Failed to update actress ${actressId}:`, error)
  // Continue with other actresses
}
```

#### User Feedback
```typescript
// Success
toast.success('Lineup berhasil dibuat dengan members')

// Error
setError('Gagal menyimpan lineup')
```

### 8. Best Practices

#### Data Management
- **Atomic Operations**: Create lineup first, then update actresses
- **Error Recovery**: If actress update fails, lineup still exists
- **Data Consistency**: Always validate lineup-actress relationships

#### UI/UX
- **Progressive Disclosure**: Show member settings only when members selected
- **Visual Feedback**: Loading states and success/error messages
- **Accessibility**: Proper labels and keyboard navigation

#### Performance
- **Batch Updates**: Update multiple actresses efficiently
- **Lazy Loading**: Load actresses only when needed
- **Caching**: Cache lineup and actress data for better performance

### 9. Future Enhancements

#### Planned Features
- **Bulk Member Assignment**: Assign multiple actresses to multiple lineups
- **Member Import**: Import members from CSV/Excel
- **Lineup Templates**: Save lineup configurations as templates
- **Advanced Filtering**: Filter actresses by various criteria

#### Integration Points
- **Movie Assignment**: Assign movies to specific lineups
- **Photo Management**: Manage lineup-specific photo galleries
- **Statistics**: Track lineup performance and member changes

---

**Last Updated:** December 2024  
**Version:** 1.0.0  
**Maintainer:** Development Team
