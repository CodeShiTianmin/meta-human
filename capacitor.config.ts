import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.metahuman.app',
  appName: 'MetaHuman',
  webDir: 'dist/h5',
  android: {
    allowMixedContent: true,
    backgroundColor: '#f6f0ff'
  },
  server: {
    androidScheme: 'https'
  }
}

export default config
