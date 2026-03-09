import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'
import type { ActionExecutionContext } from './types'
import type { GraphJsonNode, GraphJsonRelationship } from '../types'

export function executeCreateNodeAction(action: ActionCanvasNode, ctx: ActionExecutionContext): void {
  if (!ctx.builderNode) return

  const apiResponseData = ctx.getApiResponseData(action)
  const labels = (action.config.labels as string[]) || []
  const nodeId = ctx.nodeIdCounter.value++
  const graphNode = ctx.createGraphNode(ctx.builderNode, ctx.xmlElement, nodeId)
  
  // Capture the node that "owns" this action execution
  const originNode = ctx.currentGraphNode || ctx.parentGraphNode
  
  if (labels.length > 0) {
    graphNode.labels = labels.map(label => ctx.evaluateTemplate(label, apiResponseData))
  }

  ctx.graphNodes.push(graphNode)
  if (!ctx.currentGraphNode) {
    ctx.elementToGraph.set(ctx.xmlElement, graphNode)
    ctx.currentGraphNode = graphNode
  }

  if (originNode) {
    const parentRelType = ctx.evaluateTemplate((action.config.parentRelationship as string) || 'contains', apiResponseData)
    const relType = ctx.relationships.find(r => r.type === parentRelType) || ctx.relationships[0]
    if (relType) {
      const rel = ctx.createRelationship(originNode, graphNode, relType)
      ctx.graphRels.push(rel)
    }
  }
}

