'use client'

import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { CollapsibleSection } from '../../shared/CollapsibleSection'
import { JsonFieldSelector } from '../../viewer/JsonFieldSelector'
import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'
import type { ActionConfigurationState } from '../../../stores/actionConfigurationStore'

interface ActionSetPropertyConfigurationProps {
  actionNodeId: string
  actionNode: ActionCanvasNode | null
  setPropertyConfig: ActionConfigurationState['setPropertyConfig']
  apiResponse: unknown
  onSetPropertyConfigChange: (config: ActionConfigurationState['setPropertyConfig']) => void
  onUpdateActionNode: (id: string, updates: Partial<ActionCanvasNode>) => void
}

export function ActionSetPropertyConfiguration({
  actionNodeId,
  actionNode,
  setPropertyConfig,
  apiResponse,
  onSetPropertyConfigChange,
  onUpdateActionNode
}: ActionSetPropertyConfigurationProps) {
  if (!actionNode) return null

  return (
    <CollapsibleSection title="Set Property Configuration" defaultOpen={true}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium">Property Key</Label>
          <Input
            placeholder="Property name"
            className="h-8 text-xs"
            value={setPropertyConfig.propertyKey}
            onChange={(e) => {
              const updated = { ...setPropertyConfig, propertyKey: e.target.value }
              onSetPropertyConfigChange(updated)
              onUpdateActionNode(actionNodeId, {
                config: { ...actionNode.config, propertyKey: e.target.value }
              })
            }}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">Property Value</Label>
          {apiResponse ? (
            <JsonFieldSelector
              data={apiResponse}
              value={setPropertyConfig.propertyValue}
              onChange={(value) => {
                const updated = { ...setPropertyConfig, propertyValue: value }
                onSetPropertyConfigChange(updated)
                onUpdateActionNode(actionNodeId, {
                  config: { ...actionNode.config, propertyValue: value }
                })
              }}
              placeholder="Select a field from API response or enter value..."
              label=""
            />
          ) : (
            <Input
              placeholder="Property value"
              className="h-8 text-xs"
              value={setPropertyConfig.propertyValue}
              onChange={(e) => {
                const updated = { ...setPropertyConfig, propertyValue: e.target.value }
                onSetPropertyConfigChange(updated)
                onUpdateActionNode(actionNodeId, {
                  config: { ...actionNode.config, propertyValue: e.target.value }
                })
              }}
            />
          )}
        </div>
      </div>
    </CollapsibleSection>
  )
}

