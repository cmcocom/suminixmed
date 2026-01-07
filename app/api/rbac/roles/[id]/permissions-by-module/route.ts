import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkUserPermission } from '@/lib/rbac-dynamic';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const hasPermission = await checkUserPermission(
      session.user.id,
      'USUARIOS',
      'ADMINISTRAR_PERMISOS'
    );
    if (!hasPermission) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const resolvedParams = await params;
    const roleId = resolvedParams.id;

    // Verificar que el rol existe
    const role = await prisma.rbac_roles.findUnique({ where: { id: roleId } });
    if (!role) {
      return NextResponse.json({ error: 'Rol no encontrado' }, { status: 404 });
    }

    // Obtener todos los permisos con indicador assigned
    const permissions = await prisma.rbac_permissions.findMany({
      where: { is_active: true },
      select: {
        id: true,
        name: true,
        description: true,
        module: true,
        action: true,
        rbac_role_permissions: {
          where: { role_id: roleId },
          select: { id: true },
        },
      },
      orderBy: [{ module: 'asc' }, { action: 'asc' }, { name: 'asc' }],
    });

    const permissionsWithAssigned = permissions.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      module: p.module,
      action: p.action,
      assigned: p.rbac_role_permissions.length > 0,
    }));

    // Agrupar por módulo y formar estructura ModuleInfo
    const modulesMap = new Map<
      string,
      {
        key: string;
        name: string;
        icon: string;
        description: string;
        permissions: typeof permissionsWithAssigned;
        permissionCount: number;
        assignedCount: number;
      }
    >();

    const moduleIcons: Record<string, string> = {
      // Módulos principales del menú
      DASHBOARD: '📊',
      ENTRADAS: '📥',
      SALIDAS: '📤',
      SURTIDO: '�',
      INVENTARIO: '📦',
      CLIENTES: '🧑‍💼',
      PROVEEDORES: '🏭',
      REPORTES: '�',
      AJUSTES: '⚙️',

      // Submódulos de Inventario
      PRODUCTOS: '🧾',
      STOCK_FIJO: '💼',
      CATEGORIAS: '🏷️',

      // Submódulos de Reportes
      REPORTES_INVENTARIO: '�',

      // Submódulos de Ajustes
      USUARIOS: '👥',
      RBAC: '�️',
      GESTION_INDICADORES: '�',
      PERMISOS_INDICADORES: '🔐',
      GESTION_CATALOGOS: '📑',
      GESTION_REPORTES: '📊',
      ENTIDADES: '🏢',

      // Módulos legacy (para compatibilidad)
      SOLICITUDES: '📝',
      AUDITORIA: '📜',
      CONFIGURACION: '🔧',
      UPLOAD: '📁',
      INDICADORES: '📊',
    };

    const moduleDescriptions: Record<string, string> = {
      // Módulos principales del menú
      DASHBOARD: 'Indicadores y métricas del sistema',
      ENTRADAS: 'Gestión de entradas de inventario',
      SALIDAS: 'Gestión de salidas de inventario',
      SURTIDO: 'Gestión de surtido y distribución',
      INVENTARIO: 'Gestión de inventario y productos',
      CLIENTES: 'Gestión de clientes',
      PROVEEDORES: 'Gestión de proveedores',
      REPORTES: 'Generación y gestión de reportes',
      AJUSTES: 'Configuración y administración del sistema',

      // Submódulos de Inventario
      PRODUCTOS: 'Catálogo de productos',
      STOCK_FIJO: 'Configuración de stock fijo por departamento',
      CATEGORIAS: 'Gestión de categorías de productos',

      // Submódulos de Reportes
      REPORTES_INVENTARIO: 'Reportes específicos de inventario',

      // Submódulos de Ajustes
      USUARIOS: 'Gestión de usuarios del sistema',
      RBAC: 'Control de acceso basado en roles',
      GESTION_INDICADORES: 'Configuración de indicadores del dashboard',
      PERMISOS_INDICADORES: 'Gestión de permisos específicos por indicador',
      GESTION_CATALOGOS: 'Importación y exportación de catálogos',
      GESTION_REPORTES: 'Configuración y personalización de reportes',
      ENTIDADES: 'Gestión de entidades y empresas',

      // Módulos legacy (para compatibilidad)
      SOLICITUDES: 'Vales y solicitudes',
      AUDITORIA: 'Logs de auditoría',
      CONFIGURACION: 'Configuración del sistema',
      UPLOAD: 'Gestión de archivos',
      INDICADORES: 'Indicadores del sistema',
    };

    const moduleNames: Record<string, string> = {
      // Módulos principales del menú
      DASHBOARD: 'Dashboard',
      ENTRADAS: 'Entradas',
      SALIDAS: 'Salidas',
      SURTIDO: 'Surtido',
      INVENTARIO: 'Inventario',
      CLIENTES: 'Clientes',
      PROVEEDORES: 'Proveedores',
      REPORTES: 'Reportes',
      AJUSTES: 'Ajustes',

      // Submódulos de Inventario
      PRODUCTOS: 'Productos',
      STOCK_FIJO: 'Stock fijo',
      CATEGORIAS: 'Categorías',

      // Submódulos de Reportes
      REPORTES_INVENTARIO: 'Inventario',

      // Submódulos de Ajustes
      USUARIOS: 'Usuarios',
      RBAC: 'Roles y Permisos',
      GESTION_CATALOGOS: 'Gestión de catálogos',
      GESTION_REPORTES: 'Gestión de Reportes',
      ENTIDADES: 'Entidades',

      // Módulos legacy (para compatibilidad)
      SOLICITUDES: 'Solicitudes',
      AUDITORIA: 'Auditoría',
      CONFIGURACION: 'Configuración',
      UPLOAD: 'Gestión de archivos',
      INDICADORES: 'Indicadores',
    };

    for (const perm of permissionsWithAssigned) {
      const mod = perm.module;
      if (!modulesMap.has(mod)) {
        modulesMap.set(mod, {
          key: mod,
          name: moduleNames[mod] || mod,
          icon: moduleIcons[mod] || '📁',
          description: moduleDescriptions[mod] || 'Módulo del sistema',
          permissions: [],
          permissionCount: 0,
          assignedCount: 0,
        });
      }
      const m = modulesMap.get(mod)!;
      m.permissions.push(perm);
      m.permissionCount++;
      if (perm.assigned) m.assignedCount++;
    }

    const modules = Array.from(modulesMap.values());

    return NextResponse.json({
      success: true,
      data: { role_id: roleId, modules },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
