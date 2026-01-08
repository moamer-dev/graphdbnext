# GraphDBNext Workflow Tools and Actions Reference

This document provides comprehensive documentation for all tools and actions available in the GraphDBNext workflow system, specifically designed for digital humanities research workflows.

## Overview

The GraphDBNext workflow system consists of two main components:
- **Tools**: Control flow, data processing, and external API integration
- **Actions**: Graph database operations for creating nodes, relationships, and properties

Tools and actions are organized into categories and can be combined to create complex XML-to-graph conversion workflows.

---

## 🔧 TOOLS

### Logic & Control Tools

#### `tool:if` - Conditional Branching
**Description**: Conditional branching based on element properties or conditions
**Usage**: Route workflow execution based on XML element attributes, text content, or external conditions
**Configuration**:
- Condition type (attribute exists, text matches, etc.)
- Comparison values
- True/false branches
**Use Cases**:
- Process different XML element types differently
- Skip processing based on element attributes
- Apply different transformation rules based on content

#### `tool:switch` - Multi-Way Branching
**Description**: Multi-way branching based on property values
**Usage**: Route execution to different paths based on enumerated values
**Configuration**:
- Switch property/expression
- Case values and corresponding branches
- Default branch for unmatched values
**Use Cases**:
- Handle different TEI element types (@type attribute values)
- Route based on language codes or document types
- Process different citation styles

#### `tool:loop` - Iterative Processing
**Description**: Iterate over child elements or collections
**Usage**: Process multiple XML elements or data items sequentially
**Configuration**:
- Loop source (child elements, property array, etc.)
- Loop variable name
- Maximum iterations limit
**Use Cases**:
- Process all `<persName>` elements in a TEI document
- Iterate through bibliography entries
- Process multiple language versions

### Data Flow Tools

#### `tool:merge` - Data Stream Combination
**Description**: Combine multiple data streams into a single stream
**Usage**: Merge results from parallel processing branches
**Configuration**:
- Input streams to merge
- Merge strategy (append, union, intersection)
- Duplicate handling
**Use Cases**:
- Combine person data from multiple XML sources
- Merge bibliography entries from different formats
- Consolidate metadata from various APIs

#### `tool:filter` - Element Filtering
**Description**: Filter elements based on conditions
**Usage**: Select specific XML elements for further processing
**Configuration**:
- Filter conditions (property matches, regex, etc.)
- Logical operators (AND, OR, NOT)
- Case sensitivity options
**Use Cases**:
- Extract only `<persName>` elements with @type="author"
- Filter bibliography entries by date range
- Select elements with specific language attributes

#### `tool:split` - Data Stream Division
**Description**: Split data into multiple streams based on conditions
**Usage**: Divide processing into parallel branches
**Configuration**:
- Split criteria (property values, patterns, etc.)
- Number of output streams
- Default stream for unmatched items
**Use Cases**:
- Separate person names by role (author, editor, translator)
- Split bibliography by document type
- Route elements by language or region

### Time & Delay Tools

#### `tool:delay` - Processing Delay
**Description**: Add delay between processing steps
**Usage**: Control processing rate or add timing between operations
**Configuration**:
- Delay duration (milliseconds/seconds)
- Delay type (fixed, random range)
**Use Cases**:
- Respect API rate limits
- Add pacing between database operations
- Simulate real-time processing delays

### Aggregation Tools

#### `tool:aggregate` - Data Aggregation
**Description**: Calculate aggregates (count, sum, average, etc.)
**Usage**: Perform statistical calculations on data collections
**Configuration**:
- Aggregation function (COUNT, SUM, AVG, MIN, MAX)
- Group by properties
- Output format
**Use Cases**:
- Count publications per author
- Calculate average word counts in TEI documents
- Aggregate citation counts by year

#### `tool:collect` - Element Collection
**Description**: Collect elements into a list or array
**Usage**: Gather related elements for batch processing
**Configuration**:
- Collection size limit
- Sorting options
- Unique constraints
**Use Cases**:
- Collect all footnote references
- Gather bibliography entries for batch processing
- Accumulate related entities for network analysis

#### `tool:reduce` - Data Reduction
**Description**: Reduce elements to a single value
**Usage**: Combine multiple values into a single result
**Configuration**:
- Reduction function (concatenate, sum, custom)
- Initial value
- Accumulator logic
**Use Cases**:
- Concatenate multiple text fragments
- Sum word counts across documents
- Combine author names into a single string

### Sorting & Limiting Tools

#### `tool:sort` - Element Sorting
**Description**: Sort elements by property values
**Usage**: Order data for processing or output
**Configuration**:
- Sort property
- Sort direction (ascending/descending)
- Secondary sort criteria
**Use Cases**:
- Sort bibliography by publication date
- Order persons by name alphabetically
- Arrange documents chronologically

#### `tool:limit` - Result Limiting
**Description**: Limit number of elements processed
**Usage**: Control processing scope for performance or sampling
**Configuration**:
- Maximum number of elements
- Offset for pagination
- Random sampling option
**Use Cases**:
- Process first 100 bibliography entries
- Sample documents for testing
- Limit API results for performance

#### `tool:distinct` - Duplicate Removal
**Description**: Remove duplicate elements based on properties
**Usage**: Eliminate duplicate entries in datasets
**Configuration**:
- Properties to compare for uniqueness
- Duplicate handling strategy (keep first, merge, etc.)
**Use Cases**:
- Remove duplicate person entries
- Eliminate repeated bibliography items
- Deduplicate place names

### Transformation Tools

#### `tool:transform` - Data Transformation
**Description**: Transform element properties using expressions
**Usage**: Modify data values during processing
**Configuration**:
- Transformation expressions (JavaScript-like)
- Input/output property mapping
- Error handling for invalid transformations
**Use Cases**:
- Convert date formats in TEI documents
- Normalize person name formats
- Transform citation styles

#### `tool:map` - Element Mapping
**Description**: Apply function to each element
**Usage**: Transform each item in a collection
**Configuration**:
- Mapping function
- Input collection
- Output format
**Use Cases**:
- Convert all dates to ISO format
- Extract domain names from URLs
- Apply text normalization to all titles

#### `tool:validate` - Data Validation
**Description**: Validate element structure and content
**Usage**: Ensure data quality before processing
**Configuration**:
- Validation rules (required fields, formats, ranges)
- Error reporting options
- Strict vs. permissive validation
**Use Cases**:
- Validate TEI XML structure
- Check bibliography completeness
- Verify person data formats

### Set Operations Tools

#### `tool:join` - Data Joining
**Description**: Join elements from different sources
**Usage**: Combine related data from multiple inputs
**Configuration**:
- Join keys/properties
- Join type (inner, left, right, full)
- Output structure
**Use Cases**:
- Join author data with publication data
- Link places with geographical coordinates
- Connect persons with their ORCID profiles

#### `tool:union` - Set Union
**Description**: Combine unique elements from multiple sources
**Usage**: Merge datasets without duplicates
**Configuration**:
- Input sources
- Uniqueness criteria
- Conflict resolution
**Use Cases**:
- Merge bibliography from multiple sources
- Combine person databases
- Consolidate authority files

#### `tool:intersect` - Set Intersection
**Description**: Find common elements between datasets
**Usage**: Identify overlapping entities
**Configuration**:
- Input datasets
- Comparison criteria
- Output format
**Use Cases**:
- Find common authors between datasets
- Identify shared places across documents
- Discover overlapping citations

#### `tool:diff` - Set Difference
**Description**: Find differences between datasets
**Usage**: Identify unique elements in one dataset
**Configuration**:
- Source and comparison datasets
- Difference direction (A-B or B-A)
**Use Cases**:
- Find new publications not in existing database
- Identify persons missing from authority files
- Discover unique elements in comparative studies

### Advanced Tools

#### `tool:lookup` - Data Lookup
**Description**: Lookup values in reference data or external sources
**Usage**: Enrich data with reference information
**Configuration**:
- Lookup source (database, API, file)
- Lookup keys
- Return values
**Use Cases**:
- Lookup author affiliations from institutional database
- Get geographical coordinates for place names
- Retrieve authority file identifiers

#### `tool:traverse` - Graph Traversal
**Description**: Traverse graph relationships
**Usage**: Navigate graph structures for complex queries
**Configuration**:
- Starting nodes
- Traversal pattern
- Depth limits
- Relationship filters
**Use Cases**:
- Find co-authors through publication networks
- Trace citation chains
- Discover related concepts through ontologies

#### `tool:partition` - Data Partitioning
**Description**: Partition elements into groups
**Usage**: Divide data for parallel processing or analysis
**Configuration**:
- Partition criteria
- Number of partitions
- Balancing strategy
**Use Cases**:
- Distribute documents by language for parallel processing
- Group bibliography by publication type
- Partition large datasets for analysis

#### `tool:window` - Window Functions
**Description**: Apply window functions over data windows
**Usage**: Calculate values over sliding windows of data
**Configuration**:
- Window size and type
- Window function (rank, row number, etc.)
- Ordering within windows
**Use Cases**:
- Calculate moving averages of publication counts
- Rank authors by citation count within time periods
- Assign sequential numbers to elements

#### `tool:exists` - Existence Checking
**Description**: Check if element exists in reference data
**Usage**: Validate references and prevent duplicates
**Configuration**:
- Reference dataset
- Existence criteria
- Match confidence threshold
**Use Cases**:
- Check if person already exists in database
- Validate place name references
- Prevent duplicate bibliography entries

#### `tool:range` - Range Generation
**Description**: Generate range of values
**Usage**: Create sequences or date ranges
**Configuration**:
- Range start/end
- Step size
- Value type (numbers, dates, etc.)
**Use Cases**:
- Generate date ranges for temporal analysis
- Create page number sequences
- Produce ID ranges for batch processing

#### `tool:batch` - Batch Processing
**Description**: Process elements in configurable batches
**Usage**: Handle large datasets efficiently
**Configuration**:
- Batch size
- Processing function
- Error handling per batch
**Use Cases**:
- Process large TEI corpora in chunks
- Batch API requests to respect rate limits
- Handle memory constraints with large datasets

### Research APIs Tools

#### `tool:fetch-api` - Generic API Fetching
**Description**: Fetch data from research APIs (Wikidata, GND, VIAF, etc.)
**Usage**: Enrich entities with authoritative data
**Configuration**:
- API provider (wikidata, gnd, viaf, orcid, geonames, dblp, crossref, europeana, getty, loc)
- ID extraction method (attribute, text content, xpath)
- Custom endpoint for non-standard APIs
- Authentication credentials
- Timeout and retry settings
**Use Cases**:
- Enrich person entities with Wikidata biographical data
- Add geographical coordinates from GeoNames
- Retrieve publication metadata from CrossRef

### Authenticated APIs Tools

#### `tool:fetch-orcid` - ORCID Researcher Data
**Description**: Fetch researcher profiles and publications from ORCID
**Usage**: Enrich author data with comprehensive researcher information
**Configuration**:
- ORCID identifier extraction
- Credential ID for API access
- Data fields to retrieve (profile, works, employment, etc.)
**Use Cases**:
- Link TEI `<persName>` elements to full researcher profiles
- Retrieve publication lists for bibliography enrichment
- Add institutional affiliations to author data

#### `tool:fetch-geonames` - Geographical Data
**Description**: Fetch geographical data and place authorities from GeoNames
**Usage**: Add geospatial context to place references
**Configuration**:
- GeoNames ID or place name extraction
- Username/API key for GeoNames access
- Data fields (coordinates, administrative divisions, etc.)
**Use Cases**:
- Add latitude/longitude to place names in TEI documents
- Resolve historical place names to modern coordinates
- Enrich location data with administrative hierarchies

#### `tool:fetch-europeana` - Cultural Heritage Data
**Description**: Access cultural heritage metadata from Europeana
**Usage**: Connect textual references to digital cultural objects
**Configuration**:
- Europeana record ID extraction
- API key for Europeana access
- Metadata fields to retrieve
**Use Cases**:
- Link artwork references to digital images
- Connect historical objects to detailed metadata
- Enrich cultural heritage references in texts

#### `tool:fetch-getty` - Art & Architecture Vocabularies
**Description**: Access Getty vocabularies for art and architecture
**Usage**: Standardize art historical terminology and references
**Configuration**:
- Getty vocabulary ID extraction
- API credentials
- Vocabulary type (AAT, TGN, ULAN, etc.)
**Use Cases**:
- Standardize art movement classifications
- Resolve artist names to authority records
- Add geographical context for art historical locations

### HTTP Requests Tools

#### `tool:http` - Generic HTTP Requests
**Description**: Make HTTP/HTTPS requests to any API endpoint
**Usage**: Integrate with custom or proprietary APIs
**Configuration**:
- HTTP method (GET, POST, PUT, DELETE, PATCH)
- URL and query parameters
- Request headers and body
- Authentication (Bearer, Basic, API Key, Custom)
- Timeout and retry settings
**Use Cases**:
- Integrate with institutional repositories
- Connect to custom research databases
- Access proprietary scholarly APIs

### Data Transformation Tools

#### `tool:normalize` - Data Normalization
**Description**: Normalize data formats (dates, numbers, text)
**Usage**: Standardize inconsistent data formats
**Configuration**:
- Normalization rules for different data types
- Locale and format preferences
- Error handling for invalid formats
**Use Cases**:
- Standardize date formats across TEI documents
- Normalize person name formats
- Convert various number formats to consistent representations

#### `tool:enrich` - Data Enrichment
**Description**: Enrich data from multiple sources
**Usage**: Add additional information from external sources
**Configuration**:
- Enrichment sources and methods
- Matching criteria
- Conflict resolution strategies
**Use Cases**:
- Add biographical data to person entities
- Enrich publications with citation counts
- Add contextual information to place names

#### `tool:deduplicate` - Advanced Deduplication
**Description**: Remove duplicates using fuzzy matching
**Usage**: Identify and merge similar but not identical entries
**Configuration**:
- Similarity algorithms (Levenshtein, Soundex, etc.)
- Similarity thresholds
- Merge strategies for conflicting data
**Use Cases**:
- Merge variant spellings of person names
- Consolidate similar place name references
- Combine duplicate bibliography entries

#### `tool:validate-schema` - Schema Validation
**Description**: Validate data against schema definitions
**Usage**: Ensure data conforms to expected structures
**Configuration**:
- Schema definition (JSON Schema, XML Schema, etc.)
- Validation strictness
- Error reporting format
**Use Cases**:
- Validate TEI XML against schemas
- Check bibliography data completeness
- Ensure person records have required fields

#### `tool:clean` - Data Cleaning
**Description**: Clean data (trim whitespace, remove special characters)
**Usage**: Prepare raw data for processing
**Configuration**:
- Cleaning operations (trim, normalize whitespace, etc.)
- Character encoding handling
- Special character processing
**Use Cases**:
- Clean OCR-generated text
- Normalize whitespace in TEI documents
- Remove formatting artifacts from data

#### `tool:standardize` - Format Standardization
**Description**: Standardize formats (addresses, names, etc.)
**Usage**: Apply consistent formatting across datasets
**Configuration**:
- Standardization rules for different data types
- Locale-specific formatting
- Custom standardization patterns
**Use Cases**:
- Standardize author name formats
- Normalize address formats
- Apply consistent date formatting

#### `tool:verify` - Data Verification
**Description**: Verify data integrity and completeness
**Usage**: Check data quality and consistency
**Configuration**:
- Verification rules and checks
- Completeness requirements
- Integrity constraints
**Use Cases**:
- Verify all required fields are present
- Check referential integrity
- Validate data type consistency

### Error Handling Tools

#### `tool:try-catch` - Error Handling
**Description**: Error handling with fallback paths
**Usage**: Gracefully handle processing errors
**Configuration**:
- Try block (main processing)
- Catch conditions and handlers
- Fallback processing paths
**Use Cases**:
- Handle API timeouts with retry logic
- Process malformed XML with error recovery
- Continue processing despite individual failures

#### `tool:retry` - Retry Logic
**Description**: Retry failed operations with exponential backoff
**Usage**: Handle transient failures automatically
**Configuration**:
- Maximum retry attempts
- Backoff strategy (linear, exponential)
- Retry conditions (HTTP status codes, error types)
**Use Cases**:
- Retry failed API requests
- Handle temporary database connection issues
- Recover from network timeouts

#### `tool:timeout` - Operation Timeouts
**Description**: Set timeouts for operations
**Usage**: Prevent hanging operations
**Configuration**:
- Timeout duration
- Timeout behavior (fail, continue, fallback)
**Use Cases**:
- Prevent long-running API calls from blocking workflows
- Set limits on complex graph traversals
- Handle unresponsive external services

### Performance Tools

#### `tool:cache` - Result Caching
**Description**: Cache results for repeated operations
**Usage**: Improve performance for repeated computations
**Configuration**:
- Cache key generation
- Cache expiration policies
- Cache storage (memory, database)
**Use Cases**:
- Cache API responses for repeated entity lookups
- Store computed aggregations
- Cache expensive text processing results

#### `tool:parallel` - Parallel Processing
**Description**: Execute multiple operations in parallel
**Usage**: Speed up independent processing tasks
**Configuration**:
- Parallel execution limits
- Synchronization points
- Error aggregation
**Use Cases**:
- Process multiple documents simultaneously
- Parallel API requests within rate limits
- Concurrent graph traversals

#### `tool:throttle` - Request Throttling
**Description**: Throttle API requests to respect rate limits
**Usage**: Prevent API quota exhaustion
**Configuration**:
- Requests per time window
- Throttling strategy (sliding window, token bucket)
- Queue management for excess requests
**Use Cases**:
- Respect CrossRef API rate limits
- Manage Europeana API usage
- Control Wikidata query frequency

### Integration Tools

#### `tool:webhook` - Webhook Notifications
**Description**: Send webhooks on workflow events
**Usage**: Notify external systems of processing events
**Configuration**:
- Webhook URL and method
- Event triggers (completion, errors, milestones)
- Payload format and authentication
**Use Cases**:
- Notify completion of large TEI processing jobs
- Alert administrators of processing errors
- Trigger downstream processing workflows

#### `tool:email` - Email Notifications
**Description**: Send email notifications for workflow events
**Usage**: Keep users informed of processing status
**Configuration**:
- Email recipients and templates
- Trigger events and conditions
- SMTP configuration
**Use Cases**:
- Send completion notifications for long-running jobs
- Alert users of processing errors
- Deliver workflow results summaries

#### `tool:log` - Data Logging
**Description**: Log data for debugging and auditing
**Usage**: Track processing for analysis and troubleshooting
**Configuration**:
- Log levels and destinations
- Log format and content
- Retention policies
**Use Cases**:
- Debug complex workflow issues
- Audit data processing for research reproducibility
- Monitor API usage patterns

---

## 🎯 ACTIONS

### Action Groups

#### `action:group` - Action Grouping
**Description**: Group multiple actions together for organization
**Usage**: Organize complex workflows into logical units
**Configuration**:
- Group name and description
- Child actions list
- Execution order
**Use Cases**:
- Group person processing actions together
- Organize bibliography processing steps
- Structure complex TEI element handling

### Quick Actions

#### `action:create-text-node` - Text Node Creation
**Description**: Create node with text content from XML elements
**Usage**: Extract and store textual content as graph nodes
**Configuration**:
- Text extraction source (element text, attribute, xpath)
- Node properties and labels
- Text processing options
**Use Cases**:
- Create nodes for TEI `<p>` elements
- Extract and store chapter text content
- Process footnote text as separate nodes

#### `action:create-token-nodes` - Token Node Creation
**Description**: Create nodes from text tokens (words, characters)
**Usage**: Break down text into granular graph structures
**Configuration**:
- Tokenization method (words, characters, custom delimiters)
- Token filtering and processing
- Relationship creation between tokens
**Use Cases**:
- Create word-level graphs for linguistic analysis
- Process character sequences in manuscripts
- Tokenize text for computational analysis

#### `action:create-node-with-attributes` - Attribute-Based Node Creation
**Description**: Create nodes using XML element attributes
**Usage**: Map XML attributes directly to node properties
**Configuration**:
- Attribute-to-property mapping
- Node labels and types
- Default values for missing attributes
**Use Cases**:
- Create person nodes from `<persName>` attributes (@ref, @type)
- Process TEI header metadata
- Extract bibliographic information

#### `action:create-node-complete` - Complete Node Creation
**Description**: Create nodes with all available properties and relationships
**Usage**: Comprehensive node creation from complex XML structures
**Configuration**:
- Full property mapping from XML
- Relationship creation rules
- Validation and error handling
**Use Cases**:
- Process complex TEI `<person>` elements
- Create complete bibliographic entries
- Handle multifaceted cultural heritage objects

#### `action:extract-and-normalize-attributes` - Attribute Extraction and Normalization
**Description**: Extract and normalize XML element attributes
**Usage**: Clean and standardize attribute data before node creation
**Configuration**:
- Attribute extraction patterns
- Normalization rules (dates, names, etc.)
- Validation constraints
**Use Cases**:
- Normalize date formats in TEI documents
- Standardize person name attributes
- Clean and validate identifiers

#### `action:create-annotation-nodes` - Annotation Node Creation
**Description**: Create annotation nodes from text markup
**Usage**: Process TEI annotations and critical apparatus
**Configuration**:
- Annotation type detection
- Content extraction from annotations
- Relationship creation to annotated text
**Use Cases**:
- Process TEI `<note>` and `<app>` elements
- Create critical edition annotation networks
- Link scholarly commentary to text

#### `action:create-reference-chain` - Reference Chain Creation
**Description**: Create chains of reference relationships
**Usage**: Build complex intertextual reference networks
**Configuration**:
- Reference detection patterns
- Chain building rules
- Relationship types for different reference levels
**Use Cases**:
- Create citation networks in academic texts
- Build intertextual reference chains
- Link manuscript variants through references

#### `action:merge-children-text` - Child Text Merging
**Description**: Merge text from child elements into parent
**Usage**: Consolidate fragmented text content
**Configuration**:
- Child element selection criteria
- Text concatenation rules
- Whitespace and formatting handling
**Use Cases**:
- Merge TEI `<choice>` element texts
- Consolidate fragmented paragraph content
- Combine multi-part text elements

#### `action:create-conditional-node` - Conditional Node Creation
**Description**: Create nodes based on conditional logic
**Usage**: Apply different processing rules based on conditions
**Configuration**:
- Condition evaluation
- Alternative node creation rules
- Fallback processing
**Use Cases**:
- Create different node types based on @type attributes
- Process elements differently by language
- Handle variant document structures

#### `action:extract-and-compute-property` - Property Extraction and Computation
**Description**: Extract and compute property values
**Usage**: Derive new properties from existing data
**Configuration**:
- Property extraction expressions
- Computation formulas
- Data type conversions
**Use Cases**:
- Calculate word counts from text content
- Derive publication years from dates
- Compute author collaboration metrics

#### `action:create-node-with-filtered-children` - Filtered Child Node Creation
**Description**: Create nodes with selectively filtered children
**Usage**: Process only relevant child elements
**Configuration**:
- Child filtering criteria
- Processing rules for filtered children
- Relationship creation for kept children
**Use Cases**:
- Process only certain types of child elements in TEI structures
- Filter bibliography entries by criteria
- Select relevant annotations for processing

#### `action:normalize-and-deduplicate` - Normalization and Deduplication
**Description**: Normalize data and remove duplicates
**Usage**: Clean and consolidate entity data
**Configuration**:
- Normalization rules
- Deduplication criteria
- Merge conflict resolution
**Use Cases**:
- Clean and deduplicate person name lists
- Normalize and merge duplicate place references
- Consolidate bibliography entries

#### `action:create-hierarchical-nodes` - Hierarchical Node Creation
**Description**: Create hierarchical node structures from XML nesting
**Usage**: Preserve XML document structure in graph form
**Configuration**:
- Hierarchy traversal rules
- Node creation for each level
- Relationship types between levels
**Use Cases**:
- Preserve TEI document structure hierarchies
- Create nested bibliography structures
- Maintain XML element parent-child relationships

### Basic Actions

#### `action:create-node` - Basic Node Creation
**Description**: Create a new graph node with specified properties
**Usage**: Fundamental node creation operation
**Configuration**:
- Node labels and properties
- Unique identifier generation
- Property data types
**Use Cases**:
- Create basic entity nodes (Person, Place, Work)
- Generate structural nodes for documents
- Create relationship anchor points

#### `action:create-node-text` - Text-Based Node Creation
**Description**: Create nodes from text content
**Usage**: Convert textual elements to graph nodes
**Configuration**:
- Text extraction method
- Text processing (trim, normalize)
- Node property mapping
**Use Cases**:
- Convert TEI text elements to nodes
- Process paragraph and section content
- Handle text-based metadata

#### `action:create-node-tokens` - Token-Based Node Creation
**Description**: Create multiple nodes from text tokens
**Usage**: Granular text processing for analysis
**Configuration**:
- Tokenization strategy
- Token filtering rules
- Inter-token relationship creation
**Use Cases**:
- Linguistic analysis at word level
- Character-based manuscript analysis
- Text segmentation for computational processing

#### `action:set-property` - Property Setting
**Description**: Set node or relationship property values
**Usage**: Add or modify properties on graph elements
**Configuration**:
- Target element (node/relationship)
- Property name and value
- Value type and validation
**Use Cases**:
- Add metadata to nodes
- Set relationship properties (weights, types)
- Update computed values

#### `action:extract-property` - Property Extraction
**Description**: Extract property values from XML elements
**Usage**: Map XML data to graph properties
**Configuration**:
- XML source (element, attribute, xpath)
- Target property mapping
- Data type conversion
**Use Cases**:
- Extract @xml:id attributes to node IDs
- Map TEI @when attributes to date properties
- Convert XML content to graph properties

### Relationships Actions

#### `action:create-relationship` - Relationship Creation
**Description**: Create relationships between nodes
**Usage**: Establish connections in the graph
**Configuration**:
- Source and target nodes
- Relationship type and direction
- Relationship properties
**Use Cases**:
- Link authors to their works
- Connect places to events
- Establish citation relationships

### Control Actions

#### `action:skip` - Element Skipping
**Description**: Skip processing of current element
**Usage**: Conditionally exclude elements from processing
**Configuration**:
- Skip conditions
- Logging options
**Use Cases**:
- Skip processing of certain TEI elements
- Exclude draft or incomplete content
- Filter out unwanted document sections

#### `action:process-children` - Child Processing
**Description**: Process child elements of current element
**Usage**: Handle nested XML structures
**Configuration**:
- Child selection criteria
- Processing order
- Depth limits
**Use Cases**:
- Process all child elements of a TEI `<div>`
- Handle nested bibliography structures
- Traverse XML hierarchies

### Text Processing Actions

#### `action:transform-text` - Text Transformation
**Description**: Transform text content using rules or functions
**Usage**: Modify text before storage or analysis
**Configuration**:
- Transformation functions (normalize, lemmatize, etc.)
- Regular expression replacements
- Character encoding handling
**Use Cases**:
- Normalize historical spelling variations
- Apply text cleaning for OCR corrections
- Transform markup to plain text

#### `action:extract-text` - Text Extraction
**Description**: Extract text content from XML elements
**Usage**: Get textual data for processing
**Configuration**:
- Text source specification
- Whitespace handling
- Encoding options
**Use Cases**:
- Extract text from TEI `<p>` elements
- Get content from mixed content elements
- Process text with markup preservation

#### `action:extract-xml-content` - XML Content Extraction
**Description**: Extract XML content with TEI awareness
**Usage**: Preserve XML structure in extracted content
**Configuration**:
- XML extraction scope
- Namespace handling
- Structure preservation options
**Use Cases**:
- Extract TEI-encoded text with markup
- Preserve structural elements in content
- Handle complex XML mixed content

### Advanced Actions

#### `action:create-annotation` - Annotation Creation
**Description**: Create annotation entities and relationships
**Usage**: Process scholarly annotations and commentary
**Configuration**:
- Annotation type identification
- Content and metadata extraction
- Relationship creation to annotated content
**Use Cases**:
- Process TEI `<note>` elements
- Create critical apparatus networks
- Link scholarly commentary to primary text

#### `action:create-reference` - Reference Creation
**Description**: Create reference relationships between entities
**Usage**: Establish referential links in the graph
**Configuration**:
- Reference source identification
- Target resolution
- Relationship type determination
**Use Cases**:
- Link `@ref` attributes to target entities
- Create cross-reference networks
- Establish bibliographic citation links

#### `action:defer-relationship` - Deferred Relationship Creation
**Description**: Defer relationship creation until target exists
**Usage**: Handle forward references in documents
**Configuration**:
- Relationship specification
- Target identification criteria
- Resolution timeout
**Use Cases**:
- Handle forward references in TEI documents
- Link to entities defined later in the document
- Resolve cross-references in complex documents

### Data Manipulation Actions

#### `action:copy-property` - Property Copying
**Description**: Copy property values between nodes
**Usage**: Duplicate or transfer property values
**Configuration**:
- Source and target nodes/properties
- Copy conditions
- Overwrite behavior
**Use Cases**:
- Copy inherited properties to child nodes
- Transfer metadata between related entities
- Duplicate properties for different contexts

#### `action:merge-properties` - Property Merging
**Description**: Merge properties from multiple sources
**Usage**: Consolidate property data from different inputs
**Configuration**:
- Source properties and priorities
- Merge conflict resolution
- Data type handling
**Use Cases**:
- Merge author information from multiple sources
- Consolidate place data from different references
- Combine metadata from related entities

#### `action:split-property` - Property Splitting
**Description**: Split single properties into multiple properties
**Usage**: Break down complex property values
**Configuration**:
- Split criteria (delimiters, patterns)
- Target property structure
- Validation rules
**Use Cases**:
- Split multi-value fields into arrays
- Separate compound names into components
- Parse structured text into separate properties

#### `action:format-property` - Property Formatting
**Description**: Format property values (dates, numbers, etc.)
**Usage**: Standardize property value formats
**Configuration**:
- Format type (date, number, text)
- Locale and formatting options
- Error handling for invalid formats
**Use Cases**:
- Format dates consistently across documents
- Standardize number representations
- Apply locale-specific text formatting

### Relationship Management Actions

#### `action:update-relationship` - Relationship Updating
**Description**: Update existing relationship properties
**Usage**: Modify relationship attributes
**Configuration**:
- Relationship identification
- Property updates
- Update conditions
**Use Cases**:
- Update relationship weights based on new data
- Modify relationship types
- Add properties to existing relationships

#### `action:delete-relationship` - Relationship Deletion
**Description**: Delete relationships conditionally
**Usage**: Remove relationships based on criteria
**Configuration**:
- Deletion criteria
- Cascade options
- Logging of deletions
**Use Cases**:
- Remove obsolete relationships
- Clean up invalid connections
- Filter relationships based on quality criteria

#### `action:reverse-relationship` - Relationship Reversal
**Description**: Reverse relationship direction
**Usage**: Change relationship orientation
**Configuration**:
- Relationship identification
- Direction reversal logic
- Property preservation
**Use Cases**:
- Correct relationship directions in imported data
- Reverse hierarchical relationships
- Normalize relationship orientations

### Node Management Actions

#### `action:update-node` - Node Updating
**Description**: Update existing node properties
**Usage**: Modify node data after creation
**Configuration**:
- Node identification
- Property updates
- Update conditions and validation
**Use Cases**:
- Add new metadata to existing nodes
- Update computed properties
- Correct data quality issues

#### `action:delete-node` - Node Deletion
**Description**: Delete nodes conditionally
**Usage**: Remove nodes based on criteria
**Configuration**:
- Deletion criteria
- Cascade relationship handling
- Data preservation options
**Use Cases**:
- Remove duplicate nodes
- Clean up invalid entities
- Filter nodes by quality criteria

#### `action:clone-node` - Node Cloning
**Description**: Clone nodes with modifications
**Usage**: Create node variants or copies
**Configuration**:
- Source node identification
- Property modifications
- Relationship handling for clones
**Use Cases**:
- Create node variants for different contexts
- Duplicate nodes with modifications
- Generate related entity variations

#### `action:merge-nodes` - Node Merging
**Description**: Merge duplicate or related nodes
**Usage**: Consolidate similar entities
**Configuration**:
- Merge criteria and similarity thresholds
- Conflict resolution for properties
- Relationship consolidation
**Use Cases**:
- Merge duplicate person entities
- Consolidate similar place references
- Combine related bibliographic entries

### Validation Actions

#### `action:validate-node` - Node Validation
**Description**: Validate nodes against schema requirements
**Usage**: Ensure node data quality and completeness
**Configuration**:
- Validation schema/rules
- Required fields checking
- Data type validation
**Use Cases**:
- Validate person entity completeness
- Check bibliographic data requirements
- Ensure place data has required coordinates

#### `action:validate-relationship` - Relationship Validation
**Description**: Validate relationship constraints
**Usage**: Ensure relationship integrity and consistency
**Configuration**:
- Relationship type constraints
- Cardinality validation
- Property requirements
**Use Cases**:
- Validate authorship relationship constraints
- Check geographical relationship validity
- Ensure citation relationship integrity

#### `action:report-error` - Error Reporting
**Description**: Report validation errors and issues
**Usage**: Log and handle data quality issues
**Configuration**:
- Error types and severity levels
- Reporting destinations (logs, notifications)
- Error handling strategies
**Use Cases**:
- Report schema validation failures
- Log data quality issues
- Notify administrators of processing errors

### Metadata Actions

#### `action:add-metadata` - Metadata Addition
**Description**: Add metadata to nodes and relationships
**Usage**: Enhance entities with additional context
**Configuration**:
- Metadata source and type
- Addition conditions
- Metadata property mapping
**Use Cases**:
- Add processing timestamps
- Include source information
- Attach quality metrics

#### `action:tag-node` - Node Tagging
**Description**: Add tags for categorization and filtering
**Usage**: Categorize nodes for analysis and querying
**Configuration**:
- Tag generation rules
- Tag vocabulary
- Tag inheritance rules
**Use Cases**:
- Tag persons by role (author, editor, translator)
- Categorize works by genre or type
- Mark entities by data quality level

#### `action:set-timestamp` - Timestamp Setting
**Description**: Set creation/modification timestamps
**Usage**: Track temporal aspects of data processing
**Configuration**:
- Timestamp type (created, modified, processed)
- Timestamp source (current time, data source)
- Timezone handling
**Use Cases**:
- Track when entities were created in the graph
- Record processing timestamps
- Maintain temporal version history

---

## Usage Examples

### Digital Humanities Workflow: TEI to Graph

```
1. tool:filter → Select <persName> elements
2. action:create-node-with-attributes → Create Person nodes
3. tool:fetch-wikidata → Enrich with biographical data
4. tool:fetch-orcid → Add researcher information
5. action:create-relationship → Link to documents
6. tool:validate → Ensure data quality
```

### Research Data Integration Workflow

```
1. tool:fetch-api → Get data from multiple sources
2. tool:merge → Combine datasets
3. tool:deduplicate → Remove duplicates
4. tool:normalize → Standardize formats
5. tool:validate-schema → Check data integrity
6. action:create-node-complete → Create comprehensive entities
```

### Cultural Heritage Processing Workflow

```
1. tool:fetch-europeana → Get cultural object metadata
2. tool:fetch-getty → Add vocabulary terms
3. tool:enrich → Combine with textual references
4. action:create-annotation-nodes → Create annotation network
5. action:create-reference-chain → Build intertextual links
6. tool:export → Generate research outputs
```

---

## Categories Summary

- **Tools**: 40+ tools across 12 categories for data processing, API integration, and workflow control
- **Actions**: 35+ actions across 8 categories for graph database operations and data manipulation
- **Digital Humanities Focus**: Specialized support for TEI XML, authority data, and scholarly workflows
- **API Integration**: Direct connections to major research data sources (Wikidata, Europeana, ORCID, etc.)
- **Data Quality**: Comprehensive validation, normalization, and enrichment capabilities

This comprehensive toolkit enables researchers to build sophisticated workflows for converting complex humanities data sources into rich, interconnected graph databases suitable for advanced analysis and visualization.
