# Movie Parser Examples & Best Practices

## Usage Examples

### 1. Basic Parsing

#### JavDB Format
```typescript
const javdbInput = `
Title: SSIS-001 The Full On Creampie Showtime 4 Rio Hamazaki
Actresses: Rio Hamazaki (Rio Hamazaki)
Director: Pochomukin (ポチョムキン)
Studio: S1 No.1 Style
Series: The Full On Creampie Showtime
Label: S1 No.1 Style
Release Date: 2023-01-01
Duration: 120
`

const parsedData = parseMovieData(javdbInput, 'javdb')
console.log(parsedData)
// Output:
// {
//   title: "SSIS-001 The Full On Creampie Showtime 4 Rio Hamazaki",
//   actresses: ["Rio Hamazaki"],
//   director: "Pochomukin",
//   studio: "S1 No.1 Style",
//   series: "The Full On Creampie Showtime",
//   label: "S1 No.1 Style",
//   releaseDate: "2023-01-01",
//   duration: 120
// }
```

#### R18 JSON Format
```typescript
const r18Input = JSON.stringify({
  title: "SSIS-001 The Full On Creampie Showtime 4 Rio Hamazaki",
  actresses: [
    {
      name_ja: "Rio Hamazaki",
      name_en: "Rio Hamazaki",
      name_kanji: "Rio Hamazaki",
      name_kana: "Rio Hamazaki"
    }
  ],
  director: {
    name_ja: "Pochomukin",
    name_en: "Pochomukin",
    name_kanji: "ポチョムキン",
    name_kana: "ポチョムキン"
  },
  studio: {
    name_ja: "S1 No.1 Style",
    name_en: "S1 No.1 Style"
  },
  series: {
    name_ja: "The Full On Creampie Showtime",
    name_en: "The Full On Creampie Showtime"
  },
  label: {
    name_ja: "S1 No.1 Style",
    name_en: "S1 No.1 Style"
  },
  release_date: "2023-01-01",
  duration: 120
})

const parsedData = parseMovieData(r18Input, 'r18')
console.log(parsedData)
// Output: Same as JavDB format
```

### 2. Data Matching

#### Basic Matching
```typescript
const masterData = {
  actresses: [
    {
      id: 1,
      name: "Rio Hamazaki",
      jpname: "Rio Hamazaki",
      kanjiName: "Rio Hamazaki",
      kanaName: "Rio Hamazaki"
    }
  ],
  directors: [
    {
      id: 1,
      name: "Pochomukin",
      jpname: "ポチョムキン",
      kanjiName: "ポチョムキン"
    }
  ]
  // ... other categories
}

const matchedData = matchMovieData(parsedData, masterData)
console.log(matchedData.actresses[0])
// Output:
// {
//   name: "Rio Hamazaki",
//   parsedName: "Rio Hamazaki",
//   matched: { id: 1, name: "Rio Hamazaki", ... },
//   missingData: null,
//   shouldUpdateData: false
// }
```

#### Matching with Conflicts
```typescript
const parsedData = {
  title: "Test Movie",
  actresses: ["New Actress"],
  director: "New Director",
  // ... other fields
}

const masterData = {
  actresses: [
    {
      id: 1,
      name: "Old Actress",
      jpname: "Old Actress"
    }
  ],
  directors: [
    {
      id: 1,
      name: "Old Director",
      jpname: "Old Director"
    }
  ]
}

const matchedData = matchMovieData(parsedData, masterData)
console.log(matchedData.actresses[0])
// Output:
// {
//   name: "New Actress",
//   parsedName: "New Actress",
//   matched: null,
//   missingData: null,
//   shouldUpdateData: false
// }
```

### 3. Conflict Resolution

#### English Name Conflicts
```typescript
const matchedItem = {
  id: 1,
  name: "Rio Hamazaki",
  jpname: "Rio Hamazaki",
  kanjiName: "Rio Hamazaki"
}

const parsedEnglishName = "Rio Hamazaki"
const r18Data = {
  name_en: "Rio Hamazaki",
  name_romaji: "Rio Hamazaki"
}

const conflictInfo = detectEnglishNameConflicts(matchedItem, parsedEnglishName, r18Data)
console.log(conflictInfo)
// Output:
// {
//   hasDifferentEnglishNames: false,
//   needsEnglishNameSelection: false,
//   availableEnglishNames: []
// }
```

#### Missing Data Detection
```typescript
const matchedItem = {
  id: 1,
  name: "Rio Hamazaki",
  jpname: "Rio Hamazaki"
  // Missing kanjiName and kanaName
}

const parsedName = "Rio Hamazaki"
const parsedEnglishName = "Rio Hamazaki"
const r18Data = {
  name_kanji: "Rio Hamazaki",
  name_kana: "Rio Hamazaki"
}

const missingData = detectMissingData(matchedItem, parsedName, 'actress', parsedEnglishName, r18Data)
console.log(missingData)
// Output:
// {
//   kanjiName: "Rio Hamazaki",
//   kanaName: "Rio Hamazaki"
// }
```

### 4. Data Conversion

#### Convert to Movie Format
```typescript
const parsedData = {
  title: "Test Movie",
  actresses: ["Test Actress"],
  director: "Test Director",
  studio: "Test Studio",
  releaseDate: "2023-01-01",
  duration: 120
}

const matchedData = {
  actresses: [
    {
      name: "Test Actress",
      parsedName: "Test Actress",
      matched: { id: 1, name: "Test Actress" },
      missingData: null,
      shouldUpdateData: false
    }
  ],
  directors: [
    {
      name: "Test Director",
      parsedName: "Test Director",
      matched: { id: 1, name: "Test Director" },
      missingData: null,
      shouldUpdateData: false
    }
  ]
  // ... other categories
}

const ignoredItems = {
  actresses: [],
  actors: [],
  directors: [],
  studios: [],
  series: [],
  labels: []
}

const movieData = convertToMovie(parsedData, matchedData, ignoredItems)
console.log(movieData)
// Output:
// {
//   title: "Test Movie",
//   actresses: [{ id: 1, name: "Test Actress" }],
//   director: { id: 1, name: "Test Director" },
//   studio: { id: 1, name: "Test Studio" },
//   releaseDate: "2023-01-01",
//   duration: 120
// }
```

## Best Practices

### 1. Error Handling

#### Always Use Try-Catch
```typescript
// Good
try {
  const parsedData = parseMovieData(input, source)
  const matchedData = matchMovieData(parsedData, masterData)
  return { success: true, data: matchedData }
} catch (error) {
  console.error('Parsing failed:', error)
  return { success: false, error: error.message }
}

// Bad
const parsedData = parseMovieData(input, source) // Can throw error
```

#### Use Optional Chaining
```typescript
// Good
if (item.missingData?.kanjiName) {
  updateData.kanjiName = item.missingData.kanjiName
}

// Bad
if (item.missingData.kanjiName) { // Can throw error if missingData is null
  updateData.kanjiName = item.missingData.kanjiName
}
```

### 2. Performance Optimization

#### Use Memoization
```typescript
// Good
const memoizedMatchResult = useMemo(() => {
  return findJapaneseMatch(searchName, masterData)
}, [searchName, masterData])

// Bad
const matchResult = findJapaneseMatch(searchName, masterData) // Recalculates every render
```

#### Use Debouncing
```typescript
// Good
const debouncedInput = useDebounce(input, 300)
useEffect(() => {
  if (debouncedInput) {
    parseMovieData(debouncedInput, source)
  }
}, [debouncedInput])

// Bad
useEffect(() => {
  if (input) {
    parseMovieData(input, source) // Runs on every keystroke
  }
}, [input])
```

### 3. Data Validation

#### Validate Input Before Processing
```typescript
// Good
function validateInput(input: string): boolean {
  if (!input || input.trim().length === 0) {
    return false
  }
  
  if (input.length > 10000) {
    return false
  }
  
  return true
}

if (!validateInput(input)) {
  throw new Error('Invalid input')
}

// Bad
const parsedData = parseMovieData(input, source) // No validation
```

#### Validate Parsed Data
```typescript
// Good
function validateParsedData(parsedData: ParsedData): boolean {
  if (!parsedData.title || parsedData.title.trim().length === 0) {
    return false
  }
  
  if (!parsedData.actresses || parsedData.actresses.length === 0) {
    return false
  }
  
  return true
}

// Bad
// No validation of parsed data
```

### 4. UI/UX Best Practices

#### Provide Clear Feedback
```typescript
// Good
{loading && (
  <div className="flex items-center gap-2">
    <Spinner />
    <span>Parsing data...</span>
  </div>
)}

{error && (
  <div className="text-red-500">
    Error: {error}
  </div>
)}

// Bad
// No feedback to user
```

#### Handle Edge Cases
```typescript
// Good
{matchedData.actresses.length === 0 ? (
  <div className="text-gray-500">No actresses found</div>
) : (
  <div>
    {matchedData.actresses.map((actress, index) => (
      <ActressItem key={index} actress={actress} />
    ))}
  </div>
)}

// Bad
{matchedData.actresses.map((actress, index) => (
  <ActressItem key={index} actress={actress} />
))} // Can break if array is empty
```

### 5. Code Organization

#### Separate Concerns
```typescript
// Good
// Parsing logic
const parseMovieData = (input: string, source: string) => { ... }

// Matching logic
const matchMovieData = (parsedData: ParsedData, masterData: MasterData) => { ... }

// UI logic
const MovieDataParser = () => { ... }

// Bad
// All logic mixed together
const MovieDataParser = () => {
  // Parsing logic
  // Matching logic
  // UI logic
  // All in one component
}
```

#### Use TypeScript Interfaces
```typescript
// Good
interface ParsedData {
  title: string
  actresses: string[]
  director: string
  studio: string
  releaseDate: string
  duration: number
}

// Bad
// No type safety
const parsedData = {
  title: input.title,
  actresses: input.actresses,
  // No type checking
}
```

## Common Patterns

### 1. Data Processing Pipeline
```typescript
const processMovieData = async (input: string) => {
  try {
    // Step 1: Parse input
    const source = detectSource(input)
    const parsedData = parseMovieData(input, source)
    
    // Step 2: Match with database
    const masterData = await getMasterData()
    const matchedData = matchMovieData(parsedData, masterData)
    
    // Step 3: Handle conflicts
    const conflicts = detectConflicts(matchedData)
    
    // Step 4: Convert to movie format
    const movieData = convertToMovie(parsedData, matchedData, {})
    
    return { success: true, data: movieData, conflicts }
  } catch (error) {
    return { success: false, error: error.message }
  }
}
```

### 2. State Management Pattern
```typescript
const useMovieParser = () => {
  const [state, setState] = useState({
    input: '',
    parsedData: null,
    matchedData: null,
    loading: false,
    error: null
  })
  
  const updateState = (updates: Partial<typeof state>) => {
    setState(prev => ({ ...prev, ...updates }))
  }
  
  const parseData = async (input: string) => {
    updateState({ loading: true, error: null })
    
    try {
      const parsedData = parseMovieData(input, detectSource(input))
      updateState({ parsedData, loading: false })
    } catch (error) {
      updateState({ error: error.message, loading: false })
    }
  }
  
  return { state, parseData, updateState }
}
```

### 3. Error Boundary Pattern
```typescript
class MovieParserErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Movie Parser Error:', error, errorInfo)
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong with the movie parser</h2>
          <details>
            {this.state.error && this.state.error.toString()}
          </details>
        </div>
      )
    }
    
    return this.props.children
  }
}
```

## Testing Examples

### 1. Unit Tests
```typescript
describe('parseMovieData', () => {
  test('should parse JavDB data correctly', () => {
    const input = 'Title: Test Movie\nActresses: Test Actress'
    const result = parseMovieData(input, 'javdb')
    
    expect(result.title).toBe('Test Movie')
    expect(result.actresses).toContain('Test Actress')
  })
  
  test('should handle empty input', () => {
    expect(() => parseMovieData('', 'javdb')).toThrow('Invalid input')
  })
  
  test('should handle invalid source', () => {
    expect(() => parseMovieData('test', 'invalid' as any)).toThrow('Unknown source')
  })
})
```

### 2. Integration Tests
```typescript
describe('Movie Parser Integration', () => {
  test('should handle complete parsing flow', async () => {
    const input = 'Title: Test Movie\nActresses: Test Actress'
    const masterData = { actresses: [{ id: 1, name: 'Test Actress' }] }
    
    const parsedData = parseMovieData(input, 'javdb')
    const matchedData = matchMovieData(parsedData, masterData)
    const movieData = convertToMovie(parsedData, matchedData, {})
    
    expect(movieData.title).toBe('Test Movie')
    expect(movieData.actresses).toHaveLength(1)
    expect(movieData.actresses[0].name).toBe('Test Actress')
  })
})
```

### 3. E2E Tests
```typescript
describe('Movie Parser E2E', () => {
  test('should parse and save movie successfully', async () => {
    // Setup
    const input = 'Title: Test Movie\nActresses: Test Actress'
    
    // Action
    await userEvent.type(screen.getByRole('textbox'), input)
    await userEvent.click(screen.getByText('Parse'))
    await userEvent.click(screen.getByText('Save'))
    
    // Assert
    expect(screen.getByText('Movie saved successfully')).toBeInTheDocument()
  })
})
```

---

*Examples dan best practices ini membantu developer memahami cara menggunakan Movie Parser dengan benar dan efisien.*
