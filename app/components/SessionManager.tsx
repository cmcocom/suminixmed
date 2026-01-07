'use client';

import { useSession } from 'next-auth/react';

interface SessionManagerProps {
  children: React.ReactNode;
}

export default function SessionManager({ children }: SessionManagerProps) {
  const { status } = useSession();

  // Solo renderizar loading mientras se está cargando la sesión
  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null; // El middleware redirigirá
  }

  // Si está autenticado, renderizar los children sin funcionalidad extra
  return <>{children}</>;
}
