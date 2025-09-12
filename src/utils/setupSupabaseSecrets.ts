/**
 * Setup Supabase Secrets untuk API Key dengan dynamic project support
 * Fungsi untuk menambahkan API key ke Supabase secrets
 */

import { getApiKeyFromSupabaseSecrets } from './supabaseSecretsApi'
import { getProjectConfig } from './projectConfigManager'

const getSupabaseFunctionUrl = () => {
  const config = getProjectConfig()
  return config.functionUrl
}

/**
 * Set API key in Supabase secrets
 */
export async function setApiKeyInSupabaseSecrets(accessToken: string, keyName: string, keyValue: string): Promise<boolean> {
  try {
    const functionUrl = getSupabaseFunctionUrl()
    const response = await fetch(`${functionUrl}/kv-store/set`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        key: keyName,
        value: keyValue
      })
    })

    if (!response.ok) {
      console.warn(`Failed to set secret ${keyName}:`, response.status, response.statusText)
      return false
    }

    const data = await response.json()
    console.log(`Set secret ${keyName} response:`, data)
    
    return data.success === true
  } catch (error) {
    console.warn(`Error setting secret ${keyName}:`, error)
    return false
  }
}

/**
 * Setup OpenRouter API key in Supabase secrets
 */
export async function setupOpenRouterApiKey(accessToken: string, apiKey: string): Promise<boolean> {
  try {
    // Set the API key in Supabase secrets
    const success = await setApiKeyInSupabaseSecrets(accessToken, 'mvdb3', apiKey)
    
    if (success) {
      console.log('OpenRouter API key berhasil disimpan di Supabase secrets')
      return true
    } else {
      console.error('Gagal menyimpan OpenRouter API key di Supabase secrets')
      return false
    }
  } catch (error) {
    console.error('Error setting up OpenRouter API key:', error)
    return false
  }
}

/**
 * Check if API key exists and setup if needed
 */
export async function ensureApiKeyExists(accessToken: string, apiKey: string): Promise<boolean> {
  try {
    // Check if API key already exists
    const existingKey = await getApiKeyFromSupabaseSecrets(accessToken, 'mvdb3')
    
    if (existingKey) {
      console.log('API key sudah ada di Supabase secrets')
      return true
    }
    
    // Setup API key if it doesn't exist
    console.log('API key tidak ditemukan, menyimpan ke Supabase secrets...')
    return await setupOpenRouterApiKey(accessToken, apiKey)
  } catch (error) {
    console.error('Error ensuring API key exists:', error)
    return false
  }
}
