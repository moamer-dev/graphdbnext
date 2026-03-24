import type { ActionCanvasNode } from '../../../../stores/actionCanvasStore'
import type { ActionExecutionContext } from './types'
import type { GraphJsonNode } from '../types'

export function executeUpdateNodeAction(action: ActionCanvasNode, ctx: ActionExecutionContext): void {
  ctx.deferredOperations.push({
    type: 'update-node',
    contextNode: ctx.currentGraphNode,
    parentNode: ctx.parentGraphNode,
    config: action.config as any,
    apiData: ctx.getApiResponseData(action) as any
  })
}

export function executeDeleteNodeAction(action: ActionCanvasNode, ctx: ActionExecutionContext): void {
  ctx.deferredOperations.push({
    type: 'delete-node',
    contextNode: ctx.currentGraphNode,
    parentNode: ctx.parentGraphNode,
    config: action.config as any,
    apiData: ctx.getApiResponseData(action) as any
  })
}

export function executeCloneNodeAction(action: ActionCanvasNode, ctx: ActionExecutionContext): void {
  ctx.deferredOperations.push({
    type: 'clone-node',
    contextNode: ctx.currentGraphNode,
    parentNode: ctx.parentGraphNode,
    config: action.config as any,
    apiData: ctx.getApiResponseData(action) as any
  })
}

export function executeMergeNodesAction(action: ActionCanvasNode, ctx: ActionExecutionContext): void {
  ctx.deferredOperations.push({
    type: 'merge-nodes',
    contextNode: ctx.currentGraphNode,
    parentNode: ctx.parentGraphNode,
    config: action.config as any,
    apiData: ctx.getApiResponseData(action) as any
  })
}


