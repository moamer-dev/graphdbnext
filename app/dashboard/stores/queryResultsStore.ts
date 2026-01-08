'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type ViewMode = 'table' | 'graph'

interface QueryResultsStore {
  // View State
  viewMode: ViewMode
  currentPage: number
  itemsPerPage: number
  searchTerm: string
  columnFilters: Record<string, string>
  visibleColumns: Set<string>
  
  // Actions
  setViewMode: (mode: ViewMode) => void
  setCurrentPage: (page: number) => void
  setItemsPerPage: (itemsPerPage: number) => void
  setSearchTerm: (term: string) => void
  setColumnFilter: (column: string, value: string) => void
  clearColumnFilters: () => void
  removeColumnFilter: (column: string) => void
  toggleColumnVisibility: (column: string) => void
  setVisibleColumns: (columns: Set<string>) => void
  reset: () => void
}

const initialState = {
  viewMode: 'table' as ViewMode,
  currentPage: 1,
  itemsPerPage: 50,
  searchTerm: '',
  columnFilters: {} as Record<string, string>,
  visibleColumns: new Set<string>()
}

export const useQueryResultsStore = create<QueryResultsStore>((set) => ({
  ...initialState,
  
  setViewMode: (mode) => set({ viewMode: mode, currentPage: 1 }),
  
  setCurrentPage: (page) => set({ currentPage: page }),
  
  setItemsPerPage: (itemsPerPage) => set({ itemsPerPage, currentPage: 1 }),
  
  setSearchTerm: (term) => set({ searchTerm: term, currentPage: 1 }),
  
  setColumnFilter: (column, value) => set((state) => ({
    columnFilters: { ...state.columnFilters, [column]: value },
    currentPage: 1
  })),
  
  clearColumnFilters: () => set({ columnFilters: {}, currentPage: 1 }),
  
  removeColumnFilter: (column: string) => set((state) => {
    const newFilters = { ...state.columnFilters }
    delete newFilters[column]
    return { columnFilters: newFilters, currentPage: 1 }
  }),
  
  toggleColumnVisibility: (column) => set((state) => {
    const newVisibleColumns = new Set(state.visibleColumns)
    if (newVisibleColumns.has(column)) {
      newVisibleColumns.delete(column)
    } else {
      newVisibleColumns.add(column)
    }
    return { visibleColumns: newVisibleColumns }
  }),
  
  setVisibleColumns: (columns) => set({ visibleColumns: columns }),
  
  reset: () => set(initialState)
}))

