import { projectId, publicAnonKey } from './supabase/info'

export interface CustomNavItem {
  id: string
  label: string
  filterType: string
  filterValue: string
  order?: number
  userId?: string
  createdAt?: string
}

class CustomNavApi {
  private baseUrl: string
  private getHeaders(accessToken: string) {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    }
  }

  constructor() {
    this.baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-f3064b20`
  }

  async getCustomNavItems(accessToken: string): Promise<CustomNavItem[]> {
    try {
      const response = await fetch(`${this.baseUrl}/custom-nav-items`, {
        method: 'GET',
        headers: this.getHeaders(accessToken)
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to fetch custom nav items: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      return data.items || []
    } catch (error) {
      console.error('Error fetching custom nav items:', error)
      return []
    }
  }

  async saveCustomNavItems(accessToken: string, items: CustomNavItem[]): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/custom-nav-items`, {
        method: 'POST',
        headers: this.getHeaders(accessToken),
        body: JSON.stringify({ items })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to save custom nav items: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      console.error('Error saving custom nav items:', error)
      throw error
    }
  }

  async deleteCustomNavItem(accessToken: string, itemId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/custom-nav-items/${itemId}`, {
        method: 'DELETE',
        headers: this.getHeaders(accessToken)
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to delete custom nav item: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      console.error('Error deleting custom nav item:', error)
      throw error
    }
  }

  async reorderCustomNavItems(accessToken: string, itemOrders: { id: string, order: number }[]): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/custom-nav-items/reorder`, {
        method: 'POST',
        headers: this.getHeaders(accessToken),
        body: JSON.stringify({ itemOrders })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to reorder custom nav items: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      console.error('Error reordering custom nav items:', error)
      throw error
    }
  }
}

export const customNavApi = new CustomNavApi()