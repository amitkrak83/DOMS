import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'DOMS — Distributor Orders',
    short_name: 'DOMS',
    description: 'Distributor Order Management System',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#f9fafb',
    theme_color: '#2563eb',
    orientation: 'portrait',
    prefer_related_applications: false,
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
