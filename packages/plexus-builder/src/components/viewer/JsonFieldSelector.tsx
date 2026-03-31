'use client'

import { useState, useMemo, useEffect } from 'react'
import { ChevronDown, ChevronRight, Copy, Brackets, Check, Loader2 } from 'lucide-react'
import { Button } from '../ui/button'
import { cn } from '../../utils/cn'
import { getAvailablePaths, evaluateJsonPath, parseJsonPath } from '../../utils/jsonPathExpression'

interface JsonFieldSelectorProps {
  data: unknown
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  className?: string
}

function JsonFieldOption({ 
  path, 
  value, 
  data, 
  level = 0,
  onSelect,
  disableRecursion = false
}: { 
  path: string
  value: unknown
  data: unknown
  level?: number
  onSelect: (path: string) => void
  disableRecursion?: boolean
}) {
  const [isExpanded, setIsExpanded] = useState(level < 2)
  const pathParts = parseJsonPath(`$json.${path}`) || []
  const displayValue = evaluateJsonPath(data, pathParts)

  if (typeof value === 'object' && value !== null && !Array.isArray(value) && !disableRecursion) {
    const entries = Object.entries(value as Record<string, unknown>)
    return (
      <div className="ml-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground w-full text-left"
        >
          {isExpanded ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
          <span className="font-medium text-blue-600 dark:text-blue-400">{path.split('.').pop() || path}</span>
          <span className="text-gray-500 text-[10px]">({entries.length} keys)</span>
        </button>
        {isExpanded && (
          <div className="ml-4 mt-1 space-y-0.5 border-l border-border pl-2">
            {entries.map(([key, val]) => {
              const childPath = path ? `${path}.${key}` : key
              return (
                <JsonFieldOption
                  key={key}
                  path={childPath}
                  value={val}
                  data={data}
                  level={level + 1}
                  onSelect={onSelect}
                />
              )
            })}
          </div>
        )}
      </div>
    )
  }

  const isSelectable = typeof displayValue === 'string' || typeof displayValue === 'number' || typeof displayValue === 'boolean'
  const displayText = typeof displayValue === 'string' 
    ? displayValue.length > 50 ? displayValue.substring(0, 50) + '...' : displayValue
    : String(displayValue)

  return (
    <button
      onClick={() => isSelectable && onSelect(path)}
      className={cn(
        "flex items-center justify-between w-full text-left px-2 py-1.5 rounded text-xs hover:bg-muted transition-colors",
        isSelectable && "cursor-pointer"
      )}
      disabled={!isSelectable}
      title={isSelectable ? `Click to use: {{ $json.${path} }}` : 'Complex object - expand to select nested fields'}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="font-medium text-blue-600 dark:text-blue-400 truncate">{disableRecursion ? path : (path.split('.').pop() || path)}</span>
        {isSelectable && (
          <span className="text-gray-500 text-[10px] truncate">= {displayText}</span>
        )}
      </div>
      {isSelectable && (
        <Copy className="h-3 w-3 text-muted-foreground opacity-50 hover:opacity-100" />
      )}
    </button>
  )
}

export function JsonFieldSelector({
  data,
  value,
  onChange,
  placeholder = 'Select a field or enter expression...',
  label,
  className
}: JsonFieldSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [deferredFilteredPaths, setDeferredFilteredPaths] = useState<string[]>([])
  
  const paths = useMemo(() => {
    if (!data) return []
    return getAvailablePaths(data)
  }, [data])

  useEffect(() => {
    if (!isOpen) return

    if (!searchQuery) {
      setDeferredFilteredPaths(paths.filter(path => {
        // Show root properties OR first-level array items (e.g. [0])
        const isRootProperty = !path.includes('.') && !path.includes('[')
        const isFirstLevelArrayItem = /^\[\d+\]$/.test(path)
        return isRootProperty || isFirstLevelArrayItem || path === '[]'
      }))
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    const timer = setTimeout(() => {
      const results = paths.filter(path => 
        path.toLowerCase().includes(searchQuery.toLowerCase())
      )
      // Limit to first 200 results for performance
      setDeferredFilteredPaths(results.slice(0, 200))
      setIsSearching(false)
    }, 250)

    return () => clearTimeout(timer)
  }, [searchQuery, paths, isOpen])

  const handleSelectPath = (path: string) => {
    // Array indices [0] don't need a dot after $json
    const separator = path.startsWith('[') ? '' : '.'
    const expression = `{{ $json${separator}${path} }}`
    onChange(expression)
    setIsOpen(false)
    setSearchQuery('')
  }

  const currentValue = value || ''
  const isExpression = currentValue.includes('{{ $json.')

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between mb-1">
        {label && <label className="text-xs font-medium">{label}</label>}
      </div>
      
      <div className="relative group">
        <input
          type="text"
          value={currentValue}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-8 pl-2 pr-9 text-xs border rounded bg-background focus:ring-1 focus:ring-primary/30 transition-all"
        />
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          {!!data && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "h-6 px-1.5 text-[10px] hover:bg-primary/10 transition-colors",
                isOpen && "text-primary bg-primary/10",
                isExpression && "text-blue-600 font-bold"
              )}
              onClick={() => setIsOpen(!isOpen)}
              title="Browse JSON data"
            >
              <Brackets className="h-3 w-3 mr-1" />
              {isExpression ? 'Exp' : 'JSON'}
            </Button>
          )}
        </div>
      </div>
      
      {isOpen && (
        <div className="border rounded-lg bg-background shadow-lg max-h-64 overflow-y-auto mt-1 z-50">
          <div className="p-2 border-b sticky top-0 bg-background z-10">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search fields..."
              className="w-full h-7 px-2 text-xs border rounded bg-muted/30 focus:bg-background"
              autoFocus
            />
            <div className="flex items-center justify-between mt-1">
              <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">
                {searchQuery ? 'Search Results' : 'Root Fields'}
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsOpen(false)}
                className="h-4 px-1 text-[9px] hover:bg-destructive/10 hover:text-destructive"
              >
                Close
              </Button>
            </div>
          </div>
          <div className="p-2 space-y-0.5">
            {isSearching ? (
              <div className="py-8 flex flex-col items-center justify-center gap-2 text-muted-foreground animate-in fade-in duration-300">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-[10px] font-medium">Filtering paths...</span>
              </div>
            ) : deferredFilteredPaths.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-4 italic">
                No fields found matching "{searchQuery}"
              </div>
            ) : (
              deferredFilteredPaths.map((path) => {
                const pathParts = parseJsonPath(`$json.${path}`) || []
                const fieldValue = evaluateJsonPath(data, pathParts)
                return (
                  <JsonFieldOption
                    key={path}
                    path={path}
                    value={fieldValue}
                    data={data}
                    onSelect={handleSelectPath}
                    disableRecursion={!!searchQuery}
                  />
                )
              })
            )}
            {searchQuery && !isSearching && deferredFilteredPaths.length === 200 && (
              <div className="text-[9px] text-muted-foreground text-center pt-2 border-t mt-2">
                Showing top 200 matches. Refine your search for more.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
