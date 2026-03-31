import type { ToolCanvasNode } from '../../../../stores/toolCanvasStore'
import type { ExecutionContext } from '../types'
import type { ToolExecutor } from './types'
import { fetchFromApi, extractIdFromElement, type ApiProvider } from '../../../apiClient'
import { useCredentialsStore } from '../../../../stores/credentialsStore'

export const executeFetchApiTool: ToolExecutor = async (tool: ToolCanvasNode, ctx: ExecutionContext) => {
  const provider = (tool.config.apiProvider as ApiProvider) || 'wikidata'
  const idSource = (tool.config.idSource as 'attribute' | 'textContent' | 'xpath') || 'attribute'
  const idAttribute = tool.config.idAttribute as string | undefined
  const idXpath = tool.config.idXpath as string | undefined
  const credentialId = tool.config.credentialId as string | undefined
  const apiKey = tool.config.apiKey as string | undefined
  const customEndpoint = tool.config.customEndpoint as string | undefined
  const customHeaders = tool.config.customHeaders as Record<string, string> | undefined
  const timeout = (tool.config.timeout as number) || 10000
  const outputAlias = (tool.config.outputAlias as string) || provider

  const id = extractIdFromElement(ctx.xmlElement, idSource, idAttribute, idXpath)

  if (!id) {
    console.warn(`[Fetch API Tool] No ID found for provider ${provider}`)
    return ({ result: false })
  }

  if (!ctx.apiData) {
    ctx.apiData = {}
  }

  try {
    // Access credentials from store for client-side execution
    const getCredential = (id: string) => useCredentialsStore.getState().getCredential(id)

    const response = await fetchFromApi({
      provider: provider === 'custom' ? 'custom' : provider,
      id,
      apiKey,
      credentialId,
      customEndpoint,
      customHeaders,
      timeout
    }, getCredential)

    if (response.success && response.data) {
      if (ctx.apiData) {
        ctx.apiData[outputAlias] = response.data
      }
    } else {
      console.warn(`[Fetch API Tool] API request failed: ${response.error}`)
    }
  } catch (error) {
    console.error(`[Fetch API Tool] Error:`, error)
  }

  return ({ result: true })
}

export const executeHttpTool: ToolExecutor = async (tool: ToolCanvasNode, ctx: ExecutionContext) => {
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
  const headers = (tool.config.headers as Array<{ key: string; value: string }>) || []
  const queryParams = (tool.config.queryParams as Array<{ key: string; value: string }>) || []
  const body = tool.config.body as string | undefined
  const bodyType = (tool.config.bodyType as 'json' | 'text' | 'form-data' | 'x-www-form-urlencoded') || 'json'
  const timeout = (tool.config.timeout as number) || 10000
  const outputAlias = (tool.config.outputAlias as string) || 'httpResponse'

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

  // Handle Credentials
  if (useCredential && credentialId) {
    const credential = useCredentialsStore.getState().getCredential(credentialId)
    if (credential) {
      const credData = credential.data
      
      if (credData.bearerToken) {
        requestHeaders['Authorization'] = `Bearer ${credData.bearerToken}`
      } else if (credData.apiKey) {
        const header = credData.apiKeyHeader || 'X-API-Key'
        requestHeaders[header] = credData.apiKey
      } else if (credData.basicUsername) {
        const basic = btoa(`${credData.basicUsername}:${credData.basicPassword || ''}`)
        requestHeaders['Authorization'] = `Basic ${basic}`
      } else if (credData.token) {
        // Fallback or generic token
        requestHeaders['Authorization'] = `Bearer ${credData.token}`
      }
    }
  } else {
    // Manual Auth
    if (authType === 'bearer' && bearerToken) {
      requestHeaders['Authorization'] = `Bearer ${bearerToken}`
    } else if (authType === 'basic' && basicUsername) {
      const basicAuth = btoa(`${basicUsername}:${basicPassword || ''}`)
      requestHeaders['Authorization'] = `Basic ${basicAuth}`
    } else if (authType === 'apiKey' && apiKey) {
      requestHeaders[apiKeyHeader] = apiKey
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

  try {
    const response = await fetch(fullUrl, {
      method,
      headers: requestHeaders,
      body: requestBody,
      signal: controller.signal
    })

    clearTimeout(timeoutId)
    const responseText = await response.text()
    let responseData: unknown

    try {
      responseData = JSON.parse(responseText)
    } catch {
      responseData = responseText
    }

    if (ctx.apiData) {
      if (Array.isArray(responseData)) {
        // Direct storage for arrays to preserve Array.isArray(val)
        ctx.apiData[outputAlias] = responseData
      } else if (typeof responseData === 'object' && responseData !== null) {
        // Store data directly for easy template access
        // include metadata under a special key if it's an object
        ctx.apiData[outputAlias] = {
          ...(responseData as any),
          _httpMeta: {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries())
          }
        }
      } else {
        ctx.apiData[outputAlias] = responseData
      }
    }
  } catch (error) {
    clearTimeout(timeoutId)
    console.error('[HTTP Tool] Error:', error)
    if (ctx.apiData) {
      ctx.apiData[outputAlias] = {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  return { result: true }
}


