import type { AISettings, AISettingsStorage } from './types'
import { DEFAULT_AI_SETTINGS } from './types'

export class LocalStorageAISettings implements AISettingsStorage {
  private readonly storageKey: string

  constructor(storageKey: string = 'model-builder-ai-settings') {
    this.storageKey = storageKey
  }

  async getSettings(): Promise<AISettings> {
    if (typeof window === 'undefined') {
      return DEFAULT_AI_SETTINGS
    }

    try {
      const stored = localStorage.getItem(this.storageKey)
      if (!stored) {
        return DEFAULT_AI_SETTINGS
      }

      const parsed = JSON.parse(stored) as Partial<AISettings>
      return {
        ...DEFAULT_AI_SETTINGS,
        ...parsed,
        features: {
          ...DEFAULT_AI_SETTINGS.features,
          ...parsed.features
        },
        model: {
          ...DEFAULT_AI_SETTINGS.model,
          ...parsed.model
        }
      }
    } catch (error) {
      console.error('Error loading AI settings from localStorage:', error)
      return DEFAULT_AI_SETTINGS
    }
  }

  async saveSettings(settings: AISettings): Promise<void> {
    if (typeof window === 'undefined') {
      return
    }

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(settings))
    } catch (error) {
      console.error('Error saving AI settings to localStorage:', error)
      throw error
    }
  }

  async clearSettings(): Promise<void> {
    if (typeof window === 'undefined') {
      return
    }

    try {
      localStorage.removeItem(this.storageKey)
    } catch (error) {
      console.error('Error clearing AI settings from localStorage:', error)
    }
  }
}

export class MemoryAISettings implements AISettingsStorage {
  private settings: AISettings = DEFAULT_AI_SETTINGS

  async getSettings(): Promise<AISettings> {
    return { ...this.settings }
  }

  async saveSettings(settings: AISettings): Promise<void> {
    this.settings = { ...settings }
  }

  async clearSettings(): Promise<void> {
    this.settings = DEFAULT_AI_SETTINGS
  }
}

