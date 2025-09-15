# Implementation Patterns - Generation & Actress Feature

## Overview
Dokumentasi ini menjelaskan pola-pola implementasi yang digunakan dalam fitur Generation dan Actress, termasuk coding patterns, architectural decisions, dan best practices yang diterapkan.

## 1. API Layer Pattern

### Consistent API Structure
Semua API mengikuti pola yang konsisten:

```typescript
// Base API Pattern
class BaseApi {
  private baseUrl: string
  
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }
  
  // Standard CRUD operations
  async getAll(accessToken?: string): Promise<T[]>
  async getById(id: string, accessToken?: string): Promise<T>
  async create(data: CreateData, accessToken: string): Promise<T>
  async update(id: string, data: UpdateData, accessToken: string): Promise<T>
  async delete(id: string, accessToken: string): Promise<void>
}
```

### Error Handling Pattern
```typescript
// Consistent error handling across all APIs
try {
  const result = await api.create(data, accessToken)
  return { success: true, data: result }
} catch (error) {
  console.error('API Error:', error)
  return { 
    success: false, 
    error: error.message || 'Unknown error occurred' 
  }
}
```

### Authentication Pattern
```typescript
// Token-based authentication with fallback
const makeRequest = async (url: string, options: RequestInit, accessToken?: string) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    ...options.headers
  }
  
  return fetch(url, { ...options, headers })
}
```

## 2. Component Architecture Pattern

### Container-Presenter Pattern
```typescript
// Container Component (Logic)
const ActressManagementContainer = () => {
  const [actresses, setActresses] = useState<Actress[]>([])
  const [generations, setGenerations] = useState<Generation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  // Business logic here
  
  return (
    <ActressManagementPresenter
      actresses={actresses}
      generations={generations}
      isLoading={isLoading}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onCreate={handleCreate}
    />
  )
}

// Presenter Component (UI)
const ActressManagementPresenter = ({ 
  actresses, 
  generations, 
  isLoading, 
  onEdit, 
  onDelete, 
  onCreate 
}) => {
  // Pure UI rendering
  return (
    <div>
      {/* UI Components */}
    </div>
  )
}
```

### Compound Component Pattern
```typescript
// Main Component
const ActressForm = ({ actress, generations, onSubmit, onCancel }) => {
  return (
    <form onSubmit={handleSubmit}>
      <ActressForm.Header title={actress ? 'Edit Aktris' : 'Tambah Aktris'} />
      <ActressForm.Body>
        <ActressForm.NameInput />
        <ActressForm.JapaneseNameInput />
        <ActressForm.GenerationSelector generations={generations} />
        <ActressForm.PhotoUpload />
      </ActressForm.Body>
      <ActressForm.Footer onSubmit={onSubmit} onCancel={onCancel} />
    </form>
  )
}

// Sub-components
ActressForm.Header = ({ title }) => <h2>{title}</h2>
ActressForm.Body = ({ children }) => <div className="form-body">{children}</div>
ActressForm.Footer = ({ onSubmit, onCancel }) => (
  <div className="form-footer">
    <button type="button" onClick={onCancel}>Batal</button>
    <button type="submit">Simpan</button>
  </div>
)
```

## 3. State Management Pattern

### Context + Reducer Pattern
```typescript
// Context Definition
interface ActressContextType {
  state: ActressState
  dispatch: React.Dispatch<ActressAction>
}

// State Interface
interface ActressState {
  actresses: Actress[]
  generations: Generation[]
  isLoading: boolean
  error: string | null
  selectedActress: Actress | null
}

// Action Types
type ActressAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ACTRESSES'; payload: Actress[] }
  | { type: 'SET_GENERATIONS'; payload: Generation[] }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_ACTRESS'; payload: Actress }
  | { type: 'UPDATE_ACTRESS'; payload: Actress }
  | { type: 'DELETE_ACTRESS'; payload: string }

// Reducer
const actressReducer = (state: ActressState, action: ActressAction): ActressState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'SET_ACTRESSES':
      return { ...state, actresses: action.payload, isLoading: false }
    case 'ADD_ACTRESS':
      return { ...state, actresses: [...state.actresses, action.payload] }
    case 'UPDATE_ACTRESS':
      return {
        ...state,
        actresses: state.actresses.map(a => 
          a.id === action.payload.id ? action.payload : a
        )
      }
    case 'DELETE_ACTRESS':
      return {
        ...state,
        actresses: state.actresses.filter(a => a.id !== action.payload)
      }
    default:
      return state
  }
}
```

### Custom Hook Pattern
```typescript
// Custom hook untuk encapsulate logic
const useActressManagement = () => {
  const [state, dispatch] = useReducer(actressReducer, initialState)
  
  const fetchActresses = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const actresses = await actressApi.getActresses()
      dispatch({ type: 'SET_ACTRESSES', payload: actresses })
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message })
    }
  }, [])
  
  const createActress = useCallback(async (data: ActressFormData) => {
    try {
      const newActress = await actressApi.createActress(data)
      dispatch({ type: 'ADD_ACTRESS', payload: newActress })
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }, [])
  
  return {
    ...state,
    fetchActresses,
    createActress,
    updateActress,
    deleteActress
  }
}
```

## 4. Form Handling Pattern

### Controlled Components Pattern
```typescript
const ActressForm = ({ actress, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<ActressFormData>({
    name: actress?.name || '',
    name_jp: actress?.name_jp || '',
    generation_id: actress?.generation_id || '',
    profile_photo: null
  })
  
  const [errors, setErrors] = useState<FormErrors>({})
  
  const handleInputChange = (field: keyof ActressFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }
  
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Nama aktris harus diisi'
    }
    
    if (!formData.generation_id) {
      newErrors.generation_id = 'Generation harus dipilih'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    const result = await onSubmit(formData)
    if (result.success) {
      // Success handling
    } else {
      setErrors({ submit: result.error })
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  )
}
```

### File Upload Pattern
```typescript
const PhotoUpload = ({ onPhotoChange, currentPhoto }) => {
  const [preview, setPreview] = useState<string | null>(currentPhoto)
  const [isUploading, setIsUploading] = useState(false)
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Validate file
    if (!validateFile(file)) return
    
    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)
    
    // Upload file
    setIsUploading(true)
    try {
      const uploadedUrl = await uploadFile(file)
      onPhotoChange(uploadedUrl)
    } catch (error) {
      console.error('Upload error:', error)
    } finally {
      setIsUploading(false)
    }
  }
  
  const validateFile = (file: File): boolean => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    const maxSize = 5 * 1024 * 1024 // 5MB
    
    if (!allowedTypes.includes(file.type)) {
      toast.error('Format file tidak didukung. Gunakan JPG, PNG, atau WebP')
      return false
    }
    
    if (file.size > maxSize) {
      toast.error('Ukuran file terlalu besar. Maksimal 5MB')
      return false
    }
    
    return true
  }
  
  return (
    <div className="photo-upload">
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={isUploading}
      />
      {preview && (
        <img src={preview} alt="Preview" className="photo-preview" />
      )}
      {isUploading && <div className="upload-spinner">Uploading...</div>}
    </div>
  )
}
```

## 5. Data Fetching Pattern

### Async/Await with Error Boundaries
```typescript
const useAsyncData = <T>(
  asyncFn: () => Promise<T>,
  dependencies: any[] = []
) => {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const execute = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await asyncFn()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, dependencies)
  
  useEffect(() => {
    execute()
  }, [execute])
  
  return { data, isLoading, error, refetch: execute }
}

// Usage
const ActressList = () => {
  const { data: actresses, isLoading, error } = useAsyncData(
    () => actressApi.getActresses(),
    []
  )
  
  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} />
  
  return (
    <div>
      {actresses?.map(actress => (
        <ActressCard key={actress.id} actress={actress} />
      ))}
    </div>
  )
}
```

### Optimistic Updates Pattern
```typescript
const useOptimisticActress = () => {
  const [actresses, setActresses] = useState<Actress[]>([])
  
  const createActress = async (data: ActressFormData) => {
    // Create optimistic actress
    const optimisticActress: Actress = {
      id: `temp-${Date.now()}`,
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    // Add to UI immediately
    setActresses(prev => [...prev, optimisticActress])
    
    try {
      // Make API call
      const realActress = await actressApi.createActress(data)
      
      // Replace optimistic with real data
      setActresses(prev => 
        prev.map(a => a.id === optimisticActress.id ? realActress : a)
      )
      
      return { success: true, data: realActress }
    } catch (error) {
      // Remove optimistic actress on error
      setActresses(prev => 
        prev.filter(a => a.id !== optimisticActress.id)
      )
      
      return { success: false, error: error.message }
    }
  }
  
  return { actresses, createActress }
}
```

## 6. UI/UX Pattern

### Loading States Pattern
```typescript
const LoadingStates = {
  // Skeleton loading
  SkeletonCard: () => (
    <div className="skeleton-card">
      <div className="skeleton-avatar" />
      <div className="skeleton-text" />
      <div className="skeleton-text short" />
    </div>
  ),
  
  // Spinner loading
  Spinner: ({ size = 'medium' }) => (
    <div className={`spinner spinner-${size}`}>
      <div className="spinner-inner" />
    </div>
  ),
  
  // Button loading
  LoadingButton: ({ isLoading, children, ...props }) => (
    <button {...props} disabled={isLoading}>
      {isLoading ? <Spinner size="small" /> : children}
    </button>
  )
}
```

### Error States Pattern
```typescript
const ErrorStates = {
  // Error boundary
  ErrorBoundary: ({ children, fallback }) => {
    const [hasError, setHasError] = useState(false)
    
    useEffect(() => {
      const handleError = () => setHasError(true)
      window.addEventListener('error', handleError)
      return () => window.removeEventListener('error', handleError)
    }, [])
    
    if (hasError) return fallback
    return children
  },
  
  // Error message component
  ErrorMessage: ({ message, onRetry }) => (
    <div className="error-message">
      <p>{message}</p>
      {onRetry && (
        <button onClick={onRetry}>Coba Lagi</button>
      )}
    </div>
  ),
  
  // Empty state
  EmptyState: ({ message, action }) => (
    <div className="empty-state">
      <p>{message}</p>
      {action && <button onClick={action.onClick}>{action.label}</button>}
    </div>
  )
}
```

## 7. Validation Pattern

### Form Validation Schema
```typescript
const validationSchema = {
  actress: {
    name: {
      required: true,
      minLength: 2,
      maxLength: 100,
      pattern: /^[a-zA-Z\s\u3040-\u309F\u30A0-\u30FF]+$/,
      message: 'Nama harus 2-100 karakter dan hanya huruf'
    },
    name_jp: {
      required: false,
      maxLength: 100,
      pattern: /^[\u3040-\u309F\u30A0-\u30FF\s]+$/,
      message: 'Nama Jepang hanya boleh huruf hiragana/katakana'
    },
    generation_id: {
      required: true,
      message: 'Generation harus dipilih'
    }
  },
  
  generation: {
    name: {
      required: true,
      minLength: 3,
      maxLength: 50,
      unique: true,
      message: 'Nama generation harus 3-50 karakter dan unik'
    },
    description: {
      required: false,
      maxLength: 200,
      message: 'Deskripsi maksimal 200 karakter'
    }
  }
}

// Validation function
const validateField = (value: any, rules: ValidationRules): string | null => {
  if (rules.required && (!value || value.toString().trim() === '')) {
    return rules.message || 'Field ini harus diisi'
  }
  
  if (value && rules.minLength && value.length < rules.minLength) {
    return rules.message || `Minimal ${rules.minLength} karakter`
  }
  
  if (value && rules.maxLength && value.length > rules.maxLength) {
    return rules.message || `Maksimal ${rules.maxLength} karakter`
  }
  
  if (value && rules.pattern && !rules.pattern.test(value)) {
    return rules.message || 'Format tidak valid'
  }
  
  return null
}
```

## 8. Performance Optimization Pattern

### Memoization Pattern
```typescript
// Memoized components
const ActressCard = React.memo(({ actress, onEdit, onDelete }) => {
  return (
    <div className="actress-card">
      {/* Component content */}
    </div>
  )
}, (prevProps, nextProps) => {
  return prevProps.actress.id === nextProps.actress.id &&
         prevProps.actress.updated_at === nextProps.actress.updated_at
})

// Memoized callbacks
const ActressList = () => {
  const [actresses, setActresses] = useState<Actress[]>([])
  
  const handleEdit = useCallback((actress: Actress) => {
    // Edit logic
  }, [])
  
  const handleDelete = useCallback((id: string) => {
    // Delete logic
  }, [])
  
  return (
    <div>
      {actresses.map(actress => (
        <ActressCard
          key={actress.id}
          actress={actress}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      ))}
    </div>
  )
}
```

### Virtual Scrolling Pattern (Future)
```typescript
const VirtualizedActressList = ({ actresses }) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 })
  
  const visibleActresses = actresses.slice(visibleRange.start, visibleRange.end)
  
  return (
    <div className="virtual-list">
      <div style={{ height: visibleRange.start * 100 }} />
      {visibleActresses.map(actress => (
        <ActressCard key={actress.id} actress={actress} />
      ))}
      <div style={{ height: (actresses.length - visibleRange.end) * 100 }} />
    </div>
  )
}
```

## 9. Testing Pattern

### Component Testing Pattern
```typescript
// Test setup
const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <ActressProvider>
      <ThemeProvider>
        {component}
      </ThemeProvider>
    </ActressProvider>
  )
}

// Test cases
describe('ActressForm', () => {
  it('should render form fields correctly', () => {
    const mockGenerations = [
      { id: '1', name: 'Generation 1' },
      { id: '2', name: 'Generation 2' }
    ]
    
    renderWithProviders(
      <ActressForm 
        generations={mockGenerations}
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
      />
    )
    
    expect(screen.getByLabelText('Nama Aktris')).toBeInTheDocument()
    expect(screen.getByLabelText('Nama Jepang')).toBeInTheDocument()
    expect(screen.getByLabelText('Generation')).toBeInTheDocument()
  })
  
  it('should validate required fields', async () => {
    const mockOnSubmit = jest.fn()
    
    renderWithProviders(
      <ActressForm 
        generations={[]}
        onSubmit={mockOnSubmit}
        onCancel={jest.fn()}
      />
    )
    
    fireEvent.click(screen.getByText('Simpan'))
    
    await waitFor(() => {
      expect(screen.getByText('Nama aktris harus diisi')).toBeInTheDocument()
    })
    
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })
})
```

### API Testing Pattern
```typescript
// Mock API responses
const mockActressApi = {
  getActresses: jest.fn(),
  createActress: jest.fn(),
  updateActress: jest.fn(),
  deleteActress: jest.fn()
}

// Test API calls
describe('ActressApi', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  
  it('should fetch actresses successfully', async () => {
    const mockActresses = [
      { id: '1', name: 'Actress 1', generation_id: 'gen1' },
      { id: '2', name: 'Actress 2', generation_id: 'gen2' }
    ]
    
    mockActressApi.getActresses.mockResolvedValue(mockActresses)
    
    const result = await actressApi.getActresses()
    
    expect(result).toEqual(mockActresses)
    expect(mockActressApi.getActresses).toHaveBeenCalledTimes(1)
  })
  
  it('should handle API errors', async () => {
    const errorMessage = 'Network error'
    mockActressApi.getActresses.mockRejectedValue(new Error(errorMessage))
    
    await expect(actressApi.getActresses()).rejects.toThrow(errorMessage)
  })
})
```

## 10. Accessibility Pattern

### ARIA Labels and Roles
```typescript
const AccessibleActressForm = () => {
  return (
    <form role="form" aria-label="Form Tambah Aktris">
      <div role="group" aria-labelledby="name-label">
        <label id="name-label" htmlFor="name-input">
          Nama Aktris
        </label>
        <input
          id="name-input"
          type="text"
          aria-required="true"
          aria-describedby="name-error"
        />
        <div id="name-error" role="alert" aria-live="polite">
          {/* Error message */}
        </div>
      </div>
      
      <button
        type="submit"
        aria-describedby="submit-help"
      >
        Simpan
      </button>
      <div id="submit-help" className="sr-only">
        Tekan Enter atau klik untuk menyimpan data aktris
      </div>
    </form>
  )
}
```

### Keyboard Navigation
```typescript
const KeyboardNavigableList = ({ items, onSelect }) => {
  const [focusedIndex, setFocusedIndex] = useState(0)
  
  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex(prev => 
          prev < items.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex(prev => 
          prev > 0 ? prev - 1 : items.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        onSelect(items[focusedIndex])
        break
    }
  }
  
  return (
    <div 
      role="listbox"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-activedescendant={`item-${focusedIndex}`}
    >
      {items.map((item, index) => (
        <div
          key={item.id}
          id={`item-${index}`}
          role="option"
          aria-selected={index === focusedIndex}
          className={index === focusedIndex ? 'focused' : ''}
        >
          {item.name}
        </div>
      ))}
    </div>
  )
}
```

## 11. Security Pattern

### Input Sanitization
```typescript
const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .substring(0, 1000) // Limit length
}

const validateFileUpload = (file: File): boolean => {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return false
  }
  
  // Check file size (5MB max)
  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    return false
  }
  
  // Check file extension
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp']
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
  if (!allowedExtensions.includes(extension)) {
    return false
  }
  
  return true
}
```

### CSRF Protection
```typescript
const makeSecureRequest = async (url: string, options: RequestInit) => {
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
  
  const headers = {
    'Content-Type': 'application/json',
    ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
    ...options.headers
  }
  
  return fetch(url, { ...options, headers })
}
```

## 12. Monitoring and Logging Pattern

### Error Logging
```typescript
const logError = (error: Error, context: string) => {
  console.error(`[${context}] Error:`, {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href
  })
  
  // Send to monitoring service
  if (process.env.NODE_ENV === 'production') {
    // Send to Sentry, LogRocket, etc.
  }
}

// Usage in components
const ActressForm = () => {
  const handleSubmit = async (data: ActressFormData) => {
    try {
      await actressApi.createActress(data)
    } catch (error) {
      logError(error as Error, 'ActressForm.handleSubmit')
      toast.error('Gagal menyimpan aktris')
    }
  }
}
```

### Performance Monitoring
```typescript
const measurePerformance = (name: string, fn: () => Promise<any>) => {
  return async (...args: any[]) => {
    const start = performance.now()
    try {
      const result = await fn(...args)
      const duration = performance.now() - start
      
      console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`)
      
      // Send to analytics
      if (duration > 1000) { // Log slow operations
        console.warn(`[Slow Operation] ${name}: ${duration.toFixed(2)}ms`)
      }
      
      return result
    } catch (error) {
      const duration = performance.now() - start
      console.error(`[Performance Error] ${name}: ${duration.toFixed(2)}ms`, error)
      throw error
    }
  }
}

// Usage
const createActress = measurePerformance('createActress', async (data: ActressFormData) => {
  return actressApi.createActress(data)
})
```

---

**Last Updated:** December 2024  
**Version:** 1.0.0  
**Maintainer:** Development Team
