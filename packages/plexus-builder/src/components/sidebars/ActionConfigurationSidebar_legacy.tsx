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
import { cn } from '../../utils/cn'

interface ActionConfigurationSidebarProps {
  actionNodeId: string | null
  xmlContent?: string
  onClose: () => void
  className?: string
}

export function ActionConfigurationSidebar({
  actionNodeId,
  xmlContent,
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
  } = useActionConfiguration(actionNodeId, xmlContent)

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
        {/* API Tool Connection Banner */}
        {connectedApiTool && (
          <div className="p-3 rounded-md bg-primary/5 border border-primary/20 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-bold uppercase tracking-wider text-primary/60 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                Connected API: {connectedApiTool.label}
              </div>
              {apiResponse && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowApiResponseModal(true)}
                  className="h-6 px-2 text-[10px] border-primary/20 hover:bg-primary/5"
                >
                  View Response
                </Button>
              )}
            </div>
            <div className="text-[11px] text-primary/70 leading-relaxed">
              {apiResponse
                ? 'JSON fields from the API response are available for progressive mapping below.'
                : 'Execute the API tool to dynamically inject response fields into this action.'}
            </div>
          </div>
        )}

        {/* Dynamic Action Configuration */}
        {actionDefinition && actionDefinition.configSchema && actionDefinition.configSchema.length > 0 && (
          <CollapsibleSection title={`${actionDefinition.metadata.label} Configuration`} defaultOpen={true}>
            <div className="pt-2">
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
            </div>
          </CollapsibleSection>
        )}

        {/* Fallback */}
        {!actionDefinition && (
          <div className="p-3 text-[11px] text-primary/60 border border-primary/20 border-dashed rounded-md bg-primary/5 font-medium">
             Type &quot;{actionNode.type}&quot; is awaiting registry registration.
          </div>
        )}

        {/* Action Group Configuration */}
        {(actionNode?.type === 'action:group' || actionNode?.isGroup) && (
          <CollapsibleSection title="Group Settings" defaultOpen={true} icon={Play}>
            <ActionGroupConfiguration
              actionNodeId={actionNodeId}
              actionNode={actionNode}
              groupLabel={groupLabel}
              groupEnabled={groupEnabled}
              onGroupLabelChange={setGroupLabel}
              onGroupEnabledChange={setGroupEnabled}
              onUpdateActionNode={updateActionNode}
            />
          </CollapsibleSection>
        )}


        {/* Test Execution Section */}
        <div className="border-t pt-4 mt-6">
          <CollapsibleSection title="Execution & Testing" defaultOpen={true} icon={Play}>
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-primary/40 tracking-wider">Unit Testing</span>
                <Button
                  size="sm"
                  onClick={handleExecuteTest}
                  disabled={isExecuting}
                  className="h-7 px-3 text-[11px] font-bold"
                >
                  <Play className="h-3 w-3 mr-1.5 fill-current" />
                  {isExecuting ? 'Running...' : 'Execute Test'}
                </Button>
              </div>

              {testResult && (
                <div className={cn(
                  "p-3 rounded-md border transition-all",
                  testResult.success
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                )}>
                  <div className="flex items-center gap-2 mb-2">
                    {testResult.success ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-red-600" />
                    )}
                    <span className={cn(
                      "text-[11px] font-bold tracking-tight",
                      testResult.success ? "text-green-700" : "text-red-700"
                    )}>
                      RESULT: {testResult.output.toUpperCase()}
                    </span>
                  </div>
                  {testResult.details && (
                    <div className="text-[9px] text-primary/60 font-mono bg-white/50 p-2 rounded border border-black/5 mt-2 whitespace-pre-wrap leading-relaxed">
                      {testResult.details}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CollapsibleSection>
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
