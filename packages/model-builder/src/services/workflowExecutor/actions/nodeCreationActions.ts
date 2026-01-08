import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'
import type { ActionExecutionContext } from './types'
import type { GraphJsonNode, GraphJsonRelationship } from '../types'

export function executeCreateNodeAction(action: ActionCanvasNode, ctx: ActionExecutionContext): void {
  if (!ctx.builderNode) return

  const apiResponseData = ctx.getApiResponseData(action)
  const labels = (action.config.labels as string[]) || []
  const nodeId = ctx.nodeIdCounter.value++
  const graphNode = ctx.createGraphNode(ctx.builderNode, ctx.xmlElement, nodeId)
  
  if (labels.length > 0) {
    graphNode.labels = labels.map(label => ctx.evaluateTemplate(label, apiResponseData))
  }

  ctx.graphNodes.push(graphNode)
  ctx.elementToGraph.set(ctx.xmlElement, graphNode)
  ctx.currentGraphNode = graphNode

  if (ctx.parentGraphNode) {
    const parentRelType = ctx.evaluateTemplate((action.config.parentRelationship as string) || 'contains', apiResponseData)
    const relType = ctx.relationships.find(r => r.type === parentRelType) || ctx.relationships[0]
    if (relType) {
      const rel = ctx.createRelationship(ctx.parentGraphNode, graphNode, relType)
      ctx.graphRels.push(rel)
    }
  }
}

export function executeCreateNodeTextAction(action: ActionCanvasNode, ctx: ActionExecutionContext): void {
  if (!ctx.builderNode) return

  const nodeId = ctx.nodeIdCounter.value++
  const graphNode = ctx.createGraphNode(ctx.builderNode, ctx.xmlElement, nodeId)

  ctx.graphNodes.push(graphNode)
  ctx.elementToGraph.set(ctx.xmlElement, graphNode)
  ctx.currentGraphNode = graphNode

  if (ctx.parentGraphNode) {
    const parentRelType = (action.config.parentRelationship as string) || 'contains'
    const relType = ctx.relationships.find(r => r.type === parentRelType) || ctx.relationships[0]
    if (relType) {
      const rel = ctx.createRelationship(ctx.parentGraphNode, graphNode, relType)
      ctx.graphRels.push(rel)
    }
  }
}

export function executeCreateNodeTokensAction(action: ActionCanvasNode, ctx: ActionExecutionContext): void {
  if (!ctx.currentGraphNode && ctx.builderNode) {
    const nodeId = ctx.nodeIdCounter.value++
    const graphNode = ctx.createGraphNode(ctx.builderNode, ctx.xmlElement, nodeId)
    ctx.graphNodes.push(graphNode)
    ctx.elementToGraph.set(ctx.xmlElement, graphNode)
    ctx.currentGraphNode = graphNode

    if (ctx.parentGraphNode) {
      const parentRelType = (action.config.parentRelationship as string) || 'contains'
      const relType = ctx.relationships.find(r => r.type === parentRelType) || ctx.relationships[0]
      if (relType && ctx.parentGraphNode) {
        const rel = ctx.createRelationship(ctx.parentGraphNode, graphNode, relType)
        ctx.graphRels.push(rel)
      }
    }
  }

  if (!ctx.currentGraphNode) return

  const textContent = ctx.xmlElement.textContent || ''
  const splitBy = (action.config.splitBy as string) || ''
  const targetLabel = (action.config.targetLabel as string) || 'Character'
  const filterPattern = (action.config.filterPattern as string) || '[a-zA-Z0-9]'
  const relationshipType = (action.config.relationshipType as string) || 'contains'
  const propertyMappings = (action.config.properties as Array<{
    key: string
    source: 'token' | 'attribute' | 'index' | 'static'
    attributeName?: string
    staticValue?: string
  }>) || []
  
  let tokens: string[] = []
  if (splitBy === '') {
    tokens = Array.from(textContent)
  } else {
    tokens = textContent.split(splitBy)
  }

  const filterRegex = typeof filterPattern === 'string' ? new RegExp(filterPattern) : filterPattern
  const filteredTokens = tokens
    .map(token => token.trim())
    .filter(token => token.length > 0 && filterRegex.test(token))

  filteredTokens.forEach((token, index) => {
    const properties: Record<string, unknown> = {}

    if (propertyMappings.length > 0) {
      propertyMappings.forEach(mapping => {
        let value: unknown = null
        
        switch (mapping.source) {
          case 'token':
            value = token
            break
          case 'attribute':
            if (mapping.attributeName) {
              value = ctx.xmlElement.getAttribute(mapping.attributeName) || null
            }
            break
          case 'index':
            value = index
            break
          case 'static':
            value = mapping.staticValue || null
            break
        }
        
        if (value !== null && mapping.key) {
          properties[mapping.key] = value
        }
      })
    } else {
      properties.text = token
      properties.index = index
    }

    const characterNode: GraphJsonNode = {
      id: ctx.nodeIdCounter.value++,
      type: 'node',
      labels: [targetLabel],
      properties
    }
    ctx.graphNodes.push(characterNode)

    if (ctx.currentGraphNode) {
      const relType = ctx.relationships.find(r => r.type === relationshipType)
      if (relType) {
        const rel = ctx.createRelationship(ctx.currentGraphNode, characterNode, relType)
        ctx.graphRels.push(rel)
      } else {
        const rel: GraphJsonRelationship = {
          id: ctx.relIdCounter.value++,
          type: 'relationship',
          label: relationshipType,
          start: ctx.currentGraphNode.id,
          end: characterNode.id,
          properties: {}
        }
        ctx.graphRels.push(rel)
      }
    }
  })
}

