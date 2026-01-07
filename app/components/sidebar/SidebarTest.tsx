'use client';

import { useEffect, useState } from 'react';

// Componente de prueba para verificar nueva arquitectura RBAC
export function SidebarTest() {
  const [visibilityData, setVisibilityData] = useState<Record<string, boolean> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // Simulación de configuración de visibilidad para rol OPERADOR
        const operatorVisibility = {
          DASHBOARD: true,
          ENTRADAS: true,
          SALIDAS: true,
          INVENTARIOS_FISICOS: true,
          CATALOGOS_PRODUCTOS: true,
          CATALOGOS_CLIENTES: true,
          REPORTES_INVENTARIO: true,
          // Módulos ocultos para OPERADOR
          AJUSTES_RBAC: false,
          AJUSTES_USUARIOS: false,
          GESTION_RESPALDOS: false,
          CATALOGOS_PROVEEDORES: false,
          CATALOGOS_EMPLEADOS: false,
        };

        // Simular carga de datos de visibilidad
        await new Promise((resolve) => setTimeout(resolve, 500));
        setVisibilityData(operatorVisibility);
      } catch (error) {
        console.error('Error cargando datos de visibilidad:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-4 border rounded bg-gray-50">
        <h3 className="font-semibold text-lg mb-2">🧪 Test RBAC V2</h3>
        <div>Cargando...</div>
      </div>
    );
  }

  if (!visibilityData) {
    return (
      <div className="p-4 border rounded bg-red-50">
        <h3 className="font-semibold text-lg mb-2">❌ Error</h3>
        <div>No se pudo cargar la configuración de visibilidad</div>
      </div>
    );
  }

  const visibleModules = Object.entries(visibilityData)
    .filter(([_, isVisible]) => isVisible)
    .map(([moduleKey, _]) => moduleKey);

  const hiddenModules = Object.entries(visibilityData)
    .filter(([_, isVisible]) => !isVisible)
    .map(([moduleKey, _]) => moduleKey);

  return (
    <div className="p-4 border rounded bg-gray-50">
      <h3 className="font-semibold text-lg mb-2">🧪 Test RBAC V2 - Rol OPERADOR</h3>
      <p className="text-sm text-gray-600 mb-3">
        Nueva arquitectura: Permisos separados de visibilidad
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium text-green-700 mb-2">
            ✅ Módulos Visibles ({visibleModules.length})
          </h4>
          <div className="space-y-1 text-xs">
            {visibleModules.map((moduleKey) => (
              <div key={`visible-${moduleKey}`} className="flex items-center space-x-2">
                <span className="text-green-500">●</span>
                <span className="font-mono">{moduleKey}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-medium text-gray-600 mb-2">
            👁️‍🗨️ Módulos Ocultos ({hiddenModules.length})
          </h4>
          <div className="space-y-1 text-xs">
            {hiddenModules.map((moduleKey) => (
              <div key={`hidden-${moduleKey}`} className="flex items-center space-x-2">
                <span className="text-gray-400">○</span>
                <span className="font-mono text-gray-500">{moduleKey}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 p-2 bg-blue-50 rounded text-xs text-blue-700">
        <strong>🎯 Arquitectura V2:</strong> Los módulos ocultos mantienen permisos de API activos
      </div>
    </div>
  );
}
