# 📋 Development Guidelines - Endpoint Management

## 🎯 **Tujuan**

Dokumentasi ini dibuat untuk mencegah kesalahan duplikasi endpoint yang sama seperti yang terjadi pada photobooks dan favorites. Guidelines ini akan memastikan development yang konsisten dan menghindari masalah serupa di masa depan.

## 🏗️ **Endpoint Design Principles**

### **1. Unique Path Strategy**

**❌ JANGAN:**
```typescript
// Duplikasi path yang sama
app.get('/make-server-e0516fcf/photobooks', async (c) => {
  // Stats endpoint
})

app.get('/make-server-e0516fcf/photobooks', async (c) => {
  // Public endpoint - TIDAK AKAN PERNAH DIPANGGIL
})
```

**✅ LAKUKAN:**
```typescript
// Path yang unik dan spesifik
app.get('/make-server-e0516fcf/stats/photobooks', async (c) => {
  // Stats endpoint
})

app.get('/make-server-e0516fcf/photobooks', async (c) => {
  // Public endpoint - AKAN DIPANGGIL
})
```

### **2. Naming Convention**

**Endpoint Categories:**
- **Public**: `/endpoint` - Tidak perlu authentication
- **User**: `/endpoint` - Memerlukan user authentication
- **Admin**: `/admin/endpoint` - Memerlukan admin authentication
- **Stats**: `/stats/endpoint` - Memerlukan authentication untuk statistik

**Examples:**
```typescript
// Public endpoints
app.get('/make-server-e0516fcf/photobooks', async (c) => { /* public */ })
app.get('/make-server-e0516fcf/movies', async (c) => { /* public */ })

// User endpoints
app.get('/make-server-e0516fcf/favorites', async (c) => { /* user auth */ })
app.get('/make-server-e0516fcf/user/profile', async (c) => { /* user auth */ })

// Admin endpoints
app.get('/make-server-e0516fcf/admin/users', async (c) => { /* admin auth */ })
app.get('/make-server-e0516fcf/admin/stats', async (c) => { /* admin auth */ })

// Stats endpoints
app.get('/make-server-e0516fcf/stats/photobooks', async (c) => { /* stats */ })
app.get('/make-server-e0516fcf/stats/favorites', async (c) => { /* stats */ })
```

## 🔒 **Authentication Patterns**

### **1. Public Endpoints**

**Pattern:**
```typescript
app.get('/make-server-e0516fcf/public-endpoint', async (c) => {
  try {
    // Tidak ada authentication check
    const data = await getPublicData()
    return c.json(data)
  } catch (error) {
    console.error('Public endpoint error:', error)
    return c.json({ error: 'Failed to fetch data' }, 500)
  }
})
```

**Use Cases:**
- Photobooks (public data)
- Movies (public data)
- Health check
- Public statistics

### **2. User Authentication Endpoints**

**Pattern:**
```typescript
app.get('/make-server-e0516fcf/user-endpoint', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    
    if (!user?.id || authError) {
      console.error('Unauthorized access:', authError?.message)
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const data = await getUserData(user.id)
    return c.json(data)
  } catch (error) {
    console.error('User endpoint error:', error)
    return c.json({ error: 'Failed to fetch data' }, 500)
  }
})
```

**Use Cases:**
- Favorites (user-specific data)
- User profile
- User settings
- Personal statistics

### **3. Admin Authentication Endpoints**

**Pattern:**
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
    console.error('Admin endpoint error:', error)
    return c.json({ error: 'Failed to fetch data' }, 500)
  }
})
```

**Use Cases:**
- User management
- System statistics
- Admin configuration
- System maintenance

## 📁 **File Organization**

### **1. Server Structure**

```
supabase/functions/make-server-e0516fcf/
├── index.ts                 # Main server file
├── photobookApi.ts          # Photobook-specific logic
├── favoritesApi.ts          # Favorites-specific logic
├── masterDataApi.ts         # Master data logic
├── kv_store.ts              # KV store utilities
└── _shared/                 # Shared utilities
    ├── auth.ts              # Authentication helpers
    ├── validation.ts        # Input validation
    └── error-handlers.ts    # Error handling
```

### **2. Endpoint Grouping**

**Group endpoints by functionality:**
```typescript
// ==================================================================================
// PHOTOBOOKS ROUTES
// ==================================================================================

// Public photobooks
app.get('/make-server-e0516fcf/photobooks', async (c) => {
  // Public access
})

// Stats photobooks
app.get('/make-server-e0516fcf/stats/photobooks', async (c) => {
  // Admin access required
})

// ==================================================================================
// FAVORITES ROUTES
// ==================================================================================

// User favorites
app.get('/make-server-e0516fcf/favorites', async (c) => {
  // User authentication required
})

// Stats favorites
app.get('/make-server-e0516fcf/stats/favorites', async (c) => {
  // Admin access required
})
```

## 🧪 **Testing Guidelines**

### **1. Unit Testing**

**Test setiap endpoint:**
```typescript
describe('Photobooks Endpoints', () => {
  test('GET /photobooks should return public data', async () => {
    const response = await app.request('/make-server-e0516fcf/photobooks')
    expect(response.status).toBe(200)
    expect(await response.json()).toHaveProperty('data')
  })

  test('GET /stats/photobooks should require authentication', async () => {
    const response = await app.request('/make-server-e0516fcf/stats/photobooks')
    expect(response.status).toBe(401)
  })
})
```

### **2. Integration Testing**

**Test dengan token yang sesuai:**
```typescript
describe('Favorites Endpoints', () => {
  test('GET /favorites should work with valid user token', async () => {
    const response = await app.request('/make-server-e0516fcf/favorites', {
      headers: {
        'Authorization': `Bearer ${validUserToken}`
      }
    })
    expect(response.status).toBe(200)
  })

  test('GET /favorites should fail with invalid token', async () => {
    const response = await app.request('/make-server-e0516fcf/favorites', {
      headers: {
        'Authorization': `Bearer ${invalidToken}`
      }
    })
    expect(response.status).toBe(401)
  })
})
```

### **3. End-to-End Testing**

**Test complete flow:**
```typescript
describe('Complete Flow', () => {
  test('User can view photobooks and manage favorites', async () => {
    // 1. View public photobooks
    const photobooksResponse = await app.request('/make-server-e0516fcf/photobooks')
    expect(photobooksResponse.status).toBe(200)

    // 2. Add favorite
    const addFavoriteResponse = await app.request('/make-server-e0516fcf/favorites', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'photobook',
        itemId: 'test-id'
      })
    })
    expect(addFavoriteResponse.status).toBe(200)

    // 3. View favorites
    const favoritesResponse = await app.request('/make-server-e0516fcf/favorites', {
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    })
    expect(favoritesResponse.status).toBe(200)
  })
})
```

## 🔍 **Code Review Checklist**

### **1. Endpoint Review**

**Sebelum merge, pastikan:**
- [ ] Tidak ada duplikasi endpoint path
- [ ] Endpoint path mengikuti naming convention
- [ ] Authentication strategy sudah benar
- [ ] Error handling sudah lengkap
- [ ] Response format sudah konsisten

### **2. Security Review**

**Pastikan:**
- [ ] Public endpoints tidak ada authentication check
- [ ] Protected endpoints ada authentication check
- [ ] Admin endpoints ada role check
- [ ] Input validation sudah ada
- [ ] Error messages tidak expose sensitive info

### **3. Performance Review**

**Pastikan:**
- [ ] Endpoint response time acceptable
- [ ] Database queries sudah optimized
- [ ] Caching strategy sudah ada
- [ ] Error handling tidak menyebabkan memory leak

## 📚 **Documentation Requirements**

### **1. Endpoint Documentation**

**Setiap endpoint harus didokumentasikan:**
```typescript
/**
 * GET /make-server-e0516fcf/photobooks
 * 
 * Description: Get all public photobooks
 * Authentication: None (Public)
 * 
 * Response:
 * {
 *   "data": [
 *     {
 *       "id": "string",
 *       "title": "string",
 *       "images": ["string"],
 *       "actress": ["string"]
 *     }
 *   ]
 * }
 * 
 * Error Codes:
 * - 500: Internal server error
 */
app.get('/make-server-e0516fcf/photobooks', async (c) => {
  // Implementation
})
```

### **2. API Documentation**

**Update API documentation:**
- Endpoint list dengan authentication requirements
- Request/response examples
- Error codes dan messages
- Rate limiting information

## 🚀 **Deployment Guidelines**

### **1. Pre-deployment Checklist**

**Sebelum deploy:**
- [ ] Semua endpoint sudah ditest
- [ ] Tidak ada duplikasi endpoint
- [ ] Authentication strategy sudah benar
- [ ] Error handling sudah lengkap
- [ ] Documentation sudah update

### **2. Deployment Process**

```bash
# 1. Test locally
npm test

# 2. Deploy function
supabase functions deploy make-server-e0516fcf --project-ref [project-id]

# 3. Test deployed function
curl -X GET "https://[project-id].supabase.co/functions/v1/make-server-e0516fcf/health"

# 4. Monitor logs
supabase functions logs make-server-e0516fcf --project-ref [project-id]
```

### **3. Post-deployment Verification**

**Setelah deploy:**
- [ ] Health check endpoint bekerja
- [ ] Public endpoints bisa diakses
- [ ] Protected endpoints memerlukan authentication
- [ ] Error handling bekerja dengan benar
- [ ] Performance acceptable

## 🔄 **Maintenance Guidelines**

### **1. Regular Reviews**

**Lakukan review berkala:**
- Endpoint performance
- Authentication security
- Error handling effectiveness
- Documentation accuracy

### **2. Monitoring**

**Monitor:**
- Endpoint response times
- Error rates
- Authentication failures
- Resource usage

### **3. Updates**

**Update guidelines ketika:**
- Ada perubahan authentication strategy
- Ada endpoint baru yang ditambahkan
- Ada perubahan security requirements
- Ada bug yang ditemukan

---

**Last Updated**: September 14, 2025
**Version**: 1.0.0
**Status**: ✅ Active
**Next Review**: October 14, 2025
