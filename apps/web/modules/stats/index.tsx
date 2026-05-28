"use client"

import { Suspense } from 'react'
import { ModuleErrorBoundary } from '@/lib/module-loader'
import StatsBar from './components/StatsBar'

export default function StatsModule() {
  return (
    <ModuleErrorBoundary moduleId="stats">
      <Suspense
        fallback={
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-surface border border-border rounded-lg p-5 animate-pulse">
                <div className="h-7 bg-surface-2 rounded mb-2" />
                <div className="h-3 bg-surface-2 rounded w-2/3 mx-auto" />
              </div>
            ))}
          </div>
        }
      >
        <StatsBar />
      </Suspense>
    </ModuleErrorBoundary>
  )
}
