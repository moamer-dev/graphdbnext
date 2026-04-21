import { useState, useEffect, useRef, useImperativeHandle, useMemo } from 'react'
import { useModelBuilderStore } from '../../stores/modelBuilderStore'
import { useToolCanvasStore } from '../../stores/toolCanvasStore'
import { useActionCanvasStore } from '../../stores/actionCanvasStore'
import { useTabPersistence } from '../ui/useTabPersistence'
import { useModelBuilderUI } from '../ui/useModelBuilderUI'
import { useSchemaImport, useSchemaExport } from '../index'
import { useWorkflowLifecycle } from '../lifecycle/useWorkflowLifecycle'
import { workflowService } from '../../services/workflow/workflowService'
import { importWorkflowConfig } from '../../utils/workflowConfigExport'
import { downloadFile, exportToJson, exportToMarkdown } from '../../utils/exportUtils'
import { convertSchemaJsonToBuilder } from '../../utils/schemaConverter'
import { parseMarkdownSchema, convertMarkdownSchemaToBuilder } from '../../utils/markdownParser'
import { toast } from '../../utils/toast'
import { useAIFeature } from '../../ai/config'
import { useDataSourcesStore, useXmlSources } from '../../stores/dataSourcesStore'
import { useCredentialsStore } from '../../stores/credentialsStore'
import { useAiStore } from '../../stores/aiStore'
import { useXmlImportWizardStore } from '../../stores/xmlImportWizardStore'
// Removed root imports that cause bundling issues

export function useModelBuilderInternal(props: any, ref: any) {
  const {
    workflowPersistence,
    dataSourcesPersistence,
    credentialsPersistence,
    aiPersistence,
    initialWorkflow,
    onWorkflowChange,
    onSave,
    onSaveModel
  } = props

  const [xmlPanelOpen, setXmlPanelOpen] = useState(false)
  const [xmlPanelWidth, setXmlPanelWidth] = useState(600)
  const [hasAutoOpened, setHasAutoOpened] = useState(false)

  // Collaborative Store Synchronization
  useEffect(() => {
    const loadSharedData = async () => {
      try {
        // Load Data Sources
        if (dataSourcesPersistence?.onLoad) {
          const sources = await dataSourcesPersistence.onLoad()
          if (sources) useDataSourcesStore.getState().setSources(sources)
        }

        // Load Credentials
        if (credentialsPersistence?.onLoad) {
          const credentials = await credentialsPersistence.onLoad()
          if (credentials) {
            const currentStore = useCredentialsStore.getState()
            const localCreds = currentStore.credentials.filter(c => c.storageSource === 'local')
            currentStore.setCredentials([...localCreds, ...credentials])
          }
        }

        // Load AI Chat Sessions
        if (aiPersistence?.onLoadSessions) {
          const sessions = await aiPersistence.onLoadSessions()
          if (sessions) useAiStore.getState().setSessions(sessions)
        }
      } catch (error) {
        console.error('Error loading shared workspace data:', error)
      }
    }

    loadSharedData()
  }, [dataSourcesPersistence, credentialsPersistence, aiPersistence])

  const ui = useModelBuilderUI()

  // Auto-open XML panel if a file was imported/selected from the wizard
  const xmlFileFromWizard = useXmlImportWizardStore((state) => state.selectedFile)
  useEffect(() => {
    if (xmlFileFromWizard && !hasAutoOpened) {
      ui.setXmlFile(xmlFileFromWizard)
      setXmlPanelOpen(true)
      setHasAutoOpened(true)
    }
  }, [xmlFileFromWizard, hasAutoOpened, ui.setXmlFile])
  const {
    setWorkflowConfigDialogOpen,
    workflowConfigFile
  } = ui

  const nodesFromStore = useModelBuilderStore((state) => state.nodes)
  const nodes = useMemo(() => Array.isArray(nodesFromStore) ? nodesFromStore : [], [nodesFromStore])
  const relationshipsFromStore = useModelBuilderStore((state) => state.relationships)
  const relationships = useMemo(() => Array.isArray(relationshipsFromStore) ? relationshipsFromStore : [], [relationshipsFromStore])
  const metadata = useModelBuilderStore((state) => state.metadata)
  const updateMetadata = useModelBuilderStore((state) => state.updateMetadata)
  const rootNodeId = useModelBuilderStore((state) => state.rootNodeId)
  const setRootNodeId = useModelBuilderStore((state) => state.setRootNodeId)
  const selectedOntologyId = useModelBuilderStore((state) => state.selectedOntologyId)
  const setSelectedOntologyId = useModelBuilderStore((state) => state.setSelectedOntologyId)
  const isSemanticEnabled = useModelBuilderStore((state) => state.isSemanticEnabled)
  const setIsSemanticEnabled = useModelBuilderStore((state) => state.setIsSemanticEnabled)
  const isWorkflowVisible = useModelBuilderStore((state) => state.isWorkflowVisible)
  const setIsWorkflowVisible = useModelBuilderStore((state) => state.setIsWorkflowVisible)
  const selectedRelationship = useModelBuilderStore((state) => state.selectedRelationship)

  const toolNodes = useToolCanvasStore((state) => state.nodes)
  const toolEdges = useToolCanvasStore((state) => state.edges)
  const actionNodes = useActionCanvasStore((state) => state.nodes)
  const actionEdges = useActionCanvasStore((state) => state.edges)
  const selectedToolNodeId = useToolCanvasStore((state) => state.selectedNodeId)
  const selectedActionNodeId = useActionCanvasStore((state) => state.selectedNodeId)

  const { xmlContent, setXmlContent, handleRunWorkflow, handleUploadXml } = useWorkflowLifecycle({
    initialWorkflow, nodes, relationships, ui
  })

  const [leftTab, setLeftTab] = useTabPersistence<'nodes' | 'relationships' | 'tools' | 'actions'>(
    'plexus-builder-left-tab', 'nodes', ['nodes', 'relationships', 'tools', 'actions']
  )
  const [sidebarWidth, setSidebarWidth] = useState(260)
  const [agentsPanelOpen, setAgentsPanelOpen] = useState(false)
  const [agentsPanelWidth, setAgentsPanelWidth] = useState(400)
  const [xmlWrapWord, setXmlWrapWord] = useState(false)
  const [showToolbar, setShowToolbar] = useState(true)
  const [clearWorkflowDialogOpen, setClearWorkflowDialogOpen] = useState(false)
  const [importingWorkflowConfig, setImportingWorkflowConfig] = useState(false)
  const [workflowConfigImportError, setWorkflowConfigImportError] = useState<string | null>(null)
  const [schemaDesignDialogOpen, setSchemaDesignDialogOpen] = useState(false)
  const [schemaDesignMode] = useState<'suggest' | 'optimize' | 'validate'>('suggest')
  const [workflowGenerationDialogOpen, setWorkflowGenerationDialogOpen] = useState(false)
  const [isPushingXml, setIsPushingXml] = useState(false)

  const {
    saveXmlToWorkspaceDialogOpen,
    setSaveXmlToWorkspaceDialogOpen,
    saveXmlToWorkspaceName,
    setSaveXmlToWorkspaceName
  } = ui

  const workspaceXmls = useXmlSources()

  const isSchemaDesignEnabled = useAIFeature('schemaDesignAgent')
  const isWorkflowGenerationEnabled = useAIFeature('workflowGenerationAgent')

  // Workflow management state
  const [saveWorkflowDialogOpen, setSaveWorkflowDialogOpen] = useState(false)
  const [currentWorkflowConfig, setCurrentWorkflowConfig] = useState<any>(null)
  const [currentWorkflow, setCurrentWorkflow] = useState<any>(initialWorkflow || null)
  const [savedWorkflowConfig, setSavedWorkflowConfig] = useState<unknown>(null)
  const [workflowChangeConfirmOpen, setWorkflowChangeConfirmOpen] = useState(false)
  const [pendingWorkflowId, setPendingWorkflowId] = useState<string | null>(null)
  
  const isSavingRef = useRef(false)
  const pendingSaveRef = useRef<(() => Promise<void>) | null>(null)
  const initialStateRef = useRef<any>(null)

  // Sync currentWorkflow with initialWorkflow if it changes externally
  useEffect(() => {
    if (initialWorkflow) {
      setCurrentWorkflow(initialWorkflow)
      const normalized = JSON.parse(JSON.stringify(initialWorkflow.config))
      setSavedWorkflowConfig(normalized)
    }
  }, [initialWorkflow])

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
      
      // Basic file validation - check if it looks like JSON and has expected structure
      if (!text.trim().startsWith('{')) {
        throw new Error('The selected file does not appear to be a JSON file. Please select a valid workflow configuration file.')
      }
      
      // Quick check for workflow config type without full parsing
      const quickCheck = text.toLowerCase();
      if (!quickCheck.includes('workflow-config') && !quickCheck.includes('"type"')) {
        throw new Error('The selected file does not appear to be a workflow configuration file. Please ensure you\'re importing a file that was exported from the workflow system.');
      }
      
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

  const handleWorkflowSave = async (workflowAction: any) => {
    if (!workflowPersistence) {
      if (pendingSaveRef.current) {
        await pendingSaveRef.current()
        pendingSaveRef.current = null
      }
      return
    }

    try {
      const config = workflowService.getCurrentWorkflowConfig()
      if (!config) {
        if (pendingSaveRef.current) await pendingSaveRef.current()
        return
      }

      if (workflowAction.action === 'create' && workflowAction.name) {
        const result = await workflowPersistence.onSaveWorkflow?.({
          name: workflowAction.name,
          description: workflowAction.description,
          config
        })
        if (result?.id) {
          setCurrentWorkflow({
            id: result.id,
            name: workflowAction.name,
            description: workflowAction.description,
            config
          })
          setSavedWorkflowConfig(JSON.parse(JSON.stringify(config)))
        }
        toast.success('Workflow created successfully')
      } else if (workflowAction.action === 'update' && workflowAction.workflowId) {
        await workflowPersistence.onUpdateWorkflow?.(workflowAction.workflowId, {
          name: workflowAction.name,
          description: workflowAction.description,
          config
        })
        
        setSavedWorkflowConfig(JSON.parse(JSON.stringify(config)))
        if (currentWorkflow && currentWorkflow.id === workflowAction.workflowId) {
          setCurrentWorkflow({
            ...currentWorkflow,
            name: workflowAction.name || currentWorkflow.name,
            description: workflowAction.description !== undefined ? workflowAction.description : currentWorkflow.description
          })
        }
        toast.success('Workflow updated successfully')
      }

      if (pendingSaveRef.current) {
        await pendingSaveRef.current()
        pendingSaveRef.current = null
      }
    } catch (error) {
      console.error('Error in handleWorkflowSave:', error)
      toast.error('Failed to save workflow')
      if (pendingSaveRef.current) {
        await pendingSaveRef.current()
        pendingSaveRef.current = null
      }
    }
  }

  const handleWorkflowChange = async (workflowId: string) => {
    if (workflowService.hasUnsavedChanges(savedWorkflowConfig as any)) {
      setPendingWorkflowId(workflowId)
      setWorkflowChangeConfirmOpen(true)
    } else {
      onWorkflowChange?.(workflowId)
    }
  }

  const confirmWorkflowChange = async (updateCurrent: boolean) => {
    if (!pendingWorkflowId) return

    try {
      if (updateCurrent && currentWorkflow && workflowPersistence) {
        const config = workflowService.getCurrentWorkflowConfig()
        if (config) {
          await workflowPersistence.onUpdateWorkflow?.(currentWorkflow.id, { config })
          toast.success('Current workflow updated')
        }
      }
      onWorkflowChange?.(pendingWorkflowId)
    } catch (error) {
      console.error('Error confirming workflow change:', error)
      toast.error('Failed to update workflow')
    } finally {
      setPendingWorkflowId(null)
      setWorkflowChangeConfirmOpen(false)
    }
  }

  const cancelWorkflowChange = () => {
    setPendingWorkflowId(null)
    setWorkflowChangeConfirmOpen(false)
  }

  const triggerSaveInternal = async () => {
    if (isSavingRef.current) return
    
    const config = workflowService.getCurrentWorkflowConfig()
    const hasWorkflow = config && (config.tools?.length || config.actions?.length)

    pendingSaveRef.current = async () => {
      if (isSavingRef.current) return
      isSavingRef.current = true
      try {
        if (onSaveModel) {
          const exportResult = {
            schemaJson: JSON.parse(exportToJson(useModelBuilderStore.getState())),
            schemaMd: exportToMarkdown(useModelBuilderStore.getState())
          }
          await onSaveModel({
            ...exportResult,
            metadata
          })
        } else if (onSave) {
          onSave()
        }
      } catch (error) {
        console.error('Error saving model:', error)
      } finally {
        isSavingRef.current = false
      }
    }

    if (hasWorkflow) {
      setCurrentWorkflowConfig(config)
      setSaveWorkflowDialogOpen(true)
    } else {
      await pendingSaveRef.current()
      pendingSaveRef.current = null
    }
  }

  useImperativeHandle(ref, () => ({
    exportData: () => ({
      schemaJson: JSON.parse(exportToJson(useModelBuilderStore.getState())),
      schemaMd: exportToMarkdown(useModelBuilderStore.getState())
    }),
    triggerSave: triggerSaveInternal,
    loadData: (data: any) => {
      if (!data) return
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

      useModelBuilderStore.getState().loadState(data)
      
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
    },
    setLocale: (locale: string) => {
      useModelBuilderStore.getState().setLocale(locale)
    }
  }))

  return {
    ui,
    nodes,
    relationships,
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
    toolEdges,
    actionNodes,
    actionEdges,
    selectedToolNodeId,
    selectedActionNodeId,
    xmlContent,
    setXmlContent,
    handleRunWorkflow,
    handleUploadXml,
    onSelectWorkspaceXml: async (xmlSource: any) => {
        try {
            // If content is already in the object (small files stored in DB)
            if (xmlSource.content) {
                handleUploadXml({ 
                   target: { files: [new File([xmlSource.content], xmlSource.name, { type: 'text/xml' })] } 
                } as any)
                return
            }
            
            // If stored in S3 or Local FS, we might need a fetch (handled by adapter usually, but we check)
            if (xmlSource.fileUrl) {
                const response = await fetch(xmlSource.fileUrl)
                const text = await response.text()
                handleUploadXml({ 
                   target: { files: [new File([text], xmlSource.name, { type: 'text/xml' })] } 
                } as any)
            }
        } catch (error) {
            toast.error('Failed to load workspace XML')
        }
    },
    onPushXmlToWorkspace: async () => {
        if (!ui.xmlFile || !dataSourcesPersistence?.onSave) return
        
        // If the dialog is not open yet, open it and set the default name
        if (!saveXmlToWorkspaceDialogOpen) {
            setSaveXmlToWorkspaceName(ui.xmlFile.name)
            setSaveXmlToWorkspaceDialogOpen(true)
            return
        }

        // If we are here, the dialog is open and the user clicked "Confirm"
        setIsPushingXml(true)
        try {
            // Use xmlContent (edited) instead of ui.xmlFile.text() (original)
            const contentToSave = xmlContent
            
            await dataSourcesPersistence.onSave({
                name: saveXmlToWorkspaceName || ui.xmlFile.name,
                type: 'XML',
                content: contentToSave,
                size: new Blob([contentToSave]).size
            })
            toast.success('XML saved to workspace library')
            setSaveXmlToWorkspaceDialogOpen(false)
            
            // Re-load data sources to see the new item
            if (dataSourcesPersistence.onLoad) {
                const sources = await dataSourcesPersistence.onLoad()
                if (sources) useDataSourcesStore.getState().setSources(sources)
            }
        } catch (err) {
            toast.error('Failed to save XML to workspace')
        } finally {
            setIsPushingXml(false)
        }
    },
    workspaceXmls,
    isPushingXml,
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
    setXmlWrapWord,
    saveXmlToWorkspaceDialogOpen,
    setSaveXmlToWorkspaceDialogOpen,
    saveXmlToWorkspaceName,
    setSaveXmlToWorkspaceName,
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
    triggerSaveInternal,
    isWorkflowVisible,
    setIsWorkflowVisible,
    setFocusNodeFn: ui.setFocusNodeFn,
    setFocusRelationshipFn: ui.setFocusRelationshipFn
  }
}
