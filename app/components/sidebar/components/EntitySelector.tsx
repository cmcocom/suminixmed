import React, { useState } from 'react';
import Image from 'next/image';
import { EntitySelectorProps } from '../types';
import EntityDataModal from '../../EntityDataModal';

/**
 * Componente EntitySelector - Selector y visualizador de entidad activa
 *
 * Funcionalidades:
 * - Muestra información de la entidad activa
 * - Logo de la entidad o placeholder
 * - Modal compacto con información detallada
 * - Estados de carga
 * - Responsive según estado del sidebar
 *
 * @param props - Props del componente EntitySelector
 */
export function EntitySelector({
  entidadActiva,
  showEntityMenu: _showEntityMenu,
  setShowEntityMenu: _setShowEntityMenu,
  isSidebarOpen,
  loadingEntidad = false,
}: EntitySelectorProps) {
  const [showEntityModal, setShowEntityModal] = useState(false);

  const handleEntityClick = () => {
    if (entidadActiva) {
      setShowEntityModal(true);
    }
  };

  return (
    <>
      <div className="border-b border-slate-600/30 pb-4 bg-slate-800/30">
        <div className="px-4">
          <div
            className={`flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-700/70 transition-all duration-300 cursor-pointer backdrop-blur-sm border border-slate-700/30 hover:border-slate-600/50 hover:shadow-lg ${!isSidebarOpen && 'lg:justify-center lg:p-2'}`}
            onClick={handleEntityClick}
            title={entidadActiva ? 'Ver información completa de la entidad' : undefined}
          >
            {entidadActiva ? (
              <>
                {/* Logo de la entidad */}
                <div className="relative">
                  {entidadActiva.logo ? (
                    <div
                      className={`relative ${!isSidebarOpen ? 'w-8 h-8 lg:w-8 lg:h-8' : 'w-12 h-12'} rounded-lg overflow-hidden`}
                    >
                      <Image
                        src={entidadActiva.logo}
                        alt={`Logo de ${entidadActiva.nombre}`}
                        fill
                        className="object-cover"
                        sizes={!isSidebarOpen ? '32px' : '48px'}
                      />
                    </div>
                  ) : (
                    <div
                      className={`${!isSidebarOpen ? 'w-8 h-8 lg:w-8 lg:h-8' : 'w-12 h-12'} rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center border-2 border-slate-500/50 shadow-lg`}
                    >
                      <svg
                        className={`${!isSidebarOpen ? 'h-4 w-4' : 'h-6 w-6'} text-slate-200`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Información de la entidad */}
                <div className={`flex-1 min-w-0 ${!isSidebarOpen && 'lg:hidden'}`}>
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm truncate sidebar-entity-name">{entidadActiva.nombre}</p>
                      <p className="text-xs truncate sidebar-entity-rfc">
                        RFC: {entidadActiva.rfc}
                      </p>
                      <p className="text-xs truncate sidebar-entity-powered">Powered by Unidad C</p>
                    </div>

                    {/* Botón indicador de más info */}
                    <button
                      className="p-1 rounded-md hover:bg-slate-600/50 transition-all duration-200 hover:shadow-md"
                      aria-label="Ver información completa"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEntityClick();
                      }}
                    >
                      <svg
                        className="w-4 h-4 text-slate-300 hover:text-white transition-colors"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Fallback cuando no hay entidad cargada */}
                <div className="relative">
                  <div
                    className={`${!isSidebarOpen ? 'w-8 h-8 lg:w-8 lg:h-8' : 'w-12 h-12'} rounded-lg ${loadingEntidad ? 'bg-gradient-to-br from-slate-600 to-slate-700 animate-pulse' : 'bg-gradient-to-br from-red-500 to-red-600'} flex items-center justify-center border-2 ${loadingEntidad ? 'border-slate-500/50' : 'border-red-400/50'} shadow-lg`}
                  >
                    {loadingEntidad ? (
                      <svg
                        className={`${!isSidebarOpen ? 'h-4 w-4' : 'h-6 w-6'} text-slate-200 animate-pulse`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                    ) : (
                      <span className="text-white font-bold text-lg drop-shadow-sm">!</span>
                    )}
                  </div>
                </div>
                <div className={`flex-1 min-w-0 ${!isSidebarOpen && 'lg:hidden'}`}>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm truncate sidebar-entity-name">
                      {loadingEntidad ? 'Cargando...' : 'Sin entidad configurada'}
                    </p>
                    <p className="text-xs truncate sidebar-entity-rfc">
                      {loadingEntidad ? 'Obteniendo información' : 'Configure una entidad activa'}
                    </p>
                    <p className="text-xs truncate sidebar-entity-powered">
                      {loadingEntidad ? 'by SuminixMED' : 'Powered by Unidad C'}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal con información completa de la entidad */}
      <EntityDataModal
        isOpen={showEntityModal}
        onClose={() => setShowEntityModal(false)}
        entidad={entidadActiva}
      />
    </>
  );
}
