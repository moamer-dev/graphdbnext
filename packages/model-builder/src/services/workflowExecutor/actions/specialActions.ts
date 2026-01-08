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

export function executeProcessChildrenAction(action: ActionCanvasNode, ctx: SpecialActionExecutionContext): void {
  const filterByTag = (action.config.filterByTag as string[]) || []
  const excludeTags = (action.config.excludeTags as string[]) || []
  const recursive = (action.config.recursive as boolean) ?? false

  if (!ctx.xmlElement) return

  const children = ctx.xmlElement.childNodes ? Array.from(ctx.xmlElement.childNodes).filter((n: Node) => n.nodeType === 1) as Element[] : []
  
  children.forEach((child) => {
    const tag = child.tagName ? child.tagName.toLowerCase() : ''
    
    if (excludeTags.includes(tag)) {
      return
    }
    
    if (filterByTag.length > 0 && !filterByTag.includes(tag)) {
      return
    }

    if (recursive) {
      ctx.walk(child, ctx.currentGraphNode, 0)
    }
  })
}

export function executeCreateNodeWithFilteredChildrenAction(action: ActionCanvasNode, ctx: SpecialActionExecutionContext): void {
  if (!ctx.builderNode) return

  const nodeId = ctx.nodeIdCounter.value++
  const graphNode = ctx.createGraphNode(ctx.builderNode, ctx.xmlElement, nodeId)
  
  const nodeLabel = (action.config.nodeLabel as string) || ctx.builderNode.label
  if (nodeLabel) {
    graphNode.labels = [nodeLabel]
  }

  ctx.graphNodes.push(graphNode)
  ctx.elementToGraph.set(ctx.xmlElement, graphNode)
  ctx.currentGraphNode = graphNode

  if (ctx.parentGraphNode) {
    const parentRelType = (action.config.parentRelationship as string) || 'contains'
    const relType = ctx.relationships.find(r => r.type === parentRelType)
    if (relType) {
      const rel = ctx.createRelationship(ctx.parentGraphNode, graphNode, relType)
      ctx.graphRels.push(rel)
    } else {
      const rel: GraphJsonRelationship = {
        id: ctx.relIdCounter.value++,
        type: 'relationship',
        label: parentRelType,
        start: ctx.parentGraphNode.id,
        end: graphNode.id,
        properties: {}
      }
      ctx.graphRels.push(rel)
    }
  }

  const filterByTag = (action.config.filterByTag as string[]) || []
  const excludeTags = (action.config.excludeTags as string[]) || []
  const recursive = (action.config.recursive as boolean) ?? false

  const children = ctx.xmlElement.childNodes ? Array.from(ctx.xmlElement.childNodes).filter((n: Node) => n.nodeType === 1) as Element[] : []
  children.forEach((child) => {
    const tag = child.tagName ? child.tagName.toLowerCase() : ''
    if (excludeTags.includes(tag)) return
    if (filterByTag.length > 0 && !filterByTag.includes(tag)) return

    if (recursive) {
      ctx.walk(child, graphNode, 0)
    } else {
      const childTag = child.tagName ? child.tagName.toLowerCase() : ''
      const matchedChildNodes = ctx.labelToNodes.get(childTag) || []
      if (matchedChildNodes.length > 0) {
        ctx.walk(child, graphNode, 0)
      }
    }
  })
}

export function executeCreateHierarchicalNodesAction(action: ActionCanvasNode, ctx: SpecialActionExecutionContext): void {
  if (!ctx.builderNode) return

  const parentNodeLabel = (action.config.parentNodeLabel as string) || ctx.builderNode.label
  const childNodeLabel = (action.config.childNodeLabel as string) || ''
  const filterByTag = (action.config.filterByTag as string[]) || []
  const recursive = (action.config.recursive as boolean) ?? false
  const parentRelType = (action.config.parentRelationship as string) || 'contains'
  const childRelType = (action.config.childRelationship as string) || 'contains'

  const parentNodeId = ctx.nodeIdCounter.value++
  const parentGraphNode: GraphJsonNode = {
    id: parentNodeId,
    type: 'node',
    labels: [parentNodeLabel],
    properties: {}
  }
  ctx.graphNodes.push(parentGraphNode)
  ctx.elementToGraph.set(ctx.xmlElement, parentGraphNode)
  ctx.currentGraphNode = parentGraphNode

  if (ctx.parentGraphNode) {
    const relType = ctx.relationships.find(r => r.type === parentRelType)
    if (relType) {
      const rel = ctx.createRelationship(ctx.parentGraphNode, parentGraphNode, relType)
      ctx.graphRels.push(rel)
    } else {
      const rel: GraphJsonRelationship = {
        id: ctx.relIdCounter.value++,
        type: 'relationship',
        label: parentRelType,
        start: ctx.parentGraphNode.id,
        end: parentGraphNode.id,
        properties: {}
      }
      ctx.graphRels.push(rel)
    }
  }

  if (childNodeLabel) {
    const children = ctx.xmlElement.childNodes ? Array.from(ctx.xmlElement.childNodes).filter((n: Node) => n.nodeType === 1) as Element[] : []
    children.forEach((child) => {
      const tag = child.tagName ? child.tagName.toLowerCase() : ''
      if (filterByTag.length > 0 && !filterByTag.includes(tag)) return

      const childNode: GraphJsonNode = {
        id: ctx.nodeIdCounter.value++,
        type: 'node',
        labels: [childNodeLabel],
        properties: {}
      }
      ctx.graphNodes.push(childNode)

      const relType = ctx.relationships.find(r => r.type === childRelType)
      if (relType) {
        const rel = ctx.createRelationship(parentGraphNode, childNode, relType)
        ctx.graphRels.push(rel)
      } else {
        const rel: GraphJsonRelationship = {
          id: ctx.relIdCounter.value++,
          type: 'relationship',
          label: childRelType,
          start: parentGraphNode.id,
          end: childNode.id,
          properties: {}
        }
        ctx.graphRels.push(rel)
      }

      if (recursive) {
        ctx.walk(child, childNode, 0)
      }
    })
  }
}

