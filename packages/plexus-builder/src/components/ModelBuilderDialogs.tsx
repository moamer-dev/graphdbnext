import React from 'react'
import { ImportSchemaDialog } from './dialogs/ImportSchemaDialog'
import { ImportWorkflowDialog } from './dialogs/ImportWorkflowDialog'
import { RunWorkflowDialog } from './dialogs/RunWorkflowDialog'
import { AIChatbot } from './ai/AIChatbot'
import { SchemaDesignPanel } from './ai/SchemaDesignPanel'
import { WorkflowGenerationPanel } from './ai/WorkflowGenerationPanel'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog'
import { CredentialsManager } from './shared/CredentialsManager'
import { SaveWorkflowDialog } from './dialogs/SaveWorkflowDialog'
import { WorkflowChangeConfirmDialog } from './dialogs/WorkflowChangeConfirmDialog'
import { SaveXmlToWorkspaceDialog } from './dialogs/SaveXmlToWorkspaceDialog'

interface ModelBuilderDialogsProps {
  importDialogOpen: boolean
  setImportDialogOpen: (val: boolean) => void
  importFile: File | null
  setImportFile: (file: File | null) => void
  importing: boolean
  importError: string | null
  onImportSchema: () => void

  workflowConfigDialogOpen: boolean
  setWorkflowConfigDialogOpen: (val: boolean) => void
  workflowConfigFile: File | null
  onWorkflowConfigFileChange: (file: File | null) => void
  onImportWorkflow: () => void
  importingWorkflowConfig: boolean
  workflowConfigImportError: string | null

  runDialogOpen: boolean
  setRunDialogOpen: (val: boolean) => void
  nodes: any[]
  rootNodeId: string | null
  setRootNodeId: (id: string | null) => void
  xmlFile: File | null
  setXmlFile: (file: File | null) => void
  xmlFileFromWizard: File | null
  running: boolean
  graphPreview: any
  onRunWorkflow: () => void
  onPushToDB?: (graph: any[]) => Promise<void>

  schemaDesignDialogOpen: boolean
  setSchemaDesignDialogOpen: (val: boolean) => void
  schemaDesignMode: 'suggest' | 'optimize' | 'validate'

  workflowGenerationDialogOpen: boolean
  setWorkflowGenerationDialogOpen: (val: boolean) => void

  credentialsDialogOpen: boolean
  setCredentialsDialogOpen: (val: boolean) => void

  clearWorkflowDialogOpen: boolean
  setClearWorkflowDialogOpen: (val: boolean) => void
  confirmClearWorkflow: () => void

  // Workflow management dialogs
  saveWorkflowDialogOpen: boolean
  setSaveWorkflowDialogOpen: (val: boolean) => void
  workflowPersistence: any
  currentWorkflowConfig: any
  availableWorkflows: any[]
  isNewModel: boolean
  selectedWorkflowId?: string | null
  onSaveWorkflow: (workflowAction: any) => Promise<void>
  workflowChangeConfirmOpen: boolean
  setWorkflowChangeConfirmOpen: (val: boolean) => void
  currentWorkflowName?: string
  pendingWorkflowName?: string
  onConfirmWorkflowChange: (updateCurrent: boolean) => void
  onCancelWorkflowChange: () => void

  // Save XML to workspace
  saveXmlToWorkspaceDialogOpen: boolean
  setSaveXmlToWorkspaceDialogOpen: (val: boolean) => void
  saveXmlToWorkspaceName: string
  setSaveXmlToWorkspaceName: (val: string) => void
  onConfirmSaveXmlToWorkspace: () => void
  isPushingXml: boolean
}


export const ModelBuilderDialogs: React.FC<ModelBuilderDialogsProps> = ({
  importDialogOpen,
  setImportDialogOpen,
  importFile,
  setImportFile,
  importing,
  importError,
  onImportSchema,
  workflowConfigDialogOpen,
  setWorkflowConfigDialogOpen,
  workflowConfigFile,
  onWorkflowConfigFileChange,
  onImportWorkflow,
  importingWorkflowConfig,
  workflowConfigImportError,
  runDialogOpen,
  setRunDialogOpen,
  nodes,
  rootNodeId,
  setRootNodeId,
  xmlFile,
  setXmlFile,
  xmlFileFromWizard,
  running,
  graphPreview,
  onRunWorkflow,
  onPushToDB,
  schemaDesignDialogOpen,
  setSchemaDesignDialogOpen,
  schemaDesignMode,
  workflowGenerationDialogOpen,
  setWorkflowGenerationDialogOpen,
  credentialsDialogOpen,
  setCredentialsDialogOpen,
  clearWorkflowDialogOpen,
  setClearWorkflowDialogOpen,
  confirmClearWorkflow,

  // Workflow management dialogs
  saveWorkflowDialogOpen,
  setSaveWorkflowDialogOpen,
  workflowPersistence,
  currentWorkflowConfig,
  availableWorkflows,
  isNewModel,
  selectedWorkflowId,
  onSaveWorkflow,
  workflowChangeConfirmOpen,
  setWorkflowChangeConfirmOpen,
  currentWorkflowName,
  pendingWorkflowName,
  onConfirmWorkflowChange,
  onCancelWorkflowChange,
  saveXmlToWorkspaceDialogOpen,
  setSaveXmlToWorkspaceDialogOpen,
  saveXmlToWorkspaceName,
  setSaveXmlToWorkspaceName,
  onConfirmSaveXmlToWorkspace,
  isPushingXml
}) => {
  return (
    <>
      <ImportSchemaDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        importFile={importFile}
        onImportFileChange={setImportFile}
        importing={importing}
        importError={importError}
        onImport={onImportSchema}
      />
      <ImportWorkflowDialog
        open={workflowConfigDialogOpen}
        onOpenChange={setWorkflowConfigDialogOpen}
        workflowConfigFile={workflowConfigFile}
        onWorkflowConfigFileChange={onWorkflowConfigFileChange}
        onImport={onImportWorkflow}
        importing={importingWorkflowConfig}
        importError={workflowConfigImportError}
        onCancel={() => {
          setWorkflowConfigDialogOpen(false)
          onWorkflowConfigFileChange(null)
        }}
      />
      <RunWorkflowDialog
        open={runDialogOpen}
        onOpenChange={setRunDialogOpen}
        nodes={nodes}
        rootNodeId={rootNodeId}
        onRootNodeIdChange={setRootNodeId}
        xmlFile={xmlFile}
        onXmlFileChange={setXmlFile}
        xmlFileFromWizard={xmlFileFromWizard}
        running={running}
        graphPreview={graphPreview}
        onRun={onRunWorkflow}
        onPushToDB={onPushToDB}
      />
      <AIChatbot />
      <SchemaDesignPanel
        open={schemaDesignDialogOpen}
        onOpenChange={setSchemaDesignDialogOpen}
        mode={schemaDesignMode}
      />
      <WorkflowGenerationPanel
        open={workflowGenerationDialogOpen}
        onOpenChange={setWorkflowGenerationDialogOpen}
      />
      <Dialog open={credentialsDialogOpen} onOpenChange={setCredentialsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>API Credentials</DialogTitle>
            <DialogDescription>
              Manage API credentials for authenticated research APIs (ORCID, GeoNames, Europeana, Getty).
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <CredentialsManager />
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={clearWorkflowDialogOpen} onOpenChange={setClearWorkflowDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Workflow?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all workflow items (tools and actions) while keeping your schema nodes and relationships. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmClearWorkflow} className="bg-destructive text-primary-foreground hover:bg-destructive/80">
              Clear Workflow
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SaveWorkflowDialog
        open={saveWorkflowDialogOpen}
        onOpenChange={setSaveWorkflowDialogOpen}
        workflowPersistence={workflowPersistence}
        currentWorkflowConfig={currentWorkflowConfig}
        existingWorkflows={availableWorkflows}
        isNewModel={isNewModel}
        selectedWorkflowId={selectedWorkflowId}
        onSave={onSaveWorkflow}
      />

      {currentWorkflowName && pendingWorkflowName && (
        <WorkflowChangeConfirmDialog
          open={workflowChangeConfirmOpen}
          onOpenChange={setWorkflowChangeConfirmOpen}
          currentWorkflowName={currentWorkflowName}
          newWorkflowName={pendingWorkflowName}
          onConfirm={onConfirmWorkflowChange}
          onCancel={onCancelWorkflowChange}
        />
      )}

      <SaveXmlToWorkspaceDialog
        open={saveXmlToWorkspaceDialogOpen}
        onOpenChange={setSaveXmlToWorkspaceDialogOpen}
        name={saveXmlToWorkspaceName}
        setName={setSaveXmlToWorkspaceName}
        onConfirm={onConfirmSaveXmlToWorkspace}
        isLoading={isPushingXml}
      />
    </>
  )
}
