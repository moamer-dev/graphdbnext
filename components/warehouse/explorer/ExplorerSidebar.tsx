import { 
  Search, 
  FolderSearch, 
  CloudUpload,
  Loader2,
  Ghost,
  Filter,
  SortAsc,
  SortDesc,
  Trash2,
  User as UserIcon,
  Check, 
  ChevronDown,
  CheckSquare,
  Square
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import { cn } from '@/utils'
import { FileIcon } from './FileIcon'
import { useState } from 'react'

interface ExplorerSidebarProps {
  search: string
  setSearch: (val: string) => void
  typeFilter: string
  setTypeFilter: (val: string) => void
  creatorFilter: string
  setCreatorFilter: (val: string) => void
  sortOrder: 'asc' | 'desc'
  setSortOrder: (order: 'asc' | 'desc' | ((prev: 'asc' | 'desc') => 'asc' | 'desc')) => void
  isLoadingList: boolean
  filteredItems: any[]
  selectedId: string | null
  setSelectedId: (id: string | null) => void
  multiSelectedIds: string[]
  setMultiSelectedIds: (ids: string[] | ((prev: string[]) => string[])) => void
  setDeleteId: (id: string | null) => void
  startBulkDelete: () => void
  setIsImportOpen: (open: boolean) => void
  availableTypes: string[]
  availableCreators: { id: string, label: string }[]
  can: (action: string, resource: string, data?: any) => boolean
  resourceKey: string
}

export const ExplorerSidebar = ({
  search,
  setSearch,
  typeFilter,
  setTypeFilter,
  creatorFilter,
  setCreatorFilter,
  sortOrder,
  setSortOrder,
  isLoadingList,
  filteredItems,
  selectedId,
  setSelectedId,
  multiSelectedIds,
  setMultiSelectedIds,
  setDeleteId,
  startBulkDelete,
  setIsImportOpen,
  availableTypes,
  availableCreators,
  can,
  resourceKey
}: ExplorerSidebarProps) => {
  const [isAuthorOpen, setIsAuthorOpen] = useState(false)

  const deletableItems = filteredItems.filter(i => can('DELETE', resourceKey, i))
  const isAllSelected = deletableItems.length > 0 && multiSelectedIds.length === deletableItems.length
  const isAnySelected = multiSelectedIds.length > 0

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setMultiSelectedIds([])
    } else {
      setMultiSelectedIds(deletableItems.map(i => i.id))
    }
  }

  const toggleSelectItem = (id: string) => {
    setMultiSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  return (
    <div className="flex flex-col h-full bg-muted/20">
      {/* HEADER SECTION */}
      <div className="p-4 space-y-4 border-b border-border bg-muted/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {deletableItems.length > 0 && (
                <Checkbox 
                    checked={isAllSelected}
                    onCheckedChange={toggleSelectAll}
                    title={isAllSelected ? "Deselect All" : "Select Deletable Items"}
                    className="h-4 w-4 rounded border-primary/20 data-[state=checked]:bg-primary"
                />
            )}
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80 flex items-center gap-1.5 ml-1">
                Explorer
            </h2>
          </div>

          <div className="flex items-center gap-1.5">
            {isAnySelected && (
                <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-7 w-7 rounded-md text-destructive hover:bg-destructive/10 animate-in zoom-in-50 duration-200"
                    onClick={startBulkDelete}
                    title={`Delete ${multiSelectedIds.length} items`}
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </Button>
            )}

            <Button 
              size="icon" 
              variant="ghost" 
              className="h-7 w-7 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              title={`Sort ${sortOrder === 'asc' ? 'Z-A' : 'A-Z'}`}
            >
              {sortOrder === 'asc' ? <SortAsc className="h-3.5 w-3.5" /> : <SortDesc className="h-3.5 w-3.5" />}
            </Button>
            
            {!isAnySelected && can('CREATE', resourceKey) && (
              <Button 
                size="sm" 
                variant="default" 
                className="h-7 px-2.5 rounded-md text-[10px] font-bold shadow-none border-none transition-all hover:scale-[1.02]"
                onClick={() => setIsImportOpen(true)}
              >
                <CloudUpload className="h-3.5 w-3.5 mr-1.5" />
                UPLOAD
              </Button>
            )}
          </div>
        </div>

        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search resources..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-[12px] rounded-lg border-border bg-background/50 hover:bg-background focus:bg-background focus:ring-2 focus:ring-primary/20 shadow-none transition-all"
          />
        </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                  <Filter className="h-3 w-3 text-primary" />
                  <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wide">Refine Results</span>
              </div>
              <div className="flex items-center gap-3">
                {deletableItems.length > 0 && !isAllSelected && (
                    <button 
                      onClick={toggleSelectAll}
                      className="text-[9px] font-black uppercase text-primary/60 hover:text-primary transition-colors tracking-tighter"
                    >
                        Select All
                    </button>
                )}
                {isAnySelected && (
                    <button 
                      onClick={() => setMultiSelectedIds([])}
                      className="text-[9px] font-black uppercase text-muted-foreground hover:text-primary transition-colors tracking-tighter"
                    >
                        Clear {multiSelectedIds.length}
                    </button>
                )}
              </div>
            </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[9px] font-semibold text-muted-foreground/70 uppercase ml-1">Type</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-8 text-[11px] rounded-lg border-border bg-background focus:ring-2 focus:ring-primary/10 font-medium px-3 shadow-none">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border shadow-none">
                  <SelectItem value="ALL" className="text-[11px] font-medium">All Types</SelectItem>
                  {availableTypes.map((type) => (
                    <SelectItem key={type} value={type} className="text-[11px] font-medium uppercase">
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-semibold text-muted-foreground/70 uppercase ml-1">Author</label>
              <Popover open={isAuthorOpen} onOpenChange={setIsAuthorOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isAuthorOpen}
                    className="h-8 w-full justify-between text-[11px] rounded-lg border-border bg-background focus:ring-2 focus:ring-primary/10 font-medium px-3 shadow-none hover:bg-background"
                  >
                    <span className="truncate">
                      {creatorFilter === "ALL" 
                        ? "All Authors" 
                        : availableCreators.find((c) => c.id === creatorFilter)?.label}
                    </span>
                    <ChevronDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[180px] p-0 rounded-xl border-border shadow-none bg-white">
                  <Command className="rounded-xl">
                    <CommandInput placeholder="Search authors..." className="h-8 text-[11px]" />
                    <CommandEmpty className="text-[11px] py-2 text-center">No author found.</CommandEmpty>
                    <CommandGroup className="max-h-[200px] overflow-y-auto custom-scrollbar">
                      <CommandItem
                        value="ALL"
                        onSelect={() => {
                          setCreatorFilter("ALL")
                          setIsAuthorOpen(false)
                        }}
                        className="text-[11px] cursor-pointer"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-3 w-3",
                            creatorFilter === "ALL" ? "opacity-100" : "opacity-0"
                          )}
                        />
                        All Authors
                      </CommandItem>
                      {availableCreators.map((creator) => (
                        <CommandItem
                          key={creator.id}
                          value={creator.label}
                          onSelect={() => {
                            setCreatorFilter(creator.id)
                            setIsAuthorOpen(false)
                          }}
                          className="text-[11px] cursor-pointer"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-3 w-3",
                              creatorFilter === creator.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <span className="truncate">{creator.label}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        {isLoadingList ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 opacity-50">
            <div className="p-3 rounded-full bg-primary/5">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-widest">Indexing Assets</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 opacity-30">
            <Ghost className="h-10 w-10 text-muted-foreground" />
            <span className="text-[11px] uppercase font-bold tracking-widest text-center px-4">Workspace Empty</span>
          </div>
        ) : (
          <div className="space-y-0.5">
            {filteredItems.map((item: any) => {
              const hasReadPermission = can('READ', resourceKey, item)
              const hasDeletePermission = can('DELETE', resourceKey, item)
              
              if (!hasReadPermission) return null

              const creatorName = item.creator?.name || item.creator?.email || 'Unknown'
              const isActive = selectedId === item.id
              const isSelected = multiSelectedIds.includes(item.id)

              return (
                <div key={item.id} className="relative group px-1">
                  <div className={cn(
                    "absolute left-3 top-1/2 -translate-y-1/2 z-10 transition-all",
                    hasDeletePermission 
                        ? (isSelected ? "opacity-100 scale-100" : "opacity-40 scale-90 group-hover:opacity-100 group-hover:scale-100")
                        : "opacity-0 pointer-events-none"
                  )}>
                    <Checkbox 
                        checked={isSelected}
                        onCheckedChange={() => toggleSelectItem(item.id)}
                        className="h-4 w-4 rounded border-primary/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                  </div>

                  <button
                    onClick={() => setSelectedId(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3.5 px-3 py-3 rounded-xl transition-all text-left relative",
                      hasDeletePermission ? "ml-9 w-[calc(100%-36px)]" : "ml-0 w-full",
                      isActive 
                        ? "bg-primary/[0.04] ring-1 ring-primary/20 shadow-none text-primary" 
                        : isSelected ? "bg-primary/[0.02]" : "hover:bg-muted/60"
                    )}
                  >
                    {isActive && <div className="absolute left-[-2px] top-3 bottom-3 w-1 rounded-full bg-primary" />}
                    <div className={cn(
                      "shrink-0 h-9 w-9 rounded-lg flex items-center justify-center transition-colors shadow-none",
                      isActive ? "bg-primary/10" : "bg-muted/50"
                    )}>
                      <FileIcon 
                        type={item.type} 
                        className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground/70")} 
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-[13px] font-bold truncate transition-colors",
                        isActive ? "text-primary" : "text-foreground group-hover:text-primary"
                      )}>
                        {item.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1 whitespace-nowrap overflow-hidden">
                        <p className={cn(
                          "text-[10px] font-medium tracking-tight transition-colors shrink-0",
                          isActive ? "text-primary/70" : "text-muted-foreground/80"
                        )}>
                          {item.type} • {( (item.size || 0) / 1024).toFixed(1)} KB
                        </p>
                        <div className="w-px h-2.5 bg-border shrink-0" />
                        <p className={cn(
                          "text-[10px] font-semibold truncate transition-colors",
                          isActive ? "text-primary/50" : "text-muted-foreground/50"
                        )} title={`Uploaded by ${creatorName}`}>
                          {creatorName}
                        </p>
                      </div>
                    </div>
                  </button>
                  
                  {hasDeletePermission && !isAnySelected && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all shadow-none bg-background/80 backdrop-blur-sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteId(item.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
