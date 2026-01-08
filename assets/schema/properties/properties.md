# Properties

## Node Properties

### @analysis

* **datatype**: string
* **used by**: [Phrase](../Nodes/Phrase.md), [Colon](../Nodes/Colon.md)

### @cert

* **datatype**: string
* **values**: ('high', 'low')
* **used by**: [Word](../Nodes/Word.md)

### @damage

* **datatype**: string
* **values**: ('high', 'low')
* **used by**: [Character](../Nodes/Character.md), [Sign](../Nodes/Sign.md), [UnidentifiableSign](../Nodes/UnidentifiableSign.md)

### @desc

* **datatype**: string
* **used by**: [Change](../Nodes/Change.md)

### @dimension_depth

  * **datatype**: string
  * **status**: required
  * **used by**: [PhysDesc](../Nodes/PhysDesc.md)

### @dimension_height

  * **datatype**: string
  * **status**: required
  * **used by**: [PhysDesc](../Nodes/PhysDesc.md)

### @dimension_width

  * **datatype**: string
  * **status**: required
  * **used by**: [PhysDesc](../Nodes/PhysDesc.md)

### @docStatus

* **datatype**: string
* **values**: ('draft', 'published')
* **used by**: [EditionObject](../Nodes/EditionObject.md)

### @forename

  * **datatype**: string
  * **status**: required
  * **used by**: [Editor](../Nodes/Editor.md)

### @form

  * **datatype**: string
  * **status**: required
  * **used by**: [PhysDesc](../Nodes/PhysDesc.md)

### @gnd

  * **datatype**: URI
  * **status**: optional
  * **used by**: [Editor](../Nodes/Editor.md)

### @grabungsnummer

* **datatype**: string
* **status**: optional
* **used by**: [MsIdentifier](../Nodes/MsIdentifier.md)

### @handDesc

  * **datatype**: string
  * **status**: required
  * **used by**: [PhysDesc](../Nodes/PhysDesc.md)

### @id

* **datatype**: string
* **used by**: All subclasses of [Thing](../../../Abstract%20Model/Nodes/Thing.md)

### @index

* **datatype**: integer
* **used by**: [Sign](../Nodes/Sign.md)

## @lang

* **datatype**: xsd:language
* **used by**: [ProfileDesc](../Nodes/ProfileDesc.md)

### @layoutDesc

  * **datatype**: string
  * **status**: required
  * **used by**: [PhysDesc](../Nodes/PhysDesc.md)

### @museumsnummer

* **datatype**: string
* **status**: optional
* **used by**: [MsIdentifier](../Nodes/MsIdentifier.md)

### @n

* **datatype**: string
* **used by**: [Colon](../Nodes/Colon.md), [Line](../Nodes/Line.md), [Verse](../Nodes/Verse.md)

### @name

* **datatype**: string
* **used by**: [Alternatives](../Nodes/Alternatives.md), [Alternative](../Nodes/Alternative.md), [Licence](../Nodes/LicenceNode.md)

### @orchid

  * **datatype**: URI
  * **status**: optional
  * **used by**: [Editor](../Nodes/Editor.md)

### @prefix

* **datatype**: string
* **used by**: [ExternalResource](../Nodes/ExternalResource.md)

### @publikationsnummer

* **datatype**: string
* **status**: optional
* **used by**: [MsIdentifier](../Nodes/MsIdentifier.md)

### @ref

* **datatype**: URI
* **used by**: [Annotation](../Nodes/Annotation.md), [ExternalResource](../Nodes/ExternalResource.md), [Licence](../Nodes/LicenceNode.md)

### @repository

* **datatype**: string
* **status**: optional
* **used by**: [MsIdentifier](../Nodes/MsIdentifier.md)

### @content

* **datatype**: string
* **used by**: [Abstract](../Nodes/Abstract.md), [Additional](../Nodes/Additional.md), [Annotation](../Nodes/Annotation.md), [TranslationUnit](../Nodes/TranslationUnit.md)

### @mimeType

* **datatype**: string
* **used by**: [Abstract](../Nodes/Abstract.md), [Additional](../Nodes/Additional.md), [Annotation](../Nodes/Annotation.md), [TranslationUnit](../Nodes/TranslationUnit.md)

### @settlement_name

* **datatype**: string
* **status**: optional
* **used by**: [MsIdentifier](../Nodes/MsIdentifier.md)

### @settlement_geoNames

* **datatype**: URI
* **status**: optional
* **used by**: [MsIdentifier](../Nodes/MsIdentifier.md)

### @status

* **datatype**: string
* **values**: ('draft', 'final')
* **used by**: [Change](../Nodes/Change.md)

### @subtype

* **datatype**: string
* **used by**: [Sign](../Nodes/Sign.md)

### @support

  * **datatype**: string
  * **status**: required
  * **used by**: [PhysDesc](../Nodes/PhysDesc.md)

### @surface
* **datatype**: string
* **values**: ('recto', 'verso')
* **used by**: [Surface](../Nodes/Surface.md)

### @surname

  * **datatype**: string
  * **status**: required
  * **used by**: [Editor](../Nodes/Editor.md)

### @tagsDeclRendition

* **datatype**: string
* **used by**: [EncodingDesc](../Nodes/EncodingDesc.md)

### @text

* **datatype**: string
* **used by**: [Sign](../Nodes/Sign.md)

### @textClass

* **datatype**: string
* **values**: ('epic' (Epic), 'historiola' (Historiola), 'hymn' (Hymnus), 'incantation' (Beschwörung), 'prayer' (Gebet), 'ritual' (Ritual))
* **used by**: [EditionObject](../Nodes/EditionObject.md)

### @title
* **datatype**: string
* **used_by**: [EditionObject](../Nodes/EditionObject.md), [SeriesStmt](../Nodes/SeriesStmt.md)

### @type

* **datatype**: string
* **used by**: [Annotation](../Nodes/Annotation.md), [ExternalResource](../Nodes/ExternalResource.md), [Sign](../Nodes/Sign.md)

### @unclear

* **datatype**: boolean
* **used by**: [Character](../Nodes/Character.md), [UnidentifiableSign](../Nodes/UnidentifiableSign.md)

### @wehn

* **datatype**: xsd:data (YYYY-MM-DD)
* **used by**: [Change](../Nodes/Change.md)

### @whitespace

* **datatype**: string
* **used by**: [Character](../Nodes/Character.md), [Sign](../Nodes/Sign.md), [UnidentifiableSign](../Nodes/UnidentifiableSign.md)

## @writingSystem

* **datatype**: string
* **used by**: [ProfileDesc](../Nodes/ProfileDesc.md)

## Relation Properties

### @lang

* **datatype**: string
* **used by**: [translatedAs](../Relations/translatedAs.md)

### @order
* **datatype**: integer
* **used by**: [alternative](../Relations/alternative.md)

### @pos

* **datatype**: integer
* **used by**: [contains](../Relations/contains.md)

### @pref

* **datatype**: boolean
* **used by**: [alternative](../Relations/alternative.md)