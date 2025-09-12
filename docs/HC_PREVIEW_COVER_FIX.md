# HC Preview Cover Fix

## Masalah yang Diperbaiki
HC preview tidak menampilkan cover image, kemungkinan karena:
1. Cover URL menggunakan template dengan wildcard `*` yang tidak diproses dengan benar
2. DMM URL masih menggunakan format digital yang tidak valid
3. User sudah switch ke mono URL tapi HC preview masih menggunakan data lama

## Root Cause
Di `SCMovieDetailContent.tsx`, HC preview menggunakan `hcMovieData.cover` atau `hcMovieData.croppedCover` langsung tanpa memproses template URL. Jika cover URL menggunakan template seperti `https://pics.dmm.co.jp/digital/video/*/*pl.jpg`, URL tidak akan valid karena wildcard `*` tidak diganti dengan dmcode.

## Perbaikan yang Dilakukan

### 1. Import processCoverUrl
Menambahkan import untuk fungsi `processCoverUrl` yang sudah ada:

```tsx
import { processCoverUrl } from '../movieDetail/MovieDetailHelpers'
```

### 2. Perbaikan HC Preview Rendering
**Sebelum (BROKEN):**
```tsx
{isHoverHCBadge && hcMovieData && (hcMovieData.croppedCover || hcMovieData.cover) ? (
  <CroppedImage
    src={hcMovieData.croppedCover || hcMovieData.cover}
    alt={hcMovieData.title}
    className="w-full h-full transition-all duration-300"
    cropToRight={true}
    fixedSize={false}
  />
) : (
  // SC movie fallback
)}
```

**Sesudah (FIXED):**
```tsx
{isHoverHCBadge && hcMovieData ? (
  (() => {
    const processedCoverUrl = processCoverUrl(hcMovieData)
    return processedCoverUrl ? (
      <CroppedImage
        src={processedCoverUrl}
        alt={hcMovieData.titleEn || hcMovieData.titleJp || 'HC Movie cover'}
        className="w-full h-full transition-all duration-300"
        cropToRight={true}
        fixedSize={false}
      />
    ) : (
      <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
        <div className="text-center p-2">
          <div className="text-xs">No HC Cover Available</div>
        </div>
      </div>
    )
  })()
) : (
  // SC movie fallback
)}
```

### 3. Debug Logging
Menambahkan logging untuk membantu debug:

```tsx
if (hcMovie) {
  console.log('HC Movie found:', hcMovie)
  console.log('HC Movie cover URL:', hcMovie.cover)
  console.log('HC Movie dmcode:', hcMovie.dmcode)
  const processedUrl = processCoverUrl(hcMovie)
  console.log('Processed cover URL:', processedUrl)
  setHcMovieData(hcMovie)
}
```

## processCoverUrl Function
Fungsi ini memproses cover URL dengan template variables:

```tsx
export const processCoverUrl = (movie: Movie): string => {
  if (!movie.cover) return ''
  
  // If cover contains template variables and we have dmcode, process it
  const hasTemplateVars = movie.cover.includes('*') || 
                         movie.cover.includes('{{') ||
                         movie.cover.includes('@studio') ||
                         movie.cover.includes('@firstname') ||
                         movie.cover.includes('@lastname')
  
  if (hasTemplateVars && movie.dmcode) {
    return processTemplate(movie.cover, { 
      dmcode: movie.dmcode,
      studio: movie.studio,
      actress: movie.actress
    })
  }
  
  return movie.cover
}
```

## Testing Results

✅ **DMM Digital URL dengan template**: `https://pics.dmm.co.jp/digital/video/*/*pl.jpg` + dmcode `zmen00063` → `https://pics.dmm.co.jp/digital/video/zmen00063/zmen00063pl.jpg`

✅ **DMM Mono URL dengan template**: `https://pics.dmm.co.jp/mono/movie/*/*pl.jpg` + dmcode `zmen00063` → `https://pics.dmm.co.jp/mono/movie/zmen00063/zmen00063pl.jpg`

✅ **Direct URL tanpa template**: `https://example.com/cover.jpg` → `https://example.com/cover.jpg`

✅ **Template tanpa dmcode**: `https://pics.dmm.co.jp/digital/video/*/*pl.jpg` (no dmcode) → `https://pics.dmm.co.jp/digital/video/*/*pl.jpg`

✅ **Empty cover**: Empty string → Empty string

## Hasil Perbaikan
- ✅ **HC preview sekarang menampilkan cover** dengan benar
- ✅ **Template URLs diproses** dengan dmcode yang sesuai
- ✅ **DMM URLs (digital/mono)** diproses dengan benar
- ✅ **Fallback handling** untuk cover yang tidak tersedia
- ✅ **Debug logging** untuk troubleshooting

## File Modified
- `src/components/content/SCMovieDetailContent.tsx`

## Impact
HC preview sekarang akan menampilkan cover image dengan benar, baik untuk DMM URLs yang menggunakan template maupun direct URLs. User tidak akan lagi melihat "NOW PRINTING" placeholder ketika hover HC badge.
