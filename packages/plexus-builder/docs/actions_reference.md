# Plexus Workflows: Actions & Configuration Reference

This guide provides a detailed technical reference for all active actions in the Plexus Model Builder. Each section explains the action's purpose, detailed execution logic, and an exhaustive breakdown of its Configuration UI fields.

---

## Table of Contents
- [Node Actions](#node-actions)
- [Property Actions](#property-actions)
- [Relationship Actions](#relationship-actions)
- [Workflow & Control](#workflow--control)

---

## Node Actions

### **1. Create Node** (`action:create-node-complete`)
*   **Description**: The primary action for instantiating new entities. It allows mapping XML/Input attributes to graph properties and optionally setting up a relationship to a parent or target node in one step.
*   **Use Case**: Creating a `Surface` node from a `<surface>` tag and attaching its metadata.
*   **XML Snippet**:
    ```xml
    <surface xml:id="surface-1" n="1">
    ```
*   **Configuration UI**:
    *   **Node Label**: The label assigned to the new node (e.g., `Surface`).
    *   **Unique ID Template**: A string or expression used for **Upsert** (e.g., `{{ $json["xml:id"] }}`). Automatically updates existing nodes instead of duplicating.
    *   **Attribute Mappings**: A list of mappings for properties.
        *   **XML Attribute**: The source key in the input data.
        *   **Property Key**: The target key in the Graph Database.
    *   **Relationship Configuration**: Defines how the new node attaches to the graph.
        *   **Relationship Mode**: `Standalone`, `Connected` (to the context node), or `Deferred` (resolves to a specific target node by lookup).
        *   **Relationship Type**: The label for the connection (e.g., `HAS_SURFACE`).
        *   **Relationship Direction**: `Outgoing` (Parent → New) or `Incoming` (New → Parent).
        *   **Target Node Lookup** *(Deferred Mode Only)*:
            *   **Target Node Label**: The label of the node to find.
            *   **Target ID Template**: The ID of the node to find (supports templates).
*   **Example**:
    *   *Node Label*: `Surface`
    *   *Unique ID Template*: `{{ $json["xml:id"] }}`
    *   *Mappings*: `xml:id` -> `id`, `n` -> `number`
    *   *Relationship*: `Connected` (Type: `HAS_SURFACE`, Direction: `Outgoing`).

### **2. Create Text Node** (`action:create-text-node`)
*   **Description**: Creates a node specifically for storing text content with normalization features.
*   **Use Case**: Extracting textual content from a `<w>` tag and storing it in a dedicated node.
*   **XML Snippet**:
    ```xml
    <w xml:id="word-1" lemma="hello" text="hello">hello</w>
    ```
*   **Configuration UI**:
    *   **Node Label**: Label for the text node (e.g., `WordContent`).
    *   **Text Source**: Select `Text Content` (inner text) or `XML Attribute`.
    *   **Attribute Name** *(If 'XML Attribute' is selected)*: The name of the attribute.
    *   **Transforms (Applied sequentially)**: A list of operations applied to the text (e.g., `lowercase`, `trim`, `regex_replace`).
    *   **Target Property Key**: The property key to store the text (e.g., `textContent`).
    *   **Parent Relationship Type**: Type of link to the parent node (e.g., `HAS_TEXT`).
    *   **Property Mappings / Extra Properties**: Key-value editor to add fixed or template-based properties to the text node.
*   **Example**:
    *   *Node Label*: `WordContent`
    *   *Text Source*: `Text Content`
    *   *Transforms*: `trim`, `lowercase`
    *   *Target Property Key*: `text`
    *   *Parent Relationship*: `HAS_TEXT`

### **3. Create Token Nodes** (`action:create-token-nodes`)
*   **Description**: Breaks a string into multiple nodes (e.g., character or word-level analysis).
*   **Use Case**: Splitting a paragraph note into multiple `Word` nodes to represent individual tokens.
*   **XML Snippet**:
    ```xml
    <p>This is a note about word-1</p>
    ```
*   **Configuration UI**:
    *   **Parent Node Label**: Label for the context node containing the tokens.
    *   **Token Node Label**: Label for the individual token nodes (e.g., `Character`, `Word`).
    *   **Relationship Type**: Type of link from parent to tokens (e.g., `CONTAINS_TOKEN`).
    *   **Text Source**: Select `Text Content` or `XML Attribute`.
    *   **Attribute Name** *(If 'XML Attribute' is selected)*: The source attribute.
    *   **Transforms (Applied Before Tokenization)**: Operations to run before splitting.
    *   **Split By**: The delimiter (e.g., a space for words). Leave empty for character-level tokenization.
    *   **Filter Pattern (Regex)**: Only create nodes for tokens matching this pattern (e.g., `[a-zA-Z0-9]`).
    *   **Structure**: 
        *   `Flat`: All token nodes connect directly to the parent node.
        *   `Chained`: Tokens form a Linked List (Parent -> Token1 -> Token2).
    *   **Next Token Relationship** *(If 'Chained' is selected)*: The label for the link between consecutive tokens (e.g., `NEXT`).

### **4. Create Annotation Nodes** (`action:create-annotation-nodes`)
*   **Description**: Links elements to external references or identifies relation targets via an attribute.
*   **Use Case**: Creating a direct reference annotation to a specific element using an ID.
*   **XML Snippet**:
    ```xml
    <note xml:id="note-1" type="editorial" target="#word-1">
    ```
*   **Configuration UI**:
    *   **Attribute Name (Reference Attribute)**: The XML attribute containing the reference ID (e.g., `target`, `ref`, `corresp`).
    *   **Relationship Label**: The label for the relationship created between the context node and the referenced node (e.g., `ANNOTATES`, `REFERS_TO`).

### **5. Create Deferred Node** (`action:create-node-with-lookup`)
*   **Description**: Finds a node in the graph first; if missing, creates it.
*   **Use Case**: Ensuring a single `Author` node exists across multiple references or metadata blocks.
*   **XML Snippet**:
    ```xml
    <header>
      <title>Test Document</title>
      <author>Test Author</author>
    </header>
    ```
*   **Configuration UI**:
    *   **New Node Label**: Label used if a new node must be created.
    *   **Attribute Mappings**: Mappings representing the new node's initial properties.
    *   **Lookup Target**: 
        *   **Target Label (Optional)**: Node label to search.
        *   **Property Key**: Database property to search (e.g., `name`).
        *   **Property Value**: The dynamic value to search for (supports templates, e.g., `{{ $json.textContent }}`).
    *   **Strict Lookup (Must Resolve)**: If enabled (checkbox), the workflow fails/cancels if the target node cannot be found or created.
    *   **Relationship Type**: Define the relationship label to the context node.
    *   **Relationship Direction**: `Outgoing` or `Incoming`.

### **6. Update Node** (`action:update-node`)
*   **Description**: Modifies properties or labels of an existing node in the workflow.
*   **Use Case**: Updating a previously created structural node with a calculated label like "Processed".
*   **XML Snippet**:
    ```xml
    <structure>
      <stanza xml:id="stanza-1" n="1">
    ```
*   **Configuration UI**:
    *   **Target Node (Node Targeting Section)**:
        *   **Alias**: Reference an aliased node from the context (e.g., `current`, `parent`).
        *   **Lookup**: Find a node by specific property/value match within the context.
    *   **Property Updates**: Key-Value Editor for adding/changing properties on the matched node.
    *   **Add/Replace Labels**: Comma-separated list of labels to apply to the node (e.g., `Stanza, Processed`).

### **7. Clone Node** (`action:clone-node`)
*   **Description**: Creates a copy of a node with specific changes.
*   **Use Case**: Creating an exact copy of a node for a parallel workflow step.
*   **XML Snippet**:
    ```xml
    <seg xml:id="seg-1" type="text">
    ```
*   **Configuration UI**:
    *   **Node to Clone**: Targeting section to select the source node (Alias or Lookup).
    *   **Property Modifications**: Key-Value Editor to override or add specific properties on the cloned node.
    *   **New Labels**: Comma-separated list of labels to override the original labels on the clone.
    *   **Clone Relationship**: Configuration to optionally relate the clone back to the original or another node:
        *   **Relationship Type**
        *   **Relationship Direction**
        *   **Target Node Alias/Lookup**

### **8. Delete Node** (`action:delete-node`)
*   **Description**: Removes a node from the workflow graph conditionally.
*   **Use Case**: Cleaning up a temporary or intermediate container node after extraction.
*   **XML Snippet**:
    ```xml
    <column xml:id="col-1" n="1">
    ```
*   **Configuration UI**:
    *   **Target Node**: Targeting section to select the node (Alias or Lookup).
    *   **Property Match**: Key-Value Editor. The action *only* deletes the node if all specified properties match exactly. Leaving this empty deletes the node unconditionally.

### **9. Merge Nodes** (`action:merge-nodes`)
*   **Description**: Consolidates multiple nodes into one.
*   **Use Case**: Merging multiple nodes that resolve to the same structural representation.
*   **Configuration UI**:
    *   **Target Node**: Targeting section to select the primary node that will remain.
    *   **Source Node(s) to Merge From**: Targeting section to select the nodes that will be merged into the target.
    *   **Merge Strategy**: 
        *   `Union (merge all)`: Combines all properties.
        *   `Prefer Source`: Source properties overwrite target.
        *   `Prefer Target`: Target properties take precedence.

---

## Property Actions

### **1. Set Property** (`action:set-property`)
*   **Description**: Assigns a specific value to a node property.
*   **Use Case**: Hardcoding a `documentTitle` property directly.
*   **XML Snippet**:
    ```xml
    <title>Test Document</title>
    ```
*   **Configuration UI**:
    *   **Property Key**: The exact name of the property to set.
    *   **Property Value**: Supports manual input, template syntax (`{{ ... }}`), or a dedicated **JSON Field Selector** if API response data is available in the context.

### **2. Copy Property** (`action:copy-property`)
*   **Description**: Transfers a property from one node to another.
*   **Use Case**: Pulling the `n` attribute from a parent `column` down to a `line` node.
*   **XML Snippet**:
    ```xml
    <column xml:id="col-1" n="1">
      <line xml:id="line-1" n="1">
    ```
*   **Configuration UI**:
    *   **Source Property**: Key name on the source node (supports templates).
    *   **Target Property**: Key name on the target node (supports templates).
    *   **Source Node ID**: The ID of the node to copy from. (Leave empty to default to the parent node).

### **3. Merge Properties** (`action:merge-properties`)
*   **Description**: Combines multiple properties into one (string, object, or array).
*   **Use Case**: Combining `lemma` and `text` properties extracted from a `<w>` tag.
*   **XML Snippet**:
    ```xml
    <w xml:id="word-1" lemma="hello" text="hello">hello</w>
    ```
*   **Configuration UI**:
    *   **Source Properties**: Comma-separated list of keys to merge.
    *   **Target Property**: Output key for the merged result (supports templates).
    *   **Merge Strategy**: 
        *   `Concatenate (space-separated)`: A string of all values.
        *   `Object (key-value pairs)`: A JSON object with the original keys intact.
        *   `Array`: A JSON array of the values.

### **4. Split Property** (`action:split-property`)
*   **Description**: Breaks a single property expression into several individual parts.
*   **Use Case**: Splitting a string property value into multiple fields based on punctuation.
*   **Configuration UI**:
    *   **Source Property**: Key to split (supports templates).
    *   **Separator**: The string delimiter character (e.g., `,`, ` `) (supports templates).
    *   **Target Properties**: Comma-separated list of keys to assign the resulting parts.

### **5. Extract & Compute Property** (`action:extract-and-compute-property`)
*   **Description**: Aggregates from multiple sources (attributes, text, static) with basic operations.
*   **Use Case**: Building a display string concatenating the word's id and its lemma.
*   **XML Snippet**:
    ```xml
    <w xml:id="word-1" lemma="hello" text="hello">hello</w>
    ```
*   **Configuration UI**:
    *   **Property Key**: The key for the computed result.
    *   **Computation Type**: `Concatenate`, `Sum (numbers)`, or `Join with separator`.
    *   **Separator** *(If 'Concat' or 'Join' is selected)*: The string to insert between values.
    *   **Sources**: A dynamic list where each item requires:
        *   **Source Type**: `Text Content`, `XML Attribute`, or `Static Value`.
        *   **Attribute Name**: *(If type is 'XML Attribute')* The attribute key.
        *   **Static Value**: *(If type is 'Static Value')* The literal string.

### **6. Extract & Normalize Attributes** (`action:extract-and-normalize-attributes`)
*   **Description**: Bulk mapper for many attributes at once with cleanup options.
*   **Use Case**: Processing `xml:id`, `type`, and `target` attributes in a single pass.
*   **XML Snippet**:
    ```xml
    <note xml:id="note-1" type="editorial" target="#word-1">
    ```
*   **Configuration UI**:
    *   **Remove original attributes from properties**: Checkbox to delete the source attribute after successful mapping.
    *   **Attribute Mappings**: A dynamic list of individual mapping rules:
        *   **Source Attribute**: The XML attribute key (e.g., `xml:id`).
        *   **Target Property**: The Database property key (supports templates).
        *   **Default Value (Optional)**: Setting fallback (supports templates).
        *   **Transformations**: A list of operations applied specifically to this attribute (e.g., `trim`, `lowercase`).

### **7. Format Property** (`action:format-property`)
*   **Description**: Standardizes string types into actual data types (dates, numbers).
*   **Use Case**: Ensuring attributes meant to be numbers are stored as numeric data types.
*   **XML Snippet**:
    ```xml
    <surface xml:id="surface-1" n="1">
    ```
*   **Configuration UI**:
    *   **Property Key**: The property to format (supports templates).
    *   **Format**: `Date`, `Number`, `Currency`, `Percentage`, or `Text`.
    *   **Format String (Optional)**: Locales or specific patterns (e.g., `en-US` or `YYYY-MM-DD`).

---

## Relationship Actions

### **1. Create Relationship** (`action:create-relationship`)
*   **Description**: Manually builds a link between two specific nodes.
*   **Use Case**: Creating a relationship from a nested tag directly to a parent structure.
*   **Configuration UI**:
    *   **Relationship Type**: Label of the connection.
    *   **Source Node**: Dropdown selecting `Current Node` or `Parent Node`.
    *   **Target Node**: Dropdown selecting `Current Node` or `Parent Node`.
    *   **Properties**: A dynamic list of key-value pairs assigned specifically as metadata to the relationship edge.

### **2. Defer Relationship** (`action:defer-relationship`)
*   **Description**: Configures a relationship to be resolved later by searching the AST.
*   **Use Case**: Connecting an editorial `<note>` to the targeted word `<w>` when they are in different locations.
*   **XML Snippet**:
    ```xml
    <w xml:id="word-1" lemma="hello" text="hello">hello</w>
    <!-- ... -->
    <note xml:id="note-1" type="editorial" target="#word-1">
    ```
*   **Configuration UI**:
    *   **Relationship Type**: The label for the edge.
    *   **Search Scope**: Determines where the workflow explores looking for a match (`Children`, `Descendants`, `Global`).
    *   **Target Tag Name**: The XML tag name to look for (e.g., `w`).
    *   **Target Attribute Name**: The attribute on the target to match (e.g., `xml:id`).
    *   **Target Attribute Value**: The value the target attribute must have to match (e.g., `{{ $json.target }}`).
    *   **Condition**: A rule evaluating when to execute this relationship logic (`Always`, `Has Attribute`, `Has Text`).

### **3. Update Relationship** (`action:update-relationship`)
*   **Description**: Modifies existing connections.
*   **Use Case**: Enhancing an initial relationship or replacing its label.
*   **Configuration UI**:
    *   **Relationship Label to Match**: Identifies which specific links to target.
    *   **From Node**: Node Targeting selection (Alias/Lookup) for the relationship's origin.
    *   **To Node**: Node Targeting selection (Alias/Lookup) for the relationship's destination.
    *   **New Relationship Label (Optional)**: If provided, replaces the matched label.
    *   **Property Updates**: Key-Value Editor to mutate the metadata on the matched relationship edge.

### **4. Delete Relationship** (`action:delete-relationship`)
*   **Description**: Removes connections conditionally.
*   **Use Case**: Scrapping a generic relationship if it violates structure rules.
*   **Configuration UI**:
    *   **Relationship Label to Delete**: Identifies the edge type.
    *   **From Node**: Node Targeting selection for the origin.
    *   **To Node**: Node Targeting selection for the destination.
    *   **Property Matches**: Key-Value Editor containing conditions. The relationship is *only* deleted if it matches these specific metadata properties.

### **5. Reverse Relationship** (`action:reverse-relationship`)
*   **Description**: Flips the start and end direction of matching links.
*   **Use Case**: Correcting directionality after importing inverted data.
*   **Configuration UI**:
    *   **Relationship Label to Reverse**: Identifies the edge type.
    *   **From Node**: Node Targeting selection for the *current* origin.
    *   **To Node**: Node Targeting selection for the *current* destination.

### **6. Create Reference Chain** (`action:create-reference-chain`)
*   **Description**: Processes an array of IDs from an attribute into a sequence of links.
*   **Use Case**: Linking to multiple targets when an attribute contains a space-separated list of IDs.
*   **Configuration UI**:
    *   **Reference Attribute**: The attribute containing the references (e.g., `corresp`, `target`, `ref`).
    *   **Target Node Label**: The label for the nodes being targeted in the chain.
    *   **Relationship Type**: The link label between the nodes.
    *   **Resolve Strategy**: Mechanism to locate the target node (`By ID`, `By XPath`).
    *   **Create Target If Missing**: Checkbox to ensure an empty placeholder node is instantiated if the target does not exist, preserving the chain integrity.

---

## Workflow & Control

### **1. Action Group** (`action:group`)
*   **Description**: Logical container to organize or toggle sets of actions.
*   **Use Case**: Grouping all text extraction actions together for easy management.
*   **Configuration UI**:
    *   **Group Label**: Custom name presented in the canvas.
    *   **Enabled**: Master checkbox toggle. When disabled, the entire block of nested actions is skipped during execution.

### **2. Skip Element** (`action:skip`)
*   **Description**: Explicitly controls which parts of the XML are ignored.
*   **Use Case**: Ignoring the entire `<header>` block if metadata is extracted elsewhere.
*   **XML Snippet**:
    ```xml
    <header>
      <title>Test Document</title>
      <author>Test Author</author>
    </header>
    ```
*   **Configuration UI**:
    *   **Skip Creating Main Node**: Checkbox indicating the current element implies structure, but no distinct node should be pushed to the graph.
    *   **Skip Processing Children**: Checkbox indicating the workflow should not explore child tags.
    *   **Skip Mode** *(If 'Skip Children' is checked)*: `Skip All Children` or `Skip Selected Tags Only`.
    *   **Skip Tags** *(If 'Selected Tags Only' is chosen)*: Comma-separated list of tags to specifically ignore.

### **3. Merge Children Text** (`action:merge-children-text`)
*   **Description**: Flattens nested XML text into a single string property on the current node.
*   **Use Case**: Gathering all the text words nested inside a `<seg>` element into one contiguous string.
*   **XML Snippet**:
    ```xml
    <seg xml:id="seg-1" type="text">
      <w xml:id="word-1" lemma="hello" text="hello">hello</w>
      <w xml:id="word-2" lemma="world" text="world">world</w>
    </seg>
    ```
*   **Configuration UI**:
    *   **Property Key**: The property key on the current node that will hold the merged text (e.g., `text`).
    *   **Separator**: The string delimiter between child segments (e.g., ` ` (space), `,`).
    *   **Filter By Tag**: Comma-separated list of tags. The action will *only* pull text from elements matching these tags (e.g., `w, p`).
    *   **Exclude Tags**: Comma-separated list of tags. The action will specifically ignore text originating from these elements (e.g., `note, comment`).
