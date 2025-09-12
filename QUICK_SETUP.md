# 🚀 Quick Setup - OpenRouter API Key

## ⚡ Langkah Cepat (2 menit)

### 1. Dapatkan API Key
- Kunjungi: https://openrouter.ai/
- Login/Buat akun
- Generate API key baru
- Copy key yang dimulai dengan `sk-or-v1-`

### 2. Setup Environment Variable
Buat file `.env.local` di root project:

```bash
# .env.local
VITE_OPENROUTER_API_KEY=sk-or-v1-your-actual-api-key-here
```

### 3. Restart Server
```bash
npm run dev
```

## ✅ Selesai!
Sekarang fitur AI translation akan berfungsi dengan baik.

---

## 🔧 Untuk Production (Vercel)

1. Buka Vercel Dashboard
2. Settings → Environment Variables
3. Add: `VITE_OPENROUTER_API_KEY`
4. Value: your-api-key
5. Redeploy

---

## 🆘 Masih Error?

1. **Check file `.env.local`** ada di root project
2. **Restart development server** setelah membuat file
3. **Verify API key format**: harus dimulai dengan `sk-or-v1-`
4. **Check console** untuk error messages

---

## 📚 Dokumentasi Lengkap
Lihat `docs/ENVIRONMENT_SETUP.md` untuk panduan detail.
