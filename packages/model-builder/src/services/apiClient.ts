/**
 * API Client for Research APIs
 * Handles fetching data from various research APIs like Wikidata, GND, VIAF, etc.
 */

export type ApiProvider = 
  | 'wikidata'
  | 'gnd'
  | 'viaf'
  | 'orcid'
  | 'geonames'
  | 'dblp'
  | 'crossref'
  | 'europeana'
  | 'getty'
  | 'loc'
  | 'custom'

export interface ApiConfig {
  provider: ApiProvider
  id: string
  apiKey?: string
  credentialId?: string // ID of stored credential
  customEndpoint?: string
  customHeaders?: Record<string, string>
  timeout?: number
}

export interface ApiResponse {
  success: boolean
  data?: unknown
  error?: string
  provider: ApiProvider
}

/**
 * Build API endpoint URL based on provider and ID
 */
function buildApiUrl(provider: ApiProvider, id: string, apiKey?: string): string {
  const cleanId = id.trim()
  
  switch (provider) {
    case 'wikidata':
      // Wikidata Entity API
      return `https://www.wikidata.org/wiki/Special:EntityData/${cleanId}.json`
    
    case 'gnd':
      // GND SRU API (simplified - may need more complex query building)
      return `https://services.dnb.de/sru/gnd?version=1.1&operation=searchRetrieve&query=pica.gnd%3D${cleanId}&recordSchema=ONIX`
    
    case 'viaf':
      // VIAF RDF endpoint (returns RDF/XML, will need parsing)
      // Note: VIAF JSON endpoint is deprecated, using RDF instead
      return `https://viaf.org/viaf/${cleanId}.rdf`
    
    case 'orcid':
      // ORCID API
      return `https://pub.orcid.org/v3.0/${cleanId}`
    
    case 'geonames':
      // GeoNames API
      const username = apiKey || 'demo' // GeoNames requires username
      return `https://secure.geonames.org/getJSON?geonameId=${cleanId}&username=${username}`
    
    case 'dblp':
      // DBLP Search API (note: this is a search, not direct lookup)
      // For direct publication lookup, use format: https://dblp.org/rec/{type}/{key}.json
      // But since IDs vary, we use search API which is more flexible
      return `https://dblp.org/search/publ/api?q=${encodeURIComponent(cleanId)}&format=json`
    
    case 'crossref':
      // CrossRef API
      return `https://api.crossref.org/works/${cleanId}`
    
    case 'europeana':
      // Europeana API
      return `https://api.europeana.eu/record${cleanId}.json?wskey=${apiKey || ''}`
    
    case 'getty':
      // Getty Vocabularies API
      return `https://vocab.getty.edu/${cleanId}.json`
    
    case 'loc':
      // Library of Congress Linked Data
      return `https://id.loc.gov/authorities/${cleanId}.jsonld`
    
    default:
      throw new Error(`Unsupported API provider: ${provider}`)
  }
}

/**
 * Normalize API response to a common format
 */
function normalizeResponse(provider: ApiProvider, rawData: unknown): unknown {
  try {
    switch (provider) {
      case 'wikidata': {
        // Wikidata returns { entities: { Q42: {...} } }
        const data = rawData as { entities?: Record<string, unknown> }
        if (data.entities) {
          const entityId = Object.keys(data.entities)[0]
          return data.entities[entityId]
        }
        return rawData
      }
      
      case 'viaf': {
        // VIAF returns RDF/XML (not JSON)
        // For now, return as-is with note
        // TODO: Parse RDF/XML to structured JSON
        return rawData
      }
      
      case 'gnd': {
        // GND returns XML
        // For now, return as-is with note
        // TODO: Parse XML to structured JSON
        return rawData
      }
      
      case 'dblp': {
        // DBLP search returns { result: { hits: { hit: [...] } } }
        const data = rawData as { result?: { hits?: { hit?: unknown[] } } }
        if (data.result?.hits?.hit && data.result.hits.hit.length > 0) {
          // Return first match
          return data.result.hits.hit[0]
        }
        return rawData
      }
      
      case 'orcid': {
        // ORCID returns structured data
        return rawData
      }
      
      case 'geonames': {
        // GeoNames returns { geonameId: ..., name: ..., ... }
        return rawData
      }
      
      case 'crossref': {
        // CrossRef returns { message: {...} }
        const data = rawData as { message?: unknown }
        return data.message || rawData
      }
      
      case 'europeana': {
        // Europeana returns { object: {...} }
        const data = rawData as { object?: unknown }
        return data.object || rawData
      }
      
      default:
        return rawData
    }
  } catch (error) {
    console.warn(`Error normalizing ${provider} response:`, error)
    return rawData
  }
}

/**
 * Fetch data from research API
 * @param config API configuration
 * @param getCredential Optional function to retrieve credential by ID (for client-side usage)
 */
export async function fetchFromApi(
  config: ApiConfig,
  getCredential?: (id: string) => { data: Record<string, string> } | undefined
): Promise<ApiResponse> {
  const { provider, id, apiKey, credentialId, customEndpoint, customHeaders, timeout = 10000 } = config
  
  if (!id || id.trim() === '') {
    return {
      success: false,
      error: 'ID is required',
      provider
    }
  }
  
  // Resolve API key from credential if provided
  let resolvedApiKey = apiKey
  let resolvedCustomEndpoint = customEndpoint
  const resolvedCustomHeaders = { ...customHeaders }
  
  if (credentialId && getCredential) {
    const credential = getCredential(credentialId)
    if (credential) {
      const credData = credential.data
      
      // Map credential data to API config based on provider
      if (provider === 'orcid' || provider === 'getty' || provider === 'europeana') {
        resolvedApiKey = credData.apiKey
      } else if (provider === 'geonames') {
        resolvedApiKey = credData.username // GeoNames uses username as "apiKey"
      } else if (provider === 'custom') {
        resolvedCustomEndpoint = credData.endpoint
        if (credData.apiKey) {
          resolvedApiKey = credData.apiKey
        }
        if (credData.headerName && credData.headerValue) {
          resolvedCustomHeaders[credData.headerName] = credData.headerValue
        }
      }
    }
  }
  
  try {
    const url = resolvedCustomEndpoint || buildApiUrl(provider, id, resolvedApiKey)
    
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      ...resolvedCustomHeaders
    }
    
    // Add API-specific headers
    if (provider === 'crossref') {
      headers['User-Agent'] = 'ResearchApp/1.0 (mailto:your-email@example.com)' // Polite use
    }
    
    if (provider === 'orcid') {
      headers['Accept'] = 'application/vnd.orcid+json'
    }
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      return {
        success: false,
        error: `API request failed: ${response.status} ${response.statusText}`,
        provider
      }
    }
    
    // Handle different response types
    const contentType = response.headers.get('content-type') || ''
    let rawData: unknown
    
    if (contentType.includes('json')) {
      rawData = await response.json()
    } else if (contentType.includes('xml') || contentType.includes('rdf')) {
      // For XML/RDF responses (GND, VIAF), return as text for now
      // In future, could parse XML to JSON
      const xmlText = await response.text()
      rawData = { 
        _raw: xmlText,
        _format: 'xml',
        _note: 'XML response - parsing not yet implemented'
      }
    } else {
      // Fallback to text
      rawData = await response.text()
    }
    
    const normalizedData = normalizeResponse(provider, rawData)
    
    return {
      success: true,
      data: normalizedData,
      provider
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'Request timeout',
          provider
        }
      }
      return {
        success: false,
        error: error.message,
        provider
      }
    }
    return {
      success: false,
      error: 'Unknown error occurred',
      provider
    }
  }
}

/**
 * Extract ID from XML element based on configuration
 */
export function extractIdFromElement(
  element: Element,
  idSource: 'attribute' | 'textContent' | 'xpath',
  idAttribute?: string,
  idXpath?: string
): string | null {
  try {
    switch (idSource) {
      case 'attribute':
        if (!idAttribute) return null
        return element.getAttribute(idAttribute) || null
      
      case 'textContent':
        return element.textContent?.trim() || null
      
      case 'xpath':
        // Simple XPath evaluation (for complex cases, might need a library)
        if (!idXpath) return null
        // For now, return null - would need xpath library for full support
        console.warn('XPath extraction not yet fully implemented')
        return null
      
      default:
        return null
    }
  } catch (error) {
    console.error('Error extracting ID:', error)
    return null
  }
}

