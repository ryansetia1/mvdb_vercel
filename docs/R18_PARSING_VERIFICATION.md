# R18 Parsing Verification Guide

## Overview
Dokumen ini menjelaskan bagaimana sistem parsing R18 yang telah diupdate bekerja dan bagaimana memverifikasi bahwa data bisa terdeteksi dengan benar.

## Sistem Parsing R18 yang Diupdate

### 1. **Robust Name Mapping**
Sistem sekarang menggunakan aturan parsing yang lebih robust untuk memetakan nama cast ke field yang tepat:

#### **Aturan Parsing:**
- ✅ **Prioritas Data JSON**: Gunakan data JSON langsung jika tersedia
- ✅ **Mapping Langsung**: 
  - `name_kanji` → field `kanjiName`
  - `name_kana` → field `kanaName`
  - `name_romaji` → field `name` (English)
  - `name_en` → field `name` (English, prioritas)

#### **Fallback dengan Deteksi Karakter:**
- ✅ **Kanji** (Unicode `\u4E00-\u9FFF`) → field `kanjiName`
- ✅ **Hiragana** (Unicode `\u3040-\u309F`) → field `kanaName`
- ✅ **Katakana** (Unicode `\u30A0-\u30FF`) → field `kanaName`
- ✅ **Alfabet Latin** (A-Z, a-z) → field `name` (romaji)

#### **Handling Kombinasi Karakter:**
- ✅ **Contoh**: `"八掛うみ"` (kanji + hiragana) → tetap masukkan ke field `kanjiName`
- ✅ **Prioritas**: Kanji > Kana > Romaji

### 2. **Enhanced Matching System**
Sistem matching sekarang menggunakan data yang sudah dinormalisasi untuk meningkatkan akurasi deteksi:

#### **Untuk Actresses:**
```typescript
const normalizedR18Data = normalizeR18JapaneseName(r18ActressData)
const nameVariations = [
  normalizedR18Data.jpname,      // Normalized Japanese name
  normalizedR18Data.kanjiName,    // Normalized kanji name
  normalizedR18Data.kanaName,     // Normalized kana name
  normalizedR18Data.name,        // Normalized English name
  r18ActressData.name_romaji,    // Original romaji
  r18ActressData.name_en         // Original English
]
```

#### **Untuk Actors:**
- Menggunakan sistem yang sama dengan actresses
- Mencoba semua variasi nama yang tersedia

#### **Untuk Directors:**
- Menggunakan sistem yang sama dengan actresses/actors
- Mencoba semua variasi nama dari `directorInfo`

### 3. **Debug Logging**
Sistem sekarang menyediakan debug logging yang komprehensif:

```typescript
console.log('R18 Name Parsing Debug:', {
  input: r18Data,
  detected: {
    kanjiName,
    kanaName,
    name,
    jpname
  },
  characterTypes: allNames.map(n => ({ name: n, type: detectCharacterType(n) }))
})
```

## Cara Verifikasi Parsing R18

### 1. **Test dengan Data R18 JSON**
1. Buka aplikasi dan masuk ke Movie Parser
2. Paste data R18 JSON format
3. Klik "Parse"
4. Periksa hasil parsing di console browser (F12 → Console)

### 2. **Yang Perlu Diperiksa:**

#### **A. Data Parsing:**
- ✅ Code movie terdeteksi (`dvd_id`)
- ✅ Title Jepang terdeteksi (`title_ja`)
- ✅ Title English terdeteksi (`title_en`)
- ✅ Release date terdeteksi (`release_date`)
- ✅ Duration terdeteksi (`runtime_mins`)

#### **B. Cast Data:**
- ✅ **Actresses**: Nama terdeteksi dengan benar
- ✅ **Actors**: Nama terdeteksi dengan benar  
- ✅ **Directors**: Nama terdeteksi dengan benar

#### **C. Debug Logging:**
Periksa console untuk log berikut:
```
=== MATCHING ACTRESS ===
Searching for actress: [nama]
Parsed English name: [nama english]
R18 actress data: [data R18]
Normalized R18 data: [data yang sudah dinormalisasi]
Trying name variations: [array variasi nama]
```

### 3. **Contoh Data R18 untuk Testing:**

```json
{
  "dvd_id": "SSIS-001",
  "title_ja": "新人NO.1STYLE 八掛うみAVデビュー",
  "title_en": "Rookie No.1 Style Yagake Umi AV Debut",
  "release_date": "2023-01-01",
  "runtime_mins": 120,
  "actresses": [
    {
      "name_kanji": "八掛うみ",
      "name_kana": "やがけうみ",
      "name_romaji": "Yagake Umi",
      "name_en": "Yagake Umi"
    }
  ],
  "actors": [],
  "directors": [
    {
      "name_kanji": "監督太郎",
      "name_kana": "かんとくたろう",
      "name_romaji": "Kantoku Taro",
      "name_en": "Kantoku Taro"
    }
  ]
}
```

### 4. **Expected Output:**

#### **Parsed Data:**
- `code`: "SSIS-001"
- `titleJp`: "新人NO.1STYLE 八掛うみAVデビュー"
- `titleEn`: "Rookie No.1 Style Yagake Umi AV Debut"
- `actresses`: ["Yagake Umi"]
- `director`: "Kantoku Taro"

#### **Normalized Data:**
- `actressInfo[0].jpname`: "八掛うみ"
- `actressInfo[0].kanjiName`: "八掛うみ"
- `actressInfo[0].kanaName`: "やがけうみ"
- `actressInfo[0].name`: "Yagake Umi"

### 5. **Troubleshooting:**

#### **Jika Data Tidak Terdeteksi:**
1. Periksa format JSON R18
2. Periksa console untuk error messages
3. Pastikan data memiliki field yang diperlukan (`dvd_id`, `title_ja`, `release_date`)

#### **Jika Cast Tidak Match:**
1. Periksa debug logging di console
2. Pastikan nama di database sudah benar
3. Periksa apakah ada variasi nama yang bisa dicoba

#### **Jika Field Kosong:**
1. Periksa apakah data R18 memiliki field yang diperlukan
2. Periksa apakah fallback detection bekerja
3. Periksa console untuk debug information

## Kesimpulan

Sistem parsing R18 yang telah diupdate sekarang lebih robust dalam:
- ✅ Memetakan nama cast ke field yang tepat
- ✅ Mendeteksi berbagai jenis karakter (Kanji, Kana, Romaji)
- ✅ Menangani kombinasi karakter
- ✅ Mencocokkan data dengan database yang ada
- ✅ Memberikan debug information yang komprehensif

Dengan sistem ini, user seharusnya bisa melakukan parsing R18 dengan hasil yang lebih akurat dan konsisten.
