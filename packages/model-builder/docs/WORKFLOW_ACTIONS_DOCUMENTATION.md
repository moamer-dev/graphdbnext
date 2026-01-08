# Workflow Actions Documentation

This document provides comprehensive documentation for all workflow actions and quick actions available in the GraphDB Model Builder. Actions are operations that create or modify graph nodes and relationships during workflow execution.

## Table of Contents

1. [Action Groups](#action-groups)
2. [Basic Actions](#basic-actions)
3. [Quick Actions (⚡)](#quick-actions-)
4. [Property Actions](#property-actions)
5. [Relationship Actions](#relationship-actions)
6. [Control Actions](#control-actions)
7. [Advanced Actions](#advanced-actions)
8. [Data Manipulation Actions](#data-manipulation-actions)
9. [Relationship Management Actions](#relationship-management-actions)
10. [Node Management Actions](#node-management-actions)
11. [Validation Actions](#validation-actions)
12. [Metadata Actions](#metadata-actions)

---

## Action Groups

### `action:group` - Action Group

**Purpose**: Group multiple actions together for organized workflow execution. Actions within a group can share API response data when the group is connected to an API tool.

**Configuration**:
- Label: Group label/name
- Enabled: Enable/disable the entire group
- Children: Array of action IDs to include in the group

**Use Cases**:
- **Organize Related Actions**: Group related actions together
  ```xml
  <person id="P001">John Doe</person>
  ```
  Create an action group with actions to:
  1. Create person node
  2. Extract properties
  3. Create relationships
  All executed together when the group is triggered.

- **API Tool Integration**: Connect group to API tool to share response data
  ```xml
  <person xml:id="Q42">Douglas Adams</person>
  ```
  Connect action group to `tool:fetch-api` (Wikidata). All actions in the group can access the API response using template expressions like `{{ $json.title }}`.

- **Conditional Execution**: Enable/disable entire groups
  ```xml
  <item type="premium">Premium Item</item>
  <item type="standard">Standard Item</item>
  ```
  Create separate action groups for premium and standard items, enabling/disabling based on type.

---

## Basic Actions

### `action:create-node` - Create Node

**Purpose**: Create a graph node from an XML element.

**Configuration**:
- Node label (optional, defaults to element tag name)
- Parent relationship type

**Use Cases**:
- **Basic Node Creation**: Create a node for each XML element
  ```xml
  <person id="P001">John Doe</person>
  ```
  Creates a node with label "person" and properties from the element.

- **Custom Label**: Override default label
  ```xml
  <div type="chapter">Content</div>
  ```
  Use `action:create-node` with label "Chapter" to create nodes with custom labels.

---

### `action:create-node-text` - Create Node for Text

**Purpose**: Create a node specifically for text content extraction.

**Configuration**:
- Node label
- Text property key
- Parent relationship type

**Use Cases**:
- **Text Extraction**: Extract and store text content
  ```xml
  <paragraph>This is paragraph text</paragraph>
  ```
  Creates a node with text stored in a property.

---

### `action:create-node-tokens` - Create Node for Tokens

**Purpose**: Create nodes for tokenized text content.

**Configuration**:
- Node label
- Token property key
- Parent relationship type

**Use Cases**:
- **Word Tokenization**: Create separate nodes for each word
  ```xml
  <sentence>The quick brown fox</sentence>
  ```
  Creates individual nodes for "The", "quick", "brown", "fox".

---

## Quick Actions (⚡)

Quick actions are composite actions that combine multiple operations into a single, easy-to-use action.

### `action:create-text-node` ⚡ - Create Text Node

**Purpose**: Create a node with text content, optionally with transformations applied.

**Configuration**:
- Node label
- Property key (where to store the text)
- Transforms array (lowercase, uppercase, trim, replace, regex)
- Parent relationship type

**Use Cases**:
- **Text Node with Transformation**: Create node with normalized text
  ```xml
  <note>  This is a NOTE about word-1  </note>
  ```
  Use `action:create-text-node` with transforms:
  1. Trim whitespace
  2. Replace "word-1" with "word1"
  3. Uppercase
  Result: Property "noteText" = "THIS IS A NOTE ABOUT WORD1"

- **Multiple Transforms**: Chain multiple transformations
  ```xml
  <title>  Mixed Case Title  </title>
  ```
  Apply: trim → lowercase → replace spaces with underscores
  Result: "mixed_case_title"

---

### `action:create-token-nodes` ⚡ - Create Token Nodes

**Purpose**: Extract text, apply transformations, then create individual nodes for each token.

**Configuration**:
- Node label
- Transforms array (applied before tokenization)
- Token property key
- Parent relationship type

**Use Cases**:
- **Tokenize with Normalization**: Create word nodes from normalized text
  ```xml
  <sentence>  Hello, World!  </sentence>
  ```
  Apply transforms: trim → remove punctuation → lowercase
  Then tokenize into: ["hello", "world"]
  Creates two nodes, one for each token.

- **Clean Text Before Tokenization**: Remove unwanted characters
  ```xml
  <text>Word1-Word2_Word3</text>
  ```
  Apply transforms: replace "-" with " " → replace "_" with " "
  Tokenize: ["Word1", "Word2", "Word3"]

---

### `action:create-node-with-attributes` ⚡ - Create Node with Attributes

**Purpose**: Create a node and map XML attributes to node properties.

**Configuration**:
- Node label
- Attribute mappings (attribute name → property key)
- Default values for missing attributes
- Parent relationship type

**Use Cases**:
- **Attribute Mapping**: Map XML attributes to properties
  ```xml
  <person xml:id="P001" name="John" age="30" city="NYC"/>
  ```
  Configure mappings:
  - `xml:id` → `personId`
  - `name` → `fullName`
  - `age` → `age`
  - `city` → `location` (default: "Unknown")
  Creates node with all mapped properties.

- **Selective Attribute Extraction**: Extract only specific attributes
  ```xml
  <item id="I001" type="product" price="29.99" discount="10%"/>
  ```
  Map only `id` and `price`, ignoring `type` and `discount`.

---

### `action:create-node-complete` ⚡ - Create Node Complete

**Purpose**: Comprehensive node creation with text, attributes, and transformations.

**Configuration**:
- Node label
- Text source (textContent or attribute)
- Text transforms
- Text property key
- Attribute mappings with optional transforms
- Parent relationship type

**Use Cases**:
- **Complete Node Setup**: Create node with both text and attributes
  ```xml
  <article id="A001" title="Article Title" author="John Doe">
    This is the article content.
  </article>
  ```
  Configure:
  - Extract text content with trim transform → `content` property
  - Map `id` → `articleId`
  - Map `title` → `title` (with lowercase transform)
  - Map `author` → `authorName`
  Creates a fully configured node in one action.

- **Complex Transformation**: Apply multiple transforms to different sources
  ```xml
  <product code="PROD-001" name="Product Name">
    Description text here.
  </product>
  ```
  - Text: trim → uppercase → `description`
  - Code: replace "-" with "" → `productCode`
  - Name: trim → title case → `productName`

---

### `action:extract-and-normalize-attributes` ⚡ - Extract & Normalize Attributes

**Purpose**: Extract multiple attributes and apply normalization transforms to each.

**Configuration**:
- Attribute mappings with transforms array
- Default values

**Use Cases**:
- **Normalize IDs**: Extract and normalize ID attributes
  ```xml
  <item xml:id="  ITEM-001  " ref="item_001"/>
  ```
  Extract `xml:id` with transforms: trim → uppercase → replace "-" with ""
  Result: "ITEM001"
  Extract `ref` with transforms: trim → lowercase
  Result: "item_001"

- **Clean Multiple Attributes**: Normalize various attributes
  ```xml
  <person id="  P001  " email="  USER@EXAMPLE.COM  " phone="123-456-7890"/>
  ```
  - `id`: trim → uppercase
  - `email`: trim → lowercase
  - `phone`: replace "-" with ""

---

### `action:create-annotation-nodes` ⚡ - Create Annotation Nodes

**Purpose**: Create separate annotation nodes from XML attributes (common in TEI/XML).

**Configuration**:
- Annotation node label
- Target attributes (e.g., ana, lemma, type)
- Relationship type
- Parent relationship type

**Use Cases**:
- **TEI Annotation Extraction**: Extract linguistic annotations
  ```xml
  <w ana="#noun" lemma="house" type="common">house</w>
  ```
  Creates:
  - Main word node
  - Annotation node for `ana` attribute
  - Annotation node for `lemma` attribute
  - Annotation node for `type` attribute
  All connected to the word node.

- **Metadata Extraction**: Extract metadata as separate nodes
  ```xml
  <text type="poem" genre="lyric" period="romantic">...</text>
  ```
  Creates annotation nodes for type, genre, and period.

---

### `action:create-reference-chain` ⚡ - Create Reference Chain

**Purpose**: Extract reference attributes, find target elements, and create relationships.

**Configuration**:
- Reference attribute name (e.g., corresp, target, ref)
- Target node label
- Relationship type
- Resolve strategy (id or xpath)
- Create target if missing

**Use Cases**:
- **Cross-Reference Resolution**: Resolve and link references
  ```xml
  <note target="#ref1">See reference</note>
  <reference xml:id="ref1">Reference content</reference>
  ```
  Extracts `target="#ref1"` from note, finds element with `xml:id="ref1"`, creates relationship.

- **Correspondence Links**: Link corresponding elements
  ```xml
  <verse corresp="#verse1 #verse2">...</verse>
  <verse xml:id="verse1">...</verse>
  <verse xml:id="verse2">...</verse>
  ```
  Creates relationships from verse to verse1 and verse2.

---

### `action:merge-children-text` ⚡ - Merge Children Text

**Purpose**: Collect text from all children, merge with separator, and apply transforms.

**Configuration**:
- Property key
- Separator
- Filter by tag names
- Exclude tags
- Transforms array

**Use Cases**:
- **Combine Child Text**: Merge text from multiple children
  ```xml
  <paragraph>
    <word>Hello</word>
    <word>World</word>
    <word>!</word>
  </paragraph>
  ```
  Merge with separator=" " → "Hello World !"
  Apply trim transform → "Hello World !"

- **Selective Merging**: Merge only specific child types
  ```xml
  <sentence>
    <w>Hello</w>
    <punct>,</punct>
    <w>world</w>
    <note>Editorial note</note>
  </sentence>
  ```
  Filter by tag: ["w"] → Merge: "Hello world"
  Exclude: ["note", "punct"] to ignore notes and punctuation.

---

### `action:create-conditional-node` ⚡ - Create Conditional Node

**Purpose**: Create a node only if specific conditions are met.

**Configuration**:
- Conditions array (hasAttribute, hasText, hasChildren)
- Operator (AND or OR)
- Node label
- Parent relationship type

**Use Cases**:
- **Conditional Creation**: Create nodes only when conditions are met
  ```xml
  <div type="chapter" n="1">Content</div>
  <div type="section">Content</div>
  ```
  Configure condition: hasAttribute "type" = "chapter" AND hasAttribute "n"
  Only creates node for first div (has both attributes).

- **Text-Based Condition**: Create only for elements with text
  ```xml
  <p>Has content</p>
  <p></p>
  <p>Also has content</p>
  ```
  Condition: hasText with minLength=1
  Creates nodes only for paragraphs with content.

---

### `action:extract-and-compute-property` ⚡ - Extract & Compute Property

**Purpose**: Extract from multiple sources and compute a single value.

**Configuration**:
- Property key
- Sources array (textContent, attribute, static)
- Computation type (concat, sum, join)
- Separator (for join)

**Use Cases**:
- **Combine Multiple Sources**: Concatenate text and attributes
  ```xml
  <person first="John" last="Doe">Additional info</person>
  ```
  Sources:
  1. Attribute "first" → "John"
  2. Static " " → " "
  3. Attribute "last" → "Doe"
  4. Static " - " → " - "
  5. TextContent → "Additional info"
  Computation: join with separator ""
  Result: "John Doe - Additional info"

- **Calculate Sum**: Sum numeric attributes
  ```xml
  <invoice subtotal="100" tax="10" shipping="5"/>
  ```
  Sources: subtotal, tax, shipping
  Computation: sum
  Result: 115

---

### `action:create-node-with-filtered-children` ⚡ - Create Node with Filtered Children

**Purpose**: Create a node and process only specific child types.

**Configuration**:
- Node label
- Filter by tag names
- Exclude tags
- Recursive processing
- Child relationship type
- Parent relationship type

**Use Cases**:
- **Selective Child Processing**: Process only specific children
  ```xml
  <section>
    <header>Header content</header>
    <paragraph>Paragraph content</paragraph>
    <footer>Footer content</footer>
  </section>
  ```
  Filter by tag: ["paragraph"]
  Creates section node and processes only paragraph children.

- **Exclude Specific Tags**: Process all except certain tags
  ```xml
  <document>
    <content>Real content</content>
    <note>Editorial note</note>
    <metadata>Metadata</metadata>
  </document>
  ```
  Exclude: ["note", "metadata"]
  Processes only content element.

---

### `action:normalize-and-deduplicate` ⚡ - Normalize & Deduplicate

**Purpose**: Extract values, normalize them, and remove duplicates.

**Configuration**:
- Source property
- Target property
- Transforms array
- Deduplicate flag

**Use Cases**:
- **Clean Tag Lists**: Normalize and deduplicate tags
  ```xml
  <article tags="python, Python, PYTHON, javascript, JavaScript"/>
  ```
  Extract tags, apply lowercase transform, deduplicate
  Result: ["python", "javascript"]

- **Normalize IDs**: Clean and deduplicate ID lists
  ```xml
  <item refs="  ID1  , id1, ID2,  id2  "/>
  ```
  Extract refs, apply trim → uppercase, deduplicate
  Result: ["ID1", "ID2"]

---

### `action:create-hierarchical-nodes` ⚡ - Create Hierarchical Nodes

**Purpose**: Create parent node and process children hierarchically.

**Configuration**:
- Parent node label
- Child node label
- Filter by tag names
- Recursive processing
- Parent relationship type
- Child relationship type

**Use Cases**:
- **Document Structure**: Create hierarchical document structure
  ```xml
  <document>
    <chapter>
      <section>Content</section>
    </chapter>
  </document>
  ```
  Creates:
  - Document node (parent)
  - Chapter node (child of document)
  - Section node (child of chapter)
  All with proper hierarchical relationships.

- **Nested Lists**: Create nested list structure
  ```xml
  <list>
    <item>Item 1</item>
    <item>Item 2</item>
  </list>
  ```
  Creates list node with item children, maintaining hierarchy.

---

## Property Actions

### `action:set-property` - Set Property

**Purpose**: Set a property value on the current node.

**Configuration**:
- Property key
- Property value (static or from attribute/text)

**Use Cases**:
- **Static Properties**: Add fixed metadata
  ```xml
  <article>Content</article>
  ```
  Set property "status" = "published" on all article nodes.

- **Computed Properties**: Set properties based on conditions
  ```xml
  <item type="book"/>
  <item type="article"/>
  ```
  Use with `tool:if` to set "category" property based on type.

---

### `action:extract-property` - Extract Property

**Purpose**: Extract value from XML and set as node property.

**Configuration**:
- Source (attribute or textContent)
- Property key
- Default value

**Use Cases**:
- **Attribute Extraction**: Extract attribute to property
  ```xml
  <person id="P001" name="John"/>
  ```
  Extract `id` attribute → `personId` property.

---

### `action:transform-text` - Transform Text

**Purpose**: Apply transformations to text and update properties.

**Configuration**:
- Transforms array
- Target property
- Update in-place flag

**Use Cases**:
- **In-Place Transformation**: Update existing property
  ```xml
  <title>  Mixed Case Title  </title>
  ```
  After creating node with "title" property, use `action:transform-text` to:
  - Trim whitespace
  - Apply title case
  Update the existing "title" property in-place.

- **New Property Creation**: Create transformed copy
  ```xml
  <name>John Doe</name>
  ```
  Transform to create "normalizedName" property with lowercase value.

---

### `action:extract-text` - Extract Text

**Purpose**: Extract text content from element.

**Configuration**:
- Property key
- Transform options

**Use Cases**:
- **Simple Text Extraction**: Extract and store text
  ```xml
  <paragraph>This is paragraph text</paragraph>
  ```
  Extract text → "textContent" property.

---

## Relationship Actions

### `action:create-relationship` - Create Relationship

**Purpose**: Create a relationship between nodes.

**Configuration**:
- Relationship type
- Target node (from context)

**Use Cases**:
- **Parent-Child Links**: Link parent and child nodes
  ```xml
  <chapter>
    <section>Content</section>
  </chapter>
  ```
  Create "contains" relationship from chapter to section.

- **Reference Links**: Link referencing nodes
  ```xml
  <note target="#ref1">See reference</note>
  ```
  Create "references" relationship from note to target.

---

### `action:defer-relationship` - Defer Relationship

**Purpose**: Create relationships that are resolved later (for forward references).

**Configuration**:
- Relationship type
- Target node label
- Condition (always, hasAttribute, hasText)

**Use Cases**:
- **Forward References**: Handle references to elements not yet processed
  ```xml
  <reference target="P001"/>
  <person xml:id="P001">John</person>
  ```
  Defer relationship creation until target is found.

---

## Control Actions

### `action:skip` - Skip Element

**Purpose**: Skip creating node and/or processing children.

**Configuration**:
- Skip creating main node
- Skip processing children
- Skip children mode (all or selected)
- Child tags to skip

**Use Cases**:
- **Skip Empty Elements**: Skip elements without content
  ```xml
  <p>Content</p>
  <p></p>
  <p>More content</p>
  ```
  Use with `tool:if` to skip empty paragraphs.

- **Skip Specific Children**: Skip certain child types
  ```xml
  <section>
    <content>Real content</content>
    <note>Skip this</note>
  </section>
  ```
  Configure to skip "note" children while processing "content".

- **Conditional Skipping**: Skip based on conditions
  ```xml
  <seg>
    <w>word</w>
  </seg>
  <seg>No words</seg>
  ```
  Use `tool:if` with "HasChildren" condition to skip seg elements that have w children.

---

### `action:process-children` - Process Children

**Purpose**: Explicitly process child elements.

**Configuration**:
- Filter by tag names
- Recursive flag

**Use Cases**:
- **Explicit Child Processing**: Control when children are processed
  ```xml
  <document>
    <chapter>...</chapter>
  </document>
  ```
  Use to explicitly process chapter children after document node is created.

---

## Advanced Actions

### `action:create-annotation` - Create Annotation

**Purpose**: Create annotation nodes (legacy, use `action:create-annotation-nodes` instead).

**Use Cases**:
- Similar to `action:create-annotation-nodes` but with simpler configuration.

---

### `action:create-reference` - Create Reference

**Purpose**: Create reference relationships (legacy, use `action:create-reference-chain` instead).

**Use Cases**:
- Similar to `action:create-reference-chain` but with simpler configuration.

---

### `action:extract-xml-content` - Extract XML Content

**Purpose**: Extract raw XML content as property.

**Configuration**:
- Property key
- Include attributes flag

**Use Cases**:
- **Preserve XML Structure**: Store original XML
  ```xml
  <complex-element attr="value">Content</complex-element>
  ```
  Extract full XML string to preserve structure for later processing.

---

## Action Combinations

Actions can be chained with tools to create powerful workflows:

1. **If → Create Node → Extract Property → Transform Text**: Conditional node creation with property extraction and transformation
2. **Switch → Create Text Node → Create Token Nodes**: Route to different text processing based on element type
3. **Filter → Create Node Complete → Create Annotation Nodes**: Filter unwanted elements, create complete nodes, then extract annotations
4. **Validate → Create Node with Attributes → Create Reference Chain**: Validate structure, create nodes, then resolve references

---

## Quick Actions vs. Basic Actions

### When to Use Quick Actions (⚡)

- **Common Patterns**: Use quick actions for frequently used patterns
- **Simplified Configuration**: Quick actions reduce the number of connected actions needed
- **Better Performance**: Single action is more efficient than multiple chained actions
- **Easier Maintenance**: One action to configure instead of multiple

### When to Use Basic Actions

- **Custom Workflows**: When you need fine-grained control
- **Uncommon Patterns**: When quick actions don't fit your use case
- **Step-by-Step Debugging**: When you need to debug each step separately

---

## Best Practices

1. **Use Quick Actions for Common Tasks**: Prefer quick actions for standard operations
2. **Chain Transforms**: Use multiple transforms in quick actions instead of chaining separate transform actions
3. **Validate Early**: Use validation before creating nodes to avoid invalid data
4. **Skip Unnecessary Elements**: Use skip action early to improve performance
5. **Extract Before Transform**: Extract properties before transforming them
6. **Use In-Place Updates**: Use `updateInPlace` flag to modify existing properties instead of creating duplicates

---

## Performance Considerations

- **Quick Actions**: More efficient than chaining multiple basic actions
- **Skip Action**: Use early to avoid unnecessary processing
- **Filter Children**: Use filtered children actions to reduce processing overhead
- **Batch Processing**: Combine with `tool:batch` for large datasets

---

## Data Manipulation Actions

### `action:copy-property` - Copy Property

**Purpose**: Copy property from one node to another, useful for data propagation and relationship building.

**Configuration**:
- Source Property: Property name to copy from
- Target Property: Property name to copy to (defaults to same name)
- Source Node: Source node (current, parent, or specific)

**Use Cases**:
- **Property Propagation**: Copy properties between related nodes
  ```xml
  <chapter id="C1">
    <section id="S1">Content</section>
  </chapter>
  ```
  Use `action:copy-property` to copy chapter ID to section nodes for reference.

- **Data Inheritance**: Inherit properties from parent
  ```xml
  <document lang="en">
    <paragraph>Text</paragraph>
  </document>
  ```
  Use `action:copy-property` to copy language from document to paragraphs.

---

### `action:merge-properties` - Merge Properties

**Purpose**: Merge properties from multiple sources into a single property, combining data from different sources.

**Configuration**:
- Sources: Array of source properties to merge
- Target Property: Property name to store merged result
- Separator: Separator for merging (default: space)
- Strategy: Merge strategy (concat, object, array)

**Use Cases**:
- **Combine Data**: Merge properties from multiple sources
  ```xml
  <person first="John" last="Doe" middle="M">John Doe</person>
  ```
  Use `action:merge-properties` to combine first, middle, and last into fullName: "John M Doe".

- **Aggregate Information**: Combine related properties
  ```xml
  <article tags="python" categories="web">Article</article>
  ```
  Use `action:merge-properties` to merge tags and categories into keywords array.

---

### `action:split-property` - Split Property

**Purpose**: Split a property into multiple properties based on delimiter or pattern.

**Configuration**:
- Source Property: Property name to split
- Target Properties: Array of target property names
- Delimiter: Delimiter for splitting (default: space)
- Pattern: Regex pattern for splitting (alternative to delimiter)

**Use Cases**:
- **Parse Structured Data**: Split delimited values
  ```xml
  <person name="John,M,Doe">John Doe</person>
  ```
  Use `action:split-property` with delimiter "," to split into firstName="John", middle="M", lastName="Doe".

- **Extract Components**: Split complex values
  ```xml
  <address>123 Main St, New York, NY 10001</address>
  ```
  Use `action:split-property` to extract street, city, state, and zip code.

---

### `action:format-property` - Format Property

**Purpose**: Format property values (dates, numbers, text) according to specified patterns.

**Configuration**:
- Source Property: Property name to format
- Target Property: Property name to store formatted value
- Format: Format pattern (date, number, text template)
- Locale: Locale for formatting (optional)

**Use Cases**:
- **Date Formatting**: Format dates consistently
  ```xml
  <date>2023-12-25</date>
  ```
  Use `action:format-property` to format as "December 25, 2023" or "25/12/2023".

- **Number Formatting**: Format numbers with precision
  ```xml
  <price>1234.5678</price>
  ```
  Use `action:format-property` to format as "$1,234.57" or "1,234.57 EUR".

- **Text Templates**: Format text with templates
  ```xml
  <person first="John" last="Doe">John Doe</person>
  ```
  Use `action:format-property` with template "{{last}}, {{first}}" to get "Doe, John".

---

## Relationship Management Actions

### `action:update-relationship` - Update Relationship

**Purpose**: Update existing relationship properties, modifying relationship metadata.

**Configuration**:
- Relationship Type: Type of relationship to update
- Properties: Object with property updates
- Condition: Condition for updating (optional)

**Use Cases**:
- **Add Metadata**: Add properties to relationships
  ```xml
  <author wrote="book1">Author</author>
  ```
  Use `action:update-relationship` to add "year" and "role" properties to the "wrote" relationship.

- **Update Relationship Data**: Modify relationship properties
  ```xml
  <person knows="person2">Person 1</person>
  ```
  Use `action:update-relationship` to update "strength" or "since" properties on the "knows" relationship.

---

### `action:delete-relationship` - Delete Relationship

**Purpose**: Delete relationships conditionally based on criteria.

**Configuration**:
- Relationship Type: Type of relationship to delete
- Condition: Condition for deletion (optional)
- Target: Which relationships to delete (all, specific)

**Use Cases**:
- **Cleanup**: Remove unwanted relationships
  ```xml
  <person knows="person1" knows="person2">Person</person>
  ```
  Use `action:delete-relationship` with condition to remove relationships that don't meet criteria.

- **Data Maintenance**: Remove obsolete relationships
  ```xml
  <item related="old-item">Item</item>
  ```
  Use `action:delete-relationship` to remove relationships to deleted or archived items.

---

### `action:reverse-relationship` - Reverse Relationship

**Purpose**: Reverse relationship direction, useful for bidirectional relationships or data restructuring.

**Configuration**:
- Relationship Type: Type of relationship to reverse
- New Type: New relationship type (optional, defaults to same type)

**Use Cases**:
- **Bidirectional Links**: Create reverse relationships
  ```xml
  <parent hasChild="child1">Parent</parent>
  ```
  Use `action:reverse-relationship` to create "hasParent" relationship from child to parent.

- **Data Restructuring**: Change relationship direction
  ```xml
  <author wrote="book1">Author</author>
  ```
  Use `action:reverse-relationship` to change to "writtenBy" from book to author.

---

## Node Management Actions

### `action:update-node` - Update Node

**Purpose**: Update existing node properties, modifying node data after creation.

**Configuration**:
- Properties: Object with property updates
- Condition: Condition for updating (optional)
- Merge Strategy: How to merge properties (replace, merge, append)

**Use Cases**:
- **Property Updates**: Update node properties
  ```xml
  <person id="P001" name="John">John Doe</person>
  ```
  Use `action:update-node` to add or modify properties like "email", "age", or "status".

- **Data Enrichment**: Enrich nodes with additional data
  ```xml
  <article id="A001">Article</article>
  ```
  Use `action:update-node` to add properties from API responses or computed values.

---

### `action:delete-node` - Delete Node

**Purpose**: Delete nodes conditionally based on criteria.

**Configuration**:
- Condition: Condition for deletion
- Cascade: Delete related relationships (true/false)

**Use Cases**:
- **Data Cleanup**: Remove unwanted nodes
  ```xml
  <item status="deleted">Item</item>
  ```
  Use `action:delete-node` with condition status="deleted" to remove deleted items.

- **Filtering**: Remove nodes that don't meet criteria
  ```xml
  <person age="5">Child</person>
  ```
  Use `action:delete-node` to remove nodes where age < 18.

---

### `action:clone-node` - Clone Node

**Purpose**: Clone node with optional modifications, useful for creating variations or templates.

**Configuration**:
- Properties: Properties to override in clone
- Labels: Labels to override in clone
- Relationships: Whether to clone relationships (true/false)

**Use Cases**:
- **Create Variations**: Clone nodes with modifications
  ```xml
  <template type="letter">Template</template>
  ```
  Use `action:clone-node` to create multiple letter instances with different recipients.

- **Template Instantiation**: Create instances from templates
  ```xml
  <product-template id="T1">Template</product-template>
  ```
  Use `action:clone-node` to create product instances from templates.

---

### `action:merge-nodes` - Merge Nodes

**Purpose**: Merge duplicate nodes, combining properties and relationships from multiple nodes into one.

**Configuration**:
- Source Nodes: Nodes to merge (array of node IDs or selectors)
- Target Node: Target node to merge into
- Merge Strategy: How to merge properties (first, last, combine, unique)

**Use Cases**:
- **Deduplication**: Merge duplicate nodes
  ```xml
  <person id="P1" name="John Doe"/>
  <person id="P2" name="John D. Doe"/>
  ```
  Use `action:merge-nodes` to merge these duplicate person records.

- **Data Consolidation**: Combine related nodes
  ```xml
  <author id="A1" name="J. Smith"/>
  <author id="A2" name="John Smith"/>
  ```
  Use `action:merge-nodes` to consolidate author records.

---

## Validation Actions

### `action:validate-node` - Validate Node

**Purpose**: Validate node against schema definitions, ensuring data quality and compliance.

**Configuration**:
- Schema: Schema definition to validate against
- Properties: Properties to validate
- Strict: Fail on validation errors (true) or continue with warnings (false)

**Use Cases**:
- **Data Quality**: Validate node properties
  ```xml
  <person id="P001" email="invalid-email">John Doe</person>
  ```
  Use `action:validate-node` to check email format, required fields, and data types.

- **Compliance**: Ensure data meets standards
  ```xml
  <publication doi="invalid">Title</publication>
  ```
  Use `action:validate-node` to validate DOI format and required metadata.

---

### `action:validate-relationship` - Validate Relationship

**Purpose**: Validate relationship constraints, ensuring relationships meet schema requirements.

**Configuration**:
- Relationship Type: Type of relationship to validate
- Constraints: Validation constraints
- Properties: Properties to validate

**Use Cases**:
- **Relationship Integrity**: Validate relationship properties
  ```xml
  <author wrote="book1">Author</author>
  ```
  Use `action:validate-relationship` to ensure "wrote" relationships have required properties like "year".

- **Schema Compliance**: Check relationship constraints
  ```xml
  <person married="person2">Person</person>
  ```
  Use `action:validate-relationship` to ensure "married" relationships meet schema constraints.

---

### `action:report-error` - Report Error

**Purpose**: Report validation errors and issues, useful for error tracking and debugging.

**Configuration**:
- Error Type: Type of error (validation, data, system)
- Message: Error message
- Details: Additional error details
- Severity: Error severity (error, warning, info)

**Use Cases**:
- **Error Tracking**: Report validation errors
  ```xml
  <person email="invalid">Person</person>
  ```
  Use `action:report-error` to log validation errors for review.

- **Debugging**: Report data issues
  ```xml
  <item price="invalid">Item</item>
  ```
  Use `action:report-error` to report data quality issues.

---

## Metadata Actions

### `action:add-metadata` - Add Metadata

**Purpose**: Add metadata to nodes or relationships, useful for tracking, auditing, and enrichment.

**Configuration**:
- Metadata: Object with metadata key-value pairs
- Target: Target (node, relationship, or both)
- Prefix: Prefix for metadata keys (default: "_meta_")

**Use Cases**:
- **Tracking**: Add tracking metadata
  ```xml
  <article>Article Content</article>
  ```
  Use `action:add-metadata` to add "source", "importDate", and "version" metadata.

- **Enrichment**: Add computed metadata
  ```xml
  <person>Person</person>
  ```
  Use `action:add-metadata` to add "wordCount", "language", or "sentiment" metadata.

---

### `action:tag-node` - Tag Node

**Purpose**: Add tags for categorization and filtering, useful for organizing and querying nodes.

**Configuration**:
- Tags: Array of tags to add
- Strategy: Tag strategy (add, replace, merge)

**Use Cases**:
- **Categorization**: Tag nodes for organization
  ```xml
  <article category="tech">Article</article>
  ```
  Use `action:tag-node` to add tags like "tech", "published", "2023" for filtering.

- **Filtering**: Tag nodes for easy querying
  ```xml
  <person role="author">Person</person>
  ```
  Use `action:tag-node` to add tags for filtering by role, status, or other criteria.

---

### `action:set-timestamp` - Set Timestamp

**Purpose**: Set creation/modification timestamps on nodes, useful for auditing and versioning.

**Configuration**:
- Timestamp Type: created, modified, or both
- Format: Timestamp format (ISO, unix, custom)

**Use Cases**:
- **Auditing**: Track node creation and modification
  ```xml
  <person>Person</person>
  ```
  Use `action:set-timestamp` to add "_createdAt" and "_modifiedAt" properties.

- **Versioning**: Track data changes
  ```xml
  <document>Document</document>
  ```
  Use `action:set-timestamp` to track when documents are created and last modified.

---

*Last Updated: 2024*

