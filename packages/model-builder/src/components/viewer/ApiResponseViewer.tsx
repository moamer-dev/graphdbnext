'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react'
import { Button } from '../ui/button'
import { cn } from '../../utils/cn'

interface ApiResponseViewerProps {
  data: unknown
  title?: string
  className?: string
  onFieldSelect?: (path: string) => void
}

function JsonValue({ value, path = '', level = 0, onFieldSelect }: { value: unknown; path?: string; level?: number; onFieldSelect?: (path: string) => void }) {
  const [isExpanded, setIsExpanded] = useState(level < 2)

  if (value === null) {
    return <span className="text-gray-500">null</span>
  }

  if (value === undefined) {
    return <span className="text-gray-500">undefined</span>
  }

  if (typeof value === 'string') {
    return (
      <span className="text-green-600 dark:text-green-400">
        &quot;{value}&quot;
      </span>
    )
  }

  if (typeof value === 'number') {
    return <span className="text-blue-600 dark:text-blue-400">{value}</span>
  }

  if (typeof value === 'boolean') {
    return <span className="text-purple-600 dark:text-purple-400">{String(value)}</span>
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-gray-500">[]</span>
    }

    return (
      <div className="ml-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          {isExpanded ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
          <span>[{value.length} items]</span>
        </button>
        {isExpanded && (
          <div className="ml-4 mt-1 space-y-1 border-l border-border pl-2">
            {value.map((item, index) => (
              <div key={index} className="text-xs">
                <span className="text-gray-500">{index}:</span>{' '}
                <JsonValue
                  value={item}
                  path={`${path}[${index}]`}
                  level={level + 1}
                  onFieldSelect={onFieldSelect}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
    if (entries.length === 0) {
      return <span className="text-gray-500">{'{}'}</span>
    }

    return (
      <div className="ml-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          {isExpanded ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
          <span>{'{'} {entries.length} {entries.length === 1 ? 'key' : 'keys'} {'}'}</span>
        </button>
        {isExpanded && (
          <div className="ml-4 mt-1 space-y-1 border-l border-border pl-2">
            {entries.map(([key, val]) => {
              const fieldPath = path ? `${path}.${key}` : key
              return (
                <div key={key} className="text-xs group">
                  <span
                    className={cn(
                      "text-blue-600 dark:text-blue-400 cursor-pointer hover:underline",
                      onFieldSelect && "hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded px-1"
                    )}
                    onClick={() => onFieldSelect?.(fieldPath)}
                    title={onFieldSelect ? `Click to use: {{ $json.${fieldPath} }}` : undefined}
                  >
                    {key}
                  </span>
                  <span className="text-gray-500">: </span>
                  <JsonValue
                    value={val}
                    path={fieldPath}
                    level={level + 1}
                    onFieldSelect={onFieldSelect}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return <span className="text-gray-500">{String(value)}</span>
}

export function ApiResponseViewer({ data, title = 'API Response', className, onFieldSelect }: ApiResponseViewerProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn("border rounded-lg bg-background", className)}>
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold">{title}</span>
          <span className="text-[10px] text-muted-foreground">
            {Array.isArray(data) ? `${(data as unknown[]).length} items` : '1 item'}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-6 px-2 text-xs"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 mr-1" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3 mr-1" />
              Copy
            </>
          )}
        </Button>
      </div>
      <div className="p-3 max-h-[400px] overflow-y-auto">
        <div className="text-xs font-mono">
          <JsonValue value={data} onFieldSelect={onFieldSelect} />
        </div>
      </div>
      {onFieldSelect && (
        <div className="px-3 py-2 border-t bg-muted/30 text-[10px] text-muted-foreground">
          💡 Click on any field to use it in actions: <code className="bg-background px-1 rounded">{'{{ $json.field }}'}</code>
        </div>
      )}
    </div>
  )
}

