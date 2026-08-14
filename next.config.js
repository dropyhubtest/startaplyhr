/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  experimental: {
    staleTimes: {
      dynamic: 30,   // 30 seconds for dynamic pages
      static: 180,   // 3 minutes for static pages
    },
  },
  // Suppress Pusher client-side warnings in SSR
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
      }
    }
    return config
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
