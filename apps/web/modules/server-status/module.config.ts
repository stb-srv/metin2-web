import type { ModuleConfig } from '../../lib/module-loader'

export const moduleConfig: ModuleConfig = {
  id: 'server-status',
  name: 'Server Status',
  enabled: true,
  version: '1.0.0',
  fallback: 'Server-Status vorübergehend nicht verfügbar',
}
