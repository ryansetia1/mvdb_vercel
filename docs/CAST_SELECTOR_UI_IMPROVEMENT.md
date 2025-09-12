# Cast Selector UI Improvement

## Masalah yang Diperbaiki
Cast selector di SC Movie form memiliki tampilan yang tidak enak dilihat dengan masalah:
- List terlalu padat dengan alias yang panjang dalam satu baris
- Tidak ada batasan tinggi untuk popover
- Alias ditampilkan dalam format yang sulit dibaca
- Layout tidak optimal untuk data banyak

## Perbaikan yang Dilakukan

### 1. Popover Container
- **Sebelum**: Popover tanpa batasan tinggi
- **Sesudah**: Menambahkan `max-h-[400px] overflow-hidden` untuk membatasi tinggi popover

### 2. List Items Layout
- **Sebelum**: Layout sederhana dengan alias dalam satu baris panjang
- **Sesudah**: 
  - Layout yang lebih rapi dengan padding yang konsisten
  - Alias ditampilkan dalam bentuk badge/chip yang terpisah
  - Hanya menampilkan maksimal 3 alias pertama dengan indikator "+X more"
  - Menambahkan `flex-shrink-0` untuk ikon agar tidak terdistorsi

### 3. Alias Display
- **Sebelum**: `alias: alias1, alias2, alias3, ...` dalam satu baris
- **Sesudah**: 
  - Alias ditampilkan dalam badge terpisah dengan background muted
  - Layout flex-wrap untuk alias yang banyak
  - Indikator "+X more" untuk alias yang tidak ditampilkan

### 4. Scrolling Performance
- **Sebelum**: Tidak ada virtual scrolling
- **Sesudah**: 
  - Menambahkan `max-h-[200px] overflow-y-auto` untuk setiap group
  - Membatasi tinggi list aktris dan aktor secara terpisah

### 5. Selected Items Display
- **Sebelum**: Badge sederhana tanpa informasi jumlah
- **Sesudah**: 
  - Menambahkan header dengan jumlah cast yang dipilih
  - Badge yang lebih besar dengan padding yang konsisten
  - Truncate untuk nama yang panjang dengan `max-w-[200px]`

## Detail Perubahan

### PopoverContent
```tsx
// Sebelum
<PopoverContent className="w-full p-0">

// Sesudah  
<PopoverContent className="w-full p-0 max-h-[400px] overflow-hidden">
```

### CommandItem Layout
```tsx
// Sebelum
<CommandItem>
  <Check className="mr-2 h-4 w-4" />
  <UserIcon className="mr-2 h-4 w-4 text-pink-500" />
  <div className="flex flex-col">
    <span>{displayName}</span>
    <span className="text-xs text-muted-foreground">
      alias: {aliases.join(', ')}
    </span>
  </div>
</CommandItem>

// Sesudah
<CommandItem className="px-3 py-2 cursor-pointer hover:bg-accent">
  <Check className="mr-3 h-4 w-4" />
  <UserIcon className="mr-3 h-4 w-4 text-pink-500 flex-shrink-0" />
  <div className="flex flex-col min-w-0 flex-1">
    <span className="font-medium truncate">{displayName}</span>
    {aliases.length > 0 && (
      <div className="text-xs text-muted-foreground mt-1">
        <span className="font-medium">Alias:</span>
        <div className="flex flex-wrap gap-1 mt-1">
          {aliases.slice(0, 3).map((alias, index) => (
            <span key={index} className="bg-muted px-1.5 py-0.5 rounded text-xs">
              {alias}
            </span>
          ))}
          {aliases.length > 3 && (
            <span className="text-xs text-muted-foreground">
              +{aliases.length - 3} more
            </span>
          )}
        </div>
      </div>
    )}
  </div>
</CommandItem>
```

### Scrolling Container
```tsx
// Menambahkan scrolling untuk setiap group
<CommandGroup heading="Aktris">
  <div className="max-h-[200px] overflow-y-auto">
    {/* actress items */}
  </div>
</CommandGroup>
```

## Hasil Perbaikan
- ✅ Tampilan lebih rapi dan mudah dibaca
- ✅ Alias ditampilkan dalam format yang lebih baik
- ✅ Performa scrolling yang lebih baik dengan batasan tinggi
- ✅ Layout yang responsif dan tidak overflow
- ✅ Selected items dengan informasi yang lebih jelas
- ✅ Visual hierarchy yang lebih baik dengan typography yang konsisten

## File Modified
- `src/components/CombinedCastSelector.tsx`

## Impact
Cast selector sekarang memiliki tampilan yang jauh lebih baik dan user-friendly untuk SC Movie form.
