import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuración ESLint
  eslint: {
    // Ignorar ciertos warnings en producción
    ignoreDuringBuilds: false,
  },
  
  // TypeScript estricto
  typescript: {
    // No ignorar errores en build
    ignoreBuildErrors: false,
  },
  
  // Configuración de imágenes optimizada
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/uploads/**',
      },
    ],
    // Optimizaciones adicionales
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Habilitar compresión
  compress: true,
  
  // Configuración de Turbopack
  turbopack: {
    root: process.cwd(),
  },
  
  // Optimizaciones de compilación
  experimental: {
    optimizePackageImports: ['react-hot-toast', '@heroicons/react', '@headlessui/react'],
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  
  // Configuración del servidor de desarrollo
  devIndicators: {
    position: 'bottom-right'
  },
  
  // Configuración runtime
  serverRuntimeConfig: {
    // Variables de servidor
  },
  
  publicRuntimeConfig: {
    // Variables públicas accesibles desde el cliente
    allowedHosts: process.env.ALLOWED_HOSTS?.split(',') || ['localhost'],
    trustedOrigins: process.env.TRUSTED_ORIGINS?.split(',') || ['http://localhost:3000'],
    localDomain: process.env.LOCAL_DOMAIN || 'suminixmed.local',
  },
  
  // Optimización de producción
  productionBrowserSourceMaps: false,
  
  // Configuración de headers para mejor rendimiento y seguridad
  async headers() {
    return [
      {
        source: '/uploads/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Permitir acceso desde múltiples hosts en desarrollo
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'development' 
              ? '*' 
              : 'http://192.161.65.224:3000, http://192.168.1.127:3000, http://suminixmed.local:3000',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
