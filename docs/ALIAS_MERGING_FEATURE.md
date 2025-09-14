# Alias Merging Feature

## Deskripsi

Fitur ini menangani proses penggabungan alias baru dengan alias yang sudah ada di database ketika melakukan parsing data film. Sebelumnya, jika field alias aktris sudah memiliki isi, alias baru akan menggantikan alias yang sudah ada. Sekarang sistem akan menggabungkan alias baru dengan alias yang sudah ada tanpa menghilangkan data yang sudah tersimpan.

## Masalah yang Diperbaiki

1. **Kehilangan alias existing**: Sebelumnya, ketika parsing data baru yang memiliki alias, alias yang sudah ada di database akan digantikan dengan alias baru
2. **Duplikasi alias**: Tidak ada pengecekan duplikasi alias saat menggabungkan
3. **Case sensitivity**: Alias dengan huruf besar/kecil yang berbeda dianggap sebagai alias berbeda
4. **Bug: Alias tidak masuk ke field yang sudah ada isinya**: Ketika aktris sudah memiliki alias, alias baru dari R18 tidak akan diproses karena kondisi `!matchedItem.alias`

## Solusi yang Diimplementasikan

### 1. **Fungsi Utility Alias Merger**

File: `src/utils/aliasMerger.ts`

#### Fungsi Utama:
- `mergeAlias(existingAlias, newAlias)`: Menggabungkan alias existing dengan alias baru
- `aliasExists(existingAlias, aliasToCheck)`: Mengecek apakah alias sudah ada
- `removeAlias(existingAlias, aliasToRemove)`: Menghapus alias tertentu dari daftar

#### Fitur:
- **Case-insensitive**: Alias dengan huruf besar/kecil berbeda dianggap sama
- **Duplikasi removal**: Otomatis menghilangkan alias yang duplikat
- **Whitespace handling**: Otomatis trim whitespace dari alias
- **Null/undefined handling**: Menangani nilai null dan undefined dengan aman

### 2. **Update MovieDataParser**

File: `src/components/MovieDataParser.tsx`

#### Perubahan:
- Menggunakan fungsi `mergeAlias` untuk menggabungkan alias baru dengan alias existing
- Menambahkan logging untuk tracking proses merging
- Mempertahankan alias existing jika tidak ada alias baru

#### Kode:
```typescript
// Merge new alias with existing alias if it exists
if (item.matched.alias) {
  const { mergeAlias } = await import('../utils/aliasMerger')
  updateData.alias = mergeAlias(item.matched.alias, newAlias)
  console.log(`Merged alias for ${category}[${i}]: existing="${item.matched.alias}", new="${newAlias}", result="${updateData.alias}"`)
} else {
  updateData.alias = newAlias
}
```

### 3. **Update Master Data API**

File: `src/supabase/functions/server/updateMasterDataWithSync.tsx`

#### Perubahan:
- Mempertahankan alias existing jika alias baru kosong atau null
- Menggunakan alias baru jika tersedia

#### Kode:
```typescript
alias: alias?.trim() || (alias === null || alias === '' ? undefined : existingItem.alias),
```

### 4. **Perbaikan Bug: Alias Tidak Masuk ke Field yang Sudah Ada Isinya**

File: `src/utils/movieDataParser.ts`

#### Masalah:
Kondisi untuk menambahkan alias ke `missingData` adalah:
```typescript
if (normalizedR18Data.alias && !matchedItem.alias) {
  missingData.alias = normalizedR18Data.alias
}
```

Kondisi `!matchedItem.alias` berarti alias hanya akan ditambahkan jika aktris **tidak memiliki alias sama sekali**. Jika aktris sudah memiliki alias, maka `missingData.alias` tidak akan dibuat, sehingga proses merging tidak akan berjalan.

#### Solusi:
Mengubah kondisi untuk selalu menyertakan alias dari data R18 jika tersedia:
```typescript
// Always include alias from R18 data if available, regardless of existing alias
if (normalizedR18Data.alias) {
  missingData.alias = normalizedR18Data.alias
}
```

#### Impact:
- ✅ Alias dari R18 data akan selalu diproses untuk merging
- ✅ Tidak ada kehilangan alias existing
- ✅ Duplikasi alias akan dihilangkan otomatis
- ✅ Case-insensitive duplicate detection tetap berfungsi

## Contoh Penggunaan

### Skenario 1: Alias Existing + Alias Baru
```
Existing: "Fujimegu - フジメグ, Meguri - めぐり"
New: "Megurin - めぐりん, Sekai no Fujimegu - 世界のフジメグ"
Result: "Fujimegu - フジメグ, Meguri - めぐり, Megurin - めぐりん, Sekai no Fujimegu - 世界のフジメグ"
```

### Skenario 2: Duplikasi Alias
```
Existing: "Fujimegu - フジメグ, Meguri - めぐり"
New: "Meguri - めぐり, New Alias"
Result: "Fujimegu - フジメグ, Meguri - めぐり, New Alias"
```

### Skenario 3: Case Insensitive Duplikasi
```
Existing: "Fujimegu - フジメグ"
New: "fujimegu - フジメグ, New Alias"
Result: "Fujimegu - フジメグ, New Alias"
```

### Skenario 4: Bug Fix - Alias Tidak Masuk ke Field yang Sudah Ada Isinya
```
Sebelum Perbaikan:
Aktris di DB: "Meguri" (alias: "Fujimegu - フジメグ, Meguri - めぐり")
R18 Data: "Megurin - めぐりん, Sekai no Fujimegu - 世界のフジメグ"
Result: Alias tidak berubah karena !matchedItem.alias = false

Sesudah Perbaikan:
Aktris di DB: "Meguri" (alias: "Fujimegu - フジメグ, Meguri - めぐり")
R18 Data: "Megurin - めぐりん, Sekai no Fujimegu - 世界のフジメグ"
Result: "Fujimegu - フジメグ, Meguri - めぐり, Megurin - めぐりん, Sekai no Fujimegu - 世界のフジメグ"
```

## Testing

File test: `src/utils/__tests__/aliasMerger.test.ts`

Test mencakup:
- ✅ Merging alias baru dengan existing
- ✅ Penghapusan duplikasi
- ✅ Case-insensitive handling
- ✅ Null/undefined handling
- ✅ Whitespace trimming
- ✅ Filtering empty aliases

## Keuntungan

1. **Data Preservation**: Alias yang sudah ada tidak akan hilang
2. **No Duplicates**: Otomatis menghilangkan alias yang duplikat
3. **Case Insensitive**: Menangani perbedaan huruf besar/kecil
4. **Robust**: Menangani edge cases seperti null/undefined
5. **Maintainable**: Kode terstruktur dan mudah dipelihara

## Implementasi

Fitur ini sudah diimplementasikan dan siap digunakan. Ketika melakukan parsing data film dengan alias, sistem akan otomatis menggabungkan alias baru dengan alias yang sudah ada di database tanpa menghilangkan data yang sudah tersimpan.
