'use client'

import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { CollapsibleSection } from '../../shared/CollapsibleSection'
import { TransformEditor } from './TransformEditor'
import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'
import type { ActionConfigurationState, TextTransform } from '../../../stores/actionConfigurationStore'

interface ActionTransformTextConfigurationProps {
  actionNodeId: string
  actionNode: ActionCanvasNode | null
  transformTextConfig: ActionConfigurationState['transformTextConfig']
  onTransformTextConfigChange: (config: ActionConfigurationState['transformTextConfig']) => void
  onUpdateActionNode: (id: string, updates: Partial<ActionCanvasNode>) => void
}

export function ActionTransformTextConfiguration({
  actionNodeId,
  actionNode,
  transformTextConfig,
  onTransformTextConfigChange,
  onUpdateActionNode
}: ActionTransformTextConfigurationProps) {
  if (!actionNode) return null

  return (
    <CollapsibleSection title="Transform Text Configuration" defaultOpen={true}>
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">Transforms (Applied in Order)</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const newTransform: TextTransform = { type: 'lowercase' }
                const updated = { ...transformTextConfig, transforms: [...transformTextConfig.transforms, newTransform] }
                onTransformTextConfigChange(updated)
                onUpdateActionNode(actionNodeId, {
                  config: { ...actionNode.config, transforms: updated.transforms }
                })
              }}
              className="h-6 px-2 text-[10px]"
            >
              + Add Transform
            </Button>
          </div>
              <TransformEditor
                transforms={transformTextConfig.transforms}
                onTransformsChange={(transforms) => {
                  const updated = { ...transformTextConfig, transforms }
                  onTransformTextConfigChange(updated)
                  onUpdateActionNode(actionNodeId, {
                    config: { ...actionNode.config, transforms }
                  })
                }}
              />
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={transformTextConfig.updateInPlace}
              onChange={(e) => {
                const updated = { ...transformTextConfig, updateInPlace: e.target.checked }
                onTransformTextConfigChange(updated)
                onUpdateActionNode(actionNodeId, {
                  config: { ...actionNode.config, updateInPlace: e.target.checked }
                })
              }}
              className="h-4 w-4"
            />
            <Label className="text-xs">Update Property In-Place</Label>
          </div>
          <p className="text-[10px] text-muted-foreground ml-6">
            If checked, transform will update the target property directly instead of creating new properties.
          </p>
        </div>
        {transformTextConfig.updateInPlace && (
          <div className="space-y-2">
            <Label className="text-xs font-medium">Target Property</Label>
            <Input
              placeholder="e.g., Ptext, text"
              className="h-8 text-xs"
              value={transformTextConfig.targetProperty}
              onChange={(e) => {
                const updated = { ...transformTextConfig, targetProperty: e.target.value }
                onTransformTextConfigChange(updated)
                onUpdateActionNode(actionNodeId, {
                  config: { ...actionNode.config, targetProperty: e.target.value }
                })
              }}
            />
            <p className="text-[10px] text-muted-foreground">
              Property to update. If empty, will use the first text property found.
            </p>
          </div>
        )}
      </div>
    </CollapsibleSection>
  )
}

