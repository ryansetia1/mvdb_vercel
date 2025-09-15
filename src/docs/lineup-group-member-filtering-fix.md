# Lineup Group Member Filtering Fix

## Masalah: Tidak Ada Aktris yang Muncul

### Gejala
- Saat edit lineup, tidak ada aktris yang muncul
- Message "Tidak ada actress yang tersedia" ditampilkan
- Filtering terlalu ketat dan tidak menemukan aktris dari group

### Root Cause

#### **Filtering Terlalu Ketat**
```typescript
// SALAH - hanya check selectedGroups
const groupActresses = allActresses.filter(actress => {
  const hasGroup = actress.selectedGroups && actress.selectedGroups.includes(groupId)
  return hasGroup
})
```

**Masalah**: Aktris mungkin di-assign ke group menggunakan field `groupId` langsung, bukan `selectedGroups`.

### Solusi yang Diterapkan

#### **Check Kedua Field untuk Group Assignment**
```typescript
// BENAR - check both selectedGroups dan groupId
const groupActresses = allActresses.filter(actress => {
  // Check both selectedGroups and groupId fields
  const hasSelectedGroups = actress.selectedGroups && actress.selectedGroups.includes(groupId)
  const hasGroupId = actress.groupId === groupId
  const hasGroup = hasSelectedGroups || hasGroupId
  
  return hasGroup
})
```

### Perubahan yang Dibuat

#### **1. Enhanced Group Filtering**
**File**: `src/components/LineupManagement.tsx`

**Sebelum:**
```typescript
const groupActresses = allActresses.filter(actress => {
  const hasGroup = actress.selectedGroups && actress.selectedGroups.includes(groupId)
  console.log(`Actress ${actress.name}:`, {
    selectedGroups: actress.selectedGroups,
    hasGroup,
    groupId
  })
  return hasGroup
})
```

**Sesudah:**
```typescript
const groupActresses = allActresses.filter(actress => {
  // Check both selectedGroups and groupId fields
  const hasSelectedGroups = actress.selectedGroups && actress.selectedGroups.includes(groupId)
  const hasGroupId = actress.groupId === groupId
  const hasGroup = hasSelectedGroups || hasGroupId
  
  console.log(`Actress ${actress.name}:`, {
    selectedGroups: actress.selectedGroups,
    groupId: actress.groupId,
    hasSelectedGroups,
    hasGroupId,
    hasGroup,
    targetGroupId: groupId
  })
  return hasGroup
})
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
      // Check both selectedGroups and groupId fields
      const hasSelectedGroups = actress.selectedGroups && actress.selectedGroups.includes(groupId)
      const hasGroupId = actress.groupId === groupId
      const hasGroup = hasSelectedGroups || hasGroupId
      
      console.log(`Actress ${actress.name}:`, {
        selectedGroups: actress.selectedGroups,
        groupId: actress.groupId,
        hasSelectedGroups,
        hasGroupId,
        hasGroup,
        targetGroupId: groupId
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

#### **1. Test Group Member Loading**
```javascript
// Di browser console
console.log('Testing group member loading...')
// 1. Check apakah aktris dari group muncul
// 2. Verify filtering berdasarkan groupId dan selectedGroups
// 3. Check console logs untuk debugging
```

#### **2. Test Different Group Assignments**
```javascript
// Di browser console
console.log('Testing different group assignments...')
// 1. Check aktris dengan groupId field
// 2. Check aktris dengan selectedGroups field
// 3. Verify kedua field berfungsi
```

### Debug Information

#### **1. Console Logs yang Diharapkan**
```
All actresses loaded: 150
Group ID: group-id-123
Actress Tsukasa Aoi: { 
  selectedGroups: ["group-id-123"], 
  groupId: "group-id-123", 
  hasSelectedGroups: true, 
  hasGroupId: true, 
  hasGroup: true, 
  targetGroupId: "group-id-123" 
}
Actress Mei Washio: { 
  selectedGroups: null, 
  groupId: "group-id-123", 
  hasSelectedGroups: false, 
  hasGroupId: true, 
  hasGroup: true, 
  targetGroupId: "group-id-123" 
}
Group actresses found: 2
```

#### **2. Network Requests**
- **GET** `/master/actress` - Load all actresses
- **Filter by groupId OR selectedGroups** - Client-side filtering
- **Set filtered actresses** - Only group members

### Common Issues

#### **1. No Actresses Found**
**Problem**: Filtering terlalu ketat, tidak menemukan aktris
**Solution**: Check kedua field `groupId` dan `selectedGroups`

#### **2. Wrong Group Assignment**
**Problem**: Aktris tidak di-assign ke group dengan benar
**Solution**: Pastikan aktris memiliki `groupId` atau `selectedGroups` yang benar

#### **3. Empty List**
**Problem**: Tidak ada aktris yang muncul
**Solution**: Check apakah aktris memiliki group assignment yang valid

### Best Practices

#### **1. Multiple Field Checking**
```typescript
// Check multiple fields untuk group assignment
const hasSelectedGroups = actress.selectedGroups && actress.selectedGroups.includes(groupId)
const hasGroupId = actress.groupId === groupId
const hasGroup = hasSelectedGroups || hasGroupId
```

#### **2. Comprehensive Logging**
```typescript
// Log semua field yang relevan
console.log(`Actress ${actress.name}:`, {
  selectedGroups: actress.selectedGroups,
  groupId: actress.groupId,
  hasSelectedGroups,
  hasGroupId,
  hasGroup,
  targetGroupId: groupId
})
```

#### **3. Fallback Logic**
```typescript
// Gunakan OR logic untuk multiple assignment methods
const hasGroup = hasSelectedGroups || hasGroupId
```

### Alternative Solutions

#### **1. Server-Side Filtering**
```typescript
// Filter di server side dengan multiple fields
const groupActresses = await masterDataApi.getByType('actress', accessToken, {
  filter: { 
    $or: [
      { groupId: groupId },
      { selectedGroups: { $contains: groupId } }
    ]
  }
})
```

#### **2. Group Assignment Normalization**
```typescript
// Normalize group assignment
const normalizeGroupAssignment = (actress) => {
  if (actress.groupId) {
    return [actress.groupId]
  } else if (actress.selectedGroups) {
    return actress.selectedGroups
  } else {
    return []
  }
}

const groupActresses = allActresses.filter(actress => {
  const groups = normalizeGroupAssignment(actress)
  return groups.includes(groupId)
})
```

#### **3. Generation-Agnostic Filtering**
```typescript
// Filter berdasarkan group tanpa mempertimbangkan generation
const groupActresses = allActresses.filter(actress => {
  const hasSelectedGroups = actress.selectedGroups && actress.selectedGroups.includes(groupId)
  const hasGroupId = actress.groupId === groupId
  const hasGroup = hasSelectedGroups || hasGroupId
  
  // Ignore generation, focus on group membership
  return hasGroup
})
```

### Monitoring

#### **1. Group Assignment Tracking**
```typescript
// Track group assignment methods
const groupAssignmentTracker = {
  byGroupId: 0,
  bySelectedGroups: 0,
  byBoth: 0,
  none: 0
}

allActresses.forEach(actress => {
  const hasSelectedGroups = actress.selectedGroups && actress.selectedGroups.includes(groupId)
  const hasGroupId = actress.groupId === groupId
  
  if (hasSelectedGroups && hasGroupId) {
    groupAssignmentTracker.byBoth++
  } else if (hasSelectedGroups) {
    groupAssignmentTracker.bySelectedGroups++
  } else if (hasGroupId) {
    groupAssignmentTracker.byGroupId++
  } else {
    groupAssignmentTracker.none++
  }
})
```

#### **2. Filtering Performance**
```typescript
// Monitor filtering performance
const startTime = Date.now()
const groupActresses = allActresses.filter(actress => {
  const hasSelectedGroups = actress.selectedGroups && actress.selectedGroups.includes(groupId)
  const hasGroupId = actress.groupId === groupId
  return hasSelectedGroups || hasGroupId
})
const endTime = Date.now()
console.log(`Group filtering took ${endTime - startTime}ms`)
```

#### **3. Group Membership Validation**
```typescript
// Validate group membership
const validateGroupMembership = (actress, groupId) => {
  const hasSelectedGroups = actress.selectedGroups && actress.selectedGroups.includes(groupId)
  const hasGroupId = actress.groupId === groupId
  return hasSelectedGroups || hasGroupId
}

const validMembers = groupActresses.filter(actress => 
  validateGroupMembership(actress, groupId)
)
console.log(`Valid group members: ${validMembers.length}/${groupActresses.length}`)
```

---

**Last Updated:** December 2024  
**Version:** 1.0.0  
**Maintainer:** Development Team
