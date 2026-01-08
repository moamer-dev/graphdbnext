# Editor

**Editor** represents an editor involved in this EditionObject.

**Name**: Editor

**Type**: Node

**Subclass of**: [ContributingPerson](../../../Abstract%20Model/Nodes/ContributingPerson.md)

## Properties


* *@forename*
  * **name**: [forename](../Properties/properties.md#forename)
  * **datatype**: string
  * **status**: required

* *@gnd*
  * **name**: [gnd](../Properties/properties.md#gnd)
  * **datatype**: URI
  * **status**: optional

* *@orchid*
  * **name**: [orchid](../Properties/properties.md#orchid)
  * **datatype**: URI
  * **status**: optional

* *@surname*
  * **name**: [surname](../Properties/properties.md#surname)
  * **datatype**: string
  * **status**: required

## Domain of Relations

None

## Range of Relations

* [coEditedBy](../Relations/coEditedBy.md) (from [Change](Change.md))
* [editedBy](../Relations/editedBy.md) (from [Change](Change.md))
* [hasEditor](../Relations/hasEditor.md) (from [EditionObject](EditionObject.md)

## Examples

![Example for Editor-node](./img/example_Editor.svg)