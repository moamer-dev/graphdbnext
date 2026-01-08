'use client'

import { CollapsibleSection } from '../../shared/CollapsibleSection'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import type { ToolCanvasNode } from '../../../stores/toolCanvasStore'

interface ToolDeduplicateConfigurationProps {
  toolNodeId: string
  toolNode: ToolCanvasNode | null
  onUpdateToolNode: (id: string, updates: Partial<ToolCanvasNode>) => void
}

export function ToolDeduplicateConfiguration({
  toolNodeId,
  toolNode,
  onUpdateToolNode
}: ToolDeduplicateConfigurationProps) {
  if (!toolNode) return null

  return (
    <CollapsibleSection title="Deduplicate Configuration" defaultOpen={true}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium">Property to Check</Label>
          <Input
            placeholder="id"
            className="h-8 text-xs"
            value={(toolNode.config.property as string) || 'id'}
            onChange={(e) => {
              onUpdateToolNode(toolNodeId, {
                config: { ...toolNode.config, property: e.target.value }
              })
            }}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Similarity Threshold (0-1)</Label>
          <Input
            type="number"
            min="0"
            max="1"
            step="0.1"
            placeholder="0.8"
            className="h-8 text-xs"
            value={(toolNode.config.threshold as number) || 0.8}
            onChange={(e) => {
              onUpdateToolNode(toolNodeId, {
                config: { ...toolNode.config, threshold: parseFloat(e.target.value) || 0.8 }
              })
            }}
          />
        </div>
      </div>
    </CollapsibleSection>
  )
}

