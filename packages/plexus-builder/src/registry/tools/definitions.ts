import { workflowRegistry } from '../workflowRegistry'
import { ToolDefinition } from '../types'
import { 
  GitBranch, 
  Clock, 
  Globe, 
  Search, 
  Webhook
} from 'lucide-react'

// Import executors
import { executeIfTool, executeSwitchTool } from '../../services/workflow/workflowExecutor/tools/controlFlowTools'
import { executeDelayTool } from '../../services/workflow/workflowExecutor/tools/dataProcessingTools'
import { executeFetchApiTool, executeHttpTool } from '../../services/workflow/workflowExecutor/tools/apiTools'
import { executeWebhookTool } from '../../services/workflow/workflowExecutor/tools/flowControlTools'

const registerTool = (def: ToolDefinition) => workflowRegistry.registerTool(def)

// Register categories
workflowRegistry.registerToolCategory({ id: 'control_flow', label: 'Control Flow', icon: GitBranch, color: 'text-blue-600', bgColor: 'bg-blue-100', order: 1 })
workflowRegistry.registerToolCategory({ id: 'external_services', label: 'External Services', icon: Globe, color: 'text-teal-600', bgColor: 'bg-teal-100', order: 2 })

// 1. If / Else
registerTool({
  id: 'tool:if',
  metadata: {
    label: 'If / Else',
    description: 'Conditional branching based on element properties',
    icon: GitBranch,
    category: 'control_flow',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    order: 1,
    hidden: false
  },
  executor: executeIfTool,
  configSchema: [
    { name: 'conditionGroups', label: 'Condition Groups', type: 'separator' }
  ],
  defaultConfig: { conditionGroups: [] }
})

// 2. Switch
registerTool({
  id: 'tool:switch',
  metadata: {
    label: 'Switch',
    description: 'Multi-way branching based on values',
    icon: GitBranch,
    category: 'control_flow',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    order: 2,
    hidden: false
  },
  executor: executeSwitchTool,
  configSchema: [
    { name: 'switchSource', label: 'Switch Source', type: 'select', options: [
      { label: 'Attribute', value: 'attribute' },
      { label: 'Element Name', value: 'elementName' },
      { label: 'Text Content', value: 'textContent' }
    ], defaultValue: 'attribute' },
    { name: 'switchAttributeName', label: 'Attribute Name', type: 'text', dependsOn: 'switchSource', dependsOnValue: 'attribute' }
  ],
  defaultConfig: { switchSource: 'attribute', switchAttributeName: '', switchCases: [] }
})

// 2. Delay
registerTool({
  id: 'tool:delay',
  metadata: {
    label: 'Delay',
    description: 'Add delay between processing steps',
    icon: Clock,
    category: 'control_flow',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    order: 3,
    hidden: false
  },
  executor: executeDelayTool,
  configSchema: [
    { name: 'delayMs', label: 'Delay (milliseconds)', type: 'number', defaultValue: 0 }
  ],
  defaultConfig: { delayMs: 0 }
})

// 3. HTTP Request
registerTool({
  id: 'tool:http',
  metadata: {
    label: 'HTTP Request',
    description: 'Make HTTP/HTTPS requests to any API endpoint',
    icon: Globe,
    category: 'external_services',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
    isApiTool: true,
    order: 1,
    hidden: false
  },
  executor: executeHttpTool,
  configSchema: [
    { 
      name: 'method', 
      label: 'Method', 
      type: 'select', 
      options: [
        { label: 'GET', value: 'GET' },
        { label: 'POST', value: 'POST' },
        { label: 'PUT', value: 'PUT' },
        { label: 'DELETE', value: 'DELETE' }
      ],
      defaultValue: 'GET'
    },
    { name: 'url', label: 'URL', type: 'text', placeholder: 'https://api.example.com/data' },
    { 
      name: 'authType', 
      label: 'Auth Type', 
      type: 'select', 
      options: [
        { label: 'None', value: 'none' },
        { label: 'Bearer Token', value: 'bearer' },
        { label: 'Basic Auth', value: 'basic' },
        { label: 'API Key', value: 'apiKey' }
      ],
      defaultValue: 'none'
    },
    { name: 'bearerToken', label: 'Token', type: 'text', dependsOn: 'authType', dependsOnValue: 'bearer' },
    { name: 'storeInContext', label: 'Store in Context Key', type: 'text', defaultValue: 'httpResponse' }
  ],
  defaultConfig: { method: 'GET', url: '', authType: 'none', headers: [], queryParams: [], storeInContext: 'httpResponse' }
})

// 4. Fetch API (Wikidata, etc.)
registerTool({
  id: 'tool:fetch-api',
  metadata: {
    label: 'Fetch API',
    description: 'Fetch data from research APIs (Wikidata, etc.)',
    icon: Search,
    category: 'external_services',
    color: 'text-sky-600',
    bgColor: 'bg-sky-50',
    isApiTool: true,
    order: 2,
    hidden: false
  },
  executor: executeFetchApiTool,
  configSchema: [
    { 
      name: 'apiProvider', 
      label: 'API Provider', 
      type: 'select', 
      options: [
        { label: 'Wikidata', value: 'wikidata' },
        { label: 'ORCID', value: 'orcid' },
        { label: 'GeoNames', value: 'geonames' }
      ],
      defaultValue: 'wikidata'
    },
    { 
      name: 'idSource', 
      label: 'ID Source', 
      type: 'select', 
      options: [
        { label: 'Attribute', value: 'attribute' },
        { label: 'Text Content', value: 'textContent' }
      ],
      defaultValue: 'attribute'
    },
    { name: 'idAttribute', label: 'Attribute Name', type: 'text', dependsOn: 'idSource', dependsOnValue: 'attribute' }
  ],
  defaultConfig: { apiProvider: 'wikidata', idSource: 'attribute', idAttribute: 'wiki:id', timeout: 10000 }
})

// 6. Webhook
registerTool({
  id: 'tool:webhook',
  metadata: {
    label: 'Webhook',
    description: 'Send webhooks on specific workflow events',
    icon: Webhook,
    category: 'external_services',
    color: 'text-fuchsia-600',
    bgColor: 'bg-fuchsia-50',
    order: 3,
    hidden: false
  },
  executor: executeWebhookTool,
  configSchema: [
    { name: 'url', label: 'Webhook URL', type: 'text', placeholder: 'https://hooks.example.com/...' },
    { name: 'method', label: 'Method', type: 'select', options: [
      { label: 'POST', value: 'POST' },
      { label: 'PUT', value: 'PUT' },
      { label: 'GET', value: 'GET' }
    ], defaultValue: 'POST' }
  ],
  defaultConfig: { url: '', method: 'POST', headers: [], authType: 'none' }
})

// 7. Authenticated Research APIs
const researchApis = [
  { id: 'tool:fetch-orcid', label: 'Fetch ORCID', provider: 'orcid' },
  { id: 'tool:fetch-geonames', label: 'Fetch GeoNames', provider: 'geonames' },
  { id: 'tool:fetch-europeana', label: 'Fetch Europeana', provider: 'europeana' },
  { id: 'tool:fetch-getty', label: 'Fetch Getty TGN', provider: 'getty' }
]

researchApis.forEach(api => {
  registerTool({
    id: api.id,
    metadata: {
      label: api.label,
      description: `Fetch data from ${api.label} research API`,
      icon: Search,
      category: 'external_services',
      color: 'text-sky-600',
      bgColor: 'bg-sky-50',
      isApiTool: true,
      hidden: false
    },
    executor: executeFetchApiTool,
    configSchema: [
      { name: 'idSource', label: 'ID Source', type: 'select', options: [
        { label: 'Attribute', value: 'attribute' },
        { label: 'Text Content', value: 'textContent' }
      ], defaultValue: 'attribute' },
      { name: 'idAttribute', label: 'Attribute Name', type: 'text', dependsOn: 'idSource', dependsOnValue: 'attribute' }
    ],
    defaultConfig: { apiProvider: api.provider, idSource: 'attribute', idAttribute: 'id', timeout: 10000 }
  })
})
