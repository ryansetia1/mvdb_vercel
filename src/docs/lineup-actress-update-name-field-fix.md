# Lineup Actress Update Name Field Fix

## Masalah: "Name is required" untuk Actress Update

### Gejala
- Error saat update actress: `PUT .../master/actress/{id}/extended 400 (Bad Request)`
- Server response: `{error: 'Name is required'}`
- JSON payload hanya berisi `lineupData` dan `profilePicture`
- Field `name` tidak dikirim ke server

### Root Cause

#### **Server Validation**
```typescript
// Di updateExtendedMasterData function (line 919-922)
if (!name?.trim()) {
  console.log('Server: Name validation failed - name is required')
  return c.json({ error: 'Name is required' }, 400)
}
```

**Masalah**: Server memvalidasi bahwa field `name` harus ada untuk update actress, tapi frontend hanya mengirim `lineupData`.

#### **Frontend Payload**
```typescript
// SALAH - tidak ada field name
const updateData: Partial<MasterDataItem> = {
  lineupData: {
    ...actress.lineupData,
    [createdLineup.id]: {
      alias: formData.actressAliases[actressId] || undefined,
      profilePicture: formData.actressProfilePictures[actressId] || undefined
    }
  }
}
```

### Solusi yang Diterapkan

#### **Tambahkan Field Name yang Required**
```typescript
// BENAR - tambahkan field name
const updateData: Partial<MasterDataItem> = {
  name: actress.name, // Required field for update
  lineupData: {
    ...actress.lineupData,
    [createdLineup.id]: {
      alias: formData.actressAliases[actressId] || undefined,
      profilePicture: formData.actressProfilePictures[actressId] || undefined
    }
  }
}
```

### Konteks Penggunaan

#### **Kode yang Diperbaiki**
```typescript
// Di handleSubmit function, setelah lineup berhasil dibuat/di-update
if (formData.selectedActresses && formData.selectedActresses.length > 0 && createdLineup) {
  for (const actressId of formData.selectedActresses) {
    const actress = actresses?.find(a => a.id === actressId)
    if (actress) {
      const updateData: Partial<MasterDataItem> = {
        name: actress.name, // Required field for update
        lineupData: {
          ...actress.lineupData,
          [createdLineup.id]: {
            alias: formData.actressAliases[actressId] || undefined,
            profilePicture: formData.actressProfilePictures[actressId] || undefined
          }
        }
      }
      await masterDataApi.updateExtended('actress', actressId, updateData, accessToken)
    }
  }
}
```

#### **Tujuan Update**
- Update `lineupData` di actress yang dipilih
- Menambahkan alias dan profile picture khusus untuk lineup
- Membuat relasi antara actress dan lineup
- **Mempertahankan field `name` yang required**

### Testing

#### **1. Test dengan Frontend**
```javascript
// Di browser console
const testData = {
  name: 'Tsukasa Aoi', // Required field
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
    "name": "Tsukasa Aoi",
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
- **Body**: JSON dengan `name` dan `lineupData`
- **Response**: 200 OK dengan updated actress data

### Common Issues

#### **1. Missing Required Fields**
**Problem**: Server memvalidasi field required tapi frontend tidak mengirim
**Solution**: Pastikan semua field required dikirim dalam update request

#### **2. Field Validation**
**Problem**: Server validasi gagal karena field kosong atau null
**Solution**: Pastikan field required memiliki nilai yang valid

#### **3. Data Integrity**
**Problem**: Update hanya sebagian field bisa merusak data integrity
**Solution**: Selalu kirim field required meskipun tidak berubah

### Best Practices

#### **1. Required Field Handling**
```typescript
// Selalu kirim field required untuk update
const updateData: Partial<MasterDataItem> = {
  name: actress.name, // Required field
  lineupData: {
    ...actress.lineupData,
    [createdLineup.id]: {
      alias: formData.actressAliases[actressId] || undefined,
      profilePicture: formData.actressProfilePictures[actressId] || undefined
    }
  }
}
```

#### **2. Data Validation**
```typescript
// Validasi data sebelum update
if (!actress.name || !actress.name.trim()) {
  throw new Error('Actress name is required')
}

if (!actressId || !updateData || !accessToken) {
  throw new Error('Missing required parameters')
}
```

#### **3. Error Handling**
```typescript
try {
  await masterDataApi.updateExtended('actress', actressId, updateData, accessToken)
  console.log('Actress updated successfully')
} catch (error) {
  console.error('Failed to update actress:', error)
  // Handle error appropriately
}
```

### Alternative Solutions

#### **1. Server-Side Validation**
```typescript
// Perbaiki server validation untuk partial update
if (type === 'actress' && !name?.trim()) {
  // Untuk actress, cek apakah name ada di existing data
  const existingData = await kv.get(`master_actress_${id}`)
  if (!existingData) {
    return c.json({ error: 'Name is required' }, 400)
  }
  const existingItem = JSON.parse(existingData)
  if (!existingItem.name) {
    return c.json({ error: 'Name is required' }, 400)
  }
}
```

#### **2. Frontend Data Preparation**
```typescript
// Siapkan data lengkap sebelum update
const prepareUpdateData = (actress: MasterDataItem, lineupData: any) => {
  return {
    name: actress.name, // Required
    jpname: actress.jpname,
    kanjiName: actress.kanjiName,
    kanaName: actress.kanaName,
    birthdate: actress.birthdate,
    alias: actress.alias,
    links: actress.links,
    takulinks: actress.takulinks,
    tags: actress.tags,
    photo: actress.photo,
    profilePicture: actress.profilePicture,
    groupId: actress.groupId,
    selectedGroups: actress.selectedGroups,
    generationData: actress.generationData,
    lineupData: lineupData // New data
  }
}
```

#### **3. Use updateExtendedWithSync**
```typescript
// Jika perlu sync functionality
await masterDataApi.updateExtendedWithSync('actress', actressId, updateData, accessToken)
```

### Monitoring

#### **1. Field Validation Tracking**
```typescript
// Track field validation errors
const validationTracker = {
  missingName: 0,
  missingRequiredFields: 0
}

try {
  await masterDataApi.updateExtended('actress', actressId, updateData, accessToken)
} catch (error) {
  if (error.message.includes('Name is required')) {
    validationTracker.missingName++
  } else if (error.message.includes('required')) {
    validationTracker.missingRequiredFields++
  }
  throw error
}
```

#### **2. Update Success Tracking**
```typescript
// Track successful updates
const updateTracker = {
  actressUpdates: 0,
  lineupAssignments: 0
}

await masterDataApi.updateExtended('actress', actressId, updateData, accessToken)
updateTracker.actressUpdates++
updateTracker.lineupAssignments++
```

#### **3. Performance Monitoring**
```typescript
// Monitor performance
const startTime = Date.now()
await masterDataApi.updateExtended('actress', actressId, updateData, accessToken)
const endTime = Date.now()
console.log(`Actress update took ${endTime - startTime}ms`)
```

---

**Last Updated:** December 2024  
**Version:** 1.0.0  
**Maintainer:** Development Team
