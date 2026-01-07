import { useState, useCallback } from 'react';
import apiFetch from '@/lib/fetcher';

export interface Permission {
  id: string;
  name: string;
  description: string | null;
  module: string;
  action: string;
  assigned: boolean;
}

export interface ModuleInfo {
  key: string;
  name: string;
  icon: string; // requerido para alineación con ModuleTree
  description: string;
  permissions: Permission[];
  permissionCount: number;
  assignedCount: number;
  visible?: boolean;
}

interface RawModule {
  key?: string;
  name?: string;
  icon?: string;
  description?: string;
  permissions?: Permission[];
  permissionCount?: number;
  assignedCount?: number;
  [k: string]: unknown;
}

export function useRoleModules(moduleVisibility: Record<string, boolean>) {
  const [modules, setModules] = useState<ModuleInfo[]>([]);
  const [loadingModules, setLoadingModules] = useState(false);

  const loadRoleModules = useCallback(
    async (roleId: string) => {
      try {
        setLoadingModules(true);
        const response = await apiFetch(`/api/rbac/roles/${roleId}/permissions-by-module`);
        if (response.status === 401 || response.status === 403) {
          return { error: 'PERMISSION_DENIED' };
        }
        if (!response.ok) {
          return { error: 'LOAD_FAILED' };
        }
        const json = await response.json();
        const mods = json.data?.modules || json.modules || [];
        const withVisibility: ModuleInfo[] = mods.map((raw: unknown) => {
          const m = raw as RawModule;
          const perms = Array.isArray(m.permissions) ? m.permissions : [];
          const key = m.key || 'UNKNOWN';
          return {
            key,
            name: m.name || key || 'Desconocido',
            icon: m.icon || '📦',
            description: m.description || '',
            permissions: perms,
            permissionCount:
              typeof m.permissionCount === 'number' ? m.permissionCount : perms.length,
            assignedCount:
              typeof m.assignedCount === 'number'
                ? m.assignedCount
                : perms.filter((p) => p.assigned).length,
            visible: moduleVisibility[key] ?? true,
          };
        });
        setModules(withVisibility);
        return { data: withVisibility };
      } catch {
        return { error: 'NETWORK' };
      } finally {
        setLoadingModules(false);
      }
    },
    [moduleVisibility]
  );

  return { modules, setModules, loadRoleModules, loadingModules };
}
