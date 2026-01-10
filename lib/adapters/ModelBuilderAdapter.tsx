'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { ModelBuilder, useModelBuilderStore, useToolCanvasStore, useActionCanvasStore, AISettingsProvider } from '@graphdb/model-builder'
import type { AISettings, WorkflowPersistence } from '@graphdb/model-builder'
import type { Model } from '@/lib/resources/ModelResource'
import { DEFAULT_AI_SETTINGS } from '@/lib/ai/ApiAISettingsStorage'
import { SaveWorkflowDialog, WorkflowChangeConfirmDialog } from '@graphdb/model-builder'
import { toast } from 'sonner'
import { useDatabaseStore } from '@/app/dashboard/stores/databaseStore'

export interface ModelBuilderAdapterProps {
  model: Model | null
  onSave?: (data: { schemaJson: unknown; schemaMd: string; name: string; description?: string }) => Promise<Model | void>
  className?: string
}

/**
 * Adapter component that wraps the model-builder package
 * and connects it to the main app's Model database entity
 */
export function ModelBuilderAdapter(props: ModelBuilderAdapterProps | null | undefined) {
  // Use safe defaults for null/undefined props
  const safeProps = props || {
    model: null,
    onSave: async () => {
      console.error('ModelBuilderAdapter: onSave called but props were null')
    },
    className: undefined
  }

  const {
    model = null,
    onSave,
    className
  } = safeProps

  const { loadState, nodes, relationships, metadata, clear } = useModelBuilderStore()
  const onSaveRef = useRef(onSave)
  const loadedRef = useRef(false)
  const [aiSettings, setAiSettings] = useState<AISettings | null>(null)
  const [saveWorkflowDialogOpen, setSaveWorkflowDialogOpen] = useState(false)
  const [currentWorkflowConfig, setCurrentWorkflowConfig] = useState<any>(null)
  const [existingWorkflows, setExistingWorkflows] = useState<Array<{
    id: string
    name: string
    description?: string
    version: string
    createdAt: string
    updatedAt: string
  }>>([])
  const [currentWorkflow, setCurrentWorkflow] = useState<{
    id: string
    name: string
    description?: string
    config: unknown
  } | null>(null)
  const [savedWorkflowConfig, setSavedWorkflowConfig] = useState<unknown>(null)
  const [workflowChangeConfirmOpen, setWorkflowChangeConfirmOpen] = useState(false)
  const [pendingWorkflowId, setPendingWorkflowId] = useState<string | null>(null)
  const pendingSaveRef = useRef<(() => Promise<Model | undefined>) | null>(null)

  // Update ref when onSave changes
  useEffect(() => {
    onSaveRef.current = onSave
  }, [onSave])

  // Load model data into builder when model changes
  useEffect(() => {
    if (!model || loadedRef.current) {
      return
    }

    const loadModelData = async () => {
      try {
        // Dynamic imports to avoid loading if not needed
        const { convertSchemaJsonToBuilder, parseMarkdownSchema, convertMarkdownSchemaToBuilder } = await import('@graphdb/model-builder')

        // Try to load from schemaJson first
        if (model.schemaJson) {
          const schemaJson = model.schemaJson as {
            nodes: Record<string, {
              name: string
              superclassNames?: string[]
              properties: Record<string, {
                name: string
                datatype: string
                values: unknown[]
                required: boolean
              }>
              relationsOut?: Record<string, string[]>
              relationsIn?: Record<string, string[]>
            }>
            relations: Record<string, {
              name: string
              properties?: Record<string, {
                name: string
                datatype: string
                values: unknown[]
                required: boolean
              }>
              domains: Record<string, string[]>
            }>
            version?: string
            lastUpdated?: string
            source?: string
          }

          if (schemaJson.nodes && schemaJson.relations) {
            const converted = convertSchemaJsonToBuilder(schemaJson)
            loadState({
              nodes: converted.nodes,
              relationships: converted.relationships,
              metadata: {
                name: model.name,
                description: model.description || '',
                version: model.version || '1.0.0'
              }
            })
            loadedRef.current = true
            return
          }
        }

        // Fallback to schemaMd
        if (model.schemaMd) {
          const parsedSchema = parseMarkdownSchema(model.schemaMd)
          const converted = convertMarkdownSchemaToBuilder(parsedSchema)
          loadState({
            nodes: converted.nodes,
            relationships: converted.relationships,
            metadata: {
              name: model.name,
              description: model.description || '',
              version: model.version || '1.0.0'
            }
          })
          loadedRef.current = true
          return
        }

        // If no schema data, initialize with model metadata only
        clear()
        useToolCanvasStore.getState().clear()
        useActionCanvasStore.getState().clear()
        loadState({
          nodes: [],
          relationships: [],
          groups: [],
          relationshipTypes: [],
          metadata: {
            name: model.name,
            description: model.description || '',
            version: model.version || '1.0.0'
          }
        })
        loadedRef.current = true
      } catch (error) {
        console.error('Error loading model into builder:', error)
      }
    }

    loadModelData()
  }, [model, loadState])

  // Listen for save events from parent component
  // Use refs to avoid re-registering listener on every state change
  const nodesRef = useRef(nodes)
  const relationshipsRef = useRef(relationships)
  const metadataRef = useRef(metadata)
  const isSavingRef = useRef(false)

  // Update refs when state changes
  useEffect(() => {
    nodesRef.current = nodes
    relationshipsRef.current = relationships
    metadataRef.current = metadata
  }, [nodes, relationships, metadata])

  // Create workflow persistence if model exists
  const workflowPersistence: WorkflowPersistence | undefined = useMemo(() => model ? {
    modelId: model.id,
    onSaveWorkflow: async (workflow: { name: string; description?: string; config: unknown }) => {
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          modelId: model.id,
          name: workflow.name,
          description: workflow.description,
          config: workflow.config
        })
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to save workflow' }))
        const errorMessage = errorData.error || `Failed to save workflow (${response.status})`
        console.error('Workflow save error:', errorMessage, errorData)
        throw new Error(errorMessage)
      }
      const data = await response.json()
      return data.workflow || data
    },
    onUpdateWorkflow: async (id: string, workflow: { name?: string; description?: string; config?: unknown }) => {
      const response = await fetch(`/api/workflows/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(workflow)
      })
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to update workflow' }))
        throw new Error(error.error || 'Failed to update workflow')
      }
    },
    onLoadWorkflows: async (modelId: string) => {
      const response = await fetch(`/api/workflows?modelId=${modelId}`, {
        credentials: 'include'
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to load workflows' }))
        const errorMessage = errorData.error || `Failed to load workflows (${response.status})`
        console.error('Workflow load error:', errorMessage, errorData)
        throw new Error(errorMessage)
      }
      const data = await response.json()
      return data.workflows || []
    },
    onLoadWorkflow: async (id: string) => {
      const response = await fetch(`/api/workflows/${id}`, {
        credentials: 'include'
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to load workflow' }))
        const errorMessage = errorData.error || `Failed to load workflow (${response.status})`
        console.error('Workflow load error:', errorMessage, errorData)
        throw new Error(errorMessage)
      }
      const data = await response.json()
      return data.workflow
    }
  } : undefined, [model])

  // Load existing workflows when editing a model and load the first one automatically
  useEffect(() => {
    const loadWorkflows = async () => {
      if (!model?.id || !workflowPersistence?.onLoadWorkflows) return

      try {
        const workflows = await workflowPersistence.onLoadWorkflows(model.id)
        setExistingWorkflows(workflows)

        // Load the most recent workflow (first in list, sorted by updatedAt)
        if (workflows.length > 0 && workflowPersistence.onLoadWorkflow) {
          const mostRecentWorkflow = workflows[0] // Assuming sorted by updatedAt desc
          try {
            const workflow = await workflowPersistence.onLoadWorkflow(mostRecentWorkflow.id)
            setCurrentWorkflow(workflow)
            // Normalize the saved config when loading to ensure consistent comparison later
            const normalizedSavedConfig = JSON.parse(JSON.stringify(workflow.config))
            setSavedWorkflowConfig(normalizedSavedConfig)
          } catch (error) {
            console.error('Error loading workflow:', error)
          }
        }
      } catch (error) {
        console.error('Error loading workflows:', error)
      }
    }

    loadWorkflows()
  }, [model?.id, workflowPersistence])

  // Set up event listener once
  useEffect(() => {
    const handleSave = async () => {
      if (isSavingRef.current) {
        return
      }

      // Store the save function to execute after workflow dialog
      // IMPORTANT: This function is stored but NOT executed yet
      // It will be executed when:
      // 1. No workflow exists (executed immediately)
      // 2. User skips workflow (executed in handleWorkflowSave)
      // 3. User saves workflow (executed in handleWorkflowSave before workflow save)
      pendingSaveRef.current = async (): Promise<Model | undefined> => {
        // Prevent double execution
        if (isSavingRef.current) {
          return undefined
        }

        isSavingRef.current = true

        try {
          const { convertBuilderToSchemaJson, exportToMarkdown, useModelBuilderStore } = await import('@graphdb/model-builder')

          // Get the full store state for export
          // IMPORTANT: Only use model nodes and relationships, NOT tools/actions
          // Tools and actions are saved separately as workflows
          const storeState = useModelBuilderStore.getState()

          // Get fresh nodes and relationships from the store (not refs, to ensure latest state)
          const currentNodes = storeState.nodes
          const currentRelationships = storeState.relationships

          // Convert to schema format (this only includes nodes and relationships, no tools/actions)
          const schemaJson = convertBuilderToSchemaJson(currentNodes, currentRelationships)
          const schemaMd = exportToMarkdown({
            nodes: currentNodes,
            relationships: currentRelationships,
            metadata: metadataRef.current,
            groups: storeState.groups || [],
            relationshipTypes: storeState.relationshipTypes || [],
            selectedNode: storeState.selectedNode || null,
            selectedRelationship: storeState.selectedRelationship || null,
            hideUnconnectedNodes: storeState.hideUnconnectedNodes || false,
            rootNodeId: storeState.rootNodeId || null
          })

          if (onSaveRef.current) {
            const result = await onSaveRef.current({
              schemaJson,
              schemaMd,
              name: metadataRef.current.name,
              description: metadataRef.current.description
            })
            const model = result as Model | undefined

            // Store a flag to indicate model was saved (for navigation control)
            if (model) {
              ; (window as any).__modelJustSaved = true
            }

            return model
          }
          return undefined
        } catch (error) {
          console.error('Error saving model:', error)
          throw error
        } finally {
          isSavingRef.current = false
        }
      }

      // Always check for workflows, regardless of whether model exists
      // Get current workflow config using fresh state from store (not refs)
      const { exportWorkflowConfig, useToolCanvasStore, useActionCanvasStore, useModelBuilderStore } = await import('@graphdb/model-builder')
      const storeState = useModelBuilderStore.getState()
      const toolNodes = useToolCanvasStore.getState().nodes
      const toolEdges = useToolCanvasStore.getState().edges
      const actionNodes = useActionCanvasStore.getState().nodes
      const actionEdges = useActionCanvasStore.getState().edges

      // Use fresh state from store, not refs, to ensure we have the latest data
      const workflowConfigJson = exportWorkflowConfig(
        storeState.nodes,
        storeState.relationships,
        toolNodes,
        toolEdges,
        actionNodes,
        actionEdges
      )
      const workflowConfig = JSON.parse(workflowConfigJson)

      // Check if there's a workflow to save
      const hasWorkflow = (workflowConfig.tools && workflowConfig.tools.length > 0) ||
        (workflowConfig.actions && workflowConfig.actions.length > 0)

      if (hasWorkflow) {
        // Store workflow config and show dialog
        setCurrentWorkflowConfig(workflowConfig)
        setSaveWorkflowDialogOpen(true)
        // Don't execute pendingSaveRef here - it will be executed in handleWorkflowSave
      } else {
        // No workflow, proceed directly with model save
        if (pendingSaveRef.current) {
          const savedModel = await pendingSaveRef.current()
          // Clear the ref after use to prevent double execution
          pendingSaveRef.current = null
          return savedModel
        }
      }
    }

    // Only set up listener once - use refs to avoid re-registering
    const handleSaveWrapper = () => {
      // Prevent multiple handlers from executing
      if (isSavingRef.current) {
        return
      }
      handleSave()
    }

    window.addEventListener('model-builder:save', handleSaveWrapper)

    return () => {
      window.removeEventListener('model-builder:save', handleSaveWrapper)
    }
  }, [workflowPersistence, model])

  // Fetch AI settings from parent app's API
  useEffect(() => {
    const fetchAISettings = async () => {
      try {
        const response = await fetch('/api/ai-settings', {
          method: 'GET',
          credentials: 'include'
        })

        if (response.ok) {
          const settings = await response.json() as AISettings
          setAiSettings(settings)
        } else {
          setAiSettings(DEFAULT_AI_SETTINGS)
        }
      } catch (error) {
        console.error('Error fetching AI settings:', error)
        setAiSettings(DEFAULT_AI_SETTINGS)
      }
    }

    fetchAISettings()
  }, [])

  const getCurrentWorkflowConfig = async () => {
    try {
      const { exportWorkflowConfig, useToolCanvasStore, useActionCanvasStore, useModelBuilderStore } = await import('@graphdb/model-builder')
      const storeState = useModelBuilderStore.getState()
      const toolNodes = useToolCanvasStore.getState().nodes
      const toolEdges = useToolCanvasStore.getState().edges
      const actionNodes = useActionCanvasStore.getState().nodes
      const actionEdges = useActionCanvasStore.getState().edges

      // Use fresh state from store, not refs, to ensure we have the latest data
      const workflowConfigJson = exportWorkflowConfig(
        storeState.nodes,
        storeState.relationships,
        toolNodes,
        toolEdges,
        actionNodes,
        actionEdges
      )
      return JSON.parse(workflowConfigJson)
    } catch (error) {
      console.error('Error getting workflow config:', error)
      return null
    }
  }

  const handleWorkflowSave = async (workflowAction: {
    action: 'skip' | 'create' | 'update'
    workflowId?: string
    name?: string
    description?: string
  }) => {
    if (workflowAction.action === 'skip') {
      // Proceed with model save only
      if (pendingSaveRef.current) {
        await pendingSaveRef.current()
        // Clear the ref after use to prevent double execution
        pendingSaveRef.current = null
      }
      // Navigation will happen in useNewModel after model is created
      return
    }

    // For new models, save the model first to get the modelId
    if (!model && workflowAction.action === 'create') {
      if (!workflowAction.name) {
        toast.error('Workflow name is required')
        return
      }

      try {
        // Set flag to indicate workflow save is in progress (prevents navigation in useNewModel)
        ; (window as any).__workflowSaveInProgress = true

        // Save model first and get the created model
        // This will save ONLY nodes and relationships (no tools/actions)
        if (!pendingSaveRef.current) {
          toast.error('Save function not available')
            ; (window as any).__workflowSaveInProgress = false
          return
        }

        const createdModel = await pendingSaveRef.current()

        // Clear the ref after use to prevent double execution
        pendingSaveRef.current = null

        if (!createdModel?.id) {
          toast.error('Failed to get model ID after creation')
            ; (window as any).__workflowSaveInProgress = false
          return
        }

        // Get workflow config (tools and actions only)
        // This includes relationships for workflow context, but the model itself doesn't include them
        const workflowConfig = await getCurrentWorkflowConfig()
        if (!workflowConfig) {
          toast.error('Failed to get workflow configuration')
            ; (window as any).__workflowSaveInProgress = false
          return
        }

        // Save the workflow with the new model ID
        // The workflow contains tools, actions, and relationships (for workflow context)
        // But the model only contains nodes and relationships (the actual schema)
        const response = await fetch('/api/workflows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            modelId: createdModel.id,
            name: workflowAction.name,
            description: workflowAction.description,
            config: workflowConfig
          })
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to save workflow' }))
          const errorMessage = errorData.error || `Failed to save workflow (${response.status})`
          toast.error(errorMessage)
            ; (window as any).__workflowSaveInProgress = false
          return
        }

        toast.success('Model and workflow saved successfully')

          // Clear the flag
          ; (window as any).__workflowSaveInProgress = false

        // Navigate to models list after both model and workflow are saved
        setTimeout(() => {
          window.location.href = '/dashboard/graph/model'
        }, 500)
      } catch (error) {
        console.error('Error saving model or workflow:', error)
        toast.error('Failed to save model or workflow')
          ; (window as any).__workflowSaveInProgress = false
      }
    }

    // For existing models, use workflow persistence
    if (!workflowPersistence) {
      // No workflow persistence available, just save model
      if (pendingSaveRef.current) {
        await pendingSaveRef.current()
        // Clear the ref after use to prevent double execution
        pendingSaveRef.current = null
      }
      return
    }

    try {
      const workflowConfig = await getCurrentWorkflowConfig()
      if (!workflowConfig) {
        toast.error('Failed to get workflow configuration')
        if (pendingSaveRef.current) {
          await pendingSaveRef.current()
          // Clear the ref after use to prevent double execution
          pendingSaveRef.current = null
        }
        return
      }

      if (workflowAction.action === 'create') {
        if (!workflowAction.name) {
          toast.error('Workflow name is required')
          return
        }
        await workflowPersistence.onSaveWorkflow?.({
          name: workflowAction.name,
          description: workflowAction.description,
          config: workflowConfig
        })
        toast.success('Workflow saved successfully')
      } else if (workflowAction.action === 'update') {
        if (!workflowAction.workflowId) {
          toast.error('Workflow ID is required for update')
          return
        }
        await workflowPersistence.onUpdateWorkflow?.(workflowAction.workflowId, {
          name: workflowAction.name,
          description: workflowAction.description,
          config: workflowConfig
        })

        // Update savedWorkflowConfig to reflect the new saved state
        // Normalize it to ensure consistent comparison later
        // Don't update currentWorkflow state here because that would trigger a reload
        // The tools/actions are already on the canvas, so we just need to update the saved config
        const normalizedSavedConfig = JSON.parse(JSON.stringify(workflowConfig))
        setSavedWorkflowConfig(normalizedSavedConfig)

        // Update currentWorkflow metadata only (name, description) without changing the config
        // This prevents the workflow from being reloaded
        if (currentWorkflow && currentWorkflow.id === workflowAction.workflowId) {
          setCurrentWorkflow({
            ...currentWorkflow,
            name: workflowAction.name || currentWorkflow.name,
            description: workflowAction.description !== undefined ? workflowAction.description : currentWorkflow.description
            // Don't update config here - it would trigger a reload
          })
        }

        toast.success('Workflow updated successfully')
      }

      // Proceed with model save
      if (pendingSaveRef.current) {
        await pendingSaveRef.current()
        // Clear the ref after use to prevent double execution
        pendingSaveRef.current = null
      }
    } catch (error) {
      console.error('Error saving workflow:', error)
      toast.error('Failed to save workflow')
      // Still proceed with model save even if workflow save fails
      if (pendingSaveRef.current) {
        await pendingSaveRef.current()
        // Clear the ref after use to prevent double execution
        pendingSaveRef.current = null
      }
    }
  }

  // Check if current workflow has unsaved changes
  // Only considers structural changes (tools, actions, edges, connections)
  // Ignores position changes
  const hasUnsavedWorkflowChanges = async (): Promise<boolean> => {
    if (!currentWorkflow || !savedWorkflowConfig) {
      return false
    }

    try {
      const { exportWorkflowConfig, useModelBuilderStore, useToolCanvasStore, useActionCanvasStore } = await import('@graphdb/model-builder')
      const currentNodes = useModelBuilderStore.getState().nodes
      const currentRelationships = useModelBuilderStore.getState().relationships
      const currentToolNodes = useToolCanvasStore.getState().nodes
      const currentToolEdges = useToolCanvasStore.getState().edges
      const currentActionNodes = useActionCanvasStore.getState().nodes
      const currentActionEdges = useActionCanvasStore.getState().edges

      // Check if there are any tools or actions on the canvas
      const hasTools = currentToolNodes.length > 0 || currentToolEdges.length > 0
      const hasActions = currentActionNodes.length > 0 || currentActionEdges.length > 0

      // If no tools or actions, no changes
      if (!hasTools && !hasActions) {
        return false
      }

      const currentConfigJson = exportWorkflowConfig(
        currentNodes,
        currentRelationships,
        currentToolNodes,
        currentToolEdges,
        currentActionNodes,
        currentActionEdges
      )
      const currentConfig = JSON.parse(currentConfigJson)

      // Normalize configs by removing position fields and other non-structural data
      // Also sort arrays to ensure consistent comparison
      const normalizeConfigForComparison = (config: any) => {
        if (!config) return { tools: [], actions: [], toolEdges: [], actionEdges: [], relationships: [] }

        const normalized = JSON.parse(JSON.stringify(config))

        // Remove metadata fields that don't affect structure
        delete normalized.createdAt
        delete normalized.version
        delete normalized.metadata
        delete normalized.type

        // Ensure arrays exist (even if empty) to avoid comparison issues
        if (!Array.isArray(normalized.tools)) normalized.tools = []
        if (!Array.isArray(normalized.actions)) normalized.actions = []
        if (!Array.isArray(normalized.toolEdges)) normalized.toolEdges = []
        if (!Array.isArray(normalized.actionEdges)) normalized.actionEdges = []
        // Relationships are not part of workflow comparison - they're part of the model schema

        // Normalize and sort tools
        if (normalized.tools && Array.isArray(normalized.tools)) {
          normalized.tools = normalized.tools.map((tool: any) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { position, ...toolWithoutPosition } = tool
            // Ensure consistent property order
            return {
              type: toolWithoutPosition.type,
              label: toolWithoutPosition.label,
              targetNodeLabel: toolWithoutPosition.targetNodeLabel,
              config: toolWithoutPosition.config || {},
              inputs: toolWithoutPosition.inputs,
              outputs: toolWithoutPosition.outputs || []
            }
          }).sort((a: any, b: any) => {
            // Sort by targetNodeLabel then type
            if (a.targetNodeLabel !== b.targetNodeLabel) {
              return a.targetNodeLabel.localeCompare(b.targetNodeLabel)
            }
            return a.type.localeCompare(b.type)
          })
        }

        // Normalize and sort actions and their children
        if (normalized.actions && Array.isArray(normalized.actions)) {
          normalized.actions = normalized.actions.map((action: any) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { position, ...actionWithoutPosition } = action
            if (actionWithoutPosition.children && Array.isArray(actionWithoutPosition.children)) {
              actionWithoutPosition.children = actionWithoutPosition.children.map((child: any) => {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { position: childPosition, ...childWithoutPosition } = child
                // Ensure consistent property order
                return {
                  type: childWithoutPosition.type,
                  label: childWithoutPosition.label,
                  config: childWithoutPosition.config || {}
                }
              }).sort((a: any, b: any) => {
                // Sort children by label
                return a.label.localeCompare(b.label)
              })
            }
            // Ensure consistent property order
            return {
              type: actionWithoutPosition.type,
              label: actionWithoutPosition.label,
              config: actionWithoutPosition.config || {},
              isGroup: actionWithoutPosition.isGroup || false,
              children: actionWithoutPosition.children,
              isExpanded: actionWithoutPosition.isExpanded,
              enabled: actionWithoutPosition.enabled !== undefined ? actionWithoutPosition.enabled : true
            }
          }).sort((a: any, b: any) => {
            // Sort actions by label
            return a.label.localeCompare(b.label)
          })
        }

        // Normalize and sort toolEdges, removing duplicates
        if (normalized.toolEdges && Array.isArray(normalized.toolEdges)) {
          // Create a Set to track unique edges
          const edgeKeys = new Set<string>()
          const uniqueEdges: any[] = []

          normalized.toolEdges.forEach((edge: any) => {
            // Create a unique key for the edge
            const edgeKey = JSON.stringify({
              sourceNodeLabel: edge.sourceNodeLabel || undefined,
              sourceToolLabel: edge.sourceToolLabel || undefined,
              targetToolLabel: edge.targetToolLabel || undefined,
              targetActionLabel: edge.targetActionLabel || undefined,
              sourceHandle: edge.sourceHandle || undefined,
              targetHandle: edge.targetHandle || undefined
            })

            // Only add if not already seen
            if (!edgeKeys.has(edgeKey)) {
              edgeKeys.add(edgeKey)
              uniqueEdges.push({
                sourceNodeLabel: edge.sourceNodeLabel || undefined,
                sourceToolLabel: edge.sourceToolLabel || undefined,
                targetToolLabel: edge.targetToolLabel || undefined,
                targetActionLabel: edge.targetActionLabel || undefined,
                sourceHandle: edge.sourceHandle || undefined,
                targetHandle: edge.targetHandle || undefined
              })
            }
          })

          // Sort the unique edges
          normalized.toolEdges = uniqueEdges.sort((a: any, b: any) => {
            // Sort by source then target
            const aKey = `${a.sourceNodeLabel || a.sourceToolLabel || ''}-${a.targetToolLabel || a.targetActionLabel || ''}`
            const bKey = `${b.sourceNodeLabel || b.sourceToolLabel || ''}-${b.targetToolLabel || b.targetActionLabel || ''}`
            return aKey.localeCompare(bKey)
          })
        }

        // Normalize and sort actionEdges, removing duplicates
        if (normalized.actionEdges && Array.isArray(normalized.actionEdges)) {
          // Create a Set to track unique edges
          const edgeKeys = new Set<string>()
          const uniqueEdges: any[] = []

          normalized.actionEdges.forEach((edge: any) => {
            // Create a unique key for the edge
            const edgeKey = JSON.stringify({
              sourceToolLabel: edge.sourceToolLabel || '',
              targetActionLabel: edge.targetActionLabel || '',
              sourceHandle: edge.sourceHandle || undefined,
              targetHandle: edge.targetHandle || undefined
            })

            // Only add if not already seen
            if (!edgeKeys.has(edgeKey)) {
              edgeKeys.add(edgeKey)
              uniqueEdges.push({
                sourceToolLabel: edge.sourceToolLabel || '',
                targetActionLabel: edge.targetActionLabel || '',
                sourceHandle: edge.sourceHandle || undefined,
                targetHandle: edge.targetHandle || undefined
              })
            }
          })

          // Sort the unique edges
          normalized.actionEdges = uniqueEdges.sort((a: any, b: any) => {
            // Sort by sourceToolLabel then targetActionLabel
            if (a.sourceToolLabel !== b.sourceToolLabel) {
              return a.sourceToolLabel.localeCompare(b.sourceToolLabel)
            }
            return a.targetActionLabel.localeCompare(b.targetActionLabel)
          })
        }

        // Remove relationships from comparison - relationships are part of the model schema, not the workflow
        // The workflow only tracks tools, actions, and edges between them
        delete normalized.relationships

        // Return with consistent property order to ensure JSON.stringify produces identical strings
        return {
          tools: normalized.tools || [],
          actions: normalized.actions || [],
          toolEdges: normalized.toolEdges || [],
          actionEdges: normalized.actionEdges || []
        }
      }

      const normalizedCurrent = normalizeConfigForComparison(currentConfig)
      const normalizedSaved = normalizeConfigForComparison(savedWorkflowConfig)

      // Compare current config with saved config (ignoring positions)
      const currentJson = JSON.stringify(normalizedCurrent)
      const savedJson = JSON.stringify(normalizedSaved)
      const hasChanges = currentJson !== savedJson

      return hasChanges
    } catch (error) {
      console.error('Error checking for unsaved changes:', error)
      return false
    }
  }

  // Handle workflow change
  const handleWorkflowChange = async (workflowId: string) => {
    if (!workflowPersistence?.onLoadWorkflow) return

    // Check if there are unsaved changes
    const hasChanges = await hasUnsavedWorkflowChanges()

    if (hasChanges && currentWorkflow) {
      // Show confirmation dialog
      setPendingWorkflowId(workflowId)
      setWorkflowChangeConfirmOpen(true)
    } else {
      // No changes, switch directly
      await switchToWorkflow(workflowId)
    }
  }

  // Switch to a workflow
  const switchToWorkflow = async (workflowId: string) => {
    if (!workflowPersistence?.onLoadWorkflow) {
      toast.error('Workflow persistence not available')
      return
    }

    try {
      // Clear existing tools and actions before loading new workflow
      const { useToolCanvasStore, useActionCanvasStore } = await import('@graphdb/model-builder')
      useToolCanvasStore.getState().clear()
      useActionCanvasStore.getState().clear()

      const workflow = await workflowPersistence.onLoadWorkflow(workflowId)
      setCurrentWorkflow(workflow)
      // Normalize the saved config when loading to ensure consistent comparison later
      // This ensures the saved config has the same structure as what exportWorkflowConfig produces
      const normalizedSavedConfig = JSON.parse(JSON.stringify(workflow.config))
      setSavedWorkflowConfig(normalizedSavedConfig)

      // Don't dispatch event - just updating currentWorkflow will trigger initialWorkflow prop change
      // which will load the workflow via the useEffect in ModelBuilder
      // This prevents double loading
      // Note: The workflow will be loaded via the initialWorkflow prop change, which will clear
      // tools/actions before loading, so we don't need to do it here

      toast.success(`Switched to workflow "${workflow.name}"`)
    } catch (error) {
      console.error('Error loading workflow:', error)
      toast.error('Failed to load workflow')
    }
  }

  // Handle workflow change confirmation
  const handleWorkflowChangeConfirm = async (updateCurrent: boolean) => {
    if (!pendingWorkflowId || !currentWorkflow || !workflowPersistence) return

    try {
      if (updateCurrent) {
        // Update current workflow first
        const { exportWorkflowConfig, useModelBuilderStore, useToolCanvasStore, useActionCanvasStore } = await import('@graphdb/model-builder')
        const currentNodes = useModelBuilderStore.getState().nodes
        const currentRelationships = useModelBuilderStore.getState().relationships
        const currentToolNodes = useToolCanvasStore.getState().nodes
        const currentToolEdges = useToolCanvasStore.getState().edges
        const currentActionNodes = useActionCanvasStore.getState().nodes
        const currentActionEdges = useActionCanvasStore.getState().edges

        const workflowConfigJson = exportWorkflowConfig(
          currentNodes,
          currentRelationships,
          currentToolNodes,
          currentToolEdges,
          currentActionNodes,
          currentActionEdges
        )
        const workflowConfig = JSON.parse(workflowConfigJson)

        await workflowPersistence.onUpdateWorkflow?.(currentWorkflow.id, {
          config: workflowConfig
        })

        toast.success('Current workflow updated')
      }

      // Switch to the new workflow
      await switchToWorkflow(pendingWorkflowId)
    } catch (error) {
      console.error('Error updating/switching workflow:', error)
      toast.error('Failed to update or switch workflow')
    } finally {
      setPendingWorkflowId(null)
    }
  }
  // Handle pushing graph to database
  const handlePushToDB = async (graph: Array<Record<string, unknown>>) => {
    try {
      const response = await fetch('/api/database/load', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ graph })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`Loaded ${data.nodesCreated} nodes and ${data.relationshipsCreated} relationships into the graph database`)

        // Invalidate caches
        const dbStore = useDatabaseStore.getState()
        dbStore.checkStatus()
        dbStore.invalidateNodeLabels()
        dbStore.invalidateRelationshipTypes()
        dbStore.invalidateNodeProperties()
      } else {
        toast.error(data.error || 'Failed to load graph')
      }
    } catch (error) {
      console.error('Error pushing to DB:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to push to database')
    }
  }

  // Wait for AI settings to load before rendering
  if (aiSettings === null) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <AISettingsProvider settings={aiSettings}>
      <ModelBuilder
        className={className}
        workflowPersistence={workflowPersistence}
        initialWorkflow={currentWorkflow || undefined}
        currentWorkflowName={currentWorkflow?.name}
        availableWorkflows={existingWorkflows}
        onWorkflowChange={handleWorkflowChange}
        onPushToDB={handlePushToDB}
      />
      <SaveWorkflowDialog
        open={saveWorkflowDialogOpen}
        onOpenChange={setSaveWorkflowDialogOpen}
        workflowPersistence={workflowPersistence}
        currentWorkflowConfig={currentWorkflowConfig}
        existingWorkflows={existingWorkflows}
        isNewModel={!model}
        onSave={handleWorkflowSave}
      />
      {currentWorkflow && pendingWorkflowId && (
        <WorkflowChangeConfirmDialog
          open={workflowChangeConfirmOpen}
          onOpenChange={setWorkflowChangeConfirmOpen}
          currentWorkflowName={currentWorkflow.name}
          newWorkflowName={existingWorkflows.find(w => w.id === pendingWorkflowId)?.name || 'Unknown'}
          onConfirm={handleWorkflowChangeConfirm}
          onCancel={() => {
            setPendingWorkflowId(null)
            setWorkflowChangeConfirmOpen(false)
          }}
        />
      )}
    </AISettingsProvider>
  )
}
