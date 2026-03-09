'use client'

import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { CollapsibleSection } from '../../shared/CollapsibleSection'
import { NodeTargetingSection } from '../../shared/NodeTargetingSection'
import { KeyValueEditor } from '../../shared/KeyValueEditor'
import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'
import type { ActionConfigurationState } from '../../../stores/actionConfigurationStore'

interface ActionDeleteRelationshipConfigurationProps {
  actionNodeId: string
  actionNode: ActionCanvasNode | null
  deleteRelationshipConfig: ActionConfigurationState['deleteRelationshipConfig']
  onDeleteRelationshipConfigChange: (config: ActionConfigurationState['deleteRelationshipConfig']) => void
  onUpdateActionNode: (id: string, updates: Partial<ActionCanvasNode>) => void
}

export function ActionDeleteRelationshipConfiguration({
  actionNodeId,
  actionNode,
  deleteRelationshipConfig,
  onDeleteRelationshipConfigChange,
  onUpdateActionNode
}: ActionDeleteRelationshipConfigurationProps) {
  if (!actionNode) return null

  const handleConfigChange = (key: keyof ActionConfigurationState['deleteRelationshipConfig'], value: any) => {
    const updated = { ...deleteRelationshipConfig, [key]: value }
    onDeleteRelationshipConfigChange(updated)
    onUpdateActionNode(actionNodeId, { config: updated })
  }

  return (
    <CollapsibleSection title="Delete Relationship Configuration" defaultOpen={true}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium">Relationship Label to Delete</Label>
          <Input
            placeholder="e.g., relatedTo"
            className="h-8 text-xs"
            value={deleteRelationshipConfig.relationshipType}
            onChange={(e) => handleConfigChange('relationshipType', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <NodeTargetingSection
            title="From Node"
            alias={deleteRelationshipConfig.fromAlias}
            lookup={deleteRelationshipConfig.fromLookup}
            onAliasChange={(val) => handleConfigChange('fromAlias', val)}
            onLookupChange={(val) => handleConfigChange('fromLookup', val)}
          />
          <NodeTargetingSection
            title="To Node"
            alias={deleteRelationshipConfig.toAlias}
            lookup={deleteRelationshipConfig.toLookup}
            onAliasChange={(val) => handleConfigChange('toAlias', val)}
            onLookupChange={(val) => handleConfigChange('toLookup', val)}
          />
        </div>

        <KeyValueEditor
          title="Property Matches"
          description="Only delete relationships matching these properties"
          entries={deleteRelationshipConfig.propertyMatch || []}
          onEntriesChange={(val) => handleConfigChange('propertyMatch', val)}
        />
        <div className="text-[10px] text-muted-foreground italic px-1">
          Only relationships matching these properties will be deleted.
        </div>
      </div>
    </CollapsibleSection>
  )
}
