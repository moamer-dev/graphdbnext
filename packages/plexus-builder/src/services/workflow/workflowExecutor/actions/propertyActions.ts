import type { ActionCanvasNode } from '../../../../stores/actionCanvasStore'
import type { ActionExecutionContext } from './types'

export function executeSetPropertyAction(action: ActionCanvasNode, ctx: ActionExecutionContext): void {
  ctx.deferredOperations.push({
    type: 'set-property',
    contextNode: ctx.currentGraphNode,
    parentNode: ctx.parentGraphNode,
    config: action.config as any,
    apiData: ctx.getApiResponseData(action) as any
  })
}

export function executeCopyPropertyAction(action: ActionCanvasNode, ctx: ActionExecutionContext): void {
  ctx.deferredOperations.push({
    type: 'copy-property',
    contextNode: ctx.currentGraphNode,
    parentNode: ctx.parentGraphNode,
    config: action.config as any,
    apiData: ctx.getApiResponseData(action) as any
  })
}

export function executeMergePropertiesAction(action: ActionCanvasNode, ctx: ActionExecutionContext): void {
  ctx.deferredOperations.push({
    type: 'merge-properties',
    contextNode: ctx.currentGraphNode,
    parentNode: ctx.parentGraphNode,
    config: action.config as any,
    apiData: ctx.getApiResponseData(action) as any
  })
}

export function executeSplitPropertyAction(action: ActionCanvasNode, ctx: ActionExecutionContext): void {
  ctx.deferredOperations.push({
    type: 'split-property',
    contextNode: ctx.currentGraphNode,
    parentNode: ctx.parentGraphNode,
    config: action.config as any,
    apiData: ctx.getApiResponseData(action) as any
  })
}

export function executeFormatPropertyAction(action: ActionCanvasNode, ctx: ActionExecutionContext): void {
  ctx.deferredOperations.push({
    type: 'format-property',
    contextNode: ctx.currentGraphNode,
    parentNode: ctx.parentGraphNode,
    config: action.config as any,
    apiData: ctx.getApiResponseData(action) as any
  })
}

export function executeExtractAndComputePropertyAction(action: ActionCanvasNode, ctx: ActionExecutionContext): void {
  ctx.deferredOperations.push({
    type: 'extract-and-compute-property',
    contextNode: ctx.currentGraphNode,
    parentNode: ctx.parentGraphNode,
    config: action.config as any,
    apiData: ctx.getApiResponseData(action) as any
  })
}



