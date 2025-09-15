# Lineup Actress Loading Troubleshooting

## Error: "Tidak ada actress yang tersedia" dan TypeError

### Gejala
1. **"Tidak ada actress yang tersedia"** muncul di form lineup
2. **Error**: `Cannot read properties of undefined (reading 'length')` di LineupManagement.tsx:358
3. **Form submission canceled** karena form tidak terhubung

### Penyebab

#### 1. Actress Filtering Logic Salah
**Problem**: Actress di-filter berdasarkan `generationName` instead of `groupId`
```typescript
// SALAH - mencari berdasarkan generationName
const groupActresses = allActresses.filter(actress => 
  actress.selectedGroups && actress.selectedGroups.includes(generationName)
)

// BENAR - mencari berdasarkan groupId
const groupActresses = allActresses.filter(actress => 
  actress.selectedGroups && actress.selectedGroups.includes(groupId)
)
```

#### 2. Null/Undefined Checks Missing
**Problem**: Tidak ada null check untuk `formData.selectedActresses`
```typescript
// SALAH - bisa undefined
{formData.selectedActresses.length > 0 && (

// BENAR - dengan null check
{formData.selectedActresses && formData.selectedActresses.length > 0 && (
```

#### 3. Array Access Without Validation
**Problem**: Mengakses array properties tanpa validasi
```typescript
// SALAH - bisa undefined
checked={formData.selectedActresses.includes(actress.id)}

// BENAR - dengan fallback
checked={formData.selectedActresses?.includes(actress.id) || false}
```

### Solusi Lengkap

#### 1. Perbaiki Actress Filtering
**File**: `src/components/LineupManagement.tsx`

**Sebelum:**
```typescript
const loadData = async () => {
  // Load actresses for this group
  const allActresses = await masterDataApi.getByType('actress', accessToken)
  const groupActresses = allActresses.filter(actress => 
    actress.selectedGroups && actress.selectedGroups.includes(generationName)
  )
  setActresses(groupActresses)
}
```

**Sesudah:**
```typescript
const loadData = async () => {
  // Load actresses for this group
  const allActresses = await masterDataApi.getByType('actress', accessToken)
  const groupActresses = allActresses.filter(actress => 
    actress.selectedGroups && actress.selectedGroups.includes(groupId)
  )
  setActresses(groupActresses)
}
```

#### 2. Tambahkan Null Checks
**File**: `src/components/LineupManagement.tsx`

**A. Member Selection Section:**
```typescript
// Sebelum
{actresses.length === 0 ? (
  <p className="text-gray-500 text-sm">Tidak ada actress yang tersedia</p>
) : (

// Sesudah
{!actresses || actresses.length === 0 ? (
  <p className="text-gray-500 text-sm">Tidak ada actress yang tersedia</p>
) : (
```

**B. Selected Members Settings:**
```typescript
// Sebelum
{formData.selectedActresses.length > 0 && (

// Sesudah
{formData.selectedActresses && formData.selectedActresses.length > 0 && (
```

**C. Checkbox Checked State:**
```typescript
// Sebelum
checked={formData.selectedActresses.includes(actress.id)}

// Sesudah
checked={formData.selectedActresses?.includes(actress.id) || false}
```

**D. onChange Handler:**
```typescript
// Sebelum
selectedActresses: [...formData.selectedActresses, actress.id]

// Sesudah
selectedActresses: [...(formData.selectedActresses || []), actress.id]
```

**E. Filter Operation:**
```typescript
// Sebelum
const newSelectedActresses = formData.selectedActresses.filter(id => id !== actress.id)

// Sesudah
const newSelectedActresses = (formData.selectedActresses || []).filter(id => id !== actress.id)
```

**F. handleSubmit Function:**
```typescript
// Sebelum
if (formData.selectedActresses.length > 0 && createdLineup) {
  for (const actressId of formData.selectedActresses) {
    const actress = actresses.find(a => a.id === actressId)

// Sesudah
if (formData.selectedActresses && formData.selectedActresses.length > 0 && createdLineup) {
  for (const actressId of formData.selectedActresses) {
    const actress = actresses?.find(a => a.id === actressId)
```

#### 3. Debug Actress Loading

**A. Check Console Logs:**
```typescript
const loadData = async () => {
  try {
    setLoading(true)
    setError(null)

    // Load actresses for this group
    const allActresses = await masterDataApi.getByType('actress', accessToken)
    console.log('All actresses:', allActresses)
    console.log('Group ID:', groupId)
    
    const groupActresses = allActresses.filter(actress => {
      console.log(`Actress ${actress.name}:`, {
        selectedGroups: actress.selectedGroups,
        includesGroupId: actress.selectedGroups?.includes(groupId)
      })
      return actress.selectedGroups && actress.selectedGroups.includes(groupId)
    })
    
    console.log('Group actresses:', groupActresses)
    setActresses(groupActresses)

  } catch (err) {
    console.error('Error loading lineup data:', err)
    setError('Gagal memuat data lineup')
  } finally {
    setLoading(false)
  }
}
```

**B. Check Data Structure:**
```typescript
// Pastikan actress memiliki selectedGroups yang benar
interface MasterDataItem {
  id: string
  name: string
  type: 'actress'
  selectedGroups?: string[] // Array of group IDs
  // ... other fields
}
```

#### 4. Alternative Actress Loading

**Jika filtering berdasarkan groupId tidak bekerja:**

**A. Filter berdasarkan generationData:**
```typescript
const groupActresses = allActresses.filter(actress => 
  actress.generationData && 
  Object.keys(actress.generationData).some(genId => genId === generationId)
)
```

**B. Filter berdasarkan semua actresses (untuk testing):**
```typescript
// Temporary - untuk testing saja
const groupActresses = allActresses
setActresses(groupActresses)
```

**C. Manual selection (jika diperlukan):**
```typescript
// Load actresses dan biarkan user memilih manual
const allActresses = await masterDataApi.getByType('actress', accessToken)
setActresses(allActresses)
```

### Testing

#### 1. Test Actress Loading
```javascript
// Di browser console
console.log('Group ID:', 'your-group-id')
console.log('Generation ID:', 'your-generation-id')

// Check actress data
masterDataApi.getByType('actress', accessToken)
  .then(actresses => {
    console.log('All actresses:', actresses)
    const groupActresses = actresses.filter(actress => 
      actress.selectedGroups && actress.selectedGroups.includes('your-group-id')
    )
    console.log('Group actresses:', groupActresses)
  })
```

#### 2. Test Form State
```javascript
// Di browser console - check form state
console.log('Form data:', formData)
console.log('Selected actresses:', formData.selectedActresses)
console.log('Actresses array:', actresses)
```

#### 3. Test Error Handling
```typescript
// Test dengan data kosong
setActresses([])
setFormData({
  ...formData,
  selectedActresses: undefined
})
```

### Common Issues

#### 1. Group ID Mismatch
**Problem**: `groupId` tidak sesuai dengan `selectedGroups` di actress
**Solution**: Check apakah `groupId` benar dan sesuai dengan data actress

#### 2. Data Structure Inconsistency
**Problem**: `selectedGroups` bukan array atau format salah
**Solution**: Pastikan `selectedGroups` adalah array of strings

#### 3. Async Loading Race Condition
**Problem**: Component render sebelum data ter-load
**Solution**: Tambahkan loading state dan null checks

#### 4. Form State Corruption
**Problem**: `formData.selectedActresses` menjadi undefined
**Solution**: Selalu initialize dengan empty array dan gunakan null checks

### Best Practices

#### 1. Defensive Programming
```typescript
// Selalu gunakan null checks
const safeArray = array || []
const safeLength = array?.length || 0
const safeFind = array?.find(item => condition) || null
```

#### 2. Error Boundaries
```typescript
// Tambahkan error boundary untuk component
try {
  // Component logic
} catch (error) {
  console.error('Component error:', error)
  setError('Terjadi kesalahan')
}
```

#### 3. Loading States
```typescript
// Selalu show loading state
{loading ? (
  <div>Loading...</div>
) : (
  // Component content
)}
```

#### 4. Data Validation
```typescript
// Validate data sebelum digunakan
if (!actresses || !Array.isArray(actresses)) {
  console.error('Invalid actresses data')
  return
}
```

### Monitoring

#### 1. Console Logs
```typescript
// Tambahkan logging untuk debugging
console.log('Component state:', {
  actresses: actresses?.length || 0,
  selectedActresses: formData.selectedActresses?.length || 0,
  groupId,
  generationId
})
```

#### 2. Error Tracking
```typescript
// Track errors untuk monitoring
catch (error) {
  console.error('LineupManagement error:', {
    error: error.message,
    stack: error.stack,
    componentState: {
      actresses: actresses?.length,
      selectedActresses: formData.selectedActresses?.length,
      groupId,
      generationId
    }
  })
  setError('Gagal memuat data lineup')
}
```

---

**Last Updated:** December 2024  
**Version:** 1.0.0  
**Maintainer:** Development Team
