'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'

interface TableCellEditorProps {
  value: unknown
  onSave: (value: unknown) => void
  onCancel: () => void
}

export function TableCellEditor ({ value, onSave, onCancel }: TableCellEditorProps) {
  const [editedValue, setEditedValue] = useState<string>(() => {
    if (value === null || value === undefined) return ''
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2)
    }
    return String(value)
  })

  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    if (inputRef.current instanceof HTMLInputElement) {
      inputRef.current.select()
    }
  }, [])

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

  const handleSave = () => {
    try {
      const parsedValue = parseValue(editedValue)
      onSave(parsedValue)
    } catch {
      onCancel()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey || getValueType() === 'json')) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onCancel()
    } else if (e.key === 'Enter' && getValueType() !== 'json' && getValueType() !== 'boolean') {
      e.preventDefault()
      handleSave()
    }
  }

  const handleBlur = () => {
    handleSave()
  }

  const type = getValueType()

  return (
    <div className="w-full">
      {type === 'boolean' ? (
        <div className="flex items-center gap-2 py-1">
          <Checkbox
            checked={editedValue === 'true' || editedValue === '1'}
            onCheckedChange={(checked) => {
              setEditedValue(String(checked))
              onSave(checked)
            }}
          />
        </div>
      ) : type === 'number' ? (
        <Input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="number"
          value={editedValue}
          onChange={(e) => setEditedValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="h-7 text-xs p-1"
          dir="ltr"
        />
      ) : type === 'json' ? (
        <Textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={editedValue}
          onChange={(e) => setEditedValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="text-xs font-mono min-h-[80px] p-1"
          dir="ltr"
        />
      ) : (
        <Input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
          value={editedValue}
          onChange={(e) => setEditedValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="h-7 text-xs p-1"
          dir="ltr"
        />
      )}
    </div>
  )
}

