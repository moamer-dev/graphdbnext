'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '../../ui/popover'

export interface AddPropertyPopoverProps {
  elementName: string
  onAdd: (elementName: string, propertyKey: string) => void
}

export function AddPropertyPopover({ elementName, onAdd }: AddPropertyPopoverProps) {
  const [newPropertyKey, setNewPropertyKey] = useState('')
  const [open, setOpen] = useState(false)

  const handleAdd = () => {
    if (newPropertyKey.trim()) {
      onAdd(elementName, newPropertyKey.trim())
      setNewPropertyKey('')
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs"
          title="Add custom property"
        >
          <Plus className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3">
        <div className="space-y-2">
          <Label className="text-xs">Property Key</Label>
          <Input
            value={newPropertyKey}
            onChange={(e) => setNewPropertyKey(e.target.value)}
            placeholder="Enter property key"
            className="h-7 text-xs"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAdd()
              }
            }}
            autoFocus
          />
          <Button
            size="sm"
            className="h-7 text-xs w-full"
            onClick={handleAdd}
            disabled={!newPropertyKey.trim()}
          >
            Add Property
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

