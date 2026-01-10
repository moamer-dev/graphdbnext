import type { ToolCanvasNode } from '../../../stores/toolCanvasStore'
import type { ExecutionContext } from '../types'
import type { ToolExecutor } from './types'
import { getAncestors } from '../helpers/elementHelpers'

export const executeIfTool: ToolExecutor = async (tool: ToolCanvasNode, ctx: ExecutionContext) => {
  const conditionGroups = (tool.config.conditionGroups as Array<{
    conditions: Array<{
      type: string
      value?: string
      values?: string[]
      internalOperator?: 'AND' | 'OR'
    }>
    internalOperator: 'AND' | 'OR'
    operator: 'AND' | 'OR'
  }>) || []

  if (conditionGroups.length === 0) {
    return { result: true, outputPath: 'true' }
  }

  const element = ctx.xmlElement

  const evaluateCondition = (condition: any): boolean => {
    switch (condition.type) {
      case 'HasChildren': {
        const values = condition.values || (condition.value ? [condition.value] : [])
        const childElements = element.childNodes ? Array.from(element.childNodes).filter((n: Node) => n.nodeType === 1) as Element[] : []
        const childNames = childElements.map(c => {
          const tagName = c.tagName ? c.tagName.toLowerCase() : ''
          const localName = tagName.includes(':') ? tagName.split(':').pop() || tagName : tagName
          return localName
        })
        const operator = condition.internalOperator || 'OR'
        if (operator === 'AND') {
          return values.every((v: string) => childNames.includes(v.toLowerCase().trim()))
        } else {
          return values.some((v: string) => childNames.includes(v.toLowerCase().trim()))
        }
      }
      case 'HasNoChildren': {
        const values = condition.values || (condition.value ? [condition.value] : [])
        const childNames = Array.from(element.children || []).map(c => c.tagName.toLowerCase())
        const operator = condition.internalOperator || 'OR'
        if (operator === 'AND') {
          return values.every((v: string) => !childNames.includes(v.toLowerCase().trim()))
        } else {
          return values.some((v: string) => !childNames.includes(v.toLowerCase().trim()))
        }
      }
      case 'HasAncestor': {
        const values = condition.values || (condition.value ? [condition.value] : [])
        const ancestors = getAncestors(element)
        const operator = condition.internalOperator || 'OR'
        if (operator === 'AND') {
          return values.every((v: string) => ancestors.includes(v.toLowerCase().trim()))
        } else {
          return values.some((v: string) => ancestors.includes(v.toLowerCase().trim()))
        }
      }
      case 'HasParent': {
        const value = condition.value || ''
        const parent = element.parentElement
        if (!parent) return false
        return parent.tagName.toLowerCase() === value.toLowerCase().trim()
      }
      case 'HasAttribute': {
        const attrName = condition.attributeName || condition.value || ''
        return element.hasAttribute(attrName)
      }
      case 'HasTextContent': {
        const text = (element.textContent || '').trim()
        return text.length > 0
      }
      case 'ElementNameEquals': {
        const value = condition.value || ''
        return element.tagName.toLowerCase() === value.toLowerCase().trim()
      }
      case 'AttributeValueEquals': {
        const attrName = condition.attributeName || ''
        const value = condition.value || ''
        return element.getAttribute(attrName) === value
      }
      case 'ChildCount': {
        const min = Number(condition.minCount || 0)
        const max = Number(condition.maxCount || Infinity)
        const count = element.children ? element.children.length : 0
        return count >= min && count <= max
      }
      default:
        return false
    }
  }

  const evaluateGroup = (group: any): boolean => {
    if (group.conditions.length === 0) return true
    const results = group.conditions.map(evaluateCondition)
    const operator = group.internalOperator || 'AND'
    return operator === 'AND' ? results.every((r: boolean) => r) : results.some((r: boolean) => r)
  }

  let finalResult = evaluateGroup(conditionGroups[0])
  for (let i = 1; i < conditionGroups.length; i++) {
    const groupResult = evaluateGroup(conditionGroups[i])
    const operator = conditionGroups[i].operator || 'AND'
    if (operator === 'AND') {
      finalResult = finalResult && groupResult
    } else {
      finalResult = finalResult || groupResult
    }
  }

  return { result: finalResult, outputPath: finalResult ? 'true' : 'false' }
}

export const executeSwitchTool: ToolExecutor = async (tool: ToolCanvasNode, ctx: ExecutionContext) => {
  const switchSource = (tool.config.switchSource as 'attribute' | 'elementName' | 'textContent') || 'attribute'
  const switchAttributeName = (tool.config.switchAttributeName as string) || ''
  const switchCases = (tool.config.switchCases as Array<{ id: string; value: string; label: string }>) || []

  let value = ''
  if (switchSource === 'attribute') {
    value = ctx.xmlElement.getAttribute(switchAttributeName) || ''
  } else if (switchSource === 'elementName') {
    value = ctx.xmlElement.tagName
  } else if (switchSource === 'textContent') {
    value = (ctx.xmlElement.textContent || '').trim()
  }

  // Case-insensitive matching
  const matchedCase = switchCases.find(c => (c.value || '').toLowerCase().trim() === (value || '').toLowerCase().trim())

  let outputPath = 'default'
  if (matchedCase) {
    outputPath = matchedCase.id
  } else {
    // Fallback to default case if it exists
    const defaultCase = switchCases.find(c => c.label.toLowerCase() === 'default')
    if (defaultCase) {
      outputPath = defaultCase.id
    }
  }

  return { result: value, outputPath }
}

export const executeLoopTool: ToolExecutor = async (_tool: ToolCanvasNode, _ctx: ExecutionContext) => {
  return { result: true }
}

