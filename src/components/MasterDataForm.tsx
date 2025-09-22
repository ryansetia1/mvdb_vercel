import React, { useState, useEffect } from 'react'
import { MasterDataItem } from '../utils/masterDataApi'
import { masterDataApi } from '../utils/masterDataApi'
import { translateJapaneseToEnglishWithContext, convertJapaneseToRomaji } from '../utils/deepseekTranslationApi'
import { AITranslationSpinner } from './AITranslationLoading'
import { ShimmerInput } from './ShimmerInput'
import { Languages, Type, Search, Brain, Sparkles } from 'lucide-react'
import { ImageSearchIframe } from './ImageSearchIframe'
import { normalizeJapaneseNames } from '../utils/japaneseNameNormalizer'
import { toast } from 'sonner'

interface MasterDataFormProps {
  type: 'actor' | 'actress' | 'director' | 'studio' | 'series' | 'label'
  initialName: string
  accessToken: string
  onSave: (item: MasterDataItem) => void
  onCancel: () => void
  // Additional R18.dev data
  r18Data?: {
    // For director
    name_romaji?: string
    name_kanji?: string
    name_kana?: string
    // For series
    name_en?: string
    name_ja?: string
    // For label
    label_name_en?: string
    label_name_ja?: string
  }
}

export function MasterDataForm({ type, initialName, accessToken, onSave, onCancel, r18Data }: MasterDataFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [translating, setTranslating] = useState(false)
  const [convertingRomaji, setConvertingRomaji] = useState(false)
  const [translationMethod, setTranslationMethod] = useState<'ai' | 'fallback' | 'original' | null>(null)
  const [romajiMethod, setRomajiMethod] = useState<'ai' | 'fallback' | 'original' | null>(null)
  const [duplicateError, setDuplicateError] = useState<{
    message: string
    existingItem: MasterDataItem | null
    showUseExisting: boolean
  } | null>(null)
  const [showImageSearch, setShowImageSearch] = useState(false)
  const [autoSearchImage, setAutoSearchImage] = useState(false) // Control auto search trigger

  // Reset autoSearchImage after it's been used
  useEffect(() => {
    if (autoSearchImage) {
      const timer = setTimeout(() => {
        setAutoSearchImage(false)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [autoSearchImage])



  // Form state based on type
  const [formData, setFormData] = useState(() => {
    const baseData = {
      name: initialName,
      jpname: initialName,
      kanjiName: '',
      kanaName: ''
    }

    switch (type) {
      case 'series':
        return {
          ...baseData,
          titleEn: initialName,
          titleJp: initialName,
          seriesLinks: ''
        }
      case 'studio':
        return {
          ...baseData,
          studioLinks: '',
          alias: ''
        }
      case 'actress':
        return {
          ...baseData,
          birthdate: '',
          alias: '',
          tags: '',
          takulinks: '',
          profilePicture: ''
        }
      case 'actor':
        return {
          ...baseData,
          birthdate: '',
          alias: '',
          tags: '',
          profilePicture: ''
        }
      case 'director':
        return {
          ...baseData,
          birthdate: '',
          alias: '',
          tags: '',
          profilePicture: ''
        }
      case 'label':
        return {
          ...baseData,
          labelLinks: ''
        }
      default:
        return baseData
    }
  })

  const translateToEnglish = async () => {
    if (type !== 'series' || !('titleJp' in formData) || !formData.titleJp) return

    setTranslating(true)
    try {
      // Menggunakan DeepSeek R1 untuk translate dengan konteks series name
      const translationResult = await translateJapaneseToEnglishWithContext(formData.titleJp, 'series_name', undefined, accessToken)
      
      if (translationResult.translatedText && translationResult.translatedText !== formData.titleJp) {
        setFormData({ ...formData, titleEn: translationResult.translatedText })
        setTranslationMethod(translationResult.translationMethod)
        
        // Show appropriate success message based on translation method
        if (translationResult.translationMethod === 'ai') {
          toast.success('Title berhasil diterjemahkan menggunakan DeepSeek R1')
        } else if (translationResult.translationMethod === 'fallback') {
          toast.success('Title diterjemahkan menggunakan MyMemory API (fallback)')
        } else {
          toast.success('Title menggunakan teks asli')
        }
      } else {
        // Fallback: just copy the Japanese text
        setFormData({ ...formData, titleEn: formData.titleJp })
        setTranslationMethod('original')
        toast.warning('Terjemahan tidak tersedia, menggunakan text asli')
      }
    } catch (error) {
      console.error('Translation error:', error)
      // Fallback: just copy the Japanese text
      setFormData({ ...formData, titleEn: formData.titleJp })
      setTranslationMethod('original')
      toast.error('Terjadi error saat menerjemahkan, menggunakan text asli')
    } finally {
      setTranslating(false)
    }
  }

  const translateNameToEnglish = async () => {
    if (!formData.jpname) return

    setTranslating(true)
    try {
      // Menggunakan DeepSeek R1 untuk translate dengan konteks yang sesuai
      const context = type === 'actress' ? 'actress_name' : type === 'actor' ? 'actor_name' : 'general'
      const translationResult = await translateJapaneseToEnglishWithContext(formData.jpname, context, undefined, accessToken)
      
      if (translationResult.translatedText && translationResult.translatedText !== formData.jpname) {
        setFormData({ ...formData, name: translationResult.translatedText })
        setTranslationMethod(translationResult.translationMethod)
        
        // Show appropriate success message based on translation method
        if (translationResult.translationMethod === 'ai') {
          toast.success('Nama berhasil diterjemahkan menggunakan DeepSeek R1')
        } else if (translationResult.translationMethod === 'fallback') {
          toast.success('Nama diterjemahkan menggunakan MyMemory API (fallback)')
        } else {
          toast.success('Nama menggunakan teks asli')
        }
      } else {
        // Fallback: just copy the Japanese text
        setFormData({ ...formData, name: formData.jpname })
        setTranslationMethod('original')
        toast.warning('Terjemahan tidak tersedia, menggunakan nama asli')
      }
    } catch (error) {
      console.error('Translation error:', error)
      // Fallback: just copy the Japanese text
      setFormData({ ...formData, name: formData.jpname })
      setTranslationMethod('original')
      toast.error('Terjadi error saat menerjemahkan, menggunakan nama asli')
    } finally {
      setTranslating(false)
    }
  }

  const convertToRomaji = async () => {
    if (!formData.jpname) return

    setConvertingRomaji(true)
    try {
      // Menggunakan DeepSeek R1 untuk konversi romaji dengan fallback
      const romajiResult = await convertJapaneseToRomaji(formData.jpname, accessToken)
      
      if (romajiResult.translatedText && romajiResult.translatedText !== formData.jpname) {
        setFormData({ ...formData, name: romajiResult.translatedText })
        setRomajiMethod(romajiResult.translationMethod)
        
        // Show appropriate success message based on conversion method
        if (romajiResult.translationMethod === 'ai') {
          toast.success('Nama berhasil dikonversi ke Romaji menggunakan DeepSeek R1')
        } else if (romajiResult.translationMethod === 'fallback') {
          toast.success('Nama dikonversi ke Romaji menggunakan fallback')
        } else {
          toast.success('Nama menggunakan teks asli')
        }
      } else {
        setRomajiMethod('original')
        toast.warning('Konversi Romaji tidak tersedia, menggunakan nama asli')
      }
    } catch (error) {
      console.error('Romaji conversion error:', error)
      setRomajiMethod('original')
      toast.error('Terjadi error saat konversi Romaji')
    } finally {
      setConvertingRomaji(false)
    }
  }

  const handleConfirmR18Data = () => {
    if (!r18Data) return

    let updatedFormData = { ...formData }

    switch (type) {
      case 'director':
        if (r18Data.name_romaji) {
          updatedFormData.name = r18Data.name_romaji
        }
        if (r18Data.name_kanji) {
          updatedFormData.kanjiName = r18Data.name_kanji
        }
        if (r18Data.name_kana) {
          updatedFormData.kanaName = r18Data.name_kana
        }
        break

      case 'series':
        if (r18Data.name_en) {
          updatedFormData.titleEn = r18Data.name_en
        }
        if (r18Data.name_ja) {
          updatedFormData.titleJp = r18Data.name_ja
        }
        break

      case 'label':
        if (r18Data.label_name_en) {
          updatedFormData.name = r18Data.label_name_en
        }
        if (r18Data.label_name_ja) {
          updatedFormData.jpname = r18Data.label_name_ja
        }
        break

      default:
        break
    }

    setFormData(updatedFormData)
    toast.success('Data dari R18.dev telah dikonfirmasi dan diisi ke form')
  }

  const handleImageSelect = (imageUrl: string) => {
    setFormData({ ...formData, profilePicture: imageUrl })
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Don't submit if there's a duplicate error
    if (duplicateError) {
      return
    }
    
    setLoading(true)
    setError('')

    try {
      let newItem: MasterDataItem

      switch (type) {
        case 'series':
          newItem = await masterDataApi.createSeries(
            formData.titleEn || '',
            formData.titleJp || '',
            formData.seriesLinks || '',
            accessToken
          )
          break
        case 'studio':
          // Normalize Japanese names to avoid redundancy
          const studioNormalizedNames = normalizeJapaneseNames({
            jpname: formData.jpname,
            kanjiName: formData.kanjiName
          })
          newItem = await masterDataApi.createExtended('studio', {
            name: formData.name,
            jpname: studioNormalizedNames.jpname || undefined,
            kanjiName: studioNormalizedNames.kanjiName || undefined,
            kanaName: formData.kanaName || undefined,
            alias: formData.alias || undefined,
            studioLinks: formData.studioLinks || undefined
          }, accessToken)
          break
        case 'actress':
          // Normalize Japanese names to avoid redundancy
          const actressNormalizedNames = normalizeJapaneseNames({
            jpname: formData.jpname,
            kanjiName: formData.kanjiName
          })
          newItem = await masterDataApi.createExtended('actress', {
            name: formData.name,
            jpname: actressNormalizedNames.jpname || undefined,
            kanjiName: actressNormalizedNames.kanjiName || undefined,
            kanaName: formData.kanaName || undefined,
            birthdate: formData.birthdate || undefined,
            alias: formData.alias || undefined,
            tags: formData.tags || undefined,
            takulinks: formData.takulinks || undefined,
            profilePicture: formData.profilePicture || undefined
          }, accessToken)
          break
        case 'actor':
          // Normalize Japanese names to avoid redundancy
          const actorNormalizedNames = normalizeJapaneseNames({
            jpname: formData.jpname,
            kanjiName: formData.kanjiName
          })
          newItem = await masterDataApi.createExtended('actor', {
            name: formData.name,
            jpname: actorNormalizedNames.jpname || undefined,
            kanjiName: actorNormalizedNames.kanjiName || undefined,
            kanaName: formData.kanaName || undefined,
            birthdate: formData.birthdate || undefined,
            alias: formData.alias || undefined,
            tags: formData.tags || undefined,
            profilePicture: formData.profilePicture || undefined
          }, accessToken)
          break
        case 'director':
          // Normalize Japanese names to avoid redundancy
          const directorNormalizedNames = normalizeJapaneseNames({
            jpname: formData.jpname,
            kanjiName: formData.kanjiName
          })
          newItem = await masterDataApi.createExtended('director', {
            name: formData.name,
            jpname: directorNormalizedNames.jpname || undefined,
            kanjiName: directorNormalizedNames.kanjiName || undefined,
            kanaName: formData.kanaName || undefined,
            birthdate: formData.birthdate || undefined,
            alias: formData.alias || undefined,
            tags: formData.tags || undefined,
            profilePicture: formData.profilePicture || undefined
          }, accessToken)
          break
        case 'label':
          // Normalize Japanese names to avoid redundancy
          const labelNormalizedNames = normalizeJapaneseNames({
            jpname: formData.jpname,
            kanjiName: formData.kanjiName
          })
          newItem = await masterDataApi.createExtended('label', {
            name: formData.name,
            jpname: labelNormalizedNames.jpname || undefined,
            kanjiName: labelNormalizedNames.kanjiName || undefined,
            kanaName: formData.kanaName || undefined,
            labelLinks: formData.labelLinks || undefined
          }, accessToken)
          break
        default:
          throw new Error('Invalid type')
      }

      onSave(newItem)
    } catch (err: any) {
      console.error('Error creating master data:', err)
      console.log('Error message:', err.message)
      console.log('Error type:', typeof err)
      console.log('Error includes already exists:', err.message?.includes('already exists'))
      
      // Check if it's a duplicate error - check multiple possible error messages
      const isDuplicateError = err.message && (
        err.message.includes('already exists') ||
        err.message.includes('Studio with this name already exists') ||
        err.message.includes('duplicate') ||
        err.message.includes('exists')
      )
      
      console.log('Is duplicate error:', isDuplicateError)
      
      if (isDuplicateError) {
        // Try to find the existing item
        try {
          console.log('Searching for existing items...')
          const existingItems = await masterDataApi.getByType(type, accessToken)
          console.log('Found existing items:', existingItems.length)
          
          const existingItem = existingItems.find(item => 
            item.name?.toLowerCase() === formData.name?.toLowerCase()
          )
          
          console.log('Found existing item:', existingItem)
          
          if (existingItem) {
            setDuplicateError({
              message: err.message,
              existingItem,
              showUseExisting: true
            })
            setError('') // Clear regular error
            return
          }
        } catch (searchErr) {
          console.error('Error searching for existing item:', searchErr)
        }
      }
      
      setError(err.message || 'Failed to create item')
    } finally {
      setLoading(false)
    }
  }

  const handleUseExisting = () => {
    if (duplicateError?.existingItem) {
      onSave(duplicateError.existingItem)
    }
  }

  const handleUpdateExisting = async () => {
    if (!duplicateError?.existingItem) return
    
    try {
      setLoading(true)
      setError('')
      
      // Update the existing item with Japanese name if it's not already set
      const existingItem = duplicateError.existingItem
      const updateData = { ...existingItem }
      
      // For studio, add Japanese name if not already present
      if (type === 'studio' && formData.jpname && !existingItem.jpname) {
        updateData.jpname = formData.jpname
        await masterDataApi.updateExtended('studio', existingItem.id, updateData, accessToken)
      }
      
      onSave(updateData)
    } catch (err: any) {
      console.error('Error updating existing item:', err)
      setError(err.message || 'Failed to update existing item')
    } finally {
      setLoading(false)
    }
  }

  const getTitle = () => {
    switch (type) {
      case 'series': return 'Tambah Series Baru'
      case 'studio': return 'Tambah Studio Baru'
      case 'actress': return 'Tambah Aktris Baru'
      case 'actor': return 'Tambah Aktor Baru'
      case 'director': return 'Tambah Director Baru'
      case 'label': return 'Tambah Label Baru'
      default: return 'Tambah Data Baru'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">{getTitle()}</h3>
        
        {/* R18.dev Data Information */}
        {r18Data && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-blue-900">Data dari R18.dev</h4>
              <button
                type="button"
                onClick={handleConfirmR18Data}
                className="text-xs text-blue-600 font-medium bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded transition-colors"
              >
                Konfirmasi
              </button>
            </div>
            
            {type === 'director' && r18Data.name_romaji && (
              <div className="text-sm text-blue-800 space-y-1">
                <div><strong>Romaji:</strong> {r18Data.name_romaji}</div>
                {r18Data.name_kanji && <div><strong>Kanji:</strong> {r18Data.name_kanji}</div>}
                {r18Data.name_kana && <div><strong>Kana:</strong> {r18Data.name_kana}</div>}
              </div>
            )}
            
            {type === 'series' && (r18Data.name_en || r18Data.name_ja) && (
              <div className="text-sm text-blue-800 space-y-1">
                {r18Data.name_en && <div><strong>English:</strong> {r18Data.name_en}</div>}
                {r18Data.name_ja && <div><strong>Japanese:</strong> {r18Data.name_ja}</div>}
              </div>
            )}
            
            {type === 'label' && (r18Data.label_name_en || r18Data.label_name_ja) && (
              <div className="text-sm text-blue-800 space-y-1">
                {r18Data.label_name_en && <div><strong>English:</strong> {r18Data.label_name_en}</div>}
                {r18Data.label_name_ja && <div><strong>Japanese:</strong> {r18Data.label_name_ja}</div>}
              </div>
            )}
            
            <div className="mt-2 text-xs text-blue-600">
              Data ini akan ditambahkan ke database dengan informasi lengkap.
            </div>
          </div>
        )}
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {duplicateError && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="text-yellow-800 mb-3">
              <p className="font-medium">{duplicateError.message}</p>
              {duplicateError.existingItem && (
                <p className="text-sm mt-1">
                  Existing {type}: <strong>{duplicateError.existingItem.name}</strong>
                  {duplicateError.existingItem.jpname && (
                    <span> ({duplicateError.existingItem.jpname})</span>
                  )}
                </p>
              )}
            </div>
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleUseExisting}
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Use Existing
              </button>
              
              {type === 'studio' && formData.jpname && duplicateError.existingItem && !duplicateError.existingItem.jpname && (
                <button
                  type="button"
                  onClick={handleUpdateExisting}
                  disabled={loading}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Update with Japanese Name
                </button>
              )}
              
              <button
                type="button"
                onClick={() => {
                  setDuplicateError(null)
                  setError('')
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Series specific fields */}
          {type === 'series' && (
            <>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Title English
                  </label>
                  {translationMethod && (
                    <span className={`text-xs font-medium px-2 py-1 rounded ${
                      translationMethod === 'ai' 
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' 
                        : translationMethod === 'fallback'
                        ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'
                    }`}>
                      {translationMethod === 'ai' ? 'AI' : translationMethod === 'fallback' ? 'Fallback' : 'Original'}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <ShimmerInput
                    type="text"
                    value={formData.titleEn}
                    onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                    placeholder="Masukkan title bahasa Inggris"
                    isShimmering={translating}
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={translateToEnglish}
                    disabled={translating || !formData.titleJp}
                    className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    title="Translate to English using DeepSeek R1"
                  >
                    {translating ? (
                      <>
                        <AITranslationSpinner size="sm" />
                        <span>AI Translating...</span>
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4" />
                        <span>Translate</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title Japanese
                </label>
                <input
                  type="text"
                  value={formData.titleJp}
                  onChange={(e) => setFormData({ ...formData, titleJp: e.target.value })}
                  placeholder="Masukkan title bahasa Jepang"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Series Links
                </label>
                <textarea
                  value={formData.seriesLinks}
                  onChange={(e) => setFormData({ ...formData, seriesLinks: e.target.value })}
                  placeholder="Masukkan links series (pisahkan dengan baris baru)"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-20"
                />
              </div>
            </>
          )}

          {/* Studio specific fields */}
          {type === 'studio' && (
            <>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nama Studio (English) *
                  </label>
                  {translationMethod && (
                    <span className={`text-xs font-medium px-2 py-1 rounded ${
                      translationMethod === 'ai' 
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' 
                        : translationMethod === 'fallback'
                        ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'
                    }`}>
                      {translationMethod === 'ai' ? 'AI' : translationMethod === 'fallback' ? 'Fallback' : 'Original'}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <ShimmerInput
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    isShimmering={translating}
                    className="flex-1"
                    required
                  />
                  <button
                    type="button"
                    onClick={translateNameToEnglish}
                    disabled={translating || convertingRomaji || !formData.jpname}
                    className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    title="Translate to English using DeepSeek R1"
                  >
                    {translating ? (
                      <>
                        <AITranslationSpinner size="sm" />
                        <span>AI Translating...</span>
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4" />
                        <span>Translate</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={convertToRomaji}
                    disabled={translating || convertingRomaji || !formData.jpname}
                    className="px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    title="Convert to Romaji using DeepSeek R1"
                  >
                    {convertingRomaji ? (
                      <>
                        <AITranslationSpinner size="sm" />
                        <span>AI Converting...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        <span>Romaji</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nama Jepang
                </label>
                <input
                  type="text"
                  value={formData.jpname}
                  onChange={(e) => setFormData({ ...formData, jpname: e.target.value })}
                  placeholder="Masukkan nama studio dalam bahasa Jepang"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Kanji Name
                </label>
                <input
                  type="text"
                  value={formData.kanjiName}
                  onChange={(e) => setFormData({ ...formData, kanjiName: e.target.value })}
                  placeholder="Masukkan nama dalam kanji (漢字)"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Kana Name
                </label>
                <input
                  type="text"
                  value={formData.kanaName}
                  onChange={(e) => setFormData({ ...formData, kanaName: e.target.value })}
                  placeholder="Masukkan nama dalam kana (かな)"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Alias
                </label>
                <input
                  type="text"
                  value={formData.alias}
                  onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
                  placeholder="Masukkan alias studio (opsional)"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Studio Links
                </label>
                <textarea
                  value={formData.studioLinks}
                  onChange={(e) => setFormData({ ...formData, studioLinks: e.target.value })}
                  placeholder="Masukkan links studio (pisahkan dengan baris baru)"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-20"
                />
              </div>
            </>
          )}

          {/* Person specific fields (actress, actor, director) */}
          {(type === 'actress' || type === 'actor' || type === 'director') && (
            <>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nama
                  </label>
                  {translationMethod && (
                    <span className={`text-xs font-medium px-2 py-1 rounded ${
                      translationMethod === 'ai' 
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' 
                        : translationMethod === 'fallback'
                        ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'
                    }`}>
                      {translationMethod === 'ai' ? 'AI' : translationMethod === 'fallback' ? 'Fallback' : 'Original'}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <ShimmerInput
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    isShimmering={translating}
                    className="flex-1"
                    required
                  />
                  <button
                    type="button"
                    onClick={translateNameToEnglish}
                    disabled={translating || convertingRomaji || !formData.jpname}
                    className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    title="Translate to English using DeepSeek R1"
                  >
                    {translating ? (
                      <>
                        <AITranslationSpinner size="sm" />
                        <span>AI Translating...</span>
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4" />
                        <span>Translate</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={convertToRomaji}
                    disabled={translating || convertingRomaji || !formData.jpname}
                    className="px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    title="Convert to Romaji using DeepSeek R1"
                  >
                    {convertingRomaji ? (
                      <>
                        <AITranslationSpinner size="sm" />
                        <span>AI Converting...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        <span>Romaji</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nama Jepang
                </label>
                <input
                  type="text"
                  value={formData.jpname}
                  onChange={(e) => setFormData({ ...formData, jpname: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Kanji Name
                </label>
                <input
                  type="text"
                  value={formData.kanjiName}
                  onChange={(e) => setFormData({ ...formData, kanjiName: e.target.value })}
                  placeholder="Masukkan nama dalam kanji (漢字)"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Kana Name
                </label>
                <input
                  type="text"
                  value={formData.kanaName}
                  onChange={(e) => setFormData({ ...formData, kanaName: e.target.value })}
                  placeholder="Masukkan nama dalam kana (かな)"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tanggal Lahir
                </label>
                <input
                  type="date"
                  value={formData.birthdate}
                  onChange={(e) => setFormData({ ...formData, birthdate: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Alias
                </label>
                <input
                  type="text"
                  value={formData.alias}
                  onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
                  placeholder="Masukkan alias (opsional)"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tags
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="Masukkan tags (pisahkan dengan koma)"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {type === 'actress' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Taku Links
                  </label>
                  <input
                    type="text"
                    value={formData.takulinks}
                    onChange={(e) => setFormData({ ...formData, takulinks: e.target.value })}
                    placeholder="Masukkan Taku links (opsional)"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
              {(type === 'actress' || type === 'actor' || type === 'director') && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Link Foto Profile
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowImageSearch(true)
                        setAutoSearchImage(true)
                      }}
                      className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                      disabled={!formData.name?.trim()}
                    >
                      <Search className="h-4 w-4" />
                      Cari Gambar dengan "{formData.name || 'Nama'}"
                    </button>
                  </div>
                  
                  {/* Image Search Iframe */}
                  {showImageSearch && (
                    <div className="mb-4">
                      <ImageSearchIframe
                        onImageSelect={handleImageSelect}
                        onAddPhotoField={undefined}
                        searchQuery={formData.name}
                        name={formData.name}
                        jpname={formData.jpname}
                        type={type}
                        autoSearch={autoSearchImage}
                      />
                    </div>
                  )}
                  
                  <input
                    type="url"
                    value={formData.profilePicture}
                    onChange={(e) => setFormData({ ...formData, profilePicture: e.target.value })}
                    placeholder="Masukkan link foto profile (opsional)"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </>
          )}

          {/* Label specific fields */}
          {type === 'label' && (
            <>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nama Label (English) *
                  </label>
                  {translationMethod && (
                    <span className={`text-xs font-medium px-2 py-1 rounded ${
                      translationMethod === 'ai' 
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' 
                        : translationMethod === 'fallback'
                        ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'
                    }`}>
                      {translationMethod === 'ai' ? 'AI' : translationMethod === 'fallback' ? 'Fallback' : 'Original'}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <ShimmerInput
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    isShimmering={translating}
                    className="flex-1"
                    required
                  />
                  <button
                    type="button"
                    onClick={translateNameToEnglish}
                    disabled={translating || convertingRomaji || !formData.jpname}
                    className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    title="Translate to English using DeepSeek R1"
                  >
                    {translating ? (
                      <>
                        <AITranslationSpinner size="sm" />
                        <span>AI Translating...</span>
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4" />
                        <span>Translate</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={convertToRomaji}
                    disabled={translating || convertingRomaji || !formData.jpname}
                    className="px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    title="Convert to Romaji using DeepSeek R1"
                  >
                    {convertingRomaji ? (
                      <>
                        <AITranslationSpinner size="sm" />
                        <span>AI Converting...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        <span>Romaji</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nama Jepang
                </label>
                <input
                  type="text"
                  value={formData.jpname}
                  onChange={(e) => setFormData({ ...formData, jpname: e.target.value })}
                  placeholder="Masukkan nama label dalam bahasa Jepang"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Kanji Name
                </label>
                <input
                  type="text"
                  value={formData.kanjiName}
                  onChange={(e) => setFormData({ ...formData, kanjiName: e.target.value })}
                  placeholder="Masukkan nama dalam kanji (漢字)"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Kana Name
                </label>
                <input
                  type="text"
                  value={formData.kanaName}
                  onChange={(e) => setFormData({ ...formData, kanaName: e.target.value })}
                  placeholder="Masukkan nama dalam kana (かな)"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Label Links
                </label>
                <textarea
                  value={formData.labelLinks}
                  onChange={(e) => setFormData({ ...formData, labelLinks: e.target.value })}
                  placeholder="Masukkan links label (pisahkan dengan baris baru)"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-20"
                />
              </div>
            </>
          )}

          {/* Action buttons */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
              disabled={loading}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || !!duplicateError}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
            >
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
