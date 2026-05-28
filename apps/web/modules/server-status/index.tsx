"use client"

import { Suspense } from 'react'
import { ModuleErrorBoundary } from '@/lib/module-loader'
import ServerStatusWidget from './components/ServerStatusWidget'

export default function ServerStatusModule() {
  return (
    <ModuleErrorBoundary moduleId="server-status">
      <Suspense
        fallback={
          <div className="bg-surface border border-border rounded-lg p-6 animate-pulse">
            <div className="h-4 bg-surface-2 rounded w-1/3 mb-3" />
            <div className="h-8 bg-surface-2 rounded" />
          </div>
        }
      >
        <ServerStatusWidget />
      </Suspense>
    </ModuleErrorBoundary>
  )
}
