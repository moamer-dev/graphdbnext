import { useState, useMemo } from 'react'
import { resourceHooks, type SavedQuery } from '@/lib/react-query/hooks'
import { toast } from 'sonner'

interface UseSavedQueriesProps {
  onQuerySelect: (query: string) => void
  onExecute?: (query: string) => void
}

export function useSavedQueries ({ onQuerySelect, onExecute }: UseSavedQueriesProps) {
  const [selectedQuery, setSelectedQuery] = useState<SavedQuery | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [queryToEdit, setQueryToEdit] = useState<SavedQuery | null>(null)
  const [saveFormData, setSaveFormData] = useState({ name: '', description: '', category: '', query: '' })

  const filters = useMemo(() => ({
    ...(selectedCategory !== 'all' && { category: selectedCategory }),
    ...(searchQuery && { search: searchQuery })
  }), [selectedCategory, searchQuery])

  const { data: savedQueriesData, isLoading: queriesLoading } = resourceHooks.queries.useList({
    page: 1,
    pageSize: 1000,
    sortBy: 'updatedAt',
    sortOrder: 'desc',
    filters
  })
  const createQuery = resourceHooks.queries.useCreate()
  const updateQuery = resourceHooks.queries.useUpdate()
  const deleteQuery = resourceHooks.queries.useDelete()

  const savedQueries = useMemo(() => {
    if (!savedQueriesData?.data) {
      return []
    }
    
    const response = savedQueriesData.data
    
    if (Array.isArray(response)) {
      return response as SavedQuery[]
    }
    
    if (response && typeof response === 'object' && 'data' in response) {
      const data = (response as { data: unknown; total?: number }).data
      if (Array.isArray(data)) {
        return data as SavedQuery[]
      }
    }
    
    return []
  }, [savedQueriesData])

  const { data: allQueriesData } = resourceHooks.queries.useList({
    page: 1,
    pageSize: 1000,
    sortBy: 'updatedAt',
    sortOrder: 'desc',
    filters: {}
  })

  const categories = useMemo(() => {
    if (!allQueriesData?.data) return []
    const response = allQueriesData.data
    
    let allQueries: SavedQuery[] = []
    if (Array.isArray(response)) {
      allQueries = response as SavedQuery[]
    } else if (response && typeof response === 'object' && 'data' in response) {
      const data = (response as { data: unknown; total?: number }).data
      if (Array.isArray(data)) {
        allQueries = data as SavedQuery[]
      }
    }
    
    const cats = new Set(allQueries.map(q => q.category).filter(Boolean) as string[])
    return Array.from(cats)
  }, [allQueriesData])

  const filteredQueries = savedQueries

  const handleSaveQuery = async () => {
    if (!saveFormData.name.trim() || !saveFormData.query.trim()) {
      toast.error('Name and query are required')
      return
    }

    try {
      const queryData = {
        name: saveFormData.name.trim(),
        description: saveFormData.description.trim() || null,
        query: saveFormData.query.trim(),
        category: saveFormData.category || null,
        tags: [],
        source: queryToEdit?.source || 'CYPHER' as const
      }

      if (queryToEdit?.id) {
        await updateQuery.mutateAsync({
          id: queryToEdit.id,
          data: queryData
        })
        toast.success('Query updated')
      } else {
        await createQuery.mutateAsync(queryData)
        toast.success('Query saved')
      }

      setSaveDialogOpen(false)
      setEditDialogOpen(false)
      setQueryToEdit(null)
      setSaveFormData({ name: '', description: '', category: '', query: '' })
    } catch (error) {
      console.error('Error saving query:', error)
    }
  }

  const handleOpenEditDialog = (query: SavedQuery) => {
    setQueryToEdit(query)
    setSaveFormData({
      name: query.name,
      description: query.description || '',
      category: query.category || '',
      query: query.query
    })
    setEditDialogOpen(true)
  }

  const handleDeleteQuery = async (queryId: string) => {
    try {
      await deleteQuery.mutateAsync(queryId)
      toast.success('Query deleted')
      if (selectedQuery?.id === queryId) {
        setSelectedQuery(null)
      }
    } catch (error) {
      console.error('Error deleting query:', error)
    }
  }

  const handleUseQuery = (query: SavedQuery) => {
    setSelectedQuery(query)
    onQuerySelect(query.query)
  }

  const handleExecuteQuery = (query: SavedQuery) => {
    setSelectedQuery(query)
    onExecute?.(query.query)
  }

  return {
    savedQueries,
    selectedQuery,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    saveDialogOpen,
    setSaveDialogOpen,
    editDialogOpen,
    setEditDialogOpen,
    saveFormData,
    setSaveFormData,
    categories,
    filteredQueries,
    handleSaveQuery,
    handleOpenEditDialog,
    handleDeleteQuery,
    handleUseQuery,
    handleExecuteQuery,
    isLoading: queriesLoading
  }
}
