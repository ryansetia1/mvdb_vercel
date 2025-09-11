import { MasterDataItem } from '../../../utils/masterDataApi'
import { Movie } from '../../../utils/movieApi'
import { SCMovie } from '../../../utils/scMovieApi'
import { Photobook } from '../../../utils/photobookApi'

export interface ProfileContentProps {
  type: 'actor' | 'actress' | 'director'
  name: string
  accessToken: string
  searchQuery?: string
  onBack: () => void
  onMovieSelect: (movie: Movie | string) => void
  onSCMovieSelect?: (scMovie: SCMovie | string) => void
  onPhotobookSelect?: (photobook: Photobook) => void
  onGroupSelect?: (groupName: string) => void
  onEditProfile?: (type: 'actor' | 'actress' | 'director', name: string) => void
}

export interface ProfileState {
  profile: MasterDataItem | null
  movies: Movie[]
  photobooks: Photobook[]
  isLoading: boolean
  error: string
  selectedPhotobook: Photobook | null
  lightboxOpen: boolean
  lightboxIndex: number
  lightboxImages: string[]
  profileLightboxOpen: boolean
  profileLightboxIndex: number
  profileImages: string[]
  activeTab: string
  galleryTab: 'all' | 'nn' | 'n'
}