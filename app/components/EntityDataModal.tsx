'use client';

import Image from 'next/image';

interface Entidad {
  id_empresa: string;
  nombre: string;
  rfc: string;
  logo?: string | null;
  correo?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  sitio_web?: string | null;
  descripcion?: string | null;
  contacto?: string | null;
  estatus?: 'activo' | 'inactivo';
  createdAt?: string;
  updatedAt?: string;
}

interface EntityDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  entidad: Entidad | null;
}

export default function EntityDataModal({ isOpen, onClose, entidad }: EntityDataModalProps) {
  if (!isOpen || !entidad) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full animate-in zoom-in-95 duration-200">
        {/* Header compacto con gradiente */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-5 py-3 rounded-t-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold !text-white">Información de la Entidad</h3>
            <button
              onClick={onClose}
              title="Cerrar"
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1.5 transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Body compacto */}
        <div className="p-5 space-y-4">
          {/* Logo y nombre de la entidad */}
          <div className="flex items-center gap-3 pb-3 border-b border-gray-200 bg-white rounded-lg p-3">
            {entidad.logo ? (
              <div className="relative w-16 h-16 rounded-lg overflow-hidden ring-2 ring-indigo-300 shadow-md bg-white">
                <Image
                  src={entidad.logo}
                  alt={`Logo de ${entidad.nombre}`}
                  fill
                  className="object-contain p-1"
                  sizes="64px"
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center ring-2 ring-indigo-300 shadow-md">
                <svg
                  className="h-8 w-8 text-indigo-600"
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
            <div className="flex-1 min-w-0">
              <h4 className="text-[10px] font-bold text-gray-900 truncate">{entidad.nombre}</h4>
              <p className="text-[9px] text-indigo-600 font-semibold">RFC: {entidad.rfc}</p>
              {entidad.estatus && (
                <div className="mt-1.5">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      entidad.estatus === 'activo'
                        ? 'bg-green-100 !text-gray-900'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {entidad.estatus === 'activo' ? '● Activo' : '● Inactivo'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Información de contacto */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Correo Electrónico
                </p>
                <p className="text-sm text-gray-900 mt-0.5 break-all">
                  {entidad.correo || <span className="text-gray-400 italic">No especificado</span>}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Teléfono
                </p>
                <p className="text-sm text-gray-900 mt-0.5">
                  {entidad.telefono || (
                    <span className="text-gray-400 italic">No especificado</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Información adicional */}
          {(entidad.sitio_web || entidad.descripcion) && (
            <div className="pt-3 border-t border-gray-200 space-y-3">
              {entidad.sitio_web && (
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-indigo-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Sitio Web
                    </p>
                    <a
                      href={entidad.sitio_web}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-indigo-600 hover:text-indigo-700 mt-0.5 inline-flex items-center gap-1 hover:underline"
                    >
                      {entidad.sitio_web}
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  </div>
                </div>
              )}

              {entidad.descripcion && (
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-indigo-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Descripción
                    </p>
                    <p className="text-sm text-gray-900 mt-0.5 break-words">
                      {entidad.descripcion}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer compacto */}
        <div className="bg-gray-50 px-5 py-3 rounded-b-xl">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 !text-white text-sm rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 font-medium shadow-sm"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
