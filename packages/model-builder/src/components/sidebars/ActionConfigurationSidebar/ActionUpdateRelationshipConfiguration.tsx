'use client'

import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { CollapsibleSection } from '../../shared/CollapsibleSection'
import { NodeTargetingSection } from '../../shared/NodeTargetingSection'
import { KeyValueEditor } from '../../shared/KeyValueEditor'
import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'
import type { ActionConfigurationState } from '../../../stores/actionConfigurationStore'

interface ActionUpdateRelationshipConfigurationProps {
  actionNodeId: string
  actionNode: ActionCanvasNode | null
  updateRelationshipConfig: ActionConfigurationState['updateRelationshipConfig']
  onUpdateRelationshipConfigChange: (config: ActionConfigurationState['updateRelationshipConfig']) => void
  onUpdateActionNode: (id: string, updates: Partial<ActionCanvasNode>) => void
}

export function ActionUpdateRelationshipConfiguration({
  actionNodeId,
  actionNode,
  updateRelationshipConfig,
  onUpdateRelationshipConfigChange,
  onUpdateActionNode
}: ActionUpdateRelationshipConfigurationProps) {
  if (!actionNode) return null

  const handleConfigChange = (key: keyof ActionConfigurationState['updateRelationshipConfig'], value: any) => {
    const updated = { ...updateRelationshipConfig, [key]: value }
    onUpdateRelationshipConfigChange(updated)
    onUpdateActionNode(actionNodeId, { config: updated })
  }

  return (
    <CollapsibleSection title="Update Relationship Configuration" defaultOpen={true}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium">Relationship Label to Match</Label>
          <Input
            placeholder="e.g., relatedTo"
            className="h-8 text-xs"
            value={updateRelationshipConfig.relationshipType}
            onChange={(e) => handleConfigChange('relationshipType', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <NodeTargetingSection
            title="From Node"
            alias={updateRelationshipConfig.fromAlias}
            lookup={updateRelationshipConfig.fromLookup}
            onAliasChange={(val) => handleConfigChange('fromAlias', val)}
            onLookupChange={(val) => handleConfigChange('fromLookup', val)}
          />
          <NodeTargetingSection
            title="To Node"
            alias={updateRelationshipConfig.toAlias}
            lookup={updateRelationshipConfig.toLookup}
            onAliasChange={(val) => handleConfigChange('toAlias', val)}
            onLookupChange={(val) => handleConfigChange('toLookup', val)}
          />
        </div>

        <div className="space-y-2 pt-2 border-t">
          <Label className="text-xs font-medium">New Relationship Label (Optional)</Label>
          <Input
            placeholder="e.g., belongsTo"
            className="h-8 text-xs"
            value={updateRelationshipConfig.newRelationshipType || ''}
            onChange={(e) => handleConfigChange('newRelationshipType', e.target.value)}
          />
        </div>

        <KeyValueEditor
          title="Property Updates"
          description="Update properties on the matched relationship"
          entries={updateRelationshipConfig.properties || []}
          onEntriesChange={(val) => handleConfigChange('properties', val)}
        />
      </div>
    </CollapsibleSection>
  )
}
