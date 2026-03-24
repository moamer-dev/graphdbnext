import type { ActionCanvasNode } from '../../../../stores/actionCanvasStore'
import type { ActionExecutionContext } from './types'
import type { GraphJsonNode, GraphJsonRelationship } from '../types'
import { evaluateExpression } from '../../../../utils/jsonPathExpression'

export function executeCreateTextNodeAction(action: ActionCanvasNode, ctx: ActionExecutionContext): void {
  if (!ctx.builderNode) return

  const apiResponseData = ctx.getApiResponseData(action)
  
  // Use current node as origin if available
  const originNode = ctx.currentGraphNode || ctx.parentGraphNode
  
  const nodeId = ctx.nodeIdCounter.value++
  const textNode = ctx.createGraphNode(ctx.builderNode, ctx.xmlElement, nodeId, {
    inheritProperties: action.config.inheritProperties as boolean
  })
  
  const nodeLabel = ctx.evaluateTemplate((action.config.nodeLabel as string) || ctx.builderNode.label, apiResponseData)
  if (nodeLabel) {
    textNode.labels = [nodeLabel]
  }

  ctx.graphNodes.push(textNode)

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
  textNode.properties[propertyKey] = transformed

  // Apply extra property mappings
  const propertyMappings = (action.config.propertyMappings as Array<{ key: string; value: string }>) || []
  propertyMappings.forEach(mapping => {
    const key = ctx.evaluateTemplate(mapping.key, apiResponseData)
    const val = ctx.evaluateTemplate(mapping.value, apiResponseData)
    if (key) {
      textNode.properties[key] = val
    }
  })

  if (originNode) {
    const parentRelType = ctx.evaluateTemplate((action.config.parentRelationship as string) || 'contains', apiResponseData)
    const relType = ctx.relationships.find(r => r.type === parentRelType)
    if (relType) {
      const rel = ctx.createRelationship(originNode, textNode, relType)
      ctx.graphRels.push(rel)
    } else {
      const rel: GraphJsonRelationship = {
        id: ctx.relIdCounter.value++,
        type: 'relationship',
        label: parentRelType,
        start: originNode.id,
        end: textNode.id,
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

  /*
   * Start of modified token generation logic
   * Supports two modes:
   * 1. Flat: Parent -> Token1, Parent -> Token2, ... (default)
   * 2. Chained: Parent -> Token1 -> Token2 -> ...
   */
  const structure = (action.config.structure as 'flat' | 'chained') || 'flat'
  const nextRelationshipType = (action.config.nextRelationshipType as string) || 'next'

  let previousTokenNode: GraphJsonNode | null = null

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

    if (structure === 'chained') {
      // Chained structure: 
      // First token connects to parent
      // Subsequent tokens connect to previous token
      if (index === 0) {
        // First token -> Connect to parent
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
      } else if (previousTokenNode) {
        // Subsequent token -> Connect to previous token using 'next' relationship
        // We don't check ctx.relationships for 'next' usually as it might be implicit, 
        // but let's try to find it first for consistency
        const nextRelType = ctx.relationships.find(r => r.type === nextRelationshipType)
        if (nextRelType) {
            const rel = ctx.createRelationship(previousTokenNode, tokenNode, nextRelType)
            ctx.graphRels.push(rel)
        } else {
            const rel: GraphJsonRelationship = {
                id: ctx.relIdCounter.value++,
                type: 'relationship',
                label: nextRelationshipType,
                start: previousTokenNode.id,
                end: tokenNode.id,
                properties: {}
            }
            ctx.graphRels.push(rel)
        }
      }
      previousTokenNode = tokenNode
    } else {
      // Flat structure (default): Connect all to parent
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
    }
  })
}
