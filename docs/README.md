
# mvdb

This is a code bundle for mvdb. The original project is available at https://www.figma.com/design/qvmmxwhb9JfmrRW4lKQd2M/mvdb.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm i
```

### 2. Setup API Key (Required for AI Translation)
- **Quick Setup**: See [QUICK_API_KEY_SETUP.md](./QUICK_API_KEY_SETUP.md)
- **Detailed Guide**: See [SUPABASE_SECRETS_API_KEY_GUIDE.md](./SUPABASE_SECRETS_API_KEY_GUIDE.md)

### 3. Start Development Server
```bash
npm run dev
```

## 🔑 API Key Setup

The application uses Supabase secrets to securely store OpenRouter API keys for AI translation features.

### **Quick Setup (2 minutes)**
1. Get API key from [OpenRouter.ai](https://openrouter.ai/)
2. Login to the application
3. Go to "Setup API Key" tab
4. Save your API key to Supabase secrets
5. Test translation in "DeepSeek Test" tab

### **Features Requiring API Key**
- ✅ Japanese to English translation
- ✅ Movie title translation with context
- ✅ Actor/Actress name translation
- ✅ Romaji conversion
- ✅ Series name translation

## 📚 Documentation

- [**Quick API Key Setup**](./QUICK_API_KEY_SETUP.md) - 2-minute setup guide
- [**Supabase Secrets Guide**](./SUPABASE_SECRETS_API_KEY_GUIDE.md) - Complete technical documentation
- [**Security Guidelines**](./SECURITY_GUIDELINES.md) - Security best practices
- [**Deployment Guide**](./DEPLOYMENT.md) - Production deployment

## 🛠️ Development

### **Environment Variables (Optional)**
Create `.env.local` for local development:
```bash
VITE_OPENROUTER_API_KEY=sk-or-v1-your-api-key-here
```

### **Supabase Secrets (Recommended)**
- Secure encrypted storage
- Token-based access
- No hardcoded keys in source code

## 🔒 Security

- ✅ No API keys in version control
- ✅ Encrypted storage in Supabase
- ✅ Token-based authentication
- ✅ Environment variable fallback
  