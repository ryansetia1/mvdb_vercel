# Group Members Debugging Guide

## 🔍 **Debugging yang Ditambahkan**

Saya telah menambahkan debugging yang komprehensif untuk menginvestigasi masalah group members yang hilang.

### **1. GroupDetailContent Debugging**

```typescript
console.log('=== GroupDetailContent: Loading actresses ===')
console.log('Group name:', group.name)
console.log('Group object:', group)
console.log('Actresses data count:', actressesData?.length || 0)
console.log('Sample actress data:', actressesData?.[0])
console.log('Filtering actresses for group:', group.name)
console.log('Group members found:', members.length)
console.log('Group members:', members.map(m => ({ name: m.name, groups: m.selectedGroups })))
```

### **2. Cache Loading Debugging**

```typescript
console.log('Cache loaded from localStorage')
console.log('Actresses count:', parsed.actresses.data?.length || 0)
console.log('Sample actress selectedGroups:', parsed.actresses.data?.[0]?.selectedGroups)
```

### **3. Cache Saving Debugging**

```typescript
console.log('Cache saved to localStorage')
console.log('Actresses count saved:', compressedCache.actresses.data?.length || 0)
console.log('Sample actress selectedGroups saved:', compressedCache.actresses.data?.[0]?.selectedGroups)
```

## 🧪 **Cara Debugging**

### **Step 1: Buka Browser Console**
1. Buka aplikasi di browser
2. Tekan F12 untuk membuka Developer Tools
3. Klik tab "Console"

### **Step 2: Navigate ke Group Detail**
1. Buka group detail page (contoh: HONEY POPCORN)
2. Klik tab "Members"
3. Perhatikan console logs

### **Step 3: Analyze Console Output**

#### **Expected Output:**
```
=== GroupDetailContent: Loading actresses ===
Group name: HONEY POPCORN
Group object: {id: "...", name: "HONEY POPCORN", ...}
Actresses data count: 667
Sample actress data: {id: "...", name: "...", selectedGroups: [...]}
Filtering actresses for group: HONEY POPCORN
✓ [Actress Name] is in group HONEY POPCORN: ["HONEY POPCORN"]
Group members found: 5
Group members: [{name: "...", groups: ["HONEY POPCORN"]}, ...]
```

#### **Problem Indicators:**
```
// Problem 1: No actresses data
Actresses data count: 0

// Problem 2: No selectedGroups field
Sample actress data: {id: "...", name: "...", selectedGroups: undefined}

// Problem 3: No group members found
Group members found: 0
Group members: []
```

## 🔧 **Troubleshooting Steps**

### **Problem 1: No Actresses Data**
```typescript
// Check if cache is working
const cache = JSON.parse(localStorage.getItem('mvdb_cached_data'))
console.log('Cache actresses:', cache?.actresses?.data?.length || 0)

// Check if API is working
const freshData = await masterDataApi.getByType('actress', accessToken)
console.log('Fresh actresses:', freshData?.length || 0)
```

### **Problem 2: No selectedGroups Field**
```typescript
// Check if compression is removing selectedGroups
const actress = actressesData[0]
console.log('Actress selectedGroups:', actress.selectedGroups)
console.log('Actress keys:', Object.keys(actress))

// Check if data is being compressed correctly
const compressed = compressData(actress)
console.log('Compressed selectedGroups:', compressed.selectedGroups)
```

### **Problem 3: No Group Members Found**
```typescript
// Check group name matching
console.log('Group name:', group.name)
console.log('Group name type:', typeof group.name)
console.log('Group name length:', group.name.length)

// Check actress selectedGroups
actressesData.forEach(actress => {
  console.log(`${actress.name}:`, actress.selectedGroups)
  if (actress.selectedGroups) {
    actress.selectedGroups.forEach(groupName => {
      console.log(`  Group: "${groupName}" (${groupName.length} chars)`)
      console.log(`  Match: ${groupName === group.name}`)
    })
  }
})
```

## 📊 **Common Issues & Solutions**

### **Issue 1: Cache Not Loading**
**Symptoms:** No console logs about cache loading
**Solution:** Clear localStorage and reload
```typescript
localStorage.removeItem('mvdb_cached_data')
location.reload()
```

### **Issue 2: selectedGroups Undefined**
**Symptoms:** `selectedGroups: undefined` in console
**Solution:** Check data compression
```typescript
// Verify compression keeps selectedGroups
const testData = { selectedGroups: ['HONEY POPCORN'] }
const compressed = compressData(testData)
console.log('Compressed selectedGroups:', compressed.selectedGroups)
```

### **Issue 3: Group Name Mismatch**
**Symptoms:** Group members found: 0
**Solution:** Check exact group name
```typescript
// Check for hidden characters or case sensitivity
console.log('Group name bytes:', Array.from(group.name).map(c => c.charCodeAt(0)))
console.log('Group name normalized:', group.name.normalize())
```

### **Issue 4: Data Not Fresh**
**Symptoms:** Old data in cache
**Solution:** Force refresh
```typescript
// Clear cache and force reload
localStorage.removeItem('mvdb_cached_data')
invalidateCache()
```

## 🎯 **Debugging Checklist**

### **Before Debugging:**
- [ ] Clear browser cache
- [ ] Check network tab for API calls
- [ ] Verify access token is valid
- [ ] Check if group exists in database

### **During Debugging:**
- [ ] Check console logs for errors
- [ ] Verify actresses data is loaded
- [ ] Check selectedGroups field exists
- [ ] Verify group name matching
- [ ] Check cache data integrity

### **After Debugging:**
- [ ] Document findings
- [ ] Implement fix if needed
- [ ] Test fix thoroughly
- [ ] Remove debug logs if not needed

## 🚀 **Next Steps**

### **If Debugging Shows:**
1. **No actresses data** → Check API calls and cache
2. **No selectedGroups field** → Fix data compression
3. **No group members** → Check group name matching
4. **Cache issues** → Clear cache and reload

### **If Still Not Working:**
1. Check database directly
2. Verify group assignments
3. Check server-side data
4. Test with fresh data

## 📋 **Debugging Commands**

### **Quick Debug Commands:**
```javascript
// Check cache
JSON.parse(localStorage.getItem('mvdb_cached_data'))

// Check specific actress
const cache = JSON.parse(localStorage.getItem('mvdb_cached_data'))
cache.actresses.data.find(a => a.name.includes('HONEY'))

// Clear cache
localStorage.removeItem('mvdb_cached_data')

// Force reload
location.reload()
```

### **Advanced Debugging:**
```javascript
// Check all actresses with groups
const cache = JSON.parse(localStorage.getItem('mvdb_cached_data'))
cache.actresses.data.filter(a => a.selectedGroups && a.selectedGroups.length > 0)

// Check specific group
const honeyActresses = cache.actresses.data.filter(a => 
  a.selectedGroups && a.selectedGroups.includes('HONEY POPCORN')
)
console.log('HONEY POPCORN actresses:', honeyActresses)
```

## ✅ **Expected Results**

Setelah debugging, Anda harus melihat:
- ✅ Actresses data loaded (count > 0)
- ✅ selectedGroups field present
- ✅ Group members found (count > 0)
- ✅ Group members displayed correctly

Jika masih ada masalah, console logs akan memberikan informasi detail tentang di mana masalahnya terjadi.
