/**
 * API Routes para Empleado Individual
 * PATCH, DELETE y operaciones especiales (crear usuario)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * PATCH /api/empleados/[id]
 * Actualiza un empleado
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Usar el middleware de permisos manualmente
  const { requirePermission } = await import('@/lib/api-auth');
  const authResult = await requirePermission(request, 'EMPLEADOS', 'ACTUALIZAR');

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const body = await request.json();
    const { id } = await params;

    const empleado = await prisma.empleados.findUnique({
      where: { id },
    });

    if (!empleado) {
      return NextResponse.json({ error: 'Empleado no encontrado' }, { status: 404 });
    }

    // Validar cambios de correo único
    if (body.correo && body.correo !== empleado.correo) {
      const existeCorreo = await prisma.empleados.findFirst({
        where: {
          correo: body.correo,
          id: { not: id },
        },
      });

      if (existeCorreo) {
        return NextResponse.json(
          { error: 'Ya existe un empleado con ese correo' },
          { status: 400 }
        );
      }
    }

    // Actualizar empleado
    const empleadoActualizado = await prisma.$transaction(async (tx) => {
      // Actualizar empleado
      const updated = await tx.empleados.update({
        where: { id },
        data: {
          nombre: body.nombre,
          cargo: body.cargo,
          servicio: body.servicio,
          turno: body.turno,
          correo: body.correo,
          celular: body.celular,
          activo: body.activo,
        },
        include: {
          User: {
            select: {
              id: true,
              clave: true,
              email: true,
              name: true,
              activo: true,
            },
          },
        },
      });

      // Si hay usuario vinculado, sincronizar datos
      if (updated.user_id) {
        const updateData: { name: string; telefono: string | null; email?: string } = {
          name: body.nombre,
          telefono: body.celular || null,
        };

        // Solo actualizar email si cambió y no está vacío
        if (body.correo && body.correo !== empleado.correo) {
          // Verificar que no exista en otro usuario
          const emailEnUso = await tx.user.findFirst({
            where: {
              email: body.correo,
              id: { not: updated.user_id },
            },
          });

          if (emailEnUso) {
            throw new Error('El email ya está en uso por otro usuario');
          }

          updateData.email = body.correo;
        }

        await tx.user.update({
          where: { id: updated.user_id },
          data: updateData,
        });
      }

      return updated;
    });

    return NextResponse.json({
      success: true,
      empleado: empleadoActualizado,
    });
  } catch (error) {
    // Manejar errores específicos de transacción
    if (error instanceof Error && error.message === 'El email ya está en uso por otro usuario') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Error al actualizar empleado' }, { status: 500 });
  }
}

/**
 * DELETE /api/empleados/[id]
 * Elimina un empleado (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Usar el middleware de permisos manualmente
  const { requirePermission } = await import('@/lib/api-auth');
  const authResult = await requirePermission(request, 'EMPLEADOS', 'ELIMINAR');

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { id } = await params;

    const empleado = await prisma.empleados.findUnique({
      where: { id },
    });

    if (!empleado) {
      return NextResponse.json({ error: 'Empleado no encontrado' }, { status: 404 });
    }

    // Soft delete - marcar como inactivo y desvincular usuario
    await prisma.$transaction(async (tx) => {
      await tx.empleados.update({
        where: { id },
        data: {
          activo: false,
          user_id: null, // Desvincular usuario
        },
      });

      // Si tiene usuario vinculado, marcarlo como inactivo (opcional)
      if (empleado.user_id) {
        await tx.user.update({
          where: { id: empleado.user_id },
          data: { activo: false },
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Empleado desactivado correctamente',
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar empleado' }, { status: 500 });
  }
}
