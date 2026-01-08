import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '../ui/button'
import { ScrollArea } from '../ui/scroll-area'
import { Sparkles, Workflow, ArrowLeft, Bot, Zap, ShieldCheck } from 'lucide-react'
import { SchemaDesignPanelContent } from './SchemaDesignPanelContent'
import { WorkflowGenerationPanelContent } from './WorkflowGenerationPanelContent'
import { useAIFeature } from '../../ai/config'
import { cn } from '../../utils/cn'

interface Agent {
  id: string
  name: string
  role: string
  description: string
  capabilities: string[]
  icon: LucideIcon
  color: string
  gradient: string
  status: 'online' | 'busy' | 'offline'
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
      name: 'Architect',
      role: 'Schema Design Specialist',
      description: 'Expert in crafting, optimizing, and validating high-performance graph database schemas.',
      capabilities: ['Schema Generation', 'Optimization', 'Validation', 'Best Practices'],
      icon: Sparkles,
      color: 'text-blue-500',
      gradient: 'from-blue-500/20 to-cyan-500/20',
      status: 'online',
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
      name: 'Orchestrator',
      role: 'Workflow Automation Expert',
      description: 'Specializes in converting requirements into executable, robust workflow definitions.',
      capabilities: ['Workflow Design', 'Automation', 'Logic Routing', 'Integration'],
      icon: Workflow,
      color: 'text-purple-500',
      gradient: 'from-purple-500/20 to-pink-500/20',
      status: 'online'
    })
  }

  if (agents.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-full text-muted-foreground bg-muted/5', className)}>
        <div className="text-center p-6 rounded-lg border bg-background/50 backdrop-blur-sm max-w-[200px]">
          <Bot className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p className="text-sm font-medium">No AI Agents Active</p>
          <p className="text-xs mt-1 text-muted-foreground">Enable AI features in settings to deploy agents.</p>
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
      <div className={cn('flex flex-col h-full bg-background/95 backdrop-blur-sm border-l', className)}>
        {/* Agent Header */}
        <div className="border-b p-4 flex items-center gap-4 bg-muted/10">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="h-8 w-8 p-0 rounded-full hover:bg-background shadow-sm border border-transparent hover:border-border transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-3 flex-1">
            <div className={cn(
              "relative h-10 w-10 rounded-full flex items-center justify-center bg-gradient-to-br border border-white/10 shadow-inner",
              selectedAgentData.gradient
            )}>
              <selectedAgentData.icon className={cn("h-5 w-5", selectedAgentData.color)} />
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-background flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            </div>
            <div>
              <h2 className="text-sm font-bold leading-none">{selectedAgentData.name}</h2>
              <p className="text-[10px] text-muted-foreground mt-1 font-medium pt-0.5">{selectedAgentData.role}</p>
            </div>
          </div>
        </div>

        {/* Modes / Content */}
        {selectedAgentData.modes && selectedAgentData.modes.length > 0 ? (
          <>
            <div className="p-2 border-b bg-muted/5 flex gap-1">
              {selectedAgentData.modes.map((mode) => (
                <Button
                  key={mode.id}
                  variant={selectedMode === mode.mode ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedMode(mode.mode)}
                  className={cn(
                    "flex-1 text-xs h-8 rounded-md transition-all",
                    selectedMode === mode.mode && "bg-white dark:bg-zinc-800 shadow-sm font-medium"
                  )}
                >
                  {mode.label}
                </Button>
              ))}
            </div>
            <div className="flex-1 min-h-0 bg-gradient-to-b from-background to-muted/5">
              {selectedAgentData.id === 'schema-design' && (
                <SchemaDesignPanelContent mode={selectedMode} />
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 min-h-0 bg-gradient-to-b from-background to-muted/5">
            {selectedAgentData.id === 'workflow-generation' && (
              <WorkflowGenerationPanelContent />
            )}
          </div>
        )}
      </div>
    )
  }

  // Gallery View
  return (
    <div className={cn('flex flex-col h-full bg-muted/5 border-l relative overflow-hidden', className)}>
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="p-6 pb-2 relative z-10">
        <h2 className="text-lg font-bold flex items-center gap-2 tracking-tight">
          <Bot className="h-5 w-5 text-primary" />
          AI Hub
        </h2>
        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed max-w-[280px]">
          Deploy specialized AI agents to accelerate your graph modeling and workflow automation tasks.
        </p>
      </div>

      <ScrollArea className="flex-1 px-4 pb-4 bg-transparent relative z-10">
        <div className="space-y-4 pt-2">
          {agents.map((agent) => {
            const Icon = agent.icon
            return (
              <div
                key={agent.id}
                className="group relative overflow-hidden rounded-xl border bg-card hover:border-primary/50 transition-all duration-300 cursor-pointer"
                onClick={() => setSelectedAgent(agent.id)}
              >
                <div className="relative p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className={cn(
                      "h-10 w-10 rounded-lg flex items-center justify-center bg-muted",
                      agent.color.replace('text-', 'bg-').replace('500', '500/10')
                    )}>
                      <Icon className={cn("h-5 w-5", agent.color)} />
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-muted/50 border text-[10px] font-medium">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span className="text-muted-foreground">Online</span>
                    </div>
                  </div>

                  <div className="space-y-1 mb-3">
                    <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                      {agent.name}
                    </h3>
                    <p className="text-[10px] font-medium text-muted-foreground">{agent.role}</p>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2">
                    {agent.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {agent.capabilities.map((capability, idx) => (
                      <span
                        key={`${agent.id}-capability-${idx}`}
                        className="px-1.5 py-0.5 rounded bg-muted text-[10px] text-muted-foreground"
                      >
                        {capability}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
