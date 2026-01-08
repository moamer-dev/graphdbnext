'use client'

import { useState, useEffect, useRef } from 'react'
import { ModelBuilderCanvas } from './canvas/ModelBuilderCanvas'
import { NodePalette } from './palette/NodePalette'
import { NodeEditor } from './editor/NodeEditor'
import { RelationshipEditor } from './editor/RelationshipEditor'
import { useModelBuilderStore } from '../stores/modelBuilderStore'
import type { Relationship } from '../types'
import type { ActionCanvasNode } from '../stores/actionCanvasStore'
import { useWorkflowStore } from '../stores/workflowStore'
import { useSchemaImport, useSchemaExport } from '../hooks'
import { generateNodeTemplate, generateRelationshipTemplate } from '../services/parseService'
import { downloadFile } from '../utils/exportUtils'
import { exportWorkflowConfig, importWorkflowConfig } from '../utils/workflowConfigExport'
import { WorkflowSelector } from './workflow/WorkflowSelector'
import { convertBuilderToSchemaJson } from '../utils/schemaJsonConverter'
import { executeWorkflow } from '../services/workflowExecutor'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { cn } from '../utils/cn'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem
} from './ui/dropdown-menu'
import { Upload, PanelLeftClose, PanelLeftOpen, Download, PlayCircle, Circle, Link2, Wrench, Zap, Key, Sparkles, Lightbulb, AlertCircle, Settings, Workflow, CheckCircle2, FileText, X, Layout } from 'lucide-react'
import { AIChatbot } from './ai/AIChatbot'
import { SchemaDesignPanel } from './ai/SchemaDesignPanel'
import { WorkflowGenerationPanel } from './ai/WorkflowGenerationPanel'
import { AIAgentsPanel } from './ai/AIAgentsPanel'
import { ResizablePanel } from './ui/resizable-panel'
import { useAIFeature } from '../ai/config'
import { useWorkflowCanvasStore } from '../stores/workflowCanvasStore'
import { useToolCanvasStore } from '../stores/toolCanvasStore'
import { useActionCanvasStore } from '../stores/actionCanvasStore'
import { useXmlImportWizardStore } from '../stores/xmlImportWizardStore'
import { ToolConfigurationSidebar } from './sidebars/ToolConfigurationSidebar'
import { ActionConfigurationSidebar } from './sidebars/ActionConfigurationSidebar'
import { CredentialsManager } from './shared/CredentialsManager'
import { QuickSearch } from './palette/QuickSearch'
import { ExecutionProgress } from './workflow/ExecutionProgress'
import { useTabPersistence } from '../hooks/useTabPersistence'
import { OntologyCombobox } from './wizard/XmlImportWizard/components/OntologyCombobox'
import { useModelBuilderUI } from '../hooks/useModelBuilderUI'
import { toast } from '../utils/toast'
import { ImportSchemaDialog } from './dialogs/ImportSchemaDialog'
import { ImportWorkflowDialog } from './dialogs/ImportWorkflowDialog'
import { RunWorkflowDialog } from './dialogs/RunWorkflowDialog'
import type { WorkflowConfigExport } from '../utils/workflowConfigExport'
import { XmlCodePreview } from './editor/XmlCodePreview'
import { Switch } from './ui/switch'
import { Label } from './ui/label'

// Note: ResizablePanelGroup should be provided by the consuming app
// This is a placeholder - the consuming app should wrap this component

export interface WorkflowPersistence {
  modelId?: string
  onSaveWorkflow?: (workflow: {
    name: string
    description?: string
    config: unknown
  }) => Promise<{ id: string }>
  onUpdateWorkflow?: (id: string, workflow: {
    name?: string
    description?: string
    config?: unknown
  }) => Promise<void>
  onLoadWorkflows?: (modelId: string) => Promise<Array<{
    id: string
    name: string
    description?: string
    version: string
    createdAt: string
    updatedAt: string
  }>>
  onLoadWorkflow?: (id: string) => Promise<{
    id: string
    name: string
    description?: string
    config: unknown
  }>
}

export interface ModelBuilderProps {
  className?: string
  workflowPersistence?: WorkflowPersistence
  initialWorkflow?: {
    id: string
    name: string
    description?: string
    config: unknown
  }
  currentWorkflowName?: string
  availableWorkflows?: Array<{
    id: string
    name: string
    description?: string
    version: string
    createdAt: string
    updatedAt: string
  }>
  onWorkflowChange?: (workflowId: string) => void
}

function ModelBuilderContent({
  className,
  workflowPersistence,
  initialWorkflow,
  currentWorkflowName,
  availableWorkflows = [],
  onWorkflowChange
}: {
  className?: string
  workflowPersistence?: WorkflowPersistence
  initialWorkflow?: {
    id: string
    name: string
    description?: string
    config: unknown
  }
  currentWorkflowName?: string
  availableWorkflows?: Array<{
    id: string
    name: string
    description?: string
    version: string
    createdAt: string
    updatedAt: string
  }>
  onWorkflowChange?: (workflowId: string) => void
}) {
  const isSchemaDesignEnabled = useAIFeature('schemaDesignAgent')
  const isWorkflowGenerationEnabled = useAIFeature('workflowGenerationAgent')
  const ui = useModelBuilderUI()
  const {
    importDialogOpen,
    setImportDialogOpen,
    importFile,
    setImportFile,
    workflowConfigDialogOpen,
    setWorkflowConfigDialogOpen,
    workflowConfigFile,
    setWorkflowConfigFile,
    sidebarOpen,
    setSidebarOpen,
    nodesSidebarOpen,
    setNodesSidebarOpen,
    runDialogOpen,
    setRunDialogOpen,
    credentialsDialogOpen,
    setCredentialsDialogOpen,
    xmlFile,
    setXmlFile,
    running,
    setRunning,
    executionProgress,
    setExecutionProgress,
    graphPreview,
    setGraphPreview,
    fileInputRef,
    focusNodeFnRef,
    focusRelationshipFnRef
  } = ui

  const [leftTab, setLeftTab] = useTabPersistence<'nodes' | 'relationships' | 'tools' | 'actions'>(
    'model-builder-left-tab',
    'nodes',
    ['nodes', 'relationships', 'tools', 'actions']
  )
  const workflowLoadedRef = useRef(false)
  const [schemaDesignDialogOpen, setSchemaDesignDialogOpen] = useState(false)
  const [schemaDesignMode, setSchemaDesignMode] = useState<'suggest' | 'optimize' | 'validate'>('suggest')
  const [workflowGenerationDialogOpen, setWorkflowGenerationDialogOpen] = useState(false)
  const [importExportMenuOpen, setImportExportMenuOpen] = useState(false)
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false)
  const [agentsPanelOpen, setAgentsPanelOpen] = useState(false)
  const [agentsPanelWidth, setAgentsPanelWidth] = useState(400)
  const [workflowManagementDialogOpen, setWorkflowManagementDialogOpen] = useState(false)
  const [xmlPanelOpen, setXmlPanelOpen] = useState(false)
  const [xmlContent, setXmlContent] = useState<string>('')
  const [xmlPanelWidth, setXmlPanelWidth] = useState(600)
  const [xmlWrapWord, setXmlWrapWord] = useState(false)
  const [showToolbar, setShowToolbar] = useState(true)

  const selectedRelationship = useModelBuilderStore((state) => state.selectedRelationship)
  const selectedNode = useModelBuilderStore((state) => state.selectedNode)
  const nodes = useModelBuilderStore((state) => state.nodes)
  const relationships = useModelBuilderStore((state) => state.relationships)

  const metadata = useModelBuilderStore((state) => state.metadata)
  const updateMetadata = useModelBuilderStore((state) => state.updateMetadata)
  const rootNodeId = useModelBuilderStore((state) => state.rootNodeId)
  const setRootNodeId = useModelBuilderStore((state) => state.setRootNodeId)
  const selectedOntologyId = useModelBuilderStore((state) => state.selectedOntologyId)
  const setSelectedOntologyId = useModelBuilderStore((state) => state.setSelectedOntologyId)
  const isSemanticEnabled = useModelBuilderStore((state) => state.isSemanticEnabled)
  const { importing, importError, importSchema } = useSchemaImport()
  const { exportToJsonFile, exportToMarkdownFile, hasContent } = useSchemaExport()
  const stepsByNodeId = useWorkflowStore((state) => state.stepsByNodeId)
  const workflowCanvasNodes = useWorkflowCanvasStore((state) => state.nodes)
  const selectedWfNodeId = useWorkflowCanvasStore((state) => state.selectedNodeId)
  const selectedToolNodeId = useToolCanvasStore((state) => state.selectedNodeId)
  const selectedActionNodeId = useActionCanvasStore((state) => state.selectedNodeId)
  const xmlFileFromWizard = useXmlImportWizardStore((state) => state.selectedFile)
  const toolNodes = useToolCanvasStore((state) => state.nodes)
  const toolEdges = useToolCanvasStore((state) => state.edges)
  const actionNodes = useActionCanvasStore((state) => state.nodes)
  const actionEdges = useActionCanvasStore((state) => state.edges)
  const addToolNode = useToolCanvasStore((state) => state.addNode)

  // Track the last loaded workflow ID to detect changes
  const lastWorkflowIdRef = useRef<string | null>(null)

  // Load initial workflow when provided (after nodes are loaded)
  useEffect(() => {
    if (initialWorkflow && nodes.length > 0) {
      // Check if this is a different workflow than the last one loaded
      const isDifferentWorkflow = lastWorkflowIdRef.current !== initialWorkflow.id

      if (isDifferentWorkflow) {
        // Reset the loaded flag and update the last workflow ID
        workflowLoadedRef.current = false
        lastWorkflowIdRef.current = initialWorkflow.id

        // Clear existing tools and actions before loading new workflow
        useToolCanvasStore.getState().clear()
        useActionCanvasStore.getState().clear()

        workflowLoadedRef.current = true

        // Small delay to ensure stores are ready
        setTimeout(() => {
          try {
            const config = initialWorkflow.config as WorkflowConfigExport
            handleLoadWorkflowFromConfig(config)
          } catch (error) {
            console.error('Error loading initial workflow:', error)
          }
        }, 100)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialWorkflow, nodes])

  // Load XML content when XML file is available
  useEffect(() => {
    const loadXmlContent = async () => {
      const xmlFileToLoad = xmlFileFromWizard || xmlFile
      if (xmlFileToLoad) {
        try {
          const text = await xmlFileToLoad.text()
          setXmlContent(text)
        } catch (error) {
          console.error('Error loading XML file:', error)
          setXmlContent('')
        }
      } else {
        setXmlContent('')
      }
    }
    loadXmlContent()
  }, [xmlFile, xmlFileFromWizard])

  // Listen for workflow change events
  useEffect(() => {
    const handleWorkflowLoad = (event: CustomEvent<{ workflow: { id: string; name: string; description?: string; config: unknown } }>) => {
      const { workflow } = event.detail
      workflowLoadedRef.current = false // Reset to allow loading

      // Clear existing tools and actions before loading new workflow
      useToolCanvasStore.getState().clear()
      useActionCanvasStore.getState().clear()

      setTimeout(() => {
        try {
          const config = workflow.config as WorkflowConfigExport
          handleLoadWorkflowFromConfig(config)
        } catch (error) {
          console.error('Error loading workflow from event:', error)
        }
      }, 100)
    }

    window.addEventListener('model-builder:load-workflow', handleWorkflowLoad as EventListener)
    return () => {
      window.removeEventListener('model-builder:load-workflow', handleWorkflowLoad as EventListener)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const addToolEdge = useToolCanvasStore((state) => state.addEdge)
  const addActionNode = useActionCanvasStore((state) => state.addNode)
  const addActionEdge = useActionCanvasStore((state) => state.addEdge)
  const updateActionNode = useActionCanvasStore((state) => state.updateNode)
  const addRelationship = useModelBuilderStore((state) => state.addRelationship)

  const handleImport = async () => {
    if (!importFile) return
    const result = await importSchema(importFile)
    if (result) {
      setImportDialogOpen(false)
      setImportFile(null)
    }
  }

  const handleDownloadNodeTemplate = () => {
    const csvContent = generateNodeTemplate()
    downloadFile(csvContent, 'node-template.csv', 'text/csv;charset=utf-8;')
  }

  const handleDownloadRelationshipTemplate = () => {
    const csvContent = generateRelationshipTemplate()
    downloadFile(csvContent, 'relationship-template.csv', 'text/csv;charset=utf-8;')
  }

  const getCurrentWorkflowConfig = (): WorkflowConfigExport | null => {
    try {
      // Get fresh values directly from stores to ensure we have the latest configs
      const currentNodes = useModelBuilderStore.getState().nodes
      const currentRelationships = useModelBuilderStore.getState().relationships
      const currentToolNodes = useToolCanvasStore.getState().nodes
      const currentToolEdges = useToolCanvasStore.getState().edges
      const currentActionNodes = useActionCanvasStore.getState().nodes
      const currentActionEdges = useActionCanvasStore.getState().edges

      const configJson = exportWorkflowConfig(
        currentNodes,
        currentRelationships,
        currentToolNodes,
        currentToolEdges,
        currentActionNodes,
        currentActionEdges
      )
      return JSON.parse(configJson) as WorkflowConfigExport
    } catch (error) {
      console.error('Error exporting workflow config:', error)
      return null
    }
  }

  const handleExportWorkflowConfig = () => {
    const config = getCurrentWorkflowConfig()
    if (!config) {
      toast.error('Failed to export workflow')
      return
    }
    const fileName = metadata.name
      ? `${metadata.name.replace(/[^a-z0-9]/gi, '_')}-workflow-config.json`
      : 'workflow-config.json'
    downloadFile(JSON.stringify(config, null, 2), fileName, 'application/json;charset=utf-8;')
  }

  const handleLoadWorkflowFromConfig = (config: WorkflowConfigExport) => {
    try {
      const imported = importWorkflowConfig(JSON.stringify(config), nodes)

      // Check if nodes exist
      const missingNodes = new Set<string>()
      imported.relationships.forEach(rel => {
        const relWithLabels = rel as Relationship & { fromNodeLabel?: string; toNodeLabel?: string }
        const fromNode = relWithLabels.fromNodeLabel
          ? nodes.find(n => n.label === relWithLabels.fromNodeLabel)
          : nodes.find(n => n.id === rel.from)
        const toNode = relWithLabels.toNodeLabel
          ? nodes.find(n => n.label === relWithLabels.toNodeLabel)
          : nodes.find(n => n.id === rel.to)
        if (!fromNode && relWithLabels.fromNodeLabel) missingNodes.add(relWithLabels.fromNodeLabel)
        if (!toNode && relWithLabels.toNodeLabel) missingNodes.add(relWithLabels.toNodeLabel)
      })

      if (missingNodes.size > 0) {
        const missingLabels = Array.from(missingNodes).slice(0, 10).join(', ')
        console.warn(`Warning: Some nodes are missing. Missing nodes: ${missingLabels}${missingNodes.size > 10 ? '...' : ''}`)
      }

      // Add relationships
      let relationshipsAdded = 0
      imported.relationships.forEach(rel => {
        try {
          addRelationship(rel)
          relationshipsAdded++
        } catch (err) {
          console.warn('Failed to add relationship:', rel, err)
        }
      })

      // Add tools and track IDs by target node label + type
      // First, get existing tools to check for duplicates
      const existingToolNodes = useToolCanvasStore.getState().nodes
      const toolKeyToId = new Map<string, string>()
      let toolsAdded = 0
      imported.tools.forEach(tool => {
        try {
          // Imported tools have targetNodeId, not targetNodeLabel
          const targetNode = nodes.find(n => n.id === tool.targetNodeId)
          if (targetNode) {
            // Check if tool already exists (same target node + same type)
            const toolKey = `${targetNode.label}::${tool.type}`
            const existingTool = existingToolNodes.find(t =>
              t.targetNodeId === targetNode.id && t.type === tool.type
            )

            if (existingTool) {
              // Tool already exists, use existing ID
              toolKeyToId.set(toolKey, existingTool.id)
              return
            }

            // Use the position from the imported tool if available, otherwise position near target node
            const toolPosition = tool.position || {
              x: targetNode.position.x + 250,
              y: targetNode.position.y
            }

            const realId = addToolNode({
              ...tool,
              targetNodeId: targetNode.id,
              position: toolPosition
            })

            // Create edge from main node to tool (if not already in toolEdges)
            const hasNodeToToolEdge = imported.toolEdges.some(edge =>
              edge.sourceNodeLabel === targetNode.label &&
              edge.targetToolLabel === `${targetNode.label}::${tool.type}`
            )

            if (!hasNodeToToolEdge) {
              addToolEdge({
                source: targetNode.id,
                target: realId,
                sourceHandle: 'tools',
                targetHandle: 'input-0'
              })
            }

            toolKeyToId.set(toolKey, realId)
            toolsAdded++
          } else {
            const targetNodeLabel = tool.targetNodeId ? nodes.find(n => n.id === tool.targetNodeId)?.label : 'unknown'
            console.warn('Tool skipped - target node not found:', targetNodeLabel, tool.label)
          }
        } catch (err) {
          console.warn('Failed to add tool:', tool, err)
        }
      })

      // Add actions and track IDs by label (support multiple actions with same label)
      // Also track mapping from imported index to real ID for remapping children
      const actionLabelToIds = new Map<string, string[]>()
      const actionIdToIndex = new Map<string, number>()
      const importedActionIndexToRealId = new Map<number, string>() // Track mapping from imported index to real ID
      let actionsAdded = 0
      imported.actions.forEach((action, index) => {
        try {
          const realId = addActionNode(action)
          const existing = actionLabelToIds.get(action.label) || []
          actionLabelToIds.set(action.label, [...existing, realId])
          importedActionIndexToRealId.set(index, realId)
          actionIdToIndex.set(realId, index)
          actionsAdded++
        } catch (err) {
          console.warn('Failed to add action:', action, err)
        }
      })

      // Second pass: Create child actions and add them to their parent groups
      imported.actions.forEach((importedAction, index) => {
        if (importedAction.isGroup && (importedAction as any)._childActions) {
          const groupRealId = importedActionIndexToRealId.get(index)
          if (groupRealId) {
            const childActions = (importedAction as any)._childActions as Array<Omit<ActionCanvasNode, 'id'>>
            const remappedChildren: string[] = []

            // Create each child action and add it to the group
            childActions.forEach((childAction) => {
              try {
                const childRealId = addActionNode(childAction)
                remappedChildren.push(childRealId)
                // Also track by label for edge matching
                const existing = actionLabelToIds.get(childAction.label) || []
                actionLabelToIds.set(childAction.label, [...existing, childRealId])
              } catch (err) {
                console.warn('Failed to add child action:', childAction, err)
              }
            })

            // Update the action group with remapped children
            if (remappedChildren.length > 0) {
              updateActionNode(groupRealId, { children: remappedChildren })
            }
          }
        }
      })

      // Add tool edges
      let toolEdgesAdded = 0
      imported.toolEdges.forEach((edge) => {
        // Handle node-to-tool edges (source is a node, not a tool)
        let sourceId: string | undefined
        if (edge.sourceNodeLabel) {
          // Source is a node (new format)
          const sourceNode = nodes.find(n => n.label === edge.sourceNodeLabel)
          if (!sourceNode) {
            console.warn('Tool edge skipped - source node not found:', edge.sourceNodeLabel)
            return
          }
          sourceId = sourceNode.id
        } else if (edge.sourceHandle === 'tools' && (!edge.sourceToolLabel || edge.sourceToolLabel === '')) {
          // Backward compatibility: empty sourceToolLabel with sourceHandle='tools' means source is a node
          // Try to infer from target tool's node label (most common case: node connects to its own tool)
          if (edge.targetToolLabel) {
            const [nodeLabel] = edge.targetToolLabel.split('::')
            const sourceNode = nodes.find(n => n.label === nodeLabel)
            if (sourceNode) {
              sourceId = sourceNode.id
            } else {
              // If we can't find the node from the target tool label, try to find any node
              // that has a tool matching the target tool label
              const targetToolKey = edge.targetToolLabel
              const targetToolId = toolKeyToId.get(targetToolKey)
              if (targetToolId) {
                const targetTool = toolNodes.find(t => t.id === targetToolId)
                if (targetTool?.targetNodeId) {
                  sourceId = targetTool.targetNodeId
                } else {
                  console.warn('Tool edge skipped - cannot infer source node from target tool:', edge.targetToolLabel)
                  return
                }
              } else {
                console.warn('Tool edge skipped - target tool not found:', edge.targetToolLabel)
                return
              }
            }
          } else {
            console.warn('Tool edge skipped - cannot infer source node without target tool label')
            return
          }
        } else if (edge.sourceToolLabel) {
          // Source is a tool
          sourceId = toolKeyToId.get(edge.sourceToolLabel)
          if (!sourceId) {
            console.warn('Tool edge skipped - source tool not found:', edge.sourceToolLabel)
            return
          }
        } else {
          console.warn('Tool edge skipped - no source specified')
          return
        }

        if (edge.targetToolLabel) {
          const targetId = toolKeyToId.get(edge.targetToolLabel)
          if (targetId) {
            addToolEdge({
              source: sourceId,
              target: targetId,
              sourceHandle: edge.sourceHandle,
              targetHandle: edge.targetHandle
            })
            toolEdgesAdded++
          }
        } else if (edge.targetActionLabel) {
          // Find action by label - if multiple exist, use the one that matches the source tool
          const candidateIds = actionLabelToIds.get(edge.targetActionLabel) || []
          let targetId: string | undefined

          if (candidateIds.length === 1) {
            targetId = candidateIds[0]
          } else if (candidateIds.length > 1) {
            // Multiple actions with same label - find the one connected to this tool in actionEdges
            const matchingEdge = imported.actionEdges.find(ae =>
              (ae.sourceToolLabel === edge.sourceToolLabel ||
                (edge.sourceNodeLabel && !ae.sourceToolLabel)) &&
              ae.targetActionLabel === edge.targetActionLabel
            )
            if (matchingEdge) {
              // Find the action index in the original actions array by matching config/position
              const actionIndex = imported.actions.findIndex(a =>
                a.label === edge.targetActionLabel &&
                JSON.stringify(a.config) === JSON.stringify(imported.actions.find(a2 =>
                  imported.actionEdges.findIndex(ae2 =>
                    (ae2.sourceToolLabel === edge.sourceToolLabel ||
                      (edge.sourceNodeLabel && !ae2.sourceToolLabel)) &&
                    ae2.targetActionLabel === a2.label
                  ) !== -1
                )?.config)
              )
              // Use the action at the same index in actionEdges as this edge
              const edgeIndex = imported.actionEdges.findIndex(ae =>
                (ae.sourceToolLabel === edge.sourceToolLabel ||
                  (edge.sourceNodeLabel && !ae.sourceToolLabel)) &&
                ae.targetActionLabel === edge.targetActionLabel
              )
              if (edgeIndex >= 0 && edgeIndex < candidateIds.length) {
                targetId = candidateIds[edgeIndex]
              } else {
                targetId = candidateIds[0]
              }
            } else {
              targetId = candidateIds[0]
            }
          }

          if (targetId) {
            addToolEdge({
              source: sourceId,
              target: targetId,
              sourceHandle: edge.sourceHandle,
              targetHandle: edge.targetHandle
            })
            toolEdgesAdded++
          }
        }
      })

      // Add action edges
      let actionEdgesAdded = 0
      const connectedActionIds = new Set<string>()
      // Map to track which action candidate index to use for each unique tool+label combination
      // This ensures that Verse::tool:if -> Skip uses a different Skip action than Seg::tool:if -> Skip
      const toolLabelToActionIndex = new Map<string, number>()
      // Track which action IDs have been used for each label
      const labelToUsedIndices = new Map<string, Set<number>>()

      imported.actionEdges.forEach((edge) => {
        let sourceId: string | undefined

        if (edge.sourceToolLabel) {
          sourceId = toolKeyToId.get(edge.sourceToolLabel)
        }

        if (!sourceId) {
          console.warn('Action edge skipped - source tool not found:', edge.sourceToolLabel)
          return
        }

        const candidateIds = actionLabelToIds.get(edge.targetActionLabel) || []
        if (candidateIds.length === 0) {
          console.warn('Action edge skipped - target action not found:', edge.targetActionLabel)
          return
        }

        // Create a unique key for this tool+action combination
        const toolActionKey = `${edge.sourceToolLabel}::${edge.targetActionLabel}`
        let actionIndex = toolLabelToActionIndex.get(toolActionKey)

        if (actionIndex === undefined) {
          // First time seeing this combination, use index 0
          actionIndex = 0
          toolLabelToActionIndex.set(toolActionKey, 0)
        } else {
          // Check if this index has already been used for this label
          const usedIndices = labelToUsedIndices.get(edge.targetActionLabel) || new Set()
          if (usedIndices.has(actionIndex)) {
            // This index is already used, try the next one
            actionIndex = (actionIndex + 1) % candidateIds.length
            toolLabelToActionIndex.set(toolActionKey, actionIndex)
          }
        }

        // Mark this index as used for this label
        const usedIndices = labelToUsedIndices.get(edge.targetActionLabel) || new Set()
        usedIndices.add(actionIndex)
        labelToUsedIndices.set(edge.targetActionLabel, usedIndices)

        const targetId = candidateIds[actionIndex]

        if (targetId && !connectedActionIds.has(targetId)) {
          addActionEdge({
            source: sourceId,
            target: targetId,
            sourceHandle: edge.sourceHandle,
            targetHandle: edge.targetHandle
          })
          connectedActionIds.add(targetId)
          actionEdgesAdded++
        }
      })

      toast.success('Workflow loaded successfully')
    } catch (error) {
      toast.error('Failed to load workflow')
      console.error('Error loading workflow:', error)
    }
  }

  const [importingWorkflowConfig, setImportingWorkflowConfig] = useState(false)
  const [workflowConfigImportError, setWorkflowConfigImportError] = useState<string | null>(null)

  const handleImportWorkflowConfig = async () => {
    if (!workflowConfigFile) return

    setImportingWorkflowConfig(true)
    setWorkflowConfigImportError(null)

    try {
      const text = await workflowConfigFile.text()
      const imported = importWorkflowConfig(text, nodes)

      // Check if nodes exist
      const missingNodes = new Set<string>()
      imported.relationships.forEach(rel => {
        const relWithLabels = rel as Relationship & { fromNodeLabel?: string; toNodeLabel?: string }
        const fromNode = relWithLabels.fromNodeLabel
          ? nodes.find(n => n.label === relWithLabels.fromNodeLabel)
          : nodes.find(n => n.id === rel.from)
        const toNode = relWithLabels.toNodeLabel
          ? nodes.find(n => n.label === relWithLabels.toNodeLabel)
          : nodes.find(n => n.id === rel.to)
        if (!fromNode && relWithLabels.fromNodeLabel) missingNodes.add(relWithLabels.fromNodeLabel)
        if (!toNode && relWithLabels.toNodeLabel) missingNodes.add(relWithLabels.toNodeLabel)
      })

      if (missingNodes.size > 0) {
        const missingLabels = Array.from(missingNodes).slice(0, 10).join(', ')
        alert(`Warning: Some nodes are missing. Please ensure all nodes are created first.\n\nMissing nodes: ${missingLabels}${missingNodes.size > 10 ? '...' : ''}\n\nRelationships and tools for missing nodes will be skipped.`)
      }

      // Add relationships
      let relationshipsAdded = 0
      imported.relationships.forEach(rel => {
        try {
          addRelationship(rel)
          relationshipsAdded++
        } catch (err) {
          console.warn('Failed to add relationship:', rel, err)
        }
      })

      // Add tools and track IDs by target node label + type
      const toolKeyToId = new Map<string, string>()
      let toolsAdded = 0
      imported.tools.forEach(tool => {
        try {
          const targetNode = nodes.find(n => n.id === tool.targetNodeId)
          if (targetNode) {
            // Position tool near its target node (to the right)
            const toolPosition = {
              x: targetNode.position.x + 250,
              y: targetNode.position.y
            }

            const realId = addToolNode({
              ...tool,
              position: toolPosition
            })

            // Create edge from main node to tool
            addToolEdge({
              source: targetNode.id,
              target: realId,
              sourceHandle: 'tools',
              targetHandle: 'input-0'
            })

            const key = `${targetNode.label}::${tool.type}`
            toolKeyToId.set(key, realId)
            toolsAdded++
          } else {
            console.warn('Tool skipped - target node not found:', tool.targetNodeId, tool.label)
          }
        } catch (err) {
          console.warn('Failed to add tool:', tool, err)
        }
      })

      // Add actions and track IDs by label (support multiple actions with same label)
      // Also track mapping from imported index to real ID for remapping children
      const actionLabelToIds = new Map<string, string[]>()
      const actionIdToIndex = new Map<string, number>()
      const importedActionIndexToRealId = new Map<number, string>() // Track mapping from imported index to real ID
      let actionsAdded = 0
      imported.actions.forEach((action, index) => {
        try {
          const realId = addActionNode(action)
          const existing = actionLabelToIds.get(action.label) || []
          actionLabelToIds.set(action.label, [...existing, realId])
          importedActionIndexToRealId.set(index, realId)
          actionIdToIndex.set(realId, index)
          actionsAdded++
        } catch (err) {
          console.warn('Failed to add action:', action, err)
        }
      })

      // Second pass: Create child actions and add them to their parent groups
      imported.actions.forEach((importedAction, index) => {
        if (importedAction.isGroup && (importedAction as any)._childActions) {
          const groupRealId = importedActionIndexToRealId.get(index)
          if (groupRealId) {
            const childActions = (importedAction as any)._childActions as Array<Omit<ActionCanvasNode, 'id'>>
            const remappedChildren: string[] = []

            // Create each child action and add it to the group
            childActions.forEach((childAction) => {
              try {
                const childRealId = addActionNode(childAction)
                remappedChildren.push(childRealId)
                // Also track by label for edge matching
                const existing = actionLabelToIds.get(childAction.label) || []
                actionLabelToIds.set(childAction.label, [...existing, childRealId])
              } catch (err) {
                console.warn('Failed to add child action:', childAction, err)
              }
            })

            // Update the action group with remapped children
            if (remappedChildren.length > 0) {
              updateActionNode(groupRealId, { children: remappedChildren })
            }
          }
        }
      })

      // Add tool edges
      let toolEdgesAdded = 0
      imported.toolEdges.forEach((edge) => {
        // Handle node-to-tool edges (source is a node, not a tool)
        let sourceId: string | undefined
        if (edge.sourceNodeLabel) {
          // Source is a node (new format)
          const sourceNode = nodes.find(n => n.label === edge.sourceNodeLabel)
          if (!sourceNode) {
            console.warn('Tool edge skipped - source node not found:', edge.sourceNodeLabel)
            return
          }
          sourceId = sourceNode.id
        } else if (edge.sourceHandle === 'tools' && (!edge.sourceToolLabel || edge.sourceToolLabel === '')) {
          // Backward compatibility: empty sourceToolLabel with sourceHandle='tools' means source is a node
          // Try to infer from target tool's node label (most common case: node connects to its own tool)
          if (edge.targetToolLabel) {
            const [nodeLabel] = edge.targetToolLabel.split('::')
            const sourceNode = nodes.find(n => n.label === nodeLabel)
            if (sourceNode) {
              sourceId = sourceNode.id
            } else {
              // If we can't find the node from the target tool label, try to find any node
              // that has a tool matching the target tool label
              const targetToolKey = edge.targetToolLabel
              const targetToolId = toolKeyToId.get(targetToolKey)
              if (targetToolId) {
                const targetTool = toolNodes.find(t => t.id === targetToolId)
                if (targetTool?.targetNodeId) {
                  sourceId = targetTool.targetNodeId
                } else {
                  console.warn('Tool edge skipped - cannot infer source node from target tool:', edge.targetToolLabel)
                  return
                }
              } else {
                console.warn('Tool edge skipped - target tool not found:', edge.targetToolLabel)
                return
              }
            }
          } else {
            console.warn('Tool edge skipped - cannot infer source node without target tool label')
            return
          }
        } else if (edge.sourceToolLabel) {
          // Source is a tool
          sourceId = toolKeyToId.get(edge.sourceToolLabel)
          if (!sourceId) {
            console.warn('Tool edge skipped - source tool not found:', edge.sourceToolLabel)
            return
          }
        } else {
          console.warn('Tool edge skipped - no source specified')
          return
        }

        if (edge.targetToolLabel) {
          const targetId = toolKeyToId.get(edge.targetToolLabel)
          if (targetId) {
            addToolEdge({
              source: sourceId,
              target: targetId,
              sourceHandle: edge.sourceHandle,
              targetHandle: edge.targetHandle
            })
            toolEdgesAdded++
          }
        } else if (edge.targetActionLabel) {
          // Find action by label - if multiple exist, use the one that matches the source tool
          const candidateIds = actionLabelToIds.get(edge.targetActionLabel) || []
          let targetId: string | undefined

          if (candidateIds.length === 1) {
            targetId = candidateIds[0]
          } else if (candidateIds.length > 1) {
            // Multiple actions with same label - find the one connected to this tool in actionEdges
            const matchingEdge = imported.actionEdges.find(ae =>
              (ae.sourceToolLabel === edge.sourceToolLabel ||
                (edge.sourceNodeLabel && !ae.sourceToolLabel)) &&
              ae.targetActionLabel === edge.targetActionLabel
            )
            if (matchingEdge) {
              // Find the action index in the original actions array by matching config/position
              const actionIndex = imported.actions.findIndex(a =>
                a.label === edge.targetActionLabel &&
                JSON.stringify(a.config) === JSON.stringify(imported.actions.find(a2 =>
                  imported.actionEdges.findIndex(ae2 =>
                    (ae2.sourceToolLabel === edge.sourceToolLabel ||
                      (edge.sourceNodeLabel && !ae2.sourceToolLabel)) &&
                    ae2.targetActionLabel === a2.label
                  ) !== -1
                )?.config)
              )
              // Use the action at the same index in actionEdges as this edge
              const edgeIndex = imported.actionEdges.findIndex(ae =>
                (ae.sourceToolLabel === edge.sourceToolLabel ||
                  (edge.sourceNodeLabel && !ae.sourceToolLabel)) &&
                ae.targetActionLabel === edge.targetActionLabel
              )
              if (edgeIndex >= 0 && edgeIndex < candidateIds.length) {
                targetId = candidateIds[edgeIndex]
              } else {
                targetId = candidateIds[0]
              }
            } else {
              targetId = candidateIds[0]
            }
          }

          if (targetId) {
            addToolEdge({
              source: sourceId,
              target: targetId,
              sourceHandle: edge.sourceHandle,
              targetHandle: edge.targetHandle
            })
            toolEdgesAdded++
          }
        }
      })

      // Add action edges
      let actionEdgesAdded = 0
      const connectedActionIds = new Set<string>()
      // Map to track which action candidate index to use for each unique tool+label combination
      // This ensures that Verse::tool:if -> Skip uses a different Skip action than Seg::tool:if -> Skip
      const toolLabelToActionIndex = new Map<string, number>()
      // Track which action IDs have been used for each label
      const labelToUsedIndices = new Map<string, Set<number>>()

      imported.actionEdges.forEach((edge) => {
        const sourceId = toolKeyToId.get(edge.sourceToolLabel)
        if (!sourceId) {
          console.warn('Action edge skipped - source tool not found:', edge.sourceToolLabel)
          return
        }

        // Find action by label - if multiple exist, use the one that matches this specific tool
        const candidateIds = actionLabelToIds.get(edge.targetActionLabel) || []
        let targetId: string | undefined

        if (candidateIds.length === 1) {
          targetId = candidateIds[0]
        } else if (candidateIds.length > 1) {
          // Multiple actions with same label - match by unique tool+label combination
          const key = `${edge.sourceToolLabel}::${edge.targetActionLabel}`
          let actionCandidateIndex = toolLabelToActionIndex.get(key)

          if (actionCandidateIndex === undefined) {
            // First time seeing this tool+label combo - find an unused action
            const usedIndices = labelToUsedIndices.get(edge.targetActionLabel) || new Set<number>()

            // Find the first unused action index
            for (let i = 0; i < candidateIds.length; i++) {
              if (!usedIndices.has(i)) {
                actionCandidateIndex = i
                usedIndices.add(i)
                labelToUsedIndices.set(edge.targetActionLabel, usedIndices)
                break
              }
            }

            // If all actions are used, use the first one (shouldn't happen in normal cases)
            if (actionCandidateIndex === undefined) {
              actionCandidateIndex = 0
            }

            toolLabelToActionIndex.set(key, actionCandidateIndex)
          }

          // Get the action ID at the calculated index
          targetId = candidateIds[actionCandidateIndex]
        }

        if (targetId) {
          addActionEdge({
            source: sourceId,
            target: targetId,
            sourceHandle: edge.sourceHandle,
            targetHandle: edge.targetHandle
          })
          connectedActionIds.add(targetId)
          actionEdgesAdded++
        }
      })

      // Connect unconnected actions to tools
      // Find actions that weren't connected via actionEdges
      const allActionIds = new Set<string>()
      actionLabelToIds.forEach(ids => ids.forEach(id => allActionIds.add(id)))
      const unconnectedActionIds = Array.from(allActionIds).filter(id => !connectedActionIds.has(id))

      // Connect each unconnected action to the last tool in the chain
      if (unconnectedActionIds.length > 0 && toolKeyToId.size > 0) {
        // Get all tool IDs and find the last tool that was added
        const toolIds = Array.from(toolKeyToId.values())
        // Use the last tool (or first if only one)
        const connectingToolId = toolIds[toolIds.length - 1]
        // Find the tool in the imported tools to get its outputs
        const connectingTool = imported.tools.find(t => {
          const targetNode = nodes.find(n => n.id === t.targetNodeId)
          if (!targetNode) return false
          const key = `${targetNode.label}::${t.type}`
          return toolKeyToId.get(key) === connectingToolId
        })

        if (connectingTool && connectingTool.outputs && connectingTool.outputs.length > 0) {
          unconnectedActionIds.forEach(actionId => {
            addActionEdge({
              source: connectingToolId,
              target: actionId,
              sourceHandle: connectingTool.outputs![0]?.id || 'output-1',
              targetHandle: 'input-1'
            })
            actionEdgesAdded++
          })
        }
      }

      // Show success message
      const originalCounts = imported._originalCounts || {
        relationships: imported.relationships.length,
        tools: imported.tools.length,
        actions: imported.actions.length,
        toolEdges: imported.toolEdges.length,
        actionEdges: imported.actionEdges.length
      }
      const message = `Import completed!\n\n` +
        `Relationships: ${relationshipsAdded}/${originalCounts.relationships}\n` +
        `Tools: ${toolsAdded}/${originalCounts.tools}\n` +
        `Actions: ${actionsAdded}/${originalCounts.actions}\n` +
        `Tool Edges: ${toolEdgesAdded}/${originalCounts.toolEdges}\n` +
        `Action Edges: ${actionEdgesAdded}/${originalCounts.actionEdges}`

      if (relationshipsAdded === 0 && toolsAdded === 0 && actionsAdded === 0) {
        alert(`Import failed: No items were imported.\n\nPlease ensure:\n1. All nodes are created in the model builder\n2. Node labels match the configuration file\n\n${message}`)
      } else {
        alert(message)
      }

      setWorkflowConfigDialogOpen(false)
      setWorkflowConfigFile(null)
      setWorkflowConfigImportError(null)
    } catch (err) {
      console.error('Failed to import workflow config:', err)
      setWorkflowConfigImportError(err instanceof Error ? err.message : 'Failed to import workflow configuration')
      toast.error(`Failed to import workflow config: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setImportingWorkflowConfig(false)
    }
  }

  const handleRunWorkflow = async () => {
    // Get XML file from wizard store or local state
    const xmlFileToUse = xmlFileFromWizard || xmlFile || (fileInputRef.current?.files?.[0] as File)

    if (!xmlFileToUse) {
      setGraphPreview({
        items: [],
        fullGraph: []
      })
      return
    }

    setRunning(true)
    setGraphPreview(null)
    setExecutionProgress({ current: 0, total: 100, currentStep: 'Loading XML...' })

    try {
      const text = await xmlFileToUse.text()
      setExecutionProgress({ current: 10, total: 100, currentStep: 'Converting schema...' })

      const schemaJson = convertBuilderToSchemaJson(nodes, relationships)
      setExecutionProgress({ current: 20, total: 100, currentStep: 'Executing workflow...' })

      // Use new workflow executor V2 that handles tools and actions
      const graph = executeWorkflow({
        xmlContent: text,
        schemaJson,
        nodes,
        relationships,
        toolNodes,
        toolEdges,
        actionNodes,
        actionEdges,
        startNodeId: rootNodeId || undefined
      })

      setExecutionProgress({ current: 90, total: 100, currentStep: 'Processing results...' })

      const graphItems = graph.map(item => ({ ...item } as Record<string, unknown>))
      setGraphPreview({
        items: graphItems.slice(0, 200),
        fullGraph: graphItems
      })

      setExecutionProgress({ current: 100, total: 100, currentStep: 'Complete' })
      toast.success(`Graph generated successfully with ${graphItems.length} items`)
    } catch (err) {
      setGraphPreview({
        items: [],
        fullGraph: []
      })
      toast.error(err instanceof Error ? err.message : 'Failed to generate graph')
    } finally {
      setRunning(false)
      setTimeout(() => setExecutionProgress(null), 2000)
    }
  }

  const content = (
    <div className={className}>
      <QuickSearch
        nodes={nodes.map(n => ({ id: n.id, label: n.label, type: n.type }))}
        tools={toolNodes.map(t => ({ id: t.id, label: t.label, type: t.type }))}
        actions={actionNodes.map(a => ({ id: a.id, label: a.label, type: a.type }))}
        relationships={relationships.map(r => ({ id: r.id, type: r.type || '', from: r.from, to: r.to }))}
        onSelectNode={(id) => useModelBuilderStore.getState().selectNode(id)}
        onSelectTool={(id) => useToolCanvasStore.getState().selectNode(id)}
        onSelectAction={(id) => useActionCanvasStore.getState().selectNode(id)}
        onSelectRelationship={(id) => useModelBuilderStore.getState().selectRelationship(id)}
      />
      <div className="flex items-center gap-3 p-3 border-b bg-background">
        <Input
          value={metadata.name}
          onChange={(e) => updateMetadata({ name: e.target.value })}
          placeholder="Model name"
          className="w-64 h-8 text-sm"
        />
        {workflowPersistence && availableWorkflows.length > 0 && (
          <WorkflowSelector
            workflows={availableWorkflows}
            currentWorkflowId={initialWorkflow?.id || null}
            onWorkflowChange={onWorkflowChange || (() => { })}
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
        <div className="flex items-center gap-2">
          {/* Import/Export Menu */}
          <DropdownMenu open={importExportMenuOpen} onOpenChange={setImportExportMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs">
                <Download className="h-3 w-3 mr-1" /> Import/Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel>Import</DropdownMenuLabel>
              <DropdownMenuItem
                onSelect={() => {
                  setImportExportMenuOpen(false)
                  setImportDialogOpen(true)
                }}
              >
                <Upload className="h-3 w-3 mr-2" />
                Import Schema
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  setImportExportMenuOpen(false)
                  setWorkflowConfigDialogOpen(true)
                }}
              >
                <Upload className="h-3 w-3 mr-2" />
                Import Workflow
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Export</DropdownMenuLabel>
              {hasContent && (
                <>
                  <DropdownMenuItem
                    onSelect={() => {
                      setImportExportMenuOpen(false)
                      exportToJsonFile()
                    }}
                  >
                    <Download className="h-3 w-3 mr-2" />
                    Export JSON
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => {
                      setImportExportMenuOpen(false)
                      exportToMarkdownFile()
                    }}
                  >
                    <Download className="h-3 w-3 mr-2" />
                    Export MD
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => {
                      setImportExportMenuOpen(false)
                      handleExportWorkflowConfig()
                    }}
                  >
                    <Download className="h-3 w-3 mr-2" />
                    Export Workflow
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem
                onSelect={() => {
                  setImportExportMenuOpen(false)
                  handleDownloadNodeTemplate()
                }}
              >
                <Download className="h-3 w-3 mr-2" />
                Node CSV Template
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  setImportExportMenuOpen(false)
                  handleDownloadRelationshipTemplate()
                }}
              >
                <Download className="h-3 w-3 mr-2" />
                Relationship CSV Template
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* XML Preview Toggle */}
          {xmlContent && (
            <div className="flex items-center gap-1.5 border rounded-md px-2 py-1">
              <Label htmlFor="show-xml-preview" className="text-[12px] text-muted-foreground cursor-pointer" title="Show XML Preview">
                {/* <FileText className="h-3 w-3" /> */} XML Preview
              </Label>
              <Switch
                id="show-xml-preview"
                checked={xmlPanelOpen}
                onCheckedChange={setXmlPanelOpen}
                className="scale-75"
              />
            </div>
          )}

          {/* Ontology Selector - only shown when semantic enrichment is enabled */}
          {isSemanticEnabled && (
            <div className="flex items-center gap-2 mr-2">
              <OntologyCombobox
                value={selectedOntologyId || undefined}
                onValueChange={(id) => setSelectedOntologyId(id || null)}
                className="h-8 w-[250px]"
              />
            </div>
          )}

          {/* AI Agents Button */}
          {(isSchemaDesignEnabled || isWorkflowGenerationEnabled) && (
            <Button
              variant={agentsPanelOpen ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs"
              onClick={() => setAgentsPanelOpen(!agentsPanelOpen)}
            >
              <Sparkles className="h-3 w-3 mr-1" /> Agents
            </Button>
          )}

          {/* Settings Menu */}
          <DropdownMenu open={settingsMenuOpen} onOpenChange={setSettingsMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs">
                <Settings className="h-3 w-3 mr-1" /> Settings
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem
                onSelect={() => {
                  setSettingsMenuOpen(false)
                  setCredentialsDialogOpen(true)
                }}
              >
                <Key className="h-3 w-3 mr-2" />
                Credentials
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 text-xs">
                <Layout className="h-3.5 w-3.5" />
                View
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuCheckboxItem
                checked={showToolbar}
                onCheckedChange={setShowToolbar}
              >
                Show Canvas Toolbar
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Generate Graph Button */}
          {hasContent && (
            <Button
              variant="default"
              size="sm"
              onClick={() => setRunDialogOpen(true)}
              className="h-8 text-xs"
            >
              <PlayCircle className="h-3 w-3 mr-1" />
              Generate Graph
            </Button>
          )}
        </div>
      </div>

      <div className="flex h-[calc(100%-56px)] relative">
        {nodesSidebarOpen && (
          <div className="w-64 border-r bg-muted/10 flex flex-col transition-all duration-200">
            <div className="p-2 border-b bg-muted/20 flex items-center gap-2">
              <div className="flex flex-col border-b bg-muted/20">
                <div className="flex items-center justify-between p-2 pb-0">
                  <span className="text-xs font-semibold text-muted-foreground pl-1">Library</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setNodesSidebarOpen(false)}
                    className="h-6 w-6 p-0 shrink-0 hover:bg-background/80"
                    title="Hide Sidebar"
                  >
                    <PanelLeftClose className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="grid grid-cols-4 gap-1 p-2 pt-1">
                  <button
                    onClick={() => setLeftTab('nodes')}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 p-1.5 rounded-md transition-all duration-200 border",
                      leftTab === 'nodes'
                        ? "bg-background text-blue-600 border-border shadow-sm"
                        : "text-muted-foreground border-transparent hover:bg-background/50 hover:text-foreground"
                    )}
                    title="Nodes"
                  >
                    <Circle className="h-4 w-4" />
                    <span className="text-[10px] font-medium leading-none">Nodes</span>
                  </button>
                  <button
                    onClick={() => setLeftTab('relationships')}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 p-1.5 rounded-md transition-all duration-200 border",
                      leftTab === 'relationships'
                        ? "bg-background text-indigo-600 border-border shadow-sm"
                        : "text-muted-foreground border-transparent hover:bg-background/50 hover:text-foreground"
                    )}
                    title="Relationships"
                  >
                    <Link2 className="h-4 w-4" />
                    <span className="text-[10px] font-medium leading-none">Rels</span>
                  </button>
                  <button
                    onClick={() => setLeftTab('tools')}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 p-1.5 rounded-md transition-all duration-200 border",
                      leftTab === 'tools'
                        ? "bg-background text-purple-600 border-border shadow-sm"
                        : "text-muted-foreground border-transparent hover:bg-background/50 hover:text-foreground"
                    )}
                    title="Tools"
                  >
                    <Wrench className="h-4 w-4" />
                    <span className="text-[10px] font-medium leading-none">Tools</span>
                  </button>
                  <button
                    onClick={() => setLeftTab('actions')}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 p-1.5 rounded-md transition-all duration-200 border",
                      leftTab === 'actions'
                        ? "bg-background text-amber-600 border-border shadow-sm"
                        : "text-muted-foreground border-transparent hover:bg-background/50 hover:text-foreground"
                    )}
                    title="Actions"
                  >
                    <Zap className="h-4 w-4" />
                    <span className="text-[10px] font-medium leading-none">Actions</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              {leftTab === 'nodes' && <NodePalette className="h-full" mode="nodes" onFocusNode={(id) => focusNodeFnRef.current?.(id)} />}
              {leftTab === 'relationships' && <NodePalette className="h-full" mode="relationships" onFocusRelationship={(fromId, toId) => focusRelationshipFnRef.current?.(fromId, toId)} />}
              {leftTab === 'tools' && <NodePalette className="h-full" mode="tools" />}
              {leftTab === 'actions' && <NodePalette className="h-full" mode="actions" />}
            </div>
          </div>
        )}
        {!nodesSidebarOpen && (
          <div className="absolute left-0 top-2 z-10 flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setNodesSidebarOpen(true)}
              className="h-8 w-8 p-0 bg-background/95 backdrop-blur-sm border border-border/40 shadow-sm"
              title="Show Sidebar"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </Button>
          </div>
        )}
        <div className="flex-1 relative flex">
          <div className="flex-1 relative">
            <ModelBuilderCanvas
              className="h-full"
              sidebarOpen={sidebarOpen}
              onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
              onRegisterFocusApi={(fn) => { focusNodeFnRef.current = fn }}
              onRegisterFocusRelationshipApi={(fn) => { focusRelationshipFnRef.current = fn }}
              onSwitchTab={(tab) => setLeftTab(tab)}
              showToolbar={showToolbar}
            />
          </div>
          {agentsPanelOpen && (isSchemaDesignEnabled || isWorkflowGenerationEnabled) && (
            <ResizablePanel
              defaultWidth={agentsPanelWidth}
              minWidth={300}
              maxWidth={800}
              onWidthChange={setAgentsPanelWidth}
            >
              <AIAgentsPanel className="h-full" />
            </ResizablePanel>
          )}
        </div>
        {executionProgress && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 w-96 bg-background/95 backdrop-blur-sm border rounded-lg p-4 shadow-lg">
            <ExecutionProgress
              current={executionProgress.current}
              total={executionProgress.total}
              currentStep={executionProgress.currentStep || 'Executing workflow...'}
              status={executionProgress.current === executionProgress.total ? 'completed' : 'running'}
            />
          </div>
        )}
        {xmlPanelOpen && xmlContent && (
          <ResizablePanel
            defaultWidth={xmlPanelWidth}
            minWidth={350}
            maxWidth={1000}
            onWidthChange={setXmlPanelWidth}
            className="h-full"
          >
            <div className="h-full border-l bg-background flex flex-col">
              <div className="p-2 border-b bg-muted/20 flex items-center justify-between">
                <h3 className="text-xs font-semibold">XML Preview</h3>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <Label htmlFor="xml-word-wrap" className="text-[10px] text-muted-foreground cursor-pointer" title="Word Wrap">
                      Wrap
                    </Label>
                    <Switch
                      id="xml-word-wrap"
                      checked={xmlWrapWord}
                      onCheckedChange={setXmlWrapWord}
                      className="scale-75"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => setXmlPanelOpen(false)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="flex-1 relative overflow-hidden">
                <div className="absolute inset-0">
                  <XmlCodePreview
                    value={xmlContent}
                    height="100%"
                    wrapWord={xmlWrapWord}
                  />
                </div>
              </div>
            </div>
          </ResizablePanel>
        )}
        {sidebarOpen && (
          <div className="w-80 border-l bg-muted/10">
            {selectedRelationship ? (
              <RelationshipEditor
                className="h-full"
                onClose={() => setSidebarOpen(false)}
              />
            ) : selectedToolNodeId ? (
              <ToolConfigurationSidebar
                toolNodeId={selectedToolNodeId}
                onClose={() => useToolCanvasStore.getState().selectNode(null)}
                className="h-full"
              />
            ) : selectedActionNodeId ? (
              <ActionConfigurationSidebar
                actionNodeId={selectedActionNodeId}
                onClose={() => useActionCanvasStore.getState().selectNode(null)}
                className="h-full"
              />
            ) : (
              <NodeEditor
                className="h-full"
                onFocusNode={(id) => focusNodeFnRef.current?.(id)}
                onClose={() => setSidebarOpen(false)}
              />
            )}
          </div>
        )}
      </div>

      <ImportSchemaDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        importFile={importFile}
        onImportFileChange={setImportFile}
        importing={importing}
        importError={importError}
        onImport={handleImport}
      />
      <ImportWorkflowDialog
        open={workflowConfigDialogOpen}
        onOpenChange={setWorkflowConfigDialogOpen}
        workflowConfigFile={workflowConfigFile}
        onWorkflowConfigFileChange={setWorkflowConfigFile}
        onImport={handleImportWorkflowConfig}
        importing={importingWorkflowConfig}
        importError={workflowConfigImportError}
        onCancel={() => {
          setWorkflowConfigDialogOpen(false)
          setWorkflowConfigFile(null)
          setWorkflowConfigImportError(null)
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
        onRun={handleRunWorkflow}
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
    </div>
  )

  return content
}

export function ModelBuilder({ className, workflowPersistence, initialWorkflow, currentWorkflowName, availableWorkflows, onWorkflowChange }: ModelBuilderProps) {
  return <ModelBuilderContent className={className} workflowPersistence={workflowPersistence} initialWorkflow={initialWorkflow} currentWorkflowName={currentWorkflowName} availableWorkflows={availableWorkflows} onWorkflowChange={onWorkflowChange} />
}

