import { SessionCloseClientHelper } from '@/lib/session-close-client';
import SessionFingerprintGenerator from '@/lib/session-fingerprint';
import { signOut, useSession } from 'next-auth/react';
import React from 'react';
import { createPortal } from 'react-dom';
import { LogoutModalProps } from '../types';

/**
 * Componente LogoutModal - Modal de confirmación para cerrar sesión
 *
 * Funcionalidades:
 * - Modal de confirmación con overlay
 * - Animaciones de entrada y salida
 * - Portal para renderizado fuera del DOM padre
 * - Cierre seguro de sesión
 * - Manejo de eventos de teclado
 *
 * @param props - Props del componente LogoutModal
 */
export function LogoutModal({ showLogoutConfirm, setShowLogoutConfirm }: LogoutModalProps) {
  const { data: session } = useSession();

  if (!showLogoutConfirm) return null;

  /**
   * Maneja el cierre de sesión
   */
  const handleLogout = async () => {
    try {
      // 🔧 MEJORA: Sistema mejorado de marcado de logout manual
      if (typeof window !== 'undefined') {
        const timestamp = Date.now().toString();

        // 1. Método original mejorado: sessionStorage
        sessionStorage.setItem('manual-logout', timestamp);

        // 2. 🔧 MEJORA: localStorage como backup persistente
        localStorage.setItem('last-manual-logout', timestamp);

        // 3. 🔧 MEJORA: Registrar logout manual en BD para tracking
        if (session?.user && 'id' in session.user && session.user.id) {
          try {
            const tabId = sessionStorage.getItem('tab-id') || undefined;
            await SessionCloseClientHelper.recordManualLogout(session.user.id as string, tabId);
          } catch (trackingError) {
            console.warn('[LogoutModal] Error registrando tracking:', trackingError);
            // No bloquear el logout si hay error en tracking
          }
        }

        // 4. 🔧 MEJORA: Actualizar fingerprint para reconocimiento posterior
        try {
          await SessionFingerprintGenerator.updateLastActivity();
          // Marcar como logout manual en el fingerprint
          SessionFingerprintGenerator.markManualLogout();
        } catch (fingerprintError) {
          console.warn('[LogoutModal] Error actualizando fingerprint:', fingerprintError);
          // No bloquear el logout si hay error en fingerprint
        }

        // 5. Desconectar SSE antes del logout para evitar recibir eventos DELETE
        const disconnectSSE = (window as unknown as { disconnectSSE?: () => void }).disconnectSSE;
        if (disconnectSSE) {
          disconnectSSE();
        }
      }

      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const target = origin ? `${origin}/login` : '/login';
      await signOut({
        callbackUrl: target,
        redirect: true,
      });
    } catch (error) {
      console.error('[LogoutModal] Error durante logout:', error);
      // Intentar logout básico aunque haya errores
      try {
        await signOut({ redirect: true });
      } catch (fallbackError) {
        console.error('[LogoutModal] Error en logout de emergencia:', fallbackError);
      }
    }
  };

  /**
   * Maneja el cierre del modal
   */
  const handleClose = () => {
    setShowLogoutConfirm(false);
  };

  /**
   * Maneja eventos de teclado
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200"
      onClick={handleClose}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white bg-opacity-15 rounded-full backdrop-blur-sm">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold !text-white">Confirmar Cierre de Sesión</h3>
              <p className="text-sm mt-1 !text-white">¿Estás seguro de que quieres salir?</p>
            </div>
          </div>
        </div>

        {/* Contenido del modal */}
        <div className="px-6 py-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="p-3 bg-amber-50 rounded-full border border-amber-200">
                <svg
                  className="w-6 h-6 text-amber-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Cerrar Sesión</h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                Tu sesión se cerrará de forma segura y serás redirigido a la página de inicio de
                sesión. Cualquier trabajo no guardado se perderá.
              </p>

              {/* Información adicional de seguridad */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-center space-x-2 text-blue-700">
                  <svg
                    className="w-4 h-4 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-sm">
                    <strong>Seguridad:</strong> Tus datos estarán protegidos al cerrar sesión.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-end space-x-3 border-t border-gray-100">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-150"
          >
            Cancelar
          </button>
          <button
            onClick={handleLogout}
            className="px-6 py-2 text-sm font-medium !text-white bg-gradient-to-r from-slate-600 to-slate-700 border border-transparent rounded-lg hover:from-slate-700 hover:to-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all duration-150 flex items-center space-x-2 shadow-sm"
          >
            <svg
              className="w-4 h-4 !text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span className="!text-white">Cerrar Sesión</span>
          </button>
        </div>

        {/* Footer con información de seguridad */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-150">
          <div className="flex items-center justify-center space-x-2 text-xs text-slate-600">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.018-4.382A9.017 9.017 0 0112 3a9.017 9.017 0 01-8.018 6.618A8.979 8.979 0 003 12a8.979 8.979 0 001.982 2.382A9.017 9.017 0 0112 21a9.017 9.017 0 018.018-6.618A8.979 8.979 0 0021 12a8.979 8.979 0 00-1.982-2.382z"
              />
            </svg>
            <span>Cierre de sesión seguro - Sistema protegido</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
