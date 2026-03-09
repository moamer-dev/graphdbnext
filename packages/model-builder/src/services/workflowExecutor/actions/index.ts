import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'
import type { ActionExecutionContext, ActionExecutor } from './types'

import { executeCreateNodeAction } from './nodeCreationActions'
import { executeSetPropertyAction, executeCopyPropertyAction, executeMergePropertiesAction, executeSplitPropertyAction, executeFormatPropertyAction } from './propertyActions'
import { executeCreateRelationshipAction, executeDeferRelationshipAction, executeUpdateRelationshipAction, executeDeleteRelationshipAction, executeReverseRelationshipAction } from './relationshipActions'
import { executeCreateTextNodeAction, executeCreateTokenNodesAction } from './advancedNodeActions'
import { executeCreateAnnotationNodesAction, executeCreateReferenceChainAction } from './referenceActions'
import { executeExtractAndNormalizeAttributesAction, executeCreateNodeCompleteAction, executeMergeChildrenTextAction, executeExtractAndComputePropertyAction, executeCreateNodeWithLookupAction } from './complexActions'
import { executeUpdateNodeAction, executeDeleteNodeAction, executeCloneNodeAction, executeMergeNodesAction } from './nodeManipulationActions'
import { executeSkipAction, type SpecialActionExecutionContext } from './specialActions'

const actionRegistry: Record<string, ActionExecutor> = {
  'action:create-node': executeCreateNodeAction,
  'action:create-relationship': executeCreateRelationshipAction,
  'action:set-property': executeSetPropertyAction,

  'action:defer-relationship': executeDeferRelationshipAction,
  'action:create-text-node': executeCreateTextNodeAction,
  'action:create-token-nodes': executeCreateTokenNodesAction,
  'action:create-node-complete': executeCreateNodeCompleteAction,
  'action:extract-and-normalize-attributes': executeExtractAndNormalizeAttributesAction,
  'action:create-annotation-nodes': executeCreateAnnotationNodesAction,
  'action:create-reference-chain': executeCreateReferenceChainAction,
  'action:merge-children-text': executeMergeChildrenTextAction,
  'action:extract-and-compute-property': executeExtractAndComputePropertyAction,
  'action:copy-property': executeCopyPropertyAction,
  'action:merge-properties': executeMergePropertiesAction,
  'action:split-property': executeSplitPropertyAction,
  'action:format-property': executeFormatPropertyAction,
  'action:update-relationship': executeUpdateRelationshipAction,
  'action:delete-relationship': executeDeleteRelationshipAction,
  'action:reverse-relationship': executeReverseRelationshipAction,
  'action:update-node': executeUpdateNodeAction,
  'action:delete-node': executeDeleteNodeAction,
  'action:clone-node': executeCloneNodeAction,
  'action:merge-nodes': executeMergeNodesAction,
  'action:skip': executeSkipAction,

  'action:create-node-with-lookup': executeCreateNodeWithLookupAction
}

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
  const executor = actionRegistry[action.type]
  if (executor) {
    executor(action, ctx)
  }
}

export { actionRegistry }
export type { SpecialActionExecutionContext } from './specialActions'

