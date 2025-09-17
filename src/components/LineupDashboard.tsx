import React, { useState } from 'react'
import { Button } from './ui/button'
import { 
  Users, 
  Settings, 
  Move, 
  BarChart3, 
  Calendar,
  Star,
  Heart,
  Crown,
  Sparkles,
  TrendingUp,
  Activity,
  Zap
} from 'lucide-react'
import { ModernLineupManager } from './ModernLineupManager'
import { LineupBuilder } from './LineupBuilder'
import { SimpleLineupManagement } from './SimpleLineupManagement'

interface LineupDashboardProps {
  generationId: string
  generationName: string
  groupId: string
  accessToken: string
}

type ViewMode = 'overview' | 'builder' | 'manager' | 'analytics'

export function LineupDashboard({ 
  generationId, 
  generationName, 
  groupId,
  accessToken 
}: LineupDashboardProps) {
  const [currentView, setCurrentView] = useState<ViewMode>('overview')
  const [showLegacyMode, setShowLegacyMode] = useState(false)

  const viewOptions = [
    {
      id: 'overview' as ViewMode,
      name: 'Overview',
      description: 'Dashboard utama lineup',
      icon: BarChart3,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      hoverColor: 'hover:bg-blue-100'
    },
    {
      id: 'builder' as ViewMode,
      name: 'Lineup Builder',
      description: 'Drag & drop builder',
      icon: Move,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
      hoverColor: 'hover:bg-purple-100'
    },
    {
      id: 'manager' as ViewMode,
      name: 'Modern Manager',
      description: 'Manager modern dengan UI baru',
      icon: Settings,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      hoverColor: 'hover:bg-green-100'
    },
    {
      id: 'analytics' as ViewMode,
      name: 'Analytics',
      description: 'Statistik dan analisis',
      icon: TrendingUp,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
      hoverColor: 'hover:bg-orange-100'
    }
  ]

  const renderCurrentView = () => {
    switch (currentView) {
      case 'overview':
        return <LineupOverview 
          generationId={generationId}
          generationName={generationName}
          groupId={groupId}
          accessToken={accessToken}
        />
      case 'builder':
        return <LineupBuilder 
          generationId={generationId}
          generationName={generationName}
          groupId={groupId}
          accessToken={accessToken}
        />
      case 'manager':
        return <ModernLineupManager 
          generationId={generationId}
          generationName={generationName}
          groupId={groupId}
          accessToken={accessToken}
        />
      case 'analytics':
        return <LineupAnalytics 
          generationId={generationId}
          generationName={generationName}
          groupId={groupId}
          accessToken={accessToken}
        />
      default:
        return <LineupOverview 
          generationId={generationId}
          generationName={generationName}
          groupId={groupId}
          accessToken={accessToken}
        />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Lineup Dashboard</h1>
                <p className="text-gray-600">{generationName} Management</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLegacyMode(!showLegacyMode)}
                className="text-gray-600"
              >
                {showLegacyMode ? 'Hide Legacy' : 'Show Legacy'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-1 py-2">
            {viewOptions.map((option) => (
              <Button
                key={option.id}
                variant={currentView === option.id ? 'default' : 'ghost'}
                onClick={() => setCurrentView(option.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                  currentView === option.id
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                    : `text-gray-600 ${option.hoverColor}`
                }`}
              >
                <option.icon className="h-4 w-4" />
                <span className="font-medium">{option.name}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {renderCurrentView()}
      </div>

      {/* Legacy Mode */}
      {showLegacyMode && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-md">
            <h3 className="font-semibold text-gray-900 mb-2">Legacy Mode</h3>
            <p className="text-sm text-gray-600 mb-3">
              Sistem lineup lama masih tersedia untuk kompatibilitas
            </p>
            <SimpleLineupManagement
              generationId={generationId}
              generationName={generationName}
              groupId={groupId}
              accessToken={accessToken}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// Overview Component
function LineupOverview({ 
  generationId, 
  generationName, 
  groupId,
  accessToken 
}: {
  generationId: string
  generationName: string
  groupId: string
  accessToken: string
}) {
  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 text-white">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
            <Users className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-3xl font-bold">Selamat Datang!</h2>
            <p className="text-indigo-100 text-lg">
              Kelola lineup untuk {generationName} dengan sistem baru yang lebih intuitif
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Crown className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Main Lineups</p>
              <p className="text-2xl font-bold text-gray-900">3</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Star className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Sub Lineups</p>
              <p className="text-2xl font-bold text-gray-900">2</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Trainee Lineups</p>
              <p className="text-2xl font-bold text-gray-900">1</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Activity className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Members</p>
              <p className="text-2xl font-bold text-gray-900">24</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            className="h-20 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white"
            onClick={() => {/* Navigate to builder */}}
          >
            <div className="text-center">
              <Move className="h-6 w-6 mx-auto mb-2" />
              <span className="font-medium">Lineup Builder</span>
            </div>
          </Button>

          <Button
            className="h-20 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
            onClick={() => {/* Navigate to manager */}}
          >
            <div className="text-center">
              <Settings className="h-6 w-6 mx-auto mb-2" />
              <span className="font-medium">Modern Manager</span>
            </div>
          </Button>

          <Button
            className="h-20 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white"
            onClick={() => {/* Navigate to analytics */}}
          >
            <div className="text-center">
              <TrendingUp className="h-6 w-6 mx-auto mb-2" />
              <span className="font-medium">Analytics</span>
            </div>
          </Button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <Zap className="h-4 w-4 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Lineup "Main Team" updated</p>
              <p className="text-xs text-gray-500">2 hours ago</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">New member added to "Sub Team"</p>
              <p className="text-xs text-gray-500">4 hours ago</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">New lineup "Trainee Team" created</p>
              <p className="text-xs text-gray-500">1 day ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Analytics Component
function LineupAnalytics({ 
  generationId, 
  generationName, 
  groupId,
  accessToken 
}: {
  generationId: string
  generationName: string
  groupId: string
  accessToken: string
}) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Lineup Analytics</h3>
        <p className="text-gray-600">Analytics dashboard akan tersedia dalam versi mendatang</p>
      </div>
    </div>
  )
}
