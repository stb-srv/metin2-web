"use client"

/**
 * Module Loader
 * Lädt Module mit Error Boundary Isolation
 * Ein Modul-Absturz bringt nie die Gesamtseite zum Fallen
 */
import React from 'react'

export interface ModuleConfig {
  id: string
  name: string
  enabled: boolean
  version: string
  fallback?: string
}

/**
 * Wrapper der ein Modul mit Error Boundary und Suspense lädt
 */
export function createModuleWrapper(
  LazyComponent: React.LazyExoticComponent<React.ComponentType>,
  config: ModuleConfig
) {
  return function ModuleWrapper(props: Record<string, unknown>) {
    if (!config.enabled) {
      return null
    }

    return React.createElement(
      ModuleErrorBoundary,
      { moduleId: config.id, fallback: config.fallback },
      React.createElement(
        React.Suspense,
        {
          fallback: React.createElement(
            'div',
            { className: 'module-loading' },
            React.createElement('div', { className: 'module-loading__spinner' })
          ),
        },
        React.createElement(LazyComponent, props)
      )
    )
  }
}

/**
 * Error Boundary Klasse für Modul-Isolation
 */
interface ErrorBoundaryProps {
  moduleId: string
  fallback?: string
  children?: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class ModuleErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[Module:${this.props.moduleId}] Error:`, error, info)
  }

  render() {
    if (this.state.hasError) {
      return React.createElement(
        'div',
        { className: 'module-error' },
        React.createElement(
          'p',
          null,
          this.props.fallback ?? 'Modul vorübergehend nicht verfügbar'
        )
      )
    }
    return this.props.children
  }
}
