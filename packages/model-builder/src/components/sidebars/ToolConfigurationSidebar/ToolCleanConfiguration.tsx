'use client'

import { CollapsibleSection } from '../../shared/CollapsibleSection'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import type { ToolCanvasNode } from '../../../stores/toolCanvasStore'

interface ToolCleanConfigurationProps {
  toolNodeId: string
  toolNode: ToolCanvasNode | null
  onUpdateToolNode: (id: string, updates: Partial<ToolCanvasNode>) => void
}

export function ToolCleanConfiguration({
  toolNodeId,
  toolNode,
  onUpdateToolNode
}: ToolCleanConfigurationProps) {
  if (!toolNode) return null

  const operations = ['trim', 'removeSpecialChars', 'normalizeWhitespace', 'lowercase', 'uppercase']
  const currentOps = (toolNode.config.operations as string[]) || []

  return (
    <CollapsibleSection title="Clean Configuration" defaultOpen={true}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium">Operations</Label>
          <div className="space-y-2">
            {operations.map(op => (
              <div key={op} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={currentOps.includes(op)}
                  onChange={(e) => {
                    const updated = e.target.checked
                      ? [...currentOps, op]
                      : currentOps.filter(o => o !== op)
                    onUpdateToolNode(toolNodeId, {
                      config: { ...toolNode.config, operations: updated }
                    })
                  }}
                  className="h-4 w-4"
                />
                <Label className="text-xs capitalize">{op.replace(/([A-Z])/g, ' $1').trim()}</Label>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Target Property</Label>
          <Input
            placeholder="cleaned"
            className="h-8 text-xs"
            value={(toolNode.config.targetProperty as string) || 'cleaned'}
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

