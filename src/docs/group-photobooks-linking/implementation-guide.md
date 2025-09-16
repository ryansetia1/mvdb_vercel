# Implementation Guide for Group Photobooks Linking

## Overview
Panduan step-by-step untuk mengimplementasikan fitur Group Photobooks Linking.

## Phase 1: Database Schema & API (Week 1)

### Step 1: Extend Photobook Interface
```typescript
// src/utils/photobookApi.ts
interface Photobook {
  id?: string
  titleEn: string
  titleJp?: string
  link?: string
  cover?: string
  releaseDate?: string
  actress?: string
  imageLinks?: string
  imageTags?: ImageTag[]
  
  // NEW: Linking fields
  linkedTo?: {
    groupId?: string
    generationId?: string
    lineupId?: string
    memberId?: string
  }
  
  // NEW: Metadata
  createdAt?: string
  updatedAt?: string
}
```

### Step 2: Update Server-Side API
```typescript
// src/supabase/functions/server/photobookApi.tsx
// Add new endpoints for linking functionality
```

### Step 3: Add Client-Side API Methods
```typescript
// src/utils/photobookApi.ts
export const photobookApi = {
  // ... existing methods
  
  async getPhotobooksByGroup(groupId: string, accessToken: string): Promise<Photobook[]>
  async getPhotobooksByGeneration(generationId: string, accessToken: string): Promise<Photobook[]>
  async getPhotobooksByLineup(lineupId: string, accessToken: string): Promise<Photobook[]>
  async getPhotobooksByMember(memberId: string, accessToken: string): Promise<Photobook[]>
  async linkPhotobook(photobookId: string, targetType: string, targetId: string, accessToken: string): Promise<Photobook>
  async unlinkPhotobook(photobookId: string, targetType: string, accessToken: string): Promise<Photobook>
  async getAvailablePhotobooksForLinking(accessToken: string): Promise<Photobook[]>
}
```

## Phase 2: UI Components (Week 2)

### Step 1: Create Base Components
```bash
# Create component files
mkdir -p src/components/photobooks
touch src/components/photobooks/PhotobookCard.tsx
touch src/components/photobooks/PhotobookGrid.tsx
touch src/components/photobooks/PhotobookLinkingDialog.tsx
```

### Step 2: Implement PhotobookCard
```typescript
// src/components/photobooks/PhotobookCard.tsx
export function PhotobookCard({ photobook, onCardClick, onUnlink, showUnlinkButton }: PhotobookCardProps) {
  // Implementation details in ui-design.md
}
```

### Step 3: Implement PhotobookGrid
```typescript
// src/components/photobooks/PhotobookGrid.tsx
export function PhotobookGrid({ photobooks, onPhotobookClick, onUnlinkPhotobook, showUnlinkButtons, isLoading, emptyStateMessage, onLinkPhotobooks }: PhotobookGridProps) {
  // Implementation details in ui-design.md
}
```

### Step 4: Implement PhotobookLinkingDialog
```typescript
// src/components/photobooks/PhotobookLinkingDialog.tsx
export function PhotobookLinkingDialog({ open, onOpenChange, targetType, targetId, targetName, onLink }: PhotobookLinkingDialogProps) {
  // Implementation details in ui-design.md
}
```

## Phase 3: Integration (Week 3)

### Step 1: Create Photobooks Tab Content
```typescript
// src/components/content/photobooks/PhotobooksTabContent.tsx
export function PhotobooksTabContent({ group, accessToken, onPhotobookSelect }: PhotobooksTabContentProps) {
  // Implementation details in ui-design.md
}
```

### Step 2: Update GroupDetailContent
```typescript
// src/components/content/GroupDetailContent.tsx
// Add Photobooks tab to existing tabs
<TabsList className="grid w-full grid-cols-4">
  <TabsTrigger value="members">Members</TabsTrigger>
  <TabsTrigger value="generations">Generations</TabsTrigger>
  <TabsTrigger value="gallery">Gallery</TabsTrigger>
  <TabsTrigger value="photobooks">Photobooks</TabsTrigger>
</TabsList>

<TabsContent value="photobooks">
  <PhotobooksTabContent 
    group={group}
    accessToken={accessToken}
    onPhotobookSelect={onPhotobookSelect}
  />
</TabsContent>
```

### Step 3: Add Navigation Support
```typescript
// src/components/UnifiedApp.tsx
// Add photobook selection handler
const handlePhotobookSelect = (photobook: Photobook) => {
  setContentState({
    mode: 'photobookDetail',
    data: photobook,
    title: photobook.titleEn || photobook.titleJp || 'Photobook Details'
  })
}
```

## Phase 4: Testing & Polish (Week 4)

### Step 1: Unit Tests
```typescript
// src/components/photobooks/__tests__/PhotobookCard.test.tsx
describe('PhotobookCard', () => {
  it('renders photobook information correctly', () => {
    // Test implementation
  })
  
  it('handles click events', () => {
    // Test implementation
  })
  
  it('shows unlink button when enabled', () => {
    // Test implementation
  })
})
```

### Step 2: Integration Tests
```typescript
// src/components/content/__tests__/PhotobooksTabContent.test.tsx
describe('PhotobooksTabContent', () => {
  it('loads and displays photobooks correctly', () => {
    // Test implementation
  })
  
  it('handles linking workflow', () => {
    // Test implementation
  })
  
  it('handles unlinking workflow', () => {
    // Test implementation
  })
})
```

### Step 3: E2E Tests
```typescript
// cypress/e2e/photobooks-linking.cy.ts
describe('Photobooks Linking', () => {
  it('should complete full linking workflow', () => {
    // Test implementation
  })
})
```

## File Structure
```
src/
├── components/
│   ├── photobooks/
│   │   ├── PhotobookCard.tsx
│   │   ├── PhotobookGrid.tsx
│   │   ├── PhotobookLinkingDialog.tsx
│   │   └── __tests__/
│   │       ├── PhotobookCard.test.tsx
│   │       ├── PhotobookGrid.test.tsx
│   │       └── PhotobookLinkingDialog.test.tsx
│   └── content/
│       ├── photobooks/
│       │   ├── PhotobooksTabContent.tsx
│       │   └── __tests__/
│       │       └── PhotobooksTabContent.test.tsx
│       └── GroupDetailContent.tsx (modified)
├── utils/
│   └── photobookApi.ts (modified)
└── supabase/
    └── functions/
        └── server/
            └── photobookApi.tsx (modified)
```

## Testing Checklist
- [ ] Unit tests for all components
- [ ] Integration tests for API endpoints
- [ ] E2E tests for user workflows
- [ ] Performance testing
- [ ] Accessibility testing
- [ ] Cross-browser testing
- [ ] Mobile responsiveness testing

## Deployment Checklist
- [ ] Database schema updates
- [ ] API endpoint deployment
- [ ] Frontend component deployment
- [ ] Feature flag configuration
- [ ] Monitoring setup
- [ ] Error tracking setup
- [ ] Performance monitoring setup

## Rollback Plan
1. **Database**: Revert schema changes
2. **API**: Disable new endpoints
3. **Frontend**: Remove new components
4. **Configuration**: Revert feature flags

## Success Metrics
- **User Engagement**: Track tab usage and linking actions
- **Performance**: Monitor loading times and API response times
- **Error Rates**: Monitor error rates and user-reported issues
- **Data Quality**: Monitor data consistency and integrity
