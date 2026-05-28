import { Suspense } from 'react'
import { ModuleErrorBoundary } from '@/lib/module-loader'
import NewsWidget from './components/NewsWidget'

export default function NewsModule() {
  return (
    <ModuleErrorBoundary>
      <Suspense
        fallback={
          <div className="bg-surface border border-border rounded-lg p-6 animate-pulse space-y-3">
            <div className="h-4 bg-surface-2 rounded w-1/4" />
            <div className="h-4 bg-surface-2 rounded" />
            <div className="h-4 bg-surface-2 rounded" />
          </div>
        }
      >
        <NewsWidget />
      </Suspense>
    </ModuleErrorBoundary>
  )
}
