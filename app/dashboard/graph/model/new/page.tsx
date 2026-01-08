'use client'

import { useNewModel } from '../hooks/useNewModel'
import { NewModelBuilder } from '../components/NewModelBuilder'

export default function NewModelPage () {
  const {
    modelName,
    setModelName,
    saving,
    cancelDialogOpen,
    setCancelDialogOpen,
    hasChanges,
    setHasChanges,
    isPending,
    handleSave,
    handleCancel,
    confirmCancel,
    fromXml
  } = useNewModel()

  return (
    <NewModelBuilder
      modelName={modelName}
      onModelNameChange={setModelName}
      onSave={handleSave}
      onCancel={handleCancel}
      saving={saving}
      isPending={isPending}
      cancelDialogOpen={cancelDialogOpen}
      onCancelDialogChange={setCancelDialogOpen}
      onConfirmCancel={confirmCancel}
      hasChanges={hasChanges}
      onHasChangesChange={setHasChanges}
      fromXml={fromXml}
    />
  )
}

