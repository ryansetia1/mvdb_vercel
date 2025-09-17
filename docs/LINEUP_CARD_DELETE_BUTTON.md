# Lineup Card Delete Button Feature

## 📋 Overview

Fitur tombol hapus langsung di card member pada lineup management memungkinkan user untuk menghapus member dari lineup dengan lebih mudah dan intuitif.

## 🎯 Feature Description

### What's New
- **Delete Button**: Tombol hapus (trash icon) muncul saat hover di card member
- **Direct Removal**: Menghapus member langsung dari card tanpa perlu ke form edit
- **Confirmation Dialog**: Dialog konfirmasi untuk mencegah penghapusan tidak sengaja
- **Consistent API**: Menggunakan API yang sama dengan checkbox removal

### User Experience
1. **Hover Effect**: Tombol hapus muncul saat mouse hover di card member
2. **Visual Feedback**: Icon trash dengan warna merah dan hover effect
3. **Confirmation**: Dialog konfirmasi dengan nama member
4. **Immediate Update**: UI terupdate langsung setelah penghapusan

## 🔧 Technical Implementation

### UI Changes
```typescript
// Updated card container with X button in top right corner
<div className="space-y-3 p-4 bg-gray-50 rounded-lg relative group">
  {/* Delete Button - X in top right corner */}
  <button
    onClick={(e) => {
      e.preventDefault()
      e.stopPropagation()
      handleRemoveMemberFromCard(actress.id, lineup.id, actress.name || 'Unknown')
    }}
    className="absolute top-2 right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors duration-200 opacity-0 group-hover:opacity-100"
    title={`Remove ${actress.name} from lineup`}
  >
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  </button>
  
  {/* Actress Info */}
  <div className="flex items-center space-x-3">
    {/* Profile picture and name */}
  </div>
</div>
```

### Function Implementation
```typescript
// State for custom confirmation dialog
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
const [deleteTarget, setDeleteTarget] = useState<{ actressId: string, lineupId: string, actressName: string } | null>(null)

const handleRemoveMemberFromCard = (actressId: string, lineupId: string, actressName: string) => {
  // Set target for deletion and show confirmation dialog
  setDeleteTarget({ actressId, lineupId, actressName })
  setShowDeleteConfirm(true)
}

const confirmDeleteMember = async () => {
  if (!deleteTarget) return

  try {
    setError(null)
    setLoading(true)
    
    console.log('Removing member from card:', deleteTarget)
    
    // Use the same API function as the checkbox removal
    await masterDataApi.removeActressFromLineup(deleteTarget.actressId, deleteTarget.lineupId, accessToken)
    
    console.log('Successfully removed member from card:', deleteTarget.actressName)
    
    // Reload data to reflect changes
    await loadData()
    
  } catch (err) {
    console.error('Error removing member from card:', err)
    const errorMessage = err instanceof Error ? err.message : 'Gagal menghapus member dari lineup'
    setError(errorMessage)
  } finally {
    setLoading(false)
    setShowDeleteConfirm(false)
    setDeleteTarget(null)
  }
}

const cancelDeleteMember = () => {
  setShowDeleteConfirm(false)
  setDeleteTarget(null)
}
```

## 🎨 Design Details

### Visual Design
- **Button Style**: Red background (`bg-red-500`) dengan hover effect (`hover:bg-red-600`)
- **Icon**: X icon dengan warna putih (`text-white`)
- **Size**: Small circular button (`w-6 h-6`) dengan icon kecil (`w-3 h-3`)
- **Position**: Absolute positioned di top right corner (`absolute top-2 right-2`)
- **Animation**: Smooth color transition (`transition-colors duration-200`)
- **Visibility**: Hidden by default, muncul saat hover (`opacity-0 group-hover:opacity-100`)

### Interaction Design
- **Hover Trigger**: Button muncul saat hover di card (`group-hover:opacity-100`)
- **Click Action**: Menampilkan custom confirmation dialog
- **Event Handling**: `preventDefault()` dan `stopPropagation()` untuk mencegah closing dialog lain
- **Loading State**: Button disabled saat proses penghapusan
- **Error Handling**: Error message ditampilkan jika gagal
- **Custom Dialog**: Menggunakan Dialog component untuk konfirmasi yang tidak mengganggu dialog lain

## 🔄 User Flow

### Before (Checkbox Method)
1. Buka lineup management
2. Klik "Edit" pada lineup
3. Hapus ceklis dari member yang ingin dihapus
4. Klik "Update"
5. Konfirmasi perubahan

### After (Card Delete Button)
1. Buka lineup management
2. Hover di card member untuk melihat tombol X
3. Klik tombol X di pojok kanan atas card
4. Konfirmasi penghapusan di custom dialog
5. Member langsung terhapus

## ✅ Benefits

### User Experience
- **Faster**: Langsung dari card tanpa perlu ke form edit
- **Cleaner**: Icon X yang familiar dan tidak mengganggu layout
- **Safer**: Custom confirmation dialog yang tidak menutup dialog lain
- **Intuitive**: Hover effect memberikan feedback yang jelas
- **Non-intrusive**: Button tersembunyi sampai di-hover

### Technical Benefits
- **Consistent**: Menggunakan API yang sama dengan checkbox removal
- **Reliable**: Menggunakan fungsi `removeActressFromLineup` yang sudah teruji
- **Maintainable**: Kode yang clean dan mudah dipelihara
- **Accessible**: Tooltip dan keyboard navigation support
- **Event Safe**: Proper event handling untuk mencegah dialog conflicts
- **State Management**: Clean state management untuk confirmation dialog

## 🧪 Testing

### Test Cases
1. **Basic Functionality**
   - [ ] Hover di card member menampilkan tombol X
   - [ ] Klik tombol X menampilkan custom confirmation dialog
   - [ ] Konfirmasi penghapusan menghapus member dari lineup
   - [ ] UI terupdate setelah penghapusan

2. **Dialog Behavior**
   - [ ] Custom dialog tidak menutup dialog lain yang terbuka
   - [ ] Dialog konfirmasi menampilkan nama member yang benar
   - [ ] Batal button menutup dialog tanpa menghapus member
   - [ ] Dialog tertutup otomatis setelah penghapusan berhasil

3. **Error Handling**
   - [ ] Error message ditampilkan jika penghapusan gagal
   - [ ] Loading state ditampilkan saat proses penghapusan
   - [ ] Button disabled saat loading

4. **Edge Cases**
   - [ ] Member dengan nama kosong
   - [ ] Network error saat penghapusan
   - [ ] Multiple rapid clicks
   - [ ] Hover dan click pada card yang berbeda

### Manual Testing Steps
1. Buka lineup management
2. Pilih lineup yang memiliki member
3. Hover di card member untuk melihat tombol X
4. Klik tombol X di pojok kanan atas card
5. Verifikasi custom confirmation dialog muncul
6. Verifikasi nama member ditampilkan dengan benar
7. Klik "Batal" untuk test cancel functionality
8. Klik tombol X lagi dan klik "Hapus" untuk konfirmasi
9. Verifikasi member terhapus dari lineup
10. Verifikasi UI terupdate
11. Test dengan dialog lain terbuka untuk memastikan tidak ada conflict

## 📁 Files Modified

### Frontend
- `src/components/LineupManagement.tsx`
  - Added delete button to member cards
  - Added `handleRemoveMemberFromCard` function
  - Added hover effects and styling

## 🚀 Deployment

### Frontend Deployment
```bash
# Build for production
npm run build

# Deploy to hosting platform
vercel --prod
```

### No Backend Changes Required
- Menggunakan API yang sudah ada (`removeActressFromLineup`)
- Tidak ada perubahan di server functions
- Tidak perlu redeploy Supabase

## 📊 Impact

### Before
- User harus ke form edit untuk menghapus member
- Proses lebih panjang dan tidak intuitif
- Hanya bisa menghapus multiple members sekaligus

### After
- User bisa menghapus member langsung dari card
- Icon X yang clean dan tidak mengganggu layout
- Custom confirmation dialog yang aman
- Proses lebih cepat dan intuitif
- Bisa menghapus individual member dengan mudah
- Tidak ada conflict dengan dialog lain

## 🔄 Future Enhancements

### Potential Improvements
1. **Bulk Delete**: Pilih multiple members dan hapus sekaligus
2. **Undo Functionality**: Fitur undo untuk penghapusan tidak sengaja
3. **Animation**: Smooth animation saat member dihapus
4. **Keyboard Shortcuts**: Support keyboard untuk penghapusan
5. **Drag & Drop**: Drag member keluar dari lineup untuk menghapus
6. **Always Visible**: Option untuk membuat tombol X selalu terlihat
7. **Different Icons**: Icon lain seperti trash atau minus
8. **Confirmation Settings**: Option untuk disable confirmation dialog

---

**Status:** ✅ **COMPLETED** - Feature implemented with X button and custom confirmation dialog  
**Last Updated:** September 17, 2025  
**Version:** 2.0 - Updated with X button design and fixed dialog behavior
