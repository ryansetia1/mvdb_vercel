import { projectId, publicAnonKey } from './supabase/info'

export interface MovieLink {
  id: string
  primaryMovieId: string
  linkedMovieId: string
  description?: string
  createdAt: string
  updatedAt: string
}

export interface CreateMovieLinkData {
  primaryMovieId: string
  linkedMovieId: string
  description?: string
}

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-e0516fcf`

export const movieLinksApi = {
  // Get all movie links
  async getMovieLinks(accessToken: string): Promise<MovieLink[]> {
    const response = await fetch(`${BASE_URL}/movie-links`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
        'X-Access-Token': accessToken
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to fetch movie links: ${response.status} ${errorText}`)
    }

    return response.json()
  },

  // Get movie links for a specific movie
  async getMovieLinksForMovie(accessToken: string, movieId: string): Promise<MovieLink[]> {
    const response = await fetch(`${BASE_URL}/movie-links/movie/${movieId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
        'X-Access-Token': accessToken
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to fetch movie links for movie: ${response.status} ${errorText}`)
    }

    return response.json()
  },

  // Create a new movie link
  async createMovieLink(accessToken: string, linkData: CreateMovieLinkData): Promise<MovieLink> {
    const response = await fetch(`${BASE_URL}/movie-links`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
        'X-Access-Token': accessToken
      },
      body: JSON.stringify(linkData)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to create movie link: ${response.status} ${errorText}`)
    }

    return response.json()
  },

  // Delete a movie link
  async deleteMovieLink(accessToken: string, linkId: string): Promise<void> {
    const response = await fetch(`${BASE_URL}/movie-links/${linkId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
        'X-Access-Token': accessToken
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to delete movie link: ${response.status} ${errorText}`)
    }
  },

  // Get bidirectional links for a movie (both where it's primary and where it's linked)
  async getBidirectionalLinksForMovie(accessToken: string, movieId: string): Promise<{
    asMain: MovieLink[]
    asLinked: MovieLink[]
  }> {
    const response = await fetch(`${BASE_URL}/movie-links/bidirectional/${movieId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
        'X-Access-Token': accessToken
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to fetch bidirectional movie links: ${response.status} ${errorText}`)
    }

    return response.json()
  }
}