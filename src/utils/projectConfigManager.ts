/**
 * Project Configuration Management
 * Handles dynamic project switching and configuration updates
 */

export interface ProjectConfig {
  projectId: string
  anonKey: string
  functionUrl: string
  region?: string
}

class ProjectConfigManager {
  private currentConfig: ProjectConfig | null = null
  private listeners: ((config: ProjectConfig) => void)[] = []

  constructor() {
    this.loadConfig()
  }

  // Load configuration from environment or localStorage
  private loadConfig(): void {
    const envProjectId = (import.meta as any).env?.VITE_SUPABASE_PROJECT_ID
    const envAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY
    const envFunctionUrl = (import.meta as any).env?.VITE_SUPABASE_FUNCTION_URL

    if (envProjectId && envAnonKey) {
      this.currentConfig = {
        projectId: envProjectId,
        anonKey: envAnonKey,
        functionUrl: envFunctionUrl || `https://${envProjectId}.supabase.co/functions/v1/make-server-e0516fcf`
      }
    } else {
      // Fallback to hardcoded values
      this.currentConfig = {
        projectId: "duafhkktqobwwwwtygwn",
        anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1YWZoa2t0cW9id3d3d3R5Z3duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDgyMzMsImV4cCI6MjA3MTEyNDIzM30.27Uq11a_wfbZindYK7LuKbqvJXsBrobPq6_UDUHrHuU",
        functionUrl: "https://duafhkktqobwwwwtygwn.supabase.co/functions/v1/make-server-e0516fcf"
      }
    }

    // Store in localStorage for persistence
    localStorage.setItem('mvdb_project_config', JSON.stringify(this.currentConfig))
  }

  // Get current configuration
  getConfig(): ProjectConfig {
    if (!this.currentConfig) {
      this.loadConfig()
    }
    return this.currentConfig!
  }

  // Update configuration (for project switching)
  updateConfig(newConfig: Partial<ProjectConfig>): void {
    const oldConfig = this.currentConfig
    this.currentConfig = {
      ...this.currentConfig!,
      ...newConfig
    }

    // Update localStorage
    localStorage.setItem('mvdb_project_config', JSON.stringify(this.currentConfig))

    // Notify listeners
    this.listeners.forEach(listener => listener(this.currentConfig!))

    // Clear cache if project ID changed
    if (oldConfig && oldConfig.projectId !== this.currentConfig.projectId) {
      console.log(`Project switched from ${oldConfig.projectId} to ${this.currentConfig.projectId}`)
      this.clearProjectData()
    }
  }

  // Clear all project-specific data
  private clearProjectData(): void {
    // Clear cache
    localStorage.removeItem('mvdb_cached_data')
    
    // Clear filter states
    localStorage.removeItem('mvdb_filter_states')
    
    // Clear theme (optional - might want to keep)
    // localStorage.removeItem('mvdb_theme')
    
    // Clear movie type colors (optional - might want to keep)
    // localStorage.removeItem('mvdb_movie_type_colors')
    
    console.log('Project data cleared for new project')
  }

  // Subscribe to configuration changes
  subscribe(listener: (config: ProjectConfig) => void): () => void {
    this.listeners.push(listener)
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  // Check if configuration is valid
  isValid(): boolean {
    const config = this.getConfig()
    return !!(config.projectId && config.anonKey && config.functionUrl)
  }

  // Get project-specific storage key
  getStorageKey(baseKey: string): string {
    const config = this.getConfig()
    return `${baseKey}_${config.projectId}`
  }
}

// Global instance
export const projectConfigManager = new ProjectConfigManager()

// Helper functions
export function getProjectConfig(): ProjectConfig {
  return projectConfigManager.getConfig()
}

export function updateProjectConfig(newConfig: Partial<ProjectConfig>): void {
  projectConfigManager.updateConfig(newConfig)
}

export function subscribeToProjectChanges(listener: (config: ProjectConfig) => void): () => void {
  return projectConfigManager.subscribe(listener)
}

export function isProjectConfigValid(): boolean {
  return projectConfigManager.isValid()
}

export function getProjectStorageKey(baseKey: string): string {
  return projectConfigManager.getStorageKey(baseKey)
}
