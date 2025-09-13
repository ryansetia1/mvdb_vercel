# R18.dev JSON Format Support

## Overview
Aplikasi sekarang mendukung format JSON dari r18.dev untuk parsing data movie. Format ini menyediakan data yang lebih lengkap dan terstruktur dibandingkan format text biasa.

## Format JSON yang Didukung

### Struktur Data R18.dev
```json
{
  "actors": [],
  "actresses": [
    {
      "id": 1015472,
      "image_url": "tia.jpg",
      "name_kana": "てぃあ",
      "name_kanji": "ティア", 
      "name_romaji": "Tia"
    }
  ],
  "authors": [],
  "categories": [
    {
      "id": 2001,
      "name_en": "Big Tits",
      "name_en_is_machine_translation": false,
      "name_ja": "巨乳"
    }
  ],
  "comment_en": "Description in English...",
  "content_id": "snis00217",
  "directors": [
    {
      "id": 101138,
      "name_kana": "ぽちょむきん",
      "name_kanji": "ポチョムキン",
      "name_romaji": "pochomquin"
    }
  ],
  "dvd_id": "SNIS-217",
  "gallery": [
    {
      "image_full": "https://pics.dmm.co.jp/digital/video/snis00217/snis00217jp-1.jpg",
      "image_thumb": "https://pics.dmm.co.jp/digital/video/snis00217/snis00217-1.jpg"
    }
  ],
  "histrions": [],
  "jacket_full_url": "https://pics.dmm.co.jp/digital/video/snis00217/snis00217pl.jpg",
  "jacket_thumb_url": "https://pics.dmm.co.jp/digital/video/snis00217/snis00217ps.jpg",
  "label_id": 3474,
  "label_name_en": "S1 NO.1 STYLE",
  "label_name_ja": "S1 NO.1 STYLE",
  "maker_id": 3152,
  "maker_name_en": "S1 NO.1 STYLE",
  "maker_name_ja": "エスワン ナンバーワンスタイル",
  "release_date": "2014-08-19",
  "runtime_mins": 154,
  "sample_url": "https://cc3001.dmm.co.jp/litevideo/freepv/s/sni/snis00217/snis00217_dmb_w.mp4",
  "series_id": 210226,
  "series_name_en": "Love - Dirty Man",
  "series_name_en_is_machine_translation": false,
  "series_name_ja": "ラブ◆キモメン",
  "service_code": "digital",
  "site_id": 2,
  "title_en": "Gross Guys on Hot Babes!",
  "title_en_is_machine_translation": false,
  "title_en_uncensored": "Gross Guys on Hot Babes!",
  "title_ja": "ラブ◆キモメン ティア"
}
```

## Mapping Data Fields

### Field Mapping dari R18.dev ke Database
- `dvd_id` → `code` (Movie Code)
- `title_ja` → `titleJp` (Japanese Title)
- `title_en` / `title_en_uncensored` → `titleEn` (English Title)
- `release_date` → `releaseDate` (Release Date)
- `runtime_mins` → `duration` (Duration in minutes)
- `directors[0].name_romaji` → `director` (Director Name)
- `maker_name_en` / `maker_name_ja` → `studio` (Studio/Maker)
- `series_name_en` / `series_name_ja` → `series` (Series Name)
- `label_name_en` / `label_name_ja` → `label` (Label Name)
- `actresses[].name_romaji` → `actresses` (Actress Names)
- `actors[].name_romaji` → `actors` (Actor Names)

### Data Tambahan yang Diekstrak
- `gallery[].image_full` → `galleryImages` (Gallery Images)
- `jacket_full_url` → `coverImage` (Cover Image)
- `sample_url` → `sampleUrl` (Sample Video URL)
- `comment_en` → `commentEn` (English Description)

## Fitur yang Ditambahkan

### 1. Auto-Detection
Parser secara otomatis mendeteksi apakah data yang dipaste adalah format JSON r18.dev atau format text biasa.

### 2. Enhanced Data Display
- **R18.dev Data Section**: Menampilkan informasi tambahan seperti gallery images, cover image, sample video, dan description
- **Cast Details Section**: Menampilkan detail lengkap cast dengan nama dalam format Romaji, Kanji, dan Kana
- **Visual Indicators**: Menggunakan warna purple dan indigo untuk membedakan data dari r18.dev

### 3. Comprehensive Name Handling
- Mendukung multiple name formats (Romaji, Kanji, Kana) untuk actresses, actors, dan directors
- Prioritas: Romaji > Kanji > Kana untuk display name

## Cara Penggunaan

1. Copy data JSON dari r18.dev
2. Paste ke dalam Movie Data Parser
3. Parser akan otomatis mendeteksi format dan menampilkan data yang sudah diproses
4. Review dan edit data sesuai kebutuhan
5. Save movie ke database

## Kompatibilitas

- Format JSON r18.dev: ✅ Didukung
- Format text biasa (JavDB, dll): ✅ Tetap didukung
- Format lainnya: ✅ Tetap didukung

## Technical Implementation

### Files Modified
- `src/utils/movieDataParser.ts`: Added R18 JSON parsing logic
- `src/utils/movieApi.ts`: Extended Movie interface
- `src/components/MovieDataParser.tsx`: Enhanced UI display

### Key Functions Added
- `isR18JsonFormat()`: Detects R18.dev JSON format
- `parseR18JsonData()`: Parses R18.dev JSON data
- Enhanced `parseMovieData()`: Auto-detects and routes to appropriate parser

## Benefits

1. **Rich Data**: Lebih banyak informasi yang tersedia (gallery images, sample video, detailed cast info)
2. **Better Accuracy**: Data terstruktur mengurangi parsing errors
3. **Enhanced UX**: Visual indicators dan organized display
4. **Backward Compatibility**: Format lama tetap didukung
5. **Future Ready**: Mudah untuk menambahkan format baru lainnya
