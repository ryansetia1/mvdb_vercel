# Master Data Routes Fix

Masalahnya adalah server tidak memiliki routes untuk master data yang diperlukan oleh frontend. 

Berdasarkan error log:
- Frontend mencoba mengakses `/make-server-f3064b20/master/group`
- Server mengembalikan 500 Internal Server Error dari Cloudflare
- Ini menunjukkan server crash atau tidak memiliki route tersebut

Solusi yang telah diterapkan:
1. Menambahkan routes master data ke server index.tsx
2. Routes yang ditambahkan:
   - GET `/make-server-f3064b20/master/:type` - Get master data by type
   - POST `/make-server-f3064b20/master/:type` - Create simple master data
   - POST `/make-server-f3064b20/master/:type/extended` - Create extended master data
   - PUT `/make-server-f3064b20/master/:type/:id/extended` - Update extended master data
   - PUT `/make-server-f3064b20/master/:type/:id/extended/sync` - Update with sync
   - PUT `/make-server-f3064b20/master/:type/:id/sync` - Update simple with sync
   - DELETE `/make-server-f3064b20/master/:type/:id` - Delete master data

Server seharusnya sekarang bisa merespons request untuk master data.