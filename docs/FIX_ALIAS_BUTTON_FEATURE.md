# Fix Alias Button Feature

## Overview
Fitur tombol "Fix Alias" memungkinkan pengguna untuk memformat ulang field alias yang sudah ada dengan struktur yang benar, terutama untuk data yang sudah ada sebelum fitur parsing alias ditambahkan.

## Lokasi
Tombol "Fix Alias" berada di tab "Informasi Dasar" pada dialog edit aktris/aktor, tepat di sebelah label "Alias / Nama Panggung".

## Cara Kerja

### 1. Deteksi Status Alias
- **Alias Kosong**: Generate alias dari nama yang tersedia di form
- **Alias Ada**: Format ulang alias yang sudah ada

### 2. Generate Alias (Ketika Kosong)
- Menggunakan nama yang tersedia: Name, Japanese Name, Kanji Name, Kana Name
- Prioritas: English Name > Kanji Name > Kana Name
- Format: `"English Name - Kanji Name (Kana Name)"`

### 3. Format Ulang (Ketika Ada)
- Menggunakan fungsi `parseNameWithAliases()` untuk memparse alias yang ada dalam kurung
- Mendukung kurung Latin `()` dan kurung Jepang `（）`
- Menggunakan fungsi `detectCharacterType()` untuk mendeteksi jenis karakter
- Format yang dihasilkan: `"English Alias - Kanji Alias (Kana Alias)"`

### 4. Update Form
- Mengupdate field alias dengan format yang sudah diperbaiki
- Menampilkan toast notification dengan hasil formatting

## Contoh Penggunaan

### Kasus 1: Alias Kosong (Generate dari Nama)
**Form Data:**
- Name: "Ameri Ichinose"
- Japanese Name: "一ノ瀬アメリ"
- Kanji Name: "一ノ瀬アメリ"
- Kana Name: "あめり いちのせ"
- Alias: "" (kosong)

**Output:**
```
"Ameri Ichinose - 一ノ瀬アメリ (あめり いちのせ)"
```

### Kasus 2: Alias dengan kurung
**Input:**
```
"Ameri Ichinose (Chris Erika)"
```

**Output:**
```
"Chris Erika - 一ノ瀬アメリ (Ameri Ichinose)"
```

### Kasus 3: Alias tanpa kurung (data lama)
**Input:**
```
"Ameri Ichinose, Chris Erika, 一ノ瀬アメリ"
```

**Output:**
```
"Chris Erika - 一ノ瀬アメリ (Ameri Ichinose)"
```

### Kasus 4: Alias campuran dengan format yang sudah benar
**Input:**
```
"Ameri Ichinose (Chris Erika), Amelie ICHINOSE - 一ノ瀬アメリ, Ameri ITHINOSE - 一ノ瀬アメリ"
```

**Output:**
```
"Chris Erika - 一ノ瀬アメリ (Ameri Ichinose), Amelie ICHINOSE - 一ノ瀬アメリ, Ameri ITHINOSE - 一ノ瀬アメリ"
```

## UI/UX Features

### Tombol State:
- **Normal**: Menampilkan icon `RotateCcw` dan text "Fix Alias"
- **Loading**: Menampilkan icon `RotateCcw` dengan animasi spin dan text "Memformat..."
- **Disabled**: Hanya ketika:
  - Sedang loading (`isFixingAlias = true`), ATAU
  - Tidak ada data yang tersedia sama sekali (alias kosong DAN semua field nama kosong)

### Kondisi Disabled Logic:
```typescript
disabled={isFixingAlias || (!formData.alias.trim() && !formData.name.trim() && !formData.jpname.trim() && !formData.kanjiName.trim() && !formData.kanaName.trim())}
```

**Tombol AKTIF ketika:**
- Alias ada (dapat diformat)
- Alias kosong tapi ada minimal 1 field nama (dapat generate alias)
- Tidak sedang loading

**Tombol DISABLED ketika:**
- Sedang loading
- Alias kosong DAN semua field nama kosong (tidak ada yang bisa diproses)

### Feedback:
- Toast success dengan alias yang sudah diformat
- Toast info jika tidak ada alias yang perlu diformat
- Toast error jika terjadi kesalahan

### Tip Text:
Menampilkan informasi tentang fungsi tombol di bawah field alias.

## Implementasi Teknis

### State Management:
```typescript
const [isFixingAlias, setIsFixingAlias] = useState(false)
```

### Function:
```typescript
const handleFixAlias = async () => {
  // Parse alias yang ada
  // Deteksi jenis karakter
  // Format ulang dengan struktur yang benar
  // Update form data
  // Tampilkan feedback
}
```

### Dependencies:
- `parseNameWithAliases` dari `japaneseNameNormalizer.ts`
- `detectCharacterType` dari `japaneseNameNormalizer.ts`
- `toast` dari `sonner`

## Handling Alias Kosong

### Ketika Field Alias Kosong:
- Tombol akan generate alias dari nama yang tersedia di form
- Menggunakan semua field nama: Name, Japanese Name, Kanji Name, Kana Name
- Prioritas: English Name > Kanji Name > Kana Name
- Format: `"English Name - Kanji Name (Kana Name)"`
- Tip text akan menunjukkan bahwa akan membuat alias dari nama yang tersedia

### Ketika Tidak Ada Nama yang Tersedia:
- Menampilkan toast info: "Tidak ada nama yang tersedia untuk membuat alias"
- Tombol tetap dapat diklik tetapi tidak akan melakukan apa-apa

## Handling Kanji dan Kana Name

### Ketika Kanji/Kana Name Tersedia:
- Tombol akan menggunakan Kanji Name dan Kana Name yang sudah ada
- Format: `"English Alias - Kanji Name (Kana Name)"`
- Tip text akan menunjukkan bahwa akan menggunakan data yang sudah ada

### Ketika Kanji/Kana Name Kosong:
- Tombol akan memformat berdasarkan deteksi jenis karakter
- English alias akan menjadi prioritas utama
- Kanji dan Kana akan diformat sesuai jenis karakter yang terdeteksi
- Tip text akan menunjukkan bahwa akan memformat berdasarkan deteksi karakter

## Keuntungan

1. **✅ Backward Compatibility**: Memperbaiki data lama yang belum menggunakan format alias yang benar
2. **✅ User Friendly**: Tombol yang mudah digunakan dengan feedback yang jelas
3. **✅ Consistent Format**: Memastikan semua alias menggunakan format yang konsisten
4. **✅ Smart Detection**: Otomatis mendeteksi jenis karakter dan memformat sesuai prioritas
5. **✅ Smart Integration**: Menggunakan Kanji/Kana Name yang sudah ada jika tersedia
6. **✅ Debug Logging**: Console log untuk debugging dan monitoring proses formatting
7. **✅ Auto Generation**: Generate alias otomatis dari nama yang tersedia ketika field alias kosong
8. **✅ Dynamic UI**: Tip text yang berubah sesuai kondisi form (alias kosong/ada)
9. **✅ Comprehensive Handling**: Menangani semua kasus: alias kosong, alias dengan kurung, alias tanpa kurung

## Testing

### Test Cases:
1. **Alias kosong dengan nama tersedia**: 
   - Name: "Ameri Ichinose", Kanji: "一ノ瀬アメリ", Kana: "あめり いちのせ"
   - Expected: `"Ameri Ichinose - 一ノ瀬アメリ (あめり いちのせ)"`

2. **Alias dengan kurung**: `"Nama (Alias1)(Alias2)"`
   - Expected: Diformat ulang dengan struktur yang benar

3. **Alias campuran**: `"English, 日本語, ひらがな"`
   - Expected: Diformat berdasarkan jenis karakter

4. **Alias kosong tanpa nama**: Semua field nama kosong
   - Expected: Toast info "Tidak ada nama yang tersedia untuk membuat alias"

5. **Alias tanpa kurung**: `"Nama biasa"`
   - Expected: Diformat berdasarkan jenis karakter

### Expected Results:
- Alias kosong akan generate dari nama yang tersedia
- Alias dengan kurung akan diformat ulang
- Alias tanpa kurung akan diformat berdasarkan jenis karakter
- Alias kosong tanpa nama akan menampilkan info message
