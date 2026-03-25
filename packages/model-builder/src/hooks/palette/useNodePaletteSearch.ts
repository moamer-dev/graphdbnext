import { useState, useMemo, useEffect, useTransition } from 'react'
import { workflowRegistry } from '../../registry'

export function useNodePaletteSearch() {
  const [searchQuery, setSearchQuery] = useState('')
  const [toolSearchQuery, setToolSearchQuery] = useState('')
  const [actionSearchQuery, setActionSearchQuery] = useState('')
  const [selectedToolCategory, setSelectedToolCategory] = useState<string>('all')
  const [selectedActionCategory, setSelectedActionCategory] = useState<string>('all')
  const [expandedToolCategories, setExpandedToolCategories] = useState<Set<string>>(new Set())
  const [expandedActionCategories, setExpandedActionCategories] = useState<Set<string>>(new Set())
  const [, startTransition] = useTransition()

  const filteredTools = useMemo(() => {
    const allGrouped = workflowRegistry.getGroupedTools()
    const result: { category: string; config: any; items: any[] }[] = []
    
    allGrouped.forEach(({ category, config, tools }) => {
      const filtered = tools.filter(tool => {
        const matchesSearch = toolSearchQuery === '' || 
          tool.metadata.label.toLowerCase().includes(toolSearchQuery.toLowerCase()) ||
          tool.metadata.description.toLowerCase().includes(toolSearchQuery.toLowerCase())
        const matchesCategory = selectedToolCategory === 'all' || selectedToolCategory === category
        return matchesSearch && matchesCategory
      })
      
      if (filtered.length > 0) {
        result.push({ 
          category, 
          config,
          items: filtered.map(t => ({
            type: t.id,
            label: t.metadata.label,
            description: t.metadata.description,
            icon: t.metadata.icon,
            color: t.metadata.color,
            bgColor: t.metadata.bgColor
          }))
        })
      }
    })
    
    return result
  }, [toolSearchQuery, selectedToolCategory])

  const filteredActions = useMemo(() => {
    const allGrouped = workflowRegistry.getGroupedActions()
    const result: { category: string; config: any; items: any[] }[] = []
    
    allGrouped.forEach(({ category, config, actions }) => {
      const filtered = actions.filter(action => {
        const matchesSearch = actionSearchQuery === '' || 
          action.metadata.label.toLowerCase().includes(actionSearchQuery.toLowerCase()) ||
          action.metadata.description.toLowerCase().includes(actionSearchQuery.toLowerCase())
        const matchesCategory = selectedActionCategory === 'all' || selectedActionCategory === category
        return matchesSearch && matchesCategory
      })
      
      if (filtered.length > 0) {
        result.push({ 
          category, 
          config,
          items: filtered.map(a => ({
            type: a.id,
            label: a.metadata.label,
            description: a.metadata.description,
            icon: a.metadata.icon,
            color: a.metadata.color,
            bgColor: a.metadata.bgColor
          }))
        })
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

