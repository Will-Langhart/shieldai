/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  // Use port 3001 instead of default 3000
  devIndicators: {
    buildActivity: false,
  },
}

module.exports = nextConfig 