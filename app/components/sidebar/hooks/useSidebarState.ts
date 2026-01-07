import { useState } from 'react';
import { UseSidebarStateReturn } from '../types';

/**
 * Hook personalizado para gestionar el estado de la interfaz del sidebar
 *
 * Maneja:
 * - Estado de submenús expandidos
 * - Estado de menús de usuario y entidad
 * - Estado de modales de confirmación y edición
 *
 * Nota: El estado abierto/cerrado del sidebar principal se maneja
 * a través del SidebarContext para coordinación global con el layout
 *
 * @returns Objeto con estados y funciones para controlar la UI del sidebar
 */
export function useSidebarState(): UseSidebarStateReturn {
  // Estados de submenús y dropdowns
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showEntityMenu, setShowEntityMenu] = useState(false);

  // Estados de modales
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showEditEntityModal, setShowEditEntityModal] = useState(false);

  /**
   * Maneja la expansión/contracción de submenús
   * @param submenuKey - Clave del submenú a alternar
   */
  const toggleSubmenu = (submenuKey: string) => {
    setOpenSubmenu((prev) => (prev === submenuKey ? null : submenuKey));
  };

  /**
   * Cierra todos los menús desplegables abiertos
   */
  const closeAllMenus = () => {
    setShowUserMenu(false);
    setShowEntityMenu(false);
  };

  /**
   * Alterna el menú de usuario
   */
  const toggleUserMenu = () => {
    setShowUserMenu((prev) => !prev);
    if (showEntityMenu) setShowEntityMenu(false);
  };

  /**
   * Alterna el menú de entidad
   */
  const toggleEntityMenu = () => {
    setShowEntityMenu((prev) => !prev);
    if (showUserMenu) setShowUserMenu(false);
  };

  /**
   * Abre el modal de confirmación de logout
   */
  const openLogoutConfirm = () => {
    setShowLogoutConfirm(true);
    closeAllMenus();
  };

  /**
   * Cierra el modal de confirmación de logout
   */
  const closeLogoutConfirm = () => {
    setShowLogoutConfirm(false);
  };

  /**
   * Abre el modal de edición de entidad
   */
  const openEditEntityModal = () => {
    setShowEditEntityModal(true);
    closeAllMenus();
  };

  /**
   * Cierra el modal de edición de entidad
   */
  const closeEditEntityModal = () => {
    setShowEditEntityModal(false);
  };

  return {
    // Estados
    openSubmenu,
    showUserMenu,
    showEntityMenu,
    showLogoutConfirm,
    showEditEntityModal,

    // Acciones
    toggleSubmenu,
    closeAllMenus,
    toggleUserMenu,
    toggleEntityMenu,
    openLogoutConfirm,
    closeLogoutConfirm,
    openEditEntityModal,
    closeEditEntityModal,

    // Setters directos para casos especiales
    setOpenSubmenu,
    setShowUserMenu,
    setShowEntityMenu,
    setShowLogoutConfirm,
    setShowEditEntityModal,
  };
}
