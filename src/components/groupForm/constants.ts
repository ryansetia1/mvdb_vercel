export const GROUP_FORM_CONSTANTS = {
  VALIDATION: {
    NAME_REQUIRED: 'Group name is required'
  },
  MESSAGES: {
    CREATE_SUCCESS: 'Group created successfully',
    UPDATE_SUCCESS: 'Group updated successfully',
    DELETE_SUCCESS: 'Group deleted successfully',
    LOAD_ERROR: 'Failed to load groups',
    CREATE_ERROR: 'Failed to create group',
    UPDATE_ERROR: 'Failed to update group',
    DELETE_ERROR: 'Failed to delete group'
  },
  PLACEHOLDERS: {
    GROUP_NAME: 'e.g., MILF, Teen, etc.',
    JP_NAME: 'e.g., 人妻, etc.',
    PROFILE_PICTURE: 'https://example.com/group-image.jpg',
    WEBSITE: 'https://example.com/group-website',
    DESCRIPTION: 'Brief description of this group...',
    GALLERY_URL: 'https://example.com/gallery-photo.jpg'
  },
  LABELS: {
    GROUP_NAME: 'Group Name *',
    JP_NAME: 'Group Japanese Name',
    PROFILE_PICTURE: 'Group Profile Picture URL',
    WEBSITE: 'Website URL',
    DESCRIPTION: 'Description',
    PREVIEW: 'Preview',
    GALLERY: 'Gallery Photos',
    ADD_GALLERY_URL: 'Add Gallery Photo'
  },
  HELPER_TEXT: {
    PROFILE_PICTURE: 'This image will be shown when filtering actresses by this group',
    WEBSITE: 'Official website or reference page for this group',
    GALLERY: 'Add multiple photo URLs to create a gallery for this group'
  }
}

export const EMPTY_FORM_DATA = {
  name: '',
  jpname: '',
  profilePicture: '',
  website: '',
  description: '',
  gallery: [] as string[]
}