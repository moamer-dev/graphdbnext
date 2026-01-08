'use client'

import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { JsonFieldSelector } from '../../viewer/JsonFieldSelector'
import { HelpTooltip } from '../../shared/HelpTooltip'
import { CollapsibleSection } from '../../shared/CollapsibleSection'
import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'

interface ActionCopyPropertyConfigurationProps {
  actionNodeId: string
  actionNode: ActionCanvasNode | null
  apiResponse: unknown
  onUpdateActionNode: (id: string, updates: Partial<ActionCanvasNode>) => void
}

export function ActionCopyPropertyConfiguration({
  actionNodeId,
  actionNode,
  apiResponse,
  onUpdateActionNode
}: ActionCopyPropertyConfigurationProps) {
  if (!actionNode) return null

  return (
    <CollapsibleSection title="Copy Property Configuration" defaultOpen={true}>
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-xs font-medium">Source Property</Label>
            <HelpTooltip content="The property name to copy from" />
          </div>
          {apiResponse ? (
            <JsonFieldSelector
              data={apiResponse}
              value={(actionNode.config.sourceProperty as string) || ''}
              onChange={(value) => {
                onUpdateActionNode(actionNodeId, {
                  config: { ...actionNode.config, sourceProperty: value }
                })
              }}
              placeholder="Select or enter property name"
            />
          ) : (
            <Input
              placeholder="e.g., name, title"
              className="h-8 text-xs"
              value={(actionNode.config.sourceProperty as string) || ''}
              onChange={(e) => {
                onUpdateActionNode(actionNodeId, {
                  config: { ...actionNode.config, sourceProperty: e.target.value }
                })
              }}
            />
          )}
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Target Property</Label>
          <Input
            placeholder="e.g., copiedName"
            className="h-8 text-xs"
            value={(actionNode.config.targetProperty as string) || ''}
            onChange={(e) => {
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, targetProperty: e.target.value }
              })
            }}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Source Node ID (optional)</Label>
          <Input
            type="number"
            placeholder="Leave empty to use parent node"
            className="h-8 text-xs"
            value={(actionNode.config.sourceNodeId as number) || ''}
            onChange={(e) => {
              const value = e.target.value ? parseInt(e.target.value) : undefined
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, sourceNodeId: value }
              })
            }}
          />
        </div>
      </div>
    </CollapsibleSection>
  )
}

