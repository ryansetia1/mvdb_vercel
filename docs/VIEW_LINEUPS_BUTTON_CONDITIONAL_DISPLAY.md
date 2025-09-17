# View Lineups Button Conditional Display

## Problem Description
Tombol "View Lineups" selalu muncul di setiap generation card, bahkan ketika generation tersebut tidak memiliki lineups. Ini menyebabkan user confusion dan UI yang tidak optimal.

## Root Cause Analysis

### Current Behavior
```typescript
// SEBELUM: Tombol selalu muncul
<Button onClick={handleViewLineups}>
  {showLineups ? 'Hide Lineups' : 'View Lineups'}
</Button>
```

### Issues:
1. **User Confusion**: User mengklik tombol "View Lineups" tapi tidak ada lineups untuk ditampilkan
2. **Poor UX**: Tombol yang tidak berguna tetap muncul
3. **Inconsistent UI**: Semua generation terlihat sama meskipun ada yang tidak memiliki lineups

## Solution Implementation

### Conditional Display Logic
```typescript
// SESUDAH: Tombol hanya muncul jika generation memiliki lineups
{(() => {
  // Check if this generation has lineups from cached status
  const hasLineups = generationLineupStatus[generation.id]
  
  // Don't show button if generation has no lineups
  if (hasLineups === false) {
    return null
  }
  
  // Show button if generation has lineups or status is not yet loaded
  return (
    <Button onClick={handleViewLineups}>
      {showLineups ? 'Hide Lineups' : 'View Lineups'}
    </Button>
  )
})()}
```

### State Management Enhancement
```typescript
// State untuk menyimpan status lineup setiap generation
const [generationLineupStatus, setGenerationLineupStatus] = useState<{ [generationId: string]: boolean }>({})

// Load lineup status for all generations
useEffect(() => {
  const loadLineupStatusForAllGenerations = async () => {
    if (!generations.length || !accessToken) return
    
    try {
      const allLineups = await masterDataApi.getByType('lineup', accessToken)
      const statusMap: { [generationId: string]: boolean } = {}
      
      generations.forEach(generation => {
        const generationLineups = allLineups.filter(lineup => lineup.generationId === generation.id)
        statusMap[generation.id] = generationLineups.length > 0
      })
      
      setGenerationLineupStatus(statusMap)
    } catch (err) {
      console.error('Error loading lineup status:', err)
    }
  }
  
  loadLineupStatusForAllGenerations()
}, [generations, accessToken])

// Reset lineup data when generation changes
useEffect(() => {
  if (selectedGenerationId) {
    setLineupData(null)
    setLineupDataLoaded(false)
  }
}, [selectedGenerationId])
```

## Implementation Details

### Two Button Locations
Ada **dua tempat** di mana tombol "View Lineups" diimplementasikan:

1. **Generation Card Button** (Line 2033-2064) - Tombol di dalam setiap generation card
2. **Global View Button** (Line 2135-2171) - Tombol di bagian bawah untuk generation yang sedang dipilih

### Before Fix
```typescript
// GroupDetailContent.tsx - Line 2033-2050 (Generation Card Button)
<Button
  size="sm"
  variant="outline"
  onClick={(e) => {
    e.stopPropagation()
    if (selectedGenerationId === generation.id && showLineups) {
      setShowLineups(false)
    } else {
      handleViewLineups(generation)
    }
  }}
  className="h-6 px-2 text-xs w-full"
>
  {selectedGenerationId === generation.id && showLineups ? 'Hide Lineups' : 'View Lineups'}
</Button>

// GroupDetailContent.tsx - Line 2135-2155 (Global View Button)
<Button
  size="sm"
  variant="outline"
  onClick={async () => {
    if (showLineups) {
      setShowLineups(false)
    } else {
      if (selectedGenerationId) {
        if (!lineupDataLoaded) {
          await loadLineupData(selectedGenerationId)
        }
        setShowLineups(true)
      }
    }
  }}
  className="h-8 px-3 text-xs"
>
  {showLineups ? 'Hide Lineups' : 'View Lineups'}
</Button>
```

### After Fix
```typescript
// GroupDetailContent.tsx - Line 2033-2064 (Generation Card Button)
{(() => {
  const hasLineups = lineupData?.lineups && lineupData.lineups.length > 0
  
  // Don't show button if lineup data is loaded and there are no lineups
  if (lineupDataLoaded && !hasLineups && selectedGenerationId === generation.id) {
    return null
  }
  
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={(e) => {
        e.stopPropagation()
        if (selectedGenerationId === generation.id && showLineups) {
          setShowLineups(false)
        } else {
          handleViewLineups(generation)
        }
      }}
      className="h-6 px-2 text-xs w-full"
    >
      {selectedGenerationId === generation.id && showLineups ? 'Hide Lineups' : 'View Lineups'}
    </Button>
  )
})()}

// GroupDetailContent.tsx - Line 2135-2171 (Global View Button)
{(() => {
  const hasLineups = lineupData?.lineups && lineupData.lineups.length > 0
  
  if (lineupDataLoaded && !hasLineups) {
    return null
  }
  
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={async () => {
        if (showLineups) {
          setShowLineups(false)
        } else {
          if (selectedGenerationId) {
            if (!lineupDataLoaded) {
              await loadLineupData(selectedGenerationId)
            }
            if (lineupData?.lineups && lineupData.lineups.length > 0) {
              setShowLineups(true)
            }
          }
        }
      }}
      className="h-8 px-3 text-xs"
    >
      {showLineups ? 'Hide Lineups' : 'View Lineups'}
    </Button>
  )
})()}
```

## Behavior Flow

### Scenario 1: Generation with Lineups
1. User selects generation
2. User clicks "View Lineups" button
3. Lineup data loads
4. Button remains visible (has lineups)
5. Lineups are displayed

### Scenario 2: Generation without Lineups
1. User selects generation
2. User clicks "View Lineups" button
3. Lineup data loads (empty array)
4. Button disappears (no lineups)
5. No lineups displayed

### Scenario 3: Generation Change
1. User switches to different generation
2. Lineup data resets (`setLineupData(null)`, `setLineupDataLoaded(false)`)
3. Button appears again (ready to check new generation)
4. Process repeats for new generation

## Technical Considerations

### State Management
- **lineupData**: Stores actual lineup data for current generation
- **lineupDataLoaded**: Tracks whether lineup data has been fetched
- **selectedGenerationId**: Triggers lineup data reset when changed

### Performance Optimization
- Lineup data is only loaded when user clicks "View Lineups"
- Data is cached per generation to avoid re-fetching
- Reset mechanism ensures clean state for each generation

### User Experience
- Button appears initially (user can check if lineups exist)
- Button disappears if no lineups found (clean UI)
- Button reappears when switching generations (consistent behavior)

## Testing Checklist

### Before Testing
- [ ] Identify generations with and without lineups
- [ ] Understand current button behavior
- [ ] Plan test scenarios

### During Testing
- [ ] Test generation with lineups (button should remain)
- [ ] Test generation without lineups (button should disappear)
- [ ] Test generation switching (button should reappear)
- [ ] Test lineup data loading states

### After Testing
- [ ] Confirm conditional display works correctly
- [ ] Verify no performance issues
- [ ] Check UI consistency
- [ ] Document the solution

## Common Issues and Solutions

### Issue 1: Button doesn't disappear after loading
**Root Cause**: `lineupDataLoaded` not properly set
**Solution**: Ensure `setLineupDataLoaded(true)` is called after data load

### Issue 2: Button doesn't reappear when switching generations
**Root Cause**: Lineup data not reset on generation change
**Solution**: Add useEffect to reset lineup data when `selectedGenerationId` changes

### Issue 3: Button appears but no lineups show
**Root Cause**: Lineup data loaded but empty array
**Solution**: Check `lineupData?.lineups.length > 0` condition

## Prevention Guidelines

### 1. Code Review Checklist
- [ ] Conditional display logic is implemented
- [ ] State reset on generation change
- [ ] Proper null/undefined checks
- [ ] Performance considerations

### 2. Development Guidelines
- [ ] Always check data availability before showing UI elements
- [ ] Implement proper state management for conditional displays
- [ ] Test all scenarios (with/without data)
- [ ] Consider user experience implications

### 3. Testing Guidelines
- [ ] Test with data and without data
- [ ] Test state transitions
- [ ] Test performance impact
- [ ] Test edge cases

## Related Documentation
- [Generations Actress Assignment Integration](./GENERATIONS_ACTRESS_ASSIGNMENT_INTEGRATION.md) - Related generation management
- [Button Click Dialog Closing Fix](./BUTTON_CLICK_DIALOG_CLOSING_FIX.md) - Button event handling
- [Lineup Management](./lineup-feature.md) - Lineup system overview

---

**Last Updated**: January 2025
**Version**: 1.0.0
**Status**: ✅ Implemented
