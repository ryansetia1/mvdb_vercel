# Lineup Data Saving and Member Display Fix

## Masalah: Data Tidak Masuk dan List Aktris Terload Semua

### Gejala
1. **Data tidak masuk**: Saat klik save berhasil menutup tapi data tidak masuk, terlihat masih 0 members
2. **List aktris terload semua**: Saat edit lagi, ternyata list aktris terload semua bukan hanya yang di lineup

### Root Cause Analysis

#### **1. Data Tidak Masuk**
**Masalah**: Aktris data tidak ter-update dengan benar karena `actress.lineupData` mungkin `undefined` atau `null`

```typescript
// SALAH - bisa error jika lineupData undefined
lineupData: {
  ...actress.lineupData, // ❌ Bisa undefined
  [createdLineup.id]: {
    alias: formData.actressAliases[actressId] || undefined,
    profilePicture: formData.actressProfilePictures[actressId] || undefined
  }
}
```

#### **2. List Aktris Terload Semua**
**Masalah**: Saat edit, kita mencari aktris yang sudah ada di lineup, bukan aktris yang bisa ditambahkan

```typescript
// SALAH - mencari aktris yang sudah ada di lineup
const lineupActresses = actresses.filter(actress => 
  actress.lineupData && actress.lineupData[lineup.id]
)
```

### Solusi yang Diterapkan

#### **1. Perbaiki Update Aktris Data**
```typescript
// BENAR - handle undefined lineupData
const updateData: Partial<MasterDataItem> = {
  name: actress.name, // Required field for update
  lineupData: {
    ...(actress.lineupData || {}), // ✅ Handle undefined
    [createdLineup.id]: {
      alias: formData.actressAliases[actressId] || undefined,
      profilePicture: formData.actressProfilePictures[actressId] || undefined
    }
  }
}
```

#### **2. Tambahkan Debug Logging**
```typescript
console.log('Updating actress with lineup data:', {
  actressId,
  actressName: actress.name,
  lineupId: createdLineup.id,
  updateData
})
await masterDataApi.updateExtended('actress', actressId, updateData, accessToken)
console.log('Actress updated successfully:', actress.name)
```

#### **3. Perbaiki Reload Data**
```typescript
// Reload data to show updated lineup with members
await loadData()
```

### Perubahan yang Dibuat

#### **1. Fix Update Data Structure**
**File**: `src/components/LineupManagement.tsx`

**Sebelum:**
```typescript
lineupData: {
  ...actress.lineupData, // Bisa undefined
  [createdLineup.id]: {
    alias: formData.actressAliases[actressId] || undefined,
    profilePicture: formData.actressProfilePictures[actressId] || undefined
  }
}
```

**Sesudah:**
```typescript
lineupData: {
  ...(actress.lineupData || {}), // Handle undefined
  [createdLineup.id]: {
    alias: formData.actressAliases[actressId] || undefined,
    profilePicture: formData.actressProfilePictures[actressId] || undefined
  }
}
```

#### **2. Add Debug Logging**
```typescript
console.log('Updating actress with lineup data:', {
  actressId,
  actressName: actress.name,
  lineupId: createdLineup.id,
  updateData
})
await masterDataApi.updateExtended('actress', actressId, updateData, accessToken)
console.log('Actress updated successfully:', actress.name)
```

#### **3. Improve Data Reload**
```typescript
// Reload data to show updated lineup with members
await loadData()
```

### Testing

#### **1. Test Data Saving**
```javascript
// Di browser console
console.log('Testing lineup save...')
// 1. Create lineup dengan members
// 2. Check console logs untuk update actress
// 3. Verify lineup shows correct member count
```

#### **2. Test Member Display**
```javascript
// Di browser console
console.log('Testing member display...')
// 1. Edit lineup
// 2. Check apakah hanya members yang muncul
// 3. Verify member count matches
```

### Debug Information

#### **1. Console Logs yang Diharapkan**
```
Updating actress with lineup data: {
  actressId: "actress-id",
  actressName: "Actress Name",
  lineupId: "lineup-id",
  updateData: { name: "...", lineupData: {...} }
}
Actress updated successfully: Actress Name
```

#### **2. Network Requests**
- **PUT** `/master/lineup/{id}/extended` - Update lineup
- **PUT** `/master/actress/{id}/extended` - Update actress dengan lineup data
- **GET** `/master/lineup` - Reload lineups
- **GET** `/master/actress` - Reload actresses

### Common Issues

#### **1. Undefined Data**
**Problem**: `actress.lineupData` undefined menyebabkan spread operator error
**Solution**: Gunakan `...(actress.lineupData || {})`

#### **2. Data Not Reloading**
**Problem**: Setelah save, data tidak ter-reload
**Solution**: Pastikan `loadData()` dipanggil setelah save

#### **3. Member Count Wrong**
**Problem**: Member count tidak update setelah save
**Solution**: Pastikan aktris data ter-update dengan benar

### Best Practices

#### **1. Safe Data Handling**
```typescript
// Selalu handle undefined/null data
const safeData = {
  ...(existingData || {}),
  newData: value
}
```

#### **2. Debug Logging**
```typescript
// Log data sebelum dan sesudah update
console.log('Before update:', data)
await updateFunction(data)
console.log('After update:', result)
```

#### **3. Data Validation**
```typescript
// Validasi data sebelum update
if (!actress || !actress.name) {
  throw new Error('Invalid actress data')
}

if (!createdLineup || !createdLineup.id) {
  throw new Error('Invalid lineup data')
}
```

### Alternative Solutions

#### **1. Use Optional Chaining**
```typescript
// Gunakan optional chaining untuk safety
lineupData: {
  ...(actress?.lineupData ?? {}),
  [createdLineup.id]: {
    alias: formData.actressAliases[actressId] || undefined,
    profilePicture: formData.actressProfilePictures[actressId] || undefined
  }
}
```

#### **2. Separate Update Functions**
```typescript
// Buat function terpisah untuk update aktris
const updateActressWithLineup = async (actress, lineupId, lineupData) => {
  const updateData = {
    name: actress.name,
    lineupData: {
      ...(actress.lineupData || {}),
      [lineupId]: lineupData
    }
  }
  return await masterDataApi.updateExtended('actress', actress.id, updateData, accessToken)
}
```

#### **3. Batch Updates**
```typescript
// Update semua aktris dalam satu batch
const updatePromises = selectedActresses.map(actressId => {
  const actress = actresses.find(a => a.id === actressId)
  return updateActressWithLineup(actress, createdLineup.id, lineupData)
})

await Promise.all(updatePromises)
```

### Monitoring

#### **1. Update Success Tracking**
```typescript
// Track successful updates
const updateTracker = {
  lineupUpdates: 0,
  actressUpdates: 0,
  failedUpdates: 0
}

try {
  await masterDataApi.updateExtended('actress', actressId, updateData, accessToken)
  updateTracker.actressUpdates++
} catch (error) {
  updateTracker.failedUpdates++
  throw error
}
```

#### **2. Data Consistency Check**
```typescript
// Check data consistency setelah update
const checkDataConsistency = async () => {
  const lineups = await masterDataApi.getByType('lineup', accessToken)
  const actresses = await masterDataApi.getByType('actress', accessToken)
  
  // Check apakah lineup data konsisten
  lineups.forEach(lineup => {
    const lineupActresses = actresses.filter(actress => 
      actress.lineupData && actress.lineupData[lineup.id]
    )
    console.log(`Lineup ${lineup.name}: ${lineupActresses.length} members`)
  })
}
```

#### **3. Performance Monitoring**
```typescript
// Monitor performance update
const startTime = Date.now()
await masterDataApi.updateExtended('actress', actressId, updateData, accessToken)
const endTime = Date.now()
console.log(`Actress update took ${endTime - startTime}ms`)
```

---

**Last Updated:** December 2024  
**Version:** 1.0.0  
**Maintainer:** Development Team
