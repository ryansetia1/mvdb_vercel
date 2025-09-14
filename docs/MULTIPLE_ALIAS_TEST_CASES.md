# Multiple Alias Test Cases

## Test Case 1: Aktris dengan 2 Alias dalam Kurung

### Input Data
- **nama**: `Erina Ichihashi (Moemi Arikawa) (Test Alias)`
- **nama jepang**: `市橋えりな (ありかわもえみ) (テストエイリアス)`
- **alias existing**: `みはる(本中) （みはる / Miharu）, 徳永あやみ（舞ワイフ） （とくながあやみ / Tokunaga Ayami）`

### Expected Output
- **nama**: `Erina Ichihashi`
- **nama jepang**: `市橋えりな`
- **alias**: `みはる(本中) （みはる / Miharu）, 徳永あやみ（舞ワイフ） （とくながあやみ / Tokunaga Ayami）, Moemi Arikawa - ありかわもえみ, Test Alias - テストエイリアス`

## Test Case 2: Aktris dengan Multiple Alias dalam Single Bracket

### Input Data
- **nama**: `Erina Ichihashi (Moemi Arikawa, Test Alias)`
- **nama jepang**: `市橋えりな (ありかわもえみ, テストエイリアス)`
- **alias existing**: `みはる(本中) （みはる / Miharu）`

### Expected Output
- **nama**: `Erina Ichihashi`
- **nama jepang**: `市橋えりな`
- **alias**: `みはる(本中) （みはる / Miharu）, Moemi Arikawa - ありかわもえみ, Test Alias - テストエイリアス`

## Test Case 3: R18 Parser dengan Multiple Alias

### Input R18 Data
```json
{
  "actresses": [
    {
      "name_kanji": "市橋えりな (ありかわもえみ) (テストエイリアス)",
      "name_kana": "いちはしえりな (ありかわもえみ) (テストエイリアス)",
      "name_romaji": "Erina Ichihashi (Moemi Arikawa) (Test Alias)"
    }
  ]
}
```

### Expected Output
- **kanjiName**: `市橋えりな`
- **kanaName**: `いちはしえりな`
- **name**: `Erina Ichihashi`
- **alias**: `ありかわもえみ, テストエイリアス, Moemi Arikawa, Test Alias`

## Test Case 4: Cross-Field Matching dengan Multiple Alias

### Input Data
- **nama**: `Erina Ichihashi (Moemi Arikawa) (Test Alias)`
- **nama jepang**: `市橋えりな (ありかわもえみ) (テストエイリアス)`
- **alias existing**: `みはる(本中) （みはる / Miharu）`

### Expected Output
- **nama**: `Erina Ichihashi`
- **nama jepang**: `市橋えりな`
- **alias**: `みはる(本中) （みはる / Miharu）, Moemi Arikawa - ありかわもえみ, Test Alias - テストエイリアス`

## Test Case 5: Mixed Character Types

### Input Data
- **nama**: `Erina Ichihashi (Moemi Arikawa) (しおせ)`
- **nama jepang**: `市橋えりな (ありかわもえみ) (汐世)`
- **alias existing**: `みはる(本中) （みはる / Miharu）`

### Expected Output
- **nama**: `Erina Ichihashi`
- **nama jepang**: `市橋えりな`
- **alias**: `みはる(本中) （みはる / Miharu）, Moemi Arikawa - ありかわもえみ, しおせ - 汐世`

## Implementation Status

### ✅ ActorForm Fix Alias
- Multiple brackets: `nama(alias1)(alias2)` ✅
- Single bracket with multiple aliases: `nama(alias1, alias2)` ✅
- Cross-field matching: English + Japanese names ✅
- Character type detection: Kanji, Hiragana, Katakana, Romaji ✅

### ✅ R18 Parser
- Multiple alias extraction from all fields ✅
- Duplicate removal ✅
- Cross-field integration ✅
- Save movie integration ✅

### ✅ Cross-Field Matching
- English names from name field ✅
- Japanese names from jpname field ✅
- Character type detection for all types ✅
- Smart pairing logic ✅

## Testing Instructions

1. **Test ActorForm Fix Alias**:
   - Input data sesuai test case
   - Klik tombol "Fix Alias"
   - Verify output sesuai expected

2. **Test R18 Parser**:
   - Parse R18 data dengan multiple alias
   - Klik "Save Movie"
   - Verify alias tersimpan dengan benar

3. **Test Cross-Field Matching**:
   - Input data dengan English dan Japanese names di field berbeda
   - Verify sistem dapat mencocokkan dengan benar

## Files Modified

- `src/components/ActorForm.tsx`: Enhanced multiple alias handling
- `src/utils/japaneseNameNormalizer.ts`: Enhanced multiple alias handling
- `src/components/MovieDataParser.tsx`: Already using enhanced functions
- `docs/MULTIPLE_ALIAS_TEST_CASES.md`: Test cases documentation
