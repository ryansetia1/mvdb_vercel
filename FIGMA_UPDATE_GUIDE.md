# 📋 Panduan Update dari Figma Make ke Vercel

## 🎯 Overview
Dokumentasi ini menjelaskan cara update proyek Vercel dengan source code baru dari Figma Make, tanpa kehilangan konfigurasi yang sudah ada.

---

## ⚠️ PENTING - Baca Dulu!

**JANGAN langsung replace folder `src`!** Ini akan merusak:
- Konfigurasi Vercel yang sudah ada
- Dependencies yang sudah diinstall
- Git history
- File konfigurasi penting

---

## 🚀 Method 1: Safe Replace (Recommended untuk Pemula)

### Step 1: Backup Proyek Saat Ini
```bash
# Masuk ke folder proyek
cd /Users/ryansetiawan/Downloads/mvdb_vercel

# Backup semua perubahan
git add .
git commit -m "Backup sebelum update Figma"
git push origin main

# Buat backup lokal
cd ..
cp -r mvdb_vercel mvdb_vercel_backup
```

### Step 2: Download Source Code dari Figma Make
1. Buka Figma Make
2. Export/Download source code
3. Extract ke folder baru: `mvdb_figma_new`

### Step 3: Copy File Konfigurasi Penting
**Copy file-file ini dari proyek lama ke folder Figma baru:**

```bash
# Masuk ke folder backup
cd mvdb_vercel_backup

# Copy file konfigurasi penting
cp vercel.json ../mvdb_figma_new/
cp .gitignore ../mvdb_figma_new/
cp DEPLOYMENT.md ../mvdb_figma_new/
cp package.json ../mvdb_figma_new/
cp vite.config.ts ../mvdb_figma_new/
```

### Step 4: Replace Folder Proyek
```bash
# Kembali ke parent directory
cd ..

# Hapus folder lama
rm -rf mvdb_vercel

# Rename folder Figma baru
mv mvdb_figma_new mvdb_vercel

# Masuk ke folder baru
cd mvdb_vercel
```

### Step 5: Install Dependencies
```bash
# Install dependencies
npm install

# Test build
npm run build
```

### Step 6: Deploy ke Vercel
```bash
# Inisialisasi Git (jika belum)
git init

# Tambahkan semua file
git add .

# Commit perubahan
git commit -m "Update dari Figma Make - replace dengan versi baru"

# Hubungkan dengan GitHub
git remote add origin https://github.com/ryansetia1/mvdb_vercel.git

# Push ke GitHub (force push karena replace total)
git push -f origin main
```

### Step 7: Verifikasi
1. Buka Vercel Dashboard
2. Tunggu build selesai (1-2 menit)
3. Buka website: `https://mvdb-vercel.vercel.app`
4. Test semua fitur

---

## 🔄 Method 2: Git Merge (Advanced)

### Step 1: Buat Branch Baru
```bash
cd /Users/ryansetiawan/Downloads/mvdb_vercel

# Buat branch baru untuk Figma update
git checkout -b figma-update
```

### Step 2: Copy File dari Figma
```bash
# Copy semua file dari Figma ke folder proyek
# (Overwrite file yang ada)
```

### Step 3: Review Perubahan
```bash
# Cek apa yang berubah
git status

# Lihat detail perubahan
git diff

# Cek file yang akan di-commit
git diff --cached
```

### Step 4: Commit Perubahan
```bash
# Tambahkan semua perubahan
git add .

# Commit dengan pesan yang jelas
git commit -m "Update dari Figma Make - [deskripsi perubahan]"

# Push ke branch baru
git push origin figma-update
```

### Step 5: Merge ke Main
1. Buka GitHub repository
2. Klik "Compare & pull request"
3. Review perubahan
4. Klik "Merge pull request"
5. Delete branch `figma-update`

---

## 📁 File yang WAJIB Di-copy dari Proyek Lama

### ✅ File Konfigurasi (JANGAN di-overwrite)
```
vercel.json          # Konfigurasi Vercel
.gitignore           # File yang diabaikan Git
DEPLOYMENT.md        # Dokumentasi deployment
package.json         # Dependencies (jika tidak ada perubahan)
vite.config.ts       # Konfigurasi Vite (jika tidak ada perubahan)
```

### ✅ File yang BISA Di-overwrite
```
src/                 # Source code (biasanya di-overwrite)
public/              # File public
index.html           # HTML utama
```

### ❌ File yang JANGAN Di-copy
```
node_modules/        # Dependencies (akan di-install ulang)
build/               # Build output (akan di-generate ulang)
.git/                # Git history (sudah ada)
```

---

## 🛠️ Troubleshooting

### Error: "Module not found"
```bash
# Install dependencies
npm install

# Clear cache
npm cache clean --force

# Reinstall
rm -rf node_modules package-lock.json
npm install
```

### Error: "Build failed"
```bash
# Cek error di build log
npm run build

# Fix error yang muncul
# Biasanya masalah dependencies atau syntax
```

### Error: "Git push failed"
```bash
# Force push (hati-hati!)
git push -f origin main

# Atau pull dulu
git pull origin main
git push origin main
```

### Website Blank Screen
1. Cek console browser (F12)
2. Cek build logs di Vercel
3. Pastikan semua dependencies ter-install
4. Cek konfigurasi `vercel.json`

---

## 📋 Checklist Update

### Sebelum Update
- [ ] Backup proyek saat ini
- [ ] Test website masih jalan
- [ ] Download source code Figma
- [ ] Siapkan folder backup

### Saat Update
- [ ] Copy file konfigurasi penting
- [ ] Install dependencies
- [ ] Test build lokal
- [ ] Commit dan push ke GitHub

### Setelah Update
- [ ] Cek build di Vercel
- [ ] Test website di browser
- [ ] Test semua fitur
- [ ] Hapus folder backup (jika sudah yakin)

---

## 🎯 Tips & Best Practices

### 1. Selalu Backup
```bash
# Buat backup sebelum update
git add .
git commit -m "Backup sebelum update"
git push origin main
```

### 2. Test Lokal Dulu
```bash
# Test build sebelum deploy
npm run build
npm run preview
```

### 3. Pesan Commit yang Jelas
```bash
# Contoh pesan commit yang baik
git commit -m "Update dari Figma - tambah komponen header baru"
git commit -m "Update dari Figma - fix layout responsive"
git commit -m "Update dari Figma - tambah fitur search"
```

### 4. Monitor Build Logs
- Selalu cek build logs di Vercel
- Fix error segera jika ada
- Jangan deploy jika build gagal

### 5. Keep Backup
- Simpan folder backup sampai yakin semuanya jalan
- Minimal 1 minggu setelah update

---

## 🆘 Emergency Recovery

### Jika Update Gagal Total
```bash
# Kembali ke backup
cd /Users/ryansetiawan/Downloads/
rm -rf mvdb_vercel
mv mvdb_vercel_backup mvdb_vercel

# Deploy ulang
cd mvdb_vercel
git push -f origin main
```

### Jika Git History Rusak
```bash
# Reset ke commit terakhir yang baik
git log --oneline
git reset --hard [commit-hash]
git push -f origin main
```

---

## 📞 Support

Jika mengalami masalah:
1. Cek error di console browser
2. Cek build logs di Vercel
3. Cek file `FIGMA_UPDATE_GUIDE.md` ini
4. Pastikan semua step diikuti dengan benar

**Happy Coding! 🚀**
