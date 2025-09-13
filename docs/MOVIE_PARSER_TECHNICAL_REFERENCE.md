# Movie Parser Technical Reference

## File Structure

```
src/
├── components/
│   ├── MovieDataParser.tsx          # Main parser component
│   ├── JapaneseNameMatcher.tsx      # Japanese name matching UI
│   ├── EnglishNameSelector.tsx      # English name selection UI
│   └── MasterDataForm.tsx           # Master data form
├── utils/
│   └── movieDataParser.ts           # Core parsing logic
├── hooks/
│   ├── useCachedData.ts             # Data caching
│   └── useLazyData.ts               # Lazy loading
└── contexts/
    └── ThemeContext.tsx             # Theme management
```

## Core Functions

### 1. Data Parsing Functions

#### `parseMovieData(input: string, source: 'javdb' | 'r18' | 'manual'): ParsedData`
**Purpose**: Parse input data into structured format
**Parameters**:
- `input`: Raw input string
- `source`: Data source type

**Returns**: `ParsedData` object

**Implementation**:
```typescript
export function parseMovieData(input: string, source: 'javdb' | 'r18' | 'manual'): ParsedData {
  switch (source) {
    case 'javdb':
      return parseJavDBData(input)
    case 'r18':
      return parseR18Data(input)
    case 'manual':
      return parseManualData(input)
    default:
      throw new Error(`Unknown source: ${source}`)
  }
}
```

#### `detectSource(input: string): 'javdb' | 'r18' | 'manual'`
**Purpose**: Automatically detect data source
**Parameters**:
- `input`: Raw input string

**Returns**: Source type

**Detection Logic**:
```typescript
function detectSource(input: string): 'javdb' | 'r18' | 'manual' {
  // Check for R18 JSON format
  if (input.trim().startsWith('{') && input.trim().endsWith('}')) {
    try {
      const data = JSON.parse(input)
      if (data.title && data.actresses) {
        return 'r18'
      }
    } catch (error) {
      // Not valid JSON
    }
  }
  
  // Check for JavDB format
  if (input.includes('Title:') && input.includes('Actresses:')) {
    return 'javdb'
  }
  
  // Default to manual
  return 'manual'
}
```

### 2. Data Matching Functions

#### `matchMovieData(parsedData: ParsedData, masterData: MasterData): MatchedData`
**Purpose**: Match parsed data with master database
**Parameters**:
- `parsedData`: Parsed movie data
- `masterData`: Master database data

**Returns**: `MatchedData` object

**Implementation**:
```typescript
export function matchMovieData(parsedData: ParsedData, masterData: MasterData): MatchedData {
  const matched: MatchedData = {
    actresses: [],
    actors: [],
    directors: [],
    studios: [],
    series: [],
    labels: []
  }
  
  // Match each category
  parsedData.actresses.forEach(actressName => {
    matchActress(actressName, parsedData, masterData, matched)
  })
  
  // ... similar for other categories
  
  return matched
}
```

#### `findJapaneseMatch(searchName: string, masterData: MasterDataItem[]): MatchResult`
**Purpose**: Find best match for Japanese name
**Parameters**:
- `searchName`: Name to search for
- `masterData`: Array of master data items

**Returns**: `MatchResult` object

**Matching Strategy**:
1. **Exact Match**: Direct string comparison
2. **Fuzzy Match**: Using similarity algorithm
3. **Romaji Conversion**: Convert romaji to hiragana/katakana
4. **Alias Matching**: Check against aliases

### 3. Conflict Resolution Functions

#### `detectMissingData(matchedItem: MasterDataItem | null, parsedName: string, type: string, parsedEnglishName?: string, r18Data?: any): any`
**Purpose**: Detect missing data in database
**Parameters**:
- `matchedItem`: Matched item from database
- `parsedName`: Parsed name
- `type`: Item type (actress, actor, etc.)
- `parsedEnglishName`: Parsed English name
- `r18Data`: R18.dev data

**Returns**: Missing data object or null

**Implementation**:
```typescript
function detectMissingData(matchedItem: MasterDataItem | null, parsedName: string, type: string, parsedEnglishName?: string, r18Data?: any): any {
  if (!matchedItem) return null
  
  const missingData: any = {}
  
  // Check for Japanese names
  if (parsedName && /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(parsedName)) {
    if ((/[\u4E00-\u9FAF]/.test(parsedName) || /[\u30A0-\u30FF]/.test(parsedName)) && !matchedItem.kanjiName) {
      missingData.kanjiName = parsedName
    }
    
    if (/[\u3040-\u309F]/.test(parsedName) && !matchedItem.kanaName) {
      missingData.kanaName = parsedName
    }
  }
  
  // Check for English name
  if (parsedEnglishName && !matchedItem.name) {
    missingData.name = parsedEnglishName
  }
  
  return Object.keys(missingData).length > 0 ? missingData : null
}
```

#### `detectEnglishNameConflicts(matchedItem: MasterDataItem, parsedEnglishName?: string, r18Data?: any): ConflictInfo`
**Purpose**: Detect English name conflicts
**Parameters**:
- `matchedItem`: Matched item from database
- `parsedEnglishName`: Parsed English name
- `r18Data`: R18.dev data

**Returns**: Conflict information

### 4. Data Conversion Functions

#### `convertToMovie(parsedData: ParsedData, matchedData: MatchedData, ignoredItems: IgnoredItems): MovieData`
**Purpose**: Convert parsed and matched data to movie format
**Parameters**:
- `parsedData`: Parsed movie data
- `matchedData`: Matched data
- `ignoredItems`: Items to ignore

**Returns**: `MovieData` object

## API Integration

### Master Data API
```typescript
// Update master data with conflicts
const updateResult = await masterDataApi.updateExtendedWithSync(
  masterDataType,
  item.matched.id,
  updateData,
  accessToken
)
```

### Movie API
```typescript
// Save movie data
const saveResult = await movieApi.create(movieData, accessToken)
```

## State Management

### MovieDataParser State
```typescript
interface MovieDataParserState {
  input: string
  parsedData: ParsedData | null
  matchedData: MatchedData | null
  ignoredItems: IgnoredItems
  loading: boolean
  error: string | null
  mergeMode: MergeMode | null
  showJapaneseNameMatcher: JapaneseNameMatcherState | null
  showEnglishNameSelector: EnglishNameSelectorState | null
}
```

### State Updates
```typescript
// Update matched data
const updateMatchedData = (newMatchedData: MatchedData) => {
  setMatchedData(newMatchedData)
}

// Update should update data flag
const handleShouldUpdateData = (typeKey: keyof MatchedData, index: number, shouldUpdate: boolean) => {
  const newMatchedData = { ...matchedData }
  newMatchedData[typeKey][index].shouldUpdateData = shouldUpdate
  setMatchedData(newMatchedData)
}
```

## Error Handling

### Error Types
```typescript
interface ParserError {
  type: 'parsing' | 'matching' | 'conflict' | 'save'
  message: string
  details?: any
}
```

### Error Handling Strategy
```typescript
try {
  const result = await riskyOperation()
  return result
} catch (error) {
  console.error('Operation failed:', error)
  
  // Log error for debugging
  if (DEBUG) {
    console.error('Error details:', {
      operation: 'riskyOperation',
      error: error,
      context: context
    })
  }
  
  // Handle error gracefully
  return handleError(error)
}
```

## Performance Optimization

### Caching Strategy
```typescript
// Cache master data
const cachedMasterData = useCachedData('masterData', () => 
  masterDataApi.getAll(accessToken)
)

// Cache match results
const cachedMatchResults = useMemo(() => {
  return matchResultsCache.get(cacheKey)
}, [cacheKey])
```

### Lazy Loading
```typescript
// Lazy load data when needed
const lazyData = useLazyData(() => 
  loadDataWhenNeeded()
)
```

### Debouncing
```typescript
// Debounce input changes
const debouncedInput = useDebounce(input, 300)
```

## Testing

### Unit Tests
```typescript
describe('parseMovieData', () => {
  it('should parse JavDB data correctly', () => {
    const input = 'Title: Test Movie\nActresses: Test Actress'
    const result = parseMovieData(input, 'javdb')
    expect(result.title).toBe('Test Movie')
    expect(result.actresses).toContain('Test Actress')
  })
  
  it('should parse R18 data correctly', () => {
    const input = JSON.stringify({
      title: 'Test Movie',
      actresses: ['Test Actress']
    })
    const result = parseMovieData(input, 'r18')
    expect(result.title).toBe('Test Movie')
    expect(result.actresses).toContain('Test Actress')
  })
})
```

### Integration Tests
```typescript
describe('MovieDataParser Integration', () => {
  it('should handle complete parsing flow', async () => {
    const input = 'Title: Test Movie\nActresses: Test Actress'
    const parsedData = parseMovieData(input, 'javdb')
    const matchedData = await matchMovieData(parsedData, masterData)
    const movieData = convertToMovie(parsedData, matchedData, {})
    
    expect(movieData.title).toBe('Test Movie')
    expect(movieData.actresses).toHaveLength(1)
  })
})
```

## Configuration

### Environment Variables
```typescript
interface Config {
  supabaseUrl: string
  supabaseAnonKey: string
  openRouterApiKey: string
  debugMode: boolean
}
```

### Feature Flags
```typescript
interface FeatureFlags {
  enableAiTranslation: boolean
  enableBatchProcessing: boolean
  enableRealTimeSync: boolean
  enableAdvancedFiltering: boolean
}
```

## Monitoring

### Performance Metrics
```typescript
interface PerformanceMetrics {
  parsingTime: number
  matchingTime: number
  conflictResolutionTime: number
  saveTime: number
  totalTime: number
}
```

### Error Tracking
```typescript
interface ErrorMetrics {
  parsingErrors: number
  matchingErrors: number
  conflictErrors: number
  saveErrors: number
  totalErrors: number
}
```

---

*Technical reference ini berisi detail implementasi untuk developer yang perlu memahami atau memodifikasi sistem Movie Parser.*
