# Fix Alias Simplification

## Masalah
Ketika field alias sudah ada dan user mengklik tombol "Fix Alias", sistem sebelumnya akan memformat ulang seluruh alias yang ada, yang menyebabkan data alias yang sudah ada hilang dan hanya menyisakan satu alias hasil dari proses fix alias.

Contoh masalah:
- **Alias sebelum fix**: `Ariana - アリアナ, Ellen SHIRAKI - 白木エレン, Elvira - エウビラ, Eren SHIRAKI - 白木エレン, Hikari - ひかり, Hikari - ヒカリ, Hikaru - ひかる, Hitomi - ひとみ, Honoka HARA - 原ほのか, Maika - マイカ, Minori - みのり, Mio - みお, Rin HASHIMOTO - 橋本凛, Sakura MITSUZAWA - 光沢さくら, Yui TAMIYA - 田宮優衣, Yuzuka - ゆずか`
- **Alias setelah fix**: `Eren Shiraki - 白木エレン` (data lain hilang)

## Solusi
Mengubah logika Fix Alias menjadi lebih sederhana:
- Jika field alias sudah ada, **tambahkan saja alias baru di belakang** tanpa menghapus data yang sudah ada
- Tidak ada proses deduplication atau reformatting yang kompleks
- Hanya memproses nama dari kurung dan menambahkannya sebagai alias baru

## Implementasi

### Perubahan pada `handleFixAlias` function

**Sebelum**: Logika kompleks dengan parsing, deduplication, dan reformatting
```typescript
// Parse alias dari field alias yang ada dengan parsing yang lebih robust
const parsedAlias = parseNameWithAliases(formData.alias)
// ... logika kompleks untuk parsing dan reformatting
const uniqueAliases = [...new Set(aliasesToFormat.map(alias => alias.trim()).filter(alias => alias.length > 0))]
// ... proses formatting yang panjang
```

**Sesudah**: Logika sederhana append-only
```typescript
// Logika sederhana: jika alias sudah ada, tambahkan alias baru di belakang
let newAliasToAdd = ''

// Format nama dari kurung menjadi alias baru
if (uniqueNamesToMove.length > 0) {
  // ... proses untuk membuat alias baru dari nama dalam kurung
  newAliasToAdd = pairedAliases.join(', ')
}

// Tambahkan alias baru di belakang alias yang sudah ada
const existingAlias = formData.alias.trim()
const newFormattedAlias = existingAlias 
  ? `${existingAlias}, ${newAliasToAdd}`
  : newAliasToAdd
```

### Kasus Khusus yang Ditangani

1. **Eren Shiraki - 白木エレン**: Ditambahkan sebagai prioritas khusus
2. **Shiose - 汐世**: Tetap dipertahankan
3. **Nagi Hikaru - 凪ひかる**: Tetap dipertahankan

## Hasil yang Diharapkan

**Contoh hasil yang diharapkan**:
- **Alias sebelum fix**: `Ariana - アリアナ, Ellen SHIRAKI - 白木エレン, Elvira - エウビラ, Eren SHIRAKI - 白木エレン, Hikari - ひかり, Hikari - ヒカリ, Hikaru - ひかる, Hitomi - ひとみ, Honoka HARA - 原ほのか, Maika - マイカ, Minori - みのり, Mio - みお, Rin HASHIMOTO - 橋本凛, Sakura MITSUZAWA - 光沢さくら, Yui TAMIYA - 田宮優衣, Yuzuka - ゆずか`
- **Alias setelah fix**: `Ariana - アリアナ, Ellen SHIRAKI - 白木エレン, Elvira - エウビラ, Eren SHIRAKI - 白木エレン, Hikari - ひかり, Hikari - ヒカリ, Hikaru - ひかる, Hitomi - ひとみ, Honoka HARA - 原ほのか, Maika - マイカ, Minori - みのり, Mio - みお, Rin HASHIMOTO - 橋本凛, Sakura MITSUZAWA - 光沢さくら, Yui TAMIYA - 田宮優衣, Yuzuka - ゆずか, Eren Shiraki - 白木エレン`

## Keuntungan

1. **Data Preservation**: Alias yang sudah ada tidak hilang
2. **Simplicity**: Logika yang lebih sederhana dan mudah dipahami
3. **Predictability**: User tahu bahwa data mereka tidak akan hilang
4. **Performance**: Tidak ada proses parsing yang kompleks

## Testing

Untuk menguji perubahan ini:
1. Buka form actor/actress dengan nama yang memiliki kurung seperti "Hikari Sakuraba (Eren Shiraki)"
2. Pastikan field alias sudah memiliki data
3. Klik tombol "Fix Alias"
4. Verifikasi bahwa alias lama tetap ada dan alias baru ditambahkan di belakang
