'use client';

import { useAuth } from '@/hooks/useAuth';
import { TipoRol } from '@/lib/tipo-rol';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface UserSessionShape {
  roles?: string[];
  primaryRole?: string;
  activo?: boolean;
  email?: string;
}

interface ProtectedPageProps {
  children: React.ReactNode;
  requiredPermission?: {
    modulo: string; // Cambiado de keyof typeof PERMISOS a string
    accion: string;
  };
  requiredRoles?: TipoRol[];
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
}

const DefaultLoadingComponent = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
  </div>
);

const DefaultErrorComponent = ({ message }: { message: string }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="mb-4">
        <svg
          className="w-16 h-16 text-red-500 mx-auto"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
      <p className="text-gray-600 mb-4">{message}</p>
      <button
        onClick={() => window.history.back()}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        Volver
      </button>
    </div>
  </div>
);

// Función para verificar si el usuario tiene alguno de los roles requeridos
function hasRequiredRole(
  userRoles: string[] | undefined,
  primaryRole: string | undefined,
  requiredRoles: TipoRol[],
  isSystemUser: boolean
): boolean {
  if (!requiredRoles || requiredRoles.length === 0) return true;
  // Si el usuario es system (UNIDADC / DESARROLLADOR u otro flag), permitir
  if (isSystemUser) return true;
  const enumValues = Object.values(TipoRol) as string[];
  const effectiveRoles: string[] = [];
  if (userRoles && userRoles.length > 0) {
    effectiveRoles.push(...userRoles.filter((r) => enumValues.includes(r)));
  }
  if (primaryRole && enumValues.includes(primaryRole) && !effectiveRoles.includes(primaryRole)) {
    effectiveRoles.push(primaryRole);
  }
  return effectiveRoles.some((r) => requiredRoles.includes(r as TipoRol));
}

export default function ProtectedPage({
  children,
  requiredPermission,
  requiredRoles,
  loadingComponent = <DefaultLoadingComponent />,
  errorComponent,
}: ProtectedPageProps) {
  const { data: session, status } = useSession();
  const { tienePermiso, user, isAuthenticated, isLoading, isSystemUser } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (status === 'loading' || isLoading) {
      return; // Aún cargando
    }

    if (status === 'unauthenticated' || !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!user) {
      router.push('/login');
      return;
    }

    // Verificar si el usuario está activo
    if (!user.activo) {
      setErrorMessage('Tu cuenta está inactiva. Contacta al administrador.');
      setAccessDenied(true);
      setIsChecking(false);
      return;
    }

    // Roles efectivos multi-rol
    const userSession = user as unknown as UserSessionShape;
    const rolesArray = userSession.roles;
    const primaryRole = userSession.primaryRole;

    if (requiredRoles && requiredRoles.length > 0) {
      const roleAccess = hasRequiredRole(
        rolesArray,
        primaryRole,
        requiredRoles,
        isSystemUser ?? false
      );
      if (!roleAccess) {
        setErrorMessage(
          `Esta página requiere uno de los siguientes roles: ${requiredRoles.join(', ')}`
        );
        setAccessDenied(true);
        setIsChecking(false);
        return;
      }
    }

    // Verificar permisos específicos si se proporcionan
    if (requiredPermission) {
      const hasPermission = tienePermiso(requiredPermission.modulo, requiredPermission.accion);

      if (!hasPermission) {
        setErrorMessage(
          `No tienes permisos para acceder a esta página. Se requiere: ${requiredPermission.modulo}.${requiredPermission.accion}`
        );
        setAccessDenied(true);
        setIsChecking(false);
        return;
      }
    }

    // Si llegamos aquí, el usuario tiene acceso
    setIsChecking(false);
  }, [
    session,
    status,
    router,
    requiredPermission,
    requiredRoles,
    tienePermiso,
    user,
    isAuthenticated,
    isLoading,
    isSystemUser,
  ]);

  // Mostrar loading mientras se verifica
  if (status === 'loading' || isLoading || isChecking) {
    return loadingComponent;
  }

  // Mostrar error si no tiene acceso
  if (accessDenied) {
    return errorComponent || <DefaultErrorComponent message={errorMessage} />;
  }

  // Renderizar el contenido si tiene acceso
  return <>{children}</>;
}

// HOC para simplificar el uso
export function withPageProtection(
  Component: React.ComponentType<Record<string, unknown>>,
  options: Omit<ProtectedPageProps, 'children'>
) {
  return function ProtectedComponent(props: Record<string, unknown>) {
    return (
      <ProtectedPage {...options}>
        <Component {...props} />
      </ProtectedPage>
    );
  };
}

// Componentes de protección específicos para casos comunes
export function AdminOnlyPage({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedPage requiredRoles={[TipoRol.UNIDADC, TipoRol.ADMINISTRADOR]}>
      {children}
    </ProtectedPage>
  );
}

export function DeveloperOnlyPage({ children }: { children: React.ReactNode }) {
  return <ProtectedPage requiredRoles={[TipoRol.UNIDADC]}>{children}</ProtectedPage>;
}

export function CollaboratorPlusPage({ children }: { children: React.ReactNode }) {
  // NOTA: COLABORADOR ha sido removido, ahora solo ADMINISTRADOR+ tiene estos permisos
  return (
    <ProtectedPage requiredRoles={[TipoRol.UNIDADC, TipoRol.ADMINISTRADOR]}>
      {children}
    </ProtectedPage>
  );
}
