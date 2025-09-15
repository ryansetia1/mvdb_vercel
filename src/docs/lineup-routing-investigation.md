# Lineup Routing Investigation & Fix

## Masalah: "Invalid type parameter" untuk Lineup Update

### Investigasi Codebase

#### 1. **Masalah yang Ditemukan**
- Function `updateExtendedMasterData` sudah ada dan mendukung 'lineup'
- Function `updateLineupData` sudah dibuat dan di-export
- Validasi type sudah diperbaiki untuk include 'lineup'
- **TAPI**: Tidak ada route yang memanggil `updateExtendedMasterData` untuk lineup!

#### 2. **Root Cause Analysis**
```typescript
// Di index.ts, ada route generic:
app.put('/make-server-e0516fcf/master/:type/:id/extended', async (c) => {
  // TAPI ini memanggil updateExtendedMasterDataWithSync, bukan updateExtendedMasterData!
  return await updateExtendedMasterDataWithSync(c)
})
```

**Masalah**: Route generic memanggil `updateExtendedMasterDataWithSync` yang tidak mendukung lineup, bukan `updateExtendedMasterData` yang sudah diperbaiki.

#### 3. **Function Import vs Usage**
```typescript
// Di index.ts - IMPORT ada tapi tidak digunakan
import { updateExtendedMasterData } from './masterDataApi.ts'

// Route yang ada memanggil function yang salah
app.put('/make-server-e0516fcf/master/:type/:id/extended', async (c) => {
  return await updateExtendedMasterDataWithSync(c) // SALAH!
})
```

### Solusi yang Diterapkan

#### 1. **Tambahkan Route Khusus untuk Lineup**
**File**: `supabase/functions/make-server-e0516fcf/index.ts`

```typescript
// Lineup routes
app.put('/make-server-e0516fcf/master/lineup/:id/extended', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized - admin access required' }, 401)
    }

    return await updateExtendedMasterData(c) // BENAR!
  } catch (error) {
    console.error('Update lineup route error:', error)
    return c.json({ 
      error: `Update lineup error: ${error.message}`,
      details: error?.stack
    }, 500)
  }
})
```

#### 2. **Route Placement**
Route ditempatkan setelah generation routes untuk konsistensi:
```typescript
// Generation routes
app.post('/make-server-e0516fcf/master/generation/extended', createGenerationData)
app.put('/make-server-e0516fcf/master/generation/:id/extended', updateGenerationData)

// Lineup routes - BARU!
app.put('/make-server-e0516fcf/master/lineup/:id/extended', async (c) => {
  // ... implementation
})
```

### Testing

#### 1. **Test Route Endpoint**
```bash
# Test dengan curl
curl -X PUT "https://duafhkktqobwwwwtygwn.supabase.co/functions/v1/make-server-e0516fcf/master/lineup/test-id/extended" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Lineup",
    "generationId": "test-generation-id",
    "generationName": "1st Generation",
    "lineupType": "Main",
    "lineupOrder": 1,
    "description": "Test description"
  }'
```

#### 2. **Test Frontend Integration**
```javascript
// Di browser console
const testData = {
  name: 'Test Lineup',
  generationId: 'test-generation-id',
  generationName: 'Test Generation',
  lineupType: 'Main',
  lineupOrder: 1,
  description: 'Test description'
}

masterDataApi.updateExtended('lineup', 'test-lineup-id', testData, accessToken)
  .then(result => console.log('Success:', result))
  .catch(error => console.error('Error:', error))
```

### Debug Information

#### 1. **Server Logs yang Diharapkan**
```
Server: Updating extended lineup with ID: {id}
Server: Lineup update data: {data}
Server: Found lineup to update: {existingItem}
Server: Successfully updated lineup: {updatedItem}
```

#### 2. **Network Request**
- **Method**: PUT
- **URL**: `/master/lineup/{id}/extended`
- **Body**: JSON dengan lineup data
- **Response**: 200 OK dengan updated lineup data

### Common Issues

#### 1. **Route Not Found**
**Problem**: 404 error saat update lineup
**Solution**: Pastikan route sudah di-deploy dengan benar

#### 2. **Function Not Called**
**Problem**: Route ada tapi tidak memanggil function yang benar
**Solution**: Pastikan route memanggil `updateExtendedMasterData`, bukan `updateExtendedMasterDataWithSync`

#### 3. **Authentication Error**
**Problem**: 401 Unauthorized
**Solution**: Pastikan token valid dan user sudah login

### Best Practices

#### 1. **Route Organization**
```typescript
// Group routes by functionality
// Generation routes
app.post('/master/generation/extended', createGenerationData)
app.put('/master/generation/:id/extended', updateGenerationData)

// Lineup routes
app.put('/master/lineup/:id/extended', updateLineupHandler)
```

#### 2. **Error Handling**
```typescript
app.put('/master/lineup/:id/extended', async (c) => {
  try {
    // Authentication
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    // Call the right function
    return await updateExtendedMasterData(c)
  } catch (error) {
    console.error('Update lineup route error:', error)
    return c.json({ 
      error: `Update lineup error: ${error.message}`,
      details: error?.stack
    }, 500)
  }
})
```

#### 3. **Function Naming**
```typescript
// Gunakan nama yang jelas
updateExtendedMasterData     // Untuk update biasa
updateExtendedMasterDataWithSync  // Untuk update dengan sync
```

### Alternative Solutions

#### 1. **Fix Generic Route**
```typescript
// Perbaiki route generic untuk mendukung lineup
app.put('/master/:type/:id/extended', async (c) => {
  const type = c.req.param('type')
  
  if (type === 'lineup') {
    return await updateExtendedMasterData(c)
  } else {
    return await updateExtendedMasterDataWithSync(c)
  }
})
```

#### 2. **Update Function WithSync**
```typescript
// Tambahkan support lineup ke updateExtendedMasterDataWithSync
const validTypesWithSync = ['actor', 'actress', 'director', 'series', 'studio', 'label', 'group', 'generation', 'lineup']
```

#### 3. **Route Middleware**
```typescript
// Buat middleware untuk routing
const lineupRouteHandler = async (c: Context) => {
  return await updateExtendedMasterData(c)
}

app.put('/master/lineup/:id/extended', lineupRouteHandler)
```

### Monitoring

#### 1. **Server Logs**
```bash
# Monitor server logs untuk error
# Cari pattern: "Update lineup route error"
```

#### 2. **Network Monitoring**
```javascript
// Monitor network requests
console.log('PUT request to:', url)
console.log('Request body:', data)
console.log('Response:', response)
```

#### 3. **Error Tracking**
```typescript
// Track error di frontend
catch (error) {
  console.error('Lineup update failed:', {
    error: error.message,
    lineupId: id,
    data: updateData
  })
}
```

---

**Last Updated:** December 2024  
**Version:** 1.0.0  
**Maintainer:** Development Team
