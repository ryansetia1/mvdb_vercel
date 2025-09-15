# Sistem Foto Profil Aktris

## Overview
Dokumentasi ini menjelaskan sistem lengkap untuk mengelola foto profil aktris, termasuk upload, storage, display, dan optimasi gambar.

## 1. Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Supabase      │    │   CDN/Storage  │
│                 │    │                 │    │                 │
│ - File Input    │───▶│ - Auth Check    │───▶│ - File Storage  │
│ - Preview       │    │ - Upload API    │    │ - Image CDN     │
│ - Validation    │    │ - Database      │    │ - Optimization │
│ - Error Handle  │    │ - Storage API   │    │ - Caching      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 2. File Upload Flow

### Upload Process
```typescript
// Complete upload flow
const uploadProfilePhoto = async (
  actressId: string, 
  file: File, 
  accessToken: string
): Promise<UploadResult> => {
  try {
    // 1. Validate file
    const validation = validateImageFile(file)
    if (!validation.isValid) {
      return { success: false, error: validation.error }
    }
    
    // 2. Generate unique filename
    const filename = generateUniqueFilename(file, actressId)
    
    // 3. Upload to Supabase Storage
    const uploadResult = await supabase.storage
      .from('actress-photos')
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (uploadResult.error) {
      throw new Error(uploadResult.error.message)
    }
    
    // 4. Get public URL
    const { data } = supabase.storage
      .from('actress-photos')
      .getPublicUrl(filename)
    
    // 5. Update database
    await actressApi.updateActress(actressId, {
      profile_photo_url: data.publicUrl,
      profile_photo_path: uploadResult.data.path
    }, accessToken)
    
    return {
      success: true,
      url: data.publicUrl,
      path: uploadResult.data.path
    }
    
  } catch (error) {
    console.error('Upload error:', error)
    return {
      success: false,
      error: error.message || 'Upload failed'
    }
  }
}
```

### File Validation
```typescript
interface FileValidationResult {
  isValid: boolean
  error?: string
}

const validateImageFile = (file: File): FileValidationResult => {
  // Check file type
  const allowedTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp'
  ]
  
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Format file tidak didukung. Gunakan JPG, PNG, atau WebP'
    }
  }
  
  // Check file size (5MB max)
  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'Ukuran file terlalu besar. Maksimal 5MB'
    }
  }
  
  // Check file extension
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp']
  const extension = file.name.toLowerCase().substring(
    file.name.lastIndexOf('.')
  )
  
  if (!allowedExtensions.includes(extension)) {
    return {
      isValid: false,
      error: 'Ekstensi file tidak valid'
    }
  }
  
  // Check image dimensions (optional)
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const maxWidth = 2048
      const maxHeight = 2048
      
      if (img.width > maxWidth || img.height > maxHeight) {
        resolve({
          isValid: false,
          error: `Dimensi gambar terlalu besar. Maksimal ${maxWidth}x${maxHeight}px`
        })
      } else {
        resolve({ isValid: true })
      }
    }
    img.onerror = () => {
      resolve({
        isValid: false,
        error: 'File bukan gambar yang valid'
      })
    }
    img.src = URL.createObjectURL(file)
  })
}
```

## 3. Storage Structure

### Supabase Storage Bucket
```
actress-photos/
├── {actress-id}/
│   ├── profile.jpg          # Original image
│   ├── profile_thumb.jpg    # Thumbnail (150x150)
│   └── profile_medium.jpg   # Medium size (400x400)
└── temp/
    └── {temp-id}/
        └── upload.jpg       # Temporary uploads
```

### File Naming Convention
```typescript
const generateUniqueFilename = (file: File, actressId: string): string => {
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(2, 8)
  const extension = file.name.split('.').pop()?.toLowerCase()
  
  return `${actressId}/profile_${timestamp}_${randomId}.${extension}`
}

// Examples:
// "uuid-123/profile_1703123456789_abc123.jpg"
// "uuid-456/profile_1703123456790_def456.png"
```

### Storage Configuration
```typescript
// Supabase Storage bucket configuration
const storageConfig = {
  bucketName: 'actress-photos',
  policies: {
    // Public read access
    publicRead: `
      CREATE POLICY "Public read access for actress photos" 
      ON storage.objects FOR SELECT 
      USING (bucket_id = 'actress-photos')
    `,
    
    // Authenticated upload
    authenticatedUpload: `
      CREATE POLICY "Authenticated upload for actress photos" 
      ON storage.objects FOR INSERT 
      WITH CHECK (
        bucket_id = 'actress-photos' AND 
        auth.role() = 'authenticated'
      )
    `,
    
    // Owner update/delete
    ownerUpdate: `
      CREATE POLICY "Owner can update actress photos" 
      ON storage.objects FOR UPDATE 
      USING (
        bucket_id = 'actress-photos' AND 
        auth.uid()::text = (storage.foldername(name))[1]
      )
    `
  }
}
```

## 4. Image Processing & Optimization

### Client-Side Processing
```typescript
// Image compression before upload
const compressImage = async (
  file: File, 
  maxWidth: number = 1024, 
  quality: number = 0.8
): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      
      // Set canvas dimensions
      canvas.width = width
      canvas.height = height
      
      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height)
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            })
            resolve(compressedFile)
          } else {
            resolve(file) // Fallback to original
          }
        },
        'image/jpeg',
        quality
      )
    }
    
    img.src = URL.createObjectURL(file)
  })
}
```

### Server-Side Processing (Future)
```typescript
// Supabase Edge Function for image processing
const processImage = async (filePath: string) => {
  const sharp = require('sharp')
  
  try {
    // Download original image
    const { data: originalImage } = await supabase.storage
      .from('actress-photos')
      .download(filePath)
    
    const buffer = await originalImage.arrayBuffer()
    
    // Generate thumbnail (150x150)
    const thumbnail = await sharp(buffer)
      .resize(150, 150, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toBuffer()
    
    // Generate medium size (400x400)
    const medium = await sharp(buffer)
      .resize(400, 400, { fit: 'cover' })
      .jpeg({ quality: 85 })
      .toBuffer()
    
    // Upload processed images
    const thumbnailPath = filePath.replace('.jpg', '_thumb.jpg')
    const mediumPath = filePath.replace('.jpg', '_medium.jpg')
    
    await supabase.storage
      .from('actress-photos')
      .upload(thumbnailPath, thumbnail)
    
    await supabase.storage
      .from('actress-photos')
      .upload(mediumPath, medium)
    
    return {
      thumbnail: thumbnailPath,
      medium: mediumPath
    }
    
  } catch (error) {
    console.error('Image processing error:', error)
    throw error
  }
}
```

## 5. Display Components

### Profile Photo Component
```typescript
interface ProfilePhotoProps {
  actress: Actress
  size?: 'small' | 'medium' | 'large'
  showFallback?: boolean
  className?: string
}

const ProfilePhoto: React.FC<ProfilePhotoProps> = ({
  actress,
  size = 'medium',
  showFallback = true,
  className = ''
}) => {
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-16 h-16',
    large: 'w-32 h-32'
  }
  
  const handleImageLoad = () => {
    setIsLoading(false)
  }
  
  const handleImageError = () => {
    setImageError(true)
    setIsLoading(false)
  }
  
  // Generate fallback avatar
  const generateFallbackAvatar = () => {
    const initials = actress.name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
    
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 
      'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'
    ]
    
    const colorIndex = actress.name.length % colors.length
    
    return (
      <div className={`
        ${sizeClasses[size]} 
        ${colors[colorIndex]} 
        rounded-full 
        flex 
        items-center 
        justify-center 
        text-white 
        font-bold 
        text-sm
        ${className}
      `}>
        {initials}
      </div>
    )
  }
  
  if (!actress.profile_photo_url || imageError) {
    return showFallback ? generateFallbackAvatar() : null
  }
  
  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className={`
          ${sizeClasses[size]} 
          bg-gray-200 
          rounded-full 
          animate-pulse
        `} />
      )}
      
      <img
        src={actress.profile_photo_url}
        alt={`${actress.name} profile`}
        className={`
          ${sizeClasses[size]} 
          rounded-full 
          object-cover 
          ${isLoading ? 'hidden' : 'block'}
        `}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading="lazy"
      />
    </div>
  )
}
```

### Photo Upload Component
```typescript
interface PhotoUploadProps {
  currentPhoto?: string
  onPhotoChange: (file: File) => void
  onPhotoRemove: () => void
  isLoading?: boolean
  disabled?: boolean
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({
  currentPhoto,
  onPhotoChange,
  onPhotoRemove,
  isLoading = false,
  disabled = false
}) => {
  const [preview, setPreview] = useState<string | null>(currentPhoto || null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const handleFileSelect = async (file: File) => {
    // Validate file
    const validation = await validateImageFile(file)
    if (!validation.isValid) {
      toast.error(validation.error!)
      return
    }
    
    // Compress image
    const compressedFile = await compressImage(file)
    
    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(compressedFile)
    
    // Notify parent
    onPhotoChange(compressedFile)
  }
  
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }
  
  const handleRemovePhoto = () => {
    setPreview(null)
    onPhotoRemove()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }
  
  return (
    <div className="photo-upload-container">
      <div
        className={`
          photo-upload-area
          ${dragActive ? 'drag-active' : ''}
          ${disabled ? 'disabled' : ''}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        {preview ? (
          <div className="photo-preview">
            <img src={preview} alt="Preview" />
            {!disabled && (
              <button
                type="button"
                className="remove-photo-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemovePhoto()
                }}
              >
                ×
              </button>
            )}
          </div>
        ) : (
          <div className="upload-placeholder">
            <div className="upload-icon">📷</div>
            <p>Klik atau drag foto ke sini</p>
            <p className="upload-hint">
              Format: JPG, PNG, WebP | Maksimal: 5MB
            </p>
          </div>
        )}
        
        {isLoading && (
          <div className="upload-loading">
            <div className="spinner" />
            <p>Mengupload...</p>
          </div>
        )}
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
        disabled={disabled}
      />
    </div>
  )
}
```

## 6. Performance Optimization

### Lazy Loading
```typescript
// Lazy loading component
const LazyProfilePhoto = React.lazy(() => import('./ProfilePhoto'))

const ActressCard = ({ actress }) => {
  return (
    <div className="actress-card">
      <Suspense fallback={<div className="photo-skeleton" />}>
        <LazyProfilePhoto actress={actress} size="medium" />
      </Suspense>
      <div className="actress-info">
        <h3>{actress.name}</h3>
        <p>{actress.generation?.name}</p>
      </div>
    </div>
  )
}
```

### Image Preloading
```typescript
// Preload critical images
const preloadImages = (actresses: Actress[]) => {
  const criticalImages = actresses.slice(0, 10) // First 10 images
  
  criticalImages.forEach(actress => {
    if (actress.profile_photo_url) {
      const img = new Image()
      img.src = actress.profile_photo_url
    }
  })
}

// Usage in component
const ActressList = () => {
  const [actresses, setActresses] = useState<Actress[]>([])
  
  useEffect(() => {
    if (actresses.length > 0) {
      preloadImages(actresses)
    }
  }, [actresses])
}
```

### Responsive Images
```typescript
// Responsive image component
const ResponsiveProfilePhoto = ({ actress, sizes }) => {
  const [currentSize, setCurrentSize] = useState('medium')
  
  useEffect(() => {
    const updateSize = () => {
      if (window.innerWidth < 640) {
        setCurrentSize('small')
      } else if (window.innerWidth < 1024) {
        setCurrentSize('medium')
      } else {
        setCurrentSize('large')
      }
    }
    
    updateSize()
    window.addEventListener('resize', updateSize)
    
    return () => window.removeEventListener('resize', updateSize)
  }, [])
  
  const getImageUrl = () => {
    if (!actress.profile_photo_url) return null
    
    const baseUrl = actress.profile_photo_url
    const sizeMap = {
      small: '_thumb',
      medium: '_medium',
      large: ''
    }
    
    return baseUrl.replace('.jpg', `${sizeMap[currentSize]}.jpg`)
  }
  
  return (
    <ProfilePhoto
      actress={{
        ...actress,
        profile_photo_url: getImageUrl()
      }}
      size={currentSize}
    />
  )
}
```

## 7. Error Handling & Fallbacks

### Error States
```typescript
// Error handling for image loading
const useImageError = (src: string) => {
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    if (!src) {
      setIsLoading(false)
      return
    }
    
    const img = new Image()
    
    img.onload = () => {
      setIsLoading(false)
      setHasError(false)
    }
    
    img.onerror = () => {
      setIsLoading(false)
      setHasError(true)
    }
    
    img.src = src
    
    return () => {
      img.onload = null
      img.onerror = null
    }
  }, [src])
  
  return { hasError, isLoading }
}

// Usage
const ProfilePhotoWithErrorHandling = ({ actress }) => {
  const { hasError, isLoading } = useImageError(actress.profile_photo_url)
  
  if (isLoading) {
    return <div className="photo-skeleton" />
  }
  
  if (hasError || !actress.profile_photo_url) {
    return <FallbackAvatar actress={actress} />
  }
  
  return (
    <img
      src={actress.profile_photo_url}
      alt={`${actress.name} profile`}
      className="profile-photo"
    />
  )
}
```

### Fallback Strategies
```typescript
// Multiple fallback levels
const getProfileImage = (actress: Actress): string | null => {
  // 1. Primary: Profile photo URL
  if (actress.profile_photo_url) {
    return actress.profile_photo_url
  }
  
  // 2. Fallback: Gravatar (if email exists)
  if (actress.email) {
    const hash = md5(actress.email.toLowerCase())
    return `https://www.gravatar.com/avatar/${hash}?d=identicon&s=150`
  }
  
  // 3. Fallback: Generated avatar
  return null
}

// Avatar generation service
const generateAvatar = (name: string, size: number = 150): string => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  
  canvas.width = size
  canvas.height = size
  
  // Generate background color based on name
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
  ]
  
  const colorIndex = name.length % colors.length
  const backgroundColor = colors[colorIndex]
  
  // Draw background
  ctx!.fillStyle = backgroundColor
  ctx!.fillRect(0, 0, size, size)
  
  // Draw initials
  ctx!.fillStyle = '#FFFFFF'
  ctx!.font = `${size * 0.4}px Arial`
  ctx!.textAlign = 'center'
  ctx!.textBaseline = 'middle'
  
  const initials = name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
  
  ctx!.fillText(initials, size / 2, size / 2)
  
  return canvas.toDataURL()
}
```

## 8. Security Considerations

### File Security
```typescript
// Security validation
const validateFileSecurity = (file: File): boolean => {
  // Check file signature (magic numbers)
  const validSignatures = [
    { signature: [0xFF, 0xD8, 0xFF], type: 'image/jpeg' },
    { signature: [0x89, 0x50, 0x4E, 0x47], type: 'image/png' },
    { signature: [0x52, 0x49, 0x46, 0x46], type: 'image/webp' }
  ]
  
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer
      const bytes = new Uint8Array(arrayBuffer.slice(0, 10))
      
      const isValid = validSignatures.some(({ signature }) => {
        return signature.every((byte, index) => bytes[index] === byte)
      })
      
      resolve(isValid)
    }
    reader.readAsArrayBuffer(file.slice(0, 10))
  })
}

// Content Security Policy
const cspConfig = {
  'img-src': [
    "'self'",
    'https://*.supabase.co',
    'https://*.supabase.in',
    'data:',
    'blob:'
  ],
  'connect-src': [
    "'self'",
    'https://*.supabase.co',
    'https://*.supabase.in'
  ]
}
```

### Access Control
```typescript
// Row Level Security policies
const rlsPolicies = {
  // Users can only upload photos for actresses they own/manage
  uploadPolicy: `
    CREATE POLICY "Users can upload actress photos" 
    ON storage.objects FOR INSERT 
    WITH CHECK (
      bucket_id = 'actress-photos' AND
      auth.role() = 'authenticated' AND
      EXISTS (
        SELECT 1 FROM actresses 
        WHERE id = (storage.foldername(name))[1]::uuid
        AND created_by = auth.uid()
      )
    )
  `,
  
  // Users can only delete photos they uploaded
  deletePolicy: `
    CREATE POLICY "Users can delete their own uploads" 
    ON storage.objects FOR DELETE 
    USING (
      bucket_id = 'actress-photos' AND
      auth.uid()::text = (storage.foldername(name))[1]
    )
  `
}
```

## 9. Monitoring & Analytics

### Upload Analytics
```typescript
// Track upload metrics
const trackUploadMetrics = (result: UploadResult, file: File) => {
  const metrics = {
    success: result.success,
    fileSize: file.size,
    fileType: file.type,
    uploadTime: Date.now(),
    error: result.error
  }
  
  // Send to analytics service
  analytics.track('photo_upload', metrics)
  
  // Log for debugging
  console.log('Upload metrics:', metrics)
}

// Usage
const handleUpload = async (file: File) => {
  const result = await uploadProfilePhoto(actressId, file, accessToken)
  trackUploadMetrics(result, file)
  
  if (result.success) {
    toast.success('Foto profil berhasil diupload')
  } else {
    toast.error(result.error)
  }
}
```

### Performance Monitoring
```typescript
// Monitor image loading performance
const useImagePerformance = (src: string) => {
  const [metrics, setMetrics] = useState({
    loadTime: 0,
    error: false,
    cached: false
  })
  
  useEffect(() => {
    if (!src) return
    
    const startTime = performance.now()
    
    const img = new Image()
    
    img.onload = () => {
      const loadTime = performance.now() - startTime
      
      setMetrics({
        loadTime,
        error: false,
        cached: loadTime < 50 // Likely cached if < 50ms
      })
      
      // Send to analytics
      analytics.track('image_load', {
        loadTime,
        url: src,
        cached: loadTime < 50
      })
    }
    
    img.onerror = () => {
      setMetrics(prev => ({ ...prev, error: true }))
      
      analytics.track('image_error', { url: src })
    }
    
    img.src = src
  }, [src])
  
  return metrics
}
```

## 10. Testing Strategy

### Unit Tests
```typescript
// Test file validation
describe('File Validation', () => {
  it('should accept valid image files', async () => {
    const validFile = new File([''], 'test.jpg', { type: 'image/jpeg' })
    const result = await validateImageFile(validFile)
    
    expect(result.isValid).toBe(true)
  })
  
  it('should reject files that are too large', async () => {
    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', {
      type: 'image/jpeg'
    })
    const result = await validateImageFile(largeFile)
    
    expect(result.isValid).toBe(false)
    expect(result.error).toContain('terlalu besar')
  })
  
  it('should reject invalid file types', async () => {
    const invalidFile = new File([''], 'test.txt', { type: 'text/plain' })
    const result = await validateImageFile(invalidFile)
    
    expect(result.isValid).toBe(false)
    expect(result.error).toContain('Format file tidak didukung')
  })
})

// Test upload flow
describe('Upload Flow', () => {
  it('should upload file successfully', async () => {
    const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' })
    const mockSupabase = {
      storage: {
        from: jest.fn().mockReturnValue({
          upload: jest.fn().mockResolvedValue({
            data: { path: 'test/path' },
            error: null
          }),
          getPublicUrl: jest.fn().mockReturnValue({
            data: { publicUrl: 'https://example.com/image.jpg' }
          })
        })
      }
    }
    
    const result = await uploadProfilePhoto('actress-id', mockFile, 'token')
    
    expect(result.success).toBe(true)
    expect(result.url).toBe('https://example.com/image.jpg')
  })
})
```

### Integration Tests
```typescript
// Test complete upload flow
describe('Photo Upload Integration', () => {
  it('should handle complete upload process', async () => {
    const { getByTestId } = render(
      <PhotoUpload
        onPhotoChange={jest.fn()}
        onPhotoRemove={jest.fn()}
      />
    )
    
    const fileInput = getByTestId('photo-input')
    const file = new File([''], 'test.jpg', { type: 'image/jpeg' })
    
    fireEvent.change(fileInput, { target: { files: [file] } })
    
    await waitFor(() => {
      expect(getByTestId('photo-preview')).toBeInTheDocument()
    })
  })
})
```

---

**Last Updated:** December 2024  
**Version:** 1.0.0  
**Maintainer:** Development Team
