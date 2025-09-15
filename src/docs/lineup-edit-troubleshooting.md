# Lineup Edit Troubleshooting

## Error: Edit Lineup Langsung Close Dialog

### Gejala
- Klik "Edit" pada lineup
- Dialog langsung tertutup tanpa menampilkan form edit
- Tidak ada error message yang jelas

### Penyebab

#### 1. Form State Tidak Lengkap
**Problem**: `handleEdit` tidak menginisialisasi semua field yang diperlukan
```typescript
// SALAH - tidak menginisialisasi selectedActresses
const handleEdit = (lineup: MasterDataItem) => {
  setFormData({
    name: lineup.name || '',
    lineupType: lineup.lineupType || 'Main',
    lineupOrder: lineup.lineupOrder || 1,
    description: lineup.description || ''
    // Missing: selectedActresses, actressAliases, actressProfilePictures
  })
}
```

#### 2. Undefined Array Access
**Problem**: Component mencoba mengakses `formData.selectedActresses.length` yang undefined
```typescript
// SALAH - bisa undefined
{formData.selectedActresses.length > 0 && (
```

#### 3. Error dalam Component Render
**Problem**: Error saat render menyebabkan dialog close

### Solusi Lengkap

#### 1. Perbaiki handleEdit Function
**File**: `src/components/LineupManagement.tsx`

**Sebelum:**
```typescript
const handleEdit = (lineup: MasterDataItem) => {
  setEditingLineup(lineup)
  setFormData({
    name: lineup.name || '',
    lineupType: lineup.lineupType || 'Main',
    lineupOrder: lineup.lineupOrder || 1,
    description: lineup.description || ''
  })
  setShowForm(true)
}
```

**Sesudah:**
```typescript
const handleEdit = (lineup: MasterDataItem) => {
  setEditingLineup(lineup)
  
  // Get actresses already in this lineup
  const lineupActresses = actresses.filter(actress => 
    actress.lineupData && actress.lineupData[lineup.id]
  )
  
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
  
  setFormData({
    name: lineup.name || '',
    lineupType: lineup.lineupType || 'Main',
    lineupOrder: lineup.lineupOrder || 1,
    description: lineup.description || '',
    selectedActresses,
    actressAliases,
    actressProfilePictures
  })
  setShowForm(true)
}
```

#### 2. Tambahkan Error Boundary
**File**: `src/components/LineupManagement.tsx`

```typescript
const handleEdit = (lineup: MasterDataItem) => {
  try {
    setEditingLineup(lineup)
    
    // Get actresses already in this lineup
    const lineupActresses = actresses.filter(actress => 
      actress.lineupData && actress.lineupData[lineup.id]
    )
    
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
    
    setFormData({
      name: lineup.name || '',
      lineupType: lineup.lineupType || 'Main',
      lineupOrder: lineup.lineupOrder || 1,
      description: lineup.description || '',
      selectedActresses,
      actressAliases,
      actressProfilePictures
    })
    setShowForm(true)
  } catch (error) {
    console.error('Error in handleEdit:', error)
    setError('Gagal membuka form edit lineup')
  }
}
```

#### 3. Debug Form State
**File**: `src/components/LineupManagement.tsx`

```typescript
const handleEdit = (lineup: MasterDataItem) => {
  console.log('Editing lineup:', lineup)
  console.log('Available actresses:', actresses.length)
  
  // ... rest of the function
  
  console.log('Form data set:', {
    name: lineup.name,
    selectedActresses: selectedActresses.length,
    actressAliases: Object.keys(actressAliases).length,
    actressProfilePictures: Object.keys(actressProfilePictures).length
  })
}
```

### Testing

#### 1. Test Edit Function
```javascript
// Di browser console
console.log('Testing edit function...')

// Check lineup data
const lineup = { id: 'test-id', name: 'Test Lineup' }
console.log('Lineup to edit:', lineup)

// Check actresses data
console.log('Available actresses:', actresses)
```

#### 2. Test Form State
```javascript
// Di browser console - check form state after edit
console.log('Form data:', formData)
console.log('Selected actresses:', formData.selectedActresses)
console.log('Actress aliases:', formData.actressAliases)
console.log('Actress profile pictures:', formData.actressProfilePictures)
```

#### 3. Test Error Handling
```javascript
// Test dengan data yang tidak valid
const invalidLineup = null
handleEdit(invalidLineup) // Should show error
```

### Common Issues

#### 1. Lineup Data Missing
**Problem**: Lineup object tidak memiliki field yang diperlukan
**Solution**: Validasi data sebelum digunakan
```typescript
if (!lineup || !lineup.id) {
  console.error('Invalid lineup data')
  setError('Data lineup tidak valid')
  return
}
```

#### 2. Actresses Not Loaded
**Problem**: `actresses` array kosong saat edit
**Solution**: Pastikan actresses sudah ter-load
```typescript
if (!actresses || actresses.length === 0) {
  console.log('No actresses available, loading...')
  await loadData()
}
```

#### 3. Form State Corruption
**Problem**: `formData` menjadi undefined atau corrupted
**Solution**: Reset form state sebelum edit
```typescript
// Reset form state
setFormData({
  name: '',
  lineupType: 'Main',
  lineupOrder: 1,
  description: '',
  selectedActresses: [],
  actressAliases: {},
  actressProfilePictures: {}
})

// Then set edit data
setFormData({
  name: lineup.name || '',
  // ... rest of the data
})
```

### Debugging Steps

#### 1. Check Console Logs
```typescript
// Tambahkan logging di handleEdit
console.log('handleEdit called with:', lineup)
console.log('Current actresses:', actresses)
console.log('Current formData:', formData)
```

#### 2. Check Component State
```typescript
// Check state sebelum dan sesudah edit
console.log('Before edit:', {
  editingLineup,
  showForm,
  formData
})

// After edit
console.log('After edit:', {
  editingLineup,
  showForm,
  formData
})
```

#### 3. Check Error Messages
```typescript
// Check error state
console.log('Error state:', error)
console.log('Loading state:', loading)
```

### Best Practices

#### 1. Defensive Programming
```typescript
// Selalu validasi data
if (!lineup || !lineup.id) {
  setError('Data lineup tidak valid')
  return
}

if (!actresses || actresses.length === 0) {
  setError('Tidak ada actress yang tersedia')
  return
}
```

#### 2. Error Recovery
```typescript
// Jika edit gagal, reset state
catch (error) {
  console.error('Edit failed:', error)
  setEditingLineup(null)
  setShowForm(false)
  setError('Gagal membuka form edit')
}
```

#### 3. User Feedback
```typescript
// Berikan feedback ke user
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

#### 1. Separate Edit Component
```typescript
// Buat component terpisah untuk edit
const EditLineupDialog = ({ lineup, onClose, onSave }) => {
  // Edit logic here
}
```

#### 2. Modal State Management
```typescript
// Gunakan state management yang lebih robust
const [editState, setEditState] = useState({
  isOpen: false,
  lineup: null,
  formData: null
})
```

#### 3. Form Validation
```typescript
// Tambahkan validasi form
const validateFormData = (data) => {
  if (!data.name) return 'Nama lineup harus diisi'
  if (!data.selectedActresses) return 'Pilih minimal satu actress'
  return null
}
```

---

**Last Updated:** December 2024  
**Version:** 1.0.0  
**Maintainer:** Development Team
