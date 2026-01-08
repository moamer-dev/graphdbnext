'use client'

import { useState, useMemo, useEffect, startTransition } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { 
  Search, 
  Folder
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../ui/select'
import { cn } from '../../utils/cn'
import { toolCategories, actionCategories, type ToolItem, type ActionItem } from '../../constants/workflowItems'

// Helper function to get color classes
function getColorClasses(color?: string, bgColor?: string) {
  if (!color || !bgColor) {
    return {
      text: 'text-amber-600',
      bg: 'bg-amber-50',
      iconBg: 'bg-amber-100',
      border: 'border-amber-200',
      hoverBorder: 'hover:border-amber-300',
      hoverBg: 'hover:bg-amber-100'
    }
  }
  
  const colorMap: Record<string, { text: string; bg: string; iconBg: string; border: string; hoverBorder: string; hoverBg: string }> = {
    'text-blue-600': { text: 'text-blue-600', bg: 'bg-blue-50', iconBg: 'bg-blue-100', border: 'border-blue-200', hoverBorder: 'hover:border-blue-300', hoverBg: 'hover:bg-blue-100' },
    'text-purple-600': { text: 'text-purple-600', bg: 'bg-purple-50', iconBg: 'bg-purple-100', border: 'border-purple-200', hoverBorder: 'hover:border-purple-300', hoverBg: 'hover:bg-purple-100' },
    'text-cyan-600': { text: 'text-cyan-600', bg: 'bg-cyan-50', iconBg: 'bg-cyan-100', border: 'border-cyan-200', hoverBorder: 'hover:border-cyan-300', hoverBg: 'hover:bg-cyan-100' },
    'text-green-600': { text: 'text-green-600', bg: 'bg-green-50', iconBg: 'bg-green-100', border: 'border-green-200', hoverBorder: 'hover:border-green-300', hoverBg: 'hover:bg-green-100' },
    'text-teal-600': { text: 'text-teal-600', bg: 'bg-teal-50', iconBg: 'bg-teal-100', border: 'border-teal-200', hoverBorder: 'hover:border-teal-300', hoverBg: 'hover:bg-teal-100' },
    'text-pink-600': { text: 'text-pink-600', bg: 'bg-pink-50', iconBg: 'bg-pink-100', border: 'border-pink-200', hoverBorder: 'hover:border-pink-300', hoverBg: 'hover:bg-pink-100' },
    'text-indigo-600': { text: 'text-indigo-600', bg: 'bg-indigo-50', iconBg: 'bg-indigo-100', border: 'border-indigo-200', hoverBorder: 'hover:border-indigo-300', hoverBg: 'hover:bg-indigo-100' },
    'text-rose-600': { text: 'text-rose-600', bg: 'bg-rose-50', iconBg: 'bg-rose-100', border: 'border-rose-200', hoverBorder: 'hover:border-rose-300', hoverBg: 'hover:bg-rose-100' },
    'text-violet-600': { text: 'text-violet-600', bg: 'bg-violet-50', iconBg: 'bg-violet-100', border: 'border-violet-200', hoverBorder: 'hover:border-violet-300', hoverBg: 'hover:bg-violet-100' },
    'text-emerald-600': { text: 'text-emerald-600', bg: 'bg-emerald-50', iconBg: 'bg-emerald-100', border: 'border-emerald-200', hoverBorder: 'hover:border-emerald-300', hoverBg: 'hover:bg-emerald-100' },
    'text-orange-600': { text: 'text-orange-600', bg: 'bg-orange-50', iconBg: 'bg-orange-100', border: 'border-orange-200', hoverBorder: 'hover:border-orange-300', hoverBg: 'hover:bg-orange-100' },
    'text-lime-600': { text: 'text-lime-600', bg: 'bg-lime-50', iconBg: 'bg-lime-100', border: 'border-lime-200', hoverBorder: 'hover:border-lime-300', hoverBg: 'hover:bg-lime-100' },
    'text-sky-600': { text: 'text-sky-600', bg: 'bg-sky-50', iconBg: 'bg-sky-100', border: 'border-sky-200', hoverBorder: 'hover:border-sky-300', hoverBg: 'hover:bg-sky-100' },
    'text-slate-600': { text: 'text-slate-600', bg: 'bg-slate-50', iconBg: 'bg-slate-100', border: 'border-slate-200', hoverBorder: 'hover:border-slate-300', hoverBg: 'hover:bg-slate-100' },
    'text-red-600': { text: 'text-red-600', bg: 'bg-red-50', iconBg: 'bg-red-100', border: 'border-red-200', hoverBorder: 'hover:border-red-300', hoverBg: 'hover:bg-red-100' },
    'text-amber-600': { text: 'text-amber-600', bg: 'bg-amber-50', iconBg: 'bg-amber-100', border: 'border-amber-200', hoverBorder: 'hover:border-amber-300', hoverBg: 'hover:bg-amber-100' },
    'text-yellow-600': { text: 'text-yellow-600', bg: 'bg-yellow-50', iconBg: 'bg-yellow-100', border: 'border-yellow-200', hoverBorder: 'hover:border-yellow-300', hoverBg: 'hover:bg-yellow-100' },
    'text-fuchsia-600': { text: 'text-fuchsia-600', bg: 'bg-fuchsia-50', iconBg: 'bg-fuchsia-100', border: 'border-fuchsia-200', hoverBorder: 'hover:border-fuchsia-300', hoverBg: 'hover:bg-fuchsia-100' },
    'text-gray-600': { text: 'text-gray-600', bg: 'bg-gray-50', iconBg: 'bg-gray-100', border: 'border-gray-200', hoverBorder: 'hover:border-gray-300', hoverBg: 'hover:bg-gray-100' }
  }
  
  return colorMap[color] || colorMap['text-amber-600']
}


export function WorkflowSidebar () {
  const [tab, setTab] = useState<'tools' | 'actions'>('tools')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  
  // Use shared constants
  const currentToolCategories = toolCategories
  const currentActionCategories = actionCategories

  const handleDragStart = (event: React.DragEvent, type: string) => {
    event.dataTransfer.setData('application/workflow-step-type', type)
    event.dataTransfer.setData('application/action-type', type)
    event.dataTransfer.setData('text/plain', type)
    event.dataTransfer.effectAllowed = 'move'
  }

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }

  // Filter and search tools
  const filteredTools = useMemo(() => {
    const result: { category: string; items: ToolItem[] }[] = []
    
    Object.entries(currentToolCategories).forEach(([category, { tools }]) => {
      const filtered = tools.filter(tool => {
        const matchesSearch = searchQuery === '' || 
          tool.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tool.description.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = selectedCategory === 'all' || selectedCategory === category
        return matchesSearch && matchesCategory
      })
      
      if (filtered.length > 0) {
        result.push({ category, items: filtered })
      }
    })
    
    return result
  }, [searchQuery, selectedCategory])

  // Filter and search actions
  const filteredActions = useMemo(() => {
    const result: { category: string; items: ActionItem[] }[] = []
    
    Object.entries(currentActionCategories).forEach(([category, { actions }]) => {
      const filtered = actions.filter(action => {
        const matchesSearch = searchQuery === '' || 
          action.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          action.description.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = selectedCategory === 'all' || selectedCategory === category
        return matchesSearch && matchesCategory
      })
      
      if (filtered.length > 0) {
        result.push({ category, items: filtered })
      }
    })
    
    return result
  }, [searchQuery, selectedCategory])

  const categories = tab === 'tools' 
    ? Object.keys(currentToolCategories) 
    : Object.keys(currentActionCategories)

  const filteredItems = tab === 'tools' ? filteredTools : filteredActions

  // Auto-expand categories when searching
  useEffect(() => {
    startTransition(() => {
      if (searchQuery.trim()) {
        const categoriesToExpand = new Set<string>()
        filteredItems.forEach(({ category }) => {
          categoriesToExpand.add(category)
        })
        setExpandedCategories(categoriesToExpand)
      } else {
        // Collapse all when search is cleared
        setExpandedCategories(new Set())
      }
    })
  }, [searchQuery, filteredItems])

  return (
    <div className="h-full flex flex-col bg-background border-r">
      {/* Header */}
      <div className="p-3 border-b space-y-2">
        <div className="flex gap-1">
          <Button
            size="sm"
            variant={tab === 'tools' ? 'default' : 'outline'}
            className="flex-1 h-8 text-xs"
            onClick={() => {
              setTab('tools')
              setSelectedCategory('all')
              setExpandedCategories(new Set())
            }}
          >
            Tools
          </Button>
          <Button
            size="sm"
            variant={tab === 'actions' ? 'default' : 'outline'}
            className="flex-1 h-8 text-xs"
            onClick={() => {
              setTab('actions')
              setSelectedCategory('all')
              setExpandedCategories(new Set())
            }}
          >
            Actions
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${tab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 text-xs"
          />
        </div>

        {/* Category Filter */}
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(category => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {filteredItems.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No {tab} found</p>
            <p className="text-xs mt-1">Try adjusting your search or filter</p>
          </div>
        ) : (
          filteredItems.map(({ category, items }) => {
            const categoryConfig = tab === 'tools' 
              ? currentToolCategories[category as keyof typeof currentToolCategories]
              : currentActionCategories[category as keyof typeof currentActionCategories]
            const CategoryIcon = categoryConfig?.icon || Folder
            const categoryColor = categoryConfig?.color || 'text-muted-foreground'
            const categoryBgColor = categoryConfig?.bgColor || 'bg-muted'
            const isExpanded = expandedCategories.has(category)
            
            return (
              <div key={category} className="space-y-1">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 text-xs font-semibold rounded transition-colors",
                    isExpanded
                      ? `${categoryBgColor} ${categoryColor}`
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <div className={cn("h-5 w-5 rounded-md flex items-center justify-center shrink-0", categoryBgColor)}>
                    <CategoryIcon className={cn("h-3.5 w-3.5", categoryColor)} />
                  </div>
                  <span className="flex-1 text-left">{category}</span>
                  <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
                    {items.length}
                  </span>
                </button>
                
                {/* Category Items */}
                {isExpanded && (
                  <div className="space-y-0.5 pl-1">
                    {items.map((item: ToolItem | ActionItem) => {
                      const Icon = item.icon
                      const isQuick = 'isQuick' in item ? item.isQuick : false
                      const colors = getColorClasses(item.color, item.bgColor)
                      
                      return (
                        <div
                          key={item.type}
                          draggable
                          onDragStart={(e) => handleDragStart(e, item.type)}
                          className={cn(
                            "group flex items-center gap-2 p-1.5 rounded-md border transition-all cursor-grab active:cursor-grabbing",
                            "bg-background border-border hover:border-primary/30 hover:bg-muted/50"
                          )}
                          title={item.description}
                        >
                          <div className={cn(
                            "h-6 w-6 rounded flex items-center justify-center shrink-0",
                            colors.iconBg
                          )}>
                            <Icon className={cn("h-3.5 w-3.5", colors.text)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium leading-tight text-foreground flex items-center gap-1">
                              {item.label}
                              {isQuick && (
                                <span className="text-[9px] text-primary font-bold">⚡</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
