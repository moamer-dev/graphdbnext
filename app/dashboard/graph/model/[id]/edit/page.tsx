'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useModelBuilder } from '@/lib/hooks/useModelBuilder'
import { useModelBuilderStore, useToolCanvasStore, useActionCanvasStore } from '@graphdb/model-builder'
import { resourceHooks } from '@/lib/react-query/hooks'
import { ModelResource, type Model } from '@/lib/resources/ModelResource'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ArrowLeft, Save, X } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/confirm-dialog'

export default function EditModelPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const modelId = params.id as string

  const { isEnabled, loading: moduleLoading, ModelBuilderAdapter } = useModelBuilder()
  const { data: modelData, isLoading } = resourceHooks.models.useSingle(modelId)
  const updateModelMutation = resourceHooks.models.useUpdate()
  const clearBuilder = useModelBuilderStore(state => state.clear)
  const clearTools = useToolCanvasStore(state => state.clear)
  const clearActions = useActionCanvasStore(state => state.clear)

  // Clear builder state when unmounting
  useEffect(() => {
    return () => {
      clearBuilder()
      clearTools()
      clearActions()
    }
  }, [clearBuilder, clearTools, clearActions])

  const model = modelData?.data as Model | undefined
  const [saving, setSaving] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)

  const handleSave = async (data: {
    schemaJson?: unknown
    schemaMd?: string
    name?: string
    description?: string
  }) => {
    if (!model) return

    setSaving(true)
    try {
      await updateModelMutation.mutateAsync({
        id: modelId,
        data: {
          ...data
        }
      })
      toast.success('Model updated successfully')
      router.push(`${ModelResource.VIEW_PATH}/${modelId}`)
    } catch (error) {
      console.error('Error saving model:', error)
      toast.error('Failed to save model')
      throw error
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (saving) {
      setCancelDialogOpen(true)
    } else {
      router.push(`${ModelResource.VIEW_PATH}/${modelId}`)
    }
  }

  if (moduleLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!model) {
    return (
      <Alert>
        <AlertDescription>Model not found</AlertDescription>
      </Alert>
    )
  }

  if (!isEnabled) {
    return (
      <div className="space-y-4 mt-4">
        <div className="gradient-header-minimal pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`${ModelResource.VIEW_PATH}/${modelId}`)}
                className="h-7 text-xs hover:bg-muted/40"
              >
                <ArrowLeft className="h-3 w-3 mr-1.5" />
                Back to Model
              </Button>
              <div>
                <h1 className="text-lg font-semibold tracking-tight">
                  Edit Model
                </h1>
              </div>
            </div>
          </div>
        </div>
        <Alert>
          <AlertDescription>
            Model Builder module is not enabled. Please enable it in Settings → Modules to edit models.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!ModelBuilderAdapter) {
    return (
      <Alert>
        <AlertDescription>
          Failed to load Model Builder. Please check that the module is properly installed.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col">
      <div className="gradient-header-minimal pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={saving}
              className="h-7 text-xs hover:bg-muted/40"
            >
              <ArrowLeft className="h-3 w-3 mr-1.5" />
              Cancel
            </Button>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">
                Edit Model: {model.name}
              </h1>
              <p className="text-xs mt-1.5 text-muted-foreground/70">
                Use the visual builder to edit your model schema
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={saving}
              className="h-7 text-xs"
            >
              <X className="h-3 w-3 mr-1.5" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                // Trigger save from adapter
                // This will be handled by the adapter's onSave callback
                const event = new CustomEvent('model-builder:save')
                window.dispatchEvent(event)
              }}
              disabled={saving}
              className="h-7 text-xs"
            >
              {(saving || updateModelMutation.isPending) ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-3 w-3 mr-1.5" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        {ModelBuilderAdapter && (
          <ModelBuilderAdapter
            model={model}
            onSave={handleSave}
            className="h-full"
          />
        )}
      </div>
      <ConfirmDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        onConfirm={() => {
          setCancelDialogOpen(false)
          router.push(`${ModelResource.VIEW_PATH}/${modelId}`)
        }}
        title="Cancel Editing"
        description="You have unsaved changes. Are you sure you want to cancel?"
        confirmLabel="Yes, Cancel"
        variant="destructive"
      />
    </div>
  )
}

