export interface TibOntology {
    ontologyId: string
    title: string
    description?: string
    language?: string[]
    iri?: string
    homepage?: string
    preferredPrefix?: string
    classifications?: Array<{
        collection?: string[]
        subject?: string[]
    }>
}

export interface TibClass {
    iri: string
    preferredLabel: string
    curie: string
    ontologyId: string
    description?: string
    parents?: string[]
}

export interface TibProperty {
    iri: string
    preferredLabel: string
    curie: string
    ontologyId: string
    description?: string
    domain?: string[]
    range?: string[]
}

export interface TibApiResponse<T> {
    page: number
    numElements: number
    totalPages: number
    totalElements: number
    elements: T[]
    facetFieldsToCounts?: Record<string, unknown>
}

export interface SemanticMetadata {
    classIri?: string
    classLabel?: string
    classCurie?: string
    ontologyId?: string
    propertyIri?: string
    propertyLabel?: string
    propertyCurie?: string
}
