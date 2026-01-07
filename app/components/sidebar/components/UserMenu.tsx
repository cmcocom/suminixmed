import React, { useState } from 'react';
import Image from 'next/image';
import { KeyIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { UserMenuProps, ExtendedUser } from '../types';
import { formatearRol } from '../constants';
import ChangePasswordModal from '../../ChangePasswordModal';
import ChangeUserImageModal from '../../ChangeUserImageModal';

/**
 * Componente UserMenu - Sección de usuario en la parte inferior del sidebar
 *
 * Funcionalidades:
 * - Muestra avatar e información del usuario
 * - Opciones para cambiar contraseña y cerrar sesión
 * - Responsive según el estado del sidebar
 * - Indicador de estado online
 *
 * @param props - Props del componente UserMenu
 */
export function UserMenu({
  user,
  userImage,
  showUserMenu,
  setShowUserMenu,
  setShowLogoutConfirm,
  isSidebarOpen,
}: UserMenuProps) {
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showChangeImageModal, setShowChangeImageModal] = useState(false);

  const handleChangePassword = () => {
    setShowChangePasswordModal(true);
    setShowUserMenu(false);
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  return (
    <>
      <div className="mt-auto border-t border-slate-600/30 bg-slate-800/30 backdrop-blur-sm overflow-hidden">
        {/* Tarjeta de Usuario Compacta */}
        <div className={`p-2 user-dropdown overflow-hidden ${!isSidebarOpen && 'lg:px-2'}`}>
          <div
            className={`rounded-lg transition-all duration-300 backdrop-blur-sm overflow-hidden sidebar-user-container ${!isSidebarOpen && 'lg:p-1'}`}
          >
            {/* Información del usuario - Clickeable */}
            <div
              className={`flex items-center gap-2 p-2 hover:bg-slate-700/60 cursor-pointer rounded-lg transition-all duration-200 border border-transparent hover:border-slate-600/30 overflow-hidden ${!isSidebarOpen && 'lg:justify-center lg:p-1.5'}`}
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              {/* Avatar con indicador online */}
              <div
                className="relative flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowChangeImageModal(true);
                }}
                title="Cambiar imagen de perfil"
              >
                {userImage ? (
                  <div
                    className={`relative ${!isSidebarOpen ? 'w-8 h-8' : 'w-9 h-9'} rounded-full overflow-hidden ring-2 ring-slate-400/20 avatar-container cursor-pointer hover:ring-blue-400 transition-all duration-200`}
                  >
                    <Image
                      src={userImage}
                      alt="Foto de perfil"
                      fill
                      className="object-cover overflow-hidden-images"
                      sizes={!isSidebarOpen ? '32px' : '36px'}
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div
                    className={`${!isSidebarOpen ? 'w-8 h-8' : 'w-9 h-9'} bg-gradient-to-br from-slate-500 via-slate-600 to-slate-700 rounded-full flex items-center justify-center ring-2 ring-slate-400/20 cursor-pointer hover:ring-blue-400 transition-all duration-200`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`${!isSidebarOpen ? 'h-4 w-4' : 'h-5 w-5'} text-slate-100`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                )}
                {/* Indicador de estado online */}
                <div
                  className={`absolute -bottom-0.5 -right-0.5 ${!isSidebarOpen ? 'w-2 h-2' : 'w-2.5 h-2.5'} rounded-full sidebar-online-indicator border-2 border-slate-800`}
                ></div>
              </div>

              {/* Información del usuario */}
              <div className={`flex-1 min-w-0 overflow-hidden ${!isSidebarOpen && 'lg:hidden'}`}>
                <div className="flex items-center justify-between gap-1 overflow-hidden">
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <p className="text-xs font-medium truncate sidebar-user-name leading-tight">
                      {user?.name || 'Usuario'}
                    </p>
                    {(user as ExtendedUser)?.rol && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] sidebar-user-role mt-0.5">
                        {formatearRol((user as ExtendedUser).rol!).label}
                      </span>
                    )}
                  </div>

                  {/* Indicador de dropdown */}
                  <svg
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 flex-shrink-0 ${showUserMenu ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Dropdown del Usuario - Opción de cambiar contraseña */}
            {showUserMenu && (
              <div
                className={`mx-2 mb-2 bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-600/40 ${!isSidebarOpen && 'lg:hidden'}`}
              >
                <div className="p-1">
                  <button
                    onClick={handleChangePassword}
                    className="w-full flex items-center px-2 py-1.5 text-xs rounded-md transition-all duration-200 group sidebar-user-option"
                  >
                    <KeyIcon className="w-3.5 h-3.5 mr-2 text-slate-400 group-hover:text-slate-300" />
                    Cambiar Contraseña
                  </button>
                </div>
              </div>
            )}

            {/* Botón Cerrar Sesión - Compacto */}
            <div className={`px-2 pb-2 ${!isSidebarOpen && 'lg:hidden'}`}>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center px-2 py-1.5 text-xs rounded-lg transition-all duration-200 group sidebar-logout-button"
                title="Cerrar sesión"
              >
                <ArrowRightOnRectangleIcon className="w-3.5 h-3.5 mr-1.5 group-hover:scale-110 transition-transform !text-black" />
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para cambiar contraseña */}
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />

      {/* Modal para cambiar imagen de perfil */}
      <ChangeUserImageModal
        isOpen={showChangeImageModal}
        onClose={() => setShowChangeImageModal(false)}
        currentImage={userImage || null}
      />
    </>
  );
}
