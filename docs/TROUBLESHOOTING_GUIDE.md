# 🔧 Troubleshooting Guide - Common Issues

## 📋 **Daftar Masalah Umum**

### **1. Data Tidak Tampil Meskipun Ada di Database**

#### **🔍 Gejala:**
- Photobooks menampilkan "0 photobooks"
- Favorites menampilkan "0 favorites"
- Data ada di database tapi tidak muncul di frontend

#### **🛠️ Solusi:**
1. **Periksa Endpoint Duplikasi:**
   ```bash
   # Cari duplikasi endpoint di server
   grep -n "app\.get.*photobooks" supabase/functions/make-server-e0516fcf/index.ts
   grep -n "app\.get.*favorites" supabase/functions/make-server-e0516fcf/index.ts
   ```

2. **Periksa Endpoint Order:**
   - Hono menggunakan "first match wins"
   - Endpoint pertama yang match akan dipanggil
   - Pastikan endpoint public ada di urutan yang benar

3. **Test Endpoint Langsung:**
   ```bash
   # Test photobooks (public)
   curl -X GET "https://[project-id].supabase.co/functions/v1/make-server-e0516fcf/photobooks" \
     -H "Authorization: Bearer [anon_key]" \
     -H "Content-Type: application/json"
   
   # Test favorites (user auth required)
   curl -X GET "https://[project-id].supabase.co/functions/v1/make-server-e0516fcf/favorites" \
     -H "Authorization: Bearer [user_session_token]" \
     -H "Content-Type: application/json"
   ```

### **2. Authentication Errors**

#### **🔍 Gejala:**
- Error "Unauthorized" pada endpoint yang seharusnya public
- Error "Invalid JWT" pada endpoint yang memerlukan auth

#### **🛠️ Solusi:**
1. **Periksa Token Type:**
   ```typescript
   // Public endpoints - gunakan anon key
   const response = await fetch(url, {
     headers: {
       'Authorization': `Bearer ${anonKey}`,
       'Content-Type': 'application/json'
     }
   })
   
   // User endpoints - gunakan user session token
   const response = await fetch(url, {
     headers: {
       'Authorization': `Bearer ${userSessionToken}`,
       'Content-Type': 'application/json'
     }
   })
   ```

2. **Periksa Authentication Logic:**
   ```typescript
   // Pastikan endpoint public tidak ada auth check
   app.get('/public-endpoint', async (c) => {
     // Tidak ada authentication check
     return c.json(data)
   })
   
   // Pastikan endpoint protected ada auth check
   app.get('/protected-endpoint', async (c) => {
     const accessToken = c.req.header('Authorization')?.split(' ')[1]
     const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
     
     if (!user?.id || authError) {
       return c.json({ error: 'Unauthorized' }, 401)
     }
     // ... logic
   })
   ```

### **3. Endpoint URL Mismatch**

#### **🔍 Gejala:**
- Error 404 pada endpoint
- Endpoint tidak ditemukan
- Server ID berbeda antara frontend dan backend

#### **🛠️ Solusi:**
1. **Periksa Server ID:**
   ```bash
   # Cari server ID yang digunakan
   grep -r "make-server-" src/
   grep -r "make-server-" supabase/functions/
   ```

2. **Periksa Endpoint Path:**
   ```typescript
   // Pastikan path konsisten
   const url = `https://${projectId}.supabase.co/functions/v1/make-server-e0516fcf/endpoint`
   ```

3. **Deploy Function:**
   ```bash
   supabase functions deploy make-server-e0516fcf --project-ref [project-id]
   ```

### **4. KV Store Issues**

#### **🔍 Gejala:**
- Data tidak tersimpan di KV store
- Error saat mengakses KV store
- Data hilang setelah restart

#### **🛠️ Solusi:**
1. **Periksa KV Store Configuration:**
   ```typescript
   // Pastikan KV store di-initialize dengan benar
   const kv = new KVStore()
   await kv.initialize()
   ```

2. **Periksa Data Format:**
   ```typescript
   // Pastikan data di-serialize dengan benar
   await kv.set(`key_${id}`, JSON.stringify(data))
   
   // Pastikan data di-parse dengan benar
   const data = JSON.parse(await kv.get(`key_${id}`))
   ```

3. **Test KV Store:**
   ```bash
   # Test KV store endpoint
   curl -X GET "https://[project-id].supabase.co/functions/v1/make-server-e0516fcf/kv-store/get/key" \
     -H "Authorization: Bearer [token]" \
     -H "Content-Type: application/json"
   ```

## 🔍 **Debugging Tools**

### **1. Server Health Check:**
```bash
curl -X GET "https://[project-id].supabase.co/functions/v1/make-server-e0516fcf/health" \
  -H "Authorization: Bearer [anon_key]" \
  -H "Content-Type: application/json"
```

### **2. Endpoint Testing:**
```bash
# Test semua endpoint
curl -X GET "https://[project-id].supabase.co/functions/v1/make-server-e0516fcf/photobooks"
curl -X GET "https://[project-id].supabase.co/functions/v1/make-server-e0516fcf/favorites"
curl -X GET "https://[project-id].supabase.co/functions/v1/make-server-e0516fcf/movies"
```

### **3. Log Analysis:**
```bash
# Lihat logs Supabase
supabase functions logs make-server-e0516fcf --project-ref [project-id]
```

## 📚 **Best Practices**

### **1. Endpoint Design:**
- ✅ Gunakan path yang unik untuk setiap endpoint
- ✅ Gunakan naming convention yang konsisten
- ✅ Pisahkan endpoint public dan protected
- ✅ Dokumentasikan semua endpoint

### **2. Authentication Strategy:**
- ✅ Public endpoints: Tidak perlu authentication
- ✅ User endpoints: Memerlukan user session token
- ✅ Admin endpoints: Memerlukan admin authentication
- ✅ Test dengan token yang sesuai

### **3. Error Handling:**
- ✅ Return error code yang sesuai
- ✅ Provide clear error messages
- ✅ Log errors untuk debugging
- ✅ Handle edge cases

### **4. Testing:**
- ✅ Test semua endpoint dengan token yang sesuai
- ✅ Test error scenarios
- ✅ Test dengan data yang valid dan invalid
- ✅ Test performance dan scalability

## 🚨 **Emergency Procedures**

### **1. Rollback Function:**
```bash
# Rollback ke versi sebelumnya
supabase functions deploy make-server-e0516fcf --project-ref [project-id] --version [previous-version]
```

### **2. Clear Cache:**
```typescript
// Clear frontend cache
localStorage.clear()
sessionStorage.clear()

// Clear server cache (jika ada)
await kv.clear()
```

### **3. Restart Services:**
```bash
# Restart Supabase functions
supabase functions deploy make-server-e0516fcf --project-ref [project-id]
```

## 📞 **Support Resources**

### **1. Documentation:**
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Hono Framework](https://hono.dev/)
- [KV Store Documentation](https://supabase.com/docs/guides/functions/kv-store)

### **2. Community:**
- [Supabase Discord](https://discord.supabase.com/)
- [GitHub Issues](https://github.com/supabase/supabase/issues)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/supabase)

### **3. Monitoring:**
- [Supabase Dashboard](https://supabase.com/dashboard)
- [Function Logs](https://supabase.com/dashboard/project/[project-id]/functions)
- [Database Logs](https://supabase.com/dashboard/project/[project-id]/logs)

---

**Last Updated**: September 14, 2025
**Version**: 1.0.0
**Status**: ✅ Active
