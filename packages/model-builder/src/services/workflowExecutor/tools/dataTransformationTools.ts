import type { ToolCanvasNode } from '../../../stores/toolCanvasStore'
import type { ExecutionContext } from '../types'
import type { ToolExecutor } from './types'

export const executeFilterTool: ToolExecutor = async (tool: ToolCanvasNode, ctx: ExecutionContext) => {
  const elementNames = (tool.config.elementNames as string[]) || []
  const currentTag = ctx.xmlElement.tagName.toLowerCase()

  if (elementNames.includes(currentTag)) {
    return { result: false }
  }

  return { result: true }
}

export const executeTransformTool: ToolExecutor = async (tool: ToolCanvasNode, ctx: ExecutionContext) => {
  const mappings = (tool.config.mappings as Array<{ source: string; target: string; defaultValue?: string }>) || []

  if (ctx.currentGraphNode) {
    mappings.forEach(mapping => {
      const sourceValue = ctx.xmlElement.getAttribute(mapping.source) || mapping.defaultValue || ''
      if (mapping.target && sourceValue && ctx.currentGraphNode) {
        ctx.currentGraphNode.properties[mapping.target] = sourceValue
      }
    })
  }

  return { result: true }
}

export const executeMapTool: ToolExecutor = async (tool: ToolCanvasNode, ctx: ExecutionContext) => {
  if (!ctx.currentGraphNode) return { result: false }

  const mappings = (tool.config.mappings as Array<{
    source: 'attribute' | 'textContent' | 'elementName'
    sourceName?: string
    target: 'attribute' | 'property'
    targetName: string
    transform?: 'lowercase' | 'uppercase' | 'trim'
  }>) || []

  mappings.forEach(mapping => {
    let value = ''

    if (mapping.source === 'attribute') {
      value = ctx.xmlElement.getAttribute(mapping.sourceName || '') || ''
    } else if (mapping.source === 'textContent') {
      value = (ctx.xmlElement.textContent || '').trim()
    } else {
      value = ctx.xmlElement.tagName.toLowerCase()
    }

    if (mapping.transform === 'lowercase') {
      value = value.toLowerCase()
    } else if (mapping.transform === 'uppercase') {
      value = value.toUpperCase()
    } else if (mapping.transform === 'trim') {
      value = value.trim()
    }

    if (mapping.target === 'property') {
      ctx.currentGraphNode!.properties[mapping.targetName] = value
    }
  })

  return { result: true }
}

export const executeReduceTool: ToolExecutor = async (tool: ToolCanvasNode, ctx: ExecutionContext) => {
  if (!ctx.currentGraphNode) return { result: false }

  const operation = (tool.config.operation as 'concat' | 'sum' | 'join') || 'concat'
  const source = (tool.config.source as 'children' | 'attribute' | 'textContent') || 'children'
  const attributeName = (tool.config.attributeName as string) || ''
  const separator = (tool.config.separator as string) || ' '
  const targetProperty = (tool.config.targetProperty as string) || 'reduced'

  const children = ctx.xmlElement.childNodes ? Array.from(ctx.xmlElement.childNodes).filter((n: Node) => n.nodeType === 1) as Element[] : []
  const values: string[] = []

  if (source === 'children') {
    children.forEach((child) => {
      if (attributeName) {
        const attrValue = child.getAttribute(attributeName) || ''
        if (attrValue) values.push(attrValue)
      } else {
        const text = (child.textContent || '').trim()
        if (text) values.push(text)
      }
    })
  } else if (source === 'attribute') {
    const attrValue = ctx.xmlElement.getAttribute(attributeName) || ''
    if (attrValue) values.push(attrValue)
  } else {
    const text = (ctx.xmlElement.textContent || '').trim()
    if (text) values.push(text)
  }

  let result: string | number = ''
  if (operation === 'concat') {
    result = values.join('')
  } else if (operation === 'join') {
    result = values.join(separator)
  } else if (operation === 'sum') {
    const numbers = values.map(v => parseFloat(v)).filter(n => !isNaN(n))
    result = numbers.reduce((sum, n) => sum + n, 0)
  }

  ctx.currentGraphNode.properties[targetProperty] = result
  return { result: true }
}

export const executeMergeTool: ToolExecutor = async (_tool: ToolCanvasNode, _ctx: ExecutionContext) => {
  return { result: true }
}

export const executeSplitTool: ToolExecutor = async (tool: ToolCanvasNode, ctx: ExecutionContext) => {
  const splitBy = (tool.config.splitBy as 'delimiter' | 'condition' | 'size') || 'delimiter'
  const delimiter = (tool.config.delimiter as string) || ' '

  if (splitBy === 'delimiter') {
    const text = (ctx.xmlElement.textContent || '').trim()
    text.split(delimiter)
  } else if (splitBy === 'condition') {
    ctx.xmlElement.childNodes
  } else if (splitBy === 'size') {
    ctx.xmlElement.childNodes
  }

  return { result: true }
}

