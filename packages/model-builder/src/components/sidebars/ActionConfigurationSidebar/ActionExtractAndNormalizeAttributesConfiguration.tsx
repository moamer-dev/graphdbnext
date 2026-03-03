'use client'

import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { X, Plus, Settings2 } from 'lucide-react'
import { CollapsibleSection } from '../../shared/CollapsibleSection'
import { TransformEditor } from './TransformEditor'
import { HelpTooltip } from '../../shared/HelpTooltip'
import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'
import type { ActionConfigurationState, TextTransform } from '../../../stores/actionConfigurationStore'

interface ActionExtractAndNormalizeAttributesConfigurationProps {
  actionNodeId: string
  actionNode: ActionCanvasNode | null
  extractAndNormalizeAttributesConfig: ActionConfigurationState['extractAndNormalizeAttributesConfig']
  onExtractAndNormalizeAttributesConfigChange: (config: ActionConfigurationState['extractAndNormalizeAttributesConfig']) => void
  onUpdateActionNode: (id: string, updates: Partial<ActionCanvasNode>) => void
}

export function ActionExtractAndNormalizeAttributesConfiguration({
  actionNodeId,
  actionNode,
  extractAndNormalizeAttributesConfig,
  onExtractAndNormalizeAttributesConfigChange,
  onUpdateActionNode
}: ActionExtractAndNormalizeAttributesConfigurationProps) {
  if (!actionNode) return null

  return (
    <CollapsibleSection title="Bulk Attribute Mapper Configuration" defaultOpen={true}>
      <div className="space-y-4">
        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded">
          <p className="text-xs text-blue-800 dark:text-blue-200">
            <strong>Bulk Attribute Mapper:</strong> Extracts multiple attributes, applies transforms to each, and sets them as properties.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="removeOriginal"
              checked={extractAndNormalizeAttributesConfig.removeOriginal}
              onChange={(e) => {
                const updated = { ...extractAndNormalizeAttributesConfig, removeOriginal: e.target.checked }
                onExtractAndNormalizeAttributesConfigChange(updated)
                onUpdateActionNode(actionNodeId, {
                  config: { ...actionNode.config, removeOriginal: e.target.checked }
                })
              }}
              className="h-3 w-3"
            />
            <Label htmlFor="removeOriginal" className="text-[10px] cursor-pointer">Remove original attributes from properties</Label>
            <HelpTooltip content="If checked, properties matching the original attribute names will be removed after successful mapping (e.g. keeps 'id' but removes 'xml:id')." />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">Attribute Mappings</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const newMapping = { attributeName: '', propertyKey: '', transforms: [] }
                const updated = {
                  ...extractAndNormalizeAttributesConfig,
                  attributeMappings: [...extractAndNormalizeAttributesConfig.attributeMappings, newMapping]
                }
                onExtractAndNormalizeAttributesConfigChange(updated)
                onUpdateActionNode(actionNodeId, {
                  config: {
                    ...actionNode.config,
                    attributeMappings: [...(extractAndNormalizeAttributesConfig.attributeMappings || []), newMapping]
                  }
                })
              }}
              className="h-6 px-2 text-[10px]"
            >
              + Add Mapping
            </Button>
          </div>
          <div className="space-y-2">
            {extractAndNormalizeAttributesConfig.attributeMappings.map((mapping, index) => (
              <div key={index} className="p-2 border rounded space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Mapping {index + 1}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const updated = extractAndNormalizeAttributesConfig.attributeMappings.filter((_, i) => i !== index)
                      const newConfig = { ...extractAndNormalizeAttributesConfig, attributeMappings: updated }
                      onExtractAndNormalizeAttributesConfigChange(newConfig)
                      onUpdateActionNode(actionNodeId, {
                        config: { ...actionNode.config, attributeMappings: updated }
                      })
                    }}
                    className="h-6 w-6 p-0 text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-medium">Source Attribute</Label>
                    <Input
                      placeholder="e.g. name"
                      className="h-7 text-xs"
                      value={mapping.attributeName}
                      onChange={(e) => {
                        const updated = [...extractAndNormalizeAttributesConfig.attributeMappings]
                        updated[index] = { ...updated[index], attributeName: e.target.value }
                        const newConfig = { ...extractAndNormalizeAttributesConfig, attributeMappings: updated }
                        onExtractAndNormalizeAttributesConfigChange(newConfig)
                        onUpdateActionNode(actionNodeId, {
                          config: { ...actionNode.config, attributeMappings: updated }
                        })
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <Label className="text-[10px] font-medium">Target Property</Label>
                      <HelpTooltip content="Supports templates {{ $json.field }}" />
                    </div>
                    <Input
                      placeholder="e.g. personName"
                      className="h-7 text-xs"
                      value={mapping.propertyKey}
                      onChange={(e) => {
                        const updated = [...extractAndNormalizeAttributesConfig.attributeMappings]
                        updated[index] = { ...updated[index], propertyKey: e.target.value }
                        const newConfig = { ...extractAndNormalizeAttributesConfig, attributeMappings: updated }
                        onExtractAndNormalizeAttributesConfigChange(newConfig)
                        onUpdateActionNode(actionNodeId, {
                          config: { ...actionNode.config, attributeMappings: updated }
                        })
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <Label className="text-[10px] font-medium">Default Value (optional)</Label>
                    <HelpTooltip content="Value if attribute is missing. Supports templates." />
                  </div>
                  <Input
                    placeholder="e.g. Unknown"
                    className="h-7 text-xs"
                    value={mapping.defaultValue || ''}
                    onChange={(e) => {
                      const updated = [...extractAndNormalizeAttributesConfig.attributeMappings]
                      updated[index] = { ...updated[index], defaultValue: e.target.value }
                      const newConfig = { ...extractAndNormalizeAttributesConfig, attributeMappings: updated }
                      onExtractAndNormalizeAttributesConfigChange(newConfig)
                      onUpdateActionNode(actionNodeId, {
                        config: { ...actionNode.config, attributeMappings: updated }
                      })
                    }}
                  />
                </div>
                <div className="space-y-1 border-t pt-2 mt-2">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1">
                      <Settings2 className="h-3 w-3 text-muted-foreground" />
                      <Label className="text-[10px] font-medium">Transformations</Label>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newTransform: TextTransform = { type: 'lowercase' }
                        const updated = [...extractAndNormalizeAttributesConfig.attributeMappings]
                        const currentTransforms = updated[index].transforms || []
                        updated[index] = { ...updated[index], transforms: [...currentTransforms, newTransform] }
                        const newConfig = { ...extractAndNormalizeAttributesConfig, attributeMappings: updated }
                        onExtractAndNormalizeAttributesConfigChange(newConfig)
                        onUpdateActionNode(actionNodeId, {
                          config: { ...actionNode.config, attributeMappings: updated }
                        })
                      }}
                      className="h-5 px-1.5 text-[9px]"
                    >
                      <Plus className="h-2 w-2 mr-1" /> Add
                    </Button>
                  </div>
                  <TransformEditor
                    transforms={mapping.transforms || []}
                    onTransformsChange={(transforms) => {
                      const updated = [...extractAndNormalizeAttributesConfig.attributeMappings]
                      updated[index] = { ...updated[index], transforms }
                      const newConfig = { ...extractAndNormalizeAttributesConfig, attributeMappings: updated }
                      onExtractAndNormalizeAttributesConfigChange(newConfig)
                      onUpdateActionNode(actionNodeId, {
                        config: { ...actionNode.config, attributeMappings: updated }
                      })
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </CollapsibleSection>
  )
}

