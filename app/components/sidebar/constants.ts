/**
 * @fileoverview Constantes y configuraciones del Sidebar
 * @description Contiene todas las configuraciones estáticas extraídas del Sidebar.tsx original
 * @author Sistema de refactorización
 * @date 2025-09-15
 */

import { TipoRol } from '@/lib/tipo-rol';
import {
  ArchiveBoxIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  BuildingOfficeIcon,
  ChartBarIcon,
  CheckIcon,
  CircleStackIcon,
  ClipboardDocumentCheckIcon,
  CogIcon,
  CubeIcon,
  DocumentDuplicateIcon,
  DocumentTextIcon,
  FolderIcon,
  ShieldCheckIcon,
  TagIcon,
  TruckIcon,
  UserGroupIcon,
  UserIcon,
  UsersIcon,
  WrenchScrewdriverIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { MenuItem } from './types';

// ==== CONFIGURACIÓN DEL MENÚ DE NAVEGACIÓN ====

/**
 * Elementos principales del menú de navegación del sidebar
 * CRÍTICO: No modificar los permisos sin revisar con el equipo de seguridad
 * @constant menuItems
 */
export const menuItems: MenuItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: ChartBarIcon,
    permission: { modulo: 'DASHBOARD', accion: 'LEER' },
  },
  {
    title: 'Solicitudes',
    href: '/dashboard/solicitudes',
    icon: DocumentTextIcon,
    permission: { modulo: 'SOLICITUDES', accion: 'LEER' },
  },
  {
    title: 'Surtido',
    href: '/dashboard/surtido',
    icon: WrenchScrewdriverIcon,
    permission: { modulo: 'SURTIDO', accion: 'LEER' },
  },
  {
    title: 'Entradas',
    href: '/dashboard/entradas',
    icon: ArrowDownTrayIcon,
    permission: { modulo: 'ENTRADAS', accion: 'LEER' },
  },
  {
    title: 'Salidas',
    href: '/dashboard/salidas',
    icon: ArrowRightOnRectangleIcon,
    permission: { modulo: 'SALIDAS', accion: 'LEER' },
  },
  {
    title: 'Reportes',
    href: '#',
    icon: ChartBarIcon,
    permission: { modulo: 'REPORTES', accion: 'LEER' },
    submenu: [
      {
        title: 'Inventario',
        href: '/dashboard/reportes/inventario',
        icon: CubeIcon,
        permission: { modulo: 'REPORTES_INVENTARIO', accion: 'LEER' },
      },
      {
        title: 'Entradas por Proveedor',
        href: '/dashboard/reportes/entradas-cliente',
        icon: ArrowDownTrayIcon,
        permission: { modulo: 'REPORTES_ENTRADAS_CLIENTE', accion: 'LEER' },
      },
      {
        title: 'Salidas por Cliente',
        href: '/dashboard/reportes/salidas-cliente',
        icon: UserGroupIcon,
        permission: { modulo: 'REPORTES_SALIDAS_CLIENTE', accion: 'LEER' },
      },
      {
        title: 'Rotación de Productos',
        href: '/dashboard/reportes/rotacion-productos',
        icon: ArrowPathIcon,
        permission: { modulo: 'REPORTES_ROTACION_PRODUCTOS', accion: 'LEER' },
      },
    ],
  },
  {
    title: 'Stock Fijo',
    href: '/dashboard/stock-fijo',
    icon: CheckIcon,
    permission: { modulo: 'STOCK_FIJO', accion: 'LEER' },
  },
  {
    title: 'Inventarios Físicos',
    href: '/dashboard/inventarios',
    icon: ClipboardDocumentCheckIcon,
    permission: { modulo: 'INVENTARIOS_FISICOS', accion: 'LEER' },
  },
  {
    title: 'Catálogos',
    href: '#catalogos',
    icon: ArchiveBoxIcon,
    permission: { modulo: 'CATALOGOS', accion: 'LEER' },
    submenu: [
      {
        title: 'Productos',
        href: '/dashboard/productos',
        icon: CubeIcon,
        permission: { modulo: 'CATALOGOS_PRODUCTOS', accion: 'LEER' },
      },
      {
        title: 'Categorías',
        href: '/dashboard/categorias',
        icon: TagIcon,
        permission: { modulo: 'CATALOGOS_CATEGORIAS', accion: 'LEER' },
      },
      {
        title: 'Clientes',
        href: '/dashboard/clientes',
        icon: UserGroupIcon,
        permission: { modulo: 'CATALOGOS_CLIENTES', accion: 'LEER' },
      },
      {
        title: 'Proveedores',
        href: '/dashboard/proveedores',
        icon: TruckIcon,
        permission: { modulo: 'CATALOGOS_PROVEEDORES', accion: 'LEER' },
      },
      {
        title: 'Empleados',
        href: '/dashboard/empleados',
        icon: UserIcon,
        permission: { modulo: 'CATALOGOS_EMPLEADOS', accion: 'LEER' },
      },
      {
        title: 'Tipos de Entrada',
        href: '/dashboard/catalogos/tipos-entrada',
        icon: ArrowDownTrayIcon,
        permission: { modulo: 'CATALOGOS_TIPOS_ENTRADA', accion: 'LEER' },
      },
      {
        title: 'Tipos de Salida',
        href: '/dashboard/catalogos/tipos-salida',
        icon: ArrowRightOnRectangleIcon,
        permission: { modulo: 'CATALOGOS_TIPOS_SALIDA', accion: 'LEER' },
      },
      {
        title: 'Almacenes',
        href: '/dashboard/almacenes',
        icon: BuildingOfficeIcon,
        permission: { modulo: 'CATALOGOS_ALMACENES', accion: 'LEER' },
      },
    ],
  },
  {
    title: 'Ajustes',
    href: '#ajustes',
    icon: CogIcon,
    permission: { modulo: 'AJUSTES', accion: 'LEER' },
    submenu: [
      {
        title: 'Usuarios',
        href: '/dashboard/usuarios',
        icon: UsersIcon,
        permission: { modulo: 'AJUSTES_USUARIOS', accion: 'LEER' },
      },
      {
        title: 'Roles y Permisos',
        href: '/dashboard/usuarios/rbac',
        icon: ShieldCheckIcon,
        permission: { modulo: 'AJUSTES_RBAC', accion: 'LEER' },
      },
      {
        title: 'Auditoría del Sistema',
        href: '/dashboard/auditoria',
        icon: ClipboardDocumentCheckIcon,
        permission: { modulo: 'AJUSTES_AUDITORIA', accion: 'LEER' },
      },
      {
        title: 'Gestión de Catálogos',
        href: '/dashboard/ajustes/catalogos',
        icon: FolderIcon,
        permission: { modulo: 'GESTION_CATALOGOS', accion: 'LEER' },
      },
      {
        title: 'Gestión de Reportes',
        href: '/dashboard/ajustes/generador-reportes',
        icon: DocumentDuplicateIcon,
        permission: { modulo: 'GESTION_REPORTES', accion: 'LEER' },
      },
      {
        title: 'Entidades',
        href: '/dashboard/ajustes/entidades',
        icon: BuildingOfficeIcon,
        permission: { modulo: 'AJUSTES_ENTIDAD', accion: 'LEER' }, // ✅ Actualizado de ENTIDADES
      },
      {
        title: 'Respaldos de Base de Datos',
        href: '/dashboard/ajustes/respaldos',
        icon: CircleStackIcon,
        permission: { modulo: 'GESTION_RESPALDOS', accion: 'LEER' }, // ✅ Actualizado de RESPALDOS
      },
    ],
  },
];

// ==== CONFIGURACIÓN DE ROLES ====

/**
 * Configuración visual y textual para los diferentes roles del sistema
 * CRÍTICO: Mantener sincronizado con enum TipoRol de Prisma
 * NOTA: DESARROLLADOR y COLABORADOR han sido removidos del sistema
 * @constant ROLE_CONFIG
 */
export const ROLE_CONFIG = {
  [TipoRol.OPERADOR]: {
    label: 'Operador',
    color: 'bg-blue-100 text-blue-800',
  },
  [TipoRol.ADMINISTRADOR]: {
    label: 'Administrador',
    color: 'bg-purple-100 text-purple-800',
  },
  [TipoRol.UNIDADC]: {
    label: 'UNIDADC',
    color: 'bg-red-100 text-red-800',
  },
} as const;

/**
 * Función para formatear y colorear roles
 * PRESERVADO: Funcionalidad original exacta del Sidebar.tsx
 * @param rol - Tipo de rol a formatear
 * @returns Objeto con label y color para el rol
 */
export const formatearRol = (rol: TipoRol) => {
  return ROLE_CONFIG[rol] || { label: rol, color: 'bg-gray-100 text-gray-800' };
};

// ==== CONFIGURACIONES DEL FORMULARIO ====

/**
 * Valores por defecto para el formulario de entidad
 * @constant DEFAULT_FORM_DATA
 */
export const DEFAULT_FORM_DATA = {
  nombre: '',
  rfc: '',
  correo: '',
  telefono: '',
  contacto: '',
  licencia: '',
  logo: '',
  tiempo_sesion_minutos: 3,
  estatus: 'activo' as const,
};

/**
 * Límites de validación para campos del formulario
 * @constant FORM_VALIDATION_LIMITS
 */
export const FORM_VALIDATION_LIMITS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MIN_SESSION_TIME: 1,
  MAX_SESSION_TIME: 5,
  ACCEPTED_IMAGE_TYPES: ['image/png', 'image/jpg', 'image/jpeg', 'image/gif'],
};

// ==== CONFIGURACIONES DE ICONOS ====

/**
 * Iconos reutilizables para el sidebar
 * @constant SIDEBAR_ICONS
 */
export const SIDEBAR_ICONS = {
  Bars3Icon,
  XMarkIcon,
  CheckIcon,
} as const;

// ==== CONFIGURACIONES DE TIMEOUTS ====

/**
 * Configuraciones de timeouts para validaciones
 * CRÍTICO: No modificar sin revisar impacto en UX
 * @constant TIMEOUT_CONFIG
 */
export const TIMEOUT_CONFIG = {
  EMAIL_VALIDATION_DEBOUNCE: 500, // ms
  TOAST_DURATION: 3000, // ms
  MODAL_ANIMATION_DELAY: 200, // ms
} as const;
