# Matching Accuracy Improvement

## Masalah yang Diperbaiki

Sistem matching sebelumnya menghasilkan **false positive matches** yang menyebabkan:

1. **Japanese Name Match dialog muncul tidak tepat**: Sistem menampilkan "Rino Asuka" sebagai match untuk "Meguri (Megu Fujiura)" padahal seharusnya tidak ada match yang tepat
2. **Choose English Name menjadi 2 tombol**: Sistem menganggap ada multiple matches yang tidak tepat
3. **Score yang terlalu tinggi untuk matches yang lemah**: Sistem memberikan score tinggi untuk matches yang sebenarnya tidak relevan

## Solusi yang Diimplementasikan

### 1. **Stricter Multiple Match Detection**

#### **Sebelum:**
```typescript
const highScoreMatches = matches.filter(m => m.score >= topScore * 0.8) // Within 80% of top score
```

#### **Sesudah:**
```typescript
// Only consider matches with score >= 80 as potential multiple matches
const highScoreMatches = matches.filter(m => m.score >= 80 && m.score >= topScore * 0.9) // Within 90% of top score AND at least 80 points
```

**Perbaikan:**
- Minimum score 80 points untuk multiple matches
- Threshold 90% (lebih ketat dari 80%)
- Mencegah weak matches menjadi multiple matches

### 2. **Enhanced Match Quality Threshold**

#### **Sebelum:**
```typescript
if (sortedCandidates.length >= 1) {
  return {
    matched: sortedCandidates[0], // Single best match
    multipleMatches: []
  }
}
```

#### **Sesudah:**
```typescript
if (sortedCandidates.length >= 1) {
  const bestMatch = sortedCandidates[0]
  const bestScore = matches.find(m => m.candidate.id === bestMatch.id)?.score || 0
  
  // Only return a match if it has a meaningful score
  if (bestScore >= 50) {
    return {
      matched: bestMatch, // Single best match
      multipleMatches: []
    }
  } else {
    return {
      matched: null,
      multipleMatches: []
    }
  }
}
```

**Perbaikan:**
- Minimum score 50 points untuk single match
- Jika score terlalu rendah, return `null` (no match)
- Mencegah weak matches menjadi single match

### 3. **More Conservative Fuzzy Matching**

#### **Sebelum:**
```typescript
// Contains match with main names
if (candidateJpnameMain.toLowerCase().includes(queryMainName.toLowerCase())) score += 45
```

#### **Sesudah:**
```typescript
// Contains match with main names (only if the match is significant)
if (candidateJpnameMain.toLowerCase().includes(queryMainName.toLowerCase()) && queryMainName.length >= 2) {
  const matchRatio = queryMainName.length / candidateJpnameMain.length
  if (matchRatio >= 0.5) score += 45 // Only if query is at least 50% of candidate name
}
```

**Perbaikan:**
- Minimum length 2 karakter untuk query
- Match ratio minimum 50% (query harus setidaknya 50% dari nama kandidat)
- Mencegah partial matches yang tidak bermakna

### 4. **Improved Fuzzy Matching Scoring**

#### **Sebelum:**
```typescript
if (position === 0 && lengthRatio > 0.3) {
  score += 25 // Strong match at beginning
} else if (position === 0) {
  score += 15 // Match at beginning
} else if (lengthRatio > 0.5) {
  score += 20 // Significant portion match
} else {
  score += 10 // Partial match
}
```

#### **Sesudah:**
```typescript
// Only give significant scores for meaningful matches
if (position === 0 && lengthRatio >= 0.7) {
  score += 20 // Strong match at beginning with high ratio
} else if (position === 0 && lengthRatio >= 0.5) {
  score += 15 // Good match at beginning
} else if (lengthRatio >= 0.8) {
  score += 15 // Very high ratio match
} else if (lengthRatio >= 0.6) {
  score += 10 // Good ratio match
}
// Don't give points for weak matches (ratio < 0.6)
```

**Perbaikan:**
- Threshold yang lebih tinggi (0.6-0.8 vs 0.3-0.5)
- Tidak memberikan score untuk matches dengan ratio < 0.6
- Scoring yang lebih konservatif

### 5. **Enhanced Debug Logging**

```typescript
console.log(`Multiple high-score matches found for ${name}:`, highScoreCandidates.map(c => ({ name: c.name, jpname: c.jpname, score: matches.find(m => m.candidate.id === c.id)?.score })))
console.log(`Single good match found for ${name}:`, { name: bestMatch.name, jpname: bestMatch.jpname, score: bestScore })
console.log(`No good match found for ${name}. Best score was ${bestScore}, which is too low.`)
```

**Perbaikan:**
- Debug logging yang lebih detail
- Informasi score untuk setiap match
- Penjelasan mengapa match diterima/ditolak

## Hasil Perbaikan

### **Sebelum:**
- ❌ "Rino Asuka" muncul sebagai match untuk "Meguri (Megu Fujiura)"
- ❌ Japanese Name Match dialog muncul tidak tepat
- ❌ Choose English Name menjadi 2 tombol
- ❌ Score tinggi untuk matches yang lemah

### **Sesudah:**
- ✅ Hanya matches dengan score >= 80 yang dianggap multiple matches
- ✅ Hanya matches dengan score >= 50 yang dianggap single match
- ✅ Fuzzy matching yang lebih konservatif
- ✅ Debug logging yang lebih informatif

## Testing

Untuk menguji perbaikan ini:

1. **Parse data R18** dengan aktris "Meguri (Megu Fujiura)"
2. **Periksa console log** untuk melihat proses matching yang detail
3. **Verifikasi** bahwa tidak ada false positive matches
4. **Pastikan** bahwa hanya matches yang bermakna yang muncul

## Expected Behavior

- **Jika ada match yang tepat**: Sistem akan menampilkan match dengan score tinggi
- **Jika tidak ada match yang tepat**: Sistem akan menampilkan "Not found in database" dengan tombol "Add to Database" dan "Ignore"
- **Jika ada multiple matches yang bermakna**: Sistem akan menampilkan Japanese Name Match dialog
- **Jika ada single match yang bermakna**: Sistem akan menampilkan match langsung tanpa dialog

Perbaikan ini memastikan bahwa sistem matching lebih akurat dan tidak menghasilkan false positive matches yang membingungkan user.
