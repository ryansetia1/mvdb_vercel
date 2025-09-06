import React from 'react'
import { UnifiedAppRenderContent } from './UnifiedAppRenderContent'
import { Movie } from '../utils/movieApi'
import { SCMovie } from '../utils/scMovieApi'
import { Photobook } from '../utils/photobookApi'
import { MasterDataItem } from '../utils/masterDataApi'
import { FilterState } from '../utils/filterStateManager'

interface ContentState {
  mode: string
  data?: any
  title?: string
}

interface UnifiedAppMainContentProps {
  contentState: ContentState
  navigationHistory: ContentState[]
  searchQuery: string
  movies: Movie[]
  photobooks: Photobook[]
  actors: MasterDataItem[]
  actresses: MasterDataItem[]
  directors: MasterDataItem[]
  accessToken: string
  showEditMovie: Movie | null
  showEditSCMovie: SCMovie | null
  showEditProfile: { type: 'actor' | 'actress' | 'director', name: string } | null
  advancedSearchFilters: any
  getCurrentFilters: (contentType: string) => FilterState
  handleFiltersChange: (contentType: string, filters: Partial<FilterState>) => void
  handleBack: () => void
  handleMovieSelect: (movie: Movie | string) => void
  handleSCMovieSelect: (scMovie: SCMovie | string) => void
  handlePhotobookSelect: (photobook: Photobook) => void
  handleProfileSelect: (type: 'actor' | 'actress' | 'director', name: string) => void
  handleGroupSelect: (groupName: string) => void
  handleEditMovie: (movie: Movie) => void
  handleEditSCMovie: (scMovie: SCMovie) => void
  handleEditProfile: (type: 'actor' | 'actress' | 'director', name: string) => void
  reloadData: () => Promise<void>
  reloadPhotobooks: () => Promise<void>
  setAdvancedSearchFilters: (filters: any) => void
  setShowEditMovie: (movie: Movie | null) => void
  setShowEditSCMovie: (scMovie: SCMovie | null) => void
  setShowEditProfile: (profile: { type: 'actor' | 'actress' | 'director', name: string } | null) => void
}

export function UnifiedAppMainContent(props: UnifiedAppMainContentProps) {
  return (
    <UnifiedAppRenderContent {...props} />
  )
}