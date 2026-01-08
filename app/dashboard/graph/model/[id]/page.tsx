'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ModelVisualization } from '../components'
import { resourceHooks } from '@/lib/react-query/hooks'
import { ModelResource, type Model } from '@/lib/resources/ModelResource'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ArrowLeft, FileText, Database, Trash2, Edit } from 'lucide-react'
import { toast } from 'sonner'
import type { Schema } from '@/lib/services/SchemaLoaderService'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { normalizeSchema } from '../hooks'

export default function ViewModelPage () {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const modelId = params.id as string

  const [schema, setSchema] = useState<Schema | null>(null)

  const isAdmin = session?.user?.role === 'ADMIN'

  // React Query hooks
  const { data: modelData, isLoading, error } = resourceHooks.models.useSingle(modelId)
  const deleteModel = resourceHooks.models.useDelete()

  // useResource extracts data from API response { model: Model } -> { data: Model }
  const model = modelData?.data as Model | undefined

  // Derive schema from model - use useMemo to compute schema
  const computedSchema = useMemo(() => {
    if (!model) return null
    
    // If schemaJson exists, normalize it first
    if (model.schemaJson) {
      return normalizeSchema(model.schemaJson)
    }
    
    return null
  }, [model])

  // Handle MD conversion - only run when model changes and no computed schema
  useEffect(() => {
    if (!model || computedSchema) return

    // If only MD exists, try to convert it via API
    if (model.schemaMd) {
      const convertMd = async () => {
        try {
          const convertResponse = await fetch(`/api/models/${modelId}/convert-md`, {
            method: 'POST'
          })
          if (convertResponse.ok) {
            const convertData = await convertResponse.json()
            if (convertData.schema) {
              const normalized = normalizeSchema(convertData.schema)
              setSchema(normalized)
            } else {
              toast.error('Failed to convert Markdown schema to JSON')
            }
          } else {
            toast.error('Failed to convert Markdown schema. Please use JSON format.')
          }
        } catch (error) {
          console.error('Error converting MD schema:', error)
          toast.error('Failed to convert Markdown schema. Please use JSON format.')
        }
      }
      convertMd()
    }
  }, [model, modelId, computedSchema])

  // Use computed schema or state schema
  const displaySchema = computedSchema || schema

  useEffect(() => {
    if (error) {
      router.push(ModelResource.LIST_PATH)
    }
  }, [error, router])

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const handleDelete = async () => {
    try {
      await deleteModel.mutateAsync(modelId)
      setDeleteDialogOpen(false)
      router.push(ModelResource.LIST_PATH)
    } catch (error) {
      console.error('Error deleting model:', error)
      // Dialog will stay open on error so user can retry
    }
  }

  if (isLoading) {
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
              <h1 className="text-lg font-semibold tracking-tight flex items-center gap-2">
                <Database className="h-4 w-4" />
                <span className="relative">
                  {model.name}
                  <span className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent"></span>
                </span>
              </h1>
              <p className="text-xs mt-1.5 text-muted-foreground/70">
                {model.description || 'No description'}
                {isAdmin && model.user && (
                  <span className="ml-2">
                    • Created by {model.user.email}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`${ModelResource.VIEW_PATH}/${modelId}/edit`)}
              className="h-7 text-xs border-border/40 bg-muted/30 hover:bg-muted/50 backdrop-blur-sm"
            >
              <Edit className="h-3 w-3 mr-1.5" />
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={deleteModel.isPending}
              className="h-7 text-xs"
            >
              {deleteModel.isPending ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-3 w-3 mr-1.5" />
                  Delete
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-muted/20 rounded-md border border-border/20 backdrop-blur-sm">
            <div className="text-muted-foreground/70 mb-1">Version</div>
            <div className="font-semibold">{model.version}</div>
          </div>
          <div className="p-3 bg-muted/20 rounded-md border border-border/20 backdrop-blur-sm">
            <div className="text-muted-foreground/70 mb-1">Created</div>
            <div className="font-semibold">{new Date(model.createdAt).toLocaleDateString()}</div>
          </div>
          <div className="p-3 bg-muted/20 rounded-md border border-border/20 backdrop-blur-sm">
            <div className="text-muted-foreground/70 mb-1">Updated</div>
            <div className="font-semibold">{new Date(model.updatedAt).toLocaleDateString()}</div>
          </div>
        </div>

        {!displaySchema && (
          <Alert className="py-2 bg-muted/30 border-border/40">
            <FileText className="h-3.5 w-3.5 mr-2" />
            <AlertDescription className="text-xs">
              No schema data available for this model.
            </AlertDescription>
          </Alert>
        )}

        <div className="h-[calc(100vh-400px)] min-h-[600px] rounded-lg border border-border/20 bg-muted/10 backdrop-blur-sm overflow-hidden">
          {displaySchema ? (
            <ModelVisualization schema={displaySchema} />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">No schema visualization available</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Delete Model"
        description={`Are you sure you want to delete "${model.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={deleteModel.isPending}
      />
    </div>
  )
}
