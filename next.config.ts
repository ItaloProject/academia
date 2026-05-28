import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  turbopack: {},
  serverExternalPackages: ['face-api.js', '@tensorflow/tfjs-core'],
}

export default nextConfig
