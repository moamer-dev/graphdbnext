import { getModuleRegistry } from '../modules/registry'
import type { Module, ModuleId } from '../modules/types'

/**
 * Service for managing modules
 * Handles module activation/deactivation and persistence
 */
export class ModuleService {
  private registry = getModuleRegistry()

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
   * In production, this should persist to database/config
   */
  async enableModule (moduleId: ModuleId): Promise<void> {
    await this.registry.enable(moduleId)
    // TODO: Persist to database/config
    // await this.persistModuleState(moduleId, true)
  }

  /**
   * Disable a module
   * In production, this should persist to database/config
   */
  async disableModule (moduleId: ModuleId): Promise<void> {
    await this.registry.disable(moduleId)
    // TODO: Persist to database/config
    // await this.persistModuleState(moduleId, false)
  }

  /**
   * Update module state
   * In production, this should persist to database/config
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

