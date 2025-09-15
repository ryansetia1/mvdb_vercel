# Lineup API Troubleshooting

## Error: "POST [object%20Object] 401 (Unauthorized)"

### Gejala
```
POST https://duafhkktqobwwwwtygwn.supabase.co/functions/v1/make-server-e0516fcf/master/[object%20Object] 401 (Unauthorized)

Frontend API: Response status for create [object Object]: 401
Frontend API: Error creating [object Object]: {code: 401, message: 'Invalid JWT'}
```

### Penyebab
1. **URL malformed**: `[object%20Object]` menunjukkan parameter yang dikirim tidak benar
2. **Function call salah**: Menggunakan `masterDataApi.create()` dengan parameter yang salah
3. **Server endpoint tidak ada**: Server belum mendukung endpoint `/master/lineup/extended`

### Solusi

#### 1. Perbaiki Function Call di Frontend

**Sebelum (LineupManagement.tsx):**
```tsx
// SALAH - create() membutuhkan type sebagai parameter pertama
await masterDataApi.create(lineupData, accessToken)
```

**Sesudah (LineupManagement.tsx):**
```tsx
// BENAR - gunakan createExtended() dengan type 'lineup'
await masterDataApi.createExtended('lineup', lineupData, accessToken)
```

#### 2. Update Type Union di Frontend

**File: `src/utils/masterDataApi.ts`**
```typescript
// Sebelum
async createExtended(type: 'actor' | 'actress' | 'director' | 'series' | 'studio' | 'label' | 'group' | 'generation', data: Partial<MasterDataItem>, accessToken: string)

// Sesudah
async createExtended(type: 'actor' | 'actress' | 'director' | 'series' | 'studio' | 'label' | 'group' | 'generation' | 'lineup', data: Partial<MasterDataItem>, accessToken: string)
```

#### 3. Tambahkan Server-side Support

**File: `supabase/functions/make-server-e0516fcf/masterDataApi.ts`**

**A. Update validTypes untuk extended creation:**
```typescript
if (type === 'lineup') {
  return await createLineupData(c)
}
```

**B. Tambahkan function createLineupData:**
```typescript
export async function createLineupData(c: Context) {
  try {
    console.log('Server: Creating lineup data')
    const body = await c.req.json()
    const { name, generationId, generationName, lineupType, lineupOrder, description } = body
    console.log('Server: Lineup data:', body)

    if (!name?.trim()) {
      return c.json({ error: 'Lineup name is required' }, 400)
    }

    if (!generationId?.trim()) {
      return c.json({ error: 'Generation ID is required' }, 400)
    }

    // Check if lineup already exists within the same generation
    const existingData = await kv.getByPrefix(`master_lineup_`)
    const existingItem = existingData.find(item => {
      const lineup = item.value
      return lineup.name?.toLowerCase() === name.toLowerCase() && 
             lineup.generationId === generationId
    })

    if (existingItem) {
      return c.json({ error: `Lineup "${name}" already exists in this generation` }, 400)
    }

    const id = crypto.randomUUID()
    const newItem: MasterDataItem = {
      id,
      name: name.trim(),
      type: 'lineup',
      createdAt: new Date().toISOString(),
      generationId: generationId.trim(),
      generationName: generationName?.trim() || undefined,
      lineupType: lineupType?.trim() || 'Main',
      lineupOrder: lineupOrder || 1,
      description: description?.trim() || undefined
    }

    await kv.set(`master_lineup_${id}`, JSON.stringify(newItem))
    return c.json({ data: newItem })
  } catch (error) {
    console.error('Server: Create lineup data error:', error)
    return c.json({ 
      error: `Failed to create lineup data: ${error.message}`,
      details: error?.stack
    }, 500)
  }
}
```

#### 4. Deploy Server Changes

```bash
npx supabase functions deploy make-server-e0516fcf
```

### Implementasi Lengkap

#### Frontend (LineupManagement.tsx)
```tsx
const handleSubmit = async () => {
  try {
    setLoading(true)
    
    const lineupData: Partial<MasterDataItem> = {
      name: formData.name,
      type: 'lineup',
      generationId: generationId,
      generationName: generationName,
      lineupType: formData.lineupType,
      lineupOrder: formData.lineupOrder,
      description: formData.description
    }

    if (editingLineup) {
      // Update existing lineup
      await masterDataApi.update(editingLineup.id, lineupData, accessToken)
    } else {
      // Create new lineup - GUNAKAN createExtended
      await masterDataApi.createExtended('lineup', lineupData, accessToken)
    }

    // Reset form and reload data
    setFormData({
      name: '',
      lineupType: 'Main',
      lineupOrder: 1,
      description: ''
    })
    setShowForm(false)
    setEditingLineup(null)
    await loadData()

  } catch (err) {
    console.error('Error saving lineup:', err)
    setError('Gagal menyimpan lineup')
  } finally {
    setLoading(false)
  }
}
```

#### Server (masterDataApi.ts)
```typescript
// Di createExtendedMasterData function
if (type === 'lineup') {
  return await createLineupData(c)
}

// Function createLineupData
export async function createLineupData(c: Context) {
  // Implementation seperti di atas
}
```

### Testing

#### 1. Test API Endpoint
```bash
curl -X POST "https://duafhkktqobwwwwtygwn.supabase.co/functions/v1/make-server-e0516fcf/master/lineup/extended" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Lineup",
    "generationId": "generation-uuid",
    "generationName": "1st Generation",
    "lineupType": "Main",
    "lineupOrder": 1,
    "description": "Test lineup description"
  }'
```

#### 2. Test Frontend Integration
```tsx
// Test di browser console
const testData = {
  name: 'Test Lineup',
  generationId: 'test-generation-id',
  generationName: 'Test Generation',
  lineupType: 'Main',
  lineupOrder: 1,
  description: 'Test description'
}

masterDataApi.createExtended('lineup', testData, accessToken)
  .then(result => console.log('Success:', result))
  .catch(error => console.error('Error:', error))
```

### Common Issues

#### 1. URL Malformed
**Problem**: `[object%20Object]` di URL
**Solution**: Pastikan menggunakan `createExtended('lineup', data, token)` bukan `create(data, token)`

#### 2. 401 Unauthorized
**Problem**: Token tidak valid
**Solution**: Check authentication dan pastikan token masih valid

#### 3. 400 Bad Request
**Problem**: Data tidak valid atau endpoint tidak ada
**Solution**: Check server deployment dan data validation

#### 4. 500 Internal Server Error
**Problem**: Server error
**Solution**: Check server logs dan pastikan function createLineupData ada

### Debug Tips

#### 1. Check Network Requests
```javascript
// Di browser DevTools > Network
// Check request ke /master/lineup/extended
// Pastikan method POST dan body JSON valid
```

#### 2. Check Server Logs
```bash
# Di Supabase Dashboard > Functions > Logs
# Cari log dari createLineupData function
```

#### 3. Check Data Format
```typescript
// Pastikan data yang dikirim sesuai dengan interface
const lineupData: Partial<MasterDataItem> = {
  name: string,           // Required
  type: 'lineup',        // Required
  generationId: string,   // Required
  generationName: string,  // Optional
  lineupType: string,     // Optional, default 'Main'
  lineupOrder: number,    // Optional, default 1
  description: string    // Optional
}
```

### Best Practices

#### 1. Error Handling
```tsx
try {
  await masterDataApi.createExtended('lineup', lineupData, accessToken)
  // Success handling
} catch (error) {
  console.error('Error creating lineup:', error)
  setError('Gagal menyimpan lineup')
}
```

#### 2. Data Validation
```tsx
if (!formData.name.trim()) {
  setError('Nama lineup harus diisi')
  return
}

if (!generationId) {
  setError('Generation ID tidak valid')
  return
}
```

#### 3. User Feedback
```tsx
// Loading state
setLoading(true)

// Success feedback
toast.success('Lineup berhasil dibuat')

// Error feedback
setError('Gagal menyimpan lineup')
```

---

**Last Updated:** December 2024  
**Version:** 1.0.0  
**Maintainer:** Development Team
