'use client'

import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { Plus, Trash2 } from 'lucide-react'

interface KeyValueEditorProps {
  title?: string
  description?: string
  entries: Array<{ key: string; value: string }>
  onEntriesChange: (entries: Array<{ key: string; value: string }>) => void
  keyPlaceholder?: string
  valuePlaceholder?: string
}

export function KeyValueEditor({
  title,
  description,
  entries,
  onEntriesChange,
  keyPlaceholder = 'Key',
  valuePlaceholder = 'Value'
}: KeyValueEditorProps) {
  const addEntry = () => {
    onEntriesChange([...entries, { key: '', value: '' }])
  }

  const removeEntry = (index: number) => {
    onEntriesChange(entries.filter((_, i) => i !== index))
  }

  const updateEntry = (index: number, field: 'key' | 'value', val: string) => {
    const updated = [...entries]
    updated[index] = { ...updated[index], [field]: val }
    onEntriesChange(updated)
  }

  return (
    <div className="space-y-2 pt-2 border-t">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          {title && <Label className="text-xs font-medium">{title}</Label>}
          {description && <div className="text-[10px] text-muted-foreground">{description}</div>}
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={addEntry} className="h-6 px-2 text-[10px]">
          <Plus className="h-3 w-3 mr-1" /> Add
        </Button>
      </div>
      
      {entries.length === 0 && (
        <div className="text-[10px] text-muted-foreground italic text-center py-2 border border-dashed rounded">
          No entries added
        </div>
      )}

      {entries.map((entry, index) => (
        <div key={index} className="flex gap-2 items-start group">
          <Input
            placeholder={keyPlaceholder}
            className="h-7 text-[10px] flex-1"
            value={entry.key}
            onChange={(e) => updateEntry(index, 'key', e.target.value)}
          />
          <Input
            placeholder={valuePlaceholder}
            className="h-7 text-[10px] flex-1"
            value={entry.value}
            onChange={(e) => updateEntry(index, 'value', e.target.value)}
          />
          <Button 
            type="button"
            variant="ghost" 
            size="sm" 
            onClick={() => removeEntry(index)}
            className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="h-3 w-3 text-destructive" />
          </Button>
        </div>
      ))}
    </div>
  )
}
