# Workflow Tools Documentation

This document provides comprehensive documentation for all workflow tools available in the GraphDB Model Builder. Each tool is designed to perform specific operations on XML elements during workflow execution.

## Table of Contents

1. [Control Flow Tools](#control-flow-tools)
2. [Data Processing Tools](#data-processing-tools)
3. [Collection Tools](#collection-tools)
4. [Validation & Transformation Tools](#validation--transformation-tools)
5. [Set Operations Tools](#set-operations-tools)
6. [Utility Tools](#utility-tools)
7. [Research API Tools](#research-api-tools)
8. [Authenticated API Tools](#authenticated-api-tools)
9. [HTTP Request Tools](#http-request-tools)
10. [Data Transformation Tools](#data-transformation-tools)
11. [Error Handling Tools](#error-handling-tools)
12. [Performance Tools](#performance-tools)
13. [Integration Tools](#integration-tools)

---

## Control Flow Tools

### `tool:if` - If/Else Conditional

**Purpose**: Execute different workflow paths based on conditions.

**Configuration**:
- Condition groups with AND/OR logic
- Multiple condition types (HasChildren, HasAttribute, HasText, etc.)
- True/False output paths

**Use Cases**:
- **TEI XML Processing**: Check if a `<seg>` element has children before processing
  ```xml
  <seg>
    <w>word1</w>
    <w>word2</w>
  </seg>
  ```
  Use `tool:if` with "HasChildren" condition to route to different actions based on whether children exist.

- **Conditional Node Creation**: Only create nodes when specific attributes are present
  ```xml
  <div type="chapter" n="1">...</div>
  <div type="section">...</div>
  ```
  Use `tool:if` to check for `type="chapter"` and create chapter nodes only for those elements.

- **Text Content Validation**: Process elements differently based on text content length
  ```xml
  <p>Short text</p>
  <p>This is a very long paragraph with extensive content...</p>
  ```
  Use `tool:if` with "HasTextContent" condition to handle short vs. long paragraphs differently.

---

### `tool:switch` - Switch/Case Routing

**Purpose**: Route workflow execution based on attribute values, element names, or text content.

**Configuration**:
- Switch source: attribute, elementName, or textContent
- Multiple cases with labels
- Default case handling

**Use Cases**:
- **Multi-Type Element Processing**: Process different element types with different actions
  ```xml
  <div type="chapter">...</div>
  <div type="section">...</div>
  <div type="appendix">...</div>
  ```
  Use `tool:switch` on `type` attribute to route to chapter, section, or appendix processing.

- **Language Detection**: Route based on language attribute
  ```xml
  <text xml:lang="en">English text</text>
  <text xml:lang="ar">نص عربي</text>
  ```
  Use `tool:switch` to route to different processing pipelines based on language.

- **Status-Based Processing**: Handle elements with different status values
  ```xml
  <item status="active">...</item>
  <item status="archived">...</item>
  <item status="pending">...</item>
  ```
  Use `tool:switch` to apply different actions based on status.

---

### `tool:loop` - Loop Through Children

**Purpose**: Iterate through child elements for processing.

**Configuration**:
- Filter children by tag names
- Maximum depth limit
- Skip ignored elements

**Use Cases**:
- **Recursive Processing**: Process all descendants of an element
  ```xml
  <body>
    <div>
      <p>Paragraph 1</p>
      <p>Paragraph 2</p>
    </div>
  </body>
  ```
  Use `tool:loop` to process all `<p>` elements within `<body>` regardless of nesting level.

- **Hierarchical Data Extraction**: Extract data from nested structures
  ```xml
  <document>
    <section>
      <subsection>
        <paragraph>...</paragraph>
      </subsection>
    </section>
  </document>
  ```
  Use `tool:loop` with max depth to control how deep to process.

---

### `tool:filter` - Filter Elements

**Purpose**: Skip specific elements or subtrees from processing.

**Configuration**:
- Filter mode: ignoreElement, ignoreSubtree, or ignoreTree
- Element names to filter

**Use Cases**:
- **Skip Metadata Elements**: Ignore editorial notes and metadata
  ```xml
  <text>
    <note>Editorial comment</note>
    <p>Actual content</p>
  </text>
  ```
  Use `tool:filter` to skip `<note>` elements while processing `<p>` elements.

- **Exclude Specific Tags**: Filter out unwanted elements
  ```xml
  <document>
    <header>...</header>
    <content>...</content>
    <footer>...</footer>
  </document>
  ```
  Use `tool:filter` to process only `<content>` and skip header/footer.

---

## Data Processing Tools

### `tool:transform` - Transform Attributes

**Purpose**: Map XML attributes to node properties.

**Configuration**:
- Source attribute names
- Target property names
- Default values

**Use Cases**:
- **Attribute Mapping**: Map XML attributes to graph properties
  ```xml
  <person id="P001" name="John Doe" age="30"/>
  ```
  Use `tool:transform` to map `id` → `personId`, `name` → `fullName`, `age` → `age`.

- **Normalize Attribute Names**: Standardize attribute naming
  ```xml
  <item xml:id="item1" type="product"/>
  ```
  Use `tool:transform` to map `xml:id` → `id` and `type` → `itemType`.

---

### `tool:map` - Map/Transform Structure

**Purpose**: Transform element structure by mapping sources to targets.

**Configuration**:
- Source: attribute, textContent, or elementName
- Target: attribute or property
- Optional transforms: lowercase, uppercase, trim

**Use Cases**:
- **Normalize Text Content**: Convert text to lowercase for consistency
  ```xml
  <tag>MIXED CASE TEXT</tag>
  ```
  Use `tool:map` with uppercase transform to normalize to "MIXED CASE TEXT".

- **Restructure Data**: Map element names to properties
  ```xml
  <div type="section">Content</div>
  ```
  Use `tool:map` to extract `type` attribute and store as `sectionType` property.

---

### `tool:reduce` - Reduce to Single Value

**Purpose**: Combine multiple values into a single result.

**Configuration**:
- Operation: concat, sum, or join
- Source: children, attribute, or textContent
- Separator for join operation
- Target property

**Use Cases**:
- **Concatenate Text**: Combine all child text into one property
  ```xml
  <paragraph>
    <word>Hello</word>
    <word>World</word>
  </paragraph>
  ```
  Use `tool:reduce` with concat to create "HelloWorld" or with join (separator=" ") to create "Hello World".

- **Sum Values**: Calculate total from child elements
  ```xml
  <invoice>
    <item price="10.50"/>
    <item price="25.00"/>
    <item price="5.75"/>
  </invoice>
  ```
  Use `tool:reduce` with sum operation to calculate total: 41.25.

---

## Collection Tools

### `tool:group` - Group Elements

**Purpose**: Group elements by a key value for separate processing paths.

**Configuration**:
- Group by: attribute, elementName, textContent, or computed
- Group key (for attribute grouping)
- Computed expression (for computed grouping)

**Use Cases**:
- **Group by Type**: Process elements separately by their type
  ```xml
  <items>
    <item type="book">...</item>
    <item type="book">...</item>
    <item type="article">...</item>
    <item type="article">...</item>
  </items>
  ```
  Use `tool:group` to create separate processing paths for "book" and "article" types.

- **Group by Language**: Separate multilingual content
  ```xml
  <texts>
    <text xml:lang="en">English</text>
    <text xml:lang="ar">Arabic</text>
    <text xml:lang="en">More English</text>
  </texts>
  ```
  Use `tool:group` to process English and Arabic texts separately.

- **Group by Computed Key**: Create groups based on multiple attributes
  ```xml
  <items>
    <item category="A" priority="high">...</item>
    <item category="A" priority="low">...</item>
    <item category="B" priority="high">...</item>
  </items>
  ```
  Use `tool:group` with computed expression `${category}-${priority}` to create groups like "A-high", "A-low", "B-high".

---

### `tool:collect` - Collect into Arrays

**Purpose**: Gather values from children or attributes into an array property.

**Configuration**:
- Target property name
- Source: children, attribute, or textContent
- Filter by tag names
- Store as array or single value

**Use Cases**:
- **Collect All Text**: Gather text from all child elements
  ```xml
  <paragraph>
    <word>First</word>
    <word>Second</word>
    <word>Third</word>
  </paragraph>
  ```
  Use `tool:collect` to create property `words: ["First", "Second", "Third"]`.

- **Collect Attributes**: Gather attribute values from children
  ```xml
  <section>
    <item id="1"/>
    <item id="2"/>
    <item id="3"/>
  </section>
  ```
  Use `tool:collect` to create property `itemIds: ["1", "2", "3"]`.

---

### `tool:aggregate` - Aggregate Values

**Purpose**: Perform aggregation operations (count, sum, avg, min, max) on child elements.

**Configuration**:
- Operation: count, sum, avg, min, max
- Source: children, attribute, or textContent
- Attribute name (if source is attribute)
- Filter by tag names
- Target property

**Use Cases**:
- **Count Children**: Count number of child elements
  ```xml
  <paragraph>
    <word>word1</word>
    <word>word2</word>
    <word>word3</word>
  </paragraph>
  ```
  Use `tool:aggregate` with count operation to get `wordCount: 3`.

- **Calculate Average**: Compute average from numeric attributes
  ```xml
  <scores>
    <score value="85"/>
    <score value="90"/>
    <score value="78"/>
  </scores>
  ```
  Use `tool:aggregate` with avg operation on `value` attribute to get `averageScore: 84.33`.

- **Find Maximum**: Get maximum value from children
  ```xml
  <prices>
    <price>10.50</price>
    <price>25.00</price>
    <price>5.75</price>
  </prices>
  ```
  Use `tool:aggregate` with max operation to get `maxPrice: 25.00`.

---

### `tool:sort` - Sort Elements

**Purpose**: Sort elements or children by attribute, text content, or element name.

**Configuration**:
- Sort by: attribute, textContent, or elementName
- Attribute name (if sorting by attribute)
- Order: ascending or descending
- Target: children or self

**Use Cases**:
- **Sort by Order Attribute**: Order elements by their position
  ```xml
  <list>
    <item order="3">Third</item>
    <item order="1">First</item>
    <item order="2">Second</item>
  </list>
  ```
  Use `tool:sort` to reorder elements by `order` attribute.

- **Alphabetical Sorting**: Sort by text content
  ```xml
  <names>
    <name>Charlie</name>
    <name>Alice</name>
    <name>Bob</name>
  </names>
  ```
  Use `tool:sort` to sort alphabetically: Alice, Bob, Charlie.

---

### `tool:limit` - Limit Processing

**Purpose**: Process only a limited number of elements (pagination support).

**Configuration**:
- Limit: maximum number of elements
- Offset: starting position
- Target: children or self

**Use Cases**:
- **Pagination**: Process first N elements
  ```xml
  <items>
    <item>1</item>
    <item>2</item>
    ...
    <item>100</item>
  </items>
  ```
  Use `tool:limit` with limit=10, offset=0 to process first 10 items, then offset=10 for next 10.

- **Testing**: Process only a subset for testing
  ```xml
  <large-document>
    <!-- thousands of elements -->
  </large-document>
  ```
  Use `tool:limit` to process only first 100 elements during development.

---

### `tool:split` - Split Elements

**Purpose**: Split elements based on delimiter, condition, or size.

**Configuration**:
- Split by: delimiter, condition, or size
- Delimiter string (for delimiter splitting)
- Condition type and value (for condition splitting)
- Chunk size (for size splitting)

**Use Cases**:
- **Split Text by Delimiter**: Split paragraph into sentences
  ```xml
  <p>First sentence. Second sentence. Third sentence.</p>
  ```
  Use `tool:split` with delimiter=". " to split into separate sentence elements.

- **Split by Condition**: Split when specific attribute appears
  ```xml
  <content>
    <item>Regular</item>
    <item type="separator">---</item>
    <item>After separator</item>
  </content>
  ```
  Use `tool:split` with condition "hasAttribute" and value "type" to split at separator items.

- **Chunk Processing**: Split into fixed-size chunks
  ```xml
  <words>
    <w>1</w><w>2</w>...<w>100</w>
  </words>
  ```
  Use `tool:split` with size=10 to process in chunks of 10 words.

---

### `tool:partition` - Partition into Groups

**Purpose**: Divide elements into partitions based on size or condition.

**Configuration**:
- Partition by: size or condition
- Chunk size (for size partitioning)
- Condition type and value (for condition partitioning)

**Use Cases**:
- **Batch Processing**: Partition large datasets into manageable chunks
  ```xml
  <data>
    <!-- 1000 elements -->
  </data>
  ```
  Use `tool:partition` with size=100 to create 10 partitions of 100 elements each.

- **Conditional Partitioning**: Split at specific markers
  ```xml
  <document>
    <p>Content</p>
    <hr/>
    <p>More content</p>
    <hr/>
    <p>Final content</p>
  </document>
  ```
  Use `tool:partition` with condition "hasAttribute" to partition at `<hr/>` elements.

---

### `tool:distinct` - Get Distinct Elements

**Purpose**: Remove duplicate elements based on criteria.

**Configuration**:
- Distinct by: attribute, textContent, or elementName
- Attribute name (if distinct by attribute)
- Target: children or self

**Use Cases**:
- **Remove Duplicates**: Get unique elements
  ```xml
  <tags>
    <tag>python</tag>
    <tag>javascript</tag>
    <tag>python</tag>
    <tag>java</tag>
  </tags>
  ```
  Use `tool:distinct` to get unique tags: python, javascript, java.

- **Unique Attributes**: Get elements with unique attribute values
  ```xml
  <items>
    <item id="1"/>
    <item id="2"/>
    <item id="1"/>
  </items>
  ```
  Use `tool:distinct` by `id` attribute to get only unique items.

---

### `tool:window` - Sliding Window Processing

**Purpose**: Process elements in sliding windows for n-gram analysis or moving operations.

**Configuration**:
- Window size
- Step size
- Operation: collect or aggregate
- Target property

**Use Cases**:
- **N-gram Analysis**: Extract word sequences
  ```xml
  <sentence>
    <w>The</w>
    <w>quick</w>
    <w>brown</w>
    <w>fox</w>
  </sentence>
  ```
  Use `tool:window` with size=2, step=1 to create bigrams: ["The quick", "quick brown", "brown fox"].

- **Moving Average**: Calculate moving averages
  ```xml
  <values>
    <v>10</v><v>20</v><v>30</v><v>40</v><v>50</v>
  </values>
  ```
  Use `tool:window` with size=3 to calculate 3-value moving averages.

---

## Validation & Transformation Tools

### `tool:validate` - Validate Structure

**Purpose**: Validate element structure and attributes before processing.

**Configuration**:
- Validation rules (requiredAttribute, requiredText, attributeFormat, textLength)
- On failure: skip, error, or default

**Use Cases**:
- **Required Fields Check**: Ensure required attributes exist
  ```xml
  <person id="P001" name="John"/>
  <person name="Jane"/> <!-- missing id -->
  ```
  Use `tool:validate` with requiredAttribute rule to skip elements without `id`.

- **Format Validation**: Validate attribute formats (e.g., email, date)
  ```xml
  <contact email="user@example.com"/>
  <contact email="invalid-email"/>
  ```
  Use `tool:validate` with attributeFormat rule and regex pattern to validate email format.

- **Text Length Validation**: Ensure text meets length requirements
  ```xml
  <title>Short</title>
  <title>This is a properly long title that meets requirements</title>
  ```
  Use `tool:validate` with textLength rule (minLength=20) to filter short titles.

---

## Set Operations Tools

### `tool:union` - Union of Sets

**Purpose**: Combine multiple sources into a union (unique values from all sources).

**Configuration**:
- Multiple sources (children, attribute, xpath)
- Target property

**Use Cases**:
- **Combine Multiple Lists**: Merge tags from different sources
  ```xml
  <article>
    <tags>python, javascript</tags>
    <categories>web, backend</categories>
  </article>
  ```
  Use `tool:union` to combine tags and categories into a single list: ["python", "javascript", "web", "backend"].

---

### `tool:intersect` - Intersection of Sets

**Purpose**: Find common elements between multiple sources.

**Configuration**:
- Multiple sources
- Match by: elementName, attribute, or textContent
- Attribute name (if matching by attribute)
- Target property

**Use Cases**:
- **Find Common Elements**: Identify shared items
  ```xml
  <comparison>
    <list1>
      <item>apple</item>
      <item>banana</item>
      <item>orange</item>
    </list1>
    <list2>
      <item>banana</item>
      <item>orange</item>
      <item>grape</item>
    </list2>
  </comparison>
  ```
  Use `tool:intersect` to find common items: ["banana", "orange"].

---

### `tool:diff` - Difference Between Sets

**Purpose**: Find elements in source A but not in source B.

**Configuration**:
- Source A and Source B
- Match by: elementName, attribute, or textContent
- Attribute name (if matching by attribute)
- Target property

**Use Cases**:
- **Find Differences**: Identify items in one list but not another
  ```xml
  <comparison>
    <old>
      <item>apple</item>
      <item>banana</item>
    </old>
    <new>
      <item>banana</item>
      <item>orange</item>
    </new>
  </comparison>
  ```
  Use `tool:diff` to find items removed (apple) or added (orange).

---

## Utility Tools

### `tool:lookup` - Lookup Elements

**Purpose**: Search for elements by ID, XPath, or attribute.

**Configuration**:
- Lookup type: id, xpath, or attribute
- Lookup value
- Store result

**Use Cases**:
- **Reference Resolution**: Find referenced elements
  ```xml
  <person id="P001" name="John"/>
  <reference target="P001"/>
  ```
  Use `tool:lookup` to find the person element with id="P001" from the reference.

---

### `tool:traverse` - Traverse DOM

**Purpose**: Navigate ancestor/descendant/sibling relationships.

**Configuration**:
- Direction: ancestor, descendant, or sibling
- Target tags
- Stop condition

**Use Cases**:
- **Find Ancestor**: Locate parent elements with specific tags
  ```xml
  <document>
    <chapter>
      <paragraph>
        <word>text</word>
      </paragraph>
    </chapter>
  </document>
  ```
  Use `tool:traverse` to find the `<chapter>` ancestor from a `<word>` element.

---

### `tool:merge` - Merge Elements

**Purpose**: Combine multiple elements into one.

**Configuration**:
- Merge strategy: first, last, or combine
- Source elements

**Use Cases**:
- **Combine Siblings**: Merge adjacent elements
  ```xml
  <content>
    <p>First paragraph</p>
    <p>Second paragraph</p>
  </content>
  ```
  Use `tool:merge` to combine both paragraphs into a single element.

---

### `tool:join` - Join Elements

**Purpose**: Join elements by text content or attributes.

**Configuration**:
- Join with: siblings, children, or parent
- Join by: textContent or attribute
- Separator

**Use Cases**:
- **Join Text**: Combine text from multiple elements
  ```xml
  <sentence>
    <w>Hello</w>
    <w>World</w>
  </sentence>
  ```
  Use `tool:join` to create "Hello World" from child elements.

---

### `tool:exists` - Check Existence

**Purpose**: Check if element, attribute, or text exists.

**Configuration**:
- Check type: element, attribute, or text
- Element name or attribute name
- Target property

**Use Cases**:
- **Conditional Processing**: Check if optional elements exist
  ```xml
  <article>
    <title>Article Title</title>
    <!-- abstract may or may not exist -->
  </article>
  ```
  Use `tool:exists` to check if `<abstract>` exists before processing.

---

### `tool:range` - Process Range

**Purpose**: Process a specific range of elements (start, end, step).

**Configuration**:
- Start index
- End index
- Step size
- Target: children or self

**Use Cases**:
- **Process Subset**: Process every Nth element
  ```xml
  <items>
    <item>1</item>
    <item>2</item>
    ...
    <item>100</item>
  </items>
  ```
  Use `tool:range` with start=0, end=100, step=2 to process every other item (even indices).

---

### `tool:batch` - Batch Processing

**Purpose**: Process elements in batches for performance optimization.

**Configuration**:
- Batch size
- Target: children or self
- Process in parallel

**Use Cases**:
- **Large Dataset Processing**: Process large XML files in batches
  ```xml
  <large-dataset>
    <!-- thousands of elements -->
  </large-dataset>
  ```
  Use `tool:batch` with batchSize=1000 to process in manageable chunks.

---

### `tool:delay` - Delay Processing

**Purpose**: Add delay between processing steps (useful for rate limiting).

**Configuration**:
- Delay in milliseconds

**Use Cases**:
- **Rate Limiting**: Add delays when processing external APIs
  ```xml
  <api-calls>
    <call>...</call>
    <call>...</call>
  </api-calls>
  ```
  Use `tool:delay` to add 1000ms delay between API calls to respect rate limits.

---

## Tool Combinations

Tools can be chained together to create complex workflows:

1. **Filter → Group → Aggregate**: Filter elements, group by type, then aggregate values
2. **Validate → Transform → Collect**: Validate structure, transform attributes, then collect results
3. **Split → Sort → Limit**: Split text, sort results, then limit to top N
4. **If → Switch → Loop**: Conditional routing, then switch-based processing, then loop through results

---

## Best Practices

1. **Use If/Switch for Routing**: Use conditional tools early in the workflow to route elements to appropriate processing paths
2. **Filter Before Processing**: Use `tool:filter` to exclude unwanted elements early, improving performance
3. **Validate Early**: Use `tool:validate` to catch invalid data before processing
4. **Batch Large Datasets**: Use `tool:batch` for large XML files to manage memory
5. **Combine Tools**: Chain multiple tools together for complex transformations

---

## Performance Considerations

- **Limit Tool**: Use `tool:limit` during development to test with small datasets
- **Batch Tool**: Use `tool:batch` for production processing of large files
- **Filter Tool**: Use `tool:filter` early to reduce processing overhead
- **Distinct Tool**: Use `tool:distinct` to reduce duplicate processing

---

## Research API Tools

### `tool:fetch-api` - Fetch API

**Purpose**: Fetch data from research APIs (Wikidata, GND, VIAF, ORCID, GeoNames, DBLP, CrossRef, Europeana, Getty, Library of Congress, and custom APIs).

**Configuration**:
- API Provider: Select from available research APIs
- ID Source: attribute, textContent, or xpath
- ID Attribute: Attribute name containing the ID
- ID XPath: XPath expression to extract ID
- API Key: Optional API key for authenticated endpoints
- Custom Endpoint: Custom API endpoint URL
- Custom Headers: Additional HTTP headers
- Timeout: Request timeout in milliseconds
- Store in Context: Key to store response in context

**Use Cases**:
- **Wikidata Lookup**: Fetch person data from Wikidata using Q-number
  ```xml
  <person xml:id="Q42">Douglas Adams</person>
  ```
  Use `tool:fetch-api` with provider "wikidata" and ID source "attribute" (xml:id) to fetch person data.

- **GND Authority Data**: Retrieve authority records from GND
  ```xml
  <author gnd="118500398">Goethe, Johann Wolfgang von</author>
  ```
  Use `tool:fetch-api` with provider "gnd" to fetch author information.

- **Custom API Integration**: Connect to any REST API
  ```xml
  <item id="12345">Product</item>
  ```
  Use `tool:fetch-api` with custom endpoint to fetch product details from your API.

---

## Authenticated API Tools

### `tool:fetch-orcid` - Fetch ORCID

**Purpose**: Fetch researcher data from ORCID API (requires credentials).

**Configuration**:
- Credential: Select stored ORCID credential
- ID Source: attribute, textContent, or xpath
- ID Attribute: Attribute name containing the ORCID ID
- Store in Context: Key to store response

**Use Cases**:
- **Researcher Profile**: Fetch researcher profile from ORCID
  ```xml
  <researcher orcid="0000-0002-1825-0097">Jane Doe</researcher>
  ```
  Use `tool:fetch-orcid` to retrieve researcher publications, affiliations, and other data.

---

### `tool:fetch-geonames` - Fetch GeoNames

**Purpose**: Fetch geographical data from GeoNames API (requires credentials).

**Configuration**:
- Credential: Select stored GeoNames credential
- ID Source: attribute, textContent, or xpath
- ID Attribute: Attribute name containing the GeoNames ID
- Store in Context: Key to store response

**Use Cases**:
- **Location Data**: Fetch location information from GeoNames
  ```xml
  <place geonames="2921044">Frankfurt</place>
  ```
  Use `tool:fetch-geonames` to retrieve coordinates, administrative divisions, and other geographical data.

---

### `tool:fetch-europeana` - Fetch Europeana

**Purpose**: Fetch cultural heritage data from Europeana API (requires credentials).

**Configuration**:
- Credential: Select stored Europeana credential
- ID Source: attribute, textContent, or xpath
- ID Attribute: Attribute name containing the Europeana ID
- Store in Context: Key to store response

**Use Cases**:
- **Cultural Heritage Objects**: Fetch metadata from Europeana
  ```xml
  <artifact europeana="2020903/Gallica_ark_12148_bpt6k1523045v">Manuscript</artifact>
  ```
  Use `tool:fetch-europeana` to retrieve object metadata, images, and descriptions.

---

### `tool:fetch-getty` - Fetch Getty

**Purpose**: Fetch vocabulary data from Getty Vocabularies API (requires credentials).

**Configuration**:
- Credential: Select stored Getty credential
- ID Source: attribute, textContent, or xpath
- ID Attribute: Attribute name containing the Getty ID
- Store in Context: Key to store response

**Use Cases**:
- **Art Vocabulary**: Fetch art terminology from Getty Vocabularies
  ```xml
  <term getty="300264080">Painting</term>
  ```
  Use `tool:fetch-getty` to retrieve vocabulary terms, definitions, and related concepts.

---

## HTTP Request Tools

### `tool:http` - HTTP Request

**Purpose**: Make HTTP/HTTPS requests to any API endpoint with flexible authentication and configuration.

**Configuration**:
- Method: GET, POST, PUT, DELETE, PATCH
- URL: Target API endpoint
- Authentication: Use stored credential or configure inline
- Headers: Custom HTTP headers
- Query Parameters: URL query parameters
- Request Body: Body content (JSON, text, form-data, x-www-form-urlencoded)
- Timeout: Request timeout in milliseconds
- Store in Context: Key to store response

**Use Cases**:
- **Generic API Integration**: Connect to any REST API
  ```xml
  <user id="123">John Doe</user>
  ```
  Use `tool:http` to fetch user details from your custom API endpoint.

- **POST Data**: Send data to an API
  ```xml
  <event type="user_action">Click</event>
  ```
  Use `tool:http` with POST method to send event data to analytics API.

- **Authenticated Requests**: Use stored credentials for secure API access
  ```xml
  <resource id="abc123">Resource</resource>
  ```
  Use `tool:http` with stored credential to access protected resources.

---

## Data Transformation Tools

### `tool:normalize` - Normalize

**Purpose**: Normalize data formats (dates, numbers, text, URLs) to consistent standards.

**Configuration**:
- Format: date, number, text, or url
- Target Property: Property name to store normalized value

**Use Cases**:
- **Date Normalization**: Convert various date formats to ISO 8601
  ```xml
  <date>12/25/2023</date>
  <date>2023-12-25</date>
  ```
  Use `tool:normalize` with format "date" to convert all dates to ISO format.

- **Number Normalization**: Standardize numeric values
  ```xml
  <price>$1,234.56</price>
  <price>1234.56</price>
  ```
  Use `tool:normalize` with format "number" to extract numeric values.

- **URL Normalization**: Normalize URLs to lowercase
  ```xml
  <link>HTTPS://EXAMPLE.COM/PATH</link>
  ```
  Use `tool:normalize` with format "url" to normalize URL casing.

---

### `tool:enrich` - Enrich

**Purpose**: Enrich data from multiple sources, combining information from different APIs or data stores.

**Configuration**:
- Sources: Array of source keys to combine
- Target Property: Property name to store enriched data

**Use Cases**:
- **Multi-Source Enrichment**: Combine data from multiple APIs
  ```xml
  <person id="Q42">Douglas Adams</person>
  ```
  Use `tool:enrich` to combine Wikidata data with ORCID data for comprehensive person profiles.

- **Data Aggregation**: Merge data from different sources
  ```xml
  <publication doi="10.1234/example">Paper Title</publication>
  ```
  Use `tool:enrich` to combine CrossRef data with DBLP data for complete publication information.

---

### `tool:deduplicate` - Deduplicate

**Purpose**: Advanced deduplication with fuzzy matching to identify and handle duplicate nodes.

**Configuration**:
- Property: Property name to check for duplicates
- Fuzzy Matching: Enable fuzzy matching for similar values

**Use Cases**:
- **Remove Duplicates**: Identify and merge duplicate nodes
  ```xml
  <person name="John Doe"/>
  <person name="John D. Doe"/>
  ```
  Use `tool:deduplicate` with fuzzy matching to identify these as the same person.

- **Data Quality**: Clean duplicate entries
  ```xml
  <item id="1" name="Product A"/>
  <item id="2" name="Product A"/>
  ```
  Use `tool:deduplicate` to flag or merge duplicate items.

---

### `tool:validate-schema` - Validate Schema

**Purpose**: Validate data against schema definitions to ensure data quality and compliance.

**Configuration**:
- Schema: Schema definition object
- Strict: Fail on validation errors (true) or continue with warnings (false)

**Use Cases**:
- **Data Quality Assurance**: Validate node properties against schema
  ```xml
  <person id="P001" name="John" email="invalid-email"/>
  ```
  Use `tool:validate-schema` to ensure email format, required fields, and data types are correct.

- **Compliance Checking**: Verify data meets standards
  ```xml
  <publication doi="invalid-doi">Title</publication>
  ```
  Use `tool:validate-schema` to validate DOI format and other required metadata.

---

### `tool:clean` - Clean

**Purpose**: Clean data by removing special characters, normalizing whitespace, and applying text transformations.

**Configuration**:
- Operations: Array of operations (trim, removeSpecialChars, normalizeWhitespace, lowercase, uppercase)
- Target Property: Property name to store cleaned value

**Use Cases**:
- **Text Cleaning**: Remove special characters and normalize text
  ```xml
  <text>  Hello,   World!!!  </text>
  ```
  Use `tool:clean` with operations: trim, normalizeWhitespace, removeSpecialChars to get "Hello World".

- **Data Sanitization**: Clean user input
  ```xml
  <input>  USER@EXAMPLE.COM  </input>
  ```
  Use `tool:clean` with lowercase and trim to normalize email addresses.

---

### `tool:standardize` - Standardize

**Purpose**: Standardize formats for addresses, names, phone numbers, emails, and other structured data.

**Configuration**:
- Format: address, name, phone, or email
- Target Property: Property name to store standardized value

**Use Cases**:
- **Name Standardization**: Format names consistently
  ```xml
  <name>john doe</name>
  <name>JOHN DOE</name>
  ```
  Use `tool:standardize` with format "name" to get "John Doe" for both.

- **Phone Number Standardization**: Normalize phone numbers
  ```xml
  <phone>(123) 456-7890</phone>
  <phone>123-456-7890</phone>
  ```
  Use `tool:standardize` with format "phone" to get "1234567890" for both.

- **Email Standardization**: Normalize email addresses
  ```xml
  <email>  USER@EXAMPLE.COM  </email>
  ```
  Use `tool:standardize` with format "email" to get "user@example.com".

---

### `tool:verify` - Verify

**Purpose**: Verify data integrity and completeness by checking required properties and constraints.

**Configuration**:
- Checks: Array of checks (required, format, range, etc.)
- Properties: Array of property names to verify

**Use Cases**:
- **Completeness Check**: Verify all required fields are present
  ```xml
  <person id="P001" name="John"/>
  <person name="Jane"/> <!-- missing id -->
  ```
  Use `tool:verify` with check "required" to identify incomplete records.

- **Data Integrity**: Verify data meets constraints
  ```xml
  <product price="invalid">Product</product>
  ```
  Use `tool:verify` to ensure price is a valid number within acceptable range.

---

## Error Handling Tools

### `tool:try-catch` - Try Catch

**Purpose**: Error handling with fallback paths for robust workflow execution.

**Configuration**:
- Fallback Path: Path to execute on error
- Error Handling: Strategy for handling errors (continue, stop, retry)

**Use Cases**:
- **Error Recovery**: Handle API failures gracefully
  ```xml
  <person id="Q999999">Unknown Person</person>
  ```
  Use `tool:try-catch` to catch API errors and use fallback data or skip processing.

- **Robust Processing**: Continue workflow even when some operations fail
  ```xml
  <item id="1">Item 1</item>
  <item id="invalid">Item 2</item>
  ```
  Use `tool:try-catch` to process valid items even if some fail validation.

---

### `tool:retry` - Retry

**Purpose**: Retry failed operations with exponential backoff for transient failures.

**Configuration**:
- Max Retries: Maximum number of retry attempts
- Backoff Strategy: Exponential or linear backoff
- Initial Delay: Initial delay in milliseconds

**Use Cases**:
- **API Resilience**: Retry failed API calls
  ```xml
  <api-call id="123">Request</api-call>
  ```
  Use `tool:retry` with maxRetries=3 to handle temporary API failures.

- **Network Reliability**: Handle network timeouts
  ```xml
  <fetch url="https://api.example.com/data">Data</fetch>
  ```
  Use `tool:retry` to automatically retry on network errors.

---

### `tool:timeout` - Timeout

**Purpose**: Set timeouts for operations to prevent hanging workflows.

**Configuration**:
- Timeout: Timeout duration in milliseconds
- On Timeout: Action to take (fail, skip, use-default)

**Use Cases**:
- **Prevent Hanging**: Set timeouts for slow operations
  ```xml
  <slow-operation>Process</slow-operation>
  ```
  Use `tool:timeout` with timeout=5000 to fail operations that take longer than 5 seconds.

- **API Timeout Management**: Prevent indefinite waits
  ```xml
  <api-call>Request</api-call>
  ```
  Use `tool:timeout` to ensure API calls don't hang indefinitely.

---

## Performance Tools

### `tool:cache` - Cache

**Purpose**: Cache results for repeated operations to improve performance.

**Configuration**:
- Cache Key: Key to identify cached results
- TTL: Time-to-live in milliseconds
- Cache Strategy: Cache strategy (memory, disk, distributed)

**Use Cases**:
- **API Response Caching**: Cache API responses
  ```xml
  <person id="Q42">Douglas Adams</person>
  ```
  Use `tool:cache` to cache Wikidata responses and avoid repeated API calls for the same person.

- **Performance Optimization**: Cache expensive computations
  ```xml
  <complex-calculation>Compute</complex-calculation>
  ```
  Use `tool:cache` to store calculation results and reuse them for similar inputs.

---

### `tool:parallel` - Parallel

**Purpose**: Execute multiple operations in parallel for improved performance.

**Configuration**:
- Max Concurrency: Maximum number of parallel operations
- Batch Size: Number of operations per batch

**Use Cases**:
- **Parallel API Calls**: Fetch data from multiple APIs simultaneously
  ```xml
  <person id="Q42">Douglas Adams</person>
  ```
  Use `tool:parallel` to fetch from Wikidata, ORCID, and DBLP simultaneously.

- **Batch Processing**: Process multiple elements in parallel
  ```xml
  <items>
    <item>1</item>
    <item>2</item>
    <item>3</item>
  </items>
  ```
  Use `tool:parallel` to process all items concurrently.

---

### `tool:throttle` - Throttle

**Purpose**: Throttle API requests to respect rate limits and prevent overwhelming external services.

**Configuration**:
- Rate Limit: Maximum requests per time period
- Time Period: Time period in milliseconds
- Strategy: Throttle strategy (fixed, sliding window)

**Use Cases**:
- **Rate Limit Compliance**: Respect API rate limits
  ```xml
  <api-calls>
    <call>1</call>
    <call>2</call>
    <!-- many more -->
  </api-calls>
  ```
  Use `tool:throttle` with rateLimit=10 per 1000ms to limit API calls.

- **Prevent Overload**: Protect external services
  ```xml
  <requests>Many requests</requests>
  ```
  Use `tool:throttle` to prevent overwhelming external APIs with too many requests.

---

## Integration Tools

### `tool:webhook` - Webhook

**Purpose**: Send webhooks on events to integrate with external systems.

**Configuration**:
- URL: Webhook endpoint URL
- Method: HTTP method (POST, PUT, etc.)
- Payload: Webhook payload data
- Headers: Custom HTTP headers

**Use Cases**:
- **Event Notifications**: Notify external systems of events
  ```xml
  <event type="node_created">New Node</event>
  ```
  Use `tool:webhook` to send notifications to external systems when nodes are created.

- **Integration**: Integrate with third-party services
  ```xml
  <action type="update">Data Updated</action>
  ```
  Use `tool:webhook` to trigger actions in external systems.

---

### `tool:email` - Email

**Purpose**: Send email notifications for workflow events and alerts.

**Configuration**:
- To: Recipient email address
- Subject: Email subject
- Body: Email body content
- Format: Email format (text, html)

**Use Cases**:
- **Alert Notifications**: Send alerts on errors
  ```xml
  <error type="validation">Validation Failed</error>
  ```
  Use `tool:email` to send email alerts when validation errors occur.

- **Status Updates**: Notify users of workflow completion
  ```xml
  <workflow status="completed">Processing Complete</workflow>
  ```
  Use `tool:email` to send completion notifications.

---

### `tool:log` - Log

**Purpose**: Log data for debugging and auditing purposes.

**Configuration**:
- Level: Log level (info, warn, error, debug)
- Message: Log message
- Data: Additional data to log

**Use Cases**:
- **Debugging**: Log workflow execution details
  ```xml
  <operation>Process Data</operation>
  ```
  Use `tool:log` with level "debug" to log detailed execution information.

- **Auditing**: Track workflow execution
  ```xml
  <action type="create">Create Node</action>
  ```
  Use `tool:log` with level "info" to maintain audit logs of all actions.

---

*Last Updated: 2024*

