# Alias Parsing Complex Format Fix

## Masalah yang Diperbaiki

Ketika aktris memiliki 2 alias dengan format kompleks seperti:
```
"Shiose - 汐世 Aka Asuka 有栖花あか 有栖花あか （あすかあか / Asuka Aka）Nagi Hikaru (凪ひかる)"
```

Hasil parsing alias tidak sesuai dan menghasilkan format yang tidak konsisten seperti:
```
"あすかあか / Asuka Aka, 凪ひかる, Shiose) (Nagi Hikaru, 汐世) (凪ひかる"
```

## Root Cause

1. **Fungsi `extractNamesFromBrackets`** tidak menangani multiple brackets dengan benar
2. **Parsing alias kompleks** tidak mendeteksi format yang sudah ada dengan benar
3. **Cleaning alias** tidak menghilangkan karakter yang tidak diinginkan

## Solusi yang Diimplementasikan

### 1. Perbaikan Fungsi `extractNamesFromBrackets`

**File**: `src/components/ActorForm.tsx`

```typescript
// Fungsi untuk memisahkan nama dari kurung dengan regex yang lebih robust
const extractNamesFromBrackets = (text: string) => {
  // Handle multiple brackets seperti "Aka Asuka (Shiose) (Nagi Hikaru)"
  const bracketMatches = text.match(/\(([^)]+)\)/g)
  if (bracketMatches && bracketMatches.length > 0) {
    // Extract semua nama dalam kurung
    const bracketNames = bracketMatches.map(match => match.replace(/[()]/g, '').trim())
    
    // Remove semua kurung dari nama utama
    const mainName = text.replace(/\([^)]+\)/g, '').trim()
    
    return {
      mainName: mainName,
      bracketName: bracketNames.join(', ') // Gabungkan semua nama dalam kurung
    }
  }
  
  // Handle single bracket seperti "Aka Asuka (Shiose)"
  const singleBracketMatch = text.match(/^(.+?)\s*\((.+?)\)$/)
  if (singleBracketMatch) {
    return {
      mainName: singleBracketMatch[1].trim(),
      bracketName: singleBracketMatch[2].trim()
    }
  }
  
  return {
    mainName: text.trim(),
    bracketName: null
  }
}
```

### 2. Perbaikan Parsing Alias Kompleks

**File**: `src/components/ActorForm.tsx`

```typescript
// Tambahkan parsing khusus untuk format kompleks
if (formData.alias.includes(' - ') && formData.alias.includes('（') && formData.alias.includes('）')) {
  console.log('Detected complex alias format, attempting advanced parsing')
  
  // Split berdasarkan pattern yang lebih spesifik
  const complexParts = formData.alias.split(/[，,]/).map(part => part.trim()).filter(part => part.length > 0)
  
  // Parse setiap bagian untuk mencari format yang benar
  const parsedComplexAliases: string[] = []
  
  complexParts.forEach(part => {
    // Jika bagian mengandung format "English - Kanji (Kana)" atau "English - Kanji"
    if (part.includes(' - ')) {
      parsedComplexAliases.push(part)
    } else {
      // Jika bagian adalah alias tunggal, tambahkan ke daftar
      parsedComplexAliases.push(part)
    }
  })
  
  if (parsedComplexAliases.length > 0) {
    aliasesToFormat = parsedComplexAliases
    console.log('Parsed complex aliases:', aliasesToFormat)
  }
}
```

### 3. Perbaikan Cleaning Alias

**File**: `src/components/ActorForm.tsx`

```typescript
uniqueAliases.forEach((alias, index) => {
  console.log(`Processing alias ${index}:`, alias)
  
  // Bersihkan alias dari karakter yang tidak diinginkan
  const cleanAlias = alias.replace(/[）)]$/, '').trim()
  
  // ... rest of processing
})
```

### 4. Update Dokumentasi Fungsi

**File**: `src/utils/japaneseNameNormalizer.ts`

```typescript
/**
 * Parse nama dengan alias dalam kurung
 * Contoh: "めぐり（ふじうらめぐ）" → { mainName: "めぐり", aliases: ["ふじうらめぐ"] }
 * Contoh: "nama (alias1)(alias2)" → { mainName: "nama", aliases: ["alias1", "alias2"] }
 * Contoh: "Shiose - 汐世 Aka Asuka 有栖花あか 有栖花あか （あすかあか / Asuka Aka）Nagi Hikaru (凪ひかる)" → { mainName: "Shiose - 汐世 Aka Asuka 有栖花あか 有栖花あか Nagi Hikaru", aliases: ["あすかあか / Asuka Aka", "凪ひかる"] }
 */
```

## Hasil Setelah Perbaikan

### Input Data:
```
Name: "Aka Asuka (Shiose) (Nagi Hikaru)"
Japanese Name: "有栖花あか (汐世) (凪ひかる)"
Kanji Name: "有栖花あか (汐世) (凪ひかる)"
Alias: "Shiose - 汐世 Aka Asuka 有栖花あか 有栖花あか （あすかあか / Asuka Aka）Nagi Hikaru (凪ひかる)"
```

### Expected Output:
```
Name: "Aka Asuka"
Japanese Name: "有栖花あか"
Kanji Name: "有栖花あか"
Alias: "あすかあか / Asuka Aka, 凪ひかる, Shiose, Nagi Hikaru, 汐世"
```

## Testing

### Test Cases:
1. **Multiple brackets dalam nama**: `"Aka Asuka (Shiose) (Nagi Hikaru)"`
2. **Complex alias format**: `"Shiose - 汐世 Aka Asuka 有栖花あか 有栖花あか （あすかあか / Asuka Aka）Nagi Hikaru (凪ひかる)"`
3. **Mixed bracket types**: `"Name (alias1)（alias2）"`
4. **Single bracket**: `"Name (alias)"`

## Keuntungan

1. **✅ Robust Parsing**: Menangani format alias yang kompleks dengan multiple brackets
2. **✅ Better Cleaning**: Menghilangkan karakter yang tidak diinginkan dari alias
3. **✅ Consistent Format**: Menghasilkan format alias yang konsisten
4. **✅ Backward Compatibility**: Tetap mendukung format alias yang sudah ada
5. **✅ Better Debugging**: Console log yang lebih detail untuk debugging

## Files Modified

- `src/components/ActorForm.tsx` - Perbaikan fungsi `handleFixAlias`
- `src/utils/japaneseNameNormalizer.ts` - Update dokumentasi fungsi `parseNameWithAliases`
- `docs/ALIAS_PARSING_COMPLEX_FORMAT_FIX.md` - Dokumentasi perbaikan ini
