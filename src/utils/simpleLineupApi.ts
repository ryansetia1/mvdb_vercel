import { MasterDataItem } from './masterDataApi'
import { masterDataApi } from './masterDataApi'

export interface SimpleLineupMember {
  actressId: string
  actressName: string
  alias?: string
  profilePicture?: string
}

export interface SimpleLineup {
  id: string
  name: string
  type: string
  order: number
  members: SimpleLineupMember[]
}

export const simpleLineupApi = {
  // Get all lineups for a generation
  async getLineupsForGeneration(generationId: string, accessToken: string): Promise<SimpleLineup[]> {
    try {
      const allLineups = await masterDataApi.getByType('lineup', accessToken)
      const generationLineups = allLineups.filter(lineup => lineup.generationId === generationId)
      
      // Load actresses to get member data
      const allActresses = await masterDataApi.getByType('actress', accessToken)
      
      // Convert to simple format
      const simpleLineups: SimpleLineup[] = generationLineups.map(lineup => {
        const members: SimpleLineupMember[] = []
        
        // Find actresses in this lineup
        allActresses.forEach(actress => {
          if (actress.lineupData && actress.lineupData[lineup.id]) {
            const lineupData = actress.lineupData[lineup.id]
            members.push({
              actressId: actress.id,
              actressName: actress.name || '',
              alias: lineupData.alias,
              profilePicture: lineupData.profilePicture
            })
          }
        })

        return {
          id: lineup.id,
          name: lineup.name,
          type: lineup.lineupType || 'Main',
          order: lineup.lineupOrder || 1,
          members
        }
      })

      return simpleLineups.sort((a, b) => a.order - b.order)
    } catch (error) {
      console.error('Error getting lineups for generation:', error)
      throw error
    }
  },

  // Create a new lineup
  async createLineup(
    name: string, 
    type: string, 
    order: number, 
    generationId: string, 
    generationName: string, 
    accessToken: string
  ): Promise<MasterDataItem> {
    try {
      const lineupData = {
        name: name.trim(),
        type: 'lineup',
        generationId: generationId,
        generationName: generationName,
        lineupType: type,
        lineupOrder: order
      }

      return await masterDataApi.createExtended('lineup', lineupData, accessToken)
    } catch (error) {
      console.error('Error creating lineup:', error)
      throw error
    }
  },

  // Update a lineup
  async updateLineup(
    lineupId: string, 
    name: string, 
    type: string, 
    order: number, 
    accessToken: string
  ): Promise<MasterDataItem> {
    try {
      const lineupData = {
        name: name.trim(),
        lineupType: type,
        lineupOrder: order
      }

      return await masterDataApi.updateExtended('lineup', lineupId, lineupData, accessToken)
    } catch (error) {
      console.error('Error updating lineup:', error)
      throw error
    }
  },

  // Delete a lineup
  async deleteLineup(lineupId: string, accessToken: string): Promise<void> {
    try {
      await masterDataApi.delete('lineup', lineupId, accessToken)
    } catch (error) {
      console.error('Error deleting lineup:', error)
      throw error
    }
  },

  // Add actress to lineup
  async addActressToLineup(
    actressId: string, 
    lineupId: string, 
    alias?: string, 
    profilePicture?: string, 
    accessToken?: string
  ): Promise<void> {
    try {
      if (!accessToken) {
        throw new Error('Access token is required')
      }

      // Get current actress data
      const actresses = await masterDataApi.getByType('actress', accessToken)
      const actress = actresses.find(a => a.id === actressId)
      
      if (!actress) {
        throw new Error('Actress not found')
      }

      // Simple approach: just add the actress to lineup
      const updateData = {
        name: actress.name,
        lineupData: {
          ...actress.lineupData,
          [lineupId]: {
            alias: alias || actress.name, // Default to English name
            profilePicture: profilePicture || actress.profilePicture
          }
        }
      }

      await masterDataApi.updateExtended('actress', actressId, updateData, accessToken)
    } catch (error) {
      console.error('Error adding actress to lineup:', error)
      throw error
    }
  },

  // Remove actress from lineup
  async removeActressFromLineup(actressId: string, lineupId: string, accessToken: string): Promise<void> {
    try {
      // Get current actress data
      const actresses = await masterDataApi.getByType('actress', accessToken)
      const actress = actresses.find(a => a.id === actressId)
      
      if (!actress) {
        throw new Error('Actress not found')
      }

      // Simple approach: remove the lineup from actress data
      const updatedLineupData = { ...actress.lineupData }
      delete updatedLineupData[lineupId]

      const updateData = {
        name: actress.name,
        lineupData: updatedLineupData
      }

      await masterDataApi.updateExtended('actress', actressId, updateData, accessToken)
    } catch (error) {
      console.error('Error removing actress from lineup:', error)
      throw error
    }
  },

  // Update actress lineup data
  async updateActressLineupData(
    actressId: string, 
    lineupId: string, 
    field: 'alias' | 'profilePicture', 
    value: string, 
    accessToken: string
  ): Promise<void> {
    try {
      // Get current actress data
      const actresses = await masterDataApi.getByType('actress', accessToken)
      const actress = actresses.find(a => a.id === actressId)
      
      if (!actress) {
        throw new Error('Actress not found')
      }

      const updatedLineupData = {
        ...actress.lineupData,
        [lineupId]: {
          ...actress.lineupData?.[lineupId],
          [field]: value
        }
      }

      const updateData = {
        name: actress.name,
        lineupData: updatedLineupData
      }

      await masterDataApi.updateExtended('actress', actressId, updateData, accessToken)
    } catch (error) {
      console.error('Error updating actress lineup data:', error)
      throw error
    }
  },

  // Get available actresses for a generation
  async getAvailableActresses(generationId: string, accessToken: string): Promise<MasterDataItem[]> {
    try {
      const allActresses = await masterDataApi.getByType('actress', accessToken)
      
      // Filter actresses that belong to the same group as this generation
      const generations = await masterDataApi.getByType('generation', accessToken)
      const generation = generations.find(g => g.id === generationId)
      
      return allActresses.filter(actress => 
        actress.selectedGroups && actress.selectedGroups.includes(generation?.groupName || '')
      )
    } catch (error) {
      console.error('Error getting available actresses:', error)
      throw error
    }
  }
}
