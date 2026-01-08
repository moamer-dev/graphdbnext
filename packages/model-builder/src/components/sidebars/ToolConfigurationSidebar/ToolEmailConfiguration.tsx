'use client'

import { CollapsibleSection } from '../../shared/CollapsibleSection'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import type { ToolCanvasNode } from '../../../stores/toolCanvasStore'

interface ToolEmailConfigurationProps {
  toolNodeId: string
  toolNode: ToolCanvasNode | null
  onUpdateToolNode: (id: string, updates: Partial<ToolCanvasNode>) => void
}

export function ToolEmailConfiguration({
  toolNodeId,
  toolNode,
  onUpdateToolNode
}: ToolEmailConfigurationProps) {
  if (!toolNode) return null

  return (
    <CollapsibleSection title="Email Configuration" defaultOpen={true}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium">To</Label>
          <Input
            type="email"
            placeholder="recipient@example.com"
            className="h-8 text-xs"
            value={(toolNode.config.to as string) || ''}
            onChange={(e) => {
              onUpdateToolNode(toolNodeId, {
                config: { ...toolNode.config, to: e.target.value }
              })
            }}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Subject</Label>
          <Input
            placeholder="Workflow Notification"
            className="h-8 text-xs"
            value={(toolNode.config.subject as string) || ''}
            onChange={(e) => {
              onUpdateToolNode(toolNodeId, {
                config: { ...toolNode.config, subject: e.target.value }
              })
            }}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Body</Label>
          <textarea
            className="w-full h-32 text-xs p-2 border rounded"
            placeholder="Email body content..."
            value={(toolNode.config.body as string) || ''}
            onChange={(e) => {
              onUpdateToolNode(toolNodeId, {
                config: { ...toolNode.config, body: e.target.value }
              })
            }}
          />
        </div>
      </div>
    </CollapsibleSection>
  )
}

