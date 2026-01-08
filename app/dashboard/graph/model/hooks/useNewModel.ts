'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useModelBuilder } from '@/lib/hooks/useModelBuilder'
import { resourceHooks } from '@/lib/react-query/hooks'
import { ModelResource } from '@/lib/resources/ModelResource'
import { toast } from 'sonner'
import { useXmlImportWizardStore } from '@graphdb/model-builder'

export function useNewModel () {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fromXml = searchParams.get('from') === 'xml'
  const { isEnabled, loading: moduleLoading, ModelBuilderAdapter } = useModelBuilder()
  const createModelMutation = resourceHooks.models.useCreate()

  const [modelName, setModelName] = useState('')
  const [saving, setSaving] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const handleSave = async (data: {
    schemaJson?: unknown
    schemaMd?: string
    name?: string
    description?: string
  }): Promise<import('@/lib/resources/ModelResource').Model> => {
    if (!modelName.trim()) {
      toast.error('Model name is required')
      throw new Error('Model name is required')
    }

    setSaving(true)
    try {
      const response = await createModelMutation.mutateAsync({
        name: data.name || modelName,
        description: data.description || undefined,
        schemaJson: data.schemaJson,
        schemaMd: data.schemaMd,
        version: '1.0.0'
      } as Partial<import('@/lib/resources/ModelResource').Model>)
      
      // Extract model from response
      const model = (response as unknown as { data?: import('@/lib/resources/ModelResource').Model }).data || 
                    (response as unknown as import('@/lib/resources/ModelResource').Model)
      
      // Check if workflow is being saved (adapter will handle navigation in that case)
      const workflowBeingSaved = (window as any).__workflowSaveInProgress
      
      if (!workflowBeingSaved) {
        // No workflow being saved, navigate immediately
        toast.success('Model created successfully')
        router.push(ModelResource.LIST_PATH)
      } else {
        // Workflow is being saved, adapter will handle navigation
        toast.success('Model created successfully')
      }
      
      return model
    } catch (error) {
      console.error('Error creating model:', error)
      toast.error('Failed to create model')
      throw error
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    // Always show confirmation dialog when coming from XML import
    // (user might want to go back to adjust configurations)
    // Otherwise, only show if there are changes
    if (fromXml || hasChanges) {
      setCancelDialogOpen(true)
    } else {
      router.push(ModelResource.LIST_PATH)
    }
  }

  const confirmCancel = () => {
    setCancelDialogOpen(false)
    // If we came from XML import, go back to XML import wizard at configure step
    // Otherwise, go to models list
    if (fromXml) {
      // Set the step to 'configure' in the store before navigating
      useXmlImportWizardStore.getState().setStep('configure')
      router.push('/dashboard/graph/model/new/from-xml')
    } else {
      router.push(ModelResource.LIST_PATH)
    }
  }

  return {
    // State
    modelName,
    setModelName,
    saving,
    cancelDialogOpen,
    setCancelDialogOpen,
    hasChanges,
    setHasChanges,
    moduleLoading,
    isEnabled,
    ModelBuilderAdapter,
    isPending: createModelMutation.isPending,
    fromXml,

    // Actions
    handleSave,
    handleCancel,
    confirmCancel
  }
}

