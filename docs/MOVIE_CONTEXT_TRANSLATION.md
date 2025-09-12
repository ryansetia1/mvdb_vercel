# Movie Context Translation Enhancement

## Deskripsi
Implementasi konteks movie data untuk model DeepSeek R1 agar dapat memberikan terjemahan yang lebih akurat untuk movie titles yang mengandung nama aktor, aktris, atau director. Fitur ini mencegah terjemahan literal nama orang yang seharusnya tetap menggunakan nama asli mereka.

## Masalah Sebelumnya
Model DeepSeek R1 sebelumnya menerjemahkan movie titles secara literal tanpa memahami konteks bahwa:
- ❌ Nama aktor/aktris dalam title diterjemahkan secara literal
- ❌ Nama director dalam title diterjemahkan secara literal  
- ❌ Tidak ada konteks tentang siapa saja yang terlibat dalam movie tersebut
- ❌ Terjemahan menjadi tidak akurat dan tidak sesuai dengan standar industri

## Solusi yang Diimplementasikan

### 1. Enhanced Translation Interface
Menambahkan `movieContext` ke interface `TranslationRequest`:

```typescript
export interface TranslationRequest {
  text: string
  sourceLanguage?: string
  targetLanguage?: string
  context?: 'movie_title' | 'actor_name' | 'actress_name' | 'studio_name' | 'series_name' | 'general'
  movieContext?: {
    actors?: string[]
    actresses?: string[]
    directors?: string[]
    studio?: string
    series?: string
    dmcode?: string
  }
}
```

### 2. Context Builder Function
Fungsi `buildMovieContextInfo()` untuk membangun informasi konteks movie:

```typescript
const buildMovieContextInfo = (movieContext?: TranslationRequest['movieContext']): string => {
  // Membangun informasi konteks movie yang akan diberikan ke AI
  // Termasuk actors, actresses, directors, studio, series, dan movie code
  // Dengan instruksi khusus untuk tidak menerjemahkan nama orang secara literal
}
```

### 3. Enhanced System Prompt
System prompt yang diperbaiki dengan konteks movie data:

```
MOVIE CONTEXT INFORMATION:
Actresses in this movie: [nama aktris]
Actors in this movie: [nama aktor]  
Directors: [nama director]
Studio: [nama studio]
Series: [nama series]
Movie Code: [dmcode]

IMPORTANT: The movie title may contain names of actors, actresses, or directors mentioned above. 
Do NOT translate these names literally - use the exact names provided in the context information. 
Only translate descriptive words and phrases, keeping all person names unchanged.
```

### 4. New Translation Function
Fungsi baru `translateMovieTitleWithContext()` khusus untuk movie titles:

```typescript
export async function translateMovieTitleWithContext(
  movieTitle: string,
  movieData: {
    actors?: string
    actress?: string
    director?: string
    studio?: string
    series?: string
    dmcode?: string
  }
): Promise<string>
```

### 5. Updated MovieDataParser
Komponen `MovieDataParser` diupdate untuk menggunakan fungsi baru:

```typescript
const translateTitle = async () => {
  // Menggunakan konteks movie data untuk terjemahan yang lebih akurat
  const movieData = {
    actors: parsedData.actors?.join(', ') || '',
    actress: parsedData.actresses?.join(', ') || '',
    director: parsedData.director || '',
    studio: parsedData.studio || '',
    series: parsedData.series || '',
    dmcode: dmcode || ''
  }
  
  const translatedText = await translateMovieTitleWithContext(parsedData.titleJp, movieData)
}
```

## Keuntungan Implementasi

### ✅ Akurasi Terjemahan
- Movie titles dengan nama aktor/aktris tidak diterjemahkan secara literal
- Nama director tetap menggunakan nama asli mereka
- Konteks movie membantu AI memahami jenis konten yang diterjemahkan

### ✅ Konsistensi Industri
- Mengikuti standar industri entertainment Jepang
- Nama orang tetap menggunakan romanisasi yang benar
- Hanya kata deskriptif yang diterjemahkan

### ✅ Fleksibilitas
- Dapat digunakan untuk berbagai jenis konteks (movie_title, actor_name, dll)
- Mendukung multiple actors/actresses dalam satu movie
- Dapat dikombinasikan dengan konteks lainnya

## Contoh Penggunaan

### Sebelum (Tanpa Konteks):
```
Input: "田中みなみの秘密の部屋"
Output: "Minami Tanaka's Secret Room" (literal translation)
```

### Sesudah (Dengan Konteks):
```
Input: "田中みなみの秘密の部屋"
Context: Actresses in this movie: 田中みなみ
Output: "Minami Tanaka's Secret Room" (menggunakan nama aktris yang benar)
```

## Testing
Untuk menguji fitur ini:
1. Buka MovieDataParser dengan movie yang memiliki title Jepang
2. Pastikan movie memiliki data aktor/aktris/director
3. Klik tombol translate title
4. Verifikasi bahwa nama orang tidak diterjemahkan secara literal

## Dependencies
- DeepSeek R1 model melalui OpenRouter
- Movie data dari database (actors, actresses, directors)
- Existing translation infrastructure

## Future Enhancements
- [ ] Support untuk multiple languages selain Japanese-English
- [ ] Caching untuk konteks movie yang sering digunakan
- [ ] Integration dengan master data untuk konsistensi nama
- [ ] Batch translation dengan konteks movie
