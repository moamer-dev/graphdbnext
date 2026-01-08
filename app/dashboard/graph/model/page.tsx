'use client'

import { useState, useCallback, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useUrlState } from '@/app/dashboard/hooks/view/useUrlState'
import { DataTable } from '@/components/data-table/DataTable'
import { ResourceGrid } from '@/components/resource-grid/ResourceGrid'
import { ModelCard } from '@/components/resource-grid/ModelCard'
import { useResourceTable } from '@/app/dashboard/hooks/view/useResourceTable'
import { resourceHooks } from '@/lib/react-query/hooks'
import { ModelResource, type Model } from '@/lib/resources/ModelResource'
import { useModelUpload } from '../../hooks/model/useModelUpload'
import { downloadTemplate } from '@/lib/utils/downloadTemplate'
import { useModelBuilder } from '@/lib/hooks/useModelBuilder'
import { Button } from '@/components/ui/button'
import { Upload, LayoutGrid, Table2, Plus, FileCode } from 'lucide-react'
import Link from 'next/link'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

type ViewMode = 'table' | 'grid'

export default function ModelsPage() {
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

  // Use reusable hook for URL state management
  const [viewMode, setViewMode] = useUrlState<ViewMode>('view', 'grid', {
    removeWhenDefault: true
  })

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

  const renderModelCard = useCallback((model: Model) => {
    return (
      <ModelCard
        model={model}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    )
  }, [handleView, handleEdit, handleDelete])

  return (
    <div className="space-y-4 mt-4">
      <div className="gradient-header-minimal pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight flex items-center gap-2">
              <span className="relative">
                Models
                <span className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent"></span>
              </span>
            </h1>
            <p className="text-xs mt-1.5 text-muted-foreground/70">
              Manage your graph database schemas
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)} suppressHydrationWarning>
              <TabsList className="h-7 bg-muted/40 border border-border/40 backdrop-blur-sm" suppressHydrationWarning>
                <TabsTrigger value="table" className="h-6 text-xs px-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary" suppressHydrationWarning>
                  <Table2 className="h-3 w-3 mr-1" />
                  Table
                </TabsTrigger>
                <TabsTrigger value="grid" className="h-6 text-xs px-2.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary" suppressHydrationWarning>
                  <LayoutGrid className="h-3 w-3 mr-1" />
                  Grid
                </TabsTrigger>
              </TabsList>
            </Tabs>
            {modelBuilderEnabled && (
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
        {viewMode === 'table' ? (
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
          />
        ) : (
          <div className="space-y-4">
            {/* Filters - reuse from table config */}
            {config.filters && config.filters.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                {config.filters.map((filter) => (
                  <div key={filter.key} className="flex items-center gap-2">
                    {filter.type === 'text' && (
                      <Input
                        placeholder={filter.placeholder || `Filter by ${filter.label}...`}
                        value={(filters[filter.key] as string) || ''}
                        onChange={(e) => onFiltersChange({ ...filters, [filter.key]: e.target.value })}
                        className="h-8 w-[200px]"
                      />
                    )}
                    {filter.type === 'select' && filter.options && (
                      <Select
                        value={(filters[filter.key] as string) || 'all'}
                        onValueChange={(value) => onFiltersChange({ ...filters, [filter.key]: value === 'all' ? '' : value })}
                      >
                        <SelectTrigger className="h-8 w-[180px]" suppressHydrationWarning>
                          <SelectValue suppressHydrationWarning />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          {filter.options
                            .filter((option) => option.value !== '' && option.value !== 'all')
                            .map((option) => (
                              <SelectItem key={String(option.value)} value={String(option.value)}>
                                {option.label}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Grid View */}
            <ResourceGrid
              data={data}
              loading={loading}
              config={config}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              renderCard={renderModelCard}
            />

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, total)} of {total} results
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(Math.max(1, page - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  <span className="text-sm">Page</span>
                  <Input
                    type="number"
                    min={1}
                    max={Math.ceil(total / pageSize)}
                    value={page}
                    onChange={(e) => onPageChange(Math.max(1, Math.min(Math.ceil(total / pageSize), Number(e.target.value))))}
                    className="h-8 w-16"
                  />
                  <span className="text-sm">of {Math.ceil(total / pageSize)}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(Math.min(Math.ceil(total / pageSize), page + 1))}
                  disabled={page >= Math.ceil(total / pageSize)}
                >
                  Next
                </Button>
                <Select
                  value={String(pageSize)}
                  onValueChange={(value) => onPageSizeChange(Number(value))}
                >
                  <SelectTrigger className="h-8 w-[70px]" suppressHydrationWarning>
                    <SelectValue suppressHydrationWarning />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 20, 30, 50, 100].map((size) => (
                      <SelectItem key={size} value={String(size)}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
