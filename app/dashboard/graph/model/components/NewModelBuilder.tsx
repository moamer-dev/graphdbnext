'use client'

import { useEffect, useRef } from 'react'
import { useModelBuilder } from '@/lib/hooks/useModelBuilder'
import { useModelBuilderStore } from '@graphdb/model-builder'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, ArrowLeft, Save, X } from 'lucide-react'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { ModelResource } from '@/lib/resources/ModelResource'
import { useRouter } from 'next/navigation'

interface NewModelBuilderProps {
  modelName: string
  onModelNameChange: (name: string) => void
  onSave: (data: {
    schemaJson?: unknown
    schemaMd?: string
    name?: string
    description?: string
  }) => Promise<import('@/lib/resources/ModelResource').Model>
  onCancel: () => void
  saving: boolean
  isPending: boolean
  cancelDialogOpen: boolean
  onCancelDialogChange: (open: boolean) => void
  onConfirmCancel: () => void
  hasChanges: boolean
  onHasChangesChange: (hasChanges: boolean) => void
  fromXml?: boolean
}

export function NewModelBuilder({
  modelName,
  onModelNameChange,
  onSave,
  onCancel,
  saving,
  isPending,
  cancelDialogOpen,
  onCancelDialogChange,
  onConfirmCancel,
  onHasChangesChange,
  fromXml = false
}: NewModelBuilderProps) {
  const router = useRouter()
  const { isEnabled, loading: moduleLoading, ModelBuilderAdapter } = useModelBuilder()

  // Track builder state to detect changes
  const nodes = useModelBuilderStore(state => state.nodes)
  const relationships = useModelBuilderStore(state => state.relationships)
  const metadata = useModelBuilderStore(state => state.metadata)
  const initialStateRef = useRef<{ nodes: typeof nodes; relationships: typeof relationships; metadata: typeof metadata } | null>(null)
  const isInitializedRef = useRef(false)

  // Initialize initial state once when builder is ready
  useEffect(() => {
    // Wait a bit for model to load (if coming from XML import)
    if (!isInitializedRef.current && ModelBuilderAdapter) {
      // Use setTimeout to allow model to load first
      const timer = setTimeout(() => {
        if (!initialStateRef.current) {
          initialStateRef.current = {
            nodes: [...nodes],
            relationships: [...relationships],
            metadata: { ...metadata }
          }
          isInitializedRef.current = true
        }
      }, 500) // Small delay to allow model loading

      return () => clearTimeout(timer)
    }
  }, [ModelBuilderAdapter, nodes, relationships, metadata])

  // Detect changes in builder state
  useEffect(() => {
    if (!initialStateRef.current || !isInitializedRef.current) return

    const hasNodesChanged = nodes.length !== initialStateRef.current.nodes.length ||
      nodes.some((node, index) => {
        const initialNode = initialStateRef.current!.nodes[index]
        return !initialNode ||
          node.id !== initialNode.id ||
          node.label !== initialNode.label ||
          JSON.stringify(node.properties) !== JSON.stringify(initialNode.properties)
      })

    const hasRelationshipsChanged = relationships.length !== initialStateRef.current.relationships.length ||
      relationships.some((rel, index) => {
        const initialRel = initialStateRef.current!.relationships[index]
        return !initialRel ||
          rel.id !== initialRel.id ||
          rel.type !== initialRel.type ||
          rel.from !== initialRel.from ||
          rel.to !== initialRel.to
      })

    const hasMetadataChanged = metadata.name !== initialStateRef.current.metadata.name ||
      metadata.description !== initialStateRef.current.metadata.description

    if (hasNodesChanged || hasRelationshipsChanged || hasMetadataChanged) {
      onHasChangesChange(true)
    }
  }, [nodes, relationships, metadata, onHasChangesChange])

  if (moduleLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
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
                onClick={() => router.push(ModelResource.LIST_PATH)}
                className="h-7 text-xs hover:bg-muted/40"
              >
                <ArrowLeft className="h-3 w-3 mr-1.5" />
                Back to Models
              </Button>
              <div>
                <h1 className="text-lg font-semibold tracking-tight">
                  Create New Model
                </h1>
              </div>
            </div>
          </div>
        </div>
        <Alert>
          <AlertDescription>
            Model Builder module is not enabled. Please enable it in Settings → Modules to create models visually.
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
      <div className="gradient-header-minimal pb-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={saving}
              className="h-7 text-xs hover:bg-muted/40"
            >
              <ArrowLeft className="h-3 w-3 mr-1.5" />
              {fromXml ? 'Back to Configurations' : 'Back to Models'}
            </Button>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">
                Create New Model
              </h1>
              <p className="text-xs mt-1.5 text-muted-foreground/70">
                Use the visual builder to create your model schema
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="model-name" className="text-xs text-muted-foreground">
                Name:
              </Label>
              <Input
                id="model-name"
                value={modelName}
                onChange={(e) => {
                  onModelNameChange(e.target.value)
                  onHasChangesChange(true)
                }}
                placeholder="Model name"
                className="h-7 w-[200px] text-xs"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              disabled={saving}
              className="h-7 text-xs"
            >
              <X className="h-3 w-3 mr-1.5" />
              {fromXml ? 'Back to Configurations' : 'Back to Models'}
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (!modelName.trim() || saving || isPending) {
                  return
                }
                // Dispatch save event - ModelBuilderAdapter will handle it
                const event = new CustomEvent('model-builder:save')
                window.dispatchEvent(event)
              }}
              disabled={saving || isPending || !modelName.trim()}
              className="h-7 text-xs"
            >
              {saving || isPending ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-3 w-3 mr-1.5" />
                  Create Model
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        {ModelBuilderAdapter && (
          <ModelBuilderAdapter
            model={!fromXml ? {
              id: 'new',
              name: modelName,
              description: '',
              version: '1.0.0',
              schemaJson: null,
              schemaMd: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            } as any : null}
            onSave={async (data: {
              schemaJson?: unknown
              schemaMd?: string
              name?: string
              description?: string
            }): Promise<import('@/lib/resources/ModelResource').Model> => {
              return await onSave({
                ...data,
                name: modelName || data.name
              })
            }}
            className="h-full"
          />
        )}
      </div>
      <ConfirmDialog
        open={cancelDialogOpen}
        onOpenChange={onCancelDialogChange}
        onConfirm={onConfirmCancel}
        title={fromXml ? 'Back to Configurations' : 'Back to Models'}
        description={fromXml
          ? 'You have unsaved changes. Are you sure you want to go back to configurations?'
          : 'You have unsaved changes. Are you sure you want to go back to models?'
        }
        confirmLabel="Yes, Go Back"
        variant="destructive"
      />
    </div>
  )
}

