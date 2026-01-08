'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  Network,
  Upload,
  Plus,
  FileCode,
  Database,
  Search,
  BarChart,
  Settings,
  Grid,
  Sparkles,
  ArrowRight
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function DashboardPage() {
  const { data: session } = useSession()
  const userName = session?.user?.name || 'User'

  const groups = [
    {
      title: 'Model Schema',
      description: 'Manage and visualize your graph data models',
      icon: Network,
      items: [
        {
          label: 'Browse Models',
          href: '/dashboard/graph/model?view=grid',
          icon: Grid,
          description: 'View your existing models'
        },
        {
          label: 'Upload Schema',
          href: '/dashboard/graph/model?action=upload',
          icon: Upload,
          description: 'Import JSON or Markdown schema'
        },
        {
          label: 'Create Model',
          href: '/dashboard/graph/model/new',
          icon: Plus,
          description: 'Design a new graph model'
        }
      ]
    },
    {
      title: 'XML to Graph',
      description: 'Convert XML documents into graph structures',
      icon: FileCode,
      items: [
        {
          label: 'Convert XML',
          href: '/dashboard/graph/model/new/from-xml',
          icon: FileCode,
          description: 'Transform XML files to graph'
        }
      ]
    },
    {
      title: 'Graph Data Management',
      description: 'Interact with your graph database',
      icon: Database,
      items: [
        {
          label: 'Manage Data',
          href: '/dashboard/database',
          icon: Database,
          description: 'Explorer and manage nodes'
        },
        {
          label: 'Query UI',
          href: '/dashboard/database/queries?mode=library',
          icon: Search,
          description: 'Execute Cypher queries'
        },
        {
          label: 'Analytics',
          href: '/dashboard/database/analytics',
          icon: BarChart,
          description: 'View graph statistics'
        }
      ]
    },
    {
      title: 'Settings',
      description: 'Configure your application',
      icon: Settings,
      items: [
        {
          label: 'AI Settings',
          href: '/dashboard/settings/ai',
          icon: Sparkles,
          description: 'Configure AI models and agents'
        },
        {
          label: 'Modules',
          href: '/dashboard/settings/modules',
          icon: Settings,
          description: 'Manage optional features'
        }
      ]
    }
  ]

  return (
    <div className="space-y-6 mt-6">
      <div className="gradient-header-minimal pb-4">
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {userName}
        </h1>
        <p className="text-muted-foreground mt-1">
          Everything you need to manage your graph database platform in one place.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {groups.map((group) => (
          <Card key={group.title} className="bg-muted/10 border-border/20 backdrop-blur-sm overflow-hidden flex flex-col">
            <CardHeader className="border-b border-border/10 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <group.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">{group.title}</CardTitle>
                  <CardDescription className="text-xs">{group.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-6 flex-1">
              <div className="grid grid-cols-1 gap-3">
                {group.items.map((item) => (
                  <Link href={item.href} key={item.label} className="group">
                    <div className="flex items-center justify-between p-3 rounded-md border border-border/20 bg-background/50 hover:bg-background hover:border-primary/30 transition-all duration-200 hover:shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted group-hover:bg-primary/10 transition-colors">
                          <item.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <div>
                          <p className="text-sm font-medium group-hover:text-primary transition-colors">
                            {item.label}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary/50 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
