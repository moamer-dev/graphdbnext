'use client'

import { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback, useMemo } from 'react'
import { ModelBuilderCanvas } from './canvas/ModelBuilderCanvas'
import { useModelBuilderStore } from '../stores/modelBuilderStore'
import { useWorkflowStore } from '../stores/workflowStore'
import { useSchemaImport, useSchemaExport } from '../hooks'
import { downloadFile, exportToJson, exportToMarkdown } from '../utils/exportUtils'
import { generateNodeTemplate, generateRelationshipTemplate } from '../services/parseService'
import { useAIFeature } from '../ai/config'
import { useToolCanvasStore } from '../stores/toolCanvasStore'
import { useActionCanvasStore } from '../stores/actionCanvasStore'
import { useTabPersistence } from '../hooks/useTabPersistence'
import { useModelBuilderUI } from '../hooks/useModelBuilderUI'
import { toast } from '../utils/toast'
import { ModelBuilderHeader } from './ModelBuilderHeader'
import { ModelBuilderSidebar } from './ModelBuilderSidebar'
import { ModelBuilderDialogs } from './ModelBuilderDialogs'
import { useWorkflowLifecycle } from '../hooks/useWorkflowLifecycle'
import { workflowService } from '../services/workflowService'
import { importWorkflowConfig, WorkflowConfigExport } from '../utils/workflowConfigExport'
import { convertSchemaJsonToBuilder } from '../utils/schemaConverter'
import { parseMarkdownSchema, convertMarkdownSchemaToBuilder } from '../utils/markdownParser'
import { cn } from '../utils/cn'
import { Button } from './ui/button'
import { PanelLeftOpen, X } from 'lucide-react'
import { ResizablePanel } from './ui/resizable-panel'
import { XmlCodePreview } from './editor/XmlCodePreview'
import { ExecutionProgress } from './workflow/ExecutionProgress'
import { RelationshipEditor } from './editor/RelationshipEditor'
import { ToolConfigurationSidebar } from './sidebars/ToolConfigurationSidebar'
import { ActionConfigurationSidebar } from './sidebars/ActionConfigurationSidebar'
import { NodeEditor } from './editor/NodeEditor'
import { AIAgentsPanel } from './ai/AIAgentsPanel'

export interface WorkflowPersistence {
  modelId?: string
  onSaveWorkflow?: (workflow: { name: string; description?: string; config: unknown }) => Promise<{ id: string }>
  onUpdateWorkflow?: (id: string, workflow: { name?: string; description?: string; config?: unknown }) => Promise<void>
  onLoadWorkflows?: (modelId: string) => Promise<Array<{ id: string; name: string; description?: string; version: string; createdAt: string; updatedAt: string }>>
  onLoadWorkflow?: (id: string) => Promise<{ id: string; name: string; description?: string; config: unknown }>
}

export interface ModelBuilderProps {
  className?: string
  workflowPersistence?: WorkflowPersistence
  initialWorkflow?: { id: string; name: string; description?: string; config: unknown }
  currentWorkflowName?: string
  availableWorkflows?: Array<{ id: string; name: string; description?: string; version: string; createdAt: string; updatedAt: string }>
  onWorkflowChange?: (workflowId: string) => void
  onPushToDB?: (graph: Array<Record<string, unknown>>) => Promise<void>
  onSave?: () => void
}

export interface ModelBuilderRef {
  exportData: () => { schemaJson: any; schemaMd: string }
  triggerSave: () => void
  loadData: (data: any) => void
  clear: () => void
  clearWorkflow: () => void
  getWorkflowConfig: () => WorkflowConfigExport | null
  hasChanges: () => boolean
}

const ModelBuilderContent = forwardRef<ModelBuilderRef, ModelBuilderProps>((props, ref) => {
  const {
    className,
    workflowPersistence,
    initialWorkflow,
    currentWorkflowName,
    availableWorkflows = [],
    onWorkflowChange,
    onPushToDB,
    onSave
  } = props

  const ui = useModelBuilderUI()
  const {
    importDialogOpen, setImportDialogOpen,
    importFile, setImportFile,
    workflowConfigDialogOpen, setWorkflowConfigDialogOpen,
    workflowConfigFile, setWorkflowConfigFile,
    sidebarOpen, setSidebarOpen,
    nodesSidebarOpen, setNodesSidebarOpen,
    runDialogOpen, setRunDialogOpen,
    credentialsDialogOpen, setCredentialsDialogOpen,
    xmlFile, setXmlFile,
    running, setRunning,
    executionProgress, setExecutionProgress,
    graphPreview, setGraphPreview,
    focusNodeFnRef, focusRelationshipFnRef
  } = ui

  const nodes = Array.isArray(useModelBuilderStore((state) => state.nodes)) ? useModelBuilderStore((state) => state.nodes) : []
  const relationships = Array.isArray(useModelBuilderStore((state) => state.relationships)) ? useModelBuilderStore((state) => state.relationships) : []
  const metadata = useModelBuilderStore((state) => state.metadata)

  const updateMetadata = useModelBuilderStore((state) => state.updateMetadata)
  const rootNodeId = useModelBuilderStore((state) => state.rootNodeId)
  const setRootNodeId = useModelBuilderStore((state) => state.setRootNodeId)
  const selectedOntologyId = useModelBuilderStore((state) => state.selectedOntologyId)
  const setSelectedOntologyId = useModelBuilderStore((state) => state.setSelectedOntologyId)
  const isSemanticEnabled = useModelBuilderStore((state) => state.isSemanticEnabled)
  const setIsSemanticEnabled = useModelBuilderStore((state) => state.setIsSemanticEnabled)
  const selectedRelationship = useModelBuilderStore((state) => state.selectedRelationship)
  const selectedNode = useModelBuilderStore((state) => state.selectedNode)

  const toolNodes = useToolCanvasStore((state) => state.nodes)
  const toolEdges = useToolCanvasStore((state) => state.edges)
  const actionNodes = useActionCanvasStore((state) => state.nodes)
  const actionEdges = useActionCanvasStore((state) => state.edges)
  const selectedToolNodeId = useToolCanvasStore((state) => state.selectedNodeId)
  const selectedActionNodeId = useActionCanvasStore((state) => state.selectedNodeId)

  const { xmlContent, handleLoadWorkflowFromConfig, handleRunWorkflow, handleUploadXml } = useWorkflowLifecycle({
    initialWorkflow, nodes, relationships, onWorkflowChange, ui
  })

  // Refactor state that wasn't in useModelBuilderUI
  const [leftTab, setLeftTab] = useTabPersistence<'nodes' | 'relationships' | 'tools' | 'actions'>(
    'model-builder-left-tab', 'nodes', ['nodes', 'relationships', 'tools', 'actions']
  )
  const [sidebarWidth, setSidebarWidth] = useState(260)
  const [agentsPanelOpen, setAgentsPanelOpen] = useState(false)
  const [agentsPanelWidth, setAgentsPanelWidth] = useState(400)
  const [xmlPanelOpen, setXmlPanelOpen] = useState(false)
  const [xmlPanelWidth, setXmlPanelWidth] = useState(600)
  const [xmlWrapWord, setXmlWrapWord] = useState(false)
  const [showToolbar, setShowToolbar] = useState(true)
  const [clearWorkflowDialogOpen, setClearWorkflowDialogOpen] = useState(false)
  const [importingWorkflowConfig, setImportingWorkflowConfig] = useState(false)
  const [workflowConfigImportError, setWorkflowConfigImportError] = useState<string | null>(null)
  const [schemaDesignDialogOpen, setSchemaDesignDialogOpen] = useState(false)
  const [schemaDesignMode, setSchemaDesignMode] = useState<'suggest' | 'optimize' | 'validate'>('suggest')
  const [workflowGenerationDialogOpen, setWorkflowGenerationDialogOpen] = useState(false)

  const isSchemaDesignEnabled = useAIFeature('schemaDesignAgent')
  const isWorkflowGenerationEnabled = useAIFeature('workflowGenerationAgent')

  // Change detection
  const initialStateRef = useRef<any>(null)
  useEffect(() => {
    if (!initialStateRef.current) {
      initialStateRef.current = {
        nodes: JSON.parse(JSON.stringify(nodes)),
        relationships: JSON.parse(JSON.stringify(relationships)),
        toolNodes: JSON.parse(JSON.stringify(toolNodes)),
        toolEdges: JSON.parse(JSON.stringify(toolEdges)),
        actionNodes: JSON.parse(JSON.stringify(actionNodes)),
        actionEdges: JSON.parse(JSON.stringify(actionEdges))
      }
    }
  }, [nodes, relationships, toolNodes, toolEdges, actionNodes, actionEdges])

  const { importing, importError, importSchema } = useSchemaImport()
  const { exportToJsonFile, exportToMarkdownFile, exportToRdfFile, exportToTtlFile, hasContent } = useSchemaExport()

  const handleImportWorkflowConfig = async () => {
    if (!workflowConfigFile) return
    setImportingWorkflowConfig(true)
    setWorkflowConfigImportError(null)

    try {
      const text = await workflowConfigFile.text()
      const config = importWorkflowConfig(text, nodes)
      const result = workflowService.applyWorkflowConfig(config, nodes)
      
      if (result.relationshipsAdded === 0 && result.toolsAdded === 0 && result.actionsAdded === 0) {
        toast.error('Import failed: No items were imported.')
      } else {
        toast.success('Workflow imported successfully')
      }
      setWorkflowConfigDialogOpen(false)
    } catch (err: any) {
      setWorkflowConfigImportError(err.message)
      toast.error(`Import failed: ${err.message}`)
    } finally {
      setImportingWorkflowConfig(false)
    }
  }

  const handleExportWorkflowConfig = () => {
    const config = workflowService.getCurrentWorkflowConfig()
    if (!config) {
        // Fallback to manual export if not in service
        const exported = exportToJson({ nodes, relationships, toolNodes, toolEdges, actionNodes, actionEdges } as any)
        downloadFile(exported, 'workflow-config.json', 'application/json')
        return
    }
    const fileName = metadata.name ? `${metadata.name.replace(/[^a-z0-9]/gi, '_')}-workflow-config.json` : 'workflow-config.json'
    downloadFile(JSON.stringify(config, null, 2), fileName, 'application/json')
  }

  const confirmClearWorkflow = () => {
    useToolCanvasStore.getState().clear()
    useActionCanvasStore.getState().clear()
    onWorkflowChange?.('')
    setClearWorkflowDialogOpen(false)
    toast.success('Workflow cleared')
  }

  useImperativeHandle(ref, () => ({
    exportData: () => ({
      schemaJson: JSON.parse(exportToJson(useModelBuilderStore.getState())),
      schemaMd: exportToMarkdown(useModelBuilderStore.getState())
    }),
    triggerSave: () => onSave?.(),
    loadData: (data: any) => {
      if (!data) return

      // Handle raw schemaJson (automatic conversion)
      if (data.nodes && data.relations && !Array.isArray(data.nodes)) {
        try {
          const converted = convertSchemaJsonToBuilder(data)
          useModelBuilderStore.getState().loadState({
            nodes: converted.nodes,
            relationships: converted.relationships,
            isSemanticEnabled: converted.isSemanticEnabled,
            selectedOntologyId: converted.selectedOntologyId,
            rootNodeId: converted.rootNodeId
          })
          
          // Update initial state
          const state = useModelBuilderStore.getState()
          const toolState = useToolCanvasStore.getState()
          const actionState = useActionCanvasStore.getState()
          initialStateRef.current = {
            nodes: JSON.parse(JSON.stringify(state.nodes)),
            relationships: JSON.parse(JSON.stringify(state.relationships)),
            toolNodes: JSON.parse(JSON.stringify(toolState.nodes)),
            toolEdges: JSON.parse(JSON.stringify(toolState.edges)),
            actionNodes: JSON.parse(JSON.stringify(actionState.nodes)),
            actionEdges: JSON.parse(JSON.stringify(actionState.edges))
          }
          return
        } catch (error) {
          console.error('Error auto-converting schemaJson in loadData:', error)
        }
      }

      // Handle MD schema
      if (typeof data === 'string' && (data.includes('## NODES') || data.includes('#### '))) {
        try {
          const parsedSchema = parseMarkdownSchema(data)
          const converted = convertMarkdownSchemaToBuilder(parsedSchema)
          useModelBuilderStore.getState().loadState({
            nodes: converted.nodes,
            relationships: converted.relationships,
            isSemanticEnabled: converted.isSemanticEnabled,
            selectedOntologyId: converted.selectedOntologyId,
            rootNodeId: converted.rootNodeId
          })

          // Update initial state
          const state = useModelBuilderStore.getState()
          const toolState = useToolCanvasStore.getState()
          const actionState = useActionCanvasStore.getState()
          initialStateRef.current = {
            nodes: JSON.parse(JSON.stringify(state.nodes)),
            relationships: JSON.parse(JSON.stringify(state.relationships)),
            toolNodes: JSON.parse(JSON.stringify(toolState.nodes)),
            toolEdges: JSON.parse(JSON.stringify(toolState.edges)),
            actionNodes: JSON.parse(JSON.stringify(actionState.nodes)),
            actionEdges: JSON.parse(JSON.stringify(actionState.edges))
          }
          return
        } catch (error) {
          console.error('Error auto-converting schemaMd in loadData:', error)
        }
      }

      // Default: assume it's already in builder state format
      useModelBuilderStore.getState().loadState(data)
      
      // Update initial state after loading new data
      const state = useModelBuilderStore.getState()
      const toolState = useToolCanvasStore.getState()
      const actionState = useActionCanvasStore.getState()
      initialStateRef.current = {
        nodes: JSON.parse(JSON.stringify(state.nodes)),
        relationships: JSON.parse(JSON.stringify(state.relationships)),
        toolNodes: JSON.parse(JSON.stringify(toolState.nodes)),
        toolEdges: JSON.parse(JSON.stringify(toolState.edges)),
        actionNodes: JSON.parse(JSON.stringify(actionState.nodes)),
        actionEdges: JSON.parse(JSON.stringify(actionState.edges))
      }
    },
    clear: () => {
      useModelBuilderStore.getState().clear()
      useToolCanvasStore.getState().clear()
      useActionCanvasStore.getState().clear()
    },
    clearWorkflow: () => {
      useToolCanvasStore.getState().clear()
      useActionCanvasStore.getState().clear()
    },
    getWorkflowConfig: () => workflowService.getCurrentWorkflowConfig(),
    hasChanges: () => {
      const currentState = useModelBuilderStore.getState()
      if (!initialStateRef.current) return false

      const nodesChanged = currentState.nodes.length !== initialStateRef.current.nodes.length ||
        JSON.stringify(currentState.nodes) !== JSON.stringify(initialStateRef.current.nodes)
      
      const relationshipsChanged = currentState.relationships.length !== initialStateRef.current.relationships.length ||
        JSON.stringify(currentState.relationships) !== JSON.stringify(initialStateRef.current.relationships)

      const currentToolNodes = useToolCanvasStore.getState().nodes
      const currentToolEdges = useToolCanvasStore.getState().edges
      const toolsChanged = currentToolNodes.length !== initialStateRef.current.toolNodes.length ||
        JSON.stringify(currentToolNodes) !== JSON.stringify(initialStateRef.current.toolNodes) ||
        currentToolEdges.length !== initialStateRef.current.toolEdges.length ||
        JSON.stringify(currentToolEdges) !== JSON.stringify(initialStateRef.current.toolEdges)

      const currentActionNodes = useActionCanvasStore.getState().nodes
      const currentActionEdges = useActionCanvasStore.getState().edges
      const actionsChanged = currentActionNodes.length !== initialStateRef.current.actionNodes.length ||
        JSON.stringify(currentActionNodes) !== JSON.stringify(initialStateRef.current.actionNodes) ||
        currentActionEdges.length !== initialStateRef.current.actionEdges.length ||
        JSON.stringify(currentActionEdges) !== JSON.stringify(initialStateRef.current.actionEdges)

      return nodesChanged || relationshipsChanged || toolsChanged || actionsChanged
    }
  }))

  return (
    <div className={cn("flex flex-col h-full bg-background select-none", className)}>
      <ModelBuilderHeader
        metadata={metadata}
        updateMetadata={updateMetadata}
        workflowPersistence={workflowPersistence}
        availableWorkflows={availableWorkflows}
        initialWorkflow={initialWorkflow}
        onWorkflowChange={onWorkflowChange}
        currentWorkflowName={currentWorkflowName}
        isSemanticEnabled={isSemanticEnabled || false}
        setIsSemanticEnabled={setIsSemanticEnabled}
        selectedOntologyId={selectedOntologyId}
        setSelectedOntologyId={setSelectedOntologyId}
        xmlContent={xmlContent}
        xmlPanelOpen={xmlPanelOpen}
        setXmlPanelOpen={setXmlPanelOpen}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isSchemaDesignEnabled={isSchemaDesignEnabled || false}
        isWorkflowGenerationEnabled={isWorkflowGenerationEnabled || false}
        agentsPanelOpen={agentsPanelOpen}
        setAgentsPanelOpen={setAgentsPanelOpen}
        onSave={onSave}
        hasWorkflowItems={toolNodes.length > 0 || actionNodes.length > 0}
        onClearWorkflow={() => setClearWorkflowDialogOpen(true)}
        xmlUploadInputRef={ui.fileInputRef}
        onUploadXml={handleUploadXml}
        xmlFile={xmlFile}
        onRunWorkflow={() => setRunDialogOpen(true)}
        hasContent={hasContent}
        onImportSchema={() => setImportDialogOpen(true)}
        onImportWorkflow={() => setWorkflowConfigDialogOpen(true)}
        onExportJson={exportToJsonFile}
        onExportMarkdown={exportToMarkdownFile}
        onExportRdf={exportToRdfFile}
        onExportTtl={exportToTtlFile}
        onExportWorkflow={handleExportWorkflowConfig}
        onDownloadNodeTemplate={() => downloadFile(generateNodeTemplate(), 'nodes.csv', 'text/csv')}
        onDownloadRelationshipTemplate={() => downloadFile(generateRelationshipTemplate(), 'rels.csv', 'text/csv')}
        showToolbar={showToolbar}
        setShowToolbar={setShowToolbar}
        onOpenCredentials={() => setCredentialsDialogOpen(true)}
      />

      <div className="flex h-[calc(100%-56px)] relative">
        {!nodesSidebarOpen && (
          <div className="absolute left-0 top-2 z-10">
            <Button variant="ghost" size="sm" onClick={() => setNodesSidebarOpen(true)} className="h-8 w-8 p-0 bg-background/95 backdrop-blur-sm border shadow-sm">
              <PanelLeftOpen className="h-4 w-4" />
            </Button>
          </div>
        )}

        <ModelBuilderSidebar
          nodesSidebarOpen={nodesSidebarOpen}
          setNodesSidebarOpen={setNodesSidebarOpen}
          sidebarWidth={sidebarWidth}
          setSidebarWidth={setSidebarWidth}
          leftTab={leftTab}
          setLeftTab={setLeftTab}
          onFocusNode={(id) => focusNodeFnRef.current?.(id)}
          onFocusRelationship={(from, to) => focusRelationshipFnRef.current?.(from, to)}
        />

        <div className="flex-1 min-w-0 relative flex h-full overflow-hidden">
          <div className="flex-1 relative h-full">
            <ModelBuilderCanvas
              className="h-full"
              sidebarOpen={sidebarOpen}
              onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
              onRegisterFocusApi={(fn) => { focusNodeFnRef.current = fn }}
              onRegisterFocusRelationshipApi={(fn) => { focusRelationshipFnRef.current = fn }}
              onSwitchTab={setLeftTab}
              showToolbar={showToolbar}
            />
          </div>

          {agentsPanelOpen && (!!isSchemaDesignEnabled || !!isWorkflowGenerationEnabled) && (
            <ResizablePanel side="right" defaultWidth={agentsPanelWidth} minWidth={300} maxWidth={800} onWidthChange={setAgentsPanelWidth} className="h-full border-l bg-background">
              <AIAgentsPanel className="h-full" />
            </ResizablePanel>
          )}

          {xmlPanelOpen && xmlContent && (
            <ResizablePanel side="right" defaultWidth={xmlPanelWidth} minWidth={350} maxWidth={1000} onWidthChange={setXmlPanelWidth} className="h-full border-l bg-background">
              <div className="h-full flex flex-col">
                <div className="p-2 border-b bg-muted/20 flex items-center justify-between">
                  <h3 className="text-xs font-semibold">XML Preview</h3>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setXmlPanelOpen(false)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex-1 relative overflow-hidden">
                  <XmlCodePreview value={xmlContent} height="100%" wrapWord={xmlWrapWord} />
                </div>
              </div>
            </ResizablePanel>
          )}
        </div>

        {executionProgress && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 w-96 bg-background/95 backdrop-blur-sm border rounded-lg p-4 shadow-lg">
            <ExecutionProgress {...executionProgress} status={executionProgress.current === executionProgress.total ? 'completed' : 'running'} />
          </div>
        )}

        {sidebarOpen && (
          <div className="w-80 border-l bg-muted/10">
            {selectedRelationship ? <RelationshipEditor className="h-full" onClose={() => setSidebarOpen(false)} /> :
             selectedToolNodeId ? <ToolConfigurationSidebar toolNodeId={selectedToolNodeId} onClose={() => useToolCanvasStore.getState().selectNode(null)} className="h-full" /> :
             selectedActionNodeId ? <ActionConfigurationSidebar actionNodeId={selectedActionNodeId} onClose={() => useActionCanvasStore.getState().selectNode(null)} className="h-full" /> :
             <NodeEditor className="h-full" onFocusNode={(id) => focusNodeFnRef.current?.(id)} onClose={() => setSidebarOpen(false)} />}
          </div>
        )}
      </div>

      <ModelBuilderDialogs
        importDialogOpen={importDialogOpen} setImportDialogOpen={setImportDialogOpen}
        importFile={importFile} setImportFile={setImportFile}
        importing={importing} importError={importError}
        onImportSchema={() => importSchema(importFile!)}
        workflowConfigDialogOpen={workflowConfigDialogOpen} setWorkflowConfigDialogOpen={setWorkflowConfigDialogOpen}
        workflowConfigFile={workflowConfigFile} onWorkflowConfigFileChange={setWorkflowConfigFile}
        onImportWorkflow={handleImportWorkflowConfig}
        importingWorkflowConfig={importingWorkflowConfig} workflowConfigImportError={workflowConfigImportError}
        runDialogOpen={runDialogOpen} setRunDialogOpen={setRunDialogOpen}
        nodes={nodes} rootNodeId={rootNodeId} setRootNodeId={setRootNodeId}
        xmlFile={xmlFile} setXmlFile={setXmlFile} xmlFileFromWizard={null} // Simplified
        running={running} graphPreview={graphPreview}
        onRunWorkflow={handleRunWorkflow} onPushToDB={onPushToDB}
        schemaDesignDialogOpen={schemaDesignDialogOpen} setSchemaDesignDialogOpen={setSchemaDesignDialogOpen} schemaDesignMode={schemaDesignMode}
        workflowGenerationDialogOpen={workflowGenerationDialogOpen} setWorkflowGenerationDialogOpen={setWorkflowGenerationDialogOpen}
        credentialsDialogOpen={credentialsDialogOpen} setCredentialsDialogOpen={setCredentialsDialogOpen}
        clearWorkflowDialogOpen={clearWorkflowDialogOpen} setClearWorkflowDialogOpen={setClearWorkflowDialogOpen}
        confirmClearWorkflow={confirmClearWorkflow}
      />
    </div>
  )
})

export const ModelBuilder = forwardRef<ModelBuilderRef, ModelBuilderProps>((props, ref) => <ModelBuilderContent {...props} ref={ref} />)
