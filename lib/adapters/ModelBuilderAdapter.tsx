'use client'

import {
  ModelBuilder,
  AISettingsProvider
} from '@graphdb/model-builder'
import type {
  WorkflowPersistence,
  ModelBuilderRef
} from '@graphdb/model-builder'
import type { Model } from '@/lib/resources/ModelResource'
import { useModelBuilderAdapter } from './useModelBuilderAdapter'

export interface ModelBuilderAdapterProps {
  model: Model | null
  onSave?: (data: { schemaJson: unknown; schemaMd: string; name: string; description?: string }) => Promise<Model | void>
  className?: string
  builderRef?: React.RefObject<ModelBuilderRef | null>
  workflowPersistence?: WorkflowPersistence
}

/**
 * Adapter component that wraps the model-builder package
 * and connects it to the main app's Model database entity.
 */
export function ModelBuilderAdapter({
  model = null,
  onSave,
  className,
  builderRef,
  workflowPersistence
}: ModelBuilderAdapterProps) {
  const {
    aiSettings,
    existingWorkflows,
    currentWorkflow,
    effectivePersistence,
    handleWorkflowChange,
    handleSaveModel,
    isNewModel
  } = useModelBuilderAdapter({
    model,
    onSave,
    builderRef,
    workflowPersistence
  })

  if (aiSettings === null) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-sm text-muted-foreground">Loading settings...</div>
      </div>
    )
  }

  return (
    <AISettingsProvider settings={aiSettings || undefined}>
      <div className={`flex-1 overflow-hidden flex flex-col ${className || ''}`}>
        <ModelBuilder
          ref={builderRef}
          initialWorkflow={currentWorkflow}
          currentWorkflowName={currentWorkflow?.name}
          availableWorkflows={existingWorkflows}
          workflowPersistence={effectivePersistence}
          className="h-full"
          onWorkflowChange={handleWorkflowChange}
          onSaveModel={handleSaveModel}
          isNewModel={isNewModel}
        />
      </div>
    </AISettingsProvider>
  )
}
