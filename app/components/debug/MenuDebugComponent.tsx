'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRbacPermissions } from '@/hooks/useRbacPermissions';
import { useModuleVisibility } from '@/app/contexts/ModuleVisibilityContext';
import { menuItems } from '@/app/components/sidebar/constants';
import { getFilteredMenuItems } from '@/app/components/sidebar/utils/permissions';
import { useGeneratedReports } from '@/app/components/sidebar/hooks/useGeneratedReports';

/**
 * Componente de diagnóstico temporal para depurar el problema del menú
 */
export function MenuDebugComponent() {
  const { user, tienePermiso } = useAuth();
  const { permissionSet, loading: rbacLoading, error: rbacError } = useRbacPermissions();
  const { effectiveVisibility, isLoading: visibilityLoading } = useModuleVisibility();
  const { generatedReports } = useGeneratedReports();

  if (rbacLoading || visibilityLoading) {
    return (
      <div className="p-4 bg-yellow-100 text-yellow-800">🔄 Cargando permisos y visibilidad...</div>
    );
  }

  if (rbacError) {
    return (
      <div className="p-4 bg-red-100 text-red-800">❌ Error cargando permisos: {rbacError}</div>
    );
  }

  // Obtener elementos filtrados
  const filteredMenuItems = getFilteredMenuItems(
    generatedReports,
    tienePermiso,
    effectiveVisibility
  );

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-75 z-50 overflow-auto">
      <div className="bg-white p-6 m-4 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">🔍 DIAGNÓSTICO DE MENÚ</h2>

        {/* Información del usuario */}
        <div className="mb-6 p-4 bg-blue-50 rounded">
          <h3 className="text-lg font-semibold">👤 Usuario Actual</h3>
          <pre>{JSON.stringify(user, null, 2)}</pre>
        </div>

        {/* Información de permisos RBAC */}
        <div className="mb-6 p-4 bg-green-50 rounded">
          <h3 className="text-lg font-semibold">
            🔑 Permisos RBAC ({permissionSet.size} permisos)
          </h3>
          <div className="max-h-40 overflow-auto">
            {Array.from(permissionSet)
              .slice(0, 20)
              .map((perm) => (
                <div key={perm} className="text-sm">
                  • {perm}
                </div>
              ))}
            {permissionSet.size > 20 && (
              <div className="text-sm text-gray-500">... y {permissionSet.size - 20} más</div>
            )}
          </div>
        </div>

        {/* Información de visibilidad de módulos */}
        <div className="mb-6 p-4 bg-purple-50 rounded">
          <h3 className="text-lg font-semibold">👁️ Visibilidad de Módulos</h3>
          {effectiveVisibility && Object.keys(effectiveVisibility).length > 0 ? (
            <div className="max-h-40 overflow-auto">
              {Object.entries(effectiveVisibility).map(([module, visible]) => (
                <div
                  key={module}
                  className={`text-sm ${visible ? 'text-green-600' : 'text-red-600'}`}
                >
                  {visible ? '✅' : '❌'} {module}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500">No hay datos de visibilidad</div>
          )}
        </div>

        {/* Pruebas de permisos específicos */}
        <div className="mb-6 p-4 bg-orange-50 rounded">
          <h3 className="text-lg font-semibold">🧪 Pruebas de Permisos</h3>
          {[
            'DASHBOARD',
            'SOLICITUDES',
            'SURTIDO',
            'ENTRADAS',
            'SALIDAS',
            'STOCK_FIJO',
            'INVENTARIOS_FISICOS',
            'ALMACENES',
            'INVENTARIO',
            'REPORTES',
            'AJUSTES',
          ].map((modulo) => {
            const tiene = tienePermiso(modulo, 'LEER');
            return (
              <div key={modulo} className={`text-sm ${tiene ? 'text-green-600' : 'text-red-600'}`}>
                {tiene ? '✅' : '❌'} {modulo}.LEER
              </div>
            );
          })}
        </div>

        {/* Items del menú original */}
        <div className="mb-6 p-4 bg-gray-50 rounded">
          <h3 className="text-lg font-semibold">
            📋 Items de Menú Original ({menuItems.length} items)
          </h3>
          <div className="max-h-40 overflow-auto">
            {menuItems.map((item) => (
              <div key={item.title} className="text-sm">
                • {item.title}{' '}
                {item.permission
                  ? `(${item.permission.modulo}.${item.permission.accion})`
                  : '(sin permisos)'}
                {item.submenu && (
                  <span className="text-blue-600"> +{item.submenu.length} subitems</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Items del menú filtrado */}
        <div className="mb-6 p-4 bg-red-50 rounded">
          <h3 className="text-lg font-semibold">
            🎯 Items de Menú Filtrado ({filteredMenuItems.length} items)
          </h3>
          <div className="max-h-40 overflow-auto">
            {filteredMenuItems.map((item) => (
              <div key={item.title} className="text-sm">
                • {item.title}{' '}
                {item.permission
                  ? `(${item.permission.modulo}.${item.permission.accion})`
                  : '(sin permisos)'}
                {item.submenu && (
                  <span className="text-blue-600"> +{item.submenu.length} subitems</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <button
          className="bg-red-500 text-white px-4 py-2 rounded"
          onClick={() => {
            // Remover este componente del DOM
            const element = document.querySelector('[data-menu-debug]');
            if (element) element.remove();
          }}
        >
          Cerrar Diagnóstico
        </button>
      </div>
    </div>
  );
}
