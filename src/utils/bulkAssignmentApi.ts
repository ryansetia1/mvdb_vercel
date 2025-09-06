import { projectId, publicAnonKey } from './supabase/info'

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-e0516fcf`

export interface BulkMetadataAssignmentRequest {
  movieIds: string[]
  metadataType: 'studio' | 'series' | 'type' | 'label' | 'tag'
  metadataValue: string
}

export interface BulkCastAssignmentRequest {
  movieIds: string[]
  castType: 'actress' | 'actors' | 'director'
  castMembers: string[]
  assignmentMode?: 'replace' | 'append'
}

export interface BulkTemplateAssignmentRequest {
  movieIds: string[]
  templateGroupId: string
  templateUrl: string
  galleryTemplate?: string
  applicableStudios?: string[]
}

export interface BulkAssignmentResponse {
  success: boolean
  updatedCount: number
  updatedMovies: string[]
  metadataType?: string
  metadataValue?: string
  castType?: string
  castMembers?: string[]
  assignmentMode?: string
  templateGroupId?: string
}

export const bulkAssignmentApi = {
  // Assign metadata to multiple movies
  async assignMetadata(request: BulkMetadataAssignmentRequest, accessToken: string): Promise<BulkAssignmentResponse> {
    console.log('=== BulkAssignmentAPI: START Assigning metadata ===')
    console.log('Request details:', {
      movieIds: request.movieIds,
      metadataType: request.metadataType,
      metadataValue: request.metadataValue,
      movieIdsCount: request.movieIds.length,
      accessTokenPresent: !!accessToken,
      accessTokenLength: accessToken?.length
    })
    console.log('Full URL:', `${BASE_URL}/bulk/assign-metadata`)
    
    const response = await fetch(`${BASE_URL}/bulk/assign-metadata`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    })

    console.log('BulkAssignmentAPI: Response status:', response.status)
    console.log('BulkAssignmentAPI: Response headers:', Object.fromEntries(response.headers.entries()))

    const responseText = await response.text()
    console.log('BulkAssignmentAPI: Raw response text:', responseText)

    if (!response.ok) {
      console.error('BulkAssignmentAPI: Error response status:', response.status)
      let error
      try {
        error = JSON.parse(responseText)
      } catch (e) {
        error = { error: responseText || `HTTP ${response.status}` }
      }
      console.error('BulkAssignmentAPI: Parsed error response:', error)
      throw new Error(error.error || 'Failed to assign metadata')
    }

    let result
    try {
      result = JSON.parse(responseText)
    } catch (e) {
      console.error('BulkAssignmentAPI: Failed to parse success response as JSON:', e)
      throw new Error('Invalid JSON response from server')
    }
    
    console.log('BulkAssignmentAPI: Parsed success response:', result)
    console.log('=== BulkAssignmentAPI: END Assigning metadata ===')
    return result
  },

  // Assign cast to multiple movies
  async assignCast(request: BulkCastAssignmentRequest, accessToken: string): Promise<BulkAssignmentResponse> {
    console.log('BulkAssignmentAPI: Assigning cast:', request)
    
    const response = await fetch(`${BASE_URL}/bulk/assign-cast`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    })

    console.log('BulkAssignmentAPI: Response status:', response.status)

    if (!response.ok) {
      const error = await response.json()
      console.error('BulkAssignmentAPI: Error response:', error)
      throw new Error(error.error || 'Failed to assign cast')
    }

    const result = await response.json()
    console.log('BulkAssignmentAPI: Success response:', result)
    return result
  },

  // Apply template group to multiple movies
  async assignTemplate(request: BulkTemplateAssignmentRequest, accessToken: string): Promise<BulkAssignmentResponse> {
    console.log('BulkAssignmentAPI: Assigning template:', request)
    
    const response = await fetch(`${BASE_URL}/bulk/assign-template`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    })

    console.log('BulkAssignmentAPI: Response status:', response.status)

    if (!response.ok) {
      const error = await response.json()
      console.error('BulkAssignmentAPI: Error response:', error)
      throw new Error(error.error || 'Failed to assign template')
    }

    const result = await response.json()
    console.log('BulkAssignmentAPI: Success response:', result)
    return result
  }
}