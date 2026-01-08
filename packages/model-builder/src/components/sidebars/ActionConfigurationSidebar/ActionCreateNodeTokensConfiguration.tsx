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
import { X } from 'lucide-react'
import { CollapsibleSection } from '../../shared/CollapsibleSection'
import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'
import type { ActionConfigurationState } from '../../../stores/actionConfigurationStore'

interface ActionCreateNodeTokensConfigurationProps {
  actionNodeId: string
  actionNode: ActionCanvasNode | null
  createNodeTokensConfig: ActionConfigurationState['createNodeTokensConfig']
  onCreateNodeTokensConfigChange: (config: ActionConfigurationState['createNodeTokensConfig']) => void
  onUpdateActionNode: (id: string, updates: Partial<ActionCanvasNode>) => void
}

export function ActionCreateNodeTokensConfiguration({
  actionNodeId,
  actionNode,
  createNodeTokensConfig,
  onCreateNodeTokensConfigChange,
  onUpdateActionNode
}: ActionCreateNodeTokensConfigurationProps) {
  if (!actionNode) return null

  return (
    <CollapsibleSection title="Create Node Tokens Configuration" defaultOpen={true}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium">Node Label</Label>
          <Input
            value={createNodeTokensConfig.targetLabel}
            onChange={(e) => {
              const value = e.target.value
              const updated = { ...createNodeTokensConfig, targetLabel: value }
              onCreateNodeTokensConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, targetLabel: value }
              })
            }}
            placeholder="Character"
            className="h-8 text-xs"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium">Relationship Type</Label>
          <Input
            value={createNodeTokensConfig.relationshipType}
            onChange={(e) => {
              const value = e.target.value
              const updated = { ...createNodeTokensConfig, relationshipType: value }
              onCreateNodeTokensConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, relationshipType: value }
              })
            }}
            placeholder="contains"
            className="h-8 text-xs"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium">Split By</Label>
          <Input
            value={createNodeTokensConfig.splitBy}
            onChange={(e) => {
              const value = e.target.value
              const updated = { ...createNodeTokensConfig, splitBy: value }
              onCreateNodeTokensConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, splitBy: value }
              })
            }}
            placeholder="Empty for character-level"
            className="h-8 text-xs"
          />
          <p className="text-[10px] text-muted-foreground">Leave empty for character-level tokenization</p>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium">Filter Pattern (Regex)</Label>
          <Input
            value={createNodeTokensConfig.filterPattern}
            onChange={(e) => {
              const value = e.target.value
              const updated = { ...createNodeTokensConfig, filterPattern: value }
              onCreateNodeTokensConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, filterPattern: value }
              })
            }}
            placeholder="[a-zA-Z0-9]"
            className="h-8 text-xs"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">Property Mappings</Label>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const newProp = { key: '', source: 'token' as const }
                const updated = [...createNodeTokensConfig.properties, newProp]
                const newConfig = { ...createNodeTokensConfig, properties: updated }
                onCreateNodeTokensConfigChange(newConfig)
                onUpdateActionNode(actionNodeId, {
                  config: { ...actionNode.config, properties: updated }
                })
              }}
              className="h-6 px-2 text-[10px]"
            >
              + Add
            </Button>
          </div>
          {createNodeTokensConfig.properties.map((prop, idx) => (
            <div key={idx} className="flex gap-2 items-end">
              <div className="flex-1 space-y-1">
                <Input
                  value={prop.key}
                  onChange={(e) => {
                    const updated = [...createNodeTokensConfig.properties]
                    updated[idx] = { ...updated[idx], key: e.target.value }
                    const newConfig = { ...createNodeTokensConfig, properties: updated }
                    onCreateNodeTokensConfigChange(newConfig)
                    onUpdateActionNode(actionNodeId, {
                      config: { ...actionNode.config, properties: updated }
                    })
                  }}
                  placeholder="Property key"
                  className="h-7 text-xs"
                />
                <Select
                  value={prop.source}
                  onValueChange={(value: 'token' | 'attribute' | 'index' | 'static') => {
                    const updated = [...createNodeTokensConfig.properties]
                    updated[idx] = { ...updated[idx], source: value }
                    const newConfig = { ...createNodeTokensConfig, properties: updated }
                    onCreateNodeTokensConfigChange(newConfig)
                    onUpdateActionNode(actionNodeId, {
                      config: { ...actionNode.config, properties: updated }
                    })
                  }}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="token">Token (character)</SelectItem>
                    <SelectItem value="attribute">XML Attribute</SelectItem>
                    <SelectItem value="index">Index</SelectItem>
                    <SelectItem value="static">Static Value</SelectItem>
                  </SelectContent>
                </Select>
                {prop.source === 'attribute' && (
                  <Input
                    value={prop.attributeName || ''}
                    onChange={(e) => {
                      const updated = [...createNodeTokensConfig.properties]
                      updated[idx] = { ...updated[idx], attributeName: e.target.value }
                      const newConfig = { ...createNodeTokensConfig, properties: updated }
                      onCreateNodeTokensConfigChange(newConfig)
                      onUpdateActionNode(actionNodeId, {
                        config: { ...actionNode.config, properties: updated }
                      })
                    }}
                    placeholder="Attribute name"
                    className="h-7 text-xs mt-1"
                  />
                )}
                {prop.source === 'static' && (
                  <Input
                    value={prop.staticValue || ''}
                    onChange={(e) => {
                      const updated = [...createNodeTokensConfig.properties]
                      updated[idx] = { ...updated[idx], staticValue: e.target.value }
                      const newConfig = { ...createNodeTokensConfig, properties: updated }
                      onCreateNodeTokensConfigChange(newConfig)
                      onUpdateActionNode(actionNodeId, {
                        config: { ...actionNode.config, properties: updated }
                      })
                    }}
                    placeholder="Static value"
                    className="h-7 text-xs mt-1"
                  />
                )}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  const updated = createNodeTokensConfig.properties.filter((_, i) => i !== idx)
                  const newConfig = { ...createNodeTokensConfig, properties: updated }
                  onCreateNodeTokensConfigChange(newConfig)
                  onUpdateActionNode(actionNodeId, {
                    config: { ...actionNode.config, properties: updated }
                  })
                }}
                className="h-7 w-7 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
          {createNodeTokensConfig.properties.length === 0 && (
            <p className="text-[10px] text-muted-foreground">No property mappings. Default: text=token, index=index</p>
          )}
        </div>
      </div>
    </CollapsibleSection>
  )
}
