'use client'

import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { CollapsibleSection } from '../../shared/CollapsibleSection'
import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'
import type { ActionConfigurationState } from '../../../stores/actionConfigurationStore'

interface ActionExtractPropertyConfigurationProps {
  actionNodeId: string
  actionNode: ActionCanvasNode | null
  extractPropertyConfig: ActionConfigurationState['extractPropertyConfig']
  onExtractPropertyConfigChange: (config: ActionConfigurationState['extractPropertyConfig']) => void
  onUpdateActionNode: (id: string, updates: Partial<ActionCanvasNode>) => void
}

export function ActionExtractPropertyConfiguration({
  actionNodeId,
  actionNode,
  extractPropertyConfig,
  onExtractPropertyConfigChange,
  onUpdateActionNode
}: ActionExtractPropertyConfigurationProps) {
  if (!actionNode) return null

  return (
    <CollapsibleSection title="Extract Property Configuration" defaultOpen={true}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium">Source Attribute</Label>
          <Input
            placeholder="e.g., id, type, lemma"
            className="h-8 text-xs"
            value={extractPropertyConfig.sourceAttribute}
            onChange={(e) => {
              const value = e.target.value
              const updated = { ...extractPropertyConfig, sourceAttribute: value }
              onExtractPropertyConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, sourceAttribute: value }
              })
            }}
          />
          <p className="text-[10px] text-muted-foreground">XML attribute name to extract from.</p>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Target Property Key</Label>
          <Input
            placeholder="e.g., identifier, category"
            className="h-8 text-xs"
            value={extractPropertyConfig.targetPropertyKey}
            onChange={(e) => {
              const value = e.target.value
              const updated = { ...extractPropertyConfig, targetPropertyKey: value }
              onExtractPropertyConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, targetPropertyKey: value }
              })
            }}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Default Value (Optional)</Label>
          <Input
            placeholder="Value to use if attribute is missing"
            className="h-8 text-xs"
            value={extractPropertyConfig.defaultValue}
            onChange={(e) => {
              const value = e.target.value
              const updated = { ...extractPropertyConfig, defaultValue: value }
              onExtractPropertyConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, defaultValue: value }
              })
            }}
          />
        </div>
      </div>
    </CollapsibleSection>
  )
}

