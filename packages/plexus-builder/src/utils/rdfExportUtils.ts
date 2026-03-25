import type { ModelBuilderState, Property } from '../types'

function mapPropertyTypeToXSD(type: Property['type']): string {
  const mapping: Record<Property['type'], string> = {
    string: 'xsd:string',
    number: 'xsd:integer',
    boolean: 'xsd:boolean',
    date: 'xsd:dateTime',
    array: 'rdf:List',
    object: 'xsd:anyURI'
  }
  return mapping[type] || 'xsd:string'
}

function mapPropertyTypeToXSDFull(type: Property['type']): string {
  const mapping: Record<Property['type'], string> = {
    string: 'http://www.w3.org/2001/XMLSchema#string',
    number: 'http://www.w3.org/2001/XMLSchema#integer',
    boolean: 'http://www.w3.org/2001/XMLSchema#boolean',
    date: 'http://www.w3.org/2001/XMLSchema#dateTime',
    array: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#List',
    object: 'http://www.w3.org/2001/XMLSchema#anyURI'
  }
  return mapping[type] || 'http://www.w3.org/2001/XMLSchema#string'
}

function normalizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, '')
}

export function exportToTtl(state: ModelBuilderState): string {
  const lines: string[] = []

  lines.push(`@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .`)
  lines.push(`@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .`)
  lines.push(`@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .`)
  lines.push(`@prefix skos: <http://www.w3.org/2004/02/skos/core#> .`)
  lines.push(`@prefix gdb: <https://plexus.example.com/schema/> .`)
  lines.push('')

  // Export Nodes
  lines.push(`### Nodes ###\n`)
  state.nodes.forEach(node => {
    const classId = normalizeId(node.label)
    const semantic = (node.data as any)?.semantic

    lines.push(`gdb:${classId} a rdfs:Class ;`)
    lines.push(`    rdfs:label "${node.label}" ;`)

    if (semantic?.classIri) {
      lines.push(`    skos:exactMatch <${semantic.classIri}> ;`)
    }

    if (node.type !== node.label) {
      lines.push(`    rdfs:subClassOf gdb:${normalizeId(node.type)} ;`)
    }

    // Replace ending semicolon with period
    lines[lines.length - 1] = lines[lines.length - 1].replace(';', '.')
    lines.push('')
  })

  // Group Relationships by Type
  const relationsByType = new Map<string, {
    semantic?: any
    properties?: Property[]
    domains: Record<string, string[]>
  }>()

  state.relationships.forEach(rel => {
    const fromNode = state.nodes.find(n => n.id === rel.from)
    const toNode = state.nodes.find(n => n.id === rel.to)

    if (!fromNode || !toNode) return

    if (!relationsByType.has(rel.type)) {
      relationsByType.set(rel.type, {
        semantic: (rel.data as any)?.semantic,
        properties: rel.properties && rel.properties.length > 0 ? rel.properties : undefined,
        domains: {}
      })
    }

    const relData = relationsByType.get(rel.type)!
    if (!relData.domains[fromNode.label]) {
      relData.domains[fromNode.label] = []
    }
    if (!relData.domains[fromNode.label].includes(toNode.label)) {
      relData.domains[fromNode.label].push(toNode.label)
    }
  })

  lines.push(`### Relationships ###\n`)
  relationsByType.forEach((relData, relType) => {
    const relId = normalizeId(relType)
    lines.push(`gdb:${relId} a rdf:Property ;`)
    lines.push(`    rdfs:label "${relType}" ;`)

    if (relData.semantic?.propertyIri) {
      lines.push(`    skos:exactMatch <${relData.semantic.propertyIri}> ;`)
    }

    // Since a relation can have multiple domains/ranges, we will output them all
    const allDomains = new Set<string>()
    const allRanges = new Set<string>()

    Object.entries(relData.domains).forEach(([from, toNodes]) => {
      allDomains.add(from)
      toNodes.forEach(to => allRanges.add(to))
    })

    allDomains.forEach(domain => {
      lines.push(`    rdfs:domain gdb:${normalizeId(domain)} ;`)
    })
    
    allRanges.forEach(range => {
      lines.push(`    rdfs:range gdb:${normalizeId(range)} ;`)
    })

    lines[lines.length - 1] = lines[lines.length - 1].replace(';', '.')
    lines.push('')
  })

  lines.push(`### Node Properties ###\n`)
  state.nodes.forEach(node => {
    node.properties.forEach(prop => {
      const propId = normalizeId(prop.key)
      const propSemantic = (node.data as any)?.propertySemantics?.[prop.key]

      lines.push(`gdb:${normalizeId(node.label)}_${propId} a rdf:Property ;`)
      lines.push(`    rdfs:label "${prop.key}" ;`)
      
      if (propSemantic?.propertyIri) {
        lines.push(`    skos:exactMatch <${propSemantic.propertyIri}> ;`)
      }

      lines.push(`    rdfs:domain gdb:${normalizeId(node.label)} ;`)
      lines.push(`    rdfs:range ${mapPropertyTypeToXSD(prop.type)} .`)
      lines.push('')
    })
  })

  lines.push(`### Relationship Properties ###\n`)
  relationsByType.forEach((relData, relType) => {
    if (relData.properties) {
      relData.properties.forEach(prop => {
        const propId = normalizeId(prop.key)
        lines.push(`gdb:${normalizeId(relType)}_${propId} a rdf:Property ;`)
        lines.push(`    rdfs:label "${prop.key}" ;`)
        // No semantic for rel props exist in UI currently, but we could support it
        // lines.push(`    rdfs:domain gdb:${normalizeId(relType)} ;`) // Can't easily attach prop to prop in simple RDF without reification, 
        // we will omit domain for relation properties for simplicity.
        lines.push(`    rdfs:range ${mapPropertyTypeToXSD(prop.type)} .`)
        lines.push('')
      })
    }
  })

  return lines.join('\n')
}

export function exportToRdf(state: ModelBuilderState): string {
  const lines: string[] = []

  lines.push(`<?xml version="1.0" encoding="UTF-8"?>`)
  lines.push(`<rdf:RDF`)
  lines.push(`  xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"`)
  lines.push(`  xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#"`)
  lines.push(`  xmlns:xsd="http://www.w3.org/2001/XMLSchema#"`)
  lines.push(`  xmlns:skos="http://www.w3.org/2004/02/skos/core#"`)
  lines.push(`  xmlns:gdb="https://plexus.example.com/schema/">`)
  lines.push('')

  // Export Nodes
  state.nodes.forEach(node => {
    const classId = normalizeId(node.label)
    const semantic = (node.data as any)?.semantic

    lines.push(`  <rdfs:Class rdf:about="https://plexus.example.com/schema/${classId}">`)
    lines.push(`    <rdfs:label>${node.label}</rdfs:label>`)

    if (semantic?.classIri) {
      lines.push(`    <skos:exactMatch rdf:resource="${semantic.classIri}" />`)
    }

    if (node.type !== node.label) {
      lines.push(`    <rdfs:subClassOf rdf:resource="https://plexus.example.com/schema/${normalizeId(node.type)}" />`)
    }

    lines.push(`  </rdfs:Class>`)
    lines.push('')
  })

  // Group Relationships by Type
  const relationsByType = new Map<string, {
    semantic?: any
    properties?: Property[]
    domains: Record<string, string[]>
  }>()

  state.relationships.forEach(rel => {
    const fromNode = state.nodes.find(n => n.id === rel.from)
    const toNode = state.nodes.find(n => n.id === rel.to)

    if (!fromNode || !toNode) return

    if (!relationsByType.has(rel.type)) {
      relationsByType.set(rel.type, {
        semantic: (rel.data as any)?.semantic,
        properties: rel.properties && rel.properties.length > 0 ? rel.properties : undefined,
        domains: {}
      })
    }

    const relData = relationsByType.get(rel.type)!
    if (!relData.domains[fromNode.label]) {
      relData.domains[fromNode.label] = []
    }
    if (!relData.domains[fromNode.label].includes(toNode.label)) {
      relData.domains[fromNode.label].push(toNode.label)
    }
  })

  relationsByType.forEach((relData, relType) => {
    const relId = normalizeId(relType)
    lines.push(`  <rdf:Property rdf:about="https://plexus.example.com/schema/${relId}">`)
    lines.push(`    <rdfs:label>${relType}</rdfs:label>`)

    if (relData.semantic?.propertyIri) {
      lines.push(`    <skos:exactMatch rdf:resource="${relData.semantic.propertyIri}" />`)
    }

    const allDomains = new Set<string>()
    const allRanges = new Set<string>()

    Object.entries(relData.domains).forEach(([from, toNodes]) => {
      allDomains.add(from)
      toNodes.forEach(to => allRanges.add(to))
    })

    allDomains.forEach(domain => {
      lines.push(`    <rdfs:domain rdf:resource="https://plexus.example.com/schema/${normalizeId(domain)}" />`)
    })
    
    allRanges.forEach(range => {
      lines.push(`    <rdfs:range rdf:resource="https://plexus.example.com/schema/${normalizeId(range)}" />`)
    })

    lines.push(`  </rdf:Property>`)
    lines.push('')
  })

  state.nodes.forEach(node => {
    node.properties.forEach(prop => {
      const propId = normalizeId(prop.key)
      const propSemantic = (node.data as any)?.propertySemantics?.[prop.key]

      lines.push(`  <rdf:Property rdf:about="https://plexus.example.com/schema/${normalizeId(node.label)}_${propId}">`)
      lines.push(`    <rdfs:label>${prop.key}</rdfs:label>`)
      
      if (propSemantic?.propertyIri) {
        lines.push(`    <skos:exactMatch rdf:resource="${propSemantic.propertyIri}" />`)
      }

      lines.push(`    <rdfs:domain rdf:resource="https://plexus.example.com/schema/${normalizeId(node.label)}" />`)
      lines.push(`    <rdfs:range rdf:resource="${mapPropertyTypeToXSDFull(prop.type)}" />`)
      lines.push(`  </rdf:Property>`)
      lines.push('')
    })
  })

  relationsByType.forEach((relData, relType) => {
    if (relData.properties) {
      relData.properties.forEach(prop => {
        const propId = normalizeId(prop.key)
        lines.push(`  <rdf:Property rdf:about="https://plexus.example.com/schema/${normalizeId(relType)}_${propId}">`)
        lines.push(`    <rdfs:label>${prop.key}</rdfs:label>`)
        lines.push(`    <rdfs:range rdf:resource="${mapPropertyTypeToXSDFull(prop.type)}" />`)
        lines.push(`  </rdf:Property>`)
        lines.push('')
      })
    }
  })

  lines.push(`</rdf:RDF>`)

  return lines.join('\n')
}

export function exportDataToTtl(state: ModelBuilderState, graphItems: Record<string, unknown>[]): string {
  const lines: string[] = []
  
  const prefixMap = new Map<string, string>()
  prefixMap.set('rdf', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#')
  
  // Base ontology and prefix for this specific document model
  const docName = state.metadata.name ? normalizeId(state.metadata.name).toLowerCase() : 'dataset'
  const docPrefix = docName.substring(0, 4) || 'data'
  const docUrl = `https://plexus.example.com/data/${docName}/`
  prefixMap.set(docPrefix, docUrl)
  prefixMap.set('gdb', 'https://plexus.example.com/schema/')
  
  let prefixCounter = 1

  const getQName = (iri: string, curie?: string): string => {
    let local = ''
    let prefix = ''
    let url = ''

    if (curie && curie.includes(':')) {
      const parts = curie.split(':')
      prefix = parts[0]
      local = parts[1]
      url = iri.substring(0, iri.length - local.length)
      
      if (!prefixMap.has(prefix)) {
        prefixMap.set(prefix, url)
      }
      return `${prefix}:${local}`
    }

    const lastSlash = iri.lastIndexOf('/')
    const lastHash = iri.lastIndexOf('#')
    const splitIndex = Math.max(lastSlash, lastHash)
    
    if (splitIndex !== -1) {
      url = iri.substring(0, splitIndex + 1)
      local = iri.substring(splitIndex + 1)
      
      let foundPrefix = ''
      for (const [p, u] of prefixMap.entries()) {
        if (u === url) {
          foundPrefix = p
          break
        }
      }
      
      if (!foundPrefix) {
        foundPrefix = `ns${prefixCounter++}`
        prefixMap.set(foundPrefix, url)
      }
      return `${foundPrefix}:${local}`
    }
    return `<${iri}>`
  }

  const escapeString = (str: string) => {
    return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')
  }

  const nodesData = graphItems.filter(i => i.type === 'node') as any[]
  const relsData = graphItems.filter(i => i.type === 'relationship') as any[]

  const triples: string[] = []

  nodesData.forEach(item => {
    const label = item.labels?.[0]
    if (!label) return

    const schemaNode = state.nodes.find(n => n.label === label)
    const semantic = (schemaNode?.data as any)?.semantic

    const subjectId = `${docPrefix}:${normalizeId(label).toLowerCase()}_${item.id}`
    let classQName = `gdb:${normalizeId(label)}`

    if (semantic?.classIri) {
      classQName = getQName(semantic.classIri, semantic.classCurie)
    }

    const nodeTriples: string[] = []
    nodeTriples.push(`${subjectId} a ${classQName}`)

    // Properties
    if (item.properties && schemaNode) {
      for (const [key, val] of Object.entries(item.properties)) {
        if (val === undefined || val === null || val === '') continue
        
        const propSemantic = (schemaNode.data as any)?.propertySemantics?.[key]
        let propQName = `gdb:${normalizeId(label)}_${normalizeId(key)}`
        
        if (propSemantic?.propertyIri) {
          propQName = getQName(propSemantic.propertyIri, propSemantic.propertyCurie)
        }
        
        // Handle value formatting
        let valueStr = ''
        if (typeof val === 'string') {
          if (val.startsWith('http://') || val.startsWith('https://')) {
            valueStr = `<${val}>`
          } else {
            valueStr = `"${escapeString(val)}"`
          }
        } else if (typeof val === 'number' || typeof val === 'boolean') {
          valueStr = `${val}`
        } else if (Array.isArray(val)) {
          // Simplistic array representation
          valueStr = `"${escapeString(val.join(', '))}"`
        } else {
          valueStr = `"${escapeString(JSON.stringify(val))}"`
        }

        nodeTriples.push(`    ${propQName} ${valueStr}`)
      }
    }

    // Relationships
    const outgoingRels = relsData.filter(r => r.start === item.id)
    outgoingRels.forEach(rel => {
      const relLabel = rel.label
      const targetItem = nodesData.find(n => n.id === rel.end)
      if (!targetItem || !targetItem.labels?.[0]) return

      const schemaRel = state.relationships.find(r => r.type === relLabel)
      const relSemantic = (schemaRel?.data as any)?.semantic

      let relQName = `gdb:${normalizeId(relLabel)}`
      if (relSemantic?.propertyIri) {
        relQName = getQName(relSemantic.propertyIri, relSemantic.propertyCurie)
      }

      const objectId = `${docPrefix}:${normalizeId(targetItem.labels[0]).toLowerCase()}_${targetItem.id}`
      nodeTriples.push(`    ${relQName} ${objectId}`)
    })

    if (nodeTriples.length > 0) {
      triples.push(nodeTriples.join(' ;\n') + ' .')
    }
  })

  // Prepend prefixes
  for (const [prefix, url] of prefixMap.entries()) {
    lines.push(`@prefix ${prefix}: <${url}> .`)
  }
  lines.push('')

  lines.push(triples.join('\n\n'))

  return lines.join('\n')
}

export function exportDataToRdf(state: ModelBuilderState, graphItems: Record<string, unknown>[]): string {
  const lines: string[] = []
  
  const prefixMap = new Map<string, string>()
  prefixMap.set('rdf', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#')
  prefixMap.set('rdfs', 'http://www.w3.org/2000/01/rdf-schema#')

  const docName = state.metadata.name ? normalizeId(state.metadata.name).toLowerCase() : 'dataset'
  const docPrefix = docName.substring(0, 4) || 'data'
  const docUrl = `https://plexus.example.com/data/${docName}/`
  prefixMap.set(docPrefix, docUrl)
  prefixMap.set('gdb', 'https://plexus.example.com/schema/')
  
  let prefixCounter = 1

  const getQName = (iri: string, curie?: string): { prefix: string, local: string } => {
    let prefix = ''
    let local = ''
    let url = ''

    if (curie && curie.includes(':')) {
      const parts = curie.split(':')
      prefix = parts[0]
      local = parts[1]
      url = iri.substring(0, iri.length - local.length)
      
      if (!prefixMap.has(prefix)) {
        prefixMap.set(prefix, url)
      }
      return { prefix, local }
    }

    const lastSlash = iri.lastIndexOf('/')
    const lastHash = iri.lastIndexOf('#')
    const splitIndex = Math.max(lastSlash, lastHash)
    
    if (splitIndex !== -1) {
      url = iri.substring(0, splitIndex + 1)
      local = iri.substring(splitIndex + 1)
      
      let foundPrefix = ''
      for (const [p, u] of prefixMap.entries()) {
        if (u === url) {
          foundPrefix = p
          break
        }
      }
      
      if (!foundPrefix) {
        foundPrefix = `ns${prefixCounter++}`
        prefixMap.set(foundPrefix, url)
      }
      return { prefix: foundPrefix, local }
    }
    
    // Fallback if no valid separator
    return { prefix: `ns${prefixCounter}`, local: normalizeId(iri) }
  }

  const escapeXml = (unsafe: string) => {
    return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;'
            case '>': return '&gt;'
            case '&': return '&amp;'
            case "'": return '&apos;'
            case '"': return '&quot;'
            default: return c
        }
    })
  }

  const nodesData = graphItems.filter(i => i.type === 'node') as any[]
  const relsData = graphItems.filter(i => i.type === 'relationship') as any[]

  const xmlNodes: string[] = []

  nodesData.forEach(item => {
    const label = item.labels?.[0]
    if (!label) return

    const schemaNode = state.nodes.find(n => n.label === label)
    const semantic = (schemaNode?.data as any)?.semantic

    const subjectUri = `${docUrl}${normalizeId(label).toLowerCase()}_${item.id}`
    let classPrefix = 'gdb'
    let className = normalizeId(label)

    if (semantic?.classIri) {
      const qname = getQName(semantic.classIri, semantic.classCurie)
      classPrefix = qname.prefix
      className = qname.local
    }

    const nodeLines: string[] = []
    nodeLines.push(`  <${classPrefix}:${className} rdf:about="${subjectUri}">`)

    // Properties
    if (item.properties && schemaNode) {
      for (const [key, val] of Object.entries(item.properties)) {
        if (val === undefined || val === null || val === '') continue
        
        const propSemantic = (schemaNode.data as any)?.propertySemantics?.[key]
        let propPrefix = 'gdb'
        let propName = `${normalizeId(label)}_${normalizeId(key)}`
        
        if (propSemantic?.propertyIri) {
          const qname = getQName(propSemantic.propertyIri, propSemantic.propertyCurie)
          propPrefix = qname.prefix
          propName = qname.local
        }
        
        // Handle value formatting
        if (typeof val === 'string') {
          if (val.startsWith('http://') || val.startsWith('https://')) {
            nodeLines.push(`    <${propPrefix}:${propName} rdf:resource="${escapeXml(val)}" />`)
          } else {
            nodeLines.push(`    <${propPrefix}:${propName}>${escapeXml(val)}</${propPrefix}:${propName}>`)
          }
        } else if (typeof val === 'number' || typeof val === 'boolean') {
          nodeLines.push(`    <${propPrefix}:${propName}>${val}</${propPrefix}:${propName}>`)
        } else if (Array.isArray(val)) {
          nodeLines.push(`    <${propPrefix}:${propName}>${escapeXml(val.join(', '))}</${propPrefix}:${propName}>`)
        } else {
          nodeLines.push(`    <${propPrefix}:${propName}>${escapeXml(JSON.stringify(val))}</${propPrefix}:${propName}>`)
        }
      }
    }

    // Relationships
    const outgoingRels = relsData.filter(r => r.start === item.id)
    outgoingRels.forEach(rel => {
      const relLabel = rel.label
      const targetItem = nodesData.find(n => n.id === rel.end)
      if (!targetItem || !targetItem.labels?.[0]) return

      const schemaRel = state.relationships.find(r => r.type === relLabel)
      const relSemantic = (schemaRel?.data as any)?.semantic

      let relPrefix = 'gdb'
      let relName = normalizeId(relLabel)
      
      if (relSemantic?.propertyIri) {
        const qname = getQName(relSemantic.propertyIri, relSemantic.propertyCurie)
        relPrefix = qname.prefix
        relName = qname.local
      }

      const objectUri = `${docUrl}${normalizeId(targetItem.labels[0]).toLowerCase()}_${targetItem.id}`
      nodeLines.push(`    <${relPrefix}:${relName} rdf:resource="${objectUri}" />`)
    })

    nodeLines.push(`  </${classPrefix}:${className}>`)
    xmlNodes.push(nodeLines.join('\n'))
  })

  lines.push(`<?xml version="1.0" encoding="UTF-8"?>`)
  lines.push(`<rdf:RDF`)
  for (const [prefix, url] of prefixMap.entries()) {
    lines.push(`  xmlns:${prefix}="${escapeXml(url)}"`)
  }
  lines[lines.length - 1] = lines[lines.length - 1] + `>`
  lines.push('')

  lines.push(xmlNodes.join('\n\n'))
  lines.push('')
  lines.push(`</rdf:RDF>`)

  return lines.join('\n')
}
