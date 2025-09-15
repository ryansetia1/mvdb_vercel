# Lineup Invalid Type Parameter Troubleshooting

## Error: "Invalid type parameter" untuk Lineup Update

### Gejala
- Error saat update lineup: `PUT .../master/lineup/{id}/extended 400 (Bad Request)`
- Server response: `{error: 'Invalid type parameter'}`
- Lineup tidak bisa di-update meskipun sudah ada function `updateLineupData`

### Penyebab

#### 1. Validasi Type Tidak Lengkap
**Problem**: Server validasi masih menggunakan array yang tidak termasuk 'lineup'
```typescript
// SALAH - tidak ada 'lineup' di validTypes
if (!type || !['actor', 'actress', 'director'].includes(type)) {
  console.log(`Server: Invalid type for extended update: ${type}`)
  return c.json({ error: 'Invalid type parameter' }, 400)
}
```

#### 2. Logic Flow Tidak Benar
**Problem**: Validasi dilakukan setelah check untuk 'lineup', tapi array validTypes tidak diupdate

### Solusi Lengkap

#### 1. Perbaiki Validasi Type di Server
**File**: `supabase/functions/make-server-e0516fcf/masterDataApi.ts`

**Sebelum:**
```typescript
if (type === 'lineup') {
  return await updateLineupData(c)
}

if (!type || !['actor', 'actress', 'director'].includes(type)) {
  console.log(`Server: Invalid type for extended update: ${type}`)
  return c.json({ error: 'Invalid type parameter' }, 400)
}
```

**Sesudah:**
```typescript
if (type === 'lineup') {
  return await updateLineupData(c)
}

if (!type || !['actor', 'actress', 'director', 'lineup'].includes(type)) {
  console.log(`Server: Invalid type for extended update: ${type}`)
  return c.json({ error: 'Invalid type parameter' }, 400)
}
```

#### 2. Update File Server yang Lain
**File**: `src/supabase/functions/server/masterDataApi.tsx`

**Sebelum:**
```typescript
if (!type || !['actor', 'actress', 'director'].includes(type)) {
  console.log(`Server: Invalid type for extended update: ${type}`)
  return c.json({ error: 'Invalid type parameter' }, 400)
}
```

**Sesudah:**
```typescript
if (!type || !['actor', 'actress', 'director', 'lineup'].includes(type)) {
  console.log(`Server: Invalid type for extended update: ${type}`)
  return c.json({ error: 'Invalid type parameter' }, 400)
}
```

#### 3. Deploy Server Changes
```bash
npx supabase functions deploy make-server-e0516fcf
```

### Testing

#### 1. Test API Endpoint
```bash
# Test dengan curl (ganti YOUR_TOKEN dengan token yang valid)
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

#### 2. Test Frontend Integration
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

#### 3. Test dengan Data yang Valid
```javascript
// Test dengan lineup yang sudah ada
const existingLineup = {
  id: '515686d2-cbef-4519-b736-b02889be2e85',
  name: 'Updated Lineup Name',
  generationId: 'existing-generation-id',
  generationName: '1st Generation',
  lineupType: 'Main',
  lineupOrder: 1,
  description: 'Updated description'
}

masterDataApi.updateExtended('lineup', existingLineup.id, existingLineup, accessToken)
  .then(result => console.log('Update successful:', result))
  .catch(error => console.error('Update failed:', error))
```

### Debug Steps

#### 1. Check Server Logs
```bash
# Di Supabase Dashboard > Functions > Logs
# Cari log dari updateExtendedMasterData function
# Pastikan tidak ada "Invalid type for extended update: lineup"
```

#### 2. Check Network Request
```javascript
// Di browser DevTools > Network
// Check request ke /master/lineup/{id}/extended
// Pastikan method PUT dan body JSON valid
```

#### 3. Check Function Flow
```typescript
// Di server logs, pastikan flow:
// 1. Server: Updating extended lineup with ID: {id}
// 2. Server: Lineup update data: {data}
// 3. Server: Found lineup to update: {existingItem}
// 4. Server: Successfully updated lineup: {updatedItem}
```

### Common Issues

#### 1. Server Not Deployed
**Problem**: Perubahan belum di-deploy ke server
**Solution**: Deploy server dengan `npx supabase functions deploy make-server-e0516fcf`

#### 2. Cache Issue
**Problem**: Browser atau server cache masih menggunakan versi lama
**Solution**: Hard refresh browser atau restart server

#### 3. Type Mismatch
**Problem**: Type yang dikirim tidak sesuai dengan yang diharapkan
**Solution**: Pastikan type 'lineup' dikirim dengan benar

#### 4. Function Not Found
**Problem**: Function `updateLineupData` tidak ada
**Solution**: Pastikan function sudah dibuat dan di-export

### Best Practices

#### 1. Consistent Type Validation
```typescript
// Gunakan array yang konsisten untuk semua validasi
const validTypes = ['actor', 'actress', 'director', 'lineup']
if (!validTypes.includes(type)) {
  return c.json({ error: 'Invalid type parameter' }, 400)
}
```

#### 2. Error Logging
```typescript
// Log error dengan detail
console.log(`Server: Invalid type for extended update: ${type}`)
console.log(`Server: Valid types: ${validTypes.join(', ')}`)
```

#### 3. Type Safety
```typescript
// Gunakan type assertion yang aman
const validTypes: string[] = ['actor', 'actress', 'director', 'lineup']
if (!validTypes.includes(type)) {
  // Handle error
}
```

### Alternative Solutions

#### 1. Dynamic Type Validation
```typescript
// Buat validasi yang dinamis
const getValidTypes = () => ['actor', 'actress', 'director', 'lineup']
if (!getValidTypes().includes(type)) {
  return c.json({ error: 'Invalid type parameter' }, 400)
}
```

#### 2. Type Enum
```typescript
// Gunakan enum untuk type
enum MasterDataType {
  ACTOR = 'actor',
  ACTRESS = 'actress',
  DIRECTOR = 'director',
  LINEUP = 'lineup'
}

if (!Object.values(MasterDataType).includes(type as MasterDataType)) {
  return c.json({ error: 'Invalid type parameter' }, 400)
}
```

#### 3. Configuration-based Validation
```typescript
// Gunakan konfigurasi untuk validasi
const typeConfig = {
  actor: { hasExtended: true },
  actress: { hasExtended: true },
  director: { hasExtended: true },
  lineup: { hasExtended: true }
}

if (!typeConfig[type]?.hasExtended) {
  return c.json({ error: 'Invalid type parameter' }, 400)
}
```

### Monitoring

#### 1. Server Logs
```bash
# Monitor server logs untuk error
# Cari pattern: "Invalid type for extended update"
```

#### 2. Error Tracking
```javascript
// Track error di frontend
catch (error) {
  console.error('Update lineup failed:', {
    error: error.message,
    type: 'lineup',
    id: lineupId,
    data: updateData
  })
}
```

#### 3. Health Check
```bash
# Buat health check untuk endpoint
curl -X GET "https://duafhkktqobwwwwtygwn.supabase.co/functions/v1/make-server-e0516fcf/health"
```

---

**Last Updated:** December 2024  
**Version:** 1.0.0  
**Maintainer:** Development Team
