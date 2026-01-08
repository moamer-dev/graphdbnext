'use client'

import { CollapsibleSection } from '../../shared/CollapsibleSection'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import type { ToolCanvasNode } from '../../../stores/toolCanvasStore'

interface ToolEnrichConfigurationProps {
  toolNodeId: string
  toolNode: ToolCanvasNode | null
  onUpdateToolNode: (id: string, updates: Partial<ToolCanvasNode>) => void
}

export function ToolEnrichConfiguration({
  toolNodeId,
  toolNode,
  onUpdateToolNode
}: ToolEnrichConfigurationProps) {
  if (!toolNode) return null

  return (
    <CollapsibleSection title="Enrich Configuration" defaultOpen={true}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium">Data Sources</Label>
          <Input
            placeholder="comma-separated source keys"
            className="h-8 text-xs"
            value={((toolNode.config.sources as string[]) || []).join(', ')}
            onChange={(e) => {
              const sources = e.target.value.split(',').map(s => s.trim()).filter(Boolean)
              onUpdateToolNode(toolNodeId, {
                config: { ...toolNode.config, sources }
              })
            }}
          />
          <div className="text-[10px] text-muted-foreground">
            Enter comma-separated keys from ctx.apiData to merge
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Target Property</Label>
          <Input
            placeholder="enriched"
            className="h-8 text-xs"
            value={(toolNode.config.targetProperty as string) || 'enriched'}
            onChange={(e) => {
              onUpdateToolNode(toolNodeId, {
                config: { ...toolNode.config, targetProperty: e.target.value }
              })
            }}
          />
        </div>
      </div>
    </CollapsibleSection>
  )
}

