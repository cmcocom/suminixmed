'use client';
import { useState } from 'react';
import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';
import { Toaster } from 'react-hot-toast';
import AuthErrorBoundary from './components/AuthErrorBoundary';
import { NotificationProvider } from './contexts/NotificationContext';
import { ModuleVisibilityProvider } from './contexts/ModuleVisibilityContext';
import { UserImageProvider } from './contexts/UserImageContext';
import { SidebarProvider } from './contexts/SidebarContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

interface ProvidersProps {
  children: React.ReactNode;
  session?: Session | null;
}

export default function Providers({ children, session }: ProvidersProps) {
  // Cast a any para evitar conflictos de tipos con la versión de @tanstack/react-query
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            cacheTime: 1000 * 60 * 5,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      } as any)
  );

  return (
    <AuthErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SessionProvider
          session={session as any}
          basePath="/api/auth"
          // Optimizado para mejor rendimiento
          refetchInterval={5 * 60} // 5 minutos
          refetchOnWindowFocus={true}
          refetchWhenOffline={false}
        >
          <SidebarProvider>
            <ModuleVisibilityProvider>
              <UserImageProvider>
                <NotificationProvider>{children}</NotificationProvider>
              </UserImageProvider>
            </ModuleVisibilityProvider>
          </SidebarProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff !important', // Fuerza color blanco con !important
                zIndex: 50000, // Menor que el modal de logout (99999)
              },
              success: {
                style: {
                  background: '#10B981',
                  color: '#fff !important', // Texto blanco en toast de éxito
                },
                iconTheme: {
                  primary: '#fff',
                  secondary: '#10B981',
                },
              },
              error: {
                style: {
                  background: '#EF4444',
                  color: '#fff !important', // Texto blanco en toast de error
                },
                iconTheme: {
                  primary: '#fff',
                  secondary: '#EF4444',
                },
              },
            }}
            containerStyle={{
              zIndex: 50000, // Configurar z-index del contenedor
            }}
          />
        </SessionProvider>
      </QueryClientProvider>
    </AuthErrorBoundary>
  );
}
