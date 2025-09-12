# Environment Variables Setup

## Overview
Untuk keamanan, semua API keys dan konfigurasi sensitif harus disimpan sebagai environment variables, bukan hardcoded di dalam kode.

## Required Environment Variables

### OpenRouter API Key
```bash
VITE_OPENROUTER_API_KEY=your_openrouter_api_key_here
```

**Cara mendapatkan API key:**
1. Kunjungi https://openrouter.ai/
2. Buat akun atau login
3. Generate API key baru
4. Copy API key yang dimulai dengan `sk-or-v1-`

### Supabase Configuration
```bash
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## Setup Instructions

### 1. Create Environment File
Buat file `.env.local` di root project:

```bash
# .env.local
VITE_OPENROUTER_API_KEY=sk-or-v1-your-actual-api-key-here
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here
```

### 2. Add to .gitignore
Pastikan file `.env.local` sudah ada di `.gitignore`:

```gitignore
# Environment variables
.env
.env.local
.env.production
.env.staging
```

### 3. Development Setup
Untuk development lokal:

```bash
# Copy example file
cp .env.example .env.local

# Edit dengan API keys yang sebenarnya
nano .env.local
```

### 4. Production Setup
Untuk production (Vercel):

1. Buka Vercel Dashboard
2. Pilih project
3. Go to Settings > Environment Variables
4. Add variables:
   - `VITE_OPENROUTER_API_KEY`: your-actual-api-key
   - `VITE_SUPABASE_URL`: your-supabase-url
   - `VITE_SUPABASE_ANON_KEY`: your-supabase-anon-key

## Security Best Practices

### ✅ Do's
- Gunakan environment variables untuk semua API keys
- Simpan `.env.local` di `.gitignore`
- Rotate API keys secara berkala
- Gunakan different keys untuk development dan production
- Monitor API usage untuk detect unauthorized access

### ❌ Don'ts
- Jangan hardcode API keys di kode
- Jangan commit `.env` files ke repository
- Jangan share API keys di chat atau email
- Jangan gunakan production keys untuk development
- Jangan expose API keys di client-side code

## Troubleshooting

### API Key Not Working
1. Check if environment variable is loaded:
   ```javascript
   console.log('API Key loaded:', !!import.meta.env.VITE_OPENROUTER_API_KEY)
   ```

2. Verify API key format:
   - Should start with `sk-or-v1-`
   - Should be at least 50 characters long

3. Check network requests in browser dev tools

### Environment Variables Not Loading
1. Restart development server after adding new variables
2. Check file name is exactly `.env.local`
3. Verify variables start with `VITE_` prefix
4. Check for typos in variable names

## API Key Rotation

Jika API key terpapar atau compromised:

1. **Immediate Actions:**
   - Revoke compromised key di OpenRouter dashboard
   - Generate new API key
   - Update environment variables
   - Redeploy application

2. **Prevention:**
   - Review git history untuk detect exposure
   - Implement proper secrets management
   - Use different keys per environment
   - Monitor API usage regularly

## Support

Jika mengalami masalah dengan setup environment variables:
1. Check documentation di https://vitejs.dev/guide/env-and-mode.html
2. Verify OpenRouter API documentation
3. Check Supabase environment variables guide
