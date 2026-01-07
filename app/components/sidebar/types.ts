/**
 * @fileoverview Tipos e interfaces para el componente Sidebar
 * @description Contiene todas las definiciones de tipos TypeScript extraídas del Sidebar.tsx original
 * @author Sistema de refactorización
 * @date 2025-09-15
 */

import { TipoRol } from '@/lib/tipo-rol';
import React from 'react';

// ==== INTERFACES DE USUARIO ====

/**
 * Usuario extendido con información de sesión
 * @interface ExtendedUser
 */
export interface ExtendedUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  rol?: TipoRol;
}

// ==== INTERFACES DE ENTIDAD ====

/**
 * Entidad del sistema con información completa
 * @interface Entidad
 */
export interface Entidad {
  id_empresa: string;
  nombre: string;
  rfc: string;
  logo?: string;
  tiempo_sesion_minutos: number;
  estatus: 'activo' | 'inactivo';
  correo?: string;
  telefono?: string;
  contacto?: string;
  licencia_usuarios_max?: number;
}

/**
 * Datos del formulario de entidad
 * @interface FormData
 */
export interface FormData {
  nombre: string;
  rfc: string;
  correo: string;
  telefono: string;
  contacto: string;
  licencia: string;
  logo: string;
  tiempo_sesion_minutos: number;
  estatus: 'activo' | 'inactivo';
}

// ==== INTERFACES DE REPORTES ====

/**
 * Reporte generado dinámicamente
 * @interface GeneratedReport
 */
export interface GeneratedReport {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  allowedRoles: string[];
  icon?: string; // Nombre del icono de HeroIcons
}

// ==== INTERFACES DE MENÚ ====

/**
 * Configuración de permisos para elementos del menú
 * @interface MenuPermission
 */
export interface MenuPermission {
  modulo: string;
  accion: string;
}

/**
 * Elemento de submenú
 * @interface SubMenuItem
 */
export interface SubMenuItem {
  title: string;
  href: string;
  permission?: MenuPermission;
  icon?: React.ComponentType<{ className?: string }>;
}

/**
 * Elemento principal del menú de navegación
 * @interface MenuItem
 */
export interface MenuItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: MenuPermission;
  submenu?: SubMenuItem[];
  badge?: string; // Texto de badge opcional (ej: "NUEVO", "BETA")
}

// ==== TIPOS DE ESTADO ====

/**
 * Estados de validación de email
 * @type EmailValidationState
 */
export type EmailValidationState = 'idle' | 'validating' | 'valid' | 'error';

/**
 * Tipos de toast/notificación
 * @type ToastType
 */
export type ToastType = 'success' | 'error' | 'info' | 'warning';

/**
 * Estados del sidebar
 * @interface SidebarState
 */
export interface SidebarState {
  isSidebarOpen: boolean;
  openSubmenu: string | null;
  showUserMenu: boolean;
  showEntityMenu: boolean;
  showLogoutConfirm: boolean;
  showEditEntityModal: boolean;
}

/**
 * Estados del formulario de entidad
 * @interface EntityFormState
 */
export interface EntityFormState {
  formData: FormData;
  formErrors: Record<string, string>;
  submitLoading: boolean;
  isValidatingEmail: boolean;
  validationError: string | null;
  emailValidationState: EmailValidationState;
}

// ==== PROPS DE COMPONENTES ====

/**
 * Props para el componente UserMenu
 * @interface UserMenuProps
 */
export interface UserMenuProps {
  user: ExtendedUser | null;
  userImage: string | null | undefined;
  showUserMenu: boolean;
  setShowUserMenu: (show: boolean) => void;
  setShowLogoutConfirm: (show: boolean) => void;
  isSidebarOpen: boolean;
}

/**
 * Props para el componente EntitySelector
 * @interface EntitySelectorProps
 */
export interface EntitySelectorProps {
  entidadActiva: Entidad | null;
  showEntityMenu: boolean;
  setShowEntityMenu: (show: boolean) => void;
  isSidebarOpen: boolean;
  loadingEntidad?: boolean;
}

/**
 * Props para el componente NavigationMenu
 * @interface NavigationMenuProps
 */
export interface NavigationMenuProps {
  isSidebarOpen: boolean;
  openSubmenu: string | null;
  toggleSubmenu: (submenu: string) => void;
  generatedReports: GeneratedReport[];
  tienePermiso?: (modulo: string, accion: string) => boolean; // 🆕 RBAC V2: opcional
  moduleVisibility?: Record<string, boolean>;
  isSystemUser?: boolean;
  permissionsLoading?: boolean;
  onMenuClick?: () => void;
}

/**
 * Props para el componente LogoutModal
 * @interface LogoutModalProps
 */
export interface LogoutModalProps {
  showLogoutConfirm: boolean;
  setShowLogoutConfirm: (show: boolean) => void;
}

/**
 * Props para el componente EntityEditModal
 * @interface EntityEditModalProps
 */
export interface EntityEditModalProps {
  showEditEntityModal: boolean;
  setShowEditEntityModal: (show: boolean) => void;
  entidadActiva: Entidad | null;
  setEntidadActiva: (entidad: Entidad | null) => void;
  formState: EntityFormState;
  setFormState: (state: Partial<EntityFormState>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

// ==== TIPOS DE HOOKS ====

/**
 * Retorno del hook useSidebarState
 * @interface UseSidebarStateReturn
 */
export interface UseSidebarStateReturn {
  // Estados (sin isSidebarOpen que se maneja en SidebarContext)
  openSubmenu: string | null;
  showUserMenu: boolean;
  showEntityMenu: boolean;
  showLogoutConfirm: boolean;
  showEditEntityModal: boolean;

  // Acciones
  toggleSubmenu: (submenuKey: string) => void;
  closeAllMenus: () => void;
  toggleUserMenu: () => void;
  toggleEntityMenu: () => void;
  openLogoutConfirm: () => void;
  closeLogoutConfirm: () => void;
  openEditEntityModal: () => void;
  closeEditEntityModal: () => void;

  // Setters directos para casos especiales
  setOpenSubmenu: (submenu: string | null) => void;
  setShowUserMenu: (show: boolean) => void;
  setShowEntityMenu: (show: boolean) => void;
  setShowLogoutConfirm: (show: boolean) => void;
  setShowEditEntityModal: (show: boolean) => void;
}

/**
 * Retorno del hook useEntityManagement
 * @interface UseEntityManagementReturn
 */
export interface UseEntityManagementReturn {
  // Estados de entidad
  entidadActiva: Entidad | null;
  setEntidadActiva: (entidad: Entidad | null) => void;
  loadingEntidad: boolean;

  // Estados del formulario
  formData: FormData;
  setFormData: (data: FormData | ((prev: FormData) => FormData)) => void;
  formErrors: Record<string, string>;
  setFormErrors: (
    errors: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)
  ) => void;
  submitLoading: boolean;
  setSubmitLoading: (loading: boolean) => void;
  isValidatingEmail: boolean;
  validationError: string | null;
  setValidationError: (error: string | null) => void;
  emailValidationState: EmailValidationState;

  // Funciones de validación
  validateEmailUnique: (email: string, entidadId?: string) => Promise<boolean>;
  validateForm: () => boolean;

  // Funciones de formulario
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  resetForm: () => void;
  loadEntityToForm: (entidad: Entidad) => void;

  // Notificaciones
  showToast: (message: string, type: ToastType) => void;
}

/**
 * Retorno del hook useGeneratedReports
 * @interface UseGeneratedReportsReturn
 */
export interface UseGeneratedReportsReturn {
  generatedReports: GeneratedReport[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}
