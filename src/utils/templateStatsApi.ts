import { projectId, publicAnonKey } from './supabase/info'

const getAuthHeader = (accessToken: string): Record<string, string> => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${accessToken}`,
})

export interface TemplateStats {
  groupTemplates: number
}

export const templateStatsApi = {
  async getTemplateCounts(accessToken: string): Promise<TemplateStats> {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-e0516fcf/template-counts`, {
        headers: getAuthHeader(accessToken),
      })
      
      const result = await response.json()
      if (!response.ok) {
        console.log('Get template counts API error:', result)
        throw new Error(result.error || 'Failed to fetch template counts')
      }
      
      return result
    } catch (error) {
      console.log('Get template counts exception:', error)
      throw error
    }
  }
}
