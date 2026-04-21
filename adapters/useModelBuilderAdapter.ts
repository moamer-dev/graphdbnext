import { useEffect, useState, useRef, useMemo } from 'react'
import {
  DEFAULT_AI_SETTINGS
} from '@plexus/builder'
import type {
  AISettings,
  WorkflowPersistence,
  DataSourcesPersistence,
  CredentialsPersistence,
  AIPersistence,
  ModelBuilderRef
} from '@plexus/builder'
import type { Model } from '@/resources/ModelResource'
import { DataSourceResource } from '@/resources/DataSourceResource'
import { toast } from 'sonner'
import { useDatabaseStore } from '@/stores/databaseStore'
import { useTenantStore } from '@/stores/tenantStore'

export interface UseModelBuilderAdapterProps {
  model: Model | null
  onSave?: (data: { schemaJson: unknown; schemaMd: string; name: string; description?: string }) => Promise<Model | void>
  builderRef?: React.RefObject<ModelBuilderRef | null>
  workflowPersistence?: WorkflowPersistence
  dataSourcesPersistence?: DataSourcesPersistence
  credentialsPersistence?: CredentialsPersistence
  aiPersistence?: AIPersistence
  onPushToDB?: (graph: Array<Record<string, unknown>>) => Promise<void>
}

export function useModelBuilderAdapter({
  model,
  onSave,
  builderRef,
  workflowPersistence,
  dataSourcesPersistence: passedDataSourcesPersistence,
  credentialsPersistence: passedCredentialsPersistence,
  aiPersistence: passedAiPersistence,
  onPushToDB: passedOnPushToDB
}: UseModelBuilderAdapterProps) {
  const loadedRef = useRef(false)
  const lastModelIdRef = useRef<string | null>(model?.id || null)
  const [aiSettings, setAiSettings] = useState<AISettings | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [existingWorkflows, setExistingWorkflows] = useState<any[]>([])
  const [currentWorkflow, setCurrentWorkflow] = useState<any>(null)
  const persistedWorkflowKey = model?.id ? `plexus-builder:selected-workflow:${model.id}` : null
  const hasLoadedInitialWorkflowRef = useRef(false)

  const { activeWorkspaceId: globalActiveWorkspaceId, isGlobalScope } = useTenantStore()
  
  // Effective workspace context
  const workspaceId = model?.workspaceId || globalActiveWorkspaceId || 'default'

  // Default workflow persistence using app's API
  const defaultPersistence = useMemo<WorkflowPersistence>(() => {
    return {
      modelId: model?.id || 'new',
      onSaveWorkflow: async (workflow) => {
        const response = await fetch('/api/workflows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ modelId: model?.id, ...workflow })
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

  // Default DataSources persistence
  const defaultDataSourcesPersistence = useMemo<DataSourcesPersistence>(() => ({
    onLoad: async () => {
      const url = isGlobalScope 
        ? DataSourceResource.BASE_PATH 
        : `${DataSourceResource.BASE_PATH}?workspaceId=${workspaceId}`
      const resp = await fetch(url)
      if (!resp.ok) return []
      const result = await resp.json()
      return result.data || []
    },
    onSave: async (source) => {
      await fetch(DataSourceResource.BASE_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...source, workspaceId })
      })
    },
    onDelete: async (id) => {
      await fetch(`${DataSourceResource.BASE_PATH}/${id}`, { method: 'DELETE' })
    }
  }), [workspaceId, isGlobalScope])

  // Default Credentials persistence
  const defaultCredentialsPersistence = useMemo<CredentialsPersistence>(() => ({
    onLoad: async () => {
      const params = new URLSearchParams({ 
        pageSize: '1000',
        isGlobalScope: isGlobalScope.toString()
      })
      if (!isGlobalScope && globalActiveWorkspaceId) {
        params.append('workspaceId', globalActiveWorkspaceId)
      }
      const resp = await fetch(`/api/credentials?${params.toString()}`)
      if (!resp.ok) return []
      const result = await resp.json()
      
      // Map DB credentials to Builder format
      return (result.data || []).map((cred: any) => ({
        id: cred.id,
        name: cred.name,
        type: cred.type,
        data: cred.data,
        storageSource: 'db' as const,
        workspaceId: cred.workspaceId,
        createdAt: new Date(cred.createdAt).getTime(),
        updatedAt: new Date(cred.updatedAt).getTime(),
        isActive: cred.isActive
      }))
    },
    onSave: async (cred) => {
      const resp = await fetch('/api/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...cred, workspaceId })
      })
      if (!resp.ok) throw new Error('Failed to save credential')
      return resp.json()
    },
    onUpdate: async (id, cred) => {
      const resp = await fetch(`/api/credentials/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...cred, workspaceId })
      })
      if (!resp.ok) throw new Error('Failed to update credential')
      return resp.json()
    },
    onDelete: async (id) => {
      const resp = await fetch(`/api/credentials/${id}`, { method: 'DELETE' })
      if (!resp.ok) throw new Error('Failed to delete credential')
    },
    activeWorkspaceId: workspaceId
  }), [workspaceId, isGlobalScope, globalActiveWorkspaceId])

  // Default AI persistence
  const defaultAiPersistence = useMemo<AIPersistence>(() => ({
    onLoadSessions: async () => {
      const resp = await fetch(`/api/ai/sessions?workspaceId=${workspaceId}`)
      if (!resp.ok) return []
      const data = await resp.json()
      return data.sessions
    },
    onCreateSession: async (session) => {
      const resp = await fetch('/api/ai/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...session, workspaceId })
      })
      const data = await resp.json()
      return { id: data.session.id }
    },
    onLoadMessages: async (sessionId) => {
      const resp = await fetch(`/api/ai/messages?sessionId=${sessionId}`)
      if (!resp.ok) return []
      const data = await resp.json()
      return data.messages
    },
    onSaveMessage: async (sessionId, message) => {
      await fetch('/api/ai/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...message, sessionId })
      })
    }
  }), [workspaceId, isGlobalScope])

  const effectivePersistence = workflowPersistence || defaultPersistence
  const effectiveDataSourcesPersistence = passedDataSourcesPersistence || defaultDataSourcesPersistence
  const effectiveCredentialsPersistence = passedCredentialsPersistence || defaultCredentialsPersistence
  const effectiveAiPersistence = passedAiPersistence || defaultAiPersistence

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

  const handlePushToDB = async (graph: Array<Record<string, unknown>>) => {
    if (passedOnPushToDB) {
      return await passedOnPushToDB(graph)
    }

    try {
      const response = await fetch('/api/database/load', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ graph })
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to push to database')
      }
      
      const data = await response.json()
      
      // Invalidate database store caches to ensure Query View reflects new data
      const dbStore = useDatabaseStore.getState()
      dbStore.invalidateNodeLabels()
      dbStore.invalidateRelationshipTypes()
      dbStore.invalidateNodeProperties()
      await dbStore.checkStatus()
      
      toast.success(data.message || 'Graph successfully pushed to database')
    } catch (error) {
      console.error('Error pushing to DB:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to push to database')
      throw error
    }
  }

  return {
    aiSettings,
    existingWorkflows,
    currentWorkflow,
    effectivePersistence,
    effectiveDataSourcesPersistence,
    effectiveCredentialsPersistence,
    effectiveAiPersistence,
    handleWorkflowChange,
    handleSaveModel,
    onPushToDB: handlePushToDB,
    isNewModel: !model || model.id === 'new'
  }
}
