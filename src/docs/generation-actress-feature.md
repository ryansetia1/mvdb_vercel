# Fitur Generation dan Aktris

## Deskripsi
Fitur ini menambahkan sistem generation (generasi) dan aktris ke dalam aplikasi Movie Database. Generation digunakan untuk mengkategorikan aktris berdasarkan periode atau era tertentu, sementara aktris memiliki profil lengkap dengan foto profil dan informasi detail.

## Struktur Data

### 1. Generation
```typescript
interface Generation {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
}
```

**Contoh Data:**
- Generation 1: "2000-2005"
- Generation 2: "2006-2010" 
- Generation 3: "2011-2015"
- Generation 4: "2016-2020"
- Generation 5: "2021-Sekarang"

### 2. Actress
```typescript
interface Actress {
  id: string
  name: string
  name_jp?: string
  generation_id: string
  profile_photo_url?: string
  profile_photo_path?: string
  created_at: string
  updated_at: string
  generation?: Generation
}
```

**Relasi:**
- `generation_id` → `Generation.id` (Foreign Key)
- `generation` → Object Generation lengkap (populated via join)

## Database Schema

### Tabel `generations`
```sql
CREATE TABLE generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Tabel `actresses`
```sql
CREATE TABLE actresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  name_jp VARCHAR(255),
  generation_id UUID REFERENCES generations(id) ON DELETE CASCADE,
  profile_photo_url TEXT,
  profile_photo_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## API Endpoints

### Generation API (`/utils/generationApi.ts`)

#### GET `/generations`
Mengambil semua generation
```typescript
const generations = await generationApi.getGenerations(accessToken)
```

#### POST `/generations`
Membuat generation baru
```typescript
const newGeneration = await generationApi.createGeneration({
  name: "Generation 6",
  description: "2025-Sekarang"
}, accessToken)
```

#### PUT `/generations/:id`
Update generation
```typescript
const updatedGeneration = await generationApi.updateGeneration(id, {
  name: "Updated Name",
  description: "Updated Description"
}, accessToken)
```

#### DELETE `/generations/:id`
Hapus generation
```typescript
await generationApi.deleteGeneration(id, accessToken)
```

### Actress API (`/utils/actressApi.ts`)

#### GET `/actresses`
Mengambil semua aktris dengan generation
```typescript
const actresses = await actressApi.getActresses(accessToken)
```

#### POST `/actresses`
Membuat aktris baru
```typescript
const newActress = await actressApi.createActress({
  name: "Aktris Name",
  name_jp: "アクティス ネーム",
  generation_id: "generation-uuid"
}, accessToken)
```

#### PUT `/actresses/:id`
Update aktris
```typescript
const updatedActress = await actressApi.updateActress(id, {
  name: "Updated Name",
  name_jp: "Updated JP Name"
}, accessToken)
```

#### DELETE `/actresses/:id`
Hapus aktris
```typescript
await actressApi.deleteActress(id, accessToken)
```

#### POST `/actresses/:id/upload-photo`
Upload foto profil aktris
```typescript
const formData = new FormData()
formData.append('photo', photoFile)
const result = await actressApi.uploadProfilePhoto(id, formData, accessToken)
```

## Komponen UI

### 1. GenerationSelector.tsx
Komponen dropdown untuk memilih generation.

**Props:**
```typescript
interface GenerationSelectorProps {
  selectedGenerationId: string | null
  onGenerationChange: (generationId: string | null) => void
  generations: Generation[]
  placeholder?: string
  disabled?: boolean
}
```

**Fitur:**
- Dropdown dengan semua generation yang tersedia
- Placeholder text yang dapat dikustomisasi
- Support untuk disabled state
- Callback untuk handle perubahan selection

### 2. ActressForm.tsx
Form untuk membuat atau mengedit aktris.

**Props:**
```typescript
interface ActressFormProps {
  actress?: Actress
  generations: Generation[]
  onSubmit: (data: ActressFormData) => void
  onCancel: () => void
  isLoading?: boolean
}
```

**Fitur:**
- Input nama aktris (required)
- Input nama Jepang (optional)
- Generation selector
- Upload foto profil dengan preview
- Validasi form
- Loading state

### 3. ActressCard.tsx
Card untuk menampilkan informasi aktris.

**Props:**
```typescript
interface ActressCardProps {
  actress: Actress
  onEdit?: (actress: Actress) => void
  onDelete?: (actress: Actress) => void
  showActions?: boolean
}
```

**Fitur:**
- Tampilan foto profil dengan fallback
- Nama aktris dan nama Jepang
- Badge generation
- Action buttons (edit/delete)
- Responsive design

### 4. ActressManagement.tsx
Halaman utama untuk mengelola aktris.

**Fitur:**
- List semua aktris dengan pagination
- Search dan filter berdasarkan generation
- Modal untuk create/edit aktris
- Confirmation dialog untuk delete
- Bulk operations (future enhancement)

## Sistem Foto Profil

### Upload Process
1. User memilih file foto melalui input file
2. File divalidasi (format, size)
3. Preview ditampilkan sebelum upload
4. File diupload ke Supabase Storage
5. URL foto disimpan ke database

### Storage Structure
```
actress-photos/
├── {actress-id}/
│   ├── profile.jpg
│   └── profile_thumb.jpg (future: thumbnail)
```

### Fallback System
Jika aktris tidak memiliki foto profil:
- Menampilkan avatar default dengan inisial nama
- Background color berdasarkan generation
- Icon person sebagai fallback

### Image Optimization
- Format yang didukung: JPG, PNG, WebP
- Maksimal size: 5MB
- Auto-resize untuk konsistensi (future enhancement)
- Lazy loading untuk performa (future enhancement)

## Relasi Data

### Generation → Actress (One-to-Many)
- Satu generation dapat memiliki banyak aktris
- Aktris harus memiliki generation (required)
- Cascade delete: jika generation dihapus, semua aktris terkait juga dihapus

### Actress → Movie (Many-to-Many)
- Satu aktris dapat bermain di banyak movie
- Satu movie dapat memiliki banyak aktris
- Relasi melalui tabel junction `movie_actresses`

### Future Relations
- Actress → Photobook (One-to-Many)
- Actress → Favorites (Many-to-Many)
- Actress → Tags (Many-to-Many)

## State Management

### Context: ActressContext
```typescript
interface ActressContextType {
  actresses: Actress[]
  generations: Generation[]
  isLoading: boolean
  error: string | null
  fetchActresses: () => Promise<void>
  fetchGenerations: () => Promise<void>
  createActress: (data: ActressFormData) => Promise<void>
  updateActress: (id: string, data: Partial<Actress>) => Promise<void>
  deleteActress: (id: string) => Promise<void>
  uploadProfilePhoto: (id: string, file: File) => Promise<void>
}
```

### Hooks
- `useActresses()` - Hook untuk mengakses actress context
- `useGenerations()` - Hook untuk mengakses generation data
- `useActressManagement()` - Hook untuk operasi CRUD aktris

## Error Handling

### Validation Errors
- Nama aktris harus unique per generation
- Generation harus valid (exists)
- File upload harus sesuai format dan size

### API Errors
- Network errors dengan retry mechanism
- Authentication errors dengan redirect ke login
- Server errors dengan user-friendly messages

### UI Error States
- Loading skeletons
- Error boundaries
- Toast notifications
- Form validation feedback

## Performance Considerations

### Data Fetching
- Lazy loading untuk list aktris
- Pagination untuk large datasets
- Caching dengan React Query (future)
- Optimistic updates untuk better UX

### Image Loading
- Lazy loading untuk foto profil
- Progressive image loading
- WebP format untuk better compression
- CDN untuk static assets

### Database Optimization
- Index pada `generation_id` di tabel `actresses`
- Index pada `name` untuk search
- Soft delete untuk audit trail (future)

## Security

### File Upload Security
- File type validation
- File size limits
- Virus scanning (future)
- Secure file storage

### Data Access Control
- Row Level Security (RLS) di Supabase
- User-based access control
- Audit logging untuk changes

## Testing Strategy

### Unit Tests
- API functions
- Utility functions
- Form validation
- Data transformation

### Integration Tests
- API endpoints
- Database operations
- File upload flow
- User workflows

### E2E Tests
- Complete user journeys
- Cross-browser compatibility
- Mobile responsiveness

## Future Enhancements

### Planned Features
1. **Bulk Import/Export**
   - CSV import untuk aktris
   - Excel export untuk reporting

2. **Advanced Search**
   - Filter berdasarkan multiple criteria
   - Full-text search
   - Saved search queries

3. **Analytics Dashboard**
   - Statistik aktris per generation
   - Popular aktris
   - Trend analysis

4. **Social Features**
   - User ratings untuk aktris
   - Comments dan reviews
   - Favorites system

5. **Mobile App**
   - React Native version
   - Offline support
   - Push notifications

### Technical Improvements
1. **Caching Layer**
   - Redis untuk session storage
   - CDN untuk static assets
   - Database query optimization

2. **Real-time Updates**
   - WebSocket untuk live updates
   - Collaborative editing
   - Real-time notifications

3. **Advanced UI/UX**
   - Drag & drop untuk file upload
   - Infinite scroll
   - Advanced filtering UI

## Migration Guide

### Dari Sistem Lama
Jika ada sistem aktris sebelumnya:

1. **Data Migration**
   ```sql
   -- Migrate existing actress data
   INSERT INTO generations (name, description) VALUES 
   ('Legacy', 'Data dari sistem lama');
   
   INSERT INTO actresses (name, generation_id)
   SELECT name, (SELECT id FROM generations WHERE name = 'Legacy')
   FROM old_actress_table;
   ```

2. **Code Migration**
   - Update semua referensi ke actress data
   - Migrate form components
   - Update API calls

### Version Compatibility
- Backward compatibility untuk 2 versi sebelumnya
- Deprecation warnings untuk old APIs
- Migration scripts untuk database changes

## Troubleshooting

### Common Issues

#### 1. Foto Profil Tidak Muncul
**Penyebab:** URL foto tidak valid atau file tidak ada
**Solusi:** 
- Check URL di database
- Verify file exists di storage
- Check permissions

#### 2. Generation Tidak Muncul di Dropdown
**Penyebab:** Data generation kosong atau error fetch
**Solusi:**
- Check API endpoint
- Verify authentication
- Check database connection

#### 3. Error Upload Foto
**Penyebab:** File size terlalu besar atau format tidak didukung
**Solusi:**
- Check file size (max 5MB)
- Verify format (JPG, PNG, WebP)
- Check network connection

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
