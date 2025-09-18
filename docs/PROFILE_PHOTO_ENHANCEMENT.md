# Profile Photo Enhancement - Generation & Lineup Support

## Overview

Fitur ini menambahkan kemampuan untuk mengambil foto dari profpic generation, generation version, lineup, dan lineup version pada sidebar profile page. Sebelumnya, foto hanya diambil dari multiple profpic utama dan profpic spesifik group.

## Perubahan yang Dibuat

### 1. Update Fungsi `getAllProfileImages`

**File**: `src/components/content/profile/helpers.ts`

Fungsi `getAllProfileImages` telah diperluas untuk mendukung:

#### Prioritas Foto (dalam urutan):
1. **Main profile picture** (`profile.profilePicture`)
2. **Additional photos** (`profile.photo[]`)
3. **Group-specific photos** (`profile.groupData`)
4. **Generation-specific photos** (`profile.generationData`) - **BARU**
5. **Lineup-specific photos** (`profile.lineupData`) - **BARU**
6. **Group profile pictures** (`profile.groupProfilePictures`)

#### Data Structure yang Didukung:

```typescript
// Generation Data Structure
generationData?: { 
  [generationId: string]: { 
    alias?: string, 
    profilePicture?: string, 
    photos?: string[], 
    photoVersions?: { 
      [versionName: string]: { 
        photos: string[], 
        createdAt: string, 
        description?: string 
      } 
    } 
  } 
}

// Lineup Data Structure  
lineupData?: { 
  [lineupId: string]: { 
    alias?: string, 
    profilePicture?: string, 
    photos?: string[], 
    photoVersions?: { 
      [versionName: string]: { 
        photos: string[], 
        createdAt: string, 
        description?: string 
      } 
    } 
  } 
}
```

#### Implementasi Detail:

```typescript
// Fourth priority: Add generation-specific photos
if (profile.generationData && typeof profile.generationData === 'object') {
  Object.values(profile.generationData).forEach((generationInfo: any) => {
    if (generationInfo && typeof generationInfo === 'object') {
      // Add generation profilePicture
      if (generationInfo.profilePicture && generationInfo.profilePicture.trim()) {
        const generationPic = generationInfo.profilePicture.trim()
        if (!images.includes(generationPic)) {
          images.push(generationPic)
        }
      }
      
      // Add generation photos array
      if (generationInfo.photos && Array.isArray(generationInfo.photos)) {
        generationInfo.photos.forEach(photo => {
          if (typeof photo === 'string' && photo.trim() && !images.includes(photo.trim())) {
            images.push(photo.trim())
          }
        })
      }
      
      // Add generation photo versions
      if (generationInfo.photoVersions && typeof generationInfo.photoVersions === 'object') {
        Object.values(generationInfo.photoVersions).forEach((versionInfo: any) => {
          if (versionInfo && typeof versionInfo === 'object' && versionInfo.photos && Array.isArray(versionInfo.photos)) {
            versionInfo.photos.forEach(photo => {
              if (typeof photo === 'string' && photo.trim() && !images.includes(photo.trim())) {
                images.push(photo.trim())
              }
            })
          }
        })
      }
    }
  })
}

// Fifth priority: Add lineup-specific photos
if (profile.lineupData && typeof profile.lineupData === 'object') {
  Object.values(profile.lineupData).forEach((lineupInfo: any) => {
    if (lineupInfo && typeof lineupInfo === 'object') {
      // Add lineup profilePicture
      if (lineupInfo.profilePicture && lineupInfo.profilePicture.trim()) {
        const lineupPic = lineupInfo.profilePicture.trim()
        if (!images.includes(lineupPic)) {
          images.push(lineupPic)
        }
      }
      
      // Add lineup photos array
      if (lineupInfo.photos && Array.isArray(lineupInfo.photos)) {
        lineupInfo.photos.forEach(photo => {
          if (typeof photo === 'string' && photo.trim() && !images.includes(photo.trim())) {
            images.push(photo.trim())
          }
        })
      }
      
      // Add lineup photo versions
      if (lineupInfo.photoVersions && typeof lineupInfo.photoVersions === 'object') {
        Object.values(lineupInfo.photoVersions).forEach((versionInfo: any) => {
          if (versionInfo && typeof versionInfo === 'object' && versionInfo.photos && Array.isArray(versionInfo.photos)) {
            versionInfo.photos.forEach(photo => {
              if (typeof photo === 'string' && photo.trim() && !images.includes(photo.trim())) {
                images.push(photo.trim())
              }
            })
          }
        })
      }
    }
  })
}
```

## Cara Kerja

### 1. Data Loading
- Data profile dimuat melalui `masterDataApi.getByType()`
- Data sudah termasuk `generationData` dan `lineupData` jika ada

### 2. Photo Processing
- Fungsi `getAllProfileImages()` dipanggil setiap kali profile data berubah
- Foto-foto dikumpulkan berdasarkan prioritas yang telah ditentukan
- **Multiple Generations & Lineups**: Menggunakan `Object.values()` untuk mengiterasi semua generation dan lineup
- Duplikasi foto dihindari dengan pengecekan `!images.includes()`

### 3. Display
- Foto-foto ditampilkan dalam `ImageSlideshow` component
- Auto-play aktif jika ada lebih dari 1 foto
- User bisa klik foto untuk melihat dalam lightbox

### 4. Multiple Generations & Lineups Support
- **1 aktris bisa berada dalam beberapa generation** - semua foto dari semua generation akan ditampilkan
- **1 aktris bisa berada dalam beberapa lineup** - semua foto dari semua lineup akan ditampilkan
- **Prioritas tetap konsisten** - urutan foto berdasarkan prioritas yang sama untuk semua generation/lineup

## Komponen yang Terpengaruh

### 1. ProfileSidebar
- **File**: `src/components/content/profile/ProfileSidebar.tsx`
- **Fungsi**: Menampilkan slideshow foto di sidebar
- **Tidak ada perubahan**: Sudah menggunakan `profileImages` prop

### 2. ProfileContent  
- **File**: `src/components/content/ProfileContent.tsx`
- **Fungsi**: Memanggil `getAllProfileImages()` dan mengupdate state
- **Tidak ada perubahan**: Sudah menggunakan fungsi yang diperluas

## Testing

### 1. Data Structure Test - Multiple Generations & Lineups
```typescript
// Test data dengan multiple generations dan lineups
const testProfile = {
  id: "test-actress-1",
  name: "Test Actress",
  type: "actress",
  profilePicture: "https://example.com/main.jpg",
  photo: ["https://example.com/photo1.jpg", "https://example.com/photo2.jpg"],
  
  // Multiple generations - aktris bisa berada dalam beberapa generation
  generationData: {
    "gen-1": {
      profilePicture: "https://example.com/gen1-profile.jpg",
      photos: ["https://example.com/gen1-photo1.jpg", "https://example.com/gen1-photo2.jpg"],
      photoVersions: {
        "v1": {
          photos: ["https://example.com/gen1-v1-1.jpg"],
          createdAt: "2023-01-01",
          description: "Generation 1 Version 1"
        },
        "v2": {
          photos: ["https://example.com/gen1-v2-1.jpg", "https://example.com/gen1-v2-2.jpg"],
          createdAt: "2023-02-01",
          description: "Generation 1 Version 2"
        }
      }
    },
    "gen-2": {
      profilePicture: "https://example.com/gen2-profile.jpg",
      photos: ["https://example.com/gen2-photo1.jpg"],
      photoVersions: {
        "v1": {
          photos: ["https://example.com/gen2-v1-1.jpg"],
          createdAt: "2023-03-01",
          description: "Generation 2 Version 1"
        }
      }
    }
  },
  
  // Multiple lineups - aktris bisa berada dalam beberapa lineup
  lineupData: {
    "lineup-1": {
      profilePicture: "https://example.com/lineup1-profile.jpg",
      photos: ["https://example.com/lineup1-photo1.jpg"],
      photoVersions: {
        "v1": {
          photos: ["https://example.com/lineup1-v1-1.jpg"],
          createdAt: "2023-01-01",
          description: "Lineup 1 Version 1"
        }
      }
    },
    "lineup-2": {
      profilePicture: "https://example.com/lineup2-profile.jpg",
      photos: ["https://example.com/lineup2-photo1.jpg", "https://example.com/lineup2-photo2.jpg"],
      photoVersions: {
        "v1": {
          photos: ["https://example.com/lineup2-v1-1.jpg"],
          createdAt: "2023-02-01",
          description: "Lineup 2 Version 1"
        },
        "v2": {
          photos: ["https://example.com/lineup2-v2-1.jpg"],
          createdAt: "2023-03-01",
          description: "Lineup 2 Version 2"
        }
      }
    }
  }
}

// Expected result: 20 unique photos in priority order
// Breakdown:
// Main: 1 (main.jpg)
// Additional: 2 (photo1.jpg, photo2.jpg)
// Gen 1: 1 profile + 2 photos + 1 v1 + 2 v2 = 6
// Gen 2: 1 profile + 1 photo + 1 v1 = 3
// Lineup 1: 1 profile + 1 photo + 1 v1 = 3
// Lineup 2: 1 profile + 2 photos + 1 v1 + 1 v2 = 5
// Total: 1 + 2 + 6 + 3 + 3 + 5 = 20

const expectedPhotos = [
  "https://example.com/main.jpg",           // Main profile picture
  "https://example.com/photo1.jpg",         // Additional photos
  "https://example.com/photo2.jpg",         
  "https://example.com/gen1-profile.jpg",   // Generation 1 profile picture
  "https://example.com/gen1-photo1.jpg",    // Generation 1 photos
  "https://example.com/gen1-photo2.jpg",    
  "https://example.com/gen1-v1-1.jpg",      // Generation 1 version 1
  "https://example.com/gen1-v2-1.jpg",      // Generation 1 version 2
  "https://example.com/gen1-v2-2.jpg",      
  "https://example.com/gen2-profile.jpg",   // Generation 2 profile picture
  "https://example.com/gen2-photo1.jpg",    // Generation 2 photos
  "https://example.com/gen2-v1-1.jpg",      // Generation 2 version 1
  "https://example.com/lineup1-profile.jpg", // Lineup 1 profile picture
  "https://example.com/lineup1-photo1.jpg", // Lineup 1 photos
  "https://example.com/lineup1-v1-1.jpg",   // Lineup 1 version 1
  "https://example.com/lineup2-profile.jpg", // Lineup 2 profile picture
  "https://example.com/lineup2-photo1.jpg", // Lineup 2 photos
  "https://example.com/lineup2-photo2.jpg", 
  "https://example.com/lineup2-v1-1.jpg",   // Lineup 2 version 1
  "https://example.com/lineup2-v2-1.jpg"    // Lineup 2 version 2
]
```

### 2. Integration Test
- Profile page sidebar sekarang menampilkan foto dari semua sumber
- Slideshow berfungsi dengan foto generation dan lineup
- Lightbox menampilkan semua foto dengan urutan yang benar
- **Multiple Generations**: Semua foto dari semua generation ditampilkan
- **Multiple Lineups**: Semua foto dari semua lineup ditampilkan
- **Test Result**: ✅ 20 foto berhasil ditampilkan dari 2 generations dan 2 lineups

## Backward Compatibility

✅ **Tidak ada breaking changes**
- Fungsi lama tetap berfungsi untuk data tanpa generation/lineup
- Prioritas foto tetap sama untuk data yang sudah ada
- Komponen yang menggunakan fungsi ini tidak perlu diubah

## Future Enhancements

### 1. Photo Source Indicators
- Tambahkan indikator untuk menunjukkan sumber foto (main, group, generation, lineup)
- Mungkin dengan badge atau tooltip

### 2. Photo Filtering
- Tambahkan filter untuk memilih sumber foto yang ingin ditampilkan
- User bisa memilih hanya foto dari generation tertentu

### 3. Photo Management
- Interface untuk mengelola foto dari berbagai sumber
- Drag & drop untuk mengubah urutan prioritas

## Summary

✅ **Fitur berhasil ditambahkan**
- Support untuk generation photos (profilePicture, photos, photoVersions)
- Support untuk lineup photos (profilePicture, photos, photoVersions)  
- **Multiple Generations & Lineups Support** - 1 aktris bisa berada dalam beberapa generation/lineup
- Prioritas foto yang jelas dan konsisten
- Backward compatibility terjaga
- Tidak ada breaking changes
- **Tested & Verified** - 20 foto berhasil ditampilkan dari multiple generations dan lineups

**Profile sidebar sekarang dapat menampilkan foto dari semua sumber yang tersedia: main profile, additional photos, group photos, generation photos (dari semua generation), dan lineup photos (dari semua lineup)!** 🎉

### Key Features:
- ✅ **Multiple Generations**: Semua foto dari semua generation ditampilkan
- ✅ **Multiple Lineups**: Semua foto dari semua lineup ditampilkan  
- ✅ **Version Support**: Mendukung photoVersions untuk setiap generation/lineup
- ✅ **Priority Order**: Urutan foto tetap konsisten dan logis
- ✅ **No Duplicates**: Duplikasi foto dihindari dengan pengecekan yang proper
