'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { resourceHooks } from '@/hooks/react-query'
import { useTenantStore } from '@/stores/tenantStore'
import { toast } from 'sonner'
import { useRBAC } from '@/hooks/useRBAC'

export function useDataSourceExplorer() {
  const { activeWorkspaceId, isGlobalScope } = useTenantStore()
  const { can } = useRBAC()
  
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [multiSelectedIds, setMultiSelectedIds] = useState<string[]>([])
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('ALL')
  const [creatorFilter, setCreatorFilter] = useState<string>('ALL')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [editedContent, setEditedContent] = useState<string>('')
  
  const [isRenaming, setIsRenaming] = useState(false)
  const [tempName, setTempName] = useState('')
  const renameInputRef = useRef<HTMLInputElement>(null)

  const RESOURCE_KEY = 'DATA_SOURCE'

  const { data: listData, isLoading: isLoadingList, refetch: refetchList } = resourceHooks.dataSources.useList({
    page: 1,
    pageSize: 1000,
    filters: { 
      workspaceId: activeWorkspaceId,
      isGlobalScope: isGlobalScope,
      search: search || undefined
    }
  })

  const { data: selectedData, isLoading: isLoadingDetail } = resourceHooks.dataSources.useSingle(selectedId || '', !!selectedId)
  
  const updateMutation = resourceHooks.dataSources.useUpdate({
      showToast: false,
      onSuccess: () => {
          toast.success('Resource updated successfully')
          setIsRenaming(false)
          refetchList()
      }
  })

  const deleteMutation = resourceHooks.dataSources.useDelete({
      showToast: false,
      onSuccess: () => {
          toast.success('Resource deleted successfully')
          if (selectedId === deleteId) {
              setSelectedId(null)
              setEditedContent('')
          }
          setDeleteId(null)
          refetchList()
      }
  })

  const bulkDeleteMutation = resourceHooks.dataSources.useBulkDelete({
      showToast: false,
      onSuccess: () => {
          toast.success('Resources deleted successfully')
          if (selectedId && multiSelectedIds.includes(selectedId)) {
              setSelectedId(null)
              setEditedContent('')
          }
          setMultiSelectedIds([])
          setIsBulkDeleting(false)
          refetchList()
      }
  })

  const availableTypes = useMemo(() => {
    const types = new Set<string>()
    listData?.data?.forEach((item: any) => {
        if (item.type) types.add(item.type)
    })
    return Array.from(types).sort()
  }, [listData])

  const availableCreators = useMemo(() => {
    const creatorsMap = new Map<string, string>()
    listData?.data?.forEach((item: any) => {
        if (item.creatorId && item.creator) {
            const label = item.creator.name || item.creator.email
            creatorsMap.set(item.creatorId, label)
        }
    })
    return Array.from(creatorsMap.entries()).map(([id, label]) => ({ id, label }))
  }, [listData])

  const filteredItems = useMemo(() => {
    let items = [...(listData?.data || [])]
    if (typeFilter !== 'ALL') items = items.filter((i:any) => i.type === typeFilter)
    if (creatorFilter !== 'ALL') items = items.filter((i:any) => i.creatorId === creatorFilter)
    
    items.sort((a, b) => {
        const nameA = a.name.toLowerCase()
        const nameB = b.name.toLowerCase()
        return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA)
    })
    return items
  }, [listData, typeFilter, creatorFilter, sortOrder])

  useEffect(() => {
    if (selectedData?.data) {
        const item = selectedData.data
        if (item.type === 'JSON' && item.jsonContent) {
            setEditedContent(JSON.stringify(item.jsonContent, null, 2))
        } else {
            setEditedContent(item.content || '')
        }
        setTempName(item.name || '')
    } else {
        setEditedContent('')
        setTempName('')
    }
    setIsRenaming(false)
  }, [selectedData])

  useEffect(() => {
    if (isRenaming && renameInputRef.current) {
        renameInputRef.current.focus()
        renameInputRef.current.select()
    }
  }, [isRenaming])

  const handleSave = async () => {
      if (!selectedId || !selectedData?.data) return
      if (!can('UPDATE', RESOURCE_KEY, selectedData.data)) {
          toast.error('You do not have permission to update this resource')
          return
      }

      try {
          const item = selectedData.data
          const updateData: any = {}
          if (item.type === 'JSON') {
              try {
                  updateData.jsonContent = JSON.parse(editedContent)
                  updateData.content = null
              } catch (e) {
                  toast.error('Invalid JSON content')
                  return
              }
          } else {
              updateData.content = editedContent
              updateData.jsonContent = null
          }
          await updateMutation.mutateAsync({ id: selectedId, data: updateData })
      } catch (error: any) {
          toast.error(error.message)
      }
  }

  const handleRename = async () => {
      if (!selectedId || !selectedData?.data || !tempName || tempName === selectedData.data.name) {
          setIsRenaming(false)
          return
      }
      try {
          await updateMutation.mutateAsync({ id: selectedId, data: { name: tempName } })
      } catch (error: any) {
          toast.error(error.message)
      }
  }

  const handleDelete = async () => {
      if (isBulkDeleting) {
          if (multiSelectedIds.length === 0) return
          await bulkDeleteMutation.mutateAsync(multiSelectedIds)
      } else {
          if (!deleteId) return
          await deleteMutation.mutateAsync(deleteId)
      }
  }

  const startBulkDelete = () => {
      setIsBulkDeleting(true)
      setDeleteId('bulk') // Marker for confirmation dialog
  }

  return {
    // State
    isImportOpen,
    setIsImportOpen,
    selectedId,
    setSelectedId,
    multiSelectedIds,
    setMultiSelectedIds,
    deleteId,
    setDeleteId,
    isBulkDeleting,
    setIsBulkDeleting,
    search,
    setSearch,
    typeFilter,
    setTypeFilter,
    creatorFilter,
    setCreatorFilter,
    sortOrder,
    setSortOrder,
    editedContent,
    setEditedContent,
    isRenaming,
    setIsRenaming,
    tempName,
    setTempName,
    renameInputRef,
    
    // Data
    listData,
    selectedItem: selectedData?.data,
    isLoadingList,
    isLoadingDetail,
    availableTypes,
    availableCreators,
    filteredItems,
    
    // Actions
    handleSave,
    handleRename,
    handleDelete,
    startBulkDelete,
    refetchList,
    isUpdatePending: updateMutation.isPending,
    isDeletePending: deleteMutation.isPending || bulkDeleteMutation.isPending,
    
    // Permissions helpers (optional, but keep it consistent)
    can,
    resourceKey: RESOURCE_KEY
  }
}
