# Alias Merging Fix

## Masalah yang Diperbaiki

Ketika user melakukan parsing data R18 dan aktris sudah memiliki alias di database, alias baru dari R18 tidak akan masuk ke field alias yang sudah ada isinya.

## Root Cause

Di file `src/utils/movieDataParser.ts`, kondisi untuk menambahkan alias ke `missingData` adalah:

```typescript
// Check for missing alias (prioritize R18 aliases)
if (normalizedR18Data.alias && !matchedItem.alias) {
  missingData.alias = normalizedR18Data.alias
}
```

Kondisi `!matchedItem.alias` berarti alias hanya akan ditambahkan ke `missingData` jika aktris **tidak memiliki alias sama sekali**. Jika aktris sudah memiliki alias, maka `missingData.alias` tidak akan dibuat, sehingga proses merging tidak akan berjalan.

## Solusi

Mengubah kondisi untuk selalu menyertakan alias dari data R18 jika tersedia, terlepas dari apakah aktris sudah memiliki alias atau tidak:

```typescript
// Check for missing alias (prioritize R18 aliases)
// Always include alias from R18 data if available, regardless of existing alias
if (normalizedR18Data.alias) {
  missingData.alias = normalizedR18Data.alias
}
```

## Perubahan yang Dibuat

File: `src/utils/movieDataParser.ts`
- Baris 1153-1156: Menghapus kondisi `!matchedItem.alias`
- Sekarang alias dari R18 data akan selalu disertakan dalam `missingData` jika tersedia

## Cara Kerja Setelah Perbaikan

1. **Parsing R18 Data**: Ketika parsing data R18, alias akan selalu diekstrak dan disertakan dalam `missingData`
2. **Alias Merging**: Di `MovieDataParser.tsx`, fungsi `mergeAlias` akan menggabungkan alias baru dengan alias existing
3. **Database Update**: Alias yang sudah digabungkan akan disimpan ke database

## Contoh Skenario

### Sebelum Perbaikan:
```
Aktris di DB: "Meguri" (alias: "Fujimegu - フジメグ, Meguri - めぐり")
R18 Data: "Megurin - めぐりん, Sekai no Fujimegu - 世界のフジメグ"
Result: Alias tidak berubah karena !matchedItem.alias = false
```

### Sesudah Perbaikan:
```
Aktris di DB: "Meguri" (alias: "Fujimegu - フジメグ, Meguri - めぐり")
R18 Data: "Megurin - めぐりん, Sekai no Fujimegu - 世界のフジメグ"
Result: "Fujimegu - フジメグ, Meguri - めぐり, Megurin - めぐりん, Sekai no Fujimegu - 世界のフジメグ"
```

## Testing

Untuk menguji perbaikan ini:

1. Pilih aktris yang sudah memiliki alias di database
2. Parse data R18 yang memiliki alias untuk aktris tersebut
3. Klik "Save Movie"
4. Verifikasi bahwa alias baru telah digabungkan dengan alias existing

## Impact

- ✅ Alias dari R18 data akan selalu diproses untuk merging
- ✅ Tidak ada kehilangan alias existing
- ✅ Duplikasi alias akan dihilangkan otomatis
- ✅ Case-insensitive duplicate detection tetap berfungsi
