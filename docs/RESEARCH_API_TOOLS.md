# Research API Tools Implementation

## Overview
This document outlines the implementation of tools that fetch data from open research APIs during workflow execution. These tools allow researchers to enrich their XML data with external metadata from authoritative sources.

## Supported Research APIs

### 1. **Wikidata** (https://www.wikidata.org/)
- **Purpose**: Structured data from Wikipedia
- **Use Case**: Fetch person, place, organization, and concept metadata
- **API**: REST API with SPARQL endpoint
- **Example**: `<person wiki:id="Q42">` → Fetch Douglas Adams metadata
- **Rate Limit**: Reasonable limits, no auth required for basic queries
- **Documentation**: https://www.wikidata.org/wiki/Wikidata:Data_access

### 2. **GND (Gemeinsame Normdatei)** (https://www.dnb.de/gnd)
- **Purpose**: German authority file for persons, organizations, places, works
- **Use Case**: Standardized identifiers for German cultural heritage
- **API**: SRU/SRW and REST API
- **Example**: `<person gnd:id="118500882">` → Fetch Goethe metadata
- **Rate Limit**: Varies, some endpoints require registration
- **Documentation**: https://www.dnb.de/DE/Professionell/Metadatendienste/Datenbezug/SRU/sru_node.html

### 3. **VIAF (Virtual International Authority File)** (https://viaf.org/)
- **Purpose**: International authority file linking multiple national libraries
- **Use Case**: Resolve person/organization names across different authority files
- **API**: REST API
- **Example**: `<person viaf:id="24609363">` → Fetch metadata from multiple sources
- **Rate Limit**: Reasonable, no auth required
- **Documentation**: https://www.oclc.org/developer/api/oclc-apis/viaf/authority-cluster.en.html

### 4. **ORCID** (https://orcid.org/)
- **Purpose**: Researcher identifiers
- **Use Case**: Academic researcher profiles and publications
- **API**: REST API (requires OAuth for write, public read available)
- **Example**: `<researcher orcid:id="0000-0002-1825-0097">` → Fetch researcher profile
- **Rate Limit**: Requires API key for production
- **Documentation**: https://info.orcid.org/documentation/

### 5. **GeoNames** (https://www.geonames.org/)
- **Purpose**: Geographical database
- **Use Case**: Place names, coordinates, administrative divisions
- **API**: REST API
- **Example**: `<place geoname:id="2925533">` → Fetch Frankfurt am Main data
- **Rate Limit**: Free tier available, requires username
- **Documentation**: https://www.geonames.org/export/web-services.html

### 6. **DBLP** (https://dblp.org/)
- **Purpose**: Computer science bibliography
- **Use Case**: Academic publications, authors, venues
- **API**: REST API
- **Example**: `<publication dblp:id="journals/tcs/0001">` → Fetch publication metadata
- **Rate Limit**: Reasonable, no auth required
- **Documentation**: https://dblp.org/faq/13501473.html

### 7. **CrossRef** (https://www.crossref.org/)
- **Purpose**: Academic publication metadata
- **Use Case**: DOI resolution, citation metadata
- **API**: REST API
- **Example**: `<publication doi="10.1000/182">` → Fetch publication metadata
- **Rate Limit**: Requires polite use, email header recommended
- **Documentation**: https://www.crossref.org/documentation/retrieve-metadata/rest-api/

### 8. **Europeana** (https://www.europeana.eu/)
- **Purpose**: European cultural heritage collections
- **Use Case**: Artworks, manuscripts, historical documents
- **API**: REST API
- **Example**: `<artwork europeana:id="/2020601/https___1914_1918_europeana_eu_contributions_20249">`
- **Rate Limit**: Requires API key
- **Documentation**: https://pro.europeana.eu/page/apis

### 9. **Getty Vocabularies** (https://www.getty.edu/research/tools/vocabularies/)
- **Purpose**: Art and architecture controlled vocabularies
- **Use Case**: Art terms, artist names, place names
- **API**: REST API
- **Example**: `<artist getty:id="500026662">` → Fetch artist metadata
- **Rate Limit**: Requires API key
- **Documentation**: https://www.getty.edu/research/tools/vocabularies/lod/

### 10. **Library of Congress** (https://id.loc.gov/)
- **Purpose**: Authority files and controlled vocabularies
- **Use Case**: Subject headings, name authorities, classification
- **API**: REST API (Linked Data)
- **Example**: `<subject lcsh:id="sh85009003">` → Fetch subject heading
- **Rate Limit**: Reasonable, no auth required
- **Documentation**: https://id.loc.gov/techcenter/searching.html

## Implementation Approach

### Option 1: Generic API Fetch Tool (Recommended)
Create a single `tool:fetch-api` tool that can be configured for different APIs:
- **Pros**: Flexible, extensible, single codebase
- **Cons**: More complex configuration UI

### Option 2: Specific Tools for Each API
Create individual tools like `tool:fetch-wikidata`, `tool:fetch-gnd`, etc.:
- **Pros**: Simpler configuration, type-safe
- **Cons**: More code duplication, harder to maintain

### Recommended: Hybrid Approach
- Create a generic `tool:fetch-api` with presets for common APIs
- Allow custom API configuration for advanced users
- Store API responses in execution context for use by actions

## Data Flow

1. **Extract ID**: Tool extracts identifier from XML attribute (e.g., `wiki:id="Q42"`)
2. **API Request**: Tool makes HTTP request to API endpoint
3. **Store Response**: API response stored in execution context (e.g., `ctx.apiData.wikidata`)
4. **Use in Actions**: Actions can access API data to create nodes/properties

## Configuration Schema

```typescript
interface FetchApiConfig {
  apiProvider: 'wikidata' | 'gnd' | 'viaf' | 'orcid' | 'geonames' | 'dblp' | 'crossref' | 'europeana' | 'getty' | 'loc' | 'custom'
  idSource: 'attribute' | 'textContent' | 'xpath'
  idAttribute?: string // e.g., 'wiki:id', 'gnd:id'
  idXpath?: string // For complex ID extraction
  customEndpoint?: string // For custom APIs
  customHeaders?: Record<string, string>
  apiKey?: string // For APIs requiring authentication
  responseMapping?: {
    // Map API response fields to properties
    name?: string // e.g., 'labels.en.value' for Wikidata
    description?: string
    // ... other mappings
  }
  storeInContext?: string // Key to store response in context (default: apiProvider name)
  timeout?: number // Request timeout in ms
  retryOnFailure?: boolean
  maxRetries?: number
}
```

## Example Workflow

```
XML: <person wiki:id="Q42" name="Douglas Adams"/>
     ↓
Tool: Fetch Wikidata
     - Extract: wiki:id="Q42"
     - Request: https://www.wikidata.org/wiki/Special:EntityData/Q42.json
     - Store: ctx.apiData.wikidata = { labels: {...}, claims: {...} }
     ↓
Action: Create Node
     - Use: ctx.apiData.wikidata.labels.en.value for node name
     - Use: ctx.apiData.wikidata.claims.P569 (birth date) for properties
```

## Technical Implementation

### 1. Add Tool Type
```typescript
// toolCanvasStore.ts
export type ToolNodeType =
  | ...
  | 'tool:fetch-api'
```

### 2. Execution Logic
```typescript
// workflowExecutorV2.ts
case 'tool:fetch-api': {
  return executeFetchApiTool(tool, ctx)
}
```

### 3. API Client Service
Create `services/apiClient.ts`:
- Handle different API formats
- Error handling and retries
- Response normalization
- Caching (optional)

### 4. UI Configuration
Add to `ToolConfigurationSidebar.tsx`:
- API provider selector
- ID source configuration
- Response mapping UI
- API key management

## Security Considerations

1. **API Keys**: Store securely, never in workflow config exports
2. **Rate Limiting**: Implement client-side rate limiting
3. **Error Handling**: Graceful degradation when APIs are unavailable
4. **Data Privacy**: Be transparent about external API calls

## Future Enhancements

1. **Caching**: Cache API responses to reduce calls
2. **Batch Requests**: Support fetching multiple IDs at once
3. **Async Processing**: Queue API requests for parallel execution
4. **Response Transformation**: Transform API responses before storing
5. **Webhook Support**: For APIs that support webhooks

