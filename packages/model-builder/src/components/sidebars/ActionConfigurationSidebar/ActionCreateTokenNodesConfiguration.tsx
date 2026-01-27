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

interface ActionCreateTokenNodesConfigurationProps {
  actionNodeId: string
  actionNode: ActionCanvasNode | null
  createTokenNodesConfig: ActionConfigurationState['createTokenNodesConfig']
  onCreateTokenNodesConfigChange: (config: ActionConfigurationState['createTokenNodesConfig']) => void
  onUpdateActionNode: (id: string, updates: Partial<ActionCanvasNode>) => void
}

export function ActionCreateTokenNodesConfiguration({
  actionNodeId,
  actionNode,
  createTokenNodesConfig,
  onCreateTokenNodesConfigChange,
  onUpdateActionNode
}: ActionCreateTokenNodesConfigurationProps) {
  if (!actionNode) return null

  return (
    <CollapsibleSection title="Create Token Nodes Configuration" defaultOpen={true}>
      <div className="space-y-4">
        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded">
          <p className="text-xs text-blue-800 dark:text-blue-200">
            <strong>Quick Action:</strong> Creates a parent node and token nodes for each character/token. Handles tokenization, filtering, and property mapping automatically.
          </p>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Parent Node Label</Label>
          <Input
            placeholder="e.g., Word, W"
            className="h-8 text-xs"
            value={createTokenNodesConfig.parentNodeLabel}
            onChange={(e) => {
              const value = e.target.value
              const updated = { ...createTokenNodesConfig, parentNodeLabel: value }
              onCreateTokenNodesConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, parentNodeLabel: value }
              })
            }}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Token Node Label</Label>
          <Input
            placeholder="e.g., Character"
            className="h-8 text-xs"
            value={createTokenNodesConfig.tokenNodeLabel}
            onChange={(e) => {
              const value = e.target.value
              const updated = { ...createTokenNodesConfig, tokenNodeLabel: value }
              onCreateTokenNodesConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, tokenNodeLabel: value }
              })
            }}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Relationship Type</Label>
          <Input
            placeholder="e.g., contains"
            className="h-8 text-xs"
            value={createTokenNodesConfig.relationshipType}
            onChange={(e) => {
              const value = e.target.value
              const updated = { ...createTokenNodesConfig, relationshipType: value }
              onCreateTokenNodesConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, relationshipType: value }
              })
            }}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Text Source</Label>
          <Select
            value={createTokenNodesConfig.textSource}
            onValueChange={(value) => {
              const updated = { ...createTokenNodesConfig, textSource: value as 'textContent' | 'attribute' }
              onCreateTokenNodesConfigChange(updated)
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
        {createTokenNodesConfig.textSource === 'attribute' && (
          <div className="space-y-2">
            <Label className="text-xs font-medium">Attribute Name</Label>
            <Input
              placeholder="e.g., text, lemma"
              className="h-8 text-xs"
              value={createTokenNodesConfig.attributeName}
              onChange={(e) => {
                const value = e.target.value
                const updated = { ...createTokenNodesConfig, attributeName: value }
                onCreateTokenNodesConfigChange(updated)
                onUpdateActionNode(actionNodeId, {
                  config: { ...actionNode.config, attributeName: value }
                })
              }}
            />
          </div>
        )}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">Transforms (Applied Before Tokenization)</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const newTransform: TextTransform = { type: 'lowercase' }
                const updated = { ...createTokenNodesConfig, transforms: [...createTokenNodesConfig.transforms, newTransform] }
                onCreateTokenNodesConfigChange(updated)
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
            transforms={createTokenNodesConfig.transforms}
            onTransformsChange={(transforms) => {
              const updated = { ...createTokenNodesConfig, transforms }
              onCreateTokenNodesConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, transforms }
              })
            }}
          />
          {createTokenNodesConfig.transforms.length === 0 && (
            <p className="text-[10px] text-muted-foreground">No transforms defined. Text will be tokenized as-is.</p>
          )}
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Split By</Label>
          <Input
            placeholder="Leave empty for character-level"
            className="h-8 text-xs"
            value={createTokenNodesConfig.splitBy}
            onChange={(e) => {
              const value = e.target.value
              const updated = { ...createTokenNodesConfig, splitBy: value }
              onCreateTokenNodesConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, splitBy: value }
              })
            }}
          />
          <p className="text-[10px] text-muted-foreground">Leave empty for character-level tokenization</p>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Filter Pattern (Regex)</Label>
          <Input
            placeholder="e.g., [a-zA-Z0-9]"
            className="h-8 text-xs"
            value={createTokenNodesConfig.filterPattern}
            onChange={(e) => {
              const value = e.target.value
              const updated = { ...createTokenNodesConfig, filterPattern: value }
              onCreateTokenNodesConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, filterPattern: value }
              })
            }}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Structure</Label>
          <Select
            value={createTokenNodesConfig.structure || 'flat'}
            onValueChange={(value) => {
              const updated = { ...createTokenNodesConfig, structure: value as 'flat' | 'chained' }
              onCreateTokenNodesConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, structure: value }
              })
            }}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="flat">Flat (All connect to Parent)</SelectItem>
              <SelectItem value="chained">Chained (Linked List)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-[10px] text-muted-foreground">
            Flat: Parent -&gt; Token1, Parent -&gt; Token2<br />
            Chained: Parent -&gt; Token1 -&gt; Token2
          </p>
        </div>

        {createTokenNodesConfig.structure === 'chained' && (
          <div className="space-y-2">
            <Label className="text-xs font-medium">Next Token Relationship</Label>
            <Input
              placeholder="e.g., next"
              className="h-8 text-xs"
              value={createTokenNodesConfig.nextRelationshipType || 'next'}
              onChange={(e) => {
                const value = e.target.value
                const updated = { ...createTokenNodesConfig, nextRelationshipType: value }
                onCreateTokenNodesConfigChange(updated)
                onUpdateActionNode(actionNodeId, {
                  config: { ...actionNode.config, nextRelationshipType: value }
                })
              }}
            />
          </div>
        )}
      </div>
    </CollapsibleSection>
  )
}

