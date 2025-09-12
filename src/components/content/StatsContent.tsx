import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { RefreshCw, Film, Users, User, PlayCircle, BookOpen, Tag, Building, Calendar, Settings, Heart, Image, FolderOpen, Download, Link as LinkIcon } from 'lucide-react'
import { movieApi } from '../../utils/movieApi'
import { scMovieApi } from '../../utils/scMovieApi'
import { masterDataApi } from '../../utils/masterDataApi'
import { photobookApi } from '../../utils/photobookApi'
import { simpleFavoritesApi } from '../../utils/simpleFavoritesApi'
import { templateStatsApi } from '../../utils/templateStatsApi'
import { movieLinksApi } from '../../utils/movieLinksApi'
import { useCachedData } from '../../hooks/useCachedData'
import { toast } from 'sonner'

interface StatsData {
  movies: {
    total: number
    byType: { [key: string]: number }
    withCover: number
    withGallery: number
    withWatchLinks: number
    withDownloadLinks: number
    withCensoredLinks: number
  }
  scMovies: {
    total: number
    realCut: number
    regularCensorship: number
    withEnglishSubs: number
  }
  actors: number
  actresses: number
  directors: number
  studios: number
  series: number
  labels: number
  groups: number
  tags: number
  photobooks: {
    total: number
    withImages: number
    byActress: { [key: string]: number }
  }
  favorites: {
    total: number
    movies: number
    images: number
    cast: number
    series: number
    photobooks: number
  }
  templates: {
    groupTemplates: number
  }
  movieLinks: {
    total: number
  }
}

interface StatsContentProps {
  accessToken: string
}

export function StatsContent({ accessToken }: StatsContentProps) {
  const { loadData: loadCachedData } = useCachedData()
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchStats = async () => {
    setLoading(true)
    try {
      console.log('Fetching stats data...')
      
      // Fetch all data using cached system to reduce API calls
      const [
        movies,
        scMovies,
        actors,
        actresses,
        directors,
        studios,
        series,
        labels,
        groups,
        tags,
        photobooks,
        favorites,
        templateStats,
        movieLinks
      ] = await Promise.all([
        loadCachedData('movies', () => movieApi.getMovies(accessToken)),
        scMovieApi.getSCMovies(accessToken), // SC movies belum di-cache
        loadCachedData('actors', () => masterDataApi.getByType('actor', accessToken)),
        loadCachedData('actresses', () => masterDataApi.getByType('actress', accessToken)),
        masterDataApi.getByType('director', accessToken), // Directors belum di-cache
        masterDataApi.getByType('studio', accessToken), // Studios belum di-cache
        masterDataApi.getByType('series', accessToken), // Series belum di-cache
        masterDataApi.getByType('label', accessToken), // Labels belum di-cache
        masterDataApi.getByType('group', accessToken), // Groups belum di-cache
        masterDataApi.getByType('tag', accessToken), // Tags belum di-cache
        loadCachedData('photobooks', () => photobookApi.getPhotobooks(accessToken)),
        simpleFavoritesApi.getFavorites(accessToken), // Favorites sudah ada cache internal
        templateStatsApi.getTemplateCounts(accessToken).catch((error) => {
          console.log('Template counts endpoint not available, using fallback:', error.message)
          return { groupTemplates: 0 }
        }),
        movieLinksApi.getMovieLinks(accessToken).catch((error) => {
          console.log('Movie links endpoint not available, using fallback:', error.message)
          return []
        })
      ])

      // Process movies data
      const movieStats = {
        total: movies.length,
        byType: movies.reduce((acc, movie) => {
          const type = movie.type || 'Unknown'
          acc[type] = (acc[type] || 0) + 1
          return acc
        }, {} as { [key: string]: number }),
        withCover: movies.filter(movie => movie.cover).length,
        withGallery: movies.filter(movie => movie.gallery).length,
        withWatchLinks: movies.filter(movie => movie.slinks && movie.slinks.trim()).length,
        withDownloadLinks: movies.filter(movie => movie.ulinks && movie.ulinks.trim()).length,
        withCensoredLinks: movies.filter(movie => movie.clinks && movie.clinks.trim()).length
      }

      // Process SC movies data
      const scMovieStats = {
        total: scMovies.length,
        realCut: scMovies.filter(movie => movie.scType === 'real_cut').length,
        regularCensorship: scMovies.filter(movie => movie.scType === 'regular_censorship').length,
        withEnglishSubs: scMovies.filter(movie => movie.hasEnglishSubs).length
      }

      // Process photobooks data
      const photobookStats = {
        total: photobooks.length,
        withImages: photobooks.filter(pb => pb.imageLinks && pb.imageLinks.length > 0).length,
        byActress: photobooks.reduce((acc, pb) => {
          if (pb.actress) {
            acc[pb.actress] = (acc[pb.actress] || 0) + 1
          }
          return acc
        }, {} as { [key: string]: number })
      }

      // Process favorites data
      const favoriteStats = {
        total: favorites.length,
        movies: favorites.filter(f => f.type === 'movie').length,
        images: favorites.filter(f => f.type === 'image').length,
        cast: favorites.filter(f => f.type === 'cast').length,
        series: favorites.filter(f => f.type === 'series').length,
        photobooks: favorites.filter(f => f.type === 'photobook').length
      }

      // Template stats are already fetched above with fallback
      const finalTemplateStats = templateStats || { groupTemplates: 0 }

      // Process movie links data
      const movieLinksStats = {
        total: movieLinks.length
      }

      const newStats: StatsData = {
        movies: movieStats,
        scMovies: scMovieStats,
        actors: actors.length,
        actresses: actresses.length,
        directors: directors.length,
        studios: studios.length,
        series: series.length,
        labels: labels.length,
        groups: groups.length,
        tags: tags.length,
        photobooks: photobookStats,
        favorites: favoriteStats,
        templates: finalTemplateStats,
        movieLinks: movieLinksStats
      }

      setStats(newStats)
      setLastUpdated(new Date())
      console.log('Stats data loaded successfully:', newStats)
      
    } catch (error) {
      console.error('Error fetching stats:', error)
      toast.error('Gagal memuat data statistik')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [accessToken])

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    subtitle, 
    color = "default",
    shadeLevel = "default"
  }: { 
    title: string
    value: number | string
    icon: React.ComponentType<{ className?: string }>
    subtitle?: string
    color?: "default" | "blue" | "green" | "orange" | "red" | "purple" | "cyan" | "emerald" | "amber"
    shadeLevel?: "primary" | "secondary" | "tertiary" | "quaternary" | "default"
  }) => {
    // Shading system based on importance and category - lighter shades
    const shadeClasses = {
      primary: "bg-gray-50 dark:bg-black border-gray-200 dark:border-gray-800 shadow-lg dark:shadow-xl ring-2 dark:ring-gray-800", // Pure black - most important
      secondary: "bg-gray-50 dark:bg-black border-gray-200 dark:border-gray-800 shadow-md dark:shadow-lg", // Pure black - important
      tertiary: "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-md", // Dark gray - moderate
      quaternary: "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 shadow-sm", // Medium gray - less important
      default: "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-500" // Light gray - least important
    }

    const getShadeStyle = (level: string) => {
      const shadeMap = {
        primary: { backgroundColor: 'rgb(0, 0, 0)', color: 'rgb(255, 255, 255)' }, // Pure black
        secondary: { backgroundColor: 'rgb(0, 0, 0)', color: 'rgb(255, 255, 255)' }, // Pure black
        tertiary: { backgroundColor: 'rgb(17, 24, 39)', color: 'rgb(255, 255, 255)' }, // gray-900 (upgraded from pure black)
        quaternary: { backgroundColor: 'rgb(31, 41, 55)', color: 'rgb(255, 255, 255)' }, // gray-800 (upgraded from gray-900)
        default: { backgroundColor: 'rgb(55, 65, 81)', color: 'rgb(255, 255, 255)' } // gray-700 (upgraded from gray-800)
      }
      return shadeMap[level as keyof typeof shadeMap] || shadeMap.default
    }

    const shadeStyle = getShadeStyle(shadeLevel)
    const isDarkShade = shadeLevel !== "default"

    return (
      <Card 
        className={`${shadeClasses[shadeLevel]} border`}
        style={isDarkShade ? shadeStyle : undefined}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p 
                className={`text-sm font-medium ${isDarkShade ? 'dark:!text-white' : 'text-gray-700 dark:text-white'}`}
                style={isDarkShade ? { color: 'rgb(255, 255, 255)' } : undefined}
              >
                {title}
              </p>
              <p 
                className={`text-2xl font-bold ${isDarkShade ? 'dark:!text-white' : 'text-gray-900 dark:text-white'}`}
                style={isDarkShade ? { color: 'rgb(255, 255, 255)' } : undefined}
              >
                {value}
              </p>
              {subtitle && (
                <p 
                  className={`text-xs mt-1 ${isDarkShade ? 'dark:!text-gray-200' : 'text-gray-600 dark:text-gray-200'}`}
                  style={isDarkShade ? { color: 'rgb(229, 231, 235)' } : undefined}
                >
                  {subtitle}
                </p>
              )}
            </div>
            <Icon 
              className={`h-8 w-8 ${isDarkShade ? 'dark:!text-white' : 'text-gray-600 dark:text-white'}`}
              style={isDarkShade ? { color: 'rgb(255, 255, 255)' } : undefined}
            />
          </div>
        </CardContent>
      </Card>
    )
  }

  const StatSection = ({ 
    title, 
    children, 
    className = "" 
  }: { 
    title: string
    children: React.ReactNode
    className?: string 
  }) => (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold text-foreground dark:text-white">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {children}
      </div>
    </div>
  )

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Memuat data statistik...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground dark:text-white">Statistik Database</h2>
          <p className="text-muted-foreground dark:text-gray-300">
            Ringkasan lengkap semua data dalam database
          </p>
        </div>
        <div className="flex items-center gap-4">
          {lastUpdated && (
            <p className="text-sm text-muted-foreground dark:text-gray-400">
              Terakhir diperbarui: {lastUpdated.toLocaleString('id-ID')}
            </p>
          )}
          <Button 
            onClick={fetchStats} 
            disabled={loading}
            variant="outline"
            size="sm"
            className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Movies Section */}
      <StatSection title="Movies (HC)">
        <StatCard 
          title="Total Movies" 
          value={stats.movies.total} 
          icon={Film} 
          color="blue"
          shadeLevel="primary"
        />
        <StatCard 
          title="Dengan Cover" 
          value={stats.movies.withCover} 
          icon={Image} 
          subtitle={`${Math.round((stats.movies.withCover / stats.movies.total) * 100)}% dari total`}
          color="green"
          shadeLevel="secondary"
        />
        <StatCard 
          title="Dengan Gallery" 
          value={stats.movies.withGallery} 
          icon={FolderOpen} 
          subtitle={`${Math.round((stats.movies.withGallery / stats.movies.total) * 100)}% dari total`}
          color="green"
          shadeLevel="secondary"
        />
        <StatCard 
          title="Dengan Watch Links" 
          value={stats.movies.withWatchLinks} 
          icon={PlayCircle} 
          subtitle={`${Math.round((stats.movies.withWatchLinks / stats.movies.total) * 100)}% dari total`}
          color="blue"
          shadeLevel="tertiary"
        />
        <StatCard 
          title="Dengan Download Links" 
          value={stats.movies.withDownloadLinks} 
          icon={Download} 
          subtitle={`${Math.round((stats.movies.withDownloadLinks / stats.movies.total) * 100)}% dari total`}
          color="green"
          shadeLevel="tertiary"
        />
        <StatCard 
          title="Dengan Censored Links" 
          value={stats.movies.withCensoredLinks} 
          icon={Settings} 
          subtitle={`${Math.round((stats.movies.withCensoredLinks / stats.movies.total) * 100)}% dari total`}
          color="orange"
          shadeLevel="quaternary"
        />
        {Object.entries(stats.movies.byType).map(([type, count]) => (
          <StatCard 
            key={type}
            title={`Type: ${type}`} 
            value={count} 
            icon={Tag} 
            color="blue"
            shadeLevel="quaternary"
          />
        ))}
      </StatSection>

      {/* SC Movies Section */}
      <StatSection title="SC Movies">
        <StatCard 
          title="Total SC Movies" 
          value={stats.scMovies.total} 
          icon={PlayCircle} 
          color="blue"
          shadeLevel="primary"
        />
        <StatCard 
          title="Real Cut" 
          value={stats.scMovies.realCut} 
          icon={Film} 
          color="red"
          shadeLevel="secondary"
        />
        <StatCard 
          title="Regular Censorship" 
          value={stats.scMovies.regularCensorship} 
          icon={Film} 
          color="orange"
          shadeLevel="secondary"
        />
        <StatCard 
          title="Dengan English Subs" 
          value={stats.scMovies.withEnglishSubs} 
          icon={Calendar} 
          subtitle={`${Math.round((stats.scMovies.withEnglishSubs / stats.scMovies.total) * 100)}% dari total`}
          color="green"
          shadeLevel="tertiary"
        />
      </StatSection>

      {/* Master Data Section */}
      <StatSection title="Master Data">
        <StatCard 
          title="Actors" 
          value={stats.actors} 
          icon={User} 
          color="blue"
          shadeLevel="secondary"
        />
        <StatCard 
          title="Actresses" 
          value={stats.actresses} 
          icon={Users} 
          color="purple"
          shadeLevel="secondary"
        />
        <StatCard 
          title="Directors" 
          value={stats.directors} 
          icon={User} 
          color="green"
          shadeLevel="tertiary"
        />
        <StatCard 
          title="Studios" 
          value={stats.studios} 
          icon={Building} 
          color="orange"
          shadeLevel="tertiary"
        />
        <StatCard 
          title="Series" 
          value={stats.series} 
          icon={Film} 
          color="blue"
          shadeLevel="tertiary"
        />
        <StatCard 
          title="Labels" 
          value={stats.labels} 
          icon={Tag} 
          color="red"
          shadeLevel="quaternary"
        />
        <StatCard 
          title="Groups" 
          value={stats.groups} 
          icon={Users} 
          color="purple"
          shadeLevel="quaternary"
        />
        <StatCard 
          title="Tags" 
          value={stats.tags} 
          icon={Tag} 
          color="green"
          shadeLevel="quaternary"
        />
      </StatSection>

      {/* Photobooks Section */}
      <StatSection title="Photobooks">
        <StatCard 
          title="Total Photobooks" 
          value={stats.photobooks.total} 
          icon={BookOpen} 
          color="blue"
          shadeLevel="primary"
        />
        <StatCard 
          title="Dengan Images" 
          value={stats.photobooks.withImages} 
          icon={Image} 
          subtitle={`${Math.round((stats.photobooks.withImages / stats.photobooks.total) * 100)}% dari total`}
          color="green"
          shadeLevel="secondary"
        />
        <StatCard 
          title="Top Actress" 
          value={Object.keys(stats.photobooks.byActress).length > 0 ? 
            Object.entries(stats.photobooks.byActress)
              .sort(([,a], [,b]) => b - a)[0][0] : 'N/A'} 
          icon={Users} 
          subtitle={Object.keys(stats.photobooks.byActress).length > 0 ? 
            `${Object.entries(stats.photobooks.byActress)
              .sort(([,a], [,b]) => b - a)[0][1]} photobooks` : ''}
          color="purple"
          shadeLevel="tertiary"
        />
      </StatSection>

      {/* Favorites Section */}
      <StatSection title="Favorites">
        <StatCard 
          title="Total Favorites" 
          value={stats.favorites.total} 
          icon={Heart} 
          color="red"
          shadeLevel="primary"
        />
        <StatCard 
          title="Movie Favorites" 
          value={stats.favorites.movies} 
          icon={Film} 
          color="blue"
          shadeLevel="secondary"
        />
        <StatCard 
          title="Image Favorites" 
          value={stats.favorites.images} 
          icon={Image} 
          color="green"
          shadeLevel="secondary"
        />
        <StatCard 
          title="Cast Favorites" 
          value={stats.favorites.cast} 
          icon={Users} 
          color="purple"
          shadeLevel="tertiary"
        />
        <StatCard 
          title="Series Favorites" 
          value={stats.favorites.series} 
          icon={Film} 
          color="orange"
          shadeLevel="tertiary"
        />
        <StatCard 
          title="Photobook Favorites" 
          value={stats.favorites.photobooks} 
          icon={BookOpen} 
          color="red"
          shadeLevel="tertiary"
        />
      </StatSection>

      {/* Templates Section */}
      <StatSection title="Templates">
        <StatCard 
          title="Group Templates" 
          value={stats.templates.groupTemplates} 
          icon={Users} 
          color="purple"
          subtitle={stats.templates.groupTemplates === 0 ? "Endpoint belum di-deploy" : ""}
          shadeLevel="quaternary"
        />
      </StatSection>

      {/* Movie Links Section */}
      <StatSection title="Movie Links">
        <StatCard 
          title="Total Movie Links" 
          value={stats.movieLinks.total} 
          icon={LinkIcon} 
          color="indigo"
          subtitle={`${stats.movieLinks.total} movie-to-movie relationships`}
          shadeLevel="tertiary"
        />
      </StatSection>

      {/* Summary Section */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Ringkasan Total
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.movies.total + stats.scMovies.total}</p>
              <p className="text-sm text-muted-foreground">Total Movies</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{stats.actors + stats.actresses + stats.directors}</p>
              <p className="text-sm text-muted-foreground">Total Cast</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.photobooks.total}</p>
              <p className="text-sm text-muted-foreground">Total Photobooks</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{stats.favorites.total}</p>
              <p className="text-sm text-muted-foreground">Total Favorites</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{stats.templates.groupTemplates}</p>
              <p className="text-sm text-muted-foreground">Total Templates</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
