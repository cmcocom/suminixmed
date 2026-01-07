'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex flex-col relative">
      {/* Contenido Principal */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logos Institucionales */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-8 mb-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-blue-200/50 shadow-lg">
                <Image
                  src="/images/Logo UA-ISSSTE.png"
                  alt="Logo UA-ISSSTE"
                  width={80}
                  height={80}
                  className="object-contain w-auto h-auto"
                />
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-blue-200/50 shadow-lg">
                <Image
                  src="/images/Logo ISSSTE.png"
                  alt="Logo ISSSTE"
                  width={120}
                  height={120}
                  className="object-contain w-auto h-auto"
                />
              </div>
            </div>
          </div>

          {/* Error 404 */}
          <div className="relative">
            {/* Elementos decorativos de fondo */}
            <div className="absolute inset-0 flex items-center justify-center opacity-5">
              <div className="text-[20rem] font-bold text-gray-300 select-none">404</div>
            </div>

            {/* Contenido principal del error */}
            <div className="relative z-10 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100 p-12 mx-4">
              <div className="mb-8">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-100 rounded-full mb-6">
                  <svg
                    className="w-12 h-12 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 20c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                    />
                  </svg>
                </div>

                <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>

                <h2 className="text-3xl font-semibold text-gray-700 mb-6">Página no encontrada</h2>

                <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                  La página que buscas no existe o ha sido movida.
                  <br />
                  Esto puede ocurrir cuando se accede a una URL incorrecta o cuando un recurso ya no
                  está disponible.
                </p>
              </div>

              {/* Acciones */}
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-8">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                  <span>Ir al Dashboard</span>
                </Link>

                <button
                  onClick={() => router.back()}
                  className="inline-flex items-center space-x-2 bg-white hover:bg-gray-50 text-gray-700 font-semibold px-8 py-4 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-all duration-200 transform hover:scale-105 shadow-md"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  <span>Volver Atrás</span>
                </button>
              </div>

              {/* Información adicional */}
              <div className="border-t border-gray-200 pt-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">¿Necesitas ayuda?</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                  <div className="text-center p-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
                      <svg
                        className="w-6 h-6 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 20c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                        />
                      </svg>
                    </div>
                    <h4 className="font-medium text-gray-800 mb-1">Verifica la URL</h4>
                    <p className="text-sm text-gray-600">
                      Asegúrate de que la dirección esté escrita correctamente
                    </p>
                  </div>

                  <div className="text-center p-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
                      <svg
                        className="w-6 h-6 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                    </div>
                    <h4 className="font-medium text-gray-800 mb-1">Recarga la página</h4>
                    <p className="text-sm text-gray-600">
                      A veces un simple F5 puede resolver el problema
                    </p>
                  </div>

                  <div className="text-center p-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
                      <svg
                        className="w-6 h-6 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 109.75 9.75A9.75 9.75 0 0012 2.25z"
                        />
                      </svg>
                    </div>
                    <h4 className="font-medium text-gray-800 mb-1">Contacta al Soporte</h4>
                    <p className="text-sm text-gray-600">
                      Si el problema persiste, contacta al administrador
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pie de página */}
      <footer className="bg-gray-50/80 backdrop-blur-sm border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
            {/* Copyright y derechos */}
            <div className="text-center md:text-left">
              <p className="text-sm text-gray-600">© 2025 Sistema de Gestión de Abasto - ISSSTE</p>
              <p className="text-xs text-gray-500 mt-1">
                Unidad Administrativa - Todos los derechos reservados
              </p>
            </div>

            {/* Información del sistema */}
            <div className="text-center md:text-right">
              <p className="text-sm text-gray-500">
                Desarrollado con
                <span className="font-semibold text-blue-600 mx-1">SuminixMED</span>
                por
                <span className="font-semibold text-gray-700 ml-1">Unidad C</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Plataforma especializada en gestión de abasto médico
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
