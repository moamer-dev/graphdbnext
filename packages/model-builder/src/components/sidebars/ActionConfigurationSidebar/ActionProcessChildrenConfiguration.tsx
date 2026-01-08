'use client'

import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { CollapsibleSection } from '../../shared/CollapsibleSection'
import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'
import type { ActionConfigurationState } from '../../../stores/actionConfigurationStore'

interface ActionProcessChildrenConfigurationProps {
  actionNodeId: string
  actionNode: ActionCanvasNode | null
  processChildrenConfig: ActionConfigurationState['processChildrenConfig']
  onProcessChildrenConfigChange: (config: ActionConfigurationState['processChildrenConfig']) => void
  onUpdateActionNode: (id: string, updates: Partial<ActionCanvasNode>) => void
}

export function ActionProcessChildrenConfiguration({
  actionNodeId,
  actionNode,
  processChildrenConfig,
  onProcessChildrenConfigChange,
  onUpdateActionNode
}: ActionProcessChildrenConfigurationProps) {
  if (!actionNode) return null

  return (
    <CollapsibleSection title="Process Children Configuration" defaultOpen={true}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium">Filter By Tag (Optional)</Label>
          <Input
            placeholder="e.g., word, seg (comma-separated)"
            className="h-8 text-xs"
            value={processChildrenConfig.filterByTag.join(', ')}
            onChange={(e) => {
              const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean)
              const updated = { ...processChildrenConfig, filterByTag: tags }
              onProcessChildrenConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, filterByTag: tags }
              })
            }}
          />
          <p className="text-[10px] text-muted-foreground">Only process children with these tags. Leave empty to process all.</p>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Exclude Tags (Optional)</Label>
          <Input
            placeholder="e.g., note, comment (comma-separated)"
            className="h-8 text-xs"
            value={processChildrenConfig.excludeTags.join(', ')}
            onChange={(e) => {
              const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean)
              const updated = { ...processChildrenConfig, excludeTags: tags }
              onProcessChildrenConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, excludeTags: tags }
              })
            }}
          />
          <p className="text-[10px] text-muted-foreground">Skip processing children with these tags.</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={processChildrenConfig.recursive}
            onChange={(e) => {
              const updated = { ...processChildrenConfig, recursive: e.target.checked }
              onProcessChildrenConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, recursive: e.target.checked }
              })
            }}
            className="h-4 w-4"
          />
          <Label className="text-xs">Recursive (process nested children)</Label>
        </div>
      </div>
    </CollapsibleSection>
  )
}

