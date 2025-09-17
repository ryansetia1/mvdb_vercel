import React from 'react'
import { SimpleLineupManagement } from './SimpleLineupManagement'

interface SimpleLineupDemoProps {
  accessToken: string
}

export function SimpleLineupDemo({ accessToken }: SimpleLineupDemoProps) {
  // Demo data - replace with actual data from your app
  const demoGenerationId = 'demo-generation-id'
  const demoGenerationName = 'Demo Generation'
  const demoGroupId = 'demo-group-id'

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Simple Lineup Management Demo</h1>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold text-yellow-800 mb-2">🚀 Sistem Lineup Baru!</h2>
        <p className="text-yellow-700">
          Sistem lineup yang baru ini lebih sederhana, intuitif, dan stable. 
          Tidak ada lagi masalah dengan penghapusan member yang tidak berfungsi!
        </p>
      </div>

      <SimpleLineupManagement
        generationId={demoGenerationId}
        generationName={demoGenerationName}
        groupId={demoGroupId}
        accessToken={accessToken}
      />
    </div>
  )
}
