'use client'

import { Label } from '../../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'
import { HelpTooltip } from '../../shared/HelpTooltip'
import { CollapsibleSection } from '../../shared/CollapsibleSection'
import { NodeTargetingSection } from '../../shared/NodeTargetingSection'
import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'

interface ActionMergeNodesConfigurationProps {
  actionNodeId: string
  actionNode: ActionCanvasNode | null
  onUpdateActionNode: (id: string, updates: Partial<ActionCanvasNode>) => void
}

export function ActionMergeNodesConfiguration({
  actionNodeId,
  actionNode,
  onUpdateActionNode
}: ActionMergeNodesConfigurationProps) {
  if (!actionNode) return null

  const config = actionNode.config as any

  return (
    <CollapsibleSection title="Merge Nodes Configuration" defaultOpen={true}>
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

        <NodeTargetingSection
          title="Source Node(s) to Merge From"
          alias={config.sourceAlias || 'parent'}
          lookup={config.sourceLookup || {}}
          onAliasChange={(val) => onUpdateActionNode(actionNodeId, { 
            config: { ...config, sourceAlias: val } 
          })}
          onLookupChange={(lookup) => onUpdateActionNode(actionNodeId, {
            config: { ...config, sourceLookup: lookup }
          })}
        />

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-xs font-medium">Merge Strategy</Label>
            <HelpTooltip content="How to merge properties when conflicts occur" />
          </div>
          <Select
            value={(config.mergeStrategy as string) || 'union'}
            onValueChange={(value) => {
              onUpdateActionNode(actionNodeId, {
                config: { ...config, mergeStrategy: value }
              })
            }}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="union">Union (merge all)</SelectItem>
              <SelectItem value="preferSource">Prefer Source</SelectItem>
              <SelectItem value="preferTarget">Prefer Target</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </CollapsibleSection>
  )
}
