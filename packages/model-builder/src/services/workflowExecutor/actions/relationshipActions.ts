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
  const targetNodeLabel = (action.config.targetNodeLabel as string) || ''
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

  if (shouldCreate && ctx.currentGraphNode && ctx.parentGraphNode && targetNodeLabel) {
    const relType = ctx.relationships.find(r => r.type === relationshipType) || ctx.relationships[0]
    if (relType || relationshipType) {
      const finalRelType = relType 
        ? { ...relType, type: relationshipType } 
        : { type: relationshipType, from: '', to: '', id: '', cardinality: '1:N' as const }
        
      const rel = ctx.createRelationship(ctx.currentGraphNode, ctx.parentGraphNode, finalRelType as any)
      ctx.graphRels.push(rel)
    }
  }
}

export function executeUpdateRelationshipAction(action: ActionCanvasNode, ctx: ActionExecutionContext): void {
  const apiResponseData = ctx.getApiResponseData(action)
  const relationshipId = action.config.relationshipId as number | undefined
  const properties = (action.config.properties as Record<string, unknown>) || {}

  if (relationshipId !== undefined) {
    const rel = ctx.graphRels.find(r => r.id === relationshipId)
    if (rel) {
      Object.entries(properties).forEach(([key, value]) => {
        const evaluatedValue = typeof value === 'string' ? ctx.evaluateTemplate(value, apiResponseData) : value
        rel.properties[key] = evaluatedValue
      })
    }
  }
}

export function executeDeleteRelationshipAction(action: ActionCanvasNode, ctx: ActionExecutionContext): void {
  const condition = action.config.condition as Record<string, unknown> | undefined
  const relationshipType = condition?.type as string | undefined
  const propertyMatch = condition?.propertyMatch as Record<string, unknown> | undefined

  if (relationshipType) {
    const toDelete: number[] = []
    ctx.graphRels.forEach((rel, idx) => {
      if (rel.label === relationshipType) {
        if (propertyMatch) {
          let matches = true
          Object.entries(propertyMatch).forEach(([key, value]) => {
            if (rel.properties[key] !== value) {
              matches = false
            }
          })
          if (matches) {
            toDelete.push(idx)
          }
        } else {
          toDelete.push(idx)
        }
      }
    })
    
    for (let i = toDelete.length - 1; i >= 0; i--) {
      ctx.graphRels.splice(toDelete[i], 1)
    }
  }
}

export function executeReverseRelationshipAction(action: ActionCanvasNode, ctx: ActionExecutionContext): void {
  const relationshipId = action.config.relationshipId as number | undefined

  if (relationshipId !== undefined) {
    const rel = ctx.graphRels.find(r => r.id === relationshipId)
    if (rel) {
      const temp = rel.start
      rel.start = rel.end
      rel.end = temp
    }
  }
}

