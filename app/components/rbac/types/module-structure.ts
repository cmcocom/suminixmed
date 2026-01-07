// Definición de la nueva estructura jerárquica de módulos

export interface ModuleAction {
  key: string;
  name: string;
  description: string;
}

export interface ModuleStructure {
  key: string;
  name: string;
  icon: string;
  description: string;
  actions: ModuleAction[];
  children?: ModuleStructure[];
}

// Estructura de módulos basada en el menú lateral
export const MODULE_STRUCTURE: ModuleStructure[] = [
  {
    key: 'DASHBOARD',
    name: 'Dashboard',
    icon: '📊',
    description: 'Indicadores y métricas del sistema',
    actions: [
      { key: 'LEER', name: 'Leer', description: 'Ver indicadores y métricas' },
      { key: 'CONSULTAR', name: 'Consultar', description: 'Consultar datos del dashboard' },
      {
        key: 'CONFIGURAR',
        name: 'Configurar',
        description: 'Configurar indicadores personalizados',
      },
    ],
  },
  {
    key: 'SOLICITUDES',
    name: 'Solicitudes',
    icon: '�',
    description: 'Gestión de solicitudes de productos',
    actions: [
      { key: 'LEER', name: 'Leer', description: 'Ver solicitudes' },
      { key: 'CREAR', name: 'Crear', description: 'Crear nuevas solicitudes' },
      { key: 'EDITAR', name: 'Editar', description: 'Modificar solicitudes' },
      { key: 'ELIMINAR', name: 'Eliminar', description: 'Eliminar solicitudes' },
      { key: 'APROBAR', name: 'Aprobar', description: 'Aprobar solicitudes' },
    ],
  },
  {
    key: 'SURTIDO',
    name: 'Surtido',
    icon: '🔧',
    description: 'Gestión de surtido y distribución',
    actions: [
      { key: 'LEER', name: 'Leer', description: 'Ver órdenes de surtido' },
      { key: 'CREAR', name: 'Crear', description: 'Crear órdenes de surtido' },
      { key: 'EDITAR', name: 'Editar', description: 'Modificar órdenes de surtido' },
      { key: 'ELIMINAR', name: 'Eliminar', description: 'Eliminar órdenes de surtido' },
      { key: 'PROCESAR', name: 'Procesar', description: 'Procesar y completar surtidos' },
    ],
  },
  {
    key: 'ENTRADAS',
    name: 'Entradas',
    icon: '📥',
    description: 'Gestión de entradas de inventario',
    actions: [
      { key: 'LEER', name: 'Leer', description: 'Ver entradas registradas' },
      { key: 'CREAR', name: 'Crear', description: 'Registrar nuevas entradas' },
      { key: 'EDITAR', name: 'Editar', description: 'Modificar entradas existentes' },
      { key: 'ELIMINAR', name: 'Eliminar', description: 'Eliminar entradas' },
    ],
  },
  {
    key: 'SALIDAS',
    name: 'Salidas',
    icon: '📤',
    description: 'Gestión de salidas de inventario',
    actions: [
      { key: 'LEER', name: 'Leer', description: 'Ver salidas registradas' },
      { key: 'CREAR', name: 'Crear', description: 'Registrar nuevas salidas' },
      { key: 'EDITAR', name: 'Editar', description: 'Modificar salidas existentes' },
      { key: 'ELIMINAR', name: 'Eliminar', description: 'Eliminar salidas' },
    ],
  },
  {
    key: 'REPORTES',
    name: 'Reportes',
    icon: '�',
    description: 'Generación y gestión de reportes',
    actions: [
      { key: 'LEER', name: 'Leer', description: 'Ver reportes disponibles' },
      { key: 'CONSULTAR', name: 'Consultar', description: 'Consultar reportes' },
    ],
    children: [
      {
        key: 'INVENTARIO',
        name: 'Inventario',
        icon: '�',
        description: 'Reporte de estado actual del inventario',
        actions: [
          { key: 'LEER', name: 'Leer', description: 'Ver reporte de inventario' },
          { key: 'EXPORTAR', name: 'Exportar', description: 'Exportar reporte a Excel/PDF/CSV' },
          { key: 'CONSULTAR', name: 'Consultar', description: 'Consultar estado de productos' },
        ],
      },
    ],
  },
  {
    key: 'STOCK_FIJO',
    name: 'Stock Fijo',
    icon: '✅',
    description: 'Configuración de stock fijo por departamento',
    actions: [
      { key: 'LEER', name: 'Leer', description: 'Ver configuraciones de stock fijo' },
      { key: 'CREAR', name: 'Crear', description: 'Configurar nuevo stock fijo' },
      { key: 'EDITAR', name: 'Editar', description: 'Modificar configuraciones de stock fijo' },
      { key: 'ELIMINAR', name: 'Eliminar', description: 'Eliminar configuraciones de stock fijo' },
    ],
  },
  {
    key: 'INVENTARIOS_FISICOS',
    name: 'Inventarios Físicos',
    icon: '📋',
    description: 'Gestión de inventarios físicos',
    actions: [
      { key: 'LEER', name: 'Leer', description: 'Ver inventarios físicos' },
      { key: 'CREAR', name: 'Crear', description: 'Crear inventarios físicos' },
      { key: 'EDITAR', name: 'Editar', description: 'Modificar inventarios físicos' },
      { key: 'ELIMINAR', name: 'Eliminar', description: 'Eliminar inventarios físicos' },
    ],
  },
  {
    key: 'INVENTARIO',
    name: 'Catálogos',
    icon: '📦',
    description: 'Catálogos del sistema',
    actions: [
      { key: 'LEER', name: 'Leer', description: 'Ver catálogos del sistema' },
      { key: 'CONSULTAR', name: 'Consultar', description: 'Consultar información de catálogos' },
    ],
    children: [
      {
        key: 'PRODUCTOS',
        name: 'Productos',
        icon: '🏷️',
        description: 'Catálogo de productos',
        actions: [
          { key: 'LEER', name: 'Leer', description: 'Ver catálogo de productos' },
          { key: 'CREAR', name: 'Crear', description: 'Agregar nuevos productos' },
          { key: 'EDITAR', name: 'Editar', description: 'Modificar información de productos' },
          { key: 'ELIMINAR', name: 'Eliminar', description: 'Eliminar productos' },
        ],
      },
      {
        key: 'CATEGORIAS',
        name: 'Categorías',
        icon: '🏪',
        description: 'Gestión de categorías de productos',
        actions: [
          { key: 'LEER', name: 'Leer', description: 'Ver categorías existentes' },
          { key: 'CREAR', name: 'Crear', description: 'Crear nuevas categorías' },
          { key: 'EDITAR', name: 'Editar', description: 'Modificar categorías' },
          { key: 'ELIMINAR', name: 'Eliminar', description: 'Eliminar categorías' },
        ],
      },
      {
        key: 'CLIENTES',
        name: 'Clientes',
        icon: '👥',
        description: 'Gestión de clientes',
        actions: [
          { key: 'LEER', name: 'Leer', description: 'Ver información de clientes' },
          { key: 'CREAR', name: 'Crear', description: 'Registrar nuevos clientes' },
          { key: 'EDITAR', name: 'Editar', description: 'Modificar información de clientes' },
          { key: 'ELIMINAR', name: 'Eliminar', description: 'Eliminar clientes' },
        ],
      },
      {
        key: 'PROVEEDORES',
        name: 'Proveedores',
        icon: '🏢',
        description: 'Gestión de proveedores',
        actions: [
          { key: 'LEER', name: 'Leer', description: 'Ver información de proveedores' },
          { key: 'CREAR', name: 'Crear', description: 'Registrar nuevos proveedores' },
          { key: 'EDITAR', name: 'Editar', description: 'Modificar información de proveedores' },
          { key: 'ELIMINAR', name: 'Eliminar', description: 'Eliminar proveedores' },
        ],
      },
      {
        key: 'EMPLEADOS',
        name: 'Empleados',
        icon: '👷',
        description: 'Gestión de empleados',
        actions: [
          { key: 'LEER', name: 'Leer', description: 'Ver información de empleados' },
          { key: 'CREAR', name: 'Crear', description: 'Registrar nuevos empleados' },
          {
            key: 'ACTUALIZAR',
            name: 'Actualizar',
            description: 'Modificar información de empleados',
          },
          { key: 'ELIMINAR', name: 'Eliminar', description: 'Eliminar empleados' },
          {
            key: 'CREAR_USUARIO',
            name: 'Crear Usuario',
            description: 'Crear usuario vinculado a empleado',
          },
        ],
      },
      {
        key: 'TIPOS_ENTRADAS',
        name: 'Tipos de Entrada',
        icon: '�',
        description: 'Catálogo de tipos de entrada',
        actions: [
          { key: 'LEER', name: 'Leer', description: 'Ver tipos de entrada' },
          { key: 'CREAR', name: 'Crear', description: 'Crear tipos de entrada' },
          { key: 'EDITAR', name: 'Editar', description: 'Modificar tipos de entrada' },
          { key: 'ELIMINAR', name: 'Eliminar', description: 'Eliminar tipos de entrada' },
        ],
      },
      {
        key: 'TIPOS_SALIDAS',
        name: 'Tipos de Salida',
        icon: '📤',
        description: 'Catálogo de tipos de salida',
        actions: [
          { key: 'LEER', name: 'Leer', description: 'Ver tipos de salida' },
          { key: 'CREAR', name: 'Crear', description: 'Crear tipos de salida' },
          { key: 'EDITAR', name: 'Editar', description: 'Modificar tipos de salida' },
          { key: 'ELIMINAR', name: 'Eliminar', description: 'Eliminar tipos de salida' },
        ],
      },
      {
        key: 'ALMACENES',
        name: 'Almacenes',
        icon: '🏭',
        description: 'Gestión de almacenes',
        actions: [
          { key: 'LEER', name: 'Leer', description: 'Ver almacenes' },
          { key: 'CREAR', name: 'Crear', description: 'Crear nuevos almacenes' },
          { key: 'EDITAR', name: 'Editar', description: 'Modificar almacenes' },
          { key: 'ELIMINAR', name: 'Eliminar', description: 'Eliminar almacenes' },
        ],
      },
    ],
  },
  {
    key: 'AJUSTES',
    name: 'Ajustes',
    icon: '⚙️',
    description: 'Configuración y administración del sistema',
    actions: [
      { key: 'LEER', name: 'Leer', description: 'Ver configuraciones del sistema' },
      { key: 'CONSULTAR', name: 'Consultar', description: 'Consultar configuraciones' },
    ],
    children: [
      {
        key: 'USUARIOS',
        name: 'Usuarios',
        icon: '�',
        description: 'Gestión de usuarios del sistema',
        actions: [
          { key: 'LEER', name: 'Leer', description: 'Ver información de usuarios' },
          { key: 'CREAR', name: 'Crear', description: 'Registrar nuevos usuarios' },
          { key: 'EDITAR', name: 'Editar', description: 'Modificar información de usuarios' },
          { key: 'ELIMINAR', name: 'Eliminar', description: 'Eliminar usuarios' },
          {
            key: 'GESTIONAR_ROLES',
            name: 'Gestionar roles',
            description: 'Asignar y modificar roles de usuarios',
          },
        ],
      },
      {
        key: 'RBAC',
        name: 'Roles y Permisos',
        icon: '🛡️',
        description: 'Control de acceso basado en roles',
        actions: [
          { key: 'LEER', name: 'Leer', description: 'Ver configuración de roles y permisos' },
          { key: 'ROLES_LEER', name: 'Roles - Leer', description: 'Ver roles del sistema' },
          {
            key: 'ADMINISTRAR_ROLES',
            name: 'Administrar roles',
            description: 'Crear, editar y eliminar roles',
          },
          {
            key: 'ADMINISTRAR_PERMISOS',
            name: 'Administrar permisos',
            description: 'Asignar y revocar permisos',
          },
        ],
      },
      {
        key: 'AUDITORIA',
        name: 'Auditoría del Sistema',
        icon: '📋',
        description: 'Registro de actividades del sistema',
        actions: [
          { key: 'LEER', name: 'Leer', description: 'Ver registros de auditoría' },
          { key: 'CONSULTAR', name: 'Consultar', description: 'Consultar auditoría' },
          { key: 'EXPORTAR', name: 'Exportar', description: 'Exportar registros de auditoría' },
        ],
      },
      {
        key: 'GESTION_CATALOGOS',
        name: 'Gestión de Catálogos',
        icon: '�',
        description: 'Importación y exportación de catálogos',
        actions: [
          { key: 'LEER', name: 'Leer', description: 'Ver gestión de catálogos' },
          {
            key: 'IMPORTAR',
            name: 'Importar',
            description: 'Importar datos de catálogos desde archivos externos',
          },
          {
            key: 'EXPORTAR',
            name: 'Exportar',
            description: 'Exportar catálogos a archivos externos',
          },
        ],
      },
      {
        key: 'GESTION_REPORTES',
        name: 'Gestión de Reportes',
        icon: '📊',
        description: 'Configuración y personalización de reportes',
        actions: [
          { key: 'LEER', name: 'Leer', description: 'Ver plantillas de reportes' },
          { key: 'CREAR', name: 'Crear', description: 'Crear nuevas plantillas de reportes' },
          { key: 'EDITAR', name: 'Editar', description: 'Modificar plantillas de reportes' },
          { key: 'ELIMINAR', name: 'Eliminar', description: 'Eliminar plantillas de reportes' },
        ],
      },
      {
        key: 'AJUSTES_ENTIDAD', // ✅ Actualizado de ENTIDADES
        name: 'Entidades',
        icon: '🏢',
        description: 'Gestión de entidades y empresas',
        actions: [
          { key: 'LEER', name: 'Leer', description: 'Ver información de entidades' },
          { key: 'CREAR', name: 'Crear', description: 'Registrar nuevas entidades' },
          { key: 'EDITAR', name: 'Editar', description: 'Modificar información de entidades' },
          { key: 'ELIMINAR', name: 'Eliminar', description: 'Eliminar entidades' },
        ],
      },
      {
        key: 'GESTION_RESPALDOS', // ✅ Actualizado de RESPALDOS
        name: 'Respaldos de Base de Datos',
        icon: '💾',
        description: 'Sistema de respaldos automáticos',
        actions: [
          { key: 'LEER', name: 'Leer', description: 'Ver respaldos disponibles' },
          { key: 'CREAR', name: 'Crear', description: 'Crear respaldos manuales' },
          { key: 'DESCARGAR', name: 'Descargar', description: 'Descargar archivos de respaldo' },
          {
            key: 'RESTAURAR',
            name: 'Restaurar',
            description: 'Restaurar base de datos desde respaldo',
          },
          { key: 'ELIMINAR', name: 'Eliminar', description: 'Eliminar respaldos antiguos' },
        ],
      },
    ],
  },
];

// Función helper para aplanar la estructura y generar permisos
export function flattenModuleStructure(
  modules: ModuleStructure[],
  parentPath = ''
): Array<{
  module: string;
  action: string;
  name: string;
  description: string;
  fullPath: string;
}> {
  const result: Array<{
    module: string;
    action: string;
    name: string;
    description: string;
    fullPath: string;
  }> = [];

  for (const moduleItem of modules) {
    const currentPath = parentPath ? `${parentPath}.${moduleItem.key}` : moduleItem.key;

    // Agregar acciones del módulo actual
    for (const action of moduleItem.actions) {
      result.push({
        module: moduleItem.key,
        action: action.key,
        name: `${moduleItem.name} - ${action.name}`,
        description: action.description,
        fullPath: currentPath,
      });
    }

    // Procesar submódulos recursivamente
    if (moduleItem.children) {
      result.push(...flattenModuleStructure(moduleItem.children, currentPath));
    }
  }

  return result;
}

// Función para obtener la estructura jerárquica con información de permisos
export function getModuleTreeWithPermissions(
  permissions: Array<{
    id: string;
    name: string;
    description: string | null;
    module: string;
    action: string;
    assigned: boolean;
  }>
): ModuleStructure[] {
  function processModule(moduleItem: ModuleStructure): ModuleStructure {
    const modulePermissions = permissions.filter((p) => p.module === moduleItem.key);

    const processedActions = moduleItem.actions.map((action) => {
      const permission = modulePermissions.find((p) => p.action === action.key);
      return {
        ...action,
        permissionId: permission?.id,
        assigned: permission?.assigned || false,
      };
    });

    const processedChildren = moduleItem.children
      ? moduleItem.children.map((child) => processModule(child))
      : undefined;

    return {
      ...moduleItem,
      actions: processedActions,
      children: processedChildren,
    };
  }

  return MODULE_STRUCTURE.map((moduleItem) => processModule(moduleItem));
}
