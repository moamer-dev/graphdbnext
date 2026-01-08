'use client'

import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { JsonFieldSelector } from '../../viewer/JsonFieldSelector'
import { CollapsibleSection } from '../../shared/CollapsibleSection'
import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'

interface ActionTagNodeConfigurationProps {
  actionNodeId: string
  actionNode: ActionCanvasNode | null
  apiResponse: unknown
  onUpdateActionNode: (id: string, updates: Partial<ActionCanvasNode>) => void
}

export function ActionTagNodeConfiguration({
  actionNodeId,
  actionNode,
  apiResponse,
  onUpdateActionNode
}: ActionTagNodeConfigurationProps) {
  if (!actionNode) return null

  return (
    <CollapsibleSection title="Tag Node Configuration" defaultOpen={true}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium">Tags (comma-separated)</Label>
          {apiResponse ? (
            <JsonFieldSelector
              data={apiResponse}
              value={((actionNode.config.tags as string[]) || []).join(', ')}
              onChange={(value) => {
                const tags = value.split(',').map(t => t.trim()).filter(Boolean)
                onUpdateActionNode(actionNodeId, {
                  config: { ...actionNode.config, tags }
                })
              }}
              placeholder="Enter tags or select from JSON"
            />
          ) : (
            <Input
              placeholder="e.g., important, verified, draft"
              className="h-8 text-xs"
              value={((actionNode.config.tags as string[]) || []).join(', ')}
              onChange={(e) => {
                const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                onUpdateActionNode(actionNodeId, {
                  config: { ...actionNode.config, tags }
                })
              }}
            />
          )}
          <div className="text-[10px] text-muted-foreground">
            Tags will be stored in _tags property as an array
          </div>
        </div>
      </div>
    </CollapsibleSection>
  )
}

