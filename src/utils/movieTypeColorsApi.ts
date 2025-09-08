import { projectId, publicAnonKey } from './supabase/info'

/**
 * Movie Type Colors API - Handles database operations for movie type color settings
 */

export interface MovieTypeColorConfig {
  [type: string]: string
}

const getAuthHeader = (accessToken?: string) => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${accessToken || publicAnonKey}`,
})

export const movieTypeColorsApi = {
  /**
   * Get movie type colors from database
   */
  async getColors(accessToken: string): Promise<MovieTypeColorConfig> {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-f3064b20/movie-type-colors`, {
        headers: getAuthHeader(accessToken),
      })
      
      const responseText = await response.text()
      console.log('Raw server response (GET):', responseText)
      
      let result
      try {
        result = JSON.parse(responseText)
      } catch (parseError) {
        console.log('Failed to parse server response as JSON (GET):', parseError)
        throw new Error(`Server returned invalid JSON: ${responseText}`)
      }
      
      if (!response.ok) {
        console.log('Get movie type colors API error:', result)
        throw new Error(result.error || 'Failed to fetch movie type colors')
      }
      
      return result.colors || {}
    } catch (error) {
      console.log('Get movie type colors exception:', error)
      throw error
    }
  },

  /**
   * Save movie type colors to database
   */
  async saveColors(colors: MovieTypeColorConfig, accessToken: string): Promise<void> {
    try {
      const requestBody = JSON.stringify({ colors })
      console.log('Sending colors to server:', requestBody)
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-f3064b20/movie-type-colors`, {
        method: 'POST',
        headers: getAuthHeader(accessToken),
        body: requestBody,
      })
      
      const responseText = await response.text()
      console.log('Raw server response:', responseText)
      
      let result
      try {
        result = JSON.parse(responseText)
      } catch (parseError) {
        console.log('Failed to parse server response as JSON:', parseError)
        throw new Error(`Server returned invalid JSON: ${responseText}`)
      }
      
      if (!response.ok) {
        console.log('Save movie type colors API error:', result)
        throw new Error(result.error || 'Failed to save movie type colors')
      }
      
      console.log('Movie type colors saved successfully to database')
    } catch (error) {
      console.log('Save movie type colors exception:', error)
      throw error
    }
  },

  /**
   * Reset movie type colors to defaults in database
   */
  async resetColors(defaultColors: MovieTypeColorConfig, accessToken: string): Promise<void> {
    try {
      const requestBody = JSON.stringify({ colors: defaultColors })
      console.log('Sending reset colors to server:', requestBody)
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-f3064b20/movie-type-colors`, {
        method: 'PUT',
        headers: getAuthHeader(accessToken),
        body: requestBody,
      })
      
      const responseText = await response.text()
      console.log('Raw server response (RESET):', responseText)
      
      let result
      try {
        result = JSON.parse(responseText)
      } catch (parseError) {
        console.log('Failed to parse server response as JSON (RESET):', parseError)
        throw new Error(`Server returned invalid JSON: ${responseText}`)
      }
      
      if (!response.ok) {
        console.log('Reset movie type colors API error:', result)
        throw new Error(result.error || 'Failed to reset movie type colors')
      }
      
      console.log('Movie type colors reset successfully in database')
    } catch (error) {
      console.log('Reset movie type colors exception:', error)
      throw error
    }
  }
}
