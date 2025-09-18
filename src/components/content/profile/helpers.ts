import { MasterDataItem } from '../../../utils/masterDataApi'

export const processProfileImages = (profile: MasterDataItem | null): string[] => {
  if (!profile) return []
  
  const images: string[] = []
  
  // Add main profile picture
  if (profile.profilePicture) {
    images.push(profile.profilePicture)
  }
  
  // Add additional photos from photo array
  if (profile.photo && Array.isArray(profile.photo)) {
    images.push(...profile.photo)
  }
  
  // Remove duplicates and filter out empty strings
  return [...new Set(images)].filter(img => img.trim())
}

export const getAllProfileImages = (profile: MasterDataItem | null): string[] => {
  if (!profile) return []
  
  const images: string[] = []
  
  // First priority: Add main profile picture
  if (profile.profilePicture && profile.profilePicture.trim()) {
    const mainPic = profile.profilePicture.trim()
    images.push(mainPic)
  }
  
  // Second priority: Add additional photos from photo array
  if (profile.photo && Array.isArray(profile.photo)) {
    profile.photo.forEach(photo => {
      if (typeof photo === 'string' && photo.trim() && !images.includes(photo.trim())) {
        images.push(photo.trim())
      }
    })
  }
  
  // Third priority: Add group-specific photos
  if (profile.groupData && typeof profile.groupData === 'object') {
    Object.values(profile.groupData).forEach((groupInfo: any) => {
      if (groupInfo && typeof groupInfo === 'object') {
        // Add group profilePicture
        if (groupInfo.profilePicture && groupInfo.profilePicture.trim()) {
          const groupPic = groupInfo.profilePicture.trim()
          if (!images.includes(groupPic)) {
            images.push(groupPic)
          }
        }
        
        // Add group photos array
        if (groupInfo.photos && Array.isArray(groupInfo.photos)) {
          groupInfo.photos.forEach(photo => {
            if (typeof photo === 'string' && photo.trim() && !images.includes(photo.trim())) {
              images.push(photo.trim())
            }
          })
        }
      }
    })
  }
  
  // Fourth priority: Add generation-specific photos
  if (profile.generationData && typeof profile.generationData === 'object') {
    Object.values(profile.generationData).forEach((generationInfo: any) => {
      if (generationInfo && typeof generationInfo === 'object') {
        // Add generation profilePicture
        if (generationInfo.profilePicture && generationInfo.profilePicture.trim()) {
          const generationPic = generationInfo.profilePicture.trim()
          if (!images.includes(generationPic)) {
            images.push(generationPic)
          }
        }
        
        // Add generation photos array
        if (generationInfo.photos && Array.isArray(generationInfo.photos)) {
          generationInfo.photos.forEach(photo => {
            if (typeof photo === 'string' && photo.trim() && !images.includes(photo.trim())) {
              images.push(photo.trim())
            }
          })
        }
        
        // Add generation photo versions
        if (generationInfo.photoVersions && typeof generationInfo.photoVersions === 'object') {
          Object.values(generationInfo.photoVersions).forEach((versionInfo: any) => {
            if (versionInfo && typeof versionInfo === 'object' && versionInfo.photos && Array.isArray(versionInfo.photos)) {
              versionInfo.photos.forEach(photo => {
                if (typeof photo === 'string' && photo.trim() && !images.includes(photo.trim())) {
                  images.push(photo.trim())
                }
              })
            }
          })
        }
      }
    })
  }
  
  // Fifth priority: Add lineup-specific photos
  if (profile.lineupData && typeof profile.lineupData === 'object') {
    Object.values(profile.lineupData).forEach((lineupInfo: any) => {
      if (lineupInfo && typeof lineupInfo === 'object') {
        // Add lineup profilePicture
        if (lineupInfo.profilePicture && lineupInfo.profilePicture.trim()) {
          const lineupPic = lineupInfo.profilePicture.trim()
          if (!images.includes(lineupPic)) {
            images.push(lineupPic)
          }
        }
        
        // Add lineup photos array
        if (lineupInfo.photos && Array.isArray(lineupInfo.photos)) {
          lineupInfo.photos.forEach(photo => {
            if (typeof photo === 'string' && photo.trim() && !images.includes(photo.trim())) {
              images.push(photo.trim())
            }
          })
        }
        
        // Add lineup photo versions
        if (lineupInfo.photoVersions && typeof lineupInfo.photoVersions === 'object') {
          Object.values(lineupInfo.photoVersions).forEach((versionInfo: any) => {
            if (versionInfo && typeof versionInfo === 'object' && versionInfo.photos && Array.isArray(versionInfo.photos)) {
              versionInfo.photos.forEach(photo => {
                if (typeof photo === 'string' && photo.trim() && !images.includes(photo.trim())) {
                  images.push(photo.trim())
                }
              })
            }
          })
        }
      }
    })
  }
  
  // Add groupProfilePictures (also at the end)
  if (profile.groupProfilePictures && typeof profile.groupProfilePictures === 'object') {
    Object.values(profile.groupProfilePictures).forEach(groupPic => {
      if (typeof groupPic === 'string' && groupPic.trim() && !images.includes(groupPic.trim())) {
        images.push(groupPic.trim())
      }
    })
  }
  
  return images
}