import type { AISettingsStorage, AISettings } from '@graphdb/model-builder'

// Export default settings for use in other files
export const DEFAULT_AI_SETTINGS: AISettings = {
  enabled: false,
  model: {
    provider: 'openai' as const,
    modelName: 'gpt-4-turbo' as const,
    temperature: 0.7,
    maxTokens: 4000
  },
  features: {
    enabled: false,
    researchAssistantChatbot: false,
    xmlMappingAssistant: false,
    schemaDesignAgent: false,
    workflowGenerationAgent: false,
    relationshipRecommendation: false,
    nodePropertySuggestion: false,
    schemaOptimization: false,
    aiAgentsAsTools: false
  }
}

export class ApiAISettingsStorage implements AISettingsStorage {
  private readonly baseUrl: string

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl
  }

  async getSettings(): Promise<AISettings> {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai-settings`, {
        method: 'GET',
        credentials: 'include'
      })

      if (!response.ok) {
        if (response.status === 401) {
          console.warn('Unauthorized access to AI settings, using defaults')
          return DEFAULT_AI_SETTINGS
        }
        throw new Error(`Failed to fetch AI settings: ${response.statusText}`)
      }

      const settings = await response.json() as AISettings
      return {
        ...DEFAULT_AI_SETTINGS,
        ...settings,
        features: {
          ...DEFAULT_AI_SETTINGS.features,
          ...settings.features
        },
        model: {
          ...DEFAULT_AI_SETTINGS.model,
          ...settings.model
        }
      }
    } catch (error) {
      console.error('Error fetching AI settings from API:', error)
      return DEFAULT_AI_SETTINGS
    }
  }

  async saveSettings(settings: AISettings): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(settings)
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized: Please log in to save AI settings')
        }
        const error = await response.json().catch(() => ({ error: response.statusText }))
        throw new Error(error.error || `Failed to save AI settings: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error saving AI settings to API:', error)
      throw error
    }
  }

  async clearSettings(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai-settings`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized: Please log in to clear AI settings')
        }
        throw new Error(`Failed to clear AI settings: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error clearing AI settings from API:', error)
      throw error
    }
  }
}

