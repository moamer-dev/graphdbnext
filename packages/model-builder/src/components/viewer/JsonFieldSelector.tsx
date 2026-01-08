'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Check, Copy } from 'lucide-react'
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
  onSelect 
}: { 
  path: string
  value: unknown
  data: unknown
  level?: number
  onSelect: (path: string) => void
}) {
  const [isExpanded, setIsExpanded] = useState(level < 2)
  const pathParts = parseJsonPath(`$json.${path}`) || []
  const displayValue = evaluateJsonPath(data, pathParts)

  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
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
          <span className="font-medium text-blue-600 dark:text-blue-400">{path.split('.').pop()}</span>
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
        <span className="font-medium text-blue-600 dark:text-blue-400 truncate">{path.split('.').pop()}</span>
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
  const paths = getAvailablePaths(data)
  const filteredPaths = paths.filter(path => 
    path.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSelectPath = (path: string) => {
    const expression = `{{ $json.${path} }}`
    onChange(expression)
    setIsOpen(false)
    setSearchQuery('')
  }

  const currentValue = value || ''
  const isExpression = currentValue.includes('{{ $json.')

  return (
    <div className={cn("space-y-2", className)}>
      {label && <label className="text-xs font-medium">{label}</label>}
      <div className="relative">
        <input
          type="text"
          value={currentValue}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full h-8 px-2 text-xs border rounded bg-background"
        />
        {isExpression && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-5 px-1 text-[10px]"
              onClick={() => setIsOpen(true)}
            >
              Browse
            </Button>
          </div>
        )}
      </div>
      
      {isOpen && (
        <div className="border rounded-lg bg-background shadow-lg max-h-64 overflow-y-auto">
          <div className="p-2 border-b sticky top-0 bg-background z-10">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search fields..."
              className="w-full h-7 px-2 text-xs border rounded"
              autoFocus
            />
          </div>
          <div className="p-2 space-y-0.5">
            {filteredPaths.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-4">
                No fields found
              </div>
            ) : (
              filteredPaths.map((path) => {
                const pathParts = parseJsonPath(`$json.${path}`) || []
                const fieldValue = evaluateJsonPath(data, pathParts)
                return (
                  <JsonFieldOption
                    key={path}
                    path={path}
                    value={fieldValue}
                    data={data}
                    onSelect={handleSelectPath}
                  />
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

