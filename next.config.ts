import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  experimental: {
    // Cache previously-visited pages client-side for 30s so
    // re-navigation (Orders → Products → Orders) is instant.
    staleTimes: {
      dynamic: 30,
      static: 300,
    },
  },
}

export default nextConfig
