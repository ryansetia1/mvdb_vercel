# Alias Parsing Quick Reference

## Overview
Quick reference untuk sistem parsing alias yang telah diperbaiki dalam aplikasi MVDB.

## Data Flow
```
R18 JSON → parseR18JsonData() → normalizeR18JapaneseName() → matchWithDatabase() → updateMasterDataWithConflicts() → Database
```

## Key Functions

### 1. `parseNameWithAliases(name: string)`
**Purpose**: Extract main name and aliases from string with brackets
**Input**: `"Meguri (Megu Fujiura)"` or `"めぐり（ふじうらめぐ）"`
**Output**: `{ mainName: "Meguri", aliases: ["Megu Fujiura"] }`

### 2. `normalizeR18JapaneseName(r18Data: any)`
**Purpose**: Normalize R18.dev data to clean format
**Input**: R18 actress/actor/director object
**Output**: Normalized object with clean names and formatted alias

### 3. `calculateMatchScore(query: string, candidate: MasterDataItem)`
**Purpose**: Calculate match score for Japanese names
**Features**: Enhanced Japanese name matching with fuzzy logic

### 4. `detectMissingData(matchedItem, parsedName, type, parsedEnglishName, r18Data)`
**Purpose**: Detect missing data for yellow area
**Output**: Object with missing fields or null

### 5. `updateMasterDataWithConflicts()`
**Purpose**: Update master data with normalized aliases and names
**Features**: Normalizes both alias and English name during save

## Expected Results

### Input Data
```json
{
  "name_kana": "めぐり（ふじうらめぐ）",
  "name_kanji": "めぐり（藤浦めぐ）",
  "name_romaji": "Meguri (Megu Fujiura)",
  "name_en": "Meguri (Megu Fujiura)"
}
```

### Form Display
- **Nama**: "Meguri" ✅
- **Nama Jepang**: "めぐり" ✅
- **Kanji Name**: "めぐり" ✅
- **Kana Name**: "めぐり" ✅
- **Alias**: "Megu Fujiura - 藤浦めぐ (ふじうらめぐ)" ✅

### Database Storage
- **name**: "Meguri" ✅
- **jpname**: "めぐり" ✅
- **kanjiName**: "めぐり" ✅
- **kanaName**: "めぐり" ✅
- **alias**: "Megu Fujiura - 藤浦めぐ (ふじうらめぐ)" ✅

## Regex Patterns

### Japanese Brackets Support
```typescript
// Supports both Japanese (） and Latin () brackets
const aliasRegex = /[（(]([^）)]+)[）)]/g
const mainName = name.replace(/[（(][^）)]*[）)]/g, '').trim()
```

### Japanese Character Detection
```typescript
// Kanji and Katakana
/[\u4E00-\u9FAF\u30A0-\u30FF]/

// Hiragana
/[\u3040-\u309F]/

// All Japanese characters
/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/
```

## Alias Format
**Pattern**: `"English Alias - Kanji Alias (Kana Alias)"`
**Example**: `"Megu Fujiura - 藤浦めぐ (ふじうらめぐ)"`

## Error Handling
- Fallback to original data if normalization fails
- Console logging for debugging
- Graceful degradation for non-R18 data

## Deployment Status
- **Function**: `make-server-e0516fcf` (Version 62)
- **Status**: ACTIVE ✅
- **Last Deploy**: 2025-09-14 08:25:00 UTC

## Testing Checklist
- [ ] Basic alias parsing works
- [ ] Japanese brackets supported
- [ ] Form display is clean
- [ ] Database storage is correct
- [ ] Yellow area shows correct alias
- [ ] Save movie normalizes data
- [ ] English name is clean
- [ ] All fields consistent

## Troubleshooting

### Common Issues
1. **Alias still shows in main name**: Check if `normalizeR18JapaneseName` is called
2. **Wrong alias format**: Verify alias formatting logic
3. **Missing data area wrong**: Check `detectMissingData` function
4. **Database not updated**: Verify `updateMasterDataWithConflicts` is called

### Debug Steps
1. Check console logs for normalization results
2. Verify R18 data structure
3. Test with sample data
4. Check function deployment status

## Files Modified
- `src/utils/japaneseNameNormalizer.ts`
- `src/utils/movieDataParser.ts`
- `src/components/MovieDataParser.tsx`
- `supabase/functions/make-server-e0516fcf/`

---
**Quick Reference Version**: 1.0  
**Last Updated**: 2025-09-14
