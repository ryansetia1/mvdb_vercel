# Database Schema for Group Photobooks Linking

## Overview
Dokumen ini menjelaskan perubahan schema database yang diperlukan untuk mendukung fitur Group Photobooks Linking.

## Current Schema

### Photobook Interface (Current)
```typescript
interface Photobook {
  id?: string
  titleEn: string
  titleJp?: string
  link?: string
  cover?: string
  releaseDate?: string
  actress?: string // Main actress (for backward compatibility)
  imageLinks?: string // Raw image links string
  imageTags?: ImageTag[] // Individual image tagging
}
```

### MasterDataItem Interface (Current)
```typescript
interface MasterDataItem {
  id: string
  name?: string
  type: 'actor' | 'actress' | 'series' | 'studio' | 'type' | 'tag' | 'director' | 'label' | 'linklabel' | 'group' | 'generation' | 'lineup'
  createdAt: string
  
  // Group-specific fields
  website?: string
  description?: string
  gallery?: string[]
  
  // Generation-specific fields
  estimatedYears?: string
  startDate?: string
  endDate?: string
  
  // Lineup-specific fields
  generationId?: string
  generationName?: string
  lineupType?: string
  lineupOrder?: number
}
```

## New Schema Design

### Extended Photobook Interface
```typescript
interface Photobook {
  id?: string
  titleEn: string
  titleJp?: string
  link?: string
  cover?: string
  releaseDate?: string
  actress?: string
  imageLinks?: string
  imageTags?: ImageTag[]
  
  // NEW: Linking system fields
  linkedTo?: PhotobookLinks
  
  // NEW: Metadata fields
  createdAt?: string
  updatedAt?: string
}

interface PhotobookLinks {
  groupId?: string
  generationId?: string
  lineupId?: string
  memberId?: string
}
```

### Linking Relationship Types
```typescript
type LinkingTargetType = 'group' | 'generation' | 'lineup' | 'member'

interface PhotobookLink {
  photobookId: string
  targetType: LinkingTargetType
  targetId: string
  targetName: string
  createdAt: string
  updatedAt: string
}
```

## Database Storage Strategy

### Supabase KV Store Structure
```
photobook_{id} = {
  // ... existing photobook data
  linkedTo: {
    groupId: "group_123",
    generationId: "gen_456",
    lineupId: "lineup_789",
    memberId: "member_101"
  },
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z"
}
```

### Indexing Strategy
Untuk performa query yang optimal, kita perlu membuat index untuk:
1. **Group-linked photobooks**: `linkedTo.groupId`
2. **Generation-linked photobooks**: `linkedTo.generationId`
3. **Lineup-linked photobooks**: `linkedTo.lineupId`
4. **Member-linked photobooks**: `linkedTo.memberId`

## Migration Plan

### Phase 1: Schema Extension
1. **Update Interface Definitions**
   - Extend `Photobook` interface di client-side
   - Extend `Photobook` interface di server-side
   - Update TypeScript types

2. **Backward Compatibility**
   - Existing photobooks akan memiliki `linkedTo: undefined`
   - API harus handle undefined `linkedTo` field
   - Default values untuk new fields

### Phase 2: Data Migration
1. **Existing Data**
   - Tidak perlu migration untuk existing photobooks
   - Field `linkedTo` akan undefined/null untuk existing data
   - New photobooks akan memiliki default values

2. **Default Values**
   ```typescript
   const defaultPhotobook = {
     // ... existing fields
     linkedTo: undefined,
     createdAt: new Date().toISOString(),
     updatedAt: new Date().toISOString()
   }
   ```

## API Schema Changes

### Server-Side API Updates
```typescript
// src/supabase/functions/server/photobookApi.tsx
interface Photobook {
  id?: string
  titleEn: string
  titleJp?: string
  link?: string
  cover?: string
  releaseDate?: string
  actress?: string
  imageLinks?: string
  imageTags?: ImageTag[]
  
  // NEW: Linking fields
  linkedTo?: {
    groupId?: string
    generationId?: string
    lineupId?: string
    memberId?: string
  }
  
  // NEW: Metadata
  createdAt?: string
  updatedAt?: string
}
```

### Client-Side API Updates
```typescript
// src/utils/photobookApi.ts
interface Photobook {
  id?: string
  titleEn: string
  titleJp?: string
  link?: string
  cover?: string
  releaseDate?: string
  actress?: string
  imageLinks?: string
  imageTags?: ImageTag[]
  
  // NEW: Linking fields
  linkedTo?: {
    groupId?: string
    generationId?: string
    lineupId?: string
    memberId?: string
  }
  
  // NEW: Metadata
  createdAt?: string
  updatedAt?: string
}
```

## Query Patterns

### Get Photobooks by Group
```typescript
async getPhotobooksByGroup(groupId: string): Promise<Photobook[]> {
  // Query all photobooks where linkedTo.groupId === groupId
  const allPhotobooks = await this.getAllPhotobooks()
  return allPhotobooks.filter(p => p.linkedTo?.groupId === groupId)
}
```

### Get Photobooks by Generation
```typescript
async getPhotobooksByGeneration(generationId: string): Promise<Photobook[]> {
  // Query all photobooks where linkedTo.generationId === generationId
  const allPhotobooks = await this.getAllPhotobooks()
  return allPhotobooks.filter(p => p.linkedTo?.generationId === generationId)
}
```

### Get Photobooks by Lineup
```typescript
async getPhotobooksByLineup(lineupId: string): Promise<Photobook[]> {
  // Query all photobooks where linkedTo.lineupId === lineupId
  const allPhotobooks = await this.getAllPhotobooks()
  return allPhotobooks.filter(p => p.linkedTo?.lineupId === lineupId)
}
```

### Get Photobooks by Member
```typescript
async getPhotobooksByMember(memberId: string): Promise<Photobook[]> {
  // Query all photobooks where linkedTo.memberId === memberId
  const allPhotobooks = await this.getAllPhotobooks()
  return allPhotobooks.filter(p => p.linkedTo?.memberId === memberId)
}
```

## Data Validation

### Photobook Creation
```typescript
const validatePhotobook = (photobook: Partial<Photobook>): boolean => {
  // Required fields
  if (!photobook.titleEn?.trim()) return false
  
  // Validate linkedTo structure
  if (photobook.linkedTo) {
    const { groupId, generationId, lineupId, memberId } = photobook.linkedTo
    
    // At least one linking target must be provided
    if (!groupId && !generationId && !lineupId && !memberId) {
      return false
    }
    
    // Validate target IDs are valid UUIDs
    if (groupId && !isValidUUID(groupId)) return false
    if (generationId && !isValidUUID(generationId)) return false
    if (lineupId && !isValidUUID(lineupId)) return false
    if (memberId && !isValidUUID(memberId)) return false
  }
  
  return true
}
```

### Linking Validation
```typescript
const validateLinking = (
  photobookId: string,
  targetType: LinkingTargetType,
  targetId: string
): boolean => {
  // Validate photobook exists
  if (!photobookId) return false
  
  // Validate target type
  if (!['group', 'generation', 'lineup', 'member'].includes(targetType)) {
    return false
  }
  
  // Validate target ID
  if (!targetId || !isValidUUID(targetId)) return false
  
  return true
}
```

## Performance Considerations

### Caching Strategy
1. **Photobook Data**: Cache photobook data dengan TTL 5 menit
2. **Linking Data**: Cache linking relationships dengan TTL 10 menit
3. **Hierarchy Data**: Cache group/generation/lineup data dengan TTL 15 menit

### Query Optimization
1. **Batch Queries**: Load multiple photobooks dalam satu request
2. **Lazy Loading**: Load photobooks hanya ketika tab diakses
3. **Pagination**: Implement pagination untuk large datasets

### Indexing
1. **Primary Index**: `photobook_{id}` untuk direct access
2. **Secondary Indexes**: 
   - `photobooks_by_group_{groupId}`
   - `photobooks_by_generation_{generationId}`
   - `photobooks_by_lineup_{lineupId}`
   - `photobooks_by_member_{memberId}`

## Error Handling

### Common Error Scenarios
1. **Invalid Linking Target**: Target ID tidak valid atau tidak ada
2. **Duplicate Linking**: Photobook sudah ter-link ke target yang sama
3. **Circular Dependencies**: Linking yang menyebabkan circular reference
4. **Data Corruption**: LinkedTo data tidak konsisten

### Error Recovery
1. **Validation Errors**: Return clear error messages
2. **Data Corruption**: Implement data repair mechanisms
3. **Network Errors**: Implement retry logic dengan exponential backoff
4. **Concurrent Updates**: Implement optimistic locking

## Security Considerations

### Access Control
1. **Authentication**: Semua linking operations memerlukan valid access token
2. **Authorization**: User hanya bisa link photobooks yang mereka miliki
3. **Rate Limiting**: Limit linking operations per user per minute

### Data Integrity
1. **Input Validation**: Validate semua input data
2. **SQL Injection**: Gunakan parameterized queries
3. **XSS Prevention**: Sanitize semua user input

## Monitoring & Logging

### Metrics to Track
1. **Linking Operations**: Count of link/unlink operations
2. **Query Performance**: Response times untuk photobook queries
3. **Error Rates**: Frequency of linking errors
4. **Data Consistency**: Monitor data integrity

### Logging Strategy
1. **Operation Logs**: Log semua linking operations
2. **Error Logs**: Log semua errors dengan context
3. **Performance Logs**: Log slow queries dan operations
4. **Audit Logs**: Log semua data changes untuk audit trail

## Conclusion

Schema database yang diusulkan memberikan foundation yang solid untuk fitur Group Photobooks Linking sambil mempertahankan backward compatibility dengan existing data. Implementasi yang bertahap akan memastikan smooth transition dan minimal disruption pada existing functionality.
