# Group Actress Count Consistency Fix

## Masalah: Inkonsistensi Count Aktris antara Group Card dan Group Detail

### Gejala
- **Group card**: Menampilkan "0 actresses"
- **Group detail**: Menampilkan "2 members"
- **Edit group**: Menampilkan "0 actresses"
- Ada inkonsistensi dalam cara menghitung jumlah aktris di group

### Root Cause

#### **Filtering Logic Tidak Konsisten**
```typescript
// SALAH - hanya check selectedGroups
const getGroupActressCount = (groupName: string) => {
  return actresses.filter(actress => 
    actress.selectedGroups && actress.selectedGroups.includes(groupName)
  ).length
}
```

**Masalah**: Function `getGroupActressCount` hanya mengecek `actress.selectedGroups` tapi tidak mengecek `actress.groupId` atau `actress.groupData`, yang menyebabkan aktris tidak ditemukan.

### Solusi yang Diterapkan

#### **Gunakan Logic yang Sama dengan GroupDetailContent**
```typescript
// BENAR - check semua field untuk group assignment
const getGroupActressCount = (groupName: string) => {
  return actresses.filter(actress => {
    // Use same logic as GroupDetailContent for consistency
    // Check both groupId (for ID matching) and selectedGroups (for name matching)
    const isInGroup = actress.groupId === groupName || 
                     (actress.selectedGroups && actress.selectedGroups.includes(groupName)) ||
                     (actress.groupData && actress.groupData[groupName])
    return isInGroup
  }).length
}
```

### Perubahan yang Dibuat

#### **1. Fix getGroupActressCount Function**
**File**: `src/components/content/GroupsContent.tsx`

**Sebelum:**
```typescript
const getGroupActressCount = (groupName: string) => {
  return actresses.filter(actress => 
    actress.selectedGroups && actress.selectedGroups.includes(groupName)
  ).length
}
```

**Sesudah:**
```typescript
const getGroupActressCount = (groupName: string) => {
  return actresses.filter(actress => {
    // Use same logic as GroupDetailContent for consistency
    // Check both groupId (for ID matching) and selectedGroups (for name matching)
    const isInGroup = actress.groupId === groupName || 
                     (actress.selectedGroups && actress.selectedGroups.includes(groupName)) ||
                     (actress.groupData && actress.groupData[groupName])
    return isInGroup
  }).length
}
```

#### **2. Fix handleGroupClick Function**
**Sebelum:**
```typescript
const handleGroupClick = (group: MasterDataItem) => {
  const members = actresses.filter(actress => 
    actress.selectedGroups && actress.selectedGroups.includes(group.name)
  )
```

**Sesudah:**
```typescript
const handleGroupClick = (group: MasterDataItem) => {
  const members = actresses.filter(actress => {
    // Use same logic as GroupDetailContent for consistency
    const isInGroup = actress.groupId === group.name || 
                     (actress.selectedGroups && actress.selectedGroups.includes(group.name)) ||
                     (actress.groupData && actress.groupData[group.name])
    return isInGroup
  })
```

### Konteks Penggunaan

#### **Kode yang Diperbaiki**
```typescript
// Di GroupsContent component
const getGroupActressCount = (groupName: string) => {
  return actresses.filter(actress => {
    // Use same logic as GroupDetailContent for consistency
    // Check both groupId (for ID matching) and selectedGroups (for name matching)
    const isInGroup = actress.groupId === groupName || 
                     (actress.selectedGroups && actress.selectedGroups.includes(groupName)) ||
                     (actress.groupData && actress.groupData[groupName])
    return isInGroup
  }).length
}

const handleGroupClick = (group: MasterDataItem) => {
  const members = actresses.filter(actress => {
    // Use same logic as GroupDetailContent for consistency
    const isInGroup = actress.groupId === group.name || 
                     (actress.selectedGroups && actress.selectedGroups.includes(group.name)) ||
                     (actress.groupData && actress.groupData[group.name])
    return isInGroup
  })
  
  // Debug logging to check data structure
  console.log('Group clicked:', group.name)
  console.log('Group members found:', members.length)
  members.forEach((actress, index) => {
    console.log(`Member ${index + 1}:`, actress.name)
  })
  
  onGroupSelect(group, members)
}
```

### Testing

#### **1. Test Group Card Count**
```javascript
// Di browser console
console.log('Testing group card count...')
// 1. Check apakah count di group card match dengan group detail
// 2. Verify filtering menggunakan logic yang sama
// 3. Check console logs untuk debugging
```

#### **2. Test Group Click**
```javascript
// Di browser console
console.log('Testing group click...')
// 1. Click group card
// 2. Check apakah members yang ditemukan match dengan count
// 3. Verify consistency dengan group detail
```

### Debug Information

#### **1. Console Logs yang Diharapkan**
```
Group clicked: 8woman
Group members found: 2
Member 1: Mei Washio
Member 2: Tsukasa Aoi
```

#### **2. Count Consistency**
- **Group card**: "2 actresses"
- **Group detail**: "2 members"
- **Edit group**: "2 actresses"

### Common Issues

#### **1. Inconsistent Filtering Logic**
**Problem**: Different components use different filtering logic
**Solution**: Use same logic across all components

#### **2. Group Assignment Methods**
**Problem**: Actresses can be assigned to groups in multiple ways
**Solution**: Check all possible assignment methods

#### **3. Parameter Mismatch**
**Problem**: Function expects group ID but receives group name
**Solution**: Handle both ID and name matching

### Best Practices

#### **1. Consistent Logic Across Components**
```typescript
// Use same filtering logic across all components
const isInGroup = actress.groupId === groupName || 
                 (actress.selectedGroups && actress.selectedGroups.includes(groupName)) ||
                 (actress.groupData && actress.groupData[groupName])
```

#### **2. Comprehensive Group Assignment**
```typescript
// Check all possible group assignment methods
const checkGroupId = actress.groupId === groupName
const checkSelectedGroups = actress.selectedGroups && actress.selectedGroups.includes(groupName)
const checkGroupData = actress.groupData && actress.groupData[groupName]
const isInGroup = checkGroupId || checkSelectedGroups || checkGroupData
```

#### **3. Debug Logging**
```typescript
// Log group assignment for debugging
console.log('Group clicked:', group.name)
console.log('Group members found:', members.length)
members.forEach((actress, index) => {
  console.log(`Member ${index + 1}:`, actress.name)
})
```

### Alternative Solutions

#### **1. Centralized Group Filtering**
```typescript
// Create centralized filtering function
const filterActressesByGroup = (actresses: MasterDataItem[], groupName: string) => {
  return actresses.filter(actress => {
    const isInGroup = actress.groupId === groupName || 
                     (actress.selectedGroups && actress.selectedGroups.includes(groupName)) ||
                     (actress.groupData && actress.groupData[groupName])
    return isInGroup
  })
}
```

#### **2. Server-Side Count**
```typescript
// Get count from server
const getGroupActressCount = async (groupId: string) => {
  const response = await masterDataApi.getByType('actress', accessToken, {
    filter: { 
      $or: [
        { groupId: groupId },
        { selectedGroups: { $contains: groupName } },
        { groupData: { $hasKey: groupId } }
      ]
    }
  })
  return response.length
}
```

#### **3. Cached Count**
```typescript
// Cache count untuk performance
const groupCountCache = new Map<string, number>()

const getGroupActressCount = (groupName: string) => {
  if (!groupCountCache.has(groupName)) {
    const count = actresses.filter(actress => {
      const isInGroup = actress.groupId === groupName || 
                       (actress.selectedGroups && actress.selectedGroups.includes(groupName)) ||
                       (actress.groupData && actress.groupData[groupName])
      return isInGroup
    }).length
    groupCountCache.set(groupName, count)
  }
  return groupCountCache.get(groupName) || 0
}
```

### Monitoring

#### **1. Count Consistency Check**
```typescript
// Check consistency between components
const checkCountConsistency = (groupName: string) => {
  const cardCount = getGroupActressCount(groupName)
  const detailCount = groupDetailActresses.length
  const editCount = editGroupActresses.length
  
  console.log('Count consistency check:', {
    groupName,
    cardCount,
    detailCount,
    editCount,
    consistent: cardCount === detailCount && detailCount === editCount
  })
}
```

#### **2. Group Assignment Tracking**
```typescript
// Track group assignment methods
const trackGroupAssignment = (actress: MasterDataItem, groupName: string) => {
  const assignmentMethods = {
    byGroupId: actress.groupId === groupName,
    bySelectedGroups: actress.selectedGroups && actress.selectedGroups.includes(groupName),
    byGroupData: actress.groupData && actress.groupData[groupName]
  }
  
  console.log(`Actress ${actress.name} assignment methods:`, assignmentMethods)
  return assignmentMethods
}
```

#### **3. Performance Monitoring**
```typescript
// Monitor filtering performance
const startTime = Date.now()
const count = getGroupActressCount(groupName)
const endTime = Date.now()
console.log(`Group count calculation took ${endTime - startTime}ms`)
```

---

**Last Updated:** December 2024  
**Version:** 1.0.0  
**Maintainer:** Development Team
