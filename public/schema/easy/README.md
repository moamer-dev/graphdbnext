# Easy Level - Basic Workflow Testing

This is the simplest workflow configuration for testing basic XML to graph conversion with conditional processing.

## XML Structure

The `test-workflow.xml` file contains:
- **Edxml** (root element)
  - **Header** with Title and Author
  - **Text** with:
    - **Surface** → **Column** → **Line** → **Seg** → **W** (words: "hello", "world")
    - **Structure** → **Stanza** → **Verse** → **W** (word: "test")
    - **Note** with reference to word-1 and a **P** element with text

## Node Mapping

Map XML elements to these node labels:
- `edxml` → `Edxml`
- `header` → `Header`
- `text` → `Text`
- `surface` → `Surface`
- `column` → `Column`
- `line` → `Line`
- `seg` → `Seg`
- `w` → `W`
- `structure` → `Structure`
- `stanza` → `Stanza`
- `verse` → `Verse`
- `note` → `Note`
- `title` → `Title`
- `author` → `Author`
- `p` → `P`

## Relationships

The config defines **16 relationships**:

### Hierarchical Structure
1. `Edxml → Header` (contains)
2. `Edxml → Text` (contains)
3. `Header → Title` (contains)
4. `Header → Author` (contains)
5. `Text → Surface` (contains)
6. `Surface → Column` (contains)
7. `Column → Line` (contains)
8. `Line → Seg` (contains)
9. `Seg → W` (contains)
10. `Text → Structure` (contains)
11. `Structure → Stanza` (contains)
12. `Stanza → Verse` (contains)
13. `Verse → W` (contains)
14. `Note → P` (contains)

### Cross-References
15. `Text → Note` (annotates)
16. `Note → W` (references)

## Workflow Rules

### Rule 1: W Elements with Lemma "hello" or "world"
**Condition**: W element has `lemma` attribute with value "hello" OR "world"

**Actions**:
1. Create W node with properties: `xmlId`, `lemma`
2. Create Character nodes for each token (alphanumeric characters only)
3. Create "contains" relationships: W → Character

**Example**: 
- `<w lemma="hello" text="hello">` → Creates W node + 5 Character nodes (h, e, l, l, o)
- `<w lemma="world" text="world">` → Creates W node + 5 Character nodes (w, o, r, l, d)

### Rule 2: W Elements with Lemma "test"
**Condition**: W element has `lemma` attribute with value "test"

**Actions**:
1. Create a single Text node for the entire text content
2. Create "contains" relationship: W → Text node

**Example**:
- `<w lemma="test" text="test">test</w>` → Creates W node + 1 Text node with text content "test"

### Rule 3: P Elements with Text Content
**Condition**: P element has text content

**Actions**:
1. Create P node
2. Extract text content
3. Sanitize text by removing all "-" characters
4. Set `text` property on P node with sanitized value

**Example**:
- `<p>This is a note about word-1</p>` → Creates P node with `text: "This is a note about word1"` (dash removed)

## Tools and Actions

### Tools: 3

1. **tool:if** - "Check W Lemma is Hello or World"
   - Checks if W element has `lemma` attribute with value "hello" OR "world"
   - Routes to actions only if TRUE

2. **tool:switch** - "Switch by W Lemma"
   - Routes based on `lemma` attribute value
   - Case: "test" → routes to "test" output
   - Default → routes to "default" output

3. **tool:if** - "Check P Has Text Content"
   - Checks if P element has text content
   - Routes to actions only if TRUE

### Actions: 7

1. **action:create-node** - "Create W Node"
   - Creates W nodes with properties: `xmlId`, `lemma`
   - Only for words with lemma "hello" or "world"

2. **action:create-node-tokens** - "Create Character Nodes"
   - Tokenizes word text into individual characters
   - Creates Character nodes for each alphanumeric character
   - Filters out spaces and special characters
   - Only for words with lemma "hello" or "world"

3. **action:create-node-text** - "Create Text Node for Test"
   - Creates a single Text node for the entire text content
   - Only for words with lemma "test"

4. **action:create-node** - "Create P Node"
   - Creates P node
   - Only for P elements with text content

5. **action:extract-text** - "Extract P Text"
   - Extracts text content from P element
   - Stores in `textContent` property

6. **action:transform-text** - "Sanitize P Text"
   - Transforms text by replacing "-" with "" (removing dashes)
   - Stores result in `transformedText` and `textContent` properties

7. **action:set-property** - "Set P Text Property"
   - Sets `text` property on P node
   - Uses transformed text if available (from transform-text action)

## Expected Graph Output

### Nodes Created:
- **Edxml** (1 node)
- **Header** (1 node)
- **Title** (1 node)
- **Author** (1 node)
- **Text** (1 node)
- **Surface** (1 node)
- **Column** (1 node)
- **Line** (1 node)
- **Seg** (1 node)
- **W** (3 nodes: word-1 "hello", word-2 "world", word-3 "test")
- **Structure** (1 node)
- **Stanza** (1 node)
- **Verse** (1 node)
- **Note** (1 node)
- **P** (1 node with `text` property: "This is a note about word1")
- **Character** (10 nodes: 5 for "hello", 5 for "world")
- **Text** (1 node for word-3 "test")

### Relationships Created:
- All hierarchical "contains" relationships
- Text → Note (annotates)
- Note → W (references) - based on `target` attribute
- W → Character (contains) - for "hello" and "world" words
- W → Text (contains) - for "test" word

## Testing Steps

1. Import `test-workflow.xml` in XML Import Wizard
2. Map all XML elements to node labels (see mapping above)
3. Import `test-workflow-config.json`
4. Generate graph
5. Verify:
   - W nodes with lemma "hello" or "world" have Character nodes
   - W node with lemma "test" has a Text node (not Character nodes)
   - P node has `text` property with sanitized text (no dashes)
   - Relationships follow the XML hierarchy

## What This Tests

✅ Conditional processing based on attribute values
✅ Multi-way branching (switch tool)
✅ Tokenization (Character nodes from word text)
✅ Text node creation for entire text content
✅ Text extraction and transformation
✅ Property setting with transformed values
✅ Action chaining (extract → transform → set property)
✅ Different processing paths for different element values

## Key Features

1. **Conditional Character Creation**: Only words with lemma "hello" or "world" get Character nodes
2. **Text Node Creation**: Words with lemma "test" get a single Text node instead
3. **Text Sanitization**: P elements have their text sanitized (dashes removed) before being stored
