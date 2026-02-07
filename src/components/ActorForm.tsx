import { useState, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { Checkbox } from './ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Plus, Trash2, Edit, Save, X, ExternalLink, User, Calendar, MapPin, Tag, Link as LinkIcon, Image as ImageIcon, Users, RotateCcw, Search, Clipboard, GripVertical, Sparkles } from 'lucide-react'
import { getDobFromGemini } from '../utils/geminiApi'
import { MasterDataItem, LabeledLink, masterDataApi } from '../utils/masterDataApi'
import { FlexibleDateInput } from './FlexibleDateInput'
import { MultipleTakuLinks } from './MultipleTakuLinks'
import { ClickableAvatar } from './ClickableAvatar'
import { ImageSearchIframe } from './ImageSearchIframe'
import { normalizeJapaneseNames, parseNameWithAliases, detectCharacterType } from '../utils/japaneseNameNormalizer'
import { toast } from 'sonner'

// Sortable Photo Component
interface SortablePhotoProps {
  photo: string
  index: number
  name: string
  onRemove: (index: number) => void
}

function SortablePhoto({ photo, index, name, onRemove }: SortablePhotoProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `photo-${index}` })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative transition-transform ${isDragging ? 'scale-105 shadow-lg z-50' : ''
        }`}
      {...attributes}
    >
      {/* Drag handle - only this area is draggable */}
      <div
        className="absolute top-1 left-1 h-5 w-5 rounded-full bg-muted hover:bg-muted/80 shadow-md hover:shadow-lg z-50 cursor-grab hover:cursor-grabbing flex items-center justify-center"
        {...listeners}
        title={`Drag untuk mengubah urutan`}
      >
        <GripVertical className="h-3 w-3 text-muted-foreground" />
      </div>

      <ClickableAvatar
        src={photo}
        alt={`${name} foto ${index + 1}`}
        fallback={(name || 'A').charAt(0)}
        size="xl"
      />

      {/* Remove button - separate from drag functionality */}
      <Button
        type="button"
        variant="destructive"
        size="sm"
        className="absolute top-1 right-1 h-5 w-5 rounded-full p-0 shadow-md hover:shadow-lg z-50"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onRemove(index)
        }}
        title={`Hapus foto ${index + 1}`}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  )
}

interface ActorFormProps {
  type: 'actor' | 'actress'
  accessToken: string
  onClose?: () => void
  initialData?: MasterDataItem
  onSaved?: (data: MasterDataItem) => void
}

interface FormData {
  name: string
  jpname: string
  kanjiName: string
  kanaName: string
  birthdate: Date | undefined
  alias: string
  tags: string
  profilePictures: string[] // Unified field for all photos/profile pictures
  links: LabeledLink[]
  takulinks: string[] // Now array for multiple links
  selectedGroups: string[] // For multiple group assignments (group names)
  groupProfilePictures: { [groupName: string]: string } // Group-specific profile pictures
  groupAliases: { [groupName: string]: string } // Group-specific aliases/stage names
  groupSameAsName: { [groupName: string]: boolean } // Checkbox for "Same as Name"
  selectedLineups: string[] // For multiple lineup assignments (lineup IDs)
  lineupProfilePictures: { [lineupId: string]: string } // Lineup-specific profile pictures
  lineupAliases: { [lineupId: string]: string } // Lineup-specific aliases/stage names
}

const initialFormData: FormData = {
  name: '',
  jpname: '',
  kanjiName: '',
  kanaName: '',
  birthdate: undefined,
  alias: '',
  tags: '',
  profilePictures: [''],
  links: [],
  takulinks: [''],
  selectedGroups: [],
  groupProfilePictures: {},
  groupAliases: {},
  groupSameAsName: {},
  selectedLineups: [],
  lineupProfilePictures: {},
  lineupAliases: {}
}

export function ActorForm({ type, accessToken, onClose, initialData, onSaved }: ActorFormProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [generations, setGenerations] = useState<MasterDataItem[]>([])
  const [groups, setGroups] = useState<MasterDataItem[]>([]) // Available groups for actresses
  const [lineups, setLineups] = useState<MasterDataItem[]>([]) // Available lineups for actresses
  const [hasUserChangedGroups, setHasUserChangedGroups] = useState(false) // Track if user manually changed groups
  const [showImageSearch, setShowImageSearch] = useState(false) // Control image search iframe visibility
  const [autoSearchImage, setAutoSearchImage] = useState(false) // Control auto search trigger
  const [autoSearchTakuLinks, setAutoSearchTakuLinks] = useState(false) // Control auto search for Taku Links
  const [activeTab, setActiveTab] = useState('basic') // Tab state
  const [isFixingAlias, setIsFixingAlias] = useState(false) // Loading state for fix alias
  const [isAskingAiDob, setIsAskingAiDob] = useState(false) // Loading state for AI DOB search

  // DnD Kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Reset autoSearchImage after it's been used
  useEffect(() => {
    if (autoSearchImage) {
      const timer = setTimeout(() => {
        setAutoSearchImage(false)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [autoSearchImage])

  // Reset autoSearchTakuLinks after it's been used
  useEffect(() => {
    if (autoSearchTakuLinks) {
      const timer = setTimeout(() => {
        setAutoSearchTakuLinks(false)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [autoSearchTakuLinks])

  // Auto-search trigger when tab changes
  useEffect(() => {
    if (activeTab === 'media' && (formData.jpname || formData.alias || formData.name)) {
      setShowImageSearch(true) // Show the iframe first
      setAutoSearchImage(true) // Then trigger auto-search
    } else if (activeTab === 'taku' && type === 'actress' && (formData.jpname || formData.alias || formData.name)) {
      setAutoSearchTakuLinks(true)
    }
  }, [activeTab, formData.jpname, formData.alias, formData.name, type])

  const isEditing = Boolean(initialData)

  // Load initial data when editing
  useEffect(() => {
    if (initialData) {
      loadInitialData(initialData)
    }
  }, [initialData])

  // Load groups for actresses
  useEffect(() => {
    if (type === 'actress') {
      loadGroups()
    }
  }, [type])

  // Update selectedGroups when groups are loaded and we have initial data
  useEffect(() => {
    if (initialData && groups.length > 0 && type === 'actress' && !hasUserChangedGroups) {
      console.log('=== ActorForm: Syncing groups ===')
      console.log('Initial data selectedGroups:', initialData.selectedGroups)
      console.log('Initial data groupId:', initialData.groupId)
      console.log('Initial data groupData:', initialData.groupData)
      console.log('Available groups:', groups.map(g => ({ id: g.id, name: g.name })))

      // Determine selectedGroups - prefer selectedGroups over legacy groupId
      let assignedGroups: string[] = []
      let groupProfilePictures: { [groupName: string]: string } = {}
      let groupAliases: { [groupName: string]: string } = {}

      if (initialData.selectedGroups && initialData.selectedGroups.length > 0) {
        // Use selectedGroups and validate they exist
        assignedGroups = initialData.selectedGroups.filter(groupName => {
          const groupExists = groups.find(g => g.name === groupName)
          if (groupExists) {
            console.log('ActorForm: Found group by name:', groupName)
            return true
          } else {
            console.log('ActorForm: Group not found by name:', groupName)
            return false
          }
        })
      } else if (initialData.groupId) {
        // Convert legacy groupId to selectedGroups
        const legacyGroup = groups.find(g => g.id === initialData.groupId)
        if (legacyGroup) {
          assignedGroups = [legacyGroup.name]
          console.log('ActorForm: Converting legacy groupId to selectedGroups:', legacyGroup.name)
        }
      }

      // Load group profile pictures and aliases from groupData if available
      if (initialData.groupData && typeof initialData.groupData === 'object') {
        Object.entries(initialData.groupData).forEach(([groupName, data]: [string, any]) => {
          if (data && typeof data === 'object') {
            if (data.profilePicture) {
              groupProfilePictures[groupName] = data.profilePicture
              console.log('ActorForm: Loaded group profile picture for', groupName, ':', data.profilePicture)
            }
            if (data.alias) {
              groupAliases[groupName] = data.alias
              console.log('ActorForm: Loaded group alias for', groupName, ':', data.alias)
            }
          }
        })
      }

      // Update form data if we found assignments and they're different from current
      const currentGroupsString = JSON.stringify(formData.selectedGroups.sort())
      const newGroupsString = JSON.stringify(assignedGroups.sort())

      if (newGroupsString !== currentGroupsString) {
        console.log('ActorForm: Setting selectedGroups from', formData.selectedGroups, 'to', assignedGroups)
        setFormData(prev => ({
          ...prev,
          selectedGroups: assignedGroups,
          groupProfilePictures: groupProfilePictures,
          groupAliases: groupAliases
        }))

        if (assignedGroups.length > 0) {
          toast.success(`${assignedGroups.length} grup telah dimuat: ${assignedGroups.join(', ')}`)
        }
      }
    }
  }, [groups, initialData, type, hasUserChangedGroups, JSON.stringify(formData.selectedGroups)])

  // Update selectedLineups when lineups are loaded and we have initial data
  useEffect(() => {
    if (initialData && lineups.length > 0 && type === 'actress') {
      console.log('=== ActorForm: Syncing lineups ===')
      console.log('Initial data lineupData:', initialData.lineupData)
      console.log('Available lineups:', lineups.map(l => ({ id: l.id, name: l.name })))

      // Determine selectedLineups from lineupData
      let assignedLineups: string[] = []
      let lineupProfilePictures: { [lineupId: string]: string } = {}
      let lineupAliases: { [lineupId: string]: string } = {}

      if (initialData.lineupData && typeof initialData.lineupData === 'object') {
        Object.entries(initialData.lineupData).forEach(([lineupId, data]: [string, any]) => {
          const lineupExists = lineups.find(l => l.id === lineupId)
          if (lineupExists) {
            assignedLineups.push(lineupId)
            console.log('ActorForm: Found lineup by id:', lineupId, lineupExists.name)

            if (data && typeof data === 'object') {
              if (data.profilePicture) {
                lineupProfilePictures[lineupId] = data.profilePicture
                console.log('ActorForm: Loaded lineup profile picture for', lineupId, ':', data.profilePicture)
              }
              if (data.alias) {
                lineupAliases[lineupId] = data.alias
                console.log('ActorForm: Loaded lineup alias for', lineupId, ':', data.alias)
              }
            }
          } else {
            console.log('ActorForm: Lineup not found by id:', lineupId)
          }
        })
      }

      console.log('ActorForm: Final assignedLineups:', assignedLineups)
      console.log('ActorForm: Final lineupProfilePictures:', lineupProfilePictures)
      console.log('ActorForm: Final lineupAliases:', lineupAliases)

      setFormData(prev => ({
        ...prev,
        selectedLineups: assignedLineups,
        lineupProfilePictures,
        lineupAliases
      }))
    }
  }, [initialData, lineups, type])

  const loadGroups = async () => {
    try {
      console.log('ActorForm: Loading groups, generations, and lineups...')
      const [groupsData, generationsData, lineupsData] = await Promise.all([
        masterDataApi.getByType('group', accessToken),
        masterDataApi.getByType('generation', accessToken),
        masterDataApi.getByType('lineup', accessToken)
      ])
      console.log('ActorForm: Loaded groups:', groupsData?.map(g => ({ id: g.id, name: g.name })))
      console.log('ActorForm: Loaded generations:', generationsData?.map(g => ({ id: g.id, name: g.name, groupId: g.groupId })))
      console.log('ActorForm: Loaded lineups:', lineupsData?.map(l => ({ id: l.id, name: l.name, generationId: l.generationId })))
      setGroups(groupsData || [])
      setGenerations(generationsData || [])
      setLineups(lineupsData || [])
    } catch (err) {
      console.error('Error loading groups and generations:', err)
    }
  }

  const loadInitialData = (data: MasterDataItem) => {
    // Parse birthdate
    let birthdate: Date | undefined = undefined
    if (data.birthdate) {
      try {
        birthdate = new Date(data.birthdate)
        if (isNaN(birthdate.getTime())) {
          birthdate = undefined
        }
      } catch (error) {
        console.error('Error parsing birthdate:', error)
      }
    }

    // Parse links
    let links: LabeledLink[] = []
    if (Array.isArray(data.links)) {
      links = data.links
    } else if (typeof data.links === 'string' && data.links.trim()) {
      links = [{
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        label: 'Website',
        url: data.links.trim()
      }]
    }

    // Combine profilePicture and photo arrays into one unified array
    let profilePictures: string[] = []
    if (data.profilePicture) {
      profilePictures.push(data.profilePicture)
    }
    if (data.photo && Array.isArray(data.photo)) {
      profilePictures.push(...data.photo)
    }
    // Remove duplicates and filter empty
    profilePictures = [...new Set(profilePictures)].filter(p => p.trim())
    if (profilePictures.length === 0) {
      profilePictures = ['']
    }

    // Parse taku links - convert from string to array
    let takulinks: string[] = []
    if (data.takulinks) {
      takulinks = data.takulinks.split('\n').filter(link => link.trim())
    }
    if (takulinks.length === 0) {
      takulinks = ['']
    }

    // Process groups and group profile pictures
    console.log('=== loadInitialData: Processing group assignment ===')
    console.log('data.selectedGroups:', data.selectedGroups)
    console.log('data.groupId:', data.groupId)
    console.log('data.groupData:', data.groupData)

    // Initial empty arrays - actual assignment happens in useEffect when groups are loaded

    setFormData({
      name: data.name || '',
      jpname: data.jpname || '',
      kanjiName: data.kanjiName || '',
      kanaName: data.kanaName || '',
      birthdate: birthdate,
      alias: data.alias || '',
      tags: data.tags || '',
      profilePictures: profilePictures,
      links: links,
      takulinks: takulinks,
      selectedGroups: [], // This will be updated when groups are loaded
      groupProfilePictures: {}, // This will be updated when groups are loaded
      groupAliases: {} // This will be updated when groups are loaded
    })
  }

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Nama wajib diisi'
    }

    // Check for valid URLs if provided
    formData.profilePictures.forEach((pic, index) => {
      if (pic.trim() && !isValidUrl(pic)) {
        newErrors[`profilePicture_${index}`] = `URL foto ${index + 1} tidak valid`
      }
    })

    // Check if all profile pictures are empty (at least one should have content for meaningful data)
    const hasAtLeastOnePhoto = formData.profilePictures.some(pic => pic.trim())
    if (!hasAtLeastOnePhoto && formData.profilePictures.length > 0) {
      // This is just a warning, not an error - user might want to save without photos
      console.log('ActorForm: No profile pictures provided - this is allowed but noted')
    }

    formData.links.forEach((link, index) => {
      if (link.url && !isValidUrl(link.url)) {
        newErrors[`link_${index}`] = `URL link ${index + 1} tidak valid`
      }
    })

    formData.takulinks.forEach((link, index) => {
      if (link.trim() && !isValidUrl(link)) {
        newErrors[`takulink_${index}`] = `Taku link ${index + 1} tidak valid`
      }
    })

    // Validate group profile pictures
    Object.entries(formData.groupProfilePictures).forEach(([groupName, url]) => {
      if (url && url.trim() && !isValidUrl(url)) {
        newErrors[`groupPic_${groupName}`] = `URL foto grup ${groupName} tidak valid`
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const calculateAge = (birthdate: Date): number => {
    const today = new Date()
    let age = today.getFullYear() - birthdate.getFullYear()
    const monthDiff = today.getMonth() - birthdate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthdate.getDate())) {
      age--
    }

    return age
  }

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear related errors
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleProfilePicturesChange = (index: number, value: string) => {
    const newPictures = [...formData.profilePictures]
    newPictures[index] = value

    // Update the pictures array directly without duplicate removal during typing
    // Duplicate removal will only happen during form submission
    handleInputChange('profilePictures', newPictures)

    // Clear related error
    if (errors[`profilePicture_${index}`]) {
      setErrors(prev => ({ ...prev, [`profilePicture_${index}`]: '' }))
    }
  }

  const addProfilePictureField = () => {
    handleInputChange('profilePictures', [...formData.profilePictures, ''])
  }

  const handleAddPhotoWithPaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text && (text.startsWith('http://') || text.startsWith('https://'))) {
        // Cari field kosong pertama atau tambah field baru jika semua terisi
        const emptyIndex = formData.profilePictures.findIndex(pic => !pic.trim())

        if (emptyIndex !== -1) {
          // Isi field kosong pertama
          const newProfilePictures = [...formData.profilePictures]
          newProfilePictures[emptyIndex] = text
          handleInputChange('profilePictures', newProfilePictures)
          toast.success('URL gambar berhasil dipaste ke field foto')
        } else {
          // Semua field terisi, tambah field baru
          const newProfilePictures = [...formData.profilePictures, text]
          handleInputChange('profilePictures', newProfilePictures)
          toast.success('Field foto baru ditambahkan dan URL gambar berhasil dipaste dari clipboard')
        }
      } else {
        toast.error('Clipboard tidak berisi URL gambar yang valid')
      }
    } catch (err) {
      toast.error('Gagal membaca dari clipboard')
    }
  }


  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    // Get only non-empty photos for reordering
    const nonEmptyPhotos = formData.profilePictures.filter(p => p.trim())
    const sourceIndex = nonEmptyPhotos.findIndex((_, i) => `photo-${i}` === active.id)
    const destinationIndex = nonEmptyPhotos.findIndex((_, i) => `photo-${i}` === over.id)

    if (sourceIndex === -1 || destinationIndex === -1 || sourceIndex === destinationIndex) {
      return
    }

    const newNonEmptyPhotos = arrayMove(nonEmptyPhotos, sourceIndex, destinationIndex)

    // Reconstruct the full array with empty fields in their original positions
    const newPictures = [...formData.profilePictures]
    let nonEmptyIndex = 0

    for (let i = 0; i < newPictures.length; i++) {
      if (newPictures[i].trim()) {
        newPictures[i] = newNonEmptyPhotos[nonEmptyIndex]
        nonEmptyIndex++
      }
    }

    handleInputChange('profilePictures', newPictures)
    toast.success(`Foto dipindahkan dari posisi ${sourceIndex + 1} ke posisi ${destinationIndex + 1}`)
  }

  const handleRemovePhotoFromPreview = (previewIndex: number) => {
    // Get the actual index in the full array
    const nonEmptyPhotos = formData.profilePictures.filter(p => p.trim())
    const photoToRemove = nonEmptyPhotos[previewIndex]

    // Find the actual index in the full array
    const actualIndex = formData.profilePictures.findIndex(pic => pic === photoToRemove)

    if (actualIndex !== -1) {
      const newPictures = [...formData.profilePictures]

      // Remove the field entirely instead of just clearing it
      newPictures.splice(actualIndex, 1)

      // Ensure we always have at least one empty field
      if (newPictures.length === 0) {
        newPictures.push('')
      }

      handleInputChange('profilePictures', newPictures)
      toast.success(`Foto ${previewIndex + 1} berhasil dihapus`)
    }
  }

  const handleImageSelect = (imageUrl: string) => {
    // Find the first empty field or add a new one
    const emptyIndex = formData.profilePictures.findIndex(pic => !pic.trim())

    if (emptyIndex !== -1) {
      // Fill the first empty field
      handleProfilePicturesChange(emptyIndex, imageUrl)
    } else {
      // Add a new field with the selected image
      handleInputChange('profilePictures', [...formData.profilePictures, imageUrl])
    }

    toast.success('URL gambar berhasil ditambahkan ke field foto')
  }

  const pasteToField = async (index: number) => {
    try {
      const text = await navigator.clipboard.readText()
      handleProfilePicturesChange(index, text)
      toast.success('URL berhasil ditempel dari clipboard')
    } catch (err) {
      toast.error('Gagal membaca dari clipboard')
    }
  }

  const removeProfilePictureField = (index: number) => {
    console.log(`ActorForm: Handling delete for profile picture field at index ${index}`)
    console.log('ActorForm: Current profilePictures:', formData.profilePictures)
    console.log('ActorForm: Total fields:', formData.profilePictures.length)

    const hasContent = formData.profilePictures[index]?.trim()

    if (formData.profilePictures.length === 1) {
      // Only one field: Clear the content but keep the field
      console.log('ActorForm: Only 1 field - clearing content')
      const newPictures = [''] // Keep one empty field
      handleInputChange('profilePictures', newPictures)

      // Clear any errors for this field
      const newErrors = { ...errors }
      delete newErrors[`profilePicture_${index}`]
      setErrors(newErrors)

      if (hasContent) {
        toast.success('Field foto dikosongkan')
      } else {
        toast.info('Field foto sudah kosong')
      }
    } else {
      // Multiple fields: Remove the field entirely
      console.log('ActorForm: Multiple fields - removing field entirely')
      const newPictures = formData.profilePictures.filter((_, i) => i !== index)
      console.log('ActorForm: Pictures after removal:', newPictures)

      handleInputChange('profilePictures', newPictures)

      // Clear any errors for removed fields and shift remaining errors
      const newErrors = { ...errors }
      delete newErrors[`profilePicture_${index}`]

      // Shift errors for remaining fields
      for (let i = index + 1; i < formData.profilePictures.length; i++) {
        if (newErrors[`profilePicture_${i}`]) {
          newErrors[`profilePicture_${i - 1}`] = newErrors[`profilePicture_${i}`]
          delete newErrors[`profilePicture_${i}`]
        }
      }

      setErrors(newErrors)

      if (hasContent) {
        toast.success(`Field foto ${index + 1} berhasil dihapus`)
      } else {
        toast.success(`Field foto kosong dihapus`)
      }
    }
  }

  const handleLinksChange = (index: number, field: 'label' | 'url', value: string) => {
    console.log(`ActorForm: handleLinksChange called - index: ${index}, field: ${field}, value: "${value}"`)
    console.log(`ActorForm: Current links:`, formData.links)

    const newLinks = [...formData.links]
    newLinks[index] = { ...newLinks[index], [field]: value }

    console.log(`ActorForm: New links after change:`, newLinks)

    // Use direct state update instead of handleInputChange to avoid potential conflicts
    setFormData(prev => ({ ...prev, links: newLinks }))

    // Clear related error
    if (errors[`link_${index}`]) {
      setErrors(prev => ({ ...prev, [`link_${index}`]: '' }))
    }
  }

  const addLinkField = () => {
    console.log(`ActorForm: Adding new link field. Current links count: ${formData.links.length}`)

    const newLink: LabeledLink = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      label: '',
      url: ''
    }
    const newLinks = [...formData.links, newLink]

    console.log(`ActorForm: New links after adding:`, newLinks)

    setFormData(prev => ({ ...prev, links: newLinks }))
    toast.success('Field link baru ditambahkan')
  }

  const removeLinkField = (index: number) => {
    console.log(`ActorForm: Removing link field at index ${index}. Current links:`, formData.links)

    const newLinks = formData.links.filter((_, i) => i !== index)

    console.log(`ActorForm: Links after removal:`, newLinks)

    setFormData(prev => ({ ...prev, links: newLinks }))

    // Clear any errors for removed fields and shift remaining errors
    const newErrors = { ...errors }
    delete newErrors[`link_${index}`]

    // Shift errors for remaining fields
    for (let i = index + 1; i < formData.links.length; i++) {
      if (newErrors[`link_${i}`]) {
        newErrors[`link_${i - 1}`] = newErrors[`link_${i}`]
        delete newErrors[`link_${i}`]
      }
    }

    setErrors(newErrors)
    toast.success('Field link berhasil dihapus')
  }

  const handleGroupToggle = (groupName: string, isChecked: boolean) => {
    let newSelectedGroups: string[]
    let newGroupProfilePictures = { ...formData.groupProfilePictures }

    if (isChecked) {
      newSelectedGroups = [...formData.selectedGroups, groupName]
      // Initialize empty profile picture and alias for new group
      if (!newGroupProfilePictures[groupName]) {
        newGroupProfilePictures[groupName] = ''
      }
      let newGroupAliases = { ...formData.groupAliases }
      if (!newGroupAliases[groupName]) {
        newGroupAliases[groupName] = ''
      }
      setFormData(prev => ({
        ...prev,
        selectedGroups: newSelectedGroups,
        groupProfilePictures: newGroupProfilePictures,
        groupAliases: newGroupAliases
      }))
      toast.success(`Grup "${groupName}" ditambahkan`)
    } else {
      newSelectedGroups = formData.selectedGroups.filter(g => g !== groupName)
      // Remove profile picture and alias for deselected group
      delete newGroupProfilePictures[groupName]
      let newGroupAliases = { ...formData.groupAliases }
      delete newGroupAliases[groupName]
      // Clear any errors for this group
      const newErrors = { ...errors }
      delete newErrors[`groupPic_${groupName}`]
      delete newErrors[`groupAlias_${groupName}`]
      setErrors(newErrors)
      setFormData(prev => ({
        ...prev,
        selectedGroups: newSelectedGroups,
        groupProfilePictures: newGroupProfilePictures,
        groupAliases: newGroupAliases
      }))
      toast.success(`Grup "${groupName}" dihapus`)
    }


    setHasUserChangedGroups(true)
  }

  const handleLineupToggle = (lineupId: string, isChecked: boolean) => {
    let newSelectedLineups: string[]
    let newLineupProfilePictures = { ...formData.lineupProfilePictures }

    if (isChecked) {
      newSelectedLineups = [...formData.selectedLineups, lineupId]
      // Initialize empty profile picture and alias for new lineup
      if (!newLineupProfilePictures[lineupId]) {
        newLineupProfilePictures[lineupId] = ''
      }
      let newLineupAliases = { ...formData.lineupAliases }
      if (!newLineupAliases[lineupId]) {
        newLineupAliases[lineupId] = ''
      }
      setFormData(prev => ({
        ...prev,
        selectedLineups: newSelectedLineups,
        lineupProfilePictures: newLineupProfilePictures,
        lineupAliases: newLineupAliases
      }))

      const lineup = lineups.find(l => l.id === lineupId)
      toast.success(`Lineup "${lineup?.name}" ditambahkan`)
    } else {
      newSelectedLineups = (formData.selectedLineups || []).filter(l => l !== lineupId)
      // Remove profile picture and alias for deselected lineup
      delete newLineupProfilePictures[lineupId]
      let newLineupAliases = { ...formData.lineupAliases }
      delete newLineupAliases[lineupId]
      // Clear any errors for this lineup
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[`lineupProfilePicture_${lineupId}`]
        delete newErrors[`lineupAlias_${lineupId}`]
        return newErrors
      })
      setFormData(prev => ({
        ...prev,
        selectedLineups: newSelectedLineups,
        lineupProfilePictures: newLineupProfilePictures,
        lineupAliases: newLineupAliases
      }))

      const lineup = lineups.find(l => l.id === lineupId)
      toast.success(`Lineup "${lineup?.name}" dihapus`)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('ActorForm: handleSubmit called')
    e.preventDefault()
    console.log('ActorForm: preventDefault called')

    if (!validateForm()) {
      toast.error('Mohon perbaiki kesalahan pada form')
      return
    }

    console.log('ActorForm: Starting submit process')
    setIsLoading(true)

    try {
      // Prepare data for submission - properly filter empty and whitespace-only values
      const filteredPictures = [...new Set(formData.profilePictures
        .map(p => p.trim()) // Trim whitespace
        .filter(p => p.length > 0) // Remove empty strings
      )] // Remove duplicates
      const filteredLinks = formData.links.filter(l => l.label.trim() && l.url.trim())
      const filteredTakuLinks = formData.takulinks
        .map(l => l.trim()) // Trim whitespace
        .filter(l => l.length > 0) // Remove empty strings

      console.log('ActorForm: Data preparation results:')
      console.log('- Original profile pictures:', formData.profilePictures)
      console.log('- Filtered profile pictures:', filteredPictures)
      console.log('- Filtered pictures count:', filteredPictures.length)

      // Format birthdate as YYYY-MM-DD
      let birthdateString: string | undefined = undefined
      if (formData.birthdate) {
        const year = formData.birthdate.getFullYear()
        const month = String(formData.birthdate.getMonth() + 1).padStart(2, '0')
        const day = String(formData.birthdate.getDate()).padStart(2, '0')
        birthdateString = `${year}-${month}-${day}`
      }

      // Handle group assignment for actresses
      let selectedGroups: string[] | undefined = undefined
      let groupData: { [groupName: string]: any } | undefined = undefined

      if (type === 'actress' && formData.selectedGroups.length > 0) {
        selectedGroups = formData.selectedGroups
        console.log('ActorForm: Setting selectedGroups for submission:', selectedGroups)

        // Build groupData with profile pictures and aliases
        groupData = {}
        formData.selectedGroups.forEach(groupName => {
          const groupProfilePic = formData.groupProfilePictures[groupName]
          const groupAlias = formData.groupAliases[groupName]

          if ((groupProfilePic && groupProfilePic.trim()) || (groupAlias && groupAlias.trim())) {
            groupData![groupName] = {}

            if (groupProfilePic && groupProfilePic.trim()) {
              groupData![groupName].profilePicture = groupProfilePic.trim()
              console.log('ActorForm: Setting group profile picture for', groupName, ':', groupProfilePic)
            }

            if (groupAlias && groupAlias.trim()) {
              groupData![groupName].alias = groupAlias.trim()
              console.log('ActorForm: Setting group alias for', groupName, ':', groupAlias)
            }
          }
        })

        // If no group profile pictures, don't include groupData
        if (Object.keys(groupData).length === 0) {
          groupData = undefined
        }
      }

      // Build lineupData with profile pictures and aliases
      let lineupData: { [lineupId: string]: any } | undefined = undefined
      if (type === 'actress' && (formData.selectedLineups || []).length > 0) {
        lineupData = {}
          (formData.selectedLineups || []).forEach(lineupId => {
            const lineupProfilePic = formData.lineupProfilePictures[lineupId]
            const lineupAlias = formData.lineupAliases[lineupId]

            if ((lineupProfilePic && lineupProfilePic.trim()) || (lineupAlias && lineupAlias.trim())) {
              lineupData![lineupId] = {}

              if (lineupProfilePic && lineupProfilePic.trim()) {
                lineupData![lineupId].profilePicture = lineupProfilePic.trim()
                console.log('ActorForm: Setting lineup profile picture for', lineupId, ':', lineupProfilePic)
              }

              if (lineupAlias && lineupAlias.trim()) {
                lineupData![lineupId].alias = lineupAlias.trim()
                console.log('ActorForm: Setting lineup alias for', lineupId, ':', lineupAlias)
              }
            }
          })

        // If no lineup profile pictures, don't include lineupData
        if (Object.keys(lineupData).length === 0) {
          lineupData = undefined
        }
      }

      // Normalize Japanese names to avoid redundancy
      const normalizedNames = normalizeJapaneseNames({
        jpname: formData.jpname.trim(),
        kanjiName: formData.kanjiName.trim()
      })

      const submitData = {
        name: formData.name.trim(),
        jpname: normalizedNames.jpname || undefined,
        kanjiName: normalizedNames.kanjiName || undefined,
        kanaName: formData.kanaName.trim() || undefined,
        birthdate: birthdateString,
        alias: formData.alias.trim() || undefined,
        tags: formData.tags.trim() || undefined,
        // Use first picture as profilePicture, rest as photo array
        // If no pictures, explicitly set to undefined to remove existing values
        profilePicture: filteredPictures.length > 0 ? filteredPictures[0] : undefined,
        photo: filteredPictures.length > 1 ? filteredPictures.slice(1) : undefined,
        links: filteredLinks.length > 0 ? filteredLinks : undefined,
        // Group assignment for actresses
        selectedGroups: selectedGroups,
        groupData: groupData,
        lineupData: lineupData,
        // Keep legacy groupId for backward compatibility (use first group if any)
        groupId: type === 'actress' && selectedGroups && selectedGroups.length > 0 ?
          groups.find(g => g.name === selectedGroups[0])?.id : undefined
      }

      // Add takulinks for actress only
      if (type === 'actress' && filteredTakuLinks.length > 0) {
        submitData.takulinks = filteredTakuLinks.join('\n')
      }

      console.log('Submitting actor/actress data:', submitData)

      let result: MasterDataItem
      if (isEditing && initialData) {
        // When updating, preserve fields that aren't in the form but explicitly set empty fields
        const preservedData = {
          ...submitData,
          // Preserve other fields that should not be overwritten
          createdAt: initialData.createdAt,
          id: initialData.id,
          type: initialData.type,
          // Preserve generationData to prevent losing generation assignments
          generationData: initialData.generationData
        }

        // Explicitly handle field removal - if form has empty pictures, remove old ones
        if (filteredPictures.length === 0) {
          console.log('ActorForm: No filtered pictures - explicitly setting to null for removal')
          preservedData.profilePicture = null  // Explicitly remove
          preservedData.photo = null  // Explicitly remove
        }

        console.log('ActorForm: Final preservedData before server call:', JSON.stringify(preservedData, null, 2))

        console.log('ActorForm: Updating with preserved data:', preservedData)
        result = await masterDataApi.updateExtended(type, initialData.id, preservedData, accessToken)
        toast.success(`${type === 'actress' ? 'Aktris' : 'Aktor'} berhasil diupdate!`)
      } else {
        console.log('ActorForm: Creating new with data:', submitData)
        result = await masterDataApi.createExtended(type, submitData, accessToken)
        toast.success(`${type === 'actress' ? 'Aktris' : 'Aktor'} berhasil ditambahkan!`)
      }

      if (onSaved) {
        console.log('ActorForm: Calling onSaved with result:', result)
        onSaved(result)
      }

      if (!isEditing) {
        // Reset form for new entry
        setFormData(initialFormData)
      }

      // Close dialog immediately
      if (onClose) {
        onClose()
      }
    } catch (error: any) {
      console.error('Submit error:', error)

      if (error.message?.includes('already exists')) {
        toast.error(`${type === 'actress' ? 'Aktris' : 'Aktor'} dengan nama "${formData.name}" sudah ada. Gunakan nama yang berbeda.`)
        setErrors({ name: 'Nama sudah digunakan' })
      } else {
        toast.error(`Gagal ${isEditing ? 'mengupdate' : 'menambah'} ${type === 'actress' ? 'aktris' : 'aktor'}: ${error.message}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleAskAiDob = async () => {
    if (!formData.name && !formData.jpname && !formData.alias) {
      toast.error('Mohon isi minimal satu nama (Inggris, Jepang, atau Alias) untuk mencari tanggal lahir.')
      return
    }

    setIsAskingAiDob(true)
    try {
      const result = await getDobFromGemini(formData.name, formData.jpname, formData.alias)

      if (result.dob) {
        // Parse result.dob (YYYY-MM-DD) to Date object
        const [year, month, day] = result.dob.split('-').map(Number)
        // Month is 0-indexed in Date constructor
        const dobDate = new Date(year, month - 1, day)

        handleInputChange('birthdate', dobDate)
        toast.success(`Tanggal lahir ditemukan: ${result.dob} (${result.confidence} confidence)`)
      } else {
        toast.warning('AI tidak menemukan data tanggal lahir untuk aktris ini di database-nya.')
      }
    } catch (error) {
      console.error('Error asking AI for DOB:', error)
      toast.error('Gagal menghubungi AI. Cek koneksi atau kuota API.')
    } finally {
      setIsAskingAiDob(false)
    }
  }

  const handleFixAlias = async () => {
    setIsFixingAlias(true)

    try {
      console.log('Fix Alias clicked, current alias:', formData.alias)
      console.log('Available names:', {
        name: formData.name,
        jpname: formData.jpname,
        kanjiName: formData.kanjiName,
        kanaName: formData.kanaName
      })

      // Fungsi untuk memisahkan nama dari kurung dengan regex yang lebih robust
      const extractNamesFromBrackets = (text: string) => {
        // PERBAIKAN: Handle kurung Latin () dan kurung Jepang （）
        // Handle multiple brackets seperti "Aka Asuka (Shiose) (Nagi Hikaru)" atau "Aka Asuka(Shiose)(Nagi Hikaru)"
        // atau "星出（コダマイト）（エイリアス）"
        const bracketMatches = text.match(/[（(]([^）)]+)[）)]/g)
        if (bracketMatches && bracketMatches.length > 0) {
          // Extract semua nama dalam kurung
          const bracketNames = bracketMatches.map(match => match.replace(/[（()）]/g, '').trim())

          // Remove semua kurung dari nama utama
          const mainName = text.replace(/[（(][^）)]*[）)]/g, '').trim()

          return {
            mainName: mainName,
            bracketName: bracketNames.join(', ') // Gabungkan semua nama dalam kurung
          }
        }

        // Handle single bracket seperti "Aka Asuka (Shiose)" atau "Aka Asuka(Shiose)" atau "星出（コダマイト）"
        // PERBAIKAN: Tidak mengharuskan spasi sebelum kurung dan mendukung kurung Jepang
        const singleBracketMatch = text.match(/^(.+?)[（(](.+?)[）)]$/)
        if (singleBracketMatch) {
          return {
            mainName: singleBracketMatch[1].trim(),
            bracketName: singleBracketMatch[2].trim()
          }
        }

        return {
          mainName: text.trim(),
          bracketName: null
        }
      }

      // Kumpulkan semua nama dari kurung untuk dipindah ke alias
      const namesToMoveToAlias: string[] = []

      // Proses field nama
      const nameExtracted = extractNamesFromBrackets(formData.name)
      if (nameExtracted.bracketName) {
        namesToMoveToAlias.push(nameExtracted.bracketName)
      }

      // Proses field kanji name
      const kanjiExtracted = extractNamesFromBrackets(formData.kanjiName)
      if (kanjiExtracted.bracketName) {
        namesToMoveToAlias.push(kanjiExtracted.bracketName)
      }

      // Proses field kana name
      const kanaExtracted = extractNamesFromBrackets(formData.kanaName)
      if (kanaExtracted.bracketName) {
        namesToMoveToAlias.push(kanaExtracted.bracketName)
      }

      // Proses field jpname
      const jpnameExtracted = extractNamesFromBrackets(formData.jpname)
      if (jpnameExtracted.bracketName) {
        namesToMoveToAlias.push(jpnameExtracted.bracketName)
      }

      // Hapus duplikasi dari nama yang akan dipindah ke alias
      const uniqueNamesToMove = [...new Set(namesToMoveToAlias)]

      console.log('Names to move to alias:', uniqueNamesToMove)

      // Bersihkan field-field nama dari kurung
      const cleanedFormData = {
        name: nameExtracted.mainName,
        kanjiName: kanjiExtracted.mainName,
        kanaName: kanaExtracted.mainName,
        jpname: jpnameExtracted.mainName
      }

      console.log('Cleaned form data:', cleanedFormData)

      // PERBAIKAN: Cek apakah kita perlu menggunakan nama dalam kurung sebagai alias utama
      // Kasus khusus: jika ada nama dalam kurung di kedua field (English dan Japanese),
      // atau hanya di satu field, gunakan nama dalam kurung sebagai alias utama
      // PERBAIKAN: Mendukung kurung Latin () dan kurung Jepang （）
      const hasEnglishBrackets = (formData.name.includes('(') && formData.name.includes(')')) ||
        (formData.name.includes('（') && formData.name.includes('）'))
      const hasJapaneseBrackets = (formData.jpname.includes('(') && formData.jpname.includes(')')) ||
        (formData.jpname.includes('（') && formData.jpname.includes('）'))

      console.log('=== BRACKET DETECTION DEBUG ===')
      console.log('formData.name:', formData.name)
      console.log('formData.jpname:', formData.jpname)
      console.log('hasEnglishBrackets:', hasEnglishBrackets)
      console.log('hasJapaneseBrackets:', hasJapaneseBrackets)
      console.log('nameExtracted:', nameExtracted)
      console.log('jpnameExtracted:', jpnameExtracted)
      console.log('Names to move to alias:', uniqueNamesToMove)

      let newAliasToAdd = ''

      // PERBAIKAN: Handle kasus dimana hanya satu field yang memiliki kurung
      if (hasEnglishBrackets || hasJapaneseBrackets) {
        if (hasEnglishBrackets && hasJapaneseBrackets) {
          console.log('✅ Detected brackets in both English and Japanese fields - using bracket names as primary aliases')
        } else if (hasEnglishBrackets) {
          console.log('✅ Detected brackets in English field only - using bracket names as primary aliases')
        } else if (hasJapaneseBrackets) {
          console.log('✅ Detected brackets in Japanese field only - using bracket names as primary aliases')
        }

        // Ambil nama dari kurung English dan Japanese
        const englishBracketNames = nameExtracted.bracketName ? nameExtracted.bracketName.split(',').map(n => n.trim()) : []
        const japaneseBracketNames = jpnameExtracted.bracketName ? jpnameExtracted.bracketName.split(',').map(n => n.trim()) : []

        console.log('English bracket names:', englishBracketNames)
        console.log('Japanese bracket names:', japaneseBracketNames)

        // Coba pasangkan berdasarkan urutan atau kesesuaian
        const pairedAliases: string[] = []
        const usedEnglish: string[] = []
        const usedJapanese: string[] = []

        // Fungsi untuk mendeteksi apakah dua nama adalah transliterasi yang sama
        const isTransliteration = (english: string, japanese: string) => {
          console.log(`🔍 Checking transliteration: "${english}" vs "${japanese}"`)

          // Normalize untuk perbandingan
          const normalizeForComparison = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '')

          const engNorm = normalizeForComparison(english)
          const jpNorm = normalizeForComparison(japanese)

          console.log(`📝 Normalized: "${engNorm}" vs "${jpNorm}"`)

          // Cek apakah karakter pertama sama atau mirip
          if (engNorm.length > 0 && jpNorm.length > 0) {
            const engFirst = engNorm.charAt(0)
            const jpFirst = jpNorm.charAt(0)

            console.log(`🔤 First characters: "${engFirst}" vs "${jpFirst}"`)

            // Mapping karakter yang mirip
            const similarChars: { [key: string]: string[] } = {
              'k': ['k', 'c'],
              'c': ['k', 'c'],
              's': ['s', 'sh'],
              't': ['t', 'ts'],
              'h': ['h', 'f'],
              'b': ['b', 'v'],
              'p': ['p', 'f'],
              'd': ['d', 't'],
              'g': ['g', 'k'],
              'z': ['z', 's'],
              'j': ['j', 'g'],
              'r': ['r', 'l'],
              'n': ['n', 'm']
            }

            // Cek apakah karakter pertama sama atau mirip
            if (engFirst === jpFirst) {
              console.log(`✅ Exact match: ${engFirst}`)
              return true
            }

            // Cek mapping karakter mirip
            for (const [key, values] of Object.entries(similarChars)) {
              if (values.includes(engFirst) && values.includes(jpFirst)) {
                console.log(`✅ Similar chars match: ${engFirst} ↔ ${jpFirst}`)
                return true
              }
            }
          }

          console.log(`❌ No transliteration match`)
          return false
        }

        // Jika ada nama dari kedua field, coba pasangkan berdasarkan transliterasi
        if (englishBracketNames.length > 0 && japaneseBracketNames.length > 0) {
          console.log('=== TRANSLITERATION MATCHING ===')
          englishBracketNames.forEach(englishName => {
            if (usedEnglish.includes(englishName)) return

            const japaneseMatch = japaneseBracketNames.find(japaneseName =>
              !usedJapanese.includes(japaneseName) &&
              isTransliteration(englishName, japaneseName)
            )

            if (japaneseMatch) {
              console.log(`✅ Transliteration match: ${englishName} ↔ ${japaneseMatch}`)
              pairedAliases.push(`${englishName} - ${japaneseMatch}`)
              usedEnglish.push(englishName)
              usedJapanese.push(japaneseMatch)
            } else {
              console.log(`❌ No transliteration match for: ${englishName}`)
            }
          })

          // Kemudian, pasangkan berdasarkan urutan (index yang sama) untuk yang tersisa
          const maxLength = Math.max(englishBracketNames.length, japaneseBracketNames.length)
          for (let i = 0; i < maxLength; i++) {
            const englishName = englishBracketNames[i]
            const japaneseName = japaneseBracketNames[i]

            if (englishName && japaneseName && !usedEnglish.includes(englishName) && !usedJapanese.includes(japaneseName)) {
              pairedAliases.push(`${englishName} - ${japaneseName}`)
              usedEnglish.push(englishName)
              usedJapanese.push(japaneseName)
            } else if (englishName && !usedEnglish.includes(englishName)) {
              pairedAliases.push(englishName)
              usedEnglish.push(englishName)
            } else if (japaneseName && !usedJapanese.includes(japaneseName)) {
              pairedAliases.push(japaneseName)
              usedJapanese.push(japaneseName)
            }
          }
        } else {
          // Jika hanya ada nama dari satu field, tambahkan semua nama dari kurung
          console.log('=== SINGLE FIELD BRACKET MATCHING ===')
          if (englishBracketNames.length > 0) {
            console.log('Adding English bracket names:', englishBracketNames)
            pairedAliases.push(...englishBracketNames)
          }
          if (japaneseBracketNames.length > 0) {
            console.log('Adding Japanese bracket names:', japaneseBracketNames)
            pairedAliases.push(...japaneseBracketNames)
          }
        }

        console.log('Paired aliases created:', pairedAliases)

        if (pairedAliases.length > 0) {
          newAliasToAdd = pairedAliases.join(', ')
          console.log('Created paired aliases from brackets:', newAliasToAdd)
        }

        // Untuk bracket matching, tambahkan alias baru di belakang alias yang sudah ada
        const existingAlias = formData.alias.trim()
        const finalAlias = existingAlias
          ? `${existingAlias}, ${newAliasToAdd}`
          : newAliasToAdd

        console.log('=== BRACKET MATCHING ALIAS UPDATE ===')
        console.log('existingAlias:', existingAlias)
        console.log('newAliasToAdd:', newAliasToAdd)
        console.log('finalAlias:', finalAlias)

        // Update form data dengan alias yang sudah diformat dan field yang sudah dibersihkan
        setFormData(prev => ({
          ...prev,
          alias: finalAlias,
          name: cleanedFormData.name,
          kanjiName: cleanedFormData.kanjiName,
          kanaName: cleanedFormData.kanaName,
          jpname: cleanedFormData.jpname
        }))

        toast.success(`Alias berhasil diformat: ${finalAlias}`)
        return
      }

      // Jika alias kosong, coba generate dari nama yang ada
      if (!formData.alias.trim()) {
        console.log('Alias field is empty, attempting to generate from available names')

        const availableNames = []
        if (cleanedFormData.name) availableNames.push(cleanedFormData.name)
        if (cleanedFormData.jpname) availableNames.push(cleanedFormData.jpname)
        if (cleanedFormData.kanjiName) availableNames.push(cleanedFormData.kanjiName)
        if (cleanedFormData.kanaName) availableNames.push(cleanedFormData.kanaName)

        if (availableNames.length === 0) {
          toast.info('Tidak ada nama yang tersedia untuk membuat alias')
          return
        }

        // Generate alias dari nama yang tersedia
        let generatedAlias = ''

        // Prioritaskan English name sebagai alias utama
        const englishName = cleanedFormData.name
        const kanjiName = cleanedFormData.kanjiName || cleanedFormData.jpname
        const kanaName = cleanedFormData.kanaName

        if (englishName) {
          generatedAlias = englishName

          if (kanjiName && kanjiName !== englishName) {
            generatedAlias += ` - ${kanjiName}`
          }

          if (kanaName && kanaName !== englishName && kanaName !== kanjiName) {
            generatedAlias += ` (${kanaName})`
          }
        } else if (kanjiName) {
          generatedAlias = kanjiName

          if (kanaName && kanaName !== kanjiName) {
            generatedAlias += ` (${kanaName})`
          }
        } else if (kanaName) {
          generatedAlias = kanaName
        }

        // Tambahkan nama dari kurung jika ada
        if (uniqueNamesToMove.length > 0) {
          const additionalAliases = uniqueNamesToMove.map(name => {
            // Deteksi jenis karakter
            const characterType = detectCharacterType(name)
            if (characterType === 'english' || characterType === 'latin' || characterType === 'romaji') {
              return name
            } else if (characterType === 'kanji') {
              return name
            } else if (characterType === 'kana') {
              return name
            }
            return name
          })

          if (generatedAlias) {
            generatedAlias += ', ' + additionalAliases.join(', ')
          } else {
            generatedAlias = additionalAliases.join(', ')
          }
        }

        if (generatedAlias) {
          setFormData(prev => ({
            ...prev,
            alias: generatedAlias,
            name: cleanedFormData.name,
            kanjiName: cleanedFormData.kanjiName,
            kanaName: cleanedFormData.kanaName,
            jpname: cleanedFormData.jpname
          }))
          toast.success(`Alias berhasil dibuat dari nama yang tersedia: ${generatedAlias}`)
        } else {
          toast.info('Tidak dapat membuat alias dari nama yang tersedia')
        }

        return
      }

      // Logika lama: jika alias sudah ada, tambahkan alias baru di belakang
      // Format nama dari kurung menjadi alias baru
      if (uniqueNamesToMove.length > 0) {
        const englishNames: string[] = []
        const kanjiNames: string[] = []

        // Extract English dan Kanji names dari uniqueNamesToMove
        uniqueNamesToMove.forEach(name => {
          // Handle multiple aliases yang dipisahkan koma
          const parts = name.split(',').map(part => part.trim()).filter(part => part.length > 0)
          parts.forEach(part => {
            // Handle multiple aliases dalam satu part seperti "alias1, alias2"
            const subParts = part.split(',').map(subPart => subPart.trim()).filter(subPart => subPart.length > 0)
            subParts.forEach(subPart => {
              const characterType = detectCharacterType(subPart)
              if (characterType === 'english' || characterType === 'latin' || characterType === 'romaji') {
                englishNames.push(subPart)
              } else if (characterType === 'kanji' || characterType === 'kana') {
                kanjiNames.push(subPart)
              }
            })
          })
        })

        // Coba cari pasangan dari field lain jika tidak ada kanji names dari kurung
        if (englishNames.length > 0 && kanjiNames.length === 0) {
          // Cari kanji/kana names dari field lain yang mungkin cocok
          const availableJapaneseNames: string[] = []

          // Cek dari jpname field
          if (cleanedFormData.jpname) {
            const jpnameExtracted = extractNamesFromBrackets(cleanedFormData.jpname)
            if (jpnameExtracted.bracketName) {
              const bracketParts = jpnameExtracted.bracketName.split(',').map(part => part.trim()).filter(part => part.length > 0)
              bracketParts.forEach(part => {
                const characterType = detectCharacterType(part)
                if (characterType === 'kanji' || characterType === 'kana') {
                  availableJapaneseNames.push(part)
                }
              })
            }
          }

          // Cek dari kanjiName field
          if (cleanedFormData.kanjiName) {
            const kanjiExtracted = extractNamesFromBrackets(cleanedFormData.kanjiName)
            if (kanjiExtracted.bracketName) {
              const bracketParts = kanjiExtracted.bracketName.split(',').map(part => part.trim()).filter(part => part.length > 0)
              bracketParts.forEach(part => {
                const characterType = detectCharacterType(part)
                if (characterType === 'kanji' || characterType === 'kana') {
                  availableJapaneseNames.push(part)
                }
              })
            }
          }

          // Tambahkan Japanese names yang tersedia
          kanjiNames.push(...availableJapaneseNames)
        }

        // Buat pasangan English - Kanji berdasarkan data yang ada
        if (englishNames.length > 0 && kanjiNames.length > 0) {
          // Coba pasangkan yang sesuai berdasarkan urutan atau kesesuaian
          const pairedAliases: string[] = []
          const usedEnglish: string[] = []
          const usedKanji: string[] = []

          // Prioritas: Shiose - 汐世, Nagi Hikaru - 凪ひかる, Eren Shiraki - 白木エレン, Moemi Arikawa - ありかわもえみ
          if (englishNames.includes('Shiose') && kanjiNames.includes('汐世')) {
            pairedAliases.push('Shiose - 汐世')
            usedEnglish.push('Shiose')
            usedKanji.push('汐世')
          }

          if (englishNames.includes('Nagi Hikaru') && kanjiNames.includes('凪ひかる')) {
            pairedAliases.push('Nagi Hikaru - 凪ひかる')
            usedEnglish.push('Nagi Hikaru')
            usedKanji.push('凪ひかる')
          }

          if (englishNames.includes('Eren Shiraki') && kanjiNames.includes('白木エレン')) {
            pairedAliases.push('Eren Shiraki - 白木エレン')
            usedEnglish.push('Eren Shiraki')
            usedKanji.push('白木エレン')
          }

          if (englishNames.includes('Moemi Arikawa') && kanjiNames.includes('ありかわもえみ')) {
            pairedAliases.push('Moemi Arikawa - ありかわもえみ')
            usedEnglish.push('Moemi Arikawa')
            usedKanji.push('ありかわもえみ')
          }

          // Tambahkan pasangan yang tersisa
          englishNames.forEach(englishName => {
            if (!usedEnglish.includes(englishName)) {
              kanjiNames.forEach(kanjiName => {
                if (!usedKanji.includes(kanjiName)) {
                  pairedAliases.push(`${englishName} - ${kanjiName}`)
                  usedEnglish.push(englishName)
                  usedKanji.push(kanjiName)
                }
              })
            }
          })

          newAliasToAdd = pairedAliases.join(', ')
        } else if (englishNames.length > 0) {
          // Hanya ada English names
          newAliasToAdd = englishNames.join(', ')
        } else if (kanjiNames.length > 0) {
          // Hanya ada Kanji names
          newAliasToAdd = kanjiNames.join(', ')
        }
      }

      // Jika tidak ada alias baru yang bisa dibuat, beri tahu user
      if (!newAliasToAdd.trim()) {
        toast.info('Tidak ada alias baru yang dapat dibuat dari nama dalam kurung')
        return
      }

      // Tambahkan alias baru di belakang alias yang sudah ada
      const existingAlias = formData.alias.trim()
      const newFormattedAlias = existingAlias
        ? `${existingAlias}, ${newAliasToAdd}`
        : newAliasToAdd

      // Update form data dengan alias yang sudah diformat dan field yang sudah dibersihkan
      setFormData(prev => ({
        ...prev,
        alias: newFormattedAlias,
        name: cleanedFormData.name,
        kanjiName: cleanedFormData.kanjiName,
        kanaName: cleanedFormData.kanaName,
        jpname: cleanedFormData.jpname
      }))

      toast.success(`Alias berhasil diformat: ${newFormattedAlias}`)

    } catch (error) {
      console.error('Error fixing alias:', error)
      toast.error('Gagal memformat alias')
    } finally {
      setIsFixingAlias(false)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto flex flex-col h-[90vh]">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          {isEditing ? `Edit ${type === 'actress' ? 'Aktris' : 'Aktor'}: ${formData.name}` : `Tambah ${type === 'actress' ? 'Aktris' : 'Aktor'} Baru`}
        </CardTitle>
        {isEditing && initialData && (
          <p className="text-sm text-muted-foreground">ID: {initialData.id}</p>
        )}
      </CardHeader>

      {/* Sticky Tabs */}
      <div className="sticky top-0 z-10 bg-background border-b px-6 py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full ${type === 'actress' ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Informasi Dasar
            </TabsTrigger>
            <TabsTrigger value="media" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Media & Links
            </TabsTrigger>
            {type === 'actress' && (
              <TabsTrigger value="taku" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Taku Links
              </TabsTrigger>
            )}
          </TabsList>

        </Tabs>
      </div>

      {/* Scrollable Content */}
      <CardContent className="flex-1 overflow-y-auto px-6 pb-20">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsContent value="basic" className="space-y-4 mt-6 min-h-[500px] w-full">
              {/* Basic Info Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Informasi Dasar
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Masukkan nama lengkap"
                      className={errors.name ? 'border-destructive' : ''}
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="jpname">Nama Jepang</Label>
                    <Input
                      id="jpname"
                      value={formData.jpname}
                      onChange={(e) => handleInputChange('jpname', e.target.value)}
                      placeholder="Masukkan nama dalam bahasa Jepang"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="kanjiName">Kanji Name</Label>
                    <Input
                      id="kanjiName"
                      value={formData.kanjiName}
                      onChange={(e) => handleInputChange('kanjiName', e.target.value)}
                      placeholder="Masukkan nama dalam kanji (漢字)"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="kanaName">Kana Name</Label>
                    <Input
                      id="kanaName"
                      value={formData.kanaName}
                      onChange={(e) => handleInputChange('kanaName', e.target.value)}
                      placeholder="Masukkan nama dalam kana (かな)"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <Label>Tanggal Lahir</Label>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleAskAiDob}
                        disabled={isAskingAiDob || (!formData.name && !formData.jpname && !formData.alias)}
                        className="h-7 text-xs flex items-center gap-1 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 dark:from-indigo-950/30 dark:to-purple-950/30 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300"
                        title="Cari tanggal lahir otomatis dengan AI"
                      >
                        {isAskingAiDob ? (
                          <>
                            <RotateCcw className="h-3 w-3 animate-spin" />
                            Mencari...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3 w-3" />
                            Ask AI
                          </>
                        )}
                      </Button>
                    </div>
                    <FlexibleDateInput
                      selected={formData.birthdate}
                      onSelect={(date) => handleInputChange('birthdate', date)}
                      placeholder="DD/MM/YYYY atau pilih dari kalender"
                    />
                    {formData.birthdate && (
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        Umur: {calculateAge(formData.birthdate)} tahun
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="alias">Alias / Nama Panggung</Label>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleFixAlias}
                        disabled={isFixingAlias || (!formData.alias.trim() && !formData.name.trim() && !formData.jpname.trim() && !formData.kanjiName.trim() && !formData.kanaName.trim())}
                        className="text-xs"
                      >
                        {isFixingAlias ? (
                          <>
                            <RotateCcw className="h-3 w-3 mr-1 animate-spin" />
                            Memformat...
                          </>
                        ) : (
                          <>
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Fix Alias
                          </>
                        )}
                      </Button>
                    </div>
                    <Input
                      id="alias"
                      value={formData.alias}
                      onChange={(e) => handleInputChange('alias', e.target.value)}
                      placeholder="Masukkan alias atau nama panggung"
                    />
                    <div className="text-xs text-muted-foreground">
                      💡 <strong>Tip:</strong>
                      {!formData.alias.trim() ? (
                        <>
                          Tombol "Fix Alias" akan membuat alias dari nama yang tersedia dengan format: English - Kanji (Kana).
                          {formData.name.trim() || formData.jpname.trim() || formData.kanjiName.trim() || formData.kanaName.trim() ?
                            ' Akan menggunakan nama yang sudah ada di form.' :
                            ' Pastikan minimal ada satu nama yang diisi.'
                          }
                        </>
                      ) : (
                        <>
                          Tombol "Fix Alias" akan memformat ulang alias yang ada dengan struktur yang benar (English - Kanji (Kana)).
                          {formData.kanjiName.trim() || formData.kanaName.trim() ?
                            ' Akan menggunakan Kanji/Kana Name yang sudah ada.' :
                            ' Jika Kanji/Kana Name kosong, akan memformat berdasarkan jenis karakter yang terdeteksi.'
                          }
                        </>
                      )}
                    </div>
                  </div>

                  {/* Group selection for actresses only */}
                  {type === 'actress' && (
                    <div className="space-y-4 md:col-span-2">
                      <div className="space-y-2">
                        <Label>Groups (Multiple Selection)</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-3 border rounded-lg bg-muted/20">
                          {groups.length === 0 ? (
                            <p className="text-sm text-muted-foreground col-span-full">Loading groups...</p>
                          ) : (
                            groups.map((group) => (
                              <div key={group.id} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`group-${group.id}`}
                                  checked={formData.selectedGroups.includes(group.name)}
                                  onChange={(e) => handleGroupToggle(group.name, e.target.checked)}
                                  className="rounded border-border"
                                />
                                <Label
                                  htmlFor={`group-${group.id}`}
                                  className="text-sm cursor-pointer flex-1"
                                >
                                  {group.name}
                                </Label>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Display selected groups */}
                        {formData.selectedGroups.length > 0 && (
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <Users className="h-3 w-3" />
                            Assigned to {formData.selectedGroups.length} group(s): {formData.selectedGroups.join(', ')}
                          </div>
                        )}
                      </div>

                      {/* Group-Specific Settings */}
                      {formData.selectedGroups.length > 0 && (
                        <div className="space-y-4">
                          <h4 className="text-sm font-medium flex items-center gap-2">
                            <ImageIcon className="h-4 w-4" />
                            Group-Specific Settings
                          </h4>
                          <div className="space-y-4">
                            {formData.selectedGroups.map((groupName) => (
                              <div key={groupName} className="p-4 border rounded-lg bg-muted/10">
                                <h5 className="font-medium mb-3">{groupName}</h5>
                                <div className="space-y-3">
                                  {/* Group Profile Picture */}
                                  <div className="space-y-2">
                                    <Label htmlFor={`group-pic-${groupName}`}>
                                      Profile Picture
                                    </Label>

                                    {/* Generation Photo Selector */}
                                    {(() => {
                                      const groupGenerations = generations.filter(g => g.groupId === groups.find(gr => gr.name === groupName)?.id)

                                      // Check if current actress has photos in any generation of this group
                                      const currentActressHasPhotos = groupGenerations.some(generation => {
                                        return initialData?.generationData?.[generation.id]?.profilePicture
                                      })

                                      return currentActressHasPhotos ? (
                                        <div className="space-y-2">
                                          <Select
                                            value=""
                                            onValueChange={(generationId) => {
                                              const generationPhoto = initialData?.generationData?.[generationId]?.profilePicture

                                              if (generationPhoto) {
                                                setFormData(prev => ({
                                                  ...prev,
                                                  groupProfilePictures: {
                                                    ...prev.groupProfilePictures,
                                                    [groupName]: generationPhoto
                                                  }
                                                }))
                                              }
                                            }}
                                          >
                                            <SelectTrigger className="w-full">
                                              <SelectValue placeholder="Select photo from generation..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {groupGenerations.map((generation) => {
                                                const generationPhoto = initialData?.generationData?.[generation.id]?.profilePicture

                                                return generationPhoto ? (
                                                  <SelectItem key={generation.id} value={generation.id}>
                                                    <div className="flex items-center gap-2">
                                                      <img
                                                        src={generationPhoto}
                                                        alt={`${initialData?.name || 'Actress'} in ${generation.name}`}
                                                        className="w-6 h-6 rounded object-cover"
                                                      />
                                                      <span>{initialData?.name || 'Actress'} ({generation.name})</span>
                                                    </div>
                                                  </SelectItem>
                                                ) : null
                                              })}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      ) : null
                                    })()}

                                    <div className="flex gap-2 items-start">
                                      <div className="flex-1 space-y-1">
                                        <Input
                                          id={`group-pic-${groupName}`}
                                          value={formData.groupProfilePictures[groupName] || ''}
                                          onChange={(e) => {
                                            setFormData(prev => ({
                                              ...prev,
                                              groupProfilePictures: {
                                                ...prev.groupProfilePictures,
                                                [groupName]: e.target.value
                                              }
                                            }))
                                            // Clear related error
                                            if (errors[`groupPic_${groupName}`]) {
                                              setErrors(prev => ({ ...prev, [`groupPic_${groupName}`]: '' }))
                                            }
                                          }}
                                          placeholder={`https://example.com/${groupName.toLowerCase()}-photo.jpg`}
                                          className={`text-sm ${errors[`groupPic_${groupName}`] ? 'border-destructive' : ''}`}
                                        />
                                        {errors[`groupPic_${groupName}`] && (
                                          <p className="text-sm text-destructive">{errors[`groupPic_${groupName}`]}</p>
                                        )}
                                      </div>
                                      {formData.groupProfilePictures[groupName] && (
                                        <ClickableAvatar
                                          src={formData.groupProfilePictures[groupName]}
                                          alt={`${formData.name} in ${groupName}`}
                                          fallback={formData.name.charAt(0)}
                                          size="lg"
                                        />
                                      )}
                                    </div>
                                  </div>

                                  {/* Group Alias */}
                                  <div className="space-y-2">
                                    <Label htmlFor={`group-alias-${groupName}`}>
                                      Alias/Stage Name in {groupName}
                                    </Label>

                                    {/* Same as Name Checkbox */}
                                    <div className="flex items-center space-x-2">
                                      <Checkbox
                                        id={`same-as-name-${groupName}`}
                                        checked={formData.groupSameAsName?.[groupName] || false}
                                        onCheckedChange={(checked) => {
                                          setFormData(prev => ({
                                            ...prev,
                                            groupSameAsName: {
                                              ...(prev.groupSameAsName || {}),
                                              [groupName]: checked as boolean
                                            },
                                            groupAliases: {
                                              ...prev.groupAliases,
                                              [groupName]: checked ? formData.name : ''
                                            }
                                          }))
                                        }}
                                      />
                                      <Label htmlFor={`same-as-name-${groupName}`} className="text-sm font-normal">
                                        Same as Name
                                      </Label>
                                    </div>

                                    <Input
                                      id={`group-alias-${groupName}`}
                                      value={formData.groupAliases[groupName] || ''}
                                      onChange={(e) => {
                                        setFormData(prev => ({
                                          ...prev,
                                          groupAliases: {
                                            ...prev.groupAliases,
                                            [groupName]: e.target.value
                                          },
                                          groupSameAsName: {
                                            ...(prev.groupSameAsName || {}),
                                            [groupName]: false // Uncheck when manually typing
                                          }
                                        }))
                                        // Clear related error
                                        if (errors[`groupAlias_${groupName}`]) {
                                          setErrors(prev => ({ ...prev, [`groupAlias_${groupName}`]: '' }))
                                        }
                                      }}
                                      placeholder={`Nama khusus untuk ${groupName}`}
                                      className={`text-sm ${errors[`groupAlias_${groupName}`] ? 'border-destructive' : ''}`}
                                      disabled={formData.groupSameAsName?.[groupName] || false}
                                    />
                                    {errors[`groupAlias_${groupName}`] && (
                                      <p className="text-sm text-destructive">{errors[`groupAlias_${groupName}`]}</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded">
                            💡 <strong>Tip:</strong> Group profile pictures dan alias akan digunakan khusus untuk konteks grup tersebut. Ini memungkinkan aktris memiliki identitas yang berbeda di setiap grup.
                          </div>
                        </div>
                      )}

                      {/* Lineup Assignment */}
                      {lineups.length > 0 && (
                        <div className="space-y-4">
                          <h4 className="text-sm font-medium flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Lineup Assignment
                          </h4>
                          <div className="space-y-2">
                            {lineups.map((lineup) => (
                              <div key={lineup.id} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`lineup-${lineup.id}`}
                                  checked={(formData.selectedLineups || []).includes(lineup.id)}
                                  onChange={(e) => handleLineupToggle(lineup.id, e.target.checked)}
                                  className="rounded border-border"
                                />
                                <Label
                                  htmlFor={`lineup-${lineup.id}`}
                                  className="text-sm cursor-pointer flex-1"
                                >
                                  {lineup.name} ({lineup.lineupType || 'Main'})
                                </Label>
                              </div>
                            ))}
                          </div>

                          {/* Display selected lineups */}
                          {(formData.selectedLineups || []).length > 0 && (
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                              <Users className="h-3 w-3" />
                              Assigned to {(formData.selectedLineups || []).length} lineup(s): {(formData.selectedLineups || []).map(id => lineups.find(l => l.id === id)?.name).join(', ')}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Lineup-Specific Settings */}
                      {(formData.selectedLineups || []).length > 0 && (
                        <div className="space-y-4">
                          <h4 className="text-sm font-medium flex items-center gap-2">
                            <ImageIcon className="h-4 w-4" />
                            Lineup-Specific Settings
                          </h4>
                          <div className="space-y-4">
                            {(formData.selectedLineups || []).map((lineupId) => {
                              const lineup = lineups.find(l => l.id === lineupId)
                              return (
                                <div key={lineupId} className="p-4 border rounded-lg bg-muted/10">
                                  <h5 className="font-medium mb-3">{lineup?.name} ({lineup?.lineupType || 'Main'})</h5>
                                  <div className="space-y-3">
                                    {/* Lineup Profile Picture */}
                                    <div className="space-y-2">
                                      <Label htmlFor={`lineup-pic-${lineupId}`}>
                                        Profile Picture
                                      </Label>
                                      <Input
                                        id={`lineup-pic-${lineupId}`}
                                        value={formData.lineupProfilePictures[lineupId] || ''}
                                        onChange={(e) => {
                                          setFormData(prev => ({
                                            ...prev,
                                            lineupProfilePictures: {
                                              ...prev.lineupProfilePictures,
                                              [lineupId]: e.target.value
                                            }
                                          }))
                                          // Clear related error
                                          if (errors[`lineupProfilePicture_${lineupId}`]) {
                                            setErrors(prev => ({ ...prev, [`lineupProfilePicture_${lineupId}`]: '' }))
                                          }
                                        }}
                                        placeholder="URL foto profil khusus untuk lineup ini"
                                        className={`text-sm ${errors[`lineupProfilePicture_${lineupId}`] ? 'border-destructive' : ''}`}
                                      />
                                      {errors[`lineupProfilePicture_${lineupId}`] && (
                                        <p className="text-sm text-destructive">{errors[`lineupProfilePicture_${lineupId}`]}</p>
                                      )}
                                    </div>

                                    {/* Lineup Alias */}
                                    <div className="space-y-2">
                                      <Label htmlFor={`lineup-alias-${lineupId}`}>
                                        Alias/Stage Name
                                      </Label>
                                      <Input
                                        id={`lineup-alias-${lineupId}`}
                                        value={formData.lineupAliases[lineupId] || ''}
                                        onChange={(e) => {
                                          setFormData(prev => ({
                                            ...prev,
                                            lineupAliases: {
                                              ...prev.lineupAliases,
                                              [lineupId]: e.target.value
                                            }
                                          }))
                                          // Clear related error
                                          if (errors[`lineupAlias_${lineupId}`]) {
                                            setErrors(prev => ({ ...prev, [`lineupAlias_${lineupId}`]: '' }))
                                          }
                                        }}
                                        placeholder={`Nama khusus untuk lineup ${lineup?.name}`}
                                        className={`text-sm ${errors[`lineupAlias_${lineupId}`] ? 'border-destructive' : ''}`}
                                      />
                                      {errors[`lineupAlias_${lineupId}`] && (
                                        <p className="text-sm text-destructive">{errors[`lineupAlias_${lineupId}`]}</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                          <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded">
                            💡 <strong>Tip:</strong> Lineup profile pictures dan alias akan digunakan khusus untuk konteks lineup tersebut. Ini memungkinkan aktris memiliki identitas yang berbeda di setiap lineup.
                          </div>
                        </div>
                      )}

                      {/* Debug info */}
                      {initialData && type === 'actress' && (
                        <div className="text-xs text-muted-foreground mt-2 p-2 bg-muted/30 rounded">
                          <strong>Debug:</strong><br />
                          selectedGroups: {JSON.stringify(initialData.selectedGroups)}<br />
                          legacy groupId: {initialData.groupId || 'none'}<br />
                          current selectedGroups: {JSON.stringify(formData.selectedGroups)}<br />
                          groupProfilePictures: {JSON.stringify(formData.groupProfilePictures)}<br />
                          selectedLineups: {JSON.stringify(formData.selectedLineups)}<br />
                          lineupProfilePictures: {JSON.stringify(formData.lineupProfilePictures)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="media" className="space-y-4 mt-6 min-h-[500px] w-full">
              {/* Profile Pictures Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Foto Profil
                </h3>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>URL Foto Profil (Multiple)</Label>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setShowImageSearch(true)
                        setAutoSearchImage(true)
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={!formData.name?.trim()}
                    >
                      <Search className="h-4 w-4 mr-1" />
                      Cari Gambar dengan "{formData.name || 'Nama'}"
                    </Button>
                  </div>

                  {/* Image Search Iframe */}
                  {showImageSearch && (
                    <ImageSearchIframe
                      onImageSelect={handleImageSelect}
                      onAddPhotoField={addProfilePictureField}
                      searchQuery={formData.name}
                      name={formData.name}
                      jpname={formData.jpname}
                      type={type}
                      className="mb-4"
                      autoSearch={autoSearchImage}
                    />
                  )}

                  {/* Add Photo Buttons */}
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addProfilePictureField}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Tambah Foto
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddPhotoWithPaste}
                    >
                      <Clipboard className="h-4 w-4 mr-1" />
                      Tambah Foto
                    </Button>
                  </div>

                  {/* Preview existing photos with drag and drop */}
                  {formData.profilePictures.some(p => p.trim()) && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">
                        💡 Drag & drop foto untuk mengubah urutan (field pertama = avatar utama)
                      </p>
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext
                          items={formData.profilePictures.filter(p => p.trim()).map((_, index) => `photo-${index}`)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="flex flex-wrap gap-2 p-2 rounded-lg">
                            {formData.profilePictures.filter(p => p.trim()).map((pic, index) => (
                              <SortablePhoto
                                key={`${pic}-${index}`}
                                photo={pic}
                                index={index}
                                name={formData.name}
                                onRemove={handleRemovePhotoFromPreview}
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                    </div>
                  )}

                  <div className="space-y-2">
                    {formData.profilePictures.map((pic, index) => (
                      <div key={index} className="flex gap-2">
                        <div className="flex-1 space-y-1">
                          <Input
                            value={pic}
                            onChange={(e) => handleProfilePicturesChange(index, e.target.value)}
                            placeholder={`https://example.com/photo${index + 1}.jpg`}
                            className={errors[`profilePicture_${index}`] ? 'border-destructive' : ''}
                          />
                          {errors[`profilePicture_${index}`] && (
                            <p className="text-sm text-destructive">{errors[`profilePicture_${index}`]}</p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => pasteToField(index)}
                            title="Tempel URL dari clipboard"
                          >
                            <Clipboard className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeProfilePictureField(index)}
                            title={
                              formData.profilePictures.length === 1
                                ? "Kosongkan field foto"
                                : `Hapus field foto ${index + 1}`
                            }
                          >
                            {formData.profilePictures.length === 1 ? (
                              <RotateCcw className="h-4 w-4" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><strong>Foto di field pertama</strong> akan disimpan sebagai <em>profilePicture</em> dan digunakan sebagai avatar utama. Foto tambahan akan disimpan sebagai galeri dan ditampilkan di profile page dengan cycling.</p>
                    <p className="text-xs">
                      💡 <strong>Tip:</strong> Tombol dengan icon {formData.profilePictures.length === 1 ? '↻ (reset)' : '🗑️ (hapus)'} akan {formData.profilePictures.length === 1 ? 'mengosongkan field' : 'menghapus field'}. Avatar utama akan selalu menggunakan foto dari field pertama.
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Links Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" />
                  Link-link
                </h3>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Website/Social Media Links</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addLinkField}>
                      <Plus className="h-4 w-4 mr-1" />
                      Tambah Link
                    </Button>
                  </div>

                  {formData.links.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Belum ada link. Klik tombol "Tambah Link" untuk menambah.</p>
                  ) : (
                    <div className="space-y-3">
                      {formData.links.map((link, index) => (
                        <div key={link.id} className="flex gap-2 items-start">
                          <div className="grid grid-cols-2 gap-2 flex-1">
                            <div className="space-y-1">
                              <Input
                                value={link.label}
                                onChange={(e) => handleLinksChange(index, 'label', e.target.value)}
                                placeholder="Label (contoh: Instagram)"
                              />
                            </div>
                            <div className="space-y-1">
                              <Input
                                value={link.url}
                                onChange={(e) => handleLinksChange(index, 'url', e.target.value)}
                                placeholder="https://..."
                                className={errors[`link_${index}`] ? 'border-destructive' : ''}
                              />
                              {errors[`link_${index}`] && (
                                <p className="text-sm text-destructive">{errors[`link_${index}`]}</p>
                              )}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeLinkField(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Tags Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Tags
                  </h3>

                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags (pisahkan dengan koma)</Label>
                    <Textarea
                      id="tags"
                      value={formData.tags}
                      onChange={(e) => handleInputChange('tags', e.target.value)}
                      placeholder="contoh: cantik, populer, debut 2020"
                      rows={3}
                    />
                    {formData.tags && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {formData.tags.split(',').map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag.trim()}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </TabsContent>

            {type === 'actress' && (
              <TabsContent value="taku" className="space-y-4 mt-6 min-h-[500px] w-full">
                {/* Taku Links Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Taku Links
                  </h3>
                  <MultipleTakuLinks
                    links={formData.takulinks}
                    onChange={(links) => handleInputChange('takulinks', links)}
                    jpname={formData.jpname}
                    alias={formData.alias}
                    name={formData.name}
                    kanjiName={formData.kanjiName}
                    kanaName={formData.kanaName}
                    autoSearch={autoSearchTakuLinks}
                  />
                </div>
              </TabsContent>
            )}
          </Tabs>

        </form>
      </CardContent>

      {/* Sticky Bottom Buttons */}
      <div className="sticky bottom-0 bg-background border-t px-6 py-4 flex gap-3 justify-end">
        <Button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2"
          onClick={handleSubmit}
        >
          <Save className="h-4 w-4" />
          {isLoading ? 'Menyimpan...' : isEditing ? 'Update' : 'Simpan'}
        </Button>

        {onClose && (
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            <X className="h-4 w-4 mr-2" />
            Batal
          </Button>
        )}
      </div>
    </Card>
  )
}