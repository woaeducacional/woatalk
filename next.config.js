/** @type {import('next').NextConfig} */
const nextConfig = {
  // @xenova/transformers só roda no browser (Whisper.js client-side).
  // Exclui do bundle de serverless functions para não estourar o limite de memória do Vercel.
  serverExternalPackages: ['@xenova/transformers', 'onnxruntime-node', 'onnxruntime-web', 'sharp'],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      sharp$: false,
      'onnxruntime-node$': false,
    }
    return config
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: '/**',
      },
    ],
  },
}

module.exports = nextConfig
