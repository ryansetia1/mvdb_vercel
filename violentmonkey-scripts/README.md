# ViolentMonkey Scripts untuk MVDB

Koleksi script ViolentMonkey untuk meningkatkan workflow dengan MVDB dan JavDB.

## Scripts yang Tersedia

### 1. JavDB Gender Fix V2 (`javdb-gender-fix-v2.user.js`)
Script untuk mengekstrak data film dari halaman detail JavDB dengan deteksi gender aktor yang benar.

**Fitur:**
- Ekstrak data lengkap film (judul, kode, tanggal rilis, durasi, sutradara, studio, series, aktor, tags)
- Deteksi gender aktor dengan simbol ♀/♂ yang benar
- Format output kompatibel dengan parser MVDB
- Copy otomatis ke clipboard

**Cara Penggunaan:**
1. Install script di ViolentMonkey
2. Buka halaman detail film di JavDB (format: `https://javdb.com/v/[kode]`)
3. Klik tombol "🔧 MVDB COPIER" yang muncul di pojok kanan atas
4. Data akan otomatis ter-copy ke clipboard

### 2. JavDB Movie Code Auto Search (`javdb-movie-code-search.user.js`) - v1.7
Script untuk mendeteksi movie code dari clipboard MVDB dan melakukan search otomatis di JavDB.

**Fitur:**
- Deteksi otomatis movie code format `xxxxx-1234` dari clipboard
- Tombol search muncul hanya ketika movie code terdeteksi
- Search otomatis dengan paste dan klik search
- Bekerja di homepage atau halaman manapun selama search bar terlihat
- Monitoring clipboard real-time dengan fallback paste event
- Error handling yang robust untuk berbagai skenario
- Kompatibilitas dengan mobile navigation JavDB
- Selector yang dioptimalkan berdasarkan struktur HTML JavDB yang sebenarnya
- **Sistem dual button**: Tombol search di halaman umum, tombol copy di halaman detail movie
- **Auto-detection**: Otomatis ganti tombol berdasarkan jenis halaman
- **Ekstraksi data lengkap**: Copy data movie lengkap untuk MVDB parser
- **Smart positioning**: Tombol copy di posisi yang berbeda untuk menghindari overlap
- **Real-time update**: Tombol search selalu menggunakan movie code terbaru dari clipboard
- **Dual button di detail**: Di halaman detail movie, kedua tombol (copy + search) bisa muncul bersamaan
- **Simplified logic**: Logika tombol yang lebih sederhana dan konsisten
- **Better state management**: State management yang lebih robust untuk clipboard content
- **Robust search execution**: Search bar update yang lebih reliable dengan verification dan retry
- **Keyboard simulation**: Fallback mechanism menggunakan keyboard simulation

**Cara Penggunaan:**

**Untuk Search:**
1. Copy movie code dari MVDB app (format: `xxxxx-1234`)
2. Buka JavDB.com (homepage atau halaman manapun)
3. Tombol "🔍 Search [movie-code]" akan muncul otomatis di pojok kanan atas
4. Klik tombol untuk melakukan search otomatis

**Untuk Copy Data Movie:**
1. Masuk ke halaman detail movie di JavDB (format: `https://javdb.com/v/[kode]`)
2. Tombol "📋 MVDB COPIER" akan muncul otomatis di pojok kanan atas
3. Klik tombol untuk copy data movie lengkap ke clipboard
4. Paste data ke MVDB app untuk import

**Format Movie Code yang Didukung:**
- `SSIS-001`
- `MIDE-1234`
- `ABP-123`
- `PPPD-999`
- Dan format lainnya dengan pola: `[2-6 huruf]-[3-4 angka]`

## Instalasi

1. Install ViolentMonkey extension di browser
2. Download script yang diinginkan
3. Buka ViolentMonkey dashboard
4. Klik "Create a new script"
5. Copy-paste konten script
6. Save script
7. Script akan otomatis aktif di domain yang sesuai

## Troubleshooting

### Script tidak muncul
- Pastikan ViolentMonkey extension aktif
- Refresh halaman JavDB
- Check console browser untuk error messages

### Movie code tidak terdeteksi
- Pastikan format movie code sesuai: `xxxxx-1234`
- Pastikan movie code sudah ter-copy ke clipboard
- Coba copy ulang movie code dari MVDB
- Jika clipboard monitoring tidak bekerja, coba paste movie code langsung di halaman JavDB

### Search tidak berfungsi
- Pastikan berada di halaman JavDB yang memiliki search bar
- Refresh halaman dan coba lagi
- Check apakah search bar terlihat di halaman
- Script akan mencoba berbagai cara untuk melakukan search (click button, submit form)

### Error "NotAllowedError" atau "Document is not focused"
- Error ini sudah diperbaiki di v1.1
- Script akan otomatis skip clipboard check jika document tidak dalam focus
- Gunakan paste event sebagai alternatif monitoring

## Catatan Teknis

- Script menggunakan `GM_getClipboard` dan `GM_setClipboard` untuk akses clipboard
- Monitoring clipboard dilakukan setiap 1000ms untuk performa optimal (diperbaiki di v1.1)
- Script otomatis berhenti monitoring ketika tab tidak aktif
- Kompatibel dengan ViolentMonkey dan browser modern
- Fallback paste event listener untuk kompatibilitas yang lebih baik
- Multiple event triggers untuk memastikan search berfungsi di berbagai skenario

## Support

Jika mengalami masalah atau membutuhkan fitur tambahan, silakan buat issue di repository atau hubungi tim development.