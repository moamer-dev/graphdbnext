'use client'

import { Suspense } from 'react'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DataTable } from '@/components/data-table/DataTable'
import { useResourcePage } from '@/hooks/view/useResourcePage'
import { resourceHooks } from '@/hooks/react-query'
import { ModelResource } from '@/resources/ModelResource'
import { useModelBuilder } from '@/hooks'
import { Upload, Plus, FileCode, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ViewSwitcher } from '@/components/data-table/ViewSwitcher'
import { DataGrid } from '@/components/data-table/DataGrid'
import { ResourceCard } from '@/components/dashboard/ResourceCard'
import { SchemaUploadDialog } from '@/components/dashboard/graph/SchemaUploadDialog'
import { CreateModelDialog } from '@/components/dashboard/graph/CreateModelDialog'

function ModelsPageContent() {
  const searchParams = useSearchParams()
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (searchParams?.get('action') === 'upload') {
      setUploadDialogOpen(true)
    }
  }, [searchParams])

  const { isEnabled: modelBuilderEnabled } = useModelBuilder()

  const {
    config, data, total, loading, page, pageSize, sortBy, sortOrder, filters, onPageChange, onPageSizeChange, onSortChange, onFiltersChange,
    status, handleView, getGridActions, currentView, can, refetch
  } = useResourcePage({
    resource: ModelResource,
    useList: resourceHooks.models.useList,
    useDelete: resourceHooks.models.useDelete,
    useBulkDelete: resourceHooks.models.useBulkDelete
  })

  if (status === 'loading') {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" />
      </div>
    )
  }

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
                  onClick={() => setCreateDialogOpen(true)}
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

            <Button 
                size="sm" 
                variant="outline" 
                className="h-7 text-xs border-border/40 bg-muted/30 hover:bg-muted/50 backdrop-blur-sm"
                onClick={() => setUploadDialogOpen(true)}
            >
                <Upload className="h-3 w-3 mr-1.5" />
                Upload Schema
            </Button>

            <CreateModelDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
            />

            <SchemaUploadDialog 
                open={uploadDialogOpen} 
                onOpenChange={setUploadDialogOpen}
                onSuccess={() => refetch()}
            />
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
                actions={getGridActions(item)}
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
