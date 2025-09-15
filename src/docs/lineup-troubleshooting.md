# Lineup Feature Troubleshooting

## Error: "Invalid type parameter: lineup"

### Gejala
```
GET https://duafhkktqobwwwwtygwn.supabase.co/functions/v1/make-server-e0516fcf/master/lineup 400 (Bad Request)

Error response: {"error":"Invalid type parameter: lineup. Valid types are: actor, actress, series, studio, type, tag, director, label, linklabel, group, generation"}
```

### Penyebab
Server-side API belum diupdate untuk mendukung type 'lineup' dalam validasi.

### Solusi
Update file server-side untuk menambahkan 'lineup' ke validTypes:

**File: `supabase/functions/make-server-e0516fcf/masterDataApi.ts`**
```typescript
// Sebelum
const validTypes = ['actor', 'actress', 'series', 'studio', 'type', 'tag', 'director', 'label', 'linklabel', 'group', 'generation']

// Sesudah
const validTypes = ['actor', 'actress', 'series', 'studio', 'type', 'tag', 'director', 'label', 'linklabel', 'group', 'generation', 'lineup']
```

**File: `src/supabase/functions/server/masterDataApi.tsx`**
```typescript
// Sebelum
const validTypes = ['actor', 'actress', 'series', 'studio', 'type', 'tag', 'director', 'label', 'linklabel', 'group', 'generation']

// Sesudah
const validTypes = ['actor', 'actress', 'series', 'studio', 'type', 'tag', 'director', 'label', 'linklabel', 'group', 'generation', 'lineup']
```

**File: `supabase/functions/make-server-e0516fcf/masterDataApi.ts` (validTypesWithSync)**
```typescript
// Sebelum
const validTypesWithSync = ['actor', 'actress', 'director', 'series', 'studio', 'label', 'group', 'generation']

// Sesudah
const validTypesWithSync = ['actor', 'actress', 'director', 'series', 'studio', 'label', 'group', 'generation', 'lineup']
```

**File: `src/supabase/functions/server/masterDataApi.tsx` (validTypesWithSync)**
```typescript
// Sebelum
const validTypesWithSync = ['actor', 'actress', 'director', 'series', 'studio', 'label', 'group', 'generation']

// Sesudah
const validTypesWithSync = ['actor', 'actress', 'director', 'series', 'studio', 'label', 'group', 'generation', 'lineup']
```

### Deploy Changes
Setelah mengupdate file server, deploy perubahan:

```bash
npx supabase functions deploy make-server-e0516fcf
```

### Verifikasi
Test API endpoint untuk memastikan tidak ada lagi error 400:

```bash
curl -X GET "https://duafhkktqobwwwwtygwn.supabase.co/functions/v1/make-server-e0516fcf/master/lineup" -H "Authorization: Bearer YOUR_TOKEN"
```

Expected response: `{"code":401,"message":"Invalid JWT"}` (bukan error 400)

## Error: "Gagal memuat lineup"

### Gejala
```
Error loading lineup data: Error: Failed to fetch master data: 400
```

### Penyebab
1. Server belum di-deploy dengan update type validation
2. Belum ada lineup yang dibuat (ini normal untuk pertama kali)

### Solusi
1. Pastikan server sudah di-deploy dengan update type validation (lihat solusi di atas)
2. Buat lineup pertama melalui UI:
   - Buka Generation Management
   - Pilih tab "Lineup Management"
   - Pilih generasi
   - Klik "Tambah Lineup"
   - Isi form dan simpan

## Error: "Lineup tidak muncul di Group Detail"

### Gejala
Lineup tidak ditampilkan di Group Detail meskipun sudah dibuat.

### Penyebab
1. Lineup tidak di-assign ke generasi yang benar
2. Aktris belum di-assign ke lineup
3. Data tidak ter-sync dengan benar

### Solusi
1. Pastikan lineup memiliki `generationId` yang benar
2. Assign aktris ke lineup melalui Lineup Management
3. Refresh halaman Group Detail
4. Check console untuk error

## Error: "Aktris tidak bisa di-assign ke Lineup"

### Gejala
Aktris tidak muncul di dropdown saat akan di-assign ke lineup.

### Penyebab
1. Aktris belum di-assign ke group yang sama dengan generasi
2. Aktris sudah di-assign ke lineup yang sama
3. Data aktris tidak ter-load dengan benar

### Solusi
1. Pastikan aktris sudah di-assign ke group yang sama dengan generasi lineup
2. Check apakah aktris sudah di-assign ke lineup yang sama
3. Refresh halaman dan coba lagi
4. Check console untuk error loading data

## Error: "Profile Picture tidak muncul di Lineup"

### Gejala
Foto profil tidak muncul di lineup display meskipun sudah di-set.

### Penyebab
1. URL foto tidak valid
2. Foto tidak accessible
3. Fallback system tidak berfungsi

### Solusi
1. Check URL foto di database
2. Pastikan foto accessible dari browser
3. Check fallback system:
   - Lineup-specific profile picture
   - Generation-specific profile picture
   - Group-specific profile picture
   - Default actress profile picture

## Error: "Alias tidak muncul di Lineup"

### Gejala
Alias tidak muncul di lineup display meskipun sudah di-set.

### Penyebab
1. Alias tidak tersimpan dengan benar
2. Fallback system tidak berfungsi
3. Data tidak ter-sync

### Solusi
1. Check alias di database
2. Pastikan alias tersimpan di `lineupData[lineupId].alias`
3. Check fallback system:
   - Lineup-specific alias
   - Generation-specific alias
   - Group-specific alias
   - Default actress alias
   - Actress name

## Debug Tips

### 1. Check Console Logs
```javascript
// Di browser console
console.log('Lineup data:', lineupData)
console.log('Actress lineup data:', actress.lineupData)
```

### 2. Check Network Requests
- Buka DevTools > Network
- Check request ke `/master/lineup`
- Pastikan response 200 (bukan 400)

### 3. Check Database
```sql
-- Check lineup data
SELECT * FROM master_data WHERE type = 'lineup';

-- Check actress lineup data
SELECT id, name, lineup_data FROM master_data WHERE type = 'actress' AND lineup_data IS NOT NULL;
```

### 4. Check Component State
```javascript
// Di React DevTools
// Check state di LineupManagement, LineupDisplay, dll.
```

## Common Issues dan Solutions

### 1. Data Tidak Ter-sync
**Problem**: Perubahan di UI tidak ter-reflect di database
**Solution**: Check network requests, pastikan API call berhasil

### 2. UI Tidak Update
**Problem**: Data berubah di database tapi UI tidak update
**Solution**: Refresh halaman atau check state management

### 3. Permission Issues
**Problem**: Error 401/403 saat akses API
**Solution**: Check authentication token dan permissions

### 4. Performance Issues
**Problem**: Loading lambat atau timeout
**Solution**: Check network, optimize queries, implement caching

## Best Practices

### 1. Error Handling
- Selalu handle error dengan try-catch
- Tampilkan error message yang user-friendly
- Log error untuk debugging

### 2. Data Validation
- Validate input sebelum submit
- Check data consistency
- Handle edge cases

### 3. User Experience
- Tampilkan loading state
- Berikan feedback untuk actions
- Handle empty states dengan baik

### 4. Performance
- Lazy load data
- Implement caching
- Optimize re-renders

---

**Last Updated:** December 2024  
**Version:** 1.0.0  
**Maintainer:** Development Team
