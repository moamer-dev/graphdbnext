'use client'

import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '../ui/button'
import { ScrollArea } from '../ui/scroll-area'
import { Sparkles, Workflow, ArrowLeft } from 'lucide-react'
import { SchemaDesignPanelContent } from './SchemaDesignPanelContent'
import { WorkflowGenerationPanelContent } from './WorkflowGenerationPanelContent'
import { useAIFeature } from '../../ai/config'
import { cn } from '../../utils/cn'

interface Agent {
  id: string
  name: string
  description: string
  capabilities: string[]
  icon: LucideIcon
  color: string
  modes?: Array<{ id: string; label: string; mode: 'suggest' | 'optimize' | 'validate' }>
}

export function AIAgentsPanel({ className }: { className?: string }) {
  const isSchemaDesignEnabled = useAIFeature('schemaDesignAgent')
  const isWorkflowGenerationEnabled = useAIFeature('workflowGenerationAgent')
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [selectedMode, setSelectedMode] = useState<'suggest' | 'optimize' | 'validate'>('suggest')

  const agents: Agent[] = []

  if (isSchemaDesignEnabled) {
    agents.push({
      id: 'schema-design',
      name: 'Schema Design Agent',
      description: 'AI-powered agent for generating, optimizing, and validating graph database schemas from natural language descriptions.',
      capabilities: [
        'Generate schemas from text descriptions',
        'Optimize existing schemas',
        'Validate schemas for best practices',
        'Suggest improvements and relationships'
      ],
      icon: Sparkles,
      color: 'text-blue-500 bg-blue-500/10',
      modes: [
        { id: 'generate', label: 'Generate', mode: 'suggest' },
        { id: 'optimize', label: 'Optimize', mode: 'optimize' },
        { id: 'validate', label: 'Validate', mode: 'validate' }
      ]
    })
  }

  if (isWorkflowGenerationEnabled) {
    agents.push({
      id: 'workflow-generation',
      name: 'Workflow Generation Agent',
      description: 'Convert natural language descriptions into executable workflow definitions with tools and actions.',
      capabilities: [
        'Generate workflows from descriptions',
        'Create tool and action nodes',
        'Connect workflow components',
        'Explain generated workflows'
      ],
      icon: Workflow,
      color: 'text-purple-500 bg-purple-500/10'
    })
  }

  if (agents.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-full text-muted-foreground', className)}>
        <div className="text-center">
          <p className="text-sm">No AI agents enabled</p>
          <p className="text-xs mt-1">Enable AI features in settings</p>
        </div>
      </div>
    )
  }

  const selectedAgentData = agents.find(a => a.id === selectedAgent)

  if (selectedAgentData) {
    const handleBack = () => {
      setSelectedAgent(null)
      setSelectedMode('suggest')
    }

    return (
      <div className={cn('flex flex-col h-full bg-background border-l', className)}>
        <div className="border-b p-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="h-7 w-7 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 flex-1">
            <selectedAgentData.icon className={cn('h-4 w-4', selectedAgentData.color.split(' ')[0])} />
            <h2 className="text-sm font-semibold">{selectedAgentData.name}</h2>
          </div>
        </div>

        {selectedAgentData.modes && selectedAgentData.modes.length > 0 ? (
          <>
            <div className="border-b p-2 flex gap-2">
              {selectedAgentData.modes.map((mode) => (
                <Button
                  key={mode.id}
                  variant={selectedMode === mode.mode ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedMode(mode.mode)}
                  className="flex-1 text-xs h-7"
                >
                  {mode.label}
                </Button>
              ))}
            </div>
            <div className="flex-1 min-h-0">
              {selectedAgentData.id === 'schema-design' && (
                <SchemaDesignPanelContent mode={selectedMode} />
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 min-h-0">
            {selectedAgentData.id === 'workflow-generation' && (
              <WorkflowGenerationPanelContent />
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col h-full bg-background border-l', className)}>
      <div className="border-b p-3">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          AI Agents
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Select an agent to get started
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {agents.map((agent) => {
            const Icon = agent.icon
            return (
              <div key={agent.id} className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'flex items-center justify-center w-12 h-12 rounded-lg shrink-0',
                    agent.color
                  )}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold mb-1 group-hover:text-primary transition-colors">
                      {agent.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                      {agent.description}
                    </p>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Capabilities:</p>
                      <ul className="text-xs text-muted-foreground space-y-0.5">
                        {agent.capabilities.map((capability, idx) => (
                          <li key={`${agent.id}-capability-${idx}`} className="flex items-start gap-1.5">
                            <span className="text-primary mt-0.5">•</span>
                            <span>{capability}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full" onClick={() => setSelectedAgent(agent.id)}>Use Agent</Button>
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
