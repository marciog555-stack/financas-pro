import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Finanças Pro',
    short_name: 'Finanças Pro',
    description: 'Controle financeiro compartilhado para o casal',
    start_url: '/',
    display: 'standalone',
    background_color: '#060a16',
    theme_color: '#060a16',
    icons: [
      { src: '/icon-192', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512', sizes: '512x512', type: 'image/png' },
      { src: '/icon-512-maskable', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
