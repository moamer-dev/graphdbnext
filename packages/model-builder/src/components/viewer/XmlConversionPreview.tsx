'use client'

import { AlertCircle, CheckCircle, XCircle, Info, Loader2 } from 'lucide-react'
import { Button } from '../ui/button'
import { cn } from '../../utils/cn'
import type { ConversionResult, ConversionError, ConversionWarning } from '../../types/mappingConfig'

interface XmlConversionPreviewProps {
  result: ConversionResult | null
  loading?: boolean
  onClose?: () => void
  className?: string
}

export function XmlConversionPreview ({ result, loading, onClose, className }: XmlConversionPreviewProps) {
  if (loading) {
    return (
      <div className={cn('border rounded-lg p-6 bg-card', className)}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Converting XML...</span>
        </div>
      </div>
    )
  }

  if (!result) {
    return null
  }

  const hasErrors = result.errors.length > 0
  const hasWarnings = result.warnings.length > 0
  const isSuccess = !hasErrors && result.nodes.length > 0

  return (
    <div className={cn('border rounded-lg bg-card', className)}>
      {/* Header */}
      <div className="border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isSuccess ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : hasErrors ? (
            <XCircle className="h-5 w-5 text-red-500" />
          ) : (
            <Info className="h-5 w-5 text-blue-500" />
          )}
          <h3 className="font-semibold text-sm">Conversion Preview</h3>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
            <XCircle className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Summary */}
      <div className="p-4 border-b bg-muted/30">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground text-xs">Nodes</div>
            <div className="font-semibold">{result.nodes.length}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Relationships</div>
            <div className="font-semibold">{result.relationships.length}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Status</div>
            <div className={cn(
              'font-semibold',
              isSuccess ? 'text-green-600' : hasErrors ? 'text-red-600' : 'text-yellow-600'
            )}>
              {isSuccess ? 'Success' : hasErrors ? 'Errors' : 'Warnings'}
            </div>
          </div>
        </div>
      </div>

      {/* Errors */}
      {hasErrors && (
        <div className="p-4 border-b">
          <div className="flex items-center gap-2 mb-3">
            <XCircle className="h-4 w-4 text-red-500" />
            <h4 className="font-semibold text-sm text-red-600">
              Errors ({result.errors.length})
            </h4>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {result.errors.map((error, index) => (
              <ErrorItem key={index} error={error} />
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {hasWarnings && (
        <div className="p-4 border-b">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <h4 className="font-semibold text-sm text-yellow-600">
              Warnings ({result.warnings.length})
            </h4>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {result.warnings.map((warning, index) => (
              <WarningItem key={index} warning={warning} />
            ))}
          </div>
        </div>
      )}

      {/* Preview Nodes */}
      {isSuccess && result.nodes.length > 0 && (
        <div className="p-4 border-b">
          <h4 className="font-semibold text-sm mb-3">Sample Nodes</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {result.nodes.slice(0, 10).map((node) => (
              <div key={node.id} className="text-xs p-2 bg-muted/50 rounded border">
                <div className="font-semibold">{node.label}</div>
                <div className="text-muted-foreground text-xs mt-1">
                  Type: {node.type} • Properties: {node.properties.length}
                </div>
                {node.properties.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {node.properties.slice(0, 5).map((prop) => (
                      <span key={prop.key} className="text-xs px-1.5 py-0.5 bg-background rounded border">
                        {prop.key}
                      </span>
                    ))}
                    {node.properties.length > 5 && (
                      <span className="text-xs text-muted-foreground">
                        +{node.properties.length - 5} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
            {result.nodes.length > 10 && (
              <div className="text-xs text-muted-foreground text-center py-2">
                ... and {result.nodes.length - 10} more nodes
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preview Relationships */}
      {isSuccess && result.relationships.length > 0 && (
        <div className="p-4">
          <h4 className="font-semibold text-sm mb-3">Sample Relationships</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {result.relationships.slice(0, 10).map((rel) => (
              <div key={rel.id} className="text-xs p-2 bg-muted/50 rounded border">
                <div className="font-semibold">{rel.type}</div>
                <div className="text-muted-foreground text-xs mt-1">
                  From: {rel.from} → To: {rel.to}
                </div>
                {rel.properties && rel.properties.length > 0 && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    Properties: {rel.properties.length}
                  </div>
                )}
              </div>
            ))}
            {result.relationships.length > 10 && (
              <div className="text-xs text-muted-foreground text-center py-2">
                ... and {result.relationships.length - 10} more relationships
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ErrorItem ({ error }: { error: ConversionError }) {
  return (
    <div className="text-xs p-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded">
      <div className="font-semibold text-red-700 dark:text-red-400">
        {error.type.toUpperCase()}: {error.message}
      </div>
      {error.element && (
        <div className="text-red-600 dark:text-red-500 mt-1">
          Element: <code className="px-1 bg-red-100 dark:bg-red-900/50 rounded">{error.element}</code>
        </div>
      )}
      {error.path && (
        <div className="text-red-600 dark:text-red-500 mt-1">
          Path: <code className="px-1 bg-red-100 dark:bg-red-900/50 rounded">{error.path}</code>
        </div>
      )}
    </div>
  )
}

function WarningItem ({ warning }: { warning: ConversionWarning }) {
  return (
    <div className="text-xs p-2 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded">
      <div className="font-semibold text-yellow-700 dark:text-yellow-400">
        {warning.type.toUpperCase()}: {warning.message}
      </div>
      {warning.element && (
        <div className="text-yellow-600 dark:text-yellow-500 mt-1">
          Element: <code className="px-1 bg-yellow-100 dark:bg-yellow-900/50 rounded">{warning.element}</code>
        </div>
      )}
      {warning.path && (
        <div className="text-yellow-600 dark:text-yellow-500 mt-1">
          Path: <code className="px-1 bg-yellow-100 dark:bg-yellow-900/50 rounded">{warning.path}</code>
        </div>
      )}
    </div>
  )
}

