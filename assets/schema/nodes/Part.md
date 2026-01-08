# Part

**Part** represents any chunk of text within a line.

**Name**: Part

**Type**: Node

**Subclass of**: [GraphicalUnit](../../../Abstract%20Model/Nodes/GraphicalUnit.md)

## Properties

* *@id*
  * **name**: [id](../Properties/properties.md#id)
  * **datatype**: string
  * **status**: required

## Domain of Relations

* [contains](../Relations/contains.md) (to [Seg](Seg.md), [Sign](Sign.md) and [Alternatives](Alternatives.md))

## Range of Relations

* [annotates](../Relations/annotates.md) (from [Annotation](Annotation.md))
* [expressedAs](../Relations/expressedAs.md) (from [Alternative](Alternative.md))
* [mentions](../Relations/mentions.md) (from [Annotation](Annotation.md))
* [contains](../Relations/contains.md) (from [Line](Line.md))
* [refersTo](../Relations/refersTo.md) (from [Colon](Colon.md))

## Examples

![Example for Part-node](./img/example_part.svg)