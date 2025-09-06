import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { CombinedCastSelector } from './CombinedCastSelector'

interface CombinedCastSelectorTestProps {
  accessToken: string
}

export function CombinedCastSelectorTest({ accessToken }: CombinedCastSelectorTestProps) {
  const [selectedCast, setSelectedCast] = useState<string[]>([])

  const handleCastChange = (castArray: string[]) => {
    setSelectedCast(castArray)
    console.log('Selected cast:', castArray)
  }

  const clearSelection = () => {
    setSelectedCast([])
  }

  const simulateExistingData = () => {
    setSelectedCast(['Yui Hatano', 'Akira Kawai', 'Takeshi Yamamoto'])
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>CombinedCastSelector Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="font-medium mb-3">Cast Selection Test</h3>
          <CombinedCastSelector
            value={selectedCast}
            onChange={handleCastChange}
            placeholder="Pilih aktris/aktor untuk testing..."
            accessToken={accessToken}
          />
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">Test Controls</h4>
          <div className="flex gap-2">
            <Button onClick={clearSelection} variant="outline" size="sm">
              Clear Selection
            </Button>
            <Button onClick={simulateExistingData} variant="outline" size="sm">
              Load Sample Data
            </Button>
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">Selected Cast ({selectedCast.length})</h4>
          <div className="bg-gray-50 p-3 rounded border min-h-[50px]">
            {selectedCast.length === 0 ? (
              <p className="text-gray-500 italic">No cast selected</p>
            ) : (
              <div className="space-y-1">
                {selectedCast.map((cast, index) => (
                  <p key={index} className="text-sm">
                    {index + 1}. {cast}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">Raw Output (for SC Movie)</h4>
          <div className="bg-gray-50 p-3 rounded border text-sm font-mono">
            {selectedCast.join(', ') || '(empty)'}
          </div>
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p>• Test component untuk memverifikasi functionality CombinedCastSelector</p>
          <p>• Cast dipilih dari database actress dan actor yang sudah ada</p>
          <p>• Data disimpan sebagai string (comma-separated) untuk compatibility dengan SCMovie interface</p>
          <p>• Component ini bisa dihapus setelah testing selesai</p>
        </div>
      </CardContent>
    </Card>
  )
}