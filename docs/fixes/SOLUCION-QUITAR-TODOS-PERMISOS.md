/**
 * Fix para el problema de "Quitar Todos" permisos
 * Los toggles siguen apareciendo en verde después de revocar permisos
 */

/**
 * PROBLEMA IDENTIFICADO:
 * ===================
 * 1. revokeAll funciona correctamente en el backend
 * 2. La API reporta correctamente 0 permisos después del DELETE
 * 3. El problema está en que el estado React no se actualiza correctamente
 * 4. Posible race condition o timing issue con loadRoleModules
 * 
 * SOLUCIÓN:
 * =========
 * 1. Implementar actualización optimista del estado
 * 2. Agregar retry logic si la primera actualización falla
 * 3. Forzar re-render del componente
 * 4. Mejorar el manejo de errores
 */

// 1. MEJORAR useRolePermissionOps.ts - Agregar actualización optimista
export function useRolePermissionOpsFixed() {
  const [updating, setUpdating] = useState(false);

  const revokeAll = async (roleId: string, modules: ModuleInfo[]) => {
    setUpdating(true);
    try {
      const assigned: string[] = [];
      modules.forEach(m => m.permissions.filter(p => p.assigned).forEach(p => assigned.push(p.id)));
      
      if (!assigned.length) {
        console.log('[RBAC] No hay permisos asignados para revocar');
        return { error: 'NO_ASSIGNED' };
      }

      console.log(`[RBAC] Revocando ${assigned.length} permisos para rol ${roleId}`);
      
      const res = await fetch(`/api/rbac/roles/${roleId}/permissions`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permission_ids: assigned })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error('[RBAC] Error en revokeAll:', err);
        return { error: err.error || 'REVOKE_FAILED' };
      }

      const result = await res.json();
      console.log('[RBAC] revokeAll exitoso:', result);
      
      return { 
        data: result,
        revokedIds: assigned // Devolver IDs revocados para actualización optimista
      };
    } catch (error) {
      console.error('[RBAC] Error de red en revokeAll:', error);
      return { error: 'NETWORK' };
    } finally {
      setUpdating(false);
    }
  };

  // ... resto de métodos igual
}

// 2. MEJORAR handleRevokeAllPermissions en page.tsx
const handleRevokeAllPermissionsFixed = async () => {
  if (!selectedRole || updating) return;
  if (!window.confirm(`Quitar TODOS los permisos de "${selectedRole.name}"?`)) return;
  
  console.log(`[RBAC] Iniciando revokeAll para ${selectedRole.name}`);
  showToast('Revocando todos los permisos...', 'info');
  
  const r = await revokeAll(selectedRole.id, roleModules);
  
  if (r.error) {
    console.error('[RBAC] Error en revokeAll:', r.error);
    return showToast('Error al revocar permisos', 'error');
  }

  console.log('[RBAC] revokeAll exitoso, refrescando datos...');
  showToast(r.data?.message || 'Permisos revocados', 'success');

  // ACTUALIZACIÓN OPTIMISTA: Marcar todos los permisos como no asignados inmediatamente
  const updatedModules = roleModules.map(module => ({
    ...module,
    assignedCount: 0,
    permissions: module.permissions.map(permission => ({
      ...permission,
      assigned: false
    }))
  }));
  
  // Forzar actualización del estado inmediatamente
  setRoleModules(updatedModules);
  console.log('[RBAC] Estado actualizado optimísticamente');

  // Luego hacer refresh real con retry
  let retries = 3;
  let success = false;
  
  while (retries > 0 && !success) {
    try {
      console.log(`[RBAC] Intentando loadRoleModules (intentos restantes: ${retries})`);
      
      // Pequeño delay para asegurar que el backend haya procesado
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const result = await loadRoleModules(selectedRole.id);
      
      if (result.error) {
        console.error('[RBAC] Error en loadRoleModules:', result.error);
        retries--;
        continue;
      }
      
      console.log('[RBAC] loadRoleModules exitoso');
      success = true;
      
      // Verificar que efectivamente se actualizó
      const totalAssigned = result.data?.reduce((sum, mod) => sum + (mod.assignedCount || 0), 0) || 0;
      console.log(`[RBAC] Permisos asignados después del refresh: ${totalAssigned}`);
      
      if (totalAssigned > 0) {
        console.warn('[RBAC] ADVERTENCIA: Aún hay permisos asignados después de revokeAll');
        showToast('Advertencia: Algunos permisos pueden no haberse revocado correctamente', 'warning');
      }
      
    } catch (error) {
      console.error('[RBAC] Error durante retry:', error);
      retries--;
    }
  }
  
  if (!success) {
    console.error('[RBAC] Falló el refresh después de todos los reintentos');
    showToast('Los permisos se revocaron pero la interfaz puede no reflejar los cambios. Recarga la página.', 'warning');
  }
};

// 3. AGREGAR componente de debugging (opcional)
const RBACDebugPanel = ({ selectedRole, roleModules }) => {
  if (process.env.NODE_ENV !== 'development') return null;
  
  const totalPermissions = roleModules.reduce((sum, mod) => sum + mod.permissionCount, 0);
  const totalAssigned = roleModules.reduce((sum, mod) => sum + mod.assignedCount, 0);
  
  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded text-xs max-w-sm">
      <h4 className="font-bold">RBAC Debug</h4>
      <div>Rol: {selectedRole?.name || 'None'}</div>
      <div>Permisos: {totalAssigned}/{totalPermissions}</div>
      <div>Módulos: {roleModules.length}</div>
      <div>Timestamp: {new Date().toLocaleTimeString()}</div>
    </div>
  );
};