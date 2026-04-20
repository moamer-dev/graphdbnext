import { LayoutGrid, Table as TableIcon } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useUIStore, ViewType } from '@/stores/uiStore'

export function ViewSwitcher() {
  const { dashboardView, setDashboardView } = useUIStore()

  return (
    <Tabs 
      value={dashboardView} 
      onValueChange={(v) => setDashboardView(v as ViewType)} 
      className="w-[120px]"
    >
      <TabsList className="grid w-full grid-cols-2 h-8 p-1">
        <TabsTrigger value="table" className="h-6 w-full px-2">
          <TableIcon className="h-3.5 w-3.5" />
        </TabsTrigger>
        <TabsTrigger value="grid" className="h-6 w-full px-2">
          <LayoutGrid className="h-3.5 w-3.5" />
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
