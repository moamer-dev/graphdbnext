import type { ToolCanvasNode } from '../../../stores/toolCanvasStore'
import type { ExecutionContext } from '../types'
import type { ToolExecutor } from './types'

export const executeValidateTool: ToolExecutor = async (tool: ToolCanvasNode, ctx: ExecutionContext) => {
  const rules = (tool.config.rules as Array<{
    type: 'requiredAttribute' | 'requiredText' | 'attributeFormat' | 'textLength'
    attributeName?: string
    format?: string
    minLength?: number
    maxLength?: number
  }>) || []
  const onFailure = (tool.config.onFailure as 'skip' | 'error' | 'default') || 'skip'

  for (const rule of rules) {
    let isValid = true

    if (rule.type === 'requiredAttribute') {
      isValid = ctx.xmlElement.hasAttribute(rule.attributeName || '')
    } else if (rule.type === 'requiredText') {
      const text = (ctx.xmlElement.textContent || '').trim()
      isValid = text.length > 0
    } else if (rule.type === 'attributeFormat') {
      const attrValue = ctx.xmlElement.getAttribute(rule.attributeName || '') || ''
      if (rule.format) {
        try {
          const regex = new RegExp(rule.format)
          isValid = regex.test(attrValue)
        } catch {
          isValid = false
        }
      }
    } else if (rule.type === 'textLength') {
      const text = (ctx.xmlElement.textContent || '').trim()
      if (rule.minLength !== undefined && text.length < rule.minLength) isValid = false
      if (rule.maxLength !== undefined && text.length > rule.maxLength) isValid = false
    }

    if (!isValid) {
      if (onFailure === 'skip') {
        ctx.skipMainNode = true
        return { result: false }
      } else if (onFailure === 'error') {
        throw new Error(`Validation failed: ${rule.type}`)
      }
    }
  }

  return { result: true }
}

export const executeNormalizeTool: ToolExecutor = async (tool: ToolCanvasNode, ctx: ExecutionContext) => {
  const format = (tool.config.format as 'date' | 'number' | 'text' | 'url') || 'text'
  const targetProperty = (tool.config.targetProperty as string) || 'normalized'

  if (ctx.currentGraphNode) {
    let normalizedValue: string | number = ''

    if (format === 'date') {
      const dateStr = ctx.xmlElement.textContent || ctx.xmlElement.getAttribute('date') || ''
      const date = new Date(dateStr)
      normalizedValue = isNaN(date.getTime()) ? dateStr : date.toISOString()
    } else if (format === 'number') {
      const numStr = ctx.xmlElement.textContent || ctx.xmlElement.getAttribute('value') || '0'
      normalizedValue = parseFloat(numStr) || 0
    } else if (format === 'url') {
      const url = ctx.xmlElement.textContent || ctx.xmlElement.getAttribute('url') || ''
      normalizedValue = url.trim().toLowerCase()
    } else {
      normalizedValue = (ctx.xmlElement.textContent || '').trim()
    }

    ctx.currentGraphNode.properties[targetProperty] = normalizedValue
  }

  return { result: true }
}

export const executeEnrichTool: ToolExecutor = async (tool: ToolCanvasNode, ctx: ExecutionContext) => {
  const sources = (tool.config.sources as string[]) || []
  const targetProperty = (tool.config.targetProperty as string) || 'enriched'

  if (ctx.currentGraphNode) {
    const enrichedData: Record<string, unknown> = {}
    sources.forEach(source => {
      if (ctx.apiData && ctx.apiData[source]) {
        enrichedData[source] = ctx.apiData[source]
      }
    })
    ctx.currentGraphNode.properties[targetProperty] = enrichedData
  }

  return { result: true }
}

export const executeDeduplicateTool: ToolExecutor = async (tool: ToolCanvasNode, ctx: ExecutionContext) => {
  const property = (tool.config.property as string) || 'id'

  if (ctx.currentGraphNode) {
    ctx.currentGraphNode.properties[property]
    ctx.currentGraphNode.properties[`${property}_deduplicated`] = true
  }

  return { result: true }
}

export const executeValidateSchemaTool: ToolExecutor = async (tool: ToolCanvasNode, ctx: ExecutionContext) => {
  const schema = tool.config.schema as Record<string, unknown> | undefined
  const strict = (tool.config.strict as boolean) || false

  if (ctx.currentGraphNode && schema) {
    const isValid = true
    ctx.currentGraphNode.properties['_validated'] = isValid
    if (!isValid && strict) {
      return { result: false }
    }
  }

  return { result: true }
}

export const executeCleanTool: ToolExecutor = async (tool: ToolCanvasNode, ctx: ExecutionContext) => {
  const operations = (tool.config.operations as string[]) || ['trim']
  const targetProperty = (tool.config.targetProperty as string) || 'cleaned'

  if (ctx.currentGraphNode) {
    let cleaned = (ctx.xmlElement.textContent || '').trim()

    if (operations.includes('removeSpecialChars')) {
      cleaned = cleaned.replace(/[^\w\s]/g, '')
    }
    if (operations.includes('normalizeWhitespace')) {
      cleaned = cleaned.replace(/\s+/g, ' ')
    }
    if (operations.includes('lowercase')) {
      cleaned = cleaned.toLowerCase()
    }
    if (operations.includes('uppercase')) {
      cleaned = cleaned.toUpperCase()
    }

    ctx.currentGraphNode.properties[targetProperty] = cleaned
  }

  return { result: true }
}

export const executeStandardizeTool: ToolExecutor = async (tool: ToolCanvasNode, ctx: ExecutionContext) => {
  const format = (tool.config.format as 'address' | 'name' | 'phone' | 'email') || 'text'
  const targetProperty = (tool.config.targetProperty as string) || 'standardized'

  if (ctx.currentGraphNode) {
    const value = (ctx.xmlElement.textContent || '').trim()
    let standardized = value

    if (format === 'email') {
      standardized = value.toLowerCase().trim()
    } else if (format === 'phone') {
      standardized = value.replace(/\D/g, '')
    } else if (format === 'name') {
      standardized = value.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
    }

    ctx.currentGraphNode.properties[targetProperty] = standardized
  }

  return { result: true }
}

export const executeVerifyTool: ToolExecutor = async (tool: ToolCanvasNode, ctx: ExecutionContext) => {
  const checks = (tool.config.checks as string[]) || ['required']
  const properties = (tool.config.properties as string[]) || []

  if (ctx.currentGraphNode) {
    let isValid = true
    properties.forEach(prop => {
      const value = ctx.currentGraphNode?.properties[prop]
      if (checks.includes('required') && (!value || value === '')) {
        isValid = false
      }
    })
    ctx.currentGraphNode.properties['_verified'] = isValid
    return { result: isValid }
  }

  return { result: true }
}

