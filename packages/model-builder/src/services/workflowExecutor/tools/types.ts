import type { ToolCanvasNode } from '../../../stores/toolCanvasStore'
import type { ExecutionContext } from '../types'

export type ToolExecutionResult =
  | { result: boolean }
  | { result: boolean; outputPath: string }
  | { result: string; outputPath: string }

export type ToolExecutor = (tool: ToolCanvasNode, ctx: ExecutionContext) => Promise<ToolExecutionResult>

