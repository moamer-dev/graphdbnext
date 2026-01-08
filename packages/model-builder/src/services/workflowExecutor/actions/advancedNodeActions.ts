import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'
import type { ActionExecutionContext } from './types'
import type { GraphJsonNode, GraphJsonRelationship } from '../types'
import { evaluateExpression } from '../../../utils/jsonPathExpression'

export function executeCreateTextNodeAction(action: ActionCanvasNode, ctx: ActionExecutionContext): void {
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

  const textSource = (action.config.textSource as 'textContent' | 'attribute') || 'textContent'
  let text = ''
  
  if (textSource === 'textContent') {
    text = ctx.xmlElement.textContent || ''
  } else {
    const attributeName = (action.config.attributeName as string) || ''
    text = ctx.xmlElement.getAttribute(attributeName) || ''
  }

  const transforms = (action.config.transforms as Array<{
    type: 'lowercase' | 'uppercase' | 'trim' | 'replace' | 'regex'
    replaceFrom?: string
    replaceTo?: string
    regexPattern?: string
    regexReplacement?: string
  }>) || []
  
  const transformed = ctx.applyTransforms(text, transforms)

  const propertyKey = (action.config.propertyKey as string) || 'text'
  graphNode.properties[propertyKey] = transformed

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
}

export function executeCreateTokenNodesAction(action: ActionCanvasNode, ctx: ActionExecutionContext): void {
  if (!ctx.builderNode) return

  // Use existing node if it was already created (e.g., by mapping), otherwise create one from mapping
  let parentGraphNode = ctx.currentGraphNode
  
  if (!parentGraphNode) {
    // Check if a node was already created for this element
    parentGraphNode = ctx.elementToGraph.get(ctx.xmlElement) || null
  }
  
  if (!parentGraphNode) {
    // Create the node using the mapping (createGraphNode) to get proper properties
    const parentNodeId = ctx.nodeIdCounter.value++
    parentGraphNode = ctx.createGraphNode(ctx.builderNode, ctx.xmlElement, parentNodeId)
    ctx.graphNodes.push(parentGraphNode)
    ctx.elementToGraph.set(ctx.xmlElement, parentGraphNode)
    
    // Create relationship to parent if needed
    if (ctx.parentGraphNode) {
      const parentRelType = 'contains'
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
  }
  
  // Update currentGraphNode to the parent node we're using
  ctx.currentGraphNode = parentGraphNode
  
  if (!parentGraphNode) return

  const textSource = (action.config.textSource as 'textContent' | 'attribute') || 'textContent'
  let textContent = ''
  
  if (textSource === 'textContent') {
    textContent = ctx.xmlElement.textContent || ''
  } else {
    // Support both attributeName and textAttributeName for backward compatibility
    const attributeName = (action.config.attributeName as string) || (action.config.textAttributeName as string) || ''
    textContent = ctx.xmlElement.getAttribute(attributeName) || ''
  }

  const transforms = (action.config.transforms as Array<{
    type: 'lowercase' | 'uppercase' | 'trim' | 'replace' | 'regex'
    replaceFrom?: string
    replaceTo?: string
    regexPattern?: string
    regexReplacement?: string
  }>) || []

  const transformedText = ctx.applyTransforms(textContent, transforms)

  const splitBy = action.config.splitBy as string | undefined
  const tokenNodeLabel = (action.config.tokenNodeLabel as string) || 'Character'
  const filterPattern = (action.config.filterPattern as string) || '[a-zA-Z0-9]'
  const relationshipType = (action.config.relationshipType as string) || 'contains'
  const propertyMappings = (action.config.properties as Array<{
    key: string
    source: 'token' | 'attribute' | 'index' | 'static'
    attributeName?: string
    staticValue?: string
  }>) || []

  let tokens: string[] = []
  if (splitBy === undefined || splitBy === null || splitBy === '') {
    // If splitBy is not specified or is empty string, do character-level tokenization
    tokens = Array.from(transformedText)
  } else {
    // Split by the specified delimiter
    tokens = transformedText.split(splitBy)
  }

  const filterRegex = new RegExp(filterPattern)
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

    const tokenNode: GraphJsonNode = {
      id: ctx.nodeIdCounter.value++,
      type: 'node',
      labels: [tokenNodeLabel],
      properties
    }
    ctx.graphNodes.push(tokenNode)

    const relType = ctx.relationships.find(r => r.type === relationshipType)
    if (relType) {
      const rel = ctx.createRelationship(parentGraphNode, tokenNode, relType)
      ctx.graphRels.push(rel)
    } else {
      const rel: GraphJsonRelationship = {
        id: ctx.relIdCounter.value++,
        type: 'relationship',
        label: relationshipType,
        start: parentGraphNode.id,
        end: tokenNode.id,
        properties: {}
      }
      ctx.graphRels.push(rel)
    }
  })
}

export function executeCreateNodeWithAttributesAction(action: ActionCanvasNode, ctx: ActionExecutionContext): void {
  if (!ctx.builderNode) return

  const apiResponseData = ctx.getApiResponseData(action)

  const nodeId = ctx.nodeIdCounter.value++
  const graphNode = ctx.createGraphNode(ctx.builderNode, ctx.xmlElement, nodeId)
  
  const nodeLabel = ctx.evaluateTemplate((action.config.nodeLabel as string) || ctx.builderNode.label, apiResponseData)
  if (nodeLabel) {
    graphNode.labels = [nodeLabel]
  }

  const attributeMappings = (action.config.attributeMappings as Array<{
    attributeName: string
    propertyKey: string
    defaultValue?: string
  }>) || []

  attributeMappings.forEach(mapping => {
    const propertyKey = ctx.evaluateTemplate(mapping.propertyKey, apiResponseData)
    const attrValue = ctx.xmlElement.getAttribute(mapping.attributeName)
    let value = attrValue !== null ? attrValue : (mapping.defaultValue || '')
    
    if (!attrValue && mapping.defaultValue && mapping.defaultValue.includes('{{ $json.')) {
      const evaluated = evaluateExpression(mapping.defaultValue, { json: apiResponseData })
      value = String(evaluated || value)
    }
    
    if (propertyKey && value !== '') {
      graphNode.properties[propertyKey] = value
    }
  })

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
}

