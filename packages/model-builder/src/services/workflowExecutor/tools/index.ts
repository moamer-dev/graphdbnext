import type { ToolCanvasNode } from '../../../stores/toolCanvasStore'
import type { ExecutionContext } from '../types'
import type { ToolExecutor } from './types'

import { executeIfTool, executeSwitchTool, executeLoopTool } from './controlFlowTools'
import { executeFilterTool, executeTransformTool, executeMapTool, executeReduceTool, executeMergeTool, executeSplitTool } from './dataTransformationTools'
import { executeAggregateTool, executeSortTool, executeLimitTool, executeCollectTool, executeGroupTool, executeLookupTool, executeTraverseTool, executeDelayTool } from './dataProcessingTools'
import { executePartitionTool, executeDistinctTool, executeWindowTool, executeJoinTool, executeUnionTool, executeIntersectTool, executeDiffTool, executeExistsTool, executeRangeTool, executeBatchTool } from './setOperationTools'
import { executeFetchApiTool, executeAuthenticatedApiTool, executeHttpTool } from './apiTools'
import { executeValidateTool, executeNormalizeTool, executeEnrichTool, executeDeduplicateTool, executeValidateSchemaTool, executeCleanTool, executeStandardizeTool, executeVerifyTool } from './dataQualityTools'
import { executeTryCatchTool, executeRetryTool, executeTimeoutTool, executeCacheTool, executeParallelTool, executeThrottleTool, executeWebhookTool, executeEmailTool, executeLogTool } from './flowControlTools'

const toolRegistry: Record<string, ToolExecutor> = {
  'tool:if': executeIfTool,
  'tool:switch': executeSwitchTool,
  'tool:loop': executeLoopTool,
  'tool:filter': executeFilterTool,
  'tool:transform': executeTransformTool,
  'tool:map': executeMapTool,
  'tool:reduce': executeReduceTool,
  'tool:merge': executeMergeTool,
  'tool:split': executeSplitTool,
  'tool:aggregate': executeAggregateTool,
  'tool:sort': executeSortTool,
  'tool:limit': executeLimitTool,
  'tool:collect': executeCollectTool,
  'tool:group': executeGroupTool,
  'tool:lookup': executeLookupTool,
  'tool:traverse': executeTraverseTool,
  'tool:delay': executeDelayTool,
  'tool:partition': executePartitionTool,
  'tool:distinct': executeDistinctTool,
  'tool:window': executeWindowTool,
  'tool:join': executeJoinTool,
  'tool:union': executeUnionTool,
  'tool:intersect': executeIntersectTool,
  'tool:diff': executeDiffTool,
  'tool:exists': executeExistsTool,
  'tool:range': executeRangeTool,
  'tool:batch': executeBatchTool,
  'tool:fetch-api': executeFetchApiTool,
  'tool:fetch-orcid': executeAuthenticatedApiTool,
  'tool:fetch-geonames': executeAuthenticatedApiTool,
  'tool:fetch-europeana': executeAuthenticatedApiTool,
  'tool:fetch-getty': executeAuthenticatedApiTool,
  'tool:http': executeHttpTool,
  'tool:validate': executeValidateTool,
  'tool:normalize': executeNormalizeTool,
  'tool:enrich': executeEnrichTool,
  'tool:deduplicate': executeDeduplicateTool,
  'tool:validate-schema': executeValidateSchemaTool,
  'tool:clean': executeCleanTool,
  'tool:standardize': executeStandardizeTool,
  'tool:verify': executeVerifyTool,
  'tool:try-catch': executeTryCatchTool,
  'tool:retry': executeRetryTool,
  'tool:timeout': executeTimeoutTool,
  'tool:cache': executeCacheTool,
  'tool:parallel': executeParallelTool,
  'tool:throttle': executeThrottleTool,
  'tool:webhook': executeWebhookTool,
  'tool:email': executeEmailTool,
  'tool:log': executeLogTool
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

