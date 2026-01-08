'use client'

import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'
import { X } from 'lucide-react'
import { CollapsibleSection } from '../../shared/CollapsibleSection'
import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'
import type { ActionConfigurationState } from '../../../stores/actionConfigurationStore'

interface ActionExtractAndComputePropertyConfigurationProps {
  actionNodeId: string
  actionNode: ActionCanvasNode | null
  extractAndComputePropertyConfig: ActionConfigurationState['extractAndComputePropertyConfig']
  onExtractAndComputePropertyConfigChange: (config: ActionConfigurationState['extractAndComputePropertyConfig']) => void
  onUpdateActionNode: (id: string, updates: Partial<ActionCanvasNode>) => void
}

export function ActionExtractAndComputePropertyConfiguration({
  actionNodeId,
  actionNode,
  extractAndComputePropertyConfig,
  onExtractAndComputePropertyConfigChange,
  onUpdateActionNode
}: ActionExtractAndComputePropertyConfigurationProps) {
  if (!actionNode) return null

  return (
    <CollapsibleSection title="Extract And Compute Property Configuration" defaultOpen={true}>
      <div className="space-y-4">
        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded">
          <p className="text-xs text-blue-800 dark:text-blue-200">
            <strong>Quick Action:</strong> Extracts from multiple sources, computes value, and sets as property.
          </p>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Property Key</Label>
          <Input
            placeholder="e.g., fullName"
            className="h-8 text-xs"
            value={extractAndComputePropertyConfig.propertyKey}
            onChange={(e) => {
              const value = e.target.value
              const updated = { ...extractAndComputePropertyConfig, propertyKey: value }
              onExtractAndComputePropertyConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, propertyKey: value }
              })
            }}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Computation Type</Label>
          <Select
            value={extractAndComputePropertyConfig.computation}
            onValueChange={(value) => {
              const updated = { ...extractAndComputePropertyConfig, computation: value as 'concat' | 'sum' | 'join' }
              onExtractAndComputePropertyConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, computation: value }
              })
            }}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="concat">Concatenate</SelectItem>
              <SelectItem value="sum">Sum (numbers)</SelectItem>
              <SelectItem value="join">Join with separator</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {(extractAndComputePropertyConfig.computation === 'concat' || extractAndComputePropertyConfig.computation === 'join') && (
          <div className="space-y-2">
            <Label className="text-xs font-medium">Separator</Label>
            <Input
              placeholder="e.g., space, comma"
              className="h-8 text-xs"
              value={extractAndComputePropertyConfig.separator}
              onChange={(e) => {
                const value = e.target.value
                const updated = { ...extractAndComputePropertyConfig, separator: value }
                onExtractAndComputePropertyConfigChange(updated)
                onUpdateActionNode(actionNodeId, {
                  config: { ...actionNode.config, separator: value }
                })
              }}
            />
          </div>
        )}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">Sources</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const newSource = { type: 'textContent' as const }
                const updated = { ...extractAndComputePropertyConfig, sources: [...extractAndComputePropertyConfig.sources, newSource] }
                onExtractAndComputePropertyConfigChange(updated)
                onUpdateActionNode(actionNodeId, {
                  config: { ...actionNode.config, sources: updated.sources }
                })
              }}
              className="h-6 px-2 text-[10px]"
            >
              + Add Source
            </Button>
          </div>
          <div className="space-y-2">
            {extractAndComputePropertyConfig.sources.map((source, index) => (
              <div key={index} className="p-2 border rounded space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Source {index + 1}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const updated = { ...extractAndComputePropertyConfig, sources: extractAndComputePropertyConfig.sources.filter((_, i) => i !== index) }
                      onExtractAndComputePropertyConfigChange(updated)
                      onUpdateActionNode(actionNodeId, {
                        config: { ...actionNode.config, sources: updated.sources }
                      })
                    }}
                    className="h-6 w-6 p-0 text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <Select
                  value={source.type}
                  onValueChange={(value) => {
                    const updated = [...extractAndComputePropertyConfig.sources]
                    updated[index] = { ...updated[index], type: value as 'textContent' | 'attribute' | 'static' }
                    const newConfig = { ...extractAndComputePropertyConfig, sources: updated }
                    onExtractAndComputePropertyConfigChange(newConfig)
                    onUpdateActionNode(actionNodeId, {
                      config: { ...actionNode.config, sources: updated }
                    })
                  }}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="textContent">Text Content</SelectItem>
                    <SelectItem value="attribute">XML Attribute</SelectItem>
                    <SelectItem value="static">Static Value</SelectItem>
                  </SelectContent>
                </Select>
                {source.type === 'attribute' && (
                  <Input
                    placeholder="Attribute name"
                    className="h-7 text-xs"
                    value={source.attributeName || ''}
                    onChange={(e) => {
                      const updated = [...extractAndComputePropertyConfig.sources]
                      updated[index] = { ...updated[index], attributeName: e.target.value }
                      const newConfig = { ...extractAndComputePropertyConfig, sources: updated }
                      onExtractAndComputePropertyConfigChange(newConfig)
                      onUpdateActionNode(actionNodeId, {
                        config: { ...actionNode.config, sources: updated }
                      })
                    }}
                  />
                )}
                {source.type === 'static' && (
                  <Input
                    placeholder="Static value"
                    className="h-7 text-xs"
                    value={source.staticValue || ''}
                    onChange={(e) => {
                      const updated = [...extractAndComputePropertyConfig.sources]
                      updated[index] = { ...updated[index], staticValue: e.target.value }
                      const newConfig = { ...extractAndComputePropertyConfig, sources: updated }
                      onExtractAndComputePropertyConfigChange(newConfig)
                      onUpdateActionNode(actionNodeId, {
                        config: { ...actionNode.config, sources: updated }
                      })
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </CollapsibleSection>
  )
}

