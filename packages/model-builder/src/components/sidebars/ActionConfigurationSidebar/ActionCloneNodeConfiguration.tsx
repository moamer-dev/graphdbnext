'use client'

import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'
import { CollapsibleSection } from '../../shared/CollapsibleSection'
import { NodeTargetingSection } from '../../shared/NodeTargetingSection'
import { KeyValueEditor } from '../../shared/KeyValueEditor'
import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'

interface ActionCloneNodeConfigurationProps {
  actionNodeId: string
  actionNode: ActionCanvasNode | null
  onUpdateActionNode: (id: string, updates: Partial<ActionCanvasNode>) => void
}

export function ActionCloneNodeConfiguration({
  actionNodeId,
  actionNode,
  onUpdateActionNode
}: ActionCloneNodeConfigurationProps) {
  if (!actionNode) return null

  const config = actionNode.config as any

  return (
    <CollapsibleSection title="Clone Node Configuration" defaultOpen={true}>
      <div className="space-y-4">
        <NodeTargetingSection
          title="Node to Clone"
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
          title="Property Modifications"
          description="Override properties on the cloned node"
          entries={config.modifications || []}
          onEntriesChange={(modifications) => onUpdateActionNode(actionNodeId, {
            config: { ...config, modifications }
          })}
        />

        <div className="space-y-2 pt-2 border-t">
          <Label className="text-xs font-medium">New Labels (optional)</Label>
          <Input
            placeholder="e.g., Cloned, Copy"
            className="h-8 text-xs"
            value={(config.newLabels || []).join(', ')}
            onChange={(e) => {
              const labels = e.target.value.split(',').map(l => l.trim()).filter(Boolean)
              onUpdateActionNode(actionNodeId, {
                config: { ...config, newLabels: labels }
              })
            }}
          />
          <div className="text-[10px] text-muted-foreground">
            If left empty, the cloned node will keep original labels
          </div>
        </div>

        <div className="space-y-2 pt-4 border-t">
          <Label className="text-xs font-medium">Create Relationship for Cloned Node</Label>
          <div className="text-[10px] text-muted-foreground mb-2">
            Optionally relate the newly cloned node to another node in the graph.
          </div>
          
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Relationship Type</Label>
            <Input
              placeholder="e.g., relatedTo (leave empty for standalone clone)"
              className="h-7 text-xs"
              value={config.relationshipType || ''}
              onChange={(e) => onUpdateActionNode(actionNodeId, {
                config: { ...config, relationshipType: e.target.value }
              })}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground">Direction</Label>
              <Select
                value={config.relationshipDirection || 'outgoing'}
                onValueChange={(val) => onUpdateActionNode(actionNodeId, {
                  config: { ...config, relationshipDirection: val }
                })}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="outgoing">Outgoing (Clone → Target)</SelectItem>
                  <SelectItem value="incoming">Incoming (Target → Clone)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <NodeTargetingSection
              title="Target Node"
              alias={config.relationshipTargetAlias || 'original'}
              lookup={config.relationshipTargetLookup || {}}
              options={[
                { value: 'original', label: 'Original Node' },
                { value: 'current', label: 'Current Context Node' },
                { value: 'parent', label: 'Parent Context Node' },
                { value: 'lookup', label: 'Lookup Node' }
              ]}
              onAliasChange={(val) => onUpdateActionNode(actionNodeId, { 
                config: { ...config, relationshipTargetAlias: val } 
              })}
              onLookupChange={(lookup) => onUpdateActionNode(actionNodeId, {
                config: { ...config, relationshipTargetLookup: lookup }
              })}
            />
          </div>
        </div>

      </div>
    </CollapsibleSection>
  )
}
