/**
 * Module interface that all optional modules must implement
 */
export interface Module {
  id: string
  name: string
  description: string
  enabled: boolean
  version?: string
}

/**
 * Module registry interface
 */
export interface ModuleRegistry {
  register(module: Module): void
  unregister(moduleId: string): void
  getModule(moduleId: string): Module | undefined
  getAllModules(): Module[]
  isEnabled(moduleId: string): boolean
  enable(moduleId: string): Promise<void>
  disable(moduleId: string): Promise<void>
}

/**
 * Module IDs
 */
export const MODULE_IDS = {
  MODEL_BUILDER: 'model-builder'
} as const

export type ModuleId = typeof MODULE_IDS[keyof typeof MODULE_IDS]

