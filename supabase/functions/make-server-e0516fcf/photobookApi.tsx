import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import * as kv from './kv_store.tsx'

interface ImageTag {
  url: string
  actresses: string[]
  imageIndex?: number
}

interface Photobook {
  id?: string
  titleEn: string
  titleJp?: string
  link?: string
  cover?: string
  releaseDate?: string
  actress?: string
  imageLinks?: string
  imageTags?: ImageTag[]
}

const photobookApi = new Hono()

// Enable CORS for all routes
photobookApi.use('*', cors({
  origin: '*',
  allowHeaders: ['*'],
  allowMethods: ['*'],
}))

// Helper to generate photobook ID
function generatePhotobookId(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `pb_${timestamp}_${random}`
}

// Helper to search in text fields
function matchesQuery(photobook: Photobook, query: string): boolean {
  const searchFields = [
    photobook.titleEn,
    photobook.titleJp,
    photobook.actress,
  ].filter(Boolean)
  
  // Also search in image tag actresses
  if (photobook.imageTags) {
    const allActresses = photobook.imageTags.flatMap(tag => tag.actresses)
    searchFields.push(...allActresses)
  }
  
  const searchText = searchFields.join(' ').toLowerCase()
  return searchText.includes(query.toLowerCase())
}

// Helper to check if photobook contains actress
function containsActress(photobook: Photobook, actressName: string): boolean {
  // Check main actress field
  if (photobook.actress === actressName) {
    return true
  }
  
  // Check image tags
  if (photobook.imageTags) {
    return photobook.imageTags.some(tag => tag.actresses.includes(actressName))
  }
  
  return false
}

// GET /photobooks - List all photobooks
photobookApi.get('/photobooks', async (c) => {
  try {
    const photobooks = await kv.getByPrefix('photobook_')
    const results = photobooks.map(item => item.value)
    
    // Debug logging for first photobook releaseDate
    if (results.length > 0 && results[0].releaseDate) {
      console.log('Get photobooks - first photobook releaseDate:', results[0].releaseDate)
    }
    
    return c.json(results)
  } catch (error) {
    console.error('Get photobooks error:', error)
    return c.json({ error: 'Failed to fetch photobooks' }, 500)
  }
})

// GET /photobooks/search - Search photobooks
photobookApi.get('/photobooks/search', async (c) => {
  try {
    const query = c.req.query('q')
    if (!query) {
      return c.json([])
    }

    const photobooks = await kv.getByPrefix('photobook_')
    const filtered = photobooks
      .map(item => item.value as Photobook)
      .filter(photobook => matchesQuery(photobook, query))
    
    return c.json(filtered)
  } catch (error) {
    console.error('Search photobooks error:', error)
    return c.json({ error: 'Failed to search photobooks' }, 500)
  }
})

// GET /photobooks/by-actress/:name - Get photobooks containing specific actress
photobookApi.get('/photobooks/by-actress/:name', async (c) => {
  try {
    const actressName = decodeURIComponent(c.req.param('name'))
    if (!actressName) {
      return c.json([])
    }

    const photobooks = await kv.getByPrefix('photobook_')
    const filtered = photobooks
      .map(item => item.value as Photobook)
      .filter(photobook => containsActress(photobook, actressName))
    
    return c.json(filtered)
  } catch (error) {
    console.error('Get photobooks by actress error:', error)
    return c.json({ error: 'Failed to fetch photobooks by actress' }, 500)
  }
})

// GET /photobooks/:id - Get single photobook
photobookApi.get('/photobooks/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const photobook = await kv.get(`photobook_${id}`)
    
    if (!photobook) {
      return c.json({ error: 'Photobook not found' }, 404)
    }
    
    // Debug logging for releaseDate
    console.log('Get photobook - returning data with releaseDate:', photobook.releaseDate)
    
    return c.json(photobook)
  } catch (error) {
    console.error('Get photobook error:', error)
    return c.json({ error: 'Failed to fetch photobook' }, 500)
  }
})

// POST /photobooks - Create new photobook
photobookApi.post('/photobooks', async (c) => {
  try {
    const photobookData = await c.req.json() as Photobook
    
    // Validate required fields
    if (!photobookData.titleEn?.trim()) {
      return c.json({ error: 'English title is required' }, 400)
    }
    
    // Generate ID and set metadata
    const id = generatePhotobookId()
    
    // Debug logging for releaseDate
    console.log('Creating photobook - received releaseDate:', photobookData.releaseDate)
    
    const photobook: Photobook = {
      ...photobookData,
      id,
      titleEn: photobookData.titleEn.trim(),
      titleJp: photobookData.titleJp?.trim() || '',
      link: photobookData.link?.trim() || '',
      cover: photobookData.cover?.trim() || '',
      releaseDate: photobookData.releaseDate?.trim() || '',
      actress: photobookData.actress?.trim() || '',
      imageLinks: photobookData.imageLinks?.trim() || '',
      imageTags: photobookData.imageTags || []
    }
    
    console.log('Saving photobook with releaseDate:', photobook.releaseDate)
    
    await kv.set(`photobook_${id}`, photobook)
    
    return c.json(photobook)
  } catch (error) {
    console.error('Create photobook error:', error)
    return c.json({ error: 'Failed to create photobook' }, 500)
  }
})

// PUT /photobooks/:id - Update photobook
photobookApi.put('/photobooks/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const updates = await c.req.json() as Partial<Photobook>
    
    // Get existing photobook
    const existing = await kv.get(`photobook_${id}`)
    if (!existing) {
      return c.json({ error: 'Photobook not found' }, 404)
    }
    
    // Validate required fields
    if (updates.titleEn !== undefined && !updates.titleEn?.trim()) {
      return c.json({ error: 'English title is required' }, 400)
    }
    
    // Debug logging for releaseDate update
    console.log('Updating photobook - received releaseDate:', updates.releaseDate)
    console.log('Existing releaseDate:', existing.releaseDate)
    
    // Merge updates
    const photobook: Photobook = {
      ...existing,
      ...updates,
      id, // Ensure ID doesn't change
      titleEn: updates.titleEn?.trim() || existing.titleEn,
      titleJp: updates.titleJp?.trim() ?? existing.titleJp,
      link: updates.link?.trim() ?? existing.link,
      cover: updates.cover?.trim() ?? existing.cover,
      releaseDate: updates.releaseDate?.trim() ?? existing.releaseDate,
      actress: updates.actress?.trim() ?? existing.actress,
      imageLinks: updates.imageLinks?.trim() ?? existing.imageLinks,
      imageTags: updates.imageTags ?? existing.imageTags
    }
    
    console.log('Saving updated photobook with releaseDate:', photobook.releaseDate)
    
    await kv.set(`photobook_${id}`, photobook)
    
    return c.json(photobook)
  } catch (error) {
    console.error('Update photobook error:', error)
    return c.json({ error: 'Failed to update photobook' }, 500)
  }
})

// DELETE /photobooks/:id - Delete photobook
photobookApi.delete('/photobooks/:id', async (c) => {
  try {
    const id = c.req.param('id')
    
    // Check if photobook exists
    const existing = await kv.get(`photobook_${id}`)
    if (!existing) {
      return c.json({ error: 'Photobook not found' }, 404)
    }
    
    await kv.del(`photobook_${id}`)
    
    return c.json({ message: 'Photobook deleted successfully' })
  } catch (error) {
    console.error('Delete photobook error:', error)
    return c.json({ error: 'Failed to delete photobook' }, 500)
  }
})

export { photobookApi }

// Also export as default for compatibility
export default photobookApi