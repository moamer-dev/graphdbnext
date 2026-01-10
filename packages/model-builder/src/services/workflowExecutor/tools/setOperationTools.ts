import type { ToolCanvasNode } from '../../../stores/toolCanvasStore'
import type { ExecutionContext } from '../types'
import type { ToolExecutor } from './types'

export const executePartitionTool: ToolExecutor = async (tool: ToolCanvasNode, ctx: ExecutionContext) => {
  const partitionBy = (tool.config.partitionBy as 'size' | 'condition') || 'size'
  const size = (tool.config.size as number) || 10
  const condition = (tool.config.condition as 'hasAttribute' | 'hasText') || 'hasAttribute'
  const conditionValue = (tool.config.conditionValue as string) || ''

  const children = ctx.xmlElement.childNodes ? Array.from(ctx.xmlElement.childNodes).filter((n: Node) => n.nodeType === 1) as Element[] : []

  if (partitionBy === 'size') {
    for (let i = 0; i < children.length; i += size) {
      children.slice(i, i + size)
    }
  } else {
    const partitions: Element[][] = []
    let currentPartition: Element[] = []

    children.forEach((child) => {
      let matches = false
      if (condition === 'hasAttribute') {
        matches = child.hasAttribute(conditionValue)
      } else if (condition === 'hasText') {
        matches = (child.textContent || '').trim().length > 0
      }

      if (matches && currentPartition.length > 0) {
        partitions.push([...currentPartition])
        currentPartition = []
      }
      currentPartition.push(child)
    })

    if (currentPartition.length > 0) {
      partitions.push(currentPartition)
    }
  }

  return { result: true }
}

export const executeDistinctTool: ToolExecutor = async (tool: ToolCanvasNode, ctx: ExecutionContext) => {
  const distinctBy = (tool.config.distinctBy as 'attribute' | 'textContent' | 'elementName') || 'attribute'
  const attributeName = (tool.config.attributeName as string) || ''
  const target = (tool.config.target as 'children' | 'self') || 'children'

  if (target === 'children') {
    const children = ctx.xmlElement.childNodes ? Array.from(ctx.xmlElement.childNodes).filter((n: Node) => n.nodeType === 1) as Element[] : []
    const seen = new Set<string>()
    const distinct: Element[] = []

    children.forEach((child) => {
      let key = ''
      if (distinctBy === 'attribute') {
        key = child.getAttribute(attributeName) || ''
      } else if (distinctBy === 'textContent') {
        key = (child.textContent || '').trim()
      } else {
        key = child.tagName.toLowerCase()
      }

      if (!seen.has(key) && key) {
        seen.add(key)
        distinct.push(child)
      }
    })
  }

  return { result: true }
}

export const executeWindowTool: ToolExecutor = async (tool: ToolCanvasNode, ctx: ExecutionContext) => {
  if (!ctx.currentGraphNode) return { result: false }

  const windowSize = (tool.config.windowSize as number) || 3
  const step = (tool.config.step as number) || 1
  const operation = (tool.config.operation as 'collect' | 'aggregate') || 'collect'
  const targetProperty = (tool.config.targetProperty as string) || 'window'

  const children = ctx.xmlElement.childNodes ? Array.from(ctx.xmlElement.childNodes).filter((n: Node) => n.nodeType === 1) as Element[] : []
  const windows: unknown[] = []

  for (let i = 0; i <= children.length - windowSize; i += step) {
    const window = children.slice(i, i + windowSize)
    if (operation === 'collect') {
      windows.push(window.map(c => (c.textContent || '').trim()))
    } else {
      const texts = window.map(c => (c.textContent || '').trim()).filter(Boolean)
      windows.push(texts.join(' '))
    }
  }

  ctx.currentGraphNode.properties[targetProperty] = windows
  return { result: true }
}

export const executeJoinTool: ToolExecutor = async (tool: ToolCanvasNode, ctx: ExecutionContext) => {
  if (!ctx.currentGraphNode) return { result: false }

  const joinWith = (tool.config.joinWith as 'siblings' | 'children' | 'parent') || 'siblings'
  const joinBy = (tool.config.joinBy as 'textContent' | 'attribute') || 'textContent'
  const attributeName = (tool.config.attributeName as string) || ''
  const separator = (tool.config.separator as string) || ' '

  let elements: Element[] = []
  if (joinWith === 'siblings') {
    const parent = ctx.xmlElement.parentElement
    if (parent) {
      elements = Array.from(parent.childNodes).filter((n: Node) => n.nodeType === 1) as Element[]
    }
  } else if (joinWith === 'children') {
    elements = ctx.xmlElement.childNodes ? Array.from(ctx.xmlElement.childNodes).filter((n: Node) => n.nodeType === 1) as Element[] : []
  } else {
    const parent = ctx.xmlElement.parentElement
    if (parent) elements = [parent]
  }

  const values = elements.map(el => {
    if (joinBy === 'attribute') {
      return el.getAttribute(attributeName) || ''
    } else {
      return (el.textContent || '').trim()
    }
  }).filter(Boolean)

  ctx.currentGraphNode.properties['joined'] = values.join(separator)
  return { result: true }
}

export const executeUnionTool: ToolExecutor = async (tool: ToolCanvasNode, ctx: ExecutionContext) => {
  if (!ctx.currentGraphNode) return { result: false }

  const sources = (tool.config.sources as Array<{
    type: 'children' | 'attribute' | 'xpath'
    value: string
  }>) || []
  const targetProperty = (tool.config.targetProperty as string) || 'union'

  const union = new Set<string>()

  sources.forEach(source => {
    if (source.type === 'children') {
      const children = ctx.xmlElement.childNodes ? Array.from(ctx.xmlElement.childNodes).filter((n: Node) => n.nodeType === 1) as Element[] : []
      children.forEach(child => {
        const text = (child.textContent || '').trim()
        if (text) union.add(text)
      })
    } else if (source.type === 'attribute') {
      const attrValue = ctx.xmlElement.getAttribute(source.value) || ''
      if (attrValue) union.add(attrValue)
    }
  })

  ctx.currentGraphNode.properties[targetProperty] = Array.from(union)
  return { result: true }
}

export const executeIntersectTool: ToolExecutor = async (tool: ToolCanvasNode, ctx: ExecutionContext) => {
  if (!ctx.currentGraphNode) return { result: false }

  const sources = (tool.config.sources as Array<{
    type: 'children' | 'attribute' | 'xpath'
    value: string
  }>) || []
  const matchBy = (tool.config.matchBy as 'elementName' | 'attribute' | 'textContent') || 'elementName'
  const attributeName = (tool.config.attributeName as string) || ''
  const targetProperty = (tool.config.targetProperty as string) || 'intersect'

  if (sources.length < 2) return { result: false }

  const sets: Set<string>[] = sources.map(() => new Set())

  sources.forEach((source, index) => {
    if (source.type === 'children') {
      const children = ctx.xmlElement.childNodes ? Array.from(ctx.xmlElement.childNodes).filter((n: Node) => n.nodeType === 1) as Element[] : []
      children.forEach(child => {
        let key = ''
        if (matchBy === 'elementName') {
          key = child.tagName.toLowerCase()
        } else if (matchBy === 'attribute') {
          key = child.getAttribute(attributeName) || ''
        } else {
          key = (child.textContent || '').trim()
        }
        if (key) sets[index].add(key)
      })
    }
  })

  let intersection = sets[0]
  for (let i = 1; i < sets.length; i++) {
    intersection = new Set([...intersection].filter(x => sets[i].has(x)))
  }

  ctx.currentGraphNode.properties[targetProperty] = Array.from(intersection)
  return { result: true }
}

export const executeDiffTool: ToolExecutor = async (tool: ToolCanvasNode, ctx: ExecutionContext) => {
  if (!ctx.currentGraphNode) return { result: false }

  const sourceA = (tool.config.sourceA as { type: 'children' | 'attribute', value: string }) || { type: 'children' as const, value: '' }
  const sourceB = (tool.config.sourceB as { type: 'children' | 'attribute', value: string }) || { type: 'children' as const, value: '' }
  const matchBy = (tool.config.matchBy as 'elementName' | 'attribute' | 'textContent') || 'elementName'
  const attributeName = (tool.config.attributeName as string) || ''
  const targetProperty = (tool.config.targetProperty as string) || 'diff'

  const setA = new Set<string>()
  const setB = new Set<string>()

  if (sourceA.type === 'children') {
    const children = ctx.xmlElement.childNodes ? Array.from(ctx.xmlElement.childNodes).filter((n: Node) => n.nodeType === 1) as Element[] : []
    children.forEach(child => {
      let key = ''
      if (matchBy === 'elementName') {
        key = child.tagName.toLowerCase()
      } else if (matchBy === 'attribute') {
        key = child.getAttribute(attributeName) || ''
      } else {
        key = (child.textContent || '').trim()
      }
      if (key) setA.add(key)
    })
  }

  if (sourceB.type === 'children') {
    const children = ctx.xmlElement.childNodes ? Array.from(ctx.xmlElement.childNodes).filter((n: Node) => n.nodeType === 1) as Element[] : []
    children.forEach(child => {
      let key = ''
      if (matchBy === 'elementName') {
        key = child.tagName.toLowerCase()
      } else if (matchBy === 'attribute') {
        key = child.getAttribute(attributeName) || ''
      } else {
        key = (child.textContent || '').trim()
      }
      if (key) setB.add(key)
    })
  }

  const diff = new Set([...setA].filter(x => !setB.has(x)))
  ctx.currentGraphNode.properties[targetProperty] = Array.from(diff)
  return { result: true }
}

export const executeExistsTool: ToolExecutor = async (tool: ToolCanvasNode, ctx: ExecutionContext) => {
  if (!ctx.currentGraphNode) return { result: false }

  const checkType = (tool.config.checkType as 'element' | 'attribute' | 'text') || 'element'
  const elementName = (tool.config.elementName as string) || ''
  const attributeName = (tool.config.attributeName as string) || ''
  const targetProperty = (tool.config.targetProperty as string) || 'exists'

  let exists = false

  if (checkType === 'element') {
    const children = ctx.xmlElement.childNodes ? Array.from(ctx.xmlElement.childNodes).filter((n: Node) => n.nodeType === 1) as Element[] : []
    exists = children.some(c => c.tagName.toLowerCase() === elementName.toLowerCase())
  } else if (checkType === 'attribute') {
    exists = ctx.xmlElement.hasAttribute(attributeName)
  } else {
    const text = (ctx.xmlElement.textContent || '').trim()
    exists = text.length > 0
  }

  ctx.currentGraphNode.properties[targetProperty] = exists
  return { result: true }
}

export const executeRangeTool: ToolExecutor = async (tool: ToolCanvasNode, ctx: ExecutionContext) => {
  const start = (tool.config.start as number) || 0
  const end = (tool.config.end as number) || 10
  const step = (tool.config.step as number) || 1
  const target = (tool.config.target as 'children' | 'self') || 'children'

  if (target === 'children') {
    const children = ctx.xmlElement.childNodes ? Array.from(ctx.xmlElement.childNodes).filter((n: Node) => n.nodeType === 1) as Element[] : []
    const range: Element[] = []

    for (let i = start; i < Math.min(end, children.length); i += step) {
      range.push(children[i])
    }
  }

  return { result: true }
}

export const executeBatchTool: ToolExecutor = async (tool: ToolCanvasNode, ctx: ExecutionContext) => {
  const batchSize = (tool.config.batchSize as number) || 10
  const target = (tool.config.target as 'children' | 'self') || 'children'

  if (target === 'children') {
    const children = ctx.xmlElement.childNodes ? Array.from(ctx.xmlElement.childNodes).filter((n: Node) => n.nodeType === 1) as Element[] : []
    const batches: Element[][] = []

    for (let i = 0; i < children.length; i += batchSize) {
      batches.push(children.slice(i, i + batchSize))
    }

    void batches
  }

  return { result: true }
}

