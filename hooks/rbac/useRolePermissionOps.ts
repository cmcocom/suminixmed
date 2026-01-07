import { useState } from 'react';
import { logger } from '@/lib/logger';
import type { ModuleInfo } from './useRoleModules';
import apiFetch from '@/lib/fetcher';

export function useRolePermissionOps() {
  const [updating, setUpdating] = useState(false);

  const toggleSingle = async (
    roleId: string,
    permissionId: string,
    assigned: boolean,
    actor: string
  ) => {
    setUpdating(true);
    try {
      const res = await apiFetch(`/api/rbac/roles/${roleId}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissionId, assigned, assignedBy: actor }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        logger.error('[RBAC] revokeAll: Error HTTP:', res.status, err);
        return { error: err.error || 'REVOKE_FAILED' };
      }
      const json = await res.json();
      return { data: json };
    } catch {
      return { error: 'NETWORK' };
    } finally {
      setUpdating(false);
    }
  };

  const assignAll = async (roleId: string, modules: ModuleInfo[]) => {
    setUpdating(true);
    try {
      const allIds: string[] = [];
      modules.forEach((m) => m.permissions.forEach((p) => allIds.push(p.id)));
      if (!allIds.length) return { error: 'NO_PERMISSIONS' };
      const res = await apiFetch(`/api/rbac/roles/${roleId}/permissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permission_ids: allIds }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { error: err.error || 'ASSIGN_FAILED' };
      }
      return { data: await res.json() };
    } catch {
      return { error: 'NETWORK' };
    } finally {
      setUpdating(false);
    }
  };

  const revokeAll = async (roleId: string, modules: ModuleInfo[]) => {
    setUpdating(true);
    try {
      const assigned: string[] = [];
      modules.forEach((m) =>
        m.permissions.filter((p) => p.assigned).forEach((p) => assigned.push(p.id))
      );

      console.log(`[RBAC] revokeAll: ${assigned.length} permisos asignados encontrados`);

      if (!assigned.length) {
        console.log('[RBAC] revokeAll: No hay permisos asignados para revocar');
        return { error: 'NO_ASSIGNED' };
      }

      console.log(`[RBAC] revokeAll: Enviando DELETE para ${assigned.length} permisos`);

      const res = await apiFetch(`/api/rbac/roles/${roleId}/permissions`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permission_ids: assigned }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error('[RBAC] revokeAll: Error HTTP:', res.status, err);
        return { error: err.error || 'REVOKE_FAILED' };
      }

      const result = await res.json();
      console.log('[RBAC] revokeAll: Éxito -', result.message);

      return {
        data: result,
        revokedIds: assigned, // Incluir IDs revocados para actualización optimista
      };
    } catch (error) {
      logger.error('[RBAC] revokeAll: Error de red:', error);
      return { error: 'NETWORK' };
    } finally {
      setUpdating(false);
    }
  };

  return { updating, toggleSingle, assignAll, revokeAll };
}
