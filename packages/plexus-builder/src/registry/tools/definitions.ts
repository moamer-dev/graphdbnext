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
  configSchema: [],
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
      group: 'Request Configuration',
      options: [
        { label: 'GET', value: 'GET' },
        { label: 'POST', value: 'POST' },
        { label: 'PUT', value: 'PUT' },
        { label: 'PATCH', value: 'PATCH' },
        { label: 'DELETE', value: 'DELETE' }
      ],
      defaultValue: 'GET'
    },
    { name: 'url', label: 'URL', type: 'text', group: 'Request Configuration', placeholder: 'https://api.example.com/data' },
    { name: 'useCredential', label: 'Use Stored Credential', type: 'boolean', group: 'Authentication', defaultValue: false },
    { 
      name: 'credentialId', 
      label: 'Credential', 
      type: 'credential', 
      group: 'Authentication',
      dependsOn: 'useCredential', 
      dependsOnValue: true,
      description: 'Select a stored credential for automated authentication'
    },
    { 
      name: 'authType', 
      label: 'Manual Auth Type', 
      type: 'select', 
      group: 'Authentication',
      dependsOn: 'useCredential',
      dependsOnValue: false,
      options: [
        { label: 'None', value: 'none' },
        { label: 'Bearer Token', value: 'bearer' },
        { label: 'Basic Auth', value: 'basic' },
        { label: 'API Key', value: 'apiKey' }
      ],
      defaultValue: 'none'
    },
    // Manual Auth Fields
    { name: 'bearerToken', label: 'Token', type: 'text', group: 'Authentication', dependsOn: 'authType', dependsOnValue: 'bearer' },
    { name: 'basicUsername', label: 'Username', type: 'text', group: 'Authentication', dependsOn: 'authType', dependsOnValue: 'basic' },
    { name: 'basicPassword', label: 'Password', type: 'text', group: 'Authentication', dependsOn: 'authType', dependsOnValue: 'basic' },
    { name: 'apiKey', label: 'API Key', type: 'text', group: 'Authentication', dependsOn: 'authType', dependsOnValue: 'apiKey' },
    { name: 'apiKeyHeader', label: 'Header Name', type: 'text', group: 'Authentication', dependsOn: 'authType', dependsOnValue: 'apiKey', placeholder: 'X-API-Key' },
    
    { name: 'queryParams', label: 'Query Parameters', type: 'properties', group: 'Payload & Parameters' },
    { name: 'headers', label: 'Custom Headers', type: 'properties', group: 'Payload & Parameters' },
    
    { 
      name: 'bodyType', 
      label: 'Body Type', 
      type: 'select', 
      group: 'Payload & Parameters',
      options: [
        { label: 'JSON', value: 'json' },
        { label: 'Text', value: 'text' },
        { label: 'Form Data', value: 'form-data' },
        { label: 'URL Encoded', value: 'x-www-form-urlencoded' }
      ],
      defaultValue: 'json',
      dependsOn: 'method',
      dependsOnValue: ['POST', 'PUT', 'PATCH']
    },
    { 
      name: 'body', 
      label: 'Request Body', 
      type: 'textarea', 
      group: 'Payload & Parameters',
      dependsOn: 'method',
      dependsOnValue: ['POST', 'PUT', 'PATCH'],
      placeholder: '{"key": "value"}'
    },
    { name: 'timeout', label: 'Timeout (ms)', type: 'number', group: 'Request Configuration', defaultValue: 10000 }
  ],
  defaultConfig: { method: 'GET', url: '', useCredential: false, authType: 'none', headers: [], queryParams: [], outputAlias: 'httpResponse', timeout: 10000 }
})

// 4. Fetch API (Wikidata, ORCID, GND, etc.)
registerTool({
  id: 'tool:fetch-api',
  metadata: {
    label: 'Fetch API',
    description: 'Fetch data from research and authority APIs',
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
      group: 'Provider Settings',
      options: [
        { label: 'Wikidata', value: 'wikidata' },
        { label: 'GND (German Authority)', value: 'gnd' },
        { label: 'VIAF (International Authority)', value: 'viaf' },
        { label: 'ORCID (Researcher IDs)', value: 'orcid' },
        { label: 'GeoNames (Geographical)', value: 'geonames' },
        { label: 'DBLP (Comp. Science)', value: 'dblp' },
        { label: 'CrossRef (Academic Pubs)', value: 'crossref' },
        { label: 'Europeana (Cultural Heritage)', value: 'europeana' },
        { label: 'Getty Vocabularies', value: 'getty' },
        { label: 'Library of Congress', value: 'loc' },
        { label: 'Custom API', value: 'custom' }
      ],
      defaultValue: 'wikidata'
    },
    { 
      name: 'credentialId', 
      label: 'Credential', 
      type: 'credential', 
      group: 'Provider Settings',
      dependsOn: 'apiProvider', 
      dependsOnValue: ['orcid', 'geonames', 'europeana', 'getty'],
      description: 'Select credentials for authenticated access'
    },
    { 
      name: 'apiKey', 
      label: 'API Key', 
      type: 'text', 
      group: 'Provider Settings',
      dependsOn: 'apiProvider', 
      dependsOnValue: ['orcid', 'geonames', 'europeana', 'getty'],
      description: 'Optional API key for higher rate limits or private data'
    },
    { 
      name: 'customEndpoint', 
      label: 'Custom Endpoint URL', 
      type: 'text', 
      group: 'Provider Settings',
      dependsOn: 'apiProvider', 
      dependsOnValue: 'custom',
      placeholder: 'https://api.example.com/data/{id}',
      description: 'Use {id} as a placeholder for the extracted identifier'
    },
    { 
      name: 'idSource', 
      label: 'ID Source', 
      type: 'select', 
      group: 'Identifier Extraction',
      options: [
        { label: 'XML Attribute', value: 'attribute' },
        { label: 'Text Content', value: 'textContent' },
        { label: 'XPath', value: 'xpath' }
      ],
      defaultValue: 'attribute'
    },
    { name: 'idAttribute', label: 'Attribute Name', type: 'text', group: 'Identifier Extraction', dependsOn: 'idSource', dependsOnValue: 'attribute', placeholder: 'e.g. wiki:id' },
    { name: 'idXpath', label: 'XPath Expression', type: 'text', group: 'Identifier Extraction', dependsOn: 'idSource', dependsOnValue: 'xpath', placeholder: 'e.g. ./@id' },
    { name: 'timeout', label: 'Timeout (ms)', type: 'number', group: 'Provider Settings', defaultValue: 10000 }
  ],
  defaultConfig: { 
    apiProvider: 'wikidata', 
    idSource: 'attribute', 
    idAttribute: 'wiki:id', 
    timeout: 10000,
    outputAlias: ''
  }
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

// Removed separate tool registrations as they are now consolidated in tool:fetch-api

