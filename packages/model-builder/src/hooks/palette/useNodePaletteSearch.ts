import { useState, useMemo, useEffect, useTransition } from 'react'
import { toolCategories, actionCategories, type ToolItem, type ActionItem } from '../../constants/workflowItems'

export function useNodePaletteSearch() {
  const [searchQuery, setSearchQuery] = useState('')
  const [toolSearchQuery, setToolSearchQuery] = useState('')
  const [actionSearchQuery, setActionSearchQuery] = useState('')
  const [selectedToolCategory, setSelectedToolCategory] = useState<string>('all')
  const [selectedActionCategory, setSelectedActionCategory] = useState<string>('all')
  const [expandedToolCategories, setExpandedToolCategories] = useState<Set<string>>(new Set())
  const [expandedActionCategories, setExpandedActionCategories] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()

  const filteredTools = useMemo(() => {
    const result: { category: string; items: ToolItem[] }[] = []
    
    Object.entries(toolCategories).forEach(([category, { tools }]) => {
      const filtered = tools.filter(tool => {
        const matchesSearch = toolSearchQuery === '' || 
          tool.label.toLowerCase().includes(toolSearchQuery.toLowerCase()) ||
          tool.description.toLowerCase().includes(toolSearchQuery.toLowerCase())
        const matchesCategory = selectedToolCategory === 'all' || selectedToolCategory === category
        return matchesSearch && matchesCategory
      })
      
      if (filtered.length > 0) {
        result.push({ category, items: filtered })
      }
    })
    
    return result
  }, [toolSearchQuery, selectedToolCategory])

  const filteredActions = useMemo(() => {
    const result: { category: string; items: ActionItem[] }[] = []
    
    Object.entries(actionCategories).forEach(([category, { actions }]) => {
      const filtered = actions.filter(action => {
        const matchesSearch = actionSearchQuery === '' || 
          action.label.toLowerCase().includes(actionSearchQuery.toLowerCase()) ||
          action.description.toLowerCase().includes(actionSearchQuery.toLowerCase())
        const matchesCategory = selectedActionCategory === 'all' || selectedActionCategory === category
        return matchesSearch && matchesCategory
      })
      
      if (filtered.length > 0) {
        result.push({ category, items: filtered })
      }
    })
    
    return result
  }, [actionSearchQuery, selectedActionCategory])

  useEffect(() => {
    startTransition(() => {
      if (toolSearchQuery.trim()) {
        const categoriesToExpand = new Set<string>()
        filteredTools.forEach(({ category }) => {
          categoriesToExpand.add(category)
        })
        setExpandedToolCategories(categoriesToExpand)
      } else {
        setExpandedToolCategories(new Set())
      }
    })
  }, [toolSearchQuery, filteredTools])

  useEffect(() => {
    startTransition(() => {
      if (actionSearchQuery.trim()) {
        const categoriesToExpand = new Set<string>()
        filteredActions.forEach(({ category }) => {
          categoriesToExpand.add(category)
        })
        setExpandedActionCategories(categoriesToExpand)
      } else {
        setExpandedActionCategories(new Set())
      }
    })
  }, [actionSearchQuery, filteredActions])

  return {
    searchQuery,
    setSearchQuery,
    toolSearchQuery,
    setToolSearchQuery,
    actionSearchQuery,
    setActionSearchQuery,
    selectedToolCategory,
    setSelectedToolCategory,
    selectedActionCategory,
    setSelectedActionCategory,
    expandedToolCategories,
    setExpandedToolCategories,
    expandedActionCategories,
    setExpandedActionCategories,
    filteredTools,
    filteredActions
  }
}

