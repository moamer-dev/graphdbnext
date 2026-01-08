'use client'

import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { CollapsibleSection } from '../../shared/CollapsibleSection'
import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'
import type { ActionConfigurationState } from '../../../stores/actionConfigurationStore'

interface ActionCreateNodeWithFilteredChildrenConfigurationProps {
  actionNodeId: string
  actionNode: ActionCanvasNode | null
  createNodeWithFilteredChildrenConfig: ActionConfigurationState['createNodeWithFilteredChildrenConfig']
  onCreateNodeWithFilteredChildrenConfigChange: (config: ActionConfigurationState['createNodeWithFilteredChildrenConfig']) => void
  onUpdateActionNode: (id: string, updates: Partial<ActionCanvasNode>) => void
}

export function ActionCreateNodeWithFilteredChildrenConfiguration({
  actionNodeId,
  actionNode,
  createNodeWithFilteredChildrenConfig,
  onCreateNodeWithFilteredChildrenConfigChange,
  onUpdateActionNode
}: ActionCreateNodeWithFilteredChildrenConfigurationProps) {
  if (!actionNode) return null

  return (
    <CollapsibleSection title="Create Node With Filtered Children Configuration" defaultOpen={true}>
      <div className="space-y-4">
        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded">
          <p className="text-xs text-blue-800 dark:text-blue-200">
            <strong>Quick Action:</strong> Creates node and processes only specific child element types.
          </p>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Node Label</Label>
          <Input
            placeholder="e.g., Paragraph, P"
            className="h-8 text-xs"
            value={createNodeWithFilteredChildrenConfig.nodeLabel}
            onChange={(e) => {
              const value = e.target.value
              const updated = { ...createNodeWithFilteredChildrenConfig, nodeLabel: value }
              onCreateNodeWithFilteredChildrenConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, nodeLabel: value }
              })
            }}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Filter By Tag</Label>
          <Input
            placeholder="e.g., w, p (comma-separated)"
            className="h-8 text-xs"
            value={createNodeWithFilteredChildrenConfig.filterByTag.join(', ')}
            onChange={(e) => {
              const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean)
              const updated = { ...createNodeWithFilteredChildrenConfig, filterByTag: tags }
              onCreateNodeWithFilteredChildrenConfigChange(updated)
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
            value={createNodeWithFilteredChildrenConfig.excludeTags.join(', ')}
            onChange={(e) => {
              const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean)
              const updated = { ...createNodeWithFilteredChildrenConfig, excludeTags: tags }
              onCreateNodeWithFilteredChildrenConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, excludeTags: tags }
              })
            }}
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={createNodeWithFilteredChildrenConfig.recursive}
            onChange={(e) => {
              const updated = { ...createNodeWithFilteredChildrenConfig, recursive: e.target.checked }
              onCreateNodeWithFilteredChildrenConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, recursive: e.target.checked }
              })
            }}
            className="h-4 w-4"
          />
          <Label className="text-xs">Recursive (process nested children)</Label>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Parent Relationship Type</Label>
          <Input
            placeholder="e.g., contains"
            className="h-8 text-xs"
            value={createNodeWithFilteredChildrenConfig.parentRelationship}
            onChange={(e) => {
              const value = e.target.value
              const updated = { ...createNodeWithFilteredChildrenConfig, parentRelationship: value }
              onCreateNodeWithFilteredChildrenConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, parentRelationship: value }
              })
            }}
          />
        </div>
      </div>
    </CollapsibleSection>
  )
}

