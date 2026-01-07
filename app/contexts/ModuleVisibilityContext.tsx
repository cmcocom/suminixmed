'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { api } from '@/lib/fetcher';
import { useSession } from 'next-auth/react';
import { deriveEffectiveVisibility } from './module-visibility-map';

interface ModuleVisibilityContextType {
  moduleVisibility: Record<string, boolean>;
  effectiveVisibility: Record<string, boolean>;
  updateModuleVisibility: (
    moduleKey: string,
    visible: boolean,
    scope?: string,
    roleId?: string
  ) => Promise<void>;
  loadModuleVisibility: () => Promise<void>;
  isLoading: boolean;
}

const ModuleVisibilityContext = createContext<ModuleVisibilityContextType | undefined>(undefined);

interface ModuleVisibilityProviderProps {
  children: ReactNode;
}

export function ModuleVisibilityProvider({ children }: ModuleVisibilityProviderProps) {
  const [moduleVisibility, setModuleVisibility] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const { status } = useSession();

  const loadModuleVisibility = useCallback(async () => {
    // Solo cargar si el usuario está autenticado
    if (status !== 'authenticated') {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      // Intentar cargar de API
      const response = await api.get('/api/rbac/modules/visibility');
      if (response.ok) {
        const data = await response.json();
        setModuleVisibility(data.moduleVisibility || {});
        // Guardar copia en localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('moduleVisibility', JSON.stringify(data.moduleVisibility || {}));
        }
      } else {
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('moduleVisibility');
          if (stored) {
            setModuleVisibility(JSON.parse(stored));
          }
        }
      }
    } catch (error) {
      // Fallback localStorage
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('moduleVisibility');
        if (stored) {
          setModuleVisibility(JSON.parse(stored));
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  const updateModuleVisibility = useCallback(
    async (moduleKey: string, visible: boolean, scope?: string, roleId?: string) => {
      // Solo actualizar si el usuario está autenticado
      if (status !== 'authenticated') {
        return;
      }

      try {
        // Actualizar estado local inmediatamente
        setModuleVisibility((prev) => {
          const updated = {
            ...prev,
            [moduleKey]: visible,
          };

          // Guardar en localStorage inmediatamente con el estado actualizado
          if (typeof window !== 'undefined') {
            localStorage.setItem('moduleVisibility', JSON.stringify(updated));
          }

          return updated;
        });

        // Persistir cambio en el backend
        const response = await api.put(`/api/rbac/modules/${moduleKey}/visibility`, {
          visible,
          scope,
          roleId,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to update module visibility: ${response.status} ${errorText}`);
        }

        await response.json();
      } catch (error) {
        // Revertir cambio local en caso de error
        await loadModuleVisibility();
      }
    },
    [status, loadModuleVisibility]
  );

  useEffect(() => {
    // Solo cargar cuando el status de la sesión cambie
    if (status === 'authenticated') {
      // 🔄 SOLUCIÓN REFRESH LOGIN: Limpiar caché localStorage en cada login
      // para evitar datos obsoletos de configuraciones de otros usuarios
      if (typeof window !== 'undefined') {
        localStorage.removeItem('moduleVisibility');
      }

      loadModuleVisibility();
    } else if (status === 'unauthenticated') {
      setModuleVisibility({});
      setIsLoading(false);

      // 🧹 LIMPIEZA LOGOUT: Limpiar caché al cerrar sesión
      if (typeof window !== 'undefined') {
        localStorage.removeItem('moduleVisibility');
      }
    }
  }, [status, loadModuleVisibility]);

  const effectiveVisibility = deriveEffectiveVisibility(moduleVisibility);

  return (
    <ModuleVisibilityContext.Provider
      value={{
        moduleVisibility,
        effectiveVisibility,
        updateModuleVisibility,
        loadModuleVisibility,
        isLoading,
      }}
    >
      {children}
    </ModuleVisibilityContext.Provider>
  );
}

export function useModuleVisibility() {
  const context = useContext(ModuleVisibilityContext);
  if (context === undefined) {
    throw new Error('useModuleVisibility must be used within a ModuleVisibilityProvider');
  }
  return context;
}

// Hook de depuración para forzar limpieza de caché
export function useDebugModuleVisibility() {
  const forceCleanReload = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('moduleVisibility');
      window.location.reload();
    }
  }, []);

  return { forceCleanReload };
}
