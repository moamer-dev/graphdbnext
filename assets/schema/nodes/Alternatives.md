# Alternatives

Alternatives represents a conflict of interpretations.

**Name**: Alternatives

**Type**: Node

**Subclass of**: [Alternatives](../../../Abstract%20Model/Nodes/Alternatives.md)

## Properties

* *@name*
  * **name**: [name](../Properties/properties.md#name)
  * **datatype**: string
  * **status**: required

## Domain of Relations

* [alternative](../Relations/alternative.md) (to [Alternative](Alternative.md))

## Range of Relations

* [annotates](../Relations/annotates.md) (from [Annotation](Annotation.md))
* [contains](../Relations/contains.md) (from [TextUnit](../../../Abstract%20Model/Nodes/TextUnit.md), [TransliterationLayer](TransliterationLayer.md), and [VocalisationLayer](VocalisationLayer.md))
* [mentions](../Relations/mentions.md) (from [Annotation](Annotation.md))
* [translatedAs](../Relations/translatedAs.md) (from [Colon](../../../Abstract%20Model/Nodes/Colon.md))

## Examples

![Example for Alternatives-node](./img/example_alternatives.svg)