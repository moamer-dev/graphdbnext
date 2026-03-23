'use client'

import { useActionConfiguration } from '../../hooks'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { Play, CheckCircle2, XCircle } from 'lucide-react'
import { ApiResponseModal } from '../dialogs/ApiResponseModal'
import { GraphResultModal } from '../dialogs/GraphResultModal'
import { SchemaForm } from '../shared/SchemaForm'
import { CollapsibleSection } from '../shared/CollapsibleSection'
import { ActionConfigurationHeader } from './ActionConfigurationSidebar/ActionConfigurationHeader'
import { ActionGroupConfiguration } from './ActionConfigurationSidebar/ActionGroupConfiguration'

interface ActionConfigurationSidebarProps {
  actionNodeId: string | null
  onClose: () => void
  className?: string
}

export function ActionConfigurationSidebar({
  actionNodeId,
  onClose,
  className
}: ActionConfigurationSidebarProps) {
  const {
    actionNode,
    actionDefinition,
    config,
    updateConfig,
    actionLabel,
    setActionLabel,
    connectedApiTool,
    apiResponse,
    showApiResponseModal,
    setShowApiResponseModal,
    actionGroups,
    selectedGroupId,
    groupLabel,
    setGroupLabel,
    groupEnabled,
    setGroupEnabled,
    handleMoveToGroup,
    handleExecuteTest,
    testExecution,
    updateActionNode,
    toolNodes,
    actionEdges
  } = useActionConfiguration(actionNodeId)

  const {
    testResult,
    isExecuting,
    graphResult,
    showGraphModal,
    setShowGraphModal
  } = testExecution

  if (!actionNodeId || !actionNode) {
    return null
  }

  return (
    <div className={`${className} flex flex-col h-full border-l bg-background`}>
      <ActionConfigurationHeader
        actionNode={actionNode}
        actionLabel={actionLabel}
        selectedGroupId={selectedGroupId}
        actionGroups={actionGroups}
        toolNodes={toolNodes}
        actionEdges={actionEdges}
        actionNodeId={actionNodeId}
        onActionLabelChange={setActionLabel}
        onUpdateActionNode={updateActionNode}
        onMoveToGroup={handleMoveToGroup}
        onClose={onClose}
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {/* API Tool Connection Banner - Show for all action types */}
        {connectedApiTool && (
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                Connected to API Tool: {connectedApiTool.label}
              </div>
              {apiResponse && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowApiResponseModal(true)}
                  className="h-6 px-2 text-xs"
                >
                  View Response
                </Button>
              )}
            </div>
            <div className="text-[10px] text-blue-600 dark:text-blue-400">
              {apiResponse
                ? 'You can use JSON fields from the API response in the action configuration below.'
                : 'Execute the API tool to see the response data and use its fields in this action.'}
            </div>
          </div>
        )}

        {/* Dynamic Action Configuration */}
        {actionDefinition && actionDefinition.configSchema && actionDefinition.configSchema.length > 0 && (
          <CollapsibleSection title={`${actionDefinition.metadata.label} Configuration`} defaultOpen={true}>
            <SchemaForm
              schema={actionDefinition.configSchema}
              config={config}
              apiResponse={apiResponse}
              onChange={(name, value) => {
                updateConfig({ [name]: value })
                updateActionNode(actionNodeId, {
                  config: { ...actionNode.config, [name]: value }
                })
              }}
            />
          </CollapsibleSection>
        )}

        {/* Fallback for actions not yet in registry but still having config components */}
        {!actionDefinition && (
          <div className="p-4 text-xs text-muted-foreground border rounded bg-muted/20">
            This action type ({actionNode.type}) is not yet registered in the dynamic system.
          </div>
        )}

        {/* Action Group Configuration */}
        {(actionNode?.type === 'action:group' || actionNode?.isGroup) && (
          <ActionGroupConfiguration
            actionNodeId={actionNodeId}
            actionNode={actionNode}
            groupLabel={groupLabel}
            groupEnabled={groupEnabled}
            onGroupLabelChange={setGroupLabel}
            onGroupEnabledChange={setGroupEnabled}
            onUpdateActionNode={updateActionNode}
          />
        )}


        {/* Test Execution Section */}
        <div className="mt-6 pt-4 border-t">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Test Execution</Label>
              <Button
                size="sm"
                onClick={handleExecuteTest}
                disabled={isExecuting}
                className="h-7 px-3 text-xs"
              >
                <Play className="h-3 w-3 mr-1" />
                {isExecuting ? 'Executing...' : 'Execute Test'}
              </Button>
            </div>

            {testResult && (
              <div className={`p-3 rounded border-2 ${testResult.success
                  ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
                  : 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
                }`}>
                <div className="flex items-center gap-2 mb-2">
                  {testResult.success ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  )}
                  <span className={`text-xs font-semibold ${testResult.success
                      ? 'text-green-700 dark:text-green-300'
                      : 'text-red-700 dark:text-red-300'
                    }`}>
                    Result: {testResult.output.toUpperCase()}
                  </span>
                </div>
                {testResult.details && (
                  <div className="text-[10px] text-muted-foreground font-mono bg-background/50 p-2 rounded mt-2 whitespace-pre-wrap">
                    {testResult.details}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* API Response Modal */}
      {apiResponse && (
        <ApiResponseModal
          open={showApiResponseModal}
          onOpenChange={setShowApiResponseModal}
          data={apiResponse}
          title={`API Response from ${connectedApiTool?.label || 'API Tool'}`}
          onFieldSelect={(path) => {
            const expression = `{{ $json.${path} }}`
            navigator.clipboard.writeText(expression)
          }}
        />
      )}

      {/* Graph Result Modal */}
      {graphResult && (
        <GraphResultModal
          open={showGraphModal}
          onOpenChange={setShowGraphModal}
          graph={graphResult}
          title="Test Execution Result"
        />
      )}
    </div>
  )
}
