# Image Search Iframe Feature

## Deskripsi
Fitur ini menambahkan iframe pencarian gambar pada dialog edit actress/actor/director untuk memudahkan user mencari dan mengcopy link gambar.

## Komponen yang Ditambahkan

### 1. ImageSearchIframe.tsx
Komponen utama yang berisi iframe untuk pencarian gambar dengan fitur:
- Multiple search engines (Google Images, Bing, DuckDuckGo, Yandex)
- Quick action buttons untuk auto-fill search query
- Copy to clipboard functionality
- Responsive design dengan tabs

### 2. Integrasi ke ActorForm.tsx
- Tombol toggle "Cari Gambar" di bagian Foto Profil
- Auto-fill URL gambar ke field pertama yang kosong
- Support untuk multiple profile pictures

### 3. Integrasi ke MasterDataForm.tsx
- Tombol toggle "Cari Gambar" di bagian Link Foto Profile
- Support untuk actress, actor, dan director
- Auto-fill URL gambar ke field profilePicture

## Cara Penggunaan

1. **Buka dialog edit** actress/actor/director
2. **Klik tombol "Cari Gambar"** di bagian Foto Profil
3. **Masukkan kata kunci** pencarian atau gunakan quick action buttons
4. **Klik "Cari"** untuk membuka iframe pencarian
5. **Pilih tab search engine** yang diinginkan (Google, Bing, DuckDuckGo, Yandex)
6. **Klik kanan pada gambar** → "Copy image address" atau "Salin alamat gambar"
7. **Paste URL** ke field foto profil atau klik tombol copy di iframe

## Fitur Quick Actions
- **Gunakan Nama**: Auto-fill dengan nama lengkap
- **Nama + Nama Jepang**: Auto-fill dengan nama + nama Jepang
- **Nama + Type**: Auto-fill dengan nama + actress/actor/director

## Search Engines yang Didukung
1. **Google Images** - Pencarian gambar Google dengan hasil yang luas
2. **Bing Images** - Pencarian gambar Microsoft Bing
3. **DuckDuckGo Images** - Pencarian gambar privacy-focused
4. **Yandex Images** - Pencarian gambar Yandex (bagus untuk konten Asia)

## Technical Details
- Menggunakan iframe dengan sandbox untuk keamanan
- Responsive design dengan grid layout
- Toast notifications untuk feedback user
- Auto-fill functionality untuk kemudahan penggunaan
- Support untuk multiple profile pictures

## File yang Dimodifikasi
- `src/components/ImageSearchIframe.tsx` (baru)
- `src/components/ActorForm.tsx` (dimodifikasi)
- `src/components/MasterDataForm.tsx` (dimodifikasi)

## Dependencies
- React hooks (useState)
- Lucide React icons
- Sonner untuk toast notifications
- UI components (Button, Input, Card, Tabs, dll)
