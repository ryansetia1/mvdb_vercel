# 🚀 Panduan Migrasi MVDB ke Project Supabase Baru

## 📋 Ringkasan
Panduan ini akan membantu Anda memindahkan aplikasi MVDB ke project Supabase baru dengan aman dan mudah. Semua data akan tersimpan dan tidak ada yang hilang.

---

## 🎯 Kapan Perlu Migrasi?
- Project Supabase lama akan di-deactivate
- Ingin pindah ke project Supabase baru
- Ingin backup data sebagai cadangan
- Ingin duplikasi aplikasi ke project lain

---

## 🛡️ Langkah-langkah Migrasi (Aman & Mudah)

### **Langkah 1: Backup Data** ⭐ **WAJIB**
1. **Buka aplikasi MVDB** di browser
2. **Login** ke admin panel
3. **Klik tab "Backup & Restore"**
4. **Klik tombol "🚀 Buat Backup Data"**
5. **Tunggu hingga selesai** (akan muncul progress bar)
6. **Klik "📁 Download Backup"** untuk menyimpan file backup
7. **Simpan file backup** di tempat yang aman (contoh: Desktop)

> ⚠️ **PENTING**: Jangan skip langkah ini! Backup adalah jaminan data Anda aman.

### **Langkah 2: Buat Project Supabase Baru**
1. **Buka browser** dan pergi ke [supabase.com](https://supabase.com)
2. **Login** ke akun Supabase Anda
3. **Klik tombol "New Project"** (hijau di kanan atas)
4. **Isi form**:
   - **Organization**: Pilih organization Anda
   - **Project Name**: `mvdb-backup-project` (atau nama lain)
   - **Database Password**: Buat password yang kuat (simpan di tempat aman!)
   - **Region**: Pilih yang terdekat dengan Anda
5. **Klik "Create new project"**
6. **Tunggu hingga selesai** (biasanya 2-3 menit)
7. **Catat Project ID dan Anon Key**:
   - Pergi ke **Settings** → **API**
   - Copy **Project URL** (contoh: `https://abcdefgh.supabase.co`)
   - Copy **anon public** key (panjang, dimulai dengan `eyJ...`)

### **Langkah 3: Setup Database**
1. **Di project Supabase baru**, klik **"SQL Editor"** di sidebar kiri
2. **Klik "New Query"**
3. **Copy-paste script SQL** berikut:

```sql
CREATE TABLE kv_store_cd38bf14 (
  key TEXT NOT NULL PRIMARY KEY,
  value JSONB NOT NULL
);

CREATE INDEX idx_kv_store_key_prefix 
ON kv_store_cd38bf14 USING btree (key);

ALTER TABLE kv_store_cd38bf14 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all operations for authenticated users" 
ON kv_store_cd38bf14 FOR ALL USING (auth.role() = 'authenticated');
```

4. **Klik "Run"** untuk menjalankan script
5. **Pastikan muncul pesan sukses**

### **Langkah 4: Generate Script Migrasi**
1. **Kembali ke aplikasi MVDB**
2. **Di tab "Backup & Restore"**, scroll ke bawah ke bagian **"🚀 Migrasi ke Project Supabase Baru"**
3. **Masukkan informasi**:
   - **Project ID Baru**: Masukkan Project ID dari langkah 2
   - **Anon Key Baru**: Masukkan Anon Key dari langkah 2
4. **Klik "📄 Generate Script Migrasi"**
5. **File script akan otomatis ter-download**

### **Langkah 5: Jalankan Script Migrasi**
1. **Buka terminal/command prompt**:
   - **Windows**: Tekan `Win + R`, ketik `cmd`, tekan Enter
   - **Mac**: Tekan `Cmd + Space`, ketik `Terminal`, tekan Enter
   - **Linux**: Tekan `Ctrl + Alt + T`
2. **Pindah ke folder project**:
   ```bash
   cd "path/ke/folder/project/mvdb"
   ```
3. **Jalankan script migrasi**:
   ```bash
   node migration-script-[PROJECT_ID].js
   ```
4. **Ikuti instruksi** yang muncul di terminal

### **Langkah 6: Deploy Edge Functions** (Opsional)
Jika Anda ingin menggunakan fitur lengkap:

1. **Install Supabase CLI**:
   ```bash
   npm install -g supabase
   ```
2. **Login ke Supabase**:
   ```bash
   supabase login
   ```
3. **Link project**:
   ```bash
   supabase link --project-ref [PROJECT_ID_BARU]
   ```
4. **Deploy functions**:
   ```bash
   supabase functions deploy make-server-e0516fcf
   ```

### **Langkah 7: Restore Data**
1. **Restart aplikasi MVDB** (refresh browser)
2. **Login** ke admin panel
3. **Klik tab "Backup & Restore"**
4. **Di bagian "📤 Restore Data"**:
   - **Klik "📂 Upload File Backup"**
   - **Pilih file backup** yang sudah dibuat di Langkah 1
   - **Klik "🔄 Restore Data"**
5. **Tunggu hingga selesai** (akan muncul progress bar)
6. **Test aplikasi** untuk memastikan data sudah ter-restore

---

## ✅ Verifikasi Migrasi Berhasil

### **Cek Data**
1. **Klik tab "Stats"** di admin panel
2. **Pastikan angka-angka** sama dengan sebelum migrasi:
   - Total Movies
   - Total Master Data
   - Total Favorites
   - dll.

### **Test Fitur**
1. **Buka tab "HC Movies"** - pastikan daftar movie muncul
2. **Buka tab "Actors/Actresses"** - pastikan data aktor/aktris muncul
3. **Buka tab "Master Data"** - pastikan data master muncul
4. **Test search** - pastikan pencarian berfungsi

### **Jika Ada Masalah**
1. **Cek console browser** (F12 → Console) untuk error
2. **Pastikan Project ID dan Anon Key** sudah benar
3. **Pastikan database** sudah dibuat dengan benar
4. **Coba restore data** lagi jika perlu

---

## 🆘 Troubleshooting

### **Error "Connection Failed"**
- **Cek Project ID** - pastikan benar
- **Cek Anon Key** - pastikan benar dan lengkap
- **Cek internet connection**

### **Error "Table Not Found"**
- **Kembali ke Langkah 3** - pastikan script SQL sudah dijalankan
- **Cek di Supabase Dashboard** → Database → Tables

### **Data Tidak Muncul Setelah Restore**
- **Cek file backup** - pastikan tidak kosong
- **Coba restore lagi** dengan file backup yang sama
- **Cek console browser** untuk error

### **Script Migrasi Error**
- **Pastikan Node.js** sudah terinstall
- **Pastikan berada di folder project** yang benar
- **Cek file script** sudah ter-download dengan benar

---

## 📞 Bantuan

### **Jika Masih Bingung**
1. **Baca ulang panduan** dengan teliti
2. **Ikuti langkah demi langkah** tanpa skip
3. **Screenshot error** jika ada untuk dokumentasi
4. **Backup data** sebelum mencoba lagi

### **Tips Sukses**
- ✅ **Selalu backup dulu** sebelum migrasi
- ✅ **Simpan Project ID dan Anon Key** di tempat aman
- ✅ **Test aplikasi** setelah migrasi
- ✅ **Jangan hapus project lama** sampai yakin semuanya berhasil

---

## 🎉 Selamat!

Jika semua langkah di atas berhasil, Anda telah berhasil memigrasi aplikasi MVDB ke project Supabase baru! 

**Data Anda aman dan aplikasi siap digunakan.**

---

*Panduan ini dibuat untuk memudahkan migrasi tanpa perlu pengetahuan teknis yang mendalam. Jika ada pertanyaan, silakan baca ulang panduan atau cek troubleshooting di atas.*
