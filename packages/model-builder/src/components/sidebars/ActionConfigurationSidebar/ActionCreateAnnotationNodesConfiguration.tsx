'use client'

import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { CollapsibleSection } from '../../shared/CollapsibleSection'
import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'
import type { ActionConfigurationState } from '../../../stores/actionConfigurationStore'

interface ActionCreateAnnotationNodesConfigurationProps {
  actionNodeId: string
  actionNode: ActionCanvasNode | null
  createAnnotationNodesConfig: ActionConfigurationState['createAnnotationNodesConfig']
  onCreateAnnotationNodesConfigChange: (config: ActionConfigurationState['createAnnotationNodesConfig']) => void
  onUpdateActionNode: (id: string, updates: Partial<ActionCanvasNode>) => void
}

export function ActionCreateAnnotationNodesConfiguration({
  actionNodeId,
  actionNode,
  createAnnotationNodesConfig,
  onCreateAnnotationNodesConfigChange,
  onUpdateActionNode
}: ActionCreateAnnotationNodesConfigurationProps) {
  if (!actionNode) return null

  return (
    <CollapsibleSection title="Create Annotation Nodes Configuration" defaultOpen={true}>
      <div className="space-y-4">
        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded">
          <p className="text-xs text-blue-800 dark:text-blue-200">
            <strong>Quick Action:</strong> Creates annotation nodes from attributes (common in TEI/XML documents).
          </p>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Annotation Node Label</Label>
          <Input
            placeholder="e.g., Annotation"
            className="h-8 text-xs"
            value={createAnnotationNodesConfig.annotationNodeLabel}
            onChange={(e) => {
              const value = e.target.value
              const updated = { ...createAnnotationNodesConfig, annotationNodeLabel: value }
              onCreateAnnotationNodesConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, annotationNodeLabel: value }
              })
            }}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Annotation Types</Label>
          <Input
            placeholder="e.g., ana, lemma (comma-separated)"
            className="h-8 text-xs"
            value={createAnnotationNodesConfig.annotationTypes.join(', ')}
            onChange={(e) => {
              const types = e.target.value.split(',').map(t => t.trim()).filter(Boolean)
              const updated = { ...createAnnotationNodesConfig, annotationTypes: types }
              onCreateAnnotationNodesConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, annotationTypes: types }
              })
            }}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Target Attributes</Label>
          <Input
            placeholder="e.g., ana, lemma (comma-separated)"
            className="h-8 text-xs"
            value={createAnnotationNodesConfig.targetAttributes.join(', ')}
            onChange={(e) => {
              const attrs = e.target.value.split(',').map(a => a.trim()).filter(Boolean)
              const updated = { ...createAnnotationNodesConfig, targetAttributes: attrs }
              onCreateAnnotationNodesConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, targetAttributes: attrs }
              })
            }}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Relationship Type</Label>
          <Input
            placeholder="e.g., annotatedBy"
            className="h-8 text-xs"
            value={createAnnotationNodesConfig.relationshipType}
            onChange={(e) => {
              const value = e.target.value
              const updated = { ...createAnnotationNodesConfig, relationshipType: value }
              onCreateAnnotationNodesConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, relationshipType: value }
              })
            }}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Parent Relationship Type</Label>
          <Input
            placeholder="e.g., contains"
            className="h-8 text-xs"
            value={createAnnotationNodesConfig.parentRelationship}
            onChange={(e) => {
              const value = e.target.value
              const updated = { ...createAnnotationNodesConfig, parentRelationship: value }
              onCreateAnnotationNodesConfigChange(updated)
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

