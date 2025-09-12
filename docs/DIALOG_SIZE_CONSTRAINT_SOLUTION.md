# Dialog Size Constraint Solution Guide

## Overview
Dokumentasi ini berisi solusi lengkap untuk mengatasi masalah constraint ukuran dialog yang terlalu kecil, khususnya ketika menggunakan Radix UI Dialog component.

## Problem Description
- Dialog terlalu kecil dan sempit
- Tinggi sudah benar tapi lebar masih terbatas
- Ada constraint yang membatasi ukuran dialog
- CSS `!important` dan override tidak efektif

## Root Cause Analysis

### 1. Radix UI Dialog Constraint
```typescript
// Di src/components/ui/dialog.tsx
className={cn(
  "bg-background ... max-w-[calc(100%-2rem)] ...",
  className,
)}
```

### 2. CSS Global Constraints
```css
/* Di src/index.css */
.max-w-\[calc\(100\%-2rem\)\] {
  max-width: calc(100% - 2rem);
}
```

### 3. Tailwind CSS Limitations
- `max-w-[95vw]` tidak cukup untuk override constraint bawaan
- `!important` di className tidak selalu efektif
- CSS specificity issues

## Solution Approaches (Progressive)

### Approach 1: CSS Override (Limited Success)
```typescript
<DialogContent 
  className="!max-w-[95vw] !max-h-[95vh] !w-[95vw] !h-[95vh] p-0"
  style={{ 
    maxWidth: '95vw !important',
    width: '95vw !important',
    maxHeight: '95vh !important',
    height: '95vh !important'
  }}
  data-custom-dialog="true"
>
```

```css
/* Di globals.css */
[data-radix-dialog-content][data-custom-dialog="true"] {
  max-width: none !important;
  width: 95vw !important;
  max-height: 95vh !important;
  height: 95vh !important;
}
```

**Result**: Masih terbatas, constraint tetap ada.

### Approach 2: Complete Rebuild (Recommended Solution)
```typescript
// Ganti Radix UI Dialog dengan custom modal
{isOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div 
      className="bg-white dark:bg-gray-900 rounded-lg shadow-xl border w-[98vw] h-[95vh] flex flex-col"
      style={{
        maxWidth: '98vw',
        maxHeight: '95vh',
        width: '98vw',
        height: '95vh'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-2">
          <ExternalLink className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleOpenInNewTab}>
            <ExternalLink className="h-4 w-4" />
            <span className="hidden sm:inline">Buka di Tab Baru</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4" />
            <span className="hidden sm:inline">Tutup</span>
          </Button>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <iframe
          src={url}
          className="w-full h-full border-0"
          title={`Content - ${title}`}
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation allow-downloads"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      </div>
      
      {/* Footer */}
      <div className="p-3 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
        💡 <strong>Tips:</strong> Klik tombol "Buka di Tab Baru" untuk membuka di tab baru, atau gunakan tombol "Tutup" untuk menutup dialog ini.
      </div>
    </div>
  </div>
)}
```

## Implementation Steps

### Step 1: Identify the Problem
- Dialog terlalu kecil meskipun sudah set `max-w-[95vw]`
- Constraint dari Radix UI atau library lain
- CSS override tidak efektif

### Step 2: Try CSS Override First
```typescript
// Coba dulu dengan CSS override
<DialogContent 
  className="!max-w-none !max-h-[95vh] !w-[95vw] !h-[95vh] p-0"
  style={{ 
    maxWidth: 'none !important',
    width: '95vw !important',
    maxHeight: '95vh !important',
    height: '95vh !important'
  }}
  data-custom-dialog="true"
>
```

### Step 3: Add Global CSS Override
```css
/* Di globals.css */
[data-radix-dialog-content][data-custom-dialog="true"] {
  max-width: none !important;
  width: 95vw !important;
  max-height: 95vh !important;
  height: 95vh !important;
}
```

### Step 4: If Still Not Working, Rebuild with Custom Modal
- Ganti `<Dialog>` dengan custom `<div>` modal
- Gunakan `fixed inset-0 z-50` untuk positioning
- Set ukuran langsung dengan `w-[98vw] h-[95vh]`
- Tambahkan `style` inline untuk kontrol penuh

## Best Practices

### 1. Layout Structure
```typescript
<div className="flex flex-col h-full">
  {/* Header - flex-shrink-0 */}
  <div className="flex-shrink-0">...</div>
  
  {/* Content - flex-1 overflow-hidden */}
  <div className="flex-1 overflow-hidden">...</div>
  
  {/* Footer - flex-shrink-0 */}
  <div className="flex-shrink-0">...</div>
</div>
```

### 2. Responsive Design
```typescript
// Tombol text tersembunyi di mobile
<span className="hidden sm:inline">Buka di Tab Baru</span>
```

### 3. Dark Mode Support
```typescript
className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700"
```

### 4. Accessibility
```typescript
// Tambahkan title dan aria-label
<Button title="Buka di tab baru" aria-label="Buka link di tab baru">
  <ExternalLink className="h-4 w-4" />
</Button>
```

## When to Use Each Approach

### Use CSS Override When:
- Dialog hanya perlu sedikit diperbesar
- Constraint tidak terlalu ketat
- Ingin tetap menggunakan library dialog

### Use Custom Modal When:
- Dialog perlu ukuran yang sangat besar (90%+ viewport)
- Constraint sangat ketat dan sulit di-override
- Perlu kontrol penuh atas styling dan behavior
- Ingin design yang sangat custom

## Common Issues and Solutions

### Issue 1: Dialog masih kecil meskipun sudah set max-width
**Solution**: Coba `max-w-none` dan gunakan `style` inline

### Issue 2: CSS override tidak bekerja
**Solution**: Tambahkan `!important` dan data attribute untuk specificity

### Issue 3: Dialog tidak responsive
**Solution**: Gunakan viewport units (`vw`, `vh`) dan responsive classes

### Issue 4: Dark mode tidak bekerja
**Solution**: Tambahkan `dark:` classes untuk semua elemen

## Example: Complete Custom Modal Component

```typescript
interface CustomModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  url: string
  children?: React.ReactNode
}

export function CustomModal({ isOpen, onClose, title, url, children }: CustomModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div 
        className="bg-white dark:bg-gray-900 rounded-lg shadow-xl border w-[98vw] h-[95vh] flex flex-col"
        style={{
          maxWidth: '98vw',
          maxHeight: '95vh',
          width: '98vw',
          height: '95vh'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
            <span className="hidden sm:inline ml-1">Tutup</span>
          </Button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {children || (
            <iframe
              src={url}
              className="w-full h-full border-0"
              title={`Content - ${title}`}
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation allow-downloads"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          )}
        </div>
      </div>
    </div>
  )
}
```

## Conclusion

Ketika menghadapi masalah dialog yang terlalu kecil dan constraint yang sulit di-override:

1. **Coba CSS override dulu** dengan `!important` dan data attributes
2. **Jika tidak berhasil, rebuild dengan custom modal** menggunakan `<div>` biasa
3. **Gunakan viewport units** (`vw`, `vh`) untuk ukuran yang responsif
4. **Tambahkan dark mode support** dengan `dark:` classes
5. **Struktur layout dengan flexbox** untuk kontrol yang baik

Custom modal memberikan kontrol penuh atas ukuran dan styling, sehingga lebih efektif untuk dialog yang perlu ukuran besar.

---

**Created**: 2024-12-19  
**Last Updated**: 2024-12-19  
**Related Files**: 
- `src/components/TakuLinksIframe.tsx`
- `src/styles/globals.css`
- `src/components/ui/dialog.tsx`
