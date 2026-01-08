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
    FileDown,
    type LucideIcon
} from 'lucide-react'
import { downloadTemplate } from '@/lib/utils/downloadTemplate'

export interface QuickActionItem {
    label: string
    href?: string
    onClick?: () => void
    icon: LucideIcon
    description: string
}

export interface QuickActionGroup {
    title: string
    description: string
    icon: LucideIcon
    items: QuickActionItem[]
}

export const quickActionNavItems: QuickActionGroup[] = [
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
