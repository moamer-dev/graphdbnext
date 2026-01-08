'use client'

import { Label } from '../../ui/label'
import { CollapsibleSection } from '../../shared/CollapsibleSection'
import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'

interface ActionAddMetadataConfigurationProps {
  actionNodeId: string
  actionNode: ActionCanvasNode | null
  onUpdateActionNode: (id: string, updates: Partial<ActionCanvasNode>) => void
}

export function ActionAddMetadataConfiguration({
  actionNodeId,
  actionNode,
  onUpdateActionNode
}: ActionAddMetadataConfigurationProps) {
  if (!actionNode) return null

  return (
    <CollapsibleSection title="Add Metadata Configuration" defaultOpen={true}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium">Metadata (JSON)</Label>
          <textarea
            className="w-full h-32 text-xs font-mono p-2 border rounded"
            placeholder='{"source": "api", "timestamp": "2024-01-01"}'
            value={JSON.stringify((actionNode.config.metadata as Record<string, unknown>) || {}, null, 2)}
            onChange={(e) => {
              try {
                const metadata = JSON.parse(e.target.value)
                onUpdateActionNode(actionNodeId, {
                  config: { ...actionNode.config, metadata }
                })
              } catch {
                // Invalid JSON, ignore
              }
            }}
          />
          <div className="text-[10px] text-muted-foreground">
            Metadata will be stored with _meta_ prefix (e.g., _meta_source)
          </div>
        </div>
      </div>
    </CollapsibleSection>
  )
}

