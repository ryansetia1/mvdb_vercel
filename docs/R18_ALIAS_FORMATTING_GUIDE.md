# R18 Alias Formatting Guide

## Overview
Panduan ini menjelaskan bagaimana sistem parsing R18 memformat field alias dengan struktur dan urutan yang benar.

## Format Alias yang Diimplementasikan

### **Contoh Input Data R18:**
```json
{
  "id": 22574,
  "image_url": "huziura_megu.jpg",
  "name_kana": "kana nama utama（kana alias 1（kana alias 2)",
  "name_kanji": "kanji nama utama（kanji alias 1）kanji alias 2）",
  "name_romaji": "nama utama (nama alias 1)(nama alias 2)"
}
```

### **Output yang Dihasilkan:**
```
Field alias: "nama alias 1 - kanji alias 1 (kana alias 1), nama alias 2 - kanji alias 2 (kana alias 2)"
```

## Aturan Formatting

### **1. Struktur Format:**
```
[romaji alias] - [kanji alias] ([kana alias])
```

### **2. Prioritas Alias:**
1. **Romaji** (prioritas utama)
2. **Kanji** (prioritas kedua)
3. **Kana** (prioritas ketiga)

### **3. Urutan Alias:**
- Alias diurutkan berdasarkan index/posisi dalam kurung
- Alias pertama dari setiap field dikelompokkan bersama
- Alias kedua dari setiap field dikelompokkan bersama
- dst...

## Contoh Parsing Detail

### **Input:**
```json
{
  "name_kana": "めぐり（ふじうらめぐ）（やがけうみ）",
  "name_kanji": "めぐり（藤浦めぐ）（八掛うみ）",
  "name_romaji": "Meguri (Megu Fujiura)(Yagake Umi)"
}
```

### **Step 1: Parse Alias**
```typescript
parsedKanji = {
  mainName: "めぐり",
  aliases: ["藤浦めぐ", "八掛うみ"]
}

parsedKana = {
  mainName: "めぐり", 
  aliases: ["ふじうらめぐ", "やがけうみ"]
}

parsedRomaji = {
  mainName: "Meguri",
  aliases: ["Megu Fujiura", "Yagake Umi"]
}
```

### **Step 2: Group Alias berdasarkan Index**
```typescript
aliasGroup[0] = {
  romaji: "Megu Fujiura",
  kanji: "藤浦めぐ", 
  kana: "ふじうらめぐ"
}

aliasGroup[1] = {
  romaji: "Yagake Umi",
  kanji: "八掛うみ",
  kana: "やがけうみ"
}
```

### **Step 3: Format Setiap Group**
```typescript
// Group 0: "Megu Fujiura - 藤浦めぐ (ふじうらめぐ)"
// Group 1: "Yagake Umi - 八掛うみ (やがけうみ)"
```

### **Step 4: Final Output**
```
"Megu Fujiura - 藤浦めぐ (ふじうらめぐ), Yagake Umi - 八掛うみ (やがけうみ)"
```

## Test Cases

### **Test Case 1: Single Alias**
**Input:**
```json
{
  "name_kana": "めぐり（ふじうらめぐ）",
  "name_kanji": "めぐり（藤浦めぐ）",
  "name_romaji": "Meguri (Megu Fujiura)"
}
```
**Expected Output:**
```
"Megu Fujiura - 藤浦めぐ (ふじうらめぐ)"
```

### **Test Case 2: Multiple Alias**
**Input:**
```json
{
  "name_kana": "kana nama utama（kana alias 1（kana alias 2)",
  "name_kanji": "kanji nama utama（kanji alias 1）kanji alias 2）",
  "name_romaji": "nama utama (nama alias 1)(nama alias 2)"
}
```
**Expected Output:**
```
"nama alias 1 - kanji alias 1 (kana alias 1), nama alias 2 - kanji alias 2 (kana alias 2)"
```

### **Test Case 3: Missing Alias**
**Input:**
```json
{
  "name_kana": "めぐり（ふじうらめぐ）",
  "name_kanji": "めぐり",
  "name_romaji": "Meguri"
}
```
**Expected Output:**
```
"ふじうらめぐ"
```

### **Test Case 4: Only Romaji Alias**
**Input:**
```json
{
  "name_kana": "めぐり",
  "name_kanji": "めぐり", 
  "name_romaji": "Meguri (Megu Fujiura)(Yagake Umi)"
}
```
**Expected Output:**
```
"Megu Fujiura, Yagake Umi"
```

## Debug Logging

### **Console Output:**
```javascript
R18 Name Parsing Debug: {
  input: {
    name_kana: "kana nama utama（kana alias 1（kana alias 2)",
    name_kanji: "kanji nama utama（kanji alias 1）kanji alias 2）",
    name_romaji: "nama utama (nama alias 1)(nama alias 2)"
  },
  parsed: {
    kanji: { mainName: "kanji nama utama", aliases: ["kanji alias 1", "kanji alias 2"] },
    kana: { mainName: "kana nama utama", aliases: ["kana alias 1", "kana alias 2"] },
    romaji: { mainName: "nama utama", aliases: ["nama alias 1", "nama alias 2"] },
    en: { mainName: "", aliases: [] }
  },
  aliasFormatting: {
    rawAliases: {
      kanji: ["kanji alias 1", "kanji alias 2"],
      kana: ["kana alias 1", "kana alias 2"],
      romaji: ["nama alias 1", "nama alias 2"],
      en: []
    },
    formattedAlias: "nama alias 1 - kanji alias 1 (kana alias 1), nama alias 2 - kanji alias 2 (kana alias 2)"
  },
  detected: {
    kanjiName: "kanji nama utama",
    kanaName: "kana nama utama",
    name: "nama utama",
    jpname: "kanji nama utama",
    alias: "nama alias 1 - kanji alias 1 (kana alias 1), nama alias 2 - kanji alias 2 (kana alias 2)"
  }
}
```

## Implementasi Teknis

### **Fungsi Utama:**
```typescript
export const formatAliasesWithStructure = (parsedData: {
  kanji: { mainName: string, aliases: string[] }
  kana: { mainName: string, aliases: string[] }
  romaji: { mainName: string, aliases: string[] }
  en: { mainName: string, aliases: string[] }
}): string
```

### **Algoritma:**
1. **Tentukan Max Alias**: Hitung jumlah maksimal alias dari semua field
2. **Group Alias**: Kelompokkan alias berdasarkan index/posisi
3. **Format Group**: Format setiap group dengan struktur yang benar
4. **Combine**: Gabungkan semua group dengan koma

### **Prioritas Formatting:**
- Jika ada romaji alias → gunakan sebagai nama utama
- Jika ada kanji alias → tambahkan dengan " - "
- Jika ada kana alias → tambahkan dengan "()"
- Jika tidak ada romaji → gunakan kanji atau kana sebagai nama utama

## Keuntungan Format Ini

1. **✅ Struktur Konsisten**: Format yang seragam untuk semua alias
2. **✅ Urutan Benar**: Alias diurutkan berdasarkan posisi dalam kurung
3. **✅ Prioritas Jelas**: Romaji > Kanji > Kana
4. **✅ Mudah Dibaca**: Format yang mudah dipahami manusia
5. **✅ Debug Friendly**: Logging yang komprehensif untuk troubleshooting

## Kesimpulan

Sistem formatting alias ini memastikan bahwa field alias terisi dengan format dan urutan yang benar, mengelompokkan alias berdasarkan posisi dalam kurung, dan memberikan struktur yang konsisten untuk semua jenis alias (romaji, kanji, kana).
