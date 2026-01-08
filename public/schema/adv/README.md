# Advanced Level - Complex Workflow Testing

This workflow demonstrates advanced features with multiple tools, actions, filtering, and complex relationships.

## XML Structure

The `test-workflow.xml` file contains:
- **Edxml** (root)
  - **Header** with Title, Textclass/Classcode, and Author
  - **Text** with:
    - **Surface** → **Column** → **Line** → **Seg** → **W** (with damage/unclear)
    - **Seg** → **Pc** (punctuation)
    - **Structure** → **Stanza** → **Verse** → **W**
    - **Note** with multiple targets and terms
    - **Translation** with segment references
    - **Choice** → **Corr/Sic** → **W** (editorial variants)

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
- `textClass` → `Textclass`
- `classCode` → `Classcode`
- `damage` → `Damage`
- `unclear` → `Unclear`
- `choice` → `Choice`
- `corr` → `Corr`
- `sic` → `Sic`
- `term` → `Term`

## Relationships

The config defines **28 relationships**:

### Hierarchical Structure
1. `Edxml → Header` (contains)
2. `Edxml → Text` (contains)
3. `Header → Title` (contains)
4. `Header → Textclass` (contains) - **NEW**
5. `Textclass → Classcode` (contains) - **NEW**
6. `Header → Author` (contains)
7. `Text → Surface` (contains)
8. `Surface → Column` (contains)
9. `Column → Line` (contains)
10. `Line → Seg` (contains)
11. `Seg → W` (contains)
12. `Seg → Pc` (contains)
13. `W → Damage` (contains) - **NEW**
14. `Damage → Unclear` (contains) - **NEW**
15. `Text → Structure` (contains)
16. `Structure → Stanza` (contains)
17. `Stanza → Verse` (contains)
18. `Verse → W` (contains)
19. `Text → Choice` (contains) - **NEW**
20. `Choice → Corr` (contains) - **NEW**
21. `Choice → Sic` (contains) - **NEW**
22. `Corr → W` (contains) - **NEW**
23. `Sic → W` (contains) - **NEW**
24. `Note → P` (contains)
25. `Note → Term` (contains) - **NEW**
26. `Translation → Seg` (contains)

### Cross-References
27. `Text → Note` (annotates)
28. `Text → Translation` (translates)
29. `Note → W` (references)

## Tools and Actions

### Tools: 5

1. **tool:if** - "Check W Has Text Attribute"
   - Conditional processing based on attribute presence

2. **tool:switch** - "Switch by Lemma"
   - Multi-way branching: "test" → "test-word", "workflow" → "workflow-word", default
   - Routes to different actions based on lemma value

3. **tool:filter** - "Filter Damage Elements" - **NEW**
   - Filters out `damage` and `unclear` elements
   - Mode: `ignoreSubtree` (skips element and children)

4. **tool:transform** - "Transform Attributes"
   - Maps `lemma` → `lemmaProperty`
   - Maps `ana` → `posTag`
   - Maps `cert` → `certainty` - **NEW**

5. **tool:loop** - "Loop Through Seg Children" - **NEW**
   - Processes only `w` and `pc` children
   - Max depth: 2
   - Skips ignored elements

### Actions: 9

1. **action:create-node** - "Create W Node"
   - Creates W nodes with properties

2. **action:create-node-tokens** - "Create Character Nodes"
   - Tokenizes word text into Character nodes

3. **action:extract-property** - "Extract Lemma Property"
   - Extracts lemma to extractedLemma property

4. **action:set-property** - "Set Processed Property"
   - Sets processed flag

5. **action:extract-text** - "Extract Text Content" - **NEW**
   - Extracts text content from elements

6. **action:transform-text** - "Transform to Lowercase" - **NEW**
   - Transforms text to lowercase

7. **action:create-reference** - "Create Reference"
   - Creates relationships from corresp attributes

8. **action:create-annotation** - "Create Annotation" - **NEW**
   - Creates annotation nodes for lemma and POS

9. **action:process-children** - "Process Children" - **NEW**
   - Explicitly processes filtered children
   - Excludes damage elements
   - Recursive processing

## Expected Graph Output

### Nodes Created:
- All nodes from medium level
- **Textclass** and **Classcode** nodes
- **Damage** and **Unclear** nodes
- **Choice**, **Corr**, and **Sic** nodes
- **Term** nodes
- **Character** nodes for all words

### Relationships Created:
- All relationships from medium level
- `W → Damage → Unclear` hierarchy
- `Text → Choice → Corr/Sic → W` hierarchy
- `Note → Term` relationship
- Cross-references from various attributes

### Properties:
- W nodes have: `xmlId`, `lemma`, `lemmaProperty`, `posTag`, `certainty`, `processed`, `extractedLemma`
- Transformed text properties
- Annotation nodes with lemma and POS

## Testing Steps

1. Import `test-workflow.xml` in XML Import Wizard
2. Map all XML elements to node labels
3. Import `test-workflow-config.json`
4. Generate graph
5. Verify:
   - Filter tool skips damage/unclear elements
   - Loop tool processes only specified children
   - Transform tool maps all three attributes
   - Extract-text and transform-text actions work
   - Create-annotation action creates annotation nodes
   - Process-children action filters correctly
   - All complex relationships are created

## What This Tests

✅ All medium level features
✅ Element filtering (filter tool)
✅ Selective child processing (loop tool)
✅ Multiple attribute transformations
✅ Text extraction and transformation
✅ Annotation creation
✅ Recursive child processing with filtering
✅ Complex nested structures (Choice, Damage)
✅ Multiple tools chained together
✅ Multiple actions from multiple tools

## Key Differences from Medium Level

- **More tools**: 5 tools vs 3 (adds filter and loop)
- **More actions**: 9 actions vs 5 (adds extract-text, transform-text, create-annotation, process-children)
- **More relationships**: 28 vs 19 (adds Textclass, Damage, Choice, Term hierarchies)
- **Filtering**: Filter tool skips unwanted elements
- **Selective processing**: Loop tool processes only specific children
- **Text processing**: Extract and transform text content
- **Annotations**: Create annotation nodes
- **Complex structures**: Choice, Damage, Unclear elements

## Advanced Features Demonstrated

1. **Conditional Filtering**: Filter tool removes damage/unclear from processing
2. **Selective Iteration**: Loop tool processes only w and pc children
3. **Multiple Transformations**: Transform tool maps 3 different attributes
4. **Text Processing**: Extract and transform text content
5. **Annotation System**: Create annotation nodes for linguistic data
6. **Recursive Processing**: Process children with filtering and recursion
7. **Complex Routing**: Multiple tools route to multiple actions
8. **Editorial Variants**: Handle Choice/Corr/Sic structures

