# Lineup Version System Documentation

## Overview

The Lineup Version System is a sophisticated feature that enables multiple versions of lineup data within the same generation. This system allows for versioning of lineup compositions, member assignments, and associated metadata, providing flexibility in managing lineup evolution over time.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Data Structure](#data-structure)
3. [Version Management](#version-management)
4. [Implementation Details](#implementation-details)
5. [API Endpoints](#api-endpoints)
6. [Frontend Integration](#frontend-integration)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)

## System Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Lineup Version System                   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │     Lineup      │  │   Version       │  │   Member     │ │
│  │   (Base)        │  │   Management    │  │   Assignments│ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
│           │                     │                     │      │
│           └─────────────────────┼─────────────────────┘      │
│                                 │                            │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              Data Persistence Layer                     │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Version Hierarchy

```
Generation
├── Lineup (Base Entity)
│   ├── Version 1 (default)
│   ├── Version 2
│   └── Version N
│       ├── Member Assignment 1
│       ├── Member Assignment 2
│       └── Member Assignment N
```

## Data Structure

### Lineup Base Entity

```typescript
interface Lineup {
  id: string
  name: string
  description?: string
  generationId: string
  createdAt: string
  updatedAt: string
  // Base lineup data
}
```

### Lineup Version Entity

```typescript
interface LineupVersion {
  id: string
  lineupId: string
  version: string // 'default', 'v2', 'v3', etc.
  name: string
  description?: string
  metadata?: {
    [key: string]: any
  }
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdBy: string
}
```

### Member Assignment Entity

```typescript
interface LineupMemberAssignment {
  id: string
  lineupVersionId: string
  actressId: string
  actressName: string
  alias?: string
  profilePicture?: string
  position: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}
```

### Version Relationships

```typescript
interface LineupWithVersions {
  lineup: Lineup
  versions: LineupVersion[]
  activeVersion: LineupVersion
  defaultVersion: LineupVersion
}

interface LineupVersionWithMembers {
  version: LineupVersion
  members: LineupMemberAssignment[]
  totalMembers: number
}
```

## Version Management

### Version Creation Flow

1. **Base Lineup Creation**
   ```typescript
   const baseLineup = await createLineup({
     name: "Lineup Name",
     description: "Base description",
     generationId: "generation-id"
   })
   ```

2. **Default Version Creation**
   ```typescript
   const defaultVersion = await createLineupVersion({
     lineupId: baseLineup.id,
     version: "default",
     name: baseLineup.name,
     description: baseLineup.description,
     isActive: true
   })
   ```

3. **Member Assignment**
   ```typescript
   const memberAssignment = await assignMemberToLineupVersion({
     lineupVersionId: defaultVersion.id,
     actressId: "actress-id",
     actressName: "Actress Name",
     alias: "Alias",
     position: 1
   })
   ```

4. **Additional Version Creation**
   ```typescript
   const newVersion = await createLineupVersion({
     lineupId: baseLineup.id,
     version: "v2",
     name: "Updated Lineup Name",
     description: "Updated description",
     isActive: false
   })
   ```

### Version Switching

```typescript
// Activate a specific lineup version
await activateLineupVersion(lineupId, versionId)

// Get active version data with members
const activeVersion = await getActiveLineupVersionWithMembers(lineupId)
```

## Implementation Details

### Backend Implementation

#### Database Schema

```sql
-- Lineups table (base entity)
CREATE TABLE lineups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  generation_id UUID NOT NULL REFERENCES generations(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Lineup versions table
CREATE TABLE lineup_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lineup_id UUID NOT NULL REFERENCES lineups(id) ON DELETE CASCADE,
  version VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  metadata JSONB,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(lineup_id, version)
);

-- Lineup member assignments table
CREATE TABLE lineup_member_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lineup_version_id UUID NOT NULL REFERENCES lineup_versions(id) ON DELETE CASCADE,
  actress_id UUID NOT NULL,
  actress_name VARCHAR(255) NOT NULL,
  alias VARCHAR(255),
  profile_picture TEXT,
  position INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_lineup_versions_lineup_id ON lineup_versions(lineup_id);
CREATE INDEX idx_lineup_versions_active ON lineup_versions(lineup_id, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_lineup_member_assignments_version_id ON lineup_member_assignments(lineup_version_id);
CREATE INDEX idx_lineup_member_assignments_position ON lineup_member_assignments(lineup_version_id, position);
```

#### API Functions

```typescript
// Supabase Functions
export async function createLineupVersion(data: {
  lineupId: string
  version: string
  name: string
  description?: string
  metadata?: any
}) {
  const { data: version, error } = await supabase
    .from('lineup_versions')
    .insert({
      lineup_id: data.lineupId,
      version: data.version,
      name: data.name,
      description: data.description,
      metadata: data.metadata,
      is_active: false
    })
    .select()
    .single()

  if (error) throw error
  return version
}

export async function activateLineupVersion(
  lineupId: string, 
  versionId: string
) {
  // Deactivate all versions for this lineup
  await supabase
    .from('lineup_versions')
    .update({ is_active: false })
    .eq('lineup_id', lineupId)

  // Activate the selected version
  const { data, error } = await supabase
    .from('lineup_versions')
    .update({ is_active: true })
    .eq('id', versionId)
    .eq('lineup_id', lineupId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function assignMemberToLineupVersion(data: {
  lineupVersionId: string
  actressId: string
  actressName: string
  alias?: string
  profilePicture?: string
  position: number
}) {
  const { data: assignment, error } = await supabase
    .from('lineup_member_assignments')
    .insert({
      lineup_version_id: data.lineupVersionId,
      actress_id: data.actressId,
      actress_name: data.actressName,
      alias: data.alias,
      profile_picture: data.profilePicture,
      position: data.position,
      is_active: true
    })
    .select()
    .single()

  if (error) throw error
  return assignment
}

export async function getLineupVersionWithMembers(lineupId: string, version: string) {
  // Get version data
  const { data: versionData, error: versionError } = await supabase
    .from('lineup_versions')
    .select('*')
    .eq('lineup_id', lineupId)
    .eq('version', version)
    .single()

  if (versionError) throw versionError

  // Get member assignments
  const { data: members, error: membersError } = await supabase
    .from('lineup_member_assignments')
    .select('*')
    .eq('lineup_version_id', versionData.id)
    .eq('is_active', true)
    .order('position')

  if (membersError) throw membersError

  return {
    version: versionData,
    members: members || [],
    totalMembers: members?.length || 0
  }
}
```

### Frontend Implementation

#### State Management

```typescript
interface LineupVersionState {
  selectedLineupId: string | null
  selectedVersion: string
  versions: LineupVersion[]
  activeVersion: LineupVersion | null
  members: LineupMemberAssignment[]
  loading: boolean
  error: string | null
}

const useLineupVersions = (lineupId: string) => {
  const [state, setState] = useState<LineupVersionState>({
    selectedLineupId: lineupId,
    selectedVersion: 'default',
    versions: [],
    activeVersion: null,
    members: [],
    loading: false,
    error: null
  })

  const loadVersions = useCallback(async () => {
    if (!lineupId) return
    
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const versions = await masterDataApi.getLineupVersions(lineupId)
      const activeVersion = versions.find(v => v.isActive)
      
      // Load members for active version
      let members: LineupMemberAssignment[] = []
      if (activeVersion) {
        const versionWithMembers = await masterDataApi.getLineupVersionWithMembers(
          lineupId, 
          activeVersion.version
        )
        members = versionWithMembers.members
      }
      
      setState(prev => ({
        ...prev,
        versions,
        activeVersion,
        selectedVersion: activeVersion?.version || 'default',
        members,
        loading: false
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error.message,
        loading: false
      }))
    }
  }, [lineupId])

  const switchVersion = useCallback(async (version: string) => {
    if (!lineupId) return
    
    try {
      await masterDataApi.activateLineupVersion(lineupId, version)
      
      // Load members for the new version
      const versionWithMembers = await masterDataApi.getLineupVersionWithMembers(
        lineupId, 
        version
      )
      
      setState(prev => ({
        ...prev,
        selectedVersion: version,
        activeVersion: versionWithMembers.version,
        members: versionWithMembers.members
      }))
    } catch (error) {
      setState(prev => ({ ...prev, error: error.message }))
    }
  }, [lineupId])

  const addMember = useCallback(async (memberData: {
    actressId: string
    actressName: string
    alias?: string
    profilePicture?: string
  }) => {
    if (!state.activeVersion) return
    
    try {
      const position = state.members.length + 1
      const assignment = await masterDataApi.assignMemberToLineupVersion({
        lineupVersionId: state.activeVersion.id,
        ...memberData,
        position
      })
      
      setState(prev => ({
        ...prev,
        members: [...prev.members, assignment]
      }))
    } catch (error) {
      setState(prev => ({ ...prev, error: error.message }))
    }
  }, [state.activeVersion, state.members.length])

  const removeMember = useCallback(async (assignmentId: string) => {
    try {
      await masterDataApi.removeMemberFromLineupVersion(assignmentId)
      
      setState(prev => ({
        ...prev,
        members: prev.members.filter(m => m.id !== assignmentId)
      }))
    } catch (error) {
      setState(prev => ({ ...prev, error: error.message }))
    }
  }, [])

  return {
    ...state,
    loadVersions,
    switchVersion,
    addMember,
    removeMember
  }
}
```

#### Component Integration

```typescript
// LineupVersionSelector Component
interface LineupVersionSelectorProps {
  lineupId: string
  selectedVersion: string
  onVersionChange: (version: string) => void
  className?: string
}

export function LineupVersionSelector({
  lineupId,
  selectedVersion,
  onVersionChange,
  className
}: LineupVersionSelectorProps) {
  const { versions, loading, switchVersion } = useLineupVersions(lineupId)

  const handleVersionChange = async (version: string) => {
    await switchVersion(version)
    onVersionChange(version)
  }

  if (loading) {
    return <div className="animate-pulse">Loading versions...</div>
  }

  return (
    <Select value={selectedVersion} onValueChange={handleVersionChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Select version" />
      </SelectTrigger>
      <SelectContent>
        {versions.map(version => (
          <SelectItem key={version.id} value={version.version}>
            <div className="flex items-center gap-2">
              <span>{version.name}</span>
              {version.isActive && (
                <Badge variant="secondary" className="text-xs">
                  Active
                </Badge>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

// LineupMembersDisplay Component
interface LineupMembersDisplayProps {
  lineupId: string
  version: string
  onMemberSelect?: (type: string, name: string) => void
  getProfilePicture?: (actress: MasterDataItem, lineupId: string) => string | null
  getAlias?: (actress: MasterDataItem, lineupId: string) => string | null
}

export function LineupMembersDisplay({
  lineupId,
  version,
  onMemberSelect,
  getProfilePicture,
  getAlias
}: LineupMembersDisplayProps) {
  const { members, loading, addMember, removeMember } = useLineupVersions(lineupId)

  if (loading) {
    return <div className="animate-pulse">Loading members...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-medium">
          Members ({members.length})
        </h4>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            // Open member selection modal
            // Implementation depends on your member selection UI
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {members.map((member, index) => (
          <div
            key={member.id}
            className="relative group cursor-pointer"
            onClick={() => onMemberSelect?.('actress', member.actressName)}
          >
            <div className="aspect-square overflow-hidden rounded-lg bg-muted relative">
              {member.profilePicture ? (
                <img
                  src={member.profilePicture}
                  alt={member.actressName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              
              {/* Position badge */}
              <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                #{member.position}
              </div>
              
              {/* Remove button */}
              <Button
                size="sm"
                variant="destructive"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation()
                  removeMember(member.id)
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            
            <div className="mt-2 text-center">
              <p className="text-sm font-medium truncate" title={member.actressName}>
                {member.actressName}
              </p>
              {member.alias && (
                <p className="text-xs text-muted-foreground truncate" title={member.alias}>
                  {member.alias}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

## API Endpoints

### Lineup Versions

```typescript
// GET /api/lineups/{id}/versions
// Get all versions for a lineup
export async function getLineupVersions(lineupId: string) {
  const { data, error } = await supabase
    .from('lineup_versions')
    .select('*')
    .eq('lineup_id', lineupId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// POST /api/lineups/{id}/versions
// Create a new version
export async function createLineupVersion(data: CreateLineupVersionData) {
  // Implementation as shown above
}

// PUT /api/lineups/{id}/versions/{versionId}/activate
// Activate a specific version
export async function activateLineupVersion(
  lineupId: string, 
  versionId: string
) {
  // Implementation as shown above
}

// DELETE /api/lineups/{id}/versions/{versionId}
// Delete a version (soft delete)
export async function deleteLineupVersion(
  lineupId: string, 
  versionId: string
) {
  const { error } = await supabase
    .from('lineup_versions')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', versionId)
    .eq('lineup_id', lineupId)

  if (error) throw error
}
```

### Member Assignments

```typescript
// GET /api/lineup-versions/{versionId}/members
// Get all members for a lineup version
export async function getLineupVersionMembers(versionId: string) {
  const { data, error } = await supabase
    .from('lineup_member_assignments')
    .select('*')
    .eq('lineup_version_id', versionId)
    .eq('is_active', true)
    .order('position')

  if (error) throw error
  return data
}

// POST /api/lineup-versions/{versionId}/members
// Add a member to a lineup version
export async function assignMemberToLineupVersion(data: AssignMemberData) {
  // Implementation as shown above
}

// DELETE /api/lineup-versions/{versionId}/members/{assignmentId}
// Remove a member from a lineup version
export async function removeMemberFromLineupVersion(assignmentId: string) {
  const { error } = await supabase
    .from('lineup_member_assignments')
    .update({ is_active: false })
    .eq('id', assignmentId)

  if (error) throw error
}

// PUT /api/lineup-versions/{versionId}/members/{assignmentId}/position
// Update member position
export async function updateMemberPosition(
  assignmentId: string, 
  newPosition: number
) {
  const { error } = await supabase
    .from('lineup_member_assignments')
    .update({ position: newPosition })
    .eq('id', assignmentId)

  if (error) throw error
}
```

## Frontend Integration

### Integration Points

1. **Lineup Display Integration**
   ```typescript
   // Show version selector in lineup displays
   <div className="lineup-display">
     <LineupVersionSelector
       lineupId={lineup.id}
       selectedVersion={selectedVersion}
       onVersionChange={handleVersionChange}
       className="w-full"
     />
     <LineupMembersDisplay
       lineupId={lineup.id}
       version={selectedVersion}
       onMemberSelect={handleMemberSelect}
       getProfilePicture={getProfilePicture}
       getAlias={getAlias}
     />
   </div>
   ```

2. **Member Management Integration**
   ```typescript
   // Integrate with member selection and management
   const handleAddMember = async (selectedActress: MasterDataItem) => {
     await addMember({
       actressId: selectedActress.id,
       actressName: selectedActress.name,
       alias: getAlias(selectedActress, lineupId),
       profilePicture: getProfilePicture(selectedActress, lineupId)
     })
   }
   ```

3. **State Synchronization**
   ```typescript
   // Sync lineup version with generation version
   useEffect(() => {
     if (selectedGenerationVersion && selectedLineupVersion) {
       // Update lineup data based on both versions
       loadLineupsForVersions(selectedGenerationId, selectedGenerationVersion, selectedLineupVersion)
     }
   }, [selectedGenerationVersion, selectedLineupVersion])
   ```

## Troubleshooting

### Common Issues

#### 1. Version Not Activating

**Symptoms:**
- Version selector shows correct options but activation fails
- UI doesn't update after version switch
- Members don't load for new version

**Debugging Steps:**
```typescript
// Check if version exists and is valid
const version = await masterDataApi.getLineupVersion(lineupId, versionId)
console.log('Version data:', version)

// Check activation response
const activationResult = await masterDataApi.activateLineupVersion(
  lineupId, 
  versionId
)
console.log('Activation result:', activationResult)

// Check members loading
const members = await masterDataApi.getLineupVersionMembers(versionId)
console.log('Members data:', members)
```

**Common Causes:**
- Database constraint violations
- Missing member assignments
- Race conditions in state updates

**Solutions:**
```typescript
// Add error handling and retry logic
const activateWithRetry = async (lineupId: string, versionId: string, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await masterDataApi.activateLineupVersion(lineupId, versionId)
      
      // Verify activation was successful
      const activeVersion = await masterDataApi.getActiveLineupVersion(lineupId)
      if (activeVersion.id !== versionId) {
        throw new Error('Activation verification failed')
      }
      
      return result
    } catch (error) {
      if (i === retries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
}
```

#### 2. Members Not Loading

**Symptoms:**
- Version activates but no members display
- Empty member list
- Loading state persists

**Debugging Steps:**
```typescript
// Check member assignments
const members = await masterDataApi.getLineupVersionMembers(versionId)
console.log('Members response:', members)

// Check database directly
const { data, error } = await supabase
  .from('lineup_member_assignments')
  .select('*')
  .eq('lineup_version_id', versionId)
  .eq('is_active', true)
console.log('Direct DB query:', { data, error })
```

**Common Causes:**
- Incorrect version ID
- Missing member assignments
- Database connection issues

**Solutions:**
```typescript
// Add fallback and validation
const loadMembersWithFallback = async (versionId: string) => {
  try {
    const members = await masterDataApi.getLineupVersionMembers(versionId)
    
    // Validate member data
    const validMembers = members.filter(member => 
      member.actress_id && 
      member.actress_name && 
      member.is_active
    )
    
    if (validMembers.length === 0) {
      console.warn('No valid members found for version:', versionId)
    }
    
    return validMembers
  } catch (error) {
    console.error('Failed to load members:', error)
    return []
  }
}
```

#### 3. Member Assignment Issues

**Symptoms:**
- Members not being added to lineup
- Duplicate member assignments
- Position conflicts

**Debugging Steps:**
```typescript
// Check for existing assignments
const existingAssignments = await masterDataApi.getLineupVersionMembers(versionId)
const duplicateCheck = existingAssignments.find(m => m.actress_id === actressId)
console.log('Existing assignments:', existingAssignments)
console.log('Duplicate check:', duplicateCheck)

// Check position conflicts
const maxPosition = Math.max(...existingAssignments.map(m => m.position), 0)
console.log('Max position:', maxPosition)
```

**Solutions:**
```typescript
// Add validation and conflict resolution
const assignMemberWithValidation = async (data: AssignMemberData) => {
  // Check for duplicates
  const existingAssignments = await masterDataApi.getLineupVersionMembers(data.lineupVersionId)
  const duplicate = existingAssignments.find(m => m.actress_id === data.actressId)
  
  if (duplicate) {
    throw new Error('Member already assigned to this lineup version')
  }
  
  // Calculate next position
  const nextPosition = Math.max(...existingAssignments.map(m => m.position), 0) + 1
  
  return await masterDataApi.assignMemberToLineupVersion({
    ...data,
    position: nextPosition
  })
}
```

## Best Practices

### 1. Version Naming Convention

```typescript
// Use semantic versioning for lineup versions
const versionNames = {
  'default': 'Default Lineup',
  'v1': 'Lineup v1.0',
  'v2': 'Lineup v2.0',
  'beta': 'Beta Lineup',
  'experimental': 'Experimental Lineup'
}
```

### 2. Member Position Management

```typescript
// Automatic position management
const calculateMemberPositions = (members: LineupMemberAssignment[]) => {
  return members
    .sort((a, b) => a.position - b.position)
    .map((member, index) => ({
      ...member,
      position: index + 1
    }))
}

// Reorder members
const reorderMembers = async (versionId: string, newOrder: string[]) => {
  const updates = newOrder.map((memberId, index) => ({
    id: memberId,
    position: index + 1
  }))
  
  await Promise.all(
    updates.map(update => 
      masterDataApi.updateMemberPosition(update.id, update.position)
    )
  )
}
```

### 3. Performance Optimization

```typescript
// Cache lineup version data
const lineupVersionCache = new Map<string, LineupVersionWithMembers>()

const getCachedLineupVersion = async (lineupId: string, version: string) => {
  const cacheKey = `${lineupId}:${version}`
  
  if (lineupVersionCache.has(cacheKey)) {
    return lineupVersionCache.get(cacheKey)
  }
  
  const versionWithMembers = await masterDataApi.getLineupVersionWithMembers(
    lineupId, 
    version
  )
  
  lineupVersionCache.set(cacheKey, versionWithMembers)
  
  // Clear cache after 5 minutes
  setTimeout(() => {
    lineupVersionCache.delete(cacheKey)
  }, 5 * 60 * 1000)
  
  return versionWithMembers
}
```

### 4. Error Handling

```typescript
// Comprehensive error handling for lineup operations
const handleLineupOperation = async (operation: () => Promise<any>) => {
  try {
    return await operation()
  } catch (error) {
    console.error('Lineup operation failed:', error)
    
    // Show user-friendly error message
    toast.error('Failed to perform lineup operation. Please try again.')
    
    // Log error for debugging
    logger.error('Lineup version error', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    })
    
    throw error
  }
}
```

### 5. Testing

```typescript
// Unit tests for lineup version operations
describe('Lineup Version System', () => {
  test('should create default lineup version', async () => {
    const lineup = await createLineup({ name: 'Test Lineup' })
    const version = await createLineupVersion({
      lineupId: lineup.id,
      version: 'default',
      name: 'Default Lineup'
    })
    
    expect(version.version).toBe('default')
    expect(version.isActive).toBe(true)
  })
  
  test('should assign member to lineup version', async () => {
    const lineup = await createLineup({ name: 'Test Lineup' })
    const version = await createLineupVersion({
      lineupId: lineup.id,
      version: 'default',
      name: 'Default Lineup'
    })
    
    const assignment = await assignMemberToLineupVersion({
      lineupVersionId: version.id,
      actressId: 'actress-id',
      actressName: 'Test Actress',
      position: 1
    })
    
    expect(assignment.actress_id).toBe('actress-id')
    expect(assignment.position).toBe(1)
  })
  
  test('should activate lineup version', async () => {
    const lineup = await createLineup({ name: 'Test Lineup' })
    const version1 = await createLineupVersion({
      lineupId: lineup.id,
      version: 'v1',
      name: 'Version 1'
    })
    const version2 = await createLineupVersion({
      lineupId: lineup.id,
      version: 'v2',
      name: 'Version 2'
    })
    
    await activateLineupVersion(lineup.id, version2.id)
    
    const activeVersion = await getActiveLineupVersion(lineup.id)
    expect(activeVersion.id).toBe(version2.id)
  })
})
```

## Migration Guide

### From Single Version to Multi-Version

1. **Database Migration**
   ```sql
   -- Add version support to existing lineups
   ALTER TABLE lineups ADD COLUMN version VARCHAR(50) DEFAULT 'default';
   
   -- Create lineup_versions table
   CREATE TABLE lineup_versions (
     -- Schema as defined above
   );
   
   -- Create lineup_member_assignments table
   CREATE TABLE lineup_member_assignments (
     -- Schema as defined above
   );
   
   -- Migrate existing data
   INSERT INTO lineup_versions (lineup_id, version, name, description, is_active)
   SELECT id, 'default', name, description, true FROM lineups;
   ```

2. **Code Migration**
   ```typescript
   // Update existing API calls
   // Before
   const lineup = await getLineup(lineupId)
   
   // After
   const lineup = await getLineupWithVersion(lineupId, 'default')
   ```

3. **Frontend Migration**
   ```typescript
   // Update components to use version-aware APIs
   // Before
   const members = await getLineupMembers(lineupId)
   
   // After
   const members = await getLineupVersionMembers(lineupId, selectedVersion)
   ```

## Conclusion

The Lineup Version System provides a comprehensive solution for managing multiple versions of lineup data with member assignments. By following the implementation patterns and best practices outlined in this documentation, developers can create a robust and scalable lineup versioning system that enhances the flexibility and usability of the application.

For additional support or questions, refer to the troubleshooting section or contact the development team.
