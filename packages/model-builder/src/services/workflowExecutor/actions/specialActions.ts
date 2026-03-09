import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'
import type { ActionExecutionContext } from './types'
import type { GraphJsonNode, GraphJsonRelationship } from '../types'

export interface SpecialActionExecutionContext extends ActionExecutionContext {
  walk: (element: Element, parentGraphNode: GraphJsonNode | null, depth: number) => void
  labelToNodes: Map<string, Array<{ label: string; id: string }>>
  actionNodes: ActionCanvasNode[]
}

export function executeSkipAction(action: ActionCanvasNode, ctx: ActionExecutionContext): void {
  const skipMainNode = (action.config.skipMainNode as boolean) ?? true
  const skipChildrenMode = (action.config.skipChildrenMode as 'all' | 'selected') || 'all'
  const skipChildren = action.config.skipChildren !== undefined 
    ? (action.config.skipChildren as boolean)
    : (skipChildrenMode === 'all' || skipChildrenMode === 'selected' ? true : true)
  const skipChildrenTags = (action.config.skipChildrenTags as string[]) || []

  ctx.skipMainNode = skipMainNode
  ctx.skipChildren = skipChildren
  if (skipChildrenMode === 'selected') {
    ctx.skipChildrenTags = skipChildrenTags.map(t => t.toLowerCase())
  }

  if (skipMainNode && skipChildren) {
    ctx.skipped = true
  } else {
    ctx.skipped = false
  }
}






