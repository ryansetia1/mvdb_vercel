# Panduan Deployment Supabase Edge Functions

## Masalah yang Ditemukan

Tab Stats mengalami error 404 untuk endpoint `/template-counts` karena Supabase edge functions belum di-deploy dengan endpoint yang baru ditambahkan.

## Solusi Sementara

Sudah ditambahkan fallback untuk template stats agar tab Stats tetap berfungsi meskipun endpoint template-counts tidak tersedia:

```typescript
templateStatsApi.getTemplateCounts(accessToken).catch(() => ({ coverTemplates: 0, groupTemplates: 0 }))
```

## Endpoint yang Perlu Di-deploy

### 1. Template Counts Endpoint
- **Path**: `/make-server-e0516fcf/template-counts`
- **Method**: GET
- **Location**: `supabase/functions/make-server-e0516fcf/index.tsx` (line 3243)
- **Function**: Mengembalikan jumlah cover templates dan group templates

### 2. Master Data Endpoint
- **Path**: `/make-server-e0516fcf/master/:type`
- **Method**: GET
- **Location**: `supabase/functions/make-server-e0516fcf/index.tsx` (line 3271)
- **Function**: Mengembalikan master data berdasarkan type (actor, actress, director, dll.)

## Cara Deploy Supabase Edge Functions

### Opsi 1: Menggunakan Supabase CLI
```bash
# Install Supabase CLI
npm install -g supabase

# Login ke Supabase
supabase login

# Deploy edge functions
supabase functions deploy make-server-e0516fcf
```

### Opsi 2: Melalui Supabase Dashboard
1. Buka [supabase.com](https://supabase.com)
2. Login ke akun Supabase
3. Pilih project yang sesuai
4. Pergi ke Edge Functions
5. Upload atau update function `make-server-e0516fcf`

### Opsi 3: Menggunakan GitHub Actions (Otomatis)
Tambahkan workflow GitHub Actions untuk auto-deploy:

```yaml
name: Deploy Supabase Functions
on:
  push:
    branches: [main]
    paths: ['supabase/functions/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: supabase/setup-cli@v1
      - run: supabase functions deploy make-server-e0516fcf
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

## Verifikasi Deployment

Setelah deployment selesai, test endpoint:

```bash
# Test template counts endpoint
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-e0516fcf/template-counts

# Test master data endpoint
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-e0516fcf/master/actor
```

## Status Saat Ini

✅ **Tab Stats berfungsi dengan fallback**
- Semua data stats ditampilkan dengan benar
- Template stats menggunakan fallback (0, 0) jika endpoint tidak tersedia
- UI tetap responsif dan informatif

⚠️ **Perlu deployment untuk template stats yang akurat**
- Endpoint template-counts perlu di-deploy untuk mendapatkan data template yang sebenarnya
- Master data endpoint sudah berfungsi dengan baik

## Catatan Penting

- Server yang aktif adalah `make-server-e0516fcf`
- Semua API sudah menggunakan prefix yang konsisten
- Fallback memastikan aplikasi tetap berfungsi meskipun ada endpoint yang belum di-deploy
