# API Design for Group Photobooks Linking

## Overview
Dokumen ini menjelaskan design API endpoints yang diperlukan untuk mendukung fitur Group Photobooks Linking.

## Current API Structure

### Existing Photobook API
```typescript
// src/utils/photobookApi.ts
export const photobookApi = {
  async getPhotobooks(accessToken: string): Promise<Photobook[]>
  async getPhotobook(id: string, accessToken: string): Promise<Photobook>
  async createPhotobook(photobook: Photobook, accessToken: string): Promise<Photobook>
  async updatePhotobook(id: string, photobook: Partial<Photobook>, accessToken: string): Promise<Photobook>
  async deletePhotobook(id: string, accessToken: string): Promise<void>
  async getPhotobooksByActress(actressName: string, accessToken: string): Promise<Photobook[]>
}
```

### Server-Side API
```typescript
// src/supabase/functions/server/photobookApi.tsx
photobookApi.get('/photobooks', ...)
photobookApi.get('/photobooks/:id', ...)
photobookApi.post('/photobooks', ...)
photobookApi.put('/photobooks/:id', ...)
photobookApi.delete('/photobooks/:id', ...)
photobookApi.get('/photobooks/by-actress/:actressName', ...)
```

## New API Endpoints

### 1. Get Photobooks by Hierarchy Level

#### Client-Side API Methods
```typescript
// src/utils/photobookApi.ts
export const photobookApi = {
  // ... existing methods
  
  // NEW: Get photobooks linked to group
  async getPhotobooksByGroup(groupId: string, accessToken: string): Promise<Photobook[]> {
    const response = await fetch(`${getBaseUrl()}/photobooks/by-group/${groupId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch photobooks by group')
    }
    
    return response.json()
  },
  
  // NEW: Get photobooks linked to generation
  async getPhotobooksByGeneration(generationId: string, accessToken: string): Promise<Photobook[]> {
    const response = await fetch(`${getBaseUrl()}/photobooks/by-generation/${generationId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch photobooks by generation')
    }
    
    return response.json()
  },
  
  // NEW: Get photobooks linked to lineup
  async getPhotobooksByLineup(lineupId: string, accessToken: string): Promise<Photobook[]> {
    const response = await fetch(`${getBaseUrl()}/photobooks/by-lineup/${lineupId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch photobooks by lineup')
    }
    
    return response.json()
  },
  
  // NEW: Get photobooks linked to member
  async getPhotobooksByMember(memberId: string, accessToken: string): Promise<Photobook[]> {
    const response = await fetch(`${getBaseUrl()}/photobooks/by-member/${memberId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch photobooks by member')
    }
    
    return response.json()
  }
}
```

#### Server-Side API Endpoints
```typescript
// src/supabase/functions/server/photobookApi.tsx

// GET /photobooks/by-group/:groupId
photobookApi.get('/photobooks/by-group/:groupId', async (c) => {
  try {
    const groupId = c.req.param('groupId')
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    
    // Validate access token
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    // Get all photobooks
    const allPhotobooks = await kv.list({ prefix: 'photobook_' })
    const photobooks = allPhotobooks.filter(p => p.linkedTo?.groupId === groupId)
    
    return c.json(photobooks)
  } catch (error) {
    console.error('Get photobooks by group error:', error)
    return c.json({ error: 'Failed to fetch photobooks by group' }, 500)
  }
})

// GET /photobooks/by-generation/:generationId
photobookApi.get('/photobooks/by-generation/:generationId', async (c) => {
  try {
    const generationId = c.req.param('generationId')
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    
    // Validate access token
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    // Get all photobooks
    const allPhotobooks = await kv.list({ prefix: 'photobook_' })
    const photobooks = allPhotobooks.filter(p => p.linkedTo?.generationId === generationId)
    
    return c.json(photobooks)
  } catch (error) {
    console.error('Get photobooks by generation error:', error)
    return c.json({ error: 'Failed to fetch photobooks by generation' }, 500)
  }
})

// GET /photobooks/by-lineup/:lineupId
photobookApi.get('/photobooks/by-lineup/:lineupId', async (c) => {
  try {
    const lineupId = c.req.param('lineupId')
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    
    // Validate access token
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    // Get all photobooks
    const allPhotobooks = await kv.list({ prefix: 'photobook_' })
    const photobooks = allPhotobooks.filter(p => p.linkedTo?.lineupId === lineupId)
    
    return c.json(photobooks)
  } catch (error) {
    console.error('Get photobooks by lineup error:', error)
    return c.json({ error: 'Failed to fetch photobooks by lineup' }, 500)
  }
})

// GET /photobooks/by-member/:memberId
photobookApi.get('/photobooks/by-member/:memberId', async (c) => {
  try {
    const memberId = c.req.param('memberId')
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    
    // Validate access token
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    // Get all photobooks
    const allPhotobooks = await kv.list({ prefix: 'photobook_' })
    const photobooks = allPhotobooks.filter(p => p.linkedTo?.memberId === memberId)
    
    return c.json(photobooks)
  } catch (error) {
    console.error('Get photobooks by member error:', error)
    return c.json({ error: 'Failed to fetch photobooks by member' }, 500)
  }
})
```

### 2. Link Photobook to Hierarchy Level

#### Client-Side API Method
```typescript
// src/utils/photobookApi.ts
export const photobookApi = {
  // ... existing methods
  
  // NEW: Link photobook to hierarchy level
  async linkPhotobook(
    photobookId: string,
    targetType: 'group' | 'generation' | 'lineup' | 'member',
    targetId: string,
    accessToken: string
  ): Promise<Photobook> {
    const response = await fetch(`${getBaseUrl()}/photobooks/${photobookId}/link`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        targetType,
        targetId
      })
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to link photobook')
    }
    
    return response.json()
  }
}
```

#### Server-Side API Endpoint
```typescript
// src/supabase/functions/server/photobookApi.tsx

// POST /photobooks/:photobookId/link
photobookApi.post('/photobooks/:photobookId/link', async (c) => {
  try {
    const photobookId = c.req.param('photobookId')
    const { targetType, targetId } = await c.req.json()
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    
    // Validate access token
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    // Validate input
    if (!targetType || !targetId) {
      return c.json({ error: 'targetType and targetId are required' }, 400)
    }
    
    if (!['group', 'generation', 'lineup', 'member'].includes(targetType)) {
      return c.json({ error: 'Invalid targetType' }, 400)
    }
    
    // Get existing photobook
    const existingPhotobook = await kv.get(`photobook_${photobookId}`)
    if (!existingPhotobook) {
      return c.json({ error: 'Photobook not found' }, 404)
    }
    
    // Update photobook with new link
    const updatedPhotobook = {
      ...existingPhotobook,
      linkedTo: {
        ...existingPhotobook.linkedTo,
        [targetType + 'Id']: targetId
      },
      updatedAt: new Date().toISOString()
    }
    
    // Save updated photobook
    await kv.set(`photobook_${photobookId}`, updatedPhotobook)
    
    return c.json(updatedPhotobook)
  } catch (error) {
    console.error('Link photobook error:', error)
    return c.json({ error: 'Failed to link photobook' }, 500)
  }
})
```

### 3. Unlink Photobook from Hierarchy Level

#### Client-Side API Method
```typescript
// src/utils/photobookApi.ts
export const photobookApi = {
  // ... existing methods
  
  // NEW: Unlink photobook from hierarchy level
  async unlinkPhotobook(
    photobookId: string,
    targetType: 'group' | 'generation' | 'lineup' | 'member',
    accessToken: string
  ): Promise<Photobook> {
    const response = await fetch(`${getBaseUrl()}/photobooks/${photobookId}/unlink`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        targetType
      })
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to unlink photobook')
    }
    
    return response.json()
  }
}
```

#### Server-Side API Endpoint
```typescript
// src/supabase/functions/server/photobookApi.tsx

// DELETE /photobooks/:photobookId/unlink
photobookApi.delete('/photobooks/:photobookId/unlink', async (c) => {
  try {
    const photobookId = c.req.param('photobookId')
    const { targetType } = await c.req.json()
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    
    // Validate access token
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    // Validate input
    if (!targetType) {
      return c.json({ error: 'targetType is required' }, 400)
    }
    
    if (!['group', 'generation', 'lineup', 'member'].includes(targetType)) {
      return c.json({ error: 'Invalid targetType' }, 400)
    }
    
    // Get existing photobook
    const existingPhotobook = await kv.get(`photobook_${photobookId}`)
    if (!existingPhotobook) {
      return c.json({ error: 'Photobook not found' }, 404)
    }
    
    // Update photobook to remove link
    const updatedPhotobook = {
      ...existingPhotobook,
      linkedTo: {
        ...existingPhotobook.linkedTo,
        [targetType + 'Id']: undefined
      },
      updatedAt: new Date().toISOString()
    }
    
    // Save updated photobook
    await kv.set(`photobook_${photobookId}`, updatedPhotobook)
    
    return c.json(updatedPhotobook)
  } catch (error) {
    console.error('Unlink photobook error:', error)
    return c.json({ error: 'Failed to unlink photobook' }, 500)
  }
})
```

### 4. Get Available Photobooks for Linking

#### Client-Side API Method
```typescript
// src/utils/photobookApi.ts
export const photobookApi = {
  // ... existing methods
  
  // NEW: Get available photobooks for linking
  async getAvailablePhotobooksForLinking(accessToken: string): Promise<Photobook[]> {
    const response = await fetch(`${getBaseUrl()}/photobooks/available-for-linking`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch available photobooks')
    }
    
    return response.json()
  }
}
```

#### Server-Side API Endpoint
```typescript
// src/supabase/functions/server/photobookApi.tsx

// GET /photobooks/available-for-linking
photobookApi.get('/photobooks/available-for-linking', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    
    // Validate access token
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    // Get all photobooks
    const allPhotobooks = await kv.list({ prefix: 'photobook_' })
    
    // Filter photobooks that are not fully linked
    const availablePhotobooks = allPhotobooks.filter(p => {
      const linkedTo = p.linkedTo || {}
      const linkCount = Object.values(linkedTo).filter(Boolean).length
      return linkCount < 4 // Allow linking to multiple levels
    })
    
    return c.json(availablePhotobooks)
  } catch (error) {
    console.error('Get available photobooks error:', error)
    return c.json({ error: 'Failed to fetch available photobooks' }, 500)
  }
})
```

## API Response Types

### Standard Response Format
```typescript
interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
  timestamp: string
}

interface PhotobookResponse extends ApiResponse<Photobook> {}
interface PhotobooksResponse extends ApiResponse<Photobook[]> {}
```

### Error Response Format
```typescript
interface ErrorResponse {
  error: string
  message?: string
  code?: string
  timestamp: string
  requestId?: string
}
```

## Authentication & Authorization

### Access Token Validation
```typescript
const validateAccessToken = async (accessToken: string): Promise<boolean> => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    return !error && !!user?.id
  } catch (error) {
    return false
  }
}
```

### Rate Limiting
```typescript
const rateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests, please try again later'
}
```

## Error Handling

### Common Error Scenarios
1. **Authentication Errors**
   - Invalid access token
   - Expired access token
   - Missing access token

2. **Validation Errors**
   - Invalid photobook ID
   - Invalid target type
   - Invalid target ID
   - Missing required fields

3. **Business Logic Errors**
   - Photobook not found
   - Target not found
   - Duplicate linking
   - Circular dependencies

4. **System Errors**
   - Database connection errors
   - Network timeouts
   - Internal server errors

### Error Response Examples
```typescript
// Authentication Error
{
  "error": "Unauthorized",
  "message": "Invalid or expired access token",
  "code": "AUTH_ERROR",
  "timestamp": "2024-01-01T00:00:00Z"
}

// Validation Error
{
  "error": "Validation Error",
  "message": "targetType must be one of: group, generation, lineup, member",
  "code": "VALIDATION_ERROR",
  "timestamp": "2024-01-01T00:00:00Z"
}

// Business Logic Error
{
  "error": "Not Found",
  "message": "Photobook with ID 'photobook_123' not found",
  "code": "NOT_FOUND",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Performance Optimization

### Caching Strategy
```typescript
const cacheConfig = {
  photobooks: {
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 1000
  },
  linking: {
    ttl: 10 * 60 * 1000, // 10 minutes
    maxSize: 500
  }
}
```

### Query Optimization
```typescript
// Batch multiple requests
const batchGetPhotobooks = async (requests: Array<{
  type: 'group' | 'generation' | 'lineup' | 'member'
  id: string
}>, accessToken: string): Promise<Photobook[][]> => {
  const promises = requests.map(req => {
    switch (req.type) {
      case 'group': return photobookApi.getPhotobooksByGroup(req.id, accessToken)
      case 'generation': return photobookApi.getPhotobooksByGeneration(req.id, accessToken)
      case 'lineup': return photobookApi.getPhotobooksByLineup(req.id, accessToken)
      case 'member': return photobookApi.getPhotobooksByMember(req.id, accessToken)
    }
  })
  
  return Promise.all(promises)
}
```

## Testing Strategy

### Unit Tests
```typescript
describe('Photobook API', () => {
  describe('getPhotobooksByGroup', () => {
    it('should return photobooks linked to group', async () => {
      const mockPhotobooks = [
        { id: '1', titleEn: 'Test 1', linkedTo: { groupId: 'group_1' } },
        { id: '2', titleEn: 'Test 2', linkedTo: { groupId: 'group_1' } }
      ]
      
      const result = await photobookApi.getPhotobooksByGroup('group_1', 'token')
      expect(result).toEqual(mockPhotobooks)
    })
  })
  
  describe('linkPhotobook', () => {
    it('should link photobook to group', async () => {
      const result = await photobookApi.linkPhotobook('photobook_1', 'group', 'group_1', 'token')
      expect(result.linkedTo?.groupId).toBe('group_1')
    })
  })
})
```

### Integration Tests
```typescript
describe('Photobook Linking Integration', () => {
  it('should complete full linking workflow', async () => {
    // 1. Get available photobooks
    const available = await photobookApi.getAvailablePhotobooksForLinking('token')
    expect(available.length).toBeGreaterThan(0)
    
    // 2. Link photobook to group
    const photobook = available[0]
    const linked = await photobookApi.linkPhotobook(photobook.id, 'group', 'group_1', 'token')
    expect(linked.linkedTo?.groupId).toBe('group_1')
    
    // 3. Verify photobook appears in group list
    const groupPhotobooks = await photobookApi.getPhotobooksByGroup('group_1', 'token')
    expect(groupPhotobooks).toContainEqual(linked)
    
    // 4. Unlink photobook
    const unlinked = await photobookApi.unlinkPhotobook(photobook.id, 'group', 'token')
    expect(unlinked.linkedTo?.groupId).toBeUndefined()
  })
})
```

## Monitoring & Logging

### API Metrics
```typescript
const metrics = {
  requests: {
    total: 0,
    successful: 0,
    failed: 0,
    averageResponseTime: 0
  },
  linking: {
    totalLinks: 0,
    totalUnlinks: 0,
    averageLinkingTime: 0
  }
}
```

### Logging Strategy
```typescript
const logApiCall = (endpoint: string, method: string, status: number, duration: number) => {
  console.log({
    timestamp: new Date().toISOString(),
    endpoint,
    method,
    status,
    duration,
    level: status >= 400 ? 'error' : 'info'
  })
}
```

## Conclusion

API design yang diusulkan memberikan foundation yang solid untuk fitur Group Photobooks Linking dengan fokus pada:
- **Simplicity**: API endpoints yang mudah dipahami dan digunakan
- **Consistency**: Mengikuti pattern API yang sudah ada
- **Performance**: Optimized untuk performa yang baik
- **Reliability**: Error handling dan monitoring yang comprehensive
- **Security**: Authentication dan authorization yang proper
