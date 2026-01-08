'use client'

import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { CollapsibleSection } from '../../shared/CollapsibleSection'
import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'
import type { ActionConfigurationState } from '../../../stores/actionConfigurationStore'

interface ActionCreateHierarchicalNodesConfigurationProps {
  actionNodeId: string
  actionNode: ActionCanvasNode | null
  createHierarchicalNodesConfig: ActionConfigurationState['createHierarchicalNodesConfig']
  onCreateHierarchicalNodesConfigChange: (config: ActionConfigurationState['createHierarchicalNodesConfig']) => void
  onUpdateActionNode: (id: string, updates: Partial<ActionCanvasNode>) => void
}

export function ActionCreateHierarchicalNodesConfiguration({
  actionNodeId,
  actionNode,
  createHierarchicalNodesConfig,
  onCreateHierarchicalNodesConfigChange,
  onUpdateActionNode
}: ActionCreateHierarchicalNodesConfigurationProps) {
  if (!actionNode) return null

  return (
    <CollapsibleSection title="Create Hierarchical Nodes Configuration" defaultOpen={true}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium">Parent Node Label</Label>
          <Input
            placeholder="e.g., Section"
            className="h-8 text-xs"
            value={createHierarchicalNodesConfig.parentNodeLabel}
            onChange={(e) => {
              const value = e.target.value
              const updated = { ...createHierarchicalNodesConfig, parentNodeLabel: value }
              onCreateHierarchicalNodesConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, parentNodeLabel: value }
              })
            }}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Child Node Label</Label>
          <Input
            placeholder="e.g., Paragraph"
            className="h-8 text-xs"
            value={createHierarchicalNodesConfig.childNodeLabel}
            onChange={(e) => {
              const value = e.target.value
              const updated = { ...createHierarchicalNodesConfig, childNodeLabel: value }
              onCreateHierarchicalNodesConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, childNodeLabel: value }
              })
            }}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Parent Relationship Type</Label>
          <Input
            placeholder="e.g., contains"
            className="h-8 text-xs"
            value={createHierarchicalNodesConfig.parentRelationship}
            onChange={(e) => {
              const value = e.target.value
              const updated = { ...createHierarchicalNodesConfig, parentRelationship: value }
              onCreateHierarchicalNodesConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, parentRelationship: value }
              })
            }}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Child Relationship Type</Label>
          <Input
            placeholder="e.g., contains"
            className="h-8 text-xs"
            value={createHierarchicalNodesConfig.childRelationship}
            onChange={(e) => {
              const value = e.target.value
              const updated = { ...createHierarchicalNodesConfig, childRelationship: value }
              onCreateHierarchicalNodesConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, childRelationship: value }
              })
            }}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Filter By Tag</Label>
          <Input
            placeholder="e.g., p, div (comma-separated)"
            className="h-8 text-xs"
            value={createHierarchicalNodesConfig.filterByTag.join(', ')}
            onChange={(e) => {
              const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean)
              const updated = { ...createHierarchicalNodesConfig, filterByTag: tags }
              onCreateHierarchicalNodesConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, filterByTag: tags }
              })
            }}
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={createHierarchicalNodesConfig.recursive}
            onChange={(e) => {
              const updated = { ...createHierarchicalNodesConfig, recursive: e.target.checked }
              onCreateHierarchicalNodesConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, recursive: e.target.checked }
              })
            }}
            className="h-4 w-4"
          />
          <Label className="text-xs">Recursive (create nested hierarchy)</Label>
        </div>
      </div>
    </CollapsibleSection>
  )
}

