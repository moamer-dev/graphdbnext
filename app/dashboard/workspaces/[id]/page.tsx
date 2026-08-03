'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { resourceHooks } from '@/hooks/react-query'
import { 
  Loader2, 
  Layers, 
  Users, 
  Briefcase, 
  ArrowLeft, 
  Pencil, 
  Info, 
  Database,
  Box,
  UserPlus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EditWorkspaceDialog } from '@/components/dashboard/EditModals'
import { StatCard } from '@/components/dashboard/workspaces/StatCard'
import { ResourceItemCard } from '@/components/dashboard/workspaces/ResourceItemCard'
import { DetailItem } from '@/components/dashboard/workspaces/DetailItem'
import { EmptyState } from '@/components/dashboard/workspaces/EmptyState'

export default function WorkspaceViewPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [isEditOpen, setIsEditOpen] = React.useState(false)

  const { data, isLoading } = resourceHooks.workspaces.useSingle(id, !!id) as any
  const workspace = data?.data

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" />
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">Synchronizing workspace data</p>
      </div>
    )
  }

  if (!workspace) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
            <Info className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">Workspace not found</p>
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          Back to list
        </Button>
      </div>
    )
  }

  // Calculate insights
  const projectsCount = workspace.projects?.length || 0
  const dataSourcesCount = workspace.dataSources?.length || 0
  const modelsCount = workspace.models?.length || 0
  
  // Aggregate unique teams and members from all projects attached to this workspace
  const teams = Array.from(new Set(workspace.projects?.map((p: any) => p.project?.team?.id).filter(Boolean)))
  const totalMembers = workspace.projects?.reduce((acc: number, p: any) => {
    return acc + (p.project?.team?.members?.length || 0)
  }, 0)
  const totalInvitations = workspace.projects?.reduce((acc: number, p: any) => {
    return acc + (p.project?.team?.invitations?.length || 0)
  }, 0)

  return (
    <div className="space-y-6 mt-4">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 rounded-full hover:bg-primary/5 group" 
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </Button>
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Briefcase className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">{workspace.name}</h1>
              <Badge variant={workspace.isActive ? 'default' : 'secondary'} className="h-5 text-[10px] px-1.5 font-bold uppercase tracking-wider">
                {workspace.isActive ? 'Active' : 'Archived'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground max-w-lg mt-0.5 line-clamp-1">{workspace.description || 'No specialized description provided for this environment.'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end md:self-auto">
          <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={() => setIsEditOpen(true)}>
            <Pencil className="h-3.5 w-3.5" />
            Edit Profile
          </Button>
        </div>
      </div>

      {/* Insights/Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard 
            label="Projects" 
            value={projectsCount} 
            icon={Layers} 
            color="text-blue-500" 
            bgColor="bg-blue-500/10" 
        />
        <StatCard 
            label="Data Sources" 
            value={dataSourcesCount} 
            icon={Database} 
            color="text-amber-500" 
            bgColor="bg-amber-500/10" 
        />
        <StatCard 
            label="Models" 
            value={modelsCount} 
            icon={Box} 
            color="text-emerald-500" 
            bgColor="bg-emerald-500/10" 
        />
        <StatCard 
            label="Collaborators" 
            value={totalMembers} 
            icon={Users} 
            color="text-indigo-500" 
            bgColor="bg-indigo-500/10" 
        />
        <StatCard 
            label="Pending" 
            value={totalInvitations} 
            icon={UserPlus} 
            color="text-rose-500" 
            bgColor="bg-rose-500/10" 
        />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Related Resources Tabs */}
        <div className="lg:col-span-2">
            <Tabs defaultValue="projects" className="w-full">
                <TabsList className="bg-muted/30 p-1 mb-4 h-9">
                    <TabsTrigger value="projects" className="text-[10px] uppercase font-bold tracking-widest px-4 h-7">Projects</TabsTrigger>
                    <TabsTrigger value="dataSources" className="text-[10px] uppercase font-bold tracking-widest px-4 h-7">Data Sources</TabsTrigger>
                    <TabsTrigger value="models" className="text-[10px] uppercase font-bold tracking-widest px-4 h-7">Models</TabsTrigger>
                </TabsList>
                
                <TabsContent value="projects" className="mt-0 space-y-3">
                    {workspace.projects?.length > 0 ? (
                        workspace.projects.map((pw: any) => (
                            <ResourceItemCard 
                                key={pw.project.id}
                                title={pw.project.name}
                                subtitle={pw.project.team?.name || 'Self-managed'}
                                description={pw.project.description}
                                date={pw.project.createdAt}
                                icon={Layers}
                                onClick={() => router.push(`/dashboard/projects/${pw.project.id}`)}
                            />
                        ))
                    ) : (
                        <EmptyState message="No projects linked yet" />
                    )}
                </TabsContent>

                <TabsContent value="dataSources" className="mt-0 space-y-3">
                    {workspace.dataSources?.length > 0 ? (
                        workspace.dataSources.map((ds: any) => (
                            <ResourceItemCard 
                                key={ds.id}
                                title={ds.name}
                                subtitle={ds.type}
                                description={`Managed by ${ds.creator?.name || 'System'}`}
                                date={ds.createdAt}
                                icon={Database}
                            />
                        ))
                    ) : (
                        <EmptyState message="No data sources added" />
                    )}
                </TabsContent>

                <TabsContent value="models" className="mt-0 space-y-3">
                    {workspace.models?.length > 0 ? (
                        workspace.models.map((m: any) => (
                            <ResourceItemCard 
                                key={m.id}
                                title={m.name}
                                subtitle={`v${m.version || '1.0'}`}
                                description={m.description}
                                date={m.createdAt}
                                icon={Box}
                                onClick={() => router.push(`/dashboard/graph/model/${m.id}/edit`)}
                            />
                        ))
                    ) : (
                        <EmptyState message="No models designed" />
                    )}
                </TabsContent>
            </Tabs>
        </div>

        {/* Right Column: Metadata Details */}
        <div className="space-y-6">
            <Card className="shadow-none bg-muted/5 border-muted-foreground/10">
                <CardHeader className="pb-3 border-b border-border/40">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest">Metadata Context</CardTitle>
                </CardHeader>
                <CardContent className="pt-5 space-y-5">
                    <DetailItem 
                        label="Identifier" 
                        value={workspace.id} 
                        className="font-mono text-[10px]"
                    />
                    <DetailItem 
                        label="Environment Type" 
                        value={workspace.isActive ? 'Production Runtime' : 'Isolated/Archived'} 
                    />
                    <DetailItem 
                        label="Primary Owner" 
                        value={workspace.creator?.name || 'System Administrator'}
                        subValue={workspace.creator?.email}
                    />
                    <DetailItem 
                        label="Provisioning Date" 
                        value={new Date(workspace.createdAt).toLocaleDateString('en-US', { dateStyle: 'full' })} 
                    />
                    <DetailItem 
                        label="Last Synchronization" 
                        value={new Date(workspace.updatedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })} 
                    />
                </CardContent>
            </Card>

            <Card className="shadow-none bg-primary/[0.02] border-primary/10">
                <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary/80">Collaboration Insight</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-[11px] text-muted-foreground/80 leading-relaxed font-medium">
                        This workspace is governed by {teams.length} distinct {teams.length === 1 ? 'team' : 'teams'}. 
                        Shared resources are currently accessible to {totalMembers} verified collaborators and awaiting {totalInvitations} pending invitations.
                    </p>
                </CardContent>
            </Card>
        </div>
      </div>

      <EditWorkspaceDialog 
        id={id} 
        open={isEditOpen} 
        onOpenChange={setIsEditOpen} 
      />
    </div>
  )
}
