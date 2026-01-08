# Medium Level - Intermediate Workflow Testing

This workflow adds more tools and actions to demonstrate intermediate complexity.

## XML Structure

The `test-workflow.xml` file contains:
- **Edxml** (root)
  - **Header** with Title and Author
  - **Text** with:
    - **Surface** → **Column** → **Line** → **Seg** → **W** (multiple words)
    - **Seg** → **Pc** (punctuation)
    - **Structure** → **Stanza** → **Verse** → **W**
    - **Note** with multiple target references
    - **Translation** with segment references

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
- `translation` → `Translation`
- `pc` → `Pc`

## Relationships

The config defines **19 relationships**:

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
10. `Seg → Pc` (contains) - **NEW**
11. `Text → Structure` (contains)
12. `Structure → Stanza` (contains)
13. `Stanza → Verse` (contains)
14. `Verse → W` (contains)
15. `Note → P` (contains)
16. `Translation → Seg` (contains) - **NEW**

### Cross-References
17. `Text → Note` (annotates)
18. `Text → Translation` (translates) - **NEW**
19. `Note → W` (references)

## Tools and Actions

### Tools: 3

1. **tool:if** - "Check W Has Text Attribute"
   - Checks if W element has `text` attribute
   - Routes to actions only if TRUE

2. **tool:switch** - "Switch by Lemma" - **NEW**
   - Routes based on `lemma` attribute value
   - Cases: "hello" → "greeting", "world" → "noun", default
   - Demonstrates multi-way branching

3. **tool:transform** - "Transform Attributes" - **NEW**
   - Maps `lemma` → `lemmaProperty`
   - Maps `ana` → `posTag`
   - Transforms XML attributes to graph properties

### Actions: 5

1. **action:create-node** - "Create W Node"
   - Creates W nodes with `xmlId` and `lemma` properties

2. **action:create-node-tokens** - "Create Character Nodes"
   - Tokenizes word text into Character nodes

3. **action:extract-property** - "Extract Lemma Property" - **NEW**
   - Extracts `lemma` attribute to `extractedLemma` property
   - Triggered by switch tool "greeting" output

4. **action:set-property** - "Set Processed Property" - **NEW**
   - Sets `processed: true` on W nodes
   - Triggered by transform tool

5. **action:create-reference** - "Create Reference" - **NEW**
   - Creates relationships from `corresp` attributes
   - Example: `seg corresp="#word-1"` → creates relationship to word-1

## Expected Graph Output

### Nodes Created:
- All nodes from easy level
- **Pc** nodes (punctuation)
- **Translation** nodes
- **Character** nodes for all words with `text` attribute

### Relationships Created:
- All relationships from easy level
- `Seg → Pc` (contains)
- `Text → Translation` (translates)
- `Translation → Seg` (contains)
- Cross-references from `corresp` attributes

### Properties:
- W nodes have: `xmlId`, `lemma`, `lemmaProperty`, `posTag`, `processed`, `extractedLemma`
- Character nodes have: `id`, `text`

## Testing Steps

1. Import `test-workflow.xml` in XML Import Wizard
2. Map all XML elements to node labels
3. Import `test-workflow-config.json`
4. Generate graph
5. Verify:
   - Switch tool routes to different actions based on lemma
   - Transform tool maps attributes correctly
   - Extract-property action extracts lemma
   - Set-property action sets processed flag
   - Create-reference action creates cross-references

## What This Tests

✅ All easy level features
✅ Multi-way branching (switch tool)
✅ Attribute transformation
✅ Property extraction
✅ Custom property setting
✅ Cross-reference creation from attributes
✅ Multiple tools on same node
✅ Multiple actions from one tool

## Key Differences from Easy Level

- **More tools**: 3 tools vs 1 (adds switch and transform)
- **More actions**: 5 actions vs 2 (adds extract-property, set-property, create-reference)
- **More relationships**: 19 vs 15 (adds Pc and Translation)
- **More complex routing**: Switch tool routes to different actions
- **Property transformations**: Attributes mapped to different property names

