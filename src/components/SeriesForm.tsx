import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { Plus, Trash2, Edit, Save, X, Globe, Brain } from 'lucide-react'
import { MasterDataItem, masterDataApi } from '../utils/masterDataApi'
import { translateJapaneseToEnglishWithContext } from '../utils/deepseekTranslationApi'
import { AITranslationSpinner } from './AITranslationLoading'
import { ShimmerInput } from './ShimmerInput'
import { toast } from 'sonner'

interface SeriesFormProps {
  accessToken: string
  data: MasterDataItem[]
  onDataChange: (newData: MasterDataItem[]) => void
}

interface FormData {
  titleEn: string
  titleJp: string
  seriesLinks: string
}

const initialFormData: FormData = {
  titleEn: '',
  titleJp: '',
  seriesLinks: ''
}

export function SeriesForm({ accessToken, data, onDataChange }: SeriesFormProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isTranslating, setIsTranslating] = useState(false)
  const [translationMethod, setTranslationMethod] = useState<'ai' | 'fallback' | 'original' | null>(null)

  const resetForm = () => {
    setFormData(initialFormData)
    setEditingId(null)
    setError('')
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const translateTitle = async () => {
    if (!formData.titleJp.trim()) {
      toast.error('Title Japanese harus diisi terlebih dahulu')
      return
    }

    setIsTranslating(true)
    try {
      // Menggunakan SumoPod AI untuk translate dengan konteks series
      const translationResult = await translateJapaneseToEnglishWithContext(formData.titleJp, 'series_name', undefined, accessToken)

      if (translationResult.translatedText && translationResult.translatedText !== formData.titleJp) {
        setFormData(prev => ({ ...prev, titleEn: translationResult.translatedText }))
        setTranslationMethod(translationResult.translationMethod)

        // Show appropriate success message based on translation method
        if (translationResult.translationMethod === 'ai') {
          toast.success('Title berhasil diterjemahkan menggunakan SumoPod AI')
        } else if (translationResult.translationMethod === 'fallback') {
          toast.success('Title diterjemahkan menggunakan MyMemory API (fallback)')
        } else {
          toast.success('Title menggunakan teks asli')
        }
      } else {
        toast.error('Gagal menerjemahkan title')
      }
    } catch (error) {
      console.error('Translation error:', error)
      toast.error('Terjadi error saat menerjemahkan title')
    } finally {
      setIsTranslating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.titleEn.trim() && !formData.titleJp.trim()) {
      setError('Minimal salah satu title (EN atau JP) harus diisi')
      return
    }

    setIsLoading(true)
    try {
      let result
      if (editingId) {
        result = await masterDataApi.updateSeries(
          editingId,
          formData.titleEn.trim(),
          formData.titleJp.trim(),
          formData.seriesLinks.trim(),
          accessToken
        )
        onDataChange(data.map(item => item.id === editingId ? result : item))
      } else {
        result = await masterDataApi.createSeries(
          formData.titleEn.trim(),
          formData.titleJp.trim(),
          formData.seriesLinks.trim(),
          accessToken
        )
        onDataChange([...data, result])
      }

      resetForm()
      setError('')
    } catch (error: any) {
      setError(error.message || `Gagal ${editingId ? 'mengupdate' : 'menambah'} series`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (item: MasterDataItem) => {
    setFormData({
      titleEn: item.titleEn || '',
      titleJp: item.titleJp || '',
      seriesLinks: item.seriesLinks || ''
    })
    setEditingId(item.id)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus series ini?')) return

    try {
      await masterDataApi.delete('series', id, accessToken)
      onDataChange(data.filter(item => item.id !== id))
      if (editingId === id) {
        resetForm()
      }
      setError('')
    } catch (error: any) {
      setError(`Gagal menghapus: ${error.message}`)
    }
  }

  return (
    <div className="space-y-6">
      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>
            {editingId ? 'Edit Series' : 'Tambah Series Baru'}
          </CardTitle>
          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Label htmlFor="titleEn">Title English</Label>
                  {translationMethod && (
                    <span className={`text-xs font-medium px-2 py-1 rounded ${translationMethod === 'ai'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                        : translationMethod === 'fallback'
                          ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'
                      }`}>
                      {translationMethod === 'ai' ? 'AI' : translationMethod === 'fallback' ? 'Fallback' : 'Original'}
                    </span>
                  )}
                </div>
                <ShimmerInput
                  id="titleEn"
                  value={formData.titleEn}
                  onChange={(e) => handleInputChange('titleEn', e.target.value)}
                  placeholder="Masukkan title bahasa Inggris"
                  isShimmering={isTranslating}
                />
              </div>

              <div>
                <Label htmlFor="titleJp">Title Japanese</Label>
                <div className="flex gap-2">
                  <Input
                    id="titleJp"
                    value={formData.titleJp}
                    onChange={(e) => handleInputChange('titleJp', e.target.value)}
                    placeholder="Masukkan title bahasa Jepang"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={translateTitle}
                    disabled={isTranslating || !formData.titleJp.trim()}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    title="Translate Japanese title to English using SumoPod AI"
                  >
                    {isTranslating ? (
                      <>
                        <AITranslationSpinner size="sm" />
                        <span className="hidden sm:inline">AI Translating...</span>
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4" />
                        <span className="hidden sm:inline">Translate</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="seriesLinks">Series Links</Label>
              <Textarea
                id="seriesLinks"
                value={formData.seriesLinks}
                onChange={(e) => handleInputChange('seriesLinks', e.target.value)}
                placeholder="Masukkan links series (pisahkan dengan baris baru)"
                rows={4}
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {isLoading ? 'Menyimpan...' : editingId ? 'Update' : 'Simpan'}
              </Button>

              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Batal
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Data List */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Series</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search bar */}
          <div className="mb-3">
            <Input
              placeholder="Cari series..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {data.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                Belum ada series yang ditambahkan
              </p>
            ) : (
              data
                .filter(item => {
                  const q = searchQuery.toLowerCase().trim()
                  if (!q) return true
                  const fields = [item.titleEn, item.titleJp, item.name]
                  return fields.some(f => f?.toLowerCase().includes(q))
                })
                .map((item) => (
                  <div key={item.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="space-y-1">
                          {item.titleEn && (
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">EN</Badge>
                              <h4 className="font-medium">{item.titleEn}</h4>
                            </div>
                          )}
                          {item.titleJp && (
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">JP</Badge>
                              <h4 className="font-medium">{item.titleJp}</h4>
                            </div>
                          )}
                        </div>

                        {item.seriesLinks && (
                          <div className="mt-2">
                            <p className="text-sm font-medium mb-1">Links:</p>
                            <div className="text-xs text-muted-foreground">
                              {item.seriesLinks.split('\n').map((link, index) => (
                                <div key={index} className="break-all">
                                  {link.trim() && (
                                    <a
                                      href={link.trim()}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="hover:text-primary underline"
                                    >
                                      {link.trim()}
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}