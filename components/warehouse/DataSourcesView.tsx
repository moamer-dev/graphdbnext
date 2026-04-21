'use client'

import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { GripVertical } from 'lucide-react'

// Hooks from handlers
import { useDataSourceExplorer } from '@/app/dashboard/database/sources/(handlers)/useDataSourceExplorer'

// UI Components
import { ExplorerSidebar } from './explorer/ExplorerSidebar'
import { ResourceEditor } from './explorer/ResourceEditor'
import { DeleteConfirmation } from './explorer/DeleteConfirmation'
import { ImportResourceDialog } from './ImportResourceDialog'

export function DataSourcesView() {
  const {
    // State
    isImportOpen,
    setIsImportOpen,
    selectedId,
    setSelectedId,
    deleteId,
    setDeleteId,
    search,
    setSearch,
    typeFilter,
    setTypeFilter,
    creatorFilter,
    setCreatorFilter,
    sortOrder,
    setSortOrder,
    editedContent,
    setEditedContent,
    isRenaming,
    setIsRenaming,
    tempName,
    setTempName,
    renameInputRef,
    
    // Data
    listData,
    selectedItem,
    isLoadingList,
    isLoadingDetail,
    availableTypes,
    availableCreators,
    filteredItems,
    
    // Actions
    handleSave,
    handleRename,
    handleDelete,
    refetchList,
    isUpdatePending,
    isDeletePending,
    
    // Auth/RBAC
    can,
    resourceKey
  } = useDataSourceExplorer()

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] w-full bg-background animate-in fade-in duration-300">
      <PanelGroup id="data-sources-explorer" direction="horizontal" className="flex-1 overflow-hidden">
        <Panel defaultSize={25} minSize={20}>
          <ExplorerSidebar 
            search={search}
            setSearch={setSearch}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            creatorFilter={creatorFilter}
            setCreatorFilter={setCreatorFilter}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            isLoadingList={isLoadingList}
            filteredItems={filteredItems}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            setDeleteId={setDeleteId}
            setIsImportOpen={setIsImportOpen}
            availableTypes={availableTypes}
            availableCreators={availableCreators}
            can={can}
            resourceKey={resourceKey}
          />
        </Panel>

        <PanelResizeHandle className="w-1.5 bg-border hover:bg-primary transition-all cursor-col-resize relative flex items-center justify-center group/resize">
            <div className="absolute left-1/2 -translate-x-1/2 h-10 w-5 flex items-center justify-center bg-background border border-border group-hover/resize:border-primary transition-all rounded-full shadow-none z-10">
                <GripVertical className="h-3.5 w-3.5 text-muted-foreground group-hover/resize:text-primary transition-colors" />
            </div>
        </PanelResizeHandle>

        <Panel defaultSize={75} className="bg-background relative overflow-hidden flex flex-col min-h-0">
          <div className="absolute inset-0 bg-primary/[0.01] pointer-events-none" />
          <ResourceEditor 
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            selectedItem={selectedItem}
            isLoadingDetail={isLoadingDetail}
            editedContent={editedContent}
            setEditedContent={setEditedContent}
            isRenaming={isRenaming}
            setIsRenaming={setIsRenaming}
            tempName={tempName}
            setTempName={setTempName}
            renameInputRef={renameInputRef}
            handleSave={handleSave}
            handleRename={handleRename}
            setDeleteId={setDeleteId}
            can={can}
            resourceKey={resourceKey}
            isUpdatePending={isUpdatePending}
          />
        </Panel>
      </PanelGroup>

      <DeleteConfirmation 
        deleteId={deleteId}
        setDeleteId={setDeleteId}
        resourceName={listData?.data?.find((i:any)=>i.id === deleteId)?.name}
        handleDelete={handleDelete}
        isPending={isDeletePending}
      />

      <ImportResourceDialog 
        open={isImportOpen} 
        onOpenChange={(open) => {
            setIsImportOpen(open)
            if (!open) refetchList()
        }} 
      />
    </div>
  )
}
