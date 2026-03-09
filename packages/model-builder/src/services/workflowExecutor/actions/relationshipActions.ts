import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'
import type { ActionExecutionContext } from './types'

export function executeCreateRelationshipAction(action: ActionCanvasNode, ctx: ActionExecutionContext): void {
  const apiResponseData = ctx.getApiResponseData(action)
  
  // 1. Determine Source Node
  const fromNodeAlias = (action.config.fromNode as string) || 'current'
  const sourceNode = fromNodeAlias === 'parent' ? ctx.parentGraphNode : ctx.currentGraphNode
  
  // 2. Determine Target Node
  const toNodeAlias = (action.config.toNode as string) || 'parent'
  const targetNode = toNodeAlias === 'current' ? ctx.currentGraphNode : ctx.parentGraphNode
  
  if (!sourceNode || !targetNode) return

  // 3. Resolve Relationship Type
  const relTypeName = ctx.evaluateTemplate((action.config.relationshipType as string) || 'relatedTo', apiResponseData)
  const relType = ctx.relationships.find(r => r.type === relTypeName) || ctx.relationships[0]
  
  if (relType) {
    // 4. Resolve Properties
    const properties: Record<string, unknown> = {}
    const configProperties = (action.config.properties as Array<{ key: string, value: string }>) || []
    
    configProperties.forEach(prop => {
      if (prop.key) {
        properties[prop.key] = ctx.evaluateTemplate(prop.value, apiResponseData)
      }
    })

    const finalRelType = relType 
      ? { ...relType, type: relTypeName } 
      : { type: relTypeName, from: '', to: '', id: '', cardinality: '1:N' as const }

    const rel = ctx.createRelationship(sourceNode, targetNode, finalRelType as any, properties)
    ctx.graphRels.push(rel)
  }
}

export function executeDeferRelationshipAction(action: ActionCanvasNode, ctx: ActionExecutionContext): void {
  const apiResponseData = ctx.getApiResponseData(action)
  const relationshipTypeTemplate = (action.config.relationshipType as string) || 'relatedTo'
  const relationshipType = ctx.evaluateTemplate(relationshipTypeTemplate, apiResponseData)
  
  const targetTag = ctx.evaluateTemplate((action.config.targetTag as string) || '', apiResponseData)
  const targetAttributeName = ctx.evaluateTemplate((action.config.targetAttributeName as string) || '', apiResponseData)
  const targetAttributeValue = ctx.evaluateTemplate((action.config.targetAttributeValue as string) || '', apiResponseData)
  const searchScope = (action.config.searchScope as 'children' | 'descendants' | 'global') || 'children'
  
  const condition = (action.config.condition as 'always' | 'hasAttribute' | 'hasText') || 'always'

  let shouldCreate = false
  switch (condition) {
    case 'always':
      shouldCreate = true
      break
    case 'hasAttribute':
      shouldCreate = ctx.xmlElement.attributes.length > 0
      break
    case 'hasText':
      shouldCreate = (ctx.xmlElement.textContent || '').trim().length > 0
      break
  }

  if (shouldCreate && ctx.currentGraphNode && targetTag) {
    let candidates: Element[] = []
    
    if (searchScope === 'children') {
      candidates = Array.from(ctx.xmlElement.childNodes)
        .filter(n => n.nodeType === 1 && (n as Element).tagName.toLowerCase() === targetTag.toLowerCase()) as Element[]
    } else if (searchScope === 'descendants') {
      candidates = Array.from(ctx.xmlElement.getElementsByTagName(targetTag))
    } else if (searchScope === 'global') {
      candidates = Array.from(ctx.doc.getElementsByTagName(targetTag))
    }

    const matchedElement = candidates.find(el => {
      if (targetAttributeName) {
        const attrValue = el.getAttribute(targetAttributeName)
        if (attrValue === null) return false
        if (targetAttributeValue && attrValue !== targetAttributeValue) return false
      }
      return true
    })

    if (matchedElement) {
      ctx.deferredRelationships.push({
        from: ctx.currentGraphNode,
        to: null,
        type: relationshipType,
        targetElement: matchedElement,
        properties: {}
      })
    }
  }
}

export function executeUpdateRelationshipAction(action: ActionCanvasNode, ctx: ActionExecutionContext): void {
  const apiResponseData = ctx.getApiResponseData(action)
  ctx.deferredOperations.push({
    type: 'update-relationship',
    contextNode: ctx.currentGraphNode,
    parentNode: ctx.parentGraphNode,
    config: action.config,
    apiData: apiResponseData as Record<string, unknown>
  })
}

export function executeDeleteRelationshipAction(action: ActionCanvasNode, ctx: ActionExecutionContext): void {
  const apiResponseData = ctx.getApiResponseData(action)
  ctx.deferredOperations.push({
    type: 'delete-relationship',
    contextNode: ctx.currentGraphNode,
    parentNode: ctx.parentGraphNode,
    config: action.config,
    apiData: apiResponseData as Record<string, unknown>
  })
}

export function executeReverseRelationshipAction(action: ActionCanvasNode, ctx: ActionExecutionContext): void {
  const apiResponseData = ctx.getApiResponseData(action)
  ctx.deferredOperations.push({
    type: 'reverse-relationship',
    contextNode: ctx.currentGraphNode,
    parentNode: ctx.parentGraphNode,
    config: action.config,
    apiData: apiResponseData as Record<string, unknown>
  })
}

