# ⚡ Quick Reference - Endpoint Management

## 🚨 **Emergency Fixes**

### **Endpoint Duplication Issue**

**Problem**: Data tidak tampil meskipun ada di database
**Cause**: Duplikasi endpoint path di server
**Solution**: Pisahkan endpoint stats ke path yang berbeda

```bash
# Quick fix untuk photobooks
sed -i 's|app\.get.*photobooks.*stats|app.get.*stats/photobooks|g' supabase/functions/make-server-e0516fcf/index.ts

# Quick fix untuk favorites  
sed -i 's|app\.get.*favorites.*stats|app.get.*stats/favorites|g' supabase/functions/make-server-e0516fcf/index.ts

# Deploy
supabase functions deploy make-server-e0516fcf --project-ref [project-id]
```

## 🔧 **Common Commands**

### **Deploy Function**
```bash
supabase functions deploy make-server-e0516fcf --project-ref [project-id]
```

### **Test Endpoints**
```bash
# Health check
curl -X GET "https://[project-id].supabase.co/functions/v1/make-server-e0516fcf/health" \
  -H "Authorization: Bearer [anon_key]"

# Photobooks (public)
curl -X GET "https://[project-id].supabase.co/functions/v1/make-server-e0516fcf/photobooks" \
  -H "Authorization: Bearer [anon_key]"

# Favorites (user auth required)
curl -X GET "https://[project-id].supabase.co/functions/v1/make-server-e0516fcf/favorites" \
  -H "Authorization: Bearer [user_token]"
```

### **Check Logs**
```bash
supabase functions logs make-server-e0516fcf --project-ref [project-id]
```

## 📋 **Endpoint Checklist**

### **Before Adding New Endpoint**

- [ ] Path unik dan tidak duplikasi
- [ ] Naming convention sudah benar
- [ ] Authentication strategy sudah tepat
- [ ] Error handling sudah lengkap
- [ ] Documentation sudah ditulis

### **Before Deploy**

- [ ] Semua endpoint sudah ditest
- [ ] Tidak ada duplikasi path
- [ ] Authentication bekerja dengan benar
- [ ] Error handling sudah lengkap
- [ ] Performance acceptable

## 🏗️ **Endpoint Patterns**

### **Public Endpoint**
```typescript
app.get('/make-server-e0516fcf/public-endpoint', async (c) => {
  try {
    const data = await getPublicData()
    return c.json(data)
  } catch (error) {
    return c.json({ error: 'Failed to fetch data' }, 500)
  }
})
```

### **User Endpoint**
```typescript
app.get('/make-server-e0516fcf/user-endpoint', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const data = await getUserData(user.id)
    return c.json(data)
  } catch (error) {
    return c.json({ error: 'Failed to fetch data' }, 500)
  }
})
```

### **Admin Endpoint**
```typescript
app.get('/make-server-e0516fcf/admin-endpoint', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403)
    }

    const data = await getAdminData()
    return c.json(data)
  } catch (error) {
    return c.json({ error: 'Failed to fetch data' }, 500)
  }
})
```

### **Stats Endpoint**
```typescript
app.get('/make-server-e0516fcf/stats/endpoint', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      return c.json({ error: 'Unauthorized - admin access required' }, 401)
    }

    const data = await getStatsData()
    return c.json(data)
  } catch (error) {
    return c.json({ error: 'Failed to fetch stats' }, 500)
  }
})
```

## 🔍 **Debugging Commands**

### **Check Endpoint Duplication**
```bash
# Cari duplikasi endpoint
grep -n "app\.get.*photobooks" supabase/functions/make-server-e0516fcf/index.ts
grep -n "app\.get.*favorites" supabase/functions/make-server-e0516fcf/index.ts
```

### **Check Server ID**
```bash
# Cari server ID yang digunakan
grep -r "make-server-" src/
grep -r "make-server-" supabase/functions/
```

### **Test Authentication**
```bash
# Test dengan anon key
curl -X GET "https://[project-id].supabase.co/functions/v1/make-server-e0516fcf/endpoint" \
  -H "Authorization: Bearer [anon_key]"

# Test dengan user token
curl -X GET "https://[project-id].supabase.co/functions/v1/make-server-e0516fcf/endpoint" \
  -H "Authorization: Bearer [user_token]"
```

## 📚 **Quick Links**

### **Documentation**
- [Endpoint Duplication Fix](./ENDPOINT_DUPLICATION_FIX.md)
- [Troubleshooting Guide](./TROUBLESHOOTING_GUIDE.md)
- [Development Guidelines](./DEVELOPMENT_GUIDELINES.md)

### **External Resources**
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Hono Framework](https://hono.dev/)
- [Supabase Dashboard](https://supabase.com/dashboard)

### **Project Files**
- `supabase/functions/make-server-e0516fcf/index.ts` - Main server file
- `src/utils/photobookApi.ts` - Photobook API client
- `src/utils/favoritesApi.ts` - Favorites API client
- `src/components/content/PhotobooksContent.tsx` - Photobooks component
- `src/components/content/FavoritesContent.tsx` - Favorites component

## 🚨 **Emergency Contacts**

### **When Things Go Wrong**
1. **Check logs**: `supabase functions logs make-server-e0516fcf --project-ref [project-id]`
2. **Test endpoints**: Use curl commands above
3. **Rollback**: `supabase functions deploy make-server-e0516fcf --project-ref [project-id] --version [previous-version]`
4. **Clear cache**: Clear browser cache and localStorage

### **Common Issues**
- **404 Error**: Check endpoint path and server ID
- **401 Error**: Check authentication token
- **500 Error**: Check server logs for details
- **Data not loading**: Check for endpoint duplication

---

**Last Updated**: September 14, 2025
**Version**: 1.0.0
**Status**: ✅ Active
