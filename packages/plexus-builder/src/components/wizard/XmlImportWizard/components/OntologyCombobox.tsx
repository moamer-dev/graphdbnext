'use client'

import { useState, useMemo } from 'react'
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '../../../ui/select'
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from '../../../ui/popover'
import type { TibOntology } from '../../../../types/semanticTypes'
import { useOntologies } from '../../../../hooks/terminology/useTibTerminology'

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

    // 1. Merge duplicates at the source to preserve all classifications
    const mergedOntologies = useMemo(() => {
        const map = new Map<string, TibOntology>();
        ontologies.forEach(o => {
            const existing = map.get(o.ontologyId);
            if (existing) {
                // Merge classifications to ensure the ontology is found in all applicable categories
                const mergedClassifications = [
                    ...(existing.classifications || []),
                    ...(o.classifications || [])
                ];
                map.set(o.ontologyId, { ...existing, classifications: mergedClassifications });
            } else {
                map.set(o.ontologyId, o);
            }
        });
        return Array.from(map.values());
    }, [ontologies]);

    // Extract unique collections and subjects from merged data
    const collections = useMemo(() => Array.from(new Set(
        mergedOntologies.flatMap((o: TibOntology) =>
            o.classifications?.flatMap(c => c.collection || []) || []
        )
    )).sort(), [mergedOntologies]);

    const subjects = useMemo(() => Array.from(new Set(
        mergedOntologies.flatMap((o: TibOntology) =>
            o.classifications?.flatMap(c => c.subject || []) || []
        )
    )).sort(), [mergedOntologies]);

    // Filter ontologies by collection and subject
    const filteredOntologies = useMemo(() => mergedOntologies.filter((o: TibOntology) => {
        if (selectedCollection && selectedCollection !== " " ) {
            const hasCollection = o.classifications?.some(c =>
                c.collection?.includes(selectedCollection)
            )
            if (!hasCollection) return false
        }
        if (selectedSubject && selectedSubject !== " " ) {
            const hasSubject = o.classifications?.some(c =>
                c.subject?.includes(selectedSubject)
            )
            if (!hasSubject) return false
        }
        return true
    }), [mergedOntologies, selectedCollection, selectedSubject]);

    const selectedOntology = useMemo(() => mergedOntologies.find((o: TibOntology) => o.ontologyId === value), [mergedOntologies, value]);

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
                            <Select
                                value={selectedCollection}
                                onValueChange={setSelectedCollection}
                            >
                                <SelectTrigger className="flex-1 h-8 text-xs bg-background transition-colors">
                                    <SelectValue placeholder="All Collections" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value=" " className="text-xs">All Collections</SelectItem>
                                    {collections.map((c) => (
                                        <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select
                                value={selectedSubject}
                                onValueChange={setSelectedSubject}
                            >
                                <SelectTrigger className="flex-1 h-8 text-xs bg-background transition-colors">
                                    <SelectValue placeholder="All Subjects" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value=" " className="text-xs">All Subjects</SelectItem>
                                    {subjects.map((s) => (
                                        <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
                                                    const selected = mergedOntologies.find(
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
