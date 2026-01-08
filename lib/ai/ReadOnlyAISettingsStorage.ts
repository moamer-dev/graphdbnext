import type { AISettingsStorage, AISettings } from '@graphdb/model-builder'

/**
 * Read-only storage implementation for AI settings.
 * Settings are managed externally by the parent app, and this storage
 * only provides initial settings without allowing modifications.
 */
export class ReadOnlyAISettingsStorage implements AISettingsStorage {
  private settings: AISettings

  constructor(settings: AISettings) {
    this.settings = settings
  }

  async getSettings(): Promise<AISettings> {
    return this.settings
  }

  async saveSettings(_settings: AISettings): Promise<void> {
    throw new Error(
      'AI settings cannot be modified from the model builder. Please update settings in the parent application.'
    )
  }

  async clearSettings(): Promise<void> {
    throw new Error(
      'AI settings cannot be modified from the model builder. Please update settings in the parent application.'
    )
  }

  /**
   * Update the internal settings (used by parent app to refresh settings)
   */
  updateSettings(newSettings: AISettings): void {
    this.settings = newSettings
  }
}

