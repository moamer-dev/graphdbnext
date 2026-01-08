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

export function executeExtractTextAction(action: ActionCanvasNode, ctx: ActionExecutionContext): void {
  const apiResponseData = ctx.getApiResponseData(action)
  const extractionMode = (action.config.extractionMode as 'text' | 'tail' | 'xmlContent') || 'text'
  let text = ''

  if (extractionMode === 'text') {
    text = ctx.xmlElement.textContent || ''
  } else if (extractionMode === 'tail') {
    text = ctx.xmlElement.textContent || ''
  } else if (extractionMode === 'xmlContent') {
    text = ctx.xmlElement.outerHTML || ''
  }

  if (ctx.currentGraphNode && text) {
    const propertyKey = ctx.evaluateTemplate((action.config.propertyKey as string) || 'textContent', apiResponseData)
    ctx.currentGraphNode.properties[propertyKey] = text
  }
}

export function executeExtractPropertyAction(action: ActionCanvasNode, ctx: ActionExecutionContext): void {
  if (!ctx.currentGraphNode) return

  const sourceProperty = (action.config.sourceProperty as string) || ''
  const targetProperty = (action.config.targetProperty as string) || sourceProperty

  if (sourceProperty && ctx.currentGraphNode.properties[sourceProperty]) {
    ctx.currentGraphNode.properties[targetProperty] = ctx.currentGraphNode.properties[sourceProperty]
  }
}

export function executeCopyPropertyAction(action: ActionCanvasNode, ctx: ActionExecutionContext): void {
  if (!ctx.currentGraphNode) return

  const apiResponseData = ctx.getApiResponseData(action)
  const sourceProperty = ctx.evaluateTemplate((action.config.sourceProperty as string) || '', apiResponseData)
  const targetProperty = ctx.evaluateTemplate((action.config.targetProperty as string) || '', apiResponseData)
  const sourceNodeId = action.config.sourceNodeId as number | undefined

  if (sourceNodeId) {
    const sourceNode = ctx.graphNodes.find(n => n.id === sourceNodeId)
    if (sourceNode && sourceNode.properties[sourceProperty]) {
      ctx.currentGraphNode.properties[targetProperty] = sourceNode.properties[sourceProperty]
    }
  } else if (ctx.parentGraphNode) {
    if (ctx.parentGraphNode.properties[sourceProperty]) {
      ctx.currentGraphNode.properties[targetProperty] = ctx.parentGraphNode.properties[sourceProperty]
    }
  }
}

export function executeMergePropertiesAction(action: ActionCanvasNode, ctx: ActionExecutionContext): void {
  if (!ctx.currentGraphNode) return

  const apiResponseData = ctx.getApiResponseData(action)
  const sourceProperties = (action.config.sourceProperties as string[]) || []
  const targetProperty = ctx.evaluateTemplate((action.config.targetProperty as string) || 'merged', apiResponseData)
  const mergeStrategy = (action.config.mergeStrategy as 'concat' | 'object' | 'array') || 'object'

  const values: unknown[] = []
  sourceProperties.forEach(prop => {
    const value = ctx.currentGraphNode?.properties[prop]
    if (value !== undefined) {
      values.push(value)
    }
  })

  if (mergeStrategy === 'concat') {
    ctx.currentGraphNode.properties[targetProperty] = values.join(' ')
  } else if (mergeStrategy === 'array') {
    ctx.currentGraphNode.properties[targetProperty] = values
  } else {
    const merged: Record<string, unknown> = {}
    sourceProperties.forEach((prop, idx) => {
      if (values[idx] !== undefined) {
        merged[prop] = values[idx]
      }
    })
    ctx.currentGraphNode.properties[targetProperty] = merged
  }
}

export function executeSplitPropertyAction(action: ActionCanvasNode, ctx: ActionExecutionContext): void {
  if (!ctx.currentGraphNode) return

  const apiResponseData = ctx.getApiResponseData(action)
  const sourceProperty = ctx.evaluateTemplate((action.config.sourceProperty as string) || '', apiResponseData)
  const separator = ctx.evaluateTemplate((action.config.separator as string) || ' ', apiResponseData)
  const targetProperties = (action.config.targetProperties as string[]) || []

  const sourceValue = String(ctx.currentGraphNode.properties[sourceProperty] || '')
  const parts = sourceValue.split(separator)

  targetProperties.forEach((targetProp, idx) => {
    if (parts[idx] !== undefined && ctx.currentGraphNode) {
      ctx.currentGraphNode.properties[targetProp] = parts[idx].trim()
    }
  })
}

export function executeFormatPropertyAction(action: ActionCanvasNode, ctx: ActionExecutionContext): void {
  if (!ctx.currentGraphNode) return

  const apiResponseData = ctx.getApiResponseData(action)
  const propertyKey = ctx.evaluateTemplate((action.config.propertyKey as string) || '', apiResponseData)
  const format = (action.config.format as 'date' | 'number' | 'currency' | 'percentage') || 'text'
  const formatString = (action.config.formatString as string) || ''

  const value = ctx.currentGraphNode.properties[propertyKey]
  if (value === undefined) return

  let formatted: string = String(value)
  
  if (format === 'date') {
    const date = new Date(String(value))
    if (!isNaN(date.getTime())) {
      formatted = formatString ? date.toLocaleDateString('en-US', { format: formatString } as Intl.DateTimeFormatOptions) : date.toISOString()
    }
  } else if (format === 'number') {
    const num = parseFloat(String(value))
    if (!isNaN(num)) {
      formatted = formatString ? num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : String(num)
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

  ctx.currentGraphNode.properties[propertyKey] = formatted
}

export function executeTransformTextAction(action: ActionCanvasNode, ctx: ActionExecutionContext): void {
  if (!ctx.currentGraphNode) return

  const updateInPlace = (action.config.updateInPlace as boolean) ?? false
  const targetProperty = (action.config.targetProperty as string) || ''
  
  let text = ctx.xmlElement.textContent || ''
  
  if (updateInPlace && targetProperty && ctx.currentGraphNode.properties[targetProperty]) {
    text = String(ctx.currentGraphNode.properties[targetProperty])
  } else if (ctx.currentGraphNode.properties.textContent) {
    text = String(ctx.currentGraphNode.properties.textContent)
  }

  const transforms = (action.config.transforms as Array<{
    type: 'lowercase' | 'uppercase' | 'trim' | 'replace' | 'regex'
    replaceFrom?: string
    replaceTo?: string
    regexPattern?: string
    regexReplacement?: string
  }>) || []

  const transformed = ctx.applyTransforms(text, transforms)

  const finalProperty = targetProperty || 'transformedText'
  ctx.currentGraphNode.properties[finalProperty] = transformed
}

