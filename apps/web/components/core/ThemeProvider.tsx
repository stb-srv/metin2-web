'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { ThemeConfig, applyTheme, getSavedThemeId } from '@/lib/theme-engine'

interface ThemeContextType {
  activeTheme: ThemeConfig | null
  setTheme: (theme: ThemeConfig) => Promise<void>
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ 
  children, 
  initialTheme 
}: { 
  children: React.ReactNode
  initialTheme: ThemeConfig | null 
}) {
  const [activeTheme, setActiveThemeState] = useState<ThemeConfig | null>(initialTheme)

  useEffect(() => {
    // Beim Mount: Theme aus localStorage laden und anwenden, falls es abweicht
    const savedThemeId = getSavedThemeId()
    if (savedThemeId && (!initialTheme || savedThemeId !== initialTheme.id)) {
      fetch('/api/themes')
        .then(res => res.json())
        .then(data => {
          const themes = data.themes || []
          const savedTheme = themes.find((t: any) => t.id === savedThemeId)
          if (savedTheme) {
            const config = JSON.parse(savedTheme.config) as ThemeConfig
            setActiveThemeState(config)
            applyTheme(config)
          }
        })
        .catch(err => console.error('Failed to load saved theme', err))
    }
  }, [initialTheme])

  const setTheme = async (theme: ThemeConfig) => {
    // Optimistisches UI Update + localStorage
    setActiveThemeState(theme)
    applyTheme(theme)
    
    // API Call zum Aktivieren des Themes in der DB
    try {
      await fetch(`/api/themes/${theme.id}/activate`, {
        method: 'POST',
      })
    } catch (error) {
      console.error('Failed to activate theme via API', error)
    }
  }

  return (
    <ThemeContext.Provider value={{ activeTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
