import { workflowRegistry } from '../../../../registry'
import type { ActionCanvasNode } from '../../../../stores/actionCanvasStore'
import type { ActionExecutionContext } from './types'
import { type SpecialActionExecutionContext } from './specialActions'

export function executeActionWithWalk(
  action: ActionCanvasNode,
  ctx: SpecialActionExecutionContext
): void {
  if (action.type === 'action:group' || action.isGroup === true) {
    if (action.enabled === false) {
      return
    }
    const childActionIds = action.children || []
    childActionIds.forEach(childId => {
      const childAction = ctx.actionNodes.find(a => a.id === childId)
      if (childAction) {
        executeActionWithWalk(childAction, ctx)
      }
    })
    return
  }
  executeAction(action, ctx)

  // Recurse through action edges
  const outgoingEdges = ctx.actionEdgesBySource.get(action.id) || []
  outgoingEdges.forEach(edge => {
    const nextAction = ctx.actionNodes.find(a => a.id === edge.target)
    if (nextAction) {
      executeActionWithWalk(nextAction, ctx)
    }
  })
}

export function executeAction(
  action: ActionCanvasNode,
  ctx: ActionExecutionContext
): void {
  const definition = workflowRegistry.getAction(action.type)
  const executor = definition?.executor
  
  if (executor) {
    executor(action, ctx)
  }
}

export type { SpecialActionExecutionContext } from './specialActions'

