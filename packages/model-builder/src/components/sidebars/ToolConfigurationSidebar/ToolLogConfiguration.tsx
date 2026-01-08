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
import { HelpTooltip } from '../../shared/HelpTooltip'
import type { ToolCanvasNode } from '../../../stores/toolCanvasStore'

interface ToolLogConfigurationProps {
  toolNodeId: string
  toolNode: ToolCanvasNode | null
  onUpdateToolNode: (id: string, updates: Partial<ToolCanvasNode>) => void
}

export function ToolLogConfiguration({
  toolNodeId,
  toolNode,
  onUpdateToolNode
}: ToolLogConfigurationProps) {
  if (!toolNode) return null

  return (
    <CollapsibleSection title="Log Configuration" defaultOpen={true}>
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-xs font-medium">Log Level</Label>
            <HelpTooltip content="Select the log level for this log entry" />
          </div>
          <Select
            value={(toolNode.config.level as string) || 'info'}
            onValueChange={(value) => {
              onUpdateToolNode(toolNodeId, {
                config: { ...toolNode.config, level: value }
              })
            }}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="debug">Debug</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warn">Warning</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Message</Label>
          <Input
            placeholder="Log message"
            className="h-8 text-xs"
            value={(toolNode.config.message as string) || ''}
            onChange={(e) => {
              onUpdateToolNode(toolNodeId, {
                config: { ...toolNode.config, message: e.target.value }
              })
            }}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Data (JSON, optional)</Label>
          <textarea
            className="w-full h-24 text-xs font-mono p-2 border rounded"
            placeholder='{"key": "value"}'
            value={JSON.stringify(toolNode.config.data || {}, null, 2)}
            onChange={(e) => {
              try {
                const data = JSON.parse(e.target.value)
                onUpdateToolNode(toolNodeId, {
                  config: { ...toolNode.config, data }
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

