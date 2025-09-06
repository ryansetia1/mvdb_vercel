import { Info } from 'lucide-react'
import { Alert, AlertDescription } from './ui/alert'

export function TemplateInfo() {
  return (
    <Alert className="mb-6">
      <Info className="h-4 w-4" />
      <AlertDescription>
        <div className="space-y-2">
          <div>
            <strong>Template Features:</strong>
          </div>
          <div className="space-y-1 text-sm">
            <div>
              • Gunakan <code className="bg-gray-100 px-1 rounded">*</code> untuk menggantikan dengan DM code
            </div>
            <div>
              • Gunakan <code className="bg-gray-100 px-1 rounded">#</code> untuk nomor 1-digit (1, 2, 3, ..., 9)
            </div>
            <div>
              • Gunakan <code className="bg-gray-100 px-1 rounded">##</code> untuk nomor 2-digit (01, 02, 03, ..., 99)
            </div>
            <div>
              • Gunakan <code className="bg-gray-100 px-1 rounded">###</code> untuk nomor 3-digit (001, 002, 003, ..., 999)
            </div>
            <div className="text-gray-600">
              Contoh: <code className="bg-gray-100 px-1 rounded">https://site.com/*/img##.jpg</code> → 
              <code className="bg-gray-100 px-1 rounded ml-1">https://site.com/ABC123/img01.jpg, img02.jpg, ...</code>
            </div>
            <div className="text-xs text-blue-600 mt-1">
              💡 Gallery akan otomatis mencari gambar yang tersedia dan hanya menampilkan yang benar-benar ada
            </div>
            <div className="text-xs text-orange-600 mt-1">
              ⚠️ Gallery yang mengandung kata "now_printing" akan disembunyikan otomatis
            </div>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  )
}