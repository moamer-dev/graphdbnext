import { type LucideIcon, Database, Code, Network, Users, Settings, Palette, MessageSquare, LayoutDashboard } from 'lucide-react'

export interface SidebarNavItem {
  title: string
  url: string
  icon: LucideIcon
  items?: {
    title: string
    url: string
    section?: string
  }[]
  adminOnly?: boolean
}

export const sidebarNavItems: SidebarNavItem[] = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard
  },
  {
    title: 'Graph',
    url: '/dashboard/graph',
    icon: Network,
    items: [
      {
        title: 'Models',
        url: '/dashboard/graph/model',
        section: 'schema'
      },
      {
        title: 'XML to Graph',
        url: '/dashboard/graph/convert',
        section: 'xml2graph'
      }
    ]
  },
  {
    title: 'Database',
    url: '/dashboard/database',
    icon: Database,
    items: [
      {
        title: 'Management',
        url: '/dashboard/database',
        section: 'database'
      },
      {
        title: 'Queries',
        url: '/dashboard/database/queries',
        section: 'queries'
      },
      {
        title: 'Analytics',
        url: '/dashboard/database/analytics',
        section: 'analytics'
      }
    ]
  },
  // {
  //   title: 'Export',
  //   url: '/dashboard/html',
  //   icon: Code,
  //   items: [
  //     {
  //       title: 'HTML Conversion',
  //       url: '/dashboard/html',
  //       section: 'html'
  //     }
  //   ]
  // },
  {
    title: 'Admin',
    url: '/dashboard/admin',
    icon: Users,
    adminOnly: true,
    items: [
      {
        title: 'Users',
        url: '/dashboard/admin/users',
        section: 'users'
      },
      {
        title: 'Saved Queries',
        url: '/dashboard/admin/queries',
        section: 'queries'
      }
    ]
  },
  {
    title: 'Settings',
    url: '/dashboard/settings',
    icon: Settings,
    adminOnly: true,
    items: [
      {
        title: 'Modules',
        url: '/dashboard/settings/modules',
        section: 'modules'
      },
      {
        title: 'AI Settings',
        url: '/dashboard/settings/ai',
        section: 'ai'
      }
    ]
  }
]

