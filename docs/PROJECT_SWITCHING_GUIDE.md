# 🔄 Project Switching Guide

## 📋 Overview
Sistem sekarang mendukung **dynamic project switching** untuk Supabase dengan otomatis:
- ✅ **Cache invalidation** saat project berubah
- ✅ **Configuration management** yang dinamis
- ✅ **API endpoint switching** otomatis
- ✅ **Data isolation** antar project

---

## 🚀 **Fitur Project Switching**

### 1. **Automatic Cache Invalidation**
```typescript
// Cache otomatis di-clear saat project berubah
if (hasProjectChanged()) {
  console.log('Project changed detected, clearing cache')
  localStorage.removeItem('mvdb_cached_data')
  return null
}
```

### 2. **Dynamic Configuration Management**
```typescript
// Project configuration yang dinamis
const config = getProjectConfig()
// Returns: { projectId, anonKey, functionUrl }
```

### 3. **API Endpoint Switching**
```typescript
// Semua API calls menggunakan dynamic URL
const functionUrl = getSupabaseFunctionUrl()
// Automatically switches based on current project
```

---

## 🛠️ **Cara Menggunakan Project Switching**

### **Method 1: Environment Variables** (Recommended)
```bash
# Set environment variables
VITE_SUPABASE_PROJECT_ID=your_new_project_id
VITE_SUPABASE_ANON_KEY=your_new_anon_key
VITE_SUPABASE_FUNCTION_URL=https://your_new_project_id.supabase.co/functions/v1/make-server-e0516fcf
```

### **Method 2: Runtime Configuration**
```typescript
import { updateProjectConfig } from './utils/projectConfigManager'

// Update project configuration
updateProjectConfig({
  projectId: 'new_project_id',
  anonKey: 'new_anon_key',
  functionUrl: 'https://new_project_id.supabase.co/functions/v1/make-server-e0516fcf'
})
```

### **Method 3: Migration Script** (Automatic)
```typescript
// Generated migration script akan otomatis update semua file
const migrationScript = `
// Update semua file konfigurasi
configFiles.forEach(file => {
  content = content.replace(new RegExp(OLD_PROJECT_ID, 'g'), NEW_PROJECT_ID)
  content = content.replace(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9[^"]*/g, NEW_ANON_KEY)
})
`
```

---

## 🔧 **Komponen yang Diupdate**

### 1. **useCachedData Hook**
- ✅ Deteksi project change
- ✅ Auto-clear cache saat project berubah
- ✅ Project-specific storage keys

### 2. **ProjectConfigManager**
- ✅ Dynamic configuration loading
- ✅ Environment variable support
- ✅ Fallback ke hardcoded values
- ✅ Configuration change listeners

### 3. **Supabase Secrets API**
- ✅ Dynamic function URL
- ✅ Project-specific secrets access
- ✅ Automatic endpoint switching

### 4. **Master Data API**
- ✅ Dynamic BASE_URL
- ✅ Project-specific API calls
- ✅ Automatic endpoint switching

---

## 📊 **Data Isolation**

### **Project-Specific Storage**
```typescript
// Setiap project memiliki storage terpisah
const storageKey = getProjectStorageKey('mvdb_cached_data')
// Result: mvdb_cached_data_project_id_123
```

### **Cache Isolation**
- ✅ **Movies cache** - terpisah per project
- ✅ **Actors cache** - terpisah per project  
- ✅ **Actresses cache** - terpisah per project
- ✅ **Photobooks cache** - terpisah per project

### **Filter States Isolation**
- ✅ **Filter states** - terpisah per project
- ✅ **Navigation history** - terpisah per project
- ✅ **User preferences** - terpisah per project

---

## 🧪 **Testing Project Switching**

### **Test 1: Environment Variable Switch**
```bash
# 1. Set environment variables
export VITE_SUPABASE_PROJECT_ID=new_project_id
export VITE_SUPABASE_ANON_KEY=new_anon_key

# 2. Restart development server
npm run dev

# 3. Check console logs
# Should see: "Project changed from old_project_id to new_project_id"
# Should see: "Project changed detected, clearing cache"
```

### **Test 2: Runtime Configuration Switch**
```typescript
// 1. Open browser console
// 2. Run:
updateProjectConfig({
  projectId: 'test_project_id',
  anonKey: 'test_anon_key'
})

// 3. Check localStorage
// Should see: mvdb_current_project_id = test_project_id
// Should see: mvdb_cached_data cleared
```

### **Test 3: Cache Isolation**
```typescript
// 1. Load data di project A
// 2. Switch ke project B
// 3. Verify cache cleared
// 4. Switch back ke project A
// 5. Verify data reloaded fresh
```

---

## 🚨 **Troubleshooting**

### **Problem: Cache tidak ter-clear**
```typescript
// Solution: Manual cache clear
localStorage.removeItem('mvdb_cached_data')
localStorage.removeItem('mvdb_current_project_id')
```

### **Problem: API calls masih ke project lama**
```typescript
// Solution: Check environment variables
console.log('Current config:', getProjectConfig())
// Verify projectId dan functionUrl sudah benar
```

### **Problem: Supabase secrets tidak accessible**
```typescript
// Solution: Check function URL
const functionUrl = getSupabaseFunctionUrl()
console.log('Function URL:', functionUrl)
// Verify URL sesuai dengan project baru
```

---

## 📈 **Performance Impact**

### **Cache Invalidation**
- ✅ **Immediate**: Cache cleared saat project switch
- ✅ **Fresh Data**: Data reloaded dari project baru
- ✅ **No Conflicts**: Tidak ada data mixing antar project

### **API Calls**
- ✅ **Dynamic URLs**: Semua API calls otomatis switch
- ✅ **No Hardcoding**: Tidak ada hardcoded project ID
- ✅ **Fallback Support**: Fallback ke default jika config gagal

### **Storage Usage**
- ✅ **Isolated Storage**: Setiap project punya storage terpisah
- ✅ **No Bloat**: Storage lama di-clear otomatis
- ✅ **Efficient**: Hanya data project aktif yang tersimpan

---

## 🎯 **Best Practices**

### **1. Environment Variables**
```bash
# Selalu gunakan environment variables untuk production
VITE_SUPABASE_PROJECT_ID=production_project_id
VITE_SUPABASE_ANON_KEY=production_anon_key
```

### **2. Configuration Validation**
```typescript
// Selalu validate configuration
if (!isProjectConfigValid()) {
  console.error('Invalid project configuration')
  // Handle error appropriately
}
```

### **3. Error Handling**
```typescript
// Selalu handle configuration errors
try {
  const config = getProjectConfig()
  // Use config
} catch (error) {
  console.warn('Failed to get project config:', error)
  // Use fallback
}
```

### **4. Testing**
```typescript
// Test project switching di development
// Verify cache isolation
// Check API endpoint switching
// Validate data integrity
```

---

## 🔮 **Future Enhancements**

### **Short Term**
- ✅ Project configuration validation
- ✅ Configuration change notifications
- ✅ Automatic migration scripts

### **Medium Term**
- 🔄 Multi-project dashboard
- 🔄 Project comparison tools
- 🔄 Bulk project operations

### **Long Term**
- 🔄 Project templates
- 🔄 Automated project setup
- 🔄 Project analytics

---

## ✅ **Verification Checklist**

- [x] Cache invalidation saat project switch
- [x] Dynamic configuration management
- [x] API endpoint switching
- [x] Data isolation antar project
- [x] Environment variable support
- [x] Fallback ke hardcoded values
- [x] Error handling yang robust
- [x] Performance optimization
- [x] Documentation lengkap

---

## 🎉 **Summary**

Sistem project switching sekarang **fully functional** dengan:

1. **🔄 Automatic Cache Invalidation** - Cache otomatis di-clear saat project berubah
2. **⚙️ Dynamic Configuration** - Configuration yang dinamis berdasarkan environment
3. **🌐 API Endpoint Switching** - Semua API calls otomatis switch ke project baru
4. **🔒 Data Isolation** - Data terpisah antar project untuk mencegah konflik
5. **🛡️ Error Handling** - Fallback yang robust jika configuration gagal

**Project switching sekarang aman dan reliable!** 🚀
