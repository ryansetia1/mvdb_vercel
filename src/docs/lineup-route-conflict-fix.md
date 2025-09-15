# Lineup Route Conflict Fix

## Masalah: Route Conflict Menyebabkan "Invalid type parameter"

### Root Cause yang Ditemukan

#### **Masalah Route Conflict**
```typescript
// Route khusus yang saya tambahkan (TIDAK BERFUNGSI)
app.put('/make-server-e0516fcf/master/lineup/:id/extended', async (c) => {
  return await updateExtendedMasterData(c)
})

// Route generic yang menangkap semua request (MASALAH!)
app.put('/make-server-e0516fcf/master/:type/:id/extended', async (c) => {
  return await updateExtendedMasterDataWithSync(c) // SALAH untuk lineup!
})
```

**Masalah**: Route generic `/master/:type/:id/extended` akan menangkap request `/master/lineup/{id}/extended` karena `:type` match dengan "lineup", tapi memanggil `updateExtendedMasterDataWithSync` yang tidak mendukung lineup.

### Solusi yang Diterapkan

#### **Perbaiki Route Generic untuk Mendukung Lineup**
```typescript
app.put('/make-server-e0516fcf/master/:type/:id/extended', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized - admin access required' }, 401)
    }

    const type = c.req.param('type')
    
    // Use updateExtendedMasterData for lineup, updateExtendedMasterDataWithSync for others
    if (type === 'lineup') {
      return await updateExtendedMasterData(c)
    } else {
      return await updateExtendedMasterDataWithSync(c)
    }
  } catch (error) {
    console.error('Update extended master data route error:', error)
    return c.json({ 
      error: `Update extended master data error: ${error.message}`,
      details: error?.stack
    }, 500)
  }
})
```

#### **Hapus Route Khusus yang Tidak Diperlukan**
```typescript
// DIHAPUS - tidak diperlukan lagi
// app.put('/make-server-e0516fcf/master/lineup/:id/extended', async (c) => {
//   return await updateExtendedMasterData(c)
// })
```

### Perubahan yang Dibuat

#### **1. Route Generic Pertama (Line 1869)**
**Sebelum:**
```typescript
app.put('/make-server-e0516fcf/master/:type/:id/extended', async (c) => {
  // ... auth check ...
  return await updateExtendedMasterDataWithSync(c) // SALAH!
})
```

**Sesudah:**
```typescript
app.put('/make-server-e0516fcf/master/:type/:id/extended', async (c) => {
  // ... auth check ...
  const type = c.req.param('type')
  
  if (type === 'lineup') {
    return await updateExtendedMasterData(c) // BENAR!
  } else {
    return await updateExtendedMasterDataWithSync(c)
  }
})
```

#### **2. Route Generic Kedua (Line 1915)**
**Sebelum:**
```typescript
app.put('/make-server-e0516fcf/master/:type/:id/extended', async (c) => {
  // ... auth check ...
  return await updateExtendedMasterDataWithSync(c) // SALAH!
})
```

**Sesudah:**
```typescript
app.put('/make-server-e0516fcf/master/:type/:id/extended', async (c) => {
  // ... auth check ...
  const type = c.req.param('type')
  
  if (type === 'lineup') {
    return await updateExtendedMasterData(c) // BENAR!
  } else {
    return await updateExtendedMasterDataWithSync(c)
  }
})
```

#### **3. Hapus Route Khusus**
```typescript
// DIHAPUS - tidak diperlukan lagi
// Lineup routes
// app.put('/make-server-e0516fcf/master/lineup/:id/extended', async (c) => {
//   // ... implementation ...
// })
```

### Testing

#### **1. Test dengan Frontend**
```javascript
// Di browser console
const testData = {
  name: 'Test Lineup Updated',
  generationId: 'test-generation-id',
  generationName: 'Test Generation',
  lineupType: 'Main',
  lineupOrder: 1,
  description: 'Updated description'
}

masterDataApi.updateExtended('lineup', 'existing-lineup-id', testData, accessToken)
  .then(result => console.log('Success:', result))
  .catch(error => console.error('Error:', error))
```

#### **2. Test dengan curl**
```bash
curl -X PUT "https://duafhkktqobwwwwtygwn.supabase.co/functions/v1/make-server-e0516fcf/master/lineup/test-id/extended" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Lineup",
    "generationId": "test-generation-id",
    "generationName": "Test Generation",
    "lineupType": "Main",
    "lineupOrder": 1,
    "description": "Test description"
  }'
```

### Debug Information

#### **1. Server Logs yang Diharapkan**
```
Server: Updating extended lineup with ID: {id}
Server: Lineup update data: {data}
Server: Found lineup to update: {existingItem}
Server: Successfully updated lineup: {updatedItem}
```

#### **2. Network Request**
- **Method**: PUT
- **URL**: `/master/lineup/{id}/extended`
- **Body**: JSON dengan lineup data
- **Response**: 200 OK dengan updated lineup data

### Common Issues

#### **1. Route Order**
**Problem**: Route khusus tidak berfungsi karena route generic menangkap request terlebih dahulu
**Solution**: Perbaiki route generic untuk mendukung semua type

#### **2. Function Mismatch**
**Problem**: Route memanggil function yang salah
**Solution**: Gunakan conditional logic untuk memanggil function yang tepat

#### **3. Duplicate Routes**
**Problem**: Ada multiple route yang sama
**Solution**: Hapus route yang tidak diperlukan

### Best Practices

#### **1. Route Organization**
```typescript
// Gunakan route generic dengan conditional logic
app.put('/master/:type/:id/extended', async (c) => {
  const type = c.req.param('type')
  
  if (type === 'lineup') {
    return await updateExtendedMasterData(c)
  } else if (type === 'generation') {
    return await updateGenerationData(c)
  } else {
    return await updateExtendedMasterDataWithSync(c)
  }
})
```

#### **2. Function Selection**
```typescript
// Pilih function berdasarkan type
const functionMap = {
  'lineup': updateExtendedMasterData,
  'generation': updateGenerationData,
  'group': updateGroupData,
  'default': updateExtendedMasterDataWithSync
}

const selectedFunction = functionMap[type] || functionMap.default
return await selectedFunction(c)
```

#### **3. Error Handling**
```typescript
app.put('/master/:type/:id/extended', async (c) => {
  try {
    // Authentication
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    // Type-specific logic
    const type = c.req.param('type')
    
    if (type === 'lineup') {
      return await updateExtendedMasterData(c)
    } else {
      return await updateExtendedMasterDataWithSync(c)
    }
  } catch (error) {
    console.error('Update extended master data route error:', error)
    return c.json({ 
      error: `Update extended master data error: ${error.message}`,
      details: error?.stack
    }, 500)
  }
})
```

### Alternative Solutions

#### **1. Route Prefix**
```typescript
// Gunakan prefix untuk membedakan route
app.put('/master/lineup/:id/extended', updateExtendedMasterData)
app.put('/master/sync/:type/:id/extended', updateExtendedMasterDataWithSync)
```

#### **2. Middleware**
```typescript
// Buat middleware untuk routing
const lineupMiddleware = async (c: Context, next: () => Promise<void>) => {
  const type = c.req.param('type')
  if (type === 'lineup') {
    return await updateExtendedMasterData(c)
  }
  await next()
}

app.put('/master/:type/:id/extended', lineupMiddleware, updateExtendedMasterDataWithSync)
```

#### **3. Route Handler Factory**
```typescript
// Buat factory untuk route handler
const createUpdateHandler = (useSync: boolean) => async (c: Context) => {
  if (useSync) {
    return await updateExtendedMasterDataWithSync(c)
  } else {
    return await updateExtendedMasterData(c)
  }
}

app.put('/master/lineup/:id/extended', createUpdateHandler(false))
app.put('/master/:type/:id/extended', createUpdateHandler(true))
```

### Monitoring

#### **1. Route Matching**
```typescript
// Log route matching untuk debug
app.put('/master/:type/:id/extended', async (c) => {
  const type = c.req.param('type')
  console.log(`Route matched: /master/${type}/:id/extended`)
  
  if (type === 'lineup') {
    console.log('Using updateExtendedMasterData for lineup')
    return await updateExtendedMasterData(c)
  } else {
    console.log('Using updateExtendedMasterDataWithSync for', type)
    return await updateExtendedMasterDataWithSync(c)
  }
})
```

#### **2. Function Call Tracking**
```typescript
// Track function calls
const functionCallTracker = {
  updateExtendedMasterData: 0,
  updateExtendedMasterDataWithSync: 0
}

// Di dalam route handler
if (type === 'lineup') {
  functionCallTracker.updateExtendedMasterData++
  return await updateExtendedMasterData(c)
} else {
  functionCallTracker.updateExtendedMasterDataWithSync++
  return await updateExtendedMasterDataWithSync(c)
}
```

#### **3. Error Tracking**
```typescript
// Track errors per type
const errorTracker = {
  lineup: 0,
  other: 0
}

try {
  // ... route logic ...
} catch (error) {
  if (type === 'lineup') {
    errorTracker.lineup++
  } else {
    errorTracker.other++
  }
  throw error
}
```

---

**Last Updated:** December 2024  
**Version:** 1.0.0  
**Maintainer:** Development Team
