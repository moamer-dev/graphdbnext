'use client'

import React from 'react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../ui/select'
import { Plus, Trash2, ArrowRight, ArrowLeft, ShieldAlert } from 'lucide-react'
import { CollapsibleSection } from '../../shared/CollapsibleSection'
import { Switch } from '../../ui/switch'
import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'
import type { ActionConfigurationState } from '../../../stores/actionConfigurationStore'

interface ActionCreateNodeWithLookupConfigurationProps {
  actionNodeId: string
  actionNode: ActionCanvasNode | null
  createNodeWithLookupConfig: ActionConfigurationState['createNodeWithLookupConfig']
  onCreateNodeWithLookupConfigChange: (config: ActionConfigurationState['createNodeWithLookupConfig']) => void
  onUpdateActionNode: (id: string, updates: Partial<ActionCanvasNode>) => void
}

export function ActionCreateNodeWithLookupConfiguration({
  actionNodeId,
  actionNode,
  createNodeWithLookupConfig,
  onCreateNodeWithLookupConfigChange,
  onUpdateActionNode
}: ActionCreateNodeWithLookupConfigurationProps) {
  if (!actionNode) return null

  const handleAddField = () => {
    const newMappings = [
      ...createNodeWithLookupConfig.attributeMappings,
      { attributeName: '', propertyKey: '', defaultValue: '' }
    ]
    const updated = { ...createNodeWithLookupConfig, attributeMappings: newMappings }
    onCreateNodeWithLookupConfigChange(updated)
    onUpdateActionNode(actionNodeId, { config: updated })
  }

  const handleRemoveField = (index: number) => {
    const newMappings = createNodeWithLookupConfig.attributeMappings.filter((_, i) => i !== index)
    const updated = { ...createNodeWithLookupConfig, attributeMappings: newMappings }
    onCreateNodeWithLookupConfigChange(updated)
    onUpdateActionNode(actionNodeId, { config: updated })
  }

  const handleMappingChange = (index: number, field: string, value: string) => {
    const newMappings = [...createNodeWithLookupConfig.attributeMappings]
    newMappings[index] = { ...newMappings[index], [field]: value }
    const updated = { ...createNodeWithLookupConfig, attributeMappings: newMappings }
    onCreateNodeWithLookupConfigChange(updated)
    onUpdateActionNode(actionNodeId, { config: updated })
  }

  const handleConfigChange = (field: keyof ActionConfigurationState['createNodeWithLookupConfig'], value: any) => {
    const updated = { ...createNodeWithLookupConfig, [field]: value }
    onCreateNodeWithLookupConfigChange(updated)
    onUpdateActionNode(actionNodeId, { config: updated })
  }

  return (
    <CollapsibleSection title="Create Node with Lookup" defaultOpen={true}>
      <div className="space-y-4">
        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded">
          <p className="text-xs text-blue-800 dark:text-blue-200">
            <strong>Lookup Action:</strong> Creates a node and establishes a relationship by looking up another node based on properties.
          </p>
        </div>

        <div className="space-y-4">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">New Node</Label>
          <div className="space-y-2">
            <Label className="text-xs">Node Label</Label>
            <Input
              placeholder="e.g. Person"
              className="h-8 text-xs"
              value={createNodeWithLookupConfig.nodeLabel}
              onChange={(e) => handleConfigChange('nodeLabel', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs italic">Attribute Mappings</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddField}
                className="h-6 px-2 text-[10px]"
              >
                <Plus size={12} className="mr-1" /> Add
              </Button>
            </div>

            <div className="space-y-2">
              {createNodeWithLookupConfig.attributeMappings.map((mapping, index) => (
                <div key={index} className="p-2 border rounded space-y-2 bg-slate-50/50 dark:bg-slate-900/50">
                  <div className="flex items-center justify-between gap-2">
                    <Input
                      placeholder="XML Attribute"
                      className="h-7 text-xs flex-1"
                      value={mapping.attributeName}
                      onChange={(e) => handleMappingChange(index, 'attributeName', e.target.value)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveField(index)}
                      className="h-7 w-7 p-0 text-destructive"
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Property Key"
                      className="h-7 text-xs"
                      value={mapping.propertyKey}
                      onChange={(e) => handleMappingChange(index, 'propertyKey', e.target.value)}
                    />
                    <Input
                      placeholder="Default Value"
                      className="h-7 text-xs"
                      value={mapping.defaultValue}
                      onChange={(e) => handleMappingChange(index, 'defaultValue', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-2 mt-4 bg-slate-50 dark:bg-slate-900/50 border rounded">
            <div className="space-y-0.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Properties</Label>
              <p className="text-[10px] text-muted-foreground italic">Inherit attributes from XML</p>
            </div>
            <Switch
              checked={createNodeWithLookupConfig.inheritProperties}
              onCheckedChange={(checked) => handleConfigChange('inheritProperties', checked)}
            />
          </div>
        </div>

        <div className="h-px bg-border my-4" />

        <div className="space-y-4">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Lookup Target</Label>
          
          <div className="space-y-2">
            <Label className="text-xs">Target Label (Optional)</Label>
            <Input
              placeholder="e.g. Document"
              className="h-8 text-xs"
              value={createNodeWithLookupConfig.lookupLabel}
              onChange={(e) => handleConfigChange('lookupLabel', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px]">Property Key</Label>
              <Input
                placeholder="id"
                className="h-8 text-xs"
                value={createNodeWithLookupConfig.lookupPropertyKey}
                onChange={(e) => handleConfigChange('lookupPropertyKey', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">Property Value</Label>
              <Input
                placeholder="value or {{ @id }}"
                className="h-8 text-xs"
                value={createNodeWithLookupConfig.lookupPropertyValue}
                onChange={(e) => handleConfigChange('lookupPropertyValue', e.target.value)}
              />
              <p className="text-[9px] text-muted-foreground italic">Use {"{{ @attribute }}"} for dynamic values from XML</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-2 mt-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded">
            <div className="space-y-0.5">
              <Label className="text-xs font-semibold text-orange-800 dark:text-orange-200">Strict Lookup</Label>
              <p className="text-[10px] text-orange-700/70 dark:text-orange-300/70">
                Cancel node creation if target is not found
              </p>
            </div>
            <Switch
              checked={createNodeWithLookupConfig.mustResolve}
              onCheckedChange={(checked) => handleConfigChange('mustResolve', checked)}
            />
          </div>
        </div>

        <div className="h-px bg-border my-4" />

        <div className="space-y-4">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Relationship</Label>
          
          <div className="space-y-2">
            <Label className="text-xs">Type</Label>
            <Input
              placeholder="e.g. belongsTo"
              className="h-8 text-xs"
              value={createNodeWithLookupConfig.relationshipType}
              onChange={(e) => handleConfigChange('relationshipType', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Direction</Label>
            <Select
              value={createNodeWithLookupConfig.direction}
              onValueChange={(value) => handleConfigChange('direction', value)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="outgoing">
                  <div className="flex items-center gap-2">
                    <ArrowRight className="h-3 w-3" />
                    <span>New → Target</span>
                  </div>
                </SelectItem>
                <SelectItem value="incoming">
                  <div className="flex items-center gap-2">
                    <ArrowLeft className="h-3 w-3" />
                    <span>Target → New</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </CollapsibleSection>
  )
}
