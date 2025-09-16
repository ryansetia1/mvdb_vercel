# Version Systems Implementation Guide

## Overview

This guide provides step-by-step instructions for implementing Generation Version System and Lineup Version System in the MVDB application.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Setup](#database-setup)
3. [Backend Implementation](#backend-implementation)
4. [Frontend Implementation](#frontend-implementation)
5. [Integration Steps](#integration-steps)
6. [Testing](#testing)
7. [Deployment](#deployment)

## Prerequisites

### Required Knowledge
- React/TypeScript
- Supabase
- Database design
- API development

### Required Tools
- Node.js 18+
- Supabase CLI
- Database management tool
- Code editor

## Database Setup

### 1. Create Tables

```sql
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
```

### 2. Create Indexes

```sql
-- Performance indexes
CREATE INDEX idx_generation_versions_generation_id ON generation_versions(generation_id);
CREATE INDEX idx_generation_versions_active ON generation_versions(generation_id, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_lineup_versions_lineup_id ON lineup_versions(lineup_id);
CREATE INDEX idx_lineup_versions_active ON lineup_versions(lineup_id, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_lineup_member_assignments_version_id ON lineup_member_assignments(lineup_version_id);
CREATE INDEX idx_lineup_member_assignments_position ON lineup_member_assignments(lineup_version_id, position);
```

### 3. Create RLS Policies

```sql
-- Enable RLS
ALTER TABLE generation_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lineup_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lineup_member_assignments ENABLE ROW LEVEL SECURITY;

-- Generation versions policies
CREATE POLICY "Users can view generation versions" ON generation_versions
  FOR SELECT USING (true);

CREATE POLICY "Users can create generation versions" ON generation_versions
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update generation versions" ON generation_versions
  FOR UPDATE USING (auth.uid() = created_by);

-- Lineup versions policies
CREATE POLICY "Users can view lineup versions" ON lineup_versions
  FOR SELECT USING (true);

CREATE POLICY "Users can create lineup versions" ON lineup_versions
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update lineup versions" ON lineup_versions
  FOR UPDATE USING (auth.uid() = created_by);

-- Member assignments policies
CREATE POLICY "Users can view lineup member assignments" ON lineup_member_assignments
  FOR SELECT USING (true);

CREATE POLICY "Users can create lineup member assignments" ON lineup_member_assignments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update lineup member assignments" ON lineup_member_assignments
  FOR UPDATE USING (true);
```

## Backend Implementation

### 1. Create API Functions

```typescript
// src/services/masterDataApi.ts

export class MasterDataApi {
  // Generation Version Methods
  async getGenerationVersions(generationId: string): Promise<GenerationVersion[]> {
    const { data, error } = await supabase
      .from('generation_versions')
      .select('*')
      .eq('generation_id', generationId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async createGenerationVersion(data: CreateGenerationVersionData): Promise<GenerationVersion> {
    const { data: version, error } = await supabase
      .from('generation_versions')
      .insert({
        generation_id: data.generationId,
        version: data.version,
        name: data.name,
        description: data.description,
        metadata: data.metadata,
        is_active: false,
        created_by: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single()

    if (error) throw error
    return version
  }

  async activateGenerationVersion(generationId: string, versionId: string): Promise<GenerationVersion> {
    // Deactivate all versions
    await supabase
      .from('generation_versions')
      .update({ is_active: false })
      .eq('generation_id', generationId)

    // Activate selected version
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

  // Lineup Version Methods
  async getLineupVersions(lineupId: string): Promise<LineupVersion[]> {
    const { data, error } = await supabase
      .from('lineup_versions')
      .select('*')
      .eq('lineup_id', lineupId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async createLineupVersion(data: CreateLineupVersionData): Promise<LineupVersion> {
    const { data: version, error } = await supabase
      .from('lineup_versions')
      .insert({
        lineup_id: data.lineupId,
        version: data.version,
        name: data.name,
        description: data.description,
        metadata: data.metadata,
        is_active: false,
        created_by: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single()

    if (error) throw error
    return version
  }

  async activateLineupVersion(lineupId: string, versionId: string): Promise<LineupVersion> {
    // Deactivate all versions
    await supabase
      .from('lineup_versions')
      .update({ is_active: false })
      .eq('lineup_id', lineupId)

    // Activate selected version
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

  // Member Assignment Methods
  async getLineupVersionMembers(versionId: string): Promise<LineupMemberAssignment[]> {
    const { data, error } = await supabase
      .from('lineup_member_assignments')
      .select('*')
      .eq('lineup_version_id', versionId)
      .eq('is_active', true)
      .order('position')

    if (error) throw error
    return data || []
  }

  async assignMemberToLineupVersion(data: AssignMemberData): Promise<LineupMemberAssignment> {
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

  async removeMemberFromLineupVersion(assignmentId: string): Promise<void> {
    const { error } = await supabase
      .from('lineup_member_assignments')
      .update({ is_active: false })
      .eq('id', assignmentId)

    if (error) throw error
  }
}

export const masterDataApi = new MasterDataApi()
```

### 2. Create Type Definitions

```typescript
// src/types/version.ts

export interface GenerationVersion {
  id: string
  generationId: string
  version: string
  name: string
  description?: string
  metadata?: any
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdBy: string
}

export interface LineupVersion {
  id: string
  lineupId: string
  version: string
  name: string
  description?: string
  metadata?: any
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdBy: string
}

export interface LineupMemberAssignment {
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

export interface CreateGenerationVersionData {
  generationId: string
  version: string
  name: string
  description?: string
  metadata?: any
}

export interface CreateLineupVersionData {
  lineupId: string
  version: string
  name: string
  description?: string
  metadata?: any
}

export interface AssignMemberData {
  lineupVersionId: string
  actressId: string
  actressName: string
  alias?: string
  profilePicture?: string
  position: number
}
```

## Frontend Implementation

### 1. Create Custom Hooks

```typescript
// src/hooks/useGenerationVersions.ts

import { useState, useEffect, useCallback } from 'react'
import { masterDataApi } from '../services/masterDataApi'
import { GenerationVersion } from '../types/version'

interface UseGenerationVersionsReturn {
  versions: GenerationVersion[]
  activeVersion: GenerationVersion | null
  selectedVersion: string
  loading: boolean
  error: string | null
  loadVersions: () => Promise<void>
  switchVersion: (version: string) => Promise<void>
  createVersion: (data: CreateGenerationVersionData) => Promise<void>
}

export function useGenerationVersions(generationId: string): UseGenerationVersionsReturn {
  const [versions, setVersions] = useState<GenerationVersion[]>([])
  const [activeVersion, setActiveVersion] = useState<GenerationVersion | null>(null)
  const [selectedVersion, setSelectedVersion] = useState<string>('default')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadVersions = useCallback(async () => {
    if (!generationId) return
    
    setLoading(true)
    setError(null)
    
    try {
      const versionsData = await masterDataApi.getGenerationVersions(generationId)
      const active = versionsData.find(v => v.isActive)
      
      setVersions(versionsData)
      setActiveVersion(active || null)
      setSelectedVersion(active?.version || 'default')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load versions')
    } finally {
      setLoading(false)
    }
  }, [generationId])

  const switchVersion = useCallback(async (version: string) => {
    if (!generationId) return
    
    try {
      const versionData = versions.find(v => v.version === version)
      if (!versionData) throw new Error('Version not found')
      
      await masterDataApi.activateGenerationVersion(generationId, versionData.id)
      await loadVersions() // Reload to get updated state
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to switch version')
    }
  }, [generationId, versions, loadVersions])

  const createVersion = useCallback(async (data: CreateGenerationVersionData) => {
    try {
      await masterDataApi.createGenerationVersion(data)
      await loadVersions() // Reload to include new version
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create version')
    }
  }, [loadVersions])

  useEffect(() => {
    loadVersions()
  }, [loadVersions])

  return {
    versions,
    activeVersion,
    selectedVersion,
    loading,
    error,
    loadVersions,
    switchVersion,
    createVersion
  }
}
```

### 2. Create Version Selector Components

```typescript
// src/components/GenerationVersionSelector.tsx

import React from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useGenerationVersions } from '@/hooks/useGenerationVersions'

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
    return (
      <div className="animate-pulse bg-gray-200 h-10 rounded-md w-full" />
    )
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

### 3. Update Existing Components

```typescript
// Update GroupDetailContent.tsx to include version selectors

// Add version state
const [selectedGenerationVersion, setSelectedGenerationVersion] = useState('default')
const [selectedLineupVersion, setSelectedLineupVersion] = useState('default')

// Add version selectors to UI
<div className="flex items-center gap-4 mb-4">
  <div className="flex items-center gap-2">
    <span className="text-sm font-medium">Generation Version:</span>
    <GenerationVersionSelector
      generationId={selectedGenerationId}
      selectedVersion={selectedGenerationVersion}
      onVersionChange={setSelectedGenerationVersion}
      className="w-48"
    />
  </div>
  
  <div className="flex items-center gap-2">
    <span className="text-sm font-medium">Lineup Version:</span>
    <LineupVersionSelector
      lineupId={selectedLineupId}
      selectedVersion={selectedLineupVersion}
      onVersionChange={setSelectedLineupVersion}
      className="w-48"
    />
  </div>
</div>
```

## Integration Steps

### 1. Update Data Loading Logic

```typescript
// Update data loading to use versions
const loadLineupData = useCallback(async (generationId: string, generationVersion: string) => {
  try {
    const [lineups, actresses] = await Promise.all([
      masterDataApi.getLineupsByGenerationVersion(generationId, generationVersion),
      masterDataApi.getActressesByGenerationVersion(generationId, generationVersion)
    ])
    
    setLineupData({ lineups, actresses })
    setLineupDataLoaded(true)
  } catch (error) {
    console.error('Failed to load lineup data:', error)
  }
}, [])
```

### 2. Update Component Props

```typescript
// Update LineupDisplay props to include version information
<LineupDisplay
  generationId={selectedGenerationId}
  generationName={generations.find(g => g.id === selectedGenerationId)?.name || 'Unnamed Generation'}
  accessToken={accessToken}
  selectedGenerationVersion={selectedGenerationVersion}
  selectedLineupVersion={selectedLineupVersion}
  onProfileSelect={(type: string, name: string) => onProfileSelect(type as 'actress' | 'actor', name)}
  getLineupProfilePicture={(actress, lineupId) => getLineupProfilePicture(actress, lineupId, selectedLineupVersion === 'default' ? undefined : selectedLineupVersion) || null}
  getLineupAlias={(actress, lineupId) => getLineupAlias(actress, lineupId) || null}
  lineups={lineupData?.lineups || []}
  actresses={lineupData?.actresses || []}
  onDataChange={() => {
    console.log('LineupDisplay: Data changed, but not triggering refresh to avoid loop')
  }}
/>
```

## Testing

### 1. Unit Tests

```typescript
// src/tests/version-systems.test.ts

import { describe, test, expect, beforeEach } from 'vitest'
import { masterDataApi } from '../services/masterDataApi'

describe('Version Systems', () => {
  beforeEach(async () => {
    // Setup test data
  })

  test('should create generation version', async () => {
    const version = await masterDataApi.createGenerationVersion({
      generationId: 'test-generation-id',
      version: 'test-version',
      name: 'Test Version'
    })
    
    expect(version.version).toBe('test-version')
    expect(version.name).toBe('Test Version')
  })

  test('should activate generation version', async () => {
    const version = await masterDataApi.createGenerationVersion({
      generationId: 'test-generation-id',
      version: 'test-version',
      name: 'Test Version'
    })
    
    await masterDataApi.activateGenerationVersion('test-generation-id', version.id)
    
    const versions = await masterDataApi.getGenerationVersions('test-generation-id')
    const activeVersion = versions.find(v => v.isActive)
    
    expect(activeVersion?.id).toBe(version.id)
  })
})
```

### 2. Integration Tests

```typescript
// src/tests/integration/version-integration.test.ts

import { describe, test, expect } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { GenerationVersionSelector } from '../components/GenerationVersionSelector'

describe('Version Integration', () => {
  test('should switch generation version', async () => {
    render(
      <GenerationVersionSelector
        generationId="test-generation-id"
        selectedVersion="default"
        onVersionChange={jest.fn()}
      />
    )
    
    const selector = screen.getByRole('combobox')
    fireEvent.click(selector)
    
    await waitFor(() => {
      expect(screen.getByText('Version 1')).toBeInTheDocument()
    })
  })
})
```

## Deployment

### 1. Database Migration

```sql
-- Create migration script
-- migrations/001_add_version_systems.sql

BEGIN;

-- Create tables
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

-- Add other tables...

-- Create indexes
CREATE INDEX idx_generation_versions_generation_id ON generation_versions(generation_id);
CREATE INDEX idx_generation_versions_active ON generation_versions(generation_id, is_active) WHERE is_active = TRUE;

-- Enable RLS
ALTER TABLE generation_versions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view generation versions" ON generation_versions
  FOR SELECT USING (true);

COMMIT;
```

### 2. Environment Configuration

```typescript
// Update environment variables
const config = {
  supabaseUrl: process.env.VITE_SUPABASE_URL,
  supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY,
  versionCacheTimeout: 300000, // 5 minutes
  maxRetries: 3,
  retryDelay: 1000
}
```

### 3. Build Configuration

```typescript
// Update vite.config.ts
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'version-systems': ['./src/hooks/useGenerationVersions.ts', './src/hooks/useLineupVersions.ts']
        }
      }
    }
  }
})
```

## Conclusion

This implementation guide provides a complete roadmap for adding version systems to the MVDB application. Follow the steps in order, test thoroughly, and deploy incrementally to ensure a smooth rollout.

For additional support, refer to the troubleshooting guide or contact the development team.
