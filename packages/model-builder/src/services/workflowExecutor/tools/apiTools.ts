import type { ToolCanvasNode } from '../../../stores/toolCanvasStore'
import type { ExecutionContext } from '../types'
import type { ToolExecutor } from './types'
import { fetchFromApi, extractIdFromElement, type ApiProvider } from '../../apiClient'

export const executeFetchApiTool: ToolExecutor = (tool: ToolCanvasNode, ctx: ExecutionContext) => {
  const provider = (tool.config.apiProvider as ApiProvider) || 'wikidata'
  const idSource = (tool.config.idSource as 'attribute' | 'textContent' | 'xpath') || 'attribute'
  const idAttribute = tool.config.idAttribute as string | undefined
  const idXpath = tool.config.idXpath as string | undefined
  const apiKey = tool.config.apiKey as string | undefined
  const customEndpoint = tool.config.customEndpoint as string | undefined
  const customHeaders = tool.config.customHeaders as Record<string, string> | undefined
  const timeout = (tool.config.timeout as number) || 10000
  const storeInContext = (tool.config.storeInContext as string) || provider

  const id = extractIdFromElement(ctx.xmlElement, idSource, idAttribute, idXpath)
  
  if (!id) {
    console.warn(`[Fetch API Tool] No ID found for provider ${provider}`)
    return { result: false }
  }

  if (!ctx.apiData) {
    ctx.apiData = {}
  }

  fetchFromApi({
    provider: provider === 'custom' ? 'custom' : provider,
    id,
    apiKey,
    customEndpoint,
    customHeaders,
    timeout
  }).then(response => {
    if (response.success && response.data) {
      if (ctx.apiData) {
        ctx.apiData[storeInContext] = response.data
      }
    } else {
      console.warn(`[Fetch API Tool] API request failed: ${response.error}`)
    }
  }).catch(error => {
    console.error(`[Fetch API Tool] Error:`, error)
  })

  return { result: true }
}

export const executeAuthenticatedApiTool: ToolExecutor = (tool: ToolCanvasNode, ctx: ExecutionContext) => {
  const providerMap: Record<string, ApiProvider> = {
    'tool:fetch-orcid': 'orcid',
    'tool:fetch-geonames': 'geonames',
    'tool:fetch-europeana': 'europeana',
    'tool:fetch-getty': 'getty'
  }
  
  const provider = providerMap[tool.type] || 'orcid'
  const idSource = (tool.config.idSource as 'attribute' | 'textContent' | 'xpath') || 'attribute'
  const idAttribute = tool.config.idAttribute as string | undefined
  const idXpath = tool.config.idXpath as string | undefined
  const credentialId = tool.config.credentialId as string | undefined
  const timeout = (tool.config.timeout as number) || 10000
  const storeInContext = (tool.config.storeInContext as string) || provider

  if (!credentialId) {
    console.warn(`[Authenticated API Tool] No credential ID configured for ${provider}`)
    return { result: false }
  }

  const id = extractIdFromElement(ctx.xmlElement, idSource, idAttribute, idXpath)
  
  if (!id) {
    console.warn(`[Authenticated API Tool] No ID found for provider ${provider}`)
    return { result: false }
  }

  if (!ctx.apiData) {
    ctx.apiData = {}
  }

  fetchFromApi({
    provider,
    id,
    credentialId,
    timeout
  }, () => {
    return undefined
  }).then(response => {
    if (response.success && response.data) {
      if (ctx.apiData) {
        ctx.apiData[storeInContext] = response.data
      }
    } else {
      console.warn(`[Authenticated API Tool] API request failed: ${response.error}`)
    }
  }).catch(error => {
    console.error(`[Authenticated API Tool] Error:`, error)
  })

  return { result: true }
}

export const executeHttpTool: ToolExecutor = (tool: ToolCanvasNode, ctx: ExecutionContext) => {
  const method = (tool.config.method as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH') || 'GET'
  const url = (tool.config.url as string) || ''
  const useCredential = (tool.config.useCredential as boolean) || false
  const credentialId = tool.config.credentialId as string | undefined
  const authType = (tool.config.authType as 'none' | 'bearer' | 'basic' | 'apiKey' | 'custom') || 'none'
  const apiKey = tool.config.apiKey as string | undefined
  const apiKeyHeader = (tool.config.apiKeyHeader as string) || 'X-API-Key'
  const bearerToken = tool.config.bearerToken as string | undefined
  const basicUsername = tool.config.basicUsername as string | undefined
  const basicPassword = tool.config.basicPassword as string | undefined
  const customHeaderName = tool.config.customHeaderName as string | undefined
  const customHeaderValue = tool.config.customHeaderValue as string | undefined
  const headers = (tool.config.headers as Array<{ key: string; value: string }>) || []
  const queryParams = (tool.config.queryParams as Array<{ key: string; value: string }>) || []
  const body = tool.config.body as string | undefined
  const bodyType = (tool.config.bodyType as 'json' | 'text' | 'form-data' | 'x-www-form-urlencoded') || 'json'
  const timeout = (tool.config.timeout as number) || 10000
  const storeInContext = (tool.config.storeInContext as string) || 'httpResponse'

  if (!url || url.trim() === '') {
    console.warn('[HTTP Tool] No URL configured')
    return { result: false }
  }

  if (!ctx.apiData) {
    ctx.apiData = {}
  }

  let fullUrl = url.trim()
  if (queryParams.length > 0) {
    const params = queryParams
      .filter(p => p.key && p.value)
      .map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
      .join('&')
    if (params) {
      fullUrl += (fullUrl.includes('?') ? '&' : '?') + params
    }
  }

  const requestHeaders: Record<string, string> = {
    'Accept': 'application/json'
  }

  if (useCredential && credentialId) {
    console.warn('[HTTP Tool] Credential-based auth requires credentials to be passed in ExecuteOptions')
  } else {
    if (authType === 'bearer' && bearerToken) {
      requestHeaders['Authorization'] = `Bearer ${bearerToken}`
    } else if (authType === 'basic' && basicUsername) {
      const basicAuth = btoa(`${basicUsername}:${basicPassword || ''}`)
      requestHeaders['Authorization'] = `Basic ${basicAuth}`
    } else if (authType === 'apiKey' && apiKey) {
      requestHeaders[apiKeyHeader] = apiKey
    } else if (authType === 'custom' && customHeaderName) {
      requestHeaders[customHeaderName] = customHeaderValue || ''
    }
  }

  headers.forEach(header => {
    if (header.key && header.value) {
      requestHeaders[header.key] = header.value
    }
  })

  let requestBody: string | undefined
  if (['POST', 'PUT', 'PATCH'].includes(method) && body) {
    requestBody = body
    if (bodyType === 'json') {
      requestHeaders['Content-Type'] = 'application/json'
    } else if (bodyType === 'text') {
      requestHeaders['Content-Type'] = 'text/plain'
    } else if (bodyType === 'x-www-form-urlencoded') {
      requestHeaders['Content-Type'] = 'application/x-www-form-urlencoded'
    }
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  fetch(fullUrl, {
    method,
    headers: requestHeaders,
    body: requestBody,
    signal: controller.signal
  }).then(async response => {
    clearTimeout(timeoutId)
    const responseText = await response.text()
    let responseData: unknown

    try {
      responseData = JSON.parse(responseText)
    } catch {
      responseData = responseText
    }

    if (ctx.apiData) {
      ctx.apiData[storeInContext] = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: responseData
      }
    }
  }).catch(error => {
    clearTimeout(timeoutId)
    console.error('[HTTP Tool] Error:', error)
    if (ctx.apiData) {
      ctx.apiData[storeInContext] = {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })

  return { result: true }
}

