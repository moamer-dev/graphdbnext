'use client'

import { CollapsibleSection } from '../../shared/CollapsibleSection'
import { Label } from '../../ui/label'
import type { ToolCanvasNode } from '../../../stores/toolCanvasStore'

interface ToolValidateSchemaConfigurationProps {
  toolNodeId: string
  toolNode: ToolCanvasNode | null
  onUpdateToolNode: (id: string, updates: Partial<ToolCanvasNode>) => void
}

export function ToolValidateSchemaConfiguration({
  toolNodeId,
  toolNode,
  onUpdateToolNode
}: ToolValidateSchemaConfigurationProps) {
  if (!toolNode) return null

  return (
    <CollapsibleSection title="Validate Schema Configuration" defaultOpen={true}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium">Schema (JSON)</Label>
          <textarea
            className="w-full h-32 text-xs font-mono p-2 border rounded"
            placeholder='{"required": ["id", "name"], "properties": {...}}'
            value={JSON.stringify(toolNode.config.schema || {}, null, 2)}
            onChange={(e) => {
              try {
                const schema = JSON.parse(e.target.value)
                onUpdateToolNode(toolNodeId, {
                  config: { ...toolNode.config, schema }
                })
              } catch {
                // Invalid JSON, ignore
              }
            }}
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={(toolNode.config.strict as boolean) || false}
            onChange={(e) => {
              onUpdateToolNode(toolNodeId, {
                config: { ...toolNode.config, strict: e.target.checked }
              })
            }}
            className="h-4 w-4"
          />
          <Label className="text-xs">Strict Mode (fail on validation error)</Label>
        </div>
      </div>
    </CollapsibleSection>
  )
}

