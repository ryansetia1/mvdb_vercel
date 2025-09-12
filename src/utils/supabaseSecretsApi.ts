/**
 * Supabase Secrets API Integration
 * Mengambil API key dari Supabase secrets
 */

const SUPABASE_FUNCTION_URL = (import.meta as any).env?.VITE_SUPABASE_FUNCTION_URL || 'https://duafhkktqobwwwwtygwn.supabase.co/functions/v1/make-server-e0516fcf'

export interface SupabaseSecretsResponse {
  success: boolean
  value?: string
  error?: string
}

/**
 * Get API key from Supabase secrets
 */
export async function getApiKeyFromSupabaseSecrets(accessToken: string, keyName: string = 'mvdb3'): Promise<string | null> {
  try {
    console.log(`Getting secret ${keyName} from Supabase...`)
    console.log('Function URL:', SUPABASE_FUNCTION_URL)
    console.log('Access token present:', accessToken ? 'yes' : 'no')
    
    const response = await fetch(`${SUPABASE_FUNCTION_URL}/kv-store/get/${keyName}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    console.log(`Response status: ${response.status} ${response.statusText}`)

    if (!response.ok) {
      console.warn(`Failed to get secret ${keyName}:`, response.status, response.statusText)
      return null
    }

    const data = await response.json()
    console.log(`Supabase secrets response for ${keyName}:`, data)
    
    if (data.success && data.value) {
      console.log(`Secret ${keyName} found with value length:`, data.value.length)
      return data.value
    }
    
    console.log(`Secret ${keyName} not found or empty`)
    return null
  } catch (error) {
    console.warn(`Error getting secret ${keyName}:`, error)
    return null
  }
}

/**
 * Check if API key exists in Supabase secrets
 */
export async function checkApiKeyInSupabaseSecrets(accessToken: string, keyName: string = 'mvdb3'): Promise<boolean> {
  try {
    const response = await fetch(`${SUPABASE_FUNCTION_URL}/kv-store/get/${keyName}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      return false
    }

    const data = await response.json()
    return data.success === true && data.value
  } catch (error) {
    console.warn(`Error checking secret ${keyName}:`, error)
    return false
  }
}
