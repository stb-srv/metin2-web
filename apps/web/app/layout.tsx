import type { Metadata } from 'next'
import { Open_Sans, Rajdhani } from 'next/font/google'
import { cmsDb } from '@/lib/cms-db'
import { themeToCSS, ThemeConfig } from '@/lib/theme-engine'
import { ThemeProvider } from '@/components/core/ThemeProvider'
import './globals.css'

const openSans = Open_Sans({ 
  subsets: ['latin'], 
  variable: '--font-body',
  display: 'swap',
})

const rajdhani = Rajdhani({ 
  subsets: ['latin'], 
  weight: ['600', '700'],
  variable: '--font-display',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Metin2 Web CMS',
  description: 'Modulares CMS für Metin2 Private Server',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let themeConfig: ThemeConfig | null = null
  let themeCss = ''
  let themeId = 'metin2-dark'

  try {
    const activeThemeRecord = await cmsDb.theme.findFirst({
      where: { isDefault: true },
    })
    
    if (activeThemeRecord) {
      themeConfig = JSON.parse(activeThemeRecord.config) as ThemeConfig
      themeCss = themeToCSS(themeConfig)
      themeId = activeThemeRecord.id
    }
  } catch (error) {
    console.error('Failed to load theme from database:', error)
  }

  return (
    <html lang="de" data-theme={themeId} className={`${openSans.variable} ${rajdhani.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&family=Rajdhani:wght@600;700&display=swap" rel="stylesheet" />
        {themeCss && <style dangerouslySetInnerHTML={{ __html: themeCss }} />}
      </head>
      <body>
        <ThemeProvider initialTheme={themeConfig}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
