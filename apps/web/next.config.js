/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use port 3001 instead of default 3000
  devIndicators: {
    buildActivity: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig 