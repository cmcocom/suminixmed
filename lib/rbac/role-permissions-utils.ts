import type { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

/**
 * Función utilitaria para asignar TODOS los permisos activos a un rol específico
 * Esta función se usa tanto para roles nuevos como para asegurar que roles existentes tengan 100% permisos
 */
export async function asignarTodosLosPermisosARol(
  prisma: PrismaClient,
  roleId: string,
  grantedBy: string = 'sistema'
): Promise<{ success: boolean; message: string; permisosAsignados: number }> {
  try {
    // 1. Obtener todos los permisos activos del sistema
    const todosLosPermisos = await prisma.rbac_permissions.findMany({
      where: { is_active: true },
      select: { id: true },
    });

    if (todosLosPermisos.length === 0) {
      return {
        success: false,
        message: 'No hay permisos activos en el sistema',
        permisosAsignados: 0,
      };
    }

    // 2. Verificar qué permisos ya están asignados
    const permisosExistentes = await prisma.rbac_role_permissions.findMany({
      where: {
        role_id: roleId,
        granted: true,
      },
      select: { permission_id: true },
    });

    const permisosExistentesIds = new Set(permisosExistentes.map((p) => p.permission_id));

    // 3. Encontrar permisos que necesitan ser asignados
    const permisosFaltantes = todosLosPermisos.filter(
      (permiso) => !permisosExistentesIds.has(permiso.id)
    );

    if (permisosFaltantes.length === 0) {
      return {
        success: true,
        message: 'El rol ya tiene todos los permisos asignados',
        permisosAsignados: todosLosPermisos.length,
      };
    }

    // 4. Crear las asignaciones de permisos faltantes
    const permisosParaCrear = permisosFaltantes.map((permiso) => ({
      id: randomUUID(),
      role_id: roleId,
      permission_id: permiso.id,
      granted: true,
      granted_by: grantedBy,
      granted_at: new Date(),
    }));

    // 5. Insertar en lotes para mejor rendimiento
    const BATCH_SIZE = 50;
    let totalInsertados = 0;

    for (let i = 0; i < permisosParaCrear.length; i += BATCH_SIZE) {
      const batch = permisosParaCrear.slice(i, i + BATCH_SIZE);
      await prisma.rbac_role_permissions.createMany({
        data: batch,
        skipDuplicates: true,
      });
      totalInsertados += batch.length;
    }

    // 6. Verificar el resultado final
    const permisosFinales = await prisma.rbac_role_permissions.count({
      where: {
        role_id: roleId,
        granted: true,
      },
    });

    return {
      success: true,
      message: `Se asignaron ${totalInsertados} permisos nuevos. Total: ${permisosFinales}/${todosLosPermisos.length}`,
      permisosAsignados: permisosFinales,
    };
  } catch (error) {
    void error;
    console.error('Error asignando permisos al rol:', error);
    return {
      success: false,
      message: `Error al asignar permisos: ${error instanceof Error ? error.message : String(error)}`,
      permisosAsignados: 0,
    };
  }
}

/**
 * Función para obtener estadísticas de permisos de un rol
 */
export async function obtenerEstadisticasPermisosRol(
  prisma: PrismaClient,
  roleId: string
): Promise<{ total: number; asignados: number; porcentaje: number }> {
  try {
    const [totalPermisos, permisosAsignados] = await Promise.all([
      prisma.rbac_permissions.count({ where: { is_active: true } }),
      prisma.rbac_role_permissions.count({
        where: {
          role_id: roleId,
          granted: true,
        },
      }),
    ]);

    return {
      total: totalPermisos,
      asignados: permisosAsignados,
      porcentaje: totalPermisos > 0 ? Math.round((permisosAsignados / totalPermisos) * 100) : 0,
    };
  } catch (error) {
    void error;
    console.error('Error obteniendo estadísticas de permisos:', error);
    return { total: 0, asignados: 0, porcentaje: 0 };
  }
}
