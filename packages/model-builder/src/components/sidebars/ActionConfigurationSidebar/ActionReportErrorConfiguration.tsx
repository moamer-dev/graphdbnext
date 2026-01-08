'use client'

import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'
import { HelpTooltip } from '../../shared/HelpTooltip'
import { JsonFieldSelector } from '../../viewer/JsonFieldSelector'
import { CollapsibleSection } from '../../shared/CollapsibleSection'
import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'

interface ActionReportErrorConfigurationProps {
  actionNodeId: string
  actionNode: ActionCanvasNode | null
  apiResponse: unknown
  onUpdateActionNode: (id: string, updates: Partial<ActionCanvasNode>) => void
}

export function ActionReportErrorConfiguration({
  actionNodeId,
  actionNode,
  apiResponse,
  onUpdateActionNode
}: ActionReportErrorConfigurationProps) {
  if (!actionNode) return null

  return (
    <CollapsibleSection title="Report Error Configuration" defaultOpen={true}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium">Error Message</Label>
          {apiResponse ? (
            <JsonFieldSelector
              data={apiResponse}
              value={(actionNode.config.errorMessage as string) || 'Validation error'}
              onChange={(value) => {
                onUpdateActionNode(actionNodeId, {
                  config: { ...actionNode.config, errorMessage: value }
                })
              }}
              placeholder="Enter error message or select from JSON"
            />
          ) : (
            <Input
              placeholder="Validation error"
              className="h-8 text-xs"
              value={(actionNode.config.errorMessage as string) || 'Validation error'}
              onChange={(e) => {
                onUpdateActionNode(actionNodeId, {
                  config: { ...actionNode.config, errorMessage: e.target.value }
                })
              }}
            />
          )}
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Error Code</Label>
          <Input
            placeholder="ERROR"
            className="h-8 text-xs"
            value={(actionNode.config.errorCode as string) || 'ERROR'}
            onChange={(e) => {
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, errorCode: e.target.value }
              })
            }}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-xs font-medium">Severity</Label>
            <HelpTooltip content="Error severity level" />
          </div>
          <Select
            value={(actionNode.config.severity as string) || 'error'}
            onValueChange={(value) => {
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, severity: value }
              })
            }}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="info">Info</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </CollapsibleSection>
  )
}

