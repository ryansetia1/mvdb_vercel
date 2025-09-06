export interface ManualLink {
  url: string
  actresses: string[]
  contentRating?: 'NN' | 'N' | null
}

export interface ImageLinksManagerProps {
  label: string
  imageLinks: string
  onImageLinksChange: (links: string) => void
  imageTags: ImageTag[]
  onImageTagsChange: (tags: ImageTag[]) => void
  placeholder?: string
  dmcode?: string
  accessToken: string
  selectedActresses?: string[] // New: restrict actress selection to these
}

export interface ManualLinksSectionProps {
  manualLinks: ManualLink[]
  onManualLinksChange: (links: ManualLink[]) => void
  accessToken: string
  placeholder?: string
  selectedActresses?: string[] // New: restrict actress selection to these
}

export type ContentRatingSelectValue = 'NN' | 'N' | 'none'

// Re-export ImageTag from the main API
export type { ImageTag } from '../../utils/photobookApi'