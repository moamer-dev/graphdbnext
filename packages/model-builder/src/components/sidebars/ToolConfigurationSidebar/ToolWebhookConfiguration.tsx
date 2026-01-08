'use client'

import { CollapsibleSection } from '../../shared/CollapsibleSection'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../ui/select'
import type { ToolCanvasNode } from '../../../stores/toolCanvasStore'

interface ToolWebhookConfigurationProps {
  toolNodeId: string
  toolNode: ToolCanvasNode | null
  onUpdateToolNode: (id: string, updates: Partial<ToolCanvasNode>) => void
}

export function ToolWebhookConfiguration({
  toolNodeId,
  toolNode,
  onUpdateToolNode
}: ToolWebhookConfigurationProps) {
  if (!toolNode) return null

  return (
    <CollapsibleSection title="Webhook Configuration" defaultOpen={true}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium">Webhook URL</Label>
          <Input
            type="url"
            placeholder="https://example.com/webhook"
            className="h-8 text-xs"
            value={(toolNode.config.url as string) || ''}
            onChange={(e) => {
              onUpdateToolNode(toolNodeId, {
                config: { ...toolNode.config, url: e.target.value }
              })
            }}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Method</Label>
          <Select
            value={(toolNode.config.method as string) || 'POST'}
            onValueChange={(value) => {
              onUpdateToolNode(toolNodeId, {
                config: { ...toolNode.config, method: value }
              })
            }}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="POST">POST</SelectItem>
              <SelectItem value="PUT">PUT</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Payload (JSON)</Label>
          <textarea
            className="w-full h-24 text-xs font-mono p-2 border rounded"
            placeholder='{"event": "workflow_completed", "data": {...}}'
            value={JSON.stringify(toolNode.config.payload || {}, null, 2)}
            onChange={(e) => {
              try {
                const payload = JSON.parse(e.target.value)
                onUpdateToolNode(toolNodeId, {
                  config: { ...toolNode.config, payload }
                })
              } catch {
                // Invalid JSON, ignore
              }
            }}
          />
        </div>
      </div>
    </CollapsibleSection>
  )
}

