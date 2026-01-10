import type { ToolCanvasNode } from '../../../stores/toolCanvasStore'
import type { ExecutionContext } from '../types'
import type { ToolExecutor } from './types'

export const executeAggregateTool: ToolExecutor = async (tool: ToolCanvasNode, ctx: ExecutionContext) => {
  if (!ctx.currentGraphNode) return { result: false }

  const operation = (tool.config.operation as 'count' | 'sum' | 'avg' | 'min' | 'max') || 'count'
  const source = (tool.config.source as 'children' | 'attribute' | 'textContent') || 'children'
  const attributeName = (tool.config.attributeName as string) || ''
  const targetProperty = (tool.config.targetProperty as string) || 'aggregate'
  const filterByTag = (tool.config.filterByTag as string[]) || []

  const children = ctx.xmlElement.childNodes ? Array.from(ctx.xmlElement.childNodes).filter((n: Node) => n.nodeType === 1) as Element[] : []
  const values: (string | number)[] = []

  if (source === 'children') {
    children.forEach((child) => {
      const tag = child.tagName ? child.tagName.toLowerCase() : ''
      if (filterByTag.length > 0 && !filterByTag.includes(tag)) return
      if (attributeName) {
        const attrValue = child.getAttribute(attributeName)
        if (attrValue) {
          const num = parseFloat(attrValue)
          values.push(isNaN(num) ? attrValue : num)
        }
      } else {
        const text = (child.textContent || '').trim()
        if (text) {
          const num = parseFloat(text)
          values.push(isNaN(num) ? text : num)
        }
      }
    })
  } else if (source === 'attribute') {
    const attrValue = ctx.xmlElement.getAttribute(attributeName)
    if (attrValue) {
      const num = parseFloat(attrValue)
      values.push(isNaN(num) ? attrValue : num)
    }
  } else {
    const text = (ctx.xmlElement.textContent || '').trim()
    if (text) {
      const num = parseFloat(text)
      values.push(isNaN(num) ? text : num)
    }
  }

  let result: number | string = 0
  const numbers = values.filter(v => typeof v === 'number') as number[]

  switch (operation) {
    case 'count':
      result = values.length
      break
    case 'sum':
      result = numbers.reduce((sum, n) => sum + n, 0)
      break
    case 'avg':
      result = numbers.length > 0 ? numbers.reduce((sum, n) => sum + n, 0) / numbers.length : 0
      break
    case 'min':
      result = numbers.length > 0 ? Math.min(...numbers) : 0
      break
    case 'max':
      result = numbers.length > 0 ? Math.max(...numbers) : 0
      break
  }

  ctx.currentGraphNode.properties[targetProperty] = result
  return { result: true }
}

export const executeSortTool: ToolExecutor = async (tool: ToolCanvasNode, ctx: ExecutionContext) => {
  const sortBy = (tool.config.sortBy as 'attribute' | 'textContent' | 'elementName') || 'attribute'
  const attributeName = (tool.config.attributeName as string) || ''
  const order = (tool.config.order as 'asc' | 'desc') || 'asc'
  const target = (tool.config.target as 'children' | 'self') || 'children'

  if (target === 'children') {
    const children = ctx.xmlElement.childNodes ? Array.from(ctx.xmlElement.childNodes).filter((n: Node) => n.nodeType === 1) as Element[] : []
    const sorted = [...children].sort((a, b) => {
      let aVal = ''
      let bVal = ''

      if (sortBy === 'attribute') {
        aVal = a.getAttribute(attributeName) || ''
        bVal = b.getAttribute(attributeName) || ''
      } else if (sortBy === 'textContent') {
        aVal = (a.textContent || '').trim()
        bVal = (b.textContent || '').trim()
      } else {
        aVal = a.tagName.toLowerCase()
        bVal = b.tagName.toLowerCase()
      }

      const comparison = aVal.localeCompare(bVal)
      return order === 'asc' ? comparison : -comparison
    })

    sorted.forEach((child, index) => {
      ctx.xmlElement.insertBefore(child, ctx.xmlElement.childNodes[index] || null)
    })
  }

  return { result: true }
}

export const executeLimitTool: ToolExecutor = async (tool: ToolCanvasNode, ctx: ExecutionContext) => {
  const limit = (tool.config.limit as number) || 10
  const offset = (tool.config.offset as number) || 0
  const target = (tool.config.target as 'children' | 'self') || 'children'

  if (target === 'children') {
    const children = ctx.xmlElement.childNodes ? Array.from(ctx.xmlElement.childNodes).filter((n: Node) => n.nodeType === 1) as Element[] : []
    children.slice(offset, offset + limit)
  }

  return { result: true }
}

export const executeCollectTool: ToolExecutor = async (tool: ToolCanvasNode, ctx: ExecutionContext) => {
  if (!ctx.currentGraphNode) return { result: false }

  const targetProperty = (tool.config.targetProperty as string) || 'collected'
  const source = (tool.config.source as 'children' | 'attribute' | 'textContent') || 'children'
  const attributeName = (tool.config.attributeName as string) || ''
  const filterByTag = (tool.config.filterByTag as string[]) || []
  const asArray = (tool.config.asArray as boolean) ?? true

  const children = ctx.xmlElement.childNodes ? Array.from(ctx.xmlElement.childNodes).filter((n: Node) => n.nodeType === 1) as Element[] : []
  const collected: string[] = []

  if (source === 'children') {
    children.forEach((child) => {
      const tag = child.tagName ? child.tagName.toLowerCase() : ''
      if (filterByTag.length > 0 && !filterByTag.includes(tag)) return
      const text = (child.textContent || '').trim()
      if (text) collected.push(text)
    })
  } else if (source === 'attribute') {
    const attrValue = ctx.xmlElement.getAttribute(attributeName)
    if (attrValue) collected.push(attrValue)
  } else {
    const text = (ctx.xmlElement.textContent || '').trim()
    if (text) collected.push(text)
  }

  ctx.currentGraphNode.properties[targetProperty] = asArray ? collected : (collected.length > 0 ? collected[0] : '')
  return { result: true }
}

export const executeGroupTool: ToolExecutor = async (tool: ToolCanvasNode, ctx: ExecutionContext) => {
  const groupBy = (tool.config.groupBy as 'attribute' | 'elementName' | 'textContent' | 'computed') || 'attribute'
  const groupKey = (tool.config.groupKey as string) || ''
  const computedExpression = (tool.config.computedExpression as string) || ''

  let groupValue = ''
  if (groupBy === 'attribute') {
    groupValue = ctx.xmlElement.getAttribute(groupKey) || ''
  } else if (groupBy === 'elementName') {
    groupValue = ctx.xmlElement.tagName.toLowerCase()
  } else if (groupBy === 'textContent') {
    groupValue = (ctx.xmlElement.textContent || '').trim()
  } else if (groupBy === 'computed') {
    groupValue = computedExpression.replace(/\$\{(\w+)\}/g, (_, attr) => {
      return ctx.xmlElement.getAttribute(attr) || ''
    })
  }

  return { result: true, outputPath: groupValue || 'default' }
}

export const executeLookupTool: ToolExecutor = async (_tool: ToolCanvasNode, _ctx: ExecutionContext) => {
  return { result: true }
}

export const executeTraverseTool: ToolExecutor = async (_tool: ToolCanvasNode, _ctx: ExecutionContext) => {
  return { result: true }
}

export const executeDelayTool: ToolExecutor = async (_tool: ToolCanvasNode, _ctx: ExecutionContext) => {
  return { result: true }
}

