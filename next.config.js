/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // <-- essa linha é a novidade
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
}

module.exports = nextConfig
