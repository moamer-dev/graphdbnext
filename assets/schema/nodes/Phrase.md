# Phrase

**Phrase** represents a grammatical phrase.
<!-- Stimmt das überhaupt für EUPT?! -->

**Name**: Phrase

**Type**: Node

**Subclass of**: [Phrase](../../../Abstract%20Model/Nodes/Phrase.md)

## Properties

* *@analysis*
  * **name**: [analysis](../Properties/properties.md#analysis)
  * **datatype**: string
  * **status**: optional

* *@id*
  * **name**: [id](../Properties/properties.md#id)
  * **datatype**: string
  * **status**: optional

## Domain of Relations

* [contains](../Relations/contains.md) (to [UnidentifiableUnit](UnidentifiableUnit.md), [Word](Word.md), and [Alternatives](Alternatives.md))

## Range of Relations

* [annotates](../Relations/annotates.md) (from [Annotation](Annotation.md))
* [expressedAs](../Relations/expressedAs.md) (from [Alternative](Alternative.md))
* [mentions](../Relations/mentions.md) (from [Annotation](Annotation.md))

## Examples

No example available.