import type { ModuleConfig } from '../../lib/module-loader'

export const moduleConfig: ModuleConfig = {
  id: 'news',
  name: 'News & Announcements',
  enabled: true,
  version: '1.0.0',
  fallback: 'News vorübergehend nicht verfügbar',
}
