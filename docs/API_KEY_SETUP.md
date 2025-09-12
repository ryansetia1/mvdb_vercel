# API Key Setup Guide

## 🔑 **OpenRouter API Key Setup**

### **1. Get API Key**
1. Visit [OpenRouter.ai](https://openrouter.ai/)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the generated key

### **2. Local Development Setup**

#### **Option A: Environment Variables**
1. Create `.env.local` file in project root
2. Add your API key:
   ```bash
   VITE_OPENROUTER_API_KEY=your_api_key_here
   ```
3. Restart development server

#### **Option B: Supabase Secrets**
1. Go to Supabase Dashboard
2. Navigate to Settings → Secrets
3. Add new secret with key: `openrouter-api-key`
4. Set value to your API key
5. Save the secret

### **3. Production Setup**

#### **Supabase Secrets (Recommended)**
1. Store API key in Supabase secrets
2. Access through authenticated users
3. No environment variables needed
4. Secure and encrypted storage

## 🚀 **Testing**

### **Test AI Translation:**
1. Open Dashboard → DeepSeek Test tab
2. Click "Test Connection"
3. Should show "Connected" status
4. Try translating sample text

### **Test Components:**
- MovieDataParser: Test title translation
- SeriesForm: Test series name translation
- MasterDataForm: Test actor/actress name translation

## 🔒 **Security**

### **Important:**
- ✅ Never commit API keys to version control
- ✅ Use environment variables for local development
- ✅ Use Supabase secrets for production
- ✅ Rotate keys regularly

### **File Structure:**
```
.env.local          # Local development (gitignored)
supabase/secrets/   # Production secrets
```

## 🛠️ **Troubleshooting**

### **Common Issues:**

#### **"API key tidak dikonfigurasi"**
- Check if `.env.local` exists
- Verify `VITE_OPENROUTER_API_KEY` is set
- Restart development server

#### **"Test Connection Failed"**
- Verify API key is valid
- Check network connectivity
- Ensure OpenRouter account is active

#### **Translation Not Working**
- Check browser console for errors
- Verify API key format
- Test with simple text first

## 📊 **Monitoring**

### **Check Status:**
- Dashboard → DeepSeek Test tab
- Browser console for errors
- Network tab for API requests

### **Usage Tracking:**
- Monitor OpenRouter dashboard
- Check usage limits
- Set up alerts if needed

---

**Status**: ✅ **SECURE** - No API keys exposed in codebase!
