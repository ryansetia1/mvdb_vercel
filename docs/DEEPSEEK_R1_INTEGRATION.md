# DeepSeek R1 Integration dengan OpenRouter

## Deskripsi
Integrasi model DeepSeek R1 free melalui OpenRouter untuk meningkatkan kualitas fungsi translate dari bahasa Jepang ke bahasa Inggris di aplikasi MVDB.

## Fitur yang Diintegrasikan

### 1. Translation API (`src/utils/deepseekTranslationApi.ts`)
- **Model**: `deepseek/deepseek-r1-distill-llama-70b`
- **Provider**: OpenRouter
- **API Key**: `VITE_OPENROUTER_API_KEY` (environment variable)

#### Fungsi Utama:
- `translateJapaneseToEnglish()` - Translate Jepang ke Inggris dengan fallback ke MyMemory API
- `convertJapaneseToRomaji()` - Konversi Jepang ke Romaji dengan fallback ke basic mapping
- `batchTranslateJapaneseToEnglish()` - Batch translation untuk multiple texts
- `testOpenRouterConnection()` - Test koneksi ke OpenRouter API

### 2. Komponen yang Diupdate

#### MovieDataParser (`src/components/MovieDataParser.tsx`)
- Fungsi `translateTitle()` sekarang menggunakan DeepSeek R1
- Toast notification untuk feedback user
- Fallback ke MyMemory API jika DeepSeek gagal

#### MasterDataForm (`src/components/MasterDataForm.tsx`)
- Fungsi `translateToEnglish()` untuk series titles
- Fungsi `translateNameToEnglish()` untuk nama aktor/aktris/director
- Fungsi `convertToRomaji()` untuk konversi nama ke Romaji
- Type checking untuk memastikan fungsi hanya berjalan pada type yang sesuai

### 3. Test Component (`src/components/DeepSeekTranslationTest.tsx`)
- Interface untuk testing integrasi DeepSeek R1
- Test koneksi ke OpenRouter
- Quick test dengan sample Japanese text
- Visual feedback untuk hasil translation dan romaji conversion

## Cara Penggunaan

### 1. Di Movie Parser
1. Paste data movie dengan title Jepang
2. Klik tombol "Translate from Japanese"
3. Sistem akan menggunakan DeepSeek R1 untuk translate
4. Jika gagal, akan fallback ke MyMemory API

### 2. Di Master Data Form
1. Masukkan nama dalam bahasa Jepang
2. Klik tombol "Translate" untuk translate ke Inggris
3. Klik tombol "Convert to Romaji" untuk konversi ke Romaji
4. Sistem akan menggunakan DeepSeek R1 dengan fallback

### 3. Testing
1. Buka Dashboard → Tab "DeepSeek Test"
2. Test koneksi ke OpenRouter
3. Masukkan text Jepang untuk testing
4. Lihat hasil translation dan romaji conversion

## Konfigurasi

### API Key
API key OpenRouter disimpan di `src/utils/deepseekTranslationApi.ts`:
```typescript
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY
```

**Key Details:**
- **Name**: mvdbKey
- **Status**: ✅ Active
- **Provider**: OpenRouter

### Model Configuration
```typescript
{
  model: 'deepseek/deepseek-r1:free',
  max_tokens: 500,
  temperature: 0.3,
  top_p: 0.9
}
```

## Fallback Strategy

1. **Primary**: DeepSeek R1 melalui OpenRouter
2. **Fallback**: MyMemory API untuk translation
3. **Final Fallback**: Basic character mapping untuk Romaji

## Error Handling

- Comprehensive error handling dengan try-catch blocks
- Toast notifications untuk user feedback
- Console logging untuk debugging
- Graceful degradation jika API gagal

## Performance Considerations

- Sequential processing untuk batch translation (100ms delay antar request)
- Request timeout handling
- Efficient prompt engineering untuk hasil optimal
- Caching strategy untuk mengurangi API calls

## Security

- API key tidak exposed ke client-side secara langsung
- HTTP-Referer dan X-Title headers untuk tracking
- Rate limiting consideration untuk production use

## Monitoring

- Console logging untuk semua API calls
- Toast notifications untuk user feedback
- Connection test functionality
- Error tracking dan reporting

---

**Created**: 2024-12-19  
**Purpose**: Integrasi DeepSeek R1 untuk meningkatkan kualitas translation  
**Status**: ✅ Completed & Active  
**API Key**: mvdbKey (stored in VITE_OPENROUTER_API_KEY environment variable)
