import { useState, useEffect } from 'react'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import { DatePicker } from '../DatePicker'
import { MultiSelectWithCreate } from '../MultiSelectWithCreate'
import { Movie } from '../../utils/movieApi'

interface BasicInfoTabProps {
  formData: Partial<Movie>
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  onDateChange: (field: string, date: string) => void
  onMultiSelectChange: (field: string, values: string[]) => void
  accessToken: string
}

export function BasicInfoTab({ 
  formData, 
  onInputChange, 
  onDateChange,
  onMultiSelectChange,
  accessToken 
}: BasicInfoTabProps) {
  
  // Helper function to detect current duration format
  const detectDurationFormat = (duration: string): 'hours' | 'minutes' => {
    if (!duration) return 'hours'
    // If duration contains "jam" it's in hours format, otherwise it's minutes
    return duration.includes('jam') ? 'hours' : 'minutes'
  }

  // Helper function to parse hours and minutes from duration string
  const parseDurationHoursMinutes = (duration: string) => {
    if (!duration) return { hours: '', minutes: '' }
    
    // Extract hours from "X jam Y menit" or "X jam" format
    const hoursMatch = duration.match(/(\d+)\s*jam/)
    const minutesMatch = duration.match(/(\d+)\s*menit/)
    
    return {
      hours: hoursMatch ? hoursMatch[1] : '',
      minutes: minutesMatch ? minutesMatch[1] : ''
    }
  }

  const [durationFormat, setDurationFormat] = useState<'hours' | 'minutes'>(() => 
    detectDurationFormat(formData.duration || '')
  )
  const [durationHours, setDurationHours] = useState(() => 
    parseDurationHoursMinutes(formData.duration || '').hours
  )
  const [durationMinutes, setDurationMinutes] = useState(() => 
    parseDurationHoursMinutes(formData.duration || '').minutes
  )
  const [sameAsCode, setSameAsCode] = useState(false)

  // Sync duration format and values when formData.duration changes
  useEffect(() => {
    const currentDuration = formData.duration || ''
    const detectedFormat = detectDurationFormat(currentDuration)
    
    // Update format if different
    setDurationFormat(detectedFormat)

    // Always update hours and minutes when in hours format
    if (detectedFormat === 'hours') {
      const parsed = parseDurationHoursMinutes(currentDuration)
      setDurationHours(parsed.hours)
      setDurationMinutes(parsed.minutes)
    }
  }, [formData.duration]) // Only depend on formData.duration
  
  const getMultiSelectValues = (value: string) => {
    return value ? value.split(',').map(v => v.trim()).filter(v => v) : []
  }

  const handleDurationFormatChange = (format: 'hours' | 'minutes') => {
    setDurationFormat(format)
    
    // Don't clear duration if there's an existing value - let user preserve their input
    // Only clear the hour/minute inputs when switching to minutes format
    if (format === 'minutes') {
      setDurationHours('')
      setDurationMinutes('')
    }
  }

  const handleSameAsCodeChange = (checked: boolean) => {
    setSameAsCode(checked)
    if (checked && formData.code) {
      // Auto-fill dmcode with the same value as code
      const event = {
        target: { name: 'dmcode', value: formData.code }
      } as React.ChangeEvent<HTMLInputElement>
      onInputChange(event)
    }
  }

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Auto capitalize the code input
    const event = {
      ...e,
      target: {
        ...e.target,
        name: 'code',
        value: e.target.value.toUpperCase()
      }
    } as React.ChangeEvent<HTMLInputElement>
    onInputChange(event)

    // If sameAsCode is checked, also update dmcode
    if (sameAsCode) {
      const dmcodeEvent = {
        target: { name: 'dmcode', value: e.target.value.toUpperCase() }
      } as React.ChangeEvent<HTMLInputElement>
      onInputChange(dmcodeEvent)
    }
  }

  const handleHourMinuteDurationChange = (newHours?: string, newMinutes?: string) => {
    const hours = parseInt(newHours ?? durationHours) || 0
    const minutes = parseInt(newMinutes ?? durationMinutes) || 0
    
    let durationText = ''
    if (hours > 0 && minutes > 0) {
      durationText = `${hours} jam ${minutes} menit`
    } else if (hours > 0) {
      durationText = `${hours} jam`
    } else if (minutes > 0) {
      durationText = `${minutes} menit`
    }
    
    const event = {
      target: { name: 'duration', value: durationText }
    } as React.ChangeEvent<HTMLInputElement>
    onInputChange(event)
  }

  // Check if current types include auto-crop types
  const currentTypes = getMultiSelectValues(formData.type || '')
  const autoCropTypes = ['Cen', 'Leaks', 'Sem', '2versions']
  const hasAutoCropType = currentTypes.some(type => 
    autoCropTypes.some(autoCropType => 
      type.toLowerCase() === autoCropType.toLowerCase()
    )
  )

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        {/* Title Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="titleEn">Judul English (EN) *</Label>
            <Input
              id="titleEn"
              name="titleEn"
              value={formData.titleEn || ''}
              onChange={onInputChange}
              placeholder="English title (wajib diisi)"
            />
            <div className="text-xs text-gray-500 mt-1">
              Wajib diisi
            </div>
          </div>

          <div>
            <Label htmlFor="titleJp">Judul Japanese (JP)</Label>
            <Input
              id="titleJp"
              name="titleJp"
              value={formData.titleJp || ''}
              onChange={onInputChange}
              placeholder="日本語タイトル (opsional)"
            />
            <div className="text-xs text-gray-500 mt-1">
              Opsional - bisa dikosongkan
            </div>
          </div>
        </div>

        {/* Other Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="code">Code</Label>
            <Input
              id="code"
              name="code"
              value={formData.code || ''}
              onChange={handleCodeChange}
              placeholder="Kode film (auto CAPS)"
              style={{ textTransform: 'uppercase' }}
            />
          </div>

          <div>
            <Label htmlFor="dmcode">DM Code</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sameAsCode"
                  checked={sameAsCode}
                  onCheckedChange={handleSameAsCodeChange}
                />
                <Label htmlFor="sameAsCode" className="text-sm font-normal cursor-pointer">
                  Same as Code
                </Label>
              </div>
              <Input
                id="dmcode"
                name="dmcode"
                value={formData.dmcode || ''}
                onChange={onInputChange}
                placeholder="DM Code untuk template"
                disabled={sameAsCode}
                className={sameAsCode ? "bg-muted" : ""}
              />
              <div className="text-xs text-blue-600 mt-1">
                💡 DM Code digunakan untuk auto-apply template default
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="releaseDate">Tanggal Rilis</Label>
            <DatePicker
              value={formData.releaseDate || ''}
              onChange={(date) => onDateChange('releaseDate', date)}
              placeholder="Pilih tanggal rilis"
            />
          </div>

          <div>
            <Label htmlFor="duration">Durasi</Label>
            
            {/* Duration Format Toggle */}
            <div className="flex gap-2 mb-2">
              <Button
                type="button"
                variant={durationFormat === 'hours' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleDurationFormatChange('hours')}
              >
                Jam & Menit
              </Button>
              <Button
                type="button"
                variant={durationFormat === 'minutes' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleDurationFormatChange('minutes')}
              >
                Menit
              </Button>
            </div>

            {durationFormat === 'minutes' ? (
              <Input
                id="duration"
                name="duration"
                value={formData.duration || ''}
                onChange={onInputChange}
                placeholder="120 menit"
              />
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Input
                      placeholder="Jam"
                      value={durationHours}
                      onChange={(e) => {
                        const newHours = e.target.value
                        setDurationHours(newHours)
                        handleHourMinuteDurationChange(newHours, durationMinutes)
                      }}
                      type="number"
                      min="0"
                      max="10"
                    />
                  </div>
                  <div>
                    <Input
                      placeholder="Menit"
                      value={durationMinutes}
                      onChange={(e) => {
                        const newMinutes = e.target.value
                        setDurationMinutes(newMinutes)
                        handleHourMinuteDurationChange(durationHours, newMinutes)
                      }}
                      type="number"
                      min="0"
                      max="59"
                    />
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  Hasil: {formData.duration || 'Belum diisi'}
                </div>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="type">Type</Label>
            <MultiSelectWithCreate
              type="type"
              value={getMultiSelectValues(formData.type || '')}
              onChange={(values) => onMultiSelectChange('type', values)}
              placeholder="Pilih atau tambah type"
              accessToken={accessToken}
            />
            <div className="text-xs text-gray-500 mt-1">
              💡 <span className="font-medium">Auto-features:</span>
              <div className="space-y-1 mt-1">
                <div>• <span className="font-mono bg-gray-100 px-1 rounded">Cen</span>, <span className="font-mono bg-gray-100 px-1 rounded">Leaks</span>, <span className="font-mono bg-gray-100 px-1 rounded">Sem</span>, <span className="font-mono bg-gray-100 px-1 rounded">2versions</span> → Auto-crop cover</div>
                <div>• Types dengan default template → Auto-isi cover & gallery</div>
              </div>
            </div>
            {hasAutoCropType && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                ✅ Cover akan otomatis di-crop karena type yang dipilih
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="director">Director</Label>
            <MultiSelectWithCreate
              type="director"
              value={getMultiSelectValues(formData.director || '')}
              onChange={(values) => onMultiSelectChange('director', values)}
              placeholder="Pilih atau tambah director"
              accessToken={accessToken}
            />
          </div>
        </div>
      </div>
    </div>
  )
}