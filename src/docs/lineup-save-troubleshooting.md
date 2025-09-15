# Lineup Save Troubleshooting

## Error: "Lineup name is required" dan Edit Dialog Close

### Gejala
1. **Error saat save**: `POST .../master/lineup/extended 400 (Bad Request)` dengan message `{error: 'Lineup name is required'}`
2. **Edit dialog close**: Klik edit lineup muncul sebentar lalu close semua dialog
3. **Form validation**: Nama lineup tidak terkirim dengan benar

### Penyebab

#### 1. Form Data Tidak Valid
**Problem**: `formData.name` undefined atau empty
```typescript
// SALAH - tidak ada validasi
const lineupData: Partial<MasterDataItem> = {
  name: formData.name, // Bisa undefined
  type: 'lineup',
  // ...
}
```

#### 2. Server Validation Strict
**Problem**: Server membutuhkan `name` yang tidak empty
```typescript
// Server validation
if (!name?.trim()) {
  return c.json({ error: 'Lineup name is required' }, 400)
}
```

#### 3. Error dalam handleEdit
**Problem**: Error saat edit menyebabkan dialog close

### Solusi Lengkap

#### 1. Tambahkan Form Validation
**File**: `src/components/LineupManagement.tsx`

**Sebelum:**
```typescript
const handleSubmit = async () => {
  try {
    setLoading(true)
    
    const lineupData: Partial<MasterDataItem> = {
      name: formData.name,
      type: 'lineup',
      // ...
    }
```

**Sesudah:**
```typescript
const handleSubmit = async () => {
  try {
    setLoading(true)
    
    // Validate required fields
    if (!formData.name || formData.name.trim() === '') {
      setError('Nama lineup harus diisi')
      return
    }
    
    console.log('Submitting lineup data:', {
      name: formData.name,
      lineupType: formData.lineupType,
      lineupOrder: formData.lineupOrder,
      description: formData.description,
      generationId,
      generationName
    })
    
    const lineupData: Partial<MasterDataItem> = {
      name: formData.name.trim(), // Pastikan trimmed
      type: 'lineup',
      generationId: generationId,
      generationName: generationName,
      lineupType: formData.lineupType,
      lineupOrder: formData.lineupOrder,
      description: formData.description
    }
```

#### 2. Perbaiki Error Handling di handleEdit
**File**: `src/components/LineupManagement.tsx`

**Sebelum:**
```typescript
const handleEdit = (lineup: MasterDataItem) => {
  setEditingLineup(lineup)
  // ... rest of function
  setShowForm(true)
}
```

**Sesudah:**
```typescript
const handleEdit = (lineup: MasterDataItem) => {
  try {
    console.log('Editing lineup:', lineup)
    console.log('Available actresses:', actresses.length)
    
    setEditingLineup(lineup)
    
    // Get actresses already in this lineup
    const lineupActresses = actresses.filter(actress => 
      actress.lineupData && actress.lineupData[lineup.id]
    )
    
    console.log('Lineup actresses found:', lineupActresses.length)
    
    const selectedActresses = lineupActresses.map(actress => actress.id)
    const actressAliases: { [actressId: string]: string } = {}
    const actressProfilePictures: { [actressId: string]: string } = {}
    
    lineupActresses.forEach(actress => {
      const lineupData = actress.lineupData?.[lineup.id]
      if (lineupData) {
        actressAliases[actress.id] = lineupData.alias || ''
        actressProfilePictures[actress.id] = lineupData.profilePicture || ''
      }
    })
    
    const newFormData = {
      name: lineup.name || '',
      lineupType: lineup.lineupType || 'Main',
      lineupOrder: lineup.lineupOrder || 1,
      description: lineup.description || '',
      selectedActresses,
      actressAliases,
      actressProfilePictures
    }
    
    console.log('Setting form data:', newFormData)
    setFormData(newFormData)
    setShowForm(true)
    
  } catch (error) {
    console.error('Error in handleEdit:', error)
    setError('Gagal membuka form edit lineup')
  }
}
```

#### 3. Tambahkan Debug Logging
**File**: `src/components/LineupManagement.tsx`

```typescript
// Di handleSubmit
console.log('Submitting lineup data:', {
  name: formData.name,
  lineupType: formData.lineupType,
  lineupOrder: formData.lineupOrder,
  description: formData.description,
  generationId,
  generationName
})

// Di handleEdit
console.log('Editing lineup:', lineup)
console.log('Available actresses:', actresses.length)
console.log('Lineup actresses found:', lineupActresses.length)
console.log('Setting form data:', newFormData)
```

#### 4. Perbaiki Error Messages
**File**: `src/components/LineupManagement.tsx`

```typescript
// Sebelum
setError('Gagal menyimpan lineup')

// Sesudah
setError(`Gagal menyimpan lineup: ${err.message}`)
```

### Testing

#### 1. Test Form Validation
```javascript
// Di browser console
console.log('Testing form validation...')

// Test dengan nama kosong
setFormData({
  ...formData,
  name: ''
})
handleSubmit() // Should show error

// Test dengan nama valid
setFormData({
  ...formData,
  name: 'Test Lineup'
})
handleSubmit() // Should work
```

#### 2. Test Edit Function
```javascript
// Di browser console
console.log('Testing edit function...')

// Test dengan lineup yang valid
const lineup = { id: 'test-id', name: 'Test Lineup' }
handleEdit(lineup) // Should work

// Test dengan lineup yang tidak valid
const invalidLineup = null
handleEdit(invalidLineup) // Should show error
```

#### 3. Test Data Flow
```javascript
// Check form data sebelum submit
console.log('Form data before submit:', formData)

// Check lineup data yang akan dikirim
console.log('Lineup data to send:', lineupData)
```

### Common Issues

#### 1. Form State Corruption
**Problem**: `formData.name` menjadi undefined
**Solution**: Validasi form state
```typescript
if (!formData || !formData.name) {
  setError('Form data tidak valid')
  return
}
```

#### 2. Server Validation Mismatch
**Problem**: Server membutuhkan field yang tidak ada
**Solution**: Pastikan semua field required ada
```typescript
const lineupData: Partial<MasterDataItem> = {
  name: formData.name?.trim() || '', // Required
  type: 'lineup', // Required
  generationId: generationId, // Required
  generationName: generationName, // Required
  lineupType: formData.lineupType || 'Main',
  lineupOrder: formData.lineupOrder || 1,
  description: formData.description || ''
}
```

#### 3. Async State Issues
**Problem**: State tidak ter-update dengan benar
**Solution**: Gunakan functional updates
```typescript
setFormData(prev => ({
  ...prev,
  name: lineup.name || ''
}))
```

### Debugging Steps

#### 1. Check Form State
```javascript
// Di browser console
console.log('Current form data:', formData)
console.log('Form name:', formData.name)
console.log('Form name trimmed:', formData.name?.trim())
```

#### 2. Check Network Request
```javascript
// Di browser DevTools > Network
// Check request ke /master/lineup/extended
// Pastikan body JSON mengandung name field
```

#### 3. Check Server Logs
```bash
# Di Supabase Dashboard > Functions > Logs
# Cari log dari createLineupData function
```

### Best Practices

#### 1. Defensive Programming
```typescript
// Selalu validasi data
if (!formData.name || formData.name.trim() === '') {
  setError('Nama lineup harus diisi')
  return
}

// Gunakan trim untuk string
const lineupData = {
  name: formData.name.trim(),
  // ...
}
```

#### 2. Error Recovery
```typescript
// Jika error, reset state
catch (error) {
  console.error('Error:', error)
  setError(`Gagal menyimpan lineup: ${error.message}`)
  setLoading(false)
}
```

#### 3. User Feedback
```typescript
// Berikan feedback yang jelas
if (error) {
  return (
    <div className="error-message">
      {error}
      <button onClick={() => setError(null)}>Tutup</button>
    </div>
  )
}
```

### Alternative Solutions

#### 1. Form Library
```typescript
// Gunakan form library seperti react-hook-form
import { useForm } from 'react-hook-form'

const { register, handleSubmit, formState: { errors } } = useForm({
  defaultValues: {
    name: '',
    lineupType: 'Main',
    lineupOrder: 1,
    description: ''
  }
})
```

#### 2. Validation Library
```typescript
// Gunakan validation library seperti yup
import * as yup from 'yup'

const schema = yup.object({
  name: yup.string().required('Nama lineup harus diisi'),
  lineupType: yup.string().required(),
  lineupOrder: yup.number().required()
})
```

#### 3. State Management
```typescript
// Gunakan state management yang lebih robust
const [formState, setFormState] = useState({
  data: {},
  errors: {},
  isValid: false
})
```

---

**Last Updated:** December 2024  
**Version:** 1.0.0  
**Maintainer:** Development Team
