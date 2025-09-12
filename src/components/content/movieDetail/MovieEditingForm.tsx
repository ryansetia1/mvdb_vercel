import { Input } from '../../ui/input'
import { Checkbox } from '../../ui/checkbox'
import { Button } from '../../ui/button'
import { TemplatePreview } from '../../TemplatePreview'
import { CastManager } from '../../CastManager'
import { MetadataSelector } from '../../MetadataSelector'
import { DateDurationInputs } from '../../DateDurationInputs'
import { LinkManager } from '../../LinkManager'
import { TagsManager } from '../../TagsManager'
import { Movie } from '../../../utils/movieApi'
import { ArrowLeftRight } from 'lucide-react'

interface MovieEditingFormProps {
  editedMovie: Movie
  onInputChange: (field: keyof Movie, value: string) => void
  onCheckboxChange: (field: keyof Movie, checked: boolean) => void
  onLinksChange: (field: string, links: string) => void
  accessToken: string
}

export function MovieEditingForm({ 
  editedMovie, 
  onInputChange, 
  onCheckboxChange, 
  onLinksChange, 
  accessToken 
}: MovieEditingFormProps) {
  const handleCheckboxChange = (field: keyof Movie, checked: boolean) => {
    onCheckboxChange(field, checked)
  }

  // Fungsi untuk mendeteksi apakah URL adalah DMM digital atau mono
  const isDmmUrl = (url: string): boolean => {
    return url.includes('pics.dmm.co.jp/digital/video/') || url.includes('pics.dmm.co.jp/mono/movie/')
  }

  // Fungsi untuk mengubah antara digital dan mono URL
  const switchDmmUrl = (currentUrl: string): string => {
    if (currentUrl.includes('pics.dmm.co.jp/digital/video/')) {
      return currentUrl.replace('pics.dmm.co.jp/digital/video/', 'pics.dmm.co.jp/mono/movie/')
    } else if (currentUrl.includes('pics.dmm.co.jp/mono/movie/')) {
      return currentUrl.replace('pics.dmm.co.jp/mono/movie/', 'pics.dmm.co.jp/digital/video/')
    }
    return currentUrl
  }

  // Handler untuk tombol switch DMM URL
  const handleDmmUrlSwitch = () => {
    const currentCover = editedMovie.cover || ''
    if (isDmmUrl(currentCover)) {
      const newUrl = switchDmmUrl(currentCover)
      onInputChange('cover', newUrl)
    }
  }

  return (
    <div className="space-y-4">
      {/* DMCode */}
      <div>
        <label className="block text-sm font-medium mb-2">DMCode</label>
        <Input
          value={editedMovie.dmcode || ''}
          onChange={(e) => onInputChange('dmcode', e.target.value)}
          placeholder="DMCode for gallery images"
        />
      </div>

      {/* Cover Image URL */}
      <div>
        <label className="block text-sm font-medium mb-2">Cover Image URL</label>
        <div className="flex gap-2">
          <Input
            value={editedMovie.cover || ''}
            onChange={(e) => onInputChange('cover', e.target.value)}
            placeholder="https://site.com/@studio/*/cover.jpg"
            className="flex-1"
          />
          {isDmmUrl(editedMovie.cover || '') && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDmmUrlSwitch}
              className="flex items-center gap-1"
              title="Switch between DMM digital/mono URLs"
            >
              <ArrowLeftRight className="h-4 w-4" />
              Switch
            </Button>
          )}
        </div>
        <div className="text-xs text-muted-foreground mt-2 space-y-1">
          <div><strong>Placeholders available:</strong></div>
          <div>• <code className="bg-muted px-1 rounded">*</code> = DM code</div>
          <div>• <code className="bg-muted px-1 rounded">@studio</code> = Studio name (lowercase)</div>
          <div>• <code className="bg-muted px-1 rounded">@firstname</code> = First name (lowercase)</div>
          <div>• <code className="bg-muted px-1 rounded">@lastname</code> = Last name (lowercase)</div>
        </div>
        
        <TemplatePreview 
          template={editedMovie.cover || ''} 
          dmcode={editedMovie.dmcode || ''} 
          label="Cover URL Preview"
          studio={editedMovie.studio}
          actress={editedMovie.actress}
        />
      </div>

      {/* Gallery Template */}
      <div>
        <label className="block text-sm font-medium mb-2">Gallery Template</label>
        <Input
          value={editedMovie.gallery || ''}
          onChange={(e) => onInputChange('gallery', e.target.value)}
          placeholder="https://site.com/@studio/*/img##.jpg"
        />
        <div className="text-xs text-muted-foreground mt-2 space-y-1">
          <div><strong>Placeholders available:</strong></div>
          <div>• <code className="bg-muted px-1 rounded">*</code> = DM code</div>
          <div>• <code className="bg-muted px-1 rounded">@studio</code> = Studio name (lowercase)</div>
          <div>• <code className="bg-muted px-1 rounded">@firstname</code> = First name (lowercase)</div>
          <div>• <code className="bg-muted px-1 rounded">@lastname</code> = Last name (lowercase)</div>
          <div>• <code className="bg-muted px-1 rounded"># ##</code> = 1-digit, 2-digit numbers</div>
        </div>
        
        <TemplatePreview 
          template={editedMovie.gallery || ''} 
          dmcode={editedMovie.dmcode || ''} 
          label="Gallery URLs Preview"
          isGallery={true}
          studio={editedMovie.studio}
          actress={editedMovie.actress}
        />
      </div>

      {/* Crop Cover Option */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="cropCover"
          checked={editedMovie.cropCover || false}
          onCheckedChange={(checked) => handleCheckboxChange('cropCover', checked as boolean)}
        />
        <label 
          htmlFor="cropCover" 
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Crop cover image to right side
        </label>
      </div>
    </div>
  )
}