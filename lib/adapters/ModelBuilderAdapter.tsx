'use client'

import { useEffect, useState, useRef, useMemo, useImperativeHandle } from 'react'
import {
  ModelBuilder,
  AISettingsProvider,
  SaveWorkflowDialog,
  WorkflowChangeConfirmDialog,
  DEFAULT_AI_SETTINGS
} from '@graphdb/model-builder'
import type {
  AISettings,
  WorkflowPersistence,
  ModelBuilderRef
} from '@graphdb/model-builder'
import type { Model } from '@/lib/resources/ModelResource'
import { toast } from 'sonner'

export interface ModelBuilderAdapterProps {
  model: Model | null
  onSave?: (data: { schemaJson: unknown; schemaMd: string; name: string; description?: string }) => Promise<Model | void>
  className?: string
  builderRef?: React.RefObject<ModelBuilderRef | null>
  workflowPersistence?: WorkflowPersistence
}

/**
 * Adapter component that wraps the model-builder package
 * and connects it to the main app's Model database entity
 */
export function ModelBuilderAdapter({
  model = null,
  onSave,
  className,
  builderRef,
  workflowPersistence
}: ModelBuilderAdapterProps) {
  const onSaveRef = useRef(onSave)
  const isSavingRef = useRef(false)
  const loadedRef = useRef(false)
  const lastModelIdRef = useRef<string | null>(model?.id || null)
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
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Default workflow persistence using app's API
  const defaultPersistence = useMemo<WorkflowPersistence>(() => {
    if (!model?.id || model.id === 'new') return { modelId: model?.id }

    return {
      modelId: model.id,
      onSaveWorkflow: async (workflow) => {
        const response = await fetch('/api/workflows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            modelId: model.id,
            name: workflow.name,
            description: workflow.description,
            config: workflow.config
          })
        })
        if (!response.ok) throw new Error('Failed to save workflow')
        const data = await response.json()
        setRefreshTrigger(prev => prev + 1)
        return { id: data.workflow.id }
      },
      onUpdateWorkflow: async (id, workflow) => {
        const response = await fetch(`/api/workflows/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(workflow)
        })
        if (!response.ok) throw new Error('Failed to update workflow')
        setRefreshTrigger(prev => prev + 1)
      },
      onLoadWorkflows: async (modelId) => {
        const response = await fetch(`/api/workflows?modelId=${modelId}`)
        if (!response.ok) throw new Error('Failed to load workflows')
        const data = await response.json()
        return data.workflows
      },
      onLoadWorkflow: async (id) => {
        const response = await fetch(`/api/workflows/${id}`)
        if (!response.ok) throw new Error('Failed to load workflow')
        const data = await response.json()
        return data.workflow
      }
    }
  }, [model?.id])

  const effectivePersistence = workflowPersistence || defaultPersistence

  // Load existing workflows for the model
  useEffect(() => {
    const fetchWorkflows = async () => {
      if (!model?.id || model.id === 'new') {
        setExistingWorkflows([])
        return
      }

      try {
        if (effectivePersistence.onLoadWorkflows) {
          const workflows = await effectivePersistence.onLoadWorkflows(model.id)
          setExistingWorkflows(workflows)
        }
      } catch (error) {
        console.error('Error loading existing workflows:', error)
      }
    }

    fetchWorkflows()
  }, [model?.id, effectivePersistence, refreshTrigger])

  // Update ref when onSave changes
  useEffect(() => {
    onSaveRef.current = onSave
  }, [onSave])

  // Load model data into builder when model changes
  useEffect(() => {
    // If model ID changed, reset loaded flag
    if (model?.id !== lastModelIdRef.current) {
      loadedRef.current = false
      lastModelIdRef.current = model?.id || null
    }

    if (!model || loadedRef.current) {
      return
    }

    const loadModelData = async () => {
      try {
        // We use the internal ref to load data into the builder
        if (builderInternalRef.current) {
          if (model.schemaJson) {
            builderInternalRef.current.loadData(model.schemaJson)
          } else if (model.schemaMd) {
            builderInternalRef.current.loadData(model.schemaMd)
          } else {
            // If no schema data, initialize with model metadata only
            builderInternalRef.current.clear()
            builderInternalRef.current.loadData({
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
          }
          loadedRef.current = true
        }
      } catch (error) {
        console.error('Error loading model into builder:', error)
      }
    }

    // Wait a bit to ensure the ref is attached
    const timer = setTimeout(loadModelData, 100)
    return () => clearTimeout(timer)
  }, [model])

  // Listen for save events from parent component
  // Listen for save events from parent component
  const metadataRef = useRef({
    name: model?.name || '',
    description: model?.description || '',
    version: model?.version || '1.0.0'
  })

  // Update metadataRef when model changes
  useEffect(() => {
    if (model) {
      metadataRef.current = {
        name: model.name,
        description: model.description || '',
        version: model.version || '1.0.0'
      }
    }
  }, [model])

  // Removed old `model-builder:save` window event listener.
  // The save flow is now triggered directly via the `builderRef.current.exportData()`
  // and handled by the parent component passing `onSave`.

  // Let the adapter handle the workflow dialog flow before executing the `onSave` logic.
  // Expose a custom ref upward that wraps `ModelBuilderRef`'s exportData with the workflow save flow.
  
  // Actually, parent component wants `onSave` to be invoked when `Save Changes` is clicked.
  // We'll manage that flow here entirely so parent just calls `triggerSave()`.
  const triggerSave = async () => {
    if (isSavingRef.current) return
    
    // Check if there's a workflow to save
    const currentConfig = await getCurrentWorkflowConfig()
    const hasWorkflow = currentConfig && (
      (currentConfig.tools && currentConfig.tools.length > 0) ||
      (currentConfig.actions && currentConfig.actions.length > 0)
    )

    pendingSaveRef.current = async (): Promise<Model | undefined> => {
      if (isSavingRef.current) return undefined
      isSavingRef.current = true

      try {
        let exportResult
        if (builderRef?.current) {
          exportResult = builderRef.current.exportData()
        } else {
          // Fallback if ref isn't attached (should not happen)
          toast.error("Builder reference missing.")
          return undefined
        }

        if (onSaveRef.current) {
          const result = await onSaveRef.current({
            schemaJson: exportResult.schemaJson,
            schemaMd: exportResult.schemaMd,
            name: metadataRef.current.name,
            description: metadataRef.current.description
          })
          const savedModel = result as Model | undefined

          if (savedModel) {
            ; (window as any).__modelJustSaved = true
          }
          return savedModel
        }
        return undefined
      } catch (error) {
        console.error('Error saving model data:', error)
        throw error
      } finally {
        isSavingRef.current = false
      }
    }

    if (hasWorkflow) {
      setCurrentWorkflowConfig(currentConfig)
      setSaveWorkflowDialogOpen(true)
    } else {
      if (pendingSaveRef.current) {
        await pendingSaveRef.current()
        pendingSaveRef.current = null
      }
    }
  }

  const handlePushToDB = async (graph: Array<Record<string, unknown>>) => {
    try {
      if (!model?.id) {
        toast.error('Model must be saved before pushing to database')
        return
      }

      const response = await fetch('/api/graph/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modelId: model.id,
          graph
        }),
      })

      if (!response.ok) {
        const result = await response.json().catch(() => ({ error: 'Failed' }))
        throw new Error(result.error || 'Failed to push graph to database')
      }

      toast.success('Successfully published graph to the database')
    } catch (error) {
      console.error('Error pushing data to database:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to push graph to database')
    }
  }

  // Use useImperativeHandle to expose the save trigger to the parent
  useImperativeHandle(builderRef, () => ({
    exportData: () => {
      if (builderInternalRef.current) {
        return builderInternalRef.current.exportData()
      }
      return { schemaJson: {}, schemaMd: '' }
    },
    triggerSave: triggerSave,
    loadData: (data: any) => builderInternalRef.current?.loadData(data),
    clear: () => builderInternalRef.current?.clear(),
    clearWorkflow: () => builderInternalRef.current?.clearWorkflow(),
    getWorkflowConfig: () => builderInternalRef.current?.getWorkflowConfig() || null,
    hasChanges: () => builderInternalRef.current?.hasChanges() || false
  }))

  const builderInternalRef = useRef<ModelBuilderRef | null>(null)

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
    return builderInternalRef.current?.getWorkflowConfig() || null
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
    if (!effectivePersistence) {
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
        await effectivePersistence.onSaveWorkflow?.({
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
        await effectivePersistence.onUpdateWorkflow?.(workflowAction.workflowId, {
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

  const handleWorkflowChange = async (workflowId: string) => {
    if (await hasUnsavedWorkflowChanges()) {
      setPendingWorkflowId(workflowId)
      setWorkflowChangeConfirmOpen(true)
    } else {
      loadWorkflow(workflowId)
    }
  }

  const loadWorkflow = async (workflowId: string | null) => {
    if (!effectivePersistence || !model?.id) return

    if (!workflowId) {
      setCurrentWorkflow(null)
      setSavedWorkflowConfig(null)
      builderInternalRef.current?.clearWorkflow()
      return
    }

    try {
      const workflow = await effectivePersistence.onLoadWorkflow?.(workflowId)
      if (workflow) {
        setCurrentWorkflow(workflow)
        // Normalize the saved config when loading to ensure consistent comparison later
        const normalizedSavedConfig = JSON.parse(JSON.stringify(workflow.config))
        setSavedWorkflowConfig(normalizedSavedConfig)

        // The builder will detect the change in initialWorkflow and load it automatically
      }
    } catch (error) {
      console.error('Error loading workflow:', error)
      toast.error('Failed to load workflow')
    }
  }

  const confirmWorkflowChange = () => {
    if (pendingWorkflowId) {
      loadWorkflow(pendingWorkflowId)
    }
    setPendingWorkflowId(null)
    setWorkflowChangeConfirmOpen(false)
  }

  const cancelWorkflowChange = () => {
    setPendingWorkflowId(null)
    setWorkflowChangeConfirmOpen(false)
  }

  // Check if current workflow has unsaved changes
  // Only considers structural changes (tools, actions, edges, connections)
  // Ignores position changes
  const hasUnsavedWorkflowChanges = async (): Promise<boolean> => {
    if (!currentWorkflow || !savedWorkflowConfig) {
      return false
    }

    try {
      const currentConfig = await getCurrentWorkflowConfig()
      if (!currentConfig) return false

      // Check if there are any tools or actions on the canvas
      const hasTools = currentConfig.tools && currentConfig.tools.length > 0
      const hasActions = currentConfig.actions && currentConfig.actions.length > 0

      // If no tools or actions, no changes (unless we had some before)
      if (!hasTools && !hasActions && (!savedWorkflowConfig || (
        !(savedWorkflowConfig as any).tools?.length && !(savedWorkflowConfig as any).actions?.length
      ))) {
        return false
      }

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

  // Switch to a workflow
  const switchToWorkflow = async (workflowId: string) => {
    if (!effectivePersistence?.onLoadWorkflow) {
      toast.error('Workflow persistence not available')
      return
    }

    try {
      // Clear existing tools and actions before loading new workflow
      // But keep model nodes and relationships
      builderInternalRef.current?.clearWorkflow()

      const workflow = await effectivePersistence.onLoadWorkflow(workflowId)
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
    if (!pendingWorkflowId || !currentWorkflow || !effectivePersistence) return

    try {
      if (updateCurrent) {
        // Update current workflow first
        const workflowConfig = await getCurrentWorkflowConfig()
        if (!workflowConfig) {
          toast.error('Could not get current workflow configuration')
          return
        }

        await effectivePersistence.onUpdateWorkflow?.(currentWorkflow.id, {
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

  // Wait for AI settings to load before rendering
  if (aiSettings === null) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <AISettingsProvider settings={aiSettings || undefined}>
      <div className={`flex-1 overflow-hidden flex flex-col ${className || ''}`}>
        <ModelBuilder
          ref={builderInternalRef}
          initialWorkflow={currentWorkflow || undefined}
          currentWorkflowName={currentWorkflow?.name}
          availableWorkflows={existingWorkflows}
          workflowPersistence={effectivePersistence}
          className="h-full"
          onWorkflowChange={handleWorkflowChange}
          onPushToDB={handlePushToDB}
          onSave={triggerSave}
        />
      </div>
      <SaveWorkflowDialog
        open={saveWorkflowDialogOpen}
        onOpenChange={setSaveWorkflowDialogOpen}
        workflowPersistence={effectivePersistence}
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
