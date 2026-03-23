import { ActionDefinition, ToolDefinition } from './types'

class WorkflowRegistry {
  private actions: Map<string, ActionDefinition> = new Map()
  private tools: Map<string, ToolDefinition> = new Map()
  private actionCategories: Set<string> = new Set()
  private toolCategories: Set<string> = new Set()

  registerAction(definition: ActionDefinition) {
    this.actions.set(definition.id, definition)
    this.actionCategories.add(definition.metadata.category)
  }

  registerTool(definition: ToolDefinition) {
    this.tools.set(definition.id, definition)
    this.toolCategories.add(definition.metadata.category)
  }

  getAction(id: string): ActionDefinition | undefined {
    return this.actions.get(id)
  }

  getTool(id: string): ToolDefinition | undefined {
    return this.tools.get(id)
  }

  getAllActions(): ActionDefinition[] {
    return Array.from(this.actions.values())
  }

  getAllTools(): ToolDefinition[] {
    return Array.from(this.tools.values())
  }

  getActionCategories(): string[] {
    return Array.from(this.actionCategories)
  }

  getToolCategories(): string[] {
    return Array.from(this.toolCategories)
  }

  getActionsByCategory(category: string): ActionDefinition[] {
    return this.getAllActions().filter(a => a.metadata.category === category)
  }

  getToolsByCategory(category: string): ToolDefinition[] {
    return this.getAllTools().filter(t => t.metadata.category === category)
  }
}

export const workflowRegistry = new WorkflowRegistry()
