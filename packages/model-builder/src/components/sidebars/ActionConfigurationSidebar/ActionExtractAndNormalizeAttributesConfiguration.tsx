'use client'

import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { X } from 'lucide-react'
import { CollapsibleSection } from '../../shared/CollapsibleSection'
import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'
import type { ActionConfigurationState } from '../../../stores/actionConfigurationStore'

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
    <CollapsibleSection title="Extract And Normalize Attributes Configuration" defaultOpen={true}>
      <div className="space-y-4">
        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded">
          <p className="text-xs text-blue-800 dark:text-blue-200">
            <strong>Quick Action:</strong> Extracts multiple attributes, applies transforms to each, and sets them as properties.
          </p>
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
                <Input
                  placeholder="XML attribute"
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
                <Input
                  placeholder="Property key"
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
                <div className="text-[10px] text-muted-foreground">Transforms will be applied to the attribute value</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </CollapsibleSection>
  )
}

