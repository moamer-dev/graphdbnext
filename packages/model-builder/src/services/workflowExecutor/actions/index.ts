import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'
import type { ActionExecutionContext, ActionExecutor } from './types'

import { executeCreateNodeAction } from './nodeCreationActions'
import { executeSetPropertyAction, executeExtractTextAction, executeCopyPropertyAction, executeMergePropertiesAction, executeSplitPropertyAction, executeFormatPropertyAction, executeTransformTextAction } from './propertyActions'
import { executeCreateRelationshipAction, executeDeferRelationshipAction, executeUpdateRelationshipAction, executeDeleteRelationshipAction, executeReverseRelationshipAction } from './relationshipActions'
import { executeCreateTextNodeAction, executeCreateTokenNodesAction } from './advancedNodeActions'
import { executeCreateAnnotationAction, executeCreateReferenceAction, executeCreateAnnotationNodesAction, executeCreateReferenceChainAction, executeExtractXmlContentAction } from './referenceActions'
import { executeExtractAndNormalizeAttributesAction, executeCreateNodeCompleteAction, executeMergeChildrenTextAction, executeCreateConditionalNodeAction, executeExtractAndComputePropertyAction } from './complexActions'
import { executeUpdateNodeAction, executeDeleteNodeAction, executeCloneNodeAction, executeMergeNodesAction, executeValidateNodeAction, executeValidateRelationshipAction, executeReportErrorAction, executeAddMetadataAction, executeTagNodeAction, executeSetTimestampAction } from './nodeManipulationActions'
import { executeSkipAction, executeCreateNodeWithFilteredChildrenAction, executeCreateHierarchicalNodesAction, type SpecialActionExecutionContext } from './specialActions'

const actionRegistry: Record<string, ActionExecutor> = {
  'action:create-node': executeCreateNodeAction,
  'action:create-relationship': executeCreateRelationshipAction,
  'action:set-property': executeSetPropertyAction,
  'action:extract-text': executeExtractTextAction,
  'action:create-annotation': executeCreateAnnotationAction,
  'action:create-reference': executeCreateReferenceAction,
  'action:extract-xml-content': executeExtractXmlContentAction,
  'action:transform-text': executeTransformTextAction,
  'action:defer-relationship': executeDeferRelationshipAction,
  'action:create-text-node': executeCreateTextNodeAction,
  'action:create-token-nodes': executeCreateTokenNodesAction,
  'action:create-node-complete': executeCreateNodeCompleteAction,
  'action:extract-and-normalize-attributes': executeExtractAndNormalizeAttributesAction,
  'action:create-annotation-nodes': executeCreateAnnotationNodesAction,
  'action:create-reference-chain': executeCreateReferenceChainAction,
  'action:merge-children-text': executeMergeChildrenTextAction,
  'action:create-conditional-node': executeCreateConditionalNodeAction,
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
  'action:validate-node': executeValidateNodeAction,
  'action:validate-relationship': executeValidateRelationshipAction,
  'action:report-error': executeReportErrorAction,
  'action:add-metadata': executeAddMetadataAction,
  'action:tag-node': executeTagNodeAction,
  'action:set-timestamp': executeSetTimestampAction,
  'action:skip': executeSkipAction,

  'action:create-node-with-filtered-children': executeCreateNodeWithFilteredChildrenAction as ActionExecutor,
  'action:create-hierarchical-nodes': executeCreateHierarchicalNodesAction as ActionExecutor
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

