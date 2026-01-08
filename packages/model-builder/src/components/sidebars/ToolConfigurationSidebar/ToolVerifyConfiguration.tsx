'use client'

import { CollapsibleSection } from '../../shared/CollapsibleSection'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import type { ToolCanvasNode } from '../../../stores/toolCanvasStore'

interface ToolVerifyConfigurationProps {
  toolNodeId: string
  toolNode: ToolCanvasNode | null
  onUpdateToolNode: (id: string, updates: Partial<ToolCanvasNode>) => void
}

export function ToolVerifyConfiguration({
  toolNodeId,
  toolNode,
  onUpdateToolNode
}: ToolVerifyConfigurationProps) {
  if (!toolNode) return null

  const checks = ['required', 'notEmpty', 'validFormat']
  const currentChecks = (toolNode.config.checks as string[]) || []

  return (
    <CollapsibleSection title="Verify Configuration" defaultOpen={true}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium">Properties to Verify</Label>
          <Input
            placeholder="comma-separated property names"
            className="h-8 text-xs"
            value={((toolNode.config.properties as string[]) || []).join(', ')}
            onChange={(e) => {
              const props = e.target.value.split(',').map(p => p.trim()).filter(Boolean)
              onUpdateToolNode(toolNodeId, {
                config: { ...toolNode.config, properties: props }
              })
            }}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Checks</Label>
          <div className="space-y-2">
            {checks.map(check => (
              <div key={check} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={currentChecks.includes(check)}
                  onChange={(e) => {
                    const updated = e.target.checked
                      ? [...currentChecks, check]
                      : currentChecks.filter(c => c !== check)
                    onUpdateToolNode(toolNodeId, {
                      config: { ...toolNode.config, checks: updated }
                    })
                  }}
                  className="h-4 w-4"
                />
                <Label className="text-xs capitalize">{check.replace(/([A-Z])/g, ' $1').trim()}</Label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </CollapsibleSection>
  )
}

