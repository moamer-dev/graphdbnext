import type { Module, ModuleRegistry } from './types'
import { MODULE_IDS } from './types'

/**
 * In-memory module registry
 * In production, this could be backed by a database or config file
 */
class ModuleRegistryImpl implements ModuleRegistry {
  private modules: Map<string, Module> = new Map()

  constructor () {
    // Initialize with default modules
    this.initializeDefaultModules()
  }

  private initializeDefaultModules (): void {
    // Model Builder module - default to enabled
    // In production, this should be loaded from database/config
    this.modules.set(MODULE_IDS.MODEL_BUILDER, {
      id: MODULE_IDS.MODEL_BUILDER,
      name: 'Model Builder',
      description: 'Visual model builder for creating and editing graph schemas',
      enabled: true, // Default enabled, can be overridden by settings
      version: '1.0.0'
    })
  }

  register (module: Module): void {
    this.modules.set(module.id, module)
  }

  unregister (moduleId: string): void {
    this.modules.delete(moduleId)
  }

  getModule (moduleId: string): Module | undefined {
    return this.modules.get(moduleId)
  }

  getAllModules (): Module[] {
    return Array.from(this.modules.values())
  }

  isEnabled (moduleId: string): boolean {
    const mod = this.modules.get(moduleId)
    return mod?.enabled ?? false
  }

  async enable (moduleId: string): Promise<void> {
    const mod = this.modules.get(moduleId)
    if (mod) {
      mod.enabled = true
      this.modules.set(moduleId, mod)
    }
  }

  async disable (moduleId: string): Promise<void> {
    const mod = this.modules.get(moduleId)
    if (mod) {
      mod.enabled = false
      this.modules.set(moduleId, mod)
    }
  }
}

// Singleton instance
let registryInstance: ModuleRegistry | null = null

export function getModuleRegistry (): ModuleRegistry {
  if (!registryInstance) {
    registryInstance = new ModuleRegistryImpl()
  }
  return registryInstance
}

// Client-side hook to check if module is enabled
export function useModuleEnabled (moduleId: string): boolean {
  // This will be implemented as a React hook that reads from server state
  // For now, return the default from registry
  if (typeof window === 'undefined') {
    return false // SSR: return false, will be hydrated on client
  }
  
  const registry = getModuleRegistry()
  return registry.isEnabled(moduleId)
}

