import { Label } from '../ui/label'
import { MultiSelectWithCreate } from '../MultiSelectWithCreate'
import { Movie } from '../../utils/movieApi'

interface PeopleCastTabProps {
  formData: Partial<Movie>
  onMultiSelectChange: (field: string, values: string[]) => void
  accessToken: string
}

export function PeopleCastTab({ 
  formData, 
  onMultiSelectChange,
  accessToken 
}: PeopleCastTabProps) {
  
  const getMultiSelectValues = (value: string) => {
    return value ? value.split(',').map(v => v.trim()).filter(v => v) : []
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="actress">Aktris</Label>
          <MultiSelectWithCreate
            type="actress"
            value={getMultiSelectValues(formData.actress || '')}
            onChange={(values) => onMultiSelectChange('actress', values)}
            placeholder="Pilih atau tambah aktris"
            accessToken={accessToken}
          />
          <div className="text-xs text-gray-500 mt-1">
            Aktris utama dalam film ini
          </div>
        </div>

        <div>
          <Label htmlFor="actors">Aktor</Label>
          <MultiSelectWithCreate
            type="actor"
            value={getMultiSelectValues(formData.actors || '')}
            onChange={(values) => onMultiSelectChange('actors', values)}
            placeholder="Pilih atau tambah aktor"
            accessToken={accessToken}
          />
          <div className="text-xs text-gray-500 mt-1">
            Aktor pendukung atau co-star
          </div>
        </div>

        <div>
          <Label htmlFor="series">Series</Label>
          <MultiSelectWithCreate
            type="series"
            value={getMultiSelectValues(formData.series || '')}
            onChange={(values) => onMultiSelectChange('series', values)}
            placeholder="Pilih atau tambah series"
            accessToken={accessToken}
          />
          <div className="text-xs text-gray-500 mt-1">
            Nama series atau franchise
          </div>
        </div>

        <div>
          <Label htmlFor="studio">Studio</Label>
          <MultiSelectWithCreate
            type="studio"
            value={getMultiSelectValues(formData.studio || '')}
            onChange={(values) => onMultiSelectChange('studio', values)}
            placeholder="Pilih atau tambah studio"
            accessToken={accessToken}
          />
          <div className="text-xs text-gray-500 mt-1">
            <div>Studio produksi film</div>
            <div className="text-blue-600 mt-1">
              💡 Studio dengan default template akan auto-isi cover & gallery
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="label">Label Produksi</Label>
          <MultiSelectWithCreate
            type="label"
            value={getMultiSelectValues(formData.label || '')}
            onChange={(values) => onMultiSelectChange('label', values)}
            placeholder="Pilih atau tambah label"
            accessToken={accessToken}
          />
          <div className="text-xs text-gray-500 mt-1">
            Label atau distributor film
          </div>
        </div>

        {/* Empty div for grid alignment */}
        <div></div>
      </div>

      {/* Info Section */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-medium text-blue-900 mb-2">Cast & Crew Information</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p>• <strong>Aktris:</strong> Aktris utama atau pemeran wanita utama</p>
          <p>• <strong>Aktor:</strong> Aktor pendukung, co-star, atau pemeran pria</p>
          <p>• <strong>Series:</strong> Nama series, franchise, atau koleksi film</p>
          <p>• <strong>Studio:</strong> Studio produksi yang memproduksi film</p>
          <p>• <strong>Label:</strong> Label produksi, distributor, atau publisher</p>
        </div>
        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-sm">
          <div className="font-medium text-green-800 mb-1">🚀 Auto-Template Feature</div>
          <div className="text-green-700 space-y-1">
            <p>• Studio atau Type dengan <span className="font-mono bg-green-100 px-1 rounded">isDefault=true</span> akan otomatis mengisi field cover & gallery</p>
            <p>• Pastikan DM Code sudah diisi agar template bisa diterapkan dengan benar</p>
            <p>• Template akan diterapkan hanya jika field cover/gallery masih kosong</p>
          </div>
        </div>
        <div className="mt-2 text-xs text-blue-600">
          💡 Tip: Ketik nama baru untuk menambahkan entry yang belum ada dalam database
        </div>
      </div>
    </div>
  )
}