import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Providers from './providers';
import DebugPreloadReporter from './components/DebugPreloadReporter';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
// Inicialización del sistema de respaldos automáticos
import '@/lib/backup-init';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'SuminixMed',
  description: 'Sistema de gestión médica',
};

// Next.js recomienda exportar `viewport` por separado en rutas/app
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Providers session={session}>
          {children}
          {process.env.NODE_ENV === 'development' ? <DebugPreloadReporter /> : null}
        </Providers>
      </body>
    </html>
  );
}
