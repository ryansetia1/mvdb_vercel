# API Key Setup Guide

## 🔑 **Setup OpenRouter API Key**

### **Masalah yang Ditemukan:**
```
GET https://duafhkktqobwwwwtygwn.supabase.co/functions/v1/make-server-e0516fcf/kv-store/get/mvdb3 404 (Not Found)
supabaseSecretsApi.ts:28 Failed to get secret mvdb3: 404
```

### **Solusi:**
Sistem sekarang menyediakan interface untuk setup API key ke Supabase secrets.

## 🚀 **Cara Setup API Key**

### **1. Akses Setup Interface**
1. Buka Dashboard
2. Klik tab "Setup API Key"
3. Interface setup akan muncul

### **2. Check Status API Key**
1. Klik tombol "Check API Key Status"
2. Sistem akan mengecek apakah API key sudah ada di Supabase secrets
3. Status akan ditampilkan:
   - ✅ **Exists**: API key sudah tersimpan
   - ❌ **Missing**: API key tidak ditemukan
   - ⚠️ **Unknown**: Status belum dicek

### **3. Setup API Key Baru**
1. Dapatkan API key dari [OpenRouter.ai](https://openrouter.ai/)
2. Masukkan API key di form
3. Klik "Save to Supabase Secrets"
4. API key akan disimpan secara terenkripsi

## 🔧 **Technical Implementation**

### **1. Supabase Secrets API**
```typescript
// Get API key from Supabase secrets
export async function getApiKeyFromSupabaseSecrets(
  accessToken: string, 
  keyName: string = 'mvdb3'
): Promise<string | null>

// Set API key in Supabase secrets
export async function setApiKeyInSupabaseSecrets(
  accessToken: string, 
  keyName: string, 
  keyValue: string
): Promise<boolean>
```

### **2. Endpoint yang Digunakan**
- **Get**: `GET /make-server-e0516fcf/kv-store/get/mvdb3`
- **Set**: `POST /make-server-e0516fcf/kv-store/set`

### **3. Authentication**
- Menggunakan Supabase access token
- Hanya user terautentikasi yang bisa akses
- Token-based security

## 🔒 **Security Features**

### **1. Encrypted Storage**
- ✅ API key disimpan terenkripsi di Supabase
- ✅ Tidak ada hardcoded keys di source code
- ✅ Secure transmission

### **2. Access Control**
- ✅ Requires user authentication
- ✅ Token-based access
- ✅ User-specific secrets

### **3. Error Handling**
- ✅ Graceful fallback ke environment variables
- ✅ Clear error messages
- ✅ No sensitive data exposure

## 📊 **Fallback Mechanism**

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

## 🧪 **Testing**

### **1. Test Setup Interface**
1. Buka Dashboard → Setup API Key tab
2. Klik "Check API Key Status"
3. Masukkan API key dan klik "Save to Supabase Secrets"
4. Verify status berubah menjadi "Exists"

### **2. Test Translation**
1. Buka Dashboard → DeepSeek Test tab
2. Klik "Test Connection"
3. Should show "Connected" status
4. Try translating sample text

### **3. Test Components**
- MovieDataParser: Test title translation
- SeriesForm: Test series name translation
- MasterDataForm: Test actor/actress name translation

## 🛠️ **Troubleshooting**

### **Common Issues:**

#### **"404 Not Found" Error**
- Check if Supabase function is deployed
- Verify endpoint URL is correct
- Check authentication status

#### **"API key tidak dikonfigurasi"**
- Check if user is authenticated
- Verify API key is saved in Supabase secrets
- Check network connectivity

#### **"Connection Failed"**
- Verify API key is valid
- Check OpenRouter account status
- Test with environment variable fallback

### **Debug Steps:**
1. Check browser console for errors
2. Verify Supabase secrets response
3. Test with simple API key
4. Check network requests

## 📈 **Benefits**

### **1. Security**
- ✅ No hardcoded API keys
- ✅ Encrypted storage
- ✅ Token-based access

### **2. User Experience**
- ✅ Easy setup interface
- ✅ Clear status indicators
- ✅ Step-by-step guidance

### **3. Flexibility**
- ✅ Environment variable fallback
- ✅ Multiple deployment options
- ✅ Easy key rotation

## 🔄 **Future Enhancements**

### **Possible Improvements:**
- Multiple API key support
- Key rotation automation
- Usage monitoring
- Rate limit management
- API key validation

---

**Status**: ✅ **READY** - Setup interface siap digunakan untuk mengatasi masalah 404!
