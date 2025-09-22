import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Switch } from './ui/switch'
import { Trash2, Plus, RefreshCw } from 'lucide-react'
import { SCMovie, scMovieApi } from '../utils/scMovieApi'
import { SearchableSelect } from './SearchableSelect'
import { CombinedCastSelector } from './CombinedCastSelector'
import { Movie, movieApi } from '../utils/movieApi'
import { toast } from 'sonner'

interface SCMovieFormProps {
  scMovie?: SCMovie
  onSave: (scMovie: SCMovie) => void
  onCancel: () => void
  accessToken: string
}

export function SCMovieForm({ scMovie, onSave, onCancel, accessToken }: SCMovieFormProps) {
  const [formData, setFormData] = useState<Partial<SCMovie>>({
    titleEn: '',
    titleJp: '',
    cover: '',
    scType: 'regular_censorship',
    releaseDate: '',
    hcReleaseDate: '',
    cast: '',
    hcCode: '',
    hasEnglishSubs: false,
    scStreamingLinks: [''],
    hcStreamingLinks: ['']
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [availableHCCodes, setAvailableHCCodes] = useState<string[]>([])
  const [isLoadingCast, setIsLoadingCast] = useState(false)

  useEffect(() => {
    if (scMovie) {
      setFormData(scMovie)
    }
  }, [scMovie])

  useEffect(() => {
    loadAvailableHCCodes()
  }, [accessToken])

  const loadAvailableHCCodes = async () => {
    try {
      // Load HC movies to get available codes
      const movies = await movieApi.getMovies(accessToken)
      const codes = movies
        .map(movie => movie.code)
        .filter(Boolean)
        .sort()
      setAvailableHCCodes(codes)
    } catch (error) {
      console.error('Failed to load HC codes:', error)
    }
  }

  const fetchHCMovieData = async (hcCode: string) => {
    setIsLoadingCast(true)
    try {
      // Find HC movie by code
      const movies = await movieApi.getMovies(accessToken)
      const hcMovie = movies.find(movie => 
        movie.code?.toLowerCase() === hcCode.toLowerCase()
      )
      
      if (hcMovie) {
        // Extract cast data from HC movie
        const castData: string[] = []
        
        // Add actresses
        if (hcMovie.actress) {
          const actresses = hcMovie.actress.split(',').map(name => name.trim()).filter(name => name)
          castData.push(...actresses)
        }
        
        // Add actors
        if (hcMovie.actors) {
          const actors = hcMovie.actors.split(',').map(name => name.trim()).filter(name => name)
          castData.push(...actors)
        }
        
        // Prepare update data
        const updateData: Partial<SCMovie> = {}
        
        // Update cast data
        if (castData.length > 0) {
          updateData.cast = castData.join(', ')
        }
        
        // Update HC release date
        if (hcMovie.releaseDate) {
          updateData.hcReleaseDate = hcMovie.releaseDate
        }
        
        // Update form data with HC movie data
        if (Object.keys(updateData).length > 0) {
          setFormData(prev => ({ 
            ...prev, 
            ...updateData
          }))
          
          // Show success message
          const messages = []
          if (updateData.cast) {
            messages.push(`Cast: ${updateData.cast}`)
          }
          if (updateData.hcReleaseDate) {
            messages.push(`Release Date: ${new Date(updateData.hcReleaseDate).toLocaleDateString('id-ID')}`)
          }
          
          toast.success(`Data HC movie ${hcCode} otomatis dimuat: ${messages.join(', ')}`)
        } else {
          toast.info(`HC movie ${hcCode} ditemukan, tetapi tidak ada data yang tersedia`)
        }
      } else {
        toast.warning(`HC movie dengan code ${hcCode} tidak ditemukan di database`)
      }
    } catch (error) {
      console.error('Failed to fetch HC movie data:', error)
      toast.error('Gagal memuat data dari HC movie')
    } finally {
      setIsLoadingCast(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = async (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // If HC code is selected, automatically fetch data from HC movie
    if (name === 'hcCode' && value) {
      await fetchHCMovieData(value)
    }
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }))
  }

  const handleCastChange = (castArray: string[]) => {
    setFormData(prev => ({ ...prev, cast: castArray.join(', ') }))
  }

  const getCastArray = (castString: string): string[] => {
    return castString ? castString.split(',').map(item => item.trim()).filter(item => item) : []
  }

  const handleStreamingLinksChange = (field: 'scStreamingLinks' | 'hcStreamingLinks', index: number, value: string) => {
    setFormData(prev => {
      const links = [...(prev[field] || [])]
      links[index] = value
      return { ...prev, [field]: links }
    })
  }

  const addStreamingLink = (field: 'scStreamingLinks' | 'hcStreamingLinks') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), '']
    }))
  }

  const removeStreamingLink = (field: 'scStreamingLinks' | 'hcStreamingLinks', index: number) => {
    setFormData(prev => {
      const links = [...(prev[field] || [])]
      links.splice(index, 1)
      return { ...prev, [field]: links.length === 0 ? [''] : links }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.titleEn?.trim()) {
      setError('Judul English wajib diisi')
      return
    }

    if (!formData.cover?.trim()) {
      setError('URL Cover Image wajib diisi')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Clean up streaming links - remove empty ones
      const cleanedData = {
        ...formData,
        scStreamingLinks: (formData.scStreamingLinks || []).filter(link => link.trim()),
        hcStreamingLinks: (formData.hcStreamingLinks || []).filter(link => link.trim())
      }

      console.log('SC Movie data to save:', cleanedData)
      console.log('Access token:', accessToken ? 'Present' : 'Missing')

      let savedSCMovie: SCMovie
      if (scMovie?.id) {
        savedSCMovie = await scMovieApi.updateSCMovie(scMovie.id, cleanedData, accessToken)
      } else {
        savedSCMovie = await scMovieApi.createSCMovie(cleanedData as SCMovie, accessToken)
      }
      onSave(savedSCMovie)
    } catch (error: any) {
      console.log('SC Movie form save error:', error)
      setError(`Gagal menyimpan: ${error.message || error}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {scMovie?.id ? `Edit SC Movie: ${formData.titleEn}` : 'Tambah SC Movie Baru'}
        </CardTitle>
        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded border border-red-200">
            {error}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="titleEn">Judul English *</Label>
              <Input
                id="titleEn"
                name="titleEn"
                value={formData.titleEn || ''}
                onChange={handleInputChange}
                placeholder="Masukkan judul dalam bahasa English"
                required
              />
            </div>

            <div>
              <Label htmlFor="titleJp">Judul Japanese/Hangeul (Optional)</Label>
              <Input
                id="titleJp"
                name="titleJp"
                value={formData.titleJp || ''}
                onChange={handleInputChange}
                placeholder="Masukkan judul dalam bahasa Japanese/Hangeul"
              />
            </div>

            <div>
              <Label htmlFor="cover">URL Cover Image *</Label>
              <Input
                id="cover"
                name="cover"
                value={formData.cover || ''}
                onChange={handleInputChange}
                placeholder="https://example.com/cover.jpg"
                required
              />
            </div>

            <div>
              <Label htmlFor="scType">Type</Label>
              <Select
                value={formData.scType || 'regular_censorship'}
                onValueChange={(value) => handleSelectChange('scType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="real_cut">Real Cut</SelectItem>
                  <SelectItem value="regular_censorship">Regular Censorship</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="releaseDate">Tanggal Rilis SC (Optional)</Label>
              <Input
                id="releaseDate"
                name="releaseDate"
                type="date"
                value={formData.releaseDate || ''}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Label htmlFor="hcReleaseDate">Tanggal Rilis HC (Optional)</Label>
              <Input
                id="hcReleaseDate"
                name="hcReleaseDate"
                type="date"
                value={formData.hcReleaseDate || ''}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Label htmlFor="cast">Cast - Aktris/Aktor (Optional)</Label>
              <div className="relative">
                <CombinedCastSelector
                  value={getCastArray(formData.cast || '')}
                  onChange={handleCastChange}
                  placeholder="Pilih aktris/aktor..."
                  accessToken={accessToken}
                />
                {isLoadingCast && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Pilih dari database aktris/aktor yang ada atau tambah baru
                {formData.hcCode && (
                  <span className="text-blue-600 ml-1">
                    • Cast akan otomatis dimuat dari HC movie {formData.hcCode}
                  </span>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="hcCode">HC Code (Movie Code dari HC counterpart)</Label>
              <div className="flex gap-2">
                <SearchableSelect
                  value={formData.hcCode || ''}
                  onValueChange={(value) => handleSelectChange('hcCode', value)}
                  options={availableHCCodes.map(code => ({ value: code, label: code }))}
                  placeholder="Pilih atau ketik HC Code..."
                  allowCustomValue={true}
                  className="flex-1"
                />
                {formData.hcCode && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fetchHCMovieData(formData.hcCode!)}
                    disabled={isLoadingCast}
                    className="px-3"
                  >
                    {isLoadingCast ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="hasEnglishSubs"
                checked={formData.hasEnglishSubs || false}
                onCheckedChange={(checked) => handleSwitchChange('hasEnglishSubs', checked)}
              />
              <Label htmlFor="hasEnglishSubs">Sudah ada English Subs</Label>
            </div>
          </div>

          {/* SC Streaming Links */}
          <div className="space-y-4">
            <Label>Link Streaming SC Version</Label>
            {(formData.scStreamingLinks || ['']).map((link, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={link}
                  onChange={(e) => handleStreamingLinksChange('scStreamingLinks', index, e.target.value)}
                  placeholder="https://example.com/stream"
                />
                {(formData.scStreamingLinks || []).length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeStreamingLink('scStreamingLinks', index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addStreamingLink('scStreamingLinks')}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah Link SC
            </Button>
          </div>

          {/* HC Streaming Links */}
          <div className="space-y-4">
            <Label>Link Streaming HC Version (Optional)</Label>
            {(formData.hcStreamingLinks || ['']).map((link, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={link}
                  onChange={(e) => handleStreamingLinksChange('hcStreamingLinks', index, e.target.value)}
                  placeholder="https://example.com/hc-stream"
                />
                {(formData.hcStreamingLinks || []).length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeStreamingLink('hcStreamingLinks', index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addStreamingLink('hcStreamingLinks')}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah Link HC
            </Button>
          </div>

          {/* Form Actions */}
          <div className="flex justify-between items-center pt-6 border-t">
            <div className="text-sm text-muted-foreground">
              * Field wajib diisi
            </div>

            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                disabled={isLoading}
              >
                Batal
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
              >
                {isLoading ? 'Menyimpan...' : scMovie?.id ? 'Update' : 'Simpan'}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}