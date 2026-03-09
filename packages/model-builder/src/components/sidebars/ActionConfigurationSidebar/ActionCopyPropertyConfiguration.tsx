'use client'

import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { CollapsibleSection } from '../../shared/CollapsibleSection'
import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'
import type { ActionConfigurationState } from '../../../stores/actionConfigurationStore'

interface ActionCopyPropertyConfigurationProps {
  actionNodeId: string
  actionNode: ActionCanvasNode | null
  copyPropertyConfig: ActionConfigurationState['copyPropertyConfig']
  onCopyPropertyConfigChange: (config: ActionConfigurationState['copyPropertyConfig']) => void
  onUpdateActionNode: (id: string, updates: Partial<ActionCanvasNode>) => void
}

export function ActionCopyPropertyConfiguration({
  actionNodeId,
  actionNode,
  copyPropertyConfig,
  onCopyPropertyConfigChange,
  onUpdateActionNode
}: ActionCopyPropertyConfigurationProps) {
  if (!actionNode) return null

  const handleConfigChange = (key: keyof ActionConfigurationState['copyPropertyConfig'], value: any) => {
    const updated = { ...copyPropertyConfig, [key]: value }
    onCopyPropertyConfigChange(updated)
    onUpdateActionNode(actionNodeId, { config: updated })
  }

  return (
    <CollapsibleSection title="Copy Property Configuration" defaultOpen={true}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium">Source Property</Label>
          <Input
            placeholder="e.g., name"
            className="h-8 text-xs"
            value={copyPropertyConfig.sourceProperty || ''}
            onChange={(e) => handleConfigChange('sourceProperty', e.target.value)}
          />
          <p className="text-[10px] text-muted-foreground italic">Supports {"{{ templates }}"}</p>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Target Property</Label>
          <Input
            placeholder="e.g., displayName"
            className="h-8 text-xs"
            value={copyPropertyConfig.targetProperty || ''}
            onChange={(e) => handleConfigChange('targetProperty', e.target.value)}
          />
          <p className="text-[10px] text-muted-foreground italic">Supports {"{{ templates }}"}</p>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Source Node ID (optional if parent)</Label>
          <Input
            placeholder="leave empty for parent node"
            className="h-8 text-xs"
            value={copyPropertyConfig.sourceNodeId || ''}
            onChange={(e) => handleConfigChange('sourceNodeId', e.target.value)}
          />
        </div>
      </div>
    </CollapsibleSection>
  )
}
