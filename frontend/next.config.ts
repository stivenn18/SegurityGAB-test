import type { NextConfig } from "next";

const backendUrl = process.env.BACKEND_URL || 'https://seguritygab-backend.onrender.com';

const securityHeaders = [
  // Evita que carguen tu web en iframes -> protege contra clickjacking
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  // Evita que el navegador 'adivine' el tipo de archivo -> protege contra MIME sniffing
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  // Define qué contenido es permitido -> tu mayor defensa contra XSS e inyecciones
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      img-src 'self' ${backendUrl} data:;
      connect-src 'self' ${backendUrl};
      font-src 'self';
      object-src 'none';
      base-uri 'self';
      form-action 'self';
    `.replace(/\s{2,}/g, ' ').trim(),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Aplica estas cabeceras a todas las rutas de tu aplicación
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
