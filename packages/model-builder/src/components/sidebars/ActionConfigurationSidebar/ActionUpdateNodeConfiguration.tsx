'use client'

import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { CollapsibleSection } from '../../shared/CollapsibleSection'
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

  return (
    <CollapsibleSection title="Update Node Configuration" defaultOpen={true}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium">Properties (JSON)</Label>
          <textarea
            className="w-full h-32 text-xs font-mono p-2 border rounded"
            placeholder='{"key": "value"}'
            value={JSON.stringify((actionNode.config.properties as Record<string, unknown>) || {}, null, 2)}
            onChange={(e) => {
              try {
                const properties = JSON.parse(e.target.value)
                onUpdateActionNode(actionNodeId, {
                  config: { ...actionNode.config, properties }
                })
              } catch {
                // Invalid JSON, ignore
              }
            }}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Labels (comma-separated, optional)</Label>
          <Input
            placeholder="e.g., Person, Author"
            className="h-8 text-xs"
            value={((actionNode.config.labels as string[]) || []).join(', ')}
            onChange={(e) => {
              const labels = e.target.value.split(',').map(l => l.trim()).filter(Boolean)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, labels }
              })
            }}
          />
        </div>
      </div>
    </CollapsibleSection>
  )
}

