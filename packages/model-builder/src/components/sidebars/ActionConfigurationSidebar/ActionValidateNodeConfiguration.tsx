'use client'

import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { CollapsibleSection } from '../../shared/CollapsibleSection'
import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'

interface ActionValidateNodeConfigurationProps {
  actionNodeId: string
  actionNode: ActionCanvasNode | null
  onUpdateActionNode: (id: string, updates: Partial<ActionCanvasNode>) => void
}

export function ActionValidateNodeConfiguration({
  actionNodeId,
  actionNode,
  onUpdateActionNode
}: ActionValidateNodeConfigurationProps) {
  if (!actionNode) return null

  return (
    <CollapsibleSection title="Validate Node Configuration" defaultOpen={true}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium">Required Properties (comma-separated)</Label>
          <Input
            placeholder="e.g., id, name, email"
            className="h-8 text-xs"
            value={((actionNode.config.requiredProperties as string[]) || []).join(', ')}
            onChange={(e) => {
              const props = e.target.value.split(',').map(p => p.trim()).filter(Boolean)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, requiredProperties: props }
              })
            }}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Schema (JSON, optional)</Label>
          <textarea
            className="w-full h-32 text-xs font-mono p-2 border rounded"
            placeholder='{"type": "object", "properties": {...}}'
            value={JSON.stringify((actionNode.config.schema as Record<string, unknown>) || {}, null, 2)}
            onChange={(e) => {
              try {
                const schema = JSON.parse(e.target.value)
                onUpdateActionNode(actionNodeId, {
                  config: { ...actionNode.config, schema }
                })
              } catch {
                // Invalid JSON, ignore
              }
            }}
          />
        </div>
      </div>
    </CollapsibleSection>
  )
}

