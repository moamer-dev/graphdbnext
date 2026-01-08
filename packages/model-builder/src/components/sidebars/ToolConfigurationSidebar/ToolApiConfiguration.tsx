'use client'

import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../ui/select'
import { CollapsibleSection } from '../../shared/CollapsibleSection'
import { HelpTooltip } from '../../shared/HelpTooltip'
import type { ToolCanvasNode } from '../../../stores/toolCanvasStore'
import { useToolConfigurationStore } from '../../../stores/toolConfigurationStore'

type StoreState = ReturnType<typeof useToolConfigurationStore>

interface FetchApiConfig {
  apiProvider: string
  idSource: 'attribute' | 'textContent' | 'xpath'
  idAttribute?: string
  idXpath?: string
  apiKey?: string
  customEndpoint?: string
  timeout?: number
  storeInContext?: string
}

interface AuthenticatedApiConfig {
  credentialId: string
  idSource: 'attribute' | 'textContent' | 'xpath'
  idAttribute?: string
  idXpath?: string
  timeout?: number
  storeInContext?: string
}

interface HttpConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  url: string
  useCredential?: boolean
  credentialId?: string
  authType?: 'none' | 'bearer' | 'basic' | 'apiKey' | 'custom'
  apiKey?: string
  apiKeyHeader?: string
  bearerToken?: string
  basicUsername?: string
  basicPassword?: string
  customHeaderName?: string
  customHeaderValue?: string
  headers?: Array<{ id: string; key: string; value: string }>
  queryParams?: Array<{ id: string; key: string; value: string }>
  body?: string
  bodyType?: 'json' | 'text' | 'form-data' | 'x-www-form-urlencoded'
  timeout?: number
  storeInContext?: string
}

interface ToolApiConfigurationProps {
  toolNodeType: string
  toolNodeId: string
  toolNode: ToolCanvasNode | null
  fetchApiConfig: FetchApiConfig
  authenticatedApiConfig: AuthenticatedApiConfig
  httpConfig: HttpConfig
  onFetchApiConfigChange: (config: FetchApiConfig) => void
  onAuthenticatedApiConfigChange: (config: AuthenticatedApiConfig) => void
  onHttpConfigChange: (config: HttpConfig) => void
  onUpdateToolNode: (id: string, updates: Partial<ToolCanvasNode>) => void
  getCredentialsByType: (type: string) => Array<{ id: string; name: string }>
  getCredential: (id: string) => { id: string; name: string } | undefined
}

export function ToolApiConfiguration({
  toolNodeType,
  toolNodeId,
  toolNode,
  fetchApiConfig,
  authenticatedApiConfig,
  httpConfig,
  onFetchApiConfigChange,
  onAuthenticatedApiConfigChange,
  onHttpConfigChange,
  onUpdateToolNode,
  getCredentialsByType,
  getCredential
}: ToolApiConfigurationProps) {
  const isFetchApi = toolNodeType === 'tool:fetch-api'
  const isAuthenticatedApi = ['tool:fetch-orcid', 'tool:fetch-geonames', 'tool:fetch-europeana', 'tool:fetch-getty'].includes(toolNodeType)
  const isHttp = toolNodeType === 'tool:http'

  const getProviderType = () => {
    if (toolNodeType === 'tool:fetch-orcid') return 'orcid'
    if (toolNodeType === 'tool:fetch-geonames') return 'geonames'
    if (toolNodeType === 'tool:fetch-europeana') return 'europeana'
    if (toolNodeType === 'tool:fetch-getty') return 'getty'
    return 'orcid'
  }

  if (isFetchApi) {
    return (
      <CollapsibleSection title="Fetch API Configuration" defaultOpen={true}>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-xs font-medium">API Provider</Label>
              <HelpTooltip content="Select the research API provider to fetch data from. Each provider has different data formats and requirements." />
            </div>
            <Select
              value={fetchApiConfig.apiProvider}
              onValueChange={(value) => {
                const updated = { ...fetchApiConfig, apiProvider: value }
                onFetchApiConfigChange(updated)
                onUpdateToolNode(toolNodeId, {
                  config: { ...toolNode?.config, apiProvider: value }
                })
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="wikidata">Wikidata</SelectItem>
                <SelectItem value="gnd">GND (German Authority File)</SelectItem>
                <SelectItem value="viaf">VIAF (Virtual International Authority File)</SelectItem>
                <SelectItem value="orcid">ORCID (Researcher IDs)</SelectItem>
                <SelectItem value="geonames">GeoNames (Geographical Data)</SelectItem>
                <SelectItem value="dblp">DBLP (Computer Science Bibliography)</SelectItem>
                <SelectItem value="crossref">CrossRef (Academic Publications)</SelectItem>
                <SelectItem value="europeana">Europeana (Cultural Heritage)</SelectItem>
                <SelectItem value="getty">Getty Vocabularies</SelectItem>
                <SelectItem value="loc">Library of Congress</SelectItem>
                <SelectItem value="custom">Custom API</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium">ID Source</Label>
            <Select
              value={fetchApiConfig.idSource}
              onValueChange={(value) => {
                const updated = { ...fetchApiConfig, idSource: value as 'attribute' | 'textContent' | 'xpath' }
                onFetchApiConfigChange(updated)
                onUpdateToolNode(toolNodeId, {
                  config: { ...toolNode?.config, idSource: value }
                })
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="attribute">XML Attribute</SelectItem>
                <SelectItem value="textContent">Element Text Content</SelectItem>
                <SelectItem value="xpath">XPath Expression</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {fetchApiConfig.idSource === 'attribute' && (
            <div className="space-y-2">
              <Label className="text-xs font-medium">ID Attribute Name</Label>
              <Input
                placeholder="e.g., wiki:id, gnd:id, viaf:id"
                className="h-8 text-xs"
                value={fetchApiConfig.idAttribute || ''}
                onChange={(e) => {
                  const updated = { ...fetchApiConfig, idAttribute: e.target.value }
                  onFetchApiConfigChange(updated)
                  onUpdateToolNode(toolNodeId, {
                    config: { ...toolNode?.config, idAttribute: e.target.value }
                  })
                }}
              />
              <div className="text-[10px] text-muted-foreground">
                The XML attribute name containing the API ID (e.g., wiki:id=&quot;Q42&quot;)
              </div>
            </div>
          )}

          {fetchApiConfig.idSource === 'xpath' && (
            <div className="space-y-2">
              <Label className="text-xs font-medium">XPath Expression</Label>
              <Input
                placeholder="e.g., @wiki:id or ./@id"
                className="h-8 text-xs"
                value={fetchApiConfig.idXpath || ''}
                onChange={(e) => {
                  const updated = { ...fetchApiConfig, idXpath: e.target.value }
                  onFetchApiConfigChange(updated)
                  onUpdateToolNode(toolNodeId, {
                    config: { ...toolNode?.config, idXpath: e.target.value }
                  })
                }}
              />
              <div className="text-[10px] text-muted-foreground">
                XPath expression to extract the ID (limited support)
              </div>
            </div>
          )}

          {(fetchApiConfig.apiProvider === 'custom' || ['europeana', 'orcid', 'geonames'].includes(fetchApiConfig.apiProvider)) && (
            <div className="space-y-2">
              <Label className="text-xs font-medium">
                {fetchApiConfig.apiProvider === 'custom' ? 'Custom Endpoint URL' : 'API Key'}
              </Label>
              <Input
                type={fetchApiConfig.apiProvider === 'custom' ? 'text' : 'password'}
                placeholder={
                  fetchApiConfig.apiProvider === 'custom' 
                    ? 'https://api.example.com/endpoint/{id}'
                    : 'Enter API key'
                }
                className="h-8 text-xs"
                value={fetchApiConfig.apiProvider === 'custom' ? (fetchApiConfig.customEndpoint || '') : (fetchApiConfig.apiKey || '')}
                onChange={(e) => {
                  const updated = fetchApiConfig.apiProvider === 'custom'
                    ? { ...fetchApiConfig, customEndpoint: e.target.value }
                    : { ...fetchApiConfig, apiKey: e.target.value }
                  onFetchApiConfigChange(updated)
                  onUpdateToolNode(toolNodeId, {
                    config: { ...toolNode?.config, [fetchApiConfig.apiProvider === 'custom' ? 'customEndpoint' : 'apiKey']: e.target.value }
                  })
                }}
              />
              <div className="text-[10px] text-muted-foreground">
                {fetchApiConfig.apiProvider === 'custom' 
                  ? 'Use {id} placeholder for the extracted ID'
                  : 'Required for this API provider'}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs font-medium">Request Timeout (ms)</Label>
            <Input
              type="number"
              placeholder="10000"
              className="h-8 text-xs"
                value={fetchApiConfig.timeout || 10000}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 10000
                const updated = { ...fetchApiConfig, timeout: value }
                onFetchApiConfigChange(updated)
                onUpdateToolNode(toolNodeId, {
                  config: { ...toolNode?.config, timeout: value }
                })
              }}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium">Store in Context Key</Label>
            <Input
              placeholder="Leave empty to use provider name"
              className="h-8 text-xs"
              value={fetchApiConfig.storeInContext || ''}
              onChange={(e) => {
                const updated = { ...fetchApiConfig, storeInContext: e.target.value }
                onFetchApiConfigChange(updated)
                onUpdateToolNode(toolNodeId, {
                  config: { ...toolNode?.config, storeInContext: e.target.value }
                })
              }}
            />
            <div className="text-[10px] text-muted-foreground">
              Key to store API response in context (accessible in actions via ctx.apiData[key])
            </div>
          </div>
        </div>
      </CollapsibleSection>
    )
  }

  if (isAuthenticatedApi) {
    const providerType = getProviderType()
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium">Credential</Label>
          <Select
            value={authenticatedApiConfig.credentialId}
            onValueChange={(value) => {
              const updated = { ...authenticatedApiConfig, credentialId: value }
              onAuthenticatedApiConfigChange(updated)
              onUpdateToolNode(toolNodeId, {
                config: { ...toolNode?.config, credentialId: value }
              })
            }}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select credential..." />
            </SelectTrigger>
            <SelectContent>
              {getCredentialsByType(providerType).map((cred) => (
                <SelectItem key={cred.id} value={cred.id}>
                  {cred.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="text-[10px] text-muted-foreground">
            {authenticatedApiConfig.credentialId 
              ? `Using credential: ${getCredential(authenticatedApiConfig.credentialId)?.name || 'Unknown'}`
              : `No ${providerType} credentials found. Create one in Settings.`}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium">ID Source</Label>
          <Select
            value={authenticatedApiConfig.idSource}
            onValueChange={(value) => {
              const updated = { ...authenticatedApiConfig, idSource: value as 'attribute' | 'textContent' | 'xpath' }
              onAuthenticatedApiConfigChange(updated)
              onUpdateToolNode(toolNodeId, {
                config: { ...toolNode?.config, idSource: value }
              })
            }}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="attribute">XML Attribute</SelectItem>
              <SelectItem value="textContent">Element Text Content</SelectItem>
              <SelectItem value="xpath">XPath Expression</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {authenticatedApiConfig.idSource === 'attribute' && (
          <div className="space-y-2">
            <Label className="text-xs font-medium">ID Attribute Name</Label>
            <Input
              placeholder={
                toolNodeType === 'tool:fetch-orcid' ? 'orcid:id' :
                toolNodeType === 'tool:fetch-geonames' ? 'geoname:id' :
                toolNodeType === 'tool:fetch-europeana' ? 'europeana:id' :
                'getty:id'
              }
              className="h-8 text-xs"
              value={authenticatedApiConfig.idAttribute || ''}
              onChange={(e) => {
                const updated = { ...authenticatedApiConfig, idAttribute: e.target.value }
                onAuthenticatedApiConfigChange(updated)
                onUpdateToolNode(toolNodeId, {
                  config: { ...toolNode?.config, idAttribute: e.target.value }
                })
              }}
            />
          </div>
        )}

        {authenticatedApiConfig.idSource === 'xpath' && (
          <div className="space-y-2">
            <Label className="text-xs font-medium">XPath Expression</Label>
            <Input
              placeholder="e.g., @orcid:id or ./@id"
              className="h-8 text-xs"
              value={authenticatedApiConfig.idXpath || ''}
              onChange={(e) => {
                const updated = { ...authenticatedApiConfig, idXpath: e.target.value }
                onAuthenticatedApiConfigChange(updated)
                onUpdateToolNode(toolNodeId, {
                  config: { ...toolNode?.config, idXpath: e.target.value }
                })
              }}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-xs font-medium">Request Timeout (ms)</Label>
          <Input
            type="number"
            placeholder="10000"
            className="h-8 text-xs"
            value={authenticatedApiConfig.timeout || 10000}
            onChange={(e) => {
              const value = parseInt(e.target.value) || 10000
              const updated = { ...authenticatedApiConfig, timeout: value }
              onAuthenticatedApiConfigChange(updated)
              onUpdateToolNode(toolNodeId, {
                config: { ...toolNode?.config, timeout: value }
              })
            }}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium">Store in Context Key</Label>
          <Input
            placeholder="Leave empty to use provider name"
            className="h-8 text-xs"
            value={authenticatedApiConfig.storeInContext || ''}
            onChange={(e) => {
              const updated = { ...authenticatedApiConfig, storeInContext: e.target.value }
              onAuthenticatedApiConfigChange(updated)
              onUpdateToolNode(toolNodeId, {
                config: { ...toolNode?.config, storeInContext: e.target.value }
              })
            }}
          />
        </div>
      </div>
    )
  }

  if (isHttp) {
    return (
      <CollapsibleSection title="HTTP Configuration" defaultOpen={true}>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-medium">URL</Label>
            <Input
              placeholder="https://api.example.com/endpoint"
              className="h-8 text-xs"
              value={httpConfig.url}
              onChange={(e) => {
                const updated = { ...httpConfig, url: e.target.value }
                onHttpConfigChange(updated)
                onUpdateToolNode(toolNodeId, {
                  config: { ...toolNode?.config, url: e.target.value }
                })
              }}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium">Method</Label>
            <Select
                value={httpConfig.method || 'POST'}
              onValueChange={(value) => {
                const updated = { ...httpConfig, method: value as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' }
                onHttpConfigChange(updated)
                onUpdateToolNode(toolNodeId, {
                  config: { ...toolNode?.config, method: value }
                })
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium">Payload (JSON)</Label>
            <textarea
              className="w-full h-24 text-xs font-mono p-2 border rounded"
              placeholder='{"event": "workflow_completed", "data": {...}}'
              value={typeof httpConfig.body === 'string' ? httpConfig.body : JSON.stringify(httpConfig.body || {}, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value)
                  const updated = { ...httpConfig, body: e.target.value }
                  onHttpConfigChange(updated)
                  onUpdateToolNode(toolNodeId, {
                    config: { ...toolNode?.config, body: parsed }
                  })
                } catch {
                  // Invalid JSON, store as string
                  const updated = { ...httpConfig, body: e.target.value }
                  onHttpConfigChange(updated)
                  onUpdateToolNode(toolNodeId, {
                    config: { ...toolNode?.config, body: e.target.value }
                  })
                }
              }}
            />
          </div>
        </div>
      </CollapsibleSection>
    )
  }

  return null
}

