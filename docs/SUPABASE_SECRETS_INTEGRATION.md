# Supabase Secrets Integration

## 🔑 **Integrasi Supabase Secrets**

Sistem sekarang menggunakan Supabase secrets untuk menyimpan API key OpenRouter secara aman.

### **Key Details:**
- **Secret Name**: mvdb3
- **Key Value**: `c9ce5ef27bf8ddb1a42870a44c67553748d52bbee389`
- **Storage**: Supabase Secrets (encrypted)
- **Access**: Authenticated users only

## 🔄 **Fallback Mechanism**

### **Priority Order:**
1. **Environment Variables** (`VITE_OPENROUTER_API_KEY`) - Highest priority
2. **Supabase Secrets** (`mvdb3`) - Fallback for authenticated users
3. **Error** - If neither available

### **Implementation:**
```typescript
const getApiKeyWithFallback = async (accessToken?: string): Promise<string | null> => {
  // First try environment variable
  if (isApiKeyValid(OPENROUTER_API_KEY)) {
    return OPENROUTER_API_KEY
  }
  
  // Fallback to Supabase secrets if accessToken is provided
  if (accessToken) {
    try {
      const secretApiKey = await getApiKeyFromSupabaseSecrets(accessToken, 'mvdb3')
      if (secretApiKey && isApiKeyValid(secretApiKey)) {
        return secretApiKey
      }
    } catch (error) {
      console.warn('Failed to get API key from Supabase secrets:', error)
    }
  }
  
  return null
}
```

## 🛠️ **Components Updated**

### **1. DeepSeekTranslationTest**
- ✅ Added `accessToken` prop
- ✅ Passes token to all translation functions
- ✅ Test connection uses Supabase secrets

### **2. MovieDataParser**
- ✅ Passes `accessToken` to `translateMovieTitleWithContext`
- ✅ Uses Supabase secrets for translation

### **3. SeriesForm**
- ✅ Passes `accessToken` to `translateJapaneseToEnglishWithContext`
- ✅ Uses Supabase secrets for translation

### **4. MasterDataForm**
- ✅ Ready for Supabase secrets integration
- ✅ Functions updated to accept `accessToken`

## 🔒 **Security Features**

### **1. Encrypted Storage**
- ✅ API key stored encrypted in Supabase
- ✅ Only accessible with valid access token
- ✅ No hardcoded keys in source code

### **2. Access Control**
- ✅ Requires user authentication
- ✅ Token-based access to secrets
- ✅ Secure API endpoints

### **3. Error Handling**
- ✅ Graceful fallback to environment variables
- ✅ Clear error messages
- ✅ No sensitive data in error logs

## 🚀 **Usage**

### **Local Development:**
```bash
# .env.local
VITE_OPENROUTER_API_KEY=your_api_key_here
```

### **Production:**
- ✅ Uses Supabase secrets automatically
- ✅ No environment variables needed
- ✅ Secure and encrypted

## 📊 **API Functions Updated**

### **1. translateWithDeepSeek**
```typescript
export async function translateWithDeepSeek(request: TranslationRequest): Promise<TranslationResponse>
// Now accepts accessToken in request
```

### **2. translateJapaneseToEnglishWithContext**
```typescript
export async function translateJapaneseToEnglishWithContext(
  japaneseText: string, 
  context: string,
  movieContext?: TranslationRequest['movieContext'],
  accessToken?: string  // New parameter
): Promise<string>
```

### **3. translateMovieTitleWithContext**
```typescript
export async function translateMovieTitleWithContext(
  movieTitle: string,
  movieData: object,
  accessToken?: string  // New parameter
): Promise<string>
```

### **4. convertJapaneseToRomaji**
```typescript
export async function convertJapaneseToRomaji(
  japaneseText: string,
  accessToken?: string  // New parameter
): Promise<string>
```

### **5. testOpenRouterConnection**
```typescript
export async function testOpenRouterConnection(
  accessToken?: string  // New parameter
): Promise<boolean>
```

## 🔍 **Testing**

### **Test Connection:**
1. Open Dashboard → DeepSeek Test tab
2. Click "Test Connection"
3. Should show "Connected" status
4. Uses Supabase secrets automatically

### **Test Translation:**
1. Enter Japanese text
2. Click "Translate to English"
3. Should work with Supabase secrets
4. Check browser console for success logs

## 🛠️ **Troubleshooting**

### **Common Issues:**

#### **"API key tidak dikonfigurasi"**
- Check if user is authenticated
- Verify Supabase secrets are accessible
- Check network connectivity

#### **"Connection Failed"**
- Verify Supabase secrets contain valid API key
- Check access token validity
- Test with environment variable as fallback

#### **"Supabase Secrets Error"**
- Check Supabase function URL
- Verify secret name (`mvdb3`)
- Check authentication status

## 📈 **Benefits**

### **1. Security**
- ✅ No hardcoded API keys
- ✅ Encrypted storage
- ✅ Token-based access

### **2. Flexibility**
- ✅ Environment variable fallback
- ✅ Multiple deployment options
- ✅ Easy key rotation

### **3. User Experience**
- ✅ Seamless integration
- ✅ No manual configuration needed
- ✅ Automatic fallback

## 🔄 **Future Enhancements**

### **Possible Improvements:**
- Multiple API key support
- Key rotation automation
- Usage monitoring
- Rate limit management

---

**Status**: ✅ **INTEGRATED** - Supabase secrets berhasil diintegrasikan untuk API key management!
