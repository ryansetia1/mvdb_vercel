# Japanese Name Matching Enhancement

## Masalah yang Diperbaiki

Sistem matching sebelumnya tidak bisa mendeteksi aktris yang sudah ada di database ketika nama Jepang yang sama memiliki variasi penulisan atau nama Inggris yang berbeda. Contoh kasus:

**Data R18 yang di-parse:**
- name_kana: "めぐり（ふじうらめぐ）"
- name_kanji: "めぐり（藤浦めぐ）"  
- name_romaji: "Meguri (Megu Fujiura)"

**Masalah:** Parser tidak bisa mendeteksi aktris "Meguri" yang sudah ada di database karena sistem matching hanya melakukan exact match atau contains match sederhana.

## Solusi yang Diimplementasikan

### 1. Enhanced Japanese Name Matching

Sistem sekarang menggunakan **fuzzy matching** yang lebih cerdas untuk nama Jepang:

#### **Extract Main Name Function**
```typescript
const extractMainName = (japaneseName: string): string => {
  if (!japaneseName) return ''
  // Remove content in parentheses and brackets
  return japaneseName.replace(/[（(].*?[）)]/g, '').trim()
}
```

Fungsi ini mengekstrak nama utama dari nama Jepang dengan menghilangkan alias dalam kurung.

#### **Multi-Level Matching Strategy**

1. **Exact Match dengan Main Names (Score: 95)**
   - Mencocokkan nama utama tanpa alias
   - Prioritas tertinggi untuk nama Jepang

2. **Contains Match dengan Main Names (Score: 45)**
   - Mencocokkan jika nama utama mengandung query
   - Mendukung partial matching

3. **Reverse Matching (Score: 45)**
   - Mencocokkan jika query mengandung nama utama kandidat
   - Menangani kasus dimana query lebih panjang dari nama di database

4. **Position-Based Fuzzy Matching (Score: 10-25)**
   - Memberikan skor berdasarkan posisi match dalam nama
   - Skor lebih tinggi jika match di awal nama
   - Skor berdasarkan rasio panjang query vs nama lengkap

### 2. Enhanced Debug Logging

Sistem sekarang menyediakan debug logging yang lebih detail untuk membantu troubleshooting:

```typescript
// Debug logging untuk actress matching
if (type === 'actress') {
  console.log('=== FIND MATCHES FOR ACTRESS ===')
  console.log('Searching for:', name)
  console.log('Query main name (without aliases):', queryMainName)
  
  // Show main names of candidates
  candidates.forEach(c => {
    const jpnameMain = extractMainName(c.jpname || '')
    const kanjiMain = extractMainName(c.kanjiName || '')
    const kanaMain = extractMainName(c.kanaName || '')
    console.log(`Candidate ${c.name}: jpname="${jpnameMain}", kanji="${kanjiMain}", kana="${kanaMain}"`)
  })
}
```

### 3. Scoring System yang Diperbaiki

#### **Prioritas Scoring:**
- **Exact match dengan main names**: 95 points
- **Contains match dengan main names**: 45 points  
- **Reverse matching**: 45 points
- **Position-based fuzzy matching**: 10-25 points
- **Traditional exact match**: 100 points
- **Traditional contains match**: 50 points

#### **Minimum Score Threshold:**
- Default: 30 points
- Untuk labels dengan nama Jepang = nama Inggris: 20 points

## Contoh Kasus yang Ditangani

### Kasus 1: Nama dengan Alias
**Query:** "めぐり"
**Database:** "めぐり（ふじうらめぐ）"
**Hasil:** ✅ Match dengan score tinggi karena nama utama sama

### Kasus 2: Nama Inggris Berbeda
**Query:** "Meguri (Megu Fujiura)"  
**Database:** "Meguri" (nama Jepang sama)
**Hasil:** ✅ Match karena nama Jepang utama cocok

### Kasus 3: Partial Matching
**Query:** "めぐ"
**Database:** "めぐり（ふじうらめぐ）"
**Hasil:** ✅ Match dengan score sedang karena partial match di awal nama

## Keuntungan

1. **Improved Detection Rate**: Aktris dengan nama Jepang yang sama akan lebih mudah terdeteksi
2. **Better Handling of Aliases**: Sistem bisa menangani nama dengan alias dalam kurung
3. **Flexible Matching**: Mendukung berbagai variasi penulisan nama Jepang
4. **Enhanced Debugging**: Debug logging yang lebih detail untuk troubleshooting
5. **Backward Compatibility**: Tidak mengubah behavior untuk kasus yang sudah berfungsi

## Testing

Untuk menguji perbaikan ini:

1. Parse data R18 dengan aktris yang memiliki nama Jepang yang sama tapi nama Inggris berbeda
2. Periksa console log untuk melihat proses matching yang detail
3. Verifikasi bahwa aktris terdeteksi dengan score yang sesuai
4. Pastikan tidak ada false positive untuk nama yang tidak terkait

## Future Enhancements

1. **Levenshtein Distance**: Implementasi algoritma edit distance untuk matching yang lebih cerdas
2. **Phonetic Matching**: Matching berdasarkan pengucapan untuk nama Jepang
3. **Machine Learning**: Training model untuk meningkatkan akurasi matching
4. **User Feedback**: Sistem untuk belajar dari pilihan user dalam kasus ambiguous matches
