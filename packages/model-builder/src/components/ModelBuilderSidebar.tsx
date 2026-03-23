import React from 'react'
import { ResizablePanel } from './ui/resizable-panel'
import { Button } from './ui/button'
import { PanelLeftClose, Circle, Link2, Wrench, Zap } from 'lucide-react'
import { NodePalette } from './palette/NodePalette'
import { cn } from '../utils/cn'

interface ModelBuilderSidebarProps {
  nodesSidebarOpen: boolean
  setNodesSidebarOpen: (val: boolean) => void
  sidebarWidth: number
  setSidebarWidth: (val: number) => void
  leftTab: 'nodes' | 'relationships' | 'tools' | 'actions'
  setLeftTab: (tab: 'nodes' | 'relationships' | 'tools' | 'actions') => void
  onFocusNode: (id: string) => void
  onFocusRelationship: (fromId: string, toId: string) => void
}

export const ModelBuilderSidebar: React.FC<ModelBuilderSidebarProps> = ({
  nodesSidebarOpen,
  setNodesSidebarOpen,
  sidebarWidth,
  setSidebarWidth,
  leftTab,
  setLeftTab,
  onFocusNode,
  onFocusRelationship
}) => {
  if (!nodesSidebarOpen) return null

  return (
    <ResizablePanel
      side="left"
      defaultWidth={sidebarWidth}
      minWidth={200}
      maxWidth={600}
      onWidthChange={setSidebarWidth}
      className="h-full border-r bg-muted/10 shrink-0"
    >
      <div className="h-full flex flex-col">
        <div className="flex flex-col border-b bg-muted/20">
          <div className="flex items-center justify-between p-2 pb-0">
            <span className="text-xs font-semibold text-muted-foreground pl-1">Library</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setNodesSidebarOpen(false)}
              className="h-6 w-6 p-0 shrink-0 hover:bg-background/80"
              title="Hide Sidebar"
            >
              <PanelLeftClose className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="grid grid-cols-4 gap-1 p-2 pt-1">
            <TabButton 
              active={leftTab === 'nodes'} 
              onClick={() => setLeftTab('nodes')} 
              icon={<Circle className="h-4 w-4" />} 
              label="Nodes" 
              colorClass="text-blue-600"
            />
            <TabButton 
              active={leftTab === 'relationships'} 
              onClick={() => setLeftTab('relationships')} 
              icon={<Link2 className="h-4 w-4" />} 
              label="Rels" 
              colorClass="text-indigo-600"
            />
            <TabButton 
              active={leftTab === 'tools'} 
              onClick={() => setLeftTab('tools')} 
              icon={<Wrench className="h-4 w-4" />} 
              label="Tools" 
              colorClass="text-purple-600"
            />
            <TabButton 
              active={leftTab === 'actions'} 
              onClick={() => setLeftTab('actions')} 
              icon={<Zap className="h-4 w-4" />} 
              label="Actions" 
              colorClass="text-amber-600"
            />
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          {leftTab === 'nodes' && <NodePalette className="h-full" mode="nodes" onFocusNode={onFocusNode} />}
          {leftTab === 'relationships' && <NodePalette className="h-full" mode="relationships" onFocusRelationship={onFocusRelationship} />}
          {leftTab === 'tools' && <NodePalette className="h-full" mode="tools" />}
          {leftTab === 'actions' && <NodePalette className="h-full" mode="actions" />}
        </div>
      </div>
    </ResizablePanel>
  )
}

interface TabButtonProps {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  colorClass: string
}

const TabButton: React.FC<TabButtonProps> = ({ active, onClick, icon, label, colorClass }) => (
  <button 
    onClick={onClick} 
    className={cn(
      "flex flex-col items-center justify-center gap-1 p-1.5 rounded-md transition-all duration-200 border", 
      active 
        ? `bg-background ${colorClass} border-border shadow-sm` 
        : "text-muted-foreground border-transparent hover:bg-background/50 hover:text-foreground"
    )} 
    title={label}
  >
    {icon}
    <span className="text-[10px] font-medium leading-none">{label}</span>
  </button>
)
