// @ts-check

/**
 * @type {import('next').NextConfig}
 **/
const nextConfig = {
  reactStrictMode: true,
  rewrites: async () => [
    {
      source: '/:path*',
      destination: '/api/:path*',
    },
  ],
};

module.exports = nextConfig;
