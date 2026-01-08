'use client'

import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { CollapsibleSection } from '../../shared/CollapsibleSection'
import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'
import type { ActionConfigurationState } from '../../../stores/actionConfigurationStore'

interface ActionMergeChildrenTextConfigurationProps {
  actionNodeId: string
  actionNode: ActionCanvasNode | null
  mergeChildrenTextConfig: ActionConfigurationState['mergeChildrenTextConfig']
  onMergeChildrenTextConfigChange: (config: ActionConfigurationState['mergeChildrenTextConfig']) => void
  onUpdateActionNode: (id: string, updates: Partial<ActionCanvasNode>) => void
}

export function ActionMergeChildrenTextConfiguration({
  actionNodeId,
  actionNode,
  mergeChildrenTextConfig,
  onMergeChildrenTextConfigChange,
  onUpdateActionNode
}: ActionMergeChildrenTextConfigurationProps) {
  if (!actionNode) return null

  return (
    <CollapsibleSection title="Merge Children Text Configuration" defaultOpen={true}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium">Property Key</Label>
          <Input
            placeholder="e.g., text"
            className="h-8 text-xs"
            value={mergeChildrenTextConfig.propertyKey}
            onChange={(e) => {
              const value = e.target.value
              const updated = { ...mergeChildrenTextConfig, propertyKey: value }
              onMergeChildrenTextConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, propertyKey: value }
              })
            }}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Separator</Label>
          <Input
            placeholder="e.g., space, comma"
            className="h-8 text-xs"
            value={mergeChildrenTextConfig.separator}
            onChange={(e) => {
              const value = e.target.value
              const updated = { ...mergeChildrenTextConfig, separator: value }
              onMergeChildrenTextConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, separator: value }
              })
            }}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Filter By Tag</Label>
          <Input
            placeholder="e.g., w, p (comma-separated)"
            className="h-8 text-xs"
            value={mergeChildrenTextConfig.filterByTag.join(', ')}
            onChange={(e) => {
              const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean)
              const updated = { ...mergeChildrenTextConfig, filterByTag: tags }
              onMergeChildrenTextConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, filterByTag: tags }
              })
            }}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Exclude Tags</Label>
          <Input
            placeholder="e.g., note, comment (comma-separated)"
            className="h-8 text-xs"
            value={mergeChildrenTextConfig.excludeTags.join(', ')}
            onChange={(e) => {
              const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean)
              const updated = { ...mergeChildrenTextConfig, excludeTags: tags }
              onMergeChildrenTextConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, excludeTags: tags }
              })
            }}
          />
        </div>
      </div>
    </CollapsibleSection>
  )
}

