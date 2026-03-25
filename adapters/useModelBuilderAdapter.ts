import { useEffect, useState, useRef, useMemo } from 'react'
import {
  DEFAULT_AI_SETTINGS
} from '@plexus/builder'
import type {
  AISettings,
  WorkflowPersistence,
  ModelBuilderRef
} from '@plexus/builder'
import type { Model } from '@/resources/ModelResource'
import { toast } from 'sonner'

export interface UseModelBuilderAdapterProps {
  model: Model | null
  onSave?: (data: { schemaJson: unknown; schemaMd: string; name: string; description?: string }) => Promise<Model | void>
  builderRef?: React.RefObject<ModelBuilderRef | null>
  workflowPersistence?: WorkflowPersistence
}

export function useModelBuilderAdapter({
  model,
  onSave,
  builderRef,
  workflowPersistence
}: UseModelBuilderAdapterProps) {
  const loadedRef = useRef(false)
  const lastModelIdRef = useRef<string | null>(model?.id || null)
  const [aiSettings, setAiSettings] = useState<AISettings | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [existingWorkflows, setExistingWorkflows] = useState<any[]>([])
  const [currentWorkflow, setCurrentWorkflow] = useState<any>(null)
  const persistedWorkflowKey = model?.id ? `plexus-builder:selected-workflow:${model.id}` : null
  const hasLoadedInitialWorkflowRef = useRef(false)

  // Default workflow persistence using app's API
  const defaultPersistence = useMemo<WorkflowPersistence>(() => {
    const modelId = model?.id || 'new'
    return {
      modelId,
      onSaveWorkflow: async (workflow) => {
        const response = await fetch('/api/workflows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            modelId: model?.id,
            ...workflow
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
      onLoadWorkflows: async (mId) => {
        const response = await fetch(`/api/workflows?modelId=${mId}`)
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

  // Load app's AI settings from database API
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/ai-settings')
        if (response.ok) {
          const data = await response.json()
          setAiSettings(data)
        } else {
          setAiSettings(DEFAULT_AI_SETTINGS)
        }
      } catch (error) {
        console.error('Error loading AI settings:', error)
        setAiSettings(DEFAULT_AI_SETTINGS)
      }
    }
    fetchSettings()
  }, [])

  // Load available workflows and handle initial selection
  useEffect(() => {
    const initWorkflows = async () => {
      if (!model?.id || model.id === 'new') {
        setExistingWorkflows([])
        setCurrentWorkflow(null)
        return
      }

      try {
        const workflows = await effectivePersistence.onLoadWorkflows?.(model.id)
        if (workflows) {
          setExistingWorkflows(workflows)
          
          // Only handle initial selection once per model load
          if (!hasLoadedInitialWorkflowRef.current && persistedWorkflowKey) {
            const storedId = localStorage.getItem(persistedWorkflowKey)
            const initialId = storedId && workflows.some(w => w.id === storedId) ? storedId : workflows[0]?.id
            
            if (initialId) {
              const workflow = await effectivePersistence.onLoadWorkflow?.(initialId)
              setCurrentWorkflow(workflow)
              hasLoadedInitialWorkflowRef.current = true
            }
          }
        }
      } catch (error) {
        console.error('Error initializing workflows:', error)
      }
    }
    initWorkflows()
  }, [model?.id, effectivePersistence, refreshTrigger, persistedWorkflowKey])

  // Load model data into builder when model changes
  useEffect(() => {
    if (model?.id !== lastModelIdRef.current) {
      loadedRef.current = false
      lastModelIdRef.current = model?.id || null
      hasLoadedInitialWorkflowRef.current = false
    }

    if (!model || loadedRef.current) return

    const loadModelData = () => {
      if (builderRef?.current) {
        if (model.schemaJson) {
          builderRef.current.loadData(model.schemaJson)
        } else if (model.schemaMd) {
          builderRef.current.loadData(model.schemaMd)
        } else {
          builderRef.current.clear()
          builderRef.current.loadData({
            metadata: {
              name: model.name,
              description: model.description || '',
              version: model.version || '1.0.0'
            }
          })
        }
        loadedRef.current = true
      }
    }

    const timer = setTimeout(loadModelData, 100)
    return () => clearTimeout(timer)
  }, [model, builderRef])

  const handleWorkflowChange = async (workflowId: string) => {
    if (!workflowId) {
      setCurrentWorkflow(null)
      if (persistedWorkflowKey) localStorage.removeItem(persistedWorkflowKey)
      return
    }

    try {
      const workflow = await effectivePersistence.onLoadWorkflow?.(workflowId)
      setCurrentWorkflow(workflow)
      if (persistedWorkflowKey) localStorage.setItem(persistedWorkflowKey, workflowId)
      toast.success(`Switched to workflow "${workflow?.name}"`)
    } catch (error) {
      console.error('Error switching workflow:', error)
      toast.error('Failed to load workflow')
    }
  }

  const handleSaveModel = async (data: { schemaJson: any; schemaMd: string; metadata: any }) => {
    if (!onSave) return

    try {
      await onSave({
        schemaJson: data.schemaJson,
        schemaMd: data.schemaMd,
        name: data.metadata.name,
        description: data.metadata.description
      })
      toast.success('Model saved successfully')
    } catch (error) {
      console.error('Error saving model:', error)
      toast.error('Failed to save model')
    }
  }

  return {
    aiSettings,
    existingWorkflows,
    currentWorkflow,
    effectivePersistence,
    handleWorkflowChange,
    handleSaveModel,
    isNewModel: !model || model.id === 'new'
  }
}
