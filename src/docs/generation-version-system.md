# Generation Version System Documentation

## Overview

The Generation Version System is a core feature that allows multiple versions of generation data to coexist within the same group. This system enables versioning of generation information, including descriptions, metadata, and associated lineup data.

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
│                    Generation Version System                │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Generation    │  │   Version       │  │   Lineup     │ │
│  │   (Base)        │  │   Management    │  │   Versions   │ │
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
Group
├── Generation (Base Entity)
│   ├── Version 1 (default)
│   ├── Version 2
│   └── Version N
│       ├── Lineup Version 1
│       ├── Lineup Version 2
│       └── Lineup Version N
```

## Data Structure

### Generation Base Entity

```typescript
interface Generation {
  id: string
  name: string
  description?: string
  groupId: string
  createdAt: string
  updatedAt: string
  // Base generation data
}
```

### Generation Version Entity

```typescript
interface GenerationVersion {
  id: string
  generationId: string
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

### Version Relationships

```typescript
interface GenerationWithVersions {
  generation: Generation
  versions: GenerationVersion[]
  activeVersion: GenerationVersion
  defaultVersion: GenerationVersion
}
```

## Version Management

### Version Creation Flow

1. **Base Generation Creation**
   ```typescript
   const baseGeneration = await createGeneration({
     name: "Generation Name",
     description: "Base description",
     groupId: "group-id"
   })
   ```

2. **Default Version Creation**
   ```typescript
   const defaultVersion = await createGenerationVersion({
     generationId: baseGeneration.id,
     version: "default",
     name: baseGeneration.name,
     description: baseGeneration.description,
     isActive: true
   })
   ```

3. **Additional Version Creation**
   ```typescript
   const newVersion = await createGenerationVersion({
     generationId: baseGeneration.id,
     version: "v2",
     name: "Updated Generation Name",
     description: "Updated description",
     isActive: false
   })
   ```

### Version Switching

```typescript
// Activate a specific version
await activateGenerationVersion(generationId, versionId)

// Get active version data
const activeVersion = await getActiveGenerationVersion(generationId)
```

## Implementation Details

### Backend Implementation

#### Database Schema

```sql
-- Generations table (base entity)
CREATE TABLE generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  group_id UUID NOT NULL REFERENCES groups(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Generation versions table
CREATE TABLE generation_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id UUID NOT NULL REFERENCES generations(id) ON DELETE CASCADE,
  version VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  metadata JSONB,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(generation_id, version)
);

-- Indexes for performance
CREATE INDEX idx_generation_versions_generation_id ON generation_versions(generation_id);
CREATE INDEX idx_generation_versions_active ON generation_versions(generation_id, is_active) WHERE is_active = TRUE;
```

#### API Functions

```typescript
// Supabase Functions
export async function createGenerationVersion(data: {
  generationId: string
  version: string
  name: string
  description?: string
  metadata?: any
}) {
  const { data: version, error } = await supabase
    .from('generation_versions')
    .insert({
      generation_id: data.generationId,
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

export async function activateGenerationVersion(
  generationId: string, 
  versionId: string
) {
  // Deactivate all versions for this generation
  await supabase
    .from('generation_versions')
    .update({ is_active: false })
    .eq('generation_id', generationId)

  // Activate the selected version
  const { data, error } = await supabase
    .from('generation_versions')
    .update({ is_active: true })
    .eq('id', versionId)
    .eq('generation_id', generationId)
    .select()
    .single()

  if (error) throw error
  return data
}
```

### Frontend Implementation

#### State Management

```typescript
interface GenerationVersionState {
  selectedGenerationId: string | null
  selectedVersion: string
  versions: GenerationVersion[]
  activeVersion: GenerationVersion | null
  loading: boolean
  error: string | null
}

const useGenerationVersions = (generationId: string) => {
  const [state, setState] = useState<GenerationVersionState>({
    selectedGenerationId: generationId,
    selectedVersion: 'default',
    versions: [],
    activeVersion: null,
    loading: false,
    error: null
  })

  const loadVersions = useCallback(async () => {
    if (!generationId) return
    
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const versions = await masterDataApi.getGenerationVersions(generationId)
      const activeVersion = versions.find(v => v.isActive)
      
      setState(prev => ({
        ...prev,
        versions,
        activeVersion,
        selectedVersion: activeVersion?.version || 'default',
        loading: false
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error.message,
        loading: false
      }))
    }
  }, [generationId])

  const switchVersion = useCallback(async (version: string) => {
    if (!generationId) return
    
    try {
      await masterDataApi.activateGenerationVersion(generationId, version)
      await loadVersions() // Reload to get updated active version
    } catch (error) {
      setState(prev => ({ ...prev, error: error.message }))
    }
  }, [generationId, loadVersions])

  return {
    ...state,
    loadVersions,
    switchVersion
  }
}
```

#### Component Integration

```typescript
// GenerationVersionSelector Component
interface GenerationVersionSelectorProps {
  generationId: string
  selectedVersion: string
  onVersionChange: (version: string) => void
  className?: string
}

export function GenerationVersionSelector({
  generationId,
  selectedVersion,
  onVersionChange,
  className
}: GenerationVersionSelectorProps) {
  const { versions, loading, switchVersion } = useGenerationVersions(generationId)

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
```

## API Endpoints

### Generation Versions

```typescript
// GET /api/generations/{id}/versions
// Get all versions for a generation
export async function getGenerationVersions(generationId: string) {
  const { data, error } = await supabase
    .from('generation_versions')
    .select('*')
    .eq('generation_id', generationId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// POST /api/generations/{id}/versions
// Create a new version
export async function createGenerationVersion(data: CreateGenerationVersionData) {
  // Implementation as shown above
}

// PUT /api/generations/{id}/versions/{versionId}/activate
// Activate a specific version
export async function activateGenerationVersion(
  generationId: string, 
  versionId: string
) {
  // Implementation as shown above
}

// DELETE /api/generations/{id}/versions/{versionId}
// Delete a version (soft delete)
export async function deleteGenerationVersion(
  generationId: string, 
  versionId: string
) {
  const { error } = await supabase
    .from('generation_versions')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', versionId)
    .eq('generation_id', generationId)

  if (error) throw error
}
```

## Frontend Integration

### Integration Points

1. **Generation Card Display**
   ```typescript
   // Show version selector in generation cards
   <div className="generation-card">
     <GenerationVersionSelector
       generationId={generation.id}
       selectedVersion={selectedVersion}
       onVersionChange={handleVersionChange}
       className="w-full"
     />
   </div>
   ```

2. **Lineup Data Loading**
   ```typescript
   // Load lineups based on selected generation version
   const loadLineupsForVersion = async (generationId: string, version: string) => {
     const lineups = await masterDataApi.getLineupsByGenerationVersion(
       generationId, 
       version
     )
     return lineups
   }
   ```

3. **State Synchronization**
   ```typescript
   // Sync generation version with lineup version
   useEffect(() => {
     if (selectedGenerationVersion) {
       // Update lineup data based on generation version
       loadLineupsForVersion(selectedGenerationId, selectedGenerationVersion)
     }
   }, [selectedGenerationVersion])
   ```

## Troubleshooting

### Common Issues

#### 1. Version Not Activating

**Symptoms:**
- Version selector shows correct options but activation fails
- UI doesn't update after version switch

**Debugging Steps:**
```typescript
// Check if version exists and is valid
const version = await masterDataApi.getGenerationVersion(generationId, versionId)
console.log('Version data:', version)

// Check activation response
const activationResult = await masterDataApi.activateGenerationVersion(
  generationId, 
  versionId
)
console.log('Activation result:', activationResult)
```

**Common Causes:**
- Database constraint violations
- Missing permissions
- Race conditions in state updates

**Solutions:**
```typescript
// Add error handling and retry logic
const activateWithRetry = async (generationId: string, versionId: string, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await masterDataApi.activateGenerationVersion(generationId, versionId)
    } catch (error) {
      if (i === retries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
}
```

#### 2. Version Data Not Loading

**Symptoms:**
- Version selector shows loading state indefinitely
- Empty version list

**Debugging Steps:**
```typescript
// Check API response
const versions = await masterDataApi.getGenerationVersions(generationId)
console.log('Versions response:', versions)

// Check database directly
const { data, error } = await supabase
  .from('generation_versions')
  .select('*')
  .eq('generation_id', generationId)
console.log('Direct DB query:', { data, error })
```

**Common Causes:**
- Incorrect generation ID
- Database connection issues
- Missing data

**Solutions:**
```typescript
// Add fallback to default version
const loadVersionsWithFallback = async (generationId: string) => {
  try {
    const versions = await masterDataApi.getGenerationVersions(generationId)
    if (versions.length === 0) {
      // Create default version if none exists
      await createDefaultVersion(generationId)
      return await masterDataApi.getGenerationVersions(generationId)
    }
    return versions
  } catch (error) {
    console.error('Failed to load versions:', error)
    // Return default version
    return [{
      id: 'default',
      version: 'default',
      name: 'Default Version',
      isActive: true
    }]
  }
}
```

#### 3. State Synchronization Issues

**Symptoms:**
- UI shows wrong active version
- Version changes don't reflect in other components

**Debugging Steps:**
```typescript
// Check state consistency
console.log('Current state:', {
  selectedVersion,
  activeVersion,
  versions
})

// Check for state updates
useEffect(() => {
  console.log('State changed:', { selectedVersion, activeVersion })
}, [selectedVersion, activeVersion])
```

**Solutions:**
```typescript
// Use centralized state management
const GenerationVersionContext = createContext<{
  selectedVersion: string
  setSelectedVersion: (version: string) => void
  activeVersion: GenerationVersion | null
}>({})

// Provide context to all components
export function GenerationVersionProvider({ children }: { children: ReactNode }) {
  const [selectedVersion, setSelectedVersion] = useState('default')
  const [activeVersion, setActiveVersion] = useState<GenerationVersion | null>(null)

  return (
    <GenerationVersionContext.Provider value={{
      selectedVersion,
      setSelectedVersion,
      activeVersion
    }}>
      {children}
    </GenerationVersionContext.Provider>
  )
}
```

## Best Practices

### 1. Version Naming Convention

```typescript
// Use semantic versioning for generation versions
const versionNames = {
  'default': 'Default Version',
  'v1': 'Version 1.0',
  'v2': 'Version 2.0',
  'beta': 'Beta Version',
  'experimental': 'Experimental Version'
}
```

### 2. Data Validation

```typescript
// Validate version data before creation
const validateGenerationVersion = (data: CreateGenerationVersionData) => {
  if (!data.generationId) throw new Error('Generation ID is required')
  if (!data.version) throw new Error('Version identifier is required')
  if (!data.name) throw new Error('Version name is required')
  
  // Check for duplicate versions
  if (data.version !== 'default' && existingVersions.includes(data.version)) {
    throw new Error(`Version ${data.version} already exists`)
  }
}
```

### 3. Performance Optimization

```typescript
// Cache version data
const versionCache = new Map<string, GenerationVersion[]>()

const getCachedVersions = async (generationId: string) => {
  if (versionCache.has(generationId)) {
    return versionCache.get(generationId)
  }
  
  const versions = await masterDataApi.getGenerationVersions(generationId)
  versionCache.set(generationId, versions)
  
  // Clear cache after 5 minutes
  setTimeout(() => {
    versionCache.delete(generationId)
  }, 5 * 60 * 1000)
  
  return versions
}
```

### 4. Error Handling

```typescript
// Comprehensive error handling
const handleVersionOperation = async (operation: () => Promise<any>) => {
  try {
    return await operation()
  } catch (error) {
    console.error('Version operation failed:', error)
    
    // Show user-friendly error message
    toast.error('Failed to perform version operation. Please try again.')
    
    // Log error for debugging
    logger.error('Generation version error', {
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
// Unit tests for version operations
describe('Generation Version System', () => {
  test('should create default version', async () => {
    const generation = await createGeneration({ name: 'Test Generation' })
    const version = await createGenerationVersion({
      generationId: generation.id,
      version: 'default',
      name: 'Default Version'
    })
    
    expect(version.version).toBe('default')
    expect(version.isActive).toBe(true)
  })
  
  test('should activate version', async () => {
    const generation = await createGeneration({ name: 'Test Generation' })
    const version1 = await createGenerationVersion({
      generationId: generation.id,
      version: 'v1',
      name: 'Version 1'
    })
    const version2 = await createGenerationVersion({
      generationId: generation.id,
      version: 'v2',
      name: 'Version 2'
    })
    
    await activateGenerationVersion(generation.id, version2.id)
    
    const activeVersion = await getActiveGenerationVersion(generation.id)
    expect(activeVersion.id).toBe(version2.id)
  })
})
```

## Migration Guide

### From Single Version to Multi-Version

1. **Database Migration**
   ```sql
   -- Add version support to existing generations
   ALTER TABLE generations ADD COLUMN version VARCHAR(50) DEFAULT 'default';
   
   -- Create generation_versions table
   CREATE TABLE generation_versions (
     -- Schema as defined above
   );
   
   -- Migrate existing data
   INSERT INTO generation_versions (generation_id, version, name, description, is_active)
   SELECT id, 'default', name, description, true FROM generations;
   ```

2. **Code Migration**
   ```typescript
   // Update existing API calls
   // Before
   const generation = await getGeneration(generationId)
   
   // After
   const generation = await getGenerationWithVersion(generationId, 'default')
   ```

3. **Frontend Migration**
   ```typescript
   // Update components to use version-aware APIs
   // Before
   const lineups = await getLineups(generationId)
   
   // After
   const lineups = await getLineupsByGenerationVersion(generationId, selectedVersion)
   ```

## Conclusion

The Generation Version System provides a robust foundation for managing multiple versions of generation data. By following the implementation patterns and best practices outlined in this documentation, developers can create a scalable and maintainable versioning system that enhances the flexibility and usability of the application.

For additional support or questions, refer to the troubleshooting section or contact the development team.
