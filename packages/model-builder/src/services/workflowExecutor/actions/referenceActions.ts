import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'
import type { ActionExecutionContext } from './types'
import type { GraphJsonNode, GraphJsonRelationship } from '../types'





export function executeCreateAnnotationNodesAction(action: ActionCanvasNode, ctx: ActionExecutionContext): void {
  if (!ctx.builderNode) return

  // Ensure current node exists
  if (!ctx.currentGraphNode) {
    if (ctx.elementToGraph.has(ctx.xmlElement)) {
      ctx.currentGraphNode = ctx.elementToGraph.get(ctx.xmlElement)!
    } else {
      const nodeId = ctx.nodeIdCounter.value++
      const node = ctx.createGraphNode(ctx.builderNode, ctx.xmlElement, nodeId)
      ctx.graphNodes.push(node)
      ctx.elementToGraph.set(ctx.xmlElement, node)
      ctx.currentGraphNode = node

      // Create parent relationship if applicable
      if (ctx.parentGraphNode) {
        const relType = ctx.findRelationship(ctx.parentGraphNode.labels[0], node.labels[0])
        if (relType) {
          const rel = ctx.createRelationship(ctx.parentGraphNode, node, relType)
          ctx.graphRels.push(rel)
        }
      }
    }
  }

  const relationshipType = (action.config.relationshipType as string) || 'annotatedBy'
  const referenceAttribute = (action.config.referenceAttribute as string) || ''

  const currentNode = ctx.currentGraphNode

  // Strictly Handle Reference Linking
  let attrValue: string | null = null

  if (referenceAttribute) {
    attrValue = ctx.xmlElement.getAttribute(referenceAttribute)
  } else {
    // Auto-detect common reference attributes
    const commonAttributes = ['target', 'corresp', 'ref', 'ana']
    for (const attr of commonAttributes) {
      attrValue = ctx.xmlElement.getAttribute(attr)
      if (attrValue) break
    }
  }

  if (attrValue) {
    const cleanId = attrValue.replace(/^#/, '').split(' ')[0]
    const targetElement = ctx.findElementById(ctx.doc, cleanId)
    const relLabel = relationshipType || 'annotates'

    // Always defer to handle multiple matches (e.g., inherited IDs on child nodes)
    // and to ensure all nodes are created before linking.
    ctx.deferredRelationships.push({
      from: currentNode,
      to: null,
      type: relLabel,
      properties: {},
      targetId: cleanId,
      targetElement: targetElement || undefined,
      direction: 'outgoing',
      mustResolve: true
    })
  }
}

export function executeCreateReferenceChainAction(action: ActionCanvasNode, ctx: ActionExecutionContext): void {
  if (!ctx.currentGraphNode) return

  const referenceAttribute = (action.config.referenceAttribute as string) || 'corresp'
  const targetNodeLabel = (action.config.targetNodeLabel as string) || ''
  const relationshipType = (action.config.relationshipType as string) || 'refersTo'
  const resolveStrategy = (action.config.resolveStrategy as 'id' | 'xpath') || 'id'
  const createTargetIfMissing = (action.config.createTargetIfMissing as boolean) ?? false

  const refValue = ctx.xmlElement.getAttribute(referenceAttribute)
  if (!refValue) return

  const cleanId = refValue.replace('#', '').split(' ')[0]
  let targetElement: Element | null = null

  if (resolveStrategy === 'id') {
    targetElement = ctx.findElementById(ctx.doc, cleanId)
  } else {
    targetElement = ctx.doc.querySelector(`[xml\\:id="${cleanId}"]`) || ctx.doc.querySelector(`[id="${cleanId}"]`)
  }

  if (targetElement) {
    const targetNode = ctx.elementToGraph.get(targetElement)
    if (targetNode) {
      const relType = ctx.relationships.find(r => r.type === relationshipType)
      if (relType) {
        const rel = ctx.createRelationship(ctx.currentGraphNode, targetNode, relType)
        ctx.graphRels.push(rel)
      } else {
        const rel: GraphJsonRelationship = {
          id: ctx.relIdCounter.value++,
          type: 'relationship',
          label: relationshipType,
          start: ctx.currentGraphNode.id,
          end: targetNode.id,
          properties: {}
        }
        ctx.graphRels.push(rel)
      }
    } else if (createTargetIfMissing && targetNodeLabel) {
      const targetNode: GraphJsonNode = {
        id: ctx.nodeIdCounter.value++,
        type: 'node',
        labels: [targetNodeLabel],
        properties: { id: cleanId }
      }
      ctx.graphNodes.push(targetNode)
      ctx.elementToGraph.set(targetElement, targetNode)

      const relType = ctx.relationships.find(r => r.type === relationshipType)
      if (relType) {
        const rel = ctx.createRelationship(ctx.currentGraphNode, targetNode, relType)
        ctx.graphRels.push(rel)
      } else {
        const rel: GraphJsonRelationship = {
          id: ctx.relIdCounter.value++,
          type: 'relationship',
          label: relationshipType,
          start: ctx.currentGraphNode.id,
          end: targetNode.id,
          properties: {}
        }
        ctx.graphRels.push(rel)
      }
    }
  }
}



