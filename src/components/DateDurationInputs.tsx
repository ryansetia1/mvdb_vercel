import { useState, useEffect } from 'react'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Button } from './ui/button'
import { Calendar, Clock, CalendarIcon, ToggleLeft, ToggleRight } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Calendar as CalendarComponent } from './ui/calendar'
import { Badge } from './ui/badge'

interface DateDurationInputsProps {
  releaseDate: string
  duration: string
  onReleaseDateChange: (date: string) => void
  onDurationChange: (duration: string) => void
  isEditing: boolean
}

export function DateDurationInputs({
  releaseDate,
  duration,
  onReleaseDateChange,
  onDurationChange,
  isEditing
}: DateDurationInputsProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  
  // Duration input modes
  const [durationMode, setDurationMode] = useState<'minutes' | 'hourMinute'>('minutes')
  const [totalMinutes, setTotalMinutes] = useState<string>('')
  const [hours, setHours] = useState<string>('')
  const [minutes, setMinutes] = useState<string>('')
  
  // Parse date for calendar
  const selectedDate = releaseDate ? new Date(releaseDate) : undefined

  // Initialize duration values from prop
  useEffect(() => {
    if (duration) {
      const parsedMinutes = parseDurationToMinutes(duration)
      if (parsedMinutes !== null) {
        setTotalMinutes(parsedMinutes.toString())
        setHours(Math.floor(parsedMinutes / 60).toString())
        setMinutes((parsedMinutes % 60).toString())
      }
    } else {
      setTotalMinutes('')
      setHours('')
      setMinutes('')
    }
  }, [duration])

  // Parse duration string to total minutes
  const parseDurationToMinutes = (durationStr: string): number | null => {
    if (!durationStr) return null
    
    const str = durationStr.toLowerCase().trim()
    
    // Format: "120 min", "120 menit" or "120"
    const minMatch = str.match(/^(\d+)(\s*(?:min|menit))?$/)
    if (minMatch) {
      return parseInt(minMatch[1])
    }
    
    // Format: "2h 30m" or "2 jam 30 menit"
    const hourMinMatch = str.match(/(\d+)\s*(?:h|jam)\s*(\d+)\s*(?:m|menit)?/)
    if (hourMinMatch) {
      const h = parseInt(hourMinMatch[1])
      const m = parseInt(hourMinMatch[2])
      return h * 60 + m
    }
    
    // Format: "30 menit" only (no hours)
    const minuteOnlyMatch = str.match(/^(\d+)\s*(?:menit|min)$/)
    if (minuteOnlyMatch) {
      return parseInt(minuteOnlyMatch[1])
    }
    
    // Format: "2:30:00" or "2:30"
    const timeMatch = str.match(/^(\d+):(\d+)(?::\d+)?$/)
    if (timeMatch) {
      const h = parseInt(timeMatch[1])
      const m = parseInt(timeMatch[2])
      return h * 60 + m
    }
    
    return null
  }

  // Format duration for output
  const formatDurationOutput = (mode: 'minutes' | 'hourMinute', totalMins?: string, hrs?: string, mins?: string): string => {
    if (mode === 'minutes' && totalMins) {
      const num = parseInt(totalMins)
      if (!isNaN(num) && num > 0) {
        // For minutes only mode, use "menit" format consistently
        return `${num} menit`
      }
    } else if (mode === 'hourMinute' && (hrs || mins)) {
      const h = parseInt(hrs || '0')
      const m = parseInt(mins || '0')
      if (!isNaN(h) && !isNaN(m) && (h > 0 || m > 0)) {
        if (h > 0 && m > 0) {
          return `${h} jam ${m} menit`
        } else if (h > 0) {
          return `${h} jam`
        } else if (m > 0) {
          // When only minutes (no hours), use menit format
          return `${m} menit`
        }
      }
    }
    return ''
  }
  
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      // Format as YYYY-MM-DD for consistency
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const formatted = `${year}-${month}-${day}`
      onReleaseDateChange(formatted)
    } else {
      onReleaseDateChange('')
    }
    setIsCalendarOpen(false)
  }

  const handleMinutesOnlyChange = (value: string) => {
    // Only allow numbers
    const numericValue = value.replace(/[^\d]/g, '')
    setTotalMinutes(numericValue)
    const formatted = formatDurationOutput('minutes', numericValue)
    onDurationChange(formatted)
  }

  const handleHoursChange = (value: string) => {
    const numericValue = value.replace(/[^\d]/g, '')
    setHours(numericValue)
    const formatted = formatDurationOutput('hourMinute', undefined, numericValue, minutes)
    onDurationChange(formatted)
  }

  const handleMinutesPartChange = (value: string) => {
    // Limit minutes to 0-59
    let numericValue = value.replace(/[^\d]/g, '')
    if (parseInt(numericValue) > 59) {
      numericValue = '59'
    }
    setMinutes(numericValue)
    const formatted = formatDurationOutput('hourMinute', undefined, hours, numericValue)
    onDurationChange(formatted)
  }

  if (!isEditing) {
    return (
      <>
        {/* Release Date Display */}
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <div className="flex-1">
            <span className="text-sm text-muted-foreground block">Release Date</span>
            <span className="font-medium">
              {releaseDate ? new Date(releaseDate).toLocaleDateString() : 'Not set'}
            </span>
          </div>
        </div>
        
        {/* Duration Display */}
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <div className="flex-1">
            <span className="text-sm text-muted-foreground block">Duration</span>
            <span className="font-medium">{duration || 'Not set'}</span>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      {/* Release Date Editing */}
      <div className="flex items-center gap-3">
        <Calendar className="h-5 w-5 text-muted-foreground" />
        <div className="flex-1 space-y-2">
          <Label className="text-sm text-muted-foreground">Release Date</Label>
          
          <div className="flex gap-2">
            {/* Date Input */}
            <Input
              type="date"
              value={releaseDate || ''}
              onChange={(e) => onReleaseDateChange(e.target.value)}
              className="font-medium"
            />
            
            {/* Calendar Picker Alternative */}
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                >
                  <CalendarIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {releaseDate && (
            <p className="text-xs text-muted-foreground">
              Preview: {new Date(releaseDate).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          )}
        </div>
      </div>

      {/* Duration Editing */}
      <div className="flex items-center gap-3">
        <Clock className="h-5 w-5 text-muted-foreground" />
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm text-muted-foreground">Duration</Label>
            
            {/* Mode Toggle */}
            <div className="flex items-center gap-2">
              <Badge 
                variant={durationMode === 'minutes' ? 'default' : 'secondary'}
                className="cursor-pointer text-xs px-2 py-1"
                onClick={() => setDurationMode('minutes')}
              >
                Menit
              </Badge>
              <Badge 
                variant={durationMode === 'hourMinute' ? 'default' : 'secondary'}
                className="cursor-pointer text-xs px-2 py-1"
                onClick={() => setDurationMode('hourMinute')}
              >
                Jam & Menit
              </Badge>
            </div>
          </div>
          
          {/* Minutes Only Mode */}
          {durationMode === 'minutes' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={totalMinutes}
                  onChange={(e) => handleMinutesOnlyChange(e.target.value)}
                  placeholder="120"
                  className="font-medium"
                  min="0"
                />
                <span className="text-sm text-muted-foreground">menit</span>
              </div>
              {totalMinutes && (
                <p className="text-xs text-muted-foreground">
                  Preview: {formatDurationOutput('minutes', totalMinutes)}
                </p>
              )}
            </div>
          )}
          
          {/* Hours & Minutes Mode */}
          {durationMode === 'hourMinute' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={hours}
                  onChange={(e) => handleHoursChange(e.target.value)}
                  placeholder="2"
                  className="font-medium w-20"
                  min="0"
                />
                <span className="text-sm text-muted-foreground">jam</span>
                
                <Input
                  type="number"
                  value={minutes}
                  onChange={(e) => handleMinutesPartChange(e.target.value)}
                  placeholder="30"
                  className="font-medium w-20"
                  min="0"
                  max="59"
                />
                <span className="text-sm text-muted-foreground">menit</span>
              </div>
              {(hours || minutes) && (
                <p className="text-xs text-muted-foreground">
                  Preview: {formatDurationOutput('hourMinute', undefined, hours, minutes)}
                </p>
              )}
            </div>
          )}
          
          {/* Current Duration Display */}
          {duration && (
            <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
              <span className="font-medium">Tersimpan:</span> {duration}
            </div>
          )}
        </div>
      </div>
    </>
  )
}