# Group Photobooks Linking Feature

## Overview
Fitur ini menambahkan tab "Photobooks" pada Group Detail Page yang memungkinkan user untuk melihat dan mengelola photobook yang ter-link dengan berbagai tingkatan hirarki group (Group, Generation, Lineup, dan Member).

## Table of Contents
1. [Feature Requirements](#feature-requirements)
2. [Technical Architecture](#technical-architecture)
3. [Database Schema](#database-schema)
4. [API Design](#api-design)
5. [UI/UX Design](#uiux-design)
6. [Implementation Plan](#implementation-plan)
7. [Testing Strategy](#testing-strategy)
8. [Deployment Considerations](#deployment-considerations)

## Feature Requirements

### Functional Requirements
1. **Tab Photobooks**: Menambahkan tab baru "Photobooks" pada Group Detail Page
2. **Sub-tabs**: Tab Photobooks memiliki 4 sub-tab:
   - Group (photobook yang ter-link ke group)
   - Generation (photobook yang ter-link ke generation)
   - Lineup (photobook yang ter-link ke lineup)
   - Member (photobook yang ter-link ke member)
3. **Photobook Display**: Setiap sub-tab menampilkan card cover photobook yang ter-link
4. **Link Photobooks**: Tombol "Link Photobooks" muncul jika tidak ada photobook yang ter-link
5. **Linking System**: Dialog untuk memilih dan link photobook ke tingkatan hirarki tertentu
6. **Unlinking**: Kemampuan untuk unlink photobook dari tingkatan hirarki

### Non-Functional Requirements
1. **Performance**: Loading photobook data harus cepat (< 2 detik)
2. **Responsiveness**: UI harus responsive di berbagai ukuran layar
3. **Consistency**: Mengikuti design pattern yang sudah ada
4. **Accessibility**: Mendukung keyboard navigation dan screen reader

## Technical Architecture

### Current System Analysis
- **Group Detail Page**: `src/components/content/GroupDetailContent.tsx`
- **Tabs System**: Menggunakan shadcn/ui Tabs component
- **Photobook API**: `src/utils/photobookApi.ts`
- **Master Data API**: `src/utils/masterDataApi.ts`
- **Database**: Supabase KV store

### New Components Required
1. `PhotobookLinkingDialog.tsx` - Dialog untuk link/unlink photobooks
2. `PhotobookCard.tsx` - Card component untuk display photobook cover
3. `PhotobookTabContent.tsx` - Content untuk masing-masing sub-tab
4. `PhotobookGrid.tsx` - Grid layout untuk photobook cards

### Data Flow
```
Group Detail Page
├── Load Group Data
├── Load Photobooks Data
│   ├── Group-linked Photobooks
│   ├── Generation-linked Photobooks
│   ├── Lineup-linked Photobooks
│   └── Member-linked Photobooks
└── Render Photobooks Tab with Sub-tabs
```

## Database Schema

### Photobook Schema Extension
```typescript
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

### Linking Relationships
- **One-to-Many**: Satu photobook bisa ter-link ke multiple tingkatan
- **Many-to-One**: Multiple photobooks bisa ter-link ke satu tingkatan
- **Cascade Delete**: Jika group/generation/lineup/member dihapus, link photobook tetap ada

## API Design

### New Endpoints Required

#### 1. Get Photobooks by Hierarchy Level
```typescript
// GET /photobooks/by-group/:groupId
// GET /photobooks/by-generation/:generationId
// GET /photobooks/by-lineup/:lineupId
// GET /photobooks/by-member/:memberId

interface PhotobookResponse {
  photobooks: Photobook[]
  total: number
}
```

#### 2. Link Photobook
```typescript
// POST /photobooks/:photobookId/link
interface LinkRequest {
  targetType: 'group' | 'generation' | 'lineup' | 'member'
  targetId: string
}

interface LinkResponse {
  success: boolean
  photobook: Photobook
}
```

#### 3. Unlink Photobook
```typescript
// DELETE /photobooks/:photobookId/link
interface UnlinkRequest {
  targetType: 'group' | 'generation' | 'lineup' | 'member'
  targetId: string
}

interface UnlinkResponse {
  success: boolean
  photobook: Photobook
}
```

#### 4. Get Available Photobooks for Linking
```typescript
// GET /photobooks/available-for-linking
interface AvailablePhotobooksResponse {
  photobooks: Photobook[]
  total: number
}
```

## UI/UX Design

### Tab Structure
```
Group Detail Page
├── Members Tab
├── Generations Tab
├── Gallery Tab
└── Photobooks Tab (NEW)
    ├── Group Sub-tab
    ├── Generation Sub-tab
    ├── Lineup Sub-tab
    └── Member Sub-tab
```

### Photobook Card Design
```typescript
interface PhotobookCardProps {
  photobook: Photobook
  onCardClick: (photobook: Photobook) => void
  onUnlink: (photobook: Photobook, targetType: string, targetId: string) => void
  showUnlinkButton?: boolean
}
```

### Linking Dialog Design
```typescript
interface PhotobookLinkingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  targetType: 'group' | 'generation' | 'lineup' | 'member'
  targetId: string
  targetName: string
  onLink: (photobookId: string) => void
}
```

### Empty State Design
- **No Photobooks**: Menampilkan tombol "Link Photobooks" dengan icon
- **Loading State**: Skeleton loader untuk photobook cards
- **Error State**: Error message dengan retry button

## Implementation Plan

### Phase 1: Database Schema & API (Week 1)
1. **Extend Photobook Schema**
   - Add `linkedTo` field to Photobook interface
   - Update server-side Photobook interface
   - Add migration script for existing photobooks

2. **Implement API Endpoints**
   - Create new API endpoints in `src/supabase/functions/server/photobookApi.tsx`
   - Add client-side API methods in `src/utils/photobookApi.ts`
   - Test API endpoints

### Phase 2: UI Components (Week 2)
1. **Create Base Components**
   - `PhotobookCard.tsx` - Reusable photobook card
   - `PhotobookGrid.tsx` - Grid layout component
   - `PhotobookLinkingDialog.tsx` - Linking dialog

2. **Create Tab Components**
   - `PhotobookTabContent.tsx` - Base tab content
   - `GroupPhotobooksTab.tsx` - Group-specific tab
   - `GenerationPhotobooksTab.tsx` - Generation-specific tab
   - `LineupPhotobooksTab.tsx` - Lineup-specific tab
   - `MemberPhotobooksTab.tsx` - Member-specific tab

### Phase 3: Integration (Week 3)
1. **Integrate with Group Detail Page**
   - Add Photobooks tab to `GroupDetailContent.tsx`
   - Implement tab switching logic
   - Add loading states and error handling

2. **Implement Linking System**
   - Add linking dialog functionality
   - Implement link/unlink operations
   - Add success/error notifications

### Phase 4: Testing & Polish (Week 4)
1. **Unit Testing**
   - Test API endpoints
   - Test UI components
   - Test linking functionality

2. **Integration Testing**
   - Test complete user flow
   - Test edge cases
   - Performance testing

3. **UI Polish**
   - Responsive design testing
   - Accessibility testing
   - Animation and transitions

## Testing Strategy

### Unit Tests
- **API Tests**: Test all new endpoints
- **Component Tests**: Test individual UI components
- **Utility Tests**: Test helper functions

### Integration Tests
- **User Flow Tests**: Test complete linking workflow
- **Data Consistency Tests**: Test data integrity
- **Performance Tests**: Test loading times

### Manual Testing
- **Cross-browser Testing**: Chrome, Firefox, Safari
- **Responsive Testing**: Mobile, tablet, desktop
- **Accessibility Testing**: Keyboard navigation, screen reader

## Deployment Considerations

### Database Migration
- **Backward Compatibility**: Existing photobooks should work without linking
- **Data Migration**: Add `linkedTo: null` to existing photobooks
- **Rollback Plan**: Ability to rollback if issues occur

### Performance Optimization
- **Caching**: Cache photobook data for better performance
- **Lazy Loading**: Load photobooks only when tab is accessed
- **Pagination**: Implement pagination for large photobook lists

### Monitoring
- **Error Tracking**: Monitor API errors and user interactions
- **Performance Metrics**: Track loading times and user engagement
- **Usage Analytics**: Track which features are most used

## Risk Assessment

### Technical Risks
1. **Data Consistency**: Risk of orphaned links if hierarchy items are deleted
2. **Performance**: Risk of slow loading with many photobooks
3. **API Limits**: Risk of hitting API rate limits

### Mitigation Strategies
1. **Data Validation**: Implement proper validation and cleanup
2. **Caching**: Implement aggressive caching strategy
3. **Rate Limiting**: Implement proper rate limiting and retry logic

## Success Metrics

### User Engagement
- **Tab Usage**: Track how often Photobooks tab is used
- **Linking Actions**: Track number of link/unlink operations
- **User Satisfaction**: Collect user feedback

### Technical Metrics
- **Performance**: Track loading times and API response times
- **Error Rates**: Monitor error rates and user-reported issues
- **Data Quality**: Monitor data consistency and integrity

## Future Enhancements

### Phase 2 Features
1. **Bulk Operations**: Link multiple photobooks at once
2. **Advanced Filtering**: Filter photobooks by date, actress, etc.
3. **Sorting Options**: Sort photobooks by various criteria
4. **Search Functionality**: Search within linked photobooks

### Integration Opportunities
1. **Movie Linking**: Similar linking system for movies
2. **Cross-Reference**: Link photobooks to movies and vice versa
3. **Analytics Dashboard**: Show linking statistics and trends
4. **Export Functionality**: Export linked photobook data

## Conclusion

Fitur Group Photobooks Linking akan memberikan user kemampuan untuk mengorganisir dan mengelola photobook berdasarkan hirarki group dengan cara yang intuitif dan efisien. Implementasi yang bertahap akan memastikan kualitas dan stabilitas sistem sambil memberikan value yang maksimal kepada user.
