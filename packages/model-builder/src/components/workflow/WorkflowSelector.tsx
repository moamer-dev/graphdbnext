'use client'

import { useState, useEffect } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../ui/select'
import { Button } from '../ui/button'
import { RefreshCw } from 'lucide-react'
import type { WorkflowPersistence } from '../ModelBuilder'

interface WorkflowSelectorProps {
  workflows: Array<{
    id: string
    name: string
    description?: string
    version: string
    createdAt: string
    updatedAt: string
  }>
  currentWorkflowId: string | null
  onWorkflowChange: (workflowId: string) => void
  onRefresh?: () => void
  loading?: boolean
  workflowPersistence?: WorkflowPersistence
}

export function WorkflowSelector({
  workflows,
  currentWorkflowId,
  onWorkflowChange,
  onRefresh,
  loading = false,
  workflowPersistence
}: WorkflowSelectorProps) {
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>(currentWorkflowId || '')

  // Sync selectedWorkflowId with currentWorkflowId prop changes
  useEffect(() => {
    if (currentWorkflowId) {
      setSelectedWorkflowId(currentWorkflowId)
    }
  }, [currentWorkflowId])

  const handleChange = (value: string) => {
    setSelectedWorkflowId(value)
    onWorkflowChange(value)
  }

  if (!workflowPersistence || workflows.length === 0) {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">Workflow:</span>
      <Select
        value={selectedWorkflowId}
        onValueChange={handleChange}
        disabled={loading}
      >
        <SelectTrigger className="h-7 w-[200px] text-xs">
          <SelectValue placeholder="Select workflow" />
        </SelectTrigger>
        <SelectContent>
          {workflows.map((workflow) => (
            <SelectItem key={workflow.id} value={workflow.id}>
              {workflow.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {onRefresh && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
          className="h-7 w-7 p-0"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      )}
    </div>
  )
}

