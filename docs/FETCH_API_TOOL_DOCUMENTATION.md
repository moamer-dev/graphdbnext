# Fetch API Tool Documentation

## Overview

The **Fetch API** tool allows you to retrieve data from external research APIs during workflow execution. This tool extracts an identifier from your XML elements and uses it to fetch enriched metadata from authoritative sources like Wikidata, GND, VIAF, and others.

## How It Works

1. **Extract ID**: The tool extracts an identifier from your XML element (from an attribute, text content, or XPath)
2. **API Request**: Makes an HTTP request to the configured API provider
3. **Store Response**: The API response is stored in the execution context (`ctx.apiData[providerName]`)
4. **Use in Actions**: Connected actions can access the fetched data to create nodes, set properties, etc.

## Configuration

### Basic Settings

- **API Provider**: Select from 10 pre-configured APIs or use a custom endpoint
- **ID Source**: Choose how to extract the ID:
  - `attribute`: From an XML attribute (e.g., `wiki:id="Q42"`)
  - `textContent`: From the element's text content
  - `xpath`: Using an XPath expression (limited support)
- **ID Attribute Name**: The XML attribute containing the ID (e.g., `wiki:id`, `gnd:id`)
- **API Key**: Required for some APIs (Europeana, ORCID, GeoNames)
- **Custom Endpoint**: For custom APIs, use `{id}` placeholder
- **Timeout**: Request timeout in milliseconds (default: 10000ms)
- **Store in Context Key**: Key to store response (default: provider name)

## Supported APIs

### 1. Wikidata

**Purpose**: Structured data from Wikipedia  
**Use Case**: Fetch person, place, organization, and concept metadata  
**Rate Limit**: Reasonable limits, no auth required  
**Documentation**: https://www.wikidata.org/wiki/Wikidata:Data_access

#### Configuration Example
```
API Provider: wikidata
ID Source: attribute
ID Attribute: wiki:id
```

#### XML Example
```xml
<person wiki:id="Q42" name="Douglas Adams"/>
```

#### Test Request
- **Test ID**: `Q42` (Douglas Adams)
- **Expected Response**: JSON with labels, descriptions, claims, aliases, etc.
- **Sample Response Structure**:
```json
{
  "entities": {
    "Q42": {
      "labels": {
        "en": { "value": "Douglas Adams" }
      },
      "descriptions": {
        "en": { "value": "English writer and humorist" }
      },
      "claims": {
        "P569": [{ "mainsnak": { "datavalue": { "value": { "time": "+1952-03-11T00:00:00Z" } } } }]
      }
    }
  }
}
```

#### Use Case
Enrich person nodes with biographical data, birth dates, occupations, and relationships from Wikidata.

---

### 2. GND (Gemeinsame Normdatei)

**Purpose**: German authority file for persons, organizations, places, works  
**Use Case**: Standardized identifiers for German cultural heritage  
**Rate Limit**: Varies, some endpoints require registration  
**Documentation**: https://www.dnb.de/DE/Professionell/Metadatendienste/Datenbezug/SRU/sru_node.html

#### Configuration Example
```
API Provider: gnd
ID Source: attribute
ID Attribute: gnd:id
```

#### XML Example
```xml
<author gnd:id="118500882" name="Goethe"/>
```

#### Test Request
- **Test ID**: `118500882` (Johann Wolfgang von Goethe)
- **Expected Response**: XML format (ONIX schema)
- **Note**: GND API returns XML, not JSON. The tool returns raw XML which can be parsed in future versions.
- **Current Limitation**: Returns raw XML response. Full XML parsing will be implemented in a future update.

#### Use Case
Link German literary works, authors, and historical figures to standardized GND identifiers.

---

### 3. VIAF (Virtual International Authority File)

**Purpose**: International authority file linking multiple national libraries  
**Use Case**: Resolve person/organization names across different authority files  
**Rate Limit**: Reasonable, no auth required  
**Documentation**: https://www.oclc.org/developer/api/oclc-apis/viaf/authority-cluster.en.html

#### Configuration Example
```
API Provider: viaf
ID Source: attribute
ID Attribute: viaf:id
```

#### XML Example
```xml
<person viaf:id="24609363" name="Shakespeare"/>
```

#### Test Request
- **Test ID**: `24609363` (William Shakespeare)
- **Expected Response**: RDF/XML format (not JSON)
- **Response Structure**: Returns raw RDF/XML in `_raw` field with metadata:
```json
{
  "_raw": "<?xml version=\"1.0\"...",
  "_format": "rdf/xml",
  "_provider": "viaf",
  "_note": "RDF/XML response - full parsing will be implemented in a future update..."
}
```
- **Note**: VIAF JSON endpoint is deprecated. The tool uses RDF endpoint and returns raw RDF/XML. Full RDF parsing will be added in a future update.

#### Use Case
Link authors and organizations to international authority records, connecting local identifiers to global standards.

---

### 4. ORCID

**Purpose**: Researcher identifiers  
**Use Case**: Academic researcher profiles and publications  
**Rate Limit**: Requires API key for production  
**Documentation**: https://info.orcid.org/documentation/

#### Configuration Example
```
API Provider: orcid
ID Source: attribute
ID Attribute: orcid:id
API Key: [Your ORCID API Key]
```

#### XML Example
```xml
<researcher orcid:id="0000-0002-1825-0097" name="John Doe"/>
```

#### Test Request
- **Test ID**: `0000-0002-1825-0097`
- **Expected Response**: JSON with researcher profile, employment, education, works
- **Note**: Requires API key for full access

#### Use Case
Enrich academic researcher nodes with publication lists, affiliations, and research interests.

---

### 5. GeoNames

**Purpose**: Geographical database  
**Use Case**: Place names, coordinates, administrative divisions  
**Rate Limit**: Free tier available, requires username  
**Documentation**: https://www.geonames.org/export/web-services.html

#### Configuration Example
```
API Provider: geonames
ID Source: attribute
ID Attribute: geoname:id
API Key: [Your GeoNames Username]
```

#### XML Example
```xml
<place geoname:id="2925533" name="Frankfurt am Main"/>
```

#### Test Request
- **Test ID**: `2925533` (Frankfurt am Main, Germany)
- **Expected Response**: JSON with place name, coordinates, country, admin codes
- **Sample Response Structure**:
```json
{
  "geonameId": 2925533,
  "name": "Frankfurt am Main",
  "countryName": "Germany",
  "adminName1": "Hesse",
  "lat": "50.11552",
  "lng": "8.68417",
  "population": 650000
}
```

#### Use Case
Enrich location nodes with coordinates, administrative hierarchy, and population data.

---

### 6. DBLP

**Purpose**: Computer science bibliography  
**Use Case**: Academic publications, authors, venues  
**Rate Limit**: Reasonable, no auth required  
**Documentation**: https://dblp.org/faq/13501473.html

#### Configuration Example
```
API Provider: dblp
ID Source: attribute
ID Attribute: dblp:id
```

#### XML Example
```xml
<publication dblp:id="journals/tcs/0001" title="Some Paper"/>
```

#### Test Request
- **Test ID**: `journals/tcs/0001` or any DBLP publication key
- **Expected Response**: JSON search results with publication metadata
- **Response Structure**: DBLP search returns `{ result: { hits: { hit: [...] } } }`. The tool extracts the first match:
```json
{
  "info": {
    "title": "Publication Title",
    "authors": { "author": [...] },
    "venue": "...",
    "year": "2023"
  }
}
```
- **Note**: DBLP uses a search API rather than direct lookup. The tool searches for the ID and returns the first matching result. For exact matches, use the full DBLP key format.

#### Use Case
Link computer science publications to DBLP records for citation networks and author relationships.

---

### 7. CrossRef

**Purpose**: Academic publication metadata  
**Use Case**: DOI resolution, citation metadata  
**Rate Limit**: Requires polite use, email header recommended  
**Documentation**: https://www.crossref.org/documentation/retrieve-metadata/rest-api/

#### Configuration Example
```
API Provider: crossref
ID Source: attribute
ID Attribute: doi
```

#### XML Example
```xml
<publication doi="10.1000/182" title="Example Article"/>
```

#### Test Request
- **Test ID**: `10.1038/nature12373` (Real DOI - Nature article)
- **Alternative Test ID**: `10.1000/182` (Example DOI - may not exist)
- **Expected Response**: JSON with publication title, authors, journal, dates, citations
- **Note**: Use real DOIs for testing. Example DOIs may return 404.
- **Sample Response Structure**:
```json
{
  "message": {
    "title": ["Example Article"],
    "author": [
      { "given": "John", "family": "Doe" }
    ],
    "published-print": {
      "date-parts": [[2023, 1, 1]]
    },
    "DOI": "10.1000/182"
  }
}
```

#### Use Case
Resolve DOIs to get complete publication metadata, including authors, dates, and journal information.

---

### 8. Europeana

**Purpose**: European cultural heritage collections  
**Use Case**: Artworks, manuscripts, historical documents  
**Rate Limit**: Requires API key  
**Documentation**: https://pro.europeana.eu/page/apis

#### Configuration Example
```
API Provider: europeana
ID Source: attribute
ID Attribute: europeana:id
API Key: [Your Europeana API Key]
```

#### XML Example
```xml
<artwork europeana:id="/2020601/https___1914_1918_europeana_eu_contributions_20249" title="WWI Document"/>
```

#### Test Request
- **Test ID**: `/2020601/https___1914_1918_europeana_eu_contributions_20249`
- **Expected Response**: JSON with artwork metadata, images, descriptions, provenance
- **Note**: Europeana IDs have specific formats

#### Use Case
Enrich cultural heritage objects with images, descriptions, and provenance information from European collections.

---

### 9. Getty Vocabularies

**Purpose**: Art and architecture controlled vocabularies  
**Use Case**: Art terms, artist names, place names  
**Rate Limit**: Requires API key  
**Documentation**: https://www.getty.edu/research/tools/vocabularies/lod/

#### Configuration Example
```
API Provider: getty
ID Source: attribute
ID Attribute: getty:id
API Key: [Your Getty API Key]
```

#### XML Example
```xml
<artist getty:id="500026662" name="Van Gogh"/>
```

#### Test Request
- **Test ID**: `500026662` (Vincent van Gogh)
- **Expected Response**: JSON-LD with artist information, related terms, biographical data
- **Sample Response Structure**:
```json
{
  "@context": "http://vocab.getty.edu/",
  "@id": "http://vocab.getty.edu/ulan/500026662",
  "skos:prefLabel": "Gogh, Vincent van",
  "skos:altLabel": ["Van Gogh, Vincent"],
  "schema:birthDate": "1853",
  "schema:deathDate": "1890"
}
```

#### Use Case
Link artworks and artists to Getty authority records for standardized art historical data.

---

### 10. Library of Congress

**Purpose**: Authority files and controlled vocabularies  
**Use Case**: Subject headings, name authorities, classification  
**Rate Limit**: Reasonable, no auth required  
**Documentation**: https://id.loc.gov/techcenter/searching.html

#### Configuration Example
```
API Provider: loc
ID Source: attribute
ID Attribute: lcsh:id
```

#### XML Example
```xml
<subject lcsh:id="sh85009003" name="Artificial Intelligence"/>
```

#### Test Request
- **Test ID**: `sh85009003` (Artificial Intelligence subject heading)
- **Expected Response**: JSON-LD with subject heading, broader/narrower terms, related concepts
- **Sample Response Structure**:
```json
{
  "@context": "http://id.loc.gov/authorities/subjects/",
  "@id": "http://id.loc.gov/authorities/subjects/sh85009003",
  "skos:prefLabel": "Artificial intelligence",
  "skos:broader": [
    { "@id": "http://id.loc.gov/authorities/subjects/sh85009001" }
  ]
}
```

#### Use Case
Classify documents and topics using Library of Congress Subject Headings for standardized categorization.

---

### 11. Custom API

**Purpose**: User-defined API endpoints  
**Use Case**: Connect to any REST API that accepts ID-based queries  
**Rate Limit**: Depends on API provider

#### Configuration Example
```
API Provider: custom
ID Source: attribute
ID Attribute: api:id
Custom Endpoint: https://api.example.com/entity/{id}
Custom Headers: { "Authorization": "Bearer token" }
```

#### XML Example
```xml
<entity api:id="12345" name="Custom Entity"/>
```

#### Test Request
- **Test ID**: `12345`
- **Custom Endpoint**: `https://api.example.com/entity/12345`
- **Expected Response**: Depends on API

#### Use Case
Connect to institution-specific APIs, internal databases, or any custom research data source.

---

## Workflow Examples

### Example 1: Enrich Person Nodes with Wikidata

**XML Input:**
```xml
<person wiki:id="Q42" name="Douglas Adams"/>
```

**Workflow:**
1. **Fetch API Tool** (Wikidata)
   - Extract: `wiki:id="Q42"`
   - Store in: `ctx.apiData.wikidata`

2. **Create Node Action**
   - Use: `ctx.apiData.wikidata.labels.en.value` for node name
   - Use: `ctx.apiData.wikidata.claims.P569` (birth date) for properties

**Result:**
```json
{
  "id": 1,
  "type": "node",
  "labels": ["Person"],
  "properties": {
    "name": "Douglas Adams",
    "birthDate": "1952-03-11",
    "occupation": "Writer"
  }
}
```

### Example 2: Link Places with GeoNames

**XML Input:**
```xml
<place geoname:id="2925533" name="Frankfurt"/>
```

**Workflow:**
1. **Fetch API Tool** (GeoNames)
   - Extract: `geoname:id="2925533"`
   - Store in: `ctx.apiData.geonames`

2. **Create Node Action**
   - Use: `ctx.apiData.geonames.name` for node name
   - Use: `ctx.apiData.geonames.lat` and `ctx.apiData.geonames.lng` for coordinates
   - Use: `ctx.apiData.geonames.countryName` for country property

**Result:**
```json
{
  "id": 2,
  "type": "node",
  "labels": ["Place"],
  "properties": {
    "name": "Frankfurt am Main",
    "latitude": "50.11552",
    "longitude": "8.68417",
    "country": "Germany"
  }
}
```

### Example 3: Resolve Academic Publications with CrossRef

**XML Input:**
```xml
<publication doi="10.1000/182" title="Example"/>
```

**Workflow:**
1. **Fetch API Tool** (CrossRef)
   - Extract: `doi="10.1000/182"`
   - Store in: `ctx.apiData.crossref`

2. **Create Node Action**
   - Use: `ctx.apiData.crossref.message.title[0]` for title
   - Use: `ctx.apiData.crossref.message.author` for authors
   - Use: `ctx.apiData.crossref.message['published-print']['date-parts']` for publication date

**Result:**
```json
{
  "id": 3,
  "type": "node",
  "labels": ["Publication"],
  "properties": {
    "title": "Example Article",
    "authors": ["John Doe", "Jane Smith"],
    "publicationDate": "2023-01-01"
  }
}
```

## Testing the Tool

### Using the Test Executor

1. **Configure the tool** with your desired API provider and settings
2. **Enter a test ID** (optional - will use attached node if available)
3. **Click "Test API"** to make a real API call
4. **View results** in the formatted output panel

### Test IDs for Each Provider

| Provider | Test ID | Description | Status | Response Format |
|----------|---------|-------------|--------|----------------|
| **Wikidata** | `Q42` | Douglas Adams | ✅ Working | JSON |
| **GeoNames** | `2925533` | Frankfurt am Main | ✅ Working | JSON |
| **CrossRef** | `10.1038/nature12373` | Nature article | ✅ Working | JSON |
| **Library of Congress** | `subjects/sh85009003` | Artificial Intelligence | ✅ Working | JSON-LD |
| **Getty** | `ulan/500026662` | Vincent van Gogh | ✅ Working | JSON |
| **ORCID** | `0000-0002-1825-0097` | Example researcher | ✅ Working | JSON |
| **DBLP** | `journals/tcs/0001` | Example publication | ⚠️ Limited | JSON (search results) |
| **GND** | `118500882` | Johann Wolfgang von Goethe | ⚠️ Limited | XML (raw) |
| **VIAF** | `24609363` | William Shakespeare | ⚠️ Limited | RDF/XML (raw) |
| **Europeana** | `/2020601/...` | WWI document | ⚠️ Requires Key | JSON (needs API key) |

**Note**: 
- ✅ = Fully working with JSON response
- ⚠️ = Working but returns XML/RDF (needs parsing) or has limitations
- For DBLP, the ID is used in a search query, and the first result is returned
- For GND and VIAF, raw XML/RDF is stored in `_raw` field with metadata

## Accessing API Data in Actions

Once the Fetch API tool has retrieved data, you can access it in connected actions:

```javascript
// In action execution context
const wikidataData = ctx.apiData?.wikidata
if (wikidataData) {
  const name = wikidataData.labels?.en?.value
  const birthDate = wikidataData.claims?.P569?.[0]?.mainsnak?.datavalue?.value?.time
  // Use in node properties
}
```

## Best Practices

1. **Error Handling**: Always check if `ctx.apiData[provider]` exists before accessing
2. **Rate Limiting**: Be mindful of API rate limits, especially for free tiers
3. **API Keys**: Store API keys securely, never in exported workflow configs
4. **Timeouts**: Set appropriate timeouts based on API response times
5. **Data Validation**: Validate API responses before using in actions
6. **Caching**: Consider caching API responses for frequently accessed IDs

## API Status Summary

### Fully Working APIs (JSON Response)
These APIs return structured JSON data that can be directly used in actions:

- ✅ **Wikidata** - Returns normalized entity data
- ✅ **GeoNames** - Returns place data with coordinates
- ✅ **CrossRef** - Returns publication metadata
- ✅ **Library of Congress** - Returns JSON-LD authority data
- ✅ **Getty Vocabularies** - Returns JSON-LD vocabulary data
- ✅ **ORCID** - Returns researcher profile data

### APIs with Limitations

- ⚠️ **VIAF** - Returns RDF/XML format (not JSON). Raw XML is stored in context. Full parsing will be added in future.
- ⚠️ **GND** - Returns XML format (ONIX schema). Raw XML is stored in context. Full parsing will be added in future.
- ⚠️ **DBLP** - Uses search API (not direct lookup). Returns search results, first match is extracted.
- ⚠️ **Europeana** - Requires API key. Will work once API key is configured.

### Test Results

All APIs were tested on 2024-12-20. Results:

| Provider | Status | Response Format | Notes |
|----------|--------|----------------|-------|
| Wikidata | ✅ Working | JSON | Fully functional |
| GeoNames | ✅ Working | JSON | Requires username (demo works) |
| CrossRef | ✅ Working | JSON | Use real DOIs for testing |
| Library of Congress | ✅ Working | JSON-LD | Full authority data |
| Getty | ✅ Working | JSON | Full vocabulary data |
| ORCID | ✅ Working | JSON | Public profiles only |
| DBLP | ⚠️ Limited | JSON (search) | Search API, not direct lookup |
| GND | ⚠️ Limited | XML | Returns raw XML |
| VIAF | ⚠️ Limited | RDF/XML | Returns raw RDF/XML |
| Europeana | ⚠️ Requires Key | JSON | Needs API key |

## Troubleshooting

### Common Issues

1. **"No ID found"**
   - Check that the ID attribute name matches your XML
   - Verify the element has the required attribute or text content
   - Try entering the ID manually in the test field

2. **"API request failed"**
   - Verify the ID format is correct for the provider
   - Check if API key is required and correctly set
   - Ensure network connectivity
   - Verify API endpoint is accessible

3. **"Request timeout"**
   - Increase timeout value in configuration
   - Check API server status
   - Verify network connection

4. **"Empty response"**
   - The ID may not exist in the API database
   - Check ID format matches provider requirements
   - Verify API endpoint URL is correct

## Future Enhancements

- **Batch Requests**: Fetch multiple IDs in a single request
- **Response Transformation**: Transform API responses before storing
- **Caching**: Cache API responses to reduce redundant calls
- **Async Support**: Full async/await support in workflow execution
- **Response Mapping UI**: Visual mapping of API fields to node properties

