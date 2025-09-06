import { createClient } from '@supabase/supabase-js'
import { projectId, publicAnonKey } from './supabase/info'

const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
)

export const auth = {
  // Expose the supabase client for auth state management
  client: supabase,
  
  async signUp(email: string, password: string, name: string) {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-e0516fcf/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ email, password, name }),
      })
      
      return await response.json()
    } catch (error) {
      console.log('Auth signup error:', error)
      throw error
    }
  },

  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        console.log('Auth signin error:', error)
        throw error
      }
      
      return data
    } catch (error) {
      console.log('Auth signin exception:', error)
      throw error
    }
  },

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.log('Auth signout error:', error)
        throw error
      }
    } catch (error) {
      console.log('Auth signout exception:', error)
      throw error
    }
  },

  async getSession() {
    try {
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        console.log('Auth get session error:', error)
        throw error
      }
      return data
    } catch (error) {
      console.log('Auth get session exception:', error)
      throw error
    }
  },

  // Get user data from current session
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) {
        console.log('Auth get user error:', error)
        throw error
      }
      return user
    } catch (error) {
      console.log('Auth get user exception:', error)
      throw error
    }
  }
}