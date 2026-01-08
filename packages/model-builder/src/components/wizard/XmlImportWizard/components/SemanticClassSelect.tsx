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
import type { TibClass } from '../../../../types/semanticTypes'
import { useClasses } from '../../../../hooks/useTibTerminology'

interface SemanticClassSelectProps {
    ontologyId: string | null
    value?: string
    onValueChange: (classIri: string, classData: TibClass | null) => void
    disabled?: boolean
    className?: string
    showSelectedDescription?: boolean
}

export function SemanticClassSelect({
    ontologyId,
    value,
    onValueChange,
    disabled = false,
    className,
    showSelectedDescription = false
}: SemanticClassSelectProps) {
    const [open, setOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    const { classes, loading, search } = useClasses(ontologyId, Boolean(ontologyId))

    const selectedClass = classes.find((c: TibClass) => c.iri === value)

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
                            {selectedClass?.preferredLabel || (ontologyId ? 'Select class...' : 'Select ontology first')}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                    <Command shouldFilter={false}>
                        <CommandInput
                            placeholder="Search classes..."
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
                                    <CommandEmpty>No class found.</CommandEmpty>
                                    <CommandGroup>
                                        {classes.map((cls: TibClass) => {
                                            const isSelected = value && cls.iri === value
                                            return (
                                                <CommandItem
                                                    key={cls.iri}
                                                    value={cls.preferredLabel || cls.iri}
                                                    onSelect={() => {
                                                        const selected = cls
                                                        onValueChange(
                                                            selected.iri === value ? '' : (selected.iri || ''),
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
                                                        <span className="font-medium">{cls.preferredLabel}</span>
                                                        <span className="text-xs text-muted-foreground mr-2">
                                                            {cls.curie || cls.iri}
                                                        </span>
                                                        {cls.description && (
                                                            <span className="text-xs text-muted-foreground line-clamp-2">
                                                                {cls.description}
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
            {showSelectedDescription && selectedClass?.description && (
                <p className="text-xs text-muted-foreground mt-1 text-left px-1">
                    {selectedClass.description}
                </p>
            )}
        </>
    )
}
