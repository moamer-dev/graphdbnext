'use client'

import { useState } from 'react'
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
  ArrowRight,
  FileDown
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { downloadTemplate } from '@/lib/utils/downloadTemplate'

export default function DashboardPage() {
  const { data: session } = useSession()
  const userName = session?.user?.name || 'User'
  const [activeGroupIndex, setActiveGroupIndex] = useState(0)

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
        },
        {
          label: 'Download JSON Template',
          onClick: () => downloadTemplate('json'),
          icon: FileDown,
          description: 'Get the JSON schema template'
        },
        {
          label: 'Download MD Template',
          onClick: () => downloadTemplate('md'),
          icon: FileDown,
          description: 'Get the Markdown schema template'
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {groups.map((group, index) => {
          const isActive = activeGroupIndex === index
          return (
            <div
              key={group.title}
              onMouseEnter={() => setActiveGroupIndex(index)}
              className={`
                cursor-pointer relative overflow-hidden rounded-xl border p-4 transition-all duration-300
                flex flex-col items-center justify-center text-center gap-3 h-32
                ${isActive
                  ? 'bg-primary/5 border-primary shadow-md scale-[1.02]'
                  : 'bg-card border-border/40 hover:border-primary/50 hover:bg-accent/50 text-muted-foreground hover:shadow-sm'}
              `}
            >
              <div className={`
                p-3 rounded-full transition-colors duration-300 
                ${isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground group-hover:text-primary'}
              `}>
                <group.icon className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <span className={`font-semibold block transition-colors ${isActive ? 'text-foreground' : ''}`}>
                  {group.title}
                </span>
              </div>
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary animate-in fade-in zoom-in duration-300" />
              )}
            </div>
          )
        })}
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Card className="bg-muted/10 border-border/20 backdrop-blur-sm overflow-hidden">
          <CardHeader className="border-b border-border/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                {(() => {
                  const Icon = groups[activeGroupIndex].icon
                  return <Icon className="h-6 w-6 text-primary" />
                })()}
              </div>
              <div>
                <CardTitle>{groups[activeGroupIndex].title}</CardTitle>
                <CardDescription>{groups[activeGroupIndex].description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups[activeGroupIndex].items.map((item) => {
                const content = (
                  <div className="flex items-center justify-between p-4 rounded-xl border border-border/20 bg-background/50 hover:bg-background hover:border-primary/30 transition-all duration-200 hover:shadow-md h-full">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted group-hover:bg-primary/10 transition-colors">
                        <item.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div>
                        <p className="font-semibold group-hover:text-primary transition-colors">
                          {item.label}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground/30 group-hover:text-primary/50 group-hover:translate-x-1 transition-all" />
                  </div>
                )

                if (item.href) {
                  return (
                    <Link href={item.href} key={item.label} className="group cursor-pointer">
                      {content}
                    </Link>
                  )
                }

                return (
                  <div
                    key={item.label}
                    onClick={item.onClick}
                    role="button"
                    tabIndex={0}
                    className="group cursor-pointer"
                  >
                    {content}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
