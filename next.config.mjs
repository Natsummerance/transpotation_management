/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/RDD_yolo11/:path*',
        destination: '/api/static/RDD_yolo11/:path*',
      },
      {
        source: '/runs/:path*',
        destination: '/api/static/runs/:path*',
      },
    ];
  },
}

export default nextConfig
