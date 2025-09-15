# Lineup Actress Filtering Fallback Fix

## Masalah: Semua Aktris Terload Bukan Hanya Group Members

### Gejala
- Saat edit lineup, semua aktris terload bukan hanya yang dari group
- List aktris tidak terfilter dengan benar
- Fallback logic yang tidak perlu menyebabkan semua aktris muncul

### Root Cause

#### **Fallback Logic yang Bermasalah**
```typescript
// SALAH - fallback yang tidak perlu
if (groupActresses.length === 0) {
  console.log('No actresses found with groupId, trying alternative filtering...')
  
  // Try filtering by generationData
  const generationActresses = allActresses.filter(actress => 
    actress.generationData && 
    Object.keys(actress.generationData).some(genId => genId === generationId)
  )
  
  if (generationActresses.length > 0) {
    console.log('Found actresses by generation:', generationActresses.length)
    setActresses(generationActresses)
  } else {
    // Last resort: show all actresses for manual selection
    console.log('No actresses found by generation, showing all actresses')
    setActresses(allActresses) // ❌ MASALAH!
  }
} else {
  setActresses(groupActresses)
}
```

**Masalah**: Jika tidak ada aktris yang ditemukan dengan `groupId` atau `generationData`, fallback akan show semua aktris sebagai "last resort".

### Solusi yang Diterapkan

#### **Hapus Fallback Logic yang Tidak Perlu**
```typescript
// BENAR - hanya show aktris dari group
// Set actresses for this group only
setActresses(groupActresses)
```

### Perubahan yang Dibuat

#### **1. Simplify Filtering Logic**
**File**: `src/components/LineupManagement.tsx`

**Sebelum:**
```typescript
// If no actresses found with groupId, try alternative filtering
if (groupActresses.length === 0) {
  console.log('No actresses found with groupId, trying alternative filtering...')
  
  // Try filtering by generationData
  const generationActresses = allActresses.filter(actress => 
    actress.generationData && 
    Object.keys(actress.generationData).some(genId => genId === generationId)
  )
  
  if (generationActresses.length > 0) {
    console.log('Found actresses by generation:', generationActresses.length)
    setActresses(generationActresses)
  } else {
    // Last resort: show all actresses for manual selection
    console.log('No actresses found by generation, showing all actresses')
    setActresses(allActresses)
  }
} else {
  setActresses(groupActresses)
}
```

**Sesudah:**
```typescript
// Set actresses for this group only
setActresses(groupActresses)
```

### Konteks Penggunaan

#### **Kode yang Diperbaiki**
```typescript
// Di loadData function
const loadData = async () => {
  try {
    setLoading(true)
    setError(null)

    // Load lineups for this generation
    const allLineups = await masterDataApi.getByType('lineup', accessToken)
    const generationLineups = allLineups.filter(lineup => lineup.generationId === generationId)
    
    // Sort by lineupOrder
    generationLineups.sort((a, b) => (a.lineupOrder || 0) - (b.lineupOrder || 0))
    setLineups(generationLineups)

    // Load actresses for this group
    const allActresses = await masterDataApi.getByType('actress', accessToken)
    console.log('All actresses loaded:', allActresses.length)
    console.log('Group ID:', groupId)
    
    const groupActresses = allActresses.filter(actress => {
      const hasGroup = actress.selectedGroups && actress.selectedGroups.includes(groupId)
      console.log(`Actress ${actress.name}:`, {
        selectedGroups: actress.selectedGroups,
        hasGroup,
        groupId
      })
      return hasGroup
    })
    
    console.log('Group actresses found:', groupActresses.length)
    
    // Set actresses for this group only
    setActresses(groupActresses)

  } catch (err) {
    console.error('Error loading lineup data:', err)
    setError('Gagal memuat data lineup')
  } finally {
    setLoading(false)
  }
}
```

### Testing

#### **1. Test Group Filtering**
```javascript
// Di browser console
console.log('Testing group filtering...')
// 1. Check apakah hanya aktris dari group yang muncul
// 2. Verify tidak ada aktris dari group lain
// 3. Check console logs untuk filtering
```

#### **2. Test Edit Lineup**
```javascript
// Di browser console
console.log('Testing edit lineup...')
// 1. Edit lineup yang sudah ada
// 2. Check apakah hanya group members yang muncul
// 3. Verify member count matches
```

### Debug Information

#### **1. Console Logs yang Diharapkan**
```
All actresses loaded: 150
Group ID: group-id-123
Actress Tsukasa Aoi: { selectedGroups: ["group-id-123"], hasGroup: true, groupId: "group-id-123" }
Actress Mei Washio: { selectedGroups: ["group-id-123"], hasGroup: true, groupId: "group-id-123" }
Group actresses found: 2
```

#### **2. Network Requests**
- **GET** `/master/actress` - Load all actresses
- **Filter by groupId** - Client-side filtering
- **Set filtered actresses** - Only group members

### Common Issues

#### **1. All Actresses Loading**
**Problem**: Fallback logic menyebabkan semua aktris terload
**Solution**: Hapus fallback logic yang tidak perlu

#### **2. Wrong Group Filtering**
**Problem**: Aktris dari group lain muncul
**Solution**: Pastikan filtering berdasarkan `selectedGroups` yang benar

#### **3. Empty List**
**Problem**: Tidak ada aktris yang muncul
**Solution**: Check apakah aktris memiliki `selectedGroups` yang benar

### Best Practices

#### **1. Strict Filtering**
```typescript
// Gunakan filtering yang strict
const groupActresses = allActresses.filter(actress => {
  const hasGroup = actress.selectedGroups && actress.selectedGroups.includes(groupId)
  return hasGroup
})
```

#### **2. No Fallback Logic**
```typescript
// Jangan gunakan fallback yang tidak perlu
// Set actresses for this group only
setActresses(groupActresses)
```

#### **3. Clear Logging**
```typescript
// Log filtering process untuk debug
console.log('All actresses loaded:', allActresses.length)
console.log('Group ID:', groupId)
console.log('Group actresses found:', groupActresses.length)
```

### Alternative Solutions

#### **1. Server-Side Filtering**
```typescript
// Filter di server side
const groupActresses = await masterDataApi.getByType('actress', accessToken, {
  filter: { selectedGroups: groupId }
})
```

#### **2. Multiple Group Support**
```typescript
// Support multiple groups
const groupActresses = allActresses.filter(actress => {
  return actress.selectedGroups && 
         actress.selectedGroups.some(group => group === groupId)
})
```

#### **3. Generation-Based Filtering**
```typescript
// Filter berdasarkan generation juga
const groupActresses = allActresses.filter(actress => {
  const hasGroup = actress.selectedGroups && actress.selectedGroups.includes(groupId)
  const hasGeneration = actress.generationData && 
                       Object.keys(actress.generationData).some(genId => genId === generationId)
  return hasGroup || hasGeneration
})
```

### Monitoring

#### **1. Filtering Performance**
```typescript
// Monitor filtering performance
const startTime = Date.now()
const groupActresses = allActresses.filter(actress => {
  const hasGroup = actress.selectedGroups && actress.selectedGroups.includes(groupId)
  return hasGroup
})
const endTime = Date.now()
console.log(`Filtering took ${endTime - startTime}ms`)
```

#### **2. Group Membership Tracking**
```typescript
// Track group membership
const groupMembershipTracker = {
  totalActresses: allActresses.length,
  groupActresses: groupActresses.length,
  otherActresses: allActresses.length - groupActresses.length
}
```

#### **3. Filtering Accuracy**
```typescript
// Check filtering accuracy
const accuracyCheck = groupActresses.every(actress => 
  actress.selectedGroups && actress.selectedGroups.includes(groupId)
)
console.log('Filtering accuracy:', accuracyCheck)
```

---

**Last Updated:** December 2024  
**Version:** 1.0.0  
**Maintainer:** Development Team
