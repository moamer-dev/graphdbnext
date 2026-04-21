'use client'

import { useCallback } from 'react'
import { ToolConfigurationHeader } from './ToolConfigurationSidebar/ToolConfigurationHeader'
import { ToolConditionBuilder } from './ToolConfigurationSidebar/ToolConditionBuilder'
import { ToolSwitchConfiguration } from './ToolConfigurationSidebar/ToolSwitchConfiguration'
import { ToolTestExecution } from './ToolConfigurationSidebar/ToolTestExecution'
import { ToolWebhookConfiguration } from './ToolConfigurationSidebar/ToolWebhookConfiguration'
import { useRealXmlSample } from '../../hooks/xml/useRealXmlSample'
import { SchemaForm } from '../shared/SchemaForm'
import { CollapsibleSection } from '../shared/CollapsibleSection'
import { useToolConfiguration } from '../../hooks/configuration/useToolConfiguration'
import { useToolTestExecution } from '../../hooks/configuration/useToolTestExecution'
import { useToolConditionBuilder } from '../../hooks/configuration/useToolConditionBuilder'

export type ConditionType =
  | 'HasChildren'
  | 'HasNoChildren'
  | 'HasAncestor'
  | 'HasParent'
  | 'HasDescendant'
  | 'HasAttribute'
  | 'HasTextContent'
  | 'ElementNameEquals'
  | 'AttributeValueEquals'
  | 'ChildCount'

export interface Condition {
  id?: string
  type: ConditionType
  value?: string
  values?: string[]
  internalOperator?: 'AND' | 'OR'
  min?: number
  max?: number
  attributeName?: string
}

export interface ConditionGroup {
  id: string
  conditions: Condition[]
  internalOperator?: 'AND' | 'OR'
  operator?: 'AND' | 'OR'
}

export interface SwitchCase {
  id: string
  value: string
  label: string
}

export type SwitchSource = 'attribute' | 'elementName' | 'textContent'

interface ToolConfigurationSidebarProps {
  toolNodeId: string | null
  xmlContent?: string
  onClose: () => void
  className?: string
}

export function ToolConfigurationSidebar({
  toolNodeId,
  xmlContent,
  onClose,
  className
}: ToolConfigurationSidebarProps) {
  const {
    toolNode,
    toolDefinition,
    config,
    toolLabel,
    attachedNode,
    fetchApiConfig,
    authenticatedApiConfig,
    httpConfig,
    selectedInstanceIndex,
    selectedFile,
    setToolLabel,
    handleUpdateConfig,
    setInstanceIndex,
    updateToolNode,
    getCredentialsByType,
    getCredential
  } = useToolConfiguration(toolNodeId)

  const {
    testResult,
    isExecuting,
    testIdInput,
    setTestIdInput,
    executedApiResponse,
    apiResponseModalOpen,
    setApiResponseModalOpen,
    responseHistory,
    setResponseHistory,
    handleExecuteConditionTest,
    handleExecuteFetchApiTest: rawHandleExecuteFetchApiTest,
    handleExecuteAuthenticatedApiTest: rawHandleExecuteAuthenticatedApiTest,
    handleExecuteHttpTest: rawHandleExecuteHttpTest,
    createTestElement: rawCreateTestElement
  } = useToolTestExecution(toolNodeId)

  const conditionBuilder = useToolConditionBuilder(handleUpdateConfig)

  // XML Sampling logic
  const attachedElementName = attachedNode?.label || attachedNode?.type || ''
  const elementToSample = attachedElementName.startsWith('xml:') ? attachedElementName.slice(4) : attachedElementName

  const {
    instances,
    selectedInstanceData,
    loading: loadingRealData
  } = useRealXmlSample(selectedFile as any as File | null, elementToSample, selectedInstanceIndex, xmlContent)

  // Use real instance data if available for testing
  const createTestElement = useCallback(() => {
    if (selectedInstanceData) return selectedInstanceData
    return rawCreateTestElement(attachedNode)
  }, [selectedInstanceData, rawCreateTestElement, attachedNode])

  const handleExecuteTest = useCallback(() => {
    if (!toolNode) return
    
    if (toolNode.type === 'tool:fetch-api') {
      rawHandleExecuteFetchApiTest(fetchApiConfig, createTestElement)
    } else if (toolNode.type.startsWith('tool:fetch-')) {
      rawHandleExecuteAuthenticatedApiTest(authenticatedApiConfig, attachedNode, selectedInstanceData)
    } else if (toolNode.type === 'tool:http') {
      rawHandleExecuteHttpTest(httpConfig)
    } else {
      handleExecuteConditionTest(createTestElement)
    }
  }, [toolNode, fetchApiConfig, authenticatedApiConfig, httpConfig, attachedNode, selectedInstanceData, createTestElement, rawHandleExecuteFetchApiTest, rawHandleExecuteAuthenticatedApiTest, rawHandleExecuteHttpTest, handleExecuteConditionTest])

  if (!toolNodeId || !toolNode) {
    return (
      <div className="flex items-center justify-center h-full p-8 text-muted-foreground">
        Select a tool to configure
      </div>
    )
  }

  const isApiTool = toolNode.type === 'tool:fetch-api' || 
                   toolNode.type.startsWith('tool:fetch-') || 
                   toolNode.type === 'tool:http'
                   
  const showTestIdInput = toolNode.type === 'tool:fetch-api' || 
                         toolNode.type.startsWith('tool:fetch-')

  const conditionGroupsLength = (config.conditionGroups as any[])?.length || 0
  const switchCasesLength = (config.switchCases as any[])?.length || 0

  return (
    <div className={`flex flex-col h-full bg-background border-l ${className || ''}`}>
      <ToolConfigurationHeader
        toolLabel={toolLabel}
        toolNode={toolNode}
        attachedNode={attachedNode}
        onToolLabelChange={setToolLabel}
        onUpdateToolNode={updateToolNode}
        onClose={onClose}
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {/* Schema Form for basic tool properties */}
        {toolDefinition && (
          <CollapsibleSection title="General Configuration" defaultOpen>
            <SchemaForm
              schema={toolDefinition.configSchema}
              config={config}
              onChange={(name, value) => handleUpdateConfig({ [name]: value })}
              getCredentialsByType={getCredentialsByType as any}
              getCredential={getCredential as any}
            />
          </CollapsibleSection>
        )}

        {/* Specialized Tool Configurations */}
        {toolNode.type === 'tool:if' && (
          <ToolConditionBuilder 
            conditionBuilder={conditionBuilder}
            xmlParent={selectedInstanceData?.parent?.tagName}
            xmlAncestors={selectedInstanceData?.ancestors}
            xmlChildren={selectedInstanceData?.children.map(c => ({ name: c.tagName, count: 1 }))}
            xmlDescendants={selectedInstanceData?.descendants}
          />
        )}

        {toolNode.type === 'tool:switch' && (
          <ToolSwitchConfiguration 
            toolNodeId={toolNodeId}
            toolNode={toolNode}
            attachedNode={attachedNode}
            switchSource={(config.switchSource as SwitchSource) || 'attribute'}
            switchAttributeName={(config.switchAttributeName as string) || ''}
            switchCases={(config.switchCases as SwitchCase[]) || []}
            switchCaseInputs={(config.switchCaseInputs as Record<string, string>) || {}}
            onSwitchSourceChange={(source) => handleUpdateConfig({ switchSource: source })}
            onSwitchAttributeNameChange={(name) => handleUpdateConfig({ switchAttributeName: name })}
            onSwitchCasesChange={(cases) => handleUpdateConfig({ switchCases: cases })}
            onSwitchCaseInputsChange={(inputs) => handleUpdateConfig({ switchCaseInputs: inputs })}
            onUpdateToolNode={updateToolNode}
          />
        )}

        {toolNode.type === 'tool:webhook' && (
          <ToolWebhookConfiguration
            toolNodeId={toolNodeId}
            toolNode={toolNode}
            onUpdateToolNode={updateToolNode}
          />
        )}

        {/* Test Execution Section */}
        {(toolNode.type === 'tool:if' || 
          toolNode.type === 'tool:switch' ||
          isApiTool) && (
          <ToolTestExecution
            toolNode={toolNode}
            toolNodeType={toolNode.type}
            testResult={testResult}
            isExecuting={isExecuting}
            testIdInput={testIdInput}
            onTestIdInputChange={setTestIdInput}
            onExecuteTest={handleExecuteTest}
            executedApiResponse={executedApiResponse}
            apiResponseModalOpen={apiResponseModalOpen}
            onApiResponseModalOpenChange={setApiResponseModalOpen}
            responseHistory={responseHistory}
            onResponseHistoryChange={setResponseHistory}
            showApiResponse={isApiTool}
            showTestIdInput={showTestIdInput}
            conditionGroupsLength={conditionGroupsLength}
            switchCasesLength={switchCasesLength}
            attachedNode={attachedNode}
            realInstances={instances}
            selectedInstanceIndex={selectedInstanceIndex}
            onInstanceSelect={setInstanceIndex}
            loadingRealData={loadingRealData}
            onUpdateToolNode={updateToolNode}
          />
        )}
      </div>
    </div>
  )
}
