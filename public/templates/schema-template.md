# Graph Database Schema Template

This is a template for defining your Labeled Property Graph (LPG) schema in Markdown format.

## NODES

### NodeName1
**Description**: Brief description of what this node represents.

**Subclass of**: [ParentNode](./Nodes/ParentNode.md) (optional)

**Properties**:
- `propertyName` (datatype: string, required: true/false)
  - Description: What this property represents
  - Values: (optional) ['value1', 'value2']

**Relations Out**:
- `relationName` → [TargetNode](./Nodes/TargetNode.md)

**Relations In**:
- `relationName` ← [SourceNode](./Nodes/SourceNode.md)

### NodeName2
**Description**: Another node type.

**Properties**:
- `id` (datatype: string, required: true)
- `name` (datatype: string, required: true)

**Relations Out**:
- `connectsTo` → [NodeName1](./Nodes/NodeName1.md)

## RELATIONS

### relationName
**Description**: What this relation represents.

**Properties**:
- `propertyName` (datatype: string, required: true/false)

**Domains**:
- [SourceNode](./Nodes/SourceNode.md) → [TargetNode](./Nodes/TargetNode.md)

## PROPERTIES REFERENCE

### @propertyName
- **datatype**: string
- **required**: true/false
- **values**: (optional) ['value1', 'value2']
- **used by**: [NodeName1](./Nodes/NodeName1.md), [NodeName2](./Nodes/NodeName2.md)

