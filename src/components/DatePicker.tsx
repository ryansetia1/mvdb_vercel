import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './ui/button'
import { Calendar } from './ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Input } from './ui/input'

interface DatePickerProps {
  value?: string
  onChange: (date: string) => void
  placeholder?: string
}

export function DatePicker({ value, onChange, placeholder = "Pilih tanggal..." }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState(value || '')
  const [month, setMonth] = useState<Date>(() => {
    if (value) {
      try {
        return new Date(value)
      } catch {
        return new Date()
      }
    }
    return new Date()
  })

  // Update inputValue when value prop changes (for edit mode)
  useEffect(() => {
    console.log('DatePicker - value prop changed:', value)
    setInputValue(value || '')
    if (value) {
      try {
        const date = new Date(value)
        if (!isNaN(date.getTime())) {
          setMonth(date)
        }
      } catch {
        // Ignore invalid dates
      }
    }
  }, [value])

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const formatted = format(date, 'yyyy-MM-dd')
      setInputValue(formatted)
      onChange(formatted)
      setIsOpen(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setInputValue(val)
    onChange(val)
    
    // Update month when user types a valid date
    if (val) {
      try {
        const date = new Date(val)
        if (!isNaN(date.getTime())) {
          setMonth(date)
        }
      } catch {
        // Ignore invalid dates
      }
    }
  }

  const selectedDate = inputValue ? new Date(inputValue) : undefined

  // Generate years (current year ± 50 years)
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 101 }, (_, i) => currentYear - 50 + i)
  
  // Months
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const handleMonthChange = (monthIndex: string) => {
    const newMonth = new Date(month.getFullYear(), parseInt(monthIndex), 1)
    setMonth(newMonth)
  }

  const handleYearChange = (year: string) => {
    const newMonth = new Date(parseInt(year), month.getMonth(), 1)
    setMonth(newMonth)
  }

  const goToPreviousMonth = () => {
    setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
  }

  return (
    <div className="flex gap-2">
      <Input
        type="date"
        value={inputValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        className="flex-1"
      />
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0"
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <div className="p-3">
            {/* Month/Year Navigation */}
            <div className="flex items-center justify-between mb-4 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousMonth}
                className="p-1 h-7 w-7"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex gap-2 flex-1">
                <Select
                  value={month.getMonth().toString()}
                  onValueChange={handleMonthChange}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((monthName, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {monthName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={month.getFullYear().toString()}
                  onValueChange={handleYearChange}
                >
                  <SelectTrigger className="h-7 text-xs min-w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={goToNextMonth}
                className="p-1 h-7 w-7"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Calendar */}
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              month={month}
              onMonthChange={setMonth}
              initialFocus
              className="w-full"
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}