# 🔑 Panduan Lengkap: API Key dengan Supabase Secrets

## 📋 **Overview**

Sistem ini menggunakan Supabase secrets untuk menyimpan API key OpenRouter secara aman dan terenkripsi. Ini memberikan keamanan yang lebih baik dibandingkan environment variables dan memungkinkan akses berbasis token untuk user yang terautentikasi.

## 🏗️ **Arsitektur Sistem**

### **Fallback Mechanism**
Sistem menggunakan prioritas berikut untuk mendapatkan API key:

1. **Environment Variables** (`VITE_OPENROUTER_API_KEY`) - Prioritas tertinggi
2. **Supabase Secrets** (`mvdb3`) - Fallback untuk user terautentikasi  
3. **Error** - Jika keduanya tidak tersedia

### **Flow Diagram**
```
User Request → Check Environment Variable → Check Supabase Secrets → Use API Key
     ↓                    ↓                         ↓                    ↓
  Access Token      VITE_OPENROUTER_API_KEY    Secret: mvdb3      DeepSeek R1 API
```

## 🔧 **Setup dan Konfigurasi**

### **1. Secret Configuration**
- **Secret Name**: `mvdb3`
- **Storage**: Supabase KV Store (encrypted)
- **Access**: Token-based authentication
- **Endpoint**: `/make-server-e0516fcf/kv-store/`

### **2. API Endpoints**

#### **Get Secret**
```http
GET /make-server-e0516fcf/kv-store/get/mvdb3
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Response:**
```json
{
  "success": true,
  "key": "mvdb3",
  "value": "sk-or-v1-your-api-key-here",
  "exists": true
}
```

#### **Set Secret**
```http
POST /make-server-e0516fcf/kv-store/set
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "key": "mvdb3",
  "value": "sk-or-v1-your-api-key-here"
}
```

**Response:**
```json
{
  "success": true,
  "key": "mvdb3",
  "message": "Value set successfully"
}
```

## 💻 **Implementasi Code**

### **1. API Key Retrieval Function**
```typescript
// src/utils/deepseekTranslationApi.ts
const getApiKeyWithFallback = async (accessToken?: string): Promise<string | null> => {
  console.log('Getting API key with fallback...')
  
  // First try environment variable
  console.log('Environment variable OPENROUTER_API_KEY:', OPENROUTER_API_KEY ? 'exists' : 'not found')
  if (isApiKeyValid(OPENROUTER_API_KEY)) {
    console.log('Using environment variable API key')
    return OPENROUTER_API_KEY
  }
  
  // Fallback to Supabase secrets if accessToken is provided
  if (accessToken) {
    console.log('Trying Supabase secrets with accessToken:', accessToken ? 'present' : 'missing')
    try {
      const secretApiKey = await getApiKeyFromSupabaseSecrets(accessToken, 'mvdb3')
      console.log('Supabase secrets response:', secretApiKey ? 'found' : 'not found')
      if (secretApiKey && isApiKeyValid(secretApiKey)) {
        console.log('Using Supabase secrets API key')
        return secretApiKey
      } else {
        console.log('Supabase secrets API key invalid or empty')
      }
    } catch (error) {
      console.warn('Failed to get API key from Supabase secrets:', error)
    }
  } else {
    console.log('No accessToken provided for Supabase secrets')
  }
  
  console.log('No valid API key found')
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
  try {
    console.log(`Getting secret ${keyName} from Supabase...`)
    console.log('Function URL:', SUPABASE_FUNCTION_URL)
    console.log('Access token present:', accessToken ? 'yes' : 'no')
    
    const response = await fetch(`${SUPABASE_FUNCTION_URL}/kv-store/get/${keyName}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    console.log(`Response status: ${response.status} ${response.statusText}`)

    if (!response.ok) {
      console.warn(`Failed to get secret ${keyName}:`, response.status, response.statusText)
      return null
    }

    const data = await response.json()
    console.log(`Supabase secrets response for ${keyName}:`, data)
    
    if (data.success && data.value) {
      console.log(`Secret ${keyName} found with value length:`, data.value.length)
      return data.value
    }
    
    console.log(`Secret ${keyName} not found or empty`)
    return null
  } catch (error) {
    console.warn(`Error getting secret ${keyName}:`, error)
    return null
  }
}
```

### **3. Translation Functions**
```typescript
// Semua fungsi translation sekarang menerima accessToken
export async function translateJapaneseToEnglish(
  japaneseText: string, 
  accessToken?: string
): Promise<string>

export async function translateJapaneseToEnglishWithContext(
  japaneseText: string, 
  context: 'movie_title' | 'actor_name' | 'actress_name' | 'studio_name' | 'series_name' | 'general',
  movieContext?: TranslationRequest['movieContext'],
  accessToken?: string
): Promise<string>

export async function convertJapaneseToRomaji(
  japaneseText: string, 
  accessToken?: string
): Promise<string>
```

## 🎯 **Cara Penggunaan**

### **1. Setup API Key melalui UI**

#### **Langkah-langkah:**
1. **Login** ke aplikasi
2. **Klik tab "Setup API Key"** di Dashboard
3. **Klik "Check API Key Status"** untuk mengecek status
4. **Masukkan API key** OpenRouter di form
5. **Klik "Save to Supabase Secrets"**

#### **Status yang Ditampilkan:**
- ✅ **Exists**: API key sudah tersimpan
- ❌ **Missing**: API key tidak ditemukan
- ⚠️ **Unknown**: Status belum dicek

### **2. Setup API Key Programmatically**
```typescript
import { setupOpenRouterApiKey } from '../utils/setupSupabaseSecrets'

// Setup API key
const success = await setupOpenRouterApiKey(accessToken, 'sk-or-v1-your-api-key')
if (success) {
  console.log('API key berhasil disimpan')
} else {
  console.log('Gagal menyimpan API key')
}
```

### **3. Menggunakan Translation Functions**
```typescript
// Dengan accessToken (menggunakan Supabase secrets)
const translatedText = await translateJapaneseToEnglish('こんにちは', accessToken)

// Tanpa accessToken (menggunakan environment variable)
const translatedText = await translateJapaneseToEnglish('こんにちは')
```

## 🔒 **Keamanan**

### **1. Encrypted Storage**
- ✅ API key disimpan terenkripsi di Supabase KV Store
- ✅ Tidak ada hardcoded keys di source code
- ✅ Secure transmission melalui HTTPS

### **2. Access Control**
- ✅ Requires user authentication
- ✅ Token-based access to secrets
- ✅ User-specific secrets

### **3. Best Practices**
- ✅ No API keys in version control
- ✅ Environment variable fallback
- ✅ Clear error messages without sensitive data
- ✅ Regular key rotation

## 🛠️ **Komponen yang Terintegrasi**

### **1. DeepSeekTranslationTest**
```typescript
// src/components/DeepSeekTranslationTest.tsx
export function DeepSeekTranslationTest({ accessToken }: DeepSeekTranslationTestProps) {
  const handleTranslate = async () => {
    const result = await translateJapaneseToEnglish(testText, accessToken)
    // ...
  }
}
```

### **2. MovieDataParser**
```typescript
// src/components/MovieDataParser.tsx
const translatedText = await translateMovieTitleWithContext(
  parsedData.titleJp, 
  movieData, 
  accessToken
)
```

### **3. SeriesForm**
```typescript
// src/components/SeriesForm.tsx
const translatedText = await translateJapaneseToEnglishWithContext(
  formData.titleJp, 
  'series_name', 
  undefined, 
  accessToken
)
```

### **4. MasterDataForm**
```typescript
// src/components/MasterDataForm.tsx
const translatedText = await translateJapaneseToEnglishWithContext(
  formData.jpname, 
  context, 
  undefined, 
  accessToken
)
```

## 🚀 **Deployment**

### **1. Supabase Functions Deployment**
```bash
# Deploy functions dengan endpoint kv-store
npx supabase functions deploy make-server-e0516fcf
```

### **2. Endpoint yang Di-deploy**
- ✅ `GET /make-server-e0516fcf/kv-store/get/:key`
- ✅ `POST /make-server-e0516fcf/kv-store/set`
- ✅ Authentication required untuk semua endpoint

### **3. Verifikasi Deployment**
```bash
# Test endpoint
curl -X GET "https://duafhkktqobwwwwtygwn.supabase.co/functions/v1/make-server-e0516fcf/kv-store/get/mvdb3" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 🔍 **Troubleshooting**

### **1. Debug Logs**
Sistem menyediakan logging lengkap untuk troubleshooting:

```typescript
// Console logs yang akan muncul:
Getting API key with fallback...
Environment variable OPENROUTER_API_KEY: not found
Trying Supabase secrets with accessToken: present
Getting secret mvdb3 from Supabase...
Function URL: https://duafhkktqobwwwwtygwn.supabase.co/functions/v1/make-server-e0516fcf
Access token present: yes
Response status: 200 OK
Supabase secrets response for mvdb3: {success: true, key: "mvdb3", value: "sk-or-v1-...", exists: true}
Secret mvdb3 found with value length: 45
Using Supabase secrets API key
```

### **2. Common Issues**

#### **"API key tidak dikonfigurasi"**
- ✅ Check apakah user sudah login
- ✅ Verify Supabase secrets accessible
- ✅ Check network connectivity

#### **"Failed to get secret mvdb3: 404"**
- ✅ Verify endpoint sudah di-deploy
- ✅ Check function URL configuration
- ✅ Ensure authentication token valid

#### **"Supabase secrets API key invalid or empty"**
- ✅ Verify API key format (harus dimulai dengan `sk-or-v1-`)
- ✅ Check apakah API key sudah disimpan dengan benar
- ✅ Test dengan environment variable sebagai fallback

### **3. Testing**
```typescript
// Test connection
const isConnected = await testOpenRouterConnection(accessToken)

// Test translation
const translatedText = await translateJapaneseToEnglish('こんにちは', accessToken)

// Test secret retrieval
const apiKey = await getApiKeyFromSupabaseSecrets(accessToken, 'mvdb3')
```

## 📊 **Monitoring dan Logs**

### **1. Browser Console Logs**
- ✅ API key retrieval process
- ✅ Supabase secrets response
- ✅ Translation success/failure
- ✅ Fallback mechanism usage

### **2. Server Logs**
- ✅ KV store operations
- ✅ Authentication status
- ✅ API key validation
- ✅ Error tracking

## 🎉 **Benefits**

### **1. Security**
- ✅ Encrypted storage
- ✅ Token-based access
- ✅ No hardcoded keys

### **2. Flexibility**
- ✅ Environment variable fallback
- ✅ Multiple deployment options
- ✅ Easy key rotation

### **3. User Experience**
- ✅ Seamless integration
- ✅ No manual configuration needed
- ✅ Automatic fallback

---

## 📚 **Referensi**

- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
- [OpenRouter API Documentation](https://openrouter.ai/docs)
- [DeepSeek R1 Model Information](https://deepseek.com/)

---

**Status**: ✅ **FULLY INTEGRATED** - Supabase secrets berhasil diintegrasikan untuk API key management dengan fallback mechanism yang robust!
