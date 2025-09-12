# 👨‍💻 Developer Guide: API Key Integration

## 🏗️ **System Architecture**

### **API Key Flow**
```
User Request → Component → Translation Function → getApiKeyWithFallback()
                                                      ↓
Environment Variable Check → Supabase Secrets Check → API Key Usage
```

### **File Structure**
```
src/
├── utils/
│   ├── deepseekTranslationApi.ts    # Main translation functions
│   ├── supabaseSecretsApi.ts         # Supabase secrets API
│   └── setupSupabaseSecrets.ts       # Setup utilities
├── components/
│   ├── SetupApiKey.tsx              # UI for API key setup
│   ├── DeepSeekTranslationTest.tsx  # Test component
│   ├── MovieDataParser.tsx          # Movie translation
│   ├── SeriesForm.tsx               # Series translation
│   └── MasterDataForm.tsx           # Actor/Actress translation
└── supabase/functions/
    └── make-server-e0516fcf/
        ├── index.ts                  # Main function (deployed)
        └── kv_store.tsx             # KV store operations
```

## 🔧 **Core Functions**

### **1. API Key Retrieval**
```typescript
// src/utils/deepseekTranslationApi.ts
const getApiKeyWithFallback = async (accessToken?: string): Promise<string | null> => {
  // Priority 1: Environment variable
  if (isApiKeyValid(OPENROUTER_API_KEY)) {
    return OPENROUTER_API_KEY
  }
  
  // Priority 2: Supabase secrets
  if (accessToken) {
    const secretApiKey = await getApiKeyFromSupabaseSecrets(accessToken, 'mvdb3')
    if (secretApiKey && isApiKeyValid(secretApiKey)) {
      return secretApiKey
    }
  }
  
  return null
}
```

### **2. Supabase Secrets API**
```typescript
// src/utils/supabaseSecretsApi.ts
export async function getApiKeyFromSupabaseSecrets(
  accessToken: string, 
  keyName: string = 'mvdb3'
): Promise<string | null> {
  const response = await fetch(`${SUPABASE_FUNCTION_URL}/kv-store/get/${keyName}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  })
  
  if (!response.ok) return null
  
  const data = await response.json()
  return data.success && data.value ? data.value : null
}
```

### **3. Translation Functions**
```typescript
// All translation functions now accept accessToken
export async function translateJapaneseToEnglish(
  japaneseText: string, 
  accessToken?: string
): Promise<string>

export async function translateJapaneseToEnglishWithContext(
  japaneseText: string, 
  context: ContextType,
  movieContext?: MovieContext,
  accessToken?: string
): Promise<string>

export async function convertJapaneseToRomaji(
  japaneseText: string, 
  accessToken?: string
): Promise<string>
```

## 🎯 **Component Integration**

### **1. Passing accessToken**
```typescript
// All components that use translation must pass accessToken
export function DeepSeekTranslationTest({ accessToken }: Props) {
  const handleTranslate = async () => {
    const result = await translateJapaneseToEnglish(testText, accessToken)
  }
}

export function MovieDataParser({ accessToken }: Props) {
  const translateTitle = async () => {
    const result = await translateMovieTitleWithContext(titleJp, movieData, accessToken)
  }
}
```

### **2. Component Props Interface**
```typescript
interface TranslationComponentProps {
  accessToken: string  // Required for Supabase secrets
  // ... other props
}
```

## 🔒 **Security Implementation**

### **1. Token Validation**
```typescript
// Server-side validation in Supabase function
app.get('/make-server-e0516fcf/kv-store/get/:key', async (c) => {
  const accessToken = c.req.header('Authorization')?.split(' ')[1]
  const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
  
  if (!user?.id || authError) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  // ... rest of the logic
})
```

### **2. API Key Validation**
```typescript
const isApiKeyValid = (key: string): boolean => {
  return Boolean(key && key.length > 20)
}
```

### **3. Error Handling**
```typescript
try {
  const apiKey = await getApiKeyFromSupabaseSecrets(accessToken, 'mvdb3')
  // Use API key
} catch (error) {
  console.warn('Failed to get API key from Supabase secrets:', error)
  // Fallback to environment variable or show error
}
```

## 🚀 **Deployment**

### **1. Supabase Functions**
```bash
# Deploy the function with kv-store endpoints
npx supabase functions deploy make-server-e0516fcf
```

### **2. Required Endpoints**
- `GET /make-server-e0516fcf/kv-store/get/:key`
- `POST /make-server-e0516fcf/kv-store/set`

### **3. Environment Variables**
```bash
# Optional for local development
VITE_OPENROUTER_API_KEY=sk-or-v1-your-api-key
```

## 🧪 **Testing**

### **1. Unit Tests**
```typescript
// Test API key retrieval
describe('getApiKeyWithFallback', () => {
  it('should return environment variable when available', async () => {
    process.env.VITE_OPENROUTER_API_KEY = 'test-key'
    const result = await getApiKeyWithFallback()
    expect(result).toBe('test-key')
  })
  
  it('should return Supabase secret when accessToken provided', async () => {
    const mockAccessToken = 'mock-token'
    const result = await getApiKeyWithFallback(mockAccessToken)
    expect(result).toBeDefined()
  })
})
```

### **2. Integration Tests**
```typescript
// Test translation with API key
describe('Translation Integration', () => {
  it('should translate Japanese text using Supabase secrets', async () => {
    const result = await translateJapaneseToEnglish('こんにちは', accessToken)
    expect(result).toBeDefined()
    expect(result).not.toBe('こんにちは')
  })
})
```

## 🔍 **Debugging**

### **1. Console Logs**
```typescript
// Enable debug logging
console.log('Getting API key with fallback...')
console.log('Environment variable OPENROUTER_API_KEY:', OPENROUTER_API_KEY ? 'exists' : 'not found')
console.log('Trying Supabase secrets with accessToken:', accessToken ? 'present' : 'missing')
console.log('Supabase secrets response:', secretApiKey ? 'found' : 'not found')
```

### **2. Network Tab**
- Check requests to `/kv-store/get/mvdb3`
- Verify Authorization header
- Check response status and data

### **3. Common Issues**
```typescript
// Issue: accessToken not passed
const result = await translateJapaneseToEnglish('text') // Missing accessToken

// Fix: Pass accessToken
const result = await translateJapaneseToEnglish('text', accessToken)

// Issue: Component not receiving accessToken
export function MyComponent({ /* missing accessToken */ }) {
  // ...
}

// Fix: Add accessToken to props
export function MyComponent({ accessToken }: { accessToken: string }) {
  // ...
}
```

## 📊 **Monitoring**

### **1. Success Metrics**
- API key retrieval success rate
- Translation success rate
- Fallback usage frequency

### **2. Error Tracking**
- Supabase secrets API errors
- Translation API errors
- Authentication failures

### **3. Performance**
- API key retrieval time
- Translation response time
- Cache hit rate

## 🔄 **Maintenance**

### **1. Key Rotation**
```typescript
// Update API key in Supabase secrets
await setApiKeyInSupabaseSecrets(accessToken, 'mvdb3', newApiKey)
```

### **2. Monitoring**
- Check API key usage
- Monitor error rates
- Update documentation

### **3. Updates**
- Keep Supabase functions updated
- Monitor OpenRouter API changes
- Update error handling

---

## 📚 **References**

- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [OpenRouter API](https://openrouter.ai/docs)
- [React Context API](https://react.dev/reference/react/useContext)

---

**Status**: ✅ **DEVELOPER READY** - Complete integration guide for API key management!
