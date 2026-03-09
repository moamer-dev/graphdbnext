'use client'

import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { CollapsibleSection } from '../../shared/CollapsibleSection'
import { NodeTargetingSection } from '../../shared/NodeTargetingSection'
import { KeyValueEditor } from '../../shared/KeyValueEditor'
import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'

interface ActionUpdateNodeConfigurationProps {
  actionNodeId: string
  actionNode: ActionCanvasNode | null
  onUpdateActionNode: (id: string, updates: Partial<ActionCanvasNode>) => void
}

export function ActionUpdateNodeConfiguration({
  actionNodeId,
  actionNode,
  onUpdateActionNode
}: ActionUpdateNodeConfigurationProps) {
  if (!actionNode) return null

  const config = actionNode.config as any

  return (
    <CollapsibleSection title="Update Node Configuration" defaultOpen={true}>
      <div className="space-y-4">
        <NodeTargetingSection
          title="Target Node"
          alias={config.targetAlias || 'current'}
          lookup={config.targetLookup || {}}
          onAliasChange={(val) => onUpdateActionNode(actionNodeId, { 
            config: { ...config, targetAlias: val } 
          })}
          onLookupChange={(lookup) => onUpdateActionNode(actionNodeId, {
            config: { ...config, targetLookup: lookup }
          })}
        />

        <KeyValueEditor
          title="Property Updates"
          description="Update or add properties to the target node"
          entries={config.properties || []}
          onEntriesChange={(properties) => onUpdateActionNode(actionNodeId, {
            config: { ...config, properties }
          })}
        />

        <div className="space-y-2 pt-2 border-t">
          <Label className="text-xs font-medium">Add/Replace Labels (comma-separated)</Label>
          <Input
            placeholder="e.g., Person, Employee"
            className="h-8 text-xs"
            value={(config.labels || []).join(', ')}
            onChange={(e) => {
              const labels = e.target.value.split(',').map(l => l.trim()).filter(Boolean)
              onUpdateActionNode(actionNodeId, {
                config: { ...config, labels }
              })
            }}
          />
        </div>
      </div>
    </CollapsibleSection>
  )
}
