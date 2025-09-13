# Dual Parser System Documentation

## Overview

Sistem dual parser memungkinkan aplikasi menggunakan parser yang berbeda berdasarkan sumber data yang terdeteksi. Ini memberikan optimasi parsing yang lebih baik dan user experience yang lebih informatif.

## Parser Types

### 1. JavDB Simple Parser (Berdasarkan Commit 5d5a725)

**Trigger**: Ketika `detectDataSource()` mengembalikan `'javdb'`

**Karakteristik**:
- Parser sederhana dan cepat
- Fokus pada parsing text-based data
- Menggunakan logika parsing dari commit 5d5a725
- Tidak menangani JSON kompleks
- Optimized untuk format JavDB yang umum

**Format yang Didukung**:
```
SNIS-217 ラブ◆キモメン ティア
Release Date: 2023-01-15
Duration: 120 minutes
Director: 田中太郎
Studio: S1 No.1 Style
Series: ラブ◆キモメン
Actresses: ティア, 美咲
Actors: 田中太郎
```

### 2. R18.dev Complex Parser

**Trigger**: Ketika `detectDataSource()` mengembalikan `'r18'`

**Karakteristik**:
- Parser kompleks untuk JSON format
- Menangani struktur data R18.dev yang lengkap
- Support untuk field-field khusus R18
- Menangani nested objects dan arrays
- Optimized untuk data JSON yang kompleks

**Format yang Didukung**:
```json
{
  "dvd_id": "SNIS-217",
  "title_ja": "ラブ◆キモメン ティア",
  "title_en": "Love Kimo Men Tia",
  "actresses": [
    {
      "name_ja": "ティア",
      "name_en": "Tia"
    }
  ],
  "release_date": "2023-01-15",
  "runtime_mins": 120
}
```

### 3. Fallback Parser

**Trigger**: Ketika `detectDataSource()` mengembalikan `'unknown'`

**Karakteristik**:
- Parser original yang kompleks
- Menangani format yang tidak dikenali
- Fallback untuk edge cases
- Menggunakan logika parsing yang lebih robust

## Implementation Details

### Detection Logic

```typescript
export function detectDataSource(rawData: string): 'javdb' | 'r18' | 'unknown' {
  if (!rawData || !rawData.trim()) return 'unknown'
  
  if (isR18JsonFormat(rawData)) {
    return 'r18'
  }
  
  if (isJavdbFormat(rawData)) {
    return 'javdb'
  }
  
  return 'unknown'
}
```

### Parser Selection

```typescript
export function parseMovieData(rawData: string): ParsedMovieData | null {
  try {
    // Detect data source first
    const dataSource = detectDataSource(rawData)
    
    // Use appropriate parser based on data source
    if (dataSource === 'r18') {
      return parseR18JsonData(rawData)
    } else if (dataSource === 'javdb') {
      return parseJavdbSimpleData(rawData)
    }
    
    // Fallback to original complex parser for unknown formats
    // ... original parsing logic
  } catch (error) {
    console.error('Error parsing movie data:', error)
    return null
  }
}
```

## Visual Indicators

### JavDB Format Indicator
- **Badge**: Biru dengan ikon 📋
- **Text**: "JavDB Format (Simple Parser)"
- **Description**: "Menggunakan parser sederhana berdasarkan commit 5d5a725"

### R18.dev Format Indicator
- **Badge**: Hijau dengan ikon 🔗
- **Text**: "R18.dev Format (Complex Parser)"
- **Description**: "Menggunakan parser kompleks untuk JSON R18.dev"

### Unknown Format Indicator
- **Badge**: Abu-abu dengan ikon ❓
- **Text**: "Unknown Format (Fallback Parser)"
- **Description**: "Menggunakan parser fallback untuk format tidak dikenal"

## Benefits

### 1. Performance Optimization
- **JavDB**: Parser sederhana lebih cepat untuk data text
- **R18**: Parser kompleks menangani JSON dengan efisien
- **Fallback**: Parser robust untuk edge cases

### 2. User Experience
- **Visual Feedback**: User tahu parser mana yang digunakan
- **Transparency**: Informasi jelas tentang proses parsing
- **Confidence**: User yakin data akan di-parse dengan benar

### 3. Maintainability
- **Separation of Concerns**: Setiap parser fokus pada format tertentu
- **Easy Debugging**: Mudah debug masalah parsing spesifik
- **Extensibility**: Mudah menambah parser baru

## Usage Examples

### Example 1: JavDB Data
```
Input: SNIS-217 ラブ◆キモメン ティア
       Release Date: 2023-01-15
       Duration: 120 minutes
       Actresses: ティア, 美咲

Detection: 'javdb'
Parser Used: parseJavdbSimpleData()
Result: ParsedMovieData dengan data yang sesuai
```

### Example 2: R18.dev Data
```
Input: {"dvd_id": "SNIS-217", "title_ja": "ラブ◆キモメン ティア", ...}

Detection: 'r18'
Parser Used: parseR18JsonData()
Result: ParsedMovieData dengan data JSON yang di-parse
```

### Example 3: Unknown Format
```
Input: Some random text that doesn't match any pattern

Detection: 'unknown'
Parser Used: Original complex parser
Result: ParsedMovieData atau null jika gagal
```

## Future Enhancements

1. **Additional Format Support**: Menambah parser untuk format lain
2. **Parser Performance Metrics**: Tracking performa setiap parser
3. **User Preferences**: Memungkinkan user memilih parser secara manual
4. **Parser Validation**: Validasi hasil parsing sebelum melanjutkan
5. **Error Recovery**: Fallback ke parser lain jika parser utama gagal

## Conclusion

Sistem dual parser memberikan solusi yang elegant untuk menangani berbagai format data dengan performa optimal dan user experience yang baik. Setiap parser dioptimalkan untuk format spesifiknya, sambil tetap mempertahankan kompatibilitas dengan format yang tidak dikenali.
