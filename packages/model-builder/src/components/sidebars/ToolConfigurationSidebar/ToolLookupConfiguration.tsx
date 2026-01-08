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
import type { ToolCanvasNode } from '../../../stores/toolCanvasStore'

interface LookupConfig {
  lookupType: 'id' | 'xpath' | 'attribute'
  lookupValue: string
  attributeName?: string
  storeResult?: boolean
  resultKey?: string
}

interface ToolLookupConfigurationProps {
  toolNodeId: string
  toolNode: ToolCanvasNode | null
  lookupConfig: LookupConfig
  onLookupConfigChange: (config: LookupConfig) => void
  onUpdateToolNode: (id: string, updates: Partial<ToolCanvasNode>) => void
}

export function ToolLookupConfiguration({
  toolNodeId,
  toolNode,
  lookupConfig,
  onLookupConfigChange,
  onUpdateToolNode
}: ToolLookupConfigurationProps) {
  return (
    <div className="space-y-4">
      <div className="mb-2">
        <Label className="text-xs font-medium">Lookup Configuration</Label>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Lookup Type</Label>
        <Select
          value={lookupConfig.lookupType}
          onValueChange={(value) => {
            const updated = { ...lookupConfig, lookupType: value as LookupConfig['lookupType'], lookupValue: '' }
            onLookupConfigChange(updated)
            onUpdateToolNode(toolNodeId, {
              config: { ...toolNode?.config, lookupType: value, lookupValue: '' }
            })
          }}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="id">Element ID</SelectItem>
            <SelectItem value="xpath">XPath Expression</SelectItem>
            <SelectItem value="attribute">Attribute Match</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {lookupConfig.lookupType === 'id' && (
        <div className="space-y-2">
          <Label className="text-xs">Element ID</Label>
          <Input
            value={lookupConfig.lookupValue}
            onChange={(e) => {
              const updated = { ...lookupConfig, lookupValue: e.target.value }
              onLookupConfigChange(updated)
              onUpdateToolNode(toolNodeId, {
                config: { ...toolNode?.config, lookupValue: e.target.value }
              })
            }}
            placeholder="Element ID to find"
            className="h-8 text-xs"
          />
        </div>
      )}
      {lookupConfig.lookupType === 'xpath' && (
        <div className="space-y-2">
          <Label className="text-xs">XPath Expression</Label>
          <Input
            value={lookupConfig.lookupValue}
            onChange={(e) => {
              const updated = { ...lookupConfig, lookupValue: e.target.value }
              onLookupConfigChange(updated)
              onUpdateToolNode(toolNodeId, {
                config: { ...toolNode?.config, lookupValue: e.target.value }
              })
            }}
            placeholder="e.g., .//kolon[@units='#unitId']"
            className="h-8 text-xs"
          />
        </div>
      )}
      {lookupConfig.lookupType === 'attribute' && (
        <>
          <div className="space-y-2">
            <Label className="text-xs">Attribute Name</Label>
            <Input
              value={lookupConfig.attributeName || ''}
              onChange={(e) => {
                const updated = { ...lookupConfig, attributeName: e.target.value }
                onLookupConfigChange(updated)
                onUpdateToolNode(toolNodeId, {
                  config: { ...toolNode?.config, attributeName: e.target.value }
                })
              }}
              placeholder="Attribute name"
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Attribute Value</Label>
            <Input
              value={lookupConfig.lookupValue}
              onChange={(e) => {
                const updated = { ...lookupConfig, lookupValue: e.target.value }
                onLookupConfigChange(updated)
                onUpdateToolNode(toolNodeId, {
                  config: { ...toolNode?.config, lookupValue: e.target.value }
                })
              }}
              placeholder="Attribute value to match"
              className="h-8 text-xs"
            />
          </div>
        </>
      )}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={lookupConfig.storeResult || false}
          onChange={(e) => {
            const updated = { ...lookupConfig, storeResult: e.target.checked }
            onLookupConfigChange(updated)
            onUpdateToolNode(toolNodeId, {
              config: { ...toolNode?.config, storeResult: e.target.checked }
            })
          }}
          className="h-4 w-4"
        />
        <Label className="text-xs">Store Result in Context</Label>
      </div>
      {lookupConfig.storeResult && (
        <div className="space-y-2">
          <Label className="text-xs">Result Key</Label>
          <Input
            value={lookupConfig.resultKey || ''}
            onChange={(e) => {
              const updated = { ...lookupConfig, resultKey: e.target.value }
              onLookupConfigChange(updated)
              onUpdateToolNode(toolNodeId, {
                config: { ...toolNode?.config, resultKey: e.target.value }
              })
            }}
            placeholder="Key to store result"
            className="h-8 text-xs"
          />
        </div>
      )}
    </div>
  )
}

