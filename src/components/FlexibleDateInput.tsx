import { useState, useEffect } from 'react'
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { cn } from './ui/utils'

interface FlexibleDateInputProps {
  selected?: Date
  onSelect: (date: Date | undefined) => void
  placeholder?: string
  className?: string
}

export function FlexibleDateInput({ 
  selected, 
  onSelect, 
  placeholder = "DD/MM/YYYY or click calendar",
  className
}: FlexibleDateInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [showPicker, setShowPicker] = useState(false)
  const [pickerDate, setPickerDate] = useState({
    day: 1,
    month: 0,
    year: new Date().getFullYear() - 25
  })

  // Update input when selected date changes
  useEffect(() => {
    if (selected) {
      const day = String(selected.getDate()).padStart(2, '0')
      const month = String(selected.getMonth() + 1).padStart(2, '0')
      const year = selected.getFullYear()
      setInputValue(`${day}/${month}/${year}`)
    } else {
      setInputValue('')
    }
  }, [selected])

  // Update picker date when selected changes
  useEffect(() => {
    if (selected) {
      setPickerDate({
        day: selected.getDate(),
        month: selected.getMonth(),
        year: selected.getFullYear()
      })
    }
  }, [selected])

  const parseInputDate = (input: string): Date | null => {
    // Remove any non-numeric characters except /
    const cleaned = input.replace(/[^\d/]/g, '')
    
    // Try different formats
    const formats = [
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // DD/MM/YYYY
      /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // DD-MM-YYYY
      /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/, // DD.MM.YYYY
    ]

    for (const format of formats) {
      const match = cleaned.match(format)
      if (match) {
        const day = parseInt(match[1], 10)
        const month = parseInt(match[2], 10) - 1 // 0-indexed
        const year = parseInt(match[3], 10)
        
        // Validate ranges
        if (day >= 1 && day <= 31 && month >= 0 && month <= 11 && year >= 1900 && year <= 2100) {
          const date = new Date(year, month, day)
          // Check if the date is valid (handles invalid dates like Feb 30)
          if (date.getDate() === day && date.getMonth() === month && date.getFullYear() === year) {
            return date
          }
        }
      }
    }
    
    return null
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    
    // Auto-format as user types
    let formatted = value.replace(/\D/g, '') // Remove non-digits
    if (formatted.length >= 3) {
      formatted = formatted.slice(0, 2) + '/' + formatted.slice(2)
    }
    if (formatted.length >= 6) {
      formatted = formatted.slice(0, 5) + '/' + formatted.slice(5, 9)
    }
    
    if (formatted !== value) {
      setInputValue(formatted)
    }
    
    // Try to parse the date
    const parsedDate = parseInputDate(formatted)
    if (parsedDate) {
      onSelect(parsedDate)
    } else if (value === '') {
      onSelect(undefined)
    }
  }

  const handleInputBlur = () => {
    // Try to parse and reformat on blur
    const parsedDate = parseInputDate(inputValue)
    if (parsedDate) {
      const day = String(parsedDate.getDate()).padStart(2, '0')
      const month = String(parsedDate.getMonth() + 1).padStart(2, '0')
      const year = parsedDate.getFullYear()
      setInputValue(`${day}/${month}/${year}`)
    }
  }

  const handlePickerSelect = () => {
    const date = new Date(pickerDate.year, pickerDate.month, pickerDate.day)
    onSelect(date)
    setShowPicker(false)
  }

  const handleClear = () => {
    setInputValue('')
    onSelect(undefined)
    setShowPicker(false)
  }

  // Generate options
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: currentYear - 1930 + 1 }, (_, i) => currentYear - i)
  const months = [
    { value: 0, label: 'Januari' },
    { value: 1, label: 'Februari' },
    { value: 2, label: 'Maret' },
    { value: 3, label: 'April' },
    { value: 4, label: 'Mei' },
    { value: 5, label: 'Juni' },
    { value: 6, label: 'Juli' },
    { value: 7, label: 'Agustus' },
    { value: 8, label: 'September' },
    { value: 9, label: 'Oktober' },
    { value: 10, label: 'November' },
    { value: 11, label: 'Desember' }
  ]
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }
  const days = Array.from({ length: getDaysInMonth(pickerDate.year, pickerDate.month) }, (_, i) => i + 1)

  return (
    <div className={cn("relative", className)}>
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Input
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            placeholder={placeholder}
            className="pr-10"
          />
          <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
        
        <Popover open={showPicker} onOpenChange={setShowPicker}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="px-3">
              <ChevronDown className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4" align="end">
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {/* Day Selection */}
                <div>
                  <label className="text-sm font-medium mb-1 block">Hari</label>
                  <Select 
                    value={pickerDate.day.toString()} 
                    onValueChange={(value) => setPickerDate(prev => ({ ...prev, day: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {days.map((day) => (
                        <SelectItem key={day} value={day.toString()}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Month Selection */}
                <div>
                  <label className="text-sm font-medium mb-1 block">Bulan</label>
                  <Select 
                    value={pickerDate.month.toString()} 
                    onValueChange={(value) => setPickerDate(prev => ({ ...prev, month: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month) => (
                        <SelectItem key={month.value} value={month.value.toString()}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Year Selection */}
                <div>
                  <label className="text-sm font-medium mb-1 block">Tahun</label>
                  <Select 
                    value={pickerDate.year.toString()} 
                    onValueChange={(value) => setPickerDate(prev => ({ ...prev, year: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button onClick={handlePickerSelect} size="sm" className="flex-1">
                  Pilih
                </Button>
                <Button onClick={handleClear} variant="outline" size="sm" className="flex-1">
                  Hapus
                </Button>
              </div>
              
              {/* Preview */}
              <div className="text-sm text-muted-foreground text-center">
                Preview: {new Date(pickerDate.year, pickerDate.month, pickerDate.day).toLocaleDateString('id-ID')}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      
      {/* Format hint */}
      <p className="text-xs text-muted-foreground mt-1">
        Format: DD/MM/YYYY (contoh: 01/12/1999)
      </p>
    </div>
  )
}