'use client'

import { useState, useCallback, useMemo } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Badge } from '@/components/ui/badge'
import { useMutation } from '../../hooks/database/useMutation'
import { useNodeLabels } from '../../hooks'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CreateNodeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (nodeId?: number | string) => void
  availableLabels?: string[]
}

export function CreateNodeDialog ({ open, onOpenChange, onSuccess, availableLabels = [] }: CreateNodeDialogProps) {
  const [labels, setLabels] = useState<string[]>([])
  const [properties, setProperties] = useState<Array<{ key: string; value: string; type: 'string' | 'number' | 'boolean' }>>([])
  const [newPropertyKey, setNewPropertyKey] = useState('')
  const [newPropertyValue, setNewPropertyValue] = useState('')
  const [newPropertyType, setNewPropertyType] = useState<'string' | 'number' | 'boolean'>('string')
  const [labelPopoverOpen, setLabelPopoverOpen] = useState(false)
  const [labelSearch, setLabelSearch] = useState('')
  const [newLabelDialogOpen, setNewLabelDialogOpen] = useState(false)
  const [newLabelInput, setNewLabelInput] = useState('')
  const { createNode, isSaving } = useMutation()
  const { nodeLabels: allNodeLabels, loading: loadingLabels, refresh: refreshNodeLabels } = useNodeLabels(open)

  // Use provided labels if available, otherwise use fetched ones
  const defaultLabels = availableLabels.length > 0 ? availableLabels : allNodeLabels

  // Filter labels based on search
  const filteredLabels = useMemo(() => {
    if (!labelSearch.trim()) {
      return defaultLabels.filter(label => !labels.includes(label))
    }
    const searchLower = labelSearch.toLowerCase()
    return defaultLabels
      .filter(label => !labels.includes(label))
      .filter(label => label.toLowerCase().includes(searchLower))
  }, [defaultLabels, labels, labelSearch])

  // Check if search term doesn't match any existing label (for "Create new" option)
  const canCreateNewLabel = useMemo(() => {
    if (!labelSearch.trim()) return false
    const searchLower = labelSearch.toLowerCase().trim()
    return !defaultLabels.some(label => label.toLowerCase() === searchLower) && 
           !labels.some(label => label.toLowerCase() === searchLower)
  }, [defaultLabels, labels, labelSearch])


  const handleAddLabel = useCallback((label: string) => {
    if (label && !labels.includes(label)) {
      setLabels([...labels, label])
    }
  }, [labels])

  const handleRemoveLabel = useCallback((labelToRemove: string) => {
    setLabels(labels.filter(l => l !== labelToRemove))
  }, [labels])

  const handleAddProperty = useCallback(() => {
    if (newPropertyKey.trim()) {
      setProperties([...properties, { key: newPropertyKey.trim(), value: newPropertyValue, type: newPropertyType }])
      setNewPropertyKey('')
      setNewPropertyValue('')
      setNewPropertyType('string')
    }
  }, [newPropertyKey, newPropertyValue, newPropertyType, properties])

  const handleRemoveProperty = useCallback((index: number) => {
    setProperties(properties.filter((_, i) => i !== index))
  }, [properties])

  const parseValue = useCallback((value: string, type: 'string' | 'number' | 'boolean'): unknown => {
    if (type === 'number') {
      const num = parseFloat(value)
      return isNaN(num) ? 0 : num
    }
    if (type === 'boolean') {
      return value.toLowerCase() === 'true' || value === '1'
    }
    return value
  }, [])

  const handleCreate = useCallback(async () => {
    if (labels.length === 0) {
      return
    }

    // Auto-add pending property if user has entered a key but forgot to click the plus icon
    let finalProperties = [...properties]
    if (newPropertyKey.trim()) {
      finalProperties = [...properties, { key: newPropertyKey.trim(), value: newPropertyValue, type: newPropertyType }]
    }

    const propertiesObj: Record<string, unknown> = {}
    finalProperties.forEach(prop => {
      if (prop.key.trim()) {
        propertiesObj[prop.key] = parseValue(prop.value, prop.type)
      }
    })

    const result = await createNode(labels, propertiesObj)
    if (result.success && result.nodeId) {
      // Refresh node labels and trigger event for other components
      refreshNodeLabels()
      window.dispatchEvent(new CustomEvent('nodeLabelsChanged'))
      // Call onSuccess first - the parent should handle closing the dialog
      onSuccess?.(result.nodeId)
    }
  }, [labels, properties, newPropertyKey, newPropertyValue, newPropertyType, createNode, parseValue, onSuccess, refreshNodeLabels])

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange} modal={true}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Node</DialogTitle>
          <DialogDescription>
            Create a new node with labels and properties
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Labels Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Labels *</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setNewLabelDialogOpen(true)}
                className="h-6 text-xs px-2"
                type="button"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add New Label
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Popover open={labelPopoverOpen} onOpenChange={setLabelPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={labelPopoverOpen}
                    className="w-full justify-between text-left font-normal"
                    disabled={loadingLabels}
                  >
                    {loadingLabels 
                      ? 'Loading labels...'
                      : defaultLabels.length === 0
                      ? 'No labels found'
                      : 'Select a label...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput 
                      placeholder="Search labels..." 
                      value={labelSearch}
                      onValueChange={setLabelSearch}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {loadingLabels ? 'Loading...' : 'No labels found.'}
                      </CommandEmpty>
                      {filteredLabels.length > 0 && (
                        <CommandGroup>
                          {filteredLabels.map(label => (
                            <CommandItem
                              key={label}
                              value={label}
                              onSelect={() => {
                                handleAddLabel(label)
                                setLabelPopoverOpen(false)
                                setLabelSearch('')
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  labels.includes(label) ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {label}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                      {canCreateNewLabel && (
                        <CommandGroup>
                          <CommandItem
                            value={labelSearch.trim()}
                            onSelect={() => {
                              const newLabel = labelSearch.trim()
                              handleAddLabel(newLabel)
                              setLabelPopoverOpen(false)
                              setLabelSearch('')
                            }}
                            className="text-primary font-medium"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Create new: &ldquo;{labelSearch.trim()}&rdquo;
                          </CommandItem>
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            {labels.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {labels.map(label => (
                  <Badge key={label} variant="secondary" className="text-xs">
                    {label}
                    <button
                      onClick={() => handleRemoveLabel(label)}
                      className="ml-1 hover:text-destructive"
                      type="button"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Properties */}
          <div className="space-y-2">
            <Label>Properties</Label>
            {(properties.length > 0 || newPropertyKey.trim()) && (
              <div className="space-y-2 mb-2">
                {properties.map((prop, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                    <span className="text-xs font-mono flex-1">{prop.key}:</span>
                    <span className="text-xs text-muted-foreground">{String(prop.value)}</span>
                    <Badge variant="outline" className="text-xs">{prop.type}</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveProperty(index)}
                      className="h-6 w-6 p-0"
                      type="button"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {newPropertyKey.trim() && (
                  <div className="flex items-center gap-2 p-2 bg-muted/50 border border-dashed rounded">
                    <span className="text-xs font-mono flex-1">{newPropertyKey}:</span>
                    <span className="text-xs text-muted-foreground">{newPropertyValue || '(empty)'}</span>
                    <Badge variant="outline" className="text-xs">{newPropertyType}</Badge>
                    <span className="text-xs text-muted-foreground italic">(will be added)</span>
                  </div>
                )}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Input
                placeholder="Property key"
                value={newPropertyKey}
                onChange={(e) => setNewPropertyKey(e.target.value)}
                className="flex-1 text-xs"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddProperty()
                  }
                }}
              />
              <Input
                placeholder="Value"
                value={newPropertyValue}
                onChange={(e) => setNewPropertyValue(e.target.value)}
                className="flex-1 text-xs"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddProperty()
                  }
                }}
              />
              <Select value={newPropertyType} onValueChange={(v) => setNewPropertyType(v as 'string' | 'number' | 'boolean')}>
                <SelectTrigger className="w-24 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="string">String</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="boolean">Boolean</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddProperty}
                disabled={!newPropertyKey.trim()}
                className="h-8 text-xs"
                type="button"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={labels.length === 0 || isSaving}>
            {isSaving ? 'Creating...' : 'Create Node'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

      {/* Dialog for creating new label */}
      <Dialog open={newLabelDialogOpen} onOpenChange={setNewLabelDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Label</DialogTitle>
            <DialogDescription>
              Enter a new node label name
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <Label>Label Name</Label>
              <Input
                placeholder="e.g., Person, Product"
                value={newLabelInput}
                onChange={(e) => setNewLabelInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newLabelInput.trim()) {
                    const newLabel = newLabelInput.trim()
                    handleAddLabel(newLabel)
                    setNewLabelInput('')
                    setNewLabelDialogOpen(false)
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setNewLabelDialogOpen(false)
              setNewLabelInput('')
            }}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (newLabelInput.trim()) {
                  const newLabel = newLabelInput.trim()
                  handleAddLabel(newLabel)
                  setNewLabelInput('')
                  setNewLabelDialogOpen(false)
                }
              }}
              disabled={!newLabelInput.trim()}
            >
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

