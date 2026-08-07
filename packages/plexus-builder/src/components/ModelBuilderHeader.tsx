import React from 'react'
import { Input } from './ui/input'
import { WorkflowSelector } from './workflow/WorkflowSelector'
import { Switch } from './ui/switch'
import { OntologyCombobox } from './wizard/XmlImportWizard/components/OntologyCombobox'
import { Button } from './ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu'
import { Settings, Key, Upload, FileUp, Download, Layout, Sparkles, CheckCircle2, Trash2, PlayCircle, ShieldCheck, Globe, FileJson, Share2, Folder } from 'lucide-react'
import { cn } from '../utils/cn'
import { SemanticValidationDialog } from './semantic/SemanticValidationDialog'
import { useBuilderTranslations } from '../i18n'

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
  viewMode?: 'canvas' | 'explorer'
  setViewMode?: (mode: 'canvas' | 'explorer') => void
  hasGraphResults?: boolean
  showLiveResults?: boolean
  setShowLiveResults?: (show: boolean) => void
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
  hasGraphResults,
  showLiveResults,
  setShowLiveResults,
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
  isPushingXml = false,
  viewMode = 'canvas',
  setViewMode
}) => {
  const t = useBuilderTranslations()
  const [semanticValidationOpen, setSemanticValidationOpen] = React.useState(false)

  const handleUploadWithToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUploadXml(e)
    setXmlPanelOpen(true)
  }

  const handleSelectWithToggle = (xml: any) => {
    onSelectWorkspaceXml?.(xml)
    setXmlPanelOpen(true)
  }

  return (
    <div className={cn("flex items-center gap-3 p-3 border-b bg-background", className)}>
      <Input
        value={metadata.name}
        onChange={(e) => updateMetadata({ name: e.target.value })}
        placeholder={t('builder.placeholderName')}
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
      <div className="flex items-center rounded-lg border bg-muted/30 p-0.5">
        <button
          type="button"
          onClick={() => setViewMode?.('canvas')}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all",
            viewMode === 'canvas'
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-background/50"
          )}
          title="Canvas Diagram View"
        >
          <Layout className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Canvas</span>
        </button>
        <button
          type="button"
          onClick={() => setViewMode?.('explorer')}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all",
            viewMode === 'explorer'
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-background/50"
          )}
          title="Miller Columns Explorer View"
        >
          <Folder className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Explorer</span>
        </button>
      </div>

      <div className="flex-1" />
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{t('builder.semantic')}:</span>
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



        {hasWorkflowItems && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{t('common.actions')}:</span>
            <Switch
              id="show-workflow-canvas"
              checked={isWorkflowVisible}
              onCheckedChange={setIsWorkflowVisible}
              className="scale-75"
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{t('builder.editor')}:</span>
          <Switch
            id="show-property-editor"
            checked={sidebarOpen}
            onCheckedChange={setSidebarOpen}
            className="scale-75"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{t('builder.toolbar')}:</span>
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
              <span className="text-xs hidden md:inline">{t('builder.tools')}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>{t('builder.projectActions')}</DropdownMenuLabel>
            <DropdownMenuItem onSelect={onOpenCredentials}>
              <Key className="h-3.5 w-3.5 mr-2" />
              {t('builder.credentialsManager')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>{t('builder.importData')}</DropdownMenuLabel>
            <DropdownMenuItem onSelect={onImportSchema}>
              <Upload className="h-3.5 w-3.5 mr-2" />
              {t('builder.importSchema')}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onImportWorkflow}>
              <FileUp className="h-3.5 w-3.5 mr-2" />
              {t('builder.importWorkflow')}
            </DropdownMenuItem>
            {hasContent && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>{t('builder.exportData')}</DropdownMenuLabel>
                <DropdownMenuItem onSelect={onExportJson}>
                  <Download className="h-3.5 w-3.5 mr-2" /> {t('builder.exportSchemaJson')}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={onExportMarkdown}>
                  <Download className="h-3.5 w-3.5 mr-2" /> {t('builder.exportSchemaMarkdown')}
                </DropdownMenuItem>
                 {hasWorkflowItems && (
                <DropdownMenuItem onSelect={onExportWorkflow}>
                  <Download className="h-3.5 w-3.5 mr-2" /> {t('builder.exportWorkflow')}
                </DropdownMenuItem>
                )}
                {isSemanticEnabled && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>{t('builder.semanticLayer')}</DropdownMenuLabel>
                    <DropdownMenuItem onSelect={() => setSemanticValidationOpen(true)}>
                      <ShieldCheck className="h-3.5 w-3.5 mr-2" />
                      {t('builder.validateSemantics')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>{t('builder.exportSemanticData')}</DropdownMenuLabel>
                    <DropdownMenuItem onSelect={onExportRdf}>
                      <Download className="h-3.5 w-3.5 mr-2" /> {t('builder.exportRdf')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={onExportTtl}>
                      <Download className="h-3.5 w-3.5 mr-2" /> {t('builder.exportTtl')}
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuLabel>{t('builder.templates')}</DropdownMenuLabel>
                <DropdownMenuItem onSelect={onDownloadNodeTemplate}>
                  <Download className="h-3.5 w-3.5 mr-2" /> {t('builder.nodeCsvTemplate')}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={onDownloadRelationshipTemplate}>
                  <Download className="h-3.5 w-3.5 mr-2" /> {t('builder.relationshipCsvTemplate')}
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
            <span className="text-xs font-medium">{t('common.save')}</span>
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

        <Button
          variant="default"
          size="sm"
          onClick={onRunWorkflow}
          className="h-7 text-[10px] px-2"
          disabled={!hasContent || !hasWorkflowItems}
        >
          <PlayCircle className="h-3.5 w-3.5 lg:mr-1" />
          <span className="hidden lg:inline">{t('builder.buildGraph')}</span>
        </Button>
      </div>
      
      <SemanticValidationDialog 
        open={semanticValidationOpen} 
        setOpen={setSemanticValidationOpen} 
      />
    </div>
  )
}
