/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ['stripe'],
  transpilePackages: ['recharts', 'victory-vendor'],
}

export default nextConfig
