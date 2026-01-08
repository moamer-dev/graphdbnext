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
import type { TibOntology } from '../../../../types/semanticTypes'
import { useOntologies } from '../../../../hooks/useTibTerminology'

interface OntologyComboboxProps {
    value?: string
    onValueChange: (ontologyId: string, ontology: TibOntology | null) => void
    disabled?: boolean
    className?: string
    showSelectedDescription?: boolean
}

export function OntologyCombobox({
    value,
    onValueChange,
    disabled = false,
    className,
    showSelectedDescription = false
}: OntologyComboboxProps) {
    const [open, setOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCollection, setSelectedCollection] = useState<string>('')
    const [selectedSubject, setSelectedSubject] = useState<string>('')

    const { ontologies, loading, search } = useOntologies(true)

    // Extract unique collections and subjects
    const collections = Array.from(new Set(
        ontologies.flatMap((o: TibOntology) =>
            o.classifications?.flatMap(c => c.collection || []) || []
        )
    )).sort()

    const subjects = Array.from(new Set(
        ontologies.flatMap((o: TibOntology) =>
            o.classifications?.flatMap(c => c.subject || []) || []
        )
    )).sort()

    // Filter ontologies by collection and subject
    const filteredOntologies = ontologies.filter((o: TibOntology) => {
        if (selectedCollection) {
            const hasCollection = o.classifications?.some(c =>
                c.collection?.includes(selectedCollection)
            )
            if (!hasCollection) return false
        }
        if (selectedSubject) {
            const hasSubject = o.classifications?.some(c =>
                c.subject?.includes(selectedSubject)
            )
            if (!hasSubject) return false
        }
        return true
    })

    const selectedOntology = ontologies.find((o: TibOntology) => o.ontologyId === value)

    const handleSearch = (query: string) => {
        setSearchQuery(query)
        // Debounce search
        setTimeout(() => {
            search(query)
        }, 300)
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
                        disabled={disabled}
                    >
                        <span className="truncate">
                            {selectedOntology
                                ? selectedOntology.title
                                : 'Select ontology...'}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[600px] p-0" align="start">
                    <Command shouldFilter={false}>
                        <CommandInput
                            placeholder="Search ontologies..."
                            value={searchQuery}
                            onValueChange={handleSearch}
                        />
                        <div className="flex gap-2 p-2 border-b">
                            <select
                                value={selectedCollection}
                                onChange={(e) => setSelectedCollection(e.target.value)}
                                className="flex-1 h-8 rounded-md border border-input bg-background px-3 py-2 text-xs"
                            >
                                <option value="">All Collections</option>
                                {collections.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                            <select
                                value={selectedSubject}
                                onChange={(e) => setSelectedSubject(e.target.value)}
                                className="flex-1 h-8 rounded-md border border-input bg-background px-3 py-2 text-xs"
                            >
                                <option value="">All Subjects</option>
                                {subjects.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                        <CommandList>
                            {loading ? (
                                <div className="flex items-center justify-center py-6">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                </div>
                            ) : (
                                <>
                                    <CommandEmpty>No ontology found.</CommandEmpty>
                                    <CommandGroup>
                                        {filteredOntologies.map((ontology: TibOntology) => (
                                            <CommandItem
                                                key={ontology.ontologyId}
                                                value={ontology.ontologyId}
                                                onSelect={(currentValue: string) => {
                                                    const selected = ontologies.find(
                                                        (o: TibOntology) => o.ontologyId === currentValue
                                                    )
                                                    onValueChange(
                                                        currentValue === value ? '' : currentValue,
                                                        selected || null
                                                    )
                                                    setOpen(false)
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                        'mr-2 h-4 w-4',
                                                        value === ontology.ontologyId ? 'opacity-100' : 'opacity-0'
                                                    )}
                                                />
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{ontology.title}</span>
                                                    <span className="text-xs text-muted-foreground mr-2">
                                                        {ontology.ontologyId}
                                                    </span>
                                                    {ontology.description && (
                                                        <span className="text-xs text-muted-foreground line-clamp-2">
                                                            {ontology.description}
                                                        </span>
                                                    )}
                                                </div>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </>
                            )}
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
            {showSelectedDescription && selectedOntology?.description && (
                <p className="text-xs text-muted-foreground mt-1">
                    {selectedOntology.description}
                </p>
            )}
        </>
    )
}
