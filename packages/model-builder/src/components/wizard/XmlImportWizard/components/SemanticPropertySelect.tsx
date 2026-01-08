'use client'

import { useState } from 'react'
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react'
import { cn } from '../../../../utils/cn'
import { Button } from '../../../ui/button'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList
} from '../../../ui/command'
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from '../../../ui/popover'
import type { TibProperty } from '../../../../types/semanticTypes'
import { useProperties } from '../../../../hooks/useTibTerminology'

interface SemanticPropertySelectProps {
    ontologyId: string | null
    value?: string
    onValueChange: (propertyIri: string, propertyData: TibProperty | null) => void
    disabled?: boolean
    className?: string
    showSelectedDescription?: boolean
}

export function SemanticPropertySelect({
    ontologyId,
    value,
    onValueChange,
    disabled = false,
    className,
    showSelectedDescription = false
}: SemanticPropertySelectProps) {
    const [open, setOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    const { properties, loading, search } = useProperties(ontologyId, Boolean(ontologyId))

    const selectedProperty = properties.find((p: TibProperty) => p.iri === value)

    const handleSearch = (query: string) => {
        setSearchQuery(query)
        search(query)
    }

    return (
        <>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className={cn('w-full justify-between', className)}
                        disabled={disabled || !ontologyId}
                    >
                        <span className="truncate">
                            {selectedProperty?.preferredLabel || (ontologyId ? 'Select property...' : 'Select ontology first')}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                    <Command shouldFilter={false}>
                        <CommandInput
                            placeholder="Search properties..."
                            value={searchQuery}
                            onValueChange={handleSearch}
                        />
                        <CommandList>
                            {loading ? (
                                <div className="flex items-center justify-center py-6">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                </div>
                            ) : (
                                <>
                                    <CommandEmpty>No property found.</CommandEmpty>
                                    <CommandGroup>
                                        {properties.map((property: TibProperty) => {
                                            const isSelected = value && property.iri === value
                                            return (
                                                <CommandItem
                                                    key={property.iri}
                                                    value={property.preferredLabel || property.iri}
                                                    onSelect={() => {
                                                        const selected = property
                                                        onValueChange(
                                                            selected.iri === value ? '' : selected.iri,
                                                            selected
                                                        )
                                                        setOpen(false)
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            'mr-2 h-4 w-4',
                                                            isSelected ? 'opacity-100' : 'opacity-0'
                                                        )}
                                                    />
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{property.preferredLabel}</span>
                                                        <span className="text-xs text-muted-foreground mr-2">
                                                            {property.curie || property.iri}
                                                        </span>
                                                        {property.description && (
                                                            <span className="text-xs text-muted-foreground line-clamp-2">
                                                                {property.description}
                                                            </span>
                                                        )}
                                                    </div>
                                                </CommandItem>
                                            )
                                        })}
                                    </CommandGroup>
                                </>
                            )}
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
            {showSelectedDescription && selectedProperty?.description && (
                <p className="text-xs text-muted-foreground mt-1 text-left px-1">
                    {selectedProperty.description}
                </p>
            )}
        </>
    )
}
