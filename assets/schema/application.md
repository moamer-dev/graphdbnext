# EUPT Graph Data Model - Complete Schema Reference

This document provides a complete reference for all nodes, properties, and relations in the EUPT (Epigraphic Ugaritic Text) Graph Data Application Profile.

---

## Overview

The EUPT graph model represents Ugaritic texts in three main layers:

1. **Transliteration Layer** - The visual/physical representation of the tablet
2. **Vocalisation Layer** - The linguistic/philological interpretation  
3. **Annotations & Translations** - Cross-cutting metadata and commentary

---

## NODES

### Text Structure

#### EditionObject
**Description**: Represents the entire clay tablet/document

**Labels**: `Thing`, `EditionObject`

**Properties**:
- `docStatus` (required, string) - Values: 'draft', 'published'
- `textClass` (required, string) - Values: 'epic', 'historiola', 'hymn', 'incantation', 'prayer', 'ritual'
- `title` (required, string) - The document title (e.g., "KTU 1.14")

**Relations (outgoing)**:
- `hasLayer` → TransliterationLayer, VocalisationLayer

**Relations (incoming)**:
- `annotates` ← Annotation
- `mentions` ← Annotation

---

### Transliteration Layer (Visual)

#### TransliterationLayer
**Description**: The visual/physical layer containing facsimile data

**Labels**: `Thing`, `TextInformationLayer`, `VisualLayer`, `TransliterationLayer`

**Properties**: None

**Relations (outgoing)**:
- `contains` → Surface, Alternatives

**Relations (incoming)**:
- `hasLayer` ← EditionObject
- `annotates` ← Annotation
- `mentions` ← Annotation

#### Surface
**Description**: A written surface (recto or verso)

**Labels**: `Thing`, `TextUnit`, `VisualUnit`, `TextArea`, `Surface`

**Properties**:
- `surface` (optional, string) - Values: 'recto', 'verso'

**Relations (outgoing)**:
- `contains` → Column, Alternatives

**Relations (incoming)**:
- `contains` ← TransliterationLayer
- `annotates` ← Annotation
- `expressedAs` ← Alternative
- `mentions` ← Annotation

#### Column
**Description**: A numbered column on the tablet

**Labels**: `Thing`, `TextUnit`, `VisualUnit`, `TextArea`, `Zone`, `Column`

**Properties**:
- `id` (optional, string)
- `n` (required, string) - Column number

**Relations (outgoing)**:
- `contains` → Line, Alternatives

**Relations (incoming)**:
- `contains` ← Surface
- `annotates` ← Annotation
- `expressedAs` ← Alternative
- `mentions` ← Annotation

#### Line
**Description**: A line of text

**Labels**: `Thing`, `TextUnit`, `VisualUnit`, `TextArea`, `Zone`, `Line`

**Properties**:
- `id` (optional, string)
- `n` (required, string) - Line number (e.g., "i 1")

**Relations (outgoing)**:
- `contains` → Part, Seg, Sign, Alternatives

**Relations (incoming)**:
- `contains` ← Column
- `annotates` ← Annotation
- `expressedAs` ← Alternative
- `mentions` ← Annotation

#### Part
**Description**: A chunk of text within a line

**Labels**: `Thing`, `TextUnit`, `VisualUnit`, `GraphicalUnit`, `Part`

**Properties**:
- `id` (required, string)

**Relations (outgoing)**:
- `contains` → Seg, Sign, Alternatives

**Relations (incoming)**:
- `contains` ← Line
- `refersTo` ← Colon
- `annotates` ← Annotation
- `expressedAs` ← Alternative
- `mentions` ← Annotation

#### Seg
**Description**: A text segment (word-like grouping of signs)

**Labels**: `Thing`, `TextUnit`, `VisualUnit`, `GraphicalUnit`, `Seg`

**Properties**:
- `id` (required, string)

**Relations (outgoing)**:
- `contains` → Sign, Alternatives

**Relations (incoming)**:
- `contains` ← Line, Part
- `refersTo` ← Word
- `annotates` ← Annotation
- `expressedAs` ← Alternative
- `mentions` ← Annotation

#### Sign
**Description**: A single sign/glyph or punctuation mark

**Labels**: `Thing`, `TextUnit`, `VisualUnit`, `GraphicalUnit`, `Sign`

**Properties**:
- `id` (optional, string)
- `text` (required, string) - The sign character
- `type` (required, string) - Values: 'g' (glyph), 'pc' (punctuation)
- `whitespace` (required, string) - Whitespace following the sign
- `index` (optional, integer) - Position index
- `subtype` (optional, string) - Subtype of sign
- `damage` (optional, string) - Values: 'high', 'low'

**Relations (outgoing)**:
- None (leaf node)

**Relations (incoming)**:
- `contains` ← Line, Part, Seg
- `annotates` ← Annotation
- `expressedAs` ← Alternative
- `mentions` ← Annotation

---

### Vocalisation Layer (Linguistic)

#### VocalisationLayer
**Description**: The linguistic/vocalisation layer

**Labels**: `Thing`, `TextInformationLayer`, `VocalisationLayer`

**Properties**: None

**Relations (outgoing)**:
- `contains` → Stanza, Verse, Alternatives

**Relations (incoming)**:
- `hasLayer` ← EditionObject
- `annotates` ← Annotation
- `mentions` ← Annotation

#### Stanza
**Description**: A stanza in Ugaritic poetology

**Labels**: `Thing`, `TextUnit`, `PoetologicalUnit`, `Stanza`

**Properties**:
- `id` (optional, string)
- `analysis` (optional, string)

**Relations (outgoing)**:
- `contains` → Verse, Alternatives

**Relations (incoming)**:
- `contains` ← VocalisationLayer
- `annotates` ← Annotation
- `expressedAs` ← Alternative
- `mentions` ← Annotation

#### Verse
**Description**: A verse in Ugaritic poetology

**Labels**: `Thing`, `TextUnit`, `PoetologicalUnit`, `Verse`

**Properties**:
- `id` (optional, string)
- `n` (required, string) - Verse number

**Relations (outgoing)**:
- `contains` → Colon, Alternatives

**Relations (incoming)**:
- `contains` ← VocalisationLayer, Stanza
- `annotates` ← Annotation
- `expressedAs` ← Alternative
- `mentions` ← Annotation

#### Colon
**Description**: A colon (clause/phrase) in Ugaritic poetology

**Labels**: `Thing`, `TextUnit`, `PoetologicalUnit`, `Colon`

**Properties**:
- `id` (optional, string)
- `n` (required, string) - Colon number
- `analysis` (optional, string)

**Relations (outgoing)**:
- `contains` → UnidentifiableUnit, Word, Alternatives
- `refersTo` → Part
- `translatedAs` → TranslationUnit, Alternatives

**Relations (incoming)**:
- `contains` ← Verse
- `annotates` ← Annotation
- `expressedAs` ← Alternative
- `mentions` ← Annotation

#### Phrase
**Description**: A grammatical phrase

**Labels**: `Thing`, `TextUnit`, `GrammaticalUnit`, `Phrase`

**Properties**:
- `id` (optional, string)
- `analysis` (optional, string)

**Relations (outgoing)**:
- `contains` → UnidentifiableUnit, Word, Alternatives

**Relations (incoming)**:
- `annotates` ← Annotation
- `expressedAs` ← Alternative
- `mentions` ← Annotation

#### Word
**Description**: A grammatical word

**Labels**: `Thing`, `TextUnit`, `GrammaticalUnit`, `MorphologicalUnit`, `Word`

**Properties**:
- `id` (optional, string)
- `cert` (optional, string) - Values: 'high', 'low'

**Relations (outgoing)**:
- `contains` → Character
- `refersTo` → Seg

**Relations (incoming)**:
- `contains` ← Phrase
- `annotates` ← Annotation
- `expressedAs` ← Alternative
- `mentions` ← Annotation

#### Character
**Description**: A single character

**Labels**: `Thing`, `TextUnit`, `GrammaticalUnit`, `Character`

**Properties**:
- `id` (optional, string)
- `text` (required, string) - The character
- `whitespace` (required, string) - Following whitespace
- `damage` (optional, string) - Values: 'high', 'low'
- `unclear` (optional, boolean) - Text is unclear

**Relations (outgoing)**:
- None (leaf node)

**Relations (incoming)**:
- `contains` ← Word
- `annotates` ← Annotation
- `expressedAs` ← Alternative
- `mentions` ← Annotation

#### UnidentifiableUnit
**Description**: A group of unidentifiable signs

**Labels**: `Thing`, `TextUnit`, `GrammaticalUnit`, `MorphologicalUnit`, `Word`, `UnidentifiableUnit`

**Properties**: None

**Relations (outgoing)**:
- `contains` → UnidentifiableSign, Alternatives

**Relations (incoming)**:
- `contains` ← Phrase, Colon
- `annotates` ← Annotation
- `expressedAs` ← Alternative
- `mentions` ← Annotation

#### UnidentifiableSign
**Description**: A single unidentifiable sign

**Labels**: `Thing`, `TextUnit`, `GrammaticalUnit`, `Character`

**Properties**:
- `id` (required, string)
- `text` (required, string)
- `type` (optional, string)
- `whitespace` (required, string)
- `damage` (optional, string) - Values: 'high', 'low'
- `unclear` (optional, boolean)

**Relations (outgoing)**:
- None

**Relations (incoming)**:
- `contains` ← UnidentifiableUnit
- `annotates` ← Annotation
- `expressedAs` ← Alternative
- `mentions` ← Annotation

---

### Alternative Interpretations

#### Alternatives
**Description**: Container for alternative interpretations

**Labels**: `Thing`, `TextInformationLayer`, `Alternatives`

**Properties**:
- `name` (required, string) - Usually "corr-sic"

**Relations (outgoing)**:
- `alternative` → Alternative

**Relations (incoming)**:
- `contains` ← TextUnit, TransliterationLayer, VocalisationLayer
- `translatedAs` ← Colon
- `annotates` ← Annotation
- `mentions` ← Annotation

#### Alternative
**Description**: A specific alternative interpretation

**Labels**: `Thing`, `TextInformationLayer`, `Alternative`

**Properties**:
- `name` (required, string) - Usually "corr" or "sic"

**Relations (outgoing)**:
- `expressedAs` → TextUnit, TranslationUnit
- `relatedAlternative` → Alternative (itself)

**Relations (incoming)**:
- `alternative` ← Alternatives
- `relatedAlternative` ← Alternative
- `annotates` ← Annotation
- `mentions` ← Annotation

---

### Annotations & Translations

#### Annotation
**Description**: Any annotation (notes, lemma, morphology, etc.)

**Labels**: `Thing`, `Annotation`

**Properties**:
- `content` (required, string) - The annotation content
- `mimeType` (required, string) - Content MIME type
- `type` (required, string) - Annotation type
- `ref` (optional, URI) - Reference to external resource

**Relations (outgoing)**:
- `annotates` → Thing, Alternative, Alternatives, Annotation, TranslationUnit
- `mentions` → Thing, Alternative, Alternatives, Annotation, TranslationUnit

**Relations (incoming)**:
- `annotates` ← Annotation
- `mentions` ← Annotation

#### TranslationUnit
**Description**: A translation segment

**Labels**: `Thing`, `Annotation`, `TranslationUnit`

**Properties**:
- `content` (required, string) - The translation
- `mimeType` (required, string) - Content MIME type

**Relations (outgoing)**:
- None

**Relations (incoming)**:
- `translatedAs` ← Colon
- `annotates` ← Annotation
- `expressedAs` ← Alternative
- `mentions` ← Annotation

---

## RELATIONS

### contains
**Description**: Hierarchical containment of smaller units within larger ones (ordered)

**Properties**:
- `pos` (required, integer) - Position in the sequence

**Domain → Range Examples**:
- TransliterationLayer → Surface, Alternatives
- VocalisationLayer → Stanza, Verse, Alternatives
- Surface → Column, Alternatives
- Column → Line, Alternatives
- Line → Part, Seg, Sign, Alternatives
- Part → Seg, Sign, Alternatives
- Seg → Sign, Alternatives
- Stanza → Verse, Alternatives
- Verse → Colon, Alternatives
- Colon → UnidentifiableUnit, Word, Alternatives
- Phrase → Word, Alternatives
- Word → Character, Alternatives
- UnidentifiableUnit → UnidentifiableSign, Alternatives

### hasLayer
**Description**: Connects EditionObject to its information layers

**Properties**: None

**Domain → Range**:
- EditionObject → TransliterationLayer, VocalisationLayer

### annotates
**Description**: Links an annotation to its target

**Properties**: None

**Domain (from)**:
- Annotation

**Range (to)**:
- Thing, Alternative, Alternatives, Annotation, TranslationUnit

**Note**: Can annotate any node, including other annotations

### mentions
**Description**: Indicates that target node's content is mentioned in an annotation

**Properties**: None

**Domain (from)**:
- Annotation

**Range (to)**:
- Thing, Alternative, Alternatives, Annotation, TranslationUnit

### refersTo
**Description**: Non-hierarchical connection to a GrammaticalUnit

**Properties**: None

**Domain → Range**:
- Word → Seg
- Colon → Part

**Usage**: Links linguistic words to their visual representations

### translatedAs
**Description**: Links a Colon to its translation

**Properties**:
- `lang` (required, string) - Language code

**Domain → Range**:
- Colon → TranslationUnit, Alternatives

### alternative
**Description**: Connects Alternatives to Alternative nodes

**Properties**:
- `order` (required, integer) - Order of alternatives
- `pref` (required, boolean) - Whether this is the preferred interpretation

**Domain → Range**:
- Alternatives → Alternative

### expressedAs
**Description**: Defines the actual content represented by an Alternative

**Properties**: None

**Domain → Range**:
- Alternative → TextUnit, TranslationUnit

### relatedAlternative
**Description**: Links related Alternative nodes

**Properties**: None

**Domain → Range**:
- Alternative → Alternative (both directions)

---

## PROPERTIES REFERENCE

### Common Properties
- `@id` - Identifier (string, optional)
- `@n` - Number/designation (string, required for Line, Verse, Colon)

### Content Properties
- `@text` - Text content (required for Sign, Character)
- `@content` - Formatted content (required for Annotation, TranslationUnit)
- `@whitespace` - Whitespace (required for Sign, Character)
- `@mimeType` - MIME type (required for Annotation, TranslationUnit)

### Quality/Certainty Properties
- `@damage` - Damage level (string: 'high', 'low')
- `@cert` - Certainty (string: 'high', 'low')
- `@unclear` - Unclear text (boolean)

### Structural Properties
- `@type` - Type/classification (varies by node)
- `@subtype` - Subtype (Sign)
- `@index` - Position index (integer, Sign)
- `@surface` - Surface side (string: 'recto', 'verso')
- `@name` - Name/label (Alternatives, Alternative)
- `@analysis` - Linguistic analysis (string, Phrase, Colon, Stanza)

### Document Properties (EditionObject)
- `@docStatus` - Publication status (string: 'draft', 'published')
- `@textClass` - Text classification (string: 'epic', etc.)
- `@title` - Document title (string)

### Relation Properties
- `@pos` - Position in contains relation (integer, required)
- `@order` - Order in alternative relation (integer, required)
- `@pref` - Preferred alternative (boolean, required)
- `@lang` - Language for translatedAs (string, required)

---

## USAGE PATTERNS

### Example: Complete Hierarchical Chain

**Transliteration Layer**: