'use client'

import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { CollapsibleSection } from '../../shared/CollapsibleSection'
import { NodeTargetingSection } from '../../shared/NodeTargetingSection'
import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'
import type { ActionConfigurationState } from '../../../stores/actionConfigurationStore'

interface ActionReverseRelationshipConfigurationProps {
  actionNodeId: string
  actionNode: ActionCanvasNode | null
  reverseRelationshipConfig: ActionConfigurationState['reverseRelationshipConfig']
  onReverseRelationshipConfigChange: (config: ActionConfigurationState['reverseRelationshipConfig']) => void
  onUpdateActionNode: (id: string, updates: Partial<ActionCanvasNode>) => void
}

export function ActionReverseRelationshipConfiguration({
  actionNodeId,
  actionNode,
  reverseRelationshipConfig,
  onReverseRelationshipConfigChange,
  onUpdateActionNode
}: ActionReverseRelationshipConfigurationProps) {
  if (!actionNode) return null

  const handleConfigChange = (key: keyof ActionConfigurationState['reverseRelationshipConfig'], value: any) => {
    const updated = { ...reverseRelationshipConfig, [key]: value }
    onReverseRelationshipConfigChange(updated)
    onUpdateActionNode(actionNodeId, { config: updated })
  }

  return (
    <CollapsibleSection title="Reverse Relationship Configuration" defaultOpen={true}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium">Relationship Label to Reverse</Label>
          <Input
            placeholder="e.g., relatedTo"
            className="h-8 text-xs"
            value={reverseRelationshipConfig.relationshipType}
            onChange={(e) => handleConfigChange('relationshipType', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <NodeTargetingSection
            title="From Node"
            alias={reverseRelationshipConfig.fromAlias}
            lookup={reverseRelationshipConfig.fromLookup}
            onAliasChange={(val) => handleConfigChange('fromAlias', val)}
            onLookupChange={(val) => handleConfigChange('fromLookup', val)}
          />
          <NodeTargetingSection
            title="To Node"
            alias={reverseRelationshipConfig.toAlias}
            lookup={reverseRelationshipConfig.toLookup}
            onAliasChange={(val) => handleConfigChange('toAlias', val)}
            onLookupChange={(val) => handleConfigChange('toLookup', val)}
          />
        </div>

        <div className="text-[10px] text-muted-foreground italic text-center p-2 border-t">
          This will swap the start and end nodes of matching relationships.
        </div>
      </div>
    </CollapsibleSection>
  )
}
