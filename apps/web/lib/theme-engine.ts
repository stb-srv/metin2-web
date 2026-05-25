/**
 * Theme Engine
 * Lädt themes/*.json und wendet CSS-Variablen dynamisch an
 */

export interface ThemeConfig {
  id: string
  name: string
  colors: Record<string, string>
  fonts: Record<string, string>
  borderRadius?: Record<string, string>
}

/**
 * Wendet ein Theme auf das Document an (Client-side)
 */
export function applyTheme(config: ThemeConfig): void {
  if (typeof document === 'undefined') return

  const root = document.documentElement

  Object.entries(config.colors).forEach(([key, value]) => {
    root.style.setProperty(key, value)
  })

  Object.entries(config.fonts).forEach(([key, value]) => {
    root.style.setProperty(key, value)
  })

  if (config.borderRadius) {
    Object.entries(config.borderRadius).forEach(([key, value]) => {
      root.style.setProperty(key, value)
    })
  }

  // Theme-ID als data-Attribut setzen (für Theme-spezifisches CSS)
  root.setAttribute('data-theme', config.id)

  // In localStorage speichern
  localStorage.setItem('cms-theme', config.id)
}

/**
 * Lädt das gespeicherte Theme aus localStorage
 */
export function getSavedThemeId(): string | null {
  if (typeof localStorage === 'undefined') return null
  return localStorage.getItem('cms-theme')
}

/**
 * CSS-Variablen eines Themes als <style>-String (für SSR)
 */
export function themeToCSS(config: ThemeConfig): string {
  const vars = [
    ...Object.entries(config.colors),
    ...Object.entries(config.fonts),
    ...Object.entries(config.borderRadius ?? {}),
  ]
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n')

  return `:root {\n${vars}\n}`
}
