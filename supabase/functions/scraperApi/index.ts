import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

interface ScrapeRequest {
  movieCode: string
}

interface ScrapedData {
  titleEn: string
  series: string
  movieCode: string
  dmcode: string
  releaseDate: string
  duration: string
  studio: string
  director: string
  actresses: string[]
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { movieCode }: ScrapeRequest = await req.json()
    
    if (!movieCode) {
      return new Response('Movie code is required', { status: 400 })
    }

    // Scrape data from javdatabase.com
    const scrapedData = await scrapeJavDatabase(movieCode)
    
    return new Response(JSON.stringify(scrapedData), {
      headers: { 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Scraper error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})

async function scrapeJavDatabase(movieCode: string): Promise<ScrapedData> {
  try {
    const url = `https://www.javdatabase.com/movies/${movieCode}/`
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const html = await response.text()
    
    // Parse HTML content
    const data = parseHtmlContent(html, movieCode)
    
    return data
    
  } catch (error) {
    console.error('Error scraping javdatabase:', error)
    throw new Error(`Failed to scrape data: ${error.message}`)
  }
}

function parseHtmlContent(html: string, movieCode: string): ScrapedData {
  // Simple HTML parsing - in a real implementation, you'd use a proper HTML parser
  const lines = html.split('\n').map(line => line.trim()).filter(line => line.length > 0)
  
  let titleEn = ''
  let series = ''
  let dmcode = ''
  let releaseDate = ''
  let duration = ''
  let studio = ''
  let director = ''
  let actresses: string[] = []
  
  let foundTitle = false
  let foundActresses = false
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    if (line.includes('Title:') && !foundTitle) {
      foundTitle = true
      // Extract title from the line
      const titleMatch = line.match(/Title:\s*(.+)/i)
      if (titleMatch) {
        titleEn = titleMatch[1].trim()
      }
    } else if (foundTitle && !foundActresses) {
      // Extract other fields
      if (line.includes('Series:')) {
        const seriesMatch = line.match(/Series:\s*(.+)/i)
        if (seriesMatch) {
          series = seriesMatch[1].trim()
        }
      } else if (line.includes('Content ID:') || line.includes('DM Code:')) {
        const dmcodeMatch = line.match(/(?:Content ID|DM Code):\s*(.+)/i)
        if (dmcodeMatch) {
          dmcode = dmcodeMatch[1].trim()
        }
      } else if (line.includes('Release Date:')) {
        const dateMatch = line.match(/Release Date:\s*(.+)/i)
        if (dateMatch) {
          releaseDate = dateMatch[1].trim()
        }
      } else if (line.includes('Runtime:') || line.includes('Duration:')) {
        const durationMatch = line.match(/(?:Runtime|Duration):\s*(.+)/i)
        if (durationMatch) {
          duration = durationMatch[1].trim()
        }
      } else if (line.includes('Studio:')) {
        const studioMatch = line.match(/Studio:\s*(.+)/i)
        if (studioMatch) {
          studio = studioMatch[1].trim()
        }
      } else if (line.includes('Director:')) {
        const directorMatch = line.match(/Director:\s*(.+)/i)
        if (directorMatch) {
          director = directorMatch[1].trim()
        }
      } else if (line.includes('Idol(s)/Actress(es):') || line.includes('Actress(es):')) {
        foundActresses = true
        const actressMatch = line.match(/(?:Idol\(s\)\/Actress\(es\)|Actress\(es\)):\s*(.+)/i)
        if (actressMatch) {
          actresses = actressMatch[1].split(',').map(a => a.trim()).filter(a => a.length > 0)
        }
        break
      }
    }
  }
  
  return {
    titleEn: titleEn || movieCode,
    series: series || '',
    movieCode: movieCode,
    dmcode: dmcode || '',
    releaseDate: releaseDate || '',
    duration: duration || '',
    studio: studio || '',
    director: director || '',
    actresses: actresses.length > 0 ? actresses : []
  }
}
