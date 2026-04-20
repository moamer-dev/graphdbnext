'use client'

import { Suspense } from 'react'
import { useState, useCallback, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DataTable } from '@/components/data-table/DataTable'
import { useResourceTable } from '@/hooks/view/useResourceTable'
import { resourceHooks } from '@/hooks/react-query'
import { ModelResource } from '@/resources/ModelResource'
import { useModelUpload } from '@/hooks/model/useModelUpload'
import { downloadTemplate } from '@/utils'
import { useModelBuilder } from '@/hooks'
import { Button } from '@/components/ui/button'
import { Upload, Plus, FileCode, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRBAC } from '@/hooks/useRBAC'
import { useUIStore } from '@/stores/uiStore'
import { ViewSwitcher } from '@/components/data-table/ViewSwitcher'
import { DataGrid } from '@/components/data-table/DataGrid'
import { ResourceCard } from '@/components/dashboard/ResourceCard'
import { Eye, Pencil, Trash2 } from 'lucide-react'

function ModelsPageContent() {
  const searchParams = useSearchParams()
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)

  useEffect(() => {
    if (searchParams?.get('action') === 'upload') {
      setUploadDialogOpen(true)
    }
  }, [searchParams])

  const [modelName, setModelName] = useState('')
  const [modelDescription, setModelDescription] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const router = useRouter()
  const { can } = useRBAC()

  const { dashboardView: currentView } = useUIStore()

  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'
  const { isEnabled: modelBuilderEnabled } = useModelBuilder()

  // Use generic hooks directly - no custom hook files needed!
  const {
    config,
    data,
    total,
    loading,
    page,
    pageSize,
    sortBy,
    sortOrder,
    filters,
    onPageChange,
    onPageSizeChange,
    onSortChange,
    onFiltersChange
  } = useResourceTable({
    resource: ModelResource,
    useList: resourceHooks.models.useList,
    useDelete: resourceHooks.models.useDelete,
    useBulkDelete: resourceHooks.models.useBulkDelete,
    isAdmin
  })
  const { uploadModel, uploading } = useModelUpload()
  const deleteMutation = resourceHooks.models.useDelete({ redirect: false })

  const handleFileUpload = async () => {
    if (!uploadFile || !modelName) return

    await uploadModel({
      file: uploadFile,
      name: modelName,
      description: modelDescription || undefined
    })

    // Reset form on success
    setUploadDialogOpen(false)
    setModelName('')
    setModelDescription('')
    setUploadFile(null)
  }

  const handleView = useCallback((id: string) => {
    router.push(`${ModelResource.VIEW_PATH}/${id}`)
  }, [router])

  const handleEdit = useCallback((id: string) => {
    router.push(`${ModelResource.VIEW_PATH}/${id}/edit`)
  }, [router])

  const handleDelete = useCallback(async (id: string) => {
    await deleteMutation.mutateAsync(id)
  }, [deleteMutation])

  const gridActions = (item: any) => [
    { label: 'View', icon: Eye, action: () => handleView(item.id), permission: { action: 'READ' as const } },
    { label: 'Edit', icon: Pencil, action: () => handleEdit(item.id), permission: { action: 'UPDATE' as const } },
    { 
      label: 'Delete', 
      icon: Trash2, 
      variant: 'destructive' as const,
      action: () => config.rowActions?.find(a => a.label === 'Delete')?.action(item),
      permission: { action: 'DELETE' as const }
    }
  ]

  return (
    <div className="space-y-4 mt-4">
      <div className="gradient-header-minimal pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight flex items-center gap-2">
              <span className="relative">
                Schema Models
                <span className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent"></span>
              </span>
            </h1>
            <p className="text-xs mt-1.5 text-muted-foreground/70">
              Manage your graph database schemas
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ViewSwitcher />
            {modelBuilderEnabled && can('CREATE', ModelResource.RESOURCE_NAME) && (
              <>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => router.push(`${ModelResource.VIEW_PATH}/new`)}
                  className="h-7 text-xs bg-primary hover:bg-primary/90"
                >
                  <Plus className="h-3 w-3 mr-1.5" />
                  Add Model
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push(`${ModelResource.VIEW_PATH}/new/from-xml`)}
                  className="h-7 text-xs border-border/40 bg-muted/30 hover:bg-muted/50 backdrop-blur-sm"
                >
                  <FileCode className="h-3 w-3 mr-1.5" />
                  Import from XML
                </Button>
              </>
            )}
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="h-7 text-xs border-border/40 bg-muted/30 hover:bg-muted/50 backdrop-blur-sm">
                  <Upload className="h-3 w-3 mr-1.5" />
                  Upload Schema
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Schema</DialogTitle>
                  <DialogDescription>
                    Upload a Markdown (.md) or JSON (.json) schema file
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="model-name">Model Name *</Label>
                    <Input
                      id="model-name"
                      value={modelName}
                      onChange={(e) => setModelName(e.target.value)}
                      placeholder="My Graph Schema"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model-description">Description</Label>
                    <Input
                      id="model-description"
                      value={modelDescription}
                      onChange={(e) => setModelDescription(e.target.value)}
                      placeholder="Optional description"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="schema-file">Schema File *</Label>
                    <Input
                      id="schema-file"
                      type="file"
                      accept=".md,.json"
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    />
                    <div className="flex gap-2 mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => downloadTemplate('md')}
                        className="text-xs"
                      >
                        MD Template
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => downloadTemplate('json')}
                        className="text-xs"
                      >
                        JSON Template
                      </Button>
                    </div>
                  </div>
                  <Button
                    onClick={handleFileUpload}
                    disabled={uploading || !modelName || !uploadFile}
                    className="w-full"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {currentView === 'table' ? (
          <DataTable
            config={config}
            data={data}
            total={total}
            loading={loading}
            page={page}
            pageSize={pageSize}
            sortBy={sortBy}
            sortOrder={sortOrder}
            filters={filters}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
            onSortChange={onSortChange}
            onFiltersChange={onFiltersChange}
            initialColumnVisibility={{ description: false }}
          />
        ) : (
          <DataGrid
            config={config}
            data={data}
            total={total}
            loading={loading}
            page={page}
            pageSize={pageSize}
            filters={filters}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
            onFiltersChange={onFiltersChange}
            renderCard={(item: any, { isSelected, onSelect }) => (
              <ResourceCard
                key={item.id}
                item={item}
                resourceName={ModelResource.RESOURCE_NAME}
                title={item.name}
                description={item.description}
                status={true}
                date={item.createdAt}
                creator={item.creator?.name}
                isSelected={isSelected}
                onSelect={onSelect}
                onClick={() => handleView(item.id)}
                showQuickPerspective={false}
                actions={gridActions(item)}
              />
            )}
          />
        )}
      </div>
    </div>
  )
}

export default function ModelsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ModelsPageContent />
    </Suspense>
  )
}
