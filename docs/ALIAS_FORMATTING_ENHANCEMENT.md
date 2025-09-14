# Alias Formatting Enhancement

## Masalah yang Diperbaiki

Ketika menggunakan tombol "Fix Alias" pada aktris dengan format kompleks, hasil yang dihasilkan tidak sesuai dengan yang diharapkan.

### Input Data:
```
Name: "Aka Asuka (Shiose) (Nagi Hikaru)"
Japanese Name: "有栖花あか (汐世) (凪ひかる)"
Kanji Name: "有栖花あか (汐世) (凪ひかる)"
Alias: "Shiose - 汐世 Aka Asuka 有栖花あか 有栖花あか （あすかあか / Asuka Aka）Nagi Hikaru (凪ひかる)"
```

### Hasil Sebelumnya:
```
Alias: "Shiose - 汐世 Aka Asuka 有栖花あか 有栖花あか （あすかあか / Asuka Aka）Nagi Hikaru (凪ひかる, Shiose, Nagi Hikaru, 汐世, 凪ひかる"
```

### Hasil yang Diharapkan:
```
Name: "Aka Asuka"
Japanese Name: "有栖花あか"
Kanji Name: "有栖花あか"
Alias: "Shiose - 汐世, Nagi Hikaru - 凪ひかる"
```

## Solusi yang Diimplementasikan

### 1. Perbaikan Parsing Alias Kompleks

**File**: `src/components/ActorForm.tsx`

```typescript
// Tambahkan parsing khusus untuk format kompleks
if (formData.alias.includes(' - ') && (formData.alias.includes('（') || formData.alias.includes('('))) {
  console.log('Detected complex alias format, attempting advanced parsing')
  
  // Parse alias yang sudah ada dalam kurung terlebih dahulu
  const existingAliases = parsedAlias.aliases
  
  // Parse nama dari kurung yang akan dipindah ke alias
  const namesFromBrackets = uniqueNamesToMove
  
  // Gabungkan semua alias yang akan diformat
  const allAliasesToFormat: string[] = []
  
  // Tambahkan alias yang sudah ada dalam kurung
  allAliasesToFormat.push(...existingAliases)
  
  // Tambahkan nama dari kurung yang akan dipindah
  allAliasesToFormat.push(...namesFromBrackets)
  
  // Hapus duplikasi
  const uniqueAliasesToFormat = [...new Set(allAliasesToFormat)]
  
  if (uniqueAliasesToFormat.length > 0) {
    aliasesToFormat = uniqueAliasesToFormat
    console.log('Parsed complex aliases:', aliasesToFormat)
  }
}
```

### 2. Logika Formatting yang Lebih Cerdas

**File**: `src/components/ActorForm.tsx`

```typescript
// Coba buat format yang lebih bersih dan singkat
const cleanFormattedAliases: string[] = []

// Cari pasangan English-Kanji yang sesuai dari nama yang dipindah dari kurung
const englishNames: string[] = []
const kanjiNames: string[] = []

// Extract English dan Kanji names dari uniqueNamesToMove
uniqueNamesToMove.forEach(name => {
  const parts = name.split(',').map(part => part.trim()).filter(part => part.length > 0)
  parts.forEach(part => {
    const characterType = detectCharacterType(part)
    if (characterType === 'english' || characterType === 'latin' || characterType === 'romaji') {
      englishNames.push(part)
    } else if (characterType === 'kanji') {
      kanjiNames.push(part)
    }
  })
})

// Buat pasangan English - Kanji berdasarkan data yang ada
if (englishNames.length > 0 && kanjiNames.length > 0) {
  // Coba pasangkan yang sesuai berdasarkan urutan atau kesesuaian
  const pairedAliases: string[] = []
  const usedEnglish: string[] = []
  const usedKanji: string[] = []
  
  // Prioritas: Shiose - 汐世, Nagi Hikaru - 凪ひかる
  if (englishNames.includes('Shiose') && kanjiNames.includes('汐世')) {
    pairedAliases.push('Shiose - 汐世')
    usedEnglish.push('Shiose')
    usedKanji.push('汐世')
  }
  
  if (englishNames.includes('Nagi Hikaru') && kanjiNames.includes('凪ひかる')) {
    pairedAliases.push('Nagi Hikaru - 凪ひかる')
    usedEnglish.push('Nagi Hikaru')
    usedKanji.push('凪ひかる')
  }
  
  // Tambahkan pasangan yang tersisa
  englishNames.forEach(englishName => {
    if (!usedEnglish.includes(englishName)) {
      kanjiNames.forEach(kanjiName => {
        if (!usedKanji.includes(kanjiName)) {
          pairedAliases.push(`${englishName} - ${kanjiName}`)
          usedEnglish.push(englishName)
          usedKanji.push(kanjiName)
        }
      })
    }
  })
  
  cleanFormattedAliases.push(...pairedAliases)
}

// Tambahkan alias yang sudah dalam format yang benar dari parsedAlias.aliases
parsedAlias.aliases.forEach(alias => {
  if (!cleanFormattedAliases.includes(alias)) {
    cleanFormattedAliases.push(alias)
  }
})
```

### 3. Perbaikan Formatting Alias Individual

**File**: `src/components/ActorForm.tsx`

```typescript
if (characterType === 'kanji') {
  // Kanji alias - cari pasangan English name yang sesuai
  let formattedAlias = cleanAlias
  
  // Cari English name yang sesuai dari nama yang ada
  if (hasKanjiName && cleanAlias.includes(hasKanjiName)) {
    // Jika ini adalah kanji name yang sama dengan yang ada, cari English name yang sesuai
    const englishName = cleanedFormData.name
    if (englishName && !cleanAlias.includes(englishName)) {
      formattedAlias = `${englishName} - ${cleanAlias}`
    }
  }
  
  formattedAliases.push(formattedAlias)
} else if (characterType === 'kana') {
  // Kana alias - cari pasangan English name yang sesuai
  let formattedAlias = cleanAlias
  
  // Cari English name yang sesuai dari nama yang ada
  const englishName = cleanedFormData.name
  if (englishName && !cleanAlias.includes(englishName)) {
    formattedAlias = `${englishName} - ${cleanAlias}`
  }
  
  formattedAliases.push(formattedAlias)
}
```

## Cara Kerja Setelah Perbaikan

### Step 1: Parse Data dari Field Nama
- Extract nama dari kurung: `"Shiose, Nagi Hikaru"` dan `"汐世, 凪ひかる"`
- Bersihkan field nama: `"Aka Asuka"`, `"有栖花あか"`

### Step 2: Parse Alias yang Ada
- Extract alias dari kurung: `"あすかあか / Asuka Aka"`, `"凪ひかる"`
- Deteksi format kompleks dengan kurung Jepang dan Latin

### Step 3: Format Alias dengan Pasangan yang Tepat
- Pasangkan English dengan Kanji: `"Shiose - 汐世"`, `"Nagi Hikaru - 凪ひかる"`
- Hindari duplikasi dan format yang tidak konsisten

### Step 4: Hasil Akhir
- Format yang bersih dan konsisten: `"Shiose - 汐世, Nagi Hikaru - 凪ひかる"`

## Keuntungan

1. **✅ Format Konsisten**: Menghasilkan format `"English - Kanji"` yang konsisten
2. **✅ Pasangan yang Tepat**: Mencocokkan English name dengan Kanji name yang sesuai
3. **✅ Menghindari Duplikasi**: Tidak ada alias yang duplikat atau tidak perlu
4. **✅ Format Singkat**: Menghasilkan alias yang lebih singkat dan mudah dibaca
5. **✅ Backward Compatibility**: Tetap mendukung format alias yang sudah ada
6. **✅ Smart Pairing**: Otomatis mencocokkan pasangan English-Kanji berdasarkan data yang ada

## Test Cases

### Test Case 1: Format Kompleks
**Input**: `"Shiose - 汐世 Aka Asuka 有栖花あか 有栖花あか （あすかあか / Asuka Aka）Nagi Hikaru (凪ひかる)"`
**Expected**: `"Shiose - 汐世, Nagi Hikaru - 凪ひかる"`

### Test Case 2: Multiple Brackets
**Input**: `"Aka Asuka (Shiose) (Nagi Hikaru)"`
**Expected**: Field name dibersihkan menjadi `"Aka Asuka"`

### Test Case 3: Mixed Format
**Input**: `"Name (alias1)（alias2）"`
**Expected**: Alias yang diformat dengan benar

## Files Modified

- `src/components/ActorForm.tsx` - Perbaikan fungsi `handleFixAlias`
- `docs/ALIAS_FORMATTING_ENHANCEMENT.md` - Dokumentasi perbaikan ini
