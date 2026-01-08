'use client'

import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { CollapsibleSection } from '../../shared/CollapsibleSection'
import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'
import type { ActionConfigurationState } from '../../../stores/actionConfigurationStore'

interface ActionNormalizeAndDeduplicateConfigurationProps {
  actionNodeId: string
  actionNode: ActionCanvasNode | null
  normalizeAndDeduplicateConfig: ActionConfigurationState['normalizeAndDeduplicateConfig']
  onNormalizeAndDeduplicateConfigChange: (config: ActionConfigurationState['normalizeAndDeduplicateConfig']) => void
  onUpdateActionNode: (id: string, updates: Partial<ActionCanvasNode>) => void
}

export function ActionNormalizeAndDeduplicateConfiguration({
  actionNodeId,
  actionNode,
  normalizeAndDeduplicateConfig,
  onNormalizeAndDeduplicateConfigChange,
  onUpdateActionNode
}: ActionNormalizeAndDeduplicateConfigurationProps) {
  if (!actionNode) return null

  return (
    <CollapsibleSection title="Normalize And Deduplicate Configuration" defaultOpen={true}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium">Source Property</Label>
          <Input
            placeholder="e.g., text"
            className="h-8 text-xs"
            value={normalizeAndDeduplicateConfig.sourceProperty}
            onChange={(e) => {
              const value = e.target.value
              const updated = { ...normalizeAndDeduplicateConfig, sourceProperty: value }
              onNormalizeAndDeduplicateConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, sourceProperty: value }
              })
            }}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Target Property</Label>
          <Input
            placeholder="e.g., normalized"
            className="h-8 text-xs"
            value={normalizeAndDeduplicateConfig.targetProperty}
            onChange={(e) => {
              const value = e.target.value
              const updated = { ...normalizeAndDeduplicateConfig, targetProperty: value }
              onNormalizeAndDeduplicateConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, targetProperty: value }
              })
            }}
          />
        </div>
        <div className="text-[10px] text-muted-foreground">Transforms will be applied to normalize the value</div>
      </div>
    </CollapsibleSection>
  )
}

