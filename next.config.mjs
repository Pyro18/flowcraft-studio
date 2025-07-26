/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  assetPrefix: './',
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Configure Monaco Editor for client-side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };

      // Handle Monaco Editor workers
      config.module.rules.push({
        test: /\.worker\.js$/,
        use: { loader: 'worker-loader' },
      });
    }

    return config;
  },
  experimental: {
    esmExternals: false,
  },
};

export default nextConfig;
