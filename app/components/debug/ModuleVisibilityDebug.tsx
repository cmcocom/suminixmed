'use client';

import { useModuleVisibility } from '@/app/contexts/ModuleVisibilityContext';
import { useSession } from 'next-auth/react';
import React from 'react';

/**
 * Componente de depuración para visualizar el estado de module visibility
 * TEMPORAL - Solo para debugging del problema de ADMINISTRADOR sin menú
 */
export default function ModuleVisibilityDebug() {
  const { moduleVisibility, effectiveVisibility, isLoading } = useModuleVisibility();
  const { data: session, status } = useSession();

  const [isOpen, setIsOpen] = React.useState(false);

  if (status !== 'authenticated') {
    return null;
  }

  const user = session?.user as any;
  const visibleModules = Object.entries(moduleVisibility).filter(([, v]) => v);
  const hiddenModules = Object.entries(moduleVisibility).filter(([, v]) => !v);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Botón flotante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-full shadow-lg"
        title="Debug Module Visibility"
      >
        🐛 Debug
      </button>

      {/* Panel de debug */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-96 max-h-[600px] overflow-y-auto bg-gray-900 border-2 border-red-500 rounded-lg shadow-2xl p-4 text-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-red-400 font-bold text-lg">🐛 Module Visibility Debug</h3>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
              ✕
            </button>
          </div>

          {/* Usuario actual */}
          <div className="mb-4 p-3 bg-gray-800 rounded">
            <div className="text-yellow-400 font-semibold mb-2">👤 Usuario Actual:</div>
            <div className="text-white text-xs space-y-1">
              <div>
                <strong>Nombre:</strong> {user?.name || 'N/A'}
              </div>
              <div>
                <strong>Email:</strong> {user?.email || 'N/A'}
              </div>
              <div>
                <strong>ID:</strong> {user?.id || 'N/A'}
              </div>
            </div>
          </div>

          {/* Estado de carga */}
          <div className="mb-4 p-3 bg-gray-800 rounded">
            <div className="text-blue-400 font-semibold mb-2">📊 Estado:</div>
            <div className="text-white text-xs space-y-1">
              <div>
                <strong>isLoading:</strong> {isLoading ? '⏳ Sí' : '✅ No'}
              </div>
              <div>
                <strong>Módulos cargados:</strong> {Object.keys(moduleVisibility).length}
              </div>
              <div>
                <strong>Visibles:</strong> {visibleModules.length}
              </div>
              <div>
                <strong>Ocultos:</strong> {hiddenModules.length}
              </div>
            </div>
          </div>

          {/* Módulos visibles */}
          <div className="mb-4 p-3 bg-gray-800 rounded">
            <div className="text-green-400 font-semibold mb-2">
              ✅ Módulos Visibles ({visibleModules.length}):
            </div>
            <div className="text-xs text-green-200 space-y-1">
              {visibleModules.length === 0 ? (
                <div className="text-red-400 font-bold">⚠️ ¡NINGUNO! Este es el problema</div>
              ) : (
                visibleModules.map(([key]) => <div key={key}>• {key}</div>)
              )}
            </div>
          </div>

          {/* Módulos ocultos */}
          <div className="mb-4 p-3 bg-gray-800 rounded">
            <div className="text-red-400 font-semibold mb-2">
              ❌ Módulos Ocultos ({hiddenModules.length}):
            </div>
            <div className="text-xs text-red-200 space-y-1 max-h-40 overflow-y-auto">
              {hiddenModules.length === 0 ? (
                <div className="text-gray-400">Ninguno</div>
              ) : (
                hiddenModules.map(([key]) => <div key={key}>• {key}</div>)
              )}
            </div>
          </div>

          {/* Effective Visibility */}
          <div className="mb-4 p-3 bg-gray-800 rounded">
            <div className="text-purple-400 font-semibold mb-2">🎯 Effective Visibility:</div>
            <div className="text-xs text-white space-y-1">
              <div>
                <strong>Total:</strong> {Object.keys(effectiveVisibility).length}
              </div>
              <div>
                <strong>Activos:</strong>{' '}
                {Object.entries(effectiveVisibility).filter(([, v]) => v).length}
              </div>
            </div>
          </div>

          {/* localStorage */}
          <div className="mb-4 p-3 bg-gray-800 rounded">
            <div className="text-orange-400 font-semibold mb-2">💾 localStorage:</div>
            <div className="text-xs text-white space-y-1">
              {typeof window !== 'undefined' ? (
                <>
                  <div>
                    <strong>Tiene cache:</strong>{' '}
                    {localStorage.getItem('moduleVisibility') ? 'Sí' : 'No'}
                  </div>
                  <button
                    onClick={() => {
                      localStorage.removeItem('moduleVisibility');
                      alert('Cache eliminado. Recarga la página (F5)');
                    }}
                    className="mt-2 bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-xs"
                  >
                    🗑️ Limpiar Cache
                  </button>
                </>
              ) : (
                <div>Window no disponible</div>
              )}
            </div>
          </div>

          {/* Acciones */}
          <div className="p-3 bg-gray-800 rounded">
            <div className="text-cyan-400 font-semibold mb-2">🔧 Acciones:</div>
            <div className="space-y-2">
              <button
                onClick={() => {
                  // Debug logging disabled in production
                  if (process.env.NODE_ENV === 'development') {
                    console.log('='.repeat(80));
                    console.log('🐛 MODULE VISIBILITY DEBUG');
                    console.log('='.repeat(80));
                    console.log('Usuario:', user);
                    console.log('moduleVisibility:', moduleVisibility);
                    console.log('effectiveVisibility:', effectiveVisibility);
                    console.log('isLoading:', isLoading);
                    console.log('='.repeat(80));
                  }
                  alert(
                    'Datos de debug ' +
                      (process.env.NODE_ENV === 'development'
                        ? 'volcados a la consola del navegador (F12)'
                        : 'no disponibles en producción')
                  );
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
              >
                📋 Volcar a Consola
              </button>
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    localStorage.removeItem('moduleVisibility');
                    window.location.reload();
                  }
                }}
                className="w-full bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs"
              >
                🔄 Limpiar + Recargar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
