/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Permite cualquier dominio HTTPS
      },
      {
        protocol: 'http',
        hostname: '**', // Permite cualquier dominio HTTP (para desarrollo)
      },
    ],
  },
};

export default nextConfig;