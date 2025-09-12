# Panduan Menampilkan Grup dan Member dengan Benar

## Overview
Dokumen ini menjelaskan cara menampilkan grup dan membernya serta gallery dengan benar berdasarkan pengalaman debugging dan perbaikan yang telah dilakukan.

## Struktur Data Grup

### 1. Data Grup (MasterDataItem dengan type='group')
```typescript
interface GroupData {
  id: string
  name: string
  type: 'group'
  createdAt: string
  jpname?: string // Nama Jepang grup
  profilePicture?: string // Foto profil grup
  website?: string // Website resmi grup
  description?: string // Deskripsi grup
  gallery?: string[] // Array URL foto gallery grup
}
```

### 2. Data Aktris dengan Assignment Grup
```typescript
interface ActressData {
  id: string
  name: string
  type: 'actress'
  // ... field aktris lainnya
  
  // Assignment grup (prioritas: selectedGroups > groupId > groupName)
  selectedGroups?: string[] // Array nama grup (SISTEM BARU - PRIORITAS TERTINGGI)
  groupId?: string // ID grup (SISTEM LAMA - DEPRECATED)
  groupName?: string // Nama grup (SISTEM LAMA - DEPRECATED)
  groupData?: { [groupName: string]: { photos: string[], alias?: string } } // Data spesifik per grup
}
```

## Cara Menampilkan Grup dengan Benar

### 1. Loading Data Grup
```typescript
// Load data grup
const groupsData = await masterDataApi.getByType('group', accessToken)

// Load data aktris dengan cache yang sudah diperbaiki
const actressesData = await masterDataApi.getByType('actress', accessToken)
```

### 2. Filtering Member Grup (PENTING!)
```typescript
// GUNAKAN LOGIKA YANG SAMA DENGAN DIALOG EDIT GROUP
const groupMembers = actressesData.filter(actress => {
  // HANYA gunakan selectedGroups (sistem baru)
  return actress.selectedGroups && actress.selectedGroups.includes(group.name)
})

// JANGAN gunakan logika lama yang mengecek semua field:
// ❌ SALAH: const hasGroup = hasSelectedGroups || hasLegacyGroup || hasGroupName
// ✅ BENAR: const hasGroup = actress.selectedGroups && actress.selectedGroups.includes(group.name)
```

### 3. Menampilkan Gallery Grup
```typescript
// Parse gallery photos dari grup data
const groupGalleryPhotos = useMemo(() => {
  // Prioritas: gallery > galleryPhotos (untuk backward compatibility)
  if (Array.isArray(group.gallery)) {
    return group.gallery.filter(url => url && url.trim())
  }
  if (Array.isArray(group.galleryPhotos)) {
    return group.galleryPhotos.filter(url => url && url.trim())
  }
  return []
}, [group.gallery, group.galleryPhotos])
```

## Komponen yang Terlibat

### 1. GroupDetailContent.tsx
- **Fungsi**: Menampilkan detail grup dan membernya
- **Key Points**:
  - Gunakan `selectedGroups` saja untuk filtering
  - Clear cache saat load untuk data fresh
  - Bandingkan dengan data dialog untuk konsistensi

### 2. GroupsContent.tsx
- **Fungsi**: Menampilkan daftar grup dan dialog edit
- **Key Points**:
  - `loadEditingGroupActresses()` hanya mengecek `selectedGroups`
  - Konsisten dengan logika filtering

### 3. GroupFormDialog.tsx
- **Fungsi**: Dialog untuk edit grup dan manage member
- **Key Points**:
  - Menampilkan member berdasarkan `selectedGroups`
  - Tombol add/remove member mengupdate `selectedGroups`

## Sistem Caching yang Benar

### 1. Cache Structure (useCachedData.ts)
```typescript
// Pastikan cache menyimpan SEMUA field grup yang diperlukan
actresses: {
  data: cache.actresses.data.map(actress => ({
    id: actress.id,
    name: actress.name,
    jpname: actress.jpname,
    profilePicture: actress.profilePicture,
    birthdate: actress.birthdate,
    type: actress.type,
    selectedGroups: actress.selectedGroups, // ✅ Grup baru
    groupId: actress.groupId, // ✅ Grup lama
    groupName: actress.groupName, // ✅ Nama grup
    groupData: actress.groupData // ✅ Data grup spesifik
  }))
}
```

### 2. Cache Management
```typescript
// Clear cache saat load grup untuk data fresh
useEffect(() => {
  localStorage.removeItem('mvdb_cached_data')
  console.log('Cache cleared for fresh data')
  loadActresses()
}, [accessToken, group.id])
```

## Debugging dan Troubleshooting

### 1. Debug Logging
```typescript
// Debug data aktris
console.log('Sample actress data (FRESH):', actressesData?.[0])
console.log('Sample actress selectedGroups:', actressesData?.[0]?.selectedGroups)

// Debug filtering
console.log('Group members found:', members.length)
console.log('Group members (FRESH DATA):', members.map(m => ({ 
  name: m.name, 
  selectedGroups: m.selectedGroups,
  matchType: 'selectedGroups'
})))

// Perbandingan dengan data dialog
const expectedMembers = ['Ayami Shunka', 'Ai Uehara', 'Tia', 'Yua Mikami', 'Moe Amatsuka', 'Tsukasa Aoi', 'Yume Kana']
console.log('Expected members (from dialog):', expectedMembers)
console.log('Actual members found:', members.map(m => m.name))
console.log('Missing members:', expectedMembers.filter(name => !members.find(m => m.name === name)))
console.log('Extra members:', members.filter(m => !expectedMembers.includes(m.name || '')).map(m => m.name))
```

### 2. Tombol Debug
```typescript
// Tombol untuk clear cache dan reload
<Button onClick={() => {
  localStorage.removeItem('mvdb_cached_data')
  localStorage.removeItem('mvdb_current_project_id')
  window.location.reload()
}}>
  Clear All Cache & Reload
</Button>

// Tombol untuk sync dengan data dialog
<Button onClick={async () => {
  // Remove extra actresses
  // Add missing actresses
  // Update database
}}>
  Sync with Dialog Data
</Button>
```

## Best Practices

### 1. Konsistensi Data
- **SELALU** gunakan `selectedGroups` untuk filtering member grup
- **JANGAN** mencampur sistem lama (`groupId`, `groupName`) dengan sistem baru
- **BANDINGKAN** data dengan dialog Edit Group untuk memastikan konsistensi

### 2. Cache Management
- **CLEAR CACHE** saat load grup untuk data fresh
- **SIMPAN SEMUA FIELD GRUP** di cache untuk kompatibilitas
- **LOG CACHE OPERATIONS** untuk debugging

### 3. Error Handling
- **VALIDATE DATA** sebelum menampilkan
- **HANDLE MISSING FIELDS** dengan fallback yang tepat
- **LOG ERRORS** dengan detail yang berguna

### 4. Performance
- **USE MEMOIZATION** untuk gallery photos
- **AVOID UNNECESSARY RE-RENDERS** dengan dependency yang tepat
- **CACHE DATA** dengan durasi yang wajar (30 menit)

## Contoh Implementasi Lengkap

```typescript
// GroupDetailContent.tsx - Implementasi yang benar
export function GroupDetailContent({ group, accessToken, onBack, onProfileSelect }) {
  const [groupMembers, setGroupMembers] = useState<MasterDataItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Clear cache untuk data fresh
    localStorage.removeItem('mvdb_cached_data')
    loadActresses()
  }, [accessToken, group.id])

  const loadActresses = async () => {
    try {
      setIsLoading(true)
      
      // Load data dengan cache
      const [actressesData, moviesData] = await Promise.all([
        loadCachedData('actresses', () => masterDataApi.getByType('actress', accessToken)),
        loadCachedData('movies', () => movieApi.getMovies(accessToken))
      ])
      
      // Filter member grup dengan logika yang benar
      const members = actressesData.filter(actress => {
        return actress.selectedGroups && actress.selectedGroups.includes(group.name)
      })
      
      setGroupMembers(members)
    } catch (error) {
      console.error('Error loading actresses:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Gallery photos
  const groupGalleryPhotos = useMemo(() => {
    if (Array.isArray(group.gallery)) {
      return group.gallery.filter(url => url && url.trim())
    }
    return []
  }, [group.gallery])

  return (
    <div>
      {/* Group Info */}
      <div>
        <h1>{group.name}</h1>
        {group.jpname && <p>{group.jpname}</p>}
        {group.description && <p>{group.description}</p>}
        {group.website && <a href={group.website}>{group.website}</a>}
      </div>

      {/* Members */}
      <div>
        <h2>Members ({groupMembers.length})</h2>
        <div className="grid">
          {groupMembers.map(actress => (
            <div key={actress.id}>
              <img src={actress.profilePicture} alt={actress.name} />
              <h3>{actress.name}</h3>
              {actress.jpname && <p>{actress.jpname}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Gallery */}
      <div>
        <h2>Gallery ({groupGalleryPhotos.length})</h2>
        <div className="grid">
          {groupGalleryPhotos.map((photoUrl, index) => (
            <img key={index} src={photoUrl} alt={`${group.name} Gallery ${index + 1}`} />
          ))}
        </div>
      </div>
    </div>
  )
}
```

## Kesimpulan

Untuk menampilkan grup dan member dengan benar:

1. **Gunakan `selectedGroups` saja** untuk filtering member
2. **Clear cache** saat load untuk data fresh
3. **Bandingkan dengan dialog** untuk konsistensi
4. **Handle gallery** dengan fallback yang tepat
5. **Debug dengan logging** yang detail
6. **Sync data** jika ada perbedaan

Dengan mengikuti panduan ini, grup dan member akan ditampilkan dengan konsisten dan akurat.
