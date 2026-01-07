/**
 * POST /api/usuarios/[id]/vincular-empleado
 * Vincula un usuario existente (con clave cve-XXXXXX) a un empleado
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Usar el middleware de permisos manualmente
  const { requirePermission } = await import('@/lib/api-auth');
  const authResult = await requirePermission(request, 'EMPLEADOS', 'CREAR_USUARIO');

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { id: userId } = await params;
    const body = await request.json();
    const { empleado_id } = body;

    if (!empleado_id) {
      return NextResponse.json({ error: 'Falta el ID del empleado' }, { status: 400 });
    }

    // Verificar que el usuario exista
    const usuario = await prisma.user.findUnique({
      where: { id: userId },
      include: { empleados: true },
    });

    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Verificar que el usuario NO esté vinculado a otro empleado
    if (usuario.empleados) {
      return NextResponse.json(
        { error: 'El usuario ya está vinculado a un empleado' },
        { status: 400 }
      );
    }

    // Verificar que el empleado exista
    const empleado = await prisma.empleados.findUnique({
      where: { id: empleado_id },
    });

    if (!empleado) {
      return NextResponse.json({ error: 'Empleado no encontrado' }, { status: 404 });
    }

    // Verificar que el empleado NO tenga usuario
    if (empleado.user_id) {
      return NextResponse.json(
        { error: 'El empleado ya tiene un usuario vinculado' },
        { status: 400 }
      );
    }

    // Vincular empleado al usuario en una transacción
    await prisma.$transaction(async (tx) => {
      await tx.empleados.update({
        where: { id: empleado_id },
        data: { user_id: userId },
      });

      // Actualizar datos del usuario con info del empleado
      await tx.user.update({
        where: { id: userId },
        data: {
          name: empleado.nombre,
          email: empleado.correo || usuario.email,
          telefono: empleado.celular || usuario.telefono,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Usuario vinculado al empleado exitosamente',
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error al vincular usuario con empleado' }, { status: 500 });
  }
}
