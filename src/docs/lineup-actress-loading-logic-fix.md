# Lineup Actress Loading Logic Fix

## Masalah: Tidak Ada Aktris yang Muncul Saat Edit Lineup

### Gejala
- Saat edit lineup, tidak ada aktris yang muncul
- Message "Tidak ada actress yang tersedia" ditampilkan
- Edit button clicked tapi list aktris kosong

### Root Cause

#### **Filtering Logic Tidak Konsisten**
```typescript
// SALAH - filtering logic yang berbeda dengan GenerationActressManagement
const groupActresses = allActresses.filter(actress => {
  const hasSelectedGroups = actress.selectedGroups && actress.selectedGroups.includes(groupId)
  const hasGroupId = actress.groupId === groupId
  const hasGroup = hasSelectedGroups || hasGroupId
  return hasGroup
})
```

**Masalah**: `LineupManagement` menggunakan filtering logic yang berbeda dengan `GenerationActressManagement`, yang menyebabkan aktris tidak ditemukan.

### Solusi yang Diterapkan

#### **Gunakan Logic yang Sama dengan GenerationActressManagement**
```typescript
// BENAR - menggunakan logic yang sama dengan GenerationActressManagement
// Get group name from groupId (we need to find the group name to match with selectedGroups)
const groups = await masterDataApi.getByType('group', accessToken)
const currentGroup = groups.find(g => g.id === groupId)
const groupName = currentGroup?.name

// Filter actresses that are assigned to this group (same logic as GenerationActressManagement)
const groupActresses = allActresses.filter(actress => {
  const isInGroup = actress.groupId === groupId || 
                  (actress.selectedGroups && groupName && actress.selectedGroups.includes(groupName)) ||
                  (actress.groupData && actress.groupData[groupId])
  return isInGroup
})
```

### Perubahan yang Dibuat

#### **1. Enhanced Group Filtering Logic**
**File**: `src/components/LineupManagement.tsx`

**Sebelum:**
```typescript
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
```

**Sesudah:**
```typescript
// Load actresses for this group (using same logic as GenerationActressManagement)
const allActresses = await masterDataApi.getByType('actress', accessToken)
console.log('All actresses loaded:', allActresses.length)
console.log('Group ID:', groupId)

// Get group name from groupId (we need to find the group name to match with selectedGroups)
const groups = await masterDataApi.getByType('group', accessToken)
const currentGroup = groups.find(g => g.id === groupId)
const groupName = currentGroup?.name

console.log('Current group info:', {
  groupId,
  groupName,
  currentGroup
})

// Filter actresses that are assigned to this group (same logic as GenerationActressManagement)
const groupActresses = allActresses.filter(actress => {
  console.log(`Checking actress ${actress.name}:`, {
    actressId: actress.id,
    actressGroupId: actress.groupId,
    actressSelectedGroups: actress.selectedGroups,
    actressGroupData: actress.groupData,
    targetGroupId: groupId,
    targetGroupName: groupName
  })
  
  const isInGroup = actress.groupId === groupId || 
                  (actress.selectedGroups && groupName && actress.selectedGroups.includes(groupName)) ||
                  (actress.groupData && actress.groupData[groupId])
  console.log(`Actress ${actress.name} is in group ${groupId} (${groupName}):`, isInGroup)
  return isInGroup
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

    // Load actresses for this group (using same logic as GenerationActressManagement)
    const allActresses = await masterDataApi.getByType('actress', accessToken)
    console.log('All actresses loaded:', allActresses.length)
    console.log('Group ID:', groupId)
    
    // Get group name from groupId (we need to find the group name to match with selectedGroups)
    const groups = await masterDataApi.getByType('group', accessToken)
    const currentGroup = groups.find(g => g.id === groupId)
    const groupName = currentGroup?.name
    
    console.log('Current group info:', {
      groupId,
      groupName,
      currentGroup
    })

    // Filter actresses that are assigned to this group (same logic as GenerationActressManagement)
    const groupActresses = allActresses.filter(actress => {
      console.log(`Checking actress ${actress.name}:`, {
        actressId: actress.id,
        actressGroupId: actress.groupId,
        actressSelectedGroups: actress.selectedGroups,
        actressGroupData: actress.groupData,
        targetGroupId: groupId,
        targetGroupName: groupName
      })
      
      const isInGroup = actress.groupId === groupId || 
                      (actress.selectedGroups && groupName && actress.selectedGroups.includes(groupName)) ||
                      (actress.groupData && actress.groupData[groupId])
      console.log(`Actress ${actress.name} is in group ${groupId} (${groupName}):`, isInGroup)
      return isInGroup
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
// 2. Verify filtering menggunakan logic yang sama dengan GenerationActressManagement
// 3. Check console logs untuk debugging
```

#### **2. Test Edit Lineup**
```javascript
// Di browser console
console.log('Testing edit lineup...')
// 1. Edit lineup yang sudah ada
// 2. Check apakah aktris dari group muncul
// 3. Verify member count matches
```

### Debug Information

#### **1. Console Logs yang Diharapkan**
```
All actresses loaded: 150
Group ID: group-id-123
Current group info: { groupId: "group-id-123", groupName: "Group Name", currentGroup: {...} }
Checking actress Tsukasa Aoi: { 
  actressId: "actress-id-1", 
  actressGroupId: "group-id-123", 
  actressSelectedGroups: ["Group Name"], 
  actressGroupData: {...}, 
  targetGroupId: "group-id-123", 
  targetGroupName: "Group Name" 
}
Actress Tsukasa Aoi is in group group-id-123 (Group Name): true
Group actresses found: 2
```

#### **2. Network Requests**
- **GET** `/master/actress` - Load all actresses
- **GET** `/master/group` - Load groups to get group name
- **Filter by groupId OR selectedGroups OR groupData** - Client-side filtering
- **Set filtered actresses** - Only group members

### Common Issues

#### **1. Inconsistent Filtering Logic**
**Problem**: Different components use different filtering logic
**Solution**: Use same logic as GenerationActressManagement

#### **2. Group Name Mismatch**
**Problem**: selectedGroups uses group name, not group ID
**Solution**: Get group name from group ID for comparison

#### **3. Multiple Group Assignment Methods**
**Problem**: Actresses can be assigned to groups in multiple ways
**Solution**: Check all possible assignment methods

### Best Practices

#### **1. Consistent Logic Across Components**
```typescript
// Use same filtering logic across all components
const isInGroup = actress.groupId === groupId || 
                (actress.selectedGroups && groupName && actress.selectedGroups.includes(groupName)) ||
                (actress.groupData && actress.groupData[groupId])
```

#### **2. Comprehensive Logging**
```typescript
// Log all relevant fields for debugging
console.log(`Checking actress ${actress.name}:`, {
  actressId: actress.id,
  actressGroupId: actress.groupId,
  actressSelectedGroups: actress.selectedGroups,
  actressGroupData: actress.groupData,
  targetGroupId: groupId,
  targetGroupName: groupName
})
```

#### **3. Group Name Resolution**
```typescript
// Get group name from group ID for selectedGroups comparison
const groups = await masterDataApi.getByType('group', accessToken)
const currentGroup = groups.find(g => g.id === groupId)
const groupName = currentGroup?.name
```

### Alternative Solutions

#### **1. Centralized Filtering Function**
```typescript
// Create centralized filtering function
const filterActressesByGroup = (actresses: MasterDataItem[], groupId: string, groupName: string) => {
  return actresses.filter(actress => {
    const isInGroup = actress.groupId === groupId || 
                    (actress.selectedGroups && groupName && actress.selectedGroups.includes(groupName)) ||
                    (actress.groupData && actress.groupData[groupId])
    return isInGroup
  })
}
```

#### **2. Server-Side Filtering**
```typescript
// Filter di server side
const groupActresses = await masterDataApi.getByType('actress', accessToken, {
  filter: { 
    $or: [
      { groupId: groupId },
      { selectedGroups: { $contains: groupName } },
      { groupData: { $hasKey: groupId } }
    ]
  }
})
```

#### **3. Cached Group Data**
```typescript
// Cache group data untuk performance
const getGroupName = async (groupId: string) => {
  if (!groupCache[groupId]) {
    const groups = await masterDataApi.getByType('group', accessToken)
    const currentGroup = groups.find(g => g.id === groupId)
    groupCache[groupId] = currentGroup?.name
  }
  return groupCache[groupId]
}
```

### Monitoring

#### **1. Filtering Performance**
```typescript
// Monitor filtering performance
const startTime = Date.now()
const groupActresses = allActresses.filter(actress => {
  const isInGroup = actress.groupId === groupId || 
                  (actress.selectedGroups && groupName && actress.selectedGroups.includes(groupName)) ||
                  (actress.groupData && actress.groupData[groupId])
  return isInGroup
})
const endTime = Date.now()
console.log(`Group filtering took ${endTime - startTime}ms`)
```

#### **2. Group Assignment Tracking**
```typescript
// Track group assignment methods
const groupAssignmentTracker = {
  byGroupId: 0,
  bySelectedGroups: 0,
  byGroupData: 0,
  none: 0
}

allActresses.forEach(actress => {
  if (actress.groupId === groupId) {
    groupAssignmentTracker.byGroupId++
  } else if (actress.selectedGroups && groupName && actress.selectedGroups.includes(groupName)) {
    groupAssignmentTracker.bySelectedGroups++
  } else if (actress.groupData && actress.groupData[groupId]) {
    groupAssignmentTracker.byGroupData++
  } else {
    groupAssignmentTracker.none++
  }
})
```

#### **3. Consistency Check**
```typescript
// Check consistency dengan GenerationActressManagement
const consistencyCheck = () => {
  // Compare filtering results between components
  const lineupActresses = filterActressesByGroup(allActresses, groupId, groupName)
  const generationActresses = filterActressesByGroup(allActresses, groupId, groupName)
  
  console.log('Consistency check:', {
    lineupActresses: lineupActresses.length,
    generationActresses: generationActresses.length,
    match: lineupActresses.length === generationActresses.length
  })
}
```

---

**Last Updated:** December 2024  
**Version:** 1.0.0  
**Maintainer:** Development Team
