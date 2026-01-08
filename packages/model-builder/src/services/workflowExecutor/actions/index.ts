import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'
import type { ActionExecutionContext, ActionExecutor } from './types'

import { executeCreateNodeAction, executeCreateNodeTextAction, executeCreateNodeTokensAction } from './nodeCreationActions'
import { executeSetPropertyAction, executeExtractTextAction, executeExtractPropertyAction, executeCopyPropertyAction, executeMergePropertiesAction, executeSplitPropertyAction, executeFormatPropertyAction, executeTransformTextAction } from './propertyActions'
import { executeCreateRelationshipAction, executeDeferRelationshipAction, executeUpdateRelationshipAction, executeDeleteRelationshipAction, executeReverseRelationshipAction } from './relationshipActions'
import { executeCreateTextNodeAction, executeCreateTokenNodesAction, executeCreateNodeWithAttributesAction } from './advancedNodeActions'
import { executeCreateAnnotationAction, executeCreateReferenceAction, executeCreateAnnotationNodesAction, executeCreateReferenceChainAction, executeExtractXmlContentAction } from './referenceActions'
import { executeExtractAndNormalizeAttributesAction, executeCreateNodeCompleteAction, executeMergeChildrenTextAction, executeCreateConditionalNodeAction, executeExtractAndComputePropertyAction, executeNormalizeAndDeduplicateAction } from './complexActions'
import { executeUpdateNodeAction, executeDeleteNodeAction, executeCloneNodeAction, executeMergeNodesAction, executeValidateNodeAction, executeValidateRelationshipAction, executeReportErrorAction, executeAddMetadataAction, executeTagNodeAction, executeSetTimestampAction } from './nodeManipulationActions'
import { executeSkipAction, executeProcessChildrenAction, executeCreateNodeWithFilteredChildrenAction, executeCreateHierarchicalNodesAction, type SpecialActionExecutionContext } from './specialActions'

const actionRegistry: Record<string, ActionExecutor> = {
  'action:create-node': executeCreateNodeAction,
  'action:create-node-text': executeCreateNodeTextAction,
  'action:create-node-tokens': executeCreateNodeTokensAction,
  'action:create-relationship': executeCreateRelationshipAction,
  'action:set-property': executeSetPropertyAction,
  'action:extract-text': executeExtractTextAction,
  'action:create-annotation': executeCreateAnnotationAction,
  'action:create-reference': executeCreateReferenceAction,
  'action:extract-xml-content': executeExtractXmlContentAction,
  'action:transform-text': executeTransformTextAction,
  'action:extract-property': executeExtractPropertyAction,
  'action:defer-relationship': executeDeferRelationshipAction,
  'action:create-text-node': executeCreateTextNodeAction,
  'action:create-token-nodes': executeCreateTokenNodesAction,
  'action:create-node-with-attributes': executeCreateNodeWithAttributesAction,
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
  'action:normalize-and-deduplicate': executeNormalizeAndDeduplicateAction,
  'action:skip': executeSkipAction,
  'action:process-children': executeProcessChildrenAction as ActionExecutor,
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

  if (action.type === 'action:process-children') {
    executeProcessChildrenAction(action, ctx)
  } else if (action.type === 'action:create-node-with-filtered-children') {
    executeCreateNodeWithFilteredChildrenAction(action, ctx)
  } else if (action.type === 'action:create-hierarchical-nodes') {
    executeCreateHierarchicalNodesAction(action, ctx)
  } else {
    executeAction(action, ctx)
  }
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

