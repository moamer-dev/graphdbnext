import React from 'react'
import { Input } from './ui/input'
import { WorkflowSelector } from './workflow/WorkflowSelector'
import { Switch } from './ui/switch'
import { OntologyCombobox } from './wizard/XmlImportWizard/components/OntologyCombobox'
import { Button } from './ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuCheckboxItem } from './ui/dropdown-menu'
import { Settings, Key, Upload, FileUp, Download, Layout, Sparkles, CheckCircle2, Trash2, PlayCircle, ShieldCheck, Globe, FileJson, Share2, MoreHorizontal, ChevronRight } from 'lucide-react'
import { cn } from '../utils/cn'
import { SemanticValidationDialog } from './semantic/SemanticValidationDialog'

interface ModelBuilderHeaderProps {
  className?: string
  metadata: { name: string }
  updateMetadata: (meta: { name: string }) => void
  workflowPersistence?: any
  availableWorkflows?: any[]
  initialWorkflow?: { id: string }
  onWorkflowChange?: (id: string) => void
  currentWorkflowName?: string
  isSemanticEnabled: boolean
  setIsSemanticEnabled: (val: boolean) => void
  selectedOntologyId: string | null
  setSelectedOntologyId: (id: string | null) => void
  xmlContent: string
  xmlPanelOpen: boolean
  setXmlPanelOpen: (val: boolean) => void
  sidebarOpen: boolean
  setSidebarOpen: (val: boolean) => void
  isSchemaDesignEnabled: boolean
  isWorkflowGenerationEnabled: boolean
  agentsPanelOpen: boolean
  setAgentsPanelOpen: (val: boolean) => void
  onSave?: () => void
  hasWorkflowItems: boolean
  isWorkflowVisible: boolean
  setIsWorkflowVisible: (val: boolean) => void
  onClearWorkflow: () => void
  xmlUploadInputRef: React.RefObject<HTMLInputElement | null>
  onUploadXml: (e: React.ChangeEvent<HTMLInputElement>) => void
  xmlFile: File | null
  onRunWorkflow: () => void
  hasContent: boolean
  // Actions for the tools menu
  onImportSchema: () => void
  onImportWorkflow: () => void
  onExportJson: () => void
  onExportMarkdown: () => void
  onExportRdf: () => void
  onExportTtl: () => void
  onExportWorkflow: () => void
  onDownloadNodeTemplate: () => void
  onDownloadRelationshipTemplate: () => void
  showToolbar: boolean
  setShowToolbar: (val: boolean) => void
  onOpenCredentials: () => void
  isNewModel?: boolean
  // New Workspace Props
  workspaceXmls?: any[]
  onSelectWorkspaceXml?: (xmlSource: any) => void
  onPushXmlToWorkspace?: () => void
  isPushingXml?: boolean
}

export const ModelBuilderHeader: React.FC<ModelBuilderHeaderProps> = ({
  className,
  metadata,
  updateMetadata,
  workflowPersistence,
  availableWorkflows = [],
  initialWorkflow,
  onWorkflowChange,
  currentWorkflowName,
  isSemanticEnabled,
  setIsSemanticEnabled,
  selectedOntologyId,
  setSelectedOntologyId,
  xmlContent,
  xmlPanelOpen,
  setXmlPanelOpen,
  sidebarOpen,
  setSidebarOpen,
  isSchemaDesignEnabled,
  isWorkflowGenerationEnabled,
  agentsPanelOpen,
  setAgentsPanelOpen,
  onSave,
  hasWorkflowItems,
  isWorkflowVisible,
  setIsWorkflowVisible,
  onClearWorkflow,
  xmlUploadInputRef,
  onUploadXml,
  xmlFile,
  onRunWorkflow,
  hasContent,
  onImportSchema,
  onImportWorkflow,
  onExportJson,
  onExportMarkdown,
  onExportRdf,
  onExportTtl,
  onExportWorkflow,
  onDownloadNodeTemplate,
  onDownloadRelationshipTemplate,
  showToolbar,
  setShowToolbar,
  onOpenCredentials,
  isNewModel = false,
  workspaceXmls = [],
  onSelectWorkspaceXml,
  onPushXmlToWorkspace,
  isPushingXml = false
}) => {
  const [semanticValidationOpen, setSemanticValidationOpen] = React.useState(false)

  return (
    <div className={cn("flex items-center gap-3 p-3 border-b bg-background", className)}>
      <Input
        value={metadata.name}
        onChange={(e) => updateMetadata({ name: e.target.value })}
        placeholder="Model name"
        className="min-w-[120px] max-w-[200px] flex-1 h-8 text-sm"
      />
      {workflowPersistence && availableWorkflows.length > 0 && (
        <WorkflowSelector
          workflows={availableWorkflows}
          currentWorkflowId={initialWorkflow?.id || null}
          onWorkflowChange={onWorkflowChange || (() => {
            // Default empty handler for workflow changes
          })}
          workflowPersistence={workflowPersistence}
        />
      )}
      {currentWorkflowName && !availableWorkflows.length && (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
          <CheckCircle2 className="h-3 w-3" />
          <span className="font-medium">Workflow:</span>
          <span>{currentWorkflowName}</span>
        </div>
      )}
      <div className="flex-1" />
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Semantic:</span>
          <Switch
            id="plexus-builder-semantic"
            checked={isSemanticEnabled}
            onCheckedChange={setIsSemanticEnabled}
            className="scale-75"
          />
          {isSemanticEnabled && (
            <div className="w-[180px] ml-1">
              <OntologyCombobox
                value={selectedOntologyId || undefined}
                onValueChange={(id) => setSelectedOntologyId(id)}
                className="h-7 text-xs"
              />
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-border mx-1" />

        {xmlContent && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">XML:</span>
            <Switch
              id="show-xml-preview"
              checked={xmlPanelOpen}
              onCheckedChange={setXmlPanelOpen}
              className="scale-75"
            />
          </div>
        )}

        {hasWorkflowItems && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Workflow:</span>
            <Switch
              id="show-workflow-canvas"
              checked={isWorkflowVisible}
              onCheckedChange={setIsWorkflowVisible}
              className="scale-75"
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Editor:</span>
          <Switch
            id="show-property-editor"
            checked={sidebarOpen}
            onCheckedChange={setSidebarOpen}
            className="scale-75"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Toolbar:</span>
          <Switch
            id="show-canvas-toolbar"
            checked={showToolbar}
            onCheckedChange={setShowToolbar}
            className="scale-75"
          />
        </div>

        {(isSchemaDesignEnabled || isWorkflowGenerationEnabled) && (
          <Button
            variant={agentsPanelOpen ? "default" : "outline"}
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setAgentsPanelOpen(!agentsPanelOpen)}
            title="AI Agents"
          >
            <Sparkles className="h-3.5 w-3.5" />
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 px-2">
              <Settings className="h-3.5 w-3.5 mr-1" />
              <span className="text-xs hidden md:inline">Tools</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Project Actions</DropdownMenuLabel>
            <DropdownMenuItem onSelect={onOpenCredentials}>
              <Key className="h-3.5 w-3.5 mr-2" />
              Credentials Manager
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Import Data</DropdownMenuLabel>
            <DropdownMenuItem onSelect={onImportSchema}>
              <Upload className="h-3.5 w-3.5 mr-2" />
              Import Schema
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onImportWorkflow}>
              <FileUp className="h-3.5 w-3.5 mr-2" />
              Import Workflow
            </DropdownMenuItem>
            {hasContent && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Export Data</DropdownMenuLabel>
                <DropdownMenuItem onSelect={onExportJson}>
                  <Download className="h-3.5 w-3.5 mr-2" /> Export Schema JSON
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={onExportMarkdown}>
                  <Download className="h-3.5 w-3.5 mr-2" /> Export Schema Markdown
                </DropdownMenuItem>
                 {hasWorkflowItems && (
                <DropdownMenuItem onSelect={onExportWorkflow}>
                  <Download className="h-3.5 w-3.5 mr-2" /> Export Workflow
                </DropdownMenuItem>
                )}
                {isSemanticEnabled && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Semantic Layer</DropdownMenuLabel>
                    <DropdownMenuItem onSelect={() => setSemanticValidationOpen(true)}>
                      <ShieldCheck className="h-3.5 w-3.5 mr-2" />
                      Validate Semantics
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Export Semantic Data</DropdownMenuLabel>
                    <DropdownMenuItem onSelect={onExportRdf}>
                      <Download className="h-3.5 w-3.5 mr-2" /> Export RDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={onExportTtl}>
                      <Download className="h-3.5 w-3.5 mr-2" /> Export TTL
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Templates</DropdownMenuLabel>
                <DropdownMenuItem onSelect={onDownloadNodeTemplate}>
                  <Download className="h-3.5 w-3.5 mr-2" /> Node CSV Template
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={onDownloadRelationshipTemplate}>
                  <Download className="h-3.5 w-3.5 mr-2" /> Relationship CSV Template
                </DropdownMenuItem>
              </>
            )}

          </DropdownMenuContent>
        </DropdownMenu>

        {!isNewModel && onSave && (
          <Button
            variant="default"
            size="sm"
            onClick={onSave}
            className="h-7 text-[10px] px-2"
            title="Save Changes"
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
            <span className="text-xs font-medium">Save</span>
          </Button>
        )}

        {hasWorkflowItems && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearWorkflow}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
            title="Clear all workflow items"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}

        <input
          ref={xmlUploadInputRef}
          type="file"
          accept=".xml"
          className="hidden"
          onChange={onUploadXml}
        />
        <div className="flex items-center rounded-md border bg-background p-0.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[10px] px-2"
                title={xmlFile ? `Current XML: ${xmlFile.name}` : "Manage structural definitions"}
              >
                <FileUp className="h-3.5 w-3.5 lg:mr-1" />
                <span className="hidden lg:inline">{xmlFile ? 'Change XML' : 'XML Library'}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground font-bold">Local Operations</DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => xmlUploadInputRef.current?.click()}>
                <Upload className="h-3.5 w-3.5 mr-2" />
                Upload from Computer
              </DropdownMenuItem>
              
              {xmlFile && onPushXmlToWorkspace && (
                <DropdownMenuItem 
                  onSelect={onPushXmlToWorkspace} 
                  disabled={isPushingXml}
                  className="text-primary font-medium"
                >
                  <Share2 className="h-3.5 w-3.5 mr-2" />
                  {isPushingXml ? 'Pushing to Workspace...' : 'Push to Workspace'}
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground font-bold flex items-center justify-between">
                Workspace Library
                <Globe className="h-3 w-3" />
              </DropdownMenuLabel>
              
              {workspaceXmls.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-[10px] text-muted-foreground italic">No shared XMLs in this workspace</p>
                </div>
              ) : (
                <div className="max-h-[200px] overflow-y-auto pt-1">
                  {workspaceXmls.map((xml) => (
                    <DropdownMenuItem 
                      key={xml.id} 
                      onSelect={() => onSelectWorkspaceXml?.(xml)}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileJson className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                        <span className="truncate">{xml.name}</span>
                      </div>
                      {xmlFile?.name === xml.name && <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0 ml-2" />}
                    </DropdownMenuItem>
                  ))}
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="w-px h-4 bg-border mx-0.5" />
          <Button
            variant="default"
            size="sm"
            onClick={onRunWorkflow}
            className="h-7 text-[10px] px-2"
            disabled={!hasContent || !hasWorkflowItems}
          >
            <PlayCircle className="h-3.5 w-3.5 lg:mr-1" />
            <span className="hidden lg:inline">Build a Graph</span>
          </Button>
        </div>
      </div>
      
      <SemanticValidationDialog 
        open={semanticValidationOpen} 
        setOpen={setSemanticValidationOpen} 
      />
    </div>
  )
}
