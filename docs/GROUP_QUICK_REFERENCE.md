# Quick Reference: Group Display

## 🎯 Key Points

### Filtering Member Grup (PENTING!)
```typescript
// ✅ BENAR - Gunakan selectedGroups saja
const members = actresses.filter(actress => 
  actress.selectedGroups && actress.selectedGroups.includes(group.name)
)

// ❌ SALAH - Jangan campur sistem lama dan baru
const members = actresses.filter(actress => 
  actress.selectedGroups?.includes(group.name) || 
  actress.groupId === group.id || 
  actress.groupName === group.name
)
```

### Cache Management
```typescript
// Clear cache untuk data fresh
useEffect(() => {
  localStorage.removeItem('mvdb_cached_data')
  loadActresses()
}, [accessToken, group.id])
```

### Gallery Display
```typescript
// Handle gallery dengan fallback
const groupGalleryPhotos = useMemo(() => {
  if (Array.isArray(group.gallery)) {
    return group.gallery.filter(url => url && url.trim())
  }
  if (Array.isArray(group.galleryPhotos)) {
    return group.galleryPhotos.filter(url => url && url.trim())
  }
  return []
}, [group.gallery, group.galleryPhotos])
```

## 🔧 Debug Tools

### Console Logging
```typescript
console.log('Expected members (from dialog):', expectedMembers)
console.log('Actual members found:', members.map(m => m.name))
console.log('Missing members:', missingMembers)
console.log('Extra members:', extraMembers)
```

### Debug Buttons
- **Clear All Cache & Reload** - Hapus cache dan reload
- **Sync with Dialog Data** - Sinkronkan dengan data dialog
- **Remove Incorrect Members** - Hapus member yang salah

## 📊 Data Structure

### Group Data
```typescript
{
  id: string
  name: string
  type: 'group'
  jpname?: string
  profilePicture?: string
  website?: string
  description?: string
  gallery?: string[]
}
```

### Actress Data
```typescript
{
  id: string
  name: string
  type: 'actress'
  selectedGroups?: string[] // PRIORITAS TERTINGGI
  groupId?: string // DEPRECATED
  groupName?: string // DEPRECATED
  groupData?: { [groupName: string]: { photos: string[], alias?: string } }
}
```

## 🚨 Common Issues

1. **Data Mixed**: Clear cache dan gunakan selectedGroups saja
2. **Endless Loop**: Jangan gunakan force reload
3. **Wrong Members**: Sync dengan dialog data
4. **Gallery Not Loading**: Check array structure dan URL validity

## ✅ Checklist

- [ ] Gunakan selectedGroups untuk filtering
- [ ] Clear cache saat load
- [ ] Bandingkan dengan dialog data
- [ ] Handle gallery dengan fallback
- [ ] Debug dengan logging yang detail
- [ ] Sync data jika ada perbedaan
