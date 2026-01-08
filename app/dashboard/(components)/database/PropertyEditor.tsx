'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { X, Save, Loader2 } from 'lucide-react'

interface PropertyEditorProps {
  property: string
  value: unknown
  originalValue?: unknown
  onSave: (property: string, value: unknown) => Promise<void>
  onCancel: () => void
  isSaving?: boolean
}

export function PropertyEditor ({ 
  property, 
  value, 
  originalValue, 
  onSave, 
  onCancel,
  isSaving = false
}: PropertyEditorProps) {
  const [editedValue, setEditedValue] = useState<string>(() => {
    if (value === null || value === undefined) return ''
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2)
    }
    return String(value)
  })

  const [error, setError] = useState<string | null>(null)
  const isDirty = editedValue !== (originalValue !== undefined 
    ? (typeof originalValue === 'object' ? JSON.stringify(originalValue, null, 2) : String(originalValue))
    : (typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)))


  const getValueType = (): 'string' | 'number' | 'boolean' | 'json' => {
    if (typeof value === 'boolean') return 'boolean'
    if (typeof value === 'number') return 'number'
    if (typeof value === 'object' && value !== null) return 'json'
    return 'string'
  }

  const parseValue = (inputValue: string): unknown => {
    const type = getValueType()
    
    if (type === 'boolean') {
      return inputValue === 'true' || inputValue === '1'
    }
    
    if (type === 'number') {
      const num = Number(inputValue)
      if (isNaN(num)) {
        throw new Error('Invalid number')
      }
      return num
    }
    
    if (type === 'json') {
      try {
        return JSON.parse(inputValue)
      } catch {
        throw new Error('Invalid JSON')
      }
    }
    
    return inputValue
  }

  const handleSave = async () => {
    try {
      setError(null)
      const parsedValue = parseValue(editedValue)
      await onSave(property, parsedValue)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse value')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSave()
    } else if (e.key === 'Escape') {
      onCancel()
    }
  }

  const type = getValueType()

  return (
    <div className="space-y-2 p-3 bg-muted/50 rounded-md border border-border/50">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono font-semibold text-muted-foreground">
          {property}
        </span>
        <div className="flex items-center gap-1">
          {isDirty && (
            <span className="text-xs text-amber-500">Modified</span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-6 w-6 p-0"
            disabled={isSaving}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {type === 'boolean' ? (
        <div className="flex items-center gap-2">
          <Checkbox
            checked={editedValue === 'true' || editedValue === '1'}
            onCheckedChange={(checked) => {
              setEditedValue(String(checked))
              setError(null)
            }}
            disabled={isSaving}
          />
          <span className="text-xs text-muted-foreground">
            {editedValue === 'true' || editedValue === '1' ? 'True' : 'False'}
          </span>
        </div>
      ) : type === 'number' ? (
        <Input
          type="number"
          value={editedValue}
          onChange={(e) => {
            setEditedValue(e.target.value)
            setError(null)
          }}
          onKeyDown={handleKeyDown}
          disabled={isSaving}
          className="text-xs h-8"
        />
      ) : type === 'json' ? (
        <Textarea
          value={editedValue}
          onChange={(e) => {
            setEditedValue(e.target.value)
            setError(null)
          }}
          onKeyDown={handleKeyDown}
          disabled={isSaving}
          className="text-xs font-mono min-h-[100px]"
          dir="ltr"
        />
      ) : (
        <Input
          type="text"
          value={editedValue}
          onChange={(e) => {
            setEditedValue(e.target.value)
            setError(null)
          }}
          onKeyDown={handleKeyDown}
          disabled={isSaving}
          className="text-xs h-8"
          dir="ltr"
        />
      )}

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={isSaving}
          className="h-7 text-xs"
        >
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isSaving || !isDirty || !!error}
          className="h-7 text-xs"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-3 w-3 mr-1" />
              Save
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

