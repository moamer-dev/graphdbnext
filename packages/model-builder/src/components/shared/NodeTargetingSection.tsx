'use client'

import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'

interface NodeTargetingSectionProps {
  title: string
  alias: string
  lookup?: { label?: string; propertyKey?: string; propertyValue?: string }
  options?: Array<{ value: string; label: string }>
  onAliasChange: (alias: string) => void
  onLookupChange: (lookup: any) => void
}

export function NodeTargetingSection({
  title,
  alias,
  lookup,
  options = [
    { value: 'current', label: 'Current' },
    { value: 'parent', label: 'Parent' },
    { value: 'lookup', label: 'Lookup' }
  ],
  onAliasChange,
  onLookupChange
}: NodeTargetingSectionProps) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium">{title}</Label>
      <Select
        value={alias || options[0].value}
        onValueChange={onAliasChange}
      >
        <SelectTrigger className="h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(opt => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {alias === 'lookup' && (
        <div className="p-2 border rounded bg-muted/30 space-y-2">
          <Label className="text-[10px] uppercase font-bold text-muted-foreground">{title} Lookup</Label>
          <div className="grid grid-cols-2 gap-2">
            <Input 
              placeholder="Label" 
              className="h-7 text-[10px]" 
              value={lookup?.label || ''} 
              onChange={(e) => onLookupChange({ ...lookup, label: e.target.value })}
            />
            <Input 
              placeholder="Property Key" 
              className="h-7 text-[10px]" 
              value={lookup?.propertyKey || ''} 
              onChange={(e) => onLookupChange({ ...lookup, propertyKey: e.target.value })}
            />
          </div>
          <Input 
            placeholder="Property Value" 
            className="h-7 text-[10px]" 
            value={lookup?.propertyValue || ''} 
            onChange={(e) => onLookupChange({ ...lookup, propertyValue: e.target.value })}
          />
        </div>
      )}
    </div>
  )
}
