# UI/UX Design for Group Photobooks Linking

## Overview
Dokumen ini menjelaskan design UI/UX untuk fitur Group Photobooks Linking, termasuk komponen, layout, dan user flow.

## Current UI Structure

### Group Detail Page Layout
```typescript
// src/components/content/GroupDetailContent.tsx
<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
  <TabsList className="grid w-full grid-cols-3">
    <TabsTrigger value="members">Members</TabsTrigger>
    <TabsTrigger value="generations">Generations</TabsTrigger>
    <TabsTrigger value="gallery">Gallery</TabsTrigger>
  </TabsList>
  
  <TabsContent value="members">...</TabsContent>
  <TabsContent value="generations">...</TabsContent>
  <TabsContent value="gallery">...</TabsContent>
</Tabs>
```

## New UI Design

### Extended Tab Structure
```typescript
// Updated Group Detail Page Layout
<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
  <TabsList className="grid w-full grid-cols-4">
    <TabsTrigger value="members">Members</TabsTrigger>
    <TabsTrigger value="generations">Generations</TabsTrigger>
    <TabsTrigger value="gallery">Gallery</TabsTrigger>
    <TabsTrigger value="photobooks">Photobooks</TabsTrigger>
  </TabsList>
  
  <TabsContent value="members">...</TabsContent>
  <TabsContent value="generations">...</TabsContent>
  <TabsContent value="gallery">...</TabsContent>
  <TabsContent value="photobooks">
    <PhotobooksTabContent 
      group={group}
      accessToken={accessToken}
      onPhotobookSelect={onPhotobookSelect}
    />
  </TabsContent>
</Tabs>
```

### Photobooks Tab Content Structure
```typescript
// src/components/content/photobooks/PhotobooksTabContent.tsx
interface PhotobooksTabContentProps {
  group: MasterDataItem
  accessToken: string
  onPhotobookSelect: (photobook: Photobook) => void
}

export function PhotobooksTabContent({ group, accessToken, onPhotobookSelect }: PhotobooksTabContentProps) {
  const [activeSubTab, setActiveSubTab] = useState('group')
  const [photobooks, setPhotobooks] = useState<{
    group: Photobook[]
    generation: Photobook[]
    lineup: Photobook[]
    member: Photobook[]
  }>({
    group: [],
    generation: [],
    lineup: [],
    member: []
  })
  const [isLoading, setIsLoading] = useState(true)
  const [linkingDialogOpen, setLinkingDialogOpen] = useState(false)
  const [linkingTarget, setLinkingTarget] = useState<{
    type: 'group' | 'generation' | 'lineup' | 'member'
    id: string
    name: string
  } | null>(null)

  return (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="group" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Group
            {photobooks.group.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {photobooks.group.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="generation" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Generation
            {photobooks.generation.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {photobooks.generation.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="lineup" className="flex items-center gap-2">
            <Users2 className="h-4 w-4" />
            Lineup
            {photobooks.lineup.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {photobooks.lineup.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="member" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Member
            {photobooks.member.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {photobooks.member.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Sub-tab Contents */}
        <TabsContent value="group" className="mt-6">
          <PhotobookSubTabContent
            photobooks={photobooks.group}
            targetType="group"
            targetId={group.id}
            targetName={group.name || 'Group'}
            isLoading={isLoading}
            onLinkPhotobooks={() => {
              setLinkingTarget({ type: 'group', id: group.id, name: group.name || 'Group' })
              setLinkingDialogOpen(true)
            }}
            onPhotobookSelect={onPhotobookSelect}
            onUnlinkPhotobook={handleUnlinkPhotobook}
          />
        </TabsContent>

        <TabsContent value="generation" className="mt-6">
          <PhotobookSubTabContent
            photobooks={photobooks.generation}
            targetType="generation"
            targetId=""
            targetName="Generation"
            isLoading={isLoading}
            onLinkPhotobooks={() => {
              setLinkingTarget({ type: 'generation', id: '', name: 'Generation' })
              setLinkingDialogOpen(true)
            }}
            onPhotobookSelect={onPhotobookSelect}
            onUnlinkPhotobook={handleUnlinkPhotobook}
          />
        </TabsContent>

        <TabsContent value="lineup" className="mt-6">
          <PhotobookSubTabContent
            photobooks={photobooks.lineup}
            targetType="lineup"
            targetId=""
            targetName="Lineup"
            isLoading={isLoading}
            onLinkPhotobooks={() => {
              setLinkingTarget({ type: 'lineup', id: '', name: 'Lineup' })
              setLinkingDialogOpen(true)
            }}
            onPhotobookSelect={onPhotobookSelect}
            onUnlinkPhotobook={handleUnlinkPhotobook}
          />
        </TabsContent>

        <TabsContent value="member" className="mt-6">
          <PhotobookSubTabContent
            photobooks={photobooks.member}
            targetType="member"
            targetId=""
            targetName="Member"
            isLoading={isLoading}
            onLinkPhotobooks={() => {
              setLinkingTarget({ type: 'member', id: '', name: 'Member' })
              setLinkingDialogOpen(true)
            }}
            onPhotobookSelect={onPhotobookSelect}
            onUnlinkPhotobook={handleUnlinkPhotobook}
          />
        </TabsContent>
      </Tabs>

      {/* Linking Dialog */}
      <PhotobookLinkingDialog
        open={linkingDialogOpen}
        onOpenChange={setLinkingDialogOpen}
        targetType={linkingTarget?.type}
        targetId={linkingTarget?.id}
        targetName={linkingTarget?.name}
        onLink={handleLinkPhotobook}
      />
    </div>
  )
}
```

## Component Designs

### 1. Photobook Card Component
```typescript
// src/components/photobooks/PhotobookCard.tsx
interface PhotobookCardProps {
  photobook: Photobook
  onCardClick: (photobook: Photobook) => void
  onUnlink?: (photobook: Photobook) => void
  showUnlinkButton?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function PhotobookCard({ 
  photobook, 
  onCardClick, 
  onUnlink, 
  showUnlinkButton = false,
  size = 'md'
}: PhotobookCardProps) {
  const sizeClasses = {
    sm: 'w-32 h-48',
    md: 'w-40 h-60',
    lg: 'w-48 h-72'
  }

  return (
    <Card 
      className={`${sizeClasses[size]} cursor-pointer hover:shadow-lg transition-shadow group`}
      onClick={() => onCardClick(photobook)}
    >
      <CardContent className="p-0 h-full">
        {/* Cover Image */}
        <div className="relative h-3/4 overflow-hidden rounded-t-lg">
          {photobook.cover ? (
            <img
              src={photobook.cover}
              alt={photobook.titleEn}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              onError={(e) => {
                e.currentTarget.src = '/placeholder-photobook.jpg'
              }}
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <Camera className="h-12 w-12 text-gray-400" />
            </div>
          )}
          
          {/* Unlink Button */}
          {showUnlinkButton && onUnlink && (
            <Button
              size="sm"
              variant="destructive"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation()
                onUnlink(photobook)
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* Title */}
        <div className="p-3 h-1/4 flex flex-col justify-center">
          <h3 className="font-medium text-sm line-clamp-2 text-center">
            {photobook.titleEn}
          </h3>
          {photobook.titleJp && (
            <p className="text-xs text-gray-500 text-center mt-1 line-clamp-1">
              {photobook.titleJp}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
```

### 2. Photobook Grid Component
```typescript
// src/components/photobooks/PhotobookGrid.tsx
interface PhotobookGridProps {
  photobooks: Photobook[]
  onPhotobookClick: (photobook: Photobook) => void
  onUnlinkPhotobook?: (photobook: Photobook) => void
  showUnlinkButtons?: boolean
  isLoading?: boolean
  emptyStateMessage?: string
  onLinkPhotobooks?: () => void
}

export function PhotobookGrid({
  photobooks,
  onPhotobookClick,
  onUnlinkPhotobook,
  showUnlinkButtons = false,
  isLoading = false,
  emptyStateMessage = "No photobooks linked",
  onLinkPhotobooks
}: PhotobookGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="w-40 h-60 bg-gray-200 animate-pulse rounded-lg" />
        ))}
      </div>
    )
  }

  if (photobooks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Camera className="h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {emptyStateMessage}
        </h3>
        <p className="text-gray-500 mb-4">
          Link photobooks to see them here
        </p>
        {onLinkPhotobooks && (
          <Button onClick={onLinkPhotobooks} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Link Photobooks
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {photobooks.map((photobook) => (
        <PhotobookCard
          key={photobook.id}
          photobook={photobook}
          onCardClick={onPhotobookClick}
          onUnlink={onUnlinkPhotobook}
          showUnlinkButton={showUnlinkButtons}
        />
      ))}
    </div>
  )
}
```

### 3. Photobook Sub-tab Content Component
```typescript
// src/components/photobooks/PhotobookSubTabContent.tsx
interface PhotobookSubTabContentProps {
  photobooks: Photobook[]
  targetType: 'group' | 'generation' | 'lineup' | 'member'
  targetId: string
  targetName: string
  isLoading: boolean
  onLinkPhotobooks: () => void
  onPhotobookSelect: (photobook: Photobook) => void
  onUnlinkPhotobook: (photobook: Photobook, targetType: string, targetId: string) => void
}

export function PhotobookSubTabContent({
  photobooks,
  targetType,
  targetId,
  targetName,
  isLoading,
  onLinkPhotobooks,
  onPhotobookSelect,
  onUnlinkPhotobook
}: PhotobookSubTabContentProps) {
  const handleUnlink = (photobook: Photobook) => {
    onUnlinkPhotobook(photobook, targetType, targetId)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">
            {targetName} Photobooks
          </h2>
          <p className="text-gray-500 text-sm">
            {photobooks.length} photobook{photobooks.length !== 1 ? 's' : ''} linked
          </p>
        </div>
        
        {photobooks.length > 0 && (
          <Button onClick={onLinkPhotobooks} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Link More
          </Button>
        )}
      </div>

      {/* Photobook Grid */}
      <PhotobookGrid
        photobooks={photobooks}
        onPhotobookClick={onPhotobookSelect}
        onUnlinkPhotobook={handleUnlink}
        showUnlinkButtons={true}
        isLoading={isLoading}
        emptyStateMessage={`No photobooks linked to ${targetName.toLowerCase()}`}
        onLinkPhotobooks={onLinkPhotobooks}
      />
    </div>
  )
}
```

### 4. Photobook Linking Dialog Component
```typescript
// src/components/photobooks/PhotobookLinkingDialog.tsx
interface PhotobookLinkingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  targetType?: 'group' | 'generation' | 'lineup' | 'member'
  targetId?: string
  targetName?: string
  onLink: (photobookId: string) => void
}

export function PhotobookLinkingDialog({
  open,
  onOpenChange,
  targetType,
  targetId,
  targetName,
  onLink
}: PhotobookLinkingDialogProps) {
  const [availablePhotobooks, setAvailablePhotobooks] = useState<Photobook[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPhotobooks, setSelectedPhotobooks] = useState<string[]>([])

  const filteredPhotobooks = availablePhotobooks.filter(photobook =>
    photobook.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
    photobook.titleJp?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleLinkSelected = async () => {
    setIsLoading(true)
    try {
      for (const photobookId of selectedPhotobooks) {
        await onLink(photobookId)
      }
      setSelectedPhotobooks([])
      onOpenChange(false)
    } catch (error) {
      console.error('Error linking photobooks:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Link Photobooks to {targetName}
          </DialogTitle>
          <DialogDescription>
            Select photobooks to link to this {targetType}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search photobooks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Photobook Selection */}
          <div className="max-h-96 overflow-y-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {filteredPhotobooks.map((photobook) => (
                <div
                  key={photobook.id}
                  className={`relative cursor-pointer rounded-lg border-2 transition-colors ${
                    selectedPhotobooks.includes(photobook.id || '')
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    const id = photobook.id || ''
                    setSelectedPhotobooks(prev =>
                      prev.includes(id)
                        ? prev.filter(p => p !== id)
                        : [...prev, id]
                    )
                  }}
                >
                  {/* Cover */}
                  <div className="aspect-[3/4] overflow-hidden rounded-t-lg">
                    {photobook.cover ? (
                      <img
                        src={photobook.cover}
                        alt={photobook.titleEn}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <Camera className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  {/* Title */}
                  <div className="p-3">
                    <h3 className="font-medium text-sm line-clamp-2">
                      {photobook.titleEn}
                    </h3>
                    {photobook.titleJp && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                        {photobook.titleJp}
                      </p>
                    )}
                  </div>

                  {/* Selection Indicator */}
                  {selectedPhotobooks.includes(photobook.id || '') && (
                    <div className="absolute top-2 right-2">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-gray-500">
              {selectedPhotobooks.length} photobook{selectedPhotobooks.length !== 1 ? 's' : ''} selected
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleLinkSelected}
                disabled={selectedPhotobooks.length === 0 || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Linking...
                  </>
                ) : (
                  <>
                    <Link className="h-4 w-4 mr-2" />
                    Link Selected
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

## User Flow Design

### 1. Viewing Linked Photobooks
```
User opens Group Detail Page
├── Clicks "Photobooks" tab
├── Sees 4 sub-tabs: Group, Generation, Lineup, Member
├── Clicks on sub-tab (e.g., "Group")
├── Sees grid of photobook cards linked to that level
└── Can click on photobook card to view details
```

### 2. Linking Photobooks
```
User clicks "Link Photobooks" button
├── Linking dialog opens
├── Shows available photobooks in grid format
├── User can search/filter photobooks
├── User selects photobooks to link
├── Clicks "Link Selected" button
├── System links photobooks to target level
└── Dialog closes, photobooks appear in grid
```

### 3. Unlinking Photobooks
```
User hovers over photobook card
├── "Unlink" button appears
├── User clicks "Unlink" button
├── Confirmation dialog appears
├── User confirms unlink action
├── System removes link
└── Photobook disappears from grid
```

## Responsive Design

### Mobile Layout (< 768px)
```css
.photobook-grid {
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.photobook-card {
  width: 100%;
  height: 12rem;
}

.linking-dialog {
  max-width: 100vw;
  max-height: 90vh;
}
```

### Tablet Layout (768px - 1024px)
```css
.photobook-grid {
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
}

.photobook-card {
  width: 10rem;
  height: 15rem;
}
```

### Desktop Layout (> 1024px)
```css
.photobook-grid {
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
}

.photobook-card {
  width: 10rem;
  height: 15rem;
}
```

## Accessibility Features

### Keyboard Navigation
- **Tab Navigation**: All interactive elements accessible via Tab key
- **Arrow Keys**: Navigate between photobook cards
- **Enter/Space**: Activate buttons and links
- **Escape**: Close dialogs and modals

### Screen Reader Support
- **ARIA Labels**: Proper labels for all interactive elements
- **Alt Text**: Descriptive alt text for photobook covers
- **Role Attributes**: Proper ARIA roles for custom components
- **Live Regions**: Announce changes in photobook counts

### Visual Accessibility
- **High Contrast**: Support for high contrast mode
- **Focus Indicators**: Clear focus indicators for keyboard navigation
- **Color Independence**: Information not conveyed by color alone
- **Text Scaling**: Support for text scaling up to 200%

## Animation & Transitions

### Hover Effects
```css
.photobook-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.photobook-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.photobook-card img {
  transition: transform 0.3s ease;
}

.photobook-card:hover img {
  transform: scale(1.05);
}
```

### Loading States
```css
.skeleton {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
```

### Dialog Transitions
```css
.dialog-overlay {
  animation: fadeIn 0.2s ease-out;
}

.dialog-content {
  animation: slideIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { 
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to { 
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
```

## Error States

### Network Errors
```typescript
const NetworkErrorState = () => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <WifiOff className="h-16 w-16 text-red-400 mb-4" />
    <h3 className="text-lg font-medium text-gray-900 mb-2">
      Connection Error
    </h3>
    <p className="text-gray-500 mb-4">
      Unable to load photobooks. Please check your connection.
    </p>
    <Button onClick={() => window.location.reload()}>
      Try Again
    </Button>
  </div>
)
```

### Empty States
```typescript
const EmptyState = ({ onLinkPhotobooks }: { onLinkPhotobooks: () => void }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <Camera className="h-16 w-16 text-gray-400 mb-4" />
    <h3 className="text-lg font-medium text-gray-900 mb-2">
      No Photobooks Linked
    </h3>
    <p className="text-gray-500 mb-4">
      Link photobooks to see them here
    </p>
    <Button onClick={onLinkPhotobooks} className="flex items-center gap-2">
      <Plus className="h-4 w-4" />
      Link Photobooks
    </Button>
  </div>
)
```

## Performance Considerations

### Image Optimization
- **Lazy Loading**: Load photobook covers only when visible
- **Image Compression**: Optimize images for web display
- **Placeholder Images**: Show placeholder while loading
- **Error Handling**: Fallback images for broken links

### Virtual Scrolling
```typescript
// For large photobook lists
const VirtualizedPhotobookGrid = ({ photobooks }: { photobooks: Photobook[] }) => {
  return (
    <FixedSizeGrid
      columnCount={4}
      columnWidth={160}
      height={600}
      rowCount={Math.ceil(photobooks.length / 4)}
      rowHeight={240}
      width={800}
    >
      {({ columnIndex, rowIndex, style }) => {
        const index = rowIndex * 4 + columnIndex
        const photobook = photobooks[index]
        
        if (!photobook) return null
        
        return (
          <div style={style}>
            <PhotobookCard photobook={photobook} />
          </div>
        )
      }}
    </FixedSizeGrid>
  )
}
```

## Conclusion

UI/UX design yang diusulkan memberikan user experience yang intuitif dan konsisten dengan design system yang sudah ada. Fokus pada:
- **Usability**: Easy to understand and use
- **Accessibility**: Inclusive design for all users
- **Performance**: Optimized for fast loading and smooth interactions
- **Responsiveness**: Works well on all device sizes
- **Consistency**: Follows existing design patterns
