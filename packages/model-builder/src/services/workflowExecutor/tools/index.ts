import type { ToolCanvasNode } from '../../../stores/toolCanvasStore'
import type { ExecutionContext } from '../types'
import type { ToolExecutor } from './types'

import { executeIfTool, executeSwitchTool } from './controlFlowTools'
import { executeDelayTool } from './dataProcessingTools'
import { executeFetchApiTool, executeHttpTool } from './apiTools'
import { executeWebhookTool } from './flowControlTools'

const toolRegistry: Record<string, ToolExecutor> = {
  'tool:if': executeIfTool,
  'tool:switch': executeSwitchTool,
  'tool:delay': executeDelayTool,
  'tool:fetch-api': executeFetchApiTool,
  'tool:http': executeHttpTool,
  'tool:webhook': executeWebhookTool,
  // Authenticated Research APIs
  'tool:fetch-orcid': executeFetchApiTool,
  'tool:fetch-geonames': executeFetchApiTool,
  'tool:fetch-europeana': executeFetchApiTool,
  'tool:fetch-getty': executeFetchApiTool
}

export async function executeTool(
  tool: ToolCanvasNode,
  ctx: ExecutionContext
): Promise<{ result: boolean | string; outputPath?: string }> {
  const executor = toolRegistry[tool.type]
  if (executor) {
    return executor(tool, ctx)
  }
  return { result: true }
}

export { toolRegistry }

