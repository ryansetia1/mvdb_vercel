# ⚡ Quick Setup: API Key dengan Supabase Secrets

## 🚀 **Setup Cepat (2 menit)**

### **1. Dapatkan API Key**
- Kunjungi: https://openrouter.ai/
- Login/Buat akun
- Generate API key baru
- Copy key yang dimulai dengan `sk-or-v1-`

### **2. Setup melalui UI**
1. **Login** ke aplikasi
2. **Klik tab "Setup API Key"**
3. **Klik "Check API Key Status"**
4. **Masukkan API key** di form
5. **Klik "Save to Supabase Secrets"**

### **3. Test Translation**
1. **Klik tab "DeepSeek Test"**
2. **Klik "Test Connection"** - harus show "Connected"
3. **Masukkan text Jepang** dan klik "Translate to English"

## ✅ **Selesai!**

Sekarang semua fitur AI translation akan menggunakan secret `mvdb3` secara otomatis.

---

## 🔧 **Untuk Development**

### **Environment Variable (Opsional)**
Buat file `.env.local` di root project:
```bash
VITE_OPENROUTER_API_KEY=sk-or-v1-your-actual-api-key-here
```

### **Restart Server**
```bash
npm run dev
```

---

## 🆘 **Masih Error?**

### **Check Console Logs**
Browser console akan menampilkan:
```
Getting API key with fallback...
Environment variable OPENROUTER_API_KEY: not found
Trying Supabase secrets with accessToken: present
Using Supabase secrets API key
```

### **Common Issues**
1. **"API key tidak dikonfigurasi"** → Check login status
2. **"404 Not Found"** → Endpoint belum di-deploy
3. **"Invalid JWT"** → Token expired, login ulang

---

## 📚 **Dokumentasi Lengkap**
Lihat `docs/SUPABASE_SECRETS_API_KEY_GUIDE.md` untuk panduan detail.

---

**Status**: ✅ **READY TO USE** - Setup API key dengan Supabase secrets!
