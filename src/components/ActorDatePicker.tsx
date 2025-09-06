import { useState } from 'react'
import { Calendar as CalendarIcon } from 'lucide-react'
import { Button } from './ui/button'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { cn } from './ui/utils'

interface ActorDatePickerProps {
  selected?: Date
  onSelect: (date: Date | undefined) => void
  placeholder?: string
}

export function ActorDatePicker({ selected, onSelect, placeholder = "Pilih tanggal" }: ActorDatePickerProps) {
  const [open, setOpen] = useState(false)
  
  // Generate years from 1930 to current year
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: currentYear - 1930 + 1 }, (_, i) => currentYear - i)
  
  // Generate months
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
  
  const [selectedDay, setSelectedDay] = useState<number>(selected?.getDate() || 1)
  const [selectedMonth, setSelectedMonth] = useState<number>(selected?.getMonth() || 0)
  const [selectedYear, setSelectedYear] = useState<number>(selected?.getFullYear() || currentYear - 25)
  
  // Generate days for selected month/year
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }
  
  const days = Array.from({ length: getDaysInMonth(selectedYear, selectedMonth) }, (_, i) => i + 1)
  
  // Update day if current day doesn't exist in new month
  const handleMonthYearChange = (newMonth?: number, newYear?: number) => {
    const month = newMonth !== undefined ? newMonth : selectedMonth
    const year = newYear !== undefined ? newYear : selectedYear
    const maxDays = getDaysInMonth(year, month)
    
    if (selectedDay > maxDays) {
      setSelectedDay(maxDays)
    }
    
    if (newMonth !== undefined) setSelectedMonth(newMonth)
    if (newYear !== undefined) setSelectedYear(newYear)
  }
  
  const handleDateSelect = () => {
    const newDate = new Date(selectedYear, selectedMonth, selectedDay)
    onSelect(newDate)
    setOpen(false)
  }
  
  const handleClear = () => {
    onSelect(undefined)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !selected && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selected ? selected.toLocaleDateString('id-ID') : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="start">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {/* Day Selection */}
            <div>
              <label className="text-sm font-medium mb-1 block">Hari</label>
              <Select value={selectedDay.toString()} onValueChange={(value) => setSelectedDay(parseInt(value))}>
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
              <Select value={selectedMonth.toString()} onValueChange={(value) => handleMonthYearChange(parseInt(value))}>
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
              <Select value={selectedYear.toString()} onValueChange={(value) => handleMonthYearChange(undefined, parseInt(value))}>
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
            <Button onClick={handleDateSelect} size="sm" className="flex-1">
              Pilih
            </Button>
            <Button onClick={handleClear} variant="outline" size="sm" className="flex-1">
              Hapus
            </Button>
          </div>
          
          {/* Preview */}
          <div className="text-sm text-muted-foreground text-center">
            Preview: {new Date(selectedYear, selectedMonth, selectedDay).toLocaleDateString('id-ID')}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}