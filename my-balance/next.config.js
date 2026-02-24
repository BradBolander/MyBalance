/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disable webpack cache in dev to avoid ENOENT/corruption issues
  webpack: (config, { dev }) => {
    if (dev) config.cache = false
    return config
  },
}

module.exports = nextConfig
