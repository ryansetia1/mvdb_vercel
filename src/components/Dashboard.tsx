import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { MovieList } from './MovieList'
import { MasterDataManager } from './MasterDataManager'
import { ActorManager } from './ActorManager'
import { BulkAssignmentManager } from './BulkAssignmentManager'
import { SCMovieForm } from './SCMovieForm'
import { SCMovieList } from './SCMovieList'
import { MovieLinksManager } from './MovieLinksManager'
import { BulkLinksManagerContent } from './content/BulkLinksManagerContent'
import { MovieDataParser } from './MovieDataParser'
import { StatsContent } from './content/StatsContent'
import { BackupRestoreContent } from './content/BackupRestoreContent'
import { DeepSeekTranslationTest } from './DeepSeekTranslationTest'
import { SetupApiKey } from './SetupApiKey'
import { CacheManager } from './CacheManager'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Film, Settings, User, Users, ArrowRightLeft, PlayCircle, Link, FileText, BarChart3, Shield, Key, Database } from 'lucide-react'
import { movieApi, Movie } from '../utils/movieApi'
import { toast } from 'sonner'

interface DashboardProps {
  accessToken: string
  user: any
  onLogout: () => void
  onSwitchToFrontend?: () => void
  editingMovie?: any
  editingSCMovie?: any
  editingProfile?: { type: 'actor' | 'actress' | 'director', name: string } | null
  onClearEditingMovie?: () => void
  onClearEditingSCMovie?: () => void
  onClearEditingProfile?: () => void
  onDataChanged?: () => void
  parseMovie?: any
  onMovieSelect?: (movie: Movie) => void
  onSCMovieSelect?: (scMovie: any) => void
}

export function Dashboard({
  accessToken,
  user,
  onLogout,
  onSwitchToFrontend,
  editingMovie: externalEditingMovie,
  editingSCMovie: externalEditingSCMovie,
  editingProfile: externalEditingProfile,
  onClearEditingMovie,
  onClearEditingSCMovie,
  onClearEditingProfile,
  onDataChanged,
  parseMovie: externalParseMovie,
  onMovieSelect,
  onSCMovieSelect
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState(
    externalParseMovie ? 'parser' :
      externalEditingMovie ? 'movies' :
        externalEditingSCMovie ? 'sc-movies' :
          externalEditingProfile ? (externalEditingProfile.type === 'actress' ? 'actresses' : 'actors') :
            'movies'
  )

  console.log('Dashboard: Active tab:', activeTab)
  const [editingMovie, setEditingMovie] = useState<any>(externalEditingMovie || null)
  const [editingSCMovie, setEditingSCMovie] = useState<any>(externalEditingSCMovie || null)
  const [editingProfile, setEditingProfile] = useState<{ type: 'actor' | 'actress' | 'director', name: string } | null>(externalEditingProfile || null)

  // Handle movie save from parser
  const handleParserSave = async (movie: Movie) => {
    try {
      console.log('=== DASHBOARD HANDLE PARSER SAVE ===')
      console.log('Movie from parser:', movie)
      console.log('Access token available:', !!accessToken)
      console.log('onMovieSelect available:', !!onMovieSelect)

      // Check if movie has ID (means it's from merge mode, already saved)
      if (movie.id) {
        console.log('Movie has ID, this is from merge mode - no need to save again')

        if (onDataChanged) {
          console.log('Calling onDataChanged')
          onDataChanged()
        }

        // Navigate to movie detail page
        if (onMovieSelect && movie) {
          console.log('Calling onMovieSelect with merged movie:', movie)
          onMovieSelect(movie)
          console.log('onMovieSelect called successfully')
        } else {
          console.log('onMovieSelect not available or movie is null')
          console.log('onMovieSelect:', onMovieSelect)
          console.log('movie:', movie)
        }
      } else {
        console.log('Movie has no ID, this is new movie - saving to database')

        const savedMovie = await movieApi.createMovie(movie, accessToken)
        console.log('Movie saved successfully:', savedMovie)

        toast.success('Movie berhasil disimpan!')

        if (onDataChanged) {
          console.log('Calling onDataChanged')
          onDataChanged()
        }

        // Navigate to movie detail page after successful save
        if (onMovieSelect && savedMovie) {
          console.log('Calling onMovieSelect with saved movie:', savedMovie)
          onMovieSelect(savedMovie)
          console.log('onMovieSelect called successfully')
        } else {
          console.log('onMovieSelect not available or savedMovie is null')
          console.log('onMovieSelect:', onMovieSelect)
          console.log('savedMovie:', savedMovie)
        }
      }
    } catch (error: any) {
      console.error('Error saving movie from parser:', error)
      toast.error(`Gagal menyimpan movie: ${error.message || error}`)
    }
  }

  // Update editing movie when external prop changes
  useEffect(() => {
    if (externalEditingMovie) {
      setEditingMovie(externalEditingMovie)
      setActiveTab('movies') // Switch to movies tab when editing
    }
  }, [externalEditingMovie])

  // Update parse movie when external prop changes
  useEffect(() => {
    if (externalParseMovie) {
      setEditingMovie(externalParseMovie)
      setActiveTab('parser') // Switch to parser tab when parsing
    }
  }, [externalParseMovie])

  // Update editing SC movie when external prop changes
  useEffect(() => {
    if (externalEditingSCMovie) {
      setEditingSCMovie(externalEditingSCMovie)
      setActiveTab('sc-movies') // Switch to SC movies tab when editing
    }
  }, [externalEditingSCMovie])

  // Update editing profile when external prop changes
  useEffect(() => {
    if (externalEditingProfile) {
      setEditingProfile(externalEditingProfile)
      setActiveTab(externalEditingProfile.type === 'actress' ? 'actresses' : 'actors') // Switch to appropriate tab
    }
  }, [externalEditingProfile])

  const handleEditMovie = (movie: any) => {
    setEditingMovie(movie)
    setActiveTab('movies')
    if (onClearEditingMovie) {
      onClearEditingMovie()
    }
  }

  const handleEditSCMovie = (scMovie: any) => {
    setEditingSCMovie(scMovie)
    setActiveTab('sc-movies')
    if (onClearEditingSCMovie) {
      onClearEditingSCMovie()
    }
  }

  return (
    <div className="space-y-6">
      {/* Admin Panel Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Admin Panel</h2>
        <p className="text-muted-foreground">
          Kelola database film, aktor, aktris, dan data master dengan fitur CRUD lengkap
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto scrollbar-hide">
          <TabsList className="h-auto p-0 bg-transparent justify-start flex-nowrap gap-1 min-w-max">
            <TabsTrigger
              value="movies"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-t-lg border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 whitespace-nowrap"
            >
              <Film className="h-4 w-4" />
              <span>HC Movies</span>
            </TabsTrigger>
            <TabsTrigger
              value="sc-movies"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-t-lg border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 whitespace-nowrap"
            >
              <PlayCircle className="h-4 w-4" />
              <span>SC Movies</span>
            </TabsTrigger>
            <TabsTrigger
              value="parser"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-t-lg border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 whitespace-nowrap"
            >
              <FileText className="h-4 w-4" />
              <span>Parser</span>
            </TabsTrigger>
            <TabsTrigger
              value="bulk-links"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-t-lg border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 whitespace-nowrap"
            >
              <Link className="h-4 w-4" />
              <span>Bulk Links</span>
            </TabsTrigger>
            <TabsTrigger
              value="movie-links"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-t-lg border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 whitespace-nowrap"
            >
              <ArrowRightLeft className="h-4 w-4" />
              <span>Movie Links</span>
            </TabsTrigger>
            <TabsTrigger
              value="actors"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-t-lg border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 whitespace-nowrap"
            >
              <User className="h-4 w-4" />
              <span>Actors</span>
            </TabsTrigger>
            <TabsTrigger
              value="actresses"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-t-lg border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 whitespace-nowrap"
            >
              <Users className="h-4 w-4" />
              <span>Actresses</span>
            </TabsTrigger>
            <TabsTrigger
              value="bulk-assignment"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-t-lg border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 whitespace-nowrap"
            >
              <ArrowRightLeft className="h-4 w-4" />
              <span>Bulk Assignment</span>
            </TabsTrigger>
            <TabsTrigger
              value="master-data"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-t-lg border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 whitespace-nowrap"
            >
              <Settings className="h-4 w-4" />
              <span>Master Data</span>
            </TabsTrigger>
            <TabsTrigger
              value="stats"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-t-lg border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 whitespace-nowrap"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Stats</span>
            </TabsTrigger>
            <TabsTrigger
              value="backup-restore"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-t-lg border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 whitespace-nowrap"
            >
              <Shield className="h-4 w-4" />
              <span>Backup & Restore</span>
            </TabsTrigger>
            <TabsTrigger
              value="deepseek-test"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-t-lg border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 whitespace-nowrap"
            >
              <Settings className="h-4 w-4" />
              <span>DeepSeek Test</span>
            </TabsTrigger>
            <TabsTrigger
              value="setup-api-key"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-t-lg border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 whitespace-nowrap"
            >
              <Key className="h-4 w-4" />
              <span>Setup API Key</span>
            </TabsTrigger>
            <TabsTrigger
              value="cache-manager"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-t-lg border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 whitespace-nowrap"
            >
              <Database className="h-4 w-4" />
              <span>Cache Manager</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="movies" className="mt-6">
          {console.log('Dashboard: Rendering movies TabsContent')}
          <MovieList
            accessToken={accessToken}
            editingMovie={editingMovie}
            onClearEditing={() => {
              setEditingMovie(null)
              if (onClearEditingMovie) {
                onClearEditingMovie()
              }
            }}
          />
        </TabsContent>

        <TabsContent value="sc-movies" className="mt-6">
          <SCMovieList
            accessToken={accessToken}
            editingSCMovie={editingSCMovie}
            onClearEditing={() => {
              setEditingSCMovie(null)
              if (onClearEditingSCMovie) {
                onClearEditingSCMovie()
              }
            }}
            onSCMovieSelect={editingSCMovie ? onSCMovieSelect : undefined}
          />
        </TabsContent>

        <TabsContent value="parser" className="mt-6">
          <MovieDataParser
            accessToken={accessToken}
            onSave={handleParserSave}
            onCancel={() => {
              console.log('Parser cancelled')
            }}
            existingMovie={editingMovie}
          />
        </TabsContent>

        <TabsContent value="bulk-links" className="mt-6">
          <BulkLinksManagerContent
            accessToken={accessToken}
            onBack={() => setActiveTab('movies')}
          />
        </TabsContent>

        <TabsContent value="movie-links" className="mt-6">
          <div className="space-y-6">
            {/* Individual Movie Links Manager */}
            <div className="bg-card rounded-lg p-6 border">
              <h3 className="text-lg font-medium mb-4">Individual Movie Links</h3>
              <MovieLinksManager accessToken={accessToken} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="actors" className="mt-6">
          <ActorManager
            type="actor"
            accessToken={accessToken}
            onDataChanged={onDataChanged}
            editingProfile={editingProfile?.type === 'actor' ? editingProfile : null}
            onClearEditingProfile={() => {
              setEditingProfile(null)
              if (onClearEditingProfile) {
                onClearEditingProfile()
              }
            }}
          />
        </TabsContent>

        <TabsContent value="actresses" className="mt-6">
          <ActorManager
            type="actress"
            accessToken={accessToken}
            onDataChanged={onDataChanged}
            editingProfile={editingProfile?.type === 'actress' ? editingProfile : null}
            onClearEditingProfile={() => {
              setEditingProfile(null)
              if (onClearEditingProfile) {
                onClearEditingProfile()
              }
            }}
          />
        </TabsContent>

        <TabsContent value="bulk-assignment" className="mt-6">
          <div className="space-y-6">
            <BulkAssignmentManager accessToken={accessToken} />
          </div>
        </TabsContent>

        <TabsContent value="master-data" className="mt-6">
          <MasterDataManager accessToken={accessToken} />
        </TabsContent>

        <TabsContent value="stats" className="mt-6">
          <StatsContent accessToken={accessToken} />
        </TabsContent>

        <TabsContent value="backup-restore" className="mt-6">
          <BackupRestoreContent accessToken={accessToken} />
        </TabsContent>

        <TabsContent value="deepseek-test" className="mt-6">
          <DeepSeekTranslationTest accessToken={accessToken} />
        </TabsContent>

        <TabsContent value="setup-api-key" className="mt-6">
          <SetupApiKey accessToken={accessToken} />
        </TabsContent>

        <TabsContent value="cache-manager" className="mt-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Cache Manager</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Kelola cache aplikasi untuk mempercepat loading dan mengatasi masalah data yang tidak terupdate
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Cache Status</h3>
                <CacheManager />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Informasi Cache</h3>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Mengapa Cache Perlu Dibersihkan?</h4>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• Foto profil aktris tidak terupdate setelah diubah</li>
                    <li>• Data master tidak ter-refresh setelah edit</li>
                    <li>• Movie detail page menampilkan data lama</li>
                    <li>• Performa aplikasi terasa lambat</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                  <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">Tips Penggunaan</h4>
                  <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
                    <li>• Bersihkan cache setelah mengupdate foto profil</li>
                    <li>• Gunakan "Clear All Cache" untuk refresh semua data</li>
                    <li>• Cache akan otomatis refresh setelah 24 jam</li>
                    <li>• Tidak perlu khawatir, data asli tetap aman</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}