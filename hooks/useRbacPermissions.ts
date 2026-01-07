'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { logger } from '@/lib/logger';
import apiFetch from '@/lib/fetcher';

interface PermissionRecord {
  id: string;
  name: string;
  description: string | null;
  module: string;
  action: string;
  assigned: boolean;
}

interface ModuleRecord {
  key: string;
  name: string;
  permissions: PermissionRecord[];
  permissionCount: number;
  assignedCount: number;
}

interface ApiResponse {
  data: {
    modules: ModuleRecord[];
  };
}

export function useRbacPermissions() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionSet, setPermissionSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    const load = async () => {
      if (!session) return;
      const anyUser = session.user as typeof session.user & { id?: string };
      const userId = anyUser?.id;
      if (!userId) return;
      setLoading(true);
      setError(null);
      try {
        logger.debug('🔍 [useRbacPermissions] Cargando permisos para userId:', userId);
        // Este endpoint puede tardar en entornos con muchas reglas; aumentar timeout localmente
        const res = await apiFetch(
          `/api/rbac/users/${userId}/permissions-by-module`,
          { cache: 'no-store' },
          45000
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: ApiResponse = await res.json();

        logger.debug('🔍 [useRbacPermissions] Módulos recibidos:', json.data.modules.length);

        const set = new Set<string>();
        let totalPermisos = 0;
        let permisosAsignados = 0;

        // ✅ CORREGIDO: Usar module.action y module_action para compatibilidad
        json.data.modules.forEach((m) => {
          const permisosModulo = m.permissions.filter((p) => p.assigned);
          totalPermisos += m.permissions.length;
          permisosAsignados += permisosModulo.length;

          if (m.key === 'CATALOGOS_PRODUCTOS' || m.key === 'CATALOGOS_CATEGORIAS') {
            logger.debug(`🔍 [useRbacPermissions] Módulo ${m.key}:`, {
              totalPermisos: m.permissions.length,
              asignados: permisosModulo.length,
              permisos: permisosModulo.map((p) => `${p.module}.${p.action}`),
            });
          }

          permisosModulo.forEach((p) => {
            // Agregar múltiples formatos para máxima compatibilidad
            set.add(p.name); // Formato legible: "Almacenes - Leer"
            set.add(`${p.module}.${p.action}`); // Formato punto: ALMACENES.LEER
            set.add(`${p.module}_${p.action}`); // Formato guion bajo: ALMACENES_LEER
            // También agregar en minúsculas para compatibilidad
            set.add(`${p.module.toLowerCase()}.${p.action.toLowerCase()}`); // almacenes.leer
          });
        });

        logger.debug('✅ [useRbacPermissions] Permisos cargados:', {
          totalModulos: json.data.modules.length,
          totalPermisos,
          permisosAsignados,
          permissionSetSize: set.size,
        });

        // Verificar específicamente PRODUCTOS y CATEGORIAS
        const tieneProductosLeer = set.has('CATALOGOS_PRODUCTOS.LEER');
        const tieneCategoriasLeer = set.has('CATALOGOS_CATEGORIAS.LEER');
        logger.debug('🔍 [useRbacPermissions] Permisos LEER:', {
          'CATALOGOS_PRODUCTOS.LEER': tieneProductosLeer,
          'CATALOGOS_CATEGORIAS.LEER': tieneCategoriasLeer,
        });

        setPermissionSet(set);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Error cargando permisos';
        logger.error('❌ [useRbacPermissions] Error:', message);
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [session]);

  return { loading, error, permissionSet };
}
