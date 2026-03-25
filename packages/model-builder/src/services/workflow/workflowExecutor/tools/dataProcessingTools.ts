import type { ToolCanvasNode } from '../../../../stores/toolCanvasStore'
import type { ToolExecutor } from './types'

export const executeDelayTool: ToolExecutor = async (tool: ToolCanvasNode) => {
  const delayMs = (tool.config.delayMs as number) || 1000
  await new Promise(resolve => setTimeout(resolve, delayMs))
  return { result: true }
}
