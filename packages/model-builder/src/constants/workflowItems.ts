import {
  GitBranch,
  Clock,
  Globe,
  Webhook,
  Boxes,
  FileText,
  CheckCircle2,
  Type,
  Edit,
  Search,
  Trash2,
  Copy,
  Link2,
  RotateCcw,
  SkipForward,
  Merge,
  Split,
  Settings,
  Wand2,
  Calculator,
  Tag,
  Repeat
} from 'lucide-react'

export type ToolItem = {
  label: string
  type: string
  icon: typeof GitBranch
  description: string
  color?: string
  bgColor?: string
}

export type ActionItem = {
  label: string
  type: string
  icon: typeof FileText
  description: string
  isQuick?: boolean
  color?: string
  bgColor?: string
}

export const toolCategories = {
  'Control Flow': {
    icon: GitBranch,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    tools: [
      { label: 'If / Else', type: 'tool:if', icon: GitBranch, description: 'Conditional branching based on element properties', color: 'text-blue-600', bgColor: 'bg-blue-50' },
      { label: 'Switch', type: 'tool:switch', icon: GitBranch, description: 'Multi-way branching based on values', color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
      { label: 'Delay', type: 'tool:delay', icon: Clock, description: 'Add delay between processing steps', color: 'text-amber-600', bgColor: 'bg-amber-50' }
    ]
  },
  'External Services': {
    icon: Globe,
    color: 'text-teal-600',
    bgColor: 'bg-teal-100',
    tools: [
      { label: 'HTTP Request', type: 'tool:http', icon: Globe, description: 'Make HTTP/HTTPS requests to any API endpoint', color: 'text-teal-600', bgColor: 'bg-teal-50' },
      { label: 'Fetch API', type: 'tool:fetch-api', icon: Search, description: 'Fetch data from research APIs (Wikidata, etc.)', color: 'text-sky-600', bgColor: 'bg-sky-50' },
      { label: 'Webhook', type: 'tool:webhook', icon: Webhook, description: 'Send webhooks on specific workflow events', color: 'text-fuchsia-600', bgColor: 'bg-fuchsia-50' }
    ]
  }
}

export const actionCategories = {
  'Node Actions': {
    icon: Boxes,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    actions: [
      { label: 'Create Node', type: 'action:create-node-complete', icon: CheckCircle2, description: 'Create complete node with all properties', color: 'text-green-600', bgColor: 'bg-green-50' },
      { label: 'Create Text Node', type: 'action:create-text-node', icon: FileText, description: 'Create node with text content', color: 'text-blue-600', bgColor: 'bg-blue-50' },
      { label: 'Create Token Nodes', type: 'action:create-token-nodes', icon: Type, description: 'Create nodes from text tokens', color: 'text-purple-600', bgColor: 'bg-purple-50' },
      { label: 'Create Annotation Nodes', type: 'action:create-annotation-nodes', icon: Edit, description: 'Create annotation nodes from text', color: 'text-pink-600', bgColor: 'bg-pink-50' },
      { label: 'Create Deferred Node', type: 'action:create-node-with-lookup', icon: Search, description: 'Create node and link by property lookup', color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
      { label: 'Update Node', type: 'action:update-node', icon: Edit, description: 'Update existing node properties', color: 'text-blue-600', bgColor: 'bg-blue-50' },
      { label: 'Delete Node', type: 'action:delete-node', icon: Trash2, description: 'Delete nodes conditionally', color: 'text-red-600', bgColor: 'bg-red-50' },
      { label: 'Clone Node', type: 'action:clone-node', icon: Copy, description: 'Clone node with modifications', color: 'text-green-600', bgColor: 'bg-green-50' },
      { label: 'Merge Nodes', type: 'action:merge-nodes', icon: Merge, description: 'Merge duplicate nodes', color: 'text-purple-600', bgColor: 'bg-purple-50' }
    ]
  },
  'Property Actions': {
    icon: FileText,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    actions: [
      { label: 'Set Property', type: 'action:set-property', icon: Edit, description: 'Set node property value', color: 'text-pink-600', bgColor: 'bg-pink-50' },
      { label: 'Copy Property', type: 'action:copy-property', icon: Copy, description: 'Copy property from one node to another', color: 'text-violet-600', bgColor: 'bg-violet-50' },
      { label: 'Merge Properties', type: 'action:merge-properties', icon: Merge, description: 'Merge properties from multiple sources', color: 'text-purple-600', bgColor: 'bg-purple-50' },
      { label: 'Split Property', type: 'action:split-property', icon: Split, description: 'Split property into multiple properties', color: 'text-pink-600', bgColor: 'bg-pink-50' },
      { label: 'Format Property', type: 'action:format-property', icon: Wand2, description: 'Format property value (date, number, etc.)', color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
      { label: 'Extract & Compute Property', type: 'action:extract-and-compute-property', icon: Calculator, description: 'Extract and compute property value', color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
      { label: 'Extract & Normalize Attributes', type: 'action:extract-and-normalize-attributes', icon: Settings, description: 'Extract and normalize element attributes', color: 'text-teal-600', bgColor: 'bg-teal-50' }
    ]
  },
  'Relationship Actions': {
    icon: Link2,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    actions: [
      { label: 'Create Relationship', type: 'action:create-relationship', icon: Link2, description: 'Create relationship between nodes', color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
      { label: 'Defer Relationship', type: 'action:defer-relationship', icon: Link2, description: 'Defer relationship creation', color: 'text-slate-600', bgColor: 'bg-slate-50' },
      { label: 'Update Relationship', type: 'action:update-relationship', icon: Edit, description: 'Update existing relationship properties', color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
      { label: 'Delete Relationship', type: 'action:delete-relationship', icon: Trash2, description: 'Delete relationships conditionally', color: 'text-red-600', bgColor: 'bg-red-50' },
      { label: 'Reverse Relationship', type: 'action:reverse-relationship', icon: RotateCcw, description: 'Reverse relationship direction', color: 'text-orange-600', bgColor: 'bg-orange-50' },
      { label: 'Create Reference Chain', type: 'action:create-reference-chain', icon: Link2, description: 'Create chain of reference relationships', color: 'text-indigo-600', bgColor: 'bg-indigo-50' }
    ]
  },
  'Workflow & Control': {
    icon: Boxes,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    actions: [
      { label: 'Action Group', type: 'action:group', icon: Boxes, description: 'Group multiple actions together', color: 'text-orange-600', bgColor: 'bg-orange-50' },
      { label: 'Skip Element', type: 'action:skip', icon: SkipForward, description: 'Skip processing this element', color: 'text-red-600', bgColor: 'bg-red-50' },
      { label: 'Merge Children Text', type: 'action:merge-children-text', icon: Merge, description: 'Merge text from child elements', color: 'text-rose-600', bgColor: 'bg-rose-50' }
    ]
  }
}

