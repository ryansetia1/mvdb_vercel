# Cast Selector Alias Compact Fix

## Masalah yang Diperbaiki
Alias dalam cast selector masih terlalu panjang dan membuat tampilan tidak rapi, bahkan setelah perbaikan sebelumnya. Alias yang banyak membuat list item menjadi sangat tinggi dan sulit dibaca.

## Perbaikan yang Dilakukan

### Sebelum (Masih Panjang)
```tsx
{aliases.length > 0 && (
  <div className="text-xs text-muted-foreground mt-1">
    <span className="font-medium">Alias:</span>
    <div className="flex flex-wrap gap-1 mt-1">
      {aliases.slice(0, 2).map((alias, index) => (
        <span key={index} className="bg-muted px-1.5 py-0.5 rounded text-xs truncate max-w-[120px]">
          {alias}
        </span>
      ))}
      {aliases.length > 2 && (
        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
          +{aliases.length - 2}
        </span>
      )}
    </div>
  </div>
)}
```

### Sesudah (Compact)
```tsx
{aliases.length > 0 && (
  <div className="text-xs text-muted-foreground mt-1">
    <span className="bg-muted px-2 py-1 rounded-full text-xs">
      {aliases.length} alias
    </span>
  </div>
)}
```

## Perubahan Detail

### 1. Menghilangkan Display Alias Individual
- **Sebelum**: Menampilkan 2 alias pertama + indikator jumlah
- **Sesudah**: Hanya menampilkan jumlah alias dalam bentuk badge

### 2. Layout yang Lebih Compact
- **Sebelum**: Multi-line layout dengan flex-wrap
- **Sesudah**: Single-line dengan badge rounded-full

### 3. Visual Indicator yang Lebih Sederhana
- **Sebelum**: Badge individual untuk setiap alias + counter
- **Sesudah**: Satu badge dengan format "{jumlah} alias"

## Hasil Perbaikan
- ✅ **Tampilan lebih compact** - tidak ada lagi alias yang panjang
- ✅ **List item lebih pendek** - setiap item hanya 2 baris maksimal
- ✅ **Loading lebih cepat** - tidak perlu render banyak alias individual
- ✅ **Visual yang lebih clean** - hanya menampilkan informasi yang diperlukan
- ✅ **Scroll performance lebih baik** - item yang lebih pendek = scroll lebih smooth

## Trade-off
- **Kehilangan**: User tidak bisa melihat alias individual langsung
- **Keuntungan**: Tampilan yang jauh lebih rapi dan performa yang lebih baik
- **Solusi**: User masih bisa search berdasarkan alias (search functionality tetap bekerja)

## File Modified
- `src/components/CombinedCastSelector.tsx`

## Impact
Cast selector sekarang memiliki tampilan yang sangat compact dan tidak lagi terlihat "panjang sekali" seperti sebelumnya.
