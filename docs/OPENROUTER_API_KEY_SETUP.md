# Setup OpenRouter API Key

## Status Saat Ini
✅ **API Key Sudah Tersedia**: API key baru telah dibuat dan terintegrasi
- **Key Name**: mvdbKey
- **Status**: Active dan siap digunakan

## Solusi: Mendapatkan API Key Baru

### Langkah 1: Daftar ke OpenRouter
1. Kunjungi https://openrouter.ai/
2. Klik "Sign Up" atau "Get Started"
3. Buat akun dengan email yang valid
4. Verifikasi email jika diperlukan

### Langkah 2: Generate API Key
1. Login ke dashboard OpenRouter
2. Navigasi ke bagian "API Keys" atau "Settings"
3. Klik "Create New API Key" atau "Generate Key"
4. Beri nama untuk API key (contoh: "MVDB Translation Service")
5. Copy API key yang dihasilkan

### Langkah 3: Update Konfigurasi
API key dapat dikonfigurasi dengan dua cara:

#### Opsi A: Environment Variable (Recommended)
1. Buat file `.env` di root project
2. Tambahkan:
```env
VITE_OPENROUTER_API_KEY=your-actual-openrouter-api-key-here
```

#### Opsi B: Update Langsung di Code (NOT RECOMMENDED)
⚠️ **WARNING**: Hardcoding API keys di kode tidak aman dan tidak direkomendasikan untuk production.

1. Buka `src/utils/deepseekTranslationApi.ts`
2. Update konstanta `OPENROUTER_API_KEY`:
```typescript
const OPENROUTER_API_KEY = 'your-actual-api-key-here'
```

**Catatan**: Gunakan environment variable untuk keamanan yang lebih baik.

### Langkah 4: Test Koneksi
1. Restart aplikasi jika menggunakan environment variable
2. Buka Dashboard → Tab "DeepSeek Test"
3. Klik "Test Connection"
4. Pastikan status menunjukkan "Connected"

## Format API Key yang Valid
- Harus dimulai dengan `sk-or-v1-`
- Panjang minimal 50 karakter
- Tidak mengandung spasi atau karakter khusus

## Troubleshooting

### Error 401 "User not found"
- API key tidak valid atau expired
- Pastikan menggunakan API key yang benar
- Cek apakah akun OpenRouter masih aktif

### Error 403 "Forbidden"
- API key tidak memiliki permission untuk model yang diminta
- Pastikan menggunakan model yang tersedia di plan Anda

### Error 429 "Rate limit exceeded"
- Terlalu banyak request dalam waktu singkat
- Tunggu beberapa saat sebelum mencoba lagi

## Model yang Digunakan
- **Model**: `deepseek/deepseek-r1:free`
- **Provider**: DeepSeek melalui OpenRouter
- **Plan**: Free tier - gratis untuk penggunaan dasar

## Fallback Strategy
Jika OpenRouter tidak tersedia, sistem akan otomatis fallback ke:
1. MyMemory API untuk translation
2. Basic character mapping untuk Romaji conversion

---

**Status**: ✅ API key sudah terintegrasi  
**Last Updated**: 2024-12-19  
**API Key**: mvdbKey (Active)
