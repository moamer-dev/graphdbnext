# Verse

**Verse** represents a verse in Ugaritic poetology.

**Name**: Verse

**Type**: Node

**Subclass of**: [PoetologicalUnit](PoetologicalUnit.md)

## Properties

* *@id*
  * **name**: [id](../Properties/properties.md#id)
  * **datatype**: string
  * **status**: optional

* *@n*
  * **name**: [n](../Properties/properties.md#n)
  * **datatype**: string
  * **status**: required

## Domain of Relations

* [contains](../Relations/contains.md) (to [Colon](Colon.md) and [Alternatives](Alternatives.md))

## Range of Relations

* [annotates](../Relations/annotates.md) (from [Annotation](Annotation.md))
* [expressedAs](../Relations/expressedAs.md) (from [Alternative](Alternative.md))
* [mentions](../Relations/mentions.md) (from [Annotation](Annotation.md))
* [contains](../Relations/contains.md) (from [VocalisationLayer](VocalisationLayer.md) and [Stanza](Stanza.md))

## Examples

![Example for Verse-node](./img/example_verse.svg)