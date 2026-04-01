'use client'

import {
  ModelBuilder,
  AISettingsProvider
} from '@plexus/builder'
import type {
  WorkflowPersistence,
  DataSourcesPersistence,
  CredentialsPersistence,
  AIPersistence,
  ModelBuilderRef
} from '@plexus/builder'
import type { Model } from '@/resources/ModelResource'
import { useModelBuilderAdapter } from './useModelBuilderAdapter'

export interface ModelBuilderAdapterProps {
  model: Model | null
  onSave?: (data: { schemaJson: unknown; schemaMd: string; name: string; description?: string }) => Promise<Model | void>
  className?: string
  builderRef?: React.RefObject<ModelBuilderRef | null>
  workflowPersistence?: WorkflowPersistence
  dataSourcesPersistence?: DataSourcesPersistence
  credentialsPersistence?: CredentialsPersistence
  aiPersistence?: AIPersistence
  onPushToDB?: (graph: Array<Record<string, unknown>>) => Promise<void>
}

/**
 * Adapter component that wraps the plexus-builder package
 * and connects it to the main app's Model database entity.
 */
export function ModelBuilderAdapter({
  model = null,
  onSave,
  className,
  builderRef,
  workflowPersistence,
  dataSourcesPersistence,
  credentialsPersistence,
  aiPersistence,
  onPushToDB
}: ModelBuilderAdapterProps) {
  const {
    aiSettings,
    existingWorkflows,
    currentWorkflow,
    effectivePersistence,
    effectiveDataSourcesPersistence,
    effectiveCredentialsPersistence,
    effectiveAiPersistence,
    handleWorkflowChange,
    handleSaveModel,
    onPushToDB: adapterOnPushToDB,
    isNewModel
  } = useModelBuilderAdapter({
    model,
    onSave,
    builderRef,
    workflowPersistence,
    dataSourcesPersistence,
    credentialsPersistence,
    aiPersistence,
    onPushToDB
  })

  if (aiSettings === null) {
    return (
      <>
        <div className="flex items-center justify-center h-full">
          <div className="text-sm text-muted-foreground">Loading settings...</div>
        </div>
      </>
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
          dataSourcesPersistence={effectiveDataSourcesPersistence}
          credentialsPersistence={effectiveCredentialsPersistence}
          aiPersistence={effectiveAiPersistence}
          className="h-full"
          onWorkflowChange={handleWorkflowChange}
          onSaveModel={handleSaveModel}
          onPushToDB={adapterOnPushToDB}
          isNewModel={isNewModel}
        />
      </div>
    </AISettingsProvider>
  )
}
