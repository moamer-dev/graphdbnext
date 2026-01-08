'use client'

import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../ui/select'
import { CollapsibleSection } from '../../shared/CollapsibleSection'
import type { ActionCanvasNode } from '../../../stores/actionCanvasStore'
import type { ActionConfigurationState } from '../../../stores/actionConfigurationStore'

interface ActionSkipConfigurationProps {
  actionNodeId: string
  actionNode: ActionCanvasNode | null
  skipConfig: ActionConfigurationState['skipConfig']
  onSkipConfigChange: (config: ActionConfigurationState['skipConfig']) => void
  onUpdateActionNode: (id: string, updates: Partial<ActionCanvasNode>) => void
}

export function ActionSkipConfiguration({
  actionNodeId,
  actionNode,
  skipConfig,
  onSkipConfigChange,
  onUpdateActionNode
}: ActionSkipConfigurationProps) {
  if (!actionNode) return null

  return (
    <CollapsibleSection title="Skip Configuration" defaultOpen={true}>
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="skipMainNode"
              checked={skipConfig.skipMainNode}
              onChange={(e) => {
                const updated = { ...skipConfig, skipMainNode: e.target.checked }
                onSkipConfigChange(updated)
                onUpdateActionNode(actionNodeId, {
                  config: { ...actionNode.config, skipMainNode: e.target.checked }
                })
              }}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="skipMainNode" className="text-xs font-medium cursor-pointer">
              Skip Creating Main Node
            </Label>
          </div>
          <p className="text-[10px] text-muted-foreground ml-6">
            If checked, the current element (e.g., Seg, Verse) will not be created as a node.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="skipChildren"
              checked={skipConfig.skipChildren}
              onChange={(e) => {
                const updated = { ...skipConfig, skipChildren: e.target.checked }
                onSkipConfigChange(updated)
                onUpdateActionNode(actionNodeId, {
                  config: { ...actionNode.config, skipChildren: e.target.checked }
                })
              }}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="skipChildren" className="text-xs font-medium cursor-pointer">
              Skip Processing Children
            </Label>
          </div>
          <p className="text-[10px] text-muted-foreground ml-6">
            If checked, child elements will not be processed by subsequent actions.
          </p>
        </div>

        {skipConfig.skipChildren && (
          <>
            <div className="space-y-2">
              <Label className="text-xs font-medium">Skip Mode</Label>
              <Select
                value={skipConfig.skipChildrenMode}
                onValueChange={(value: 'all' | 'selected') => {
                  const updated = { ...skipConfig, skipChildrenMode: value }
                  onSkipConfigChange(updated)
                  onUpdateActionNode(actionNodeId, {
                    config: { ...actionNode.config, skipChildrenMode: value }
                  })
                }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Skip All Children</SelectItem>
                  <SelectItem value="selected">Skip Selected Tags Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {skipConfig.skipChildrenMode === 'selected' && (
              <div className="space-y-2">
                <Label className="text-xs font-medium">Skip Tags</Label>
                <Input
                  placeholder="e.g., note, comment (comma-separated)"
                  className="h-8 text-xs"
                  value={skipConfig.skipChildrenTags.join(', ')}
                  onChange={(e) => {
                    const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                    const updated = { ...skipConfig, skipChildrenTags: tags }
                    onSkipConfigChange(updated)
                    onUpdateActionNode(actionNodeId, {
                      config: { ...actionNode.config, skipChildrenTags: tags }
                    })
                  }}
                />
                <p className="text-[10px] text-muted-foreground">Only skip children with these tags.</p>
              </div>
            )}
          </>
        )}
      </div>
    </CollapsibleSection>
  )
}

