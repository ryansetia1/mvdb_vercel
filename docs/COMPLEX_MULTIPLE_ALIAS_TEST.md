# Complex Multiple Alias Test

## Test Case: Aktris dengan 3 Alias dalam Multiple Brackets

### Input Data
- **nama**: `Erina Ichihashi (Moemi Arikawa) (Test Alias) (Another Alias)`
- **nama jepang**: `市橋えりな (ありかわもえみ) (テストエイリアス) (アナザーエイリアス)`
- **alias existing**: `みはる(本中) （みはる / Miharu）, 徳永あやみ（舞ワイフ） （とくながあやみ / Tokunaga Ayami）`

### Expected Processing

#### Step 1: Extract Names from Brackets
- **nama field**: `Erina Ichihashi (Moemi Arikawa) (Test Alias) (Another Alias)`
  - mainName: `Erina Ichihashi`
  - aliases: `["Moemi Arikawa", "Test Alias", "Another Alias"]`

- **nama jepang field**: `市橋えりな (ありかわもえみ) (テストエイリアス) (アナザーエイリアス)`
  - mainName: `市橋えりな`
  - aliases: `["ありかわもえみ", "テストエイリアス", "アナザーエイリアス"]`

#### Step 2: Character Type Detection
- **English names**: `["Moemi Arikawa", "Test Alias", "Another Alias"]` → `characterType: 'romaji'`
- **Japanese names**: `["ありかわもえみ", "テストエイリアス", "アナザーエイリアス"]` → `characterType: 'kana'`

#### Step 3: Cross-Field Matching
- **English names**: `["Moemi Arikawa", "Test Alias", "Another Alias"]`
- **Japanese names**: `["ありかわもえみ", "テストエイリアス", "アナザーエイリアス"]`

#### Step 4: Create Paired Aliases
- `Moemi Arikawa - ありかわもえみ`
- `Test Alias - テストエイリアス`
- `Another Alias - アナザーエイリアス`

#### Step 5: Final Output
- **nama**: `Erina Ichihashi`
- **nama jepang**: `市橋えりな`
- **alias**: `みはる(本中) （みはる / Miharu）, 徳永あやみ（舞ワイフ） （とくながあやみ / Tokunaga Ayami）, Moemi Arikawa - ありかわもえみ, Test Alias - テストエイリアス, Another Alias - アナザーエイリアス`

## Test Case: R18 Parser dengan Complex Multiple Alias

### Input R18 Data
```json
{
  "actresses": [
    {
      "name_kanji": "市橋えりな (ありかわもえみ) (テストエイリアス) (アナザーエイリアス)",
      "name_kana": "いちはしえりな (ありかわもえみ) (テストエイリアス) (アナザーエイリアス)",
      "name_romaji": "Erina Ichihashi (Moemi Arikawa) (Test Alias) (Another Alias)"
    }
  ]
}
```

### Expected Processing

#### Step 1: Parse All Fields
- **parsedKanji**: `{ mainName: "市橋えりな", aliases: ["ありかわもえみ", "テストエイリアス", "アナザーエイリアス"] }`
- **parsedKana**: `{ mainName: "いちはしえりな", aliases: ["ありかわもえみ", "テストエイリアス", "アナザーエイリアス"] }`
- **parsedRomaji**: `{ mainName: "Erina Ichihashi", aliases: ["Moemi Arikawa", "Test Alias", "Another Alias"] }`

#### Step 2: Collect All Aliases
- **allAliases**: `["ありかわもえみ", "テストエイリアス", "アナザーエイリアス", "Moemi Arikawa", "Test Alias", "Another Alias"]`

#### Step 3: Remove Duplicates
- **uniqueAliases**: `["ありかわもえみ", "テストエイリアス", "アナザーエイリアス", "Moemi Arikawa", "Test Alias", "Another Alias"]`

#### Step 4: Final Output
- **kanjiName**: `市橋えりな`
- **kanaName**: `いちはしえりな`
- **name**: `Erina Ichihashi`
- **alias**: `ありかわもえみ, テストエイリアス, アナザーエイリアス, Moemi Arikawa, Test Alias, Another Alias`

## Test Case: Mixed Character Types dengan Multiple Alias

### Input Data
- **nama**: `Erina Ichihashi (Moemi Arikawa) (しおせ) (Nagi Hikaru)`
- **nama jepang**: `市橋えりな (ありかわもえみ) (汐世) (凪ひかる)`
- **alias existing**: `みはる(本中) （みはる / Miharu）`

### Expected Processing

#### Step 1: Extract Names
- **English names**: `["Moemi Arikawa", "Nagi Hikaru"]` → `characterType: 'romaji'`
- **Japanese names**: `["ありかわもえみ", "汐世", "凪ひかる"]` → `characterType: 'kanji'` dan `'kana'`

#### Step 2: Character Type Detection
- `Moemi Arikawa` → `characterType: 'romaji'`
- `しおせ` → `characterType: 'kana'`
- `Nagi Hikaru` → `characterType: 'romaji'`
- `ありかわもえみ` → `characterType: 'kana'`
- `汐世` → `characterType: 'kanji'`
- `凪ひかる` → `characterType: 'kanji'`

#### Step 3: Smart Pairing
- `Moemi Arikawa - ありかわもえみ`
- `しおせ - 汐世`
- `Nagi Hikaru - 凪ひかる`

#### Step 4: Final Output
- **nama**: `Erina Ichihashi`
- **nama jepang**: `市橋えりな`
- **alias**: `みはる(本中) （みはる / Miharu）, Moemi Arikawa - ありかわもえみ, しおせ - 汐世, Nagi Hikaru - 凪ひかる`

## Implementation Verification

### ✅ ActorForm Fix Alias
- Multiple brackets parsing ✅
- Character type detection for all types ✅
- Cross-field matching ✅
- Smart pairing logic ✅
- Append to existing alias ✅

### ✅ R18 Parser
- Multiple alias extraction ✅
- All field parsing ✅
- Duplicate removal ✅
- Cross-field integration ✅
- Save movie integration ✅

### ✅ Character Type Support
- Kanji (Unicode \u4e00-\u9faf) ✅
- Hiragana (Unicode \u3040-\u309f) ✅
- Katakana (Unicode \u30a0-\u30ff) ✅
- Romaji (A-Z, a-z) ✅
- Mixed characters ✅

## Testing Instructions

1. **Test dengan data kompleks**:
   - Input aktris dengan 3+ alias
   - Verify semua alias diekstrak dan diformat dengan benar

2. **Test R18 Parser**:
   - Parse R18 data dengan multiple alias
   - Klik "Save Movie"
   - Verify alias tersimpan dengan benar

3. **Test Cross-Field Matching**:
   - Input data dengan mixed character types
   - Verify sistem dapat mencocokkan dengan benar

## Files Status

- `src/components/ActorForm.tsx`: ✅ Enhanced
- `src/utils/japaneseNameNormalizer.ts`: ✅ Enhanced
- `src/components/MovieDataParser.tsx`: ✅ Already using enhanced functions
- `docs/COMPLEX_MULTIPLE_ALIAS_TEST.md`: ✅ Documentation
