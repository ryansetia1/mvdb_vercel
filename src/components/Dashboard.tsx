import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { MovieList } from './MovieList'
import { MasterDataManager } from './MasterDataManager'
import { ActorManager } from './ActorManager'
import { BulkAssignmentManager } from './BulkAssignmentManager'
import { SCMovieForm } from './SCMovieForm'
import { MovieLinksManager } from './MovieLinksManager'
import { BulkLinksManagerContent } from './content/BulkLinksManagerContent'
import { Film, Settings, User, Users, ArrowRightLeft, PlayCircle, Link } from 'lucide-react'

interface DashboardProps {
  accessToken: string
  user: any
  onLogout: () => void
  onSwitchToFrontend?: () => void
  editingMovie?: any
  editingSCMovie?: any
  editingProfile?: { type: 'actor' | 'actress', name: string } | null
  onClearEditingMovie?: () => void
  onClearEditingSCMovie?: () => void
  onClearEditingProfile?: () => void
  onDataChanged?: () => void
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
  onDataChanged
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState(
    externalEditingMovie ? 'movies' : 
    externalEditingSCMovie ? 'sc-movies' :
    externalEditingProfile ? (externalEditingProfile.type === 'actress' ? 'actresses' : 'actors') : 
    'movies'
  )
  const [editingMovie, setEditingMovie] = useState<any>(externalEditingMovie || null)
  const [editingSCMovie, setEditingSCMovie] = useState<any>(externalEditingSCMovie || null)
  const [editingProfile, setEditingProfile] = useState<{ type: 'actor' | 'actress', name: string } | null>(externalEditingProfile || null)

  // Update editing movie when external prop changes
  useEffect(() => {
    if (externalEditingMovie) {
      setEditingMovie(externalEditingMovie)
      setActiveTab('movies') // Switch to movies tab when editing
    }
  }, [externalEditingMovie])

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
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="movies" className="flex items-center gap-2">
            <Film className="h-4 w-4" />
            HC Movies
          </TabsTrigger>
          <TabsTrigger value="sc-movies" className="flex items-center gap-2">
            <PlayCircle className="h-4 w-4" />
            SC Movies
          </TabsTrigger>
          <TabsTrigger value="bulk-links" className="flex items-center gap-2">
            <Link className="h-4 w-4" />
            Bulk Add Links
          </TabsTrigger>
          <TabsTrigger value="movie-links" className="flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4" />
            Movie Links
          </TabsTrigger>
          <TabsTrigger value="actors" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Actors
          </TabsTrigger>
          <TabsTrigger value="actresses" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Actresses
          </TabsTrigger>
          <TabsTrigger value="bulk-assignment" className="flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4" />
            Bulk Assignment
          </TabsTrigger>
          <TabsTrigger value="master-data" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Master Data
          </TabsTrigger>
        </TabsList>

        <TabsContent value="movies" className="mt-6">
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
          {editingSCMovie ? (
            <SCMovieForm
              scMovie={editingSCMovie}
              accessToken={accessToken}
              onSave={() => {
                setEditingSCMovie(null)
                if (onClearEditingSCMovie) {
                  onClearEditingSCMovie()
                }
                if (onDataChanged) {
                  onDataChanged()
                }
              }}
              onCancel={() => {
                setEditingSCMovie(null)
                if (onClearEditingSCMovie) {
                  onClearEditingSCMovie()
                }
              }}
            />
          ) : (
            <div className="text-center space-y-4">
              <h3 className="text-lg font-medium">SC Movies Management</h3>
              <p className="text-muted-foreground">
                Pilih SC movie dari halaman Soft Content untuk mengedit, atau buat SC movie baru melalui form ini.
              </p>
              <SCMovieForm
                accessToken={accessToken}
                onSave={() => {
                  if (onDataChanged) {
                    onDataChanged()
                  }
                }}
                onCancel={() => {
                  // Do nothing for new movie cancel
                }}
              />
            </div>
          )}
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
      </Tabs>
    </div>
  )
}