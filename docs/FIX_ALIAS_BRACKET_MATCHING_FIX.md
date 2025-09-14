# Fix Alias Bracket Matching Fix

## Masalah yang Diperbaiki

Ketika menggunakan tombol "Fix Alias" pada aktris dengan format kompleks dimana ada nama dalam kurung di kedua field (English dan Japanese), hasil yang dihasilkan tidak sesuai dengan yang diharapkan.

### Kasus Spesifik:
**Input Data:**
- Name: "Ai Yoneyama (Yui Onuki)"
- Japanese Name: "米山愛 (大貫唯)"

**Hasil Sebelumnya:**
```
Alias: "Ai Yoneyama - 米山愛, Yui Onuki, 大貫唯"
```

**Hasil yang Diharapkan:**
```
Alias: "Yui Onuki - 大貫唯"
```

## Analisis Masalah

1. **Logika Fix Alias sebelumnya** mengambil nama dari kurung dan mencoba memformatnya, tapi tidak mempertimbangkan bahwa nama dalam kurung seharusnya menjadi alias utama, bukan nama utama.

2. **Fungsi `extractNamesFromBrackets`** memisahkan nama utama dan nama dalam kurung, tapi kemudian sistem masih menggunakan nama utama untuk membuat alias.

3. **Cross-field matching** tidak bekerja dengan benar untuk kasus ini karena sistem tidak memahami bahwa `Yui Onuki` (dari kurung English) seharusnya dipasangkan dengan `大貫唯` (dari kurung Japanese).

## Solusi yang Diimplementasikan

### 1. Deteksi Kasus Khusus Bracket Matching

**File**: `src/components/ActorForm.tsx`

```typescript
// PERBAIKAN: Cek apakah kita perlu menggunakan nama dalam kurung sebagai alias utama
// Kasus khusus: jika ada nama dalam kurung di kedua field (English dan Japanese),
// gunakan nama dalam kurung sebagai alias utama, bukan nama utama
const hasEnglishBrackets = formData.name.includes('(') && formData.name.includes(')')
const hasJapaneseBrackets = formData.jpname.includes('(') && formData.jpname.includes(')')

let newAliasToAdd = ''

if (hasEnglishBrackets && hasJapaneseBrackets) {
  console.log('Detected brackets in both English and Japanese fields - using bracket names as primary aliases')
  
  // Ambil nama dari kurung English dan Japanese
  const englishBracketNames = nameExtracted.bracketName ? nameExtracted.bracketName.split(',').map(n => n.trim()) : []
  const japaneseBracketNames = jpnameExtracted.bracketName ? jpnameExtracted.bracketName.split(',').map(n => n.trim()) : []
  
  console.log('English bracket names:', englishBracketNames)
  console.log('Japanese bracket names:', japaneseBracketNames)
  
  // Coba pasangkan berdasarkan urutan atau kesesuaian
  const pairedAliases: string[] = []
  
  // Pasangkan berdasarkan urutan (index yang sama)
  const maxLength = Math.max(englishBracketNames.length, japaneseBracketNames.length)
  for (let i = 0; i < maxLength; i++) {
    const englishName = englishBracketNames[i]
    const japaneseName = japaneseBracketNames[i]
    
    if (englishName && japaneseName) {
      pairedAliases.push(`${englishName} - ${japaneseName}`)
    } else if (englishName) {
      pairedAliases.push(englishName)
    } else if (japaneseName) {
      pairedAliases.push(japaneseName)
    }
  }
  
  if (pairedAliases.length > 0) {
    newAliasToAdd = pairedAliases.join(', ')
    console.log('Created paired aliases from brackets:', newAliasToAdd)
  }
} else {
  // Logika lama untuk kasus lain...
}
```

### 2. Logika Append Alias

**Perubahan pada Logika Update Alias:**

```typescript
// Untuk bracket matching, tambahkan alias baru di belakang alias yang sudah ada
const existingAlias = formData.alias.trim()
const finalAlias = existingAlias 
  ? `${existingAlias}, ${newAliasToAdd}`
  : newAliasToAdd

console.log('=== BRACKET MATCHING ALIAS UPDATE ===')
console.log('existingAlias:', existingAlias)
console.log('newAliasToAdd:', newAliasToAdd)
console.log('finalAlias:', finalAlias)
```

**Penjelasan:**
- Bracket matching sekarang menggunakan logika **append** (tambahkan di belakang)
- Tidak mengganti alias yang sudah ada, melainkan menambahkan alias baru
- Format: `"alias_lama, alias_baru"`

### 2. Prioritas Logika yang Diperbaiki

**Perubahan pada Logika Existing:**

```typescript
// Buat pasangan English - Kanji berdasarkan data yang ada (hanya jika belum ada alias dari bracket matching)
if (!newAliasToAdd && englishNames.length > 0 && kanjiNames.length > 0) {
  // ... logika existing untuk pasangan berdasarkan karakter type
}
```

**Penjelasan:**
- Logika bracket matching memiliki prioritas tertinggi
- Jika bracket matching berhasil membuat alias, logika existing tidak akan dijalankan
- Ini mencegah konflik dan memastikan hasil yang konsisten

## Cara Kerja Perbaikan

### 1. Deteksi Kondisi
- Sistem mendeteksi apakah ada kurung `()` di field Name dan Japanese Name
- Jika kedua field memiliki kurung, sistem akan menggunakan logika bracket matching

### 2. Ekstraksi Nama dari Kurung
- Menggunakan fungsi `extractNamesFromBrackets` yang sudah ada
- Memisahkan nama dalam kurung dari nama utama
- Mendukung multiple brackets seperti "Name (alias1) (alias2)"

### 3. Cross-Field Matching
- Mengambil nama dari kurung English field: `["Yui Onuki"]`
- Mengambil nama dari kurung Japanese field: `["大貫唯"]`
- Memasangkan berdasarkan urutan index: `Yui Onuki - 大貫唯`

### 4. Format Output
- Format: `"English Name - Japanese Name"`
- Mendukung multiple aliases: `"Alias1 - エイリアス1, Alias2 - エイリアス2"`

## Contoh Penggunaan

### Kasus 1: Single Bracket Match
**Input:**
- Name: "Ai Yoneyama (Yui Onuki)"
- Japanese Name: "米山愛 (大貫唯)"

**Output:**
```
Alias: "Yui Onuki - 大貫唯"
```

### Kasus 2: Multiple Brackets
**Input:**
- Name: "Aka Asuka (Shiose) (Nagi Hikaru)"
- Japanese Name: "有栖花あか (汐世) (凪ひかる)"

**Output:**
```
Name: "Aka Asuka"
Japanese Name: "有栖花あか"
Alias: "Shiose - 汐世, Nagi Hikaru - 凪ひかる"
```

**Penjelasan:**
- Sistem mendeteksi multiple brackets di kedua field
- Mengambil nama dari kurung: `["Shiose", "Nagi Hikaru"]` dan `["汐世", "凪ひかる"]`
- Memasangkan berdasarkan urutan index: `Shiose - 汐世` dan `Nagi Hikaru - 凪ひかる`
- Menggabungkan dengan koma: `"Shiose - 汐世, Nagi Hikaru - 凪ひかる"`

### Kasus 3: Mismatched Brackets
**Input:**
- Name: "Ameri Ichinose (Chris Erika)"
- Japanese Name: "一ノ瀬アメリ"

**Output:**
```
Alias: "Chris Erika" (fallback ke logika existing)
```

### Kasus 4: Asymmetric Brackets
**Input:**
- Name: "Aka Asuka (Shiose) (Nagi Hikaru)"
- Japanese Name: "有栖花あか (汐世)"

**Output:**
```
Name: "Aka Asuka"
Japanese Name: "有栖花あか"
Alias: "Shiose - 汐世, Nagi Hikaru"
```

**Penjelasan:**
- Sistem mendeteksi multiple brackets di English field: `["Shiose", "Nagi Hikaru"]`
- Sistem mendeteksi single bracket di Japanese field: `["汐世"]`
- Memasangkan yang bisa dipasangkan: `Shiose - 汐世`
- Menambahkan yang tidak bisa dipasangkan: `Nagi Hikaru`

### Kasus 5: Alias Sudah Ada (Append Mode)
**Input:**
- Name: "Ai Yoneyama (Yui Onuki)"
- Japanese Name: "米山愛 (大貫唯)"
- Alias: "Existing Alias - 既存エイリアス"

**Output:**
```
Name: "Ai Yoneyama"
Japanese Name: "米山愛"
Alias: "Existing Alias - 既存エイリアス, Yui Onuki - 大貫唯"
```

**Penjelasan:**
- Sistem mendeteksi bracket matching
- Mengambil alias dari kurung: `"Yui Onuki - 大貫唯"`
- **Menambahkan** di belakang alias yang sudah ada (tidak mengganti)
- Format: `"alias_lama, alias_baru"`

## Testing

Untuk menguji perbaikan ini:

1. Buka dialog edit aktris
2. Set field Name: "Ai Yoneyama (Yui Onuki)"
3. Set field Japanese Name: "米山愛 (大貫唯)"
4. Klik tombol "Fix Alias"
5. Verifikasi hasil: "Yui Onuki - 大貫唯"

## Catatan Teknis

- Perbaikan ini tidak mengubah logika existing untuk kasus lain
- Bracket matching hanya aktif jika kedua field memiliki kurung
- Logging ditambahkan untuk debugging dan monitoring
- Kompatibel dengan semua format bracket yang sudah didukung
