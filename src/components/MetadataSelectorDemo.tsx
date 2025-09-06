import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { MetadataSelector } from './MetadataSelector'
import { Label } from './ui/label'
import { Separator } from './ui/separator'

interface MetadataSelectorDemoProps {
  accessToken: string
}

export function MetadataSelectorDemo({ accessToken }: MetadataSelectorDemoProps) {
  const [studioValue, setStudioValue] = useState('')
  const [seriesValue, setSeriesValue] = useState('')
  const [typeValue, setTypeValue] = useState('')
  const [labelValue, setLabelValue] = useState('')

  const handleReset = () => {
    setStudioValue('')
    setSeriesValue('')
    setTypeValue('')
    setLabelValue('')
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>MetadataSelector Upgrade Demo</CardTitle>
          <Button variant="outline" size="sm" onClick={handleReset}>
            Reset All
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Demo komponen MetadataSelector yang sudah diupgrade dengan dropdown combo box modern seperti actress/actor selector.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Studio Selector */}
        <div className="space-y-2">
          <Label>Studio</Label>
          <MetadataSelector
            type="studio"
            currentValue={studioValue}
            onValueChange={setStudioValue}
            accessToken={accessToken}
          />
          {studioValue && (
            <p className="text-xs text-muted-foreground">
              Selected: <span className="font-medium">{studioValue}</span>
            </p>
          )}
        </div>

        <Separator />

        {/* Series Selector */}
        <div className="space-y-2">
          <Label>Series</Label>
          <MetadataSelector
            type="series"
            currentValue={seriesValue}
            onValueChange={setSeriesValue}
            accessToken={accessToken}
          />
          {seriesValue && (
            <p className="text-xs text-muted-foreground">
              Selected: <span className="font-medium">{seriesValue}</span>
            </p>
          )}
        </div>

        <Separator />

        {/* Type Selector */}
        <div className="space-y-2">
          <Label>Type</Label>
          <MetadataSelector
            type="type"
            currentValue={typeValue}
            onValueChange={setTypeValue}
            accessToken={accessToken}
          />
          {typeValue && (
            <p className="text-xs text-muted-foreground">
              Selected: <span className="font-medium">{typeValue}</span>
            </p>
          )}
        </div>

        <Separator />

        {/* Label Selector */}
        <div className="space-y-2">
          <Label>Label</Label>
          <MetadataSelector
            type="label"
            currentValue={labelValue}
            onValueChange={setLabelValue}
            accessToken={accessToken}
          />
          {labelValue && (
            <p className="text-xs text-muted-foreground">
              Selected: <span className="font-medium">{labelValue}</span>
            </p>
          )}
        </div>

        {/* Summary */}
        <div className="pt-4 border-t">
          <h4 className="font-medium mb-3">Current Selection Summary:</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Studio:</span>
              <span className="ml-2 font-medium">{studioValue || 'None'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Series:</span>
              <span className="ml-2 font-medium">{seriesValue || 'None'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Type:</span>
              <span className="ml-2 font-medium">{typeValue || 'None'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Label:</span>
              <span className="ml-2 font-medium">{labelValue || 'None'}</span>
            </div>
          </div>
        </div>

        {/* Features Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">✨ Fitur Upgrade Baru:</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <p>• <strong>Dropdown Combo Box:</strong> Interface modern seperti actress/actor selector</p>
            <p>• <strong>Real-time Search:</strong> Cari dengan mengetik di dalam dropdown</p>
            <p>• <strong>Visual Feedback:</strong> Check mark untuk item yang dipilih</p>
            <p>• <strong>Quick Select:</strong> Pilih cepat dari 4 item terbaru</p>
            <p>• <strong>Create New:</strong> Tambah item baru langsung dari selector</p>
            <p>• <strong>Clear Option:</strong> Hapus selection dengan mudah</p>
            <p>• <strong>Loading States:</strong> Indikator loading yang smooth</p>
            <p>• <strong>Better UX:</strong> Keyboard navigation dan responsive design</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}