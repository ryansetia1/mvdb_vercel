# DMM URL Switch Feature

## Overview
Fitur ini menambahkan tombol switch di samping field Cover Image URL pada halaman edit movie untuk memudahkan pengguna beralih antara URL DMM digital dan mono.

## Fitur
- **Deteksi Otomatis**: Tombol switch hanya muncul jika URL cover mengandung pattern DMM (`pics.dmm.co.jp/digital/video/` atau `pics.dmm.co.jp/mono/movie/`)
- **Switch Cepat**: Satu klik untuk beralih antara format digital dan mono
- **Visual Indicator**: Menggunakan ikon `ArrowLeftRight` dari Lucide React
- **Tooltip**: Menampilkan informasi "Switch between DMM digital/mono URLs" saat hover

## Implementasi
### File yang Dimodifikasi
- `src/components/content/movieDetail/MovieEditingForm.tsx`

### Fungsi yang Ditambahkan
1. `isDmmUrl(url: string)`: Mendeteksi apakah URL adalah DMM digital atau mono
2. `switchDmmUrl(currentUrl: string)`: Mengubah antara digital dan mono URL
3. `handleDmmUrlSwitch()`: Handler untuk tombol switch

### UI Changes
- Field Cover Image URL sekarang menggunakan layout flex dengan tombol switch di samping
- Tombol hanya muncul jika URL adalah DMM URL
- Tombol menggunakan variant "outline" dan size "sm" untuk konsistensi

## Contoh Penggunaan
- **Input**: `https://pics.dmm.co.jp/digital/video/*/*pl.jpg`
- **Output**: `https://pics.dmm.co.jp/mono/movie/*/*pl.jpg`

- **Input**: `https://pics.dmm.co.jp/mono/movie/abc123/abc123pl.jpg`
- **Output**: `https://pics.dmm.co.jp/digital/video/abc123/abc123pl.jpg`

## Testing
Fitur telah ditest dengan berbagai skenario:
- ✅ DMM Digital URL dengan wildcard
- ✅ DMM Mono URL dengan wildcard  
- ✅ DMM Digital URL dengan DMCode spesifik
- ✅ Non-DMM URL (tidak terpengaruh)

## Dependencies
- `lucide-react` untuk ikon ArrowLeftRight
- `Button` component dari UI library
