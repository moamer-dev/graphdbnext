import { useState, useEffect, useMemo, startTransition, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { resourceHooks } from '@/lib/react-query/hooks'
import { toast } from 'sonner'
import { useQueryResultsStore } from '@/app/dashboard/stores/queryResultsStore'

type ViewMode = 'table' | 'graph'

// Helper function to extract searchable text from a value (handles nodes, relationships, etc.)
function getSearchableText (value: unknown): string {
  if (value === null || value === undefined) return ''
  
  // Handle node objects - search in properties and labels
  if (typeof value === 'object' && 'labels' in (value as Record<string, unknown>)) {
    const node = value as { labels: string[], properties: Record<string, unknown>, id?: number }
    const parts: string[] = []
    
    if (node.labels) {
      parts.push(...node.labels.map(l => l.toLowerCase()))
    }
    
    if (node.id !== undefined) {
      parts.push(String(node.id))
    }
    
    if (node.properties) {
      Object.values(node.properties).forEach(propValue => {
        if (propValue !== null && propValue !== undefined) {
          parts.push(String(propValue).toLowerCase())
        }
      })
    }
    
    return parts.join(' ')
  }
  
  // Handle relationship objects
  if (typeof value === 'object' && 'type' in (value as Record<string, unknown>)) {
    const rel = value as { type: string, properties: Record<string, unknown>, id?: number }
    const parts: string[] = [rel.type.toLowerCase()]
    
    if (rel.id !== undefined) {
      parts.push(String(rel.id))
    }
    
    if (rel.properties) {
      Object.values(rel.properties).forEach(propValue => {
        if (propValue !== null && propValue !== undefined) {
          parts.push(String(propValue).toLowerCase())
        }
      })
    }
    
    return parts.join(' ')
  }
  
  // Handle arrays
  if (Array.isArray(value)) {
    return value.map(item => getSearchableText(item)).join(' ')
  }
  
  // Handle objects - recursively search
  if (typeof value === 'object') {
    return Object.values(value).map(v => getSearchableText(v)).join(' ')
  }
  
  // Primitive values
  return String(value).toLowerCase()
}

interface UseQueryResultsProps {
  results: unknown[] | null
  loading?: boolean
  currentQuery?: string
}

export function useQueryResults ({ results, loading, currentQuery }: UseQueryResultsProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const createQuery = resourceHooks.queries.useCreate()
  
  // Use store for pagination, search, and filters
  const currentPage = useQueryResultsStore(state => state.currentPage)
  const setCurrentPage = useQueryResultsStore(state => state.setCurrentPage)
  const itemsPerPage = useQueryResultsStore(state => state.itemsPerPage)
  const setItemsPerPage = useQueryResultsStore(state => state.setItemsPerPage)
  const searchTerm = useQueryResultsStore(state => state.searchTerm)
  const setSearchTerm = useQueryResultsStore(state => state.setSearchTerm)
  const columnFilters = useQueryResultsStore(state => state.columnFilters)
  const setColumnFilter = useQueryResultsStore(state => state.setColumnFilter)
  const clearColumnFilters = useQueryResultsStore(state => state.clearColumnFilters)
  const removeColumnFilter = useQueryResultsStore(state => state.removeColumnFilter)
  const visibleColumns = useQueryResultsStore(state => state.visibleColumns)
  const setVisibleColumns = useQueryResultsStore(state => state.setVisibleColumns)
  const toggleColumnVisibility = useQueryResultsStore(state => state.toggleColumnVisibility)
  
  // Keep viewMode with URL sync in hook for now (complex URL synchronization)
  const viewFromUrl = searchParams.get('view') as ViewMode | null
  const initialView: ViewMode = (viewFromUrl === 'table' || viewFromUrl === 'graph') 
    ? viewFromUrl 
    : 'table'
  
  const [viewMode, setViewMode] = useState<ViewMode>(initialView)
  const isUpdatingFromUrl = useRef(false)
  const isInitialMount = useRef(true)
  const lastUrlView = useRef<string | null>(null)
  const lastStateView = useRef<ViewMode | null>(null)

  // Component-specific state
  const [copied, setCopied] = useState(false)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [saveFormData, setSaveFormData] = useState({ name: '', description: '', category: '', query: '' })

  // Sync from URL when it changes (browser back/forward)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      lastUrlView.current = searchParams.get('view')
      lastStateView.current = viewMode
      return
    }

    if (isUpdatingFromUrl.current) {
      isUpdatingFromUrl.current = false
      lastUrlView.current = searchParams.get('view')
      return
    }

    const viewFromUrl = searchParams.get('view') as ViewMode | null
    
    if (lastUrlView.current !== viewFromUrl) {
      lastUrlView.current = viewFromUrl
      
      if (viewFromUrl === 'table' || viewFromUrl === 'graph') {
        if (viewMode !== viewFromUrl) {
          isUpdatingFromUrl.current = true
          lastStateView.current = viewFromUrl
          startTransition(() => {
            setViewMode(viewFromUrl)
          })
        }
      } else if (viewFromUrl === null) {
        if (viewMode !== 'table') {
          isUpdatingFromUrl.current = true
          lastStateView.current = 'table'
          startTransition(() => {
            setViewMode('table')
          })
        }
      }
    }
  }, [searchParams, viewMode])

  // Sync viewMode to URL
  useEffect(() => {
    if (isInitialMount.current) {
      return
    }

    if (isUpdatingFromUrl.current) {
      return
    }

    if (lastStateView.current === viewMode && lastStateView.current !== null) {
      return
    }

    const params = new URLSearchParams(searchParams.toString())
    const currentView = params.get('view')
    const expectedView = viewMode === 'table' ? null : viewMode
    
    if (currentView !== expectedView) {
      lastStateView.current = viewMode
      if (viewMode === 'table') {
        params.delete('view')
      } else {
        params.set('view', viewMode)
      }
      const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname
      router.replace(newUrl, { scroll: false })
    }
  }, [viewMode, router, searchParams])

  const handleViewModeChange = (mode: ViewMode) => {
    lastStateView.current = mode
    setViewMode(mode)
    const params = new URLSearchParams(searchParams.toString())
    if (mode === 'table') {
      params.delete('view')
    } else {
      params.set('view', mode)
    }
    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname
    router.replace(newUrl, { scroll: false })
  }

  const handleShare = async () => {
    try {
      const currentUrl = window.location.href
      await navigator.clipboard.writeText(currentUrl)
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch (error) {
      console.error('Failed to copy URL:', error)
      const textArea = document.createElement('textarea')
      textArea.value = window.location.href
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
      }, 2000)
    }
  }

  const handleOpenSaveDialog = () => {
    if (!currentQuery || !currentQuery.trim()) {
      toast.error('No query to save')
      return
    }
    setSaveFormData({
      name: '',
      description: '',
      category: '',
      query: currentQuery.trim()
    })
    setSaveDialogOpen(true)
  }

  const handleSaveQuery = async () => {
    if (!saveFormData.name.trim() || !saveFormData.query.trim()) {
      toast.error('Name and query are required')
      return
    }

    try {
      await createQuery.mutateAsync({
        name: saveFormData.name.trim(),
        description: saveFormData.description.trim() || null,
        query: saveFormData.query.trim(),
        category: saveFormData.category || null,
        tags: [],
        source: 'CYPHER'
      })
      
      setSaveDialogOpen(false)
      setSaveFormData({ name: '', description: '', category: '', query: '' })
      toast.success('Query saved')
    } catch (error) {
      console.error('Error saving query:', error)
    }
  }

  // Extract all unique keys from results
  const allKeys = useMemo(() => {
    if (!results || results.length === 0) return []
    const keys = new Set<string>()
    results.forEach((result: unknown) => {
      if (result && typeof result === 'object') {
        Object.keys(result).forEach(key => keys.add(key))
      }
    })
    return Array.from(keys)
  }, [results])

  // Map aliases to node labels by inspecting the first result
  const aliasToLabel = useMemo(() => {
    const mapping: Record<string, string> = {}
    if (results && results.length > 0) {
      const firstResult = results[0]
      if (firstResult && typeof firstResult === 'object') {
        allKeys.forEach(key => {
          const value = (firstResult as Record<string, unknown>)[key]
          if (value && typeof value === 'object' && 'labels' in value) {
            const node = value as { labels: string[] }
            // Use the last label (usually the most specific one)
            const label = node.labels.length > 0 
              ? node.labels[node.labels.length - 1] 
              : key
            mapping[key] = label
          }
        })
      }
    }
    return mapping
  }, [results, allKeys])

  // Filter results based on search and column filters
  const filteredResults = useMemo(() => {
    if (!results || results.length === 0) return []
    return results.filter((result: unknown) => {
      if (!result || typeof result !== 'object') return false

      const resultObj = result as Record<string, unknown>

      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        const matchesSearch = Object.values(resultObj).some(value => {
          const searchableText = getSearchableText(value)
          return searchableText.includes(searchLower)
        })
        if (!matchesSearch) return false
      }

      for (const [column, filterValue] of Object.entries(columnFilters)) {
        if (!filterValue) continue
        const value = resultObj[column]
        if (value === null || value === undefined) return false
        
        const searchableText = getSearchableText(value)
        if (!searchableText.includes(filterValue.toLowerCase())) {
          return false
        }
      }

      return true
    })
  }, [results, searchTerm, columnFilters])

  // Reset to page 1 when results change
  useEffect(() => {
    startTransition(() => {
      setCurrentPage(1)
      setSearchTerm('')
      clearColumnFilters()
    })
  }, [results, setCurrentPage, setSearchTerm, clearColumnFilters])

  // Initialize visible columns when results change
  useEffect(() => {
    if (allKeys.length > 0) {
      startTransition(() => {
        setVisibleColumns(new Set(allKeys))
      })
    }
  }, [allKeys, setVisibleColumns])

  // Pagination calculations
  const totalPages = useMemo(() => {
    return itemsPerPage === -1 ? 1 : Math.ceil(filteredResults.length / itemsPerPage)
  }, [filteredResults.length, itemsPerPage])

  const startIndex = useMemo(() => {
    return itemsPerPage === -1 ? 0 : (currentPage - 1) * itemsPerPage
  }, [currentPage, itemsPerPage])

  const endIndex = useMemo(() => {
    return itemsPerPage === -1 ? filteredResults.length : startIndex + itemsPerPage
  }, [startIndex, itemsPerPage, filteredResults.length])

  const paginatedResults = useMemo(() => {
    return itemsPerPage === -1 ? filteredResults : filteredResults.slice(startIndex, endIndex)
  }, [filteredResults, startIndex, endIndex, itemsPerPage])

  const handleColumnFilter = (column: string, value: string) => {
    if (value) {
      setColumnFilter(column, value)
    } else {
      removeColumnFilter(column)
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    clearColumnFilters()
    setCurrentPage(1)
  }

  const hasActiveFilters = searchTerm || Object.keys(columnFilters).length > 0

  return {
    viewMode,
    loading,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    searchTerm,
    setSearchTerm,
    columnFilters,
    visibleColumns,
    copied,
    saveDialogOpen,
    setSaveDialogOpen,
    saveFormData,
    setSaveFormData,
    allKeys,
    aliasToLabel,
    filteredResults,
    totalPages,
    startIndex,
    endIndex,
    paginatedResults,
    hasActiveFilters,
    handleViewModeChange,
    handleShare,
    handleOpenSaveDialog,
    handleSaveQuery,
    handleColumnFilter,
    clearFilters,
    toggleColumnVisibility
  }
}
