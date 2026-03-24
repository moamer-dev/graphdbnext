import type { ToolCanvasNode } from '../../../../stores/toolCanvasStore'
import type { ExecutionContext } from '../types'
import type { ToolExecutor } from './types'

export const executeDelayTool: ToolExecutor = async (tool: ToolCanvasNode, _ctx: ExecutionContext) => {
  const delayMs = (tool.config.delayMs as number) || 1000
  await new Promise(resolve => setTimeout(resolve, delayMs))
  return { result: true }
}
