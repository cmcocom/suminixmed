/**
 * POST /api/empleados/[id]/crear-usuario
 * Crea un usuario para un empleado existente que no tiene usuario
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Usar el middleware de permisos manualmente
  const { requirePermission } = await import('@/lib/api-auth');
  const authResult = await requirePermission(request, 'EMPLEADOS', 'CREAR_USUARIO');

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { id } = await params;

    // Verificar que el empleado exista
    const empleado = await prisma.empleados.findUnique({
      where: { id },
      include: { User: true },
    });

    if (!empleado) {
      return NextResponse.json({ error: 'Empleado no encontrado' }, { status: 404 });
    }

    // Verificar que no tenga usuario ya
    if (empleado.user_id) {
      return NextResponse.json(
        { error: 'El empleado ya tiene un usuario vinculado' },
        { status: 400 }
      );
    }

    // Verificar que el numero_empleado no esté usado como clave
    const existeClave = await prisma.user.findUnique({
      where: { clave: empleado.numero_empleado },
    });

    if (existeClave) {
      return NextResponse.json(
        { error: 'El número de empleado ya está siendo usado como clave de usuario' },
        { status: 400 }
      );
    }

    // Crear hash de contraseña
    const hashedPassword = await bcrypt.hash('Issste2025!', 10);

    // Crear usuario y vincular en una transacción y vincular en una transacción
    const result = await prisma.$transaction(async (tx) => {
      const nuevoUsuario = await tx.user.create({
        data: {
          id: crypto.randomUUID(),
          clave: empleado.numero_empleado,
          name: empleado.nombre,
          email: empleado.correo || null,
          telefono: empleado.celular || null,
          password: hashedPassword,
          activo: true,
        },
      });

      // Vincular usuario al empleado
      await tx.empleados.update({
        where: { id },
        data: { user_id: nuevoUsuario.id },
      });

      return nuevoUsuario;
    });

    return NextResponse.json({
      success: true,
      usuario: {
        id: result.id,
        clave: result.clave,
        email: result.email,
        name: result.name,
      },
      message: 'Usuario creado exitosamente. Contraseña inicial: Issste2025!',
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear usuario para empleado' }, { status: 500 });
  }
}
