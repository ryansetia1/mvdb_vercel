# Fitur Lineup Management

## Deskripsi
Fitur lineup management memungkinkan pengelolaan multiple lineup dalam satu generasi group. Setiap aktris dapat berada di beberapa lineup dengan profil dan alias masing-masing.

## Struktur Data

### 1. Lineup
```typescript
interface Lineup {
  id: string
  name: string
  type: 'lineup'
  generationId: string // Reference to parent generation
  generationName: string // Denormalized generation name
  lineupType: string // Type of lineup (e.g., 'Main', 'Sub', 'Graduated', 'Trainee')
  lineupOrder: number // Order within generation for display
  description?: string
  createdAt: string
}
```

### 2. Actress Lineup Assignment
```typescript
interface ActressLineupData {
  lineupData?: { 
    [lineupId: string]: { 
      alias?: string, 
      profilePicture?: string, 
      photos?: string[] 
    } 
  }
}
```

## Komponen UI

### 1. LineupManagement.tsx
Komponen utama untuk mengelola lineup dalam generasi.

**Fitur:**
- Membuat lineup baru
- Mengedit lineup existing
- Menghapus lineup
- Mengatur tipe lineup (Main, Sub, Graduated, Trainee, Special)
- Mengatur urutan tampil lineup
- Menampilkan member lineup

**Props:**
```typescript
interface LineupManagementProps {
  generationId: string
  generationName: string
  groupId: string
  accessToken: string
}
```

### 2. LineupActressManagement.tsx
Komponen untuk mengelola assignment aktris ke lineup.

**Fitur:**
- Menambahkan aktris ke lineup
- Menghapus aktris dari lineup
- Mengatur alias khusus untuk lineup
- Mengatur foto profil khusus untuk lineup
- Update data aktris per lineup

**Props:**
```typescript
interface LineupActressManagementProps {
  lineupId: string
  lineupName: string
  generationId: string
  accessToken: string
}
```

### 3. LineupDisplay.tsx
Komponen untuk menampilkan lineup dalam group detail.

**Fitur:**
- Menampilkan semua lineup dalam generasi
- Expandable/collapsible lineup cards
- Menampilkan member lineup dengan foto dan alias
- Support untuk profile picture dan alias per lineup

**Props:**
```typescript
interface LineupDisplayProps {
  generationId: string
  generationName: string
  accessToken: string
  onProfileSelect?: (type: string, name: string) => void
  getLineupProfilePicture?: (actress: MasterDataItem, lineupId: string) => string | null
  getLineupAlias?: (actress: MasterDataItem, lineupId: string) => string | null
}
```

## Integrasi dengan Komponen Existing

### 1. GenerationManagement.tsx
- Menambahkan tab "Lineup Management"
- Mengintegrasikan LineupManagement component
- Shared generation selector untuk lineup management

### 2. GroupDetailContent.tsx
- Menambahkan LineupDisplay component
- Menambahkan fungsi helper untuk lineup profile picture dan alias
- Menampilkan lineup setelah generation actresses

### 3. ActorForm.tsx
- Menambahkan lineup assignment section
- Support untuk multiple lineup selection
- Lineup-specific profile pictures dan aliases
- Integration dengan existing group assignment system

## API Integration

### Master Data API
Lineup menggunakan existing masterDataApi dengan type 'lineup':

```typescript
// Create lineup
await masterDataApi.create({
  name: 'Main Lineup',
  type: 'lineup',
  generationId: 'generation-uuid',
  generationName: '1st Generation',
  lineupType: 'Main',
  lineupOrder: 1,
  description: 'Main lineup description'
}, accessToken)

// Update lineup
await masterDataApi.update(lineupId, {
  lineupType: 'Sub',
  lineupOrder: 2
}, accessToken)

// Delete lineup
await masterDataApi.delete(lineupId, accessToken)
```

### Actress Lineup Assignment
```typescript
// Assign actress to lineup with custom data
await masterDataApi.update(actressId, {
  lineupData: {
    [lineupId]: {
      alias: 'Lineup Alias',
      profilePicture: 'https://example.com/lineup-photo.jpg',
      photos: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg']
    }
  }
}, accessToken)
```

## Data Flow

### 1. Lineup Creation Flow
1. User memilih generasi di GenerationManagement
2. User klik "Tambah Lineup" di LineupManagement
3. Form lineup ditampilkan dengan fields: name, type, order, description
4. Data lineup disimpan ke masterDataApi dengan type 'lineup'
5. Lineup ditampilkan dalam list dengan member count

### 2. Actress Assignment Flow
1. User memilih lineup di LineupManagement
2. User klik "Tambah Member" di LineupActressManagement
3. Dropdown menampilkan aktris yang belum di-assign ke lineup
4. User memilih aktris dan mengatur alias/foto profil
5. Data aktris diupdate dengan lineupData
6. Aktris ditampilkan dalam lineup member list

### 3. Display Flow
1. User membuka group detail
2. User memilih generasi
3. LineupDisplay component load lineup data
4. Setiap lineup ditampilkan sebagai expandable card
5. Member lineup ditampilkan dengan foto dan alias khusus

## Tipe Lineup

### Predefined Types
- **Main**: Lineup utama generasi
- **Sub**: Lineup pendukung/sub-unit
- **Graduated**: Member yang sudah lulus
- **Trainee**: Member trainee
- **Special**: Lineup khusus (collaboration, etc.)

### Custom Types
User dapat membuat tipe lineup custom sesuai kebutuhan.

## Fallback System

### Profile Picture Priority
1. Lineup-specific profile picture
2. Generation-specific profile picture
3. Group-specific profile picture
4. Default actress profile picture

### Alias Priority
1. Lineup-specific alias
2. Generation-specific alias
3. Group-specific alias
4. Default actress alias
5. Actress name

## Error Handling

### Validation
- Lineup name harus unique dalam generasi
- Lineup order harus berupa angka positif
- Lineup type harus valid

### API Errors
- Network errors dengan retry mechanism
- Authentication errors dengan redirect
- Server errors dengan user-friendly messages

## Performance Considerations

### Data Loading
- Lazy loading untuk lineup data
- Caching lineup assignments
- Optimistic updates untuk better UX

### UI Optimization
- Virtual scrolling untuk lineup list (future)
- Image lazy loading
- Memoization untuk expensive calculations

## Security

### Data Access
- Row Level Security (RLS) di Supabase
- User-based access control
- Audit logging untuk changes

### File Upload
- File type validation
- File size limits
- Secure file storage

## Testing Strategy

### Unit Tests
- Lineup management functions
- Actress assignment logic
- Data transformation utilities

### Integration Tests
- API endpoints
- Database operations
- Component interactions

### E2E Tests
- Complete lineup management workflow
- Actress assignment flow
- Display functionality

## Future Enhancements

### Planned Features
1. **Bulk Operations**
   - Bulk assign aktris ke lineup
   - Bulk update lineup data
   - Import/export lineup assignments

2. **Advanced Management**
   - Lineup templates
   - Automatic lineup generation
   - Lineup analytics

3. **UI Improvements**
   - Drag & drop untuk lineup order
   - Advanced filtering
   - Bulk selection

4. **Integration**
   - Movie lineup assignments
   - Event lineup management
   - Social media integration

## Migration Guide

### Dari Sistem Lama
Jika ada sistem lineup sebelumnya:

1. **Data Migration**
   ```sql
   -- Migrate existing lineup data
   INSERT INTO master_data (name, type, generation_id, lineup_type, lineup_order)
   SELECT name, 'lineup', generation_id, 'Legacy', 1
   FROM old_lineup_table;
   ```

2. **Code Migration**
   - Update semua referensi ke lineup data
   - Migrate form components
   - Update API calls

### Version Compatibility
- Backward compatibility untuk 2 versi sebelumnya
- Deprecation warnings untuk old APIs
- Migration scripts untuk database changes

## Troubleshooting

### Common Issues

#### 1. Lineup Tidak Muncul
**Penyebab:** Data lineup kosong atau error fetch
**Solusi:**
- Check API endpoint
- Verify authentication
- Check database connection

#### 2. Aktris Tidak Bisa Di-assign ke Lineup
**Penyebab:** Aktris sudah di-assign atau tidak ada di group
**Solusi:**
- Check aktris group assignment
- Verify lineup generation
- Check data consistency

#### 3. Profile Picture Tidak Muncul
**Penyebab:** URL foto tidak valid atau file tidak ada
**Solusi:**
- Check URL di database
- Verify file exists di storage
- Check permissions

### Debug Tools
- Browser DevTools untuk network requests
- Supabase Dashboard untuk database queries
- Console logs untuk error tracking
- React DevTools untuk component state

## Best Practices

### Development
1. **Code Organization**
   - Separate concerns (API, UI, Business Logic)
   - Use TypeScript untuk type safety
   - Follow naming conventions

2. **Performance**
   - Lazy load components
   - Optimize images
   - Use proper caching

3. **Security**
   - Validate all inputs
   - Sanitize file uploads
   - Use proper authentication

### User Experience
1. **Accessibility**
   - Proper ARIA labels
   - Keyboard navigation
   - Screen reader support

2. **Responsiveness**
   - Mobile-first design
   - Touch-friendly interfaces
   - Progressive enhancement

3. **Feedback**
   - Loading states
   - Error messages
   - Success confirmations

---

**Last Updated:** December 2024  
**Version:** 1.0.0  
**Maintainer:** Development Team
