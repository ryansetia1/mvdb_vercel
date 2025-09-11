# Panduan Deployment ke Vercel

## Persiapan Proyek

Proyek ini sudah dikonfigurasi untuk deployment di Vercel dengan konfigurasi berikut:

### File Konfigurasi
- `vercel.json` - Konfigurasi deployment Vercel
- `.gitignore` - File yang diabaikan oleh Git
- `package.json` - Script build yang sudah dikonfigurasi

### Build Configuration
- **Build Command**: `npm run build`
- **Output Directory**: `build`
- **Framework**: React + Vite

## Langkah-langkah Deployment

### 1. Push ke GitHub
```bash
# Inisialisasi Git repository (jika belum)
git init

# Tambahkan semua file
git add .

# Commit perubahan
git commit -m "Initial commit - ready for Vercel deployment"

# Tambahkan remote repository GitHub
git remote add origin https://github.com/USERNAME/REPOSITORY_NAME.git

# Push ke GitHub
git push -u origin main
```

### 2. Deploy ke Vercel

#### Opsi A: Melalui Vercel Dashboard
1. Buka [vercel.com](https://vercel.com)
2. Login dengan akun GitHub
3. Klik "New Project"
4. Import repository GitHub yang sudah dibuat
5. Vercel akan otomatis mendeteksi konfigurasi:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
6. Klik "Deploy"

#### Opsi B: Menggunakan Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login ke Vercel
vercel login

# Deploy dari direktori proyek
vercel

# Untuk production deployment
vercel --prod
```

### 3. Environment Variables (jika diperlukan)

Jika aplikasi menggunakan environment variables:

1. Di Vercel Dashboard, pilih proyek
2. Pergi ke Settings > Environment Variables
3. Tambahkan variable yang diperlukan:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - dll.

### 4. Custom Domain (Opsional)

1. Di Vercel Dashboard, pilih proyek
2. Pergi ke Settings > Domains
3. Tambahkan domain custom
4. Ikuti instruksi untuk mengonfigurasi DNS

## Verifikasi Deployment

Setelah deployment selesai:

1. Cek URL yang diberikan Vercel
2. Pastikan semua fitur berfungsi dengan baik
3. Test responsive design di berbagai device
4. Cek console browser untuk error

## Troubleshooting

### Build Error
- Pastikan semua dependencies terinstall: `npm install`
- Cek error di Vercel build logs
- Pastikan Node.js version compatible

### Runtime Error
- Cek environment variables
- Pastikan semua API endpoints accessible
- Cek CORS configuration

### Performance
- Optimize images dan assets
- Enable compression di Vercel
- Gunakan CDN untuk static assets

## Support

Jika mengalami masalah:
1. Cek [Vercel Documentation](https://vercel.com/docs)
2. Cek build logs di Vercel Dashboard
3. Pastikan konfigurasi sesuai dengan dokumentasi
