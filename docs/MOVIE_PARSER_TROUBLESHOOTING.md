# Movie Parser Troubleshooting Guide

## Quick Reference

### Common Error Messages
| Error | Cause | Solution |
|-------|-------|----------|
| `Cannot read properties of null (reading 'kanjiName')` | `missingData` is null | Use optional chaining `?.` |
| `Match not found` | No matching data in database | Check name format and database |
| `Invalid data format` | Input format is incorrect | Validate input before parsing |
| `API key not found` | Missing API configuration | Check Supabase secrets |

## Detailed Troubleshooting

### 1. Parsing Issues

#### Problem: Data tidak ter-parse dengan benar
**Symptoms:**
- Field kosong atau tidak lengkap
- Data ter-parse ke field yang salah
- Format data tidak sesuai

**Debug Steps:**
1. Check input format:
```typescript
console.log('Input data:', input)
console.log('Detected source:', detectSource(input))
```

2. Check parsing result:
```typescript
const parsedData = parseMovieData(input, source)
console.log('Parsed data:', parsedData)
```

3. Check field extraction:
```typescript
// Untuk JavDB
const titleMatch = input.match(/Title:\s*(.+)/)
console.log('Title match:', titleMatch)

// Untuk R18
const r18Data = JSON.parse(input)
console.log('R18 data:', r18Data)
```

**Common Fixes:**
- Update regex patterns untuk format baru
- Handle edge cases dalam data
- Validate input sebelum parsing

#### Problem: R18 JSON format tidak dikenali
**Symptoms:**
- Error saat parse JSON
- Data tidak ter-parse
- Field kosong

**Debug Steps:**
1. Check JSON validity:
```typescript
try {
  const data = JSON.parse(input)
  console.log('Valid JSON:', data)
} catch (error) {
  console.error('Invalid JSON:', error)
}
```

2. Check required fields:
```typescript
const requiredFields = ['title', 'actresses', 'director', 'studio']
const missingFields = requiredFields.filter(field => !data[field])
console.log('Missing fields:', missingFields)
```

**Common Fixes:**
- Validate JSON structure
- Handle missing fields gracefully
- Provide fallback values

### 2. Matching Issues

#### Problem: Tidak ada match yang ditemukan
**Symptoms:**
- "No match found" message
- Item tidak ter-match dengan database
- Data tidak tersimpan

**Debug Steps:**
1. Check master data availability:
```typescript
console.log('Master data count:', masterData.length)
console.log('Search name:', searchName)
```

2. Check matching algorithm:
```typescript
const matchResult = findJapaneseMatch(searchName, masterData)
console.log('Match result:', matchResult)
console.log('Match score:', matchResult.score)
```

3. Check name format:
```typescript
console.log('Name contains Japanese:', /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(name))
console.log('Name contains English:', /[A-Za-z]/.test(name))
```

**Common Fixes:**
- Improve matching algorithm
- Add more data to master database
- Handle different name formats
- Use fuzzy matching

#### Problem: Match yang salah dipilih
**Symptoms:**
- Item ter-match dengan data yang salah
- Score matching rendah
- User harus manual select

**Debug Steps:**
1. Check match scores:
```typescript
matches.forEach(match => {
  console.log(`Match: ${match.name}, Score: ${match.score}`)
})
```

2. Check match criteria:
```typescript
console.log('Exact match:', exactMatch)
console.log('Fuzzy match:', fuzzyMatch)
console.log('Romaji match:', romajiMatch)
```

**Common Fixes:**
- Adjust matching thresholds
- Improve scoring algorithm
- Add manual selection option
- Use multiple matching strategies

### 3. Conflict Resolution Issues

#### Problem: Tombol "Choose English Name" masih muncul
**Symptoms:**
- Tombol muncul meskipun sudah match
- User bingung dengan UI
- Tidak ada konflik yang perlu diselesaikan

**Debug Steps:**
1. Check conflict conditions:
```typescript
console.log('needsEnglishNameSelection:', item.needsEnglishNameSelection)
console.log('hasDifferentEnglishNames:', item.hasDifferentEnglishNames)
console.log('availableEnglishNames:', item.availableEnglishNames)
console.log('customEnglishName:', item.customEnglishName)
```

2. Check button visibility logic:
```typescript
const shouldShowButton = (
  item.needsEnglishNameSelection || 
  (item.availableEnglishNames && item.availableEnglishNames.length > 0) ||
  (typeKey === 'directors' && item.hasDifferentEnglishNames) ||
  (typeKey !== 'series' && typeKey !== 'directors' && item.needsConfirmation)
) && !item.customEnglishName

console.log('Should show button:', shouldShowButton)
```

**Common Fixes:**
- Update conflict detection logic
- Fix button visibility conditions
- Handle edge cases properly

#### Problem: "Data yang belum ada di database" masih muncul
**Symptoms:**
- Info muncul meskipun sudah match
- Data sudah ada di database
- UI membingungkan user

**Debug Steps:**
1. Check missing data detection:
```typescript
console.log('Missing data:', item.missingData)
console.log('Matched item:', item.matched)
console.log('Parsed name:', item.parsedName)
```

2. Check missing data logic:
```typescript
const missingData = detectMissingData(matchedItem, parsedName, type, parsedEnglishName, r18Data)
console.log('Detected missing data:', missingData)
```

**Common Fixes:**
- Fix missing data detection logic
- Update UI conditions
- Handle series auto-update properly

### 4. Save Issues

#### Problem: Data tidak tersimpan
**Symptoms:**
- Error saat save
- Data tidak masuk ke database
- API call gagal

**Debug Steps:**
1. Check data validation:
```typescript
console.log('Movie data:', movieData)
console.log('Validation errors:', validateMovieData(movieData))
```

2. Check API call:
```typescript
try {
  const result = await saveMovie(movieData)
  console.log('Save result:', result)
} catch (error) {
  console.error('Save error:', error)
}
```

3. Check database constraints:
```typescript
console.log('Required fields:', requiredFields)
console.log('Missing required fields:', missingRequiredFields)
```

**Common Fixes:**
- Fix data validation
- Handle API errors properly
- Check database constraints
- Add retry mechanism

#### Problem: Master data tidak ter-update
**Symptoms:**
- Missing data tidak ter-update
- Konflik tidak terselesaikan
- Data lama masih digunakan

**Debug Steps:**
1. Check update logic:
```typescript
console.log('Update data:', updateData)
console.log('Master data type:', masterDataType)
console.log('Item ID:', item.matched.id)
```

2. Check API response:
```typescript
const updateResult = await masterDataApi.updateExtendedWithSync(
  masterDataType,
  item.matched.id,
  updateData,
  accessToken
)
console.log('Update result:', updateResult)
```

**Common Fixes:**
- Fix update data structure
- Handle API errors
- Check permissions
- Add rollback mechanism

## Debug Tools

### Console Logging
```typescript
// Enable debug logging
const DEBUG = true

if (DEBUG) {
  console.log('Debug info:', {
    input: input,
    parsedData: parsedData,
    matchedData: matchedData,
    conflicts: conflicts
  })
}
```

### Debug UI Components
```typescript
// Debug info untuk English name selection
{(typeKey === 'directors' || typeKey === 'series') && (
  <div className="text-xs text-gray-500 mt-1">
    <div>showButton: {showButton ? 'true' : 'false'}</div>
    <div>needsEnglishNameSelection: {item.needsEnglishNameSelection ? 'true' : 'false'}</div>
    <div>hasDifferentEnglishNames: {item.hasDifferentEnglishNames ? 'true' : 'false'}</div>
    <div>availableEnglishNames: {item.availableEnglishNames?.length || 0}</div>
    <div>customEnglishName: {item.customEnglishName || 'none'}</div>
  </div>
)}
```

### Performance Monitoring
```typescript
// Monitor parsing performance
const startTime = performance.now()
const result = parseMovieData(input, source)
const endTime = performance.now()
console.log(`Parsing took ${endTime - startTime} milliseconds`)
```

## Testing Checklist

### Before Release
- [ ] Test dengan berbagai format input
- [ ] Test dengan data yang tidak lengkap
- [ ] Test dengan konflik nama
- [ ] Test dengan database kosong
- [ ] Test dengan network error
- [ ] Test dengan API error
- [ ] Test dengan data besar
- [ ] Test dengan concurrent users

### Regression Testing
- [ ] Test fix untuk null reference errors
- [ ] Test fix untuk button visibility
- [ ] Test fix untuk missing data display
- [ ] Test fix untuk conflict resolution
- [ ] Test fix untuk save functionality

## Common Patterns

### Error Handling Pattern
```typescript
try {
  const result = await riskyOperation()
  return result
} catch (error) {
  console.error('Operation failed:', error)
  // Handle error gracefully
  return fallbackValue
}
```

### Null Safety Pattern
```typescript
// Always use optional chaining for potentially null objects
if (item.missingData?.kanjiName) {
  updateData.kanjiName = item.missingData.kanjiName
}
```

### Conditional Rendering Pattern
```typescript
// Use clear conditions for UI elements
{shouldShowElement && (
  <Element />
)}
```

### Data Validation Pattern
```typescript
// Validate data before processing
if (!isValidData(data)) {
  throw new Error('Invalid data format')
}
```

---

*Gunakan guide ini untuk troubleshooting masalah umum dalam Movie Parser. Update guide ini ketika menemukan masalah baru atau solusi yang lebih baik.*
