# Lineup Update Function Troubleshooting

## Error: "masterDataApi.update is not a function"

### Gejala
- Error saat menyimpan lineup dengan actresses yang dipilih
- `TypeError: masterDataApi.update is not a function` di LineupManagement.tsx
- Lineup tidak bisa di-update setelah dibuat

### Penyebab

#### 1. Function Update Tidak Ada
**Problem**: `masterDataApi.update` tidak ada, hanya ada `updateExtended`
```typescript
// SALAH - function update tidak ada
createdLineup = await masterDataApi.update(editingLineup.id, lineupData, accessToken)

// BENAR - gunakan updateExtended
createdLineup = await masterDataApi.updateExtended('lineup', editingLineup.id, lineupData, accessToken)
```

#### 2. Type Union Tidak Lengkap
**Problem**: `updateExtended` tidak mendukung type 'lineup'
```typescript
// SALAH - tidak ada 'lineup' di type union
async updateExtended(type: 'actor' | 'actress' | 'director' | 'series' | 'studio' | 'label' | 'group' | 'generation', id: string, data: Partial<MasterDataItem>, accessToken: string)

// BENAR - tambahkan 'lineup' ke type union
async updateExtended(type: 'actor' | 'actress' | 'director' | 'series' | 'studio' | 'label' | 'group' | 'generation' | 'lineup', id: string, data: Partial<MasterDataItem>, accessToken: string)
```

#### 3. Server Endpoint Tidak Ada
**Problem**: Server tidak mendukung endpoint `/master/lineup/{id}/extended`

### Solusi Lengkap

#### 1. Perbaiki Frontend API Call
**File**: `src/components/LineupManagement.tsx`

**Sebelum:**
```typescript
if (editingLineup) {
  // Update existing lineup
  createdLineup = await masterDataApi.update(editingLineup.id, lineupData, accessToken)
} else {
  // Create new lineup
  createdLineup = await masterDataApi.createExtended('lineup', lineupData, accessToken)
}
```

**Sesudah:**
```typescript
if (editingLineup) {
  // Update existing lineup
  createdLineup = await masterDataApi.updateExtended('lineup', editingLineup.id, lineupData, accessToken)
} else {
  // Create new lineup
  createdLineup = await masterDataApi.createExtended('lineup', lineupData, accessToken)
}
```

#### 2. Update Type Union di Frontend
**File**: `src/utils/masterDataApi.ts`

**Sebelum:**
```typescript
async updateExtended(type: 'actor' | 'actress' | 'director' | 'series' | 'studio' | 'label' | 'group' | 'generation', id: string, data: Partial<MasterDataItem>, accessToken: string)
```

**Sesudah:**
```typescript
async updateExtended(type: 'actor' | 'actress' | 'director' | 'series' | 'studio' | 'label' | 'group' | 'generation' | 'lineup', id: string, data: Partial<MasterDataItem>, accessToken: string)
```

#### 3. Tambahkan Server-side Support
**File**: `supabase/functions/make-server-e0516fcf/masterDataApi.ts`

**A. Update validTypes untuk extended update:**
```typescript
if (type === 'lineup') {
  return await updateLineupData(c)
}
```

**B. Tambahkan function updateLineupData:**
```typescript
export async function updateLineupData(c: Context) {
  try {
    const id = c.req.param('id')
    console.log('Server: Updating lineup data with ID:', id)
    
    const body = await c.req.json()
    const { name, generationId, generationName, lineupType, lineupOrder, description } = body
    console.log('Server: Lineup update data:', body)

    if (!name?.trim()) {
      return c.json({ error: 'Lineup name is required' }, 400)
    }

    if (!generationId?.trim()) {
      return c.json({ error: 'Generation ID is required' }, 400)
    }

    // Get existing item
    const existingData = await kv.get(`master_lineup_${id}`)
    if (!existingData) {
      console.log(`Server: Lineup with ID ${id} not found`)
      return c.json({ error: 'Lineup not found' }, 404)
    }

    const existingItem = JSON.parse(existingData)
    console.log('Server: Found lineup to update:', existingItem)

    // Check if lineup name already exists within the same generation (excluding current lineup)
    const allLineups = await kv.getByPrefix(`master_lineup_`)
    const duplicateLineup = allLineups.find(item => {
      const lineup = item.value
      return lineup.name?.toLowerCase() === name.toLowerCase() && 
             lineup.generationId === generationId &&
             lineup.id !== id
    })

    if (duplicateLineup) {
      console.log(`Server: Lineup "${name}" already exists in generation "${generationId}"`)
      return c.json({ error: `Lineup "${name}" already exists in this generation` }, 400)
    }

    // Update the item
    const updatedItem: MasterDataItem = {
      ...existingItem,
      name: name.trim(),
      generationId: generationId.trim(),
      generationName: generationName?.trim() || undefined,
      lineupType: lineupType?.trim() || 'Main',
      lineupOrder: lineupOrder || 1,
      description: description?.trim() || undefined,
      updatedAt: new Date().toISOString()
    }

    console.log(`Server: Saving updated lineup with ID: ${id}`)
    await kv.set(`master_lineup_${id}`, JSON.stringify(updatedItem))
    
    console.log('Server: Successfully updated lineup:', updatedItem)
    return c.json({ data: updatedItem })
  } catch (error) {
    console.error('Server: Update lineup data error:', error)
    return c.json({ 
      error: `Failed to update lineup data: ${error.message}`,
      details: error?.stack
    }, 500)
  }
}
```

#### 4. Deploy Server Changes
```bash
npx supabase functions deploy make-server-e0516fcf
```

### Testing

#### 1. Test Update Function
```javascript
// Di browser console
console.log('Testing update function...')

// Test dengan lineup yang valid
const lineupData = {
  name: 'Updated Lineup',
  lineupType: 'Main',
  lineupOrder: 1,
  description: 'Updated description'
}

masterDataApi.updateExtended('lineup', 'lineup-id', lineupData, accessToken)
  .then(result => console.log('Success:', result))
  .catch(error => console.error('Error:', error))
```

#### 2. Test API Endpoint
```bash
curl -X PUT "https://duafhkktqobwwwwtygwn.supabase.co/functions/v1/make-server-e0516fcf/master/lineup/lineup-id/extended" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Lineup",
    "generationId": "generation-uuid",
    "generationName": "1st Generation",
    "lineupType": "Main",
    "lineupOrder": 1,
    "description": "Updated description"
  }'
```

#### 3. Test Frontend Integration
```typescript
// Test di browser console
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

### Common Issues

#### 1. Function Not Found
**Problem**: `masterDataApi.update is not a function`
**Solution**: Gunakan `masterDataApi.updateExtended` instead

#### 2. Type Error
**Problem**: Type 'lineup' tidak didukung
**Solution**: Tambahkan 'lineup' ke type union di `updateExtended`

#### 3. Server Error
**Problem**: 404 atau 400 error dari server
**Solution**: Pastikan server sudah di-deploy dengan `updateLineupData` function

#### 4. Data Validation Error
**Problem**: Server menolak data yang dikirim
**Solution**: Pastikan semua field required ada dan valid

### Debug Tips

#### 1. Check Function Existence
```javascript
// Di browser console
console.log('Available functions:', Object.keys(masterDataApi))
console.log('updateExtended exists:', typeof masterDataApi.updateExtended === 'function')
```

#### 2. Check Network Requests
```javascript
// Di browser DevTools > Network
// Check request ke /master/lineup/{id}/extended
// Pastikan method PUT dan body JSON valid
```

#### 3. Check Server Logs
```bash
# Di Supabase Dashboard > Functions > Logs
# Cari log dari updateLineupData function
```

### Best Practices

#### 1. Function Naming
```typescript
// Gunakan nama function yang konsisten
masterDataApi.createExtended('lineup', data, token)
masterDataApi.updateExtended('lineup', id, data, token)
masterDataApi.delete('lineup', id, token)
```

#### 2. Error Handling
```typescript
try {
  const result = await masterDataApi.updateExtended('lineup', id, data, token)
  console.log('Update successful:', result)
} catch (error) {
  console.error('Update failed:', error)
  setError('Gagal mengupdate lineup')
}
```

#### 3. Data Validation
```typescript
// Validasi data sebelum kirim
if (!data.name || !data.generationId) {
  setError('Data lineup tidak lengkap')
  return
}
```

### Alternative Solutions

#### 1. Generic Update Function
```typescript
// Buat function update yang generic
async update(type: string, id: string, data: any, token: string) {
  return await this.updateExtended(type as any, id, data, token)
}
```

#### 2. Type-safe Functions
```typescript
// Buat function khusus untuk setiap type
async updateLineup(id: string, data: Partial<MasterDataItem>, token: string) {
  return await this.updateExtended('lineup', id, data, token)
}
```

#### 3. Error Recovery
```typescript
// Fallback jika update gagal
try {
  return await masterDataApi.updateExtended('lineup', id, data, token)
} catch (error) {
  console.error('Update failed, trying alternative:', error)
  // Try alternative approach
}
```

---

**Last Updated:** December 2024  
**Version:** 1.0.0  
**Maintainer:** Development Team
