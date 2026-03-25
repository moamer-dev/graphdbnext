import { ActionDefinition, ToolDefinition, CategoryMetadata } from './types'
import { Boxes } from 'lucide-react'

class WorkflowRegistry {
  private actions: Map<string, ActionDefinition> = new Map()
  private tools: Map<string, ToolDefinition> = new Map()
  private actionCategories: Map<string, CategoryMetadata> = new Map()
  private toolCategories: Map<string, CategoryMetadata> = new Map()

  registerAction(definition: ActionDefinition) {
    this.actions.set(definition.id, definition)
  }

  registerTool(definition: ToolDefinition) {
    this.tools.set(definition.id, definition)
  }

  registerActionCategory(category: CategoryMetadata) {
    this.actionCategories.set(category.id, category)
  }

  registerToolCategory(category: CategoryMetadata) {
    this.toolCategories.set(category.id, category)
  }

  getAction(id: string): ActionDefinition | undefined {
    return this.actions.get(id)
  }

  getTool(id: string): ToolDefinition | undefined {
    return this.tools.get(id)
  }

  getActionCategory(id: string): CategoryMetadata | undefined {
    return this.actionCategories.get(id)
  }

  getToolCategory(id: string): CategoryMetadata | undefined {
    return this.toolCategories.get(id)
  }

  getAllActions(): ActionDefinition[] {
    return Array.from(this.actions.values())
  }

  getAllTools(): ToolDefinition[] {
    return Array.from(this.tools.values())
  }

  getActionCategories(): CategoryMetadata[] {
    const registered = Array.from(this.actionCategories.values())
    const usedIds = new Set(registered.map(c => c.id))
    
    // Add any used but unregistered categories
    this.getAllActions().forEach(action => {
      if (action.metadata.category && !usedIds.has(action.metadata.category)) {
        registered.push({
          id: action.metadata.category,
          label: action.metadata.category,
          icon: Boxes as any
        })
        usedIds.add(action.metadata.category)
      }
    })
    
    return registered.sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
  }

  getToolCategories(): CategoryMetadata[] {
    const registered = Array.from(this.toolCategories.values())
    const usedIds = new Set(registered.map(c => c.id))
    
    // Add any used but unregistered categories
    this.getAllTools().forEach(tool => {
      if (tool.metadata.category && !usedIds.has(tool.metadata.category)) {
        registered.push({
          id: tool.metadata.category,
          label: tool.metadata.category,
          icon: Boxes as any
        })
        usedIds.add(tool.metadata.category)
      }
    })
    
    return registered.sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
  }

  getActionsByCategory(category: string): ActionDefinition[] {
    return this.getAllActions()
      .filter(a => a.metadata.category === category && !a.metadata.hidden)
      .sort((a, b) => (a.metadata.order ?? 999) - (b.metadata.order ?? 999))
  }

  getToolsByCategory(category: string): ToolDefinition[] {
    return this.getAllTools()
      .filter(t => t.metadata.category === category && !t.metadata.hidden)
      .sort((a, b) => (a.metadata.order ?? 999) - (b.metadata.order ?? 999))
  }

  getGroupedActions(): { category: string; config: CategoryMetadata; actions: ActionDefinition[] }[] {
    const grouped: { category: string; config: CategoryMetadata; actions: ActionDefinition[] }[] = []
    
    this.getActionCategories().forEach(cat => {
      const actions = this.getActionsByCategory(cat.id)
      if (actions.length > 0) {
        grouped.push({
          category: cat.id,
          config: cat,
          actions
        })
      }
    })
    
    return grouped
  }

  getGroupedTools(): { category: string; config: CategoryMetadata; tools: ToolDefinition[] }[] {
    const grouped: { category: string; config: CategoryMetadata; tools: ToolDefinition[] }[] = []
    
    this.getToolCategories().forEach(cat => {
      const tools = this.getToolsByCategory(cat.id)
      if (tools.length > 0) {
        grouped.push({
          category: cat.id,
          config: cat,
          tools
        })
      }
    })
    
    return grouped
  }
}

export const workflowRegistry = new WorkflowRegistry()
