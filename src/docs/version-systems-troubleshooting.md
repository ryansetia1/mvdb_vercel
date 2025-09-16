# Version Systems Troubleshooting Guide

## Overview

This comprehensive troubleshooting guide covers common issues, debugging techniques, and solutions for both Generation Version System and Lineup Version System.

## Table of Contents

1. [Common Issues](#common-issues)
2. [Debugging Techniques](#debugging-techniques)
3. [Performance Issues](#performance-issues)
4. [Data Integrity Issues](#data-integrity-issues)
5. [Frontend Issues](#frontend-issues)
6. [Backend Issues](#backend-issues)
7. [Migration Issues](#migration-issues)
8. [Emergency Procedures](#emergency-procedures)

## Common Issues

### 1. Version Not Activating

**Symptoms:**
- Version selector shows options but activation fails
- UI doesn't update after version switch
- Error messages in console

**Debugging Steps:**
```typescript
// Check version existence
const version = await masterDataApi.getVersion(generationId, versionId)
console.log('Version data:', version)

// Check activation response
const result = await masterDataApi.activateVersion(generationId, versionId)
console.log('Activation result:', result)

// Check database state
const { data, error } = await supabase
  .from('generation_versions')
  .select('*')
  .eq('generation_id', generationId)
  .eq('is_active', true)
console.log('Active versions:', { data, error })
```

**Solutions:**
```typescript
// Add retry logic
const activateWithRetry = async (id: string, versionId: string, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await masterDataApi.activateVersion(id, versionId)
    } catch (error) {
      if (i === retries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
}
```

### 2. Data Not Loading

**Symptoms:**
- Loading state persists indefinitely
- Empty data arrays
- Network errors

**Debugging Steps:**
```typescript
// Check API response
const data = await masterDataApi.getData(id)
console.log('API response:', data)

// Check network status
console.log('Network status:', navigator.onLine)

// Check authentication
const { data: user } = await supabase.auth.getUser()
console.log('User:', user)
```

**Solutions:**
```typescript
// Add fallback data
const loadDataWithFallback = async (id: string) => {
  try {
    const data = await masterDataApi.getData(id)
    return data.length > 0 ? data : getDefaultData()
  } catch (error) {
    console.error('Failed to load data:', error)
    return getDefaultData()
  }
}
```

### 3. State Synchronization Issues

**Symptoms:**
- UI shows wrong active version
- Changes don't reflect across components
- Inconsistent state

**Debugging Steps:**
```typescript
// Check state consistency
console.log('Current state:', {
  selectedVersion,
  activeVersion,
  data
})

// Check for state updates
useEffect(() => {
  console.log('State changed:', { selectedVersion, activeVersion })
}, [selectedVersion, activeVersion])
```

**Solutions:**
```typescript
// Use centralized state management
const VersionContext = createContext<VersionState>({})

// Provide context to all components
export function VersionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<VersionState>(initialState)
  
  const updateState = useCallback((updates: Partial<VersionState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])
  
  return (
    <VersionContext.Provider value={{ ...state, updateState }}>
      {children}
    </VersionContext.Provider>
  )
}
```

## Debugging Techniques

### 1. Console Logging

```typescript
// Add comprehensive logging
const debugLog = (message: string, data?: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEBUG] ${message}`, data)
  }
}

// Use in operations
const activateVersion = async (id: string, versionId: string) => {
  debugLog('Starting version activation', { id, versionId })
  
  try {
    const result = await masterDataApi.activateVersion(id, versionId)
    debugLog('Version activation successful', result)
    return result
  } catch (error) {
    debugLog('Version activation failed', error)
    throw error
  }
}
```

### 2. Error Tracking

```typescript
// Track errors with context
const trackError = (error: Error, context: any) => {
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString()
  })
  
  // Send to error tracking service
  if (window.gtag) {
    window.gtag('event', 'exception', {
      description: error.message,
      fatal: false
    })
  }
}
```

### 3. Performance Monitoring

```typescript
// Monitor performance
const measurePerformance = async (operation: () => Promise<any>, name: string) => {
  const start = performance.now()
  
  try {
    const result = await operation()
    const end = performance.now()
    console.log(`${name} took ${end - start} milliseconds`)
    return result
  } catch (error) {
    const end = performance.now()
    console.error(`${name} failed after ${end - start} milliseconds`, error)
    throw error
  }
}
```

## Performance Issues

### 1. Slow Data Loading

**Symptoms:**
- Long loading times
- UI freezes during data fetch
- Timeout errors

**Solutions:**
```typescript
// Implement caching
const dataCache = new Map<string, { data: any, timestamp: number }>()

const getCachedData = async (key: string, fetcher: () => Promise<any>) => {
  const cached = dataCache.get(key)
  const now = Date.now()
  
  if (cached && (now - cached.timestamp) < 300000) { // 5 minutes
    return cached.data
  }
  
  const data = await fetcher()
  dataCache.set(key, { data, timestamp: now })
  return data
}
```

### 2. Memory Leaks

**Symptoms:**
- Increasing memory usage
- Slow performance over time
- Browser crashes

**Solutions:**
```typescript
// Clean up subscriptions
useEffect(() => {
  const subscription = supabase
    .channel('version-updates')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'generation_versions' }, handleUpdate)
    .subscribe()
  
  return () => {
    subscription.unsubscribe()
  }
}, [])

// Clean up timers
useEffect(() => {
  const timer = setInterval(updateData, 30000)
  return () => clearInterval(timer)
}, [])
```

## Data Integrity Issues

### 1. Duplicate Versions

**Symptoms:**
- Multiple versions with same identifier
- Data conflicts
- Inconsistent state

**Solutions:**
```typescript
// Validate version uniqueness
const validateVersionUniqueness = async (id: string, version: string) => {
  const existing = await masterDataApi.getVersion(id, version)
  if (existing) {
    throw new Error(`Version ${version} already exists`)
  }
}

// Use database constraints
ALTER TABLE generation_versions ADD CONSTRAINT unique_generation_version 
UNIQUE (generation_id, version);
```

### 2. Orphaned Data

**Symptoms:**
- References to non-existent versions
- Broken relationships
- Data inconsistencies

**Solutions:**
```typescript
// Clean up orphaned data
const cleanupOrphanedData = async () => {
  const orphaned = await supabase
    .from('lineup_member_assignments')
    .select('*')
    .not('lineup_version_id', 'in', 
      supabase.from('lineup_versions').select('id')
    )
  
  if (orphaned.data?.length > 0) {
    await supabase
      .from('lineup_member_assignments')
      .delete()
      .in('id', orphaned.data.map(o => o.id))
  }
}
```

## Frontend Issues

### 1. Component Not Updating

**Symptoms:**
- UI doesn't reflect data changes
- Stale data displayed
- Event handlers not working

**Solutions:**
```typescript
// Force re-render
const [refreshKey, setRefreshKey] = useState(0)

const refreshData = () => {
  setRefreshKey(prev => prev + 1)
}

// Use key prop for forced re-mount
<LineupDisplay key={refreshKey} {...props} />
```

### 2. Event Handler Issues

**Symptoms:**
- Click events not firing
- Form submissions failing
- Navigation not working

**Solutions:**
```typescript
// Add event debugging
const handleClick = (e: React.MouseEvent) => {
  console.log('Click event:', e)
  console.log('Target:', e.target)
  console.log('Current target:', e.currentTarget)
  
  // Prevent event bubbling if needed
  e.stopPropagation()
  
  // Your handler logic
}
```

## Backend Issues

### 1. Database Connection Issues

**Symptoms:**
- Connection timeouts
- Query failures
- Data not persisting

**Solutions:**
```typescript
// Add connection retry
const executeWithRetry = async (query: () => Promise<any>, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await query()
    } catch (error) {
      if (i === retries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
}
```

### 2. Permission Issues

**Symptoms:**
- Access denied errors
- Data not loading
- Operations failing

**Solutions:**
```typescript
// Check permissions
const checkPermissions = async (userId: string, resource: string) => {
  const { data, error } = await supabase
    .from('user_permissions')
    .select('*')
    .eq('user_id', userId)
    .eq('resource', resource)
  
  if (error) throw error
  return data?.length > 0
}
```

## Migration Issues

### 1. Data Migration Failures

**Symptoms:**
- Migration scripts failing
- Data loss during migration
- Inconsistent data after migration

**Solutions:**
```typescript
// Backup before migration
const backupData = async (table: string) => {
  const { data } = await supabase.from(table).select('*')
  await supabase.from(`${table}_backup`).insert(data)
}

// Validate migration
const validateMigration = async (table: string) => {
  const original = await supabase.from(`${table}_backup`).select('count')
  const migrated = await supabase.from(table).select('count')
  
  if (original.data?.[0]?.count !== migrated.data?.[0]?.count) {
    throw new Error('Migration validation failed')
  }
}
```

## Emergency Procedures

### 1. Rollback Procedure

```typescript
// Emergency rollback
const emergencyRollback = async (versionId: string) => {
  try {
    // Deactivate all versions
    await supabase
      .from('generation_versions')
      .update({ is_active: false })
      .eq('generation_id', generationId)
    
    // Activate default version
    await supabase
      .from('generation_versions')
      .update({ is_active: true })
      .eq('version', 'default')
      .eq('generation_id', generationId)
    
    console.log('Emergency rollback completed')
  } catch (error) {
    console.error('Emergency rollback failed:', error)
  }
}
```

### 2. Data Recovery

```typescript
// Recover from backup
const recoverFromBackup = async (table: string, backupDate: string) => {
  const backup = await supabase
    .from(`${table}_backup`)
    .select('*')
    .eq('backup_date', backupDate)
  
  if (backup.data) {
    await supabase.from(table).delete()
    await supabase.from(table).insert(backup.data)
  }
}
```

## Conclusion

This troubleshooting guide provides comprehensive solutions for common issues in the version systems. Always test solutions in a development environment before applying to production, and maintain proper backups before making significant changes.

For additional support, refer to the individual system documentation or contact the development team.
