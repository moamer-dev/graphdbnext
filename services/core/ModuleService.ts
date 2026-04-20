import { getModuleRegistry } from '@/modules/registry'
import type { Module, ModuleId } from '@/modules/types'
import { SettingsService } from '../SettingsService'

/**
 * Service for managing modules
 * Handles module activation/deactivation and persistence
 */
export class ModuleService {
  private registry = getModuleRegistry()
  private synced = false

  /**
   * Sync registry with database settings
   */
  async syncWithDatabase (): Promise<void> {
    try {
      console.log('ModuleService: Syncing with database...')
      const settings = await SettingsService.getGlobalSettings()
      console.log('ModuleService: Settings found:', settings)
      const modulesConfig = (settings.modules || {}) as Record<string, boolean>
      
      for (const [id, enabled] of Object.entries(modulesConfig)) {
        console.log(`ModuleServiceSync: ${id} -> ${enabled}`)
        if (enabled) {
          await this.registry.enable(id)
        } else {
          await this.registry.disable(id)
        }
      }
      this.synced = true
    } catch (error) {
      console.error('Failed to sync modules with database:', error)
    }
  }

  /**
   * Get all registered modules
   */
  getAllModules (): Module[] {
    return this.registry.getAllModules()
  }

  /**
   * Get a specific module
   */
  getModule (moduleId: ModuleId): Module | undefined {
    return this.registry.getModule(moduleId)
  }

  /**
   * Check if a module is enabled
   */
  isEnabled (moduleId: ModuleId): boolean {
    return this.registry.isEnabled(moduleId)
  }

  /**
   * Enable a module
   */
  async enableModule (moduleId: ModuleId): Promise<void> {
    await this.registry.enable(moduleId)
    await this.persistState()
  }

  /**
   * Disable a module
   */
  async disableModule (moduleId: ModuleId): Promise<void> {
    await this.registry.disable(moduleId)
    await this.persistState()
  }

  private async persistState (): Promise<void> {
    try {
      const modules = this.registry.getAllModules()
      const config: Record<string, boolean> = {}
      modules.forEach(m => {
        config[m.id] = m.enabled
      })
      console.log('ModuleService: Persisting state:', config)
      await SettingsService.updateModules(config)
    } catch (error) {
      console.error('ModuleService: Failed to persist state:', error)
      throw error
    }
  }

  /**
   * Update module state
   */
  async updateModuleState (moduleId: ModuleId, enabled: boolean): Promise<void> {
    if (enabled) {
      await this.enableModule(moduleId)
    } else {
      await this.disableModule(moduleId)
    }
  }
}

// Singleton instance
export const moduleService = new ModuleService()

