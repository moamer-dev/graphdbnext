'use client'

import React, { useState } from 'react'
import { DataTable } from '@/components/data-table/DataTable'
import { useResourceTable } from '@/hooks/view/useResourceTable'
import { resourceHooks } from '@/hooks/react-query'
import { StorageConfigResource, StorageConfig } from '@/resources/StorageConfigResource'
import { Database, HardDrive, Cloud, Settings2, ShieldCheck, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { queryClient } from '@/hooks/react-query'
import { queryKeys } from '@/hooks/react-query/queryKeys'
import { StorageConfigDialog } from '@/components/admin/storage/StorageConfigDialog'

export default function StorageAdminPage() {
  const isAdmin = true
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<StorageConfig | null>(null)
  
  const { 
    config, 
    data, 
    total, 
    loading,
    page,
    pageSize,
    onPageChange,
    refetch
  } = useResourceTable({
    resource: StorageConfigResource,
    useList: resourceHooks.storageConfigs.useList,
    useDelete: resourceHooks.storageConfigs.useDelete,
    useBulkDelete: resourceHooks.storageConfigs.useBulkDelete,
    isAdmin,
    onEdit: (id: string) => {
      const item = data.find((d: any) => d.id === id)
      if (item) {
        setEditingItem(item)
        setIsDialogOpen(true)
      }
    }
  })

  const createMutation = resourceHooks.storageConfigs.useCreate()
  const updateMutation = resourceHooks.storageConfigs.useUpdate()

  const handleToggleDefault = async (item: StorageConfig) => {
    try {
      await updateMutation.mutateAsync({
        id: item.id,
        data: { isDefault: !item.isDefault }
      })
      toast.success(`${item.name} set as default storage`)
      queryClient.invalidateQueries({ queryKey: queryKeys.storageConfigs.all })
    } catch (error) {
      toast.error('Failed to update storage config')
    }
  }

  const handleToggleActive = async (item: StorageConfig) => {
    try {
      await updateMutation.mutateAsync({
        id: item.id,
        data: { isActive: !item.isActive }
      })
      toast.success(`${item.name} ${item.isActive ? 'disabled' : 'enabled'}`)
      queryClient.invalidateQueries({ queryKey: queryKeys.storageConfigs.all })
    } catch (error) {
      toast.error('Failed to update storage config')
    }
  }

  const handleSave = async (formData: any) => {
    try {
      if (editingItem) {
        await updateMutation.mutateAsync({ id: editingItem.id, data: formData })
        toast.success('Storage provider updated')
      } else {
        await createMutation.mutateAsync(formData)
        toast.success('Storage provider created')
      }
      setIsDialogOpen(false)
      setEditingItem(null)
      refetch()
    } catch (error) {
      toast.error('Failed to save storage provider')
    }
  }

  // Extend table config with specific storage columns
  const tableConfig = {
    ...config,
    columns: [
      {
        id: 'type',
        header: 'Type',
        cell: ({ row }: any) => {
          const type = row.original.type
          return (
            <div className="flex items-center gap-2">
              {type === 'DATABASE' && <Database className="h-4 w-4 text-blue-500" />}
              {type === 'LOCAL_FS' && <HardDrive className="h-4 w-4 text-green-500" />}
              {type === 'EXTERNAL_S3' && <Cloud className="h-4 w-4 text-orange-500" />}
              <span className="text-xs font-medium">{type}</span>
            </div>
          )
        }
      },
      ...config.columns.filter(c => c.id !== 'type' && c.id !== 'isDefault' && c.id !== 'isActive'),
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }: any) => (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase text-muted-foreground">Active</span>
              <Switch 
                checked={row.original.isActive} 
                onCheckedChange={() => handleToggleActive(row.original)}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase text-muted-foreground">Default</span>
              <Switch 
                checked={row.original.isDefault} 
                onCheckedChange={() => handleToggleDefault(row.original)}
                disabled={!row.original.isActive}
              />
            </div>
          </div>
        )
      }
    ]
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="gradient-header-minimal pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              <span className="relative">
                Storage Infrastructure
                <span className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent"></span>
              </span>
            </h1>
            <p className="text-xs mt-1.5 text-muted-foreground/70">
              Configure system-wide storage backends and massive file handling
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 gap-2 bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary"
            onClick={() => {
              setEditingItem(null)
              setIsDialogOpen(true)
            }}
          >
             <Plus className="h-3.5 w-3.5" />
             Add New Provider
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
         <div className="p-4 rounded-xl border border-border/50 bg-gradient-to-br from-primary/5 to-transparent">
            <div className="flex items-center gap-3 mb-2">
               <ShieldCheck className="h-5 w-5 text-primary" />
               <h3 className="text-sm font-semibold">System Integrity</h3>
            </div>
            <p className="text-xs text-muted-foreground">All massive files (&gt;2MB) are currently routed to the default active provider.</p>
         </div>
      </div>

      <div>
        <DataTable
            config={tableConfig}
            data={data}
            total={total}
            loading={loading}
            page={page}
            pageSize={pageSize}
            onPageChange={onPageChange}
        />
      </div>

      <StorageConfigDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        item={editingItem}
        onSave={handleSave}
      />
    </div>
  )
}
