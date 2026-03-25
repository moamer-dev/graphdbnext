'use client'

import { Suspense } from 'react'
import { useNewModel } from '../hooks/useNewModel'
import { NewModelBuilder } from '../components/NewModelBuilder'

function NewModelPageContent() {
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
    confirmCancel,
    fromXml
  } = useNewModel()

  return (
    <NewModelBuilder
      modelName={modelName}
      onModelNameChange={setModelName}
      onSave={handleSave}
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

export default function NewModelPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewModelPageContent />
    </Suspense>
  )
}

