import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'
import type { ActionExecutionContext } from './types'
import type { GraphJsonNode } from '../types'

export function executeUpdateNodeAction(action: ActionCanvasNode, ctx: ActionExecutionContext): void {
  if (!ctx.currentGraphNode) return

  const apiResponseData = ctx.getApiResponseData(action)
  const properties = (action.config.properties as Record<string, unknown>) || {}
  const labels = (action.config.labels as string[]) || undefined

  Object.entries(properties).forEach(([key, value]) => {
    const evaluatedValue = typeof value === 'string' ? ctx.evaluateTemplate(value, apiResponseData) : value
    ctx.currentGraphNode!.properties[key] = evaluatedValue
  })

  if (labels && Array.isArray(labels) && labels.length > 0) {
    ctx.currentGraphNode.labels = labels.map((label: string) => ctx.evaluateTemplate(label, apiResponseData))
  }
}

export function executeDeleteNodeAction(action: ActionCanvasNode, ctx: ActionExecutionContext): void {
  if (!ctx.currentGraphNode) return

  const condition = action.config.condition as Record<string, unknown> | undefined
  const propertyMatch = condition?.propertyMatch as Record<string, unknown> | undefined

  if (propertyMatch) {
    let shouldDelete = true
    Object.entries(propertyMatch).forEach(([key, value]) => {
      if (ctx.currentGraphNode!.properties[key] !== value) {
        shouldDelete = false
      }
    })
    
    if (shouldDelete) {
      const nodeIndex = ctx.graphNodes.findIndex(n => n.id === ctx.currentGraphNode!.id)
      if (nodeIndex !== -1) {
        ctx.graphNodes.splice(nodeIndex, 1)
      }
      
      const relsToRemove: number[] = []
      ctx.graphRels.forEach((rel, idx) => {
        if (rel.start === ctx.currentGraphNode!.id || rel.end === ctx.currentGraphNode!.id) {
          relsToRemove.push(idx)
        }
      })
      for (let i = relsToRemove.length - 1; i >= 0; i--) {
        ctx.graphRels.splice(relsToRemove[i], 1)
      }
    }
  }
}

export function executeCloneNodeAction(action: ActionCanvasNode, ctx: ActionExecutionContext): void {
  if (!ctx.currentGraphNode) return

  const apiResponseData = ctx.getApiResponseData(action)
  const modifications = (action.config.modifications as Record<string, unknown>) || {}
  const newLabels = (action.config.newLabels as string[]) || undefined

  const clonedNode: GraphJsonNode = {
    id: ctx.nodeIdCounter.value++,
    type: 'node',
    labels: (newLabels && Array.isArray(newLabels)) ? newLabels.map((l: string) => ctx.evaluateTemplate(l, apiResponseData)) : [...ctx.currentGraphNode.labels],
    properties: { ...ctx.currentGraphNode.properties }
  }

  Object.entries(modifications).forEach(([key, value]) => {
    const evaluatedValue = typeof value === 'string' ? ctx.evaluateTemplate(value, apiResponseData) : value
    clonedNode.properties[key] = evaluatedValue
  })

  ctx.graphNodes.push(clonedNode)
}

export function executeMergeNodesAction(action: ActionCanvasNode, ctx: ActionExecutionContext): void {
  if (!ctx.currentGraphNode) return

  const targetNodeIds = (action.config.targetNodeIds as number[]) || []
  const mergeStrategy = (action.config.mergeStrategy as 'union' | 'preferSource' | 'preferTarget') || 'union'

  targetNodeIds.forEach(targetId => {
    const targetNode = ctx.graphNodes.find(n => n.id === targetId)
    if (targetNode && ctx.currentGraphNode) {
      if (mergeStrategy === 'union') {
        ctx.currentGraphNode.labels = [...new Set([...ctx.currentGraphNode.labels, ...targetNode.labels])]
        ctx.currentGraphNode.properties = { ...ctx.currentGraphNode.properties, ...targetNode.properties }
      } else if (mergeStrategy === 'preferSource') {
        ctx.currentGraphNode.properties = { ...targetNode.properties, ...ctx.currentGraphNode.properties }
      } else {
        ctx.currentGraphNode.properties = { ...ctx.currentGraphNode.properties, ...targetNode.properties }
      }

      ctx.graphRels.forEach(rel => {
        if (rel.start === targetId) rel.start = ctx.currentGraphNode!.id
        if (rel.end === targetId) rel.end = ctx.currentGraphNode!.id
      })

      const targetIndex = ctx.graphNodes.findIndex(n => n.id === targetId)
      if (targetIndex !== -1) {
        ctx.graphNodes.splice(targetIndex, 1)
      }
    }
  })
}

export function executeValidateNodeAction(action: ActionCanvasNode, ctx: ActionExecutionContext): void {
  if (!ctx.currentGraphNode) return

  const schema = action.config.schema as Record<string, unknown> | undefined
  const requiredProperties = (action.config.requiredProperties as string[]) || []

  let isValid = true
  const errors: string[] = []

  requiredProperties.forEach(prop => {
    if (!(prop in ctx.currentGraphNode!.properties)) {
      isValid = false
      errors.push(`Missing required property: ${prop}`)
    }
  })

  if (schema) {
    // Additional schema validation would go here
  }

  ctx.currentGraphNode.properties['_validated'] = isValid
  if (!isValid) {
    ctx.currentGraphNode.properties['_validationErrors'] = errors
  }
}

export function executeValidateRelationshipAction(action: ActionCanvasNode, ctx: ActionExecutionContext): void {
  const relationshipId = action.config.relationshipId as number | undefined
  const constraints = action.config.constraints as Record<string, unknown> | undefined

  if (relationshipId !== undefined) {
    const rel = ctx.graphRels.find(r => r.id === relationshipId)
    if (rel && constraints) {
      const isValid = true
      rel.properties['_validated'] = isValid
    }
  }
}

export function executeReportErrorAction(action: ActionCanvasNode, ctx: ActionExecutionContext): void {
  const apiResponseData = ctx.getApiResponseData(action)
  const errorMessage = ctx.evaluateTemplate((action.config.errorMessage as string) || 'Validation error', apiResponseData)
  const errorCode = (action.config.errorCode as string) || 'ERROR'
  const severity = (action.config.severity as 'error' | 'warning' | 'info') || 'error'

  if (ctx.currentGraphNode) {
    ctx.currentGraphNode.properties['_error'] = {
      message: errorMessage,
      code: errorCode,
      severity
    }
  }
}

export function executeAddMetadataAction(action: ActionCanvasNode, ctx: ActionExecutionContext): void {
  if (!ctx.currentGraphNode) return

  const apiResponseData = ctx.getApiResponseData(action)
  const metadata = (action.config.metadata as Record<string, unknown>) || {}

  Object.entries(metadata).forEach(([key, value]) => {
    const evaluatedValue = typeof value === 'string' ? ctx.evaluateTemplate(value, apiResponseData) : value
    ctx.currentGraphNode!.properties[`_meta_${key}`] = evaluatedValue
  })
}

export function executeTagNodeAction(action: ActionCanvasNode, ctx: ActionExecutionContext): void {
  if (!ctx.currentGraphNode) return

  const apiResponseData = ctx.getApiResponseData(action)
  const tags = (action.config.tags as string[]) || []

  const existingTags = (ctx.currentGraphNode.properties['_tags'] as string[]) || []
  const newTags = tags.map(tag => ctx.evaluateTemplate(tag, apiResponseData))
  ctx.currentGraphNode.properties['_tags'] = [...new Set([...existingTags, ...newTags])]
}

export function executeSetTimestampAction(action: ActionCanvasNode, ctx: ActionExecutionContext): void {
  if (!ctx.currentGraphNode) return

  const timestampType = (action.config.timestampType as 'created' | 'modified' | 'both') || 'both'
  const now = new Date().toISOString()

  if (timestampType === 'created' || timestampType === 'both') {
    if (!ctx.currentGraphNode.properties['_createdAt']) {
      ctx.currentGraphNode.properties['_createdAt'] = now
    }
  }
  if (timestampType === 'modified' || timestampType === 'both') {
    ctx.currentGraphNode.properties['_modifiedAt'] = now
  }
}

