# Lineup Edit Alternative Approach

## Pendekatan Baru untuk Mengatasi Dialog Close

### Masalah Sebelumnya
- Edit lineup dialog langsung close setelah klik edit
- Error dalam `handleEdit` menyebabkan dialog tidak terbuka
- State management yang kompleks menyebabkan race condition

### Pendekatan Baru yang Diterapkan

#### 1. **State Reset Strategy**
```typescript
const handleEdit = (lineup: MasterDataItem) => {
  try {
    // Reset all states first
    setError(null)
    setShowForm(false)
    setEditingLineup(null)
    
    // Wait a bit for state to reset
    setTimeout(() => {
      // Setup edit form
    }, 100)
  } catch (error) {
    console.error('Error in handleEdit:', error)
    setError('Gagal membuka form edit lineup')
  }
}
```

**Keuntungan:**
- Menghindari race condition
- State yang bersih sebelum setup
- Error handling yang lebih baik

#### 2. **Progressive Loading**
```typescript
// Set basic form data immediately
const basicFormData = {
  name: lineup.name || '',
  lineupType: lineup.lineupType || 'Main',
  lineupOrder: lineup.lineupOrder || 1,
  description: lineup.description || '',
  selectedActresses: [],
  actressAliases: {},
  actressProfilePictures: {}
}

setFormData(basicFormData)
setShowForm(true)

// Load lineup actresses in background
setTimeout(() => {
  // Load lineup actresses
}, 300)
```

**Keuntungan:**
- Form terbuka cepat dengan data dasar
- Lineup actresses dimuat di background
- User experience yang lebih baik

#### 3. **Safe Button Click Handler**
```typescript
<button
  onClick={(e) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('Edit button clicked for lineup:', lineup.name)
    handleEdit(lineup)
  }}
  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
>
  Edit
</button>
```

**Keuntungan:**
- Mencegah event bubbling
- Debug logging untuk troubleshooting
- Event handling yang lebih aman

#### 4. **Comprehensive Error Handling**
```typescript
try {
  // Main edit logic
} catch (error) {
  console.error('Error in edit setup:', error)
  setError('Gagal membuka form edit lineup')
}
```

**Keuntungan:**
- Error tidak menyebabkan crash
- User feedback yang jelas
- Debug information yang lengkap

### Implementasi Lengkap

#### 1. **handleEdit Function**
```typescript
const handleEdit = (lineup: MasterDataItem) => {
  console.log('=== EDIT LINEUP START ===')
  console.log('Lineup to edit:', lineup)
  
  try {
    // Reset all states first
    setError(null)
    setShowForm(false)
    setEditingLineup(null)
    
    // Wait a bit for state to reset
    setTimeout(() => {
      try {
        console.log('Setting up edit form...')
        
        // Set editing lineup
        setEditingLineup(lineup)
        
        // Set basic form data
        const basicFormData = {
          name: lineup.name || '',
          lineupType: lineup.lineupType || 'Main',
          lineupOrder: lineup.lineupOrder || 1,
          description: lineup.description || '',
          selectedActresses: [],
          actressAliases: {},
          actressProfilePictures: {}
        }
        
        setFormData(basicFormData)
        
        // Show form
        setShowForm(true)
        
        console.log('=== EDIT LINEUP SETUP COMPLETE ===')
        
        // Load lineup actresses in background if needed
        if (actresses && actresses.length > 0) {
          setTimeout(() => {
            try {
              console.log('Loading lineup actresses in background...')
              
              const lineupActresses = actresses.filter(actress => 
                actress.lineupData && actress.lineupData[lineup.id]
              )
              
              console.log('Found lineup actresses:', lineupActresses.length)
              
              if (lineupActresses.length > 0) {
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
                
                // Update form data with lineup actresses
                setFormData(prev => ({
                  ...prev,
                  selectedActresses,
                  actressAliases,
                  actressProfilePictures
                }))
                
                console.log('Lineup actresses loaded successfully')
              }
            } catch (error) {
              console.error('Error loading lineup actresses:', error)
            }
          }, 300)
        }
        
      } catch (error) {
        console.error('Error in edit setup:', error)
        setError('Gagal membuka form edit lineup')
      }
    }, 100)
    
  } catch (error) {
    console.error('Error in handleEdit:', error)
    setError('Gagal membuka form edit lineup')
  }
}
```

#### 2. **Button Implementation**
```typescript
<button
  onClick={(e) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('Edit button clicked for lineup:', lineup.name)
    handleEdit(lineup)
  }}
  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
>
  Edit
</button>
```

#### 3. **Debug Logging**
```typescript
console.log('=== EDIT LINEUP START ===')
console.log('Lineup to edit:', lineup)
console.log('Setting up edit form...')
console.log('=== EDIT LINEUP SETUP COMPLETE ===')
console.log('Loading lineup actresses in background...')
console.log('Found lineup actresses:', lineupActresses.length)
console.log('Lineup actresses loaded successfully')
```

### Keuntungan Pendekatan Baru

#### 1. **Reliability**
- State reset mencegah race condition
- Error handling yang komprehensif
- Progressive loading mengurangi complexity

#### 2. **User Experience**
- Form terbuka cepat dengan data dasar
- Lineup actresses dimuat di background
- Error feedback yang jelas

#### 3. **Debugging**
- Comprehensive logging
- Step-by-step execution tracking
- Error details yang lengkap

#### 4. **Maintainability**
- Code yang lebih modular
- Error handling yang konsisten
- State management yang predictable

### Testing

#### 1. **Test Edit Function**
```javascript
// Di browser console
console.log('Testing edit function...')

// Test dengan lineup yang valid
const lineup = { id: 'test-id', name: 'Test Lineup' }
handleEdit(lineup)

// Check console logs
// Should see: === EDIT LINEUP START ===
// Should see: Setting up edit form...
// Should see: === EDIT LINEUP SETUP COMPLETE ===
```

#### 2. **Test Button Click**
```javascript
// Test button click
const editButton = document.querySelector('button[onclick*="handleEdit"]')
editButton.click()

// Check console logs
// Should see: Edit button clicked for lineup: [lineup name]
```

#### 3. **Test Error Handling**
```javascript
// Test dengan data yang tidak valid
const invalidLineup = null
handleEdit(invalidLineup)

// Should see error message
// Should not crash the application
```

### Common Issues dan Solusi

#### 1. **Dialog Masih Close**
**Problem**: Dialog masih close setelah implementasi baru
**Solution**: Check console logs untuk melihat error details

#### 2. **Form Data Tidak Ter-load**
**Problem**: Form data tidak ter-load dengan benar
**Solution**: Check apakah `lineup` object memiliki data yang valid

#### 3. **Lineup Actresses Tidak Muncul**
**Problem**: Lineup actresses tidak muncul di form
**Solution**: Check apakah `actresses` array ter-load dengan benar

### Best Practices

#### 1. **State Management**
```typescript
// Selalu reset state sebelum setup
setError(null)
setShowForm(false)
setEditingLineup(null)

// Gunakan setTimeout untuk menghindari race condition
setTimeout(() => {
  // Setup logic
}, 100)
```

#### 2. **Error Handling**
```typescript
// Wrap semua logic dalam try-catch
try {
  // Main logic
} catch (error) {
  console.error('Error:', error)
  setError('User-friendly error message')
}
```

#### 3. **Debug Logging**
```typescript
// Log setiap step penting
console.log('Step 1: Starting...')
console.log('Step 2: Processing...')
console.log('Step 3: Complete')
```

#### 4. **Progressive Loading**
```typescript
// Load data dasar dulu
setFormData(basicFormData)
setShowForm(true)

// Load data tambahan di background
setTimeout(() => {
  // Load additional data
}, 300)
```

### Monitoring

#### 1. **Console Logs**
```javascript
// Check console untuk debug logs
console.log('=== EDIT LINEUP START ===')
console.log('=== EDIT LINEUP SETUP COMPLETE ===')
```

#### 2. **Error Tracking**
```javascript
// Check error state
console.log('Error state:', error)
console.log('Loading state:', loading)
```

#### 3. **Form State**
```javascript
// Check form state
console.log('Form data:', formData)
console.log('Show form:', showForm)
console.log('Editing lineup:', editingLineup)
```

---

**Last Updated:** December 2024  
**Version:** 1.0.0  
**Maintainer:** Development Team
