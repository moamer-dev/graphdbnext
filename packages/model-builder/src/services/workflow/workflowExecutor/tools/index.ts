import type { ToolCanvasNode } from '../../../../stores/toolCanvasStore'
import type { ExecutionContext } from '../types'
import { workflowRegistry } from '../../../../registry'

export async function executeTool(
  tool: ToolCanvasNode,
  ctx: ExecutionContext
): Promise<{ result: boolean | string; outputPath?: string }> {
  const definition = workflowRegistry.getTool(tool.type)
  const executor = definition?.executor
  
  if (executor) {
    return executor(tool, ctx)
  }
  return { result: true }
}

