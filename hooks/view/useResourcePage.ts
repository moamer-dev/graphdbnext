'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useRBAC } from '@/hooks/useRBAC'
import { useUIStore } from '@/stores/uiStore'
import { useResourceTable } from './useResourceTable'
import { Eye, Pencil, Trash2 } from 'lucide-react'

interface UseResourcePageOptions<T extends { id: string }> {
  resource: any
  useList: any
  useDelete: any
  useBulkDelete: any
  initialFilters?: Record<string, unknown>
}

/**
 * High-level hook for dashboard resource pages.
 * 
 * Orchestrates everything needed for a standard listing page:
 * - Session & RBAC
 * - Tabular & Grid data states
 * - In-place Modal management (Create/Edit/View)
 * - Navigation logic
 */
export function useResourcePage<T extends { id: string }>(options: UseResourcePageOptions<T>) {
  const { resource, useList, useDelete, useBulkDelete, initialFilters } = options
  const { data: session, status } = useSession()
  const { can } = useRBAC()
  const router = useRouter()
  const { dashboardView, resourceScope } = useUIStore()

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [viewingId, setViewingId] = useState<string | null>(null)

  const isAdmin = session?.user?.role === 'ADMIN'

  const handleView = useCallback((id: string) => {
    if (resource.VIEW_MODE === 'page') {
      router.push(`${resource.LIST_PATH}/${id}`)
    } else {
      setViewingId(id)
    }
  }, [router, resource])

  const handleEdit = useCallback((id: string) => {
    if (resource.EDIT_MODE === 'page') {
      router.push(`${resource.LIST_PATH}/${id}/edit`)
    } else {
      setEditingId(id)
    }
  }, [router, resource])

  const table = useResourceTable({
    resource,
    useList,
    useDelete,
    useBulkDelete,
    isAdmin,
    userId: session?.user?.id,
    scope: resourceScope,
    onView: handleView,
    onEdit: handleEdit,
    initialFilters
  })

  const getGridActions = useCallback((item: any) => [
    { 
      label: 'View', 
      icon: Eye, 
      action: () => handleView(item.id), 
      permission: { action: 'READ' as const } 
    },
    { 
      label: 'Edit', 
      icon: Pencil, 
      action: () => handleEdit(item.id), 
      permission: { action: 'UPDATE' as const } 
    },
    { 
      label: 'Delete', 
      icon: Trash2, 
      variant: 'destructive' as const,
      action: () => table.config.rowActions?.find((a: any) => a.label === 'Delete')?.action(item),
      permission: { action: 'DELETE' as const }
    }
  ], [handleView, handleEdit, table.config.rowActions])

  return {
    ...table,
    status,
    session,
    isAdmin,
    can,
    currentView: dashboardView,
    resourceScope,
    // Modal states
    isCreateOpen,
    setIsCreateOpen,
    editingId,
    setEditingId,
    viewingId,
    setViewingId,
    // Handlers
    handleView,
    handleEdit,
    getGridActions
  }
}
