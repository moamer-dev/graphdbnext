# Line

**Line** represents any line of text.

**Name**: Line

**Type**: Node

**Subclass of**: [Zone](../../../Abstract%20Model/Nodes/Zone.md)

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

* [contains](../Relations/contains.md) (to [Part](Part.md), [Seg](Seg.md), [Sign](Sign.md) and [Alternatives](Alternatives.md))

## Range of Relations

* [annotates](../Relations/annotates.md) (from [Annotation](Annotation.md))
* [expressedAs](../Relations/expressedAs.md) (from [Alternative](Alternative.md))
* [mentions](../Relations/mentions.md) (from [Annotation](Annotation.md))
* [contains](../Relations/contains.md) (from [Column](Column.md))

## Examples

![Example for Line-node](./img/example_line.svg)