import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'
import type { ActionExecutionContext } from './types'

export function executeSetPropertyAction(action: ActionCanvasNode, ctx: ActionExecutionContext): void {
  const node = ctx.currentGraphNode || ctx.parentGraphNode
  if (!node) return

  const apiResponseData = ctx.getApiResponseData(action)
  const key = ctx.evaluateTemplate((action.config.propertyKey as string) || '', apiResponseData)
  let value = ctx.evaluateTemplate((action.config.propertyValue as string) || '', apiResponseData)
  
  if (key) {
    if (value === '' && node.properties.transformedText !== undefined) {
      value = String(node.properties.transformedText)
    } else if (value === '' && node.properties.textContent !== undefined) {
      value = String(node.properties.textContent)
    }
    node.properties[key] = value
  }
}





export function executeCopyPropertyAction(action: ActionCanvasNode, ctx: ActionExecutionContext): void {
  const node = ctx.currentGraphNode || ctx.parentGraphNode
  if (!node) return

  const apiResponseData = ctx.getApiResponseData(action)
  const sourceProperty = ctx.evaluateTemplate((action.config.sourceProperty as string) || '', apiResponseData)
  const targetProperty = ctx.evaluateTemplate((action.config.targetProperty as string) || '', apiResponseData)
  
  if (!sourceProperty || !targetProperty) return

  const sourceNodeIdRaw = action.config.sourceNodeId
  let sourceValue: unknown = undefined

  if (sourceNodeIdRaw !== undefined && sourceNodeIdRaw !== '') {
    const id = typeof sourceNodeIdRaw === 'string' ? parseInt(sourceNodeIdRaw) : (sourceNodeIdRaw as number)
    if (!isNaN(id)) {
      const sourceNode = ctx.graphNodes.find(n => n.id === id)
      if (sourceNode) {
        sourceValue = sourceNode.properties[sourceProperty]
      }
    }
  } else {
    // If no ID provided, try current node properties first, then parent node
    if (ctx.currentGraphNode && ctx.currentGraphNode.properties[sourceProperty] !== undefined) {
      sourceValue = ctx.currentGraphNode.properties[sourceProperty]
    } else if (ctx.parentGraphNode && ctx.parentGraphNode.properties[sourceProperty] !== undefined) {
      sourceValue = ctx.parentGraphNode.properties[sourceProperty]
    }
  }

  if (sourceValue !== undefined) {
    node.properties[targetProperty] = sourceValue
  }
}

export function executeMergePropertiesAction(action: ActionCanvasNode, ctx: ActionExecutionContext): void {
  const node = ctx.currentGraphNode || ctx.parentGraphNode
  if (!node) return

  const apiResponseData = ctx.getApiResponseData(action)
  const sourceProperties = (action.config.sourceProperties as string[]) || []
  const targetProperty = ctx.evaluateTemplate((action.config.targetProperty as string) || 'merged', apiResponseData)
  const mergeStrategy = (action.config.mergeStrategy as 'concat' | 'object' | 'array') || 'object'

  const values: unknown[] = []
  const availableProps: string[] = []
  
  sourceProperties.forEach(prop => {
    const value = node.properties[prop]
    if (value !== undefined) {
      values.push(value)
      availableProps.push(prop)
    }
  })

  if (mergeStrategy === 'concat') {
    node.properties[targetProperty] = values.join(' ')
  } else if (mergeStrategy === 'array') {
    node.properties[targetProperty] = values
  } else {
    const merged: Record<string, unknown> = {}
    availableProps.forEach((prop, idx) => {
      merged[prop] = values[idx]
    })
    node.properties[targetProperty] = merged
  }
}

export function executeSplitPropertyAction(action: ActionCanvasNode, ctx: ActionExecutionContext): void {
  const node = ctx.currentGraphNode || ctx.parentGraphNode
  if (!node) return

  const apiResponseData = ctx.getApiResponseData(action)
  const sourceProperty = ctx.evaluateTemplate((action.config.sourceProperty as string) || '', apiResponseData)
  const separator = ctx.evaluateTemplate((action.config.separator as string) || ' ', apiResponseData)
  const targetProperties = (action.config.targetProperties as string[]) || []

  const sourceValue = String(node.properties[sourceProperty] || '')
  if (!sourceValue) return

  const parts = sourceValue.split(separator)

  targetProperties.forEach((targetProp, idx) => {
    if (parts[idx] !== undefined) {
      node.properties[targetProp] = parts[idx].trim()
    }
  })
}

export function executeFormatPropertyAction(action: ActionCanvasNode, ctx: ActionExecutionContext): void {
  const node = ctx.currentGraphNode || ctx.parentGraphNode
  if (!node) return

  const apiResponseData = ctx.getApiResponseData(action)
  const propertyKey = ctx.evaluateTemplate((action.config.propertyKey as string) || '', apiResponseData)
  const format = (action.config.format as 'date' | 'number' | 'currency' | 'percentage' | 'text') || 'text'
  const formatString = ctx.evaluateTemplate((action.config.formatString as string) || '', apiResponseData)

  const value = node.properties[propertyKey]
  if (value === undefined) return

  let formatted: string = String(value)
  
  if (format === 'date') {
    const date = new Date(String(value))
    if (!isNaN(date.getTime())) {
      // Very basic formatting if string provided, otherwise ISO
      formatted = formatString ? date.toLocaleDateString(formatString) : date.toISOString()
    }
  } else if (format === 'number') {
    const num = parseFloat(String(value))
    if (!isNaN(num)) {
      formatted = formatString ? num.toLocaleString(formatString) : String(num)
    }
  } else if (format === 'currency') {
    const num = parseFloat(String(value))
    if (!isNaN(num)) {
      formatted = num.toLocaleString('en-US', { style: 'currency', currency: formatString || 'USD' })
    }
  } else if (format === 'percentage') {
    const num = parseFloat(String(value))
    if (!isNaN(num)) {
      formatted = `${(num * 100).toFixed(2)}%`
    }
  }

  node.properties[propertyKey] = formatted
}



