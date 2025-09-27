# Movie Database Application - Comprehensive Documentation

## Table of Contents
1. [Application Overview](#application-overview)
2. [Technical Architecture](#technical-architecture)
3. [Features & Functionality](#features--functionality)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Frontend Components](#frontend-components)
7. [Authentication System](#authentication-system)
8. [Token Refresh Solution](#token-refresh-solution)
9. [File Structure](#file-structure)
10. [Development Guidelines](#development-guidelines)
11. [Deployment & Configuration](#deployment--configuration)
12. [Troubleshooting](#troubleshooting)

---

## Application Overview

### Project Description
Aplikasi Movie Database adalah sistem manajemen database film yang komprehensif dengan dashboard admin terintegrasi. Aplikasi ini dibangun menggunakan React, TypeScript, Tailwind CSS, dan Supabase sebagai backend, menyediakan sistem CRUD lengkap untuk mengelola data film, aktor/aktris, sutradara, studio, dan berbagai metadata terkait.

### Key Characteristics
- **Full-Stack Web Application** dengan React frontend dan Supabase backend
- **Authentication System** menggunakan Supabase Auth
- **Responsive Design** dengan constraint maksimum 1536px width
- **Dark/Light Theme Support** dengan smooth transitions
- **Real-time Data Synchronization** melalui Supabase
- **Advanced Image Management** dengan gallery, tagging, dan favorites
- **Comprehensive Search & Filter System**
- **Backup/Restore Functionality** untuk data management

---

## Technical Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS v4.0
- **UI Components**: Custom ShadCN/UI components
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Authentication**: Supabase Auth
- **State Management**: React Context API
- **Icons**: Lucide React
- **Image Handling**: Custom ImageWithFallback component
- **Notifications**: Sonner toast library

### Architecture Pattern
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Supabase       │    │   External      │
│   (React App)   │◄──►│   Edge Functions │◄──►│   Services      │
│                 │    │   (Hono Server)  │    │   (JAV Trailers)│
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                       
         ▼                        ▼                       
┌─────────────────┐    ┌──────────────────┐              
│   UI Components │    │   PostgreSQL     │              
│   & Contexts    │    │   Database       │              
└─────────────────┘    └──────────────────┘              
```

### Project Structure
- **3-tier architecture**: Frontend → Server → Database
- **Component-based architecture** dengan reusable components
- **Context-based state management** untuk global state
- **Utility-first CSS** dengan Tailwind
- **Type-safe development** dengan TypeScript

---

## Features & Functionality

### 1. Movie Management
#### HC Movies (Hard Core)
- Complete CRUD operations
- Cover image management
- Gallery with template system
- Video trailer integration
- Cast and crew assignment
- Release date and duration tracking
- Multiple link types (streaming, download, etc.)

#### SC Movies (Soft Core)
- Simplified version of HC movies
- Basic information management
- Cover and gallery support

#### Movie Types
- **HC (Hard Core)**: Full-featured movies with complete metadata
- **SC (Soft Core)**: Simplified movies with basic information
- **Un (Uncensored)**: Special category with 16:9 aspect ratio covers

#### Movie Parser System
- **R18 Data Integration**: Automatic parsing of movie data from R18 sources
- **Smart Name Matching**: Intelligent matching of actress/actor names between database and R18 data
- **Database vs R18 Comparison**: User-friendly interface to choose between database names and R18 parsed names
- **Automatic Alias Fixing**: Clean and format aliases automatically during save process
- **Name Cleaning**: Remove parentheses and brackets from names, moving aliases to proper alias field
- **Master Data Updates**: Selective updating of existing master data with cleaned information
- **Data Integrity Protection**: Prevents data loss during alias fixing by preserving all existing fields
- **Real-time Validation**: Ensures series always have at least one title (EN or JP) to prevent API errors

### 2. Master Data Management
#### Actresses
- Profile information (name, birth date, measurements, etc.)
- Profile pictures with fallback system
- Age gap calculations
- Movie associations
- Tag management

#### Actors
- Similar to actresses but for male performers
- Profile management
- Movie associations

#### Directors
- Director information and profiles
- Movie directing credits
- Cross-referenced with actors/actresses tables

#### Studios
- Production company information
- Studio logo/branding
- Associated movies tracking

#### Series
- Movie series/collection management
- Series metadata
- Movie grouping functionality

### 3. Advanced Search & Filtering
- **Multi-criteria search** across all data types
- **Real-time filtering** with instant results
- **Saved search states** with URL persistence
- **Advanced filter combinations**
- **Profile-based filtering** (by actress, actor, director, studio)

### 4. Gallery & Image Management
#### Gallery System
- **Template-based gallery generation** with placeholder system
- **Dynamic image loading** from external sources
- **Image favorites** with personal collection
- **Bulk image operations**
- **Image tagging and categorization**

#### Cover Management
- **Dynamic aspect ratios** (3:2 for standard, 16:9 for Un type)
- **Image cropping and optimization**
- **Cover templates** with automatic application
- **Fallback system** for missing images

### 5. Photobook System
- **Digital photobooks** creation and management dengan:
  - Direct editing dari grid view atau detail page
  - Optimized loading behavior yang tidak menghalangi user interaction
  - Consistent UI/UX antara grid dan detail view editing
- **Image collections** organized by themes
- **Gallery integration** dengan:
  - Saved images management
  - Content rating system (NN/N)
  - Optimized loading states
- **Action accessibility** features:
  - Always-clickable action buttons
  - Hover-based visibility dengan smooth transitions
  - Semi-transparent button backgrounds untuk better visibility
- **Photobook sharing** dan collaboration

### 6. Favorites System
- **Multi-type favorites**: images, movies, profiles
- **Personal collections** per user
- **Favorite management** with add/remove functionality
- **Cross-reference tracking**

### 7. Movie Linking System
- **Movie connections** and relationships
- **Series associations**
- **Related content suggestions**
- **Bi-directional linking**

### 8. Backup & Restore
- **Complete data export** to CSV format
- **Selective backup** by data type
- **Restore functionality** with duplicate detection
- **Data integrity validation**

### 9. User Interface Features
#### Theme System
- **Dark/Light mode** toggle
- **Smooth transitions** between themes
- **Persistent theme** preference
- **Theme-aware components**

#### Responsive Design
- **Desktop-first** approach with mobile optimization
- **Maximum width constraint** (1536px)
- **Flexible grid layouts**
- **Touch-friendly interfaces**

#### Navigation
- **Unified navigation** with breadcrumbs
- **Search-integrated navigation**
- **Quick access** to frequently used features
- **Context-aware navigation**

---

## Database Schema

### Core Tables

#### Movies Table (HC Movies)
```sql
id: string (UUID)
code: string (unique movie identifier)
titleEn: string (English title)
titleJp: string (Japanese title)
actress: string (comma-separated names)
actors: string (comma-separated names)
director: string
studio: string
series: string
label: string
type: string (HC/SC/Un)
releaseDate: string (YYYY-MM-DD)
duration: string (minutes)
cover: string (URL)
gallery: string (template string)
dmcode: string (external reference)
dmlink: string (official page URL)
clinks: string (streaming links)
ulinks: string (download links)
slinks: string (subtitle links)
tags: string (comma-separated)
isExcluded: boolean
notes: string
```

#### SC Movies Table (Soft Core Movies)
```sql
id: string (UUID)
code: string
titleEn: string
titleJp: string
actress: string
releaseDate: string
duration: string
cover: string
gallery: string
notes: string
```

#### Master Data Tables
```sql
-- Actresses
id: string (UUID)
name: string (unique)
birthDate: string
measurements: string
profilePicture: string (URL)
tags: string

-- Actors (similar structure to actresses)
-- Directors (similar structure to actresses)
-- Studios
id: string (UUID)
name: string (unique)
description: string
logo: string (URL)

-- Series
id: string (UUID)
name: string (unique)
description: string
```

#### Support Tables
```sql
-- Key-Value Store (kv_store_f3064b20)
key: string (primary key)
value: jsonb
created_at: timestamp
updated_at: timestamp

-- Favorites (stored in KV store)
-- Templates (stored in KV store)  
-- Settings (stored in KV store)
```

### KV Store Data Structure
The application uses a flexible key-value store for various data types:

```typescript
// Favorites
favorites:{userId}:image: ImageFavorite[]
favorites:{userId}:movie: MovieFavorite[]
favorites:{userId}:profile: ProfileFavorite[]

// Templates
cover_templates: CoverTemplate[]

// Settings
movie_type_colors: TypeColorConfig
user_settings:{userId}: UserSettings

// Backup data
backup:movies: Movie[]
backup:actresses: MasterDataItem[]
// ... other backup data
```

---

## API Endpoints

### Supabase Edge Functions
Base URL: `https://{projectId}.supabase.co/functions/v1/make-server-f3064b20`

#### Authentication
```
Headers:
Authorization: Bearer {access_token}
Content-Type: application/json
```

#### Movie APIs
```
GET    /movies                    # Get all movies
GET    /movies/:id               # Get movie by ID
POST   /movies                   # Create new movie
PUT    /movies/:id               # Update movie
DELETE /movies/:id               # Delete movie
GET    /movies/search?q={query}  # Search movies
```

#### SC Movie APIs
```
GET    /sc-movies                # Get all SC movies
POST   /sc-movies                # Create SC movie
PUT    /sc-movies/:id           # Update SC movie
DELETE /sc-movies/:id           # Delete SC movie
```

#### Master Data APIs
```
GET    /master-data/{type}       # Get master data by type
POST   /master-data/{type}       # Create master data
PUT    /master-data/{type}/:id   # Update master data
DELETE /master-data/{type}/:id   # Delete master data
```

#### Favorites APIs
```
GET    /favorites/{type}         # Get user favorites
POST   /favorites                # Add to favorites
DELETE /favorites                # Remove from favorites
```

#### Gallery APIs
```
POST   /gallery/save            # Save gallery images
GET    /gallery/{movieId}       # Get saved gallery
```

#### Backup/Restore APIs
```
GET    /backup/{type}           # Export data as CSV
POST   /restore/{type}          # Import data from CSV
```

---

## Frontend Components

### Core Components Architecture

#### 1. Application Shell
- **App.tsx**: Main application component dengan authentication check
- **UnifiedApp.tsx**: Main app content setelah authentication
- **MainContentContainer.tsx**: Layout wrapper dengan max-width constraint
- **ThemeProvider**: Global theme management
- **SimpleFavoritesProvider**: Favorites context provider

#### 2. Content Components (`/components/content/`)
- **MoviesContent.tsx**: Movies listing dan management
- **MovieDetailContent.tsx**: Detailed movie view dengan editing
- **ActressesContent.tsx**: Actresses management
- **ActorsContent.tsx**: Actors management  
- **StudiosContent.tsx**: Studios management
- **SeriesContent.tsx**: Series management
- **FavoritesContent.tsx**: User favorites management
- **PhotobooksContent.tsx**: Photobook management
- **AdvancedSearchContent.tsx**: Advanced search interface

#### 3. Movie Detail Components (`/components/content/movieDetail/`)
- **MovieHeader.tsx**: Movie title dan basic info
- **MovieActionButtons.tsx**: Edit/save/cancel buttons
- **MovieCastSection.tsx**: Cast information dengan age gaps
- **MovieLinksSection.tsx**: Streaming/download links
- **LinkedMoviesSection.tsx**: Related movies
- **MovieEditingForm.tsx**: Form untuk editing movie data
- **MovieDetailHelpers.ts**: Utility functions
- **MovieDetailRenderers.tsx**: Rendering functions untuk clickable elements

#### 4. Profile & Content Components (`/components/content/`)
- **ProfileSidebar.tsx**: Profile navigation dan info
- **MoviesGrid.tsx**: Grid layout untuk movies
- **ActressesGrid.tsx**: Grid untuk actresses
- **PhotobooksContent.tsx**: Photobook management dengan grid dan edit functionality
  - Optimized loading behavior untuk action buttons (edit/delete/favorite)
  - Always-accessible actions meski cover sedang loading
  - Hover-based action visibility dengan smooth transition
  - Background semi-transparan untuk action buttons (bg-white/80)
- **PhotobookDetailContent.tsx**: Detailed photobook view dengan:
  - Edit button di header untuk langsung mengakses PhotobookForm
  - Gallery management dengan content rating system
  - Integrable dengan PhotobookForm untuk seamless editing
  - Loading states yang tidak menghalangi user interaction
- **PhotobookGallery.tsx**: Gallery view untuk photobook

#### 5. Form Components
- **MovieForm.tsx**: HC movie creation/editing
- **SCMovieForm.tsx**: SC movie form
- **ActorForm.tsx**: Actor profile form
- **StudioForm.tsx**: Studio management form
- **SeriesForm.tsx**: Series management form

#### 6. Specialized Components
- **GalleryWithSave.tsx**: Gallery dengan save functionality
- **ModernLightbox.tsx**: Image lightbox viewer
- **SearchableSelect.tsx**: Searchable dropdown dengan create option
- **CombinedCastSelector.tsx**: Cast selection dengan autocomplete
- **SimpleFavoriteButton.tsx**: Add/remove favorites
- **TagsManager.tsx**: Tag management interface
- **DateDurationInputs.tsx**: Date picker dan duration input
- **MovieTypeColorSettings.tsx**: Type color customization

#### 7. Movie Parser Components (`/components/`)
- **MovieDataParser.tsx**: Main parser component untuk R18 data integration
  - **Smart Name Matching**: Matches actress/actor names between database and R18 data
  - **Database vs R18 Comparison**: User interface untuk memilih antara nama database atau R18
  - **Automatic Alias Fixing**: Membersihkan dan memformat alias secara otomatis
  - **Name Cleaning**: Menghapus kurung dari nama dan memindahkan alias ke field yang tepat
  - **Master Data Updates**: Update selektif master data dengan informasi yang sudah dibersihkan
  - **Data Integrity Protection**: Mencegah kehilangan data selama proses alias fixing
- **JapaneseNameMatcher.tsx**: Component untuk matching nama Jepang dengan database
- **EnglishNameSelector.tsx**: Selector untuk memilih nama English yang tepat
- **DatabaseVsR18Comparison.tsx**: Interface perbandingan antara nama database dan R18

#### 8. UI Components (`/components/ui/`)
Custom ShadCN/UI components:
- Form controls (input, select, button, etc.)
- Layout components (card, tabs, dialog, etc.)
- Data display (table, pagination, etc.)
- Navigation components
- Feedback components (toast, alert, etc.)

### Component Communication Patterns

#### Props Drilling Prevention
- Context API untuk global state (theme, favorites, auth)
- Callback functions untuk parent-child communication
- Event-driven updates untuk cross-component communication

#### State Management
- Local state dengan useState untuk component-specific data
- Context providers untuk shared state
- API calls dengan error handling dan loading states

---

## Authentication System

### Supabase Auth Integration
```typescript
// Authentication flow
1. User login dengan email/password
2. Supabase returns access_token dan user data
3. Token disimpan dalam app state
4. Token digunakan untuk API calls
5. Automatic token refresh dengan onAuthStateChange listener
```

### Security Implementation
- **JWT tokens** untuk API authorization
- **Row Level Security (RLS)** di Supabase (jika diimplementasi)
- **Protected routes** dengan authentication check
- **Automatic logout** pada token expiration
- **Error handling** untuk authentication failures

### User Management
```typescript
interface User {
  id: string
  email: string
  user_metadata?: {
    name?: string
  }
}
```

---

## Token Refresh Solution

### Problem Overview
Aplikasi mengalami refresh otomatis ketika Supabase melakukan token refresh, yang sangat mengganggu user experience terutama saat user sedang mengedit data atau melakukan proses parse movie.

**Symptoms:**
```
Auth state changed: TOKEN_REFRESHED token present
App.tsx:64 Token refreshed successfully
```

### Root Cause Analysis
1. **Supabase Token Refresh**: Supabase secara otomatis melakukan refresh token untuk menjaga session tetap valid
2. **State Update Cascade**: Event `TOKEN_REFRESHED` menyebabkan `accessToken` state berubah
3. **useEffect Dependency**: 32+ komponen memiliki `useEffect` dengan dependency `[accessToken]`
4. **Data Reload**: Setiap perubahan `accessToken` memicu `loadData()` di berbagai komponen

### Solution Implementation

#### 1. Token Comparison Logic
```typescript
// src/utils/tokenUtils.ts
export function isTokenEquivalent(token1: string | null, token2: string | null): boolean {
  // Compare JWT payload to determine if tokens represent same session
  // Even if token string is different, if it's same user/session, consider equivalent
  if (!token1 && !token2) return true
  if (!token1 || !token2) return false
  if (token1 === token2) return true
  
  try {
    const payload1 = getJWTPayload(token1)
    const payload2 = getJWTPayload(token2)
    
    // Compare user ID and session ID if available
    if (payload1?.sub && payload2?.sub && payload1.sub === payload2.sub) {
      return true // Same user, likely just a refresh
    }
  } catch (error) {
    console.warn('JWT comparison failed, using exact match:', error)
  }
  
  return false
}
```

#### 2. Token-Aware Effect Hook
```typescript
// src/hooks/useTokenAwareEffect.ts
export function useTokenAwareDataLoad(
  loadFunction: () => void | Promise<void>,
  accessToken: string | null,
  additionalDeps: any[] = []
) {
  const previousTokenRef = useRef<string | null>(null)
  
  useEffect(() => {
    // Check if this is a token refresh scenario
    const isTokenRefresh = dependencies.includes(accessToken) && 
                          isTokenEquivalent(previousTokenRef.current, accessToken)
    
    // Only run effect if token actually changed (not just refreshed)
    if (!isTokenRefresh || otherDepsChanged || previousTokenRef.current === null) {
      loadFunction()
      previousTokenRef.current = accessToken
    }
  }, dependencies)
}
```

#### 3. App.tsx State Management
```typescript
// src/App.tsx
useEffect(() => {
  const { data: { subscription } } = auth.client.auth.onAuthStateChange(
    async (event, session) => {
      if (session?.access_token) {
        // Only update state if token actually changed
        const currentToken = accessToken
        const newToken = session.access_token
        
        if (currentToken !== newToken) {
          console.log('Token changed, updating state')
          setAccessToken(newToken)
          setUser(session.user as User)
          setIsAuthenticated(true)
        } else {
          console.log('Token unchanged, skipping state update')
        }
      }
    }
  )
}, [accessToken])
```

#### 4. Component Updates
```typescript
// Before (causing reloads)
useEffect(() => {
  loadData()
}, [accessToken])

// After (token-aware)
useTokenAwareDataLoad(loadData, accessToken)
```

### Benefits
- ✅ **No unnecessary reloads** during token refresh
- ✅ **Smooth user experience** - no interruption during editing/parsing
- ✅ **Security maintained** - token refresh still works for security
- ✅ **Better performance** - reduced unnecessary API calls
- ✅ **Preserved editing state** - no data loss during editing

### Files Modified
- `src/App.tsx` - Token state management
- `src/utils/tokenUtils.ts` - Token comparison utilities (new)
- `src/hooks/useTokenAwareEffect.ts` - Custom hook (new)
- `src/components/UnifiedApp.tsx` - Updated to use token-aware loading
- `src/components/FrontendApp.tsx` - Updated to use token-aware loading

### Testing
- **Token Refresh Test**: Verify no data reload when token refreshes
- **Actual Token Change Test**: Verify data reloads when token actually changes
- **User Session Test**: Verify same user session is maintained
- **Edit State Test**: Verify editing state is preserved during token refresh

---

## File Structure

### Root Level
```
├── App.tsx                    # Main application component
├── styles/globals.css         # Global styles dan Tailwind config
├── components/               # Reusable UI components  
├── contexts/                 # React contexts
├── hooks/                    # Custom React hooks
├── utils/                    # Utility functions dan API clients
├── supabase/functions/       # Backend Edge functions
└── docs/                     # Documentation files
    ├── TOKEN_REFRESH_SOLUTION.md  # Token refresh issue solution
    ├── SUPABASE_SECRETS_INTEGRATION.md  # API key management
    └── [Other documentation files]
```

### Components Organization
```
components/
├── content/                  # Page-level content components
│   ├── movieDetail/         # Movie detail sub-components
│   └── profile/             # Profile page sub-components
├── ui/                      # Reusable UI components (ShadCN)
├── figma/                   # Figma-specific components
└── [SpecificComponents].tsx # Feature-specific components
```

### Utils Organization  
```
utils/
├── auth.ts                  # Authentication utilities
├── tokenUtils.ts            # Token comparison utilities (NEW)
├── movieApi.ts              # Movie API client
├── masterDataApi.ts         # Master data API client
├── favoritesApi.ts          # Favorites API client
├── photobookApi.ts          # Photobook API client
├── templateUtils.ts         # Template processing utilities
├── movieTypeColors.ts       # Movie type color management
└── supabase/info.tsx        # Supabase configuration
```

### Hooks Organization
```
hooks/
├── useCachedData.ts         # Data caching and persistence
├── useTokenAwareEffect.ts   # Token-aware effect hooks (NEW)
├── useSimpleFavorites.ts    # Favorites management
├── useGlobalKeyboardPagination.ts  # Keyboard navigation
├── useKeyboardPagination.ts # Component-level pagination
├── useGalleryCache.ts       # Gallery image caching
└── useLazyData.ts           # Lazy loading utilities
```

---

## Development Guidelines

### Code Standards
1. **TypeScript strict mode** untuk type safety
2. **ESLint rules** untuk code consistency
3. **Component naming convention**: PascalCase
4. **File naming**: PascalCase untuk components, camelCase untuk utilities
5. **Import organization**: External libraries → Internal utilities → Components

### Component Development
```typescript
// Component template
interface ComponentNameProps {
  // Props interface
}

export function ComponentName({ ...props }: ComponentNameProps) {
  // State dan effects
  // Event handlers  
  // Render logic
  
  return (
    // JSX structure
  )
}
```

### Styling Guidelines
- **Tailwind-first** approach
- **No custom CSS classes** kecuali untuk animations/transitions
- **Responsive design** dengan mobile-first breakpoints
- **Dark mode support** dengan CSS variables
- **Maximum width constraint** 1536px untuk desktop

### API Integration Patterns
```typescript
// API client pattern
export const apiClient = {
  async getData(accessToken: string) {
    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      if (!response.ok) throw new Error('API call failed')
      return await response.json()
    } catch (error) {
      console.error('API Error:', error)
      throw error
    }
  }
}
```

### Error Handling
- **Try-catch blocks** untuk async operations
- **Toast notifications** untuk user feedback
- **Console logging** untuk debugging
- **Graceful degradation** untuk missing data

---

## Deployment & Configuration

### Supabase Configuration
```
Project ID: [Your Supabase Project ID]
Database: PostgreSQL dengan KV Store table
Edge Functions: Hono server di /supabase/functions/server/
Authentication: Supabase Auth dengan email/password
Storage: Untuk image uploads (jika diperlukan)
```

### Environment Variables
```
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]  # Server only
SUPABASE_DB_URL=[database-url]                # Server only
```

### Build Configuration
- **Vite** untuk development server
- **TypeScript compilation** dengan strict mode
- **Tailwind CSS** processing
- **Asset optimization** untuk production

### External Dependencies
- **JAV Trailers**: Video trailer integration
- **Unsplash**: Stock images untuk fallbacks
- **Various APIs**: Untuk image sources dan metadata

---

## Troubleshooting

### Common Issues

#### Authentication Problems
```
Symptom: 401 errors, automatic logouts
Solution: Check token expiration, verify Supabase keys
Debug: Check browser network tab, console errors
```

#### Token Refresh Issues (SOLVED)
```
Symptom: App refreshes automatically during token refresh
Log: "Auth state changed: TOKEN_REFRESHED token present"
Impact: Disrupts user editing/parsing experience
Solution: Implemented token-aware effect hooks
Status: ✅ RESOLVED - See Token Refresh Solution section
```

#### Image Loading Issues
```
Symptom: Images not loading, broken thumbnails  
Solution: Check image URLs, verify external source access
Component: ImageWithFallback handles graceful degradation
```

#### Database Connection Issues
```
Symptom: Data not loading, API timeouts
Solution: Verify Supabase connection, check rate limits
Debug: Check Supabase dashboard, function logs
```

#### Performance Issues
```
Symptom: Slow loading, UI freezing
Common causes: Large image galleries, complex searches
Solutions: Implement pagination, image optimization, debounced search
```

#### Movie Parser Issues
```
Symptom: "At least one title (EN or JP) is required" error for series
Solution: Movie parser automatically handles empty titles by preserving original names
Debug: Check console logs for "Special handling for series" messages

Symptom: Movie creates new actress data instead of updating existing
Solution: Movie parser now updates matchedData state with cleaned names
Debug: Check console logs for "Updating matchedData state with cleaned names"

Symptom: Names not cleaned (still contain parentheses)
Solution: Automatic alias fixing runs during save process
Debug: Check console logs for "Cleaned names" and "Changes" messages

Symptom: Data loss during alias fixing (profile picture, birthdate lost)
Solution: All existing fields are preserved during updates
Debug: Check updateData object in console logs
```

### Debug Tools
- **Browser DevTools** untuk network dan console debugging
- **React DevTools** untuk component state inspection  
- **Supabase Dashboard** untuk database dan function monitoring
- **Toast notifications** untuk user-visible errors

### Maintenance Tasks
1. **Regular database cleanup** untuk unused data
2. **Image cache management** untuk performance
3. **Backup verification** untuk data integrity
4. **Security updates** untuk dependencies
5. **Performance monitoring** untuk optimization opportunities

---

## API Rate Limits & Best Practices

### Supabase Limits
- **Edge Function calls**: Monitor usage dalam dashboard
- **Database queries**: Optimize dengan indexing
- **Authentication requests**: Handle rate limiting gracefully

### Performance Optimization
- **Image lazy loading** dengan intersection observer
- **Debounced search** untuk reduce API calls
- **Data caching** untuk frequently accessed data
- **Pagination** untuk large datasets

### Security Best Practices
- **Never expose service role key** di frontend
- **Validate user inputs** sebelum API calls
- **Handle authentication errors** gracefully
- **Use HTTPS** untuk all external communications

---

## Recent Improvements

### Token Refresh Solution (Latest Update)

#### Problem Solved
- **Issue**: App mengalami refresh otomatis saat Supabase melakukan token refresh
- **Impact**: Mengganggu user experience saat editing/parsing data
- **Root Cause**: 32+ useEffect hooks dengan dependency `[accessToken]` memicu reload data

#### Solution Implemented
- **Token Comparison Logic**: Membandingkan JWT payload untuk menentukan session equivalence
- **Token-Aware Effect Hook**: Custom hook yang mencegah reload saat token refresh
- **Smart State Management**: Hanya update state jika token benar-benar berubah
- **Component Updates**: Mengganti useEffect dengan token-aware loading di komponen utama

#### Benefits
- ✅ **No unnecessary reloads** during token refresh
- ✅ **Smooth user experience** - no interruption during editing/parsing
- ✅ **Security maintained** - token refresh still works for security
- ✅ **Better performance** - reduced unnecessary API calls

#### Files Created/Modified
- `src/utils/tokenUtils.ts` - Token comparison utilities (new)
- `src/hooks/useTokenAwareEffect.ts` - Custom hook (new)
- `src/App.tsx` - Token state management
- `src/components/UnifiedApp.tsx` - Updated to use token-aware loading
- `src/components/FrontendApp.tsx` - Updated to use token-aware loading

### Movie Parser Enhancements (Previous Update)

#### 1. Automatic Alias Fixing
- **Implementation**: Integrated Fix Alias logic from actress edit dialog into movie parser
- **Functionality**: Automatically cleans and formats aliases during movie save process
- **Benefits**: Consistent alias formatting across all data entry points

#### 2. Name Cleaning System
- **English Names**: Removes parentheses and brackets, extracts main name
- **Japanese Names**: Cleans Kanji and Kana names from bracket content
- **Alias Migration**: Moves names from brackets to proper alias field
- **Example**: "Aka Asuka (Shiose) (Nagi Hikaru)" → "Aka Asuka" + aliases

#### 3. Database vs R18 Comparison UI
- **New Component**: `DatabaseVsR18Comparison.tsx` for clear name selection
- **User Experience**: Side-by-side comparison with explicit "Use DB" and "Use R18" buttons
- **Integration**: Replaces old selection dialog with more intuitive interface

#### 4. Data Integrity Protection
- **Issue Fixed**: Prevented data loss during alias fixing (profile pictures, birthdates, etc.)
- **Solution**: Preserve all existing fields in update payload
- **Validation**: Ensure series always have at least one title (EN or JP)

#### 5. State Management Improvements
- **Problem**: Movie parser was creating new actress data instead of updating existing
- **Solution**: Update `matchedData` state with cleaned names before final save
- **Result**: Movies now correctly link to updated existing actress data

#### 6. Error Handling Enhancements
- **Series Title Validation**: Automatic fallback to original names if cleaning results in empty titles
- **API Error Prevention**: Ensures all required fields are present before database updates
- **Graceful Degradation**: Continues processing even if individual items fail

### Technical Implementation Details

#### Core Functions Added
```typescript
// Automatic alias fixing for all matched items
fixAliasesForAllMatchedItems()

// Name cleaning with alias extraction
parseNameWithAliases(name)

// Database vs R18 comparison UI
DatabaseVsR18Comparison component

// State synchronization with cleaned data
setMatchedData(updatedMatchedData)
```

#### Console Logging for Debugging
- **Cleaned Names**: Shows before/after name cleaning
- **Changes Tracking**: Displays all field changes during processing
- **State Updates**: Logs when matchedData is updated with cleaned names
- **Error Handling**: Detailed error messages for troubleshooting

---

## Conclusion

Aplikasi Movie Database ini adalah sistem yang komprehensif dan scalable untuk mengelola database film dengan fitur-fitur advanced seperti gallery management, favorites system, dan backup/restore functionality. Dengan arsitektur yang solid dan patterns yang consistent, aplikasi ini dapat dengan mudah di-maintain dan di-extend dengan fitur-fitur baru.

Dokumentasi ini akan terus di-update seiring dengan perkembangan aplikasi dan penambahan fitur-fitur baru.

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Maintained by**: Development Team