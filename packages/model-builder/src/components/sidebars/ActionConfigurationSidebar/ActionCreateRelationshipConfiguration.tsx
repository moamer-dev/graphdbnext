'use client'

import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { CollapsibleSection } from '../../shared/CollapsibleSection'
import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'
import type { ActionConfigurationState } from '../../../stores/actionConfigurationStore'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '../../ui/button'

interface ActionCreateRelationshipConfigurationProps {
  actionNodeId: string
  actionNode: ActionCanvasNode | null
  createRelationshipConfig: ActionConfigurationState['createRelationshipConfig']
  onCreateRelationshipConfigChange: (config: ActionConfigurationState['createRelationshipConfig']) => void
  onUpdateActionNode: (id: string, updates: Partial<ActionCanvasNode>) => void
}

export function ActionCreateRelationshipConfiguration({
  actionNodeId,
  actionNode,
  createRelationshipConfig,
  onCreateRelationshipConfigChange,
  onUpdateActionNode
}: ActionCreateRelationshipConfigurationProps) {
  if (!actionNode) return null

  const handlePropertyChange = (index: number, field: 'key' | 'value', value: string) => {
    const newProperties = [...(createRelationshipConfig.properties || [])]
    newProperties[index] = { ...newProperties[index], [field]: value }
    const updated = { ...createRelationshipConfig, properties: newProperties }
    onCreateRelationshipConfigChange(updated)
    onUpdateActionNode(actionNodeId, {
      config: { ...actionNode.config, properties: newProperties }
    })
  }

  const addProperty = () => {
    const newProperties = [...(createRelationshipConfig.properties || []), { key: '', value: '' }]
    const updated = { ...createRelationshipConfig, properties: newProperties }
    onCreateRelationshipConfigChange(updated)
    onUpdateActionNode(actionNodeId, {
      config: { ...actionNode.config, properties: newProperties }
    })
  }

  const removeProperty = (index: number) => {
    const newProperties = createRelationshipConfig.properties.filter((_, i) => i !== index)
    const updated = { ...createRelationshipConfig, properties: newProperties }
    onCreateRelationshipConfigChange(updated)
    onUpdateActionNode(actionNodeId, {
      config: { ...actionNode.config, properties: newProperties }
    })
  }

  return (
    <CollapsibleSection title="Create Relationship Configuration" defaultOpen={true}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium">Relationship Type</Label>
          <Input
            placeholder="e.g., contains, refersTo"
            className="h-8 text-xs"
            value={createRelationshipConfig.relationshipType}
            onChange={(e) => {
              const updated = { ...createRelationshipConfig, relationshipType: e.target.value }
              onCreateRelationshipConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, relationshipType: e.target.value }
              })
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label className="text-xs font-medium">Source Node</Label>
            <Select
              value={createRelationshipConfig.fromNode || 'current'}
              onValueChange={(value) => {
                const updated = { ...createRelationshipConfig, fromNode: value }
                onCreateRelationshipConfigChange(updated)
                onUpdateActionNode(actionNodeId, {
                  config: { ...actionNode.config, fromNode: value }
                })
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Current Node</SelectItem>
                <SelectItem value="parent">Parent Node</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium">Target Node</Label>
            <Select
              value={createRelationshipConfig.toNode || 'parent'}
              onValueChange={(value) => {
                const updated = { ...createRelationshipConfig, toNode: value }
                onCreateRelationshipConfigChange(updated)
                onUpdateActionNode(actionNodeId, {
                  config: { ...actionNode.config, toNode: value }
                })
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Target" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Current Node</SelectItem>
                <SelectItem value="parent">Parent Node</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">Properties</Label>
            <Button variant="ghost" size="sm" onClick={addProperty} className="h-6 px-2 text-[10px]">
              <Plus className="h-3 w-3 mr-1" /> Add
            </Button>
          </div>
          
          {(createRelationshipConfig.properties || []).map((prop, index) => (
            <div key={index} className="flex gap-2 items-start group">
              <div className="flex-1 space-y-1">
                <Input
                  placeholder="Key"
                  className="h-7 text-[10px]"
                  value={prop.key}
                  onChange={(e) => handlePropertyChange(index, 'key', e.target.value)}
                />
              </div>
              <div className="flex-1 space-y-1">
                <Input
                  placeholder="Value"
                  className="h-7 text-[10px]"
                  value={prop.value}
                  onChange={(e) => handlePropertyChange(index, 'value', e.target.value)}
                />
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => removeProperty(index)}
                className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </div>
          ))}
          {(!createRelationshipConfig.properties || createRelationshipConfig.properties.length === 0) && (
            <p className="text-[10px] text-muted-foreground italic text-center py-2">No properties defined.</p>
          )}
        </div>
      </div>
    </CollapsibleSection>
  )
}

