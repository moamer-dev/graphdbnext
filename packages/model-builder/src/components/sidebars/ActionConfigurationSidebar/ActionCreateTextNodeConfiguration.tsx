'use client'

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
import { CollapsibleSection } from '../../shared/CollapsibleSection'
import { TransformEditor } from './TransformEditor'
import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'
import type { ActionConfigurationState, TextTransform } from '../../../stores/actionConfigurationStore'

interface ActionCreateTextNodeConfigurationProps {
  actionNodeId: string
  actionNode: ActionCanvasNode | null
  createTextNodeConfig: ActionConfigurationState['createTextNodeConfig']
  onCreateTextNodeConfigChange: (config: ActionConfigurationState['createTextNodeConfig']) => void
  onUpdateActionNode: (id: string, updates: Partial<ActionCanvasNode>) => void
}

export function ActionCreateTextNodeConfiguration({
  actionNodeId,
  actionNode,
  createTextNodeConfig,
  onCreateTextNodeConfigChange,
  onUpdateActionNode
}: ActionCreateTextNodeConfigurationProps) {
  if (!actionNode) return null

  return (
    <CollapsibleSection title="Create Text Node Configuration" defaultOpen={true}>
      <div className="space-y-4">
        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded">
          <p className="text-xs text-blue-800 dark:text-blue-200">
            <strong>Quick Action:</strong> Creates a node, extracts text, optionally transforms it, and sets it as a property. Replaces the need for multiple separate actions.
          </p>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Node Label</Label>
          <Input
            placeholder="e.g., P, Paragraph"
            className="h-8 text-xs"
            value={createTextNodeConfig.nodeLabel}
            onChange={(e) => {
              const value = e.target.value
              const updated = { ...createTextNodeConfig, nodeLabel: value }
              onCreateTextNodeConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, nodeLabel: value }
              })
            }}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Text Source</Label>
          <Select
            value={createTextNodeConfig.textSource}
            onValueChange={(value) => {
              const updated = { ...createTextNodeConfig, textSource: value as 'textContent' | 'attribute' }
              onCreateTextNodeConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, textSource: value }
              })
            }}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="textContent">Text Content</SelectItem>
              <SelectItem value="attribute">XML Attribute</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {createTextNodeConfig.textSource === 'attribute' && (
          <div className="space-y-2">
            <Label className="text-xs font-medium">Attribute Name</Label>
            <Input
              placeholder="e.g., text, lemma"
              className="h-8 text-xs"
              value={createTextNodeConfig.attributeName}
              onChange={(e) => {
                const value = e.target.value
                const updated = { ...createTextNodeConfig, attributeName: value }
                onCreateTextNodeConfigChange(updated)
                onUpdateActionNode(actionNodeId, {
                  config: { ...actionNode.config, attributeName: value }
                })
              }}
            />
          </div>
        )}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">Transforms (Applied in Order)</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const newTransform: TextTransform = { type: 'lowercase' }
                const updated = { ...createTextNodeConfig, transforms: [...createTextNodeConfig.transforms, newTransform] }
                onCreateTextNodeConfigChange(updated)
                onUpdateActionNode(actionNodeId, {
                  config: { ...actionNode.config, transforms: updated.transforms }
                })
              }}
              className="h-6 px-2 text-[10px]"
            >
              + Add Transform
            </Button>
          </div>
          <TransformEditor
            transforms={createTextNodeConfig.transforms}
            onTransformsChange={(transforms) => {
              const updated = { ...createTextNodeConfig, transforms }
              onCreateTextNodeConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, transforms }
              })
            }}
          />
          {createTextNodeConfig.transforms.length === 0 && (
            <p className="text-[10px] text-muted-foreground">No transforms defined. Text will be used as-is.</p>
          )}
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Property Key</Label>
          <Input
            placeholder="e.g., text"
            className="h-8 text-xs"
            value={createTextNodeConfig.propertyKey}
            onChange={(e) => {
              const value = e.target.value
              const updated = { ...createTextNodeConfig, propertyKey: value }
              onCreateTextNodeConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, propertyKey: value }
              })
            }}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Parent Relationship Type</Label>
          <Input
            placeholder="e.g., contains"
            className="h-8 text-xs"
            value={createTextNodeConfig.parentRelationship}
            onChange={(e) => {
              const value = e.target.value
              const updated = { ...createTextNodeConfig, parentRelationship: value }
              onCreateTextNodeConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, parentRelationship: value }
              })
            }}
          />
        </div>
      </div>
    </CollapsibleSection>
  )
}

