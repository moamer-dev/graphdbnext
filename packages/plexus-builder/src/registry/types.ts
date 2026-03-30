import { LucideIcon } from 'lucide-react'

export type FieldType = 
  | 'text' 
  | 'textarea' // For multi-line text
  | 'number' 
  | 'boolean' 
  | 'select' 
  | 'credential' // For selecting stored credentials
  | 'multiselect' 
  | 'properties' // For key-value pairs
  | 'mappings'   // For attribute mappings
  | 'transforms' // For text transforms
  | 'separator'  // For visual grouping

export interface FieldOption {
  label: string
  value: string
}

export interface ConfigField {
  name: string
  label: string
  type: FieldType
  placeholder?: string
  description?: string
  details?: string
  options?: FieldOption[] // For select/multiselect
  credentialType?: string // Optional provider type filter for credential fields
  defaultValue?: any
  required?: boolean
  // Conditional rendering
  dependsOn?: string
  dependsOnValue?: any | any[]
}

export interface ItemMetadata {
  label: string
  description: string
  icon: LucideIcon
  category: string
  color?: string
  bgColor?: string
  isApiTool?: boolean
  order?: number
  hidden?: boolean
}

export interface BaseDefinition {
  id: string
  metadata: ItemMetadata
  configSchema: ConfigField[]
  defaultConfig: Record<string, any>
}

export interface CategoryMetadata {
  id: string
  label: string
  icon: LucideIcon
  color?: string
  bgColor?: string
  order?: number
}

export interface ActionDefinition extends BaseDefinition {
  executor?: (action: any, ctx: any) => void
}

export interface ToolDefinition extends BaseDefinition {
  executor?: (tool: any, ctx: any) => Promise<any>
}
