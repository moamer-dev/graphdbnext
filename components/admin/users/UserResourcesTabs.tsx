'use client'

import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
    Briefcase, 
    Users, 
    Layout, 
    Database, 
    Search, 
    ExternalLink,
    CheckCircle2,
    XCircle
} from 'lucide-react'

interface UserResourcesTabsProps {
    user: any
}

export function UserResourcesTabs({ user }: UserResourcesTabsProps) {
    const createdProjects = user.createdProjects || []
    const createdTeams = user.createdTeams || []
    const createdWorkspaces = user.createdWorkspaces || []
    const models = user.models || []
    const savedQueries = user.savedQueries || []
    const teamMemberships = user.teamMembers || []
    const ResourceList = ({ items, icon: Icon, title, type }: any) => {
        if (items.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground opacity-50">
                    <Icon className="h-12 w-12 mb-4" />
                    <p className="text-sm">No {title.toLowerCase()} found for this user</p>
                </div>
            )
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item: any) => (
                    <Card key={item.id} className="border-border/50 hover:border-primary/20 transition-all group shadow-sm bg-background/50 backdrop-blur-sm h-full">
                        <CardHeader className="pb-3 border-b border-border/10 bg-muted/5 transition-colors">
                            <CardTitle className="text-sm font-semibold flex items-center justify-between">
                                <span className="truncate">{item.name}</span>
                                {item.isActive !== undefined && (
                                    item.isActive 
                                        ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                                        : <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                                )}
                            </CardTitle>
                            {item.description && (
                                <CardDescription className="text-[10px] line-clamp-1 italic">
                                    {item.description}
                                </CardDescription>
                            )}
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                    Created {new Date(item.createdAt).toLocaleDateString()}
                                </span>
                                <Badge variant="outline" className="text-[9px] h-4 font-bold border-border/50 uppercase">
                                    {type}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    return (
        <Card className="border-border/60 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/5 border-b border-border/50">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Layout className="h-5 w-5 text-primary" />
                    Resource Ownership & Associations
                </CardTitle>
                <CardDescription>
                    Overview of all platform entities created or joined by this user
                </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <Tabs defaultValue="projects" className="w-full">
                    <div className="bg-muted/5 border-b border-border/50 px-4 py-2">
                        <TabsList className="bg-muted/50 h-9 w-fit justify-start gap-1 p-1 rounded-lg border border-border/20">
                            <TabsTrigger 
                                value="projects" 
                                className="h-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary rounded-md px-3 text-[10px] font-semibold transition-all"
                            >
                                <Briefcase className="h-3.5 w-3.5 mr-2" />
                                Projects ({createdProjects.length})
                            </TabsTrigger>
                            <TabsTrigger 
                                value="workspaces" 
                                className="h-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary rounded-md px-3 text-[10px] font-semibold transition-all"
                            >
                                <Layout className="h-3.5 w-3.5 mr-2" />
                                Workspaces ({createdWorkspaces.length})
                            </TabsTrigger>
                            <TabsTrigger 
                                value="teams" 
                                className="h-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary rounded-md px-3 text-[10px] font-semibold transition-all"
                            >
                                <Users className="h-3.5 w-3.5 mr-2" />
                                Teams ({createdTeams.length + teamMemberships.length})
                            </TabsTrigger>
                            <TabsTrigger 
                                value="models" 
                                className="h-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary rounded-md px-3 text-[10px] font-semibold transition-all"
                            >
                                <Database className="h-3.5 w-3.5 mr-2" />
                                Models ({models.length})
                            </TabsTrigger>
                            <TabsTrigger 
                                value="queries" 
                                className="h-full data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary rounded-md px-3 text-[10px] font-semibold transition-all"
                            >
                                <Search className="h-3.5 w-3.5 mr-2" />
                                Queries ({savedQueries.length})
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="p-6">
                        <TabsContent value="projects" className="mt-0">
                            <ResourceList items={createdProjects} icon={Briefcase} title="Projects" type="Project" />
                        </TabsContent>
                        
                        <TabsContent value="workspaces" className="mt-0">
                            <ResourceList items={createdWorkspaces} icon={Layout} title="Workspaces" type="Workspace" />
                        </TabsContent>
                        
                        <TabsContent value="teams" className="mt-0 space-y-6">
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mb-4 flex items-center gap-2">
                                    <Users className="h-3 w-3" />
                                    Created Teams
                                </h3>
                                <ResourceList items={createdTeams} icon={Users} title="Teams" type="Owner" />
                            </div>
                            
                            {teamMemberships.length > 0 && (
                                <>
                                    <Separator className="opacity-50" />
                                    <div>
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mb-4 flex items-center gap-2">
                                            <Users className="h-3 w-3" />
                                            Team Memberships
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {teamMemberships.map((tm: any) => (
                                                <Card key={tm.id} className="border-border/50 shadow-sm bg-muted/5">
                                                    <CardContent className="p-4 flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-background rounded border border-border/20 shadow-sm">
                                                                <Users className="h-4 w-4 text-primary" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-semibold">{tm.team?.name}</p>
                                                                <p className="text-[10px] text-muted-foreground">Joined {new Date(tm.createdAt).toLocaleDateString()}</p>
                                                            </div>
                                                        </div>
                                                        <Badge variant={tm.isActive ? "default" : "secondary"} className="text-[9px] h-4">
                                                            {tm.isActive ? "Active" : "Inactive"}
                                                        </Badge>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </TabsContent>
                        
                        <TabsContent value="models" className="mt-0">
                            <ResourceList items={models} icon={Database} title="Models" type="Model" />
                        </TabsContent>
                        
                        <TabsContent value="queries" className="mt-0">
                            <ResourceList items={savedQueries} icon={Search} title="Saved Queries" type="Query" />
                        </TabsContent>
                    </div>
                </Tabs>
            </CardContent>
        </Card>
    )
}
