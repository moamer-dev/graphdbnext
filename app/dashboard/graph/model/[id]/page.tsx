'use client'

import { ModelVisualization } from '../components'
import { ModelResource } from '@/resources/ModelResource'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, ArrowLeft, FileText, Database, Trash2, Edit, Calendar, Clock, Tag } from 'lucide-react'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { useModelDetail } from '../hooks/useModelDetail'

export default function ViewModelPage () {
  const {
    model,
    displaySchema,
    isLoading,
    deleteModel,
    deleteDialogOpen,
    setDeleteDialogOpen,
    handleDelete,
    handleEdit,
    handleBack
  } = useModelDetail()

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
              onClick={handleBack}
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
                {model.creator && (
                  <span className="ml-2">
                    • Created by {model.creator.name ? model.creator.name : model.creator.email}
                  </span>
                )}
              </p>

              <div className="flex items-center gap-2 mt-3">
                <Badge variant="secondary" className="h-5 text-[10px] font-bold px-2 bg-primary/5 text-primary/80 border-primary/10 gap-1">
                  <Tag className="h-2.5 w-2.5" />
                  v{model.version}
                </Badge>
                <Badge variant="outline" className="h-5 text-[10px] font-medium px-2 gap-1 border-border/40 text-muted-foreground/80">
                  <Calendar className="h-2.5 w-2.5" />
                  Created: {new Date(model.createdAt).toLocaleDateString()}
                </Badge>
                <Badge variant="outline" className="h-5 text-[10px] font-medium px-2 gap-1 border-border/40 text-muted-foreground/80">
                  <Clock className="h-2.5 w-2.5" />
                  Updated: {new Date(model.updatedAt).toLocaleDateString()}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleEdit}
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

        {!displaySchema && (
          <Alert className="py-2 bg-muted/30 border-border/40">
            <FileText className="h-3.5 w-3.5 mr-2" />
            <AlertDescription className="text-xs">
              No schema data available for this model.
            </AlertDescription>
          </Alert>
        )}

        <div className="h-[calc(100vh-280px)] min-h-[750px] rounded-lg border border-border/20 bg-muted/10 backdrop-blur-sm overflow-hidden">
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
