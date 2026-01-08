'use client'

import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { CollapsibleSection } from '../../shared/CollapsibleSection'
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

  return (
    <CollapsibleSection title="Clone Node Configuration" defaultOpen={true}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium">Modifications (JSON)</Label>
          <textarea
            className="w-full h-32 text-xs font-mono p-2 border rounded"
            placeholder='{"key": "newValue"}'
            value={JSON.stringify((actionNode.config.modifications as Record<string, unknown>) || {}, null, 2)}
            onChange={(e) => {
              try {
                const modifications = JSON.parse(e.target.value)
                onUpdateActionNode(actionNodeId, {
                  config: { ...actionNode.config, modifications }
                })
              } catch {
                // Invalid JSON, ignore
              }
            }}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">New Labels (comma-separated, optional)</Label>
          <Input
            placeholder="e.g., Cloned, Copy"
            className="h-8 text-xs"
            value={((actionNode.config.newLabels as string[]) || []).join(', ')}
            onChange={(e) => {
              const labels = e.target.value.split(',').map(l => l.trim()).filter(Boolean)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, newLabels: labels }
              })
            }}
          />
        </div>
      </div>
    </CollapsibleSection>
  )
}

