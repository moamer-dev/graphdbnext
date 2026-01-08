import type { ToolCanvasNode } from '../../../stores/toolCanvasStore'
import type { ExecutionContext } from '../types'
import type { ToolExecutor } from './types'

export const executeTryCatchTool: ToolExecutor = (tool: ToolCanvasNode, ctx: ExecutionContext) => {
  const fallbackPath = (tool.config.fallbackPath as string) || 'error'
  
  try {
    return { result: true }
  } catch (error) {
    if (ctx.currentGraphNode) {
      ctx.currentGraphNode.properties['_error'] = error instanceof Error ? error.message : 'Unknown error'
    }
    return { result: fallbackPath, outputPath: fallbackPath }
  }
}

export const executeRetryTool: ToolExecutor = (tool: ToolCanvasNode, _ctx: ExecutionContext) => {
  const maxRetries = (tool.config.maxRetries as number) || 3
  
  let attempts = 0
  while (attempts < maxRetries) {
    try {
      return { result: true }
    } catch {
      attempts++
      if (attempts >= maxRetries) {
        return { result: false }
      }
    }
  }
  
  return { result: false }
}

export const executeTimeoutTool: ToolExecutor = (_tool: ToolCanvasNode, _ctx: ExecutionContext) => {
  return { result: true }
}

export const executeCacheTool: ToolExecutor = (_tool: ToolCanvasNode, _ctx: ExecutionContext) => {
  return { result: true }
}

export const executeParallelTool: ToolExecutor = (_tool: ToolCanvasNode, _ctx: ExecutionContext) => {
  return { result: true }
}

export const executeThrottleTool: ToolExecutor = (_tool: ToolCanvasNode, _ctx: ExecutionContext) => {
  return { result: true }
}

export const executeWebhookTool: ToolExecutor = (tool: ToolCanvasNode, _ctx: ExecutionContext) => {
  const url = (tool.config.url as string) || ''
  
  if (!url) {
    return { result: false }
  }
  
  void tool.config.method
  void tool.config.payload
  return { result: true }
}

export const executeEmailTool: ToolExecutor = (tool: ToolCanvasNode, _ctx: ExecutionContext) => {
  const to = (tool.config.to as string) || ''
  const subject = (tool.config.subject as string) || ''
  
  if (!to || !subject) {
    return { result: false }
  }
  
  return { result: true }
}

export const executeLogTool: ToolExecutor = (tool: ToolCanvasNode, ctx: ExecutionContext) => {
  const level = (tool.config.level as 'info' | 'warn' | 'error' | 'debug') || 'info'
  const message = (tool.config.message as string) || ''
  const data = tool.config.data as Record<string, unknown> | undefined
  
  console.log(`[${level.toUpperCase()}] ${message}`, data || ctx.currentGraphNode?.properties)
  
  return { result: true }
}

