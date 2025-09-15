# Data Relationships - Generation & Actress System

## Overview
Dokumentasi ini menjelaskan relasi data yang kompleks dalam sistem Generation dan Actress, termasuk cara data saling terhubung, constraints, dan best practices untuk maintain data integrity.

## 1. Entity Relationship Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Generations   │    │    Actresses    │    │     Movies      │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ id (PK)         │◄───┤ generation_id   │    │ id (PK)         │
│ name            │    │ (FK)            │    │ title           │
│ description     │    ├─────────────────┤    │ code            │
│ created_at      │    │ id (PK)         │    │ release_date    │
│ updated_at      │    │ name            │    │ duration        │
└─────────────────┘    │ name_jp         │    │ studio          │
                        │ profile_photo   │    │ director        │
                        │ created_at      │    │ created_at      │
                        │ updated_at      │    │ updated_at      │
                        └─────────────────┘    └─────────────────┘
                                │                        │
                                │                        │
                                ▼                        ▼
                        ┌─────────────────┐    ┌─────────────────┐
                        │ Movie_Actresses │    │ Movie_Actresses │
                        │ (Junction Table)│    │ (Junction Table)│
                        ├─────────────────┤    ├─────────────────┤
                        │ movie_id (FK)   │    │ movie_id (FK)   │
                        │ actress_id (FK) │    │ actress_id (FK) │
                        │ role            │    │ role            │
                        │ created_at      │    │ created_at      │
                        └─────────────────┘    └─────────────────┘
```

## 2. Core Relationships

### Generation → Actress (One-to-Many)
```sql
-- Foreign Key Constraint
ALTER TABLE actresses 
ADD CONSTRAINT fk_actress_generation 
FOREIGN KEY (generation_id) REFERENCES generations(id) 
ON DELETE CASCADE;

-- Index for performance
CREATE INDEX idx_actresses_generation_id ON actresses(generation_id);
```

**Business Rules:**
- Setiap aktris HARUS memiliki generation (NOT NULL)
- Satu generation dapat memiliki banyak aktris
- Jika generation dihapus, semua aktris terkait juga dihapus (CASCADE)
- Tidak ada aktris yang dapat eksis tanpa generation

**Data Integrity Checks:**
```typescript
// Validation sebelum create actress
const validateActressData = (data: ActressFormData): ValidationResult => {
  const errors: string[] = []
  
  // Check generation exists
  if (!data.generation_id) {
    errors.push('Generation harus dipilih')
  }
  
  // Check generation is valid
  const generation = generations.find(g => g.id === data.generation_id)
  if (!generation) {
    errors.push('Generation tidak valid')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}
```

### Actress → Movie (Many-to-Many)
```sql
-- Junction table
CREATE TABLE movie_actresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  actress_id UUID NOT NULL REFERENCES actresses(id) ON DELETE CASCADE,
  role VARCHAR(255), -- Optional: role dalam movie
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate relationships
  UNIQUE(movie_id, actress_id)
);

-- Indexes for performance
CREATE INDEX idx_movie_actresses_movie_id ON movie_actresses(movie_id);
CREATE INDEX idx_movie_actresses_actress_id ON movie_actresses(actress_id);
```

**Business Rules:**
- Satu aktris dapat bermain di banyak movie
- Satu movie dapat memiliki banyak aktris
- Relasi bersifat bidirectional
- Tidak ada duplikasi relasi (UNIQUE constraint)

**Query Examples:**
```sql
-- Get all movies for an actress
SELECT m.*, ma.role
FROM movies m
JOIN movie_actresses ma ON m.id = ma.movie_id
WHERE ma.actress_id = $1;

-- Get all actresses for a movie
SELECT a.*, ma.role
FROM actresses a
JOIN movie_actresses ma ON a.id = ma.actress_id
WHERE ma.movie_id = $1;

-- Get actress with generation info
SELECT a.*, g.name as generation_name
FROM actresses a
JOIN generations g ON a.generation_id = g.id
WHERE a.id = $1;
```

## 3. Data Consistency Patterns

### Referential Integrity
```typescript
// Service layer untuk maintain consistency
class ActressService {
  async createActress(data: ActressFormData): Promise<Actress> {
    // 1. Validate generation exists
    const generation = await this.generationService.getById(data.generation_id)
    if (!generation) {
      throw new Error('Generation tidak ditemukan')
    }
    
    // 2. Check for duplicate name in same generation
    const existingActress = await this.findByNameAndGeneration(
      data.name, 
      data.generation_id
    )
    if (existingActress) {
      throw new Error('Aktris dengan nama ini sudah ada di generation tersebut')
    }
    
    // 3. Create actress
    const actress = await this.actressRepository.create(data)
    
    // 4. Log the creation
    await this.auditService.log('actress_created', {
      actress_id: actress.id,
      generation_id: data.generation_id,
      name: data.name
    })
    
    return actress
  }
  
  async deleteActress(id: string): Promise<void> {
    // 1. Check if actress has movies
    const movieCount = await this.getMovieCount(id)
    if (movieCount > 0) {
      throw new Error('Tidak dapat menghapus aktris yang memiliki movie')
    }
    
    // 2. Delete actress (CASCADE will handle movie_actresses)
    await this.actressRepository.delete(id)
    
    // 3. Log the deletion
    await this.auditService.log('actress_deleted', { actress_id: id })
  }
}
```

### Transaction Management
```typescript
// Database transaction untuk complex operations
const transferActressToGeneration = async (
  actressId: string, 
  newGenerationId: string
): Promise<void> => {
  const client = await db.getClient()
  
  try {
    await client.query('BEGIN')
    
    // 1. Validate new generation exists
    const generation = await client.query(
      'SELECT id FROM generations WHERE id = $1',
      [newGenerationId]
    )
    
    if (generation.rows.length === 0) {
      throw new Error('Generation tidak ditemukan')
    }
    
    // 2. Update actress generation
    await client.query(
      'UPDATE actresses SET generation_id = $1, updated_at = NOW() WHERE id = $2',
      [newGenerationId, actressId]
    )
    
    // 3. Log the transfer
    await client.query(
      'INSERT INTO audit_logs (action, table_name, record_id, old_values, new_values) VALUES ($1, $2, $3, $4, $5)',
      [
        'generation_transfer',
        'actresses',
        actressId,
        JSON.stringify({ generation_id: 'old_id' }),
        JSON.stringify({ generation_id: newGenerationId })
      ]
    )
    
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
```

## 4. Data Aggregation Patterns

### Generation Statistics
```sql
-- Get generation statistics
SELECT 
  g.id,
  g.name,
  COUNT(a.id) as actress_count,
  COUNT(ma.movie_id) as total_movies,
  AVG(m.duration) as avg_movie_duration
FROM generations g
LEFT JOIN actresses a ON g.id = a.generation_id
LEFT JOIN movie_actresses ma ON a.id = ma.actress_id
LEFT JOIN movies m ON ma.movie_id = m.id
GROUP BY g.id, g.name
ORDER BY actress_count DESC;
```

### Actress Performance Metrics
```sql
-- Get actress performance metrics
SELECT 
  a.id,
  a.name,
  g.name as generation_name,
  COUNT(ma.movie_id) as movie_count,
  MIN(m.release_date) as first_movie,
  MAX(m.release_date) as latest_movie,
  AVG(m.duration) as avg_movie_duration
FROM actresses a
JOIN generations g ON a.generation_id = g.id
LEFT JOIN movie_actresses ma ON a.id = ma.actress_id
LEFT JOIN movies m ON ma.movie_id = m.id
GROUP BY a.id, a.name, g.name
HAVING COUNT(ma.movie_id) > 0
ORDER BY movie_count DESC;
```

## 5. Data Validation Rules

### Database Level Constraints
```sql
-- Generation constraints
ALTER TABLE generations 
ADD CONSTRAINT chk_generation_name_length 
CHECK (LENGTH(name) >= 3 AND LENGTH(name) <= 50);

ALTER TABLE generations 
ADD CONSTRAINT chk_generation_name_format 
CHECK (name ~ '^[a-zA-Z0-9\s\-_]+$');

-- Actress constraints
ALTER TABLE actresses 
ADD CONSTRAINT chk_actress_name_length 
CHECK (LENGTH(name) >= 2 AND LENGTH(name) <= 100);

ALTER TABLE actresses 
ADD CONSTRAINT chk_actress_name_format 
CHECK (name ~ '^[a-zA-Z\s\u3040-\u309F\u30A0-\u30FF]+$');

ALTER TABLE actresses 
ADD CONSTRAINT chk_actress_jp_name_format 
CHECK (name_jp IS NULL OR name_jp ~ '^[\u3040-\u309F\u30A0-\u30FF\s]+$');
```

### Application Level Validation
```typescript
// Comprehensive validation service
class DataValidationService {
  validateGeneration(data: GenerationFormData): ValidationResult {
    const errors: string[] = []
    
    // Name validation
    if (!data.name || data.name.trim().length < 3) {
      errors.push('Nama generation minimal 3 karakter')
    }
    
    if (data.name && data.name.length > 50) {
      errors.push('Nama generation maksimal 50 karakter')
    }
    
    if (data.name && !/^[a-zA-Z0-9\s\-_]+$/.test(data.name)) {
      errors.push('Nama generation hanya boleh huruf, angka, spasi, dash, dan underscore')
    }
    
    // Description validation
    if (data.description && data.description.length > 200) {
      errors.push('Deskripsi maksimal 200 karakter')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
  
  validateActress(data: ActressFormData): ValidationResult {
    const errors: string[] = []
    
    // Name validation
    if (!data.name || data.name.trim().length < 2) {
      errors.push('Nama aktris minimal 2 karakter')
    }
    
    if (data.name && data.name.length > 100) {
      errors.push('Nama aktris maksimal 100 karakter')
    }
    
    if (data.name && !/^[a-zA-Z\s\u3040-\u309F\u30A0-\u30FF]+$/.test(data.name)) {
      errors.push('Nama aktris hanya boleh huruf dan spasi')
    }
    
    // Japanese name validation
    if (data.name_jp && !/^[\u3040-\u309F\u30A0-\u30FF\s]+$/.test(data.name_jp)) {
      errors.push('Nama Jepang hanya boleh huruf hiragana dan katakana')
    }
    
    // Generation validation
    if (!data.generation_id) {
      errors.push('Generation harus dipilih')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
}
```

## 6. Data Migration Patterns

### Schema Evolution
```sql
-- Migration: Add profile photo fields to actresses
ALTER TABLE actresses 
ADD COLUMN profile_photo_url TEXT,
ADD COLUMN profile_photo_path TEXT;

-- Migration: Add indexes for performance
CREATE INDEX idx_actresses_name ON actresses(name);
CREATE INDEX idx_actresses_name_jp ON actresses(name_jp);
CREATE INDEX idx_generations_name ON generations(name);

-- Migration: Add audit trail
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action VARCHAR(50) NOT NULL,
  table_name VARCHAR(50) NOT NULL,
  record_id UUID NOT NULL,
  old_values JSONB,
  new_values JSONB,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Data Migration Scripts
```typescript
// Migration script untuk populate initial data
const migrateInitialData = async () => {
  const generations = [
    { name: 'Generation 1', description: '2000-2005' },
    { name: 'Generation 2', description: '2006-2010' },
    { name: 'Generation 3', description: '2011-2015' },
    { name: 'Generation 4', description: '2016-2020' },
    { name: 'Generation 5', description: '2021-Sekarang' }
  ]
  
  for (const gen of generations) {
    await db.query(
      'INSERT INTO generations (name, description) VALUES ($1, $2)',
      [gen.name, gen.description]
    )
  }
  
  console.log('Initial generations created')
}

// Migration script untuk migrate existing actress data
const migrateExistingActresses = async () => {
  // Get default generation
  const defaultGen = await db.query(
    'SELECT id FROM generations WHERE name = $1',
    ['Generation 5']
  )
  
  if (defaultGen.rows.length === 0) {
    throw new Error('Default generation not found')
  }
  
  const defaultGenerationId = defaultGen.rows[0].id
  
  // Update existing actresses to have generation
  await db.query(
    'UPDATE actresses SET generation_id = $1 WHERE generation_id IS NULL',
    [defaultGenerationId]
  )
  
  console.log('Existing actresses migrated to default generation')
}
```

## 7. Data Synchronization Patterns

### Real-time Updates
```typescript
// WebSocket service untuk real-time updates
class RealtimeDataService {
  private ws: WebSocket | null = null
  private subscribers: Map<string, Function[]> = new Map()
  
  connect() {
    this.ws = new WebSocket(process.env.REALTIME_WS_URL)
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      this.notifySubscribers(data.table, data)
    }
  }
  
  subscribe(table: string, callback: Function) {
    if (!this.subscribers.has(table)) {
      this.subscribers.set(table, [])
    }
    this.subscribers.get(table)!.push(callback)
  }
  
  private notifySubscribers(table: string, data: any) {
    const callbacks = this.subscribers.get(table) || []
    callbacks.forEach(callback => callback(data))
  }
}

// Usage in components
const ActressList = () => {
  const [actresses, setActresses] = useState<Actress[]>([])
  const realtimeService = useRealtimeData()
  
  useEffect(() => {
    // Subscribe to actress changes
    realtimeService.subscribe('actresses', (data) => {
      if (data.action === 'INSERT') {
        setActresses(prev => [...prev, data.new])
      } else if (data.action === 'UPDATE') {
        setActresses(prev => 
          prev.map(a => a.id === data.new.id ? data.new : a)
        )
      } else if (data.action === 'DELETE') {
        setActresses(prev => prev.filter(a => a.id !== data.old.id))
      }
    })
  }, [realtimeService])
}
```

### Data Caching Strategy
```typescript
// Cache service untuk optimize performance
class DataCacheService {
  private cache = new Map<string, { data: any; timestamp: number }>()
  private ttl = 5 * 60 * 1000 // 5 minutes
  
  get<T>(key: string): T | null {
    const cached = this.cache.get(key)
    
    if (!cached) return null
    
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return cached.data
  }
  
  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }
  
  invalidate(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }
}

// Usage dengan API calls
const useCachedActresses = () => {
  const cache = useDataCache()
  
  const fetchActresses = async () => {
    const cacheKey = 'actresses:all'
    const cached = cache.get<Actress[]>(cacheKey)
    
    if (cached) {
      return cached
    }
    
    const actresses = await actressApi.getActresses()
    cache.set(cacheKey, actresses)
    
    return actresses
  }
  
  return { fetchActresses }
}
```

## 8. Data Backup and Recovery

### Backup Strategy
```sql
-- Daily backup script
-- Backup generations table
COPY generations TO '/backups/generations_$(date +%Y%m%d).csv' WITH CSV HEADER;

-- Backup actresses table
COPY actresses TO '/backups/actresses_$(date +%Y%m%d).csv' WITH CSV HEADER;

-- Backup movie_actresses junction table
COPY movie_actresses TO '/backups/movie_actresses_$(date +%Y%m%d).csv' WITH CSV HEADER;
```

### Recovery Procedures
```typescript
// Recovery service
class DataRecoveryService {
  async restoreFromBackup(backupDate: string): Promise<void> {
    const client = await db.getClient()
    
    try {
      await client.query('BEGIN')
      
      // 1. Clear existing data
      await client.query('DELETE FROM movie_actresses')
      await client.query('DELETE FROM actresses')
      await client.query('DELETE FROM generations')
      
      // 2. Restore generations
      await client.query(`
        COPY generations FROM '/backups/generations_${backupDate}.csv' 
        WITH CSV HEADER
      `)
      
      // 3. Restore actresses
      await client.query(`
        COPY actresses FROM '/backups/actresses_${backupDate}.csv' 
        WITH CSV HEADER
      `)
      
      // 4. Restore movie_actresses
      await client.query(`
        COPY movie_actresses FROM '/backups/movie_actresses_${backupDate}.csv' 
        WITH CSV HEADER
      `)
      
      await client.query('COMMIT')
      
      console.log(`Data restored from backup: ${backupDate}`)
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }
}
```

## 9. Data Analytics and Reporting

### Analytics Queries
```sql
-- Generation popularity analysis
SELECT 
  g.name as generation_name,
  COUNT(a.id) as actress_count,
  COUNT(ma.movie_id) as total_movies,
  ROUND(AVG(m.duration), 2) as avg_duration,
  MIN(m.release_date) as earliest_movie,
  MAX(m.release_date) as latest_movie
FROM generations g
LEFT JOIN actresses a ON g.id = a.generation_id
LEFT JOIN movie_actresses ma ON a.id = ma.actress_id
LEFT JOIN movies m ON ma.movie_id = m.id
GROUP BY g.id, g.name
ORDER BY actress_count DESC;

-- Actress performance ranking
SELECT 
  a.name,
  g.name as generation,
  COUNT(ma.movie_id) as movie_count,
  ROUND(AVG(m.duration), 2) as avg_duration,
  COUNT(DISTINCT m.studio) as studio_count
FROM actresses a
JOIN generations g ON a.generation_id = g.id
LEFT JOIN movie_actresses ma ON a.id = ma.actress_id
LEFT JOIN movies m ON ma.movie_id = m.id
GROUP BY a.id, a.name, g.name
HAVING COUNT(ma.movie_id) > 0
ORDER BY movie_count DESC, avg_duration DESC
LIMIT 20;
```

### Reporting Service
```typescript
// Analytics service
class AnalyticsService {
  async getGenerationReport(): Promise<GenerationReport> {
    const query = `
      SELECT 
        g.id,
        g.name,
        COUNT(a.id) as actress_count,
        COUNT(ma.movie_id) as total_movies,
        AVG(m.duration) as avg_duration
      FROM generations g
      LEFT JOIN actresses a ON g.id = a.generation_id
      LEFT JOIN movie_actresses ma ON a.id = ma.actress_id
      LEFT JOIN movies m ON ma.movie_id = m.id
      GROUP BY g.id, g.name
      ORDER BY actress_count DESC
    `
    
    const result = await db.query(query)
    
    return {
      generations: result.rows,
      totalGenerations: result.rows.length,
      totalActresses: result.rows.reduce((sum, row) => sum + parseInt(row.actress_count), 0),
      totalMovies: result.rows.reduce((sum, row) => sum + parseInt(row.total_movies), 0)
    }
  }
  
  async getActressPerformanceReport(limit: number = 20): Promise<ActressPerformanceReport> {
    const query = `
      SELECT 
        a.id,
        a.name,
        g.name as generation_name,
        COUNT(ma.movie_id) as movie_count,
        AVG(m.duration) as avg_duration,
        COUNT(DISTINCT m.studio) as studio_count
      FROM actresses a
      JOIN generations g ON a.generation_id = g.id
      LEFT JOIN movie_actresses ma ON a.id = ma.actress_id
      LEFT JOIN movies m ON ma.movie_id = m.id
      GROUP BY a.id, a.name, g.name
      HAVING COUNT(ma.movie_id) > 0
      ORDER BY movie_count DESC, avg_duration DESC
      LIMIT $1
    `
    
    const result = await db.query(query, [limit])
    
    return {
      topActresses: result.rows,
      reportDate: new Date().toISOString()
    }
  }
}
```

---

**Last Updated:** December 2024  
**Version:** 1.0.0  
**Maintainer:** Development Team
