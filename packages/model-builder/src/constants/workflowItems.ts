import {
  GitBranch,
  Repeat,
  Merge,
  Filter as FilterIcon,
  Clock,
  Calculator,
  ArrowUpDown,
  Maximize2,
  Package,
  Split,
  CheckCircle2,
  Map,
  Minus,
  Layers,
  Square,
  Link2,
  Circle,
  X,
  CheckSquare,
  Calendar,
  Boxes,
  FileText,
  Sparkles,
  Folder,
  Settings,
  SkipForward,
  Play,
  FileDown,
  Type,
  Wand2,
  Plus,
  Edit,
  Search,
  Globe,
  Key,
  RefreshCw,
  AlertTriangle,
  Zap,
  Database,
  Shield,
  Mail,
  Webhook,
  Copy,
  RotateCcw,
  Tag,
  Timer,
  Activity,
  Trash2,
  RotateCw,
  FileCheck,
  AlertCircle,
  Info
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
  'Logic & Control': {
    icon: GitBranch,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    tools: [
      { label: 'If / Else', type: 'tool:if', icon: GitBranch, description: 'Conditional branching based on element properties', color: 'text-blue-600', bgColor: 'bg-blue-50' },
      { label: 'Switch', type: 'tool:switch', icon: GitBranch, description: 'Multi-way branching based on values', color: 'text-blue-600', bgColor: 'bg-blue-50' },
      { label: 'Loop', type: 'tool:loop', icon: Repeat, description: 'Iterate over child elements', color: 'text-purple-600', bgColor: 'bg-purple-50' }
    ]
  },
  'Data Flow': {
    icon: Merge,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100',
    tools: [
      { label: 'Merge', type: 'tool:merge', icon: Merge, description: 'Combine multiple data streams', color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
      { label: 'Filter', type: 'tool:filter', icon: FilterIcon, description: 'Filter elements based on conditions', color: 'text-orange-600', bgColor: 'bg-orange-50' },
      { label: 'Split', type: 'tool:split', icon: Split, description: 'Split data into multiple streams', color: 'text-pink-600', bgColor: 'bg-pink-50' }
    ]
  },
  'Time & Delay': {
    icon: Clock,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    tools: [
      { label: 'Delay', type: 'tool:delay', icon: Clock, description: 'Add delay between processing steps', color: 'text-amber-600', bgColor: 'bg-amber-50' }
    ]
  },
  'Aggregation': {
    icon: Calculator,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    tools: [
      { label: 'Aggregate', type: 'tool:aggregate', icon: Calculator, description: 'Calculate aggregates (count, sum, avg, etc.)', color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
      { label: 'Collect', type: 'tool:collect', icon: Package, description: 'Collect elements into a list', color: 'text-teal-600', bgColor: 'bg-teal-50' },
      { label: 'Reduce', type: 'tool:reduce', icon: Minus, description: 'Reduce elements to a single value', color: 'text-red-600', bgColor: 'bg-red-50' }
    ]
  },
  'Sorting & Limiting': {
    icon: ArrowUpDown,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    tools: [
      { label: 'Sort', type: 'tool:sort', icon: ArrowUpDown, description: 'Sort elements by property', color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
      { label: 'Limit', type: 'tool:limit', icon: Maximize2, description: 'Limit number of elements processed', color: 'text-violet-600', bgColor: 'bg-violet-50' },
      { label: 'Distinct', type: 'tool:distinct', icon: CheckCircle2, description: 'Remove duplicate elements', color: 'text-green-600', bgColor: 'bg-green-50' }
    ]
  },
  'Transformation': {
    icon: Wand2,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    tools: [
      { label: 'Transform', type: 'tool:transform', icon: Wand2, description: 'Transform element properties', color: 'text-purple-600', bgColor: 'bg-purple-50' },
      { label: 'Map', type: 'tool:map', icon: Map, description: 'Apply function to each element', color: 'text-rose-600', bgColor: 'bg-rose-50' },
      { label: 'Validate', type: 'tool:validate', icon: CheckCircle2, description: 'Validate element structure', color: 'text-lime-600', bgColor: 'bg-lime-50' }
    ]
  },
  'Set Operations': {
    icon: Circle,
    color: 'text-sky-600',
    bgColor: 'bg-sky-100',
    tools: [
      { label: 'Join', type: 'tool:join', icon: Link2, description: 'Join elements from different sources', color: 'text-sky-600', bgColor: 'bg-sky-50' },
      { label: 'Union', type: 'tool:union', icon: Circle, description: 'Combine unique elements', color: 'text-blue-600', bgColor: 'bg-blue-50' },
      { label: 'Intersect', type: 'tool:intersect', icon: X, description: 'Find common elements', color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
      { label: 'Diff', type: 'tool:diff', icon: Minus, description: 'Find differences between sets', color: 'text-orange-600', bgColor: 'bg-orange-50' }
    ]
  },
  'Advanced': {
    icon: Layers,
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
    tools: [
      { label: 'Lookup', type: 'tool:lookup', icon: Search, description: 'Lookup values in reference data', color: 'text-fuchsia-600', bgColor: 'bg-fuchsia-50' },
      { label: 'Traverse', type: 'tool:traverse', icon: Layers, description: 'Traverse graph relationships', color: 'text-slate-600', bgColor: 'bg-slate-50' },
      { label: 'Partition', type: 'tool:partition', icon: Split, description: 'Partition elements into groups', color: 'text-pink-600', bgColor: 'bg-pink-50' },
      { label: 'Window', type: 'tool:window', icon: Square, description: 'Apply window functions', color: 'text-gray-600', bgColor: 'bg-gray-50' },
      { label: 'Exists', type: 'tool:exists', icon: CheckSquare, description: 'Check if element exists', color: 'text-green-600', bgColor: 'bg-green-50' },
      { label: 'Range', type: 'tool:range', icon: Calendar, description: 'Generate range of values', color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
      { label: 'Batch', type: 'tool:batch', icon: Boxes, description: 'Process elements in batches', color: 'text-amber-600', bgColor: 'bg-amber-50' }
    ]
  },
  'Research APIs': {
    icon: Globe,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    tools: [
      { label: 'Fetch API', type: 'tool:fetch-api', icon: Globe, description: 'Fetch data from research APIs (Wikidata, GND, VIAF, etc.)', color: 'text-indigo-600', bgColor: 'bg-indigo-50' }
    ]
  },
  'Authenticated APIs': {
    icon: Key,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    tools: [
      { label: 'Fetch ORCID', type: 'tool:fetch-orcid', icon: Key, description: 'Fetch researcher data from ORCID (requires credentials)', color: 'text-amber-600', bgColor: 'bg-amber-50' },
      { label: 'Fetch GeoNames', type: 'tool:fetch-geonames', icon: Globe, description: 'Fetch geographical data from GeoNames (requires credentials)', color: 'text-blue-600', bgColor: 'bg-blue-50' },
      { label: 'Fetch Europeana', type: 'tool:fetch-europeana', icon: Globe, description: 'Fetch cultural heritage data from Europeana (requires credentials)', color: 'text-purple-600', bgColor: 'bg-purple-50' },
      { label: 'Fetch Getty', type: 'tool:fetch-getty', icon: Key, description: 'Fetch vocabulary data from Getty (requires credentials)', color: 'text-orange-600', bgColor: 'bg-orange-50' }
    ]
  },
  'HTTP Requests': {
    icon: Globe,
    color: 'text-teal-600',
    bgColor: 'bg-teal-100',
    tools: [
      { label: 'HTTP Request', type: 'tool:http', icon: Globe, description: 'Make HTTP/HTTPS requests to any API endpoint with authentication', color: 'text-teal-600', bgColor: 'bg-teal-50' }
    ]
  },
  'Data Transformation': {
    icon: Wand2,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    tools: [
      { label: 'Normalize', type: 'tool:normalize', icon: Wand2, description: 'Normalize data formats (dates, numbers, text)', color: 'text-purple-600', bgColor: 'bg-purple-50' },
      { label: 'Enrich', type: 'tool:enrich', icon: Sparkles, description: 'Enrich data from multiple sources', color: 'text-pink-600', bgColor: 'bg-pink-50' },
      { label: 'Deduplicate', type: 'tool:deduplicate', icon: CheckCircle2, description: 'Advanced deduplication with fuzzy matching', color: 'text-green-600', bgColor: 'bg-green-50' },
      { label: 'Validate Schema', type: 'tool:validate-schema', icon: Shield, description: 'Validate data against schema definitions', color: 'text-blue-600', bgColor: 'bg-blue-50' },
      { label: 'Clean', type: 'tool:clean', icon: Zap, description: 'Clean data (trim, remove special chars, etc.)', color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
      { label: 'Standardize', type: 'tool:standardize', icon: Database, description: 'Standardize formats (addresses, names, etc.)', color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
      { label: 'Verify', type: 'tool:verify', icon: CheckSquare, description: 'Verify data integrity and completeness', color: 'text-emerald-600', bgColor: 'bg-emerald-50' }
    ]
  },
  'Error Handling': {
    icon: AlertTriangle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    tools: [
      { label: 'Try Catch', type: 'tool:try-catch', icon: AlertTriangle, description: 'Error handling with fallback paths', color: 'text-red-600', bgColor: 'bg-red-50' },
      { label: 'Retry', type: 'tool:retry', icon: RefreshCw, description: 'Retry failed operations with exponential backoff', color: 'text-orange-600', bgColor: 'bg-orange-50' },
      { label: 'Timeout', type: 'tool:timeout', icon: Timer, description: 'Set timeouts for operations', color: 'text-amber-600', bgColor: 'bg-amber-50' }
    ]
  },
  'Performance': {
    icon: Zap,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    tools: [
      { label: 'Cache', type: 'tool:cache', icon: Database, description: 'Cache results for repeated operations', color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
      { label: 'Parallel', type: 'tool:parallel', icon: Activity, description: 'Execute multiple operations in parallel', color: 'text-lime-600', bgColor: 'bg-lime-50' },
      { label: 'Throttle', type: 'tool:throttle', icon: Clock, description: 'Throttle API requests to respect rate limits', color: 'text-sky-600', bgColor: 'bg-sky-50' }
    ]
  },
  'Integration': {
    icon: Webhook,
    color: 'text-fuchsia-600',
    bgColor: 'bg-fuchsia-100',
    tools: [
      { label: 'Webhook', type: 'tool:webhook', icon: Webhook, description: 'Send webhooks on events', color: 'text-fuchsia-600', bgColor: 'bg-fuchsia-50' },
      { label: 'Email', type: 'tool:email', icon: Mail, description: 'Send email notifications', color: 'text-blue-600', bgColor: 'bg-blue-50' },
      { label: 'Log', type: 'tool:log', icon: FileText, description: 'Log data for debugging and auditing', color: 'text-gray-600', bgColor: 'bg-gray-50' }
    ]
  }
}

export const actionCategories = {
  'Action Groups': {
    icon: Boxes,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    actions: [
      { label: 'Action Group', type: 'action:group', icon: Boxes, description: 'Group multiple actions together', color: 'text-orange-600', bgColor: 'bg-orange-50' }
    ]
  },
  'Quick Actions': {
    icon: Sparkles,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    actions: [
      { label: 'Create Text Node', type: 'action:create-text-node', icon: FileText, description: 'Create node with text content', isQuick: true, color: 'text-blue-600', bgColor: 'bg-blue-50' },
      { label: 'Create Token Nodes', type: 'action:create-token-nodes', icon: Type, description: 'Create nodes from text tokens', isQuick: true, color: 'text-purple-600', bgColor: 'bg-purple-50' },
      { label: 'Create Node (Attributes)', type: 'action:create-node-with-attributes', icon: Settings, description: 'Create node with attributes', isQuick: true, color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
      { label: 'Create Node Complete', type: 'action:create-node-complete', icon: CheckCircle2, description: 'Create complete node with all properties', isQuick: true, color: 'text-green-600', bgColor: 'bg-green-50' },
      { label: 'Extract & Normalize Attributes', type: 'action:extract-and-normalize-attributes', icon: Settings, description: 'Extract and normalize element attributes', isQuick: true, color: 'text-teal-600', bgColor: 'bg-teal-50' },
      { label: 'Create Annotation Nodes', type: 'action:create-annotation-nodes', icon: Edit, description: 'Create annotation nodes from text', isQuick: true, color: 'text-pink-600', bgColor: 'bg-pink-50' },
      { label: 'Create Reference Chain', type: 'action:create-reference-chain', icon: Link2, description: 'Create chain of reference relationships', isQuick: true, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
      { label: 'Merge Children Text', type: 'action:merge-children-text', icon: Merge, description: 'Merge text from child elements', isQuick: true, color: 'text-rose-600', bgColor: 'bg-rose-50' },
      { label: 'Create Conditional Node', type: 'action:create-conditional-node', icon: GitBranch, description: 'Create node based on condition', isQuick: true, color: 'text-violet-600', bgColor: 'bg-violet-50' },
      { label: 'Extract & Compute Property', type: 'action:extract-and-compute-property', icon: Calculator, description: 'Extract and compute property value', isQuick: true, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
      { label: 'Create Node (Filtered Children)', type: 'action:create-node-with-filtered-children', icon: FilterIcon, description: 'Create node with filtered children', isQuick: true, color: 'text-orange-600', bgColor: 'bg-orange-50' },
      { label: 'Normalize & Deduplicate', type: 'action:normalize-and-deduplicate', icon: CheckCircle2, description: 'Normalize and remove duplicates', isQuick: true, color: 'text-lime-600', bgColor: 'bg-lime-50' },
      { label: 'Create Hierarchical Nodes', type: 'action:create-hierarchical-nodes', icon: Layers, description: 'Create hierarchical node structure', isQuick: true, color: 'text-sky-600', bgColor: 'bg-sky-50' }
    ]
  },
  'Basic Actions': {
    icon: FileText,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    actions: [
      { label: 'Create Node', type: 'action:create-node', icon: Plus, description: 'Create a new graph node', color: 'text-blue-600', bgColor: 'bg-blue-50' },
      { label: 'Create Node for Text', type: 'action:create-node-text', icon: FileText, description: 'Create node from text content', color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
      { label: 'Create Node for Tokens', type: 'action:create-node-tokens', icon: Type, description: 'Create nodes from tokens', color: 'text-purple-600', bgColor: 'bg-purple-50' },
      { label: 'Set Property', type: 'action:set-property', icon: Edit, description: 'Set node property value', color: 'text-pink-600', bgColor: 'bg-pink-50' },
      { label: 'Extract Property', type: 'action:extract-property', icon: FileDown, description: 'Extract property from element', color: 'text-teal-600', bgColor: 'bg-teal-50' }
    ]
  },
  'Relationships': {
    icon: Link2,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    actions: [
      { label: 'Create Relationship', type: 'action:create-relationship', icon: Link2, description: 'Create relationship between nodes', color: 'text-indigo-600', bgColor: 'bg-indigo-50' }
    ]
  },
  'Control': {
    icon: SkipForward,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    actions: [
      { label: 'Skip Element', type: 'action:skip', icon: SkipForward, description: 'Skip processing this element', color: 'text-red-600', bgColor: 'bg-red-50' },
      { label: 'Process Children', type: 'action:process-children', icon: Play, description: 'Process child elements', color: 'text-green-600', bgColor: 'bg-green-50' }
    ]
  },
  'Text Processing': {
    icon: Type,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    actions: [
      { label: 'Transform Text', type: 'action:transform-text', icon: Wand2, description: 'Transform text content', color: 'text-violet-600', bgColor: 'bg-violet-50' },
      { label: 'Extract Text', type: 'action:extract-text', icon: FileText, description: 'Extract text from element', color: 'text-blue-600', bgColor: 'bg-blue-50' },
      { label: 'Extract XML Content', type: 'action:extract-xml-content', icon: FileText, description: 'Extract XML content', color: 'text-cyan-600', bgColor: 'bg-cyan-50' }
    ]
  },
  'Advanced': {
    icon: Layers,
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
    actions: [
      { label: 'Create Annotation', type: 'action:create-annotation', icon: Edit, description: 'Create annotation', color: 'text-pink-600', bgColor: 'bg-pink-50' },
      { label: 'Create Reference', type: 'action:create-reference', icon: Link2, description: 'Create reference', color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
      { label: 'Defer Relationship', type: 'action:defer-relationship', icon: Link2, description: 'Defer relationship creation', color: 'text-slate-600', bgColor: 'bg-slate-50' }
    ]
  },
  'Data Manipulation': {
    icon: Copy,
    color: 'text-violet-600',
    bgColor: 'bg-violet-100',
    actions: [
      { label: 'Copy Property', type: 'action:copy-property', icon: Copy, description: 'Copy property from one node to another', color: 'text-violet-600', bgColor: 'bg-violet-50' },
      { label: 'Merge Properties', type: 'action:merge-properties', icon: Merge, description: 'Merge properties from multiple sources', color: 'text-purple-600', bgColor: 'bg-purple-50' },
      { label: 'Split Property', type: 'action:split-property', icon: Split, description: 'Split property into multiple properties', color: 'text-pink-600', bgColor: 'bg-pink-50' },
      { label: 'Format Property', type: 'action:format-property', icon: Wand2, description: 'Format property value (date, number, etc.)', color: 'text-cyan-600', bgColor: 'bg-cyan-50' }
    ]
  },
  'Relationship Management': {
    icon: Link2,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    actions: [
      { label: 'Update Relationship', type: 'action:update-relationship', icon: Edit, description: 'Update existing relationship properties', color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
      { label: 'Delete Relationship', type: 'action:delete-relationship', icon: Trash2, description: 'Delete relationships conditionally', color: 'text-red-600', bgColor: 'bg-red-50' },
      { label: 'Reverse Relationship', type: 'action:reverse-relationship', icon: RotateCcw, description: 'Reverse relationship direction', color: 'text-orange-600', bgColor: 'bg-orange-50' }
    ]
  },
  'Node Management': {
    icon: Boxes,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    actions: [
      { label: 'Update Node', type: 'action:update-node', icon: Edit, description: 'Update existing node properties', color: 'text-blue-600', bgColor: 'bg-blue-50' },
      { label: 'Delete Node', type: 'action:delete-node', icon: Trash2, description: 'Delete nodes conditionally', color: 'text-red-600', bgColor: 'bg-red-50' },
      { label: 'Clone Node', type: 'action:clone-node', icon: Copy, description: 'Clone node with modifications', color: 'text-green-600', bgColor: 'bg-green-50' },
      { label: 'Merge Nodes', type: 'action:merge-nodes', icon: Merge, description: 'Merge duplicate nodes', color: 'text-purple-600', bgColor: 'bg-purple-50' }
    ]
  },
  'Validation': {
    icon: Shield,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    actions: [
      { label: 'Validate Node', type: 'action:validate-node', icon: Shield, description: 'Validate node against schema', color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
      { label: 'Validate Relationship', type: 'action:validate-relationship', icon: Shield, description: 'Validate relationship constraints', color: 'text-green-600', bgColor: 'bg-green-50' },
      { label: 'Report Error', type: 'action:report-error', icon: AlertCircle, description: 'Report validation errors', color: 'text-red-600', bgColor: 'bg-red-50' }
    ]
  },
  'Metadata': {
    icon: Tag,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    actions: [
      { label: 'Add Metadata', type: 'action:add-metadata', icon: Tag, description: 'Add metadata to nodes/relationships', color: 'text-amber-600', bgColor: 'bg-amber-50' },
      { label: 'Tag Node', type: 'action:tag-node', icon: Tag, description: 'Add tags for categorization', color: 'text-orange-600', bgColor: 'bg-orange-50' },
      { label: 'Set Timestamp', type: 'action:set-timestamp', icon: Timer, description: 'Set creation/modification timestamps', color: 'text-slate-600', bgColor: 'bg-slate-50' }
    ]
  }
}

