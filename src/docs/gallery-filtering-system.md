# Gallery Filtering System Documentation

## Overview
EnhancedGallery.tsx mengimplementasi sistem filtering yang canggih untuk memfilter gambar gallery movie. Sistem ini dirancang untuk memisahkan konten asli dari placeholder, 404 pages, dan gambar error dengan menggunakan berbagai kriteria filtering.

## Arsitektur Filtering

### 1. Template Processing Pipeline
```
Gallery Template → URL Generation → Image Loading → Filtering → Display
```

**Tahapan proses:**
1. **Template Processing**: `processTemplate()` mengubah `*` menjadi dmcode dan `#` menjadi nomor urut
2. **URL Generation**: `generateImageUrls()` menghasilkan array URL untuk dicek
3. **Image Analysis**: `loadAndAnalyzeImage()` memuat dan menganalisis setiap gambar
4. **Filtering**: Multiple filtering criteria diterapkan untuk menentukan validitas
5. **Display**: Hanya gambar valid yang ditampilkan

### 2. Data Structure
```typescript
interface ImageStatus {
  url: string           // URL gambar asli
  loaded: boolean       // Apakah berhasil dimuat
  failed: boolean       // Apakah gagal dimuat
  isPlaceholder: boolean // Apakah terdeteksi sebagai placeholder
  width?: number        // Lebar natural gambar
  height?: number       // Tinggi natural gambar
  size?: number         // Ukuran file (estimasi)
  index: number         // Index dalam array
}
```

## Kriteria Filtering

### 1. Loading Status Filtering
**Tujuan**: Memfilter gambar yang gagal dimuat

**Kriteria**:
- Timeout 8 detik untuk loading
- HTTP errors (404, 500, dll)
- Network failures

**Implementasi**:
```typescript
const loadAndAnalyzeImage = (url: string, index: number): Promise<ImageStatus> => {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve({
        url, loaded: false, failed: true, isPlaceholder: false, index
      })
    }, 8000)
    
    img.onerror = () => {
      clearTimeout(timeout)
      resolve({
        url, loaded: false, failed: true, isPlaceholder: false, index
      })
    }
  })
}
```

### 2. Placeholder Detection System
**Tujuan**: Mendeteksi gambar placeholder berdasarkan dimensi dan karakteristik visual

#### 2.1 Exact Dimension Matching (Refined)
**Kriteria**: Dimensi yang persis sama dengan placeholder yang confirmed
```typescript
const placeholderSizes = [
  // Very small placeholders (high confidence)
  { w: 100, h: 100 }, { w: 150, h: 150 }, { w: 200, h: 200 },
  { w: 250, h: 250 }, { w: 300, h: 300 },
  
  // Confirmed 404/Error page dimensions only
  { w: 300, h: 420 }, // DMM 404 error page
  { w: 320, h: 240 }, // Small 4:3 error
  { w: 400, h: 300 }, // Small 4:3 error
  
  // Square error pages (small to medium only)
  { w: 350, h: 350 }, { w: 400, h: 400 }, { w: 450, h: 450 },
  
  // Common ad/banner error dimensions
  { w: 728, h: 90 }, { w: 300, h: 250 }, { w: 336, h: 280 },
  { w: 970, h: 250 }, { w: 468, h: 60 },
  
  // Only very specific small placeholders
  { w: 400, h: 225 } // 16:9 very small - likely placeholder
]
```

**⚠️ Important Change**: Removed legitimate content dimensions like `800x450` and `800x600` that were causing false positives.

#### 2.2 Size-based Filtering (Conservative)
**Kriteria**: Gambar terlalu kecil untuk konten asli - threshold yang lebih permissive
```typescript
// Very small images (likely placeholders) - more conservative
if (width < 200 || height < 200) return true

// Small square images (common for "NOW PRINTING" placeholders) - more conservative
if (width === height && width < 400) return true

// Only very small images for gallery content - much more permissive
// Reduced threshold significantly to avoid false positives
if (width < 300 && height < 300) return true
```

**🔧 Key Changes**: 
- Raised minimum size from 100px to 200px
- Square detection threshold raised from 300px to 400px  
- Gallery size threshold lowered from 500px to 300px to prevent false positives on legitimate content

#### 2.3 Aspect Ratio Analysis (Refined)
**Kriteria**: Rasio aspek yang ekstrem atau pattern spesifik 404 pages
```typescript
const aspectRatio = width / height

// Extreme aspect ratios only (more permissive)
if (aspectRatio > 8 || aspectRatio < 0.15) return true

// Specific DMM 404-style patterns only (narrower detection)
if (aspectRatio >= 0.7 && aspectRatio <= 0.76 && 
    width <= 320 && height <= 440) return true
```

**🎯 Improvements**: 
- Extreme ratio threshold relaxed from 5:1 to 8:1 to avoid filtering legitimate widescreen content
- 404 detection made more specific to DMM patterns only
- Reduced false positives on legitimate 16:9 and 4:3 content

#### 2.4 Web Standard Detection
**Kriteria**: Ukuran standar web yang umum untuk placeholder
```typescript
// Common web standard placeholder sizes
if ((width === 300 && height >= 400 && height <= 450) || 
    (width === 320 && height >= 200 && height <= 250) ||
    (width === 400 && height >= 280 && height <= 320)) {
  return true
}
```

### 3. URL Pattern Filtering (Template Utils)
**Tujuan**: Pre-filtering berdasarkan pola URL

**Kriteria di `templateUtils.ts`**:
```typescript
const nowPrintingPatterns = [
  'now_printing', 'now-printing', 'nowprinting',
  '/n/now_printing/', 'now_printing.jpg',
  '.svg', '404.not.found', 'notfound',
  'placeholder', 'no-image'
]
```

## Filtering Process Flow

### 1. Pre-loading Analysis
```
Start → Generate URLs → Initialize Status Array → Begin Parallel Loading
```

### 2. Individual Image Processing
```
Load Image → Check Dimensions → Apply Placeholder Detection → Update Status
```

### 3. Result Categorization
```
All Images Loaded → Categorize (Valid/Placeholder/Failed) → Display Statistics
```

## Performance Optimizations

### 1. Parallel Loading
- Semua gambar dimuat secara paralel untuk kecepatan maksimal
- Progress tracking real-time dengan update setiap completion

### 2. Timeout Management
- 8 detik timeout per gambar untuk mencegah hanging
- Immediate failure detection untuk network errors

### 3. Memory Efficiency
- Lazy loading untuk grid display
- Image object disposal setelah analysis

### 4. Smart Target Count
- **Default 200 gambar** untuk coverage maksimal (upgraded dari 30)
- Configurable `targetImageCount` parameter
- **Reason for increase**: More comprehensive gallery analysis with acceptable performance trade-off

## User Interface Feedback

### 1. Progress Indication
```typescript
// Loading state dengan progress bar
<div className="bg-primary h-2 rounded-full transition-all duration-300" 
     style={{ width: `${preloadProgress}%` }} />
<p>{preloadProgress}% complete</p>
```

### 2. Filtering Statistics Display
```typescript
// Menampilkan hasil filtering
<Badge variant="outline">
  {validImages.length} valid / {imageStatuses.length} total
</Badge>

{placeholderImages.length > 0 && (
  <Badge variant="secondary">
    {placeholderImages.length} 404/placeholders filtered
  </Badge>
)}
```

### 3. Debug Information
```typescript
// Detailed breakdown untuk troubleshooting
<div className="space-y-1 text-sm text-muted-foreground">
  <p>Checked {imageStatuses.length} images:</p>
  <p>• {failedCount} failed to load</p>
  <p>• {placeholderCount} were 404/placeholder images</p>
  <p>• {validImages.length} valid content images</p>
</div>
```

## Error Handling

### 1. No Valid Images Found
```typescript
if (validImages.length === 0) {
  // Display comprehensive error information
  // Show template being used
  // Show filtering breakdown
  // Provide debug details for placeholders
}
```

### 2. Network Issues
- Graceful degradation untuk network failures
- Retry mechanism tidak diimplementasi (by design untuk performance)
- Clear error messaging untuk user

### 3. Template Issues
- Validation untuk gallery template format
- Fallback untuk missing dmcode
- Error handling untuk malformed URLs

## Configuration

### 1. Adjustable Parameters
```typescript
interface EnhancedGalleryProps {
  galleryTemplate: string    // Template URL dengan * dan # placeholders
  dmcode?: string           // Code untuk replace * placeholder
  targetImageCount?: number // Jumlah gambar untuk dicek (default: 200)
}
```

### 2. Filtering Sensitivity
- Placeholder size thresholds dapat diubah di `placeholderSizes` array
- Aspect ratio limits dapat disesuaikan
- Timeout duration dapat dikonfigurasi

## Logging & Debugging

### 1. Console Logging
```typescript
// Placeholder detection logging
console.log(`Detected common placeholder/404 size: ${width}x${height}`)
console.log(`Detected small placeholder: ${width}x${height}`)
console.log(`Detected unusual aspect ratio placeholder: ${aspectRatio}`)

// Overall statistics
console.log(`Gallery analysis complete:`)
console.log(`- Valid images: ${validCount}`)
console.log(`- Placeholder/404 images: ${placeholderCount}`)
console.log(`- Failed images: ${failedCount}`)
```

### 2. Visual Debug Tools
- Collapsible details untuk placeholder dimensions
- Template display untuk verification
- Individual image status dalam list view

## Best Practices

### 1. Template Design
- Gunakan consistent numbering pattern: `##` untuk 2-digit, `###` untuk 3-digit
- Avoid hardcoding specific numbers dalam template
- Test template dengan berbagai dmcode values

### 2. Performance Considerations
- Set reasonable `targetImageCount` (200 optimal untuk most cases)
- Monitor network usage untuk large galleries
- Consider user's connection speed

### 3. User Experience
- Always provide progress feedback
- Show clear statistics tentang filtering results
- Provide debug information untuk troubleshooting

## Technical Dependencies

### 1. Core Dependencies
- `templateUtils.ts` untuk URL processing
- `ModernLightbox.tsx` untuk image viewing
- React hooks untuk state management

### 2. UI Components
- `Button`, `Badge` dari shadcn/ui
- `Loader2`, `AlertTriangle` dari lucide-react
- Custom progress indicators

### 3. Browser APIs
- Image loading API
- Canvas API untuk dimension analysis
- Promise-based async handling

## Future Enhancements

### 1. Advanced Detection
- Machine learning untuk placeholder detection
- Content-based image analysis
- File size validation (currently estimated)

### 2. Performance Improvements
- Progressive loading strategies
- Image caching mechanisms
- Smarter retry logic

### 3. User Features
- Manual override untuk false positives
- Bulk re-analysis capabilities
- Export filtering results

---

## Summary

Gallery filtering system menggunakan refined multi-layered approach untuk memastikan hanya konten asli yang ditampilkan dengan **minimal false positives**:

1. **URL Pattern Filtering**: Pre-filter berdasarkan nama file dan path
2. **Loading Status Check**: Filter gagal loading dan timeout  
3. **Conservative Dimension Analysis**: Filter berdasarkan ukuran dan aspect ratio dengan threshold yang lebih permissive
4. **Refined Placeholder Detection**: Advanced detection untuk confirmed placeholder patterns only
5. **Comprehensive User Feedback**: Statistics, debug information, dan transparency

## Recent Improvements (False Positive Fix)

**🐛 Issue Fixed**: Gambar legitimate 800x450px (80kb) ikut terfilter

**🔧 Solution Applied**:
- **Removed problematic exact matches** dari placeholderSizes array (800x450, 800x600, dll)
- **Raised size thresholds** untuk mengurangi over-filtering
- **Relaxed aspect ratio limits** untuk accommodate legitimate widescreen content
- **Made error detection more specific** untuk DMM-style 404 pages only

**✅ Result**: System sekarang lebih akurat dengan minimal false positives sambil tetap effective memfilter placeholder dan 404 pages.

System ini dirancang untuk **robust filtering dengan minimal false positives**, sambil memberikan transparency penuh kepada user tentang proses filtering yang terjadi.