'use client'

import { Label } from '../../ui/label'
import { CollapsibleSection } from '../../shared/CollapsibleSection'
import { NodeTargetingSection } from '../../shared/NodeTargetingSection'
import { KeyValueEditor } from '../../shared/KeyValueEditor'
import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'

interface ActionDeleteNodeConfigurationProps {
  actionNodeId: string
  actionNode: ActionCanvasNode | null
  onUpdateActionNode: (id: string, updates: Partial<ActionCanvasNode>) => void
}

export function ActionDeleteNodeConfiguration({
  actionNodeId,
  actionNode,
  onUpdateActionNode
}: ActionDeleteNodeConfigurationProps) {
  if (!actionNode) return null

  const config = actionNode.config as any

  return (
    <CollapsibleSection title="Delete Node Configuration" defaultOpen={true}>
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
          title="Property Match"
          description="Only delete nodes if all these properties match"
          entries={config.propertyMatch || []}
          onEntriesChange={(propertyMatch) => onUpdateActionNode(actionNodeId, {
            config: { ...config, propertyMatch }
          })}
        />
        
        <div className="text-[10px] text-muted-foreground italic px-1">
          If no properties are specified, the target node will be deleted regardless of its state.
        </div>
      </div>
    </CollapsibleSection>
  )
}
