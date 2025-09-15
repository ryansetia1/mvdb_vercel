# Lineup Frontend Update Function Fix

## Masalah: "masterDataApi.update is not a function"

### Gejala
- Server sudah berfungsi dengan benar (status 200)
- JSON payload berhasil dikirim ke server
- Tapi error di frontend: `TypeError: masterDataApi.update is not a function`
- Error terjadi di `LineupManagement.tsx:178`

### Root Cause

#### **Function Tidak Ada**
```typescript
// SALAH - function update tidak ada
await masterDataApi.update(actressId, updateData, accessToken)

// BENAR - gunakan updateExtended
await masterDataApi.updateExtended('actress', actressId, updateData, accessToken)
```

#### **Function yang Tersedia di masterDataApi**
```typescript
// Function yang tersedia:
- updateExtended(type, id, data, accessToken)  // Untuk update dengan type
- updateSeries(id, titleEn, titleJp, seriesLinks, accessToken)
- updateStudio(id, name, studioLinks, accessToken)
- updateLabel(id, name, labelLinks, accessToken)
- updateGroup(id, name, jpname, profilePicture, website, description, accessToken, gallery?)
- updateGeneration(id, name, groupId, groupName, accessToken, estimatedYears?, startDate?, endDate?, description?, profilePicture?)
- updateSimpleWithSync(type, id, name, accessToken)
- updateExtendedWithSync(type, id, data, accessToken)

// Function yang TIDAK ADA:
- update(id, data, accessToken)  // ❌ TIDAK ADA!
```

### Solusi yang Diterapkan

#### **Perbaiki Function Call di LineupManagement.tsx**
**File**: `src/components/LineupManagement.tsx`

**Sebelum:**
```typescript
// Line 178 - SALAH
await masterDataApi.update(actressId, updateData, accessToken)
```

**Sesudah:**
```typescript
// Line 178 - BENAR
await masterDataApi.updateExtended('actress', actressId, updateData, accessToken)
```

### Konteks Penggunaan

#### **Kode yang Diperbaiki**
```typescript
// Di handleSubmit function, setelah lineup berhasil dibuat/di-update
if (formData.selectedActresses && formData.selectedActresses.length > 0) {
  for (const actressId of formData.selectedActresses) {
    const updateData = {
      lineupData: {
        ...actress.lineupData,
        [createdLineup.id]: {
          alias: formData.actressAliases[actressId] || undefined,
          profilePicture: formData.actressProfilePictures[actressId] || undefined
        }
      }
    }
    // PERBAIKAN: gunakan updateExtended dengan type 'actress'
    await masterDataApi.updateExtended('actress', actressId, updateData, accessToken)
  }
}
```

#### **Tujuan Update**
- Update `lineupData` di actress yang dipilih
- Menambahkan alias dan profile picture khusus untuk lineup
- Membuat relasi antara actress dan lineup

### Testing

#### **1. Test dengan Frontend**
```javascript
// Di browser console
const testData = {
  lineupData: {
    'lineup-id': {
      alias: 'Test Alias',
      profilePicture: 'https://example.com/photo.jpg'
    }
  }
}

masterDataApi.updateExtended('actress', 'actress-id', testData, accessToken)
  .then(result => console.log('Success:', result))
  .catch(error => console.error('Error:', error))
```

#### **2. Test dengan curl**
```bash
curl -X PUT "https://duafhkktqobwwwwtygwn.supabase.co/functions/v1/make-server-e0516fcf/master/actress/actress-id/extended" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "lineupData": {
      "lineup-id": {
        "alias": "Test Alias",
        "profilePicture": "https://example.com/photo.jpg"
      }
    }
  }'
```

### Debug Information

#### **1. Server Logs yang Diharapkan**
```
Server: Updating extended actress with ID: {actressId}
Server: Actress update data: {updateData}
Server: Found actress to update: {existingItem}
Server: Successfully updated actress: {updatedItem}
```

#### **2. Network Request**
- **Method**: PUT
- **URL**: `/master/actress/{actressId}/extended`
- **Body**: JSON dengan lineupData
- **Response**: 200 OK dengan updated actress data

### Common Issues

#### **1. Function Not Found**
**Problem**: `masterDataApi.update is not a function`
**Solution**: Gunakan `masterDataApi.updateExtended` dengan type yang tepat

#### **2. Wrong Type Parameter**
**Problem**: `updateExtended` dengan type yang salah
**Solution**: Pastikan type parameter sesuai dengan data yang di-update

#### **3. Missing Parameters**
**Problem**: Parameter tidak lengkap untuk `updateExtended`
**Solution**: Pastikan semua parameter diperlukan ada

### Best Practices

#### **1. Function Selection**
```typescript
// Pilih function berdasarkan type data
const updateFunction = (type: string, id: string, data: any, accessToken: string) => {
  switch (type) {
    case 'actress':
      return masterDataApi.updateExtended('actress', id, data, accessToken)
    case 'actor':
      return masterDataApi.updateExtended('actor', id, data, accessToken)
    case 'lineup':
      return masterDataApi.updateExtended('lineup', id, data, accessToken)
    default:
      throw new Error(`Unknown type: ${type}`)
  }
}
```

#### **2. Error Handling**
```typescript
try {
  await masterDataApi.updateExtended('actress', actressId, updateData, accessToken)
  console.log('Actress updated successfully')
} catch (error) {
  console.error('Failed to update actress:', error)
  // Handle error appropriately
}
```

#### **3. Data Validation**
```typescript
// Validasi data sebelum update
if (!actressId || !updateData || !accessToken) {
  throw new Error('Missing required parameters')
}

if (!updateData.lineupData) {
  throw new Error('lineupData is required')
}
```

### Alternative Solutions

#### **1. Create Generic Update Function**
```typescript
// Tambahkan function generic ke masterDataApi
async update(type: string, id: string, data: any, accessToken: string) {
  return await this.updateExtended(type as any, id, data, accessToken)
}
```

#### **2. Use Type-Specific Functions**
```typescript
// Gunakan function khusus untuk setiap type
const updateActress = (id: string, data: any, accessToken: string) => {
  return masterDataApi.updateExtended('actress', id, data, accessToken)
}

const updateLineup = (id: string, data: any, accessToken: string) => {
  return masterDataApi.updateExtended('lineup', id, data, accessToken)
}
```

#### **3. Use updateExtendedWithSync**
```typescript
// Jika perlu sync functionality
await masterDataApi.updateExtendedWithSync('actress', actressId, updateData, accessToken)
```

### Monitoring

#### **1. Function Call Tracking**
```typescript
// Track function calls
const functionCallTracker = {
  updateExtended: 0,
  updateExtendedWithSync: 0
}

// Di dalam function
functionCallTracker.updateExtended++
await masterDataApi.updateExtended('actress', actressId, updateData, accessToken)
```

#### **2. Error Tracking**
```typescript
// Track errors per function
const errorTracker = {
  updateExtended: 0,
  updateExtendedWithSync: 0
}

try {
  await masterDataApi.updateExtended('actress', actressId, updateData, accessToken)
} catch (error) {
  errorTracker.updateExtended++
  throw error
}
```

#### **3. Performance Monitoring**
```typescript
// Monitor performance
const startTime = Date.now()
await masterDataApi.updateExtended('actress', actressId, updateData, accessToken)
const endTime = Date.now()
console.log(`Update took ${endTime - startTime}ms`)
```

---

**Last Updated:** December 2024  
**Version:** 1.0.0  
**Maintainer:** Development Team
