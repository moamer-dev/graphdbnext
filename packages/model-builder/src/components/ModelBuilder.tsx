'use client'

import { forwardRef } from 'react'
import { ModelBuilderCanvas } from './canvas/ModelBuilderCanvas'
import { useToolCanvasStore } from '../stores/toolCanvasStore'
import { useActionCanvasStore } from '../stores/actionCanvasStore'
import { downloadFile } from '../utils/exportUtils'
import { generateNodeTemplate, generateRelationshipTemplate } from '../services/xml/parseService'
import { ModelBuilderHeader } from './ModelBuilderHeader'
import { ModelBuilderSidebar } from './ModelBuilderSidebar'
import { ModelBuilderDialogs } from './ModelBuilderDialogs'
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
import { useModelBuilderInternal } from '../hooks/builder/useModelBuilderInternal'
import type { WorkflowConfigExport } from '../utils/workflowConfigExport'

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
  onSaveModel?: (data: { schemaJson: any; schemaMd: string; metadata: any }) => Promise<void>
  isNewModel?: boolean
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
    onPushToDB,
    onSave,
    onSaveModel,
    isNewModel = false
  } = props

  const {
    ui,
    nodes,
    metadata,
    updateMetadata,
    rootNodeId,
    setRootNodeId,
    selectedOntologyId,
    setSelectedOntologyId,
    isSemanticEnabled,
    setIsSemanticEnabled,
    selectedRelationship,
    toolNodes,
    actionNodes,
    selectedToolNodeId,
    selectedActionNodeId,
    xmlContent,
    handleRunWorkflow,
    handleUploadXml,
    leftTab,
    setLeftTab,
    sidebarWidth,
    setSidebarWidth,
    agentsPanelOpen,
    setAgentsPanelOpen,
    agentsPanelWidth,
    setAgentsPanelWidth,
    xmlPanelOpen,
    setXmlPanelOpen,
    xmlPanelWidth,
    setXmlPanelWidth,
    xmlWrapWord,
    showToolbar,
    setShowToolbar,
    clearWorkflowDialogOpen,
    setClearWorkflowDialogOpen,
    importingWorkflowConfig,
    workflowConfigImportError,
    schemaDesignDialogOpen,
    setSchemaDesignDialogOpen,
    schemaDesignMode,
    isSchemaDesignEnabled,
    isWorkflowGenerationEnabled,
    workflowGenerationDialogOpen,
    setWorkflowGenerationDialogOpen,
    saveWorkflowDialogOpen,
    setSaveWorkflowDialogOpen,
    currentWorkflowConfig,
    currentWorkflow,
    workflowChangeConfirmOpen,
    setWorkflowChangeConfirmOpen,
    pendingWorkflowId,
    importing,
    importError,
    importSchema,
    exportToJsonFile,
    exportToMarkdownFile,
    exportToRdfFile,
    exportToTtlFile,
    hasContent,
    handleImportWorkflowConfig,
    handleExportWorkflowConfig,
    confirmClearWorkflow,
    handleWorkflowSave,
    handleWorkflowChange,
    confirmWorkflowChange,
    cancelWorkflowChange,
    triggerSaveInternal
  } = useModelBuilderInternal(props, ref)

  return (
    <div className={cn("flex flex-col h-full bg-background select-none", className)}>
      <ModelBuilderHeader
        metadata={metadata}
        updateMetadata={updateMetadata}
        workflowPersistence={workflowPersistence}
        availableWorkflows={availableWorkflows}
        initialWorkflow={initialWorkflow}
        onWorkflowChange={handleWorkflowChange}
        currentWorkflowName={currentWorkflowName}
        isSemanticEnabled={isSemanticEnabled || false}
        setIsSemanticEnabled={setIsSemanticEnabled}
        selectedOntologyId={selectedOntologyId}
        setSelectedOntologyId={setSelectedOntologyId}
        xmlContent={xmlContent}
        xmlPanelOpen={xmlPanelOpen}
        setXmlPanelOpen={setXmlPanelOpen}
        sidebarOpen={ui.sidebarOpen}
        setSidebarOpen={ui.setSidebarOpen}
        isSchemaDesignEnabled={isSchemaDesignEnabled || false}
        isWorkflowGenerationEnabled={isWorkflowGenerationEnabled || false}
        agentsPanelOpen={agentsPanelOpen}
        setAgentsPanelOpen={setAgentsPanelOpen}
        onSave={onSave || onSaveModel ? triggerSaveInternal : undefined}
        hasWorkflowItems={toolNodes.length > 0 || actionNodes.length > 0}
        onClearWorkflow={() => setClearWorkflowDialogOpen(true)}
        xmlUploadInputRef={ui.fileInputRef}
        onUploadXml={handleUploadXml}
        xmlFile={ui.xmlFile}
        onRunWorkflow={() => ui.setRunDialogOpen(true)}
        hasContent={hasContent}
        onImportSchema={() => ui.setImportDialogOpen(true)}
        onImportWorkflow={() => ui.setWorkflowConfigDialogOpen(true)}
        onExportJson={exportToJsonFile}
        onExportMarkdown={exportToMarkdownFile}
        onExportRdf={exportToRdfFile}
        onExportTtl={exportToTtlFile}
        onExportWorkflow={handleExportWorkflowConfig}
        onDownloadNodeTemplate={() => downloadFile(generateNodeTemplate(), 'nodes.csv', 'text/csv')}
        onDownloadRelationshipTemplate={() => downloadFile(generateRelationshipTemplate(), 'rels.csv', 'text/csv')}
        showToolbar={showToolbar}
        setShowToolbar={setShowToolbar}
        onOpenCredentials={() => ui.setCredentialsDialogOpen(true)}
      />

      <div className="flex h-[calc(100%-56px)] relative">
        {!ui.nodesSidebarOpen && (
          <div className="absolute left-0 top-2 z-10">
            <Button variant="ghost" size="sm" onClick={() => ui.setNodesSidebarOpen(true)} className="h-8 w-8 p-0 bg-background/95 backdrop-blur-sm border shadow-sm">
              <PanelLeftOpen className="h-4 w-4" />
            </Button>
          </div>
        )}

        <ModelBuilderSidebar
          nodesSidebarOpen={ui.nodesSidebarOpen}
          setNodesSidebarOpen={ui.setNodesSidebarOpen}
          sidebarWidth={sidebarWidth}
          setSidebarWidth={setSidebarWidth}
          leftTab={leftTab}
          setLeftTab={setLeftTab}
          onFocusNode={(id) => ui.focusNodeFnRef.current?.(id)}
          onFocusRelationship={(from, to) => ui.focusRelationshipFnRef.current?.(from, to)}
        />

        <div className="flex-1 min-w-0 relative flex h-full overflow-hidden">
          <div className="flex-1 relative h-full">
            <ModelBuilderCanvas
              className="h-full"
              sidebarOpen={ui.sidebarOpen}
              onToggleSidebar={() => ui.setSidebarOpen(!ui.sidebarOpen)}
              onRegisterFocusApi={(fn) => { ui.focusNodeFnRef.current = fn }}
              onRegisterFocusRelationshipApi={(fn) => { ui.focusRelationshipFnRef.current = fn }}
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

        {ui.executionProgress && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 w-96 bg-background/95 backdrop-blur-sm border rounded-lg p-4 shadow-lg">
            <ExecutionProgress {...ui.executionProgress} status={ui.executionProgress.current === ui.executionProgress.total ? 'completed' : 'running'} />
          </div>
        )}

        {ui.sidebarOpen && (
          <div className="w-80 border-l bg-muted/10">
            {selectedRelationship ? <RelationshipEditor className="h-full" onClose={() => ui.setSidebarOpen(false)} /> :
             selectedToolNodeId ? <ToolConfigurationSidebar toolNodeId={selectedToolNodeId} onClose={() => useToolCanvasStore.getState().selectNode(null)} className="h-full" /> :
             selectedActionNodeId ? <ActionConfigurationSidebar actionNodeId={selectedActionNodeId} onClose={() => useActionCanvasStore.getState().selectNode(null)} className="h-full" /> :
             <NodeEditor className="h-full" onFocusNode={(id) => ui.focusNodeFnRef.current?.(id)} onClose={() => ui.setSidebarOpen(false)} />}
          </div>
        )}
      </div>

      <ModelBuilderDialogs
        importDialogOpen={ui.importDialogOpen} setImportDialogOpen={ui.setImportDialogOpen}
        importFile={ui.importFile} setImportFile={ui.setImportFile}
        importing={importing} importError={importError}
        onImportSchema={() => importSchema(ui.importFile!)}
        workflowConfigDialogOpen={ui.workflowConfigDialogOpen} setWorkflowConfigDialogOpen={ui.setWorkflowConfigDialogOpen}
        workflowConfigFile={ui.workflowConfigFile} onWorkflowConfigFileChange={ui.setWorkflowConfigFile}
        onImportWorkflow={handleImportWorkflowConfig}
        importingWorkflowConfig={importingWorkflowConfig} workflowConfigImportError={workflowConfigImportError}
        runDialogOpen={ui.runDialogOpen} setRunDialogOpen={ui.setRunDialogOpen}
        nodes={nodes} rootNodeId={rootNodeId} setRootNodeId={setRootNodeId}
        xmlFile={ui.xmlFile} setXmlFile={ui.setXmlFile} xmlFileFromWizard={null}
        running={ui.running} graphPreview={ui.graphPreview}
        onRunWorkflow={handleRunWorkflow} onPushToDB={onPushToDB}
        schemaDesignDialogOpen={schemaDesignDialogOpen} setSchemaDesignDialogOpen={setSchemaDesignDialogOpen} schemaDesignMode={schemaDesignMode}
        workflowGenerationDialogOpen={workflowGenerationDialogOpen} setWorkflowGenerationDialogOpen={setWorkflowGenerationDialogOpen}
        credentialsDialogOpen={ui.credentialsDialogOpen} setCredentialsDialogOpen={ui.setCredentialsDialogOpen}
        clearWorkflowDialogOpen={clearWorkflowDialogOpen} setClearWorkflowDialogOpen={setClearWorkflowDialogOpen}
        confirmClearWorkflow={confirmClearWorkflow}
        
        // Workflow management dialogs
        saveWorkflowDialogOpen={saveWorkflowDialogOpen}
        setSaveWorkflowDialogOpen={setSaveWorkflowDialogOpen}
        workflowPersistence={workflowPersistence}
        currentWorkflowConfig={currentWorkflowConfig}
        availableWorkflows={availableWorkflows}
        isNewModel={isNewModel}
        selectedWorkflowId={currentWorkflow?.id}
        onSaveWorkflow={handleWorkflowSave}
        workflowChangeConfirmOpen={workflowChangeConfirmOpen}
        setWorkflowChangeConfirmOpen={setWorkflowChangeConfirmOpen}
        currentWorkflowName={currentWorkflow?.name}
        pendingWorkflowName={availableWorkflows.find(w => w.id === pendingWorkflowId)?.name}
        onConfirmWorkflowChange={confirmWorkflowChange}
        onCancelWorkflowChange={cancelWorkflowChange}
      />

    </div>
  )
})

export const ModelBuilder = forwardRef<ModelBuilderRef, ModelBuilderProps>((props, ref) => <ModelBuilderContent {...props} ref={ref} />)
