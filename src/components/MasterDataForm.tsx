import React, { useState } from 'react'
import { MasterDataItem } from '../utils/masterDataApi'
import { masterDataApi } from '../utils/masterDataApi'
import { Languages, Type } from 'lucide-react'

interface MasterDataFormProps {
  type: 'actor' | 'actress' | 'director' | 'studio' | 'series'
  initialName: string
  accessToken: string
  onSave: (item: MasterDataItem) => void
  onCancel: () => void
}

export function MasterDataForm({ type, initialName, accessToken, onSave, onCancel }: MasterDataFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [translating, setTranslating] = useState(false)
  const [convertingRomaji, setConvertingRomaji] = useState(false)



  // Form state based on type
  const [formData, setFormData] = useState(() => {
    const baseData = {
      name: initialName,
      jpname: initialName
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
      default:
        return baseData
    }
  })

  const translateToEnglish = async () => {
    if (!formData.titleJp) return

    setTranslating(true)
    try {
      // Simple translation using a free API (you can replace with your preferred translation service)
      const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(formData.titleJp)}&langpair=ja|en`)
      const data = await response.json()
      
      if (data.responseStatus === 200 && data.responseData?.translatedText) {
        setFormData({ ...formData, titleEn: data.responseData.translatedText })
      } else {
        // Fallback: just copy the Japanese text
        setFormData({ ...formData, titleEn: formData.titleJp })
      }
    } catch (error) {
      console.error('Translation error:', error)
      // Fallback: just copy the Japanese text
      setFormData({ ...formData, titleEn: formData.titleJp })
    } finally {
      setTranslating(false)
    }
  }

  const translateNameToEnglish = async () => {
    if (!formData.jpname) return

    setTranslating(true)
    try {
      // Simple translation using a free API
      const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(formData.jpname)}&langpair=ja|en`)
      const data = await response.json()
      
      if (data.responseStatus === 200 && data.responseData?.translatedText) {
        setFormData({ ...formData, name: data.responseData.translatedText })
      } else {
        // Fallback: just copy the Japanese text
        setFormData({ ...formData, name: formData.jpname })
      }
    } catch (error) {
      console.error('Translation error:', error)
      // Fallback: just copy the Japanese text
      setFormData({ ...formData, name: formData.jpname })
    } finally {
      setTranslating(false)
    }
  }

  const convertToRomaji = async () => {
    if (!formData.jpname) return

    setConvertingRomaji(true)
    try {
      // Simple romaji conversion using a free API
      const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(formData.jpname)}&langpair=ja|en`)
      const data = await response.json()
      
      if (data.responseStatus === 200 && data.responseData?.translatedText) {
        // Use the translated text as romaji (this is a simple approach)
        setFormData({ ...formData, name: data.responseData.translatedText })
      } else {
        // Fallback: basic romaji conversion using a simple mapping
        const romaji = convertJapaneseToRomaji(formData.jpname)
        setFormData({ ...formData, name: romaji })
      }
    } catch (error) {
      console.error('Romaji conversion error:', error)
      // Fallback: basic romaji conversion
      const romaji = convertJapaneseToRomaji(formData.jpname)
      setFormData({ ...formData, name: romaji })
    } finally {
      setConvertingRomaji(false)
    }
  }

  // Simple Japanese to Romaji conversion function
  const convertJapaneseToRomaji = (japanese: string): string => {
    // Basic mapping for common Japanese characters to romaji
    const romajiMap: { [key: string]: string } = {
      'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
      'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
      'さ': 'sa', 'し': 'shi', 'す': 'su', 'せ': 'se', 'そ': 'so',
      'た': 'ta', 'ち': 'chi', 'つ': 'tsu', 'て': 'te', 'と': 'to',
      'な': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
      'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he', 'ほ': 'ho',
      'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
      'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
      'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
      'わ': 'wa', 'を': 'wo', 'ん': 'n',
      'が': 'ga', 'ぎ': 'gi', 'ぐ': 'gu', 'げ': 'ge', 'ご': 'go',
      'ざ': 'za', 'じ': 'ji', 'ず': 'zu', 'ぜ': 'ze', 'ぞ': 'zo',
      'だ': 'da', 'ぢ': 'ji', 'づ': 'zu', 'で': 'de', 'ど': 'do',
      'ば': 'ba', 'び': 'bi', 'ぶ': 'bu', 'べ': 'be', 'ぼ': 'bo',
      'ぱ': 'pa', 'ぴ': 'pi', 'ぷ': 'pu', 'ぺ': 'pe', 'ぽ': 'po',
      'きゃ': 'kya', 'きゅ': 'kyu', 'きょ': 'kyo',
      'しゃ': 'sha', 'しゅ': 'shu', 'しょ': 'sho',
      'ちゃ': 'cha', 'ちゅ': 'chu', 'ちょ': 'cho',
      'にゃ': 'nya', 'にゅ': 'nyu', 'にょ': 'nyo',
      'ひゃ': 'hya', 'ひゅ': 'hyu', 'ひょ': 'hyo',
      'みゃ': 'mya', 'みゅ': 'myu', 'みょ': 'myo',
      'りゃ': 'rya', 'りゅ': 'ryu', 'りょ': 'ryo',
      'ぎゃ': 'gya', 'ぎゅ': 'gyu', 'ぎょ': 'gyo',
      'じゃ': 'ja', 'じゅ': 'ju', 'じょ': 'jo',
      'びゃ': 'bya', 'びゅ': 'byu', 'びょ': 'byo',
      'ぴゃ': 'pya', 'ぴゅ': 'pyu', 'ぴょ': 'pyo'
    }

    let result = japanese
    // Replace katakana with hiragana first
    result = result.replace(/[\u30A1-\u30F6]/g, (match) => 
      String.fromCharCode(match.charCodeAt(0) - 0x60)
    )
    
    // Convert hiragana to romaji
    for (const [hiragana, romaji] of Object.entries(romajiMap)) {
      result = result.replace(new RegExp(hiragana, 'g'), romaji)
    }
    
    return result
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
          newItem = await masterDataApi.createExtended('studio', {
            name: formData.name,
            jpname: formData.jpname,
            alias: formData.alias || undefined,
            studioLinks: formData.studioLinks || undefined
          }, accessToken)
          break
        case 'actress':
          newItem = await masterDataApi.createExtended('actress', {
            name: formData.name,
            jpname: formData.jpname,
            birthdate: formData.birthdate || undefined,
            alias: formData.alias || undefined,
            tags: formData.tags || undefined,
            takulinks: formData.takulinks || undefined,
            profilePicture: formData.profilePicture || undefined
          }, accessToken)
          break
        case 'actor':
          newItem = await masterDataApi.createExtended('actor', {
            name: formData.name,
            jpname: formData.jpname,
            birthdate: formData.birthdate || undefined,
            alias: formData.alias || undefined,
            tags: formData.tags || undefined,
            profilePicture: formData.profilePicture || undefined
          }, accessToken)
          break
        case 'director':
          newItem = await masterDataApi.createExtended('director', {
            name: formData.name,
            jpname: formData.jpname,
            birthdate: formData.birthdate || undefined,
            alias: formData.alias || undefined,
            tags: formData.tags || undefined,
            profilePicture: formData.profilePicture || undefined
          }, accessToken)
          break
        default:
          throw new Error('Invalid type')
      }

      onSave(newItem)
    } catch (err: any) {
      console.error('Error creating master data:', err)
      setError(err.message || 'Failed to create item')
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
      default: return 'Tambah Data Baru'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">{getTitle()}</h3>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Series specific fields */}
          {type === 'series' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title English
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.titleEn}
                    onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                    placeholder="Masukkan title bahasa Inggris"
                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={translateToEnglish}
                    disabled={translating || !formData.titleJp}
                    className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    title="Translate to English"
                  >
                    <Languages className="h-4 w-4" />
                    {translating ? '...' : 'Translate'}
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nama Studio (English) *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <button
                    type="button"
                    onClick={translateNameToEnglish}
                    disabled={translating || convertingRomaji || !formData.jpname}
                    className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    title="Translate to English"
                  >
                    <Languages className="h-4 w-4" />
                    {translating ? '...' : 'Translate'}
                  </button>
                  <button
                    type="button"
                    onClick={convertToRomaji}
                    disabled={translating || convertingRomaji || !formData.jpname}
                    className="px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    title="Convert to Romaji"
                  >
                    <Type className="h-4 w-4" />
                    {convertingRomaji ? '...' : 'Romaji'}
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nama
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <button
                    type="button"
                    onClick={translateNameToEnglish}
                    disabled={translating || convertingRomaji || !formData.jpname}
                    className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    title="Translate to English"
                  >
                    <Languages className="h-4 w-4" />
                    {translating ? '...' : 'Translate'}
                  </button>
                  <button
                    type="button"
                    onClick={convertToRomaji}
                    disabled={translating || convertingRomaji || !formData.jpname}
                    className="px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    title="Convert to Romaji"
                  >
                    <Type className="h-4 w-4" />
                    {convertingRomaji ? '...' : 'Romaji'}
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Link Foto Profile
                  </label>
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
              disabled={loading}
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
