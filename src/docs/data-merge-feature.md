# Fitur Melengkapi Data Movie

## Deskripsi
Fitur ini memungkinkan user untuk melengkapi data movie yang sudah ada di database ketika melakukan parsing movie dengan kode yang sama. Alih-alih hanya memiliki opsi "Cancel" dan "Continue Anyway", user sekarang dapat memilih untuk melengkapi data yang sudah ada dengan informasi baru dari parsing.

## Komponen yang Ditambahkan

### 1. DataMergeSelector.tsx
Komponen untuk membandingkan data existing vs parsed dan memilih field mana yang akan diupdate.

**Fitur:**
- Menampilkan perbandingan side-by-side antara data existing dan data baru
- Checkbox untuk memilih field yang ingin diupdate
- Tombol "Pilih Semua" dan "Batal Pilih"
- Validasi untuk memastikan ada field yang dipilih

### 2. Enhanced DuplicateMovieWarning.tsx
Diperbarui untuk menambahkan opsi "Lengkapi Data" selain opsi yang sudah ada.

**Perubahan:**
- Menambahkan prop `onMerge`
- Menambahkan tombol "Lengkapi Data" dengan styling yang berbeda
- Mengubah teks menjadi bahasa Indonesia

## API Endpoints

### PUT /make-server-e0516fcf/movies/:id/merge
Endpoint untuk merge data movie dengan field yang dipilih.

**Request Body:**
```json
{
  "parsedData": {
    "titleEn": "New Title",
    "director": "New Director",
    "actresses": ["Actress 1", "Actress 2"],
    // ... field lainnya
  },
  "selectedFields": ["titleEn", "director", "actress"]
}
```

**Response:**
```json
{
  "success": true,
  "movie": { /* updated movie object */ },
  "message": "Successfully merged 3 fields"
}
```

## Utility Functions

### mergeMovieData() di movieDataParser.ts
Fungsi untuk merge data parsed dengan data existing berdasarkan field yang dipilih.

**Fitur:**
- Menggabungkan data actresses dan actors (menghindari duplikasi)
- Mengupdate field yang dipilih dengan data baru
- Mempertahankan data existing untuk field yang tidak dipilih

### mergeMovieApi() di movieMergeApi.ts
API utility untuk memanggil endpoint merge movie.

## Flow Penggunaan

1. User melakukan parsing movie data
2. Sistem mendeteksi duplicate movie code
3. DuplicateMovieWarning muncul dengan 3 opsi:
   - **Batal**: Membatalkan parsing
   - **Lengkapi Data**: Kembali ke form parsing dengan mode merge
   - **Tambah Baru**: Melanjutkan dengan movie baru
4. Jika memilih "Lengkapi Data":
   - Dialog tutup dan kembali ke form parsing
   - Indikator "Mode Melengkapi Data" muncul di atas form
   - User dapat memilih aktris/aktor dari data yang sudah ada
   - User dapat melakukan pengecekan dan konfirmasi match
   - Saat klik "Save Movie", data akan di-merge dengan movie existing

## Field yang Dapat Dilengkapi

- `titleEn` - Judul Inggris
- `releaseDate` - Tanggal Rilis
- `duration` - Durasi
- `director` - Sutradara
- `studio` - Studio
- `series` - Series
- `actress` - Aktris (digabung dengan yang sudah ada)
- `actors` - Aktor (digabung dengan yang sudah ada)

## Catatan Penting

- Untuk field `actress` dan `actors`, data baru akan digabung dengan data existing (tidak mengganti)
- Duplikasi nama akan dihindari secara otomatis
- Timestamp `updatedAt` akan diupdate otomatis
- User dapat memilih beberapa field sekaligus untuk diupdate
