import { Suspense } from 'react'
import { QueryView } from '../../(components)/database/QueryView'

export default function QueriesPage () {
  return (
    <div className="w-full">
      <Suspense fallback={
        <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
          <div className="text-sm text-muted-foreground">Loading...</div>
        </div>
      }>
        <QueryView />
      </Suspense>
    </div>
  )
}


