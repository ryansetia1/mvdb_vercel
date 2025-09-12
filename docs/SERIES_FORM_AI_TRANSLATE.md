# Series Form AI Translate Feature

## Deskripsi
Menambahkan tombol AI translate ke form Edit Series untuk menerjemahkan title Japanese ke English menggunakan DeepSeek R1 dengan konteks series yang tepat.

## Fitur yang Ditambahkan

### 1. **AI Translate Button**
- Tombol translate dengan ikon Brain dan spinner loading
- Ditempatkan di sebelah field Title Japanese
- Responsive design dengan text yang tersembunyi di layar kecil
- Disabled ketika tidak ada text Japanese atau sedang dalam proses translate

### 2. **Translation Function**
```typescript
const translateTitle = async () => {
  if (!formData.titleJp.trim()) {
    toast.error('Title Japanese harus diisi terlebih dahulu')
    return
  }
  
  setIsTranslating(true)
  try {
    // Menggunakan DeepSeek R1 untuk translate dengan konteks series
    const translatedText = await translateJapaneseToEnglishWithContext(formData.titleJp, 'series_name')
    
    if (translatedText && translatedText !== formData.titleJp) {
      setFormData(prev => ({ ...prev, titleEn: translatedText }))
      toast.success('Title berhasil diterjemahkan menggunakan DeepSeek R1')
    } else {
      toast.error('Gagal menerjemahkan title')
    }
  } catch (error) {
    console.error('Translation error:', error)
    toast.error('Terjadi error saat menerjemahkan title')
  } finally {
    setIsTranslating(false)
  }
}
```

### 3. **Enhanced UI Layout**
- Field Title Japanese sekarang menggunakan flex layout dengan tombol translate
- Input field menggunakan `flex-1` untuk mengambil ruang yang tersisa
- Tombol translate menggunakan `variant="outline"` dan `size="sm"`

### 4. **Loading States**
- State `isTranslating` untuk mengontrol loading state
- Spinner `AITranslationSpinner` saat sedang translate
- Text "AI Translating..." yang tersembunyi di layar kecil (`hidden sm:inline`)

### 5. **Error Handling**
- Validasi input Japanese title harus diisi
- Toast notifications untuk success dan error
- Console logging untuk debugging

## Konteks Translation

### Series Context
Menggunakan konteks `'series_name'` yang memberikan instruksi khusus untuk DeepSeek R1:

```
This text appears to be: a Japanese series/franchise name - maintain consistency with existing translations
```

### Keuntungan Konteks Series
- ✅ Memahami bahwa ini adalah nama series/franchise
- ✅ Menjaga konsistensi dengan terjemahan yang sudah ada
- ✅ Terjemahan yang lebih akurat untuk konten entertainment Jepang
- ✅ Tidak menerjemahkan nama orang secara literal jika ada dalam title

## Dependencies yang Ditambahkan

```typescript
import { translateJapaneseToEnglishWithContext } from '../utils/deepseekTranslationApi'
import { AITranslationSpinner } from './AITranslationLoading'
import { toast } from 'sonner'
import { Brain } from 'lucide-react'
```

## State Management

```typescript
const [isTranslating, setIsTranslating] = useState(false)
```

## UI Components

### Button Structure
```tsx
<Button
  type="button"
  onClick={translateTitle}
  disabled={isTranslating || !formData.titleJp.trim()}
  variant="outline"
  size="sm"
  className="flex items-center gap-1"
  title="Translate Japanese title to English using DeepSeek R1"
>
  {isTranslating ? (
    <>
      <AITranslationSpinner size="sm" />
      <span className="hidden sm:inline">AI Translating...</span>
    </>
  ) : (
    <>
      <Brain className="h-4 w-4" />
      <span className="hidden sm:inline">Translate</span>
    </>
  )}
</Button>
```

## User Experience

### Workflow
1. User mengisi field "Title Japanese"
2. User klik tombol "Translate" (ikon Brain)
3. Sistem menampilkan spinner loading
4. DeepSeek R1 menerjemahkan dengan konteks series
5. Hasil terjemahan otomatis mengisi field "Title English"
6. Toast notification menampilkan status sukses/error

### Responsive Design
- Di layar kecil: Hanya menampilkan ikon Brain
- Di layar besar: Menampilkan ikon + text "Translate" / "AI Translating..."

## Error Scenarios

1. **Japanese title kosong**: Toast error "Title Japanese harus diisi terlebih dahulu"
2. **Translation gagal**: Toast error "Gagal menerjemahkan title"
3. **Network error**: Toast error "Terjadi error saat menerjemahkan title"

## Testing

Untuk menguji fitur ini:
1. Buka form Edit Series
2. Isi field "Title Japanese" dengan text Jepang
3. Klik tombol translate (ikon Brain)
4. Verifikasi bahwa field "Title English" terisi dengan terjemahan
5. Test dengan berbagai jenis series title Jepang

## Future Enhancements

- [ ] Support untuk translate English ke Japanese (reverse translation)
- [ ] Batch translation untuk multiple series
- [ ] Integration dengan master data untuk konsistensi nama
- [ ] Caching untuk terjemahan yang sering digunakan
- [ ] Preview terjemahan sebelum apply ke form
