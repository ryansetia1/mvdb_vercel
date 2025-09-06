# ⚡ Quick Update Guide - Figma ke Vercel

## 🚀 Method Cepat (5 Menit)

### 1. Backup
```bash
cd /Users/ryansetiawan/Downloads/mvdb_vercel
git add . && git commit -m "Backup" && git push origin main
cd .. && cp -r mvdb_vercel mvdb_vercel_backup
```

### 2. Download Figma
- Download source code dari Figma Make
- Extract ke folder: `mvdb_figma_new`

### 3. Copy Config
```bash
cd mvdb_vercel_backup
cp vercel.json ../mvdb_figma_new/
cp .gitignore ../mvdb_figma_new/
cp package.json ../mvdb_figma_new/
cp vite.config.ts ../mvdb_figma_new/
```

### 4. Replace
```bash
cd ..
rm -rf mvdb_vercel
mv mvdb_figma_new mvdb_vercel
cd mvdb_vercel
```

### 5. Deploy
```bash
npm install
npm run build
git init
git add .
git commit -m "Update dari Figma"
git remote add origin https://github.com/ryansetia1/mvdb_vercel.git
git push -f origin main
```

## ✅ Checklist
- [ ] Backup dibuat
- [ ] File config di-copy
- [ ] Build berhasil
- [ ] Website jalan

## 🆘 Emergency
```bash
# Kembali ke backup
cd /Users/ryansetiawan/Downloads/
rm -rf mvdb_vercel
mv mvdb_vercel_backup mvdb_vercel
cd mvdb_vercel
git push -f origin main
```

**Selesai! 🎉**
