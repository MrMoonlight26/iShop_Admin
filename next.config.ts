import type { NextConfig } from 'next'

const basePathEnv = process.env.NEXT_PUBLIC_BASE_PATH || ''
const normalizedBasePath = basePathEnv ? `/${String(basePathEnv).replace(/^\/+|\/+$/g, '')}` : undefined

const nextConfig: NextConfig = {
  basePath: normalizedBasePath,
}

export default nextConfig
